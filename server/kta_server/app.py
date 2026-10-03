"""The FastAPI app: the owner's own upload button, the AG-UI agent, and the state.

Routes (ADR 0004 §"How the chat reaches Python"):

| Route              | Purpose                                                        |
|--------------------|----------------------------------------------------------------|
| `POST /upload`     | the owner's own CSV upload button (multipart)                  |
| `POST /agent`      | the AG-UI endpoint (`ag_ui_langgraph.add_langgraph_fastapi_endpoint`) |
| `GET /api/state`   | Car profile, Car history, Map versions, Open steps, questions  |
| `GET /healthz`     | liveness                                                        |
| `GET /api/history` | the History file export (a later ticket's UI, same data)       |
| `POST /api/history`| import a History file                                           |

`POST /upload` stores the raw CSV and hands back an upload id; the chat then
runs one AG-UI turn with that id in `state`, and the Drive is created by the
graph — server-side, never in the browser (spec §Chat UI).

A fresh car is on **Map version 1**, the KTuner basemap with its full tables,
before any Drive is uploaded: `ensure_map_version_one` seeds it when the app is
built and again on the first `GET /api/state`.
"""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import Any

from ag_ui_langgraph import LangGraphAgent, add_langgraph_fastapi_endpoint
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

from .config import Settings, load_settings
from .db import Store
from .graph import build_graph
from .mapdata import KTUNER_BASEMAP_SOURCE, basemap_tables
from . import copy as C
from . import profile as P
from . import questions as Q
from . import window as W
from .worker import Worker, WorkerError

AGENT_NAME = "kta-tune-assist"


def ensure_map_version_one(store: Store, name: str) -> dict[str, Any]:
    """Map version 1: the KTuner basemap, with its tables, before any Drive.

    A fresh car is on Map version 1 from its first Drive (CONTEXT.md), so this
    runs when the app is built — before the first upload, and again on every
    start — and is idempotent, so a car that already has it never grows a second
    copy. The tables come from the app's own KTuner map data
    (`mapdata.py`), which is the same file the engine reads (ADR 0003: two
    independent reads, one source).

    Returns the version without its tables: `GET /api/state` is the chat's state
    panel, and a Map version's 166 kB of tables are fetched with
    `store.map_version(n)` by whatever checks a change against it.
    """
    version = ensure_map_version_one_full(store, name)
    version.pop("tables", None)
    return version


def ensure_map_version_one_full(store: Store, name: str) -> dict[str, Any]:
    """The same seeding, with the tables — the accessor a map check reads."""
    return store.ensure_map_version(
        1,
        name,
        basemap_tables(),
        source=KTUNER_BASEMAP_SOURCE,
        kind="ktuner-basemap",
    )


async def _unanswered_questions(store: Store, worker: Worker, settings: Settings) -> list[dict[str, Any]]:
    """Every unanswered owner question, oldest Drive first — "Waiting for you".

    Asked once per Drive through the engine (never the model) and stored when
    asked; answering stores the answer and the Car history re-derives. Quiet:
    at most the three first questions, one per Drive that earned them.
    """
    asked = store.list_asked_questions()
    saved_ids = set(store.list_question_answers().keys())
    return [
        {"id": q["id"], "title": q["title"], "askedOn": q.get("askedOn"),
         "askedOnStamp": C.drive_stamp(q.get("askedOn")) if q.get("askedOn") else None}
        for q in asked
        if q["id"] not in saved_ids
    ]


def _latest_drive(state: dict[str, Any]) -> str | None:
    """The newest Drive in the Car history, by its start — the window's end."""
    latest: str | None = None
    latest_start: float | None = None
    for drive_id, summary in ((state or {}).get("drives") or {}).items():
        start = (summary or {}).get("start")
        if latest is None or (isinstance(start, (int, float)) and (latest_start is None or start > latest_start)):
            latest, latest_start = drive_id, start if isinstance(start, (int, float)) else latest_start
    return latest


def create_app(
    settings: Settings | None = None,
    store: Store | None = None,
    worker: Worker | None = None,
    llm_caller=None,
) -> FastAPI:
    settings = settings or load_settings()
    store = store or Store(settings.db_path)
    worker = worker or Worker(settings.worker_script, settings.node_exe)
    # A fresh car is on Map version 1 before anything is uploaded to it.
    ensure_map_version_one(store, worker.ktuner_basemap)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings, app.state.store, app.state.worker = settings, store, worker
        try:
            await worker.start()
        except WorkerError as exc:
            # The loop still answers: /healthz says why, and the reply says so too.
            print(f"[kta] the engine worker is not up: {exc.message}")
        yield
        await worker.aclose()

    app = FastAPI(title="Civic FE Tune Assist", version="0.1.0", lifespan=lifespan)

    # The chat runs on its own port (Next.js) and calls /upload and /agent from
    # the browser, so the loop's two halves need CORS. Local-first: no auth, no
    # cookies, only this owner's own machine.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # ---------------------------------------------------------------- upload
    @app.post("/upload")
    async def upload(
        request: Request,
        file: UploadFile = File(...),
        threadId: str | None = Form(default=None),
        now: int | None = Form(default=None),
    ) -> dict[str, Any]:
        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="The file was empty.")
        upload_id = uuid.uuid4().hex
        store.add_upload(
            upload_id,
            file.filename or "TunerView.csv",
            raw,
            thread_id=threadId,
            received_at=now or settings.now_ms(),
        )
        return {"uploadId": upload_id, "fileName": file.filename, "bytes": len(raw), "threadId": threadId}

    # ----------------------------------------------------------------- state
    @app.get("/api/state")
    async def api_state() -> dict[str, Any]:
        # First use counts too: if the worker was down when the app was built,
        # Map version 1 is seeded now, and still before any Drive is read.
        active = ensure_map_version_one(store, worker.ktuner_basemap)
        car_state = store.car_state(None) or {}
        installs = store.list_installs()
        history = await worker.call("carHistory", state=car_state, installs=installs)
        # The Flash plan reads the window, like every reply: a change from
        # before the last Flash or Install never proposes a cell for the car
        # as it is now.
        rows = history["rows"]
        latest = rows[-1]["id"] if rows else None
        win = W.drive_window(rows, car_state.get("flashes"), installs, latest)
        plan = await worker.call(
            "flashPlan", state=W.windowed_state(car_state, win["ids"]), now=settings.now_ms()
        )
        return {
            "carProfile": store.car_profile(),
            "profileSpec": P.profile_spec(worker.ktuner_basemap),
            "hasDrives": bool(rows),
            "driveWindow": C.window_card(win),
            "ktunerBasemap": worker.ktuner_basemap,
            "carHistory": history["rows"],
            "baseline": history["baseline"],
            "flashes": store.list_flashes(),
            "installs": installs,
            "mapVersions": store.list_map_versions(),
            "activeMapVersion": active,
            "openSteps": C.step_words(store.list_open_steps(only_open=True)),
            "answers": store.list_answers(),
            "questionAnswers": store.list_question_answers(),
            "unansweredQuestions": await _unanswered_questions(store, worker, settings),
            "drives": store.list_drives(),
            "flashPlan": plan,
            "hasLlm": settings.has_llm,
        }

    # ------------------------------------------------------- owner questions
    @app.post("/api/answer")
    async def api_answer(request: Request) -> dict[str, Any]:
        """Answer one owner question, then resume with the Next step updated.

        The answer is saved, applied through engine operations at its point in
        time (a Flash before the Drive it explains, an Unexplained-change mark
        after it), the Car history is rebuilt from events, and the Drive's Next
        step is re-decided with the answer applied. Answering again overwrites
        and re-derives again.
        """
        try:
            body = await request.json()
        except Exception as exc:  # noqa: BLE001 - any bad body is the same message
            raise HTTPException(status_code=400, detail="That is not an answer.") from exc
        kind = str(body.get("kind") or "")
        drive_id = str(body.get("driveId") or body.get("drive_id") or "")
        choice = str(body.get("choice") or "")
        if kind not in Q.VALID_KINDS or not drive_id or not choice:
            raise HTTPException(status_code=400, detail="An answer needs a question, a Drive and a choice.")
        drive = store.drive(drive_id)
        if drive is None:
            # The Car history may hold drives the drives table has not indexed
            # yet; fall back to the engine state's own summary.
            car_state = store.car_state(None) or {}
            summary = (car_state.get("drives") or {}).get(drive_id)
            start = (summary or {}).get("start") if isinstance(summary, dict) else None
        else:
            start = drive.get("started_at") or (drive.get("summary") or {}).get("start")

        # The question must be one the engine asked on this Drive, with this
        # exact choice. Asked rows are stored at upload time (with the
        # pre-settle Open steps the did-flash question needs), so validation
        # holds even after the loop moved on and the Undo is proven.
        if choice not in Q.VALID_CHOICES.get(kind, ()):
            raise HTTPException(status_code=400, detail="That is not a choice for this question.")
        asked_rows = {q["id"]: q for q in store.list_asked_questions()}
        question_id = Q.question_id(kind, drive_id)
        if question_id not in asked_rows:
            raise HTTPException(status_code=400, detail="That question is not asked on this Drive.")

        store.save_question_answer(question_id, drive_id, kind, choice)

        # A "flashed …" answer records the Flash before the Drive it explains;
        # any other answer withdraws the Flash a previous answer recorded, so a
        # changed answer re-derives from what the owner says now, not before.
        flash = Q.flash_for_question(kind, choice, start, drive_id)
        store.delete_flash(f"q-{kind}-{drive_id}")
        if flash is not None:
            store.add_flash(
                {"id": flash["id"], "time": flash["time"], "map": flash["map"],
                 "changed": flash["changed"], "note": flash.get("note", "")}
            )

        # Rebuild the Car history from events, not by patching.
        state = await Q.rebuild_history(store, worker, settings.now_ms())

        # Re-decide this Drive's Next step with the answer applied — against
        # the window, like every reply, while settling still reads the whole
        # Car history.
        win = W.window_for_state(state, store.list_installs(), drive_id)
        window_state = W.windowed_state(state, win["ids"])
        try:
            settled = await worker.call(
                "settleOpenSteps", state=state, driveId=drive_id,
                openSteps=store.list_open_steps(),
            )
            decided = await worker.call(
                "nextStep", state=window_state, driveId=drive_id, openSteps=settled["openSteps"],
                installs=store.list_installs(),
            )
            store.save_open_steps(decided["openSteps"])
            plan = await worker.call("flashPlan", state=window_state, now=settings.now_ms())
            asked_now = await worker.call(
                "questions", state=window_state, driveId=drive_id,
                openSteps=store.list_open_steps(), installs=store.list_installs(),
            )
        except WorkerError as exc:
            raise HTTPException(status_code=502, detail=exc.message) from exc
        saved = store.list_question_answers()
        questions = C.question_cards(asked_now.get("questions"), saved)
        # The housing answer resolves the Flash plan's own preset route as asked
        # (route preset on the Stop drive), not the current plan after all nine
        # drives — so read the saved housing choice for this Drive directly.
        housing_saved = saved.get(f"housing:{drive_id}", {})
        housing_choice = housing_saved.get("choice") if isinstance(housing_saved, dict) else None
        step = C.next_step_card(decided["step"], plan, worker.limits, decided["openSteps"])
        return {
            "ok": True,
            "questionId": question_id,
            "kind": kind,
            "driveId": drive_id,
            "choice": choice,
            "questions": questions,
            "housing": C.housing_line(housing_choice),
            "nextStep": step,
            "cause": C.cause_line(decided.get("diagnose")),
            "settled": C.settled_rows(settled["settled"]),
            "unansweredQuestions": await _unanswered_questions(store, worker, settings),
        }

    # ------------------------------------------------------- car profile setup
    @app.post("/api/profile/draft")
    async def api_profile_draft(request: Request) -> dict[str, Any]:
        """Fill the typed Car profile card from the owner's own words.

        Pure: nothing is saved. The owner corrects any field and confirms
        through `POST /api/profile`, so a misread word never becomes a fact
        about the car. The same fields the no-key plain form shows
        (`profileSpec` in `GET /api/state`).
        """
        try:
            body = await request.json()
        except Exception as exc:  # noqa: BLE001 - any bad body is the same message
            raise HTTPException(status_code=400, detail="Tell me about your car in your own words first.") from exc
        text = str(body.get("text") or "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="Tell me about your car in your own words first.")
        return {"ok": True, "draft": P.draft_from_text(text, worker.ktuner_basemap)}

    @app.post("/api/profile")
    async def api_profile_save(request: Request) -> dict[str, Any]:
        """Confirm the Car profile card. Nothing is saved before this call.

        A parts change records an Install with its date for every fitted or
        removed part, so the drives that follow read against the car as it is
        now — like a Flash, an Install starts the drive window.
        """
        try:
            body = await request.json()
        except Exception as exc:  # noqa: BLE001 - any bad body is the same message
            raise HTTPException(status_code=400, detail="A Car profile needs its fields.") from exc
        try:
            cleaned = P.validate_fields(body.get("fields"), worker.ktuner_basemap)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        now = settings.now_ms()
        created = []
        for change in P.installs_for_part_change(store.car_profile(), cleaned):
            created.append(
                store.add_install(
                    change["part"], change["action"], installed_at=now, note="Changed in the Car profile."
                )
            )
        store.save_car_profile(cleaned)
        return {"ok": True, "profile": cleaned, "installs": created, "line": "Car profile saved."}

    # ---------------------------------------------------------------- installs
    @app.post("/api/installs")
    async def api_install_record(request: Request) -> dict[str, Any]:
        """Record an Install: a part fitted or removed, with its date.

        It appears in the Car history and starts the drive window like a
        Flash: the next reply reads the Drives since it.
        """
        try:
            body = await request.json()
        except Exception as exc:  # noqa: BLE001 - any bad body is the same message
            raise HTTPException(status_code=400, detail="An Install names a part and when it went on.") from exc
        part = str(body.get("part") or "").strip()
        if part not in P.PARTS:
            raise HTTPException(
                status_code=400,
                detail="That is not a part I know: " + (part or "nothing named")
                + ". I know these parts: " + ", ".join(P.PARTS) + ".",
            )
        action = str(body.get("action") or "fitted").strip()
        if action not in ("fitted", "removed"):
            raise HTTPException(status_code=400, detail="An Install is fitted or removed.")
        installed_at = body.get("installed_at", body.get("installedAt"))
        if installed_at is None:
            installed_at = settings.now_ms()
        try:
            installed_at = int(installed_at)
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=400, detail="An Install needs a date and time.") from exc
        row = store.add_install(part, action, installed_at=installed_at, note=str(body.get("note") or ""))
        day = C.stamp_day(installed_at)
        return {
            "ok": True,
            "install": row,
            "line": f"Install recorded: {P.part_display(part)} {action} on {day}.",
        }

    # ------------------------------------------------------- asking, no upload
    @app.post("/api/ask")
    async def api_ask(request: Request) -> dict[str, Any]:
        """A typed question with no Drive uploaded.

        With no Drive at all only Car profile setup runs: a setup flow fills
        the draft card, and a tuning question is answered with "upload a drive
        first". With Drives, a tuning question states the current window and
        points at an upload — the full typed-question flow is ticket 11, which
        replaces the answer body on this same seam.
        """
        try:
            body = await request.json()
        except Exception as exc:  # noqa: BLE001 - any bad body is the same message
            raise HTTPException(status_code=400, detail="Ask me in words first.") from exc
        text = str(body.get("text") or "").strip()
        flow = str(body.get("flow") or "").strip()
        if flow == "setup":
            if not text:
                raise HTTPException(status_code=400, detail="Tell me about your car in your own words first.")
            return {"ok": True, "kind": "profile-draft", "draft": P.draft_from_text(text, worker.ktuner_basemap)}
        state = store.car_state(None) or {}
        if not state.get("drives"):
            if not text:
                raise HTTPException(status_code=400, detail="Ask me in words first.")
            return {
                "ok": True,
                "kind": "no-drive",
                "answer": "Upload a Drive first: every answer here is read off your Drives, not guessed.",
            }
        win = C.window_card(W.window_for_state(state, store.list_installs(), _latest_drive(state)))
        return {
            "ok": True,
            "kind": "upload-first",
            "window": win["line"],
            "answer": win["line"] + ". Upload a Drive and its reply covers this.",
        }

    @app.get("/api/history")
    async def api_history() -> JSONResponse:
        """The History file: every Drive, Flash and answer, no raw CSV."""
        doc = await worker.call("exportHistory", state=store.car_state(None) or {})
        return JSONResponse(doc, headers={"content-disposition": 'attachment; filename="ktuner-history.json"'})

    @app.post("/api/history")
    async def api_history_import(request: Request) -> dict[str, Any]:
        try:
            doc = await request.json()
        except Exception as exc:  # noqa: BLE001 - any bad body is the same message
            raise HTTPException(status_code=400, detail="That is not a History file.") from exc
        out = await worker.call("importHistory", state=store.car_state(None) or {}, doc=doc)
        store.save_car_state(out["state"])
        return {"added": out["added"]}

    # ---------------------------------------------------------------- health
    @app.get("/healthz", response_class=PlainTextResponse)
    async def healthz() -> str:
        return "ok" if worker.running else "worker-down"

    @app.exception_handler(WorkerError)
    async def worker_error(request: Request, exc: WorkerError) -> JSONResponse:
        return JSONResponse({"error": exc.as_dict()}, status_code=502)

    # --------------------------------------------------------------- the AG-UI
    # One graph per app, cloned per request by the library. The checkpointer
    # keeps each chat thread's messages between turns. `llm_caller` is the
    # scripted fake model the seam-1 tests use instead of the network.
    graph = build_graph(worker, store, settings, llm_caller=llm_caller)
    agent = LangGraphAgent(name=AGENT_NAME, graph=graph, emit_raw_events=False)
    add_langgraph_fastapi_endpoint(app, agent, path="/agent")

    return app


_app: FastAPI | None = None


def __getattr__(name: str):
    """`kta_server.app:app` builds the app on first use, never on import.

    Importing this module must not create `server/ktuner.db`: the seam-1 tests
    import `create_app` and build their own app over a temp file, and they have
    no business touching the owner's own database.
    """
    if name == "app":
        global _app
        if _app is None:
            _app = create_app()
        return _app
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["create_app", "ensure_map_version_one", "ensure_map_version_one_full", "AGENT_NAME"]
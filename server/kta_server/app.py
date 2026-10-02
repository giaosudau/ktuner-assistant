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
from .worker import Worker, WorkerError

AGENT_NAME = "kta-tune-assist"


def create_app(
    settings: Settings | None = None,
    store: Store | None = None,
    worker: Worker | None = None,
) -> FastAPI:
    settings = settings or load_settings()
    store = store or Store(settings.db_path)
    worker = worker or Worker(settings.worker_script, settings.node_exe)

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
        history = await worker.call("carHistory", state=store.car_state(None) or {})
        plan = await worker.call(
            "flashPlan", state=store.car_state(None) or {}, now=settings.now_ms()
        )
        return {
            "carProfile": store.car_profile(),
            "ktunerBasemap": worker.ktuner_basemap,
            "carHistory": history["rows"],
            "baseline": history["baseline"],
            "flashes": store.list_flashes(),
            "installs": store.list_installs(),
            "mapVersions": store.list_map_versions(),
            "activeMapVersion": store.latest_map_version(),
            "openSteps": store.list_open_steps(only_open=True),
            "answers": store.list_answers(),
            "unansweredQuestions": [],  # owner questions arrive with a later ticket
            "drives": store.list_drives(),
            "flashPlan": plan,
            "hasLlm": settings.has_llm,
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
    # keeps each chat thread's messages between turns.
    graph = build_graph(worker, store, settings)
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


__all__ = ["create_app", "AGENT_NAME"]
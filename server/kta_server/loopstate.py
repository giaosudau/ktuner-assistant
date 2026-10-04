"""The loop as the chat mirrors it: the Car file, where the car is, and what the shop offers next.

One function, read by `GET /api/state`, by the chat graph's front desk (`chat.py`) and by its
tools, so the sidebar, the Recap and the model all see the same car.
"""

from __future__ import annotations

from typing import Any

from . import copy as C
from . import desk as D
from . import flash as FL
from . import profile as P
from . import window as W
from .mapdata import KTUNER_BASEMAP_SOURCE, basemap_tables


async def unanswered_questions(store: Any) -> list[dict[str, Any]]:
    """Every unanswered owner question, oldest Drive first — "Waiting for you"."""
    asked = store.list_asked_questions()
    saved_ids = set(store.list_question_answers().keys())
    return [
        {"id": q["id"], "title": q["title"], "askedOn": q.get("askedOn"),
         "askedOnStamp": C.drive_stamp(q.get("askedOn")) if q.get("askedOn") else None}
        for q in asked
        if q["id"] not in saved_ids
    ]


def ensure_map_version_one(store: Any, name: str) -> None:
    """Map version 1, the KTuner basemap, before any Drive (the same seeding as `app.ensure_map_version_one`)."""
    store.ensure_map_version(1, name, basemap_tables(), source=KTUNER_BASEMAP_SOURCE, kind="ktuner-basemap")


async def loop_state(store: Any, worker: Any, settings: Any) -> dict[str, Any]:
    """The Car file and the loop, as `GET /api/state` returns it."""
    # First use counts too: if the worker was down when the app was built,
    # Map version 1 is seeded now, and still before any Drive is read.
    ensure_map_version_one(store, worker.ktuner_basemap)
    car_state = store.car_state(None) or {}
    installs = store.list_installs()
    history = await worker.call("carHistory", state=car_state, installs=installs)
    # The Flash plan reads the window, like every reply: a change from
    # before the last Flash or Install never proposes a cell for the car
    # as it is now.
    rows = history["rows"]
    latest = rows[-1]["id"] if rows else None
    win = W.drive_window(rows, car_state.get("flashes"), installs, latest)
    # Written on the active Map version's own cells and passed by both map
    # checks (ADR 0003) before it can reach a KTuner card.
    plan = await FL.checked_plan(
        worker, store, car_state, W.windowed_state(car_state, win["ids"]), settings.now_ms()
    )
    active = store.map_version((history.get("activeMapVersion") or {}).get("n") or 1) or {}
    active.pop("tables", None)
    state = {
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
        "unansweredQuestions": await unanswered_questions(store),
        "drives": store.list_drives(),
        "flashPlan": plan,
        "hasLlm": settings.has_llm,
        "logGuide": C.log_guide(worker.limits),
    }
    # The front desk (tuning-shop D20, D25): where the car is, the Recap, the stage's suggested replies.
    state["stage"] = D.stage_of(state)
    state["recap"] = D.recap(state)
    state["suggestions"] = D.stage_suggestions(state)
    state["capabilities"] = [
        {k: c[k] for k in ("id", "status", "title", "says") if k in c} | ({"limit": c["limit"]} if c.get("limit") else {})
        for c in D.CAPABILITIES
    ]
    return state

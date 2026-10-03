"""The graph one upload runs through: ingest → decide → built-in reply.

No LLM in this ticket (spec: "the reply is the built-in one, templated from
engine facts"). Every node is deterministic: the same Drive against the same
Car history always gives the same reply.

What each node owns:

* `ingest` — the engine calls the reply is built from, streamed as harness
  steps; then SQLite (the raw CSV was stored by `POST /upload`, and the Car
  history state goes back in exactly as the engine returned it). The Drive's Map
  version travels with the Drive, so the reply can name it.
* `decide`  — settle every Open step against the new Drive, then exactly one
  Next step and the Open steps it opens.
* `reply`   — the typed reply card, streamed as prose and left in state.

The LLM node (agent → verify → repair/fallback) is a later ticket; it slots in
between `decide` and `reply` and may not change the Next step.
"""

from __future__ import annotations

from typing import Annotated, Any, TypedDict

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

from . import copy as C
from .harness import Harness, merge as merge_harness
from .worker import Worker, WorkerError


class LoopState(TypedDict, total=False):
    """What the chat sends in and reads back out (AG-UI `state`)."""

    messages: Annotated[list, add_messages]
    upload_id: str
    thread_id: str
    drive: dict
    reply: dict
    error: dict


def build_graph(worker: Worker, store, settings, checkpointer=None):
    """Wire the three nodes around the injected worker, store and settings.

    Nothing here is a global: a test builds its own graph over a temp SQLite
    file and its own worker, and gets the same three nodes.
    """

    async def ingest(state: LoopState, config: RunnableConfig) -> dict[str, Any]:
        return await _ingest(state, config, worker, store, settings)

    async def decide(state: LoopState, config: RunnableConfig) -> dict[str, Any]:
        return await _decide(state, config, worker, store, settings)

    async def reply(state: LoopState, config: RunnableConfig) -> dict[str, Any]:
        return await _reply(state, config, store)

    graph = StateGraph(LoopState)
    graph.add_node("ingest", ingest)
    graph.add_node("decide", decide)
    graph.add_node("reply", reply)
    graph.add_edge(START, "ingest")
    graph.add_edge("ingest", "decide")
    graph.add_edge("decide", "reply")
    graph.add_edge("reply", END)
    return graph.compile(checkpointer=checkpointer or MemorySaver())


# ---------------------------------------------------------------------------
# ingest: read the Drive, add it to the Car history, keep what the reply needs
# ---------------------------------------------------------------------------
async def _ingest(state: LoopState, config: RunnableConfig, worker: Worker, store, settings) -> dict[str, Any]:
    harness = Harness()
    try:
        return await _ingest_run(state, config, harness, worker, store, settings)
    except WorkerError as exc:
        # A file that is not a TunerView log is the owner's problem to fix, not
        # a crash: say what happened and stop.
        return {"error": exc.as_dict()}


async def _ingest_run(
    state: LoopState, config: RunnableConfig, harness: Harness, worker: Worker, store, settings
) -> dict[str, Any]:
    upload = store.get_upload(state["upload_id"])
    if upload is None:
        raise WorkerError(f"That upload is not here: {state['upload_id']}", "no-upload")
    csv_text = upload["csv"].decode("utf-8", "replace")

    limits = worker.limits
    car_state = store.car_state(None)
    now = settings.now_ms()
    # What the owner sees for the log. Never the rows themselves.
    shown = {"fileName": upload["file_name"], "bytes": upload["bytes"]}

    # 1. Read the log.
    loaded = await harness.step(
        config, "readLog", "Read the TunerView log", shown,
        lambda: worker.call("loadLog", csv=csv_text, fileName=upload["file_name"]),
    )

    # 2. Add the Drive to the Car history. The state goes in and comes back
    #    unchanged: the engine's operations are pure.
    ingested = await harness.step(
        config, "ingestUpload", "Add the Drive to your Car history", shown,
        lambda: worker.call("ingestUpload", csv=csv_text, fileName=upload["file_name"], now=now, state=car_state),
    )
    drive = ingested["drive"]
    car_state = ingested["state"]
    drive_id = drive["id"]
    store.save_car_state(car_state)
    store.bind_upload_drive(upload["upload_id"], drive_id, not drive["tooShort"])
    store.add_drive(
        drive_id,
        upload["upload_id"],
        upload["file_name"],
        None if drive["tooShort"] else drive["verdict"],
        drive.get("summary"),
        (drive.get("summary") or {}).get("start"),
        drive["tooShort"],
    )

    # 3. The Car history and the Baseline the Verdict is read against.
    history = await harness.step(
        config, "carHistory", "Compare with your earlier Drives", {"through": drive_id},
        lambda: worker.call("carHistory", state=car_state),
    )

    # 4-5. Safety lines and the numbers the reply quotes. A Too-short drive has
    #      no verdict to read and no numbers to quote, so neither is checked.
    if not drive["tooShort"]:
        await harness.step(
            config, "overview", "Check every safety line", {"driveId": drive_id},
            lambda: worker.call("overview", driveId=drive_id),
        )
        await harness.step(
            config, "driveFacts", "Read this Drive's numbers", {"driveId": drive_id},
            lambda: worker.call("driveFacts", driveId=drive_id),
        )

    # 6. The one Flash plan this Car history supports.
    plan = await harness.step(
        config, "flashPlan", "Work out the Flash plan", {"through": drive_id},
        lambda: worker.call("flashPlan", state=car_state, now=now),
    )

    drives_read = [r["id"] for r in history["rows"]]
    return {
        "upload_id": upload["upload_id"],
        "thread_id": state.get("thread_id") or upload.get("thread_id") or "",
        "drive": {**drive, "logRows": loaded["rows"], "drivesRead": drives_read},
        "reply": C.build_reply(
            drive, plan, limits, drives_read,
            {**harness.summary(), "steps": harness.as_list()},
            first_drive=bool(drive.get("firstDrive")),
        ),
    }


# ---------------------------------------------------------------------------
# decide: settle what was asked last time, then exactly one Next step
#
# Settling runs first, so the step this Drive is given is chosen knowing what the
# Drive proved. Both operations are the engine's (`settleOpenSteps`, `nextStep`)
# and both are streamed as harness steps: what the owner is told was checked is
# what was checked.
# ---------------------------------------------------------------------------
async def _decide(
    state: LoopState, config: RunnableConfig, worker: Worker, store, settings
) -> dict[str, Any]:
    if state.get("error"):
        return {}
    harness = Harness()
    drive = state["drive"]
    drive_id = drive.get("id")
    car_state = store.car_state(None)
    reply = state["reply"]
    shown = {"driveId": drive_id, "openSteps": len(store.list_open_steps(only_open=True))}

    # 1. Settle every Open step against this Drive.
    settled = await harness.step(
        config, "settleOpenSteps", "Settle what I asked last time", shown,
        lambda: worker.call(
            "settleOpenSteps", state=car_state, driveId=drive_id,
            openSteps=store.list_open_steps(),
        ),
    )

    # 2. Decide the one Next step, and which Open steps it opens.
    decided = await harness.step(
        config, "nextStep", "Decide the Next step", shown,
        lambda: worker.call(
            "nextStep", state=car_state, driveId=drive_id, openSteps=settled["openSteps"],
        ),
    )
    store.save_open_steps(decided["openSteps"])

    step = C.next_step_card(
        decided["step"], reply.get("flashPlan"), worker.limits, decided["openSteps"]
    )
    return {
        "reply": {
            **reply,
            "settled": C.settled_rows(settled["settled"]),
            "wasted": C.wasted_line(settled["wasted"]),
            "nextStep": step,
            "openSteps": decided["openSteps"],
            "harness": merge_harness(
                [reply.get("harness"), {**harness.summary(), "steps": harness.as_list()}]
            ),
        }
    }


# ---------------------------------------------------------------------------
# reply: stream the prose, leave the typed card in state
# ---------------------------------------------------------------------------
async def _reply(state: LoopState, config: RunnableConfig, store) -> dict[str, Any]:
    harness = Harness()
    base = f"reply-{state['upload_id']}"

    if state.get("error"):
        line = "I could not read that file as a TunerView log."
        await harness.say(config, base, line)
        return {"messages": [AIMessage(content=line, id=base)], "reply": {"error": state["error"], "say": line}}

    reply = state["reply"]
    await harness.say(config, base, reply["say"])
    await harness.say(config, f"{base}-window", reply["window"])
    await harness.summary_event(config, reply["harness"])

    if thread_id := state.get("thread_id"):
        store.add_message(
            f"{base}-db", thread_id, "assistant",
            f"{reply['say']}\n{reply['window']}", drive_id=state["drive"].get("id"),
        )
    return {
        "messages": [
            AIMessage(content=reply["say"], id=base),
            AIMessage(content=reply["window"], id=f"{base}-window"),
        ],
        "reply": reply,
    }


__all__ = ["LoopState", "build_graph"]
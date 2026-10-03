"""The graph one upload runs through: ingest → decide → agent → built-in reply.

The LLM node (`agent`) slots in between `decide` and `reply` (spec): it may not
change the Next step. Every node is deterministic except the agent's prose, and
even that is checked: with no key configured the agent is a no-op and the reply
is the built-in one, templated from engine facts.

What each node owns:

* `ingest` — the engine calls the reply is built from, streamed as harness
  steps; then SQLite (the raw CSV was stored by `POST /upload`, and the Car
  history state goes back in exactly as the engine returned it). The Drive's Map
  version travels with the Drive, so the reply can name it.
* `decide`  — settle every Open step against the new Drive, then exactly one
  Next step, the owner questions for this Drive, and the Open steps it opens.
* `agent`   — the model explains the decided reply through read-only engine
  tools; verify judges every draft (numbers, the one action, Flash plan cells,
  banned advice EN+VI); one repair turn, then the built-in reply stands.
* `reply`   — the typed reply card, streamed as prose and left in state.

Owner questions pause the loop without suspending the run: the reply card
carries the tap-to-answer choices, unanswered ones sit beside the thread as
"Waiting for you", and `POST /api/answer` persists the answer, rebuilds the
Car history from events and re-decides the Next step. A suspending LangGraph
`interrupt` was evaluated and rejected: it blocks same-thread subsequent
uploads (the 15:29 run after 20:38 returns the earlier interrupt with no new
reply), breaking the single-turn AG-UI contract the seam-1 loop eval locks.
"""

from __future__ import annotations

from typing import Annotated, Any, TypedDict

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

from . import agent as agent_node
from . import copy as C
from . import window as W
from .harness import Harness, merge as merge_harness
from .worker import Worker, WorkerError


class LoopState(TypedDict, total=False):
    """What the chat sends in and reads back out (AG-UI `state`)."""

    messages: Annotated[list, add_messages]
    upload_id: str
    thread_id: str
    drive: dict
    reply: dict
    agent: dict
    error: dict


def build_graph(worker: Worker, store, settings, checkpointer=None, llm_caller=None):
    """Wire the four nodes around the injected worker, store and settings.

    Nothing here is a global: a test builds its own graph over a temp SQLite
    file and its own worker, and gets the same four nodes. `llm_caller` is the
    seam-1 fake model hook: a scripted async `(messages, tools) -> response`
    used instead of the network, so tests never need a key.
    """

    async def ingest(state: LoopState, config: RunnableConfig) -> dict[str, Any]:
        return await _ingest(state, config, worker, store, settings)

    async def decide(state: LoopState, config: RunnableConfig) -> dict[str, Any]:
        return await _decide(state, config, worker, store, settings)

    async def agent(state: LoopState, config: RunnableConfig) -> dict[str, Any]:
        return await _agent(state, config, worker, store, settings, llm_caller)

    async def reply(state: LoopState, config: RunnableConfig) -> dict[str, Any]:
        return await _reply(state, config, store)

    graph = StateGraph(LoopState)
    graph.add_node("ingest", ingest)
    graph.add_node("decide", decide)
    graph.add_node("agent", agent)
    graph.add_node("reply", reply)
    graph.add_edge(START, "ingest")
    graph.add_edge("ingest", "decide")
    graph.add_edge("decide", "agent")
    graph.add_edge("agent", "reply")
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

    # 3. The Car history and the Baseline the Verdict is read against. The
    #    app's own Install list rides along, so the step shows the change the
    #    window starts after next to the Drives it bounds.
    history = await harness.step(
        config, "carHistory", "Compare with your earlier Drives", {"through": drive_id},
        lambda: worker.call("carHistory", state=car_state, installs=store.list_installs()),
    )

    # 3b. The drive window: the latest Drive plus every Drive since the last
    #     Flash or Install, capped at 14 days. Older Drives feed only the
    #     Baseline and the trend pictures — the Flash plan below already reads
    #     the window, so it answers for the car as it is now.
    win = W.drive_window(history["rows"], (car_state or {}).get("flashes"), store.list_installs(), drive_id)
    window_state = W.windowed_state(car_state, win["ids"])

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

    # 6. The one Flash plan this Car history supports — read against the
    #    window, so a change from before the last Flash or Install never
    #    proposes a cell for the car as it is now.
    plan = await harness.step(
        config, "flashPlan", "Work out the Flash plan", {"through": drive_id},
        lambda: worker.call("flashPlan", state=window_state, now=now),
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
            window=win,
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
    # Pre-settle Open steps: a Drive never settles its own ask, and the
    # did-flash question needs the Undo still open when the after-flash Drive
    # arrives (settle would already mark it Done).
    pre_settle_open = store.list_open_steps()
    shown = {"driveId": drive_id, "openSteps": len(store.list_open_steps(only_open=True))}

    # 1. Settle every Open step against this Drive.
    settled = await harness.step(
        config, "settleOpenSteps", "Settle what I asked last time", shown,
        lambda: worker.call(
            "settleOpenSteps", state=car_state, driveId=drive_id,
            openSteps=pre_settle_open,
        ),
    )

    # 2. Decide the one Next step, and which Open steps it opens. Diagnose runs
    #    inside the engine before the decision; the Install list rides along so
    #    a symptom right after a fitted part reads as one cause. The state is
    #    the window's: Drives from before the last Flash or Install feed the
    #    Baseline, never the step.
    window_state = W.windowed_state(car_state, (reply.get("windowDrives") or []))
    decided = await harness.step(
        config, "nextStep", "Decide the Next step", shown,
        lambda: worker.call(
            "nextStep", state=window_state, driveId=drive_id, openSteps=settled["openSteps"],
            installs=store.list_installs(),
        ),
    )
    store.save_open_steps(decided["openSteps"])

    step = C.next_step_card(
        decided["step"], reply.get("flashPlan"), worker.limits, decided["openSteps"]
    )

    # 3. Owner questions for this Drive, generated by the engine (never the
    #    model), with the saved answer each holds.
    asked = await harness.step(
        config, "ownerQuestions", "Ask what only you know", shown,
        lambda: worker.call(
            "questions", state=window_state, driveId=drive_id,
            openSteps=pre_settle_open, installs=store.list_installs(),
        ),
    )
    saved = store.list_question_answers()
    questions = C.question_cards(asked.get("questions"), saved)
    store.save_asked_questions(questions)
    housing_choice = None
    for q in questions:
        if q.get("kind") == "housing" and q.get("answer"):
            housing_choice = q["answer"]
            break
    housing = C.housing_line(housing_choice) if (reply.get("flashPlan") or {}).get("route") == "preset" else None
    return {
        "reply": {
            **reply,
            "settled": C.settled_rows(settled["settled"]),
            "wasted": C.wasted_line(settled["wasted"]),
            "nextStep": step,
            "cause": C.cause_line(decided.get("diagnose")),
            "questions": questions,
            "housing": housing,
            "openSteps": C.step_words(decided["openSteps"]),
            "harness": merge_harness(
                [reply.get("harness"), {**harness.summary(), "steps": harness.as_list()}]
            ),
        }
    }


# ---------------------------------------------------------------------------
# agent: the model explains the decided reply, checked, repaired once, else out
#
# The decisions are already made (`decide`): the Verdict, the settled Open
# steps, the one Next step and the Flash plan. The model only chooses what to
# look at (read-only engine tools through the worker) and how to explain it.
# `verify.py` judges every draft; a failed draft gets one repair turn; a second
# failure keeps the built-in reply. With no key this node returns nothing and
# the loop is byte-identical to the built-in path. A Too-short drive has no
# numbers to explain, so the built-in line stands there too.
# ---------------------------------------------------------------------------
async def _agent(
    state: LoopState, config: RunnableConfig, worker: Worker, store, settings, llm_caller=None
) -> dict[str, Any]:
    if state.get("error"):
        return {}
    if not settings.has_llm:
        return {}
    drive = state.get("drive") or {}
    reply = state.get("reply") or {}
    if not drive or not reply:
        return {}
    if drive.get("tooShort"):
        return {"agent": {"skipped": "too-short", "verified": False, "repaired": False, "llm_calls": 0}}

    harness = Harness()
    try:
        result = await agent_node.run_agent(drive, reply, worker, store, settings, harness, config, llm_caller)
    except Exception as exc:  # noqa: BLE001 - the explainer never breaks the loop
        result = {
            "prose": None, "thinking": None, "verified": False, "repaired": False,
            "fallback": "error", "issues": [f"The explainer failed: {exc}"], "llm_calls": 0,
        }

    merged = dict(reply)
    merged["harness"] = merge_harness(
        [reply.get("harness"), {**harness.summary(), "steps": harness.as_list()}]
    )
    if result.get("verified") and result.get("prose"):
        merged["say"] = result["prose"]
    merged["agent"] = {
        "verified": bool(result.get("verified")),
        "repaired": bool(result.get("repaired")),
        "fallback": result.get("fallback"),
        "issues": list(result.get("issues") or []),
        "thinking": result.get("thinking"),
        "llmCalls": result.get("llm_calls", 0),
        "citations": list(result.get("citations") or []),
    }
    return {"agent": merged["agent"], "reply": merged}


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
    agent = state.get("agent") or {}
    if agent.get("thinking"):
        await harness.think(config, f"{base}-thinking", agent["thinking"])
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
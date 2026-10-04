"""Ask without uploading (ticket 11): a typed question answered over the drive window and the cards.

The answer is built here from engine facts and knowledge cards, so with no key
the owner still gets a sensible, checked reply. With a key the same question
goes through the agent (tools, verify, one repair, then this built-in answer
stands) for the questions that are explanations; a request for a change never
reaches a model: the Flash plan answers it, or the reason it is never made.

Every answer states its window and cites the cards it leans on. "Can't tell
yet" always says why, and every answer ends in one step or an explicit
"nothing changes in your map".
"""

from __future__ import annotations

import re
from typing import Any, Mapping

from . import agent as agent_node
from . import copy as C
from . import knowledge as K
from . import window as W
from .harness import Harness

_TIMING = re.compile(r"\b(timing|ignition|spark|advance)\b|đánh lửa", re.I)
_KNOCK_SENS = re.compile(r"knock\s*(sensitivity|sensor|detection)|độ nhạy", re.I)
_MORE = re.compile(r"\b(add|more|increase|raise|give|extra|advance|retard|lower|reduce|tăng|thêm|giảm)\b", re.I)
_BOOST = re.compile(r"\bpsi\b|\bboost\b|\bturbo\b", re.I)
_BOOST_UP = re.compile(r"\+\s*\d|\b(more|raise|increase|give|add|extra|up|tăng|thêm)\b", re.I)
_HEAT = re.compile(r"\b(heat|hot|summer|afternoon|warm)\b|nóng", re.I)
_SLOW = re.compile(r"\b(slow|slower|sluggish|weak|weaker|power|performance|lose|loses|losing|loss)\b|chậm|yếu", re.I)
_STOP = {
    "what", "does", "how", "why", "with", "that", "this", "the", "and", "for", "are", "can", "you", "tell", "about",
    "mean", "means", "should", "would", "when", "where", "which", "have", "from", "your", "mine", "car",
    # Words that say nothing about the topic (tuning-shop D23): "I want to tune my car" matches no card.
    "want", "tune", "tuning", "tuned", "help", "hello", "please", "need", "know", "like", "just", "get", "make",
    "really", "thing", "things", "some", "something", "anything", "much", "very", "could", "will", "into", "there",
}

#: Tools whose output is read off the owner's Drives: an answer that called one "read your Drives" (D22).
DRIVE_TOOLS = {"overview", "driveFacts", "insight", "channelStats", "timingCell", "pull", "carHistory", "healthReport", "fuelTest"}


def classify(text: str) -> str:
    """`refuse` (ignition or knock-sensitivity edits), `boost` (a change), `heat`, or `knowledge`."""
    if (_TIMING.search(text) or _KNOCK_SENS.search(text)) and _MORE.search(text):
        return "refuse"
    if _BOOST.search(text) and _BOOST_UP.search(text):
        return "boost"
    if _HEAT.search(text) and (_SLOW.search(text) or re.match(r"\s*why\b", text, re.I)):
        return "heat"
    return "knowledge"


def _query(text: str) -> str:
    return " ".join(t for t in re.findall(r"[^\W_]+", text.lower()) if len(t) > 2 and t not in _STOP)


def relevant_cards(query: str) -> list[dict[str, Any]]:
    """Cards that are about the question, not merely sharing a word with it (tuning-shop D23).

    A card counts only if a query word is in its title or its topics; a word buried in a body is not
    enough to answer with that card. An empty query (only vague words) matches nothing.
    """
    tokens = set(query.split())
    if not tokens:
        return []
    out = []
    for card in K.search(query):
        head = set(re.findall(r"[^\W_]+", f"{card.get('title', '')} {' '.join(card.get('topics') or [])}".lower()))
        if tokens & head:
            out.append(card)
    return out


def _sentences(body: str, count: int) -> str:
    return " ".join(re.split(r"(?<=[.!?])\s+", body.strip())[:count])


def heat_pair(summaries: Mapping[str, Mapping[str, Any]], ids: list[str]) -> tuple[str, str] | None:
    """The window's clearest cool-vs-hot pair: the hotter Drive, 5 °C or more up, with the slower timed run.

    Both Drives need a timed 50 to 70 km/h run with its intake temperature. The
    pair with the biggest gap in seconds wins, so the answer quotes the two
    Drives that show the heat best.
    """
    timed = []
    for drive_id in ids:
        run = (summaries.get(drive_id) or {}).get("accel5070")
        if isinstance(run, Mapping) and run.get("seconds") is not None and run.get("iat") is not None:
            timed.append((drive_id, float(run["seconds"]), float(run["iat"])))
    best: tuple[float, str, str] | None = None
    for a in timed:
        for b in timed:
            if b[2] - a[2] >= 5 and b[1] > a[1] and (best is None or b[1] - a[1] > best[0]):
                best = (b[1] - a[1], a[0], b[0])
    return (best[1], best[2]) if best else None


def _ref(card: Mapping[str, Any] | None) -> str:
    return f" [{card['id']}]" if card else ""


def _cite(*cards: Mapping[str, Any] | None) -> list[dict[str, str]]:
    return [{"id": c["id"], "title": c["title"]} for c in cards if c]


async def answer_question(
    text: str, worker: Any, store: Any, settings: Any, latest_id: str | None, llm_caller: Any = None, on_step: Any = None,
    config: Any = None,
) -> dict[str, Any]:
    """The reply to one typed question: `{ kind, intent, answer, window, citations, nextStep, agent }`."""
    intent = classify(text)
    state = store.car_state(None) or {}
    installs = store.list_installs()
    has_drives = bool(state.get("drives")) and latest_id is not None
    win = W.window_for_state(state, installs, latest_id) if has_drives else {"ids": [], "since": None}
    window = C.window_card(win)["line"]
    out: dict[str, Any] = {"ok": True, "kind": "answer", "intent": intent, "window": window, "citations": [], "nextStep": None}

    if intent == "refuse":
        out["answer"] = (
            "I never edit ignition timing or knock sensitivity, so I won't suggest it: from a street log I cannot "
            "check that change safely, and a wrong one costs an engine. Nothing changes in your map."
        )
        if not settings.has_llm:
            return out

    if not has_drives and intent in ("boost", "heat"):
        out["kind"] = "no-drive"
        out["answer"] = "Upload a Drive first: every answer here is read off your Drives, not guessed."
        if not settings.has_llm:
            return out

    # What the answers below lean on: the engine's Next step and Flash plan for this window.
    plan = step = None
    if has_drives:
        window_state = W.windowed_state(state, win["ids"])
        plan = await worker.call("flashPlan", state=window_state, now=settings.now_ms())
        decided = await worker.call(
            "nextStep", state=window_state, driveId=latest_id, openSteps=store.list_open_steps(), installs=installs
        )
        step = C.next_step_card(decided["step"], plan, worker.limits, decided["openSteps"])
    next_line = f" Next step: {step['title']}." if step and step.get("title") else ""

    if intent == "boost":
        out["answer"] = _boost_answer(plan)

    cards: list[dict[str, Any]] = []
    if intent in ("boost", "refuse") or out.get("kind") == "no-drive":
        pass
    elif intent == "heat":
        pair = heat_pair(state.get("drives") or {}, win["ids"])
        card = K.get("kc-heat-soak")
        if pair:
            cool, hot = ((state["drives"][i] or {}).get("accel5070") for i in pair)
            say = (
                f"Your hotter Drive was the slower one: on {C.drive_stamp(pair[0])} your 50 to 70 km/h run took "
                f"{C.n(cool['seconds'], 2)} s with the intake at {C.n(cool['iat'])} °C; on {C.drive_stamp(pair[1])} it took "
                f"{C.n(hot['seconds'], 2)} s at {C.n(hot['iat'])} °C."
            )
            if card:
                say += " Heat soak, not the tune, costs this car performance, so judge power only at similar intake temperatures." + _ref(card)
            out["answer"] = say + next_line
            cards = [card]
        else:
            out["answer"] = (
                "Can't tell yet: heat needs two timed 50 to 70 km/h runs at intake temperatures at least 5 °C apart "
                f"in this window, and it holds fewer than that.{next_line}"
            )
    else:
        hits = relevant_cards(_query(text))
        if hits:
            top = hits[0]
            out["answer"] = f"{top['title']}. {_sentences(top['body'], 2)}{_ref(top)}{next_line}"
            cards = [top]
        else:
            out["answer"] = (
                "Can't tell yet: nothing in your Drives or in what I know about this car answers that. "
                f"Ask about heat, boost or a part you fitted.{next_line}"
            )
    out["citations"] = _cite(*cards)
    out["nextStep"] = step.get("title") if step else None
    # Which answers were read off the owner's Drives (D22): the heat pair and the Flash plan's answer.
    out["readDrives"] = bool(has_drives and (intent == "boost" or (intent == "heat" and cards)))

    # AI-native (tuning-shop D1): with a model, every question goes through the agent, which picks the
    # tools and writes the answer; the built-in answer above is the checked fallback.
    if settings.has_llm:
        await _explain(out, text, state, latest_id, plan, step, worker, store, settings, llm_caller, on_step, config)
    return out


def _boost_answer(plan: Mapping[str, Any] | None) -> str:
    """The Flash plan's own answer to a request for more boost, with what unlocks it. Never a cell."""
    plan = plan or {}
    head = str(plan.get("headline") or "Your logs support no map change right now.")
    locked = [lv for lv in plan.get("levers") or [] if lv.get("family") == "boost" and lv.get("status") == "locked"]
    if not locked:
        return f"The Flash plan decides, not the request: {head} Nothing changes in your map until a Flash step opens it."
    parts = [f"{lv['title']}: {lv['reason']} What would unlock it: {lv['unlocks']}" for lv in locked]
    return f"I can't hand you more boost on request. The Flash plan today: {head} " + " ".join(parts) + " Nothing changes in your map."


async def _explain(out, text, state, latest_id, plan, step, worker, store, settings, llm_caller, on_step=None, config=None) -> None:
    """Let the agent put the built-in answer in its own words, checked; else the built-in answer stands."""
    drive = {"id": latest_id, "summary": (state.get("drives") or {}).get(latest_id), "map": None}
    reply = {"say": out["answer"], "window": out["window"], "nextStep": step, "flashPlan": plan}
    harness = Harness(on_step=on_step)
    try:
        result = await agent_node.run_agent(
            drive, reply, worker, store, settings, harness, config, llm_caller, question=text
        )
    except Exception as exc:  # noqa: BLE001 - the explainer never breaks an answer
        result = {"verified": False, "fallback": "error", "issues": [str(exc)]}
    if result.get("verified") and result.get("prose"):
        out["answer"] = result["prose"]
        out["citations"] = result.get("citations") or out["citations"]
        out["pictures"] = result.get("pictures") or []
    out["agent"] = {"verified": bool(result.get("verified")), "fallback": result.get("fallback"), "issues": list(result.get("issues") or [])}
    # What the agent did, for the chat's work row and the unchecked thinking block.
    out["harness"] = {**harness.summary(), "steps": harness.as_list()}
    if result.get("verified") and any(str(st.get("name")) in DRIVE_TOOLS for st in out["harness"]["steps"]):
        out["readDrives"] = True
    out["thinking"] = result.get("thinking")


__all__ = ["answer_question", "classify", "heat_pair"]

"""The chat: one agent turn for every typed message (tuning-shop D17–D25, ADR 0005).

How agentic chat apps are built on LangGraph + AG-UI / CopilotKit, and how this follows it:

* **A supervisor agent reads every message** and decides what to do with tools, instead of a
  hand-written router: greet and show where the car is, open the car editor, show the drive
  brief, say what the shop can't do, or **hand off to the tuner** (`ask_tuner`, the checked
  tuning agent in `agent.py`). The model reads natural language; the app supplies facts.
* **Backend tools** read the Car file and the capability list (`get_car_file`,
  `get_capabilities`, `search_knowledge`). Every number the reply says must come from them.
* **Frontend tools** (generative UI, the CopilotKit `useCopilotAction` / AG-UI `tools` pattern):
  the chat declares its cards — `show_recap`, `show_car_editor`, `show_drive_brief`,
  `show_capabilities` — in the run's `tools`; the agent calls them; the server validates every
  argument against fixed lists (parts, fuels) before the card is drawn; the owner confirms in the
  card (human in the loop), never the model.
* **Shared state**: the answer, its cards and its suggested replies travel in the graph state as
  AG-UI `STATE_SNAPSHOT`s; the conversation itself is kept by the LangGraph checkpointer per
  thread, so the agent remembers the chat.
* **Suggested replies** are written by the model from the reply and the stage (CopilotKit's
  `useCopilotChatSuggestions` idea), each checked: an allowed action, plain words, no banned
  advice; else the stage's own.
* **Guardrails stay code**: `verify.py` checks every reply (numbers from tools, banned advice,
  real tables, citations); one repair, then the app's fixed answer. With no model configured,
  the deterministic front desk (`desk.py`) answers instead, with the same shape.
"""

from __future__ import annotations

import json
import re
from typing import Any, Awaitable, Callable, Mapping

from . import agent as agent_node
from . import desk as D
from . import knowledge as K
from . import profile as P
from . import verify as V
from .ask import answer_question
from .harness import Harness

#: Provider calls one front turn may spend, the hand-off and one repair included.
MAX_CALLS = 8

FUELS = ("E10 RON95 III", "E10 RON97 III")
ACTIONS = ("send", "guide", "attach", "edit-car")


def _fn(name: str, description: str, properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {"type": "object", "properties": properties, "required": required, "additionalProperties": False},
        },
    }


# ---------------------------------------------------------------------------
# The tools
# ---------------------------------------------------------------------------
def backend_tools() -> list[dict[str, Any]]:
    """Read-only tools the server runs, and the hand-off to the tuner."""
    return [
        _fn("get_car_file", "The owner's car as the shop keeps it: the profile, parts, Map version, Round, where the car "
            "is in the loop, the last Drive, what is open and what waits for the owner. Read it before talking about their car.", {}, []),
        _fn("get_capabilities", "What the shop can do, can do with a limit, and can't do. Read it before promising anything.", {}, []),
        _fn("search_knowledge", "Sourced facts about this car and KTuner. Cite a card id in brackets for any claim from it.",
            {"query": {"type": "string"}}, ["query"]),
        _fn("ask_tuner", "Hand the owner's question to the tuner: anything to explain, judge or decide about their car, "
            "their logs, their map, fuel, heat, knock, boost, AFR, MAF or a change. The tuner reads the logs with the engine and "
            "its answer is checked; it goes to the owner as it is. Use it for every tuning question.",
            {"question": {"type": "string", "description": "The owner's question, in their words, with any context from the chat."}},
            ["question"]),
        _fn("submit_reply", "Call once, last, with your reply to the owner when you did not hand off. Plain words, markdown, "
            "under 150 words. Every number must come from a tool.", {"prose": {"type": "string"}}, ["prose"]),
    ]


def default_ui_tools() -> list[dict[str, Any]]:
    """The chat's cards, as the web declares them (`web/lib/uiTools.ts`); used when a run brings none."""
    car_fields = {
        "type": "object",
        "properties": {k: {"type": "string"} for k in ("model", "engine", "transmission", "fuel", "climate")},
        "additionalProperties": False,
    }
    return [
        {"name": "show_recap", "description": "Show the owner's car and where it is in the tuning loop as a card.",
         "parameters": {"type": "object", "properties": {}}},
        {"name": "show_car_editor", "description": "Open the one car editor card in the chat, filled with what the owner "
         "just said: parts they fitted or removed, or car details. The owner checks and saves it; nothing is saved before.",
         "parameters": {"type": "object", "properties": {
             "parts_fitted": {"type": "array", "items": {"type": "string", "enum": list(P.PARTS)}},
             "parts_removed": {"type": "array", "items": {"type": "string", "enum": list(P.PARTS)}},
             "fields": car_fields}}},
        {"name": "show_drive_brief", "description": "Show the drive brief card: exactly how to drive and log the next drive.",
         "parameters": {"type": "object", "properties": {}}},
        {"name": "show_capabilities", "description": "Show what the shop can, can partly, and can't do, as a card.",
         "parameters": {"type": "object", "properties": {}}},
    ]


UI_TOOLS = ("show_recap", "show_car_editor", "show_drive_brief", "show_capabilities")


def ui_tools_from(state: Mapping[str, Any] | None) -> list[dict[str, Any]]:
    """The cards this chat declared in the run (AG-UI `tools`), limited to the ones the server can validate."""
    declared = [t for t in ((state or {}).get("tools") or []) if isinstance(t, Mapping) and t.get("name") in UI_TOOLS]
    return declared or default_ui_tools()


def as_function(tool: Mapping[str, Any]) -> dict[str, Any]:
    return {"type": "function", "function": {
        "name": tool["name"], "description": tool.get("description") or "",
        "parameters": tool.get("parameters") or {"type": "object", "properties": {}}}}


# ---------------------------------------------------------------------------
# The car file the agent reads
# ---------------------------------------------------------------------------
def car_file(loop: Mapping[str, Any]) -> dict[str, Any]:
    """What `get_car_file` returns: compact, owner words, no raw rows."""
    profile = loop.get("carProfile")
    plan = loop.get("flashPlan") or {}
    return {
        "profile": profile,
        "known": bool(profile),
        "stage": loop.get("stage") or D.stage_of(loop),
        "stageLine": D.STAGE_WORDS[loop.get("stage") or D.stage_of(loop)],
        "recap": loop.get("recap"),
        "drivesHeld": len(loop.get("carHistory") or []),
        "activeMapVersion": (loop.get("activeMapVersion") or {}).get("label"),
        "round": len(loop.get("flashes") or []) + 1,
        "openSteps": [{"title": s.get("title"), "status": s.get("word")} for s in loop.get("openSteps") or []],
        "waitingForOwner": [q.get("title") for q in loop.get("unansweredQuestions") or []],
        "flashPlan": plan.get("headline"),
    }


def system_prompt(loop: Mapping[str, Any]) -> str:
    known = bool(loop.get("carProfile"))
    return "\n".join([
        "You are the front of a tuning shop that works over chat, for an owner tuning their own Honda with KTuner and "
        "TunerView logs. You talk with the owner, understand what they mean in their own words, and decide what to do:",
        "- Tuning questions (anything to explain, judge or decide about their car, logs, map, fuel, knock, boost, AFR, MAF, "
        "heat, a change): call ask_tuner. Do not answer them yourself.",
        "- A greeting or a vague 'I want to tune my car': read get_car_file. If the car is known, call show_recap and say in "
        "one or two sentences where they are and what they can do next. If not, welcome them and ask which car "
        "(model, gearbox, fuel, where they drive, parts fitted, KTuner map) — they can just describe it in words.",
        "- They describe their car, or say they fitted, removed or changed a part: call show_car_editor with exactly what "
        "they said (parts only from its list). Tell them to check and save the card; you never save it yourself.",
        "- They say they changed fuel: tell them to tag the next log with that fuel (the picker by the attach button), and "
        "that the premium-fuel test compares matched drives.",
        "- They ask how to log, or need the next drive: call show_drive_brief.",
        "- They ask what you can do, or ask for something: read get_capabilities and answer plainly with what you can, "
        "what you can only partly do, and what you can't; offer what you can do instead. When you are not sure, say so.",
        "- Anything unrelated to their car: say so in one line and offer what the shop does.",
        "Rules: every number you write must come from a tool result. Never promise a map change, more power, more boost or "
        "more timing: only the tuner's checked plan changes a map. Plain English, short, markdown, no tables. Finish with "
        "submit_reply, unless you handed off with ask_tuner.",
        "What the shop can, can partly, and can't do:",
        *D.capability_lines(),
        "The car is known." if known else "The owner has not told you their car yet.",
    ])


# ---------------------------------------------------------------------------
# Validating the model's card calls (the server owns every value a card shows)
# ---------------------------------------------------------------------------
def ui_card(name: str, args: Mapping[str, Any], loop: Mapping[str, Any]) -> dict[str, Any] | None:
    """One generative-UI card, built from the app's own data; the model only picks it and the parts named."""
    args = args if isinstance(args, Mapping) else {}
    if name == "show_recap":
        recap = D.recap(loop)
        return {"tool": name, "recap": recap} if recap else None
    if name == "show_drive_brief":
        return {"tool": name}
    if name == "show_capabilities":
        return {"tool": name, "capabilities": loop.get("capabilities") or []}
    if name == "show_car_editor":
        fitted = [p for p in args.get("parts_fitted") or [] if p in P.PARTS]
        removed = [p for p in args.get("parts_removed") or [] if p in P.PARTS]
        fields = {k: str(v).strip() for k, v in (args.get("fields") or {}).items()
                  if k in ("model", "engine", "transmission", "fuel", "climate") and str(v or "").strip()}
        profile = loop.get("carProfile") or {
            "model": "", "engine": "", "transmission": "", "fuel": "", "climate": "",
            "basemap": loop.get("ktunerBasemap") or "", "parts": [],
        }
        draft = D.parts_draft(profile, fitted, removed)
        draft["fields"].update(fields)
        draft["filled"].update({k: True for k in fields})
        draft["missing"] = [k for k in ("model", "engine", "transmission", "fuel", "climate") if not draft["fields"].get(k)]
        return {"tool": name, "draft": draft}
    return None


# ---------------------------------------------------------------------------
# One turn
# ---------------------------------------------------------------------------
Caller = Callable[[list[dict[str, Any]], list[dict[str, Any]]], Awaitable[dict[str, Any]]]


async def chat_turn(
    text: str,
    loop: Mapping[str, Any],
    worker: Any,
    store: Any,
    settings: Any,
    *,
    history: list[dict[str, str]] | None = None,
    ui_tools: list[dict[str, Any]] | None = None,
    llm_caller: Caller | None = None,
    harness: Harness | None = None,
    config: Any = None,
    on_step: Any = None,
) -> dict[str, Any]:
    """The answer to one typed message: `{kind, answer, ui, citations, basis, suggestions, agent, harness, ...}`."""
    harness = harness or Harness(on_step=on_step)
    latest = _latest_drive(loop)
    if not settings.has_llm:
        return await _without_model(text, loop, worker, store, settings, latest, llm_caller, on_step)

    caller = llm_caller or (lambda msgs, tls: agent_node._post_chat(settings, msgs, tls))
    tools = backend_tools() + [as_function(t) for t in (ui_tools or default_ui_tools())]
    messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt(loop)}]
    for turn in (history or [])[-10:]:
        if turn.get("role") in ("user", "assistant") and turn.get("content"):
            messages.append({"role": turn["role"], "content": str(turn["content"])[:1200]})
    messages.append({"role": "user", "content": text})

    facts: list[float] = V.collect_numbers(D.capability_lines())
    seen_cards: dict[str, Any] = {}
    cards: list[dict[str, Any]] = []
    thinking: list[str] = []
    calls = repairs = 0

    def fallback(reason: str, issues: list[str]) -> Awaitable[dict[str, Any]]:
        async def run() -> dict[str, Any]:
            out = await _without_model(text, loop, worker, store, settings, latest, None, on_step, model=False)
            out["agent"] = {"verified": False, "fallback": reason, "issues": issues}
            out["ui"] = out.get("ui") or cards
            return out
        return run()

    while True:
        if calls >= MAX_CALLS:
            return await fallback("turns", ["The front agent did not finish within its budget."])
        try:
            message = agent_node._message_of(await caller(messages, tools))
        except Exception as exc:  # noqa: BLE001 - a provider failure is the fixed answer, never a crash
            return await fallback("error", [f"The model call failed: {exc}"])
        calls += 1
        if thought := agent_node.extract_thinking(message):
            thinking.append(thought)
        messages.append({"role": "assistant", "content": agent_node.strip_thinking(message.get("content")), "tool_calls": message.get("tool_calls")})
        tool_calls = agent_node._tool_calls_of(message)
        if not tool_calls:
            prose = (agent_node.strip_thinking(message.get("content")) or "").strip()
            if not prose:
                return await fallback("empty", ["The model returned nothing."])
            tool_calls = [{"id": None, "name": "submit_reply", "args": {"prose": prose}}]

        results = []
        for call in tool_calls:
            name, args = call["name"], call["args"] if isinstance(call["args"], Mapping) else {}
            if name == "ask_tuner":
                question = str(args.get("question") or text)
                await harness.step(config, "handoff", "Hand the question to the tuner", {"question": question}, _wrap({"to": "tuner"}))
                out = await answer_question(question, worker, store, settings, latest, llm_caller, on_step, config)
                out["ui"] = cards
                out["front"] = {"handoff": True, "thinking": "\n\n".join(thinking) or None}
                return out
            if name == "submit_reply":
                prose = str(args.get("prose") or "")
                verdict = V.verify(prose, None, None, facts, None, [], knowledge=list(seen_cards.values()), question=True)
                if verdict["ok"]:
                    return {
                        "ok": True, "kind": "desk", "answer": prose, "ui": cards, "window": None, "readDrives": False,
                        "citations": [{"id": cid, "title": str((seen_cards.get(cid) or {}).get("title") or cid)}
                                      for cid in sorted(V.citation_ids(prose)) if cid in seen_cards],
                        "agent": {"verified": True, "fallback": None, "issues": [], "repaired": repairs > 0},
                        "harness": {**harness.summary(), "steps": harness.as_list()},
                        "thinking": "\n\n".join(thinking) or None,
                    }
                if repairs >= 1:
                    return await fallback("unverified", verdict["issues"])
                repairs += 1
                results.append(_tool_result(call, "Rejected by the verify step. Fix these and call submit_reply again:\n- " + "\n- ".join(verdict["issues"])))
                continue
            output = await _run(name, args, loop, harness, config)
            if name in UI_TOOLS:
                card = output
                if card:
                    cards[:] = [c for c in cards if c["tool"] != card["tool"]] + [card]
                facts.extend(V.collect_numbers(card))
                results.append(_tool_result(call, "Shown to the owner." if card else "Nothing to show: the car is not known yet."))
                continue
            if name == "search_knowledge":
                for c in output if isinstance(output, list) else []:
                    seen_cards[str(c["id"])] = c
            else:
                facts.extend(V.collect_numbers(output))
            results.append(_tool_result(call, json.dumps(output, default=str)[:6000]))
        messages.extend(results)


async def _run(name: str, args: Mapping[str, Any], loop: Mapping[str, Any], harness: Harness, config: Any) -> Any:
    if name == "get_car_file":
        return await harness.step(config, "carFile", "Read your car file", {}, _wrap(car_file(loop)))
    if name == "get_capabilities":
        return await harness.step(config, "capabilities", "Check what I can and can't do", {}, _wrap(loop.get("capabilities") or []))
    if name == "search_knowledge":
        query = str(args.get("query") or "")
        return await harness.step(config, "knowledge", "Look it up in what I know", {"query": query}, _wrap(K.search(query)))
    if name in UI_TOOLS:
        card = ui_card(name, args, loop)
        titles = {"show_recap": "Show where your car is", "show_car_editor": "Open your car card",
                  "show_drive_brief": "Show the drive brief", "show_capabilities": "Show what I can do"}
        await harness.step(config, name, titles[name], dict(args), _wrap({"shown": bool(card)}))
        return card
    return {"error": f"Unknown tool {name}"}


def _tool_result(call: Mapping[str, Any], content: str) -> dict[str, Any]:
    return {"role": "tool", "tool_call_id": call.get("id"), "name": call.get("name"), "content": content}


def _wrap(value: Any) -> Any:
    async def call() -> Any:
        return value
    return call


def _latest_drive(loop: Mapping[str, Any]) -> str | None:
    rows = loop.get("carHistory") or []
    return rows[-1]["id"] if rows else None


# ---------------------------------------------------------------------------
# With no model: the deterministic front desk, the same answer shape
# ---------------------------------------------------------------------------
async def _without_model(
    text: str, loop: Mapping[str, Any], worker: Any, store: Any, settings: Any, latest: str | None,
    llm_caller: Any, on_step: Any, model: bool = True,
) -> dict[str, Any]:
    intent = D.sort_intent(text)
    if not loop.get("carProfile") and intent not in ("greeting", "capabilities", "capability", "out-of-scope"):
        draft = P.draft_from_text(text, loop.get("ktunerBasemap") or "")
        if any(v for k, v in draft["filled"].items() if k != "basemap") and not text.rstrip().endswith("?"):
            return {"ok": True, "kind": "desk", "intent": "car-setup", "answer": "Here is your car as I understood it. Check it and save.",
                    "ui": [{"tool": "show_car_editor", "draft": draft}], "citations": [], "window": None}
    out = D.reply(intent, text, loop)
    if out is not None:
        ui = []
        if out.get("recap"):
            ui.append({"tool": "show_recap", "recap": out.pop("recap")})
        if out.pop("guide", False):
            ui.append({"tool": "show_drive_brief"})
        if out.get("draft"):
            ui.append({"tool": "show_car_editor", "draft": out.pop("draft")})
        return {**out, "ui": ui}
    if not model:
        # The front agent failed: the tuner still answers, without a second model call.
        settings_view = _NoModel(settings)
        return {**await answer_question(text, worker, store, settings_view, latest, None, on_step), "ui": []}
    return {**await answer_question(text, worker, store, settings, latest, llm_caller, on_step), "ui": []}


class _NoModel:
    """The same settings with the model switched off, for the fixed answer after a failed front turn."""

    def __init__(self, settings: Any) -> None:
        self._s = settings

    has_llm = False

    def __getattr__(self, name: str) -> Any:
        return getattr(self._s, name)


# ---------------------------------------------------------------------------
# Suggested replies, written by the model and checked
# ---------------------------------------------------------------------------
def suggest_tool() -> dict[str, Any]:
    return _fn("suggest_replies", "Two or three short replies the owner is most likely to send next.", {
        "items": {"type": "array", "maxItems": 3, "items": {"type": "object", "properties": {
            "label": {"type": "string", "description": "What the chip says, under 40 characters."},
            "action": {"type": "string", "enum": list(ACTIONS),
                       "description": "send: send the text as the owner's message; guide: show the drive brief; attach: attach a log; edit-car: open the car card."},
            "text": {"type": "string", "description": "For send: the message, in the owner's words."},
        }, "required": ["label", "action"], "additionalProperties": False}},
    }, ["items"])


async def suggest(
    owner_text: str, answer: Mapping[str, Any], loop: Mapping[str, Any], settings: Any, llm_caller: Caller | None = None,
) -> list[dict[str, Any]]:
    """Follow-up chips for the reply just given: the model proposes, the code checks; else the stage's."""
    fixed = D.answer_suggestions(loop, answer.get("citations"))
    if not settings.has_llm:
        return fixed
    caller = llm_caller or (lambda msgs, tls: agent_node._post_chat(settings, msgs, tls))
    prompt = "\n".join([
        "Suggest the two or three replies the owner of this car is most likely to send next, as tappable chips. Each must be "
        "something the shop can actually do (below). Prefer: the stage's next action, then a natural follow-up to the reply. "
        "No numbers, never ask the shop for more boost, more timing or a change it can't make.",
        f"Where the car is: {D.STAGE_WORDS[loop.get('stage') or D.stage_of(loop)]}",
        "What the shop can do:", *D.capability_lines(),
    ])
    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": f"The owner said: {owner_text}\n\nThe shop replied: {str(answer.get('answer') or '')[:1500]}"},
    ]
    try:
        message = agent_node._message_of(await caller(messages, [suggest_tool()]))
        call = next((c for c in agent_node._tool_calls_of(message) if c["name"] == "suggest_replies"), None)
        chips = checked_chips((call or {}).get("args", {}).get("items") if call else None)
    except Exception:  # noqa: BLE001 - suggestions are never worth an error
        chips = []
    return chips or fixed


def basis(out: Mapping[str, Any], loop: Mapping[str, Any]) -> str | None:
    """What the answer read, in words (D22): the Drives and the car file, or what the shop knows; nothing if neither."""
    held = len(loop.get("carHistory") or [])
    window = out.get("window")
    if out.get("readDrives") and window and window != "nothing read yet":
        return f"{window} · {held} {'Drive' if held == 1 else 'Drives'} in your car file"
    if out.get("citations"):
        return "From what I know about this car, not from your Drives"
    return None


async def finish(text: str, out: dict[str, Any], loop: Mapping[str, Any], settings: Any, llm_caller: Caller | None = None) -> dict[str, Any]:
    """The answer with its suggested replies and its "what I read" line."""
    out["basis"] = basis(out, loop)
    out["suggestions"] = out.get("suggestions") or await suggest(text, out, loop, settings, llm_caller)
    return out


_ICON = {"send": "help", "guide": "route", "attach": "paperclip", "edit-car": "car"}


def checked_chips(items: Any) -> list[dict[str, Any]]:
    """Keep a model's chip only if it is an allowed action in plain words with no number and no banned advice."""
    out: list[dict[str, Any]] = []
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, Mapping):
            continue
        label = " ".join(str(item.get("label") or "").split())
        action = item.get("action")
        words = " ".join(str(item.get("text") or label).split())
        if action not in ACTIONS or not label or len(label) > 48 or len(words) > 200:
            continue
        if V.numbers_in(label) or V.banned_issues(words) or V.banned_issues(label):
            continue
        if re.search(r"\b(more|raise|increase|add)\b.*\b(boost|timing|ignition|psi)\b", words, re.I):
            continue
        if any(c["label"].lower() == label.lower() for c in out):
            continue
        chip = {"label": label, "action": action, "icon": _ICON[action]}
        if action == "send":
            chip["text"] = words
        out.append(chip)
    return out[:3]


__all__ = ["backend_tools", "basis", "car_file", "finish", "chat_turn", "checked_chips", "default_ui_tools", "suggest", "system_prompt", "ui_card", "ui_tools_from"]

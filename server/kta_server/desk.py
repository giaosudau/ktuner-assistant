"""The front desk (tuning-shop D19–D25): what the shop says before any tuning.

A real shop greets you, finds your car's job card, says where you left off and
asks what you came in for. Nobody explains boost tables to "hello". This module
answers the messages that are not tuning questions — a greeting, a vague
opener, "what can you do", a part or fuel change, something outside tuning —
from the Car file alone: no model, no knowledge search, the same answer every
time. Everything else goes on to the tuner (`ask.answer_question`).

It also holds what the assistant can do, can't do, and isn't sure of
(`CAPABILITIES`): the one list the greeting, the "can you …" answers, the
agent's prompt and the suggested replies are all written from.

Pure functions over the loop state `GET /api/state` returns; the routes in
`app.py` call them.
"""

from __future__ import annotations

import re
from typing import Any, Mapping

from . import copy as C
from . import profile as P

# ---------------------------------------------------------------------------
# What the assistant can do, can't do, and isn't sure of
# ---------------------------------------------------------------------------
#: `status`: "can" (built and checked), "partly" (built with a stated limit), "cannot" (never, or not built).
#: `words`: the words that make an owner's "can you …?" about this capability.
CAPABILITIES: tuple[dict[str, Any], ...] = (
    {
        "id": "read-log", "status": "can", "title": "Read your TunerView log",
        "says": "Attach a TunerView CSV and I read every row: is the engine OK (OK, Watch, Stop or Can't tell), the health report by system, and whether the log met the drive brief.",
        "words": ("read", "log", "csv", "datalog", "check", "analy", "look at", "tunerview"),
    },
    {
        "id": "car-file", "status": "can", "title": "Keep your car's file",
        "says": "I keep your car: model, fuel, parts with the date fitted, every Map version and Flash, and every Drive, so each answer is read against your car's own history.",
        "words": ("remember", "profile", "parts", "history", "keep"),
    },
    {
        "id": "next-step", "status": "can", "title": "Name the one next step",
        "says": "After each log I name one thing to do — a change to flash, a gauge to watch, or a drive to log — and the drive that will prove it.",
        "words": ("next", "what should i do", "what now", "step"),
    },
    {
        "id": "maf", "status": "partly", "title": "Correct your airflow (MAF Scaling)",
        "says": "I can correct MAF Scaling at part throttle from your trims, a few points at a time, when your logs call for it.",
        "limit": "Full throttle needs AFR Command in your log, which your logs don't have yet, so I don't correct that end of the curve.",
        "words": ("maf", "afm", "airflow", "scaling", "trim"),
    },
    {
        "id": "boost-down", "status": "partly", "title": "Change boost",
        "says": "I can lower boost where your logs show overshoot or lugging.",
        "limit": "I never raise boost: on this turbo the wastegate has no headroom left.",
        "words": ("boost", "psi", "turbo", "wastegate"),
    },
    {
        "id": "afr", "status": "partly", "title": "Judge your AFR (mixture)",
        "says": "I judge full-throttle AFR against your map's target and say if it is OK, Watch or Stop.",
        "limit": "I don't change the full-throttle AFR target: no gain is shown on this car, and leaning it costs timing.",
        "words": ("afr", "mixture", "lambda", "rich", "lean", "wot"),
    },
    {
        "id": "fuel", "status": "can", "title": "E10 and RON95 III vs RON97 III",
        "says": "Tag each log with its fuel and I compare RON95 III and RON97 III on matched drives by Knock Control, so you see if premium is worth it on your car.",
        "words": ("ron", "e10", "fuel", "petrol", "octane", "premium", "gas"),
    },
    {
        "id": "tables", "status": "can", "title": "Explain any table in your map",
        "says": "I can walk your map family by family and show any table in 2D or 3D with your own values, and explain what it does.",
        "words": ("table", "explain", "what does", "map tour", "3d"),
    },
    {
        "id": "slots", "status": "partly", "title": "KTuner map slots (on-the-fly switching)",
        "says": "Tag each log with the map slot it ran on, and I never compare drives from different slots.",
        "limit": "I keep one map line for the car, not one per slot, so I can't yet tune a separate RON97 map in its own slot.",
        "words": ("slot", "switch", "on the fly", "on-the-fly", "map switching"),
    },
    {
        "id": "ignition", "status": "cannot", "title": "Add ignition timing or lower knock sensitivity",
        "says": "I read and explain the ignition and knock tables, and show how much timing Knock Control pulls.",
        "limit": "I never add timing or lower knock sensitivity: a street log can't prove that change is safe, and a wrong one costs an engine.",
        "words": ("timing", "ignition", "spark", "advance", "knock sens"),
    },
    {
        "id": "flash", "status": "cannot", "title": "Flash the ECU for you",
        "says": "I give you the exact cells to type into KTuner and keep each Map version.",
        "limit": "You flash in KTuner yourself; I can't connect to the car or the ECU.",
        "words": ("flash", "write", "upload to ecu", "connect"),
    },
    {
        "id": "live", "status": "cannot", "title": "Watch the car live",
        "says": "I read a log after the drive.",
        "limit": "I can't see live data: log in TunerView, then attach the CSV.",
        "words": ("live", "real time", "realtime", "while driving"),
    },
    {
        "id": "power", "status": "cannot", "title": "Promise power or dyno numbers",
        "says": "I can time a 50 to 70 km/h run from your log and compare like with like.",
        "limit": "A street log can't give horsepower, and I never promise a gain.",
        "words": ("horsepower", "hp", "dyno", "power", "faster", "whp"),
    },
    {
        "id": "other-car", "status": "partly", "title": "Cars other than the Civic FE 1.5T",
        "says": "My limits and knowledge are built for a Honda 1.5T on KTuner.",
        "limit": "On any other car I'm not sure my limits hold: I'd read the log, but treat every verdict as unproven.",
        "words": ("other car", "different car", "type r", "k20", "accord", "crv", "cr-v", "hrv", "hr-v"),
    },
)

_STATUS_WORD = {"can": "Yes", "partly": "Partly", "cannot": "No"}


def capability_lines() -> list[str]:
    """One line per capability, for the agent's prompt: what it can, its limit."""
    out = []
    for cap in CAPABILITIES:
        line = f"- {cap['title']}: {_STATUS_WORD[cap['status']]}. {cap['says']}"
        if cap.get("limit"):
            line += f" Limit: {cap['limit']}"
        out.append(line)
    return out


def capabilities_answer() -> str:
    can = [c for c in CAPABILITIES if c["status"] == "can"]
    partly = [c for c in CAPABILITIES if c["status"] == "partly"]
    cannot = [c for c in CAPABILITIES if c["status"] == "cannot"]
    parts = ["I'm a tuning shop for your KTuner car, in a chat. Here's what I'm sure I can do, what I can do with a limit, and what I won't do.", "", "**I can**"]
    parts += [f"- **{c['title']}** — {c['says']}" for c in can]
    parts += ["", "**I can, with a limit**"]
    parts += [f"- **{c['title']}** — {c['says']} {c['limit']}" for c in partly]
    parts += ["", "**I can't**"]
    parts += [f"- **{c['title']}** — {c['limit']}" for c in cannot]
    return "\n".join(parts)


def match_capability(text: str) -> dict[str, Any] | None:
    """The capability an owner's "can you …?" is about, if one is named."""
    lowered = f" {text.lower()} "
    best, best_hits = None, 0
    for cap in CAPABILITIES:
        hits = sum(1 for w in cap["words"] if re.search(rf"(?<![a-z]){re.escape(w)}", lowered))
        if hits > best_hits:
            best, best_hits = cap, hits
    return best


def capability_answer(cap: Mapping[str, Any]) -> str:
    head = {"can": "Yes.", "partly": "Partly.", "cannot": "No."}[cap["status"]]
    out = f"{head} **{cap['title']}** — {cap['says']}"
    if cap.get("limit"):
        out += f" {cap['limit']}"
    return out


# ---------------------------------------------------------------------------
# Sorting a typed message
# ---------------------------------------------------------------------------
_TOKEN = re.compile(r"[^\W_]+", re.UNICODE)

#: Words that say nothing about what the owner wants: a message made only of these is a greeting.
_VAGUE = {
    "hi", "hello", "hey", "yo", "hiya", "morning", "afternoon", "evening", "good", "there", "chào", "xin", "alo",
    "i", "im", "i'm", "we", "want", "wanna", "would", "like", "to", "tune", "tuning", "tuned", "my", "the", "a", "an",
    "car", "help", "me", "please", "pls", "start", "started", "get", "lets", "let", "us", "can", "you", "do", "it",
    "need", "with", "this", "is", "are", "ok", "okay", "thanks", "thank", "again", "back", "new", "chat", "so",
    "em", "anh", "muốn", "độ", "xe", "giúp", "tôi", "mình", "and", "some", "just", "how", "about", "of",
}
_GREETING_START = re.compile(r"^\s*(hi|hello|hey|yo|hiya|good (morning|afternoon|evening)|xin chào|chào|alo)\b", re.I)
_CAPABILITIES = re.compile(
    r"what (can|do) you (do|help)|what are you|who are you|how does this (work|app work)|what can('?t| not) you|"
    r"what (are|is) your (limits|capabilit)|what do you know|how can you help|bạn làm được gì",
    re.I,
)
_CAN_YOU = re.compile(r"^\s*(can|could|do|will|are) (you|u)\b|^\s*is it possible|^\s*(does|will) (it|this|the app) work", re.I)
_FITTED = re.compile(r"\b(fitted|installed|put on|added|bought|got|swapped (in|to)?|upgraded to|new)\b", re.I)
_REMOVED = re.compile(r"\b(removed|took off|taken off|went back to stock|uninstalled)\b", re.I)
_FUEL_CHANGE = re.compile(r"\b(switch(ed)?|chang(ed|ing)|fill(ed)?( up)?|mov(ed|ing)|now on|using|tried)\b.*\bron\s*9[57]|\bron\s*9[57]\b.*\b(now|today|this tank)\b", re.I)
_TEACH = re.compile(r"\b(how|why|teach|explain|show|what|which|when)\b", re.I)
_FLASHED = re.compile(r"^\s*(i|we)?\s*(just )?(flashed|have flashed|reflashed)\b", re.I)

#: Vocabulary that marks a message as being about a car or tuning at all.
_DOMAIN = re.compile(
    r"\b(car|engine|boost|turbo|afr|mixture|lambda|fuel|ron|e10|petrol|knock|timing|ignition|spark|maf|afm|trim|log|drive|"
    r"map|ktuner|tunerview|flash|cvt|gear|heat|hot|slow|power|psi|intake|exhaust|downpipe|pipe|intercooler|iat|temp|oil|"
    r"sensor|gauge|table|slot|idle|rpm|speed|accel|civic|honda|wot|throttle|pull|lean|rich|misfire|vtc|cam|"
    r"injector|pressure|wastegate|stock|basemap|tune|dyno|hp|torque|xe|máy|xăng)",
    re.I,
)


def sort_intent(text: str) -> str:
    """`greeting`, `capabilities`, `capability`, `car-change`, `fuel-change`, `flashed`, `out-of-scope` or `question`."""
    words = text.strip()
    tokens = [t.lower() for t in _TOKEN.findall(words)]
    if not tokens:
        return "greeting"
    if _CAPABILITIES.search(words):
        return "capabilities"
    if all(t in _VAGUE for t in tokens):
        return "greeting"
    if _FLASHED.search(words):
        return "flashed"
    if _FUEL_CHANGE.search(words):
        return "fuel-change"
    parts = _parts_named(words)
    if parts and (_FITTED.search(words) or _REMOVED.search(words)) and not words.rstrip().endswith("?"):
        return "car-change"
    # "Can you raise boost?" is a question about the shop; "Can you teach me how to …" is a question for the tuner.
    if _CAN_YOU.search(words) and not _TEACH.search(words) and match_capability(words) is not None:
        return "capability"
    if not _DOMAIN.search(words) and len(tokens) >= 2:
        return "out-of-scope"
    return "question"


def _parts_named(text: str) -> list[str]:
    return list(P.draft_from_text(text, "")["fields"]["parts"])


def parts_draft(profile: Mapping[str, Any], fitted: list[str], removed: list[str]) -> dict[str, Any]:
    """The owner's car with these parts fitted and removed: a draft for the one car editor."""
    current = list((profile or {}).get("parts") or [])
    parts = [p for p in current if p not in removed] + [p for p in fitted if p not in current]
    changed = [p for p in fitted if p not in current] + [p for p in removed if p in current]
    return {"fields": {**dict(profile or {}), "parts": parts}, "filled": {"parts": True}, "missing": [], "prefilled": [], "changed": changed}


def part_change(text: str, profile: Mapping[str, Any]) -> dict[str, Any]:
    """The owner's car with the parts they just named fitted (or removed): a draft for the one car editor."""
    named = _parts_named(text)
    current = list((profile or {}).get("parts") or [])
    if _REMOVED.search(text):
        parts = [p for p in current if p not in named]
    else:
        parts = current + [p for p in named if p not in current]
    fields = {**dict(profile or {}), "parts": parts}
    return {"fields": fields, "filled": {"parts": True}, "missing": [], "prefilled": [], "changed": named}


# ---------------------------------------------------------------------------
# Where the car is: the stage and the Recap
# ---------------------------------------------------------------------------
def stage_of(loop: Mapping[str, Any]) -> str:
    """`car`, `baseline`, `read`, `plan` or `verify` — the same rule as the chat's sidebar (`phaseOf`)."""
    if not loop.get("carProfile"):
        return "car"
    if not loop.get("hasDrives"):
        return "baseline"
    rows = loop.get("carHistory") or []
    last_drive = max([r.get("start") or 0 for r in rows] or [0])
    last_flash = max([(f.get("flashed_at") or f.get("time") or 0) for f in loop.get("flashes") or []] or [0])
    if last_flash > last_drive:
        return "verify"
    if ((loop.get("flashPlan") or {}).get("kind")) in ("one-family", "undo"):
        return "plan"
    if any(s.get("key") == "baseline" for s in loop.get("openSteps") or []):
        return "baseline"
    return "read"


STAGE_WORDS = {
    "car": "We haven't met your car yet.",
    "baseline": "We're at the start: I need your first log, driven to the brief.",
    "read": "Your last log is read; the next drive settles what's open.",
    "plan": "A map change is ready for you to flash.",
    "verify": "You flashed a change: the next drive proves it.",
}


def car_line(profile: Mapping[str, Any] | None) -> str:
    profile = profile or {}
    return " · ".join(str(x) for x in (profile.get("model"), profile.get("transmission"), profile.get("fuel")) if x) or "Your car"


def recap(loop: Mapping[str, Any]) -> dict[str, Any] | None:
    """The Recap card: who, where we are, the last Drive, what is open, what waits for the owner. None with no car."""
    profile = loop.get("carProfile")
    if not profile:
        return None
    stage = stage_of(loop)
    rows = loop.get("carHistory") or []
    flashes = loop.get("flashes") or []
    active = loop.get("activeMapVersion") or {}
    parts = [P.part_display(p) for p in profile.get("parts") or []]
    last = rows[-1] if rows else None
    open_steps = [s for s in loop.get("openSteps") or [] if s.get("status") in (None, "open", "waiting", "cant-tell", "not-yet")] or list(loop.get("openSteps") or [])
    step = open_steps[0] if open_steps else None
    waiting = loop.get("unansweredQuestions") or []
    lines = []
    if last:
        lines.append({"label": "Last drive", "value": C.drive_stamp(last.get("id")) + (f" · {_verdict_word(last)}" if _verdict_word(last) else "")})
    lines.append({"label": "Drives in your car file", "value": str(len(rows))})
    if step:
        lines.append({"label": "Waiting on", "value": str(step.get("title") or step.get("key") or "")})
    if waiting:
        lines.append({"label": "Questions for you", "value": str(len(waiting))})
    return {
        "car": car_line(profile),
        "parts": ", ".join(parts) if parts else "no parts listed",
        "map": active.get("label") or profile.get("basemap") or "",
        "round": len(flashes) + 1,
        "stage": stage,
        "stageLine": STAGE_WORDS[stage],
        "lines": lines,
    }


def _verdict_word(row: Mapping[str, Any]) -> str:
    verdict = str(row.get("verdict") or row.get("overall") or "").lower()
    return {"ok": "OK", "watch": "Watch", "stop": "Stop", "nodata": "Can't tell", "cant-tell": "Can't tell"}.get(verdict, "")


# ---------------------------------------------------------------------------
# Suggested replies (D25): one primary for the stage, follow-ups from what was said
# ---------------------------------------------------------------------------
def chip(label: str, action: str, text: str | None = None, icon: str = "help") -> dict[str, Any]:
    out = {"label": label, "action": action, "icon": icon}
    if text:
        out["text"] = text
    return out


def stage_suggestions(loop: Mapping[str, Any]) -> list[dict[str, Any]]:
    """The stage's chips: what a shop would offer next. Deterministic, at most three."""
    stage = stage_of(loop)
    if stage == "car":
        return [
            chip("Use an example description", "example", icon="car"),
            chip("What can you do?", "send", "What can you do?", "help"),
        ]
    if stage == "baseline":
        return [
            chip("How should I log a drive?", "guide", icon="route"),
            chip("Attach my log", "attach", icon="paperclip"),
            chip("What can you do?", "send", "What can you do?", "help"),
        ]
    if stage == "plan":
        return [
            chip("Show my map change", "send", "Show me the change you planned and why.", "wrench"),
            chip("What if I don't flash it?", "send", "What happens if I don't flash the planned change?", "help"),
            chip("Attach my latest log", "attach", icon="paperclip"),
        ]
    if stage == "verify":
        return [
            chip("How do I drive the Shakedown?", "guide", icon="route"),
            chip("Attach my log", "attach", icon="paperclip"),
            chip("How do I undo it?", "send", "How do I undo the change I flashed?", "help"),
        ]
    return [
        chip("Attach my latest log", "attach", icon="paperclip"),
        chip("Is my knock control OK?", "send", "Is my knock control OK?", "gauge"),
        chip("Is RON97 worth it?", "send", "Is RON97 III worth it over RON95 III on my car?", "help"),
    ]


def answer_suggestions(loop: Mapping[str, Any], citations: list[Mapping[str, Any]] | None = None) -> list[dict[str, Any]]:
    """After a typed answer: the stage's primary, then follow-ups from the cards the answer leaned on."""
    out = [stage_suggestions(loop)[0]]
    follow = {
        "kc-heat-soak": chip("How do I log a cool drive?", "guide", icon="route"),
        "kc-fuel-test": chip("How do I run the fuel test?", "send", "How do I run the premium-fuel test?", "help"),
        "kc-table-maf": chip("Show the MAF table", "send", "Explain my MAF Scaling table with my values.", "wrench"),
        "kc-maf-wot-calibration": chip("What would you need to correct it?", "send", "What would you need from my log to correct the MAF at full throttle?", "help"),
        "kc-table-boost": chip("Why not more boost?", "send", "Why won't you raise my boost?", "help"),
        "kc-table-ignition": chip("How much timing am I losing?", "send", "How much timing is Knock Control pulling on my car?", "gauge"),
        "kc-ignition-formula": chip("How much timing am I losing?", "send", "How much timing is Knock Control pulling on my car?", "gauge"),
        "kc-open-loop-wot": chip("Is my car in open loop at full throttle?", "send", "Does my log show open loop at full throttle?", "help"),
    }
    for cite in citations or []:
        extra = follow.get(str(cite.get("id")))
        if extra and all(c["label"] != extra["label"] for c in out):
            out.append(extra)
        if len(out) >= 3:
            break
    for extra in stage_suggestions(loop)[1:]:
        if len(out) >= 3:
            break
        if all(c["label"] != extra["label"] for c in out):
            out.append(extra)
    return out[:3]


# ---------------------------------------------------------------------------
# The desk's replies
# ---------------------------------------------------------------------------
def reply(intent: str, text: str, loop: Mapping[str, Any]) -> dict[str, Any] | None:
    """The no-key front desk's answer, or None when the message is a question for the tuner.

    With a model, the chat graph's front agent (`chat.py`) does this job with tools; this is the
    fixed answer the app gives when no model is configured, and the shape the agent's answers share.
    """
    profile = loop.get("carProfile")
    stage = stage_of(loop)
    base = {"ok": True, "kind": "desk", "intent": intent, "citations": [], "window": None, "nextStep": None}

    if intent in ("greeting", "capabilities") and not profile:
        if intent == "capabilities":
            answer = capabilities_answer() + "\n\nTo start, **tell me about your car**: model, gearbox, fuel, where you drive, the parts you fitted and the KTuner map you flashed."
        else:
            answer = (
                "Hi! I'm your tuning shop in a chat. I read your TunerView logs, tell you if the engine is OK, and give you "
                "one safe change at a time to flash in KTuner — then the next log proves it.\n\n"
                "First, **which car are we tuning?** Tell me in your own words: model, gearbox, fuel, where you drive, the "
                "parts you fitted and which KTuner map you flashed. I'll fill your car profile here and keep it."
            )
        return {**base, "answer": answer, "suggestions": stage_suggestions(loop)}

    if intent == "greeting":
        card = recap(loop)
        hello = f"Welcome back. Here's your car and where we are. {STAGE_WORDS[stage]} What would you like to do today?"
        if stage == "baseline":
            hello = (
                f"Hi again. I have your **{car_line(profile)}** on file. Is that still right? If anything changed, "
                "tell me or edit it below. Next I need your first log: here's how to drive it."
            )
        return {**base, "answer": hello, "recap": card, "suggestions": stage_suggestions(loop), "guide": stage == "baseline"}

    if intent == "capabilities":
        return {**base, "answer": capabilities_answer(), "suggestions": stage_suggestions(loop)}

    if intent == "capability":
        cap = match_capability(text)
        if cap is None:
            return None
        # The can / can't line is always the app's own; the model's words may only lead into it.
        return {**base, "answer": capability_answer(cap), "capability": cap["id"], "suggestions": stage_suggestions(loop)}

    if intent == "car-change":
        if not profile:
            return None
        draft = part_change(text, profile)
        verb = "removed" if _REMOVED.search(text) else "fitted"
        if not draft["changed"]:
            return None
        named = ", ".join(P.part_display(p) for p in draft["changed"])
        answer = (
            f"Noted: {named} {verb}. Check your car below and save it: saving records the Install with today's date, so "
            "the drives after it are read against the car as it is now. A new part can change how the car breathes, so "
            "your next log should be a calm drive before any hard pulls."
        )
        return {**base, "kind": "car-edit", "answer": answer, "draft": draft, "suggestions": [
            chip("How should I log the next drive?", "guide", icon="route"),
        ]}

    if intent == "fuel-change":
        fuel = "E10 RON97 III" if re.search(r"ron\s*97", text, re.I) else "E10 RON95 III"
        answer = (
            f"Got it: **{fuel}** in the tank. When you attach the next log, tag it **{fuel}** (the fuel picker next to "
            "the attach button) so I never mix fuels. To see if premium is worth it, I compare matched drives on each "
            "fuel — both with hard pulls, intake within a few degrees — by Knock Control."
        )
        return {**base, "answer": answer, "suggestions": [
            chip("How do I run the fuel test?", "send", "How do I run the premium-fuel test?", "help"),
            chip("Attach my log", "attach", icon="paperclip"),
        ]}

    if intent == "flashed":
        plan = loop.get("flashPlan") or {}
        if (plan.get("kind")) in ("one-family", "undo"):
            answer = (
                "Great. Tap **I flashed it** on the map change card so I record the new Map version — I only credit a "
                "Flash you confirm there. Then drive the Shakedown: ten calm minutes, no hard driving, and attach the log."
            )
        else:
            answer = (
                "I don't have a planned change open, so I can't tell which map you flashed. If you flashed the KTuner "
                "basemap, use **Flash the basemap** in the sidebar; if it was your own edit, tell me what you changed. "
                "Either way, your next log is read against what you tell me."
            )
        return {**base, "answer": answer, "suggestions": stage_suggestions(loop)}

    if intent == "out-of-scope":
        return {
            **base,
            "answer": "That's outside what I do: I'm a tuning shop for your car. I can read your logs, explain your map, and give you one safe change at a time.",
            "suggestions": stage_suggestions(loop),
        }
    return None


__all__ = [
    "CAPABILITIES", "answer_suggestions", "capabilities_answer", "capability_answer", "capability_lines", "car_line",
    "match_capability", "part_change", "parts_draft", "recap", "reply", "sort_intent", "stage_of", "stage_suggestions",
]

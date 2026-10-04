"""The LLM agent: an explainer with read-only engine tools (ticket 08).

The reply's decisions — the Verdict, the settled Open steps, the one Next step
and the Flash plan — are the engine's, made before this node runs. The model
only chooses what to look at and how to explain it, through fixed tools: the
drive tools read the Node worker (`server/kta_worker/worker.js`), and
`search_knowledge` reads the knowledge cards (`knowledge/cards/`). Claims the
drive tools do not say must cite a card id, checked by `verify.py`. It cannot
add, remove or change the Next step.

Provider: any OpenAI-compatible endpoint from `.env` (base URL, key, model;
TokenHarbor for testing). The key stays server-side — it only ever rides an
`Authorization` header from here to the provider — and the model never sees a
raw log: every tool returns compact summaries, never rows.

Nothing the model says reaches the owner unchecked: `verify.py` judges every
draft deterministically (numbers, the one action, Flash plan cells, banned
advice in English and Vietnamese). A failed draft gets one repair turn; a
second failure falls back to the built-in reply. The model's own thinking, when
the provider returns it, is kept apart as a collapsed block labelled
"unchecked", never mixed into the harness steps.

With no key configured this node is a no-op and the loop is byte-identical to
the built-in path.
"""

from __future__ import annotations

import json
import re
from typing import Any, Awaitable, Callable, Mapping

import httpx

from . import verify as V
from . import knowledge as K
from . import pictures as PIC
from . import tour as TOUR
from .harness import Harness

#: How many provider calls one run may spend, tools and repair included.
MAX_CALLS = 12

Message = dict[str, Any]
#: `async (messages, tools) -> response_json`. Overridden in tests with a
#: scripted fake so no test needs a network or a key.
LlmCaller = Callable[[list[Message], list[dict[str, Any]]], Awaitable[dict[str, Any]]]


def _params(properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
    return {"type": "object", "properties": properties, "required": required, "additionalProperties": False}


def TOOLS() -> list[dict[str, Any]]:
    """The fixed tool list: read-only, summaries only, one terminal call."""

    def fn(name: str, description: str, properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {"name": name, "description": description, "parameters": _params(properties, required)},
        }

    return [
        fn(
            "get_overview",
            "This Drive's verdict, every safety check and the ranked action list. Read it first.",
            {}, [],
        ),
        fn(
            "get_drive_facts",
            "Every number of this Drive as flat facts. Use it for the exact figures the reply quotes.",
            {}, [],
        ),
        fn(
            "get_insight",
            "Numbers for one topic of this Drive. Call it for each topic the reply touches.",
            {"topic": {"type": "string", "enum": ["knock", "lugging", "heat", "mixture", "boost", "trims", "accel", "quality"]}},
            ["topic"],
        ),
        fn(
            "get_channel_stats",
            "Percentiles of one logged channel over part of the Drive. Only when the insights do not answer.",
            {
                "channel": {"type": "string", "description": "A channel name, for example knock_control, rpm, iat_c."},
                "where": {"type": "string", "enum": ["all", "moving", "under_boost", "lugging", "standstill"]},
            },
            ["channel", "where"],
        ),
        fn(
            "get_timing_cell",
            "Median ignition advance and knock retard in the timing-map cell holding this rpm and manifold pressure.",
            {"rpm": {"type": "number"}, "map_psi": {"type": "number", "description": "Manifold pressure, psi gauge."}},
            ["rpm", "map_psi"],
        ),
        fn(
            "get_pull",
            "One boost event (pull): rpm and speed range, peak boost and target, wastegate, intake air, mixture, timing.",
            {"index": {"type": "integer", "description": "0-based index into the Drive's pulls."}},
            ["index"],
        ),
        fn(
            "get_car_history",
            "The remembered Car history this reply was read against: its Drives, the Baseline and Flashes.",
            {}, [],
        ),
        fn(
            "get_open_steps",
            "The Open steps still waiting for the Drive that proves them, each with its status and reason.",
            {}, [],
        ),
        fn(
            "get_next_step",
            "The decided Next step for this Drive: the one step the reply must name, and the Drive that settles it.",
            {}, [],
        ),
        fn(
            "get_flash_plan",
            "The one Flash plan this Car history supports: its headline, its cells with exact values, and the boost ceiling.",
            {}, [],
        ),
        fn(
            "get_map_cell",
            "One value of the Map version this Drive ran on, by table, row and column. Read-only.",
            {
                "table": {"type": "string", "description": "The table id, for example Boost_Target_1_Normal_L."},
                "row": {"type": "integer"},
                "col": {"type": "integer"},
            },
            ["table", "row", "col"],
        ),
        fn(
            "get_health_report",
            "The shop's report for this Drive: every health check the engine ran (fuel, air & boost, spark, heat, CVT) "
            "with value and verdict, and whether the log met the drive brief (checkpoints). Start a Drive reply here.",
            {},
            [],
        ),
        fn(
            "get_map_tour",
            "Every KTuner table family on this car in the order a tuner works (airflow, mixture, boost, ignition, "
            "knock, basemap): what it does, its tables, and its status this round — this-round (the Flash plan changes it), "
            "locked (why, and what unlocks it), fine, or read-only. Use it to explain what you would change and why, at a high level.",
            {},
            [],
        ),
        fn(
            "get_map_table",
            "Read one whole table of the Map version on the car: rpm axis, load columns, every value, min and max, "
            "and the row nearest an rpm. Use it to teach what a table does with the owner's real numbers. Read-only: "
            "a change only ever comes from the Flash plan.",
            {
                "table": {"type": "string", "description": "The table id as the map data spells it, for example WOT_Enrich_L or Ignition_Base_H."},
                "rpm": {"type": "number", "description": "Optional rpm to pick out one row."},
            },
            ["table"],
        ),
        fn(
            "get_fuel_test",
            "Is the premium fuel (E10 RON97 III) worth it over E10 RON95 III on this car? The engine pairs Drives tagged with "
            "each fuel that both had hard pulls, intake within 8 °C, same map slot, and compares Knock Control and the timing it "
            "costs. Comes with the card on how to run the test.",
            {},
            [],
        ),
        fn(
            "propose_knowledge",
            "When you need a fact that no knowledge card holds, do NOT state it as fact. Propose it here for the "
            "knowledge base instead (a reviewer checks and sources it before it can be cited), and tell the owner "
            "you've noted it to check.",
            {
                "title": {"type": "string", "description": "The fact as one short sentence."},
                "claim": {"type": "string", "description": "What you would say, in under 120 words."},
                "why": {"type": "string", "description": "Why the owner needed it: the question or the Drive."},
                "source_hint": {"type": "string", "description": "Where a reviewer could confirm it (a doc, a KTuner help page), if you know."},
            },
            ["title", "claim", "why"],
        ),
        fn(
            "search_knowledge",
            "General knowledge about this car: what is normal, what owners report, where things live in KTuner. "
            "Cite the card id in brackets for any claim the Drive tools do not say.",
            {
                "query": {"type": "string", "description": "What to look up, for example knock control timing cost."},
                "topics": {"type": "array", "items": {"type": "string"}, "description": "Optional topics, for example heat."},
                "kind": {"type": "string", "description": "Optional kind: fact, rule, play, owner-question or ktuner-howto."},
            },
            ["query"],
        ),
        fn(
            "show_chart",
            "Pick ONE picture that answers this reply's question. The app draws it from the engine's data; you only choose the kind. "
            "trace: a channel around a Key moment. baseline: this Drive against the Baseline. proof: before and after bars for the step "
            "this Drive settled. maf_gap: the MAF Scaling curve and the planned change. map_grid: the Flash plan's cells (only when the Next step is a Flash). "
            "Every number it returns in numbers_to_say must also be in your prose.",
            {
                "kind": {"type": "string", "enum": list(PIC.KINDS)},
                "moment": {"type": "integer", "description": "For trace only: which Key moment, 0 first."},
            },
            ["kind"],
        ),
        fn(
            "submit_reply",
            "Call once, last, with the final reply. The app checks every number, the step, every cell and every advice line.",
            {
                "prose": {"type": "string", "description": "The reply for the owner: plain words, short paragraphs and bullet lists in markdown, under 280 words."},
                "action_key": {"type": "string", "description": "The decided Next step's key, exactly as get_next_step names it."},
                "cells": {
                    "type": "array",
                    "description": "Flash plan cells the prose names, if any. Empty when the plan holds no change.",
                    "items": _params(
                        {
                            "table": {"type": "string"},
                            "row": {"type": "integer"},
                            "col": {"type": "integer"},
                            "before": {"type": ["number", "null"]},
                            "after": {"type": ["number", "null"]},
                        },
                        ["table", "row", "col"],
                    ),
                },
            },
            ["prose", "action_key"],
        ),
    ]


def car_sentence(car: Mapping[str, Any] | None) -> str:
    """The customer's car as the Car file holds it (tuning-shop D21) — never assumed."""
    if not car:
        return (
            "The customer has not told you their car yet. Do not assume a model, fuel or parts: answer in general, "
            "and ask them to tell you their car (model, gearbox, fuel, parts, KTuner map)."
        )
    parts = ", ".join(str(p).replace("-", " ") for p in car.get("parts") or []) or "no parts listed"
    bits = [str(car.get(k)) for k in ("model", "engine", "transmission") if car.get(k)]
    return (
        f"The customer owns one car: {' '.join(bits) or 'a car'} on {car.get('fuel') or 'unknown fuel'}"
        f"{', driven in ' + str(car['climate']) if car.get('climate') else ''}, KTuner map \"{car.get('basemap') or 'unknown'}\", "
        f"with {parts}."
    )


def system_prompt(
    drive: Mapping[str, Any], reply: Mapping[str, Any], question: str | None = None, car: Mapping[str, Any] | None = None,
) -> str:
    """The tuner at the shop: orchestrates the tools and teaches; the engine and the map checks decide."""
    from . import desk as D

    step = reply.get("nextStep") or {}
    plan = reply.get("flashPlan") or {}
    cells = V.plan_cells(plan)
    if cells:
        plan_line = plan.get("headline", "") + f" ({len(cells)} cells, ceiling {plan.get('ceilingPsi')} psi)"
    else:
        plan_line = str(plan.get("headline") or "Your logs support no map change right now.")
    task = (
        "The owner asked a question in the chat. Answer it like a tuner teaching a customer: what the thing is, what it "
        "is on THEIR car (read it with the tools), what would change if they changed it and why it matters, the risk, "
        "and what you would do. Then tie it back to the one Next step."
        if question
        else
        "The owner just uploaded a Drive. Write the shop's reply: (1) the verdict sentence, (2) what you checked and the "
        "findings that matter, with their numbers (call get_health_report), (3) at a high level which table families "
        "this round changes or doesn't and why, in the tuner's order (call get_map_tour; airflow, then mixture, then "
        "boost; ignition is read-only), (4) the one Next step and exactly which drive to log, (5) one line inviting "
        "questions, offering two the owner might ask."
    )
    return "\n".join(
        [
            "You are the tuner at a tuning shop that works over chat. " + car_sentence(car) + " They tune on the street "
            "without a dyno, flash with KTuner, log with TunerView, and want the map fitted to their car without hurting the "
            "engine or the gearbox. Like any shop, you never expect the first change to be the last one: every round is "
            "proved by the next log.",
            "What the shop can, can't, and isn't sure it can do. Say so plainly when asked for something outside it, and "
            "point the owner to what you can do instead. When you are not sure, say you are not sure:",
            *D.capability_lines(),
            "You orchestrate: decide which tools to call and in what order, reason from what they return, and write the "
            "answer. The engine has already read the whole log; the verdict, the Next step and every map cell are the "
            "engine's and the map checks', not yours. Rules:",
            "1. Take every number from the tools. Quote numbers as the tools return them (rounding is fine). Do not compute new "
            "numbers: no differences, sums, averages or percentages of your own.",
            (
                f"2. Name exactly one Next step: {step.get('title')} (key: {step.get('key')}). Never add, remove or "
                f"change it. The drive whose upload settles it: {step.get('uploadWhen') or ''}"
                if step.get("key")
                else "2. There is no Next step yet (no Drive read). Name none; submit with an empty action_key. "
                "If the owner needs a next move, it is the drive brief: log one Cool drive with 2 pulls."
            ),
            "3. Name only Flash plan cells, with the plan's exact values. You may READ and explain any table with "
            "get_map_table, but never propose a value for a table the plan doesn't change.",
            "4. Never suggest lowering knock sensitivity, adding ignition timing, raising boost, or editing an AFM/MAF curve "
            "by hand. If asked, explain why the shop won't (cite the card) and what would unlock it.",
            "5. Write in English, plain words for a car owner. Markdown: short paragraphs, bullet lists, **bold** for the "
            "one thing that matters. No tables (the app draws them). Under 280 words. "
            + (
                "Open by answering the owner's question directly in your own words. This checked note may help, use it "
                f"only if it answers what they asked: {reply.get('say')}"
                if question
                else f"Start with this sentence: {reply.get('say')}"
            ),
            f"The Flash plan this round: {plan_line}",
            "6. Finish by calling submit_reply once with your prose and the decided step's key. The app checks every number, "
            "the step, every cell and every advice line before the owner sees them; a rejected draft gets one repair.",
            "7. Every claim the tools don't say — what is normal on this car, what a table does, how tuners work — must come "
            "from search_knowledge, cited by card id in brackets at the end of the sentence, for example [kc-ranges]. If no "
            "card holds it, call propose_knowledge and say you've noted it to check; never state it as fact.",
            "8. A picture is optional: at most one, chosen with show_chart, only when it answers better than a sentence. "
            "Say every number it prints in your prose. Never read numbers off a screenshot: quote tool numbers only.",
            "Your task: " + task,
        ]
    )


def _car_of(store: Any) -> Mapping[str, Any] | None:
    try:
        return store.car_profile() if hasattr(store, "car_profile") else None
    except Exception:  # noqa: BLE001 - a missing profile only costs the car sentence
        return None


def seed_facts(drive: Mapping[str, Any], reply: Mapping[str, Any], limits: Mapping[str, Any]) -> list[float]:
    """Numbers the built-in reply could already say: the model may reuse them."""
    facts: list[float] = []
    V.collect_numbers(drive.get("summary"), facts)
    V.collect_numbers((drive.get("map") or {}).get("version"), facts)
    V.collect_numbers(reply.get("nextStep"), facts)
    V.collect_numbers(reply.get("flashPlan"), facts)
    V.collect_numbers(limits, facts)
    V.collect_numbers([reply.get("say"), reply.get("window")], facts)
    return facts


# ---------------------------------------------------------------------------
# Tool execution: every call streams as a harness step with inputs and outputs
# ---------------------------------------------------------------------------
async def _run_tool(
    harness: Harness,
    config: Any,
    worker: Any,
    store: Any,
    drive_id: str,
    map_tables: dict[str, Any],
    decided: Mapping[str, Any],
    plan: Mapping[str, Any] | None,
    name: str,
    args: Mapping[str, Any],
) -> Any:
    """Run one model-requested tool. Summaries only; the raw log never leaves."""
    if name == "get_overview":
        return await harness.step(
            config, "overview", "Explain: this Drive's safety lines",
            {"driveId": drive_id},
            lambda: worker.call("overview", driveId=drive_id),
        )
    if name == "get_drive_facts":
        return await harness.step(
            config, "driveFacts", "Explain: this Drive's numbers",
            {"driveId": drive_id},
            lambda: worker.call("driveFacts", driveId=drive_id),
        )
    if name == "get_insight":
        return await harness.step(
            config, "insight", f"Explain: {args.get('topic')} numbers",
            {"driveId": drive_id, "topic": args.get("topic")},
            lambda: worker.call("insight", driveId=drive_id, topic=args.get("topic")),
        )
    if name == "get_channel_stats":
        return await harness.step(
            config, "channelStats", "Explain: a channel over part of the Drive",
            {"driveId": drive_id, "channel": args.get("channel"), "where": args.get("where") or "all"},
            lambda: worker.call(
                "channelStats", driveId=drive_id, channel=args.get("channel"), where=args.get("where") or "all"
            ),
        )
    if name == "get_timing_cell":
        return await harness.step(
            config, "timingCell", "Explain: one timing-map cell",
            {"driveId": drive_id, "rpm": args.get("rpm"), "map_psi": args.get("map_psi")},
            lambda: worker.call("timingCell", driveId=drive_id, rpm=args.get("rpm"), map_psi=args.get("map_psi")),
        )
    if name == "get_pull":
        return await harness.step(
            config, "pull", "Explain: one pull",
            {"driveId": drive_id, "index": args.get("index")},
            lambda: worker.call("pull", driveId=drive_id, index=args.get("index")),
        )
    if name == "get_car_history":
        state = store.car_state(None) or {}
        installs = store.list_installs() if hasattr(store, "list_installs") else []
        return await harness.step(
            config, "carHistory", "Explain: the Car history window",
            {"through": drive_id},
            lambda: worker.call("carHistory", state=state, installs=installs),
        )
    if name == "get_open_steps":
        return await harness.step(
            config, "openSteps", "Explain: the Open steps",
            {},
            _wrap(store.list_open_steps()),
        )
    if name == "get_next_step":
        return await harness.step(
            config, "nextStep", "Explain: the decided Next step",
            {"driveId": drive_id},
            _wrap(decided),
        )
    if name == "get_flash_plan":
        return await harness.step(
            config, "flashPlan", "Explain: the Flash plan",
            {"through": drive_id},
            _wrap(plan),
        )
    if name == "get_map_cell":
        return await harness.step(
            config, "mapCell", "Explain: one map value",
            {"table": args.get("table"), "row": args.get("row"), "col": args.get("col")},
            _wrap(_map_cell(map_tables, args)),
        )
    if name == "search_knowledge":
        query = str(args.get("query") or "")
        topics = args.get("topics")
        kind = args.get("kind")
        shown: dict[str, Any] = {"query": query}
        if topics:
            shown["topics"] = topics
        if kind:
            shown["kind"] = kind
        return await harness.step(
            config, "knowledge", "Explain: what is normal on this car",
            shown,
            _wrap(K.search(query, topics if isinstance(topics, list) else None, kind if isinstance(kind, str) else None)),
        )
    raise KeyError(f"Unknown tool {name}")


def _wrap(value: Any) -> Any:
    async def call() -> Any:
        return value

    return call


def _map_cell(tables: Mapping[str, Any], args: Mapping[str, Any]) -> dict[str, Any]:
    table = tables.get(str(args.get("table")))
    if not isinstance(table, Mapping):
        return {"error": f"There is no table named {args.get('table')!r} on this Map version."}
    values = table.get("values")
    try:
        row, col = int(args.get("row")), int(args.get("col"))
    except (TypeError, ValueError):
        return {"error": "row and col must be integers."}
    if not isinstance(values, list) or not (0 <= row < len(values)) or not isinstance(values[row], list) or not (0 <= col < len(values[row])):
        return {"error": f"Cell row {args.get('row')} col {args.get('col')} is outside {args.get('table')!r}."}
    return {"table": args.get("table"), "row": row, "col": col, "value": values[row][col]}


# ---------------------------------------------------------------------------
# The provider call (OpenAI-compatible) and thinking extraction
# ---------------------------------------------------------------------------
async def _post_chat(settings: Any, messages: list[Message], tools: list[dict[str, Any]]) -> dict[str, Any]:
    base = str(settings.llm_base_url or "").rstrip("/")
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{base}/chat/completions",
            headers={"authorization": f"Bearer {settings.llm_api_key}", "content-type": "application/json"},
            json={"model": settings.llm_model, "messages": messages, "tools": tools, "tool_choice": "auto"},
        )
        response.raise_for_status()
        return response.json()


def _message_of(response: dict[str, Any]) -> dict[str, Any]:
    choices = response.get("choices") or []
    if not choices:
        raise ValueError("The model returned no choices.")
    return dict(choices[0].get("message") or {})


def extract_thinking(message: Mapping[str, Any]) -> str | None:
    """The model's own thinking, kept apart and labelled unchecked downstream."""
    parts: list[str] = []
    for key in ("reasoning_content", "thinking"):
        value = message.get(key)
        if isinstance(value, str) and value.strip():
            parts.append(value.strip())
        elif isinstance(value, list):
            for block in value:
                text = block.get("thinking") if isinstance(block, Mapping) else None
                if text:
                    parts.append(str(text).strip())
    content = message.get("content") or ""
    for match in re.finditer(r"<think>(.*?)</think>", str(content), re.DOTALL):
        if match.group(1).strip():
            parts.append(match.group(1).strip())
    return "\n\n".join(parts) or None


def strip_thinking(content: Any) -> Any:
    """Thinking tags are shown in their own block, never inside the prose."""
    if not isinstance(content, str):
        return content
    return re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL)


def _tool_calls_of(message: Mapping[str, Any]) -> list[dict[str, Any]]:
    out = []
    for call in message.get("tool_calls") or []:
        fn = (call.get("function") or {}) if isinstance(call, Mapping) else {}
        raw_args = fn.get("arguments")
        if isinstance(raw_args, str):
            try:
                parsed = json.loads(raw_args) if raw_args.strip() else {}
            except ValueError:
                parsed = {"_unparseable": raw_args}
        else:
            parsed = dict(raw_args or {})
        out.append({"id": call.get("id"), "name": fn.get("name"), "args": parsed})
    return out


# ---------------------------------------------------------------------------
# The loop: tools, then one checked draft; one repair turn, then fallback
# ---------------------------------------------------------------------------
async def run_agent(
    drive: Mapping[str, Any],
    reply: Mapping[str, Any],
    worker: Any,
    store: Any,
    settings: Any,
    harness: Harness,
    config: Any,
    llm_caller: LlmCaller | None = None,
    question: str | None = None,
    image: str | None = None,
) -> dict[str, Any]:
    """Explain the decided reply (or, with `question`, answer the owner's typed question about it). Never raises: failures come back as fallback."""
    facts = seed_facts(drive, reply, worker.limits if getattr(worker, "limits", None) else {})
    from . import desk as D

    facts.extend(V.collect_numbers(D.capability_lines()))  # the shop's own can / can't lines may be quoted
    decided = reply.get("nextStep") or {}
    plan = reply.get("flashPlan")

    drive_id = str(drive.get("id") or "")
    map_tables: dict[str, Any] = {}
    try:
        version = (drive.get("map") or {}).get("version")
        held = store.map_version(version) if version is not None else None
        if held and held.get("tables"):
            map_tables = held["tables"]
    except Exception:  # noqa: BLE001 - a missing table store only costs the map tool
        map_tables = {}
    if not map_tables:
        # A typed question has no Drive map: read the Map version the plan is written on (the car's active one).
        try:
            map_tables = dict(PIC._tables(store, plan))
        except Exception:  # noqa: BLE001
            map_tables = {}

    tools = TOOLS()
    ask = (
        f"The owner asks: {question}\nAnswer that question first, from the tools and cards."
        if question
        else "Explain this Drive's reply to its owner."
    )
    messages: list[Message] = [
        {"role": "system", "content": system_prompt(drive, reply, question, _car_of(store))},
        # A screenshot rides only in the user turn, as a data URL; the model may look at it but may quote only tool numbers.
        {"role": "user", "content": [{"type": "text", "text": ask}, {"type": "image_url", "image_url": {"url": image}}] if image else ask},
    ]
    pictures: list[dict[str, Any]] = []
    caller = llm_caller or (lambda msgs, tls: _post_chat(settings, msgs, tls))
    thinking: list[str] = []
    calls = 0
    repairs = 0
    seen_cards: dict[str, Any] = {}

    def fail(reason: str, issues: list[str]) -> dict[str, Any]:
        return {
            "pictures": [],
            "prose": None,
            "thinking": "\n\n".join(thinking) or None,
            "verified": False,
            "repaired": repairs > 0,
            "fallback": reason,
            "issues": issues,
            "llm_calls": calls,
            "citations": [],
        }

    while True:
        if calls >= MAX_CALLS:
            return fail("turns", ["The model did not finish within its tool budget."])
        try:
            response = await caller(messages, tools)
            message = _message_of(response)
        except Exception as exc:  # noqa: BLE001 - any provider failure is the fallback, never a crash
            return fail("error", [f"The model call failed: {exc}"])
        calls += 1

        thought = extract_thinking(message)
        if thought:
            thinking.append(thought)
        # Assistant turns go back unchanged, thinking blocks included.
        messages.append({"role": "assistant", "content": strip_thinking(message.get("content")), "tool_calls": message.get("tool_calls")})

        calls_to_make = _tool_calls_of(message)
        submitted = None
        results = []
        for call in calls_to_make:
            if call["name"] == "submit_reply":
                submitted = call
                continue
            if call["name"] in SHOP_TOOLS:
                output = await _shop_tool(call["name"], call["args"], reply, plan, map_tables, harness, config, worker, store)
                facts.extend(V.collect_numbers(output))
                # The table cards the tour and the table reader point to come with their text: read, so citable.
                for card in (output.get("cards") or []) if isinstance(output, Mapping) else []:
                    seen_cards[str(card["id"])] = card
                results.append({"tool_call_id": call["id"], "role": "tool", "name": call["name"], "content": _slim_json(output)})
                continue
            if call["name"] == "show_chart":
                shown = await _show_chart(call["args"], pictures, worker, store, drive_id, decided, plan)
                facts.extend(V.collect_numbers(shown.get("numbers_to_say")))
                results.append({"tool_call_id": call["id"], "role": "tool", "name": "show_chart", "content": _slim_json(shown)})
                continue
            try:
                output = await _run_tool(harness, config, worker, store, drive_id, map_tables, decided, plan, call["name"], call["args"])
                if call["name"] == "search_knowledge":
                    for card in output if isinstance(output, list) else []:
                        if isinstance(card, Mapping) and card.get("id"):
                            seen_cards[str(card["id"])] = card
                else:
                    facts.extend(V.collect_numbers(output))
                results.append({"tool_call_id": call["id"], "role": "tool", "name": call["name"], "content": _slim_json(output)})
            except KeyError:
                results.append({"tool_call_id": call["id"], "role": "tool", "name": call["name"], "content": f"Unknown tool {call['name']}"})
            except Exception as exc:  # noqa: BLE001 - an engine tool error is a tool result, like the browser path
                results.append({"tool_call_id": call["id"], "role": "tool", "name": call["name"], "content": f"Tool failed: {exc}"})
        if submitted is not None:
            args = submitted["args"] if isinstance(submitted["args"], Mapping) else {}
            action_key = args.get("action_key")
            if isinstance(action_key, str) and action_key.strip().lower() in ("", "none", "null", "nothing"):
                action_key = None  # "no step" spelled as a word is still no step
            verdict = V.verify(
                str(args.get("prose") or ""),
                action_key,
                decided.get("key"),
                facts,
                plan,
                args.get("cells") or [],
                knowledge=list(seen_cards.values()),
                pictures=pictures,
                question=bool(question),
            )
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": submitted["id"],
                    "content": "Checked: the reply passes."
                    if verdict["ok"]
                    else "Rejected by the verify step. Fix these, then call submit_reply again:\n- " + "\n- ".join(verdict["issues"]),
                }
            )
            if verdict["ok"]:
                prose = str(args.get("prose") or "")
                return {
                    "pictures": list(pictures),
                    "prose": prose,
                    "thinking": "\n\n".join(thinking) or None,
                    "verified": True,
                    "repaired": repairs > 0,
                    "fallback": None,
                    "issues": [],
                    "llm_calls": calls,
                    "citations": [
                        {"id": cid, "title": str((seen_cards.get(cid) or {}).get("title") or cid)}
                        for cid in sorted(V.citation_ids(prose))
                        if cid in seen_cards
                    ],
                }
            if repairs >= 1:
                return fail("unverified", verdict["issues"])
            repairs += 1
            continue
        if results:
            messages.extend(results)
            continue
        # Plain-text finish: checked like any draft, with no step named.
        text = (strip_thinking(message.get("content")) or "").strip()
        if not text:
            return fail("empty", ["The model returned no text and no tool calls."])
        verdict = V.verify(
            text, None, decided.get("key"), facts, plan, [], knowledge=list(seen_cards.values()), pictures=pictures,
            question=bool(question),
        )
        if verdict["ok"]:  # pragma: no cover - plain text never names the step key
            return {
                "prose": text,
                "thinking": "\n\n".join(thinking) or None,
                "verified": True,
                "repaired": repairs > 0,
                "fallback": None,
                "issues": [],
                "llm_calls": calls,
            }
        if repairs >= 1:
            return fail("unverified", verdict["issues"])
        repairs += 1
        messages.append(
            {
                "role": "user",
                "content": "Rejected by the verify step:\n- "
                + "\n- ".join(verdict["issues"])
                + "\nUse the tools, quote their numbers, name the decided step, and finish with submit_reply.",
            }
        )


SHOP_TOOLS = ("get_health_report", "get_map_tour", "get_map_table", "get_fuel_test", "propose_knowledge")


async def _shop_tool(
    name: str, args: Mapping[str, Any], reply: Mapping[str, Any], plan: Mapping[str, Any] | None,
    map_tables: Mapping[str, Any], harness: Harness, config: Any, worker: Any = None, store: Any = None,
) -> Any:
    """The tuning-shop tools: the report, the map tour, a whole table, a knowledge proposal. Read-only on the car."""
    args = args if isinstance(args, Mapping) else {}
    if name == "get_health_report":
        report = {
            "health": reply.get("health"),
            "checkpoints": reply.get("checkpoints"),
            "numbers": reply.get("numbers"),
            "cause": reply.get("cause"),
        }
        return await harness.step(config, "healthReport", "Read the health report and the log checkpoints", {}, _wrap(report))
    if name == "get_map_tour":
        tour = dict(reply.get("tour") or TOUR.map_tour(plan, map_tables))
        tour["cards"] = _cards_for([f.get("card") for f in tour.get("families") or []])
        return await harness.step(config, "mapTour", "Walk the map, table family by family", {}, _wrap(tour))
    if name == "get_map_table":
        table = str(args.get("table") or "")
        rpm = args.get("rpm") if isinstance(args.get("rpm"), (int, float)) else None
        read = TOUR.read_table(map_tables, table, rpm)
        read["cards"] = _cards_for([read.get("card")])
        return await harness.step(
            config, "mapTable", f"Read {table or 'a table'}", {"table": table, **({"rpm": rpm} if rpm is not None else {})},
            _wrap(read),
        )
    if name == "get_fuel_test":
        async def run() -> Any:
            test = await worker.call("fuelTest", state=store.car_state(None) or {}, tags=store.drive_tags())
            from . import copy as C

            return {**test, "line": C.fuel_test_line(test), "cards": _cards_for(["kc-fuel-test"])}
        return await harness.step(config, "fuelTest", "Compare the fuels on matched drives", {}, run)
    proposal = K.propose(
        str(args.get("title") or ""), str(args.get("claim") or ""), str(args.get("why") or ""), str(args.get("source_hint") or "")
    )
    return await harness.step(config, "proposeKnowledge", "Note a new fact for review", {"title": args.get("title")}, _wrap(proposal))


def _cards_for(ids: list[Any]) -> list[dict[str, Any]]:
    """The knowledge cards a tool output points to, with their text, once each."""
    out, seen = [], set()
    for cid in ids:
        if not cid or cid in seen:
            continue
        seen.add(cid)
        card = K.get(str(cid))
        if card:
            out.append({"id": card["id"], "title": card.get("title"), "body": card.get("body"), "numbers": card.get("numbers")})
    return out


async def _show_chart(
    args: Mapping[str, Any], pictures: list[dict[str, Any]], worker: Any, store: Any, drive_id: str,
    decided: Mapping[str, Any], plan: Mapping[str, Any] | None,
) -> dict[str, Any]:
    """Draw one picture of the kind the model chose. One per reply, plus the map grid on a Flash step."""
    kind = str(args.get("kind") or "")
    if kind not in PIC.KINDS:
        return {"error": f"Pick one of: {', '.join(PIC.KINDS)}."}
    flash = (decided or {}).get("kind") == "flash"
    if kind == "map_grid" and not flash:
        return {"error": "The map grid is only drawn when the Next step is a Flash."}
    extra = [p for p in pictures if p.get("kind") != "map_grid"]
    if kind != "map_grid" and extra:
        return {"error": "One picture per reply: you already chose one."}
    if any(p.get("kind") == kind for p in pictures):
        return {"error": f"The {kind} picture is already on this reply."}
    car_state = store.car_state(None) or {}
    pic = await PIC.build(kind, worker, store, drive_id, car_state, plan, args.get("moment"))
    pictures.append(pic)
    return PIC.summary_for_model(pic)


def _slim_json(value: Any) -> str:
    text = json.dumps(value, default=str)
    return text if len(text) <= 8000 else text[:8000] + "\u2026"


__all__ = ["LlmCaller", "MAX_CALLS", "TOOLS", "extract_thinking", "run_agent", "seed_facts", "strip_thinking", "system_prompt"]

"""Eval layers 2 and 3: the model scorecard and the clarity judge (ticket 16).

Layer 2 replays the owner's nine real Drives plus a small set of no-upload
questions through each listed model and reports, per model, the share of
replies that pass verify first time, after repair, and that fall back — broken
down by failure class (wrong number, wrong cell, uncited claim, wrong action,
banned advice). Layer 3 is the clarity judge: an LLM judge scores each reply
for one action, plain words and naming the drive to log; a sample is written
out for the owner to grade, and judge/owner agreement is reported.

Run on demand only, with the key from `.env` (never committed):

    cd server && KTA_SCORECARD=1 uv run python -m kta_server.scorecard

With no key (or without `KTA_SCORECARD=1`) it prints one skip line and exits
0: nothing here runs in the default test run and nothing touches the network
without the key. Results land in `server/eval-results/<date>/<model>.json`
plus a `<date>/summary.json`, so runs compare by diffing files.

The model list is `KTA_LLM_MODELS` (config); the no-config default is the free
model the ticket names, and a paid id after the comma completes the comparison
set (ADR 0004 §Configuration; no paid id is pinned in the repo, so none is
invented here).

The no-upload questions run through a local stand-in, not ticket 11's seam:
one provider call over the drive window plus retrieved knowledge cards, judged
by the same `verify` (numbers, citations, banned advice — no decided step, no
cells). Ticket 11 replaces this stand-in when it lands.

The first draft's issues come from the provider transcript itself: the
scorecard wraps the model call (the ticket-08 `llm_caller` seam — a scripted
fake in tests, the real endpoint live) and reads back the first submitted
draft plus the first "Rejected by the verify step" message. No app, graph or
agent change: the transcript formats it relies on are locked by the tests here,
so a format change fails loudly instead of drifting silently.
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import datetime
import json
import os
import re
import tempfile
import uuid
import zlib
from dataclasses import replace
from pathlib import Path
from typing import Any, Awaitable, Callable, Mapping, Sequence

import httpx

ROOT = Path(__file__).resolve().parents[2]

#: The free model the ticket names. A paid id after the comma in
#: `KTA_LLM_MODELS` completes the comparison set; nothing here invents one.
DEFAULT_MODELS: tuple[str, ...] = ("qwen3.8-flash:free",)

#: Gate for everything keyed or slow here (tests and the runner alike).
SCORECARD_ENV_VAR = "KTA_SCORECARD"

#: The owner's nine real Drives, in the order she drove them. Mirrors
#: `server/tests/seam1/conftest.py::OWNER_DRIVES` (the loop eval's replay).
OWNER_DRIVES: tuple[tuple[str, str], ...] = (
    ("aug22-0903", "TunerView_20260822_090322.csv"),
    ("aug22-0950", "TunerView_20260822_095021.csv"),
    ("aug23-1959", "TunerView_20260823_195901.csv"),
    ("aug23-2038", "TunerView_20260823_203853.csv"),
    ("aug30-1509", "TunerView_20260830_150925.csv"),
    ("aug30-1529", "TunerView_20260830_152931.csv"),
    ("aug30-1601", "TunerView_20260830_160151.csv"),
    ("sep01-0813", "TunerView_20260901_081358.csv"),
    ("sep05-0756", "TunerView_20260905_075634.csv"),
)

#: The small set of no-upload questions, judged by the ticket-11 stand-in.
NO_UPLOAD_QUESTIONS: tuple[str, ...] = (
    "Why is my car slower in the heat?",
    "Can I add more boost?",
    "Should I add timing?",
    # The shop teaching the customer (tuning-shop eval): table by table, with the car's own values.
    "What does the WOT Enrich table do on my car, and should I change it?",
    "Which tables would you change on my map first, and why in that order?",
    "What do the ignition tables do, and why won't you edit them?",
    "How should I log my next drive so you can read it?",
    "Is my car safe to drive hard right now?",
)

#: The ticket's failure classes, in the ticket's order.
FAILURE_CLASSES: tuple[str, ...] = (
    "wrong number",
    "wrong cell",
    "uncited claim",
    "wrong action",
    "banned advice",
)

#: The clarity rubric, as the owner grades it (owner words only).
JUDGE_KEYS: tuple[str, ...] = ("one_action", "plain_words", "named_drive")
JUDGE_QUESTIONS: tuple[str, ...] = (
    "Can you see the one thing to do?",
    "Is it in plain words you understand?",
    "Does it name the drive to log next?",
)

DEFAULT_OUT = ROOT / "server" / "eval-results"


def gate() -> tuple[bool, str]:
    """The env gate: the scorecard only runs when explicitly asked to."""
    if os.environ.get(SCORECARD_ENV_VAR) == "1":
        return True, "enabled"
    return False, (
        f"scorecard needs {SCORECARD_ENV_VAR}=1 "
        "(it calls the provider with the key from .env)"
    )


# ---------------------------------------------------------------------------
# Failure classes: which of the ticket's five buckets one verify issue is
# ---------------------------------------------------------------------------
def classify_issue(issue: str, card_numbers: Sequence[float] = ()) -> str:
    """One verify issue string → one of the ticket's five failure classes.

    A number verify rejects is an *uncited claim* when some card this run read
    carries it (the model knew the number but cited no card), and a *wrong
    number* otherwise (no tool and no card says it).
    """
    from .verify import numbers_in

    text = str(issue)
    if "not in any tool result" in text:
        quoted = numbers_in(text)
        cards = [float(c) for c in card_numbers]
        if quoted and cards and all(any(abs(q - c) < 1e-9 for c in cards) for q in quoted):
            return "uncited claim"
        return "wrong number"
    if "not a card this run read" in text:
        return "uncited claim"
    if "as the step, but" in text:
        return "wrong action"
    if (
        "not in the Flash plan" in text
        or "not the Flash plan's" in text
        or "not in this reply's Flash plan" in text
        # The hard map rules (tuning-shop D11): an invented table, advice on a table the plan
        # doesn't change, or a before → after that is not a plan cell.
        or "KTuner map doesn't have" in text
        or "Flash plan doesn't change" in text
        or "not a cell of the checked Flash plan" in text
    ):
        return "wrong cell"
    if "Remove it or say why not to" in text:
        return "banned advice"
    return "other"


def classify_issues(
    issues: Sequence[str], card_numbers: Sequence[float] = ()
) -> dict[str, int]:
    """Every verify issue counted into its failure class (zeros kept)."""
    counts = {name: 0 for name in (*FAILURE_CLASSES, "other")}
    for issue in issues:
        counts[classify_issue(issue, card_numbers)] += 1
    return counts


# ---------------------------------------------------------------------------
# The clarity judge: three yes/no answers per reply, then owner agreement
# ---------------------------------------------------------------------------
def judge_messages(prose: str, step_title: str, upload_when: str) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You grade a car-tune reply for its owner. Answer three yes/no "
                'questions as JSON only, for example {"one_action": true, '
                '"plain_words": false, "named_drive": true}.'
            ),
        },
        {
            "role": "user",
            "content": "\n".join(
                [
                    f"Reply: {prose}",
                    f"The one step to do: {step_title}",
                    f"The drive to log: {upload_when or '—'}",
                    "1. one_action: does the reply name exactly that one step and no other change?",
                    "2. plain_words: plain words for a car owner, no table names or jargon?",
                    "3. named_drive: does it name the drive to log?",
                ]
            ),
        },
    ]


def parse_judge_reply(content: Any) -> dict[str, bool | None]:
    """The judge's three answers; anything unparseable abstains (None)."""
    match = re.search(r"\{.*\}", str(content or ""), re.DOTALL)
    if not match:
        return {key: None for key in JUDGE_KEYS}
    try:
        data = json.loads(match.group(0))
    except ValueError:
        return {key: None for key in JUDGE_KEYS}
    if not isinstance(data, Mapping):
        return {key: None for key in JUDGE_KEYS}
    return {
        key: (bool(data[key]) if isinstance(data.get(key), bool) else None)
        for key in JUDGE_KEYS
    }


async def judge_clarity(
    prose: str,
    step_title: str,
    upload_when: str,
    chat: Callable[[list[dict[str, str]]], Awaitable[str]],
) -> dict[str, bool | None]:
    """Score one reply through the judge rubric. Never raises: abstains."""
    try:
        return parse_judge_reply(await chat(judge_messages(prose, step_title, upload_when)))
    except Exception:  # noqa: BLE001 - a judge failure is an abstention, not a crash
        return {key: None for key in JUDGE_KEYS}


def agreement(
    judge: Mapping[str, bool | None], owner: Mapping[str, bool]
) -> dict[str, Any]:
    """Judge/owner agreement over the rubric answers the judge gave."""
    matched = sum(1 for key in JUDGE_KEYS if judge.get(key) is not None and owner.get(key) == judge[key])
    total = sum(1 for key in JUDGE_KEYS if judge.get(key) is not None)
    return {
        "matched": matched,
        "total": total,
        "rate": (matched / total) if total else None,
    }


def read_owner_grades(path: Path) -> dict[str, dict[str, bool]]:
    """`{sample-id: {one_action, plain_words, named_drive}}`, as booleans."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    out: dict[str, dict[str, bool]] = {}
    samples = data.get("samples", data) if isinstance(data, Mapping) else {}
    for sample_id, answers in samples.items():
        if isinstance(answers, Mapping):
            out[str(sample_id)] = {
                key: bool(answers[key]) for key in JUDGE_KEYS if key in answers
            }
    return out


def report_agreement(
    samples: Sequence[Mapping[str, Any]], grades: Mapping[str, Mapping[str, bool]]
) -> dict[str, Any]:
    """Per-sample and overall judge/owner agreement for graded samples."""
    per_sample = []
    for sample in samples:
        sample_id = str(sample.get("id"))
        if sample_id not in grades:
            continue
        scored = agreement(sample.get("judge") or {}, grades[sample_id])
        per_sample.append({"id": sample_id, **scored})
    matched = sum(row["matched"] for row in per_sample)
    total = sum(row["total"] for row in per_sample)
    return {
        "samples": per_sample,
        "matched": matched,
        "total": total,
        "rate": (matched / total) if total else None,
    }


def write_clarity_sample(
    path: Path, model: str, date: str, samples: Sequence[Mapping[str, Any]]
) -> Path:
    """The owner-gradeable sample: under a minute per reply, 3 yes/no each.

    Owner words only (Drive, Next step, Verdict, Fuel-quality score): the form
    a non-engineer grades, with the judge's own answers beside it.
    """
    lines = [
        f"# Clarity sample — {model} ({date})",
        "",
        "Grade each reply in under a minute: tick yes or no for the three "
        "questions, then copy your ticks into `owner-grades.json` as "
        "`{\"samples\": {\"<id>\": {\"one_action\": true, "
        "\"plain_words\": true, \"named_drive\": false}}}`.",
        "",
    ]
    judge_word = {True: "yes", False: "no", None: "no answer"}
    for sample in samples:
        judge = sample.get("judge") or {}
        lines += [
            f"## {sample.get('id')} — Drive {sample.get('drive')}",
            "",
            f"Next step: {sample.get('step_title')}",
            "",
            f"> {sample.get('prose')}",
            "",
            "The judge says: "
            + ", ".join(
                f"{question} {judge_word[judge.get(key)]}"
                for key, question in zip(JUDGE_KEYS, JUDGE_QUESTIONS)
            )
            + ".",
            "",
            "Your grade:",
            "",
        ]
        for key, question in zip(JUDGE_KEYS, JUDGE_QUESTIONS):
            lines.append(f"- [ ] {question} (yes / no)")
        lines.append("")
    Path(path).write_text("\n".join(lines), encoding="utf-8")
    return Path(path)


# ---------------------------------------------------------------------------
# First drafts from the transcript: what the model tried before verify spoke
# ---------------------------------------------------------------------------
#: The repair message every failed draft gets back (ticket 08, both paths).
REJECTION_MARK = "Rejected by the verify step"


def _tool_call_args(call: Mapping[str, Any]) -> tuple[str, dict[str, Any]]:
    """One transcript tool call → (name, args), in the provider's own shape."""
    fn = call.get("function") or {}
    raw_args = fn.get("arguments")
    if isinstance(raw_args, str):
        try:
            args = json.loads(raw_args) if raw_args.strip() else {}
        except ValueError:
            args = {}
    else:
        args = dict(raw_args or {})
    return str(fn.get("name") or ""), args if isinstance(args, Mapping) else {}


class DraftRecorder:
    """Wraps an `llm_caller` and keeps the first draft of each reply.

    Reads the transcript the way ticket 08 writes it: `submit_reply` tool
    calls carry each draft, `search_knowledge` tool results carry the cards
    read so far, and the first message holding REJECTION_MARK carries the
    first draft's issues (the tool-role repair turn, or the user-role one for
    a plain-text finish). One recorder per Drive: `reset()` between uploads.
    """

    def __init__(self, inner: Callable[..., Awaitable[dict[str, Any]]]) -> None:
        self.inner = inner
        self.reset()

    def reset(self) -> None:
        self.first_submit: dict[str, Any] | None = None
        self.first_text: str | None = None
        self.first_rejection: list[str] | None = None
        self.first_cards: list[dict[str, Any]] = []

    def _scan(self, messages: Sequence[Mapping[str, Any]]) -> None:
        cards: list[dict[str, Any]] = []
        for message in messages:
            if not isinstance(message, Mapping):
                continue
            if message.get("role") == "tool" and message.get("name") == "search_knowledge":
                try:
                    payload = json.loads(str(message.get("content") or ""))
                except ValueError:
                    payload = None
                if isinstance(payload, list):
                    cards.extend(c for c in payload if isinstance(c, Mapping))
            for call in message.get("tool_calls") or []:
                if not isinstance(call, Mapping):
                    continue
                name, args = _tool_call_args(call)
                if name == "submit_reply" and self.first_submit is None:
                    self.first_submit = {
                        "prose": str(args.get("prose") or ""),
                        "action_key": args.get("action_key"),
                        "cells": list(args.get("cells") or []),
                    }
                    self.first_cards = list(cards)
            content = message.get("content")
            if (
                isinstance(content, str)
                and REJECTION_MARK in content
                and self.first_rejection is None
            ):
                self.first_rejection = [
                    line[2:].strip() for line in content.splitlines() if line.startswith("- ")
                ]
            if (
                message.get("role") == "assistant"
                and not message.get("tool_calls")
                and isinstance(content, str)
                and content.strip()
                and self.first_text is None
            ):
                self.first_text = content.strip()

    async def __call__(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        self._scan(messages)
        return await self.inner(messages, tools)


def first_record(recorder: DraftRecorder, agent: Mapping[str, Any]) -> dict[str, Any]:
    """The first draft's issues + card numbers for one reply's rollup.

    The rejection message names the first draft's failures; when no draft was
    ever submitted (provider error, empty run) the reply's own issues stand in
    so a model that says nothing still counts as fallen back, not skipped.
    """
    from . import knowledge as K

    if recorder.first_rejection is not None:
        issues: list[str] = list(recorder.first_rejection)
    elif agent.get("fallback") and not agent.get("verified"):
        issues = list(agent.get("issues") or [])
    else:
        issues = []
    submit = recorder.first_submit or {}
    return {
        "first_prose": submit.get("prose") or recorder.first_text or "",
        "first_action": submit.get("action_key"),
        "first_issues": issues,
        "card_numbers": K.card_numbers(recorder.first_cards),
    }


# ---------------------------------------------------------------------------
# Rollup: per-reply records → the per-model summary the table prints
# ---------------------------------------------------------------------------
def summarize(records: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    """Records (drives + questions) → first-time / repaired / fallback shares.

    `records` carry `kind` ("drive"/"question"), the first draft's `issues`
    with its `card_numbers`, and the final `status` ("first", "repaired",
    "fallback" or "skipped"). Failure classes count first drafts only: the
    first-time quality signal.
    """
    judged = [r for r in records if r.get("status") != "skipped"]
    classes = {name: 0 for name in (*FAILURE_CLASSES, "other")}
    for record in judged:
        for name, count in classify_issues(
            record.get("first_issues") or [], record.get("card_numbers") or []
        ).items():
            classes[name] += count
    first = sum(1 for r in judged if r.get("status") == "first")
    repaired = sum(1 for r in judged if r.get("status") == "repaired")
    fallback = sum(1 for r in judged if r.get("status") == "fallback")
    judged_count = len(judged)
    return {
        "replies": len(records),
        "judged": judged_count,
        "skipped": sum(1 for r in records if r.get("status") == "skipped"),
        "first": first,
        "repaired": repaired,
        "fallback": fallback,
        "first_share": (first / judged_count) if judged_count else None,
        "repaired_share": (repaired / judged_count) if judged_count else None,
        "fallback_share": (fallback / judged_count) if judged_count else None,
        "classes": classes,
    }


def slug(model: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "_", model).strip("_") or "model"


def render_table(summary: Mapping[str, Mapping[str, Any]]) -> str:
    """One row per model: shares plus the five failure classes."""

    def pct(value: float | None) -> str:
        return f"{100 * value:.0f}%" if value is not None else "—"

    header = (
        f"{'model':<28} {'n':>3} {'1st':>5} {'fix':>5} {'fb':>5} "
        + " ".join(f"{name[:7]:>7}" for name in FAILURE_CLASSES)
    )
    rows = [header]
    for model, totals in summary.items():
        rows.append(
            f"{model[:28]:<28} {totals['judged']:>3} "
            f"{pct(totals['first_share']):>5} {pct(totals['repaired_share']):>5} "
            f"{pct(totals['fallback_share']):>5} "
            + " ".join(f"{totals['classes'][name]:>7}" for name in FAILURE_CLASSES)
        )
    return "\n".join(rows)


# ---------------------------------------------------------------------------
# The live run: replay the nine Drives + questions through each listed model
# ---------------------------------------------------------------------------
def owner_csv(example_id: str) -> str:
    """The owner's own TunerView CSV, as the seam-1 replay reads it."""
    source = (ROOT / "data" / f"example-{example_id}.js").read_text(encoding="utf-8")
    match = re.search(r'gz:\s*"([A-Za-z0-9+/=]+)"', source)
    assert match, f"no gzipped CSV in data/example-{example_id}.js"
    return zlib.decompress(base64.b64decode(match.group(1)), 16 + zlib.MAX_WBITS).decode("utf-8")


def _parse_sse(body: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for block in body.replace("\r\n", "\n").split("\n\n"):
        for line in block.split("\n"):
            if line.startswith("data:"):
                payload = line[5:].strip()
                if payload and payload != "[DONE]":
                    events.append(json.loads(payload))
                break
    return events


class _LiveLoop:
    """One app over a temp SQLite file, driven the way the chat drives it.

    Local to the scorecard (mirrors `server/tests/seam1/conftest.py::Loop`
    without importing test code into the product).
    """

    def __init__(self, settings, llm_caller=None) -> None:
        from .app import create_app
        from .db import Store
        from .worker import Worker

        self.settings = settings
        self.store = Store(settings.db_path)
        self.worker = Worker(settings.worker_script, settings.node_exe)
        self.app = create_app(settings, self.store, self.worker, llm_caller=llm_caller)
        self.thread_id = uuid.uuid4().hex
        self._client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=self.app), base_url="http://kta", timeout=300
        )

    # Driven from inside `asyncio.run` (main): async all the way, no loop of its own.
    async def start(self) -> "_LiveLoop":
        await self.worker.start()
        return self

    async def close(self) -> None:
        try:
            await self._client.aclose()
        finally:
            await self.worker.aclose()

    async def upload_and_reply(self, csv_text: str, file_name: str) -> dict[str, Any]:
        response = await self._client.post(
            "/upload",
            files={"file": (file_name, csv_text.encode("utf-8"), "text/csv")},
            data={"threadId": self.thread_id},
        )
        response.raise_for_status()
        upload_id = response.json()["uploadId"]
        run_id = uuid.uuid4().hex
        async with self._client.stream(
            "POST",
            "/agent",
            json={
                "threadId": self.thread_id,
                "runId": run_id,
                "state": {"upload_id": upload_id, "thread_id": self.thread_id},
                "messages": [{"id": f"h-{run_id}", "role": "user", "content": f"Uploaded {upload_id}"}],
                "tools": [],
                "context": [],
                "forwardedProps": {},
            },
            headers={"accept": "text/event-stream"},
        ) as stream:
            text = "".join([chunk async for chunk in stream.aiter_text()])
        events = _parse_sse(text)
        sentences = [e["delta"] for e in events if e["type"] == "TEXT_MESSAGE_CONTENT"]
        snapshots = [e["snapshot"] for e in events if e["type"] == "STATE_SNAPSHOT"]
        assert snapshots, "no STATE_SNAPSHOT in the reply"
        return {"say": sentences[0] if sentences else "", "card": snapshots[-1]["reply"]}


async def _post_chat(settings, model: str, messages: list[dict[str, str]]) -> str:
    """One OpenAI-compatible chat call, returning the text content."""
    base = str(settings.llm_base_url or "").rstrip("/")
    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            f"{base}/chat/completions",
            headers={"authorization": f"Bearer {settings.llm_api_key}", "content-type": "application/json"},
            json={"model": model, "messages": messages},
        )
        response.raise_for_status()
        message = (response.json().get("choices") or [{}])[0].get("message") or {}
    content = message.get("content") or ""
    if isinstance(content, list):
        content = "\n".join(
            block.get("text", "") for block in content if isinstance(block, Mapping)
        )
    return content if isinstance(content, str) else ""


async def _post_chat_with_tools(settings, model: str, messages: list[dict[str, str]], tools: list[dict[str, Any]]) -> dict[str, Any]:
    """One OpenAI-compatible chat call with tools, for the agent loop."""
    base = str(settings.llm_base_url or "").rstrip("/")
    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            f"{base}/chat/completions",
            headers={"authorization": f"Bearer {settings.llm_api_key}", "content-type": "application/json"},
            json={"model": model, "messages": messages, "tools": tools, "tool_choice": "auto"},
        )
        response.raise_for_status()
        return response.json()


async def run_model(
    model: str,
    settings,
    judge: bool = True,
) -> dict[str, Any]:
    """Replay the nine Drives + questions through one model. Needs a key."""
    from . import knowledge as K
    from . import verify as V
    from .config import Settings

    per_model = Settings(
        db_path=settings.db_path,
        worker_script=settings.worker_script,
        node_exe=settings.node_exe,
        llm_base_url=settings.llm_base_url,
        llm_api_key=settings.llm_api_key,
        llm_model=model,
    )
    recorder = DraftRecorder(
        lambda messages, tools: _post_chat_with_tools(per_model, model, messages, tools)
    )
    loop = await _LiveLoop(per_model, llm_caller=recorder).start()
    try:
        records: list[dict[str, Any]] = []
        for example_id, file_name in OWNER_DRIVES:
            recorder.reset()
            reply = await loop.upload_and_reply(owner_csv(example_id), file_name)
            card = reply["card"]
            agent = card.get("agent") or {}
            if agent.get("skipped"):
                status = "skipped"
            elif agent.get("verified") and not agent.get("repaired"):
                status = "first"
            elif agent.get("verified"):
                status = "repaired"
            else:
                status = "fallback"
            first = first_record(recorder, agent)
            step = card.get("nextStep") or {}
            records.append(
                {
                    "kind": "drive",
                    "id": example_id,
                    "status": status,
                    "first_prose": first["first_prose"],
                    "first_action": first["first_action"],
                    "first_issues": first["first_issues"],
                    "card_numbers": first["card_numbers"],
                    "say": reply["say"],
                    "step_title": step.get("title") or "",
                    "upload_when": step.get("uploadWhen") or "",
                }
            )
        # The typed questions go through the app's real ask path (ticket 11 landed, tuning-shop D1):
        # the agent picks its tools over the drive window, the map and the cards; same verify.
        for question in NO_UPLOAD_QUESTIONS:
            recorder.reset()
            response = await loop._client.post("/api/ask", json={"text": question})
            response.raise_for_status()
            out = response.json()
            agent = out.get("agent") or {}
            if agent.get("verified") and not agent.get("repaired"):
                status = "first"
            elif agent.get("verified"):
                status = "repaired"
            else:
                status = "fallback"
            first = first_record(recorder, agent)
            records.append(
                {
                    "kind": "question",
                    "id": question,
                    "status": status,
                    "first_prose": first["first_prose"],
                    "first_action": first["first_action"],
                    "first_issues": first["first_issues"] or list(agent.get("issues") or []),
                    "card_numbers": first["card_numbers"],
                    "say": out.get("answer") or "",
                    "step_title": "",
                    "upload_when": "",
                }
            )
        if judge:
            for record in records:
                if record["kind"] != "drive" or record["status"] == "skipped" or not record["say"]:
                    record["judge"] = {key: None for key in JUDGE_KEYS}
                    continue
                record["judge"] = await judge_clarity(
                    record["say"],
                    record["step_title"],
                    record["upload_when"],
                    lambda messages: _post_chat(per_model, model, messages),
                )
        else:
            for record in records:
                record["judge"] = {key: None for key in JUDGE_KEYS}
    finally:
        await loop.close()
    return {"model": model, "records": records, "totals": summarize(records)}


def save_results(out: Path, date: str, result: Mapping[str, Any]) -> Path:
    """`eval-results/<date>/<model>.json`: date + model, for run-over-run."""
    day = out / date
    day.mkdir(parents=True, exist_ok=True)
    path = day / f"{slug(str(result['model']))}.json"
    path.write_text(
        json.dumps({"date": date, **dict(result)}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    return path


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="The model scorecard (ticket 16).")
    parser.add_argument("--models", default="", help="Comma-separated model ids (default: KTA_LLM_MODELS or the free model).")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Results directory.")
    parser.add_argument("--owner", default="", help="Owner grades JSON for agreement.")
    parser.add_argument("--sample", type=int, default=3, help="Clarity sample size.")
    parser.add_argument("--no-judge", action="store_true", help="Skip the LLM judge calls.")
    args = parser.parse_args(argv)

    ok, reason = gate()
    if not ok:
        print(f"scorecard skipped: {reason}")
        return 0

    from .config import load_settings

    settings = load_settings()
    if not (settings.llm_api_key and settings.llm_base_url):
        print(
            "scorecard skipped: no LLM key "
            "(set KTA_LLM_BASE_URL, KTA_LLM_API_KEY and KTA_LLM_MODEL in .env)"
        )
        return 0
    models = [m.strip() for m in (args.models or "").split(",") if m.strip()]
    if not models:
        models = list(settings.llm_models) or list(DEFAULT_MODELS)
    out = Path(args.out)
    date = datetime.date.today().isoformat()

    async def run_all() -> dict[str, Any]:
        results = {}
        with tempfile.TemporaryDirectory() as tmp:
            for model in models:
                run_settings = replace(settings, db_path=Path(tmp) / f"{slug(model)}.db")
                result = await run_model(model, run_settings, judge=not args.no_judge)
                save_results(out, date, result)
                results[model] = result["totals"]
        (out / date / "summary.json").write_text(
            json.dumps({"date": date, "models": results}, ensure_ascii=False, indent=1) + "\n",
            encoding="utf-8",
        )
        return results

    results = asyncio.run(run_all())
    print(f"Model scorecard — {date} (9 Drives + {len(NO_UPLOAD_QUESTIONS)} questions per model)")
    print(render_table(results))

    # The clarity sample: the first judged replies, owner-gradeable.
    # (Re-read from the saved files so the sample matches what is stored.)
    if args.sample > 0:
        for model in models:
            saved = json.loads((out / date / f"{slug(model)}.json").read_text(encoding="utf-8"))
            picked = [
                {
                    "id": f"{slug(model)}-{i + 1}",
                    "drive": r["id"],
                    "prose": r["say"],
                    "step_title": r["step_title"],
                    "upload_when": r["upload_when"],
                    "judge": r.get("judge") or {},
                }
                for i, r in enumerate(
                    [r for r in saved["records"] if r["kind"] == "drive" and r.get("say")][: args.sample]
                )
            ]
            sample_path = out / date / f"{slug(model)}-clarity-sample.md"
            write_clarity_sample(sample_path, model, date, picked)
            print(f"clarity sample: {sample_path} ({len(picked)} replies)")
            if args.owner:
                grades = read_owner_grades(Path(args.owner))
                rep = report_agreement(picked, grades)
                rate = f"{100 * rep['rate']:.0f}%" if rep["rate"] is not None else "—"
                print(f"judge/owner agreement for {model}: {rate} ({rep['matched']}/{rep['total']})")
            else:
                print(f"judge/owner agreement for {model}: awaiting owner grades (--owner <file>)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


__all__ = [
    "DEFAULT_MODELS",
    "FAILURE_CLASSES",
    "DraftRecorder",
    "JUDGE_KEYS",
    "JUDGE_QUESTIONS",
    "NO_UPLOAD_QUESTIONS",
    "OWNER_DRIVES",
    "SCORECARD_ENV_VAR",
    "agreement",
    "classify_issue",
    "classify_issues",
    "first_record",
    "gate",
    "judge_clarity",
    "judge_messages",
    "main",
    "owner_csv",
    "parse_judge_reply",
    "read_owner_grades",
    "render_table",
    "report_agreement",
    "run_model",
    "save_results",
    "slug",
    "summarize",
    "write_clarity_sample",
]

"""Eval layers 2 and 3, live half (ticket 16): the scorecard shape, no key.

Gated behind `KTA_SCORECARD=1`: without it this file skips cleanly, so the
default suite stays flat. With it, three scripted fake models (the ticket-08
pattern — no network, no key) replay two Drives each through the front door,
and the scorecard rollup reports per-model first-time / repaired / fallback
shares plus the failure-class breakdown. Runnable on its own:

    cd server && KTA_SCORECARD=1 uv run pytest tests/seam1/test_scorecard.py -q

Never real uploads per model: two Drives stand in for the nine-drive replay
(the full nine run on demand via `python -m kta_server.scorecard` with a key).
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest

from conftest import Loop
from kta_server import scorecard as S

enabled, _reason = S.gate()
pytestmark = pytest.mark.skipif(not enabled, reason=S.gate()[1])

FAKE_LLM = {"base_url": "http://fake.local/v1", "api_key": "FAKE-KEY-123", "model": "fake-model"}
DRIVES = ("aug30-1601", "sep01-0813")


class Script:
    """A scripted fake model: each provider call gets the next response."""

    def __init__(self, turns: list[dict[str, Any]]) -> None:
        self.turns = list(turns)
        self.requests: list[dict[str, Any]] = []

    async def __call__(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        self.requests.append({"messages": copy.deepcopy(messages), "tools": [t["function"]["name"] for t in tools]})
        assert self.turns, "the fake model was called more times than scripted"
        return self.turns.pop(0)


def tool_turn(*calls: tuple[str, dict[str, Any]]) -> dict[str, Any]:
    return {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {"id": f"c{i}", "type": "function", "function": {"name": name, "arguments": json.dumps(args)}}
                        for i, (name, args) in enumerate(calls)
                    ],
                },
                "finish_reason": "tool_calls",
            }
        ]
    }


def submit_turn(prose: str, action: str) -> dict[str, Any]:
    return tool_turn(("submit_reply", {"prose": prose, "action_key": action, "cells": []}))


@pytest.fixture
def probe(tmp_path: Path):
    running = Loop(tmp_path / "probe").start()
    try:
        yield running
    finally:
        running.close()


def good_prose(probe: Loop, drive: str) -> tuple[str, str]:
    """A draft that passes first time: the say line, one tool number, one step."""
    reply = probe.upload_and_reply(drive)
    card = reply.card
    drive_id = reply.snapshot()["drive"]["id"]
    knock = probe.run(probe.worker.call("insight", driveId=drive_id, topic="knock"))["knock_control"]
    step = card["nextStep"]
    prose = (
        f"{card['say']} The Fuel-quality score stepped up {knock['steps_up']} times "
        f"at a median of about {knock['median_rpm_at_steps']} rpm while lugging. "
        f"{step['title']}. {step['uploadWhen']}"
    )
    return prose, step["key"]


def run_persona(tmp_path: Path, name: str, script: Script) -> list[dict[str, Any]]:
    """Two Drives through one fake model, as scorecard records."""
    recorder = S.DraftRecorder(script)
    loop = Loop(tmp_path / name, llm=FAKE_LLM, llm_caller=recorder).start()
    try:
        records = []
        for drive in DRIVES:
            recorder.reset()
            reply = loop.upload_and_reply(drive)
            card = reply.card
            agent = card.get("agent") or {}
            if agent.get("verified") and not agent.get("repaired"):
                status = "first"
            elif agent.get("verified"):
                status = "repaired"
            else:
                status = "fallback"
            records.append(
                {
                    "kind": "drive",
                    "id": drive,
                    "status": status,
                    **S.first_record(recorder, agent),
                }
            )
        return records
    finally:
        loop.close()


def test_the_scorecard_reports_first_repaired_and_fallback_per_model(tmp_path: Path, probe: Loop):
    prose = {drive: good_prose(probe, drive) for drive in DRIVES}
    bad = "The Fuel-quality score peaked at 0.91 on this drive."

    steady = Script(
        [tool_turn(("get_insight", {"topic": "knock"})),
         submit_turn(*prose[DRIVES[0]]),
         tool_turn(("get_insight", {"topic": "knock"})),
         submit_turn(*prose[DRIVES[1]])]
    )
    sloppy = Script(
        [tool_turn(("get_insight", {"topic": "knock"})),
         submit_turn(bad, prose[DRIVES[0]][1]),
         submit_turn(*prose[DRIVES[0]]),
         tool_turn(("get_insight", {"topic": "knock"})),
         submit_turn(*prose[DRIVES[1]])]
    )
    lost = Script(
        [tool_turn(("get_insight", {"topic": "knock"})),
         submit_turn(bad, prose[DRIVES[0]][1]),
         submit_turn("Boost peaked at 31 psi on this drive.", prose[DRIVES[0]][1]),
         tool_turn(("get_insight", {"topic": "knock"})),
         submit_turn(bad, prose[DRIVES[1]][1]),
         submit_turn(bad, prose[DRIVES[1]][1])]
    )

    steady_records = run_persona(tmp_path, "steady", steady)
    sloppy_records = run_persona(tmp_path, "sloppy", sloppy)
    lost_records = run_persona(tmp_path, "lost", lost)

    steady_totals = S.summarize(steady_records)
    assert (steady_totals["first"], steady_totals["repaired"], steady_totals["fallback"]) == (2, 0, 0)
    assert steady_totals["first_share"] == pytest.approx(1.0)
    assert all(r["first_issues"] == [] for r in steady_records)

    sloppy_totals = S.summarize(sloppy_records)
    assert (sloppy_totals["first"], sloppy_totals["repaired"], sloppy_totals["fallback"]) == (1, 1, 0)
    assert sloppy_totals["classes"]["wrong number"] == 1, "the 0.91 first draft lands in its class"
    assert sloppy_records[0]["status"] == "repaired" and sloppy_records[1]["status"] == "first"
    assert "0.91" in json.dumps(sloppy_records[0]["first_issues"])
    assert sloppy_records[0]["first_prose"].startswith("The Fuel-quality score peaked at 0.91")

    lost_totals = S.summarize(lost_records)
    assert (lost_totals["first"], lost_totals["repaired"], lost_totals["fallback"]) == (0, 0, 2)
    assert lost_totals["fallback_share"] == pytest.approx(1.0)

    table = S.render_table({"steady": steady_totals, "sloppy": sloppy_totals, "lost": lost_totals})
    assert "steady" in table and "sloppy" in table and "lost" in table


async def _judge_yes_no(messages):
    return '{"one_action": true, "plain_words": true, "named_drive": false}'


def test_the_judge_and_owner_agreement_report(tmp_path: Path):
    import asyncio

    scored = asyncio.run(S.judge_clarity("say", "step", "when", _judge_yes_no))
    assert scored == {"one_action": True, "plain_words": True, "named_drive": False}
    report = S.report_agreement(
        [{"id": "m-1", "judge": scored}],
        {"m-1": {"one_action": True, "plain_words": False, "named_drive": False}},
    )
    assert (report["matched"], report["total"]) == (2, 3)

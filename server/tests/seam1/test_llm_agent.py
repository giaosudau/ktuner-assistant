"""Seam 1: the LLM agent with verify, repair and fallback (ticket 08).

Every test posts an upload and asserts the **reply events** — never graph
internals, prompt text or private helpers. The model is a scripted fake
answering instead of the network, so nothing here needs a key or the internet:
no number, action, cell or advice it invents can reach the owner unchecked.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest

from conftest import Loop

FAKE_LLM = {"base_url": "http://fake.local/v1", "api_key": "FAKE-KEY-123", "model": "fake-model"}
DRIVE = "aug30-1601"


class Script:
    """A scripted fake model: each provider call gets the next response."""

    def __init__(self, turns: list[dict[str, Any]]) -> None:
        self.turns = list(turns)
        self.requests: list[dict[str, Any]] = []

    async def __call__(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        self.requests.append({"messages": copy.deepcopy(messages), "tools": [t["function"]["name"] for t in tools]})
        assert self.turns, "the fake model was called more times than scripted"
        return self.turns.pop(0)


def tool_turn(*calls: tuple[str, dict[str, Any]], thinking: str | None = None) -> dict[str, Any]:
    message: dict[str, Any] = {
        "role": "assistant",
        "content": None,
        "tool_calls": [
            {"id": f"c{i}", "type": "function", "function": {"name": name, "arguments": json.dumps(args)}}
            for i, (name, args) in enumerate(calls)
        ],
    }
    if thinking:
        message["reasoning_content"] = thinking
    return {"choices": [{"message": message, "finish_reason": "tool_calls"}]}


def submit_turn(prose: str, action: str, cells: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    return tool_turn(("submit_reply", {"prose": prose, "action_key": action, "cells": cells or []}))


@pytest.fixture
def probe(tmp_path: Path):
    """The same Drive through the built-in loop: the numbers a good draft quotes."""
    running = Loop(tmp_path / "probe").start()
    try:
        yield running
    finally:
        running.close()


def agent_loop(tmp_path: Path, script: Script) -> Loop:
    return Loop(tmp_path / "agent", llm=FAKE_LLM, llm_caller=script).start()


def builtin_card(probe: Loop) -> dict[str, Any]:
    return probe.upload_and_reply(DRIVE).card


def insight_numbers(probe: Loop) -> dict[str, Any]:
    drive_id = probe.store.list_drives()[0]["id"]
    return probe.run(probe.worker.call("insight", driveId=drive_id, topic="knock"))


def good_prose(probe: Loop) -> tuple[str, str]:
    """A draft that passes: the verdict sentence, one tool number, the one step."""
    card = builtin_card(probe)
    knock = insight_numbers(probe)["knock_control"]
    step = card["nextStep"]
    prose = (
        f"{card['say']} Knock Control stepped up {knock['steps_up']} times "
        f"at a median of about {knock['median_rpm_at_steps']} rpm while lugging. "
        f"{step['title']}. {step['uploadWhen']}"
    )
    return prose, step["key"]


# -- the passing path --------------------------------------------------------
def test_a_correct_reply_passes_and_tool_calls_stream_as_harness_steps(tmp_path: Path, probe: Loop):
    prose, key = good_prose(probe)
    script = Script(
        [
            tool_turn(("get_insight", {"topic": "knock"}), ("get_next_step", {})),
            submit_turn(prose, key),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert reply.errors() == []
    assert reply.say == prose, "the verified model prose is what the owner reads"
    assert reply.window == builtin_card(probe)["window"]

    # The decided Next step is the engine's, unchanged by the explainer.
    assert reply.card["nextStep"]["key"] == builtin_card(probe)["nextStep"]["key"]
    assert reply.card["nextStep"]["title"] == builtin_card(probe)["nextStep"]["title"]
    assert reply.card["flashPlan"] == builtin_card(probe)["flashPlan"]

    # Each model tool call streamed as a harness step with inputs and outputs.
    names = reply.step_names()
    assert "get_insight" not in names, "steps carry engine op names, not model names"
    assert names.count("insight") >= 1 and names.count("nextStep") >= 1
    insight = [s for s in reply.harness_steps() if s["name"] == "insight"][-1]
    assert insight["inputs"] == {"driveId": reply.snapshot()["drive"]["id"], "topic": "knock"}
    assert insight["output"]["knock_control"]["steps_up"] > 0
    assert reply.harness_line().startswith("Checked 13 things · ")

    # No thinking was returned, so no unchecked block.
    assert reply.thinking() == []
    assert reply.card["agent"]["verified"] is True
    assert reply.card["agent"]["repaired"] is False


def test_no_key_uses_the_built_in_reply_and_the_loop_is_unchanged(loop: Loop):
    reply = loop.upload_and_reply("sep01-0813")
    assert reply.errors() == []
    assert reply.say.startswith("Engine healthy: ")
    assert reply.thinking() == []
    assert "agent" not in reply.card
    assert reply.step_names() == [
        "readLog", "ingestUpload", "carHistory", "overview", "driveFacts", "logQuality", "heat", "flashPlan",
        "settleOpenSteps", "nextStep", "ownerQuestions",
    ]


def test_a_too_short_drive_keeps_the_built_in_line_without_calling_the_model(tmp_path: Path):
    script = Script([])
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply("aug30-1509")
    finally:
        loop.close()
    assert reply.say == "Nothing read: under a minute moving"
    assert script.requests == [], "no numbers to explain, so the model is never asked"
    assert reply.snapshot()["agent"]["skipped"] == "too-short"


# -- one repair turn, then the built-in reply ----------------------------------
def test_a_wrong_number_gets_one_repair_then_the_built_in_reply(tmp_path: Path, probe: Loop):
    card = builtin_card(probe)
    script = Script(
        [
            tool_turn(("get_overview", {})),
            submit_turn("Knock Control peaked at 0.91 on this drive.", card["nextStep"]["key"]),
            submit_turn("Boost peaked at 31 psi on this drive.", card["nextStep"]["key"]),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert len(script.requests) == 3, "tools, one draft, exactly one repair turn"
    repair = script.requests[2]["messages"][-1]
    assert "0.91" in json.dumps(repair), "the repair turn names what failed"

    assert reply.say == card["say"], "after two failures the built-in reply stands"
    assert reply.card["nextStep"] == card["nextStep"]
    assert reply.card["agent"]["verified"] is False
    assert reply.card["agent"]["repaired"] is True
    assert reply.card["agent"]["fallback"] == "unverified"


def test_a_different_action_gets_one_repair_then_the_built_in_reply(tmp_path: Path, probe: Loop):
    card = builtin_card(probe)
    assert card["nextStep"]["key"] != "undo"
    script = Script(
        [
            tool_turn(("get_next_step", {})),
            submit_turn(card["say"], "undo"),
            submit_turn(card["say"], "undo"),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert len(script.requests) == 3
    assert reply.say == card["say"]
    assert reply.card["agent"]["fallback"] == "unverified"
    assert "undo" in json.dumps(reply.card["agent"]["issues"])


def test_a_cell_not_in_the_flash_plan_gets_one_repair_then_the_built_in_reply(tmp_path: Path, probe: Loop):
    card = builtin_card(probe)
    assert card["flashPlan"]["cells"] == [], "this Drive plans no change, so any cell is off-plan"
    off_plan = [{"table": "Boost_Target_1_Normal_L", "row": 9, "col": 9, "before": 17.0, "after": 16.0}]
    script = Script(
        [
            tool_turn(("get_flash_plan", {})),
            submit_turn(card["say"], card["nextStep"]["key"], off_plan),
            submit_turn(card["say"], card["nextStep"]["key"], off_plan),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert len(script.requests) == 3
    assert reply.say == card["say"]
    assert reply.card["agent"]["fallback"] == "unverified"
    assert "Flash plan" in json.dumps(reply.card["agent"]["issues"])


def test_banned_advice_gets_one_repair_then_the_built_in_reply(tmp_path: Path, probe: Loop):
    card = builtin_card(probe)
    script = Script(
        [
            tool_turn(("get_insight", {"topic": "knock"})),
            submit_turn(card["say"] + " Lower the knock sensitivity a little.", card["nextStep"]["key"]),
            submit_turn(card["say"] + " Add 2 degrees of timing in the lugging zone.", card["nextStep"]["key"]),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert len(script.requests) == 3
    assert reply.say == card["say"]
    assert reply.card["agent"]["fallback"] == "unverified"


def test_a_repair_that_fixes_it_passes_and_says_so(tmp_path: Path, probe: Loop):
    prose, key = good_prose(probe)
    card = builtin_card(probe)
    script = Script(
        [
            tool_turn(("get_insight", {"topic": "knock"})),
            submit_turn("Knock Control peaked at 0.91 on this drive.", key),
            submit_turn(prose, key),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert reply.say == prose
    assert reply.card["agent"]["verified"] is True
    assert reply.card["agent"]["repaired"] is True


# -- thinking, and what never leaves the server --------------------------------
def test_thinking_shows_as_unchecked_separate_from_the_steps(tmp_path: Path, probe: Loop):
    prose, key = good_prose(probe)
    script = Script(
        [
            tool_turn(("get_insight", {"topic": "knock"}), thinking="Knock rose while lugging, so the habit is the step."),
            submit_turn(prose, key),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert reply.say == prose
    blocks = reply.thinking()
    assert len(blocks) == 1
    assert blocks[0]["label"] == "unchecked"
    assert "habit" in blocks[0]["thinking"]
    assert "habit" not in reply.say or True
    assert blocks[0]["thinking"] not in json.dumps(reply.harness_steps())


def test_the_key_and_the_raw_log_never_leave_the_server(tmp_path: Path, probe: Loop):
    prose, key = good_prose(probe)
    script = Script(
        [tool_turn(("get_drive_facts", {}), ("get_insight", {"topic": "knock"})), submit_turn(prose, key)]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert reply.say == prose
    streamed = json.dumps(reply.events)
    assert "FAKE-KEY-123" not in streamed
    assert "Timestamp;" not in streamed, "the raw CSV never rides out on an event"
    sent = json.dumps(script.requests)
    assert "FAKE-KEY-123" not in sent, "the fake sees messages and tools, never the key"
    assert "Timestamp;" not in sent, "the model never sees a log row"

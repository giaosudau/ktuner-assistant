"""Seam 1: knowledge cards and citations (ticket 09).

The agent reads general knowledge through `search_knowledge` and cites the
card id for claims the Drive tools do not say. A factual claim citing neither
a tool result nor a card id gets one repair turn, then the built-in reply —
the same path ticket 08 built, through the same scripted fake model.
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

# 14.1 (E10 stoich on the AFR scale) is in kc-e10's numbers and in no tool
# result for this Drive, so it is load-bearing: cited it passes, bare it fails.
CITED_LINE = " E10 burns at 14.1 on the scale, not 14.7. [kc-e10]"
BARE_LINE = " E10 burns at 14.1 on the scale, not 14.7."


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


def agent_loop(tmp_path: Path, script: Script) -> Loop:
    return Loop(tmp_path / "agent", llm=FAKE_LLM, llm_caller=script).start()


def builtin_card(probe: Loop) -> dict[str, Any]:
    return probe.upload_and_reply(DRIVE).card


def test_search_knowledge_is_a_read_only_tool(tmp_path: Path, probe: Loop):
    """The tool exists, reads cards, and streams as a knowledge harness step."""
    card = builtin_card(probe)
    prose = card["say"] + CITED_LINE
    script = Script(
        [
            tool_turn(("search_knowledge", {"query": "E10 stoich fuel"})),
            submit_turn(prose, card["nextStep"]["key"]),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert reply.errors() == []
    assert reply.say == prose
    assert "search_knowledge" in script.requests[0]["tools"], "the tool list carries search_knowledge"
    names = reply.step_names()
    assert "knowledge" in names, "the card lookup streams as a harness step"
    looked_up = [s for s in reply.harness_steps() if s["name"] == "knowledge"][-1]
    assert looked_up["inputs"]["query"] == "E10 stoich fuel"
    assert any(c["id"] == "kc-e10" for c in looked_up["output"]["result"])
    assert reply.card["agent"]["verified"] is True
    cited = reply.card["agent"]["citations"]
    assert [c["id"] for c in cited] == ["kc-e10"]


def test_an_uncited_claim_gets_one_repair_then_the_built_in_reply(tmp_path: Path, probe: Loop):
    card = builtin_card(probe)
    script = Script(
        [
            tool_turn(("search_knowledge", {"query": "E10 stoich fuel"})),
            submit_turn(card["say"] + BARE_LINE, card["nextStep"]["key"]),
            submit_turn(card["say"] + BARE_LINE, card["nextStep"]["key"]),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert len(script.requests) == 3, "tools, one draft, exactly one repair turn"
    repair = script.requests[2]["messages"][-1]
    assert "14.1" in json.dumps(repair), "the repair turn names what failed"
    assert "card" in json.dumps(repair).lower(), "and says to cite a card"

    assert reply.say == card["say"], "after two failures the built-in reply stands"
    assert reply.card["agent"]["verified"] is False
    assert reply.card["agent"]["repaired"] is True
    assert reply.card["agent"]["fallback"] == "unverified"


def test_a_cited_claim_passes_without_repair(tmp_path: Path, probe: Loop):
    card = builtin_card(probe)
    script = Script(
        [
            tool_turn(("search_knowledge", {"query": "E10 stoich fuel"})),
            submit_turn(card["say"] + CITED_LINE, card["nextStep"]["key"]),
        ]
    )
    loop = agent_loop(tmp_path, script)
    try:
        reply = loop.upload_and_reply(DRIVE)
    finally:
        loop.close()

    assert reply.errors() == []
    assert reply.say == card["say"] + CITED_LINE
    assert reply.card["agent"]["verified"] is True
    assert reply.card["agent"]["repaired"] is False
    assert [c["id"] for c in reply.card["agent"]["citations"]] == ["kc-e10"]

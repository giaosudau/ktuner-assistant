"""Seam 1: ask without uploading (ticket 11).

A typed question is answered from the owner's drive window and the knowledge
cards, with the same checks as an upload reply. A request for a change gets
the Flash plan's answer and what would unlock it, never an edit; ignition is
refused with the reason. Built-in with no key; the fake model covers the agent.
"""

from __future__ import annotations

from conftest import Loop

from test_knowledge_cards import FAKE_LLM, Script, submit_turn, tool_turn
from test_reply_words import BANNED

from kta_server import verify as V


def ask(loop: Loop, text: str) -> dict:
    response = loop.run(loop._client.post("/api/ask", json={"text": text}))
    assert response.status_code == 200, response.text
    return response.json()


def owner_loop(loop: Loop) -> Loop:
    for example_id in ("aug30-1529", "aug30-1601"):
        loop.upload_and_reply(example_id)
    return loop


def test_why_slower_in_the_heat_is_read_off_the_owners_two_drives(loop: Loop):
    owner_loop(loop)
    body = ask(loop, "Why is my car slower in the heat?")
    say = body["answer"]
    assert "30 Aug 15:29" in say and "30 Aug 16:01" in say
    # The owner's own numbers, as the engine read them.
    assert "1.77 s" in say and "2.23 s" in say
    assert "[kc-heat-soak]" in say
    assert [c["id"] for c in body["citations"]] == ["kc-heat-soak"]
    assert body["window"].startswith("based on your 2 Drives")
    assert body["nextStep"]


def test_give_me_plus_2_psi_is_the_flash_plans_answer_with_its_lock_reasons(loop: Loop):
    owner_loop(loop)
    body = ask(loop, "Give me +2 psi")
    say = body["answer"]
    assert "Your logs support no map change right now." in say
    assert "Locked: wastegate" in say, "the plan's own lock reason"
    assert "What would unlock it:" in say
    assert "Nothing changes in your map." in say
    assert body["window"].startswith("based on your 2 Drives")
    # No cells, no tables: the plan holds none.
    assert V.plan_cells({"cells": body.get("cells") or []}) == []
    assert "cells" not in body


def test_add_timing_is_refused_with_the_reason(loop: Loop):
    owner_loop(loop)
    body = ask(loop, "Add timing")
    assert "never edit ignition" in body["answer"]
    assert "cannot check" in body["answer"]
    assert body["intent"] == "refuse"
    assert V.verify(body["answer"], None, None, [], None, [])["ok"], "the refusal passes the banned-advice check"
    assert body["window"]


def test_add_timing_is_refused_even_with_no_drive(loop: Loop):
    body = ask(loop, "Add timing")
    assert body["intent"] == "refuse"
    assert body["window"] == "nothing read yet"


def test_a_heat_question_with_no_drive_says_why_it_cannot_answer(loop: Loop):
    body = ask(loop, "Why is my car slower in the heat?")
    assert body["kind"] == "no-drive"
    assert body["answer"].startswith("Upload a Drive first")


def test_a_card_question_needs_no_drive_and_cites_the_card(loop: Loop):
    body = ask(loop, "What does MAF Scaling do?")
    assert body["answer"].startswith("MAF Scaling follows the housing")
    assert [c["id"] for c in body["citations"]] == ["kc-maf-housing"]
    assert body["window"] == "nothing read yet"


def test_not_enough_drives_says_why_it_cannot_tell(loop: Loop):
    loop.upload_and_reply("aug22-0903")
    body = ask(loop, "Why is my car slower in the heat?")
    assert body["answer"].startswith("Can't tell yet: heat needs two timed")
    assert "Next step:" in body["answer"]


def test_no_answer_uses_a_banned_word(loop: Loop):
    owner_loop(loop)
    blob = " ".join(
        ask(loop, q)["answer"] for q in ("Why is my car slower in the heat?", "Give me +2 psi", "Add timing")
    ).lower()
    for word in BANNED:
        assert word not in blob, word


class FakeModel:
    """Stateless: looks up the heat card, then submits `tail(builtin sentence)` under the decided step's key."""

    def __init__(self, tail: str) -> None:
        self.tail, self.calls = tail, 0

    async def __call__(self, messages, tools):
        if messages[1]["content"].startswith("The owner asks"):
            self.calls += 1  # uploads call the model too; only typed questions count
        system = messages[0]["content"]
        key = system.split("(key: ")[1].split(")")[0]
        sentence = system.split("Start with this sentence: ")[1].split("\nThe Flash plan")[0]
        if not any(m.get("role") == "tool" for m in messages):
            return tool_turn(("search_knowledge", {"query": "heat soak"}))
        return submit_turn(sentence + self.tail, key)


def test_the_fake_model_answer_is_checked_and_falls_back_to_the_built_in_one(tmp_path):
    probe = Loop(tmp_path / "probe").start()
    try:
        owner_loop(probe)
        builtin = ask(probe, "Why is my car slower in the heat?")["answer"]
    finally:
        probe.close()

    good = Loop(tmp_path / "good", llm=FAKE_LLM, llm_caller=FakeModel(" [kc-heat-soak]")).start()
    try:
        owner_loop(good)
        body = ask(good, "Why is my car slower in the heat?")
        assert body["agent"]["verified"] is True, body["agent"]
        assert [c["id"] for c in body["citations"]] == ["kc-heat-soak"]
        assert body["window"].startswith("based on your 2 Drives")
    finally:
        good.close()

    # An invented number fails verify twice: the built-in answer stands.
    bad = Loop(tmp_path / "bad", llm=FAKE_LLM, llm_caller=FakeModel(" That is 31.7 percent slower.")).start()
    try:
        owner_loop(bad)
        body = ask(bad, "Why is my car slower in the heat?")
        assert body["agent"]["verified"] is False
        assert body["answer"] == builtin
    finally:
        bad.close()


def test_a_request_for_a_change_never_reaches_the_model(tmp_path):
    model = FakeModel("")
    loop = Loop(tmp_path / "chg", llm=FAKE_LLM, llm_caller=model).start()
    try:
        owner_loop(loop)
        assert "Locked" in ask(loop, "Give me +2 psi")["answer"]
        assert "never edit ignition" in ask(loop, "Add timing")["answer"]
        assert model.calls == 0
    finally:
        loop.close()

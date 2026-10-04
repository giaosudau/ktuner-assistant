"""Seam 1: the chat's front agent (tuning-shop D17–D25), through the real `/agent` endpoint.

Every typed message runs the chat graph: the front agent reads it with tools, shows the cards
the chat declared (AG-UI frontend tools, validated by the server), or hands off to the tuner;
`suggest` writes the follow-up chips. With no key the deterministic front desk answers in the
same shape. The model is a scripted fake here: no network, no key.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from conftest import Loop, _parse_sse

from test_knowledge_cards import FAKE_LLM, Script, tool_turn

from kta_server import chat as CH

PROFILE = {
    "model": "Civic FE 1.5T", "engine": "L15 turbo", "transmission": "CVT", "fuel": "E10 RON95",
    "climate": "hot city traffic", "basemap": "Starter 21 Dual Tune 2", "parts": ["intake", "downpipe"],
}


def chat(loop: Loop, text: str, thread: str | None = None) -> dict[str, Any]:
    """One typed message as the web sends it: mode chat, the chat's cards declared as tools."""
    run_id = uuid.uuid4().hex
    body = {
        "threadId": thread or loop.thread_id,
        "runId": run_id,
        "state": {"mode": "chat", "text": text, "thread_id": thread or loop.thread_id, "upload_id": None},
        "messages": [{"id": f"h-{run_id}", "role": "user", "content": text}],
        "tools": CH.default_ui_tools(),
        "context": [],
        "forwardedProps": {},
    }

    async def go() -> list[dict[str, Any]]:
        async with loop._client.stream("POST", "/agent", json=body, headers={"accept": "text/event-stream"}) as response:
            assert response.status_code == 200, await response.aread()
            return _parse_sse("".join([chunk async for chunk in response.aiter_text()]))

    events = loop.run(go())
    assert not [e for e in events if e["type"] == "RUN_ERROR"], events
    snapshots = [e["snapshot"] for e in events if e["type"] == "STATE_SNAPSHOT" and (e.get("snapshot") or {}).get("answer")]
    assert snapshots, "the answer reaches the chat as shared state"
    return snapshots[-1]["answer"]


def save_profile(loop: Loop) -> None:
    response = loop.run(loop._client.post("/api/profile", json={"fields": PROFILE}))
    assert response.status_code == 200, response.text


def suggest_turn(*items: dict[str, Any]) -> dict[str, Any]:
    return tool_turn(("suggest_replies", {"items": list(items)}))


# -- no key: the deterministic front desk, the same shape ------------------------
def test_hello_with_no_car_asks_which_car_and_shows_no_card_or_table(loop: Loop):
    answer = chat(loop, "Hello I want to tune my car")
    assert "which car" in answer["answer"].lower()
    assert answer["citations"] == [] and not answer.get("basis")
    assert "boost" not in answer["answer"].lower() and "table" not in answer["answer"].lower()
    assert answer["suggestions"], "the stage's chips come with it"


def test_hello_from_a_returning_owner_shows_the_recap(loop: Loop):
    save_profile(loop)
    loop.upload_and_reply("aug30-1529")
    answer = chat(loop, "Hello I want to tune my car")
    recap = next(c for c in answer["ui"] if c["tool"] == "show_recap")["recap"]
    assert recap["car"].startswith("Civic FE 1.5T") and recap["round"] == 1
    assert any(line["label"] == "Drives in your car file" and line["value"] == "1" for line in recap["lines"])


def test_a_fitted_part_opens_the_one_car_editor_with_it(loop: Loop):
    save_profile(loop)
    answer = chat(loop, "I fitted a new intercooler")
    draft = next(c for c in answer["ui"] if c["tool"] == "show_car_editor")["draft"]
    assert draft["fields"]["parts"] == ["intake", "downpipe", "intercooler"]


def test_what_can_you_do_says_what_it_cant(loop: Loop):
    answer = chat(loop, "What can you do?")
    assert "**I can't**" in answer["answer"] and "never add timing" in answer["answer"]


# -- with a model: the front agent decides with tools -------------------------
def model_loop(tmp_path, turns: list[dict[str, Any]]) -> tuple[Loop, Script]:
    script = Script(turns)
    return Loop(tmp_path / "front", llm=FAKE_LLM, llm_caller=script).start(), script


def test_the_front_agent_greets_with_the_recap_it_chose_to_show(tmp_path):
    loop, script = model_loop(tmp_path, [
        tool_turn(("get_car_file", {})),
        tool_turn(("show_recap", {})),
        tool_turn(("submit_reply", {"prose": "Welcome back. Your next drive settles what's open."})),
        suggest_turn({"label": "Attach my latest log", "action": "attach"}, {"label": "Add more boost", "action": "send", "text": "Add more boost"}),
    ])
    try:
        save_profile(loop)
        answer = chat(loop, "hey there")
        assert answer["answer"] == "Welcome back. Your next drive settles what's open."
        assert answer["agent"]["verified"] is True
        assert [c["tool"] for c in answer["ui"]] == ["show_recap"]
        # The model's chips are checked: a request for more boost never becomes a chip.
        assert [c["label"] for c in answer["suggestions"]] == ["Attach my latest log"]
        front = script.requests[0]
        assert {"show_recap", "show_car_editor", "ask_tuner", "get_car_file"} <= set(front["tools"])
        assert "Civic" not in front["messages"][0]["content"] or "The car is known." in front["messages"][0]["content"]
    finally:
        loop.close()


def test_the_editor_only_takes_parts_from_the_list(tmp_path):
    loop, _ = model_loop(tmp_path, [
        tool_turn(("show_car_editor", {"parts_fitted": ["intercooler", "big-turbo"], "parts_removed": ["downpipe"]})),
        tool_turn(("submit_reply", {"prose": "Check your car card and save it."})),
        suggest_turn(),
    ])
    try:
        save_profile(loop)
        answer = chat(loop, "swapped the downpipe back to stock and put a bigger intercooler in")
        draft = next(c for c in answer["ui"] if c["tool"] == "show_car_editor")["draft"]
        assert draft["fields"]["parts"] == ["intake", "intercooler"], "an unknown part never reaches the card"
        assert answer["suggestions"], "an empty model list falls back to the stage's chips"
    finally:
        loop.close()


def test_an_invented_number_is_rejected_and_the_fixed_answer_stands(tmp_path):
    bad = tool_turn(("submit_reply", {"prose": "Your car makes 212 hp now."}))
    loop, _ = model_loop(tmp_path, [bad, bad, suggest_turn()])
    try:
        save_profile(loop)
        answer = chat(loop, "hello")
        assert answer["agent"]["verified"] is False and answer["agent"]["fallback"] == "unverified"
        assert "212" not in answer["answer"]
        assert any(c["tool"] == "show_recap" for c in answer["ui"]), "the fixed greeting still shows where the car is"
    finally:
        loop.close()


def test_a_tuning_question_is_handed_to_the_tuner(tmp_path):
    loop, script = model_loop(tmp_path, [
        tool_turn(("ask_tuner", {"question": "Why is my car slower in the heat?"})),
        # The tuner's own agent: a failed draft twice, so its checked built-in answer stands.
        tool_turn(("submit_reply", {"prose": "It is 99 percent heat.", "action_key": "x"})),
        tool_turn(("submit_reply", {"prose": "It is 99 percent heat.", "action_key": "x"})),
        suggest_turn({"label": "How do I log a cool drive?", "action": "guide"}),
    ])
    try:
        answer = chat(loop, "why's it so sluggish when it's hot out")
        assert answer["intent"] == "heat", "the tuner answered with its own checked path"
        assert answer["front"]["handoff"] is True
        assert answer["suggestions"] == [{"label": "How do I log a cool drive?", "action": "guide", "icon": "route"}]
        assert "ask_tuner" in script.requests[0]["tools"]
    finally:
        loop.close()


def test_the_front_agent_remembers_the_chat(tmp_path):
    loop, script = model_loop(tmp_path, [
        tool_turn(("submit_reply", {"prose": "Hi! Which car are we tuning?"})), suggest_turn(),
        tool_turn(("submit_reply", {"prose": "Got it."})), suggest_turn(),
    ])
    try:
        chat(loop, "hi")
        chat(loop, "it is a civic")
        second = [r for r in script.requests if "ask_tuner" in r["tools"]][1]["messages"]
        assert {"role": "assistant", "content": "Hi! Which car are we tuning?"} in second
    finally:
        loop.close()


def test_a_chat_turn_after_an_upload_in_the_same_thread_is_a_chat(loop: Loop):
    loop.upload_and_reply("aug30-1529")
    answer = chat(loop, "hello")
    assert answer["kind"] == "desk"


# -- chats are kept (D18) -----------------------------------------------------
def test_chats_are_saved_listed_renamed_and_deleted_without_touching_drives(loop: Loop):
    loop.upload_and_reply("aug30-1529")
    messages = [{"id": "u1", "role": "user", "text": "Is my knock control OK?"}, {"id": "a1", "role": "assistant", "kind": "ask"}]
    put = loop.run(loop._client.put("/api/threads/t1", json={"messages": messages}))
    assert put.json()["title"] == "Is my knock control OK?"
    listed = loop.run(loop._client.get("/api/threads")).json()["threads"]
    assert [t["id"] for t in listed if t["id"] == "t1"] == ["t1"]
    assert loop.run(loop._client.patch("/api/threads/t1", json={"title": "Knock"})).json()["title"] == "Knock"
    assert loop.run(loop._client.get("/api/threads/t1")).json()["messages"] == messages
    drives = len(loop.store.list_drives())
    assert loop.run(loop._client.delete("/api/threads/t1")).json()["ok"] is True
    assert loop.run(loop._client.get("/api/threads/t1")).status_code == 404
    assert len(loop.store.list_drives()) == drives, "a chat is deleted, never a Drive"


def test_checked_chips_drop_unknown_actions_numbers_and_requests_for_more():
    chips = CH.checked_chips([
        {"label": "Raise boost 2 psi", "action": "send"},
        {"label": "Delete my map", "action": "delete"},
        {"label": "Give me more timing", "action": "send", "text": "Can you add more timing?"},
        {"label": "How do I log a drive?", "action": "guide"},
        {"label": "How do I log a drive?", "action": "guide"},
    ])
    assert chips == [{"label": "How do I log a drive?", "action": "guide", "icon": "route"}]
    assert json.dumps(chips)


def test_the_conversation_survives_a_restart_in_sqlite(tmp_path):
    """The checkpointer is SQLite when the app runs (lifespan): a restarted app still has the chat."""
    script = Script([
        tool_turn(("submit_reply", {"prose": "Hi! Which car are we tuning?"})), suggest_turn(),
        tool_turn(("submit_reply", {"prose": "Got it."})), suggest_turn(),
    ])
    first = Loop(tmp_path / "keep", llm=FAKE_LLM, llm_caller=script)
    try:
        ctx = first.app.router.lifespan_context(first.app)
        first.run(ctx.__aenter__())
        chat(first, "hi")
        first.run(ctx.__aexit__(None, None, None))
    finally:
        first._loop.close()
    assert (tmp_path / "keep" / "ktuner-chat.db").exists()

    second = Loop(tmp_path / "keep", llm=FAKE_LLM, llm_caller=script)
    second.thread_id = first.thread_id
    try:
        ctx = second.app.router.lifespan_context(second.app)
        second.run(ctx.__aenter__())
        chat(second, "it is a civic")
        second.run(ctx.__aexit__(None, None, None))
    finally:
        second._loop.close()
    later = [r for r in script.requests if "ask_tuner" in r["tools"]][1]["messages"]
    assert {"role": "assistant", "content": "Hi! Which car are we tuning?"} in later

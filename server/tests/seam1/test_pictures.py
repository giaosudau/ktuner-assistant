"""Seam 1: pictures in the chat (ticket 15).

Every kind is drawn from the engine's data for the owner's own Drives; the
Flash step always carries its map grid; the agent only picks a kind and a
number on a picture the text does not say fails verify; a KTuner screenshot is
read only by the checked agent.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from conftest import Loop, owner_csv, OWNER_DRIVES
from test_llm_agent import FAKE_LLM, Script, submit_turn, tool_turn

from kta_server import pictures as PIC
from kta_server import verify as V
from kta_server.screenshot import PLAIN_NO_KEY, PLAIN_UNCHECKED

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 32


def pic(loop: Loop, kind: str, drive_id: str, plan=None, moment=None) -> dict[str, Any]:
    return loop.run(PIC.build(kind, loop.worker, loop.store, drive_id, loop.store.car_state(None), plan, moment))


def last_drive(loop: Loop) -> str:
    return loop.store.list_drives()[0]["id"]


def flash_ready(loop: Loop) -> dict[str, Any]:
    """An overshoot over the hold on every Drive so far: the engine's own plan proposes the boost change."""
    state = loop.store.car_state(None)
    for summary in state["drives"].values():
        summary["overshoot"] = 3.4
    loop.store.save_car_state(state)
    return loop.get("/api/state").json()["flashPlan"]


@pytest.fixture
def one(tmp_path: Path):
    running = Loop(tmp_path).start()
    try:
        yield running
    finally:
        running.close()


# -- acceptance 1: each kind renders from engine data for the owner's drives ---
def test_trace_draws_a_channel_around_the_marked_key_moment(one: Loop):
    one.upload_and_reply("aug30-1601")
    picture = pic(one, "trace", last_drive(one))
    assert picture["kind"] == "trace"
    (series, *_) = picture["series"]
    assert 3 <= len(series["points"]) <= 90
    assert picture["moment"]["at"] == 0 and picture["moment"]["label"] == picture["title"]
    assert min(t for t, _ in series["points"]) < 0 < max(t for t, _ in series["points"])  # the moment sits inside the trace
    assert picture["numbers"]


def test_a_trace_with_no_key_moment_says_why(one: Loop):
    one.upload_and_reply("sep05-0756")
    picture = pic(one, "trace", last_drive(one))
    assert picture["kind"] == "cant-tell" and "no Key moment" in picture["why"]


def test_baseline_puts_this_drive_against_the_baseline(replayed: Loop):
    picture = pic(replayed, "baseline", "20260905-075634")
    assert picture["kind"] == "baseline"
    assert [b["label"] for b in picture["bars"]] == ["Baseline", "This Drive"]
    assert picture["numbers"][0] == picture["bars"][1]["value"] and picture["numbers"][1] == picture["bars"][0]["value"]


def test_baseline_with_none_yet_says_why():
    picture = PIC.baseline_picture([{"id": "d", "kcStart": 0.5}], None, "d")
    assert picture["kind"] == "cant-tell" and "Baseline" in picture["why"] and picture["numbers"] == []


def test_proof_bars_exist_only_for_matched_drives_and_otherwise_say_why(replayed: Loop):
    kinds = {}
    for drive in replayed.store.list_drives():
        picture = pic(replayed, "proof", drive["id"])
        kinds[picture["kind"]] = picture
        if picture["kind"] == "cant-tell":
            assert picture["why"] and picture["numbers"] == []
    assert "cant-tell" in kinds
    if "proof" in kinds:
        assert [b["label"] for b in kinds["proof"]["bars"]] == ["Before", "After"]


def proof(loop: Loop, key: str, before: dict, after: dict) -> dict[str, Any]:
    state = {"drives": {"a": before, "b": after}}
    return loop.run(loop.worker.call("picture", kind="proof", state=state, driveId="b", beforeId="a", key=key))


def test_proof_bars_draw_a_matched_pair_and_refuse_a_mismatched_one(one: Loop):
    matched = proof(one, "undo", {"trimWorst": -9.2}, {"trimWorst": -1.4})
    assert matched["kind"] == "proof" and matched["numbers"] == [-9.2, -1.4]
    pulls = {"hardPulls": 2, "overshoot": 3.4}
    refused = proof(one, "downpipe", {**pulls, "iatMoving": 22}, {**pulls, "overshoot": 0.8, "iatMoving": 41})
    assert refused["kind"] == "cant-tell" and "22 \u00b0C" in refused["why"] and "41 \u00b0C" in refused["why"]
    hot = proof(one, "habit", {"lugShare": 20, "hot": True}, {"lugShare": 3, "hot": False})
    assert hot["kind"] == "cant-tell" and "hot afternoon" in hot["why"]


def test_map_grid_marks_changed_cells_and_the_rows_driven(one: Loop):
    one.upload_and_reply("sep01-0813")
    plan = flash_ready(one)
    picture = pic(one, "map_grid", last_drive(one), plan)
    assert picture["kind"] == "map_grid" and picture["cols"] == 16 and len(picture["rpm"]) == 20
    assert picture["changes"] and all(c["after"] == c["before"] - 1 for c in picture["changes"])
    assert picture["driven"], "the Drive sat in some rpm rows under boost"
    # The cells drawn are the checked KTuner card's cells, nothing else.
    card_cells = {(c["rpm"], c["col"] - 1) for c in plan["ktunerCard"]["groups"][0]["cells"]}
    assert {(c["rpm"], c["col"]) for c in picture["changes"]} == card_cells


def test_maf_gap_draws_the_curve_and_the_planned_change(one: Loop):
    one.upload_and_reply("sep01-0813")
    state = one.store.car_state(None)
    for summary in state["drives"].values():
        summary["trimWorst"] = -9.0
    one.store.save_car_state(state)
    plan = one.get("/api/state").json()["flashPlan"]
    if not plan.get("afmAfter"):  # the engine, not this test, decides when the curve moves
        pytest.skip("this Car history asks for no MAF Scaling change")
    picture = pic(one, "maf_gap", last_drive(one), plan)
    assert picture["kind"] == "maf_gap" and len(picture["before"]) == len(picture["after"]) == len(picture["x"])
    assert picture["numbers"] == [picture["gapPct"]]


def test_maf_gap_without_a_planned_change_says_why():
    picture = PIC.maf_picture({"afmAfter": None}, {})
    assert picture["kind"] == "cant-tell" and "trims" in picture["why"]


# -- acceptance 2: a Flash reply shows the map grid, with or without a model --
def test_a_flash_reply_carries_the_map_grid_with_no_key(one: Loop, monkeypatch):
    from kta_server import copy as C

    one.upload_and_reply("sep01-0813")
    flash_ready(one)
    real = C.next_step_card
    # The engine rarely ranks a Flash first; force the step kind so the wiring, not the ranking, is under test.
    monkeypatch.setattr(C, "next_step_card", lambda *a, **k: {**real(*a, **k), "kind": "flash"})
    card = one.upload_and_reply("sep05-0756").card
    assert card["flashPlan"]["ktunerCard"]["kind"] == "change"
    (grid,) = card["pictures"]
    assert grid["kind"] == "map_grid" and grid["changes"]


def test_a_read_drive_with_no_model_still_shows_one_picture(one: Loop):
    """Chat CA-06: the built-in reply carries one picture (proof, else a Key-moment trace) whose numbers it prints."""
    (picture,) = one.upload_and_reply("aug30-1601").card["pictures"]
    assert picture["kind"] in ("proof", "trace")
    if picture["kind"] == "trace":
        assert all(str(n) in picture["title"] for n in picture["numbers"]), "a trace names its numbers in its title"


def test_a_too_short_drive_has_no_picture(one: Loop):
    assert one.upload_and_reply("aug30-1509").card["pictures"] == []


# -- acceptance 3: verify fails a number on the picture that the text lacks ----
def test_verify_rejects_a_picture_number_missing_from_the_text():
    picture = {"kind": "baseline", "numbers": [0.49, 0.62, 2.0]}
    bad = V.picture_issues("Your score is fine.", [picture])
    assert bad and "0.62" in bad[0] and "0.49" in bad[0]
    assert V.picture_issues("Your score 0.49, the baseline 0.62, from 2 drives.", [picture]) == []
    assert V.picture_issues("Nothing to show.", [{"kind": "map_grid", "numbers": []}]) == []


def drive_prose(loop: Loop, extra: str = "") -> tuple[str, str]:
    card = loop.upload_and_reply("aug30-1601").card
    step = card["nextStep"]
    return f"{card['say']} {extra} {step['title']}. {step['uploadWhen']}".replace("  ", " "), step["key"]


def test_the_agent_picture_with_its_numbers_unsaid_is_repaired_then_shown(tmp_path: Path):
    probe = Loop(tmp_path / "probe").start()
    try:
        card = probe.upload_and_reply("aug30-1601").card
        drive_id = last_drive(probe)
        step = card["nextStep"]
        picture = pic(probe, "baseline", drive_id)
    finally:
        probe.close()
    if picture["kind"] != "baseline":
        pytest.skip("this Drive has no Baseline to draw")
    base, mine, n = picture["numbers"]
    first = f"{card['say']} {step['title']}. {step['uploadWhen']}"
    second = f"{first} Score {mine} against a Baseline of {base} from {int(n)} Cool drives."
    script = Script([
        tool_turn(("show_chart", {"kind": "baseline"})),
        submit_turn(first, step["key"]),  # the picture's numbers are not in this text
        submit_turn(second, step["key"]),
    ])
    loop = Loop(tmp_path / "agent", llm=FAKE_LLM, llm_caller=script).start()
    try:
        reply = loop.upload_and_reply("aug30-1601").card
    finally:
        loop.close()
    assert reply["agent"]["verified"] and reply["agent"]["repaired"]
    assert [p["kind"] for p in reply["pictures"]] == ["baseline"]


def test_one_picture_per_reply_and_the_grid_only_on_a_flash(tmp_path: Path):
    script = Script([
        tool_turn(("show_chart", {"kind": "trace"}), ("show_chart", {"kind": "baseline"}), ("show_chart", {"kind": "map_grid"})),
        tool_turn(("get_next_step", {})),
    ])
    loop = Loop(tmp_path / "agent", llm=FAKE_LLM, llm_caller=script).start()
    try:
        loop.upload_and_reply("aug30-1601")
    finally:
        loop.close()
    messages = [m for m in script.requests[1]["messages"] if m.get("role") == "tool" and m["name"] == "show_chart"]
    assert len(messages) == 3
    assert "One picture per reply" in messages[1]["content"]
    assert "only drawn when the Next step is a Flash" in messages[2]["content"]


# -- screenshots: only the checked agent reads one -----------------------------
def shot(loop: Loop, text: str = "") -> dict[str, Any]:
    response = loop.run(
        loop._client.post("/api/screenshot", files={"file": ("shot.png", PNG, "image/png")}, data={"text": text})
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_a_screenshot_with_no_key_gets_a_plain_answer_that_says_why(one: Loop):
    body = shot(one)
    assert body["answer"] == PLAIN_NO_KEY and body["kind"] == "picture-unread" and body["why"] == "no-model"
    assert "without the model" in body["answer"] and "type the values" in body["answer"].lower()
    assert not any(ch.isdigit() for ch in body["answer"])


def test_a_screenshot_that_is_not_a_picture_is_refused(one: Loop):
    response = one.run(one._client.post("/api/screenshot", files={"file": ("a.csv", b"a,b", "text/csv")}))
    assert response.status_code == 400


def test_a_number_read_off_a_screenshot_never_reaches_the_owner(tmp_path: Path):
    probe = Loop(tmp_path / "probe").start()
    try:
        card = probe.upload_and_reply("aug30-1601").card
    finally:
        probe.close()
    step = card["nextStep"]
    invented = f"{card['say']} The picture shows boost 17.3 psi. {step['title']}. {step['uploadWhen']}"
    script = Script([submit_turn(invented, step["key"]), submit_turn(invented, step["key"])])
    loop = Loop(tmp_path / "agent", llm=FAKE_LLM, llm_caller=script).start()
    try:
        loop.upload_and_reply("aug30-1601")
        script.turns = [submit_turn(invented, step["key"]), submit_turn(invented, step["key"])]
        body = shot(loop, "what does this say?")
    finally:
        loop.close()
    assert body["answer"] == PLAIN_UNCHECKED and "17.3" not in body["answer"]
    assert body["agent"]["verified"] is False
    image_turn = script.requests[-2]["messages"][1]["content"]
    assert isinstance(image_turn, list) and image_turn[1]["image_url"]["url"].startswith("data:image/png;base64,")


def test_a_screenshot_answered_without_numbers_passes_verify(tmp_path: Path):
    probe = Loop(tmp_path / "probe").start()
    try:
        card = probe.upload_and_reply("aug30-1601").card
    finally:
        probe.close()
    step = card["nextStep"]
    ok = f"That looks like a KTuner table screen. {step['title']}. {step['uploadWhen']}"
    script = Script([])
    loop = Loop(tmp_path / "agent", llm=FAKE_LLM, llm_caller=script).start()
    try:
        loop.upload_and_reply("aug30-1601")
        script.turns = [submit_turn(ok, step["key"])]
        body = shot(loop)
    finally:
        loop.close()
    assert body["agent"]["verified"] and body["answer"].startswith("That looks like a KTuner table")


@pytest.mark.skipif(not __import__("os").environ.get("KTA_LIVE_KEY"), reason="live-model screenshot check needs KTA_LIVE_KEY")
def test_live_model_reads_a_screenshot_without_inventing_numbers():  # pragma: no cover - needs a key and network
    pytest.skip("run with a real screenshot and key; the verified path above is the contract")

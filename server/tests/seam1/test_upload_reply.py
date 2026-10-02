"""Seam 1: what the owner gets for one uploaded Drive (ticket 01).

Every test posts an upload and asserts the reply events — the Verdict sentence,
the four numbers, the Verdict word, the Flash plan headline, the harness steps
and the one Next step. No key, no network.
"""

from __future__ import annotations

import json

from conftest import OWNER_DRIVES, REFERENCE_VERDICTS, Loop


def test_upload_streams_a_reply_with_the_verdict_sentence_the_four_numbers_and_the_plan(loop: Loop):
    reply = loop.upload_and_reply("sep01-0813")

    assert reply.errors() == []
    assert reply.types()[-1] == "RUN_FINISHED"

    # The first sentence answers "am I hurting it?" with this Drive's own numbers.
    say = reply.say
    assert say.startswith("Engine healthy: ")
    assert "full-throttle AFR 10.8 (map asks 11.0, lean limit 12.0)" in say
    assert "Knock Control peak 0.54: costs about 0.5° of timing, not damage" in say
    assert say.endswith(".")

    card = reply.card
    # The four numbers, in the order CONTEXT.md fixes.
    assert [tile["label"] for tile in card["numbers"]] == [
        "intake air, moving",
        "Knock Control, start → peak",
        "worst fuel trim",
        "hard pulls",
    ]
    assert [tile["value"] for tile in card["numbers"]] == ["37", "0.51 → 0.54", "+1.6", "2"]

    # The Verdict word is one of the four, and the plan names the Flash.
    assert card["verdict"] == "OK"
    assert card["flashPlan"]["kind"] == "no-change"
    assert card["flashPlan"]["headline"] == "Your logs support no map change right now."

    # Exactly one Next step.
    assert isinstance(card["nextStep"], dict)
    assert card["nextStep"]["kind"] in {"flash", "watch", "drive", "none"}


def test_a_too_short_drive_says_nothing_read_and_stays_out_of_the_car_history(loop: Loop):
    reply = loop.upload_and_reply("aug30-1509")

    assert reply.say == "Nothing read: under a minute moving"

    card = reply.card
    # CONTEXT.md: a Too-short drive gets no verdict, and no numbers were read.
    assert card["verdict"] is None
    assert card["numbers"] == []
    assert card["flashPlan"] is None
    assert card["nextStep"]["kind"] == "none"

    # Not added to the Car history.
    state = loop.store.list_drives()
    assert [d["id"] for d in state] == ["20260830-150925"]
    assert state[0]["too_short"] is True
    assert loop.store.car_state(None)["drives"] == {}

    # And the safety lines and the numbers were not checked, because there is
    # nothing to read: only four steps ran.
    assert reply.step_names() == ["readLog", "ingestUpload", "carHistory", "flashPlan"]


def test_harness_steps_stream_as_a_collapsed_line_and_expand_to_inputs_and_outputs(loop: Loop):
    reply = loop.upload_and_reply("aug30-1601")

    # One collapsed row, with the server's own count and seconds.
    line = reply.harness_line()
    assert line.startswith("Checked 6 things · ")
    assert line.endswith(" s")

    # Six steps, each with its inputs and its output.
    steps = reply.harness_steps()
    assert [s["name"] for s in steps] == [
        "readLog",
        "ingestUpload",
        "carHistory",
        "overview",
        "driveFacts",
        "flashPlan",
    ]
    first = steps[0]
    assert first["inputs"] == {"fileName": "TunerView_20260830_160151.csv", "bytes": steps[0]["inputs"]["bytes"]}
    assert first["output"]["driveId"] == "20260830-160151"
    assert steps[2]["output"]["baseline"]["value"] == 0.49
    assert steps[3]["output"]["verdict"] == "watch"
    assert steps[5]["output"]["headline"]

    # The raw CSV never rides out on an event.
    streamed = json.dumps(reply.events)
    assert "Time (sec)" not in streamed
    assert len(streamed) < 400_000


def test_the_reply_states_which_drives_it_read(loop: Loop):
    first = loop.upload_and_reply("aug23-1959")
    assert first.window == "based on this Drive only (23 Aug 19:59)"

    second = loop.upload_and_reply("aug23-2038")
    assert second.window == "based on your 2 Drives, 23 Aug 19:59 to 23 Aug 20:38"


def test_the_reply_orders_the_owner_reads_first(loop: Loop):
    reply = loop.upload_and_reply("aug30-1601")
    card = reply.card

    # 1. the sentence, 2. the window, then the numbers, the Verdict word, the
    # Flash plan headline, the harness steps and exactly one Next step.
    assert reply.sentences() == [card["say"], card["window"]]
    assert [tile["label"] for tile in card["numbers"]] == [
        "intake air, moving",
        "Knock Control, start → peak",
        "worst fuel trim",
        "hard pulls",
    ]
    assert card["verdict"] == "Watch"
    assert card["flashPlan"]["headline"]
    assert card["harness"]["line"] == reply.harness_line()
    assert card["nextStep"]["title"]

    # The Knock Control number is read as timing, never as danger.
    assert "not damage" in card["say"]
    assert "danger" not in json.dumps(card).lower()


def test_a_stop_gives_undo_as_the_only_next_step(loop: Loop):
    reply = loop.upload_and_reply("aug23-2038")
    card = reply.card

    assert card["verdict"] == "Stop"
    assert card["say"].startswith("Stop driving hard:")
    assert "worst fuel trim −21.4 %" in card["say"]
    assert card["flashPlan"]["kind"] == "undo"
    assert card["nextStep"]["kind"] == "flash"
    assert "map from before" in card["nextStep"]["title"]


def test_the_owners_nine_drives_in_order_give_the_engine_carc_history_check_verdicts(loop: Loop):
    """The reference is `node tools/car-history-check.js` on the same nine files."""
    replies = loop.run(loop.reply_to_all_owner_drives())

    got = {}
    for example_id, reply in replies:
        assert reply.errors() == [], f"{example_id}: {reply.errors()}"
        snapshot = reply.snapshot()
        drive_id = snapshot["drive"]["id"]
        got[example_id] = "too-short" if snapshot["drive"]["tooShort"] else snapshot["drive"]["verdict"]
        # The Verdict word the owner reads is one of the four.
        assert snapshot["reply"]["verdict"] in (None, "OK", "Watch", "Stop", "Can't tell")

    assert got == REFERENCE_VERDICTS

    # Eight Drives in the Car history, the too-short one kept out of it.
    history = loop.store.car_state(None)["drives"]
    assert len(history) == 8
    assert "20260830-150925" not in history
    assert history["20260823-203853"]["verdict"] == "stop"


def test_the_raw_csv_and_the_car_history_survive_a_restart(loop: Loop):
    loop.upload_and_reply("sep01-0813")
    upload_id = loop.store.list_drives()[0]["upload_id"]
    size = loop.store.get_upload(upload_id)["bytes"]
    assert size > 100_000
    assert loop.store.get_upload(upload_id)["csv"].decode("utf-8", "replace").startswith("Timestamp;")

    # A restart: a brand new Store and a brand new Worker over the same file.
    restarted = loop.restart()
    try:
        state = restarted.store.car_state(None)
        assert "20260901-081358" in state["drives"]
        assert restarted.store.get_upload(upload_id)["bytes"] == size

        # The next upload still reads the Car history that was stored.
        follow_up = restarted.upload_and_reply("sep05-0756")
        assert follow_up.errors() == []
        assert follow_up.card["verdict"] == "OK"
        assert "20260901-081358" in restarted.store.car_state(None)["drives"]
    finally:
        restarted.close()
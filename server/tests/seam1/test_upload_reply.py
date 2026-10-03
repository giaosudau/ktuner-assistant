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

    # Which Map version this Drive ran on, right under the numbers.
    assert card["mapVersion"]["line"] == "on Map version 1 · Starter 21 Dual Tune 2"
    assert card["mapVersion"]["version"] == 1

    # The Verdict word is one of the four, and the plan names the Flash.
    assert card["verdict"] == "OK"
    assert card["flashPlan"]["kind"] == "no-change"
    assert card["flashPlan"]["headline"] == "Your logs support no map change right now."

    # Exactly one Next step.
    assert isinstance(card["nextStep"], dict)
    assert card["nextStep"]["kind"] in {"flash", "watch", "drive", "none"}


def test_a_too_short_drive_says_nothing_read_and_stays_out_of_the_car_history(loop: Loop):
    # One Drive first, so there is an Open step waiting: a Too-short Drive is only
    # a Wasted drive when it settled nothing (ticket 04), and with nothing asked
    # there is nothing to waste.
    loop.upload_and_reply("aug23-2038")
    reply = loop.upload_and_reply("aug30-1509")

    assert reply.say == "Nothing read: under a minute moving"

    card = reply.card
    # CONTEXT.md: a Too-short drive gets no verdict, and no numbers were read.
    assert card["verdict"] is None
    assert card["numbers"] == []
    assert card["flashPlan"] is None
    # It read nothing, so it says exactly one thing: no Map version line either.
    assert card["mapVersion"] is None
    assert card["nextStep"]["kind"] == "none"
    # Ticket 04: it settles no Open step at all, and says what would have.
    assert card["settled"] == []
    assert card["wasted"] == (
        "This Drive settles nothing: it was too short (under a minute moving). "
        "A drive of 10 calm minutes would have settled the Undo."
    )
    # And the step it could not settle is the one that still stands.
    assert "Undo: trims back within ±5 %" in card["nextStep"]["body"]

    # Not added to the Car history: only the Drive before it is in there.
    state = loop.store.list_drives()
    assert [d["id"] for d in state] == ["20260830-150925", "20260823-203853"]
    assert state[0]["too_short"] is True
    assert "20260830-150925" not in loop.store.car_state(None)["drives"]
    assert "20260823-203853" in loop.store.car_state(None)["drives"]

    # The safety lines and the numbers were not checked, because there is nothing
    # to read — but settling and deciding still ran, so the owner is told the
    # Drive settled nothing and which step stands.
    assert reply.step_names() == [
        "readLog",
        "ingestUpload",
        "carHistory",
        "flashPlan",
        "settleOpenSteps",
        "nextStep",
    ]


def test_harness_steps_stream_as_a_collapsed_line_and_expand_to_inputs_and_outputs(loop: Loop):
    reply = loop.upload_and_reply("aug30-1601")

    # One collapsed row, with the server's own count and seconds. Ticket 04 added
    # the two loop steps (settle what was asked, decide the Next step), so the
    # line now counts eight, and they are steps the owner can expand like any other.
    line = reply.harness_line()
    assert line.startswith("Checked 8 things · ")
    assert line.endswith(" s")

    # Eight steps, each with its inputs and its output.
    steps = reply.harness_steps()
    assert [s["name"] for s in steps] == [
        "readLog",
        "ingestUpload",
        "carHistory",
        "overview",
        "driveFacts",
        "flashPlan",
        "settleOpenSteps",
        "nextStep",
    ]
    first = steps[0]
    assert first["inputs"] == {"fileName": "TunerView_20260830_160151.csv", "bytes": steps[0]["inputs"]["bytes"]}
    assert first["output"]["driveId"] == "20260830-160151"
    assert steps[2]["output"]["baseline"]["value"] == 0.49
    assert steps[3]["output"]["verdict"] == "watch"
    assert steps[5]["output"]["headline"]
    # The two loop steps say what they settled and what they decided. This is the
    # first Drive, so there was nothing to settle and nothing open — and it opens
    # the Baseline step, the lugging habit seen today beside it, and the two
    # channels to add in TunerView (ticket 04's named case).
    assert steps[6]["output"]["settled"] == []
    assert steps[6]["output"]["openSteps"] == []
    assert [s["key"] for s in steps[7]["output"]["openSteps"]] == ["baseline", "habit", "channels"]
    assert steps[7]["output"]["step"]["key"] == "baseline"
    assert steps[7]["output"]["step"]["also"] == "habit"
    assert steps[7]["output"]["step"]["settlesOn"]

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

    # 1. the sentence, 2. the window, then the numbers, the Map version this
    # Drive ran on, the Verdict word, the Flash plan headline, the harness steps
    # and exactly one Next step.
    assert reply.sentences() == [card["say"], card["window"]]
    assert [tile["label"] for tile in card["numbers"]] == [
        "intake air, moving",
        "Knock Control, start → peak",
        "worst fuel trim",
        "hard pulls",
    ]
    assert card["mapVersion"]["line"] == "on Map version 1 · Starter 21 Dual Tune 2"
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
    assert card["mapVersion"]["line"] == "on Map version 1 · Starter 21 Dual Tune 2"
    assert card["flashPlan"]["kind"] == "undo"
    assert card["nextStep"]["kind"] == "flash"
    assert "map from before" in card["nextStep"]["title"]
    # The owner never flashed anything she recorded, so the Undo names no file and
    # asks once: "tell me what you flashed" rather than an invented name.
    assert card["flashPlan"]["undo"]["known"] is False
    assert "tell me what you flashed" in card["nextStep"]["body"]
    assert "Starter 21 Dual Tune 2" not in card["nextStep"]["body"].split("Then drive")[0]


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


def test_a_fresh_car_is_on_map_version_1_before_any_upload(loop: Loop):
    """No Drive has been uploaded: the app already knows which map the car is on."""
    body = loop.get("/api/state").json()

    versions = body["mapVersions"]
    assert [v["id"] for v in versions] == [1], "exactly Map version 1, before any Drive"
    assert versions[0]["name"] == "Starter 21 Dual Tune 2"
    assert versions[0]["kind"] == "ktuner-basemap"
    assert body["activeMapVersion"]["id"] == 1
    assert body["carHistory"] == []
    assert body["ktunerBasemap"] == "Starter 21 Dual Tune 2"

    # …with its full tables, stored beside it rather than in every Drive report.
    held = loop.store.map_version(1)
    assert held["has_tables"] is True
    assert held["tables"]["MAF_Scaling_Custom"]["values"][0], "the AFM Flow curve is held"
    assert len(held["tables"]["Boost_Target_1_Normal_L"]["values"]) == 20
    assert len(held["tables"]) == 39
    # The list the state panel reads stays small: no table arrays ride out.
    assert "tables" not in versions[0]
    assert len(json.dumps(body)) < 60_000


def test_every_one_of_the_owners_nine_drives_says_which_map_version_it_ran_on(loop: Loop):
    """The app knows from the first Drive: Map version 1 on all nine."""
    replies = loop.run(loop.reply_to_all_owner_drives())

    seen = []
    for example_id, reply in replies:
        card = reply.card
        drive = reply.snapshot()["drive"]
        if drive["tooShort"]:
            # A Too-short Drive says exactly one thing, so it names no Map.
            assert card["mapVersion"] is None, example_id
            continue
        line = card["mapVersion"]["line"]
        assert line == "on Map version 1 · Starter 21 Dual Tune 2", example_id
        assert card["mapVersion"]["version"] == 1
        assert card["mapVersion"]["name"] == "Starter 21 Dual Tune 2"
        assert drive["map"]["version"] == 1
        seen.append(example_id)

    assert len(seen) == 8, "every Drive that was read names its Map version"
    assert "not recorded" not in json.dumps([r.card for _, r in replies]).lower()

    # The Car history rows carry the number too, so a Drive read later still knows.
    rows = loop.get("/api/state").json()["carHistory"]
    assert [r["mapVersion"] for r in rows] == [1] * 8
    assert [r["map"] for r in rows] == ["Starter 21 Dual Tune 2"] * 8


def test_the_first_drive_is_not_a_shakedown_drive(loop: Loop):
    """The prototype made the first Drive a Shakedown drive by recording the
    starting map as a Flash. Map version 1 starts no Shakedown drive."""
    first = loop.upload_and_reply("aug22-0903")
    assert first.snapshot()["drive"]["firstDrive"] is True
    assert first.snapshot()["drive"]["isShakedown"] is False
    assert first.card["mapVersion"]["version"] == 1
    assert loop.store.car_state(None)["shakedown"]["status"] == "none"

    # Every one of the nine runs on Map version 1, so none of them is one either.
    replies = dict(loop.run(loop.reply_to_all_owner_drives()))
    assert {r.snapshot()["drive"]["isShakedown"] for r in replies.values()} == {False}

    # A Flash the owner confirms is the next Map version, and it does start a
    # Shakedown drive from the next Drive — the thing Map version 1 never does.
    flashed = loop.run(loop.worker.call(
        "recordFlash",
        state=loop.store.car_state(None),
        flash={"time": 1756723200000, "map": "Starter 21 r2", "changed": "afm"},
        now=1756723200000,
    ))
    assert flashed["version"]["n"] == 2
    loop.store.save_car_state(flashed["state"])
    after = loop.upload_and_reply("sep05-0756")
    assert after.snapshot()["drive"]["isShakedown"] is True
    assert after.snapshot()["drive"]["map"]["version"] == 2
    assert after.card["mapVersion"]["line"] == "on Map version 2 · Starter 21 r2"


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
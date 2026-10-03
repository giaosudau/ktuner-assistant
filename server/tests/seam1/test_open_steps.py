"""Seam 1: Open steps and the Next step (ticket 04).

Every reply closes the loop and gives exactly one Next step. These tests post the
owner's nine real Drives in order — the loop eval — and assert what the chat would
show back: what was asked last time and how this Drive settled it, the one Next
step with its drive recipe or gauge table, the Drive whose upload will settle it,
and the Open steps list beside the thread.

No key, no network, no LLM: the decisions are the engine's and the words are the
built-in ones.
"""

from __future__ import annotations

import json

from conftest import OWNER_DRIVES, Loop, template_replies

# Drive → (what the Next step is, what settles it), as the ticket's fixed order
# walks the owner's own nine uploads. 30 Aug 16:01 opens the lugging habit beside
# the Baseline step; 5 Sep 07:56 is the dead-gauge Drive.
LOOP_PATH = [
    ("aug22-0903", "Log one Cool-morning drive with 2 pulls", "drive"),
    ("aug22-0950", "Log one Cool-morning drive with 2 pulls", "drive"),
    ("aug23-1959", "Log one Cool-morning drive with 2 pulls", "drive"),
    ("aug23-2038", "Put the map from before back on the car", "flash"),
    ("aug30-1509", "Nothing read: the drive was too short", "none"),
    ("aug30-1529", "Log one Cool-morning drive with 2 pulls", "drive"),
    ("aug30-1601", "Log one Cool-morning drive with 2 pulls", "drive"),
    ("sep01-0813", "Habit test: log your next hot-afternoon Drive", "drive"),
    ("sep05-0756", "Your logger recorded 4 dead gauges", "watch"),
]


def the_loop(replayed: Loop) -> dict:
    """The owner's nine Drives in order, as nine replies (replayed once)."""
    return template_replies(replayed)


def test_the_nine_drives_give_the_loop_the_ticket_fixes(replayed: Loop):
    replies = the_loop(replayed)
    got = [(example_id, r.card["nextStep"]["title"], r.card["nextStep"]["kind"]) for example_id, r in replies.items()]
    assert got == LOOP_PATH
    # Exactly one Next step per reply, every time. Never a list.
    for example_id, reply in replies.items():
        step = reply.card["nextStep"]
        assert isinstance(step, dict) and step["title"], example_id
        assert step["kind"] in {"flash", "watch", "drive", "none"}, example_id


def test_every_next_step_names_the_drive_whose_upload_will_settle_it(replayed: Loop):
    replies = the_loop(replayed)
    for example_id, reply in replies.items():
        step = reply.card["nextStep"]
        assert step["upload"], example_id
        assert step["uploadWhen"] == f"Upload when: {step['upload']}.", example_id
        assert step["proves"] != "nothing", example_id


def test_a_repeated_step_reads_compactly_and_never_again_as_an_essay(replayed: Loop):
    replies = the_loop(replayed)
    for example_id in ("aug22-0950", "aug23-1959"):
        step = replies[example_id].card["nextStep"]
        assert step["same"] is True, example_id
        assert step["body"] == "", "one short line, not a repeated essay"
        assert step["gauges"] is None and step["recipe"] is None
        assert step["title"], "but the owner still knows what to do"
    # The first Drive is a full step, and a Drive that brings news of its own is too.
    assert replies["aug22-0903"].card["nextStep"]["same"] is False
    assert replies["aug30-1601"].card["nextStep"]["same"] is False


def test_the_reply_settles_what_it_asked_last_time_with_the_numbers(replayed: Loop):
    replies = the_loop(replayed)
    # 23 Aug 20:38 asked for the Undo; 30 Aug 15:29 proved it, in two Drives.
    settled = {(r["key"], r["status"]) for r in replies["aug30-1529"].card["settled"]}
    assert ("undo", "done") in settled, settled
    undo = [r for r in replies["aug30-1529"].card["settled"] if r["key"] == "undo"][0]
    assert undo["word"] == "Done"
    assert undo["title"] == "Undo: trims back within ±5 %"
    assert "Trims −2.3 % over 15 calm minutes" in undo["why"]
    assert "they were −21.4 %" in undo["why"]

    # 1 Sep 08:13 is the Drive the Baseline has been waiting for.
    baseline = [r for r in replies["sep01-0813"].card["settled"] if r["key"] == "baseline"][0]
    assert baseline["word"] == "Done"
    assert "Intake 37 °C, 2 pulls" in baseline["why"]


def test_cant_tell_yet_always_says_why_on_the_owner_drives(replayed: Loop):
    replies = the_loop(replayed)
    waits = [
        row
        for reply in replies.values()
        for row in reply.card["settled"]
        if row["status"] == "wait"
    ]
    assert waits, "the nine Drives leave plenty of things it could not settle"
    for row in waits:
        assert row["word"] == "Can't tell yet"
        assert row["why"], row
        low = row["why"].lower()
        for banned in ("failed", "failure", "try again", "wrong", "bad"):
            assert banned not in low, row["why"]
    # The habit cannot be scored on a Cool Drive, and says so with the number.
    habit = [
        row
        for example_id in ("sep01-0813", "sep05-0756")
        for row in replies[example_id].card["settled"]
        if row["key"] == "habit"
    ]
    assert habit and all("hot afternoon" in r["why"] for r in habit), habit


def test_the_ticket_s_case_30_aug_16_01_gives_the_baseline_step_with_the_habit_added(replayed: Loop):
    replies = the_loop(replayed)
    card = replies["aug30-1601"].card
    step = card["nextStep"]

    # The Baseline is the step, with 2 pulls and a cool intake asked for.
    assert step["title"] == "Log one Cool-morning drive with 2 pulls"
    assert step["kind"] == "drive"
    assert step["uploadWhen"] == "Upload when: after that morning Drive."
    assert "intake under 42 °C" in step["recipe"]["steps"][0]
    assert "two pulls in S, 50 → 100 km/h" in step["recipe"]["steps"][2]

    # The lugging cause seen today is added as an Open step and told as a free habit.
    assert step["also"]["key"] == "habit"
    assert "Knock Control went 0.49 → 0.65" in step["also"]["why"]
    assert "1.6° of timing taken under boost. Not damage." in step["also"]["why"]
    assert step["also"]["steps"][0].startswith("Below 60 km/h, put it in S")
    habit = [s for s in card["openSteps"] if s["key"] == "habit"][0]
    assert habit["status"] == "open"
    assert habit["title"] == "Habit test: revs up in hot traffic"

    # …and it is in the panel beside the thread, with its status (the panel is
    # read at the end of the replay, so the habit has been asked about since).
    panel = {s["key"]: s for s in replayed.get("/api/state").json()["openSteps"]}
    assert panel["habit"]["status"] in {"open", "wait", "fail"}
    assert panel["habit"]["title"] == "Habit test: revs up in hot traffic"
    assert "hot afternoon" in panel["habit"]["why"]
    assert "baseline" not in panel, "the Baseline is proven on 1 Sep, so it is no longer Open"


def test_the_chat_shows_the_next_step_with_its_gauge_table_and_drive_recipe(replayed: Loop):
    replies = the_loop(replayed)

    # A watch step: the gauge table, TunerView's own names, OK / If you see / Then.
    logger = replies["sep05-0756"].card["nextStep"]
    assert logger["kind"] == "watch"
    assert logger["gauges"]["columns"] == ["Gauge in TunerView", "OK", "If you see", "Then"]
    gauge = logger["gauges"]["rows"][0]
    assert gauge["gauge"] == "DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target"
    assert gauge["ok"] == "move as you drive"
    assert gauge["see"] == "stuck on one number"
    assert "Remove it from the gauge list" in gauge["then"]

    # A drive step: the recipe, numbered and physical, and its gauges.
    baseline = replies["aug30-1601"].card["nextStep"]
    assert len(baseline["recipe"]["steps"]) == 4, "the fourth line adds the two channels to log"
    assert [r["gauge"] for r in baseline["gauges"]["rows"]] == [
        "IAT2",
        "Knock Control",
        "O2 (AFR) at full throttle",
        "Turbo Pressure",
    ]
    iat = baseline["gauges"]["rows"][0]
    assert iat["ok"] == "under 42 °C moving, under 48 °C when a pull starts"

    # A Flash step carries the Flash plan and nothing else: its cells come only
    # from the plan (ticket 13 draws the card).
    undo = replies["aug23-2038"].card["nextStep"]
    assert undo["kind"] == "flash"
    assert undo["flashPlan"]["kind"] == "undo"
    assert undo["gauges"] is None and undo["recipe"] is None
    assert "Shakedown drive" in undo["body"]


def test_a_wasted_drive_is_flagged_kindly_with_what_would_have_settled_one(replayed: Loop):
    replies = the_loop(replayed)

    # 30 Aug 15:09, under a minute moving: nothing read, and the Undo waits.
    wasted = replies["aug30-1509"].card["wasted"]
    assert wasted == (
        "This Drive settles nothing: it was too short (under a minute moving). "
        "A drive of 10 calm minutes would have settled the Undo."
    )
    assert "Undo" in replies["aug30-1509"].card["nextStep"]["body"]

    # 5 Sep 07:56 lost four gauges. What it could not settle is the step the owner is
    # holding by then — the habit test — and it says so with the gauges.
    dead = replies["sep05-0756"].card["wasted"]
    assert dead.startswith("This Drive settles nothing: the logger lost DIFP")
    assert dead.endswith("A hot-afternoon drive would have settled the habit test, with every gauge moving.")

    # Never a scolding, and never counted against the owner on screen.
    for line in (wasted, dead):
        low = line.lower()
        for banned in ("waste", "wasted", "failed", "mistake", "wrong", "again"):
            assert banned not in low, line

    # A Drive that settled something is not flagged.
    assert replies["aug30-1529"].card["wasted"] is None
    assert replies["sep01-0813"].card["wasted"] is None


def test_the_open_steps_sit_beside_the_thread_with_their_status_and_the_question_slot(replayed: Loop):
    the_loop(replayed)
    body = replayed.get("/api/state").json()
    keys = [s["key"] for s in body["openSteps"]]
    assert keys == ["channels", "habit", "logger"], keys
    for step in body["openSteps"]:
        assert step["status"] in {"open", "wait", "fail"}, step
        assert step["title"] and step["why"], step
        assert step["askedOn"], "every Open step says which Drive asked it"
    # The settled ones are gone from the panel but stay in the Car history.
    assert "undo" not in keys, "a proven step is not an Open step any more"
    assert replayed.store.list_open_steps() != replayed.store.list_open_steps(only_open=True)

    # Ticket 07 fills this: unanswered questions read as "Waiting for you".
    # After the nine Drives with no answers: what changed + housing on 20:38,
    # did-you-flash on 15:29 — asked once, never answered.
    waiting = body["unansweredQuestions"]
    assert [(q["id"], q["title"]) for q in waiting] == [
        ("what-changed:20260823-203853", "What changed"),
        ("housing:20260823-203853", "Which intake housing is fitted"),
        ("did-flash:20260830-152931", "Did you flash"),
    ], waiting


def test_the_replay_reads_end_to_end_and_never_leaks_a_raw_log(replayed: Loop):
    replies = the_loop(replayed)
    for example_id, reply in replies.items():
        assert reply.errors() == [], example_id
        blob = json.dumps(reply.events)
        assert "Timestamp;" not in blob, example_id
        assert len(blob) < 400_000, example_id


def test_every_drive_of_the_nine_is_read_against_the_same_open_steps(replayed: Loop):
    """One Drive, settled twice, gives the same reply: the loop is deterministic."""
    replies = the_loop(replayed)
    again = replayed.upload_and_reply("sep05-0756")
    assert again.card["nextStep"]["key"] == replies["sep05-0756"].card["nextStep"]["key"]
    assert again.card["say"] == replies["sep05-0756"].card["say"]
    assert len(replayed.store.car_state(None)["drives"]) == 8

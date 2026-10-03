"""Seam 1: Diagnose one cause per symptom pattern (ticket 06).

The engine reads the symptom pattern like a tuner before deciding the Next
step — one cause, one step — and the reply states the cause in one sentence
with its evidence. These tests post the owner's real Drives and assert what
the chat shows back: the cause sentence on the fault drive and the habit
drive, silence everywhere else, and the same Next steps the loop eval locks.
"""

from __future__ import annotations

from conftest import Loop

from kta_server import copy as C


def the_loop(loop: Loop) -> dict:
    """The owner's nine Drives in order, as nine replies."""
    return dict(loop.run(loop.reply_to_all_owner_drives()))


def test_the_fault_drive_names_its_cause_in_one_sentence(loop: Loop):
    replies = the_loop(loop)
    card = replies["aug23-2038"].card
    cause = card["cause"]
    assert cause is not None, "20:38 carries a diagnosed cause"
    assert "every band" in cause
    assert "first minute" in cause
    assert "right after a change" in cause
    assert "airflow reading is off" in cause
    # One sentence, not an essay.
    assert len(cause) < 200, cause
    # And the step is still Undo with an empty Undo plan: diagnose explains the
    # step, never moves it and never edits a curve.
    assert card["nextStep"]["key"] == "undo"
    assert card["flashPlan"]["kind"] == "undo"
    assert card["flashPlan"]["cellCount"] == 0


def test_the_hot_lugging_drive_names_the_habit_in_one_sentence(loop: Loop):
    replies = the_loop(loop)
    card = replies["aug30-1601"].card
    cause = card["cause"]
    assert cause is not None
    assert "0.49 → 0.65" in cause
    assert "keep the revs up" in cause
    # The Baseline stays the step; the habit waits beside it.
    assert card["nextStep"]["key"] == "baseline"
    assert card["nextStep"]["also"]["key"] == "habit"


def test_drives_with_no_pattern_carry_no_cause_sentence(loop: Loop):
    replies = the_loop(loop)
    for example_id in (
        "aug22-0903", "aug22-0950", "aug23-1959",
        "aug30-1529", "sep01-0813", "sep05-0756",
    ):
        assert replies[example_id].card["cause"] is None, example_id
    # A Too-short drive read nothing, so it diagnoses nothing either.
    assert replies["aug30-1509"].card["cause"] is None


def test_the_cause_sentence_uses_only_the_owner_s_words(loop: Loop):
    replies = the_loop(loop)
    banned = (
        "knock retard", "anomaly", "alert", "dashboard", "bad log",
        "danger", "failed", "mistake", "wrong", "try again",
    )
    for example_id, reply in replies.items():
        cause = reply.card["cause"]
        if cause is None:
            continue
        low = cause.lower()
        for word in banned:
            assert word not in low, f"{example_id}: '{word}' in {cause}"
        # No KTuner table name anywhere in the sentence: only the Flash plan
        # names those.
        for table in ("MAF_Scaling_Custom", "WOT_Enrich", "Boost_Target", "Final_Boost"):
            assert table not in cause, f"{example_id}: '{table}' in {cause}"


def test_an_install_step_reads_as_a_physical_check_with_no_map_change(loop: Loop):
    step = {
        "key": "install", "kind": "watch", "opens": "install", "also": None,
        "title": "Check the install: clamps and flanges", "gauges": ["trims", "afr"],
        "proves": "trims back within ±5 % and the mixture on target",
        "settlesOn": "after your next drive, any kind",
        "same": False, "cause": None,
        "diagnose": {"sentence": "Trims add +9.2 % at idle and low airflow but read fine higher up, right after a change: air is getting in past the sensor, so no map change."},
        "previous": None, "flat": [],
    }
    card = C.next_step_card(step, {"kind": "no-change", "headline": "Your logs support no map change right now."}, {"trimOk": 5, "trimStop": 10, "mapTargetAfr": 11.0, "leanLimitAfr": 12.0}, [])
    assert card["kind"] == "watch"
    assert "no map change" in card["body"].lower()
    assert len(card["recipe"]["steps"]) == 3
    assert [r["gauge"] for r in card["gauges"]["rows"]] == ["STFT B1 + LTFT B1", "O2 (AFR) at full throttle"]
    assert card["uploadWhen"] == "Upload when: after your next drive, any kind."


def test_a_downpipe_flash_step_carries_the_plan_headline_not_an_undo(loop: Loop):
    step = {
        "key": "downpipe", "kind": "flash", "opens": "downpipe", "also": None,
        "title": "Flash the downpipe trim, then two pulls", "gauges": ["boost", "afr"],
        "proves": "overshoot under +2.5 psi on pulls with the mixture on target",
        "settlesOn": "after two pulls on a cool morning",
        "same": False, "cause": None, "diagnose": {"sentence": "x."},
        "previous": None, "flat": [],
    }
    plan = {
        "kind": "one-family", "headline": "Boost targets, low rpm: −1 psi at 2,500–3,250 rpm, because overshoot held 3.0 psi.",
        "saveAs": "Starter 21 Dual Tune 2 · 20260830 · boost r1",
    }
    card = C.next_step_card(step, plan, {}, [])
    assert card["kind"] == "flash"
    assert "−1 psi at 2,500–3,250 rpm" in card["body"]
    assert "Shakedown drive" in card["body"]
    assert "previous map file" not in card["body"], "a forward change is not an Undo"

"""Seam 1: the words. What the owner reads is product work, so it is tested.

Every assertion here is a promise the reply makes: the first sentence answers
"am I hurting it?" with this Drive's numbers, the Knock Control score is read as
timing and never as danger, a Too-short Drive says exactly one thing, and no
word outside CONTEXT.md's vocabulary sneaks in.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

from conftest import Loop, owner_csv

from kta_server import copy as C

LIMITS = {
    "mapTargetAfr": 11.0,
    "leanLimitAfr": 12.0,
    "trimOk": 5,
}


def drive(verdict: str, **summary) -> dict:
    return {"verdict": verdict, "tooShort": False, "summary": summary}


# -- the first sentence --------------------------------------------------
def test_the_first_sentence_answers_am_i_hurting_it_with_this_drive_numbers():
    say = C.first_sentence(
        drive(
            "good",
            mixLeanest=10.8,
            mixTarget=11.0,
            kcPeak=0.54,
            timingCostDeg=0.5,
            trimWorst=1.6,
        ),
        LIMITS,
    )
    assert say == (
        "Engine healthy: full-throttle AFR 10.8 (map asks 11.0, lean limit 12.0), "
        "Knock Control peak 0.54: costs about 0.5° of timing, not damage."
    )


def test_the_fuel_quality_score_is_read_as_timing_never_as_danger():
    say = C.first_sentence(
        drive("watch", mixLeanest=10.5, mixTarget=11.0, kcPeak=0.65, timingCostDeg=1.6, trimWorst=-2.4), LIMITS
    )
    assert "costs about 1.6° of timing, not damage" in say
    assert "danger" not in say.lower()
    assert "Knock Control" in say


def test_the_timing_a_score_costs_comes_from_the_worker_not_from_python(loop: Loop):
    """1.6° at a peak of 0.65 is 10.2 x (0.65 - 0.49) — fact-check.md §2.

    The worker does that arithmetic with the engine's own constants and hands
    the degree over; the copy module never multiplies a score by anything.
    """
    reply = loop.upload_and_reply("aug30-1601")
    summary = reply.snapshot()["drive"]["summary"]
    assert summary["kcPeak"] == 0.65
    assert summary["timingCostDeg"] == 1.6
    assert "costs about 1.6° of timing, not damage" in reply.card["say"]

    source = Path(C.__file__).read_text(encoding="utf-8")
    assert "10.2" not in source, "the timing constant lives in the engine, not in the copy"
    assert "0.49" not in source


def test_a_trim_stop_puts_the_trims_first_because_they_are_the_cause():
    say = C.first_sentence(drive("stop", kcPeak=0.5, timingCostDeg=0.1, trimWorst=-21.4), LIMITS)
    assert say.startswith("Stop driving hard: worst fuel trim −21.4 %, ")


# -- the after-flash note ------------------------------------------------
def test_a_fresh_flash_that_settles_is_reassurance_not_an_alarm():
    """Ticket 02: the after-flash pattern is exempt, and the owner is told so."""
    note = C.after_flash_note({"afterFlash": {"start": 0.58, "end": 0.49}})
    assert note == (
        "Knock Control started at 0.58 and settled to your Baseline (0.49): "
        "that is what a fresh flash does."
    )
    # Every word here is reassurance; "exempt", "baseline drift" and "ok" are not.
    assert "exempt" not in note.lower()
    assert "baseline drift" not in note.lower()


def test_no_after_flash_note_when_the_drive_did_not_settle_that_way():
    assert C.after_flash_note({"afterFlash": None}) is None
    assert C.after_flash_note({}) is None
    assert C.after_flash_note({"afterFlash": {"start": None, "end": 0.49}}) is None


def test_the_owner_s_own_after_flash_drive_says_it_in_the_reply():
    """30 Aug 15:29 starts 0.58 and settles to 0.49 — the real Drive, not a stub."""
    loop = Loop(Path(tempfile.mkdtemp())).start()
    try:
        replies = dict(loop.run(loop.reply_to_all_owner_drives()))
    finally:
        loop.close()
    card = replies["aug30-1529"].card
    assert card["afterFlash"] == (
        "Knock Control started at 0.58 and settled to your Baseline (0.49): "
        "that is what a fresh flash does."
    )
    # It is reassurance, not a Stop: the Drive is still a Watch, and the
    # after-flash note is the reassurance, not the Verdict word.
    assert card["verdict"] == "Watch"
    assert card["verdict"] != "Stop"
    # Only the Drive that settles that way carries it.
    assert "aug30-1601" in replies
    assert replies["aug30-1601"].card["afterFlash"] is None


def test_trims_inside_five_percent_never_reach_the_first_sentence():
    say = C.first_sentence(drive("good", kcPeak=0.5, timingCostDeg=0.1, trimWorst=-2.4), LIMITS)
    assert "fuel trim" not in say


def test_a_too_short_drive_says_exactly_one_thing():
    assert C.first_sentence({"tooShort": True, "verdict": "nodata", "summary": None}, LIMITS) == (
        "Nothing read: under a minute moving"
    )


# -- the four numbers ----------------------------------------------------
def test_the_four_numbers_are_the_four_contxt_names_them():
    numbers = C.four_numbers(
        drive("watch", iatMoving=53, kcStart=0.49, kcPeak=0.65, trimWorst=-2.4, hardPulls=2)
    )
    assert [x["label"] for x in numbers] == [
        "intake air, moving",
        "Knock Control, start → peak",
        "worst fuel trim",
        "hard pulls",
    ]
    assert [x["value"] for x in numbers] == ["53", "0.49 → 0.65", "−2.4", "2"]


def test_the_verdict_word_is_one_of_the_four():
    for verdict, word in [("good", "OK"), ("watch", "Watch"), ("stop", "Stop"), ("nodata", "Can't tell")]:
        assert C.verdict_word(drive(verdict)) == word
    assert C.verdict_word({"tooShort": True}) is None, "a Too-short drive gets no verdict"


# -- the window ----------------------------------------------------------
def test_the_window_says_which_drives_were_read():
    assert C.window_line(["20260901-081358"], 1) == "based on this Drive only (01 Sep 08:13)"
    assert C.window_line(["20260823-195901", "20260823-203853"], 2) == (
        "based on your 2 Drives, 23 Aug 19:59 to 23 Aug 20:38"
    )
    assert C.window_line([], 0) == "nothing read yet"


def test_a_too_short_drive_says_it_read_nothing_rather_than_pretending():
    line = C.window_line(["20260822-090322", "20260822-095021"], 2, too_short=True)
    assert line == "nothing read — your Car history still holds 2 Drives"


# -- one Next step, always ------------------------------------------------
def test_exactly_one_next_step_and_never_a_list():
    for verdict in ("good", "watch", "stop", "nodata"):
        step = C.next_step(drive(verdict, kcPeak=0.5, timingCostDeg=0.1, trimWorst=-1.0), {"kind": "no-change", "headline": "x"})
        assert set(step) >= {"kind", "title", "body", "proves", "upload"}
        assert isinstance(step["title"], str) and step["title"]
        assert "1." not in step["title"] and "2." not in step["title"]


def test_a_stop_makes_undo_the_only_next_step():
    step = C.next_step(
        drive("stop", trimWorst=-21.4), {"kind": "undo", "headline": "Stop open: …", "undoName": "Flash Starter 21 · 23 Aug 20:00"}
    )
    assert step["kind"] == "flash"
    assert "Undo" in step["body"] or "map from before" in step["title"]
    assert "Shakedown drive" in step["body"]


def test_a_dead_gauge_is_a_watch_step_naming_the_gauge_as_tunerview_spells_it():
    step = C.next_step(drive("good", flat=["fp", "cvt", "boost", "boostTarget"], kcPeak=0.5, trimWorst=-1.6), None)
    assert step["kind"] == "watch"
    for name in ("DIFP", "Transmission Temperature", "Turbo Pressure"):
        assert name in step["body"]


# -- vocabulary -----------------------------------------------------------
BANNED = [
    "knock count",
    "knock retard",
    "anomaly",
    "alert",
    "dashboard",
    "bad log",
    "tune version",
    "recommendation",
    "suggestion",
    "todo",
    "stock map",
    "base tune",
    "danger",
]


def our_own_words(card: dict) -> str:
    """Only the copy this repo writes: the engine's check labels and the Flash
    plan's own wording travel verbatim as evidence and are not ours to change."""
    return json.dumps(
        {
            "say": card["say"],
            "window": card["window"],
            "verdict": card["verdict"],
            "numbers": card["numbers"],
            "nextStep": card["nextStep"],
        }
    ).lower()


def test_no_reply_uses_a_word_context_says_to_avoid(loop: Loop):
    for example_id in ("aug23-2038", "sep05-0756", "sep01-0813", "aug30-1601"):
        reply = loop.upload_and_reply(example_id)
        blob = our_own_words(reply.card)
        for word in BANNED:
            assert word not in blob, f"{example_id}: '{word}' in {reply.card['say']}"


def test_ktuner_names_are_spelled_the_way_ktuner_spells_them(loop: Loop):
    # The map the owner started from, named exactly as KTuner names it.
    state = loop.get("/api/state")
    assert state.json()["ktunerBasemap"] == "Starter 21 Dual Tune 2"
    # The gauge names the dead-gauge step uses.
    assert C.channel_name("boost") == "Turbo Pressure"
    assert C.channel_name("fp") == "DIFP"
    assert C.channel_name("cvt") == "Transmission Temperature"
    assert C.channel_name("kControl") == "Knock Control"
    assert C.channel_name("iat2") == "IAT2"
    # And the Flash plan's own words are the engine's, untouched.
    plan = loop.upload_and_reply("sep01-0813").card["flashPlan"]
    assert "MAF Scaling" in json.dumps(plan.get("levers", [])) or plan["kind"] == "no-change"


def test_the_reply_never_promises_power_or_calls_the_drive_dangerous(loop: Loop):
    reply = loop.upload_and_reply("aug30-1601")
    say = reply.card["say"].lower()
    for word in ("power", "danger", "safe to drive fast", "ruin", "warranty"):
        assert word not in say
    # The reassurance the owner came for, in the engine's own numbers.
    assert "not damage" in say
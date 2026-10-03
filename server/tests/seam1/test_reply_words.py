"""Seam 1: the words. What the owner reads is product work, so it is tested.

Every assertion here is a promise the reply makes: the first sentence answers
"am I hurting it?" with this Drive's numbers, the Knock Control score is read as
timing and never as danger, a Too-short Drive says exactly one thing, and no
word outside CONTEXT.md's vocabulary sneaks in.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from conftest import Loop, template_replies

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


def test_the_owner_s_own_after_flash_drive_says_it_in_the_reply(replayed: Loop):
    """30 Aug 15:29 starts 0.58 and settles to 0.49 — the real Drive, not a stub."""
    replies = template_replies(replayed)
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
# The engine decides it (`worker.nextStep` → `KTA.carNextStep`); the copy says it.
# These tests read one decided step the way the chat would.
def decided(step, plan=None, limits=LIMITS, open_steps=None):
    return C.next_step_card(step, plan, limits, open_steps)


def step_undo(flat=None, hot=True):
    """What the engine hands the copy for the Undo branch of a Stop Drive."""
    return {
        "key": "undo", "kind": "flash", "opens": "undo", "also": None,
        "title": "Put the map from before back on the car", "gauges": ["trims", "kc"],
        "proves": "trims back within ±5 % over 10 calm minutes",
        "settlesOn": "after the first calm drive on the old file",
        "same": False, "cause": None, "previous": None, "flat": flat or [],
    }


def step_logger(flat):
    return {
        "key": "logger", "kind": "watch", "opens": "logger", "also": None,
        "title": f"Your logger recorded {len(flat)} dead gauges", "gauges": ["live"],
        "proves": "that every gauge moves again", "settlesOn": "your next drive, any kind",
        "same": False, "cause": None, "previous": None, "flat": flat,
    }


def test_exactly_one_next_step_and_never_a_list():
    for step in (
        step_undo(),
        step_logger(["fp"]),
        {"key": "none", "kind": "none", "title": "Nothing to change. Drive it.", "settlesOn": "after any Flash"},
        {"key": "tooShort", "kind": "none", "title": "Nothing read: the drive was too short",
         "settlesOn": "after a drive of 10 minutes or more", "same": True, "previous": None},
    ):
        card = decided(step)
        assert set(card) >= {"kind", "title", "body", "proves", "upload", "uploadWhen"}
        assert isinstance(card["title"], str) and card["title"]
        assert "1." not in card["title"] and "2." not in card["title"]
        assert card["uploadWhen"] == f"Upload when: {card['upload']}."


def test_a_stop_makes_undo_the_only_next_step():
    step = decided(
        step_undo(),
        {"kind": "undo", "headline": "Stop open: …", "undoName": "Flash Starter 21 · 23 Aug 20:00"},
    )
    assert step["kind"] == "flash"
    assert "map from before" in step["title"]
    assert "Shakedown drive" in step["body"]
    # A Flash step's cells come only from the Flash plan; there is nothing else.
    assert step["flashPlan"]["headline"] == "Stop open: …"
    assert step["gauges"] is None and step["recipe"] is None


def test_a_dead_gauge_is_a_watch_step_naming_the_gauge_as_tunerview_spells_it():
    dead = ["fp", "cvt", "boost", "boostTarget"]
    step = decided(step_logger(dead), None, LIMITS, None)
    assert step["kind"] == "watch"
    for name in ("DIFP", "Transmission Temperature", "Turbo Pressure"):
        assert name in step["body"]
    # And the gauge table names the dead gauges as TunerView spells them.
    gauge = step["gauges"]["rows"][0]
    assert gauge["gauge"] == "DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target"
    assert gauge["ok"] == "move as you drive"
    assert gauge["see"] == "stuck on one number"


def test_a_repeated_step_is_one_short_line_and_never_a_second_essay():
    """The owner should be able to scroll past a repeated step in a second."""
    step = step_undo()
    step["same"] = True
    card = decided(step, {"kind": "undo", "headline": "Stop open: …"})
    assert card["same"] is True
    assert card["body"] == ""
    assert card["recipe"] is None
    assert card["gauges"] is None
    # Only what the owner still needs: the title, and the Drive to upload.
    assert card["title"]
    assert card["uploadWhen"] == "Upload when: after the first calm drive on the old file."


def test_the_drive_recipe_is_numbered_short_and_physical():
    recipe = C.drive_recipe("baseline", LIMITS, channels_open=True)
    assert len(recipe["steps"]) == 4
    assert "10 minutes of normal driving first" in recipe["steps"][1]
    assert "two pulls in S, 50 → 100 km/h" in recipe["steps"][2]
    assert "AFR Command and MAF Hz" in recipe["steps"][3]
    # No jargon, and no KTuner table name anywhere in the recipe.
    blob = " ".join([recipe["intro"], *recipe["steps"]]).lower()
    for word in ("table", "cell", "preset", "maflow", "wot_enrich", "afm"):
        assert word not in blob, word


def test_every_gauge_is_named_as_tunerview_spells_it_with_ok_see_and_then():
    table = C.gauge_table(["trims", "kc", "iat", "afr", "boost", "rpm", "live"], LIMITS)
    assert table["columns"] == ["Gauge in TunerView", "OK", "If you see", "Then"]
    names = [r["gauge"] for r in table["rows"]]
    assert names[:6] == [
        "STFT B1 + LTFT B1",
        "Knock Control",
        "IAT2",
        "O2 (AFR) at full throttle",
        "Turbo Pressure",
        "Engine RPM",
    ]
    for row in table["rows"]:
        assert row["ok"] and row["see"] and row["then"], row["gauge"]
    # The thresholds are the engine's, read through the worker.
    assert table["rows"][0]["ok"] == "within ±5 %"
    assert table["rows"][1]["ok"] == "at or under 0.56"
    assert "Turbo Pressure Target" in table["rows"][4]["see"]


# -- What I asked last time -------------------------------------------------
def test_the_four_settled_words_are_the_specs_four():
    rows = C.settled_rows(
        [
            {"key": "undo", "title": "Undo: trims back within ±5 %", "status": "done", "why": "Trims −2.3 %."},
            {"key": "baseline", "title": "Baseline", "status": "open", "why": "not enough yet."},
            {"key": "habit", "title": "Habit test", "status": "fail", "why": "Lugging 8.3 %."},
            {"key": "logger", "title": "Fix the logger", "status": "wait", "why": "Knock Control was dead."},
        ]
    )
    assert [r["word"] for r in rows] == ["Done", "Not yet", "Still off", "Can't tell yet"]
    assert [r["tone"] for r in rows] == ["good", "watch", "stop", "none"]
    assert rows[3]["why"].startswith("Knock Control was dead")


def test_cant_tell_yet_never_reads_as_failure_and_always_says_why():
    """The one word that must never feel like a verdict on the owner."""
    reasons = [
        "Intake 53 °C while moving: not a Cool Drive.",
        "Knock Control was dead in this log, so Knock Control could not be read.",
        "Still not in the log (MAF Hz and AFR Command). Mixture is judged against the map's 11.0.",
    ]
    for why in reasons:
        assert C.settled_rows([{"key": "baseline", "status": "wait", "why": why}])[0]["word"] == "Can't tell yet"
        low = why.lower()
        for banned in ("failed", "failure", "try again", "bad", "wrong", "you must"):
            assert banned not in low, why
        # It always says why, and the why carries a number or names the gauge.
        assert any(ch.isdigit() for ch in why) or "Control" in why, why


def test_a_wasted_drive_is_flagged_in_one_kind_line_with_what_would_have_counted():
    line = C.wasted_line(
        {"wasted": True, "reason": "it was too short (under a minute moving)",
         "would": "a drive of 10 calm minutes", "proves": "the Undo"}
    )
    assert line == (
        "This Drive settles nothing: it was too short (under a minute moving). "
        "A drive of 10 calm minutes would have settled the Undo."
    )
    assert C.wasted_line({"wasted": False}) is None
    assert C.wasted_line(None) is None
    # Never a scolding, never a count kept against the owner.
    low = line.lower()
    for banned in ("waste", "wasted", "failed", "again", "mistake", "wrong"):
        assert banned not in low, line


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
    # Map version naming: a small integer the owner can say out loud, never a
    # revision, a short code or a UUID (CONTEXT.md: Map version).
    "map v1",
    "map rev",
    "revision 1",
    "map not recorded",
    "previous map file not recorded",
]


# -- the Map version --------------------------------------------------------
def on_map_version(version: int = 1, name: str = "Starter 21 Dual Tune 2", **rest) -> dict:
    return {"verdict": "good", "tooShort": False, "map": {"version": version, "name": name, **rest}}


def test_the_reply_says_which_map_version_the_drive_ran_on():
    assert C.map_version_line(on_map_version()) == "on Map version 1 · Starter 21 Dual Tune 2"
    assert (
        C.map_version_line(on_map_version(2, "Starter 21 Dual Tune 2 · AFM Flow r1"))
        == "on Map version 2 · Starter 21 Dual Tune 2 · AFM Flow r1"
    )


def test_the_map_version_line_is_never_not_recorded():
    """The app always holds Map version 1, so "not recorded" cannot happen."""
    assert C.map_version_line({"verdict": "good", "tooShort": False}) is None
    assert C.map_version_line({"tooShort": True, "map": {"version": 1, "name": "x"}}) is None
    for word in ("not recorded", "unknown", "revision", "map v1"):
        assert word not in (C.map_version_line(on_map_version()) or "")


def test_a_map_version_is_explained_once_then_the_app_stops_explaining():
    first = C.map_version_card(on_map_version(), first_drive=True)
    later = C.map_version_card(on_map_version(), first_drive=False)
    # The line is quiet on every Drive; the explanation is a footnote under it.
    assert first["line"] == later["line"] == "on Map version 1 · Starter 21 Dual Tune 2"
    assert first["note"] == C.MAP_VERSION_WHAT_IT_IS
    assert "Map version" in C.MAP_VERSION_WHAT_IT_IS
    assert "note" not in later, "explained once, then never again"


def test_the_undo_names_the_map_version_not_just_the_file():
    undo = {"known": True, "version": 1, "name": "Starter 21 Dual Tune 2", "stamp": "20260823-200000"}
    assert C.undo_sentence({"undo": undo}) == (
        "Flash your previous map file (Map version 1 · Starter 21 Dual Tune 2, flashed 23 Aug 20:00). "
        "Save today's file first so nothing is lost."
    )
    # A version the owner never dated says no date, rather than a wrong one.
    plain = C.undo_sentence({"undo": {"known": True, "version": 2, "name": "Starter 21 r2"}})
    assert plain.startswith("Flash your previous map file (Map version 2 · Starter 21 r2).")
    assert "flashed" not in plain


def test_the_undo_never_invents_a_map_name():
    asked = C.undo_sentence({"undo": {"known": False, "version": None, "name": None}})
    assert "Map version 1 ·" not in asked
    assert "Map version 2 ·" not in asked
    assert asked.count("tell me what you flashed") == 1
    # Even with no structured Undo at all, the sentence asks rather than guesses.
    assert "tell me what you flashed" in C.undo_sentence(None)


def test_the_stop_next_step_names_the_map_version_to_flash_back():
    step = decided(
        step_undo(),
        {
            "kind": "undo",
            "headline": "Stop open: flash your previous map file (Map version 1 · Starter 21 Dual Tune 2).",
            "undo": {"known": True, "version": 1, "name": "Starter 21 Dual Tune 2", "stamp": None},
        },
    )
    assert step["kind"] == "flash"
    assert "Map version 1 · Starter 21 Dual Tune 2" in step["body"]
    assert "Shakedown drive" in step["body"]


def our_own_words(card: dict) -> str:
    """Only the copy this repo writes: the engine's check labels and the Flash
    plan's own wording travel verbatim as evidence and are not ours to change."""
    return json.dumps(
        {
            "say": card["say"],
            "window": card["window"],
            "verdict": card["verdict"],
            "numbers": card["numbers"],
            "mapVersion": card.get("mapVersion"),
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

# -- owner-facing words are decided once (refactor A2) -------------------
def test_the_reply_events_carry_the_engine_status_words(replayed: Loop):
    """Open steps arrive worded: the web renders `word`/`tone`, it spells neither."""
    engine = json.loads(
        subprocess.run(
            ["node", "-p", "JSON.stringify(require('./engine/kta-car.js').carWords)"],
            cwd=C.REPO_ROOT, capture_output=True, text=True, check=True,
        ).stdout
    )
    steps = [s for r in template_replies(replayed).values() for s in r.card["openSteps"]]
    assert steps
    for s in steps:
        assert (s["word"], s["tone"]) == tuple(engine["stepStatus"][s["status"]].values())
    # settled rows and channel names read the same table
    assert C.CHANNEL_NAMES == engine["channels"] and C.MONTHS == engine["months"]
    assert C.settled_rows([{"status": "fail"}])[0]["word"] == "Still off"


def test_the_python_stamp_is_the_engine_stamp():
    """Engine `driveStamp` and copy.py `drive_stamp` spell a Drive alike (the day is padded here only)."""
    ids = ["20260830-160151", "20260901-081358", "20261231-235959"]
    js = json.loads(
        subprocess.run(
            ["node", "-p", f"JSON.stringify({ids!r}.map(require('./engine/kta-car.js').carWords.driveStamp))"],
            cwd=C.REPO_ROOT, capture_output=True, text=True, check=True,
        ).stdout
    )
    assert js == ["30 Aug 16:01", "1 Sep 08:13", "31 Dec 23:59"]
    assert [C.drive_stamp(i).lstrip("0") for i in ids] == js


def test_the_web_no_longer_spells_status_or_stamp_words():
    ui = (C.REPO_ROOT / "web/components/OpenStepsPanel.tsx").read_text()
    for spelled in ("Not yet", "Still off", "Jan", "STATUS", "driveStamp"):
        assert spelled not in ui.split("*/", 1)[1], spelled

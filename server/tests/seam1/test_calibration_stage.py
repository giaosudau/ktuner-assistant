"""Seam 1: the Calibrate stage, the Calibration brief and the Next step (calibration drive C6, C9).

Every power question waits on one drive: can a raised boost cell show in the log? Until the
engine's Ceiling read settles it, the shop's next drive is the Calibration drive — after any
Stop or open safety step, never before one.
"""

from __future__ import annotations

import pytest

from conftest import LIMITS, Loop, OWNER_DRIVES, owner_csv

from test_car_profile import CENSUS, confirm, draft

from kta_server import copy as C
from kta_server import desk as D

#: A car with one Drive read, nothing open, and no ceiling read yet.
LOOP = {
    "stage": "calibrate",
    "carProfile": {"model": "Civic FE 1.5T", "transmission": "CVT", "fuel": "E10 RON95", "parts": []},
    "hasDrives": True,
    "carHistory": [{"id": "20260822-090322", "start": 100, "verdict": "ok"}],
    "flashes": [],
    "openSteps": [],
    "calibration": {"status": "no-reading", "settled": False},
}


def steps_text(guide: dict) -> str:
    return " ".join(step for section in guide["sections"] for step in section["steps"])


def test_the_recap_and_the_chips_name_the_calibration_drive():
    recap = D.recap(LOOP)
    assert recap["stage"] == "calibrate"
    assert recap["stageLine"] == "One drive answers whether more boost can show on your car."
    assert {"label": "Next drive", "value": "The Calibration drive"} in recap["lines"]
    chips = D.stage_suggestions(LOOP)
    assert chips[0]["action"] == "guide" and "Calibration drive" in chips[0]["label"]
    assert any(c["action"] == "attach" for c in chips)


def test_the_calibration_brief_asks_first_for_the_pedal_and_the_logger():
    guide = C.log_guide(LIMITS, None, calibrate=True)
    assert guide["title"] == "The Calibration drive"
    first = guide["sections"][0]
    assert first["title"] == "Parked, the evening before"
    parked = " ".join(first["steps"])
    assert "press Start twice without the brake" in parked and "type the highest" in parked
    assert "AFR Command" in parked and "fastest logging rate" in parked
    assert "Quick Adjustments" in parked
    pulls = next(s for s in guide["sections"] if s["title"] == "The two pulls")
    assert "all the way" in " ".join(pulls["steps"]) and "slot 2 (Tune 2)" in " ".join(pulls["steps"])
    assert "ECO off" in " ".join(pulls["steps"]) and "at least 5 seconds" in " ".join(pulls["steps"])
    # 0 Wasted drives from a slot mistake: the tach confirms the slot while choosing (kc-map-switching).
    assert "the tach shows 2,000 rpm" in " ".join(pulls["steps"])
    assert "2 floored pulls held 4 s or more above 3,500 rpm" in guide["checkpoints"]
    assert "On slot 2 (Tune 2)" in guide["checkpoints"]
    # The safety lines stay.
    text = steps_text(guide)
    assert "Never in traffic" in text and "90 °C" in text and "brake launch" in text
    # What the owner already said isn't asked again.
    told = steps_text(C.log_guide(LIMITS, {**CENSUS, "pedal_full_pct": 94}, calibrate=True))
    assert "Your Pedal full reading is on file: 94 %" in told
    assert "press Start twice" not in told and "fastest logging rate" not in told
    # Not calibrating: the Baseline brief, unchanged.
    assert C.log_guide(LIMITS)["title"] == "One Cool drive with 2 pulls"


def test_the_loops_stage_is_the_engines_stage_after_a_real_upload(tmp_path):
    loop = Loop(tmp_path).start()
    try:
        confirm(loop, {**draft(loop)["fields"], **CENSUS})
        loop.upload_and_reply("sep01-0813")
        state = loop.get("/api/state").json()
        assert state["stage"] == "calibrate"
        facts = {k: state[k] for k in ("carProfile", "hasDrives", "carHistory", "flashes", "flashPlan", "openSteps", "calibration")}
        assert loop.run(loop.worker.call("stage", **facts))["stage"] == state["stage"]
    finally:
        loop.close()


def test_with_no_worker_the_state_answers_the_way_every_worker_failure_does(tmp_path):
    loop = Loop(tmp_path).start()
    try:
        loop.run(loop.worker.aclose())
        loop.worker.script = tmp_path / "gone.js"
        response = loop.get("/api/state")
        assert response.status_code == 502 and response.json()["error"]["code"] == "worker-missing"
    finally:
        loop.close()


def test_a_new_owners_first_brief_is_the_calibration_brief(tmp_path):
    """Profile → /api/state: no Drive and no Ceiling read, so the first drive is the Calibration drive."""
    loop = Loop(tmp_path).start()
    try:
        confirm(loop, draft(loop)["fields"])
        state = loop.get("/api/state").json()
        assert state["stage"] == "baseline"
        assert state["calibration"]["settled"] is False
        assert state["logGuide"]["title"] == "The Calibration drive"
    finally:
        loop.close()


def test_the_owners_drives_reach_calibrate_after_the_baseline_and_the_undo(tmp_path):
    """Profile → nine real uploads → worker `carCalibration` → stage, as the owner drove them.

    The Baseline and the Undo come first; by 1 Sep nothing safety is open and no Ceiling read can
    settle without the Pedal full reading, so the next drive is the Calibration drive. The 5 Sep
    log's dead gauges then open the logger fix, which comes before it.
    """
    loop = Loop(tmp_path).start()
    try:
        confirm(loop, {**draft(loop)["fields"], **CENSUS})
        stages = {}
        for example, name in OWNER_DRIVES:
            reply = loop.send(loop.upload(owner_csv(example), name))
            assert not reply.errors(), reply.errors()
            state = loop.get("/api/state").json()
            stages[example] = state["stage"]
            if example == "sep01-0813":
                assert state["calibration"]["status"] == "no-reading" and state["calibration"]["mapAction"] == "no-change"
                assert state["recap"]["stageLine"] == D.STAGE_WORDS["calibrate"]
                assert state["logGuide"]["title"] == "The Calibration drive"
        assert "calibrate" not in [stages[e] for e, _ in OWNER_DRIVES[:7]], stages
        assert stages["sep01-0813"] == "calibrate"
        assert stages["sep05-0756"] == "read", "the logger fix comes before the calibration"
    finally:
        loop.close()


def test_the_calibration_brief_names_slot_2_and_the_baseline_brief_none():
    calibration = C.log_guide(LIMITS, None, calibrate=True)
    assert calibration["slot"] == 2
    pulls = " ".join(next(s for s in calibration["sections"] if s["title"] == "The two pulls")["steps"])
    assert f"slot {calibration['slot']} (Tune {calibration['slot']})" in pulls
    assert f"On slot {calibration['slot']} (Tune {calibration['slot']})" in calibration["checkpoints"]
    assert C.log_guide(LIMITS)["slot"] is None


@pytest.fixture(scope="module")
def calibrating(tmp_path_factory):
    """A car with no Pedal full reading and no Logger census, driven up to the 1 Sep log (stage calibrate)."""
    loop = Loop(tmp_path_factory.mktemp("calibrating")).start()
    try:
        confirm(loop, draft(loop)["fields"])
        reply = None
        for example, name in OWNER_DRIVES[:8]:
            reply = loop.send(loop.upload(owner_csv(example), name))
            assert not reply.errors(), reply.errors()
        yield loop, reply
    finally:
        loop.close()


def all_text(value) -> str:
    """Every string in a reply, joined: what the owner could read anywhere in it."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(all_text(v) for v in value.values())
    if isinstance(value, list):
        return " ".join(all_text(v) for v in value)
    return ""


def test_on_the_calibrate_stage_the_next_step_is_the_calibration_drive(calibrating):
    loop, reply = calibrating
    state = loop.get("/api/state").json()
    assert state["stage"] == "calibrate" and state["calibration"]["settled"] is False
    step = reply.card["nextStep"]
    assert step["kind"] == "drive", step
    assert "Calibration drive" in step["title"], step
    # What is missing first, then the drive.
    body = step["body"]
    assert "Pedal full reading" in body and "AFR Command" in body, body
    assert body.index("Pedal full reading") < body.index("Calibration drive"), body
    assert "Calibration drive" in step["upload"], step
    # The Calibration card in the same reply says the same thing.
    assert reply.card["calibration"]["settled"] is False


def test_no_reply_text_claims_no_headroom_while_the_ceiling_is_cant_tell(calibrating):
    loop, reply = calibrating
    assert "no headroom" not in all_text(reply.card).lower()
    assert "no headroom" not in " ".join(reply.sentences()).lower()


def test_a_chat_answer_quotes_the_same_next_step(calibrating):
    loop, reply = calibrating
    response = loop.run(loop._client.post("/api/ask", json={"text": "Can I get more boost?"}))
    assert response.status_code == 200, response.text
    out = response.json()
    assert out["nextStep"] == reply.card["nextStep"]["title"], out
    assert "no headroom" not in out["answer"].lower()


def test_calibration_step_with_everything_on_file_is_just_the_drive():
    step = C.calibration_step({"status": "not-floored"}, {**CENSUS, "pedal_full_pct": 94}, LIMITS)
    assert step["kind"] == "drive" and step["key"] == "calibration"
    assert step["body"].startswith("Drive the Calibration drive on slot 2 (Tune 2)"), step["body"]
    assert "Pedal full reading" not in step["body"] and "Logger setup" not in step["body"]
    # A Can't tell for a reason says how to drive it differently.
    assert step["body"].endswith(C.CEILING_MEANS["not-floored"])


BANDED = {"kControl": "kc-ranges", "trims": "kc-trims", "cvtTemp": "kc-cvt", "iat": "kc-drive-brief"}


def test_health_rows_band_only_the_cited_checks_on_a_real_drive(calibrating):
    loop, reply = calibrating
    rows = {row["id"]: row for row in reply.card["health"]["rows"]}
    assert set(BANDED) <= set(rows)
    for cid, row in rows.items():
        band = row.get("band")
        if cid not in BANDED:
            assert band is None, (cid, band)
            continue
        if row["tone"] == "none":  # Can't tell: never a dot
            assert band is None, (cid, band)
            continue
        assert band and band["source"] == BANDED[cid], (cid, band)
        assert band["min"] <= band["value"] <= band["max"], band
        assert all(band["min"] <= m["at"] <= band["max"] for m in band["marks"]), band
        # The dot is the number the row's words show.
        shown = f"{band['value']:+.1f}" if cid == "trims" else C.n(band["value"], 2 if cid == "kControl" else 0)
        assert shown in row["value"], (cid, shown, row["value"])


def test_the_bands_carry_the_cards_limits(calibrating):
    loop, _ = calibrating
    limits = loop.worker.limits
    checks = [
        {"gate": "spark", "id": "kControl", "label": "Knock Control", "status": "good", "value": "0.51 → 0.49"},
        {"gate": "fuel", "id": "trims", "label": "Fuel trims", "status": "good", "value": "-3.2 %"},
        {"gate": "cvt", "id": "cvtTemp", "label": "CVT fluid temp", "status": "good", "value": "73 °C peak"},
        {"gate": "heat", "id": "iat", "label": "Intake air temp", "status": "good", "value": "39 °C peak in a pull"},
        {"gate": "heat", "id": "ect", "label": "Coolant temp", "status": "good", "value": "92 °C peak"},
        {"gate": "air", "id": "mafHz", "label": "MAF sensor headroom", "status": "nodata", "value": "MAF Hz not logged"},
    ]
    facts = {"check.kControl.value": 0.4912, "check.trims.value": -3.24, "check.cvtTemp.value": 73.4,
             "check.iat.value": 39.2, "check.ect.value": 92}
    rows = {r["id"]: r for r in C.health_rows({"checks": checks}, facts, limits)["rows"]}
    marks = lambda cid: [(m["at"], m["label"], m["tone"]) for m in rows[cid]["band"]["marks"]]  # noqa: E731
    # Every number is the card's (kc-ranges, kc-trims, kc-cvt, kc-drive-brief).
    assert marks("kControl") == [(0.49, "Floor 0.49", "good"), (0.56, "Watch 0.56", "watch"),
                                 (0.62, "No hard driving 0.62", "watch"), (0.80, "Stop 0.80", "stop")]
    assert rows["kControl"]["band"]["value"] == 0.49
    assert marks("trims") == [(-10, "Stop -10", "stop"), (-5, "Watch -5", "watch"),
                              (5, "Watch +5", "watch"), (10, "Stop +10", "stop")]
    assert rows["trims"]["band"]["min"] == -rows["trims"]["band"]["max"] and rows["trims"]["band"]["value"] == -3.2
    assert marks("cvtTemp") == [(90, "Watch 90", "watch"), (100, "Stop 100", "stop")]
    assert rows["cvtTemp"]["band"]["value"] == 73
    assert marks("iat") == [(42, "Cool 42", "none"), (48, "Pull start 48", "none")] and rows["iat"]["band"]["value"] == 39
    # The engine-only coolant limits are never drawn, and a check with no number gets no band.
    assert rows["ect"]["band"] is None and rows["mafHz"]["band"] is None
    # No numeric field: no band, never a number parsed from the words.
    assert all(r["band"] is None for r in C.health_rows({"checks": checks}, None, limits)["rows"])
    # Can't tell (a flat CVT temp channel) never gets a dot, even with a number beside it.
    flat = [{**checks[2], "status": "nodata", "value": "CVT temp stuck on one number"}]
    assert C.health_rows({"checks": flat}, facts, limits)["rows"][0]["band"] is None
    # A tie rounds as the engine words the row (72.5 → "73 °C"), not to even.
    tie = C.health_rows({"checks": [checks[2]]}, {"check.cvtTemp.value": 72.5}, limits)["rows"][0]["band"]
    assert tie["value"] == 73

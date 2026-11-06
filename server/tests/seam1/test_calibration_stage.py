"""Seam 1: the Calibrate stage, the Calibration brief and the Next step (calibration drive C6, C9).

Every power question waits on one drive: can a raised boost cell show in the log? Until the
engine's Ceiling read settles it, the shop's next drive is the Calibration drive — after any
Stop or open safety step, never before one.
"""

from __future__ import annotations

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

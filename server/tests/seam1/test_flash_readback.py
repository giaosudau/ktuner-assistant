"""Ticket 14 (seam 1): Flash readback — did the ECU take what the owner typed?

The fixture is ticket 13's: one Drive overshoots, the Flash plan proposes the
low-rpm boost change, "I flashed it" makes Map version 2. The first Drive after
it is then built from the owner's real sep05 log with the Turbo Pressure Target
the ECU "logged" at the changed rows set to what the test says it read: the new
value (credited), the old value in one cell (mismatch), or no visit at all.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from conftest import Loop, owner_csv, OWNER_FILE_NAMES

from kta_server import readback as R
from test_flash_step import flashed, propose, proposing  # noqa: F401  (fixture)

ROWS = (2500, 2750, 3000)


def drive_csv(reads: dict[int, float]) -> str:
    """The sep05 log with no sample near the changed rows, then `reads` logged there."""
    lines = owner_csv("sep05-0756").split("\n")
    rows = [i for i in range(2, len(lines)) if lines[i].count(";") > 14]
    cut = []
    for i in rows:
        f = lines[i].split(";")
        if any(abs(float(f[1]) - r) <= 60 for r in ROWS):
            f[1] = str(int(float(f[1])) + 150)
        cut.append(f)
    for k, (rpm, psi) in enumerate(reads.items()):
        for j in range(8):
            f = cut[400 + k * 10 + j]
            f[1], f[14] = str(rpm), f"{psi:.1f}"
    for i, f in zip(rows, cut):
        lines[i] = ";".join(f)
    return "\n".join(lines)


def first_drive(loop: Loop, reads: dict[int, float]):
    plan = propose(loop)
    after = {c["rpm"]: float(c["after"]) for c in plan["ktunerCard"]["groups"][0]["cells"] if c["col"] == 16}
    # The Flash happens on 3 Sep 2026: after the overshooting Drive, before this one.
    object.__setattr__(loop.settings, "now", 1788393600000)
    flashed(loop)
    reads = {rpm: (psi if psi is not None else after[rpm]) for rpm, psi in reads.items()}
    upload = loop.upload(drive_csv(reads), OWNER_FILE_NAMES["sep05-0756"])
    return loop.send(upload), after


def test_a_drive_matching_version_2s_changed_cells_is_credited(proposing: Loop):
    reply, after = first_drive(proposing, {2500: None, 2750: None, 3000: None})
    read = reply.card["readback"]
    assert read["state"] == "credited" and read["credited"] is True
    assert "matches Map version 2" in read["line"] and "credited" in read["line"]
    assert reply.card["nextStep"]["key"] != "recheck"
    assert after[2750] == 16.0  # the cells the reply is about are the card's


def test_a_drive_whose_logged_target_differs_is_not_credited_and_names_the_cell(proposing: Loop):
    # 2,750 rpm still logs the old 17.0 where Map version 2 planned 16.0: a typo on the car.
    reply, _ = first_drive(proposing, {2500: None, 2750: 17.0, 3000: None})
    read = reply.card["readback"]
    assert read["state"] == "mismatch" and read["credited"] is False
    assert read["mismatches"] == ["2,750 rpm one of columns 8 to 16 reads 17.0, planned 16.0"]
    assert "2,750 rpm one of columns 8 to 16 reads 17.0, planned 16.0" in read["line"]
    step = reply.card["nextStep"]
    assert step["key"] == "recheck" and step["title"] == "Re-check what you typed in KTuner"
    assert "reads 17.0, planned 16.0" in step["body"]


def test_a_drive_that_never_visits_the_changed_cells_says_readback_is_still_open(proposing: Loop):
    reply, _ = first_drive(proposing, {})
    read = reply.card["readback"]
    assert read["state"] == "open" and read["credited"] is False
    assert read["line"].startswith("Readback: can't tell yet.")
    assert "No Drive since the Flash logged a Turbo Pressure Target in the changed cells" in read["line"]
    assert "2,500-3,000 rpm" in read["line"]
    assert reply.card["nextStep"]["key"] != "recheck"


def test_the_ktuner_card_states_per_table_family_whether_readback_is_possible(proposing: Loop):
    card = propose(proposing)["ktunerCard"]
    assert card["readback"]["possible"] is True and "Turbo Pressure Target" in card["readback"]["line"]
    afm, wot = R.card_line("AFM Flow"), R.card_line("WOT Enrichment")
    assert afm["possible"] is False and "Readback not possible" in afm["line"]
    assert wot["possible"] is False and "Readback not possible" in wot["line"]


def test_cells_that_share_a_value_are_one_group_and_a_lone_cell_is_named_by_its_column():
    old = {"Boost_Target_1_Normal_L": {"rpm_axis": [2500, 2750], "values": [[1.0, 14.0, 15.0], [1.0, 16.0, 17.0]]}}
    new = {"Boost_Target_1_Normal_L": {"rpm_axis": [2500, 2750], "values": [[1.0, 14.0, 14.0], [1.0, 15.0, 16.0]]}}
    groups = R.groups(old, new)
    assert [(g["rpm"], g["cols"]) for g in groups] == [(2500, [3]), (2750, [2]), (2750, [3])]
    judged = R.judge(groups, {2500: [{"psi": 15.0, "n": 3}], 2750: [{"psi": 15.0, "n": 2}, {"psi": 16.0, "n": 2}]})
    assert [g["status"] for g in judged] == ["mismatch", "match", "match"]
    assert R.verdict(judged, 2)["mismatches"] == ["2,500 rpm column 3 reads 15.0, planned 14.0"]


def test_the_worker_hands_back_tallies_not_log_rows(proposing: Loop):
    _, _ = first_drive(proposing, {2750: None})
    drive_id = next(iter(proposing.store.car_state(None)["drives"]))
    got = proposing.run(proposing.worker.call("logTargets", driveId=drive_id, rpms=[2750], tol=30))
    assert set(got) == {"driveId", "readable", "rows"}
    assert set(got["rows"][0]) == {"rpm", "samples", "targets"}
    assert all(set(t) == {"psi", "n"} for t in got["rows"][0]["targets"])

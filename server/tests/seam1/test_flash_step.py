"""Ticket 13 (seam 1): the Flash step — KTuner card, Map versions, the History file.

The owner's nine real Drives propose no cell (8 of 9 say "no change"), so the
fixture gives one Drive a boost overshoot over the hold: the engine's own Flash
plan then proposes the low-rpm boost change, and everything after it is the real
path: both map checks, the card, "I flashed it", Undo, Revert, the History file.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

import pytest

from conftest import Loop, owner_csv, OWNER_FILE_NAMES

from kta_server import flash as F
from kta_server import mapcheck
from kta_server import verify as V
from kta_server.mapdata import basemap_tables

BOOST_IDS = [f"Boost_Target_{level}_Normal_{side}" for level in (1, 2, 3) for side in ("L", "H")]
BASEMAP = "Starter 21 Dual Tune 2"


def post(loop: Loop, path: str, body: dict | None = None):
    return loop.run(loop._client.post(path, json=body or {}))


def propose(loop: Loop) -> dict:
    """One Drive whose boost overshoot is over the hold: the plan proposes a change."""
    loop.upload_and_reply("sep01-0813")
    state = loop.store.car_state(None)
    for summary in state["drives"].values():
        summary["overshoot"] = 3.4
    loop.store.save_car_state(state)
    return loop.get("/api/state").json()["flashPlan"]


@pytest.fixture
def proposing(tmp_path: Path):
    running = Loop(tmp_path).start()
    try:
        yield running
    finally:
        running.close()


def flashed(loop: Loop) -> dict:
    plan = propose(loop)
    response = post(loop, "/api/flash/confirm", {"changeId": plan["ktunerCard"]["changeId"]})
    assert response.status_code == 200, response.text
    return response.json()


# -- acceptance 1: the card is the checked change, exactly --------------------
def test_the_card_matches_the_checked_change_cell_for_cell(proposing: Loop):
    plan = propose(proposing)
    card = plan["ktunerCard"]
    assert plan["kind"] == "one-family" and card["kind"] == "change"

    # Written on Map version 1, named the way KTuner names its tables.
    assert card["writtenOn"] == f"Written on Map version 1 · {BASEMAP}"
    (group,) = card["groups"]
    assert group["tables"] == [
        "Boost Target 1 Normal L", "Boost Target 1 Normal H", "Boost Target 2 Normal L",
        "Boost Target 2 Normal H", "Boost Target 3 Normal L", "Boost Target 3 Normal H",
    ]
    assert group["unit"] == "psi" and group["same"] is True

    # Every cell: rpm row, "N of 16", before -> after in the table's own decimals,
    # and the before is what Map version 1 holds in every one of the six tables.
    base = basemap_tables()
    assert group["cells"]
    for cell in group["cells"]:
        assert cell["of"] == 16 and cell["column"] == f"{cell['col']} of 16"
        rpm_row = base[BOOST_IDS[0]]["rpm_axis"].index(cell["rpm"])
        for table_id in BOOST_IDS:
            held = base[table_id]["values"][rpm_row][cell["col"] - 1]
            assert cell["before"] == f"{held:.1f}"
        assert cell["after"] == f"{float(cell['before']) - 1:.1f}"
        assert cell["row"] == f"{cell['rpm']:,} rpm"

    # What the reply may quote (the plan's cells) is the card's cells, nothing else.
    assert plan["cellCount"] == len(group["cells"]) * len(BOOST_IDS) == card["cellCount"] * len(BOOST_IDS)
    quoted = {(c["table"], c["rpmRow"], c["col"], c["before"], c["after"]) for c in plan["cells"]}
    assert len(quoted) == plan["cellCount"]

    # Save-as, the Undo version and the proof sit on the card, in the engine's words.
    assert card["saveAs"] == plan["saveAs"] and card["saveAs"].startswith(BASEMAP)
    assert f"Map version 1 · {BASEMAP}" in card["undo"]["line"]
    assert card["proof"] and card["because"] and group["what"] and group["effect"]
    assert "Shakedown drive" in card["afterFlash"]

    # Both checks accept exactly this change.
    change = F.change_from_plan(plan, base)
    assert mapcheck.check_change(change, base)["ok"]
    assert proposing.run(proposing.worker.call("checkMapChange", change=change, tables=base))["ok"]


def test_i_flashed_it_makes_map_version_2_with_exactly_those_cells(proposing: Loop):
    plan = propose(proposing)
    assert [v["n"] for v in proposing.store.list_map_versions()] == [1]
    done = post(proposing, "/api/flash/confirm", {"changeId": plan["ktunerCard"]["changeId"]})
    assert done.status_code == 200
    assert done.json()["version"]["n"] == 2

    v2 = proposing.store.map_version(2)
    assert v2["name"] == plan["saveAs"] and v2["parent_id"] == 1 and v2["kind"] == "flash"
    base = basemap_tables()
    moved = {
        (t, r, c)
        for t in base
        for r, row in enumerate(base[t]["values"])
        for c, value in enumerate(row)
        if v2["tables"][t]["values"][r][c] != value
    }
    assert moved == {(c["table"], c["rpmRow"], c["col"] - 1) for c in plan["cells"]}
    for c in plan["cells"]:
        assert v2["tables"][c["table"]]["values"][c["rpmRow"]][c["col"] - 1] == c["after"]
    assert proposing.store.map_version(1)["tables"] == base

    # The car is on Map version 2, and the next Drive is a Shakedown drive on it.
    assert proposing.get("/api/flash").json()["active"]["n"] == 2
    assert proposing.store.car_state(None)["shakedown"]["status"] == "pending"
    reply = proposing.upload_and_reply("sep05-0756")
    assert reply.card["mapVersion"]["version"] == 2
    assert reply.snapshot()["drive"]["isShakedown"] is True
    assert reply.card["mapVersion"]["line"].startswith("on Map version 2 · ")
    flash = proposing.store.list_flashes()[-1]
    assert flash["map"] == plan["saveAs"] and flash["changed"] == "boost"


def test_not_now_creates_nothing(proposing: Loop):
    plan = propose(proposing)
    before = (proposing.store.list_map_versions(), proposing.store.list_flashes(), proposing.store.car_state(None))
    response = post(proposing, "/api/flash/not-now", {"changeId": plan["ktunerCard"]["changeId"]})
    assert response.status_code == 200 and response.json()["created"] is False
    assert "still on Map version 1" in response.json()["line"]
    after = (proposing.store.list_map_versions(), proposing.store.list_flashes(), proposing.store.car_state(None))
    assert after == before
    assert proposing.get("/api/flash").json()["active"]["n"] == 1


def test_a_card_that_has_moved_cannot_be_confirmed(proposing: Loop):
    propose(proposing)
    response = post(proposing, "/api/flash/confirm", {"changeId": "not-the-card"})
    assert response.status_code == 409
    assert [v["n"] for v in proposing.store.list_map_versions()] == [1]


def test_a_reply_that_names_a_different_cell_or_number_fails_verify(proposing: Loop):
    plan = propose(proposing)
    cell = plan["cells"][0]
    ok = V.verify("Boost comes down.", "downpipe", "downpipe", [], plan=plan, cells=[cell])
    assert ok["ok"], ok
    for field, wrong in (("after", cell["after"] + 2), ("before", cell["before"] + 1)):
        bad = V.verify("Boost comes down.", "downpipe", "downpipe", [], plan=plan, cells=[{**cell, field: wrong}])
        assert not bad["ok"] and any(field in issue for issue in bad["issues"]), bad
    stray = V.verify("x", "downpipe", "downpipe", [], plan=plan, cells=[{**cell, "col": 99}])
    assert not stray["ok"]


# -- acceptance 2: either check refusing keeps the change off the card ---------
def test_a_change_both_checks_refuse_never_reaches_the_card_and_says_why(proposing: Loop):
    proposing.upload_and_reply("sep01-0813")
    state = proposing.store.car_state(None)
    for summary in state["drives"].values():
        summary["overshoot"] = 3.4
    proposing.store.save_car_state(state)
    # One of the six tables drifts from its pair in the stored map: the cells it
    # proposes no longer match, which both checks refuse (pairs move together).
    v1 = proposing.store.map_version(1)
    tables = v1["tables"]
    tables["Boost_Target_2_Normal_H"]["values"][9][6] += 0.5
    proposing._loop.run_until_complete(_overwrite_tables(proposing, 1, tables))

    plan = proposing.get("/api/state").json()["flashPlan"]
    assert plan["kind"] == "blocked" and plan["ktunerCard"] is None
    assert plan["cells"] == [] and plan["cellCount"] == 0 and plan["saveAs"] is None
    assert plan["blocked"]["reason"] == "pair-mismatch"
    assert plan["blocked"]["engine"] == plan["blocked"]["python"] == "pair-mismatch"
    assert plan["blocked"]["disagree"] is False
    assert "do not match" in plan["headline"] and "Nothing to type in KTuner" in plan["headline"]

    # The reply says why, and offers no cell to type.
    reply = proposing.upload_and_reply("sep05-0756")
    step = reply.card["nextStep"]
    assert reply.card["flashPlan"]["kind"] == "blocked"
    if step["kind"] == "flash":
        assert "will not show this change" in step["body"]
    assert reply.card["flashPlan"]["cells"] == []
    assert "do not match" in reply.card["flashPlan"]["headline"]
    # And no tap can flash it.
    assert post(proposing, "/api/flash/confirm", {"changeId": "anything"}).status_code == 409


async def _overwrite_tables(loop: Loop, number: int, tables: dict) -> None:
    import sqlite3
    with sqlite3.connect(loop.store.path) as c:
        c.execute("UPDATE map_versions SET tables = ? WHERE id = ?", (json.dumps(tables), number))


def test_two_checks_that_disagree_fail_loudly_and_block(proposing: Loop, monkeypatch, caplog):
    propose(proposing)
    monkeypatch.setattr(
        mapcheck, "check_against_version",
        lambda change, version, thresholds=None: {"ok": False, "reason": "boost-step", "detail": "x"},
    )
    with caplog.at_level(logging.ERROR, logger="kta.flash"):
        plan = proposing.get("/api/state").json()["flashPlan"]
    assert plan["kind"] == "blocked" and plan["ktunerCard"] is None
    assert plan["blocked"]["disagree"] is True and plan["blocked"]["reason"] == "checks-disagree"
    assert "do not agree" in plan["blocked"]["why"]
    assert any("disagree" in record.message for record in caplog.records)


def test_a_map_version_whose_cells_are_not_stored_cannot_be_checked(proposing: Loop):
    plan = propose(proposing)
    change = F.change_from_plan(plan, basemap_tables())
    pending = {"n": 2, "label": "Map version 2", "name": "Mine r2", "tables": None}
    verdict = proposing.run(F.check_both(proposing.worker, pending, change))
    assert verdict["ok"] is False and verdict["reason"] == "map-change-pending"
    assert "does not hold the cells of Map version 2" in verdict["why"]
    # A change written against another Map version is refused too, loudly.
    other = {**pending, "tables": basemap_tables(), "n": 3, "label": "Map version 3"}
    assert not proposing.run(F.check_both(proposing.worker, other, change))["ok"]


# -- acceptance 3: Undo and Revert ------------------------------------------
def test_undo_to_version_1_makes_it_the_active_map(proposing: Loop):
    flashed(proposing)
    assert proposing.get("/api/flash").json()["active"]["n"] == 2
    response = post(proposing, "/api/flash/restore", {"version": 1, "kind": "undo"})
    assert response.status_code == 200, response.text
    assert response.json()["active"] == {"n": 1, "label": "Map version 1", "name": BASEMAP}
    flash = proposing.get("/api/flash").json()
    assert flash["active"]["n"] == 1 and flash["revert"] is None
    assert [v["n"] for v in flash["versions"]] == [1, 2], "an Undo makes no new Map version"
    assert proposing.store.car_state(None)["shakedown"]["status"] == "pending"
    assert proposing.store.list_flashes()[-1]["restores"] == 1
    # The next Drive ran on Map version 1 again.
    assert proposing.upload_and_reply("sep05-0756").card["mapVersion"]["version"] == 1


def test_revert_loads_the_ktuner_basemap_and_makes_it_active(proposing: Loop):
    flashed(proposing)
    flash = proposing.get("/api/flash").json()
    assert flash["revert"]["line"] == "In KTuner, load Starter 21 Dual Tune 2 and flash it."
    assert post(proposing, "/api/flash/restore", {"version": 2, "kind": "revert"}).status_code == 400
    response = post(proposing, "/api/flash/restore", {"version": 1, "kind": "revert"})
    assert response.json()["active"]["name"] == BASEMAP
    assert proposing.get("/api/flash").json()["active"]["n"] == 1
    # Already there: nothing to flash.
    assert post(proposing, "/api/flash/restore", {"version": 1, "kind": "revert"}).status_code == 409
    # The restore survives rebuilding the Car history from its events.
    from kta_server import questions as Q
    state = proposing.run(Q.rebuild_history(proposing.store, proposing.worker, 1756723200000))
    assert state["mapRestores"][-1]["n"] == 1
    assert proposing.run(proposing.worker.call("mapVersions", state=state))["active"]["n"] == 1


# -- acceptance 4: the History file ----------------------------------------
def test_the_history_file_round_trips_versions_flashes_installs_and_answers(proposing: Loop, tmp_path: Path):
    flashed(proposing)
    post(proposing, "/api/flash/restore", {"version": 1, "kind": "undo"})
    post(proposing, "/api/installs", {"part": "downpipe", "installed_at": 1756723200000 + 5000})
    proposing.store.save_question_answer("what-changed:20260901-081358", "20260901-081358", "what-changed", "flashed-other")
    doc = proposing.get("/api/history").json()

    assert [v["n"] for v in doc["mapVersions"]] == [1, 2]
    assert set(doc["mapTables"]) == {"2"}, "version 1's cells are the app's own map data"
    assert [r["n"] for r in doc["mapRestores"]] == [1]
    assert doc["installs"][0]["part"] == "downpipe"
    assert doc["questionAnswers"]["what-changed:20260901-081358"]["choice"] == "flashed-other"
    assert "raw_csv" not in json.dumps(doc) and "csv" not in doc

    fresh = Loop(tmp_path / "fresh").start()
    try:
        added = post(fresh, "/api/history", doc).json()["added"]
        assert added["installs"] == 1 and added["answers"] == 1 and added["flashes"] == 2
        assert fresh.store.map_version(2)["tables"] == proposing.store.map_version(2)["tables"]
        assert fresh.store.list_flashes()[0]["map"] == proposing.store.list_flashes()[0]["map"]
        assert [i["part"] for i in fresh.store.list_installs()] == ["downpipe"]
        assert "what-changed:20260901-081358" in fresh.store.list_question_answers()
        assert fresh.get("/api/flash").json()["active"]["n"] == 1, "the Undo came across"

        # Importing again adds nothing.
        again = post(fresh, "/api/history", doc).json()["added"]
        assert again["installs"] == again["answers"] == again["flashes"] == again["mapVersions"] == 0
    finally:
        fresh.close()


def test_merging_a_history_file_keeps_both_sides(proposing: Loop, tmp_path: Path):
    flashed(proposing)
    post(proposing, "/api/installs", {"part": "downpipe", "installed_at": 1756723200000 + 5000})
    proposing.store.save_question_answer("what-changed:a", "a", "what-changed", "nothing")
    doc = proposing.get("/api/history").json()

    mine = Loop(tmp_path / "mine").start()
    try:
        post(mine, "/api/installs", {"part": "intake", "installed_at": 1756723200000 + 9000})
        mine.store.save_question_answer("what-changed:a", "a", "what-changed", "flashed-other")
        mine.store.save_question_answer("what-changed:b", "b", "what-changed", "nothing")
        post(mine, "/api/history", doc)
        assert sorted(i["part"] for i in mine.store.list_installs()) == ["downpipe", "intake"]
        answers = mine.store.list_question_answers()
        assert answers["what-changed:a"]["choice"] == "flashed-other", "an answer I already gave is never overwritten"
        assert "what-changed:b" in answers
        assert [v["n"] for v in mine.store.list_map_versions()] == [1, 2]
        assert mine.store.map_version(2)["tables"] is not None
    finally:
        mine.close()


# -- the worker ops the step uses ---------------------------------------------
def test_table_meta_names_tables_the_way_ktuner_does(proposing: Loop):
    meta = proposing.run(proposing.worker.call(
        "tableMeta", ids=["Boost_Target_3_Normal_H", "WOT_Enrich_L", "MAF_Scaling_Custom"]))["tables"]
    assert meta["Boost_Target_3_Normal_H"]["label"] == "Boost Target 3 Normal H"
    assert meta["WOT_Enrich_L"]["label"] == "WOT Enrichment L" and meta["WOT_Enrich_L"]["unit"] == "AFR"
    assert meta["MAF_Scaling_Custom"]["label"] == "AFM Flow (Custom)"
    assert (meta["MAF_Scaling_Custom"]["unit"], meta["MAF_Scaling_Custom"]["digits"]) == ("g/s", 3)


def test_an_air_flow_curve_change_is_checked_and_drawn_by_point(proposing: Loop):
    base = basemap_tables()
    before = base["MAF_Scaling_Custom"]["values"][0]
    after = [round(v * 1.04, 3) if k in (10, 11, 12) else v for k, v in enumerate(before)]
    plan = {"kind": "one-family", "family": "AFM Flow", "mapVersion": {"n": 1}, "cells": [], "afmAfter": after,
            "headline": "AFM Flow: +4.0 %", "saveAs": "x", "undo": {}, "evidence": [{"text": "why"}], "proof": "p"}
    change = F.change_from_plan(plan, base)
    assert [c["col"] for c in change["tables"]["MAF_Scaling_Custom"]] == [10, 11, 12]
    version = {"n": 1, "label": "Map version 1", "name": BASEMAP, "tables": base}
    verdict = proposing.run(F.check_both(proposing.worker, version, change))
    assert verdict["ok"], verdict
    meta = proposing.run(proposing.worker.call("tableMeta", ids=["MAF_Scaling_Custom"]))["tables"]
    card, cells = F.build_card(plan, change, version, verdict, meta, base)
    (group,) = card["groups"]
    assert group["tables"] == ["AFM Flow (Custom)"] and group["unit"] == "g/s"
    assert [c["column"] for c in group["cells"]] == ["point 11 of 103", "point 12 of 103", "point 13 of 103"]
    assert group["cells"][0]["after"] == f"{after[10]:.3f}" and group["cells"][0]["row"].endswith(" Hz")
    assert group["pasteRow"].split("\t")[11] == f"{after[11]:.3f}" and len(group["pasteRow"].split("\t")) == 103
    assert [c["table"] for c in cells] == ["MAF_Scaling_Custom"] * 3
    # A 12 % jump is refused by both checks.
    jump = dict(plan, afmAfter=[v * 1.12 if k == 20 else v for k, v in enumerate(before)])
    refused = proposing.run(F.check_both(proposing.worker, version, F.change_from_plan(jump, base)))
    assert not refused["ok"] and refused["engine"] == refused["python"] == "maf-step"


def test_the_table_viewer_reads_any_table_of_the_map_version(loop: Loop):
    """Tuning-shop: the owner reviews a whole table (2D/3D) before typing anything into KTuner."""
    families = loop.get("/api/map/table").json()["families"]
    assert [f["id"] for f in families][:3] == ["airflow", "mixture", "boost"]
    assert "Ignition_Base_L" in next(f for f in families if f["id"] == "ignition")["tables"]
    table = loop.get("/api/map/table?name=Ignition_Base_L").json()
    assert table["rows"] == 20 and table["cols"] == 20 and len(table["rpm_axis"]) == 20
    assert table["editable_here"] is False
    assert table["changes"] == []
    assert loop.get("/api/map/table?name=Not_A_Table").status_code == 404


def test_the_table_viewer_outlines_the_planned_cells_by_either_spelling(proposing: Loop):
    """The KTuner card names tables as KTuner shows them; the viewer finds them and outlines the plan's cells."""
    plan = propose(proposing)
    display = plan["ktunerCard"]["groups"][0]["tables"][0]  # "Boost Target 1 Normal L"
    body = proposing.get(f"/api/map/table?name={display}").json()
    assert body["table"] == display.replace(" ", "_")
    cells = plan["ktunerCard"]["groups"][0]["cells"]
    assert len(body["changes"]) == len(cells)
    for change in body["changes"]:
        assert body["rpm_axis"][change["row"]] in {c["rpm"] for c in cells}

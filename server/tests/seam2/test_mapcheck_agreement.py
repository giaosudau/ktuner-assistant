"""The engine's rules and the Python check agree on every generated change.

Each case feeds `KTA.checkMapChange` (through the Node bridge) and
`mapcheck.check_change` the same change and the same tables. Valid changes
accept on both; every fault — off-by-one index, wrong before, out of bounds,
broken pair, two families, forbidden table, wrong Map version — rejects on
both with the same reason. Any disagreement fails showing both reasons.
"""

from __future__ import annotations

import copy
from pathlib import Path
from typing import Any

from conftest import check_both, engine_verdict

from kta_server import mapcheck
from kta_server.db import Store

BOOST_IDS = [
    "Boost_Target_1_Normal_L",
    "Boost_Target_1_Normal_H",
    "Boost_Target_2_Normal_L",
    "Boost_Target_2_Normal_H",
    "Boost_Target_3_Normal_L",
    "Boost_Target_3_Normal_H",
]
WOT_IDS = ["WOT_Enrich_L", "WOT_Enrich_H"]
MAF_ID = "MAF_Scaling_Custom"


def boost_lower(tables: dict[str, Any], row: int = 9, col: int = 6, delta: float = -1.0) -> dict[str, Any]:
    """The same lowering on all six Normal boost tables."""
    change: dict[str, Any] = {"mapVersion": 1, "tables": {}}
    for table_id in BOOST_IDS:
        before = tables[table_id]["values"][row][col]
        change["tables"][table_id] = [
            {"row": row, "col": col, "before": before, "after": round(before + delta, 1)}
        ]
    return change


def test_valid_boost_lowering_accepts_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change = boost_lower(basemap)
    assert mapcheck.check_change(change, basemap)["reason"] == "ok"
    check_both("valid boost lowering", change, basemap, tmp_path)


def test_valid_maf_curve_accepts_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    curve = basemap[MAF_ID]["values"][0]
    cells = [
        {"row": 0, "col": k, "before": curve[k], "after": round(curve[k] * 1.05, 3)}
        for k in (40, 41, 42)
    ]
    change = {"mapVersion": 1, "tables": {MAF_ID: cells}}
    assert mapcheck.check_change(change, basemap)["reason"] == "ok"
    check_both("valid MAF curve", change, basemap, tmp_path)


def test_valid_wot_pair_accepts_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change: dict[str, Any] = {"mapVersion": 1, "tables": {}}
    for table_id in WOT_IDS:
        change["tables"][table_id] = [
            {"row": 15, "col": c, "before": 11.0, "after": 11.5} for c in (7, 8, 9)
        ]
    assert mapcheck.check_change(change, basemap)["reason"] == "ok"
    check_both("valid WOT pair", change, basemap, tmp_path)


def test_off_by_one_index_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change = boost_lower(basemap)
    rows = len(basemap[BOOST_IDS[0]]["values"])
    change["tables"][BOOST_IDS[0]] = [
        {"row": rows, "col": 6, "before": 0, "after": 0}  # one past the last row
    ]
    assert mapcheck.check_change(change, basemap)["reason"] == "index-out-of-range"
    check_both("off-by-one index", change, basemap, tmp_path)


def test_wrong_before_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change = boost_lower(basemap)
    change["tables"][BOOST_IDS[0]][0]["before"] += 0.1
    assert mapcheck.check_change(change, basemap)["reason"] == "before-mismatch"
    check_both("wrong before", change, basemap, tmp_path)


def test_out_of_bounds_step_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change = boost_lower(basemap, delta=-2.0)
    assert mapcheck.check_change(change, basemap)["reason"] == "boost-step"
    check_both("out-of-bounds step", change, basemap, tmp_path)


TUNE2 = ["Boost_Target_2_Normal_L", "Boost_Target_2_Normal_H"]
TUNE13 = [
    "Boost_Target_1_Normal_L",
    "Boost_Target_1_Normal_H",
    "Boost_Target_3_Normal_L",
    "Boost_Target_3_Normal_H",
]


def raise_cells(
    tables: dict[str, Any], ids: list[str], row: int, col: int, after: float | None = None
) -> dict[str, Any]:
    """One cell moved to `after` (default +1 psi) in each named table."""
    change: dict[str, Any] = {"mapVersion": 1, "tables": {}}
    for table_id in ids:
        before = tables[table_id]["values"][row][col]
        change["tables"][table_id] = [
            {"row": row, "col": col, "before": before, "after": before + 1 if after is None else after}
        ]
    return change


def with_cell(tables: dict[str, Any], ids: list[str], row: int, col: int, value: float) -> dict[str, Any]:
    out = copy.deepcopy(tables)
    for table_id in ids:
        out[table_id]["values"][row][col] = value
    return out


def test_above_the_ceiling_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    # The ceiling is the Final Boost Target peak at that row (23.4 here): a Tune 2
    # cell already at 23 psi, raised 1 psi, is within the step but above it.
    row = basemap[TUNE2[1]]["rpm_axis"].index(4000)
    tables = with_cell(basemap, TUNE2, row, 7, 23.0)
    change = raise_cells(tables, TUNE2, row, 7)
    verdict = mapcheck.check_change(change, tables)
    assert verdict["reason"] == "boost-ceiling"
    assert "23.4 psi" in verdict["detail"]
    check_both("above the ceiling", change, tables, tmp_path)
    # A Final Boost Target that tops out higher still stops at 24 psi.
    high = with_cell(tables, TUNE2, row, 7, 23.5)
    for table_id in ("Final_Boost_Target_L", "Final_Boost_Target_H"):
        high[table_id]["values"] = [[30.0] * len(r) for r in high[table_id]["values"]]
    change = raise_cells(high, TUNE2, row, 7)
    assert mapcheck.check_change(change, high)["reason"] == "boost-ceiling"
    check_both("above 24 psi", change, high, tmp_path)


def test_a_boost_step_on_tune_2_alone_accepts_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    row = basemap[TUNE2[1]]["rpm_axis"].index(3500)
    change = raise_cells(basemap, TUNE2, row, 7)
    assert mapcheck.check_change(change, basemap)["reason"] == "ok"
    check_both("Boost step on Tune 2", change, basemap, tmp_path)


def test_a_raise_in_tune_1_or_3_only_as_a_promote_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    row = basemap[TUNE2[1]]["rpm_axis"].index(3500)
    # All six up together: Tunes 1 and 3 do not copy Tune 2.
    six = raise_cells(basemap, BOOST_IDS, row, 7)
    assert mapcheck.check_change(six, basemap)["reason"] == "boost-promote"
    check_both("raise on all six", six, basemap, tmp_path)
    # Tune 1 alone is no group.
    one = raise_cells(basemap, ["Boost_Target_1_Normal_L", "Boost_Target_1_Normal_H"], row, 7)
    assert mapcheck.check_change(one, basemap)["reason"] == "pair-mismatch"
    check_both("Tune 1 alone", one, basemap, tmp_path)
    # Tune 2 carries the proven step: copying it to Tunes 1 and 3 passes, anything else fails.
    stepped = with_cell(basemap, TUNE2, row, 7, 22.0)
    promote = raise_cells(stepped, TUNE13, row, 7, 22.0)
    assert mapcheck.check_change(promote, stepped)["reason"] == "ok"
    check_both("promote", promote, stepped, tmp_path)
    wrong = raise_cells(stepped, TUNE13, row, 7, 21.5)
    assert mapcheck.check_change(wrong, stepped)["reason"] == "boost-promote"
    check_both("promote not equal to Tune 2", wrong, stepped, tmp_path)
    # Lowering on Tune 2 alone (taking a step back) stays allowed.
    back = raise_cells(basemap, TUNE2, row, 7, 20.0)
    assert mapcheck.check_change(back, basemap)["reason"] == "ok"
    check_both("Tune 2 lowered", back, basemap, tmp_path)


def test_broken_pair_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change = boost_lower(basemap)
    del change["tables"][BOOST_IDS[-1]]  # five of six move
    assert mapcheck.check_change(change, basemap)["reason"] == "pair-mismatch"
    check_both("broken pair", change, basemap, tmp_path)


def test_divergent_pair_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change = boost_lower(basemap)
    change["tables"][BOOST_IDS[0]][0]["after"] += 0.5  # one member differs
    assert mapcheck.check_change(change, basemap)["reason"] == "pair-mismatch"
    check_both("divergent pair", change, basemap, tmp_path)


def test_two_families_reject_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change = boost_lower(basemap)
    change["tables"][WOT_IDS[0]] = [{"row": 15, "col": 7, "before": 11.0, "after": 11.5}]
    change["tables"][WOT_IDS[1]] = [{"row": 15, "col": 7, "before": 11.0, "after": 11.5}]
    assert mapcheck.check_change(change, basemap)["reason"] == "two-families"
    check_both("two families", change, basemap, tmp_path)


def test_forbidden_table_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    before = basemap["Ignition_Base_L"]["values"][0][0]
    change = {
        "mapVersion": 1,
        "tables": {"Ignition_Base_L": [{"row": 0, "col": 0, "before": before, "after": 30.0}]},
    }
    assert mapcheck.check_change(change, basemap)["reason"] == "forbidden-table"
    check_both("forbidden table", change, basemap, tmp_path)


def test_against_the_wrong_map_version_rejects_on_both(
    basemap: dict[str, Any], tmp_path: Path
) -> None:
    # The change was written on Map version 1, but version 2 already carries
    # it: every before misses, on both checks.
    change = boost_lower(basemap)
    version2 = copy.deepcopy(basemap)
    for table_id, cells in change["tables"].items():
        for cell in cells:
            version2[table_id]["values"][cell["row"]][cell["col"]] = cell["after"]
    assert mapcheck.check_change(change, version2)["reason"] == "before-mismatch"
    check_both("wrong Map version", change, version2, tmp_path)


def test_boost_raised_below_3000_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change: dict[str, Any] = {"mapVersion": 1, "tables": {}}
    for table_id in BOOST_IDS:  # row 4 is 1,500 rpm
        before = basemap[table_id]["values"][4][6]
        change["tables"][table_id] = [
            {"row": 4, "col": 6, "before": before, "after": round(before + 0.5, 1)}
        ]
    assert mapcheck.check_change(change, basemap)["reason"] == "boost-low-rpm-raise"
    check_both("boost raised below 3000", change, basemap, tmp_path)


def test_maf_beyond_ten_percent_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    curve = basemap[MAF_ID]["values"][0]
    change = {
        "mapVersion": 1,
        "tables": {MAF_ID: [{"row": 0, "col": 40, "before": curve[40], "after": round(curve[40] * 1.15, 3)}]},
    }
    assert mapcheck.check_change(change, basemap)["reason"] == "maf-step"
    check_both("MAF beyond ten percent", change, basemap, tmp_path)


def test_maf_curve_no_longer_rising_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    curve = basemap[MAF_ID]["values"][0]
    point = next(
        k for k in range(30, len(curve)) if (curve[k] - curve[k - 1]) / curve[k] < 0.09
    )
    change = {
        "mapVersion": 1,
        "tables": {
            MAF_ID: [{"row": 0, "col": point, "before": curve[point], "after": curve[point - 1]}]
        },
    }
    assert mapcheck.check_change(change, basemap)["reason"] == "maf-curve"
    check_both("MAF no longer rising", change, basemap, tmp_path)


def test_wot_outside_its_band_rejects_on_both(basemap: dict[str, Any], tmp_path: Path) -> None:
    change: dict[str, Any] = {"mapVersion": 1, "tables": {}}
    for table_id in WOT_IDS:
        change["tables"][table_id] = [{"row": 15, "col": 7, "before": 11.0, "after": 12.5}]
    assert mapcheck.check_change(change, basemap)["reason"] == "wot-band"
    check_both("WOT outside its band", change, basemap, tmp_path)


def test_unknown_table_and_empty_change_reject_on_both(
    basemap: dict[str, Any], tmp_path: Path
) -> None:
    unknown = {"mapVersion": 1, "tables": {"No_Such_Table": [{"row": 0, "col": 0, "before": 0, "after": 0}]}}
    assert mapcheck.check_change(unknown, basemap)["reason"] == "unknown-table"
    check_both("unknown table", unknown, basemap, tmp_path)
    empty: dict[str, Any] = {"mapVersion": 1, "tables": {}}
    assert mapcheck.check_change(empty, basemap)["reason"] == "empty-change"
    check_both("empty change", empty, basemap, tmp_path)


def test_check_against_version_uses_the_store_accessor(tmp_path: Path) -> None:
    """The Python check reads the active version through Store.map_version."""
    from kta_server.mapdata import basemap_tables

    store = Store(tmp_path / "ktuner.db")
    version = store.ensure_map_version(1, "Starter 21 Dual Tune 2", basemap_tables())
    assert version["n"] == 1
    reread = store.map_version(1)
    assert reread is not None and reread["tables"] is not None

    change = boost_lower(reread["tables"])
    verdict = mapcheck.check_against_version(change, reread)
    assert (verdict["ok"], verdict["reason"]) == (True, "ok")
    # The engine agrees with the same change against the same stored tables.
    theirs = engine_verdict(change, reread["tables"], tmp_path)
    assert (theirs["ok"], theirs["reason"]) == (True, "ok")

    # Written against another version: refused without reading any cells.
    other = dict(change, mapVersion=2)
    refused = mapcheck.check_against_version(other, reread)
    assert (refused["ok"], refused["reason"]) == (False, "wrong-map-version")

    # A version whose flashed change is not stored yet: refused, never lent
    # another version's tables.
    pending = store.ensure_map_version(2, "Starter 21 Dual Tune 2 · boost r1")
    assert pending["tables"] is None
    assert mapcheck.check_against_version(change, pending)["reason"] == "map-change-pending"

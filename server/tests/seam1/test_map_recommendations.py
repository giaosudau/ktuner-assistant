"""Eval: every map change the loop recommends is checked against the map data, end to end.

A wrong table, a wrong cell, a value KTuner wouldn't show, or a step in the wrong
direction costs the owner's trust and can cost an engine (tuning-shop, 4 Oct). For each
case the engine's own Flash plan produces, this audits what the owner would type:

1. every table is a real table in `data/ktuner-maps-digitized.json`, in an editable family;
2. every cell is inside the table, and its "before" is the map's own value, in the
   table's own decimals (what the owner sees in KTuner);
3. every "after" moves the right way for the cause (boost overshoot → boost down only),
   by no more than one step, in the same decimals;
4. both independent checks (engine + Python, ADR 0003) accept the exact change;
5. verify accepts a reply that quotes the plan, and rejects one that advises any other value.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from conftest import Loop

from kta_server import flash as F
from kta_server import mapcheck
from kta_server import tour as TOUR
from kta_server import verify as V
from kta_server.mapdata import basemap_tables

BOOST_STEP_MAX = 1.0  # psi per Flash round (data/thresholds.json, ADR 0003)
# Overshoot above the hold (+2.5 psi) proposes the downpipe trim; at or below it, nothing.
OVERSHOOTS = [1.5, 2.6, 3.0, 3.4, 4.2, 5.5]


def _decimals(text: str) -> int:
    return len(text.split(".")[1]) if "." in text else 0


def plan_for(tmp_path: Path, overshoot: float) -> tuple[Loop, dict]:
    loop = Loop(tmp_path).start()
    loop.upload_and_reply("sep01-0813")
    state = loop.store.car_state(None)
    for summary in state["drives"].values():
        summary["overshoot"] = overshoot
    loop.store.save_car_state(state)
    return loop, loop.get("/api/state").json()["flashPlan"]


@pytest.mark.parametrize("overshoot", OVERSHOOTS)
def test_every_recommended_change_is_valid_for_the_map(tmp_path: Path, overshoot: float):
    loop, plan = plan_for(tmp_path, overshoot)
    try:
        base = basemap_tables()
        if overshoot <= 2.5:
            assert plan["kind"] != "one-family", "no change is recommended inside the hold"
            return
        assert plan["kind"] == "one-family"
        card = plan["ktunerCard"]
        assert card["kind"] == "change" and card["groups"]
        for group in card["groups"]:
            for shown in group["tables"]:
                table_id = shown.replace(" ", "_")
                # 1. A real table, in a family the shop may change.
                assert table_id in base, shown
                assert (TOUR.family_of(table_id) or {}).get("editable"), f"{table_id} must never be recommended"
                axis, values = base[table_id]["rpm_axis"], base[table_id]["values"]
                for cell in group["cells"]:
                    # 2. Inside the table; "before" is the map's own value in its own decimals.
                    assert cell["rpm"] in axis, cell
                    row, col = axis.index(cell["rpm"]), cell["col"] - 1
                    assert 0 <= col < len(values[row]), cell
                    before, after = float(cell["before"]), float(cell["after"])
                    assert before == pytest.approx(values[row][col], abs=1e-6), (table_id, cell)
                    # 3. The right direction, one step at most, the same decimals KTuner shows.
                    assert after < before, "an overshoot only ever lowers boost"
                    assert before - after <= BOOST_STEP_MAX + 1e-9
                    assert _decimals(cell["after"]) == _decimals(cell["before"])
                    assert after <= float(plan.get("ceilingPsi") or 99)
        # 4. Both independent checks accept exactly this change.
        change = F.change_from_plan(plan, base)
        assert mapcheck.check_change(change, base)["ok"]
        assert loop.run(loop.worker.call("checkMapChange", change=change, tables=base))["ok"]
        # 5. Verify: quoting the plan passes; advising any other value fails.
        cell = plan["cells"][0]
        table = cell["table"]
        good = f"Change {table} at {group['cells'][0]['row']}: {cell['before']} → {cell['after']} psi."
        assert V.map_issues(good, plan) == []
        bad = f"Change {table} at {group['cells'][0]['row']}: {cell['before']} → {float(cell['after']) - 1:.1f} psi."
        assert V.map_issues(bad, plan), "a value the plan doesn't hold must fail"
    finally:
        loop.close()

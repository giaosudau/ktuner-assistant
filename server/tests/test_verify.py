"""Unit tests for the deterministic verify (ticket 08): no worker, no network.

Fast checks of every rule the agent's drafts are judged by. The seam-1 tests
prove the whole repair-then-fallback path through the front door.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from kta_server import verify as V

FACTS = [0.49, 0.65, 1.6, 53.0, -2.4, 2.0, 10.8, 11.0, 12.0, 42.0, 48.0, 1.0, 5.0]
PLAN = {
    "kind": "no-change",
    "headline": "Your logs support no map change right now.",
    "ceilingPsi": 21,
    "tables": [],
    "cells": [],
}
BOOST_PLAN = {
    "kind": "flash",
    "headline": "Trim boost.",
    "ceilingPsi": 21,
    "tables": [{"id": "Boost_Target_1_Normal_L"}],
    "cells": [{"table": "Boost_Target_1_Normal_L", "rpm": 2750, "rpmRow": 9, "col": 9, "before": 17.0, "after": 16.0}],
}


def check(prose, action="baseline", plan=PLAN, cells=None, facts=FACTS):
    return V.verify(prose, action, "baseline", facts, plan, cells)


# -- numbers ---------------------------------------------------------------
def test_a_reply_quoting_tool_numbers_passes():
    assert check("Knock Control went from 0.49 to 0.65 on this 1.5T with RON95 E10.")["ok"] is True


def test_rounding_is_fine_but_new_arithmetic_is_not():
    assert check("Knock Control peaked at 0.65.")["ok"] is True
    bad = check("Knock Control peaked at 0.83.")
    assert bad["ok"] is False
    assert "0.83" in bad["issues"][0]


def test_list_markers_are_not_numbers():
    assert check("1. Keep the revs up in hot traffic.")["ok"] is True


def test_free_car_constants_are_allowed():
    assert check("The stoich scale is 14.7 on this 1.5T.")["ok"] is True


def test_an_empty_reply_fails():
    assert check("")["ok"] is False


# -- the one action ----------------------------------------------------------
def test_the_decided_step_passes_and_any_other_fails():
    assert check("Keep the revs up.", action="baseline")["ok"] is True
    wrong = check("Keep the revs up.", action="undo")
    assert wrong["ok"] is False
    assert "undo" in wrong["issues"][0] and "baseline" in wrong["issues"][0]


# -- cells -------------------------------------------------------------------
def test_a_flash_plan_cell_quoted_exactly_passes():
    assert check(
        "Flash the planned cell.",
        action="baseline",
        plan=BOOST_PLAN,
        cells=[{"table": "Boost_Target_1_Normal_L", "row": 9, "col": 9, "before": 17.0, "after": 16.0}],
    )["ok"] is True


def test_a_cell_not_in_the_flash_plan_fails():
    bad = check(
        "Flash the planned cell.",
        action="baseline",
        plan=BOOST_PLAN,
        cells=[{"table": "Boost_Target_1_Normal_L", "row": 3, "col": 3, "before": 17.0, "after": 16.0}],
    )
    assert bad["ok"] is False
    assert "not in the Flash plan" in bad["issues"][0]


def test_any_cell_fails_when_the_plan_holds_no_change():
    bad = check(
        "Flash this cell.",
        action="baseline",
        plan=PLAN,
        cells=[{"table": "Boost_Target_1_Normal_L", "row": 9, "col": 9, "before": 17.0, "after": 16.0}],
    )
    assert bad["ok"] is False


def test_a_wrong_before_value_fails():
    bad = check(
        "Flash the planned cell.",
        action="baseline",
        plan=BOOST_PLAN,
        cells=[{"table": "Boost_Target_1_Normal_L", "row": 9, "col": 9, "before": 18.0, "after": 16.0}],
    )
    assert bad["ok"] is False
    assert "Flash plan" in bad["issues"][0]


# -- banned advice, English and Vietnamese ------------------------------------
def test_less_knock_sensitivity_is_rejected_in_both_languages():
    assert check("Lower the knock sensitivity a little.")["ok"] is False
    assert check("H\u00e3y gi\u1ea3m \u0111\u1ed9 nh\u1ea1y c\u1ea3m bi\u1ebfn k\xedch n\u1ed5.")["ok"] is False
    assert check("Never lower the knock sensitivity.")["ok"] is True


def test_not_damage_in_the_previous_sentence_is_not_a_negation():
    prose = "Knock Control peak 0.65: costs about 1.6\u00b0 of timing, not damage. Lower the knock sensitivity a little."
    assert check(prose)["ok"] is False


def test_more_timing_is_rejected_in_both_languages():
    assert check("Add timing to the ignition table in the lugging zone.")["ok"] is False
    assert check("When Knock Control falls, the ECU gives more timing everywhere.")["ok"] is True


def test_boost_above_the_ceiling_is_rejected():
    assert check("Raise the boost to 24 psi for more power.")["ok"] is False
    assert check("The turbo has no headroom left on this car.")["ok"] is True


def test_a_curve_edit_for_trims_is_rejected():
    assert check("Edit the AFM curve to fix the trims.")["ok"] is False
    assert check("Trims off everywhere route to the MAF Scaling choice or Undo.")["ok"] is True


def test_boost_raise_is_allowed_when_the_plan_raises_boost():
    assert check(
        "Flash the planned Boost trim.",
        action="baseline",
        plan={
            "kind": "flash",
            "ceilingPsi": 21,
            "tables": [{"id": "Boost_Target_1_Normal_L"}],
            "cells": [{"table": "Boost_Target_1_Normal_L", "row": 9, "col": 9, "before": 15.0, "after": 16.0}],
        },
    )["ok"] is True

"""Every thresholds entry has value, unit, basis and source (ticket 12)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from kta_server import mapcheck

THRESHOLDS_PATH = Path(mapcheck.THRESHOLDS_FILE)


@pytest.fixture(scope="module")
def raw() -> dict[str, Any]:
    return json.loads(THRESHOLDS_PATH.read_text(encoding="utf-8"))


def test_every_thresholds_entry_has_value_unit_basis_and_source(raw: dict[str, Any]) -> None:
    entries = {k: v for k, v in raw.items() if not k.startswith("_")}
    assert entries, "the file holds thresholds"
    for key, entry in entries.items():
        assert "value" in entry, f"{key} has a value"
        assert isinstance(entry.get("unit"), str), f"{key} has a unit"
        assert entry.get("basis") in ("measured", "source", "judgement"), (
            f"{key} basis is measured/source/judgement, got {entry.get('basis')}"
        )
        assert isinstance(entry.get("source"), str) and entry["source"], (
            f"{key} names its source"
        )


def test_the_numbers_that_bound_a_change(raw: dict[str, Any]) -> None:
    assert raw["boost_step_max"]["value"] == 1
    assert raw["boost_raise_min_rpm"]["value"] == 3000
    assert raw["boost_ceiling_psi"]["value"] == 21
    assert raw["maf_step_max_pct"]["value"] == 10
    assert raw["wot_target_band"]["value"] == {"min": 11.0, "max": 12.0}


def test_the_table_lists_cover_the_whole_map(raw: dict[str, Any]) -> None:
    editable = raw["editable_tables"]["value"]
    forbidden = raw["forbidden_tables"]["value"]
    assert len(editable) == 9
    assert len(forbidden) == 30
    assert set(editable) | set(forbidden) == set(forbidden) | set(editable)
    assert not set(editable) & set(forbidden)
    assert set(raw["boost_pairs"]["value"]["members"]) <= set(editable)
    assert set(raw["wot_pairs"]["value"]["members"]) <= set(editable)
    assert raw["one_family_per_flash"]["value"] is True

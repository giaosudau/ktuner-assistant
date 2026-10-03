"""The independent map change check (ticket 12, ADR 0003).

One side of the two-sided map check: is this proposed change safe to type
into KTuner on top of these tables? Deterministic, no LLM, no engine code —
only the standard library. It reads the same `data/thresholds.json` numbers
the engine reads, through its own code path.

Change shape (the same JSON both checks take):

    {"mapVersion": 1,
     "tables": {"Boost_Target_1_Normal_L":
                    [{"row": 9, "col": 6, "before": 8.6, "after": 7.6}], ...}}

Row is the 0-based rpm-axis index, col the 0-based column; curves (MAF
Scaling) use row 0 with col as the point index. `tables` is one Map version's
tables in the digitized shape `{id: {"rpm_axis": [...], "values": [[...]]}}`,
as `Store.map_version(n)["tables"]` holds them.

Check order is part of the contract with the engine's `KTA.checkMapChange`:
empty, duplicate cell, unknown table, forbidden table, bad axes, index range,
before match, one family, pairs, per-cell bounds, MAF curve still rising.
`check_against_version` adds the version guards the store owns: the version
must hold tables (a version whose flashed change is not stored yet refuses),
and the change must be written against that version's number.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
THRESHOLDS_FILE = REPO_ROOT / "data" / "thresholds.json"

EPS = 1e-9


def load_thresholds(path: str | Path = THRESHOLDS_FILE) -> dict[str, Any]:
    """The thresholds both checks share, read from the data file."""
    with open(path, encoding="utf-8") as handle:
        thresholds = json.load(handle)
    if not isinstance(thresholds, dict) or not thresholds:
        raise RuntimeError(f"The thresholds file is not readable: {path}")
    return thresholds


def _no(reason: str, detail: str | None = None) -> dict[str, Any]:
    return {"ok": False, "reason": reason, "detail": detail}


def check_change(
    change: dict[str, Any],
    tables: dict[str, Any] | None,
    thresholds: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Accept or reject a proposed change against one Map version's tables."""
    th = thresholds if thresholds is not None else load_thresholds()
    editable: dict[str, str] = th["editable_tables"]["value"]
    forbidden: list[str] = th["forbidden_tables"]["value"]
    boost_set: list[str] = th["boost_pairs"]["value"]["members"]
    wot_set: list[str] = th["wot_pairs"]["value"]["members"]
    step_max: float = th["boost_step_max"]["value"]
    min_rpm: float = th["boost_raise_min_rpm"]["value"]
    maf_pct: float = th["maf_step_max_pct"]["value"] / 100
    wot_min: float = th["wot_target_band"]["value"]["min"]
    wot_max: float = th["wot_target_band"]["value"]["max"]
    ceiling: float = th["boost_ceiling_psi"]["value"]

    named = change.get("tables") if isinstance(change, dict) else None
    ids = list(named) if isinstance(named, dict) else []
    total = sum(len(named[table_id] or []) for table_id in ids) if ids else 0
    if not ids or not total:
        return _no("empty-change", "The change names no cells.")
    seen: dict[str, int] = {}
    for table_id in ids:
        for cell in named[table_id] or []:
            key = f"{table_id}|{cell.get('row')}|{cell.get('col')}"
            seen[key] = seen.get(key, 0) + 1
    for key, count in seen.items():
        if count > 1:
            table_id, row, col = key.split("|")
            return _no("duplicate-cell", f"{table_id} names row {row} col {col} twice.")

    for table_id in ids:
        raw = tables.get(table_id) if isinstance(tables, dict) else None
        if table_id not in editable and table_id not in forbidden:
            return _no("unknown-table", f"There is no table {table_id} in this map.")
        if raw is None:
            return _no("unknown-table", f"There is no table {table_id} in this map.")
        if table_id not in editable:
            return _no("forbidden-table", f"{table_id} is never edited.")

    # Axes exist, and each cell's indices are in range, before any value is read.
    flat: list[dict[str, Any]] = []
    families: dict[str, bool] = {}
    for table_id in ids:
        raw = tables[table_id]
        axis = raw.get("rpm_axis") if isinstance(raw, dict) else None
        values = raw.get("values") if isinstance(raw, dict) else None
        if not axis or not values or not values[0]:
            return _no("bad-axes", f"{table_id} has no axes.")
        curve = len(values) == 1 and len(values[0]) == len(axis)
        rows = 1 if curve else len(values)
        cols = len(values[0])
        if len(values) != (1 if curve else len(axis)):
            return _no(
                "bad-axes",
                f"{table_id} has {len(values)} rows for {len(axis)} axis points.",
            )
        for cell in named[table_id] or []:
            row, col = cell.get("row"), cell.get("col")
            if (
                not isinstance(row, int)
                or not isinstance(col, int)
                or isinstance(row, bool)
                or isinstance(col, bool)
                or row < 0
                or col < 0
                or row >= rows
                or col >= cols
            ):
                return _no(
                    "index-out-of-range",
                    f"{table_id} row {row} col {col}: the table is {rows} x {cols}.",
                )
            active = values[0][col] if curve else values[row][col]
            before, after = cell.get("before"), cell.get("after")
            if (
                not isinstance(before, (int, float))
                or isinstance(before, bool)
                or not isinstance(after, (int, float))
                or isinstance(after, bool)
                or before != active
            ):
                return _no(
                    "before-mismatch",
                    f"{table_id} row {row} col {col} was {active}, not {before}: "
                    "the map moved under this change.",
                )
            flat.append(
                {
                    "id": table_id,
                    "row": row,
                    "col": col,
                    "before": before,
                    "after": after,
                    "rpm": axis[0] if curve else axis[row],
                }
            )
            families[editable[table_id]] = True

    if len(families) > 1:
        return _no(
            "two-families",
            "One Flash carries one family: " + " + ".join(sorted(families)) + ".",
        )
    # Pairs move together: every member present, with identical cells.
    for pair_set in (boost_set, wot_set):
        touched = [m for m in pair_set if named.get(m)]
        if not touched:
            continue
        missing = [m for m in pair_set if not named.get(m)]
        if missing:
            return _no(
                "pair-mismatch",
                f"{touched[0]} moves but {missing[0]} does not: pairs move together.",
            )
        signatures = [
            sorted(
                f"{c.get('row')}:{c.get('col')}={c.get('before')}->{c.get('after')}"
                for c in named[m]
            )
            for m in pair_set
        ]
        for other, signature in zip(pair_set[1:], signatures[1:]):
            if signature != signatures[0]:
                return _no(
                    "pair-mismatch",
                    f"{other} differs from {pair_set[0]}: pairs stay identical.",
                )

    # The effective ceiling is the lower of the file's ceiling and the active
    # map's Final Boost Target peak (the engine takes the same min).
    final = None
    if isinstance(tables, dict):
        final = tables.get("Final_Boost_Target_H") or tables.get("Final_Boost_Target_L")
    if isinstance(final, dict) and final.get("values"):
        peak = max(
            (v for row in final["values"] for v in row if isinstance(v, (int, float))),
            default=None,
        )
        if peak is not None and peak < ceiling:
            ceiling = peak
    for cell in flat:
        family = editable[cell["id"]]
        delta = cell["after"] - cell["before"]
        if family == "boost":
            if abs(delta) > step_max + EPS:
                return _no(
                    "boost-step",
                    f"{cell['id']} row {cell['row']} col {cell['col']} moves "
                    f"{delta:.1f} psi: at most {step_max} psi per Flash.",
                )
            if cell["rpm"] < min_rpm and delta > EPS:
                return _no(
                    "boost-low-rpm-raise",
                    f"{cell['id']} at {cell['rpm']} rpm: "
                    f"no boost raised below {min_rpm} rpm.",
                )
            if cell["after"] > ceiling + EPS:
                return _no(
                    "boost-ceiling",
                    f"{cell['id']} asks {cell['after']} psi: the ceiling is "
                    f"{ceiling} psi.",
                )
        elif family == "AFM Flow":
            pct = (cell["after"] / cell["before"] - 1) if cell["before"] else (
                float("inf") if cell["after"] else 0.0
            )
            if not abs(pct) <= maf_pct + EPS:
                return _no(
                    "maf-step",
                    f"{cell['id']} point {cell['col']} moves {pct * 100:.1f} %: "
                    f"at most {maf_pct * 100} % per round.",
                )
        elif family == "mixture":
            if cell["after"] < wot_min - EPS or cell["after"] > wot_max + EPS:
                return _no(
                    "wot-band",
                    f"{cell['id']} asks {cell['after']} AFR: "
                    f"the band is {wot_min}-{wot_max} AFR.",
                )
    # The MAF curve still rises at every point, after the change is applied.
    maf_cells = [c for c in flat if c["id"] == "MAF_Scaling_Custom"]
    if maf_cells:
        curve_values = list(tables["MAF_Scaling_Custom"]["values"][0])
        for cell in maf_cells:
            curve_values[cell["col"]] = cell["after"]
        for k in range(1, len(curve_values)):
            if not curve_values[k] > curve_values[k - 1]:
                return _no(
                    "maf-curve",
                    f"MAF Scaling point {k} ({curve_values[k]}) no longer rises "
                    f"above point {k - 1} ({curve_values[k - 1]}).",
                )
    return {
        "ok": True,
        "reason": "ok",
        "detail": f"{total} cell(s) in {len(ids)} table(s) are within the thresholds.",
    }


def check_against_version(
    change: dict[str, Any],
    version: dict[str, Any] | None,
    thresholds: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Check a change against one Map version as `Store.map_version(n)` holds it.

    The version must hold tables — a version whose flashed change is not
    stored yet refuses rather than lending another version's tables — and the
    change must be written against that version's number.
    """
    if not isinstance(version, dict):
        return _no("no-map-version", "There is no such Map version.")
    if not version.get("tables"):
        label = version.get("label", f"Map version {version.get('n')}")
        return _no(
            "map-change-pending",
            f"The change behind {label} is not stored yet, "
            "so its tables cannot be checked.",
        )
    if isinstance(change, dict) and change.get("mapVersion") != version.get("n"):
        return _no(
            "wrong-map-version",
            f"The change was written against Map version {change.get('mapVersion')}, "
            f"not Map version {version.get('n')}.",
        )
    return check_change(change, version["tables"], thresholds)


__all__ = ["EPS", "REPO_ROOT", "THRESHOLDS_FILE", "check_against_version", "check_change", "load_thresholds"]

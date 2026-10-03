"""Flash readback (ticket 14): did the ECU take what the owner typed?

On the Drives after a Flash, the logged Turbo Pressure Target at an rpm the
changed cells sit on must read the value the new Map version planned. Nothing
here knows a number the Map does not: every comparison is a cell of Map version
N (before) against Map version N+1 (after), read against the log.

What the log can and cannot show (said on the KTuner card):
* boost tables: the logged Turbo Pressure Target. Checked here.
* AFM Flow / MAF Scaling and WOT full-load mixture: the log shows trims and the
  commanded mixture, not the table cells. "Readback not possible".

Caveat kept honest: the log has no pedal/column channel, so a reading is placed
by rpm row and by which planned value it is closest to. Cells of one row that
share a value (a flat run of columns) cannot be told apart; they are one group
and are named as a column range.
"""

from __future__ import annotations

from typing import Any, Mapping

# Judgement thresholds (not map limits, so not in data/thresholds.json).
RPM_TOL = 30        # a sample counts for a row within this many rpm of its axis point
MATCH_PSI = 0.3     # a logged target this close to the planned value reads as it
BAND_PSI = 1.5      # a reading this close to a changed cell's old/new value is about that cell

BOOST_TABLES = {f"Boost_Target_{n}_Normal_{s}" for n in (1, 2, 3) for s in ("L", "H")}

NOT_POSSIBLE = {
    "AFM Flow": "Readback not possible: the log shows trims, not the air-flow curve. "
                "The Shakedown drive's trims are the check.",
    "WOT Enrichment": "Readback not possible: the log shows the commanded mixture, not the table's cells.",
}
BOOST_POSSIBLE = "Readback is possible: your first Drive after the Flash checks the logged Turbo Pressure Target in these cells."


def card_line(family: str | None) -> dict[str, Any]:
    """Per table family: can the log read this change back? (on the KTuner card)"""
    word = (family or "").lower()
    if word == "boost":
        return {"possible": True, "line": BOOST_POSSIBLE}
    key = "AFM Flow" if "afm" in word or "maf" in word else "WOT Enrichment" if "wot" in word else ""
    return {"possible": False, "line": NOT_POSSIBLE.get(key, "Readback not possible: the log does not show this table.")}


def _cells(old: Mapping[str, Any], new: Mapping[str, Any]) -> list[dict[str, Any]]:
    """The boost cells that differ between two Map versions, one entry per cell."""
    out: dict[tuple, dict[str, Any]] = {}
    for table in BOOST_TABLES & set(old) & set(new):
        axis = new[table]["rpm_axis"]
        for r, (orow, nrow) in enumerate(zip(old[table]["values"], new[table]["values"])):
            for c, (b, a) in enumerate(zip(orow, nrow)):
                if b != a:
                    out[(r, c)] = {"row": r, "col": c, "rpm": axis[r], "before": b, "after": a}
    return list(out.values())


def _unchanged_values(new: Mapping[str, Any], row: int, changed: set[int]) -> list[float]:
    """What the new Map holds in this row's untouched columns: readings that are theirs, not a changed cell's."""
    return [
        v for t in BOOST_TABLES & set(new) for c, v in enumerate(new[t]["values"][row]) if c not in changed
    ]


def groups(old: Mapping[str, Any], new: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Changed boost cells grouped by (rpm row, before, after): cells that cannot be told apart in a log."""
    cells = _cells(old, new)
    by_row: dict[int, set[int]] = {}
    for cell in cells:
        by_row.setdefault(cell["row"], set()).add(cell["col"])
    grouped: dict[tuple, dict[str, Any]] = {}
    for cell in sorted(cells, key=lambda c: (c["row"], c["col"])):
        key = (cell["row"], cell["before"], cell["after"])
        g = grouped.setdefault(key, {**cell, "cols": [], "others": _unchanged_values(new, cell["row"], by_row[cell["row"]])})
        g["cols"].append(cell["col"] + 1)
    return list(grouped.values())


def judge(group_list: list[dict[str, Any]], observed: Mapping[float, list[Mapping[str, Any]]]) -> list[dict[str, Any]]:
    """Per group: match / mismatch (with the reading) / unseen, from the tallies of logged targets."""
    rows: dict[int, list[dict[str, Any]]] = {}
    for g in group_list:
        rows.setdefault(g["row"], []).append(g)
    result = []
    for g in group_list:
        a, b = g["after"], g["before"]
        lo, hi = min(a, b) - BAND_PSI, max(a, b) + BAND_PSI
        mine = [
            t["psi"] for t in observed.get(g["rpm"], [])
            if lo <= t["psi"] <= hi and not any(abs(t["psi"] - u) <= MATCH_PSI for u in g["others"])
        ]
        # A reading belongs to the group of this row whose planned value it matches,
        # else to the one it is closest to (a typed value that is not any planned one).
        def owner(psi: float) -> dict[str, Any]:
            hit = [o for o in rows[g["row"]] if abs(psi - o["after"]) <= MATCH_PSI]
            return hit[0] if hit else min(rows[g["row"]], key=lambda o: min(abs(psi - o["after"]), abs(psi - o["before"])))
        mine = [p for p in mine if owner(p) is g]
        if any(abs(p - a) <= MATCH_PSI for p in mine):
            status, reads = "match", a
        elif mine:
            status, reads = "mismatch", min(mine, key=lambda p: abs(p - a))
        else:
            status, reads = "unseen", None
        result.append({**{k: g[k] for k in ("rpm", "cols", "before", "after")}, "status": status, "reads": reads})
    return result


def _cols(cols: list[int]) -> str:
    return f"column {cols[0]}" if len(cols) == 1 else f"one of columns {cols[0]} to {cols[-1]}"


def _word(g: Mapping[str, Any]) -> str:
    return f"{g['rpm']:,} rpm {_cols(g['cols'])} reads {g['reads']:.1f}, planned {g['after']:.1f}"


def verdict(groups_judged: list[dict[str, Any]], version_n: int) -> dict[str, Any]:
    """credited / mismatch / open, in the owner's words, from the judged groups."""
    bad = [g for g in groups_judged if g["status"] == "mismatch"]
    good = [g for g in groups_judged if g["status"] == "match"]
    rpms = sorted({g["rpm"] for g in groups_judged})
    band = f"{rpms[0]:,}-{rpms[-1]:,} rpm" if rpms else ""
    if bad:
        return {
            "state": "mismatch", "credited": False, "mismatches": [_word(g) for g in bad],
            "line": f"Readback: what the ECU runs is not Map version {version_n}. {_word(bad[0])}."
                    + (f" ({len(bad)} cells off.)" if len(bad) > 1 else ""),
            "next": "Re-check what you typed in KTuner: " + "; ".join(_word(g) for g in bad) + ".",
        }
    if good:
        return {
            "state": "credited", "credited": True, "mismatches": [],
            "line": f"Readback: the logged Turbo Pressure Target matches Map version {version_n} in "
                    f"{len(good)} of {len(groups_judged)} changed cell groups. The Flash is credited.",
            "next": None,
        }
    return {
        "state": "open", "credited": False, "mismatches": [],
        "line": f"Readback: can't tell yet. No Drive since the Flash logged a Turbo Pressure Target in the changed "
                f"cells, so I can't tell whether Map version {version_n} is what the ECU runs. "
                f"Do a pull through {band} to read it back.",
        "next": None,
    }


async def for_drive(worker, store, car_state: Mapping[str, Any], drive_id: str | None) -> dict[str, Any] | None:
    """The readback card for a reply, or None when no readback applies.

    Applies when the Map version on the car is a Flash of boost cells and this
    Drive is one of the Drives since that Flash. Evaluated over every Drive since
    the Flash, so a mismatch stands until the owner flashes again.
    """
    active = (await worker.call("mapVersions", state=car_state))["active"]
    version = store.map_version(active["n"]) if active else None
    if not version or version.get("kind") != "flash" or not version.get("tables") or not version.get("parent_id"):
        return None
    parent = store.map_version(version["parent_id"])
    if not parent or not parent.get("tables"):
        return None
    since = version.get("flashed_at") or 0
    drives = [
        d for d in store.list_drives()
        if not d["too_short"] and (d["started_at"] or 0) >= since
    ]
    if drive_id not in {d["id"] for d in drives}:
        return None
    glist = groups(parent["tables"], version["tables"])
    if not glist:
        return {"state": "not-possible", "credited": None, "mismatches": [], "version": version["n"],
                "line": card_line(version.get("changed"))["line"], "next": None, "cells": []}
    observed: dict[float, dict[float, int]] = {}
    for d in drives:
        upload = store.get_upload(d["upload_id"])
        if not upload:
            continue
        await worker.call("loadLog", csv=upload["csv"].decode("utf-8", "replace"), fileName=upload["file_name"], driveId=d["id"])
        got = await worker.call("logTargets", driveId=d["id"], rpms=sorted({g["rpm"] for g in glist}), tol=RPM_TOL)
        for row in got["rows"]:
            tally = observed.setdefault(row["rpm"], {})
            for t in row["targets"]:
                tally[t["psi"]] = tally.get(t["psi"], 0) + t["n"]
    seen = {rpm: [{"psi": p, "n": n} for p, n in sorted(t.items())] for rpm, t in observed.items()}
    judged = judge(glist, seen)
    return {**verdict(judged, version["n"]), "version": version["n"], "cells": judged}


def recheck_step(readback: Mapping[str, Any]) -> dict[str, Any]:
    """The Next step when readback found a mismatch: one thing, re-check what was typed."""
    return {
        "kind": "change", "key": "recheck", "title": "Re-check what you typed in KTuner",
        "body": readback["next"], "recipe": None, "gauges": None, "same": False, "proves": "",
        "upload": "", "uploadWhen": "", "flashPlan": None, "also": None,
    }


__all__ = ["card_line", "for_drive", "groups", "judge", "recheck_step", "verdict"]

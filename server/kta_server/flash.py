"""The Flash step: a proposed change, checked twice, drawn as the KTuner card.

A Flash plan from the engine (`KTA.carFlashPlan`, rules P1-P9) proposes cells.
Before the owner sees any of them they become one **change** (table, 0-based row
and column, before, after) that two separate checks read against the active Map
version's own tables (ADR 0003):

* the engine's `KTA.checkMapChange`, through the worker, and
* `mapcheck.py`, which shares only `data/thresholds.json` with it.

Both must accept it. If either refuses, or they disagree, the change never
becomes a card: the plan comes back `blocked`, says why, and the disagreement is
logged loudly. The KTuner card is then drawn **only from the checked change** —
never from the plan's own cell list — so what the owner types is what was
checked. Nothing here invents a map number: every value is a cell of a Map
version, the unit and decimals are the engine's own table facts.

Confirming ("I flashed it") is the only thing that creates a Map version.
"""

from __future__ import annotations

import copy
import hashlib
import json
import logging
from typing import Any, Mapping

from . import mapcheck, readback

log = logging.getLogger("kta.flash")

# What a refused change says, in the owner's words. The reason codes are the
# two checks' shared vocabulary (engine `checkMapChange`, `mapcheck.py`).
BLOCKED_WORDS = {
    "empty-change": "it names no cells",
    "duplicate-cell": "it names the same cell twice",
    "unknown-table": "it names a table this map does not have",
    "forbidden-table": "it touches a table this app never edits",
    "bad-axes": "a table's axes could not be read",
    "index-out-of-range": "it names a cell outside the table",
    "before-mismatch": "a value it says is on the car is not what Map version {n} holds",
    "two-families": "it changes more than one kind of table in one Flash",
    "pair-mismatch": "tables that always move together do not match",
    "boost-step": "it moves a boost cell by more than one psi",
    "boost-low-rpm-raise": "it raises boost below 3,000 rpm",
    "boost-ceiling": "it asks for more boost than this map allows",
    "maf-step": "it moves the air-flow curve by more than a round allows",
    "wot-band": "it asks for a full-load mixture outside the safe band",
    "maf-curve": "it would leave the air-flow curve no longer rising",
    "wrong-map-version": "it was written on a different Map version than the one on the car",
    "no-map-version": "the app does not hold the Map version the car is on",
    "map-change-pending": "the app does not hold the cells of Map version {n}, so it cannot check against them",
    "checks-disagree": "the app's two map checks do not agree",
}


def _fmt(value: Any, digits: int) -> str:
    return f"{float(value):.{int(digits)}f}"


def _thousands(value: Any) -> str:
    return f"{float(value):,.0f}"


# ---------------------------------------------------------------------------
# The change: the one thing both checks read
# ---------------------------------------------------------------------------
def change_from_plan(plan: Mapping[str, Any], tables: Mapping[str, Any] | None) -> dict[str, Any]:
    """The plan's cells as a change against one Map version (0-based row, col)."""
    named: dict[str, list[dict[str, Any]]] = {}
    for cell in plan.get("cells") or []:
        named.setdefault(cell["table"], []).append(
            {"row": cell["rpmRow"], "col": cell["col"] - 1, "before": cell["before"], "after": cell["after"]}
        )
    after = plan.get("afmAfter")
    if after:
        curve = ((tables or {}).get("MAF_Scaling_Custom") or {}).get("values") or [[]]
        before = curve[0]
        named["MAF_Scaling_Custom"] = [
            {"row": 0, "col": k, "before": before[k] if k < len(before) else None, "after": value}
            for k, value in enumerate(after)
            if k >= len(before) or value != before[k]
        ]
    return {"mapVersion": (plan.get("mapVersion") or {}).get("n"), "tables": named}


def change_id(change: Mapping[str, Any]) -> str:
    """A short fingerprint of the checked change: confirming names it, so a
    plan that moved between the card and the tap is refused, never flashed."""
    blob = json.dumps(change, sort_keys=True, separators=(",", ":"))
    return hashlib.sha1(blob.encode()).hexdigest()[:10]


def apply_change(tables: Mapping[str, Any], change: Mapping[str, Any]) -> dict[str, Any]:
    """The tables of the next Map version: the active ones with the checked cells set."""
    out = copy.deepcopy(dict(tables))
    for table_id, cells in (change.get("tables") or {}).items():
        values = out[table_id]["values"]
        curve = len(values) == 1 and len(values[0]) == len(out[table_id]["rpm_axis"])
        for cell in cells:
            values[0 if curve else cell["row"]][cell["col"]] = cell["after"]
    return out


# ---------------------------------------------------------------------------
# The two checks
# ---------------------------------------------------------------------------
async def check_both(worker, version: Mapping[str, Any] | None, change: Mapping[str, Any]) -> dict[str, Any]:
    """Run both checks. `ok` only when both accept; a split verdict fails loudly."""
    python = mapcheck.check_against_version(dict(change), dict(version) if version else None)
    if not version or not version.get("tables"):
        # Nothing to read the change against: neither check can sign it off.
        return _verdict(python["reason"], python, None, version)
    engine = await worker.call("checkMapChange", change=change, tables=version["tables"])
    if bool(engine["ok"]) != bool(python["ok"]):
        log.error(
            "The two map checks disagree on a change against Map version %s: engine %s (%s), python %s (%s).",
            version.get("n"), engine["ok"], engine["reason"], python["ok"], python["reason"],
        )
        return {**_verdict("checks-disagree", python, engine, version), "disagree": True}
    if engine["ok"]:
        return {"ok": True, "reason": "ok", "why": "", "disagree": False,
                "engine": engine["reason"], "python": python["reason"]}
    return _verdict(engine["reason"], python, engine, version)


def _verdict(reason: str, python: Mapping[str, Any], engine: Mapping[str, Any] | None, version) -> dict[str, Any]:
    n = (version or {}).get("n")
    return {
        "ok": False, "reason": reason, "disagree": False,
        "why": BLOCKED_WORDS.get(reason, "a check refused it").format(n=n),
        "engine": engine["reason"] if engine else None, "python": python["reason"],
    }


def blocked_plan(plan: Mapping[str, Any], check: Mapping[str, Any]) -> dict[str, Any]:
    """The plan with every cell taken out: a refused change reaches no card."""
    return {
        **plan, "kind": "blocked", "family": plan.get("family"), "cells": [], "cellCount": 0, "tables": [],
        "afmPasteRow": None, "afmAfter": None, "saveAs": None, "ktunerCard": None,
        "headline": f"I will not show this change: {check['why']}. Nothing to type in KTuner.",
        "blocked": {k: check[k] for k in ("reason", "why", "engine", "python", "disagree")},
    }


# ---------------------------------------------------------------------------
# The KTuner card
# ---------------------------------------------------------------------------
def _groups(change: Mapping[str, Any]) -> list[list[str]]:
    """Tables that carry the identical cells (the six Normal boost tables, WOT L and H) read as one."""
    seen: dict[str, list[str]] = {}
    for table_id, cells in change["tables"].items():
        key = json.dumps(sorted((c["row"], c["col"], c["before"], c["after"]) for c in cells))
        seen.setdefault(key, []).append(table_id)
    return list(seen.values())


def _effect(family: str, unit: str, digits: int, rows: list[dict[str, Any]]) -> str:
    """What the change does to this car, said from the cells themselves."""
    deltas = [r["after"] - r["before"] for r in rows]
    if family == "boost":
        lo, hi = min(r["rpm"] for r in rows), max(r["rpm"] for r in rows)
        word = "Lowers" if all(d < 0 for d in deltas) else "Raises" if all(d > 0 for d in deltas) else "Moves"
        size = f"by {_fmt(abs(deltas[0]), digits)} {unit} " if len({round(d, 6) for d in deltas}) == 1 else ""
        span = f"{_thousands(lo)} rpm" if lo == hi else f"{_thousands(lo)}-{_thousands(hi)} rpm"
        return f"{word} the boost the ECU aims for {size}in {len(rows)} cell{'s' if len(rows) != 1 else ''}, {span}."
    if family == "AFM Flow":
        pct = [(r["after"] / r["before"] - 1) * 100 for r in rows if r["before"]]
        lo, hi = min(pct), max(pct)
        span = f"{lo:+.1f} %" if round(lo, 1) == round(hi, 1) else f"{lo:+.1f} to {hi:+.1f} %"
        return f"Moves the air-flow curve {span} at {len(rows)} point{'s' if len(rows) != 1 else ''}."
    lo, hi = min(r["before"] for r in rows), max(r["after"] for r in rows)
    return f"Moves the full-load mixture command in {len(rows)} cell{'s' if len(rows) != 1 else ''} ({_fmt(lo, digits)} to {_fmt(hi, digits)} {unit})."


def build_card(
    plan: Mapping[str, Any],
    change: Mapping[str, Any],
    version: Mapping[str, Any],
    check: Mapping[str, Any],
    meta: Mapping[str, Any],
    tables: Mapping[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """The KTuner card for a checked change, and the cells the reply may quote."""
    family = plan.get("family") or ""
    groups_out: list[dict[str, Any]] = []
    cells_out: list[dict[str, Any]] = []
    for g_index, group in enumerate(_groups(change)):
        first = group[0]
        m = meta[first]
        raw = tables[first]
        curve = m["kind"] == "curve"
        axis = raw["rpm_axis"]
        width = len(raw["values"][0])
        rows = []
        for cell in sorted(change["tables"][first], key=lambda c: (c["row"], c["col"])):
            rpm = axis[cell["col"]] if curve else axis[cell["row"]]
            rows.append(
                {
                    "id": f"{g_index}-{cell['row']}-{cell['col']}",
                    "rpm": rpm,
                    "row": _thousands(rpm) + (" Hz" if curve else " rpm"),
                    "col": cell["col"] + 1,
                    "of": width,
                    "column": f"point {cell['col'] + 1} of {width}" if curve else f"{cell['col'] + 1} of {width}",
                    "before": _fmt(cell["before"], m["digits"]),
                    "after": _fmt(cell["after"], m["digits"]),
                    "unit": m["unit"],
                    "_b": cell["before"], "_a": cell["after"],
                }
            )
        paste = None
        if curve:
            full = list(raw["values"][0])
            for cell in change["tables"][first]:
                full[cell["col"]] = cell["after"]
            paste = "\t".join(_fmt(v, m["digits"]) for v in full)
        for table_id in group:
            for cell in change["tables"][table_id]:
                cells_out.append(
                    {"table": table_id, "rpm": axis[cell["col"]] if curve else axis[cell["row"]],
                     "rpmRow": cell["row"], "col": cell["col"] + 1, "of": width,
                     "before": cell["before"], "after": cell["after"]}
                )
        groups_out.append(
            {
                "tables": [meta[t]["label"] for t in group],
                "tableIds": group,
                "unit": m["unit"],
                "what": m["what"],
                "effect": _effect(family, m["unit"], m["digits"], [{"rpm": r["rpm"], "before": r["_b"], "after": r["_a"]} for r in rows]),
                "same": len(group) > 1,
                "pasteRow": paste,
                "cells": [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows],
            }
        )
    undo = plan.get("undo") or {}
    cause = (plan.get("evidence") or [{}])[0].get("text") or ""
    card = {
        "kind": "change",
        "changeId": change_id(change),
        "family": family,
        "headline": plan.get("headline"),
        "because": cause,
        "writtenOn": f"Written on {version['label']} · {version['name']}",
        "groups": groups_out,
        "cellCount": sum(len(g["cells"]) for g in groups_out),
        "tableCount": len(change["tables"]),
        "saveAs": plan.get("saveAs"),
        "undo": {
            "known": bool(undo.get("known")),
            "version": undo.get("version"),
            "line": plan.get("undoName"),
        },
        "proof": plan.get("proof"),
        "afterFlash": "Then drive a Shakedown drive: 10 calm minutes, no hard driving.",
        "readback": readback.card_line(family),
        "checked": "Checked twice, and both checks agree: the engine's rules and a separate check against "
        f"{version['label']}.",
    }
    return card, cells_out


def undo_card(plan: Mapping[str, Any], basemap: str, active_n: int | None) -> dict[str, Any] | None:
    """Undo has no cells to type: it is a file to load and flash."""
    undo = plan.get("undo") or {}
    if not undo.get("known"):
        return None
    return {
        "kind": "undo",
        "changeId": None,
        "headline": plan.get("headline"),
        "restore": {
            "version": undo["version"], "name": undo["name"],
            "line": f"In KTuner, load {undo['name']} (Map version {undo['version']}) and flash it.",
        },
        "proof": plan.get("proof"),
        "afterFlash": "Then drive a Shakedown drive: 10 calm minutes, no hard driving.",
    }


def revert_line(basemap: str) -> str:
    return f"In KTuner, load {basemap} and flash it."


# ---------------------------------------------------------------------------
# One call for every caller that shows a plan
# ---------------------------------------------------------------------------
async def active_map(worker, store, car_state: Mapping[str, Any]) -> dict[str, Any]:
    """`{"map": tables}` of the Map version on the car, for any worker op that reads the map.

    Empty when the app holds no cells for it, so the worker's own refusal stands
    rather than another version's tables standing in.
    """
    active = (await worker.call("mapVersions", state=car_state))["active"]
    version = store.map_version(active["n"]) if active else None
    return {"map": version["tables"]} if version and version.get("tables") else {}


async def checked_plan_with_change(
    worker, store, car_state: Mapping[str, Any], window_state: Mapping[str, Any], now: int
) -> tuple[dict[str, Any], dict[str, Any] | None, dict[str, Any] | None]:
    """The checked plan, the change it was drawn from, and the Map version it was
    written on. The change is None unless the plan carries a card of cells."""
    active = (await worker.call("mapVersions", state=car_state))["active"]
    version = store.map_version(active["n"]) if active else None
    kwargs = {"map": version["tables"]} if version and version.get("tables") else {}
    plan = await worker.call("flashPlan", state=window_state, now=now, **kwargs)
    if plan["kind"] == "undo":
        return {**plan, "ktunerCard": undo_card(plan, worker.ktuner_basemap, active and active["n"])}, None, version
    if plan["kind"] != "one-family":
        return plan, None, version
    tables = (version or {}).get("tables") or {}
    change = change_from_plan(plan, tables)
    check = await check_both(worker, version, change)
    if not check["ok"]:
        return blocked_plan(plan, check), None, version
    meta = (await worker.call("tableMeta", ids=list(change["tables"])))["tables"]
    card, cells = build_card(plan, change, version, check, meta, tables)
    checked = {
        **plan,
        "cells": cells,
        "cellCount": len(cells),
        "tables": [
            {"id": t, "kind": meta[t]["kind"], "cellCount": len(change["tables"][t]), "pasteRow": None}
            for t in change["tables"]
        ],
        "ktunerCard": card,
    }
    return checked, change, version


async def checked_plan(worker, store, car_state, window_state, now: int) -> dict[str, Any]:
    """The Flash plan the owner may see: written on the active Map version's own
    tables, and — when it proposes cells — passed by both map checks first."""
    return (await checked_plan_with_change(worker, store, car_state, window_state, now))[0]


__all__ = [
    "BLOCKED_WORDS", "active_map", "apply_change", "blocked_plan", "build_card", "change_from_plan", "change_id",
    "check_both", "checked_plan", "checked_plan_with_change", "revert_line", "undo_card",
]

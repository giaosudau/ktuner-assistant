"""Pictures in the chat (ticket 15): one picture per reply, each answering the step's one question.

The engine makes the chart data (`engine/kta-picture.js`, through the worker, or
the Car history rows and the checked Flash plan); this module only gathers it
into the shape the chat draws. The model never draws and never supplies a value:
through the `show_chart` tool it only picks a kind, and every picture lists the
`numbers` it prints so `verify.py` can insist the reply text says them too.

Kinds: `trace` (a channel around a Key moment), `baseline` (this Drive vs the
Baseline), `map_grid` (the Flash plan's cells on the rpm x 16 table), `proof`
(before/after bars, matched conditions only), `maf_gap` (the MAF Scaling curve
and what the plan changes). A picture that cannot be drawn is a `cant-tell`
card that says why.
"""

from __future__ import annotations

from typing import Any, Mapping

from .mapdata import basemap_tables

KINDS = ("trace", "baseline", "map_grid", "proof", "maf_gap")
BOOST_TABLE = "Boost_Target_1_Normal_L"
MAF_TABLE = "MAF_Scaling_Custom"


def cant_tell(why: str) -> dict[str, Any]:
    return {"kind": "cant-tell", "title": "Can't tell yet", "why": why, "numbers": []}


def _tables(store: Any, plan: Mapping[str, Any] | None) -> Mapping[str, Any]:
    n = ((plan or {}).get("mapVersion") or {}).get("n") or 1
    try:
        held = store.map_version(n)
    except Exception:  # noqa: BLE001 - a missing store only costs the held tables
        held = None
    return (held or {}).get("tables") or basemap_tables()


def baseline_picture(rows: list[dict[str, Any]], baseline: Mapping[str, Any] | None, drive_id: str) -> dict[str, Any]:
    """This Drive's Fuel-quality score at the start against the Baseline it is read against."""
    row = next((r for r in rows if r.get("id") == drive_id), None)
    if not row or row.get("kcStart") is None:
        return cant_tell("This Drive has no Fuel-quality score at the start, so there is nothing to put against the Baseline.")
    if not baseline or baseline.get("value") is None:
        return cant_tell("There is no Baseline yet: it needs one Cool drive with 2 pulls to measure every later Drive against.")
    mine, base, n = round(float(row["kcStart"]), 2), round(float(baseline["value"]), 2), int(baseline.get("n") or 0)
    return {
        "kind": "baseline",
        "title": "Fuel-quality score at the start, this Drive and your Baseline",
        "unit": "",
        "bars": [{"label": "Baseline", "value": base}, {"label": "This Drive", "value": mine}],
        "note": f"Baseline from {n} Cool drive{'s' if n != 1 else ''}. Lower is better; 0.49 is the best it can read.",
        "numbers": [mine, base, float(n)],
    }


def grid_picture(plan: Mapping[str, Any] | None, driven_rpm: list[Mapping[str, Any]], tables: Mapping[str, Any]) -> dict[str, Any]:
    """The Flash plan's boost cells on the rpm x 16 table: changed cells outlined, rpm rows the Drive sat in shaded."""
    card = (plan or {}).get("ktunerCard") or {}
    if card.get("kind") != "change" or not card.get("groups"):
        return cant_tell("The Flash plan holds no cells to draw: nothing changes in your map.")
    group = card["groups"][0]
    axis = (tables.get(BOOST_TABLE) or {}).get("rpm_axis") or basemap_tables()[BOOST_TABLE]["rpm_axis"]
    changes = []
    for cell in group.get("cells") or []:
        if cell.get("rpm") not in axis:
            continue
        changes.append(
            {"row": axis.index(cell["rpm"]), "col": int(cell["col"]) - 1, "before": float(cell["before"]),
             "after": float(cell["after"]), "rpm": cell["rpm"]}
        )
    if not changes:
        return cant_tell("The plan's cells are not on this table's rpm rows, so the grid cannot be drawn.")
    driven = sorted(
        {i for i, rpm in enumerate(axis) for band in driven_rpm if band["from"] <= rpm < band["to"]}
    )
    return {
        "kind": "map_grid",
        "title": group.get("what") or "Boost target",
        "tables": group.get("tables") or [],
        "rpm": axis,
        "cols": int(group["cells"][0].get("of") or 16),
        "changes": changes,
        "driven": driven,
        "unit": group.get("unit") or "psi",
        "numbers": [],  # the cells' values are the checked KTuner card's own text, not a model claim
    }


def maf_picture(plan: Mapping[str, Any] | None, tables: Mapping[str, Any]) -> dict[str, Any]:
    """The MAF Scaling curve now and as the plan changes it, with the gap between them."""
    after = (plan or {}).get("afmAfter")
    table = tables.get(MAF_TABLE) or {}
    before = (table.get("values") or [[]])[0]
    if not after or not before or len(after) != len(before):
        return cant_tell("No MAF Scaling change is planned: your trims do not ask for one right now.")
    axis = table.get("rpm_axis") or list(range(len(before)))
    step = max(1, len(before) // 24)
    pick = list(range(0, len(before), step))
    gaps = [(a / b - 1) * 100 for a, b in zip(after, before) if b]
    worst = max(gaps, key=abs) if gaps else 0.0
    return {
        "kind": "maf_gap",
        "title": "MAF Scaling curve, now and as planned",
        "x": [round(float(axis[i]), 0) for i in pick],
        "before": [round(float(before[i]), 3) for i in pick],
        "after": [round(float(after[i]), 3) for i in pick],
        "gapPct": round(worst, 1),
        "unit": "Hz",
        "numbers": [round(worst, 1)],
    }


async def build(
    kind: str, worker: Any, store: Any, drive_id: str, car_state: Mapping[str, Any], plan: Mapping[str, Any] | None,
    moment: int | None = None,
) -> dict[str, Any]:
    """One picture of one kind, from the engine's data. Never raises: a missing input is a `cant-tell` card."""
    picture = await _build(kind, worker, store, drive_id, car_state, plan, moment)
    if picture.get("kind") == "cant-tell":  # the engine's own can't-tell cards get the same shape
        picture.setdefault("title", "Can't tell yet")
        picture.setdefault("numbers", [])
    return picture


async def _build(
    kind: str, worker: Any, store: Any, drive_id: str, car_state: Mapping[str, Any], plan: Mapping[str, Any] | None,
    moment: int | None,
) -> dict[str, Any]:
    try:
        if kind == "trace":
            return await worker.call("picture", kind="trace", driveId=drive_id, moment=moment or 0)
        if kind == "baseline":
            history = await worker.call("carHistory", state=car_state, installs=store.list_installs())
            return baseline_picture(history["rows"], history["baseline"], drive_id)
        if kind == "map_grid":
            driven = (await worker.call("picture", kind="driven", driveId=drive_id)).get("rpm") or []
            return grid_picture(plan, driven, _tables(store, plan))
        if kind == "maf_gap":
            return maf_picture(plan, _tables(store, plan))
        if kind == "proof":
            settled = [s for s in store.list_open_steps() if s.get("settledBy") == drive_id and s.get("askedOn")]
            found = None
            for step in settled:
                found = await worker.call(
                    "picture", kind="proof", state=car_state, driveId=drive_id, beforeId=step["askedOn"], key=step["key"]
                )
                if found.get("kind") == "proof":
                    break
            return found or cant_tell("This Drive did not settle a step, so there is no before and after to show.")
    except Exception as exc:  # noqa: BLE001 - a picture never breaks a reply
        return cant_tell(f"The picture could not be drawn: {exc}")
    return cant_tell(f"I have no picture called {kind!r}.")


def summary_for_model(picture: Mapping[str, Any]) -> dict[str, Any]:
    """What the model is told about its picture: the numbers it must say, never the series."""
    return {
        "kind": picture.get("kind"),
        "title": picture.get("title"),
        "why": picture.get("why"),
        "numbers_to_say": picture.get("numbers") or [],
    }


__all__ = ["KINDS", "build", "baseline_picture", "cant_tell", "grid_picture", "maf_picture", "summary_for_model"]

"""The map tour (tuning-shop D3, D6): every KTuner table family, what it does, and where it stands.

A tuning shop shows the customer the whole map at a high level first — which tables matter for this
car, which one this round changes and why, which are locked and what unlocks them, which are left
to the basemap — then walks table by table on request. This module is that tour, built from the
map data the app holds and the Flash plan's own levers; it decides nothing. Every change still comes
only from the checked Flash plan (ADR 0003), and ignition and knock-sensitivity tables are read,
never edited (kc-table-ignition).
"""

from __future__ import annotations

from typing import Any, Mapping

#: Table families in the order a tuner works (kc-tune-order): air, fuel, boost, then spark.
FAMILIES: list[dict[str, Any]] = [
    {
        "id": "airflow",
        "title": "Airflow (MAF Scaling)",
        "card": "kc-table-maf",
        "what": "Turns the airflow sensor's frequency into grams of air. Every fuel calculation starts here.",
        "tables": ["MAF_Scaling_Custom", "MAF_Scaling_Factory", "MAF_Scaling_PRL_Race", "MAF_Scaling_27Won_Race"],
        "editable": True,
    },
    {
        "id": "mixture",
        "title": "Full-throttle mixture (WOT Enrich)",
        "card": "kc-table-wot",
        "what": "The mixture the ECU aims for under load; cruise stays at 14.7, top load asks 11.0.",
        "tables": ["WOT_Enrich_L", "WOT_Enrich_H"],
        "editable": True,
    },
    {
        "id": "boost",
        "title": "Boost targets and limits",
        "card": "kc-table-boost",
        "what": "The boost the ECU aims for by rpm and load, per mode, and the limits that cap it.",
        "tables": [
            "Boost_Target_1_Normal_L", "Boost_Target_1_Normal_H", "Boost_Target_2_Normal_L", "Boost_Target_2_Normal_H",
            "Boost_Target_3_Normal_L", "Boost_Target_3_Normal_H", "Boost_Target_1_ECO_L", "Boost_Target_1_ECO_H",
            "Final_Boost_Target_L", "Final_Boost_Target_H", "Boost_By_Gear_Limits",
            "Cylinder_Fill_Limitation_L", "Cylinder_Fill_Limitation_H",
        ],
        "editable": True,
    },
    {
        "id": "ignition",
        "title": "Ignition timing",
        "card": "kc-table-ignition",
        "what": "The spark map, its ceiling and the ethanol timing add. The ECU pulls timing itself when Knock Control rises.",
        "tables": ["Ignition_Base_L", "Ignition_Base_H", "Ignition_Max_L", "Ignition_Max_H", "Ethanol_Ign_Adj_L", "Ethanol_Ign_Adj_H"],
        "editable": False,
        "locked": (
            "Read-only here: best timing can't be seen from a street log, and the street rule is to only remove "
            "timing where retard collects, never add it without a dyno."
        ),
        "unlocks": "A dyno, or repeated retard in the same cells with the table's load axis digitized (then only removing timing).",
    },
    {
        "id": "knock",
        "title": "Knock sensitivity",
        "card": "kc-table-ignition",
        "what": "How sensitive knock detection is, per cylinder pair. Lowering it hides knock instead of fixing it.",
        "tables": ["Knock_Sens_1+4_L", "Knock_Sens_1+4_H", "Knock_Sens_2+3_L", "Knock_Sens_2+3_H"],
        "editable": False,
        "locked": "Never changed: lowering knock sensitivity hides knock instead of fixing it.",
        "unlocks": "Nothing in this app: this one stays with the basemap.",
    },
    {
        "id": "basemap",
        "title": "Left to the basemap",
        "card": "kc-tune-order",
        "what": "DI fuel pressure, exhaust cam phasing and the ethanol boost add: not tuned on the street.",
        "tables": [
            "DI_Fuel_Pressure_Target_0pct", "DI_Fuel_Pressure_Target_55pct", "WOT_Exhaust_VTC_Low_Cam",
            "Ethanol_Boost_Target_Adj_L", "Ethanol_Boost_Target_Adj_H",
        ],
        "editable": False,
        "locked": "Leave to the basemap: these are matched to the hardware, not to a street log.",
        "unlocks": "Hardware changes a professional tuner would recalibrate for.",
    },
]

_BY_TABLE = {table: fam for fam in FAMILIES for table in fam["tables"]}


def family_of(table: str) -> dict[str, Any] | None:
    return _BY_TABLE.get(table)


def _levers_for(family: Mapping[str, Any], plan: Mapping[str, Any] | None) -> list[Mapping[str, Any]]:
    tables = set(family["tables"])
    out = []
    for lever in (plan or {}).get("levers") or []:
        touches = set(lever.get("wouldTouch") or [])
        if touches & tables or (family["id"] == "airflow" and "AFM" in str(lever.get("family") or "")):
            out.append(lever)
            continue
        # Lever families the engine names without table ids.
        fam = str(lever.get("family") or "").lower()
        if family["id"] == "mixture" and fam in ("mixture", "wot", "fuel"):
            out.append(lever)
        elif family["id"] == "boost" and fam == "boost" and lever not in out:
            out.append(lever)
    return out


def map_tour(plan: Mapping[str, Any] | None, tables: Mapping[str, Any] | None) -> dict[str, Any]:
    """The high-level tour: one row per family with its status this round."""
    rows = []
    plan_family = str((plan or {}).get("family") or "").lower()
    for fam in FAMILIES:
        held = [t for t in fam["tables"] if (tables or {}).get(t)]
        levers = _levers_for(fam, plan)
        planned = [lv for lv in levers if lv.get("status") == "planned"]
        if not fam["editable"]:
            status, reason, unlocks = "read-only", fam["locked"], fam["unlocks"]
        elif planned or (plan_family and plan_family in (fam["id"], fam["title"].lower())):
            status = "this-round"
            reason = (planned[0].get("reason") if planned else None) or str((plan or {}).get("headline") or "")
            unlocks = None
        elif any(lv.get("status") in ("locked", "held", "deferred") for lv in levers):
            first = next(lv for lv in levers if lv.get("status") in ("locked", "held", "deferred"))
            status, reason, unlocks = "locked", str(first.get("reason") or ""), first.get("unlocks")
        else:
            status = "fine"
            not_needed = next((lv for lv in levers if lv.get("status") == "not-needed"), None)
            reason = str(not_needed.get("reason")) if not_needed else "Your logs ask nothing of it right now."
            unlocks = not_needed.get("unlocks") if not_needed else None
        rows.append(
            {
                "family": fam["id"],
                "title": fam["title"],
                "what": fam["what"],
                "card": fam["card"],
                "tables": held,
                "status": status,
                "reason": reason,
                "unlocks": unlocks,
            }
        )
    return {"families": rows, "headline": str((plan or {}).get("headline") or "")}


def read_table(tables: Mapping[str, Any] | None, table: str, rpm: float | None = None) -> dict[str, Any]:
    """One table as the model and the owner read it: axes, values, range, and the row nearest an rpm."""
    data = (tables or {}).get(table)
    if not data:
        names = sorted((tables or {}).keys())
        return {"error": f"No table {table!r} in this Map version.", "tables": names}
    values = data.get("values") or []
    flat = [v for row in values for v in row if isinstance(v, (int, float))]
    axis = data.get("rpm_axis") or []
    fam = family_of(table) or {}
    out: dict[str, Any] = {
        "table": table,
        "family": fam.get("id"),
        "card": fam.get("card"),
        "editable_here": bool(fam.get("editable")),
        "notes": data.get("notes"),
        "rows": len(values),
        "cols": len(values[0]) if values else 0,
        "rpm_axis": axis,
        "load_axis": data.get("load_axis") or "not digitized (columns are counted 1 to N from the left, as KTuner draws them)",
        "min": min(flat) if flat else None,
        "max": max(flat) if flat else None,
        "values": [[round(v, 2) if isinstance(v, float) else v for v in row] for row in values],
    }
    if rpm is not None and axis and len(axis) == len(values):
        i = min(range(len(axis)), key=lambda k: abs(axis[k] - rpm))
        out["row_at_rpm"] = {"rpm": axis[i], "values": out["values"][i]}
    return out


__all__ = ["FAMILIES", "family_of", "map_tour", "read_table"]

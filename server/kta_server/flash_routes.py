"""The Flash step's routes: "I flashed it", "Not now", Undo / Revert, the History file.

Every route recomputes the checked plan itself (`flash.checked_plan_with_change`)
and never trusts the browser's copy: the card names its change by fingerprint,
and a change that has moved since the card was drawn is refused. The only thing
that creates a Map version is `POST /api/flash/confirm`.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from . import flash as F
from . import tour as TOUR
from . import window as W
from .mapdata import basemap_tables

SHAKEDOWN_LINE = "Your next Drive is a Shakedown drive: 10 calm minutes, no hard driving."


def _version_card(version: dict[str, Any] | None) -> dict[str, Any] | None:
    if not version:
        return None
    return {"n": version["n"], "label": f"Map version {version['n']}", "name": version["name"]}


async def _current(store, worker, now: int):
    """The Car history, the window's checked plan, its change and the version it sits on."""
    car_state = store.car_state(None) or {}
    installs = store.list_installs()
    history = await worker.call("carHistory", state=car_state, installs=installs)
    rows = history["rows"]
    win = W.drive_window(rows, car_state.get("flashes"), installs, rows[-1]["id"] if rows else None)
    plan, change, version = await F.checked_plan_with_change(
        worker, store, car_state, W.windowed_state(car_state, win["ids"]), now
    )
    return car_state, plan, change, version, history["activeMapVersion"]


def register_flash_routes(app: FastAPI, store, worker, settings) -> None:
    @app.get("/api/flash")
    async def api_flash() -> dict[str, Any]:
        """Which Map version is on the car, every version, and the Revert line."""
        car_state = store.car_state(None) or {}
        active = (await worker.call("mapVersions", state=car_state))["active"]
        return {
            "active": _version_card(active),
            "versions": [_version_card(v) | {"kind": v["kind"]} for v in store.list_map_versions()],
            "revert": (
                None
                if not active or active["n"] == 1
                else {"version": 1, "name": worker.ktuner_basemap, "line": F.revert_line(worker.ktuner_basemap)}
            ),
            "ktunerBasemap": worker.ktuner_basemap,
        }

    @app.get("/api/map/table")
    async def api_map_table(name: str = "", version: int | None = None) -> dict[str, Any]:
        """One table of a Map version as KTuner draws it, for the 2D/3D viewer, with the checked plan's
        changes on it. With no `name`: the table families and the tables the car's map holds."""
        car_state = store.car_state(None) or {}
        active = (await worker.call("mapVersions", state=car_state))["active"]
        number = version or active["n"]
        held = store.map_version(number) or {}
        tables = held.get("tables") or (basemap_tables() if number == 1 else {})
        if not name:
            return {
                "version": number,
                "families": [
                    {"id": f["id"], "title": f["title"], "editable": f["editable"],
                     "tables": [t for t in f["tables"] if t in tables]}
                    for f in TOUR.FAMILIES
                ],
            }
        # The KTuner card spells tables as KTuner shows them ("Boost Target 1 Normal L"); the map data by id.
        name = name if name in tables else name.replace(" ", "_")
        table = TOUR.read_table(tables, name)
        if table.get("error"):
            raise HTTPException(status_code=404, detail=table["error"])
        # The checked plan's cells on this table (only for the active version: that's what it is written on).
        changes: list[dict[str, Any]] = []
        if number == active["n"]:
            _state, plan, _change, _version, _active = await _current(store, worker, settings.now_ms())
            card = (plan or {}).get("ktunerCard") or {}
            axis = table.get("rpm_axis") or []
            for group in card.get("groups") or []:
                if name not in [str(t).replace(" ", "_") for t in group.get("tables") or []]:
                    continue
                for cell in group.get("cells") or []:
                    if cell.get("rpm") in axis:
                        changes.append({
                            "row": axis.index(cell["rpm"]), "col": int(cell["col"]) - 1,
                            "before": cell.get("before"), "after": cell.get("after"), "unit": cell.get("unit"),
                        })
        return {"version": number, **table, "changes": changes}

    @app.post("/api/flash/confirm")
    async def api_flash_confirm(request: Request) -> dict[str, Any]:
        """"I flashed it": the checked change becomes the next Map version."""
        body = await _body(request)
        now = settings.now_ms()
        car_state, plan, change, version, _active = await _current(store, worker, now)
        card = plan.get("ktunerCard") or {}
        if change is None or card.get("changeId") != body.get("changeId"):
            raise HTTPException(
                status_code=409,
                detail="That change is no longer the one I would give you now. Reload and read the new card.",
            )
        changed = plan.get("flashChanged") or "other"
        note = ((plan.get("evidence") or [{}])[0].get("text")) or ""
        flash = {"time": now, "map": plan["saveAs"], "changed": changed, "note": note}
        recorded = await worker.call("recordFlash", state=car_state, flash=flash, now=now)
        number = recorded["version"]["n"]
        store.ensure_map_version(
            number, plan["saveAs"], F.apply_change(version["tables"], change),
            source="flash", kind="flash", flashed_at=now, flash_id=recorded["flash"]["id"],
            changed=changed, note=note, parent_id=version["n"],
        )
        marked = await worker.call("storeMapTables", state=recorded["state"], version=number, now=now)
        store.save_car_state(marked["state"])
        store.add_flash({"id": recorded["flash"]["id"], **flash})
        return {
            "ok": True, "created": True, "version": _version_card({"n": number, "name": plan["saveAs"]}),
            "line": f"Map version {number} is now on your car: {plan['saveAs']}.",
            "next": SHAKEDOWN_LINE,
        }

    @app.post("/api/flash/not-now")
    async def api_flash_not_now(request: Request) -> dict[str, Any]:
        """"Not now": nothing is created, and the car stays on the Map version it is on."""
        await _body(request)
        active = (await worker.call("mapVersions", state=store.car_state(None) or {}))["active"]
        return {
            "ok": True, "created": False,
            "line": f"Nothing was saved. Your car is still on Map version {active['n']}.",
        }

    @app.post("/api/flash/restore")
    async def api_flash_restore(request: Request) -> dict[str, Any]:
        """Undo or Revert, confirmed: an earlier Map version is flashed back and is active again."""
        body = await _body(request)
        kind = str(body.get("kind") or "undo")
        try:
            number = int(body.get("version"))
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=400, detail="Say which Map version you flashed back.") from exc
        if kind not in ("undo", "revert") or (kind == "revert" and number != 1):
            raise HTTPException(status_code=400, detail="Revert flashes Map version 1, the KTuner basemap.")
        car_state = store.car_state(None) or {}
        active = (await worker.call("mapVersions", state=car_state))["active"]
        target = store.map_version(number)
        if target is None or not (target.get("tables") or number == 1):
            raise HTTPException(status_code=400, detail="I do not hold that Map version's cells, so I cannot put it back.")
        if active["n"] == number:
            raise HTTPException(status_code=409, detail=f"Your car is already on Map version {number}.")
        now = settings.now_ms()
        flash = {
            "time": now, "map": target["name"], "changed": target.get("changed") or "other",
            "note": f"{'Revert' if kind == 'revert' else 'Undo'}: back to Map version {number}.",
        }
        recorded = await worker.call("recordRestore", state=car_state, version=number, flash=flash, now=now)
        store.save_car_state(recorded["state"])
        store.add_flash({"id": recorded["flash"]["id"], **flash, "restores": number})
        return {
            "ok": True, "active": _version_card(target),
            "line": f"Map version {number} is on your car again: {target['name']}.",
            "next": SHAKEDOWN_LINE,
        }

    # ------------------------------------------------------------ the History file
    @app.get("/api/history")
    async def api_history() -> JSONResponse:
        """The History file: Car history, Map versions with their cells, Flashes, Installs and answers. No raw CSV."""
        doc = await worker.call("exportHistory", state=store.car_state(None) or {})
        versions = store.list_map_versions(with_tables=True)
        doc["installs"] = store.list_installs()
        doc["questionAnswers"] = store.list_question_answers()
        # Map version 1's cells are the app's own KTuner map data; every later one is the owner's.
        doc["mapTables"] = {str(v["n"]): v["tables"] for v in versions if v["n"] > 1 and v.get("tables")}
        return JSONResponse(doc, headers={"content-disposition": 'attachment; filename="ktuner-history.json"'})

    @app.post("/api/history")
    async def api_history_import(request: Request) -> dict[str, Any]:
        """Merge a History file in: what this car lacks is added, nothing is overwritten."""
        doc = await _body(request, "That is not a History file.")
        out = await worker.call("importHistory", state=store.car_state(None) or {}, doc=doc)
        store.save_car_state(out["state"])
        restores = {r["flashId"]: r["n"] for r in doc.get("mapRestores") or [] if isinstance(r, dict)}
        tables = doc.get("mapTables") if isinstance(doc.get("mapTables"), dict) else {}
        rows = store.merge_history_rows(
            [i for i in doc.get("installs") or [] if isinstance(i, dict)],
            {k: v for k, v in (doc.get("questionAnswers") or {}).items() if isinstance(v, dict)},
            [
                {"id": f["id"], "flashed_at": f["time"], "map": f["map"], "changed": f.get("changed"),
                 "note": f.get("note", ""), "restores": restores.get(f["id"])}
                for f in doc.get("flashes") or [] if isinstance(f, dict) and f.get("id")
            ],
            [
                {"n": v["n"], "name": v["name"], "kind": v.get("kind", "flash"), "flashed_at": v.get("from"),
                 "flash_id": v.get("flashId"), "changed": v.get("changed"), "note": v.get("note", ""),
                 "tables": tables.get(str(v["n"]))}
                for v in doc.get("mapVersions") or [] if isinstance(v, dict) and isinstance(v.get("n"), int)
            ],
        )
        return {"added": {**out["added"], **rows}}


async def _body(request: Request, message: str = "That is not a request I can read.") -> dict[str, Any]:
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001 - any bad body is the same message
        raise HTTPException(status_code=400, detail=message) from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail=message)
    return body


__all__ = ["register_flash_routes"]

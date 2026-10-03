"""The drive window: the Drives an answer is about (ticket 10).

The window is the latest Drive plus every Drive since the last Flash or
Install, capped at 14 days. Older Drives feed only the Baseline and the trend
pictures: they never decide the Next step. Every reply states its window
("based on your 3 Drives since the Flash on 30 Aug").

The window is a read-time filter, never storage: the Car history keeps every
Drive, Flash and Install (ticket 07's `rebuild_history` replays them all), and
the Next step, the owner questions and the Flash plan read the windowed state
while settling, the Baseline and the history read the whole one.
"""

from __future__ import annotations

import copy as _copy
from typing import Any

#: A window spans at most this far back from the latest Drive.
CAP_MS = 14 * 86_400_000


def drive_window(
    rows: list[dict[str, Any]],
    flashes: list[dict[str, Any]] | None,
    installs: list[dict[str, Any]] | None,
    latest_id: str | None,
) -> dict[str, Any]:
    """The window for one reply: `{ ids, since }`, oldest Drive first.

    `rows` are the Car history rows (`{ id, start }`, hidden Drives already
    left out); `flashes` carry `time`, Installs `installed_at`. `since` is the
    change the window starts after (`{ kind: flash | install, time, part }`)
    or None when no Flash or Install bounds it. A Too-short Drive is in no
    window: it read nothing, so its reply says so instead.
    """
    by_id = {r["id"]: r for r in rows or [] if isinstance(r, dict) and r.get("id")}
    latest = by_id.get(latest_id) if latest_id else None
    if latest is None:
        return {"ids": [], "since": None}
    latest_start = latest.get("start")

    boundary: tuple[float, str, str | None] | None = None
    for flash in flashes or []:
        moment = (flash or {}).get("time")
        if not _is_ms(moment) or (latest_start is not None and moment > latest_start):
            continue
        if boundary is None or moment > boundary[0]:
            boundary = (moment, "flash", None)
    for install in installs or []:
        moment = (install or {}).get("installed_at")
        if not _is_ms(moment) or (latest_start is not None and moment > latest_start):
            continue
        if boundary is None or moment >= boundary[0]:
            # An Install and a Flash at the same millisecond: the Install names
            # the part, so it says more about what changed.
            boundary = (moment, "install", (install or {}).get("part"))

    ids: list[str] = []
    for row in sorted(rows or [], key=_row_key):
        rid = row.get("id")
        if rid == latest_id or rid in ids:
            continue
        start = row.get("start")
        if start is None:
            # No date to bound it by: it stays in, like every history before
            # windows. Dated Drives around it are still bounded.
            ids.append(rid)
            continue
        if boundary is not None and not start > boundary[0]:
            continue
        if latest_start is not None and start < latest_start - CAP_MS:
            continue
        if latest_start is not None and start > latest_start:
            continue
        ids.append(rid)
    ids.append(latest_id)
    since = None
    if boundary is not None:
        since = {"kind": boundary[1], "time": boundary[0], "part": boundary[2]}
    return {"ids": ids, "since": since}


def window_for_state(
    state: dict[str, Any] | None, installs: list[dict[str, Any]] | None, latest_id: str | None
) -> dict[str, Any]:
    """The window over an engine state: hidden Drives never count."""
    state = state or {}
    hidden = set(state.get("hidden") or [])
    rows = [
        {"id": drive_id, "start": (summary or {}).get("start")}
        for drive_id, summary in ((state.get("drives") or {}).items())
        if drive_id not in hidden
    ]
    return drive_window(rows, state.get("flashes"), installs, latest_id)


def windowed_state(state: dict[str, Any] | None, ids: list[str] | None) -> dict[str, Any]:
    """The engine state with only the window's Drives in it.

    Flashes, answers, hidden marks, Map versions and the Shakedown drive stay:
    the window bounds which Drives decide, never what happened. Pure.
    """
    out = _copy.deepcopy(state or {})
    keep = set(ids or [])
    out["drives"] = {k: v for k, v in ((state or {}).get("drives") or {}).items() if k in keep}
    return out


def _is_ms(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _row_key(row: dict[str, Any]) -> tuple:
    start = row.get("start")
    return (start is None, start if _is_ms(start) else 0, str(row.get("id") or ""))


__all__ = ["CAP_MS", "drive_window", "window_for_state", "windowed_state"]

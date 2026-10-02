"""SQLite: everything the loop remembers (spec §Storage).

The Car history is the engine's own state document, stored as it comes back from
the worker — one row, one JSON blob — so the engine's tests keep guarding it.
Everything the owner would lose if the tab closed lives here: the Car profile,
the Car history, Map versions, Flashes, Installs, answers, Open steps, chat
threads, and the raw CSV of every upload.
"""

from __future__ import annotations

import json
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

SCHEMA = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS car_state (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  version     INTEGER NOT NULL,
  doc         TEXT    NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS car_profile (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  doc         TEXT    NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
  id           TEXT PRIMARY KEY,
  file_name    TEXT    NOT NULL,
  received_at  INTEGER NOT NULL,
  bytes        INTEGER NOT NULL,
  thread_id    TEXT,
  drive_id     TEXT,
  in_history   INTEGER NOT NULL DEFAULT 0,
  raw_csv      BLOB    NOT NULL
);
CREATE INDEX IF NOT EXISTS uploads_by_thread ON uploads(thread_id, received_at);

CREATE TABLE IF NOT EXISTS drives (
  id          TEXT PRIMARY KEY,
  upload_id   TEXT NOT NULL,
  file_name   TEXT    NOT NULL,
  started_at  INTEGER,
  received_at INTEGER NOT NULL,
  too_short   INTEGER NOT NULL DEFAULT 0,
  verdict     TEXT,
  summary     TEXT
);
CREATE INDEX IF NOT EXISTS drives_by_received ON drives(received_at);

CREATE TABLE IF NOT EXISTS map_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  parent_id   INTEGER,
  flash_id    TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS flashes (
  id          TEXT PRIMARY KEY,
  flashed_at  INTEGER NOT NULL,
  map_name    TEXT    NOT NULL,
  changed     TEXT    NOT NULL,
  note        TEXT    NOT NULL DEFAULT '',
  recorded_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS installs (
  id          TEXT PRIMARY KEY,
  installed_at INTEGER NOT NULL,
  part        TEXT    NOT NULL,
  action      TEXT    NOT NULL,
  note        TEXT    NOT NULL DEFAULT '',
  recorded_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS answers (
  drive_id   TEXT PRIMARY KEY,
  answer     TEXT NOT NULL,
  answered_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS open_steps (
  id          TEXT PRIMARY KEY,
  drive_id    TEXT,
  kind        TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  detail      TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL,
  opened_at   INTEGER NOT NULL,
  settled_at  INTEGER,
  settled_by  TEXT
);
CREATE INDEX IF NOT EXISTS open_steps_by_status ON open_steps(status, opened_at);

CREATE TABLE IF NOT EXISTS threads (
  id          TEXT PRIMARY KEY,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS thread_messages (
  id          TEXT PRIMARY KEY,
  thread_id   TEXT NOT NULL,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  drive_id    TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS thread_messages_by_thread ON thread_messages(thread_id, created_at);
"""


def _now() -> int:
    return int(time.time() * 1000)


def _json(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), default=str)


class Store:
    """A thin, explicit SQLite wrapper. One connection per operation."""

    def __init__(self, path: Path | str) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._conn() as c:
            c.executescript(SCHEMA)

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        c = sqlite3.connect(self.path, timeout=30, isolation_level=None)
        c.row_factory = sqlite3.Row
        try:
            c.execute("PRAGMA foreign_keys=ON")
            yield c
        finally:
            c.close()

    def _exec(self, sql: str, args: tuple = ()) -> None:
        with self._conn() as c:
            c.execute(sql, args)

    def _one(self, sql: str, args: tuple = ()) -> sqlite3.Row | None:
        with self._conn() as c:
            return c.execute(sql, args).fetchone()

    def _all(self, sql: str, args: tuple = ()) -> list[sqlite3.Row]:
        with self._conn() as c:
            return list(c.execute(sql, args).fetchall())

    # -- the Car history: the engine's own state document --------------------
    def car_state(self, fallback: dict[str, Any] | None = None) -> dict[str, Any] | None:
        row = self._one("SELECT doc FROM car_state WHERE id = 1")
        if row is None:
            return fallback
        try:
            return json.loads(row["doc"])
        except json.JSONDecodeError:  # pragma: no cover - a corrupt row is a bug, not a state
            return fallback

    def save_car_state(self, state: dict[str, Any], version: int = 1) -> None:
        self._exec(
            "INSERT INTO car_state (id, version, doc, updated_at) VALUES (1, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET version=excluded.version, doc=excluded.doc, updated_at=excluded.updated_at",
            (version, _json(state), _now()),
        )

    def car_profile(self) -> dict[str, Any] | None:
        row = self._one("SELECT doc FROM car_profile WHERE id = 1")
        return json.loads(row["doc"]) if row else None

    def save_car_profile(self, profile: dict[str, Any]) -> None:
        self._exec(
            "INSERT INTO car_profile (id, doc, updated_at) VALUES (1, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET doc=excluded.doc, updated_at=excluded.updated_at",
            (_json(profile), _now()),
        )

    # -- uploads: the raw CSV of every upload --------------------------------
    def add_upload(
        self,
        upload_id: str,
        file_name: str,
        raw_csv: bytes,
        thread_id: str | None = None,
        received_at: int | None = None,
    ) -> dict[str, Any]:
        at = received_at if received_at is not None else _now()
        self._exec(
            "INSERT INTO uploads (id, file_name, received_at, bytes, thread_id, raw_csv) VALUES (?, ?, ?, ?, ?, ?)",
            (upload_id, file_name, at, len(raw_csv), thread_id, raw_csv),
        )
        return {"upload_id": upload_id, "file_name": file_name, "bytes": len(raw_csv), "received_at": at}

    def get_upload(self, upload_id: str) -> dict[str, Any] | None:
        row = self._one(
            "SELECT id, file_name, received_at, bytes, thread_id, drive_id, in_history, raw_csv FROM uploads WHERE id = ?",
            (upload_id,),
        )
        if row is None:
            return None
        return {
            "upload_id": row["id"],
            "file_name": row["file_name"],
            "received_at": row["received_at"],
            "bytes": row["bytes"],
            "thread_id": row["thread_id"],
            "drive_id": row["drive_id"],
            "in_history": bool(row["in_history"]),
            "csv": row["raw_csv"],
        }

    def bind_upload_drive(self, upload_id: str, drive_id: str, in_history: bool) -> None:
        self._exec(
            "UPDATE uploads SET drive_id = ?, in_history = ? WHERE id = ?",
            (drive_id, 1 if in_history else 0, upload_id),
        )

    # -- drives: the Car history, indexed -----------------------------------
    def add_drive(
        self,
        drive_id: str,
        upload_id: str,
        file_name: str,
        verdict: str | None,
        summary: dict[str, Any] | None,
        started_at: int | None,
        too_short: bool = False,
    ) -> None:
        self._exec(
            "INSERT INTO drives (id, upload_id, file_name, started_at, received_at, too_short, verdict, summary) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET verdict=excluded.verdict, summary=excluded.summary, "
            "too_short=excluded.too_short, received_at=excluded.received_at, file_name=excluded.file_name",
            (drive_id, upload_id, file_name, started_at, _now(), 1 if too_short else 0, verdict, _json(summary or {})),
        )

    def list_drives(self, limit: int = 200) -> list[dict[str, Any]]:
        return [
            {
                "id": r["id"],
                "upload_id": r["upload_id"],
                "file_name": r["file_name"],
                "started_at": r["started_at"],
                "received_at": r["received_at"],
                "too_short": bool(r["too_short"]),
                "verdict": r["verdict"],
                "summary": json.loads(r["summary"] or "{}"),
            }
            for r in self._all("SELECT * FROM drives ORDER BY received_at DESC LIMIT ?", (limit,))
        ]

    def drive(self, drive_id: str) -> dict[str, Any] | None:
        row = self._one("SELECT * FROM drives WHERE id = ?", (drive_id,))
        if row is None:
            return None
        return {
            "id": row["id"],
            "upload_id": row["upload_id"],
            "file_name": row["file_name"],
            "started_at": row["started_at"],
            "received_at": row["received_at"],
            "too_short": bool(row["too_short"]),
            "verdict": row["verdict"],
            "summary": json.loads(row["summary"] or "{}"),
        }

    # -- Map versions -------------------------------------------------------
    def add_map_version(self, name: str, parent_id: int | None = None, flash_id: str | None = None) -> int:
        with self._conn() as c:
            cur = c.execute(
                "INSERT INTO map_versions (name, parent_id, flash_id, created_at) VALUES (?, ?, ?, ?)",
                (name, parent_id, flash_id, _now()),
            )
            return int(cur.lastrowid or 0)

    def list_map_versions(self) -> list[dict[str, Any]]:
        return [
            {"id": r["id"], "name": r["name"], "parent_id": r["parent_id"], "flash_id": r["flash_id"], "created_at": r["created_at"]}
            for r in self._all("SELECT * FROM map_versions ORDER BY id")
        ]

    def latest_map_version(self) -> dict[str, Any] | None:
        rows = self.list_map_versions()
        return rows[-1] if rows else None

    # -- Flashes and Installs ----------------------------------------------
    def add_flash(self, flash: dict[str, Any]) -> None:
        self._exec(
            "INSERT INTO flashes (id, flashed_at, map_name, changed, note, recorded_at) VALUES (?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET flashed_at=excluded.flashed_at, map_name=excluded.map_name, "
            "changed=excluded.changed, note=excluded.note, recorded_at=excluded.recorded_at",
            (flash["id"], flash["time"], flash["map"], flash.get("changed", "other"), flash.get("note", ""), _now()),
        )

    def list_flashes(self) -> list[dict[str, Any]]:
        return [
            {"id": r["id"], "flashed_at": r["flashed_at"], "map": r["map_name"], "changed": r["changed"], "note": r["note"]}
            for r in self._all("SELECT * FROM flashes ORDER BY flashed_at")
        ]

    def add_install(self, part: str, action: str = "fitted", installed_at: int | None = None, note: str = "") -> dict[str, Any]:
        install_id = f"{part}-{installed_at or _now()}"
        self._exec(
            "INSERT OR REPLACE INTO installs (id, installed_at, part, action, note, recorded_at) VALUES (?, ?, ?, ?, ?, ?)",
            (install_id, installed_at or _now(), part, action, note, _now()),
        )
        return {"id": install_id, "part": part, "action": action, "installed_at": installed_at or _now(), "note": note}

    def list_installs(self) -> list[dict[str, Any]]:
        return [
            {"id": r["id"], "installed_at": r["installed_at"], "part": r["part"], "action": r["action"], "note": r["note"]}
            for r in self._all("SELECT * FROM installs ORDER BY installed_at")
        ]

    # -- owner answers -------------------------------------------------------
    def add_answer(self, drive_id: str, answer: str) -> None:
        self._exec(
            "INSERT INTO answers (drive_id, answer, answered_at) VALUES (?, ?, ?) "
            "ON CONFLICT(drive_id) DO UPDATE SET answer=excluded.answer, answered_at=excluded.answered_at",
            (drive_id, answer, _now()),
        )

    def list_answers(self) -> dict[str, str]:
        return {r["drive_id"]: r["answer"] for r in self._all("SELECT * FROM answers")}

    # -- Open steps ----------------------------------------------------------
    def add_open_step(
        self, step_id: str, drive_id: str | None, kind: str, title: str, detail: str = "", opened_at: int | None = None
    ) -> None:
        self._exec(
            "INSERT INTO open_steps (id, drive_id, kind, title, detail, status, opened_at) VALUES (?, ?, ?, ?, ?, 'open', ?) "
            "ON CONFLICT(id) DO UPDATE SET drive_id=excluded.drive_id, kind=excluded.kind, title=excluded.title, "
            "detail=excluded.detail",
            (step_id, drive_id, kind, title, detail, opened_at if opened_at is not None else _now()),
        )

    def settle_open_step(self, step_id: str, status: str, drive_id: str | None = None) -> None:
        self._exec(
            "UPDATE open_steps SET status = ?, settled_at = ?, settled_by = ? WHERE id = ?",
            (status, _now(), drive_id, step_id),
        )

    def list_open_steps(self, only_open: bool = False) -> list[dict[str, Any]]:
        sql = "SELECT * FROM open_steps"
        if only_open:
            sql += " WHERE status = 'open'"
        sql += " ORDER BY opened_at"
        return [
            {
                "id": r["id"],
                "drive_id": r["drive_id"],
                "kind": r["kind"],
                "title": r["title"],
                "detail": r["detail"],
                "status": r["status"],
                "opened_at": r["opened_at"],
                "settled_at": r["settled_at"],
                "settled_by": r["settled_by"],
            }
            for r in self._all(sql)
        ]

    # -- chat threads --------------------------------------------------------
    def touch_thread(self, thread_id: str) -> None:
        at = _now()
        self._exec(
            "INSERT INTO threads (id, created_at, updated_at) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at",
            (thread_id, at, at),
        )

    def add_message(
        self, message_id: str, thread_id: str, role: str, content: str, drive_id: str | None = None
    ) -> None:
        self.touch_thread(thread_id)
        self._exec(
            "INSERT OR REPLACE INTO thread_messages (id, thread_id, role, content, drive_id, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (message_id, thread_id, role, content, drive_id, _now()),
        )

    def list_messages(self, thread_id: str, limit: int = 200) -> list[dict[str, Any]]:
        return [
            {"id": r["id"], "role": r["role"], "content": r["content"], "drive_id": r["drive_id"], "created_at": r["created_at"]}
            for r in self._all(
                "SELECT * FROM thread_messages WHERE thread_id = ? ORDER BY created_at, id LIMIT ?", (thread_id, limit)
            )
        ]

    def list_threads(self) -> list[dict[str, Any]]:
        return [
            {"id": r["id"], "created_at": r["created_at"], "updated_at": r["updated_at"], "messages": len(self.list_messages(r["id"]))}
            for r in self._all("SELECT * FROM threads ORDER BY updated_at DESC")
        ]


__all__ = ["Store", "SCHEMA"]
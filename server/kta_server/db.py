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
  created_at  INTEGER NOT NULL,
  -- Added with Map version 1 (ticket 03). `id` IS the Map version number: the
  -- owner says it out loud, so it is a small integer and never a UUID.
  kind        TEXT    NOT NULL DEFAULT 'ktuner-basemap',
  source      TEXT    NOT NULL DEFAULT 'ktuner-basemap',
  changed     TEXT,
  note        TEXT    NOT NULL DEFAULT '',
  flashed_at  INTEGER,
  tables      TEXT,
  updated_at  INTEGER
);
CREATE INDEX IF NOT EXISTS map_versions_by_created ON map_versions(created_at);

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

-- Owner question answers (ticket 07): one row per question, changeable.
-- `id` is the question (`kind:driveId`, e.g. `what-changed:20260823-203853`);
-- a changed answer overwrites the row and the Car history re-derives.
CREATE TABLE IF NOT EXISTS question_answers (
  id          TEXT PRIMARY KEY,
  drive_id    TEXT NOT NULL,
  kind        TEXT NOT NULL,
  choice      TEXT NOT NULL,
  answered_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS question_answers_by_drive ON question_answers(drive_id);

-- Every owner question the engine ever asked (ticket 07): asked once per
-- Drive, answered separately. Unanswered = asked minus answered ("Waiting for
-- you"). Asked rows never change; answers overwrite and re-derive.
CREATE TABLE IF NOT EXISTS asked_questions (
  id          TEXT PRIMARY KEY,
  drive_id    TEXT NOT NULL,
  kind        TEXT NOT NULL,
  title       TEXT NOT NULL,
  asked_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS asked_questions_by_drive ON asked_questions(drive_id);

CREATE TABLE IF NOT EXISTS open_steps (
  id          TEXT PRIMARY KEY,
  drive_id    TEXT,
  kind        TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  detail      TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL,
  opened_at   INTEGER NOT NULL,
  settled_at  INTEGER,
  settled_by  TEXT,
  -- The Drive that asked this step most recently, which is how the app knows a
  -- repeated step is a repeat. `drive_id` is the Drive that first asked it:
  -- Drives to proof counts from there.
  last_asked_on TEXT
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


# Columns added after the first schema shipped. SQLite cannot add a column with
# CREATE TABLE IF NOT EXISTS, so an owner's own database from an earlier build is
# brought forward here, once, at startup.
_MAP_VERSION_COLUMNS = {
    "kind": "TEXT NOT NULL DEFAULT 'ktuner-basemap'",
    "source": "TEXT NOT NULL DEFAULT 'ktuner-basemap'",
    "changed": "TEXT",
    "note": "TEXT NOT NULL DEFAULT ''",
    "flashed_at": "INTEGER",
    "tables": "TEXT",
    "updated_at": "INTEGER",
}

# Added with the Open steps settling (ticket 04).
_OPEN_STEP_COLUMNS = {"last_asked_on": "TEXT"}


class Store:
    """A thin, explicit SQLite wrapper. One connection per operation."""

    def __init__(self, path: Path | str) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._conn() as c:
            c.executescript(SCHEMA)
            self._migrate(c)

    @staticmethod
    def _migrate(c: sqlite3.Connection) -> None:
        """Bring a database written by an earlier build up to this schema."""
        have = {row["name"] for row in c.execute("PRAGMA table_info(map_versions)")}
        if have:
            for column, decl in _MAP_VERSION_COLUMNS.items():
                if column not in have:
                    c.execute(f"ALTER TABLE map_versions ADD COLUMN {column} {decl}")
        steps = {row["name"] for row in c.execute("PRAGMA table_info(open_steps)")}
        for column, decl in _OPEN_STEP_COLUMNS.items():
            if column not in steps:
                c.execute(f"ALTER TABLE open_steps ADD COLUMN {column} {decl}")

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
    # `id` IS the Map version number: Map version 1, 2, 3 — the small integer the
    # owner says out loud. `tables` holds that version's full tables as JSON, so
    # a change can be checked against the Map it was written on (ADR 0003) and
    # the Car history document stays small.

    def ensure_map_version(
        self,
        number: int,
        name: str,
        tables: dict[str, Any] | None = None,
        *,
        source: str = "ktuner-basemap",
        kind: str = "ktuner-basemap",
        flashed_at: int | None = None,
        flash_id: str | None = None,
        changed: str | None = None,
        note: str = "",
        parent_id: int | None = None,
    ) -> dict[str, Any]:
        """Create a Map version, or return the one already there.

        Idempotent on purpose: the server seeds Map version 1 at startup and again
        at first use, so a fresh car always has one and a returning one never
        grows a second copy of it. Tables are only rewritten when they are given
        and missing, so a version's tables are never silently replaced.
        """
        row = self._one("SELECT * FROM map_versions WHERE id = ?", (number,))
        if row is not None:
            if tables is not None and not row["tables"]:
                self._exec(
                    "UPDATE map_versions SET tables = ?, updated_at = ? WHERE id = ?",
                    (_json(tables), _now(), number),
                )
            return self.map_version(number)
        self._exec(
            "INSERT INTO map_versions (id, name, parent_id, flash_id, created_at, kind, source, "
            "changed, note, flashed_at, tables, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                number, name, parent_id, flash_id, _now(), kind, source, changed, note,
                flashed_at, _json(tables) if tables is not None else None, _now(),
            ),
        )
        return self.map_version(number)

    @staticmethod
    def _map_version_row(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "n": row["id"],
            "label": f"Map version {row['id']}",
            "name": row["name"],
            "kind": row["kind"],
            "source": row["source"],
            "parent_id": row["parent_id"],
            "flash_id": row["flash_id"],
            "changed": row["changed"],
            "note": row["note"],
            "flashed_at": row["flashed_at"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "has_tables": bool(row["tables"]),
        }

    @staticmethod
    def _map_version(row: dict[str, Any]) -> dict[str, Any]:
        """One Map version with its tables, as the two map checks read it."""
        out = dict(row)
        raw = out.pop("tables_json", None)
        out["tables"] = json.loads(raw) if raw else None
        return out

    def map_version(self, number: int) -> dict[str, Any] | None:
        """One Map version by its number, with its full tables."""
        row = self._one("SELECT * FROM map_versions WHERE id = ?", (number,))
        if row is None:
            return None
        version = self._map_version_row(row)
        version["tables_json"] = row["tables"]
        return self._map_version(version)

    def add_map_version(self, name: str, parent_id: int | None = None, flash_id: str | None = None) -> int:
        """Kept for callers that just want the next number (Map versions before
        they carried tables); the table row id is the Map version number."""
        with self._conn() as c:
            cur = c.execute(
                "INSERT INTO map_versions (name, parent_id, flash_id, created_at) VALUES (?, ?, ?, ?)",
                (name, parent_id, flash_id, _now()),
            )
            return int(cur.lastrowid or 0)

    def list_map_versions(self, with_tables: bool = False) -> list[dict[str, Any]]:
        rows = self._all("SELECT * FROM map_versions ORDER BY id")
        out = []
        for row in rows:
            version = self._map_version_row(row)
            if with_tables:
                version["tables"] = json.loads(row["tables"]) if row["tables"] else None
            out.append(version)
        return out

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

    def delete_flash(self, flash_id: str) -> None:
        """Remove one Flash (a changed answer withdraws the Flash it recorded)."""
        self._exec("DELETE FROM flashes WHERE id = ?", (flash_id,))

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

    # -- owner question answers (ticket 07) ----------------------------------
    # One row per question (`what-changed:<driveId>` …), changeable: answering
    # again overwrites the row and the Car history re-derives from events.
    def save_question_answer(self, question_id: str, drive_id: str, kind: str, choice: str) -> None:
        self._exec(
            "INSERT INTO question_answers (id, drive_id, kind, choice, answered_at) VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET drive_id=excluded.drive_id, kind=excluded.kind, "
            "choice=excluded.choice, answered_at=excluded.answered_at",
            (question_id, drive_id, kind, choice, _now()),
        )

    def get_question_answer(self, question_id: str) -> dict[str, Any] | None:
        row = self._one("SELECT * FROM question_answers WHERE id = ?", (question_id,))
        if row is None:
            return None
        return {
            "id": row["id"], "drive_id": row["drive_id"], "kind": row["kind"],
            "choice": row["choice"], "answered_at": row["answered_at"],
        }

    def list_question_answers(self) -> dict[str, dict[str, Any]]:
        return {
            r["id"]: {
                "id": r["id"], "drive_id": r["drive_id"], "kind": r["kind"],
                "choice": r["choice"], "answered_at": r["answered_at"],
            }
            for r in self._all("SELECT * FROM question_answers ORDER BY answered_at, id")
        }

    def delete_question_answers_for_drive(self, drive_id: str) -> None:
        self._exec("DELETE FROM question_answers WHERE drive_id = ?", (drive_id,))

    # -- asked questions (ticket 07): what the engine asked, once per Drive --
    def save_asked_questions(self, questions: list[dict[str, Any]]) -> None:
        """Remember what was asked, so "Waiting for you" survives a restart."""
        with self._conn() as c:
            for q in questions or []:
                if not isinstance(q, dict) or not q.get("id"):
                    continue
                c.execute(
                    "INSERT INTO asked_questions (id, drive_id, kind, title, asked_at) VALUES (?, ?, ?, ?, ?) "
                    "ON CONFLICT(id) DO NOTHING",
                    (q["id"], q.get("askedOn"), q.get("kind"), q.get("title") or "", _now()),
                )

    def list_asked_questions(self) -> list[dict[str, Any]]:
        return [
            {"id": r["id"], "drive_id": r["drive_id"], "kind": r["kind"], "title": r["title"], "askedOn": r["drive_id"]}
            for r in self._all("SELECT * FROM asked_questions ORDER BY asked_at, id")
        ]

    def list_unanswered_questions(self) -> list[dict[str, Any]]:
        """Asked minus answered, oldest first — "Waiting for you"."""
        saved = {r["id"] for r in self._all("SELECT id FROM question_answers")}
        return [q for q in self.list_asked_questions() if q["id"] not in saved]

    # -- Open steps ----------------------------------------------------------
    # One row per kind of step, in the shape the engine's `carSettle` /
    # `carNextStep` take and give back (ticket 04). The id is the step's own key:
    # the app never asks the same step twice at once, so a repeat moves the row's
    # `last_asked_on` instead of growing a second one. `status` is the engine's
    # own word — open (Not yet) / wait (Can't tell yet) / fail (Still off) /
    # done — and `only_open` means "not proven yet", which is what the chat shows:
    # a step that came back "Still off" is still one the owner has to act on.
    @staticmethod
    def open_step_out(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "key": row["kind"],
            "title": row["title"],
            "status": row["status"],
            "why": row["detail"],
            "askedOn": row["drive_id"],
            "askedAt": row["opened_at"],
            "lastAskedOn": row["last_asked_on"],
            "settledBy": row["settled_by"],
            "settledAt": row["settled_at"],
        }

    @staticmethod
    def open_step_id(step: dict[str, Any]) -> str:
        return str(step["key"])

    def save_open_steps(self, steps: list[dict[str, Any]]) -> None:
        """Store the Open steps as the engine left them, one row each."""
        with self._conn() as c:
            for step in steps:
                c.execute(
                    "INSERT INTO open_steps (id, drive_id, kind, title, detail, status, opened_at,"
                    " settled_at, settled_by, last_asked_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                    "ON CONFLICT(id) DO UPDATE SET drive_id=excluded.drive_id, kind=excluded.kind,"
                    " title=excluded.title, detail=excluded.detail, status=excluded.status,"
                    " opened_at=excluded.opened_at, settled_at=excluded.settled_at,"
                    " settled_by=excluded.settled_by, last_asked_on=excluded.last_asked_on",
                    (
                        self.open_step_id(step), step.get("askedOn"), step["key"], step.get("title", ""),
                        step.get("why", ""), step.get("status", "open"),
                        step.get("askedAt") if step.get("askedAt") is not None else _now(),
                        step.get("settledAt"), step.get("settledBy"), step.get("lastAskedOn"),
                    ),
                )

    def list_open_steps(self, only_open: bool = False) -> list[dict[str, Any]]:
        sql = "SELECT * FROM open_steps"
        if only_open:
            sql += " WHERE status <> 'done'"
        sql += " ORDER BY opened_at, id"
        return [self.open_step_out(r) for r in self._all(sql)]

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
"""Seam 1: the tuning loop at the server's front door (ADR 0004 §"Where each seam's tests live").

Tests here post an upload and assert the **reply events** — never graph
internals, prompt text or private helpers. No key and no network: the LLM is
never configured and never called; the reply is the built-in one, templated
from the engine's facts through the Node worker.
"""

from __future__ import annotations

import asyncio
import base64
import copy
import json
import re
import shutil
import sqlite3
import sys
import uuid
import zlib
from pathlib import Path
from typing import Any, Coroutine

import pytest

SERVER_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = SERVER_ROOT.parent
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

import httpx  # noqa: E402

from kta_server.app import create_app  # noqa: E402
from kta_server.config import Settings  # noqa: E402
from kta_server.db import Store  # noqa: E402
from kta_server.worker import Worker  # noqa: E402

# The clock is fixed so the same Drive always gives the same reply.
NOW = 1756723200000

# The owner's nine real Drives, in the order she drove them (as test/car.test.js
# and tools/car-history-check.js hold them).
OWNER_DRIVES = [
    ("aug22-0903", "TunerView_20260822_090322.csv"),
    ("aug22-0950", "TunerView_20260822_095021.csv"),
    ("aug23-1959", "TunerView_20260823_195901.csv"),
    ("aug23-2038", "TunerView_20260823_203853.csv"),
    ("aug30-1509", "TunerView_20260830_150925.csv"),
    ("aug30-1529", "TunerView_20260830_152931.csv"),
    ("aug30-1601", "TunerView_20260830_160151.csv"),
    ("sep01-0813", "TunerView_20260901_081358.csv"),
    ("sep05-0756", "TunerView_20260905_075634.csv"),
]
OWNER_FILE_NAMES = dict(OWNER_DRIVES)

# The verdicts `node tools/car-history-check.js` prints for those nine files.
REFERENCE_VERDICTS = {
    "aug22-0903": "watch",
    "aug22-0950": "watch",
    "aug23-1959": "good",
    "aug23-2038": "stop",
    "aug30-1509": "too-short",
    "aug30-1529": "watch",
    "aug30-1601": "watch",
    "sep01-0813": "good",
    "sep05-0756": "good",
}

_FIXTURES: dict[str, str] = {}


def owner_csv(example_id: str) -> str:
    """The owner's own TunerView CSV, decompressed from the engine's fixture.

    `data/example-<id>.js` holds the gzipped CSV exactly the way the engine's
    tests read it: `zlib.gunzipSync(Buffer.from(globalThis.KTA_EXAMPLES[id].gz,
    'base64'))`.
    """
    if example_id in _FIXTURES:
        return _FIXTURES[example_id]
    source = (REPO_ROOT / "data" / f"example-{example_id}.js").read_text(encoding="utf-8")
    match = re.search(r'gz:\s*"([A-Za-z0-9+/=]+)"', source)
    assert match, f"no gzipped CSV in data/example-{example_id}.js"
    text = zlib.decompress(base64.b64decode(match.group(1)), 16 + zlib.MAX_WBITS).decode("utf-8")
    _FIXTURES[example_id] = text
    return text


# ---------------------------------------------------------------------------
# Reading the AG-UI event stream the way the chat does
# ---------------------------------------------------------------------------
def _parse_sse(body: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for block in body.replace("\r\n", "\n").split("\n\n"):
        for line in block.split("\n"):
            if line.startswith("data:"):
                payload = line[5:].strip()
                if payload and payload != "[DONE]":
                    events.append(json.loads(payload))
                break
    return events


def _args_of(events: list[dict[str, Any]], call_id: str) -> str:
    return "".join(
        e["delta"] for e in events if e["type"] == "TOOL_CALL_ARGS" and e["toolCallId"] == call_id
    )


class Reply:
    """What the owner would see, read off the AG-UI event stream."""

    def __init__(self, events: list[dict[str, Any]]) -> None:
        self.events = events

    # -- the run as a whole ------------------------------------------------
    def types(self) -> list[str]:
        return [e["type"] for e in self.events]

    def errors(self) -> list[str]:
        return [e.get("message", "") for e in self.events if e["type"] == "RUN_ERROR"]

    # -- the prose ---------------------------------------------------------
    def sentences(self) -> list[str]:
        return [e["delta"] for e in self.events if e["type"] == "TEXT_MESSAGE_CONTENT"]

    @property
    def say(self) -> str:
        """The first sentence: the one that answers "am I hurting it?"."""
        parts = self.sentences()
        return parts[0] if parts else ""

    @property
    def window(self) -> str:
        parts = self.sentences()
        return parts[1] if len(parts) > 1 else ""

    # -- the harness -------------------------------------------------------
    def step_names(self) -> list[str]:
        return [e["toolCallName"] for e in self.events if e["type"] == "TOOL_CALL_START"]

    def harness_line(self) -> str:
        """`Checked 6 things · 4.2 s`, as collapsed under the reply."""
        summaries = [e["value"] for e in self.events if e["type"] == "CUSTOM" and e.get("name") == "harness"]
        assert summaries, "no harness summary event in the reply"
        return summaries[-1]["line"]

    def harness_steps(self) -> list[dict[str, Any]]:
        """Each step with its tool inputs and outputs, as the row expands to."""
        starts = {e["toolCallId"]: e for e in self.events if e["type"] == "TOOL_CALL_START"}
        steps = []
        for event in self.events:
            if event["type"] != "TOOL_CALL_RESULT":
                continue
            steps.append(
                {
                    "name": starts[event["toolCallId"]]["toolCallName"],
                    "inputs": json.loads(_args_of(self.events, event["toolCallId"])),
                    "output": json.loads(event["content"]),
                }
            )
        return steps

    def thinking(self) -> list[dict[str, Any]]:
        """The model's own thinking blocks, each labelled unchecked."""
        return [e["value"] for e in self.events if e["type"] == "CUSTOM" and e.get("name") == "thinking"]

    # -- the typed card ----------------------------------------------------
    def snapshot(self) -> dict[str, Any]:
        for event in reversed(self.events):
            if event["type"] == "STATE_SNAPSHOT":
                return event["snapshot"]
        raise AssertionError("no STATE_SNAPSHOT in the reply")

    @property
    def card(self) -> dict[str, Any]:
        return self.snapshot()["reply"]


# ---------------------------------------------------------------------------
# The loop under test: one app over a temp SQLite file and the real worker
# ---------------------------------------------------------------------------
class Loop:
    """Posts uploads to one app and reads the replies back.

    `llm` configures a key the way `.env` would (`{"base_url": ..., "api_key":
    ..., "model": ...}`) and `llm_caller` is the scripted fake model answering
    instead of the network. Both default to off: the reply is the built-in one.
    """

    def __init__(self, tmp_path: Path, llm: dict[str, str] | None = None, llm_caller=None) -> None:
        settings_kwargs: dict[str, Any] = {"db_path": tmp_path / "ktuner.db", "now": NOW}
        if llm:
            settings_kwargs.update(
                llm_base_url=llm.get("base_url"), llm_api_key=llm.get("api_key"), llm_model=llm.get("model")
            )
        self.settings = Settings(**settings_kwargs)
        self.store = Store(self.settings.db_path)
        self.worker = Worker(self.settings.worker_script, self.settings.node_exe)
        self.llm_caller = llm_caller
        self.app = create_app(self.settings, self.store, self.worker, llm_caller=llm_caller)
        self.thread_id = uuid.uuid4().hex
        self._loop = asyncio.new_event_loop()
        self._client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=self.app), base_url="http://kta", timeout=180
        )

    # -- one event loop for the whole test, so the worker subprocess lives ---
    def run(self, coro: Coroutine[Any, Any, Any]) -> Any:
        return self._loop.run_until_complete(coro)

    def start(self) -> "Loop":
        self.run(self.worker.start())
        return self

    def close(self) -> None:
        try:
            self.run(self._client.aclose())
            self.run(self.worker.aclose())
        finally:
            self._loop.close()

    # -- what the owner does ------------------------------------------------
    async def upload_async(self, csv_text: str, file_name: str) -> str:
        response = await self._client.post(
            "/upload",
            files={"file": (file_name, csv_text.encode("utf-8"), "text/csv")},
            data={"threadId": self.thread_id},
        )
        assert response.status_code == 200, response.text
        return response.json()["uploadId"]

    def upload(self, csv_text: str, file_name: str) -> str:
        return self.run(self.upload_async(csv_text, file_name))

    async def send_async(self, upload_id: str) -> Reply:
        """The one AG-UI turn the chat runs after an upload."""
        run_id = uuid.uuid4().hex
        body = {
            "threadId": self.thread_id,
            "runId": run_id,
            "state": {"upload_id": upload_id, "thread_id": self.thread_id},
            "messages": [{"id": f"h-{run_id}", "role": "user", "content": f"Uploaded {upload_id}"}],
            "tools": [],
            "context": [],
            "forwardedProps": {},
        }
        async with self._client.stream(
            "POST", "/agent", json=body, headers={"accept": "text/event-stream"}
        ) as response:
            assert response.status_code == 200, await response.aread()
            text = "".join([chunk async for chunk in response.aiter_text()])
        return Reply(_parse_sse(text))

    def send(self, upload_id: str) -> Reply:
        return self.run(self.send_async(upload_id))

    def upload_and_reply(self, example_id: str, file_name: str | None = None) -> Reply:
        name = file_name or OWNER_FILE_NAMES[example_id]
        return self.send(self.upload(owner_csv(example_id), name))

    async def reply_to_all_owner_drives(self) -> list[tuple[str, Reply]]:
        """The owner's nine real Drives, in order, as nine uploads."""
        out: list[tuple[str, Reply]] = []
        for example_id, file_name in OWNER_DRIVES:
            upload_id = await self.upload_async(owner_csv(example_id), file_name)
            out.append((example_id, await self.send_async(upload_id)))
        return out

    # -- a restart ----------------------------------------------------------
    def restart(self) -> "Loop":
        """A brand new Store, Worker and app over the same SQLite file."""
        fresh = Loop.__new__(Loop)
        fresh.settings = self.settings
        fresh.thread_id = self.thread_id
        fresh.store = Store(self.settings.db_path)
        fresh.worker = Worker(self.settings.worker_script, self.settings.node_exe)
        fresh.llm_caller = self.llm_caller
        fresh.app = create_app(fresh.settings, fresh.store, fresh.worker, llm_caller=fresh.llm_caller)
        fresh._loop = asyncio.new_event_loop()
        fresh._client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=fresh.app), base_url="http://kta", timeout=180
        )
        return fresh.start()

    def get(self, path: str) -> Any:
        """One GET against the server, as the chat's state panel would make it."""
        return self.run(self._client.get(path))


@pytest.fixture
def loop(tmp_path: Path):
    running = Loop(tmp_path).start()
    try:
        yield running
    finally:
        running.close()


# ---------------------------------------------------------------------------
# Replay once, assert many: the owner's nine Drives replayed a single time per
# test process, then copied per test. (Exante-style fixture discipline: the
# suite's top cost was ~30 full nine-drive replays at ~3 s each.)
#
# Pattern for replay tests: take the `replayed` fixture (a fresh Loop over its
# own copy of the replayed DB, with its own Node worker) and read the replies
# with `template_replies(replayed)`. Each test still gets an independent,
# order-free database — uploads and answers after the replay touch only its
# own copy — but the nine uploads happen once, not once per test. Tests that
# need a different history (a fresh car, a single drive, an interleaved
# sequence) keep taking the `loop` fixture above, which replays nothing.
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def _replay_template(tmp_path_factory: pytest.TempPathFactory) -> dict[str, Any]:
    """The nine owner Drives replayed exactly once; the DB file is the template.

    The Loop (worker, event loop, HTTP client) is closed before returning, so
    only plain data crosses the fixture boundary: the template DB files, the
    thread the replay ran under, and each reply's events. Every test then gets
    its own copy (`replayed` below) plus deep copies of the replies.
    """
    home = tmp_path_factory.mktemp("replay-template")
    running = Loop(home).start()
    try:
        replies = dict(running.run(running.reply_to_all_owner_drives()))
        events = {example_id: copy.deepcopy(reply.events) for example_id, reply in replies.items()}
        thread_id = running.thread_id
    finally:
        running.close()
    # WAL mode keeps the last pages in -wal until checkpoint; flush them into
    # the DB file so copying the one file is a complete database.
    with sqlite3.connect(home / "ktuner.db", timeout=30) as c:
        c.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    return {"db": home / "ktuner.db", "thread_id": thread_id, "events": events}


@pytest.fixture
def replayed(tmp_path: Path, _replay_template: dict[str, Any]):
    """A fresh Loop over a private copy of the nine-drive replay.

    Independent per test (own SQLite file, own worker, own event loop), so
    tests stay order-free and xdist-safe; the nine uploads themselves are the
    one shared cost, paid once per test process by `_replay_template`.
    """
    for suffix in ("", "-wal", "-shm", "-journal"):
        source = Path(str(_replay_template["db"]) + suffix)
        if source.exists():
            shutil.copy(source, Path(str(tmp_path / "ktuner.db") + suffix))
    running = Loop(tmp_path).start()
    # The replay ran under this thread; keep it so a test that uploads or
    # answers after the replay continues the same conversation.
    running.thread_id = _replay_template["thread_id"]
    running._template_events = _replay_template["events"]
    try:
        yield running
    finally:
        running.close()


def template_replies(loop: Loop) -> dict[str, Reply]:
    """The nine replayed replies for a `replayed` loop, as fresh Reply objects.

    Deep copies: asserting on one test's replies can never leak into another's.
    (The DB rows behind them are already per-test copies; this covers the
    in-memory half.)
    """
    events = getattr(loop, "_template_events", None)
    assert events is not None, "template_replies needs the `replayed` fixture, not `loop`"
    return {example_id: Reply(copy.deepcopy(evts)) for example_id, evts in events.items()}
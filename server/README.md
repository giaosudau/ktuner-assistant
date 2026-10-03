# The tuning loop's server (ADR 0002, ADR 0004)

Python with LangGraph runs the loop; the tuning math stays in the JavaScript
engine, reached over one long-lived Node worker. Nothing here parses a log,
judges a Drive or invents a number.

```
server/
  kta_worker/worker.js   the only process that touches engine/ — JSON in, summaries out
  kta_server/
    config.py            .env, read once; every value has a working default
    worker.py            the Python side of the worker protocol (newline-delimited JSON)
    db.py                SQLite: Car profile, Car history state, Map versions (with their
                         full tables), Flashes, Installs, answers, Open steps, threads,
                         the raw CSV of every upload
    mapdata.py           the KTuner basemap's tables: Map version 1's copy of the Map
    harness.py           one engine call -> one AG-UI TOOL_CALL_* quartet
    copy.py              every word the owner reads (the built-in reply)
    graph.py             ingest -> decide (settle, then one Next step) -> reply
    app.py               FastAPI: POST /upload, POST /agent (AG-UI), GET /api/state, GET /healthz
  tests/seam1/           the seam-1 harness: post an upload, assert the reply events
```

## Run it

```bash
cd server && uv sync
cd server && uv run uvicorn kta_server.app:app --reload --port 8000
```

With no key in the repo-root `.env` every reply is the built-in one. `GET /healthz`
answers `ok` once the Node worker is up.

`pyproject.toml` + `uv.lock` are the one source of truth for Python deps
(`requirements.txt` was removed deliberately; `uv` is the primary runner).

## Test it

```bash
cd server && uv run pytest tests -q     # no key, no network
uv run python tests/seam1/replay.py     # read all nine real Drives end to end
```

The suite runs parallel by default (`-n auto` in `pyproject.toml`: every test
gets a fresh SQLite file and its own Node worker, so distribution is safe;
override per run with `-n0`). Every run prints its slowest 10 phases
(`--durations=10`) and the total wall time against a recorded 90 s budget
(`tests/conftest.py` fails the run if it trips — fix the fixture, don't raise
the number).

Fixture pattern — **replay once, assert many** (`tests/seam1/conftest.py`):

- The owner's nine real Drives replay exactly once per test process (the
  session `_replay_template`: one Loop, nine uploads, then the worker closes).
- Each replay test takes the `replayed` fixture instead: a fresh Loop over its
  **own copy** of that database, with its own worker, reading the replies with
  `template_replies(replayed)`. Uploads or answers after the replay touch only
  that copy, so tests stay independent and order-free.
- Tests that need a different history (a fresh car, one drive, an interleaved
  sequence) keep taking the plain `loop` fixture, which replays nothing.
- The Node worker is never shared between tests: one long-lived process per
  Loop, started and closed with the fixture. Share the replay, never the worker.


## The worker protocol

Newline-delimited JSON on stdin/stdout. Python never imports the engine and never
sees a log it did not send.

```
→ {"id":"7","op":"ingestUpload","args":{"csv":"<text>","fileName":"TunerView_…csv","now":1756723200000,"state":{…}}}
← {"id":"7","ok":true,"result":{ "drive":{…}, "state":{…} }}
← {"id":"7","ok":false,"error":{"message":"…","code":"…"}}
```

Ops: `ping`, `loadLog`, `ingestUpload`, `carHistory`, `carBaseline`, `mapVersions`,
`mapVersion`, `recordBasemap`, `flashPlan`, `recordFlash`, `answerDrive`,
`settleOpenSteps`, `nextStep`, `exportHistory`, `importHistory`, `driveFacts`, and
the `engine/kta-ask.js` tool handlers `overview`, `insight`, `channelStats`,
`timingCell`, `pull`.

## The loop in two calls

`decide` runs the engine twice per upload, in this order, both as harness steps:

```
→ {"op":"settleOpenSteps","args":{"state":{…},"driveId":"…","openSteps":[…]}}
← {"ok":true,"result":{"settled":[…],"openSteps":[…],"wasted":{…}}}
→ {"op":"nextStep","args":{"state":{…},"driveId":"…","openSteps":[…]}}
← {"ok":true,"result":{"step":{…},"openSteps":[…],"opened":["baseline","habit"]}}
```

- **The Open steps live in SQLite** (`open_steps`, one row per kind of step, in the
  engine's own shape) and travel in and out of these two calls. The engine judges
  them; the server stores them.
- `settled` is one row per step this Drive settled: `done` (Done), `open` (Not yet),
  `fail` (Still off) or `wait` (Can't tell yet), each with its reason and numbers.
  `wasted` is set when the Drive settled none of them.
- `step` is **exactly one** Next step, always naming the Drive whose upload will
  settle it (`settlesOn`), with `gauges` to watch, `also` for a free habit seen
  today, and `same` when it is the step from last time.

## Map versions

A fresh car is on **Map version 1**, the KTuner basemap `Starter 21 Dual Tune 2`,
before anything is uploaded to it. `ensure_map_version_one` seeds it in SQLite
when the app is built and again on the first `GET /api/state`, tables included.

- The **state document** carries the numbers, names and dates only. The tables
  (166 kB) live in `map_versions.tables`, so a Drive report stays small.
- `mapVersions` is the engine's list; `mapVersion {version}` hands back one
  version **with its tables** for a change to be checked against it (ADR 0003).
  A version whose Flashed change is not stored yet refuses
  (`map-change-pending`) rather than handing over an older map's tables.
- `flashPlan {mapVersion: 1}` writes against a named version; with no argument it
  writes against the active one.

Two rules keep it honest:

1. **The Car history state goes in and comes back.** The engine's operations are
   pure, so the worker holds no state of its own beyond a parsed-log cache
   (`loadLog` re-hydrates that cache after a restart; the raw CSV is in SQLite).
2. **A result is a summary, never rows.** And every limit a reply can quote
   arrives with the number it was read against, computed here from the engine's
   own constants — `Worker.limits` is the one place the thresholds live.

## The AG-UI endpoint

`POST /agent` is `ag_ui_langgraph.add_langgraph_fastapi_endpoint` over the
compiled graph. The chat sends `state.upload_id` and `state.thread_id`:

| Event | What it carries |
|---|---|
| `TEXT_MESSAGE_*` | the reply prose: the first sentence, then the window |
| `TOOL_CALL_START/ARGS/END/RESULT` | one harness step with its inputs and its output |
| `CUSTOM` name `harness` | `{checked, seconds, line, steps}` — the collapsed line |
| `STATE_SNAPSHOT` | `state.reply`, the typed card the chat renders: the Verdict sentence, the window, the four numbers, the **Map version line**, what I asked last time, the Wasted drive line, the Flash plan, the harness steps, the one Next step with its recipe or gauge table, and the Open steps list |
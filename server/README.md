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
    db.py                SQLite: Car profile, Car history state, Map versions, Flashes,
                         Installs, answers, Open steps, threads, the raw CSV of every upload
    harness.py           one engine call -> one AG-UI TOOL_CALL_* quartet
    copy.py              every word the owner reads (the built-in reply)
    graph.py             ingest -> decide -> reply
    app.py               FastAPI: POST /upload, POST /agent (AG-UI), GET /api/state, GET /healthz
  tests/seam1/           the seam-1 harness: post an upload, assert the reply events
```

## Run it

```bash
python3 -m pip install -r requirements.txt
cd server && python3 -m uvicorn kta_server.app:app --reload --port 8000
```

With no key in the repo-root `.env` every reply is the built-in one. `GET /healthz`
answers `ok` once the Node worker is up.

## Test it

```bash
cd server && python3 -m pytest tests/seam1 -q     # no key, no network
python3 tests/seam1/replay.py                     # read all nine real Drives end to end
```

## The worker protocol

Newline-delimited JSON on stdin/stdout. Python never imports the engine and never
sees a log it did not send.

```
→ {"id":"7","op":"ingestUpload","args":{"csv":"<text>","fileName":"TunerView_…csv","now":1756723200000,"state":{…}}}
← {"id":"7","ok":true,"result":{ "drive":{…}, "state":{…} }}
← {"id":"7","ok":false,"error":{"message":"…","code":"…"}}
```

Ops: `ping`, `loadLog`, `ingestUpload`, `carHistory`, `carBaseline`, `flashPlan`,
`recordFlash`, `answerDrive`, `exportHistory`, `importHistory`, `driveFacts`, and
the `engine/kta-ask.js` tool handlers `overview`, `insight`, `channelStats`,
`timingCell`, `pull`.

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
| `STATE_SNAPSHOT` | `state.reply`, the typed card the chat renders |
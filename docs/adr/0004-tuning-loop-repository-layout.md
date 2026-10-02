# The tuning loop lives in server/, web/ and knowledge/; the engine stays where it is

The loop from `.scratch/tuning-loop/` needs a backend, a chat front end and a knowledge base. This
fixes **where** each piece lives and **how the pieces talk**, so the sixteen tickets build one
product instead of sixteen. It adds no rules: every tuning rule still lives in `engine/`
(ADR 0002) and every map change is still checked twice (ADR 0003).

## The four parts

| Part | Where | Language | Owns |
|---|---|---|---|
| Engine | `engine/` (unchanged directory) | JavaScript | every Verdict, Car history rule, Flash plan, map cell |
| Worker | `server/kta_worker/worker.js` | Node | the only process that touches the engine; JSON in, compact JSON out |
| Server | `server/kta_server/` | Python | LangGraph, SQLite, the LLM, verify, knowledge, evals |
| Chat | `web/` | TypeScript (Next.js) | the thread and the cards the owner reads |
| Knowledge | `knowledge/cards/*.md` + generated `index.json` | Markdown + JSON | typed, sourced cards the agent retrieves |

`app/` (the parked browser app) is not wired to any of this and is not changed by the loop
tickets.

## How Python reaches the engine: the worker protocol

Python never imports the engine and never sees a raw log it did not send. It starts one long-lived
Node process (`server/kta_worker/worker.js`) and talks to it in **newline-delimited JSON** on
stdin/stdout, so the model is never shown a log row.

```
→ {"id":"7","op":"ingestUpload","args":{"csv":"<text>","fileName":"TunerView_…csv","now":1756723200000}}
← {"id":"7","ok":true,"result":{ …engine facts, never raw rows… }}
← {"id":"7","ok":false,"error":{"message":"…","code":"…"}}
```

Rules that keep it honest:

1. **The worker caches parsed logs by drive id.** `ingestUpload` parses the CSV, runs
   `KTA.carIngest`, and keeps the log in memory under the returned drive id. Later ops
   (`driveFacts`, `askInsight`, `mapCells`) read that cache. The raw CSV is still saved in SQLite,
   so a restarted worker is re-hydrated with `loadLog` before use and nothing is lost.
2. **Results are summaries.** A Drive report comes back as the numbers the reply shows, never as
   row arrays. `engine/kta-ask.js`'s tool handlers are reused so the numbers are identical to the
   in-browser assistant's.
3. **The Car history state is one JSON document.** `KTA.carIngest` and friends are pure, so SQLite
   stores the returned state as-is and the engine's own tests keep guarding it.
4. **New operations go through the worker**, not around it. The engine's public operations are the
   only way a number reaches the reply.

## How the chat reaches Python: AG-UI

`server/kta_server/app.py` is a FastAPI app that mounts:

| Route | Purpose |
|---|---|
| `POST /upload` | the owner's own CSV upload button (multipart); creates the Drive server-side |
| `POST /agent` | the AG-UI endpoint (`ag_ui_langgraph.add_langgraph_fastapi_endpoint`) |
| `GET /api/state` | Car profile, Car history, Map versions, Open steps, unanswered questions |
| `GET /healthz` | liveness |

`web/` is a Next.js app that consumes AG-UI events with `@ag-ui/client`'s `HttpAgent` and renders
**our own components** for the cards. CopilotKit's `@copilotkit/react-core` is kept as an optional
wrapper only; nothing in the loop depends on it, because the loop's own cards (Verdict, settled
Open steps, Next step, gauge table, KTuner card, questions, pictures) are ours to render precisely.

AG-UI events the product relies on:

- `TOOL_CALL_START` / `TOOL_CALL_ARGS` / `TOOL_CALL_END` → the collapsed **Harness steps** line and
  each step's inputs and outputs.
- `TEXT_MESSAGE_*` → the reply prose.
- `CUSTOM` (`thinking`) → the model's own thinking, in its own collapsed block labelled
  **unchecked**, never mixed into the steps.
- `STATE_SNAPSHOT` / `STATE_DELTA` → the typed cards the thread renders (Verdict, Next step, KTuner
  card, questions).
- Interrupt: the graph ends the run with a question in state; the answer is the next run.

## Where each seam's tests live

| Seam | Where | How it runs |
|---|---|---|
| 1 — the loop at the server's front door | `server/tests/seam1/` | `pytest server/tests/seam1` (no key, no LLM) |
| 2 — the two map checks agree | `server/tests/seam2/` | `pytest server/tests/seam2` |
| 3 — the engine's own suite | `test/` | `npm test` (unchanged) |
| Knowledge build | `server/tests/test_knowledge.py` | `pytest server/tests` |
| Browser smoke | `web/e2e/` | `npm run e2e` in `web/` |

Seam-1 tests post an upload, an answer or "I flashed it" and assert the **reply events** — never
graph internals, prompt text or private helpers.

## Configuration

`.env` (gitignored) holds the LLM settings, read once at startup:

```
KTA_LLM_BASE_URL=https://…/v1      # any OpenAI-compatible endpoint
KTA_LLM_API_KEY=…                  # never leaves the server
KTA_LLM_MODEL=qwen3.8-flash:free
KTA_LLM_MODELS=qwen3.8-flash:free, <a paid model>   # eval layers 2-3 only
KTA_DB=server/ktuner.db            # SQLite file
```

With no key the loop still works: every reply is the built-in one.

## Considered Options

- **Put the engine in Python** (ADR 0002): rejected; one source of truth for the tuning math.
- **Serve the chat from the parked `app/`**: rejected; it is a no-build static app and the loop needs
  a server anyway.
- **CopilotKit as the only renderer**: rejected for the cards. CopilotKit's own message renderer
  cannot show a KTuner cell table, a gauge table or a per-cell checklist to the pixel the owner
  needs, so our own components render AG-UI events and CopilotKit stays optional.

## Consequences

Every ticket adds to one of the five directories above and nothing else. A new tuning rule is an
engine change with an engine test; a new sentence the owner reads is copy reviewed as product work,
not a string buried in a prompt. Because the reply is assembled from typed state, the same Drive and
the same Car history always give the same reply.
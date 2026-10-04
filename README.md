# KTuner Assistant

A tuning shop you talk to. You bought KTuner, fitted parts and flashed a basemap; now you want the
map fitted to **your** car. Attach a TunerView log in the chat and the assistant works like a tuner:
it tells you if the engine is OK in your numbers, shows the health report and what your log did or
didn't capture, walks the map table by table (what changes this round, what is locked and why),
gives you exactly the cells to type into KTuner, asks you to flash and confirm, then tells you how
to drive the log that proves it. Round after round, until the car is safe and you're happy.

Built for a Honda Civic FE 1.5T CVT on Vietnam E10 (RON95 III, and RON97 III for the premium-fuel test).

## Run it

```bash
make run
```

- Chat: http://localhost:3000 · Server: http://127.0.0.1:8000 (`/healthz` → `ok`).
- LLM: put an OpenAI-compatible endpoint in a root `.env` (gitignored):
  `KTA_LLM_BASE_URL`, `KTA_LLM_API_KEY`, `KTA_LLM_MODEL` (and `KTA_LLM_MODELS` for the scorecard).
  With no key the app still works: every reply is the built-in one.
- Data: SQLite at `server/ktuner.db` (`KTA_DB` to change).

## How it works

| Part | Where | Owns |
|---|---|---|
| Engine | `engine/` (JavaScript) | every verdict, Open step, Next step, Flash plan and map cell |
| Worker | `server/kta_worker/` (Node) | the only process that runs the engine; JSON in, compact JSON out |
| Server | `server/kta_server/` (Python, FastAPI, LangGraph) | the chat graph (front agent → tuner hand-off, and the Drive pipeline), verify, knowledge, SQLite (+ chat memory) |
| Chat | `web/` (Next.js) | the conversation, cards, table viewer |
| Knowledge | `knowledge/cards/` | sourced cards the agent must cite |

The LLM orchestrates: it picks tools, reasons and teaches. It never decides a verdict or writes a
map cell. Every reply passes `verify` (numbers from tools, real tables only, only the checked plan's
cells, banned advice, citations) and every map change passes two independent checks (ADR 0003).
See `docs/adr/0005-llm-orchestrates-engine-decides.md` and `docs/adr/0006-agentic-chat-front-agent.md`
(every typed message: a front agent with tools, the chat's cards as AG-UI frontend tools, model-written
suggestions checked in code, and the conversation kept per chat by LangGraph's SQLite checkpointer).

## Test and eval

```bash
npm test                                  # engine
cd server && uv run pytest                # server: the loop, verify, map checks, map recommendation eval
cd web && npm run e2e                     # browser smoke through the composer (server + chat running)
cd server && KTA_SCORECARD=1 uv run python -m kta_server.scorecard   # live model scorecard (needs a key)
```

## Docs

- `PRODUCT.md` — who it's for and the principles; `DESIGN.md` — the chat's visual system.
- `CONTEXT.md` — the vocabulary every reply and every line of code uses.
- `docs/adr/` — architecture decisions; `docs/research/` — sourced research the knowledge cards cite.
- `.scratch/tuning-shop/` — the current analysis, decisions, tracker and eval; `.scratch/chat-app/`
  — the chat UI spec; `.scratch/tuning-loop/` — the loop's engine and server spec.

# 08 — LLM agent with verify, repair and fallback

**What to build:** the reply is written by an LLM that orchestrates read-only engine tools, and nothing it says reaches the owner unchecked. The provider is any OpenAI-compatible endpoint from `.env` (base URL, key, model; TokenHarbor for testing); the key stays on the server. Tools go through the Node worker: drive facts (reusing the existing in-browser ask module's drive tools: overview, insight by topic, channel stats by window, timing cell, one pull), Car history window, Open steps, the decided Next step and Flash plan, map cells.

The agent may choose what to look at and how to explain; it may not add, remove or change the Next step. Verify checks: every number matches a tool result; the action named is the decided Next step; any table, cell or value matches the Flash plan; banned advice (less knock sensitivity, more timing, boost above the ceiling, a curve edit for trims-everywhere) is rejected. A failed reply gets one repair turn, then the built-in reply is shown. The model's own thinking, when the model returns it, is a separate collapsed block labelled "unchecked". With no key configured, the built-in reply is used.

**Blocked by:** 04

**Status:** done — 3 Oct 2026

- [x] Seam-1 tests with a scripted fake model: a correct reply passes; a wrong number, a different action, a cell not in the Flash plan, and banned advice each trigger one repair, then the built-in reply (`server/tests/seam1/test_llm_agent.py`, 10 tests; plus `server/tests/test_verify.py`, 16 unit tests)
- [x] Tool calls stream as harness steps with inputs and outputs (each model tool call runs through `Harness.step`, same op names as ingest/decide)
- [x] Thinking, when present, shows as "unchecked", separate from the steps (`CUSTOM` `thinking` event with `label: unchecked`; `reasoning_content`/`thinking`/`<think>` all extracted)
- [x] No key → built-in reply, loop unchanged (agent node returns nothing; `test_no_key_*` pins the 8 step names and the built-in sentence; full suites green with no key)
- [ ] One manual run against TokenHarbor with a real (rotated) key produces a verified reply — NOT RUN: no key exists in this environment (no `.env`, no `KTA_LLM_*` in env). Explicit exception, not a pass. Exact instructions below.

**What was built:** `server/kta_server/agent.py` (OpenAI-compatible `POST {base}/chat/completions` with `tool_choice: auto`, 12 fixed tools, max 8 provider calls; key only in the `Authorization` header, model never sees a raw log), `server/kta_server/verify.py` (deterministic, no LLM), an `agent` graph node between `decide` and `reply`, `Harness.think` for the unchecked block, and a Too-short skip (built-in line stands, model never called).

**Test counts:** `pytest server/tests` 118 passed (16 new verify unit + 10 new seam-1 agent + 92 existing incl. the 9-drive loop path, with no key set); `npm test` 155 passed, 0 failed.

**Manual TokenHarbor run (to do before relying on a live model):**
1. Put a test key in a gitignored `.env` at the repo root (never commit it):
   `KTA_LLM_BASE_URL=https://<tokenharbor host>/v1`, `KTA_LLM_API_KEY=<test key>`, `KTA_LLM_MODEL=<model>`.
2. Run: `cd server && KTA_DB=/tmp/kta-manual.db python3 -m uvicorn kta_server.app:app --port 8099`
3. `curl -F file=@../data/<a TunerView csv> -F threadId=manual1 localhost:8099/upload`, then drive one `/agent` turn with that `uploadId` (or click through `web/`).
4. Observe: the reply prose differs from the built-in sentence but quotes the same numbers; the harness line counts the extra agent tool steps, each expandable to inputs/outputs; `reply.agent.verified` is true in the snapshot; with the key removed the same upload gives the byte-identical built-in reply.
5. ROTATE/revoke the test key afterwards (prefer a pre-existing test key; never commit keys).

**PM notes:** provider config is exactly `KTA_LLM_BASE_URL` + `KTA_LLM_API_KEY` + `KTA_LLM_MODEL` (reuses `Settings.has_llm`; tests construct `Settings` explicitly so a real key in the environment can never leak into a test). Tool list: `get_overview`, `get_drive_facts`, `get_insight`, `get_channel_stats`, `get_timing_cell`, `get_pull`, `get_car_history`, `get_open_steps`, `get_next_step`, `get_flash_plan`, `get_map_cell`, terminal `submit_reply(prose, action_key, cells)`. Verify rules: numbers ⊆ tool results + worker limits + FREE (1.5/14.7/95/92/10), rounding as `kta-ask.js`; `action_key` must equal the decided step key; every cell (table/row/col/before/after) must match the Flash plan; table-like tokens must be plan tables; banned EN+VI — knock-sensitivity/timing/protections (ported from `kta-ask.js`), boost-raise phrasing (allowed only when the plan itself raises boost) + psi-over-ceiling numerics, AFM/MAF curve-edit phrasing (allowed only when the plan touches AFM cells); negations count only within the same sentence (found by test: "…not damage. Lower the knock…" must not launder). What 09 needs: citation fields on the reply (tool/card ids per claim) — the harness steps already carry per-step outputs, and `reply.agent` carries verified/repaired/issues for the scorecard.

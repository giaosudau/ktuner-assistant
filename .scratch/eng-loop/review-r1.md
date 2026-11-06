# Engineering Round 1: vision, architecture decisions, top 10

Led by the Principal Software Engineer, with the Principal AI Engineer, the Principal Tuner
(KTuner) and the KTuner shop. Evidence was measured on `a3ecbbb` (2026-11-03). Every item below
comes from one architecture decision, and every decision serves the vision.

---

## 1. Vision (fixed: the details below may change, this does not)

> **One truth per thing.** A log goes in; the **engine** decides; the **server** words it,
> checks it and remembers it; the **web** lays it out. Every decision, every number, every word
> and every contract has **exactly one home**. Adding or removing a feature means touching that
> one home per layer, and a test says what you forgot.

The vision restates ADR 0002, 0003, 0005 and 0006 and adds nothing new. The codebase already
believes this. What breaks it is drift: a second home that grew up next to the first.

> **Added 2026-11-06: light enough for one person.** One deploy, cheap to run until it earns, and
> real owners before any rewrite. **Read `stack-r1.md` first.** Its final call keeps today's stack
> for a beta, so the items below stand. `STATUS.md` holds the current order.

## 2. Architecture today (measured)

```
TunerView CSV ─► web (Next.js, 7.9k lines incl. 2.7k CSS)
                  │ AG-UI events
                  ▼
               server/kta_server (Python, 9.9k) ── SQLite (state doc + tables + CSV)
                  │ NDJSON                    └─ LLM (3 hand-rolled /chat/completions callers)
                  ▼
               kta_worker/worker.js (831) ──► engine/ (9.2k JS: 7.0k logic + 2.2k text)
                  ▲
   copy.py ───────┘ second path: `node -p require('kta-car.js').carWords` at import
```

| Area | Lines | Tests | Wall | CPU |
|---|---|---|---|---|
| engine (JS) | 9,193 | 3,895 lines, `npm test` | **25.5 s** (car 21.0, drive 13.5) | 52 s |
| server (Py) | 9,882 + worker 831 | 6,810 lines, 357 pass | **63.7 s** (budget 90) | 220 s |
| web (TS) | 7,879 | e2e smoke | — | — |

**What holds** (keep it, and copy the pattern): a pure engine with the state document going in
and coming back (ADR 0004 rule 3). `STEP_JUDGES`, the engine's one registry of Open step kinds.
`thresholds.json` → `Worker.limits` as the path every number takes. The Python suite's "replay
once, assert many" fixture. Two independent map checks (ADR 0003: this duplication is
deliberate and stays).

**Where a second home grew** (each is an architecture problem, not just a style one):

| # | Thing | Home 1 | Home 2 (drift) |
|---|---|---|---|
| A | Where the owner is (Stage) | engine Open steps + Next step | `desk.stage_of()` re-derives it in Python from flashes, verdicts, step keys |
| B | Owner-facing words | `server/kta_server/copy.py` | `engine/text/i18n*.js` (2.2k lines, English **and** Vietnamese, hung on `window` from the retired browser app) |
| C | Numbers / thresholds | `data/thresholds.json` → `Worker.limits` | Python constants (`BRIEF_RATE_HZ=10`, `BRIEF_MOVING_S=600`, `BRIEF_WARM_ECT=80`, `FUEL_SAME_DEG=0.5`, `CALIBRATION_SLOT=2`) and `lim(..., fallback)` literals (42, 48, 5) |
| D | Access to the engine | the worker (ADR 0002: "the only process") | `copy.py` spawns its own `node` at import |
| E | The LLM tool loop | `agent.run_agent` | `chat.chat_turn`, plus two more raw callers in `scorecard.py`. Same `_wrap`, `_fn/_params` and tool-call parsing, copied |
| F | Step kinds | `STEP_JUDGES` (engine) | 58 `"undo"/"baseline"/…` string branches across Python |
| G | Reply contract | Python dicts | `web/lib/types.ts` (437 lines), hand-mirrored, nothing checks it |

## 3. Architecture decisions (ADR-level; each becomes an ADR when its first item ships)

| AD | Decision | Replaces | Why it is simpler |
|---|---|---|---|
| **AD-1 One state machine** | The engine returns `stage` beside `step` from `carNextStep`. The server stores and mirrors it and never derives it. | A | One rule, tested in pure JS. The sidebar, the chat and the Next step can't disagree. |
| **AD-2 Engine is Node-only, decisions only** | The engine returns codes, facts and numbers. It holds no Vietnamese, no `window`, no browser-era features. The English strings the ask tools still read are frozen (no new ones). | B (part), D | The engine shrinks to what the product calls. Deleted code can't drift. |
| **AD-3 One wording home** | `copy.py` words everything the owner reads, from tables keyed by step kind, check id and table family, not `if key == …` chains. | B, F | A feature's words are one dict entry. A test lists the missing ones. |
| **AD-4 One number path** | Every threshold or band lives in `thresholds.json` → engine `LIMITS` → `Worker.limits`. Python holds no tuning number and no fallback literals. The one exception is `mapcheck.py`, which reads the JSON itself (ADR 0003). | C | A Tuner changes one JSON row, and the reply, the check and the test follow. |
| **AD-5 One LLM seam** | `kta_server/llm.py` holds the one model client (`post_chat`) and the one `tool_loop(tools, run_tool, verify, max_calls)`. The front agent, the explainer, ask and the scorecard all call it. | E | Retries, thinking-strip, repair-once and limits live in one place. Swapping the provider is one file. |
| **AD-6 One contract, checked by the compiler** | The replay writes its replies into a typed fixture (`const replies: Reply[] = …`), so `tsc --noEmit` fails when the server and `types.ts` drift. | G | No schema library and no codegen. Uses the compiler the loop already runs. |
| **AD-7 Fast, behaviour-named tests** | Engine hot paths get fast paths (the product's upload gets faster too). JS gets the same "replay once" fixture Python has. Tests are named by behaviour, not by round. Both suites have a wall-time budget. | slow suites, `test_ux_round*.py` | Tests run in seconds, so the loop runs them every edit. A failing test names a behaviour, not a date. |

**Considered and rejected (for now):**
- *Splitting `kta-car.js` (2,825 lines) into modules.* The SE wanted to split it along its seams
  (history, steps, map versions, flashes). Ponytail: a split moves lines without deleting any,
  and churns every import and every blame. **Call:** delete first (AD-2). Split only when a
  feature needs a seam that is not there.
- *Pydantic models + generated TS types.* The AI engineer liked the rigour. It means two new
  layers and a codegen step. **Call:** AD-6's compiler check gives the same guarantee for about
  20 lines.
- *One shared Node worker across Python tests* (that would cut 220 s of CPU). **Call:** no. The
  README rule "share the replay, never the worker" is what makes the suite order-free. Speed
  comes from the engine (AD-7).
- *Moving the knowledge-graph tools (`tools/knowledge-graph.py`, `kg_reason.py`, 1.45k lines)
  out.* They are dev tooling, not product, and the UX loop rebuilds them. **Call:** they stay
  outside the core and outside this round.

---

## 4. Top 10 (ranked by: protects the core · removes a second home · lines cut · risk)

Each item lists its decision, the problem, the fix, the debate, how to verify it, and its gain.

### 1. Stage moves into the engine (AD-1)
- **Problem:** `desk.stage_of()` re-derives Stage from flashes, verdicts and step keys. A new
  step kind or a Flash edge case can make the sidebar say "verify" while the Next step says
  something else. LOOP.md wants one place that says where the owner is, but today two places
  compute it.
- **Fix:** `KTA.carNextStep` returns `{ step, stage }`, with the same rule ported into the
  engine beside `STEP_JUDGES`. `loopstate.py` reads `stage` from that result. Delete
  `stage_of` and its `SAFETY_STEPS` tuple.
- **Debate:**
  - SE: core logic belongs in the pure, fast-tested layer.
  - AI: the front agent's system prompt already reads `loop.stage`, so nothing changes for it.
  - Tuner: the "stop verdict blocks Calibrate" rule is a safety rule. It must not live in
    wording code.
  - Shop: when a customer asks "why does it say Verify?", I want one answer.
  - **Call:** do it first.
- **Verify:** one engine test per stage (car, baseline, calibrate, read, plan, verify) on the
  real nine-drive replay. A server test asserts `loop.stage == engine stage` after every replay
  upload. Run `npm test` and `pytest`.
- **Gain:** decision homes for Stage go from 2 to 1, and roughly −35 lines of Python.

### 2. Delete the engine's browser-era text (AD-2)
- **Problem:** `engine/text/` is 2,158 lines, and about 760 of them are Vietnamese. Nothing
  reads that Vietnamese except two test asserts: the worker loads `KTA_I18N.en` only. The files
  hang off `window`, which forces `globalThis.window = {}` in the worker (comment: "a leftover
  of the retired browser app").
- **Fix:** delete the `vi` blocks and the two vi asserts. Switch the three files to
  `module.exports`, and require them normally in the worker and the tests.
- **Debate:**
  - Shop: Vietnamese owners exist.
  - PM lens (the Tuner backs it): the product's words live in `copy.py` (AD-3). A future
    Vietnamese UI gets written there, so this dead copy would never be reused. Keep it in git
    history.
  - **Call:** delete.
- **Verify:** `npm test` and `pytest` stay green, and `grep -r KTA_I18N` finds nothing.
- **Gain:** about −800 lines, one global gone.

### 3. Delete engine features with no production caller (AD-2)
- **Problem:** these engine exports have no caller in the worker or the engine, only tests:
  `suggestMaf`, `parseAfmPaste`, `pairOf`, `tableEdits`, `smoothness`, `smoothPreview`,
  `referenceChecks`, `reviewPacket` (about 330 lines). The same goes for `carEditFlash`,
  `carDeleteFlash`, `carUnhide`, `RANGES`, `FUEL`, `ROLE_ORDER`, `TIERS`, `SAFETY_ORDER`,
  `QUESTION_ORDER` and `proofSnapshot`. Each one is code the Tuner reads when checking a rule.
- **Fix:** delete them with their tests. Move `sampleCsv`/`SAMPLES` (about 125 lines, used
  only by `tools/build-examples.js`) into that tool.
- **Debate:**
  - Tuner: is `suggestMaf` the MAF Scaling recommender we'll want? The live MAF path is
    `checkMapChange` plus the build/flash plan, and `suggestMaf` is the old browser one. If MAF
    returns as a feature, it goes through the Flash plan.
  - AI: confirm no agent tool name maps to them. `agent.TOOLS` only uses the `kta-ask.js`
    handlers.
  - **Call:** delete. Re-run the export scan from `LOOP.md` to prove there are zero callers.
- **Verify:** the export scan prints 0. All suites stay green.
- **Gain:** about −450 engine lines and −20 tests.

### 4. One LLM seam: `llm.py` (AD-5)
- **Problem:** there are three hand-rolled `/chat/completions` callers (`agent._post_chat`, and
  two in `scorecard.py`) and two tool loops (`agent.run_agent` with `MAX_CALLS=12`,
  `chat.chat_turn` with `MAX_CALLS=8`). Helpers are copied: `_wrap` is byte-identical in both
  files, and `_fn`/`_params` is the same function under two names. `langchain-openai` is
  declared but never imported.
- **Fix:** add `llm.py` with `post_chat(settings, messages, tools)`, `tool_calls_of(msg)`,
  `strip_thinking` and `tool_loop(messages, tools, run_tool, max_calls, on_step)`. The
  explainer and the front agent each keep only their prompt, their tool table and their
  `run_tool`. Drop `langchain-openai` from `pyproject.toml`.
- **Debate:**
  - AI: the repair-once-then-built-in rule (verify) must stay outside the loop. The loop
    returns the text and the caller verifies it. That keeps ADR 0005 visible.
  - SE: don't make it a class. Two functions are enough.
  - Shop: the "no key means the built-in reply" path must not change.
  - **Call:** do it, and keep `verify` with the callers.
- **Verify:** `test_llm_agent.py`, `test_chat_agent.py`, `test_ask.py` and
  `test_scorecard*.py` stay green with no edits to their assertions. `uv tree` no longer shows
  `langchain-openai`.
- **Gain:** about −150 lines, −1 dependency, LLM loops from 3 to 1.

### 5. Python decides no number (AD-4)
- **Problem:** `copy.py` holds tuning numbers (`BRIEF_RATE_HZ`, `BRIEF_MOVING_S`,
  `BRIEF_WARM_ECT`, `FUEL_SAME_DEG`, `CALIBRATION_SLOT`) and fallback literals (42 °C, 48 °C,
  5 %) that silently replace a missing limit. Its own docstring says "no number is decided
  here".
- **Fix:** move these into `thresholds.json` (log-brief and fuel-test rows, each with its
  source). Read them through `Worker.limits`. Make `lim()` raise on a missing path. The
  `PEDAL_FULL_RANGE` and `LOGGER_RATE_RANGE` input-sanity ranges stay in `profile.py`: input
  validation at the trust boundary is server-owned.
- **Debate:**
  - Tuner: 80 °C warm ECT and the 10 Hz brief rate are real tuning facts. They need a cited
    source like every other band, which the JSON row gives them.
  - SE: a loud failure beats a quiet 42.
  - **Call:** do it.
- **Verify:** a new one-line test fails if `lim(` is called with a third argument, or if
  `copy.py` defines an UPPER_CASE number. `thresholds.test.js` covers the new rows.
- **Gain:** Python tuning constants and fallbacks go from 5 + 5 to 0, and every number gets a source.

### 6. Engine words reach Python through the worker (AD-2, ADR 0002)
- **Problem:** `copy._engine_words()` runs `node -p require('./engine/kta-car.js').carWords`
  at **import time**. That is a second engine process, it costs a cold Node start on every
  server and test import, and it breaks "the worker is the only process".
- **Fix:** the worker's `ping` already returns `limits`, so add `words: KTA.carWords` beside
  it. `copy.py` reads both from the `Worker` once, at startup.
- **Debate:**
  - SE: module-level state set at startup is the same lifetime as `limits`. Fine.
  - AI: no prompt change.
  - **Call:** do it. It is small.
- **Verify:** `grep subprocess server/kta_server/copy.py` finds nothing. Suites stay green.
- **Gain:** engine access paths go from 2 to 1.

### 7. Step kinds are data, and a test finds the missing words (AD-3): makes features add/remove-able
- **Problem:** the engine already keeps step kinds in one registry (`STEP_JUDGES`), but Python
  branches on step names 58 times. Adding or removing a step kind means hunting strings.
- **Fix:** in `copy.py`, add one `STEP_WORDS = {key: {title, recipe, gauges, why}}`, and have
  `next_step_card`, `settled_rows` and `desk` read from it. Add one contract test: for every
  `KTA.STEP_KEYS` key (from the worker's `ping`), `STEP_WORDS` has an entry, and the reverse.
- **Debate:**
  - SE: this is the "discovery" the brief asks for. The test names exactly the dict to fill.
  - Tuner: the gauge lists per step must stay TunerView names, and the dict makes that
    reviewable in one screen.
  - Shop: a new check reaches customers faster.
  - **Call:** do it after item 1, so stage logic is out of Python first.
- **Verify:** the contract test passes. Delete a key from the dict and it fails, naming the key.
  Python step-name branches drop from 58 to about 10.
- **Gain:** adding a step kind is 3 touches (engine judge, `STEP_WORDS`, threshold row), each
  named by a test.

### 8. The compiler checks the reply contract (AD-6)
- **Problem:** nothing checks `web/lib/types.ts` (437 lines) against what the server sends. A
  renamed key renders as a blank card, and only the e2e or a person notices.
- **Fix:** `tests/seam1/replay.py` (or the session replay fixture) dumps the nine-drive replies
  and the typed-message replies to `web/e2e/replies.fixture.ts` as
  `export const replies: Reply[] = <json>;`. `cd web && npx tsc --noEmit` is already in the
  loop's Verify step.
- **Debate:**
  - SE: JSON-as-TS literal types are strict about extra keys only on object literals. That
    works in our favour here: unknown keys fail.
  - AI: also dump the `/agent` `STATE_SNAPSHOT` shape.
  - **Call:** do it. Commit the fixture so the diff shows contract changes in review.
- **Verify:** rename one field in `copy.build_reply`, and `tsc` fails.
- **Gain:** contract drift is caught at the compiler, not in the car park.

### 9. Engine hot path: faster uploads and faster tests (AD-7)
- **Problem:** CPU profile of `car.test.js` (21 s): `toNum` 4.8 s (a regex match per CSV cell),
  `rollingMedian` 2.7 s (sorts every window), `finite`+`quantile` 3.4 s (copy and sort per
  call), `splitLine` 1.3 s (char-by-char string concat). The product pays the same costs on
  every upload (about 130 ms per `carIngest`, per the test's own comment) and on every Python
  replay.
- **Fix:**
  - `toNum`: fast path `var v = +s; if (s !== '' && v === v) return v;` before the regex.
  - `splitLine`: when a line has no `"`, use `line.split(delim).map(trim)`.
  - `rollingMedian`: a sliding sorted window (binary insert and remove, O(n·w)).
  - Analyse: compute each channel's quantiles once.
- **Debate:**
  - Tuner: results must be bit-identical. A median that moves by 0.01 can flip a Verdict.
  - SE: so the gate is "same output", not "close". Snapshot `carReport` for all nine drives
    before the change and `deepEqual` after.
  - **Call:** do it, gated on the snapshot.
- **Verify:** the snapshot test passes. `npm test` wall time drops, with a target of ≤ 10 s.
  The Python suite's slowest durations drop too.
- **Gain:** measured, not guessed. Record before and after in `STATUS.md`.

### 10. Tests named by behaviour, budgeted, and replay-once in JS (AD-7)
- **Problems:**
  - `test_ux_round1.py` and `test_ux_round2.py` name dates, not behaviours, and the loop adds
    one per round forever.
  - `car.test.js` (1,963 lines, 110 tests) re-ingests the same drives in many tests.
  - JS has no wall-time budget.
- **Fixes:**
  - Fold each round test into the behaviour file it pins (`test_upload_reply.py`,
    `test_calibration_stage.py`, …), and change the LOOP rule from "one file per round" to
    "pin in the behaviour's file".
  - Add a `replayed()` memo to `car.test.js`: the nine drives ingested once, then each test
    gets `structuredClone(state)`.
  - Add a JS budget: `npm test` fails over 15 s, which the JS tests can enforce with an
    `after()` hook.
- **Debate:**
  - SE: a failing test should name a behaviour, not a round.
  - Shop: when a customer's car breaks a rule, I want the test called what the customer saw.
  - **Call:** do it.
- **Verify:** test counts are unchanged (357 py and the current JS count), and the budget line
  prints on every run.
- **Gain:** test files stop growing per round. The JS wall time is guarded.

---

## 5. ponytail-audit (repo-wide, over-engineering only)

```
delete: Vietnamese interface text, never loaded by the worker. Nothing. [engine/text/*.js ~760 lines]
delete: engine exports with no production caller (suggestMaf, parseAfmPaste, pairOf, tableEdits, smoothness, smoothPreview, referenceChecks, reviewPacket, carEditFlash, carDeleteFlash, carUnhide, …) and their tests. Nothing. [engine/kta-engine.js, kta-car.js, kta-drive.js ~450]
yagni: desk.stage_of re-derives a rule the engine owns. carNextStep returns stage. [server/kta_server/desk.py:266]
shrink: two tool loops + three raw model callers. One tool_loop + post_chat in llm.py. [agent.py:464,528 · chat.py:203 · scorecard.py:584,603 ~150]
delete: langchain-openai, declared, never imported. Nothing. [server/pyproject.toml]
delete: copy._engine_words subprocess. Worker ping returns carWords. [server/kta_server/copy.py:48]
shrink: 58 step-name string branches. STEP_WORDS dict keyed by STEP_KEYS. [server/kta_server/*.py]
yagni: lim(path, fallback) literal fallbacks hide a missing limit. lim(path), raise. [copy.py:177,613,614,823,824]
delete: globalThis.window shim for i18n. module.exports. [server/kta_worker/worker.js:39]
shrink: toNum regex per cell. +s fast path, regex only on miss. [engine/kta-engine.js:341]
delete: sampleCsv/SAMPLES in the engine, used by one tool. Move into tools/build-examples.js. [engine/kta-engine.js:1986 ~125]
```
`net: about −1,700 lines, −1 dep possible.` (Estimates from the measured block sizes; the real
figure is whatever `wc -l` says after.)

## 6. ponytail-debt (ledger)

```
server/kta_server/profile.py:189, a brand named anywhere is read as the pipe's brand. ceiling: wrong brand when two are named. upgrade: (none named) no-trigger
server/kta_server/questions.py:134, one profile flag for every Drive. ceiling: per-Flash map settings. upgrade: owner flips the box between drives.
```
`2 markers, 1 with no trigger.` Item for Round 2: give `profile.py:189` its trigger
("upgrade when an owner reports a wrong brand").

## 7. Gain: how we measure success

The ponytail-gain card shows benchmark medians, not numbers for this repo. Only measured
before/after numbers count here. Baselines below, each re-measured every round by the commands
in `LOOP.md`:

| Metric | Baseline (`a3ecbbb`) | Round-1 target |
|---|---|---|
| Source lines: engine / server+worker / web | 9,193 / 10,713 / 7,879 | engine ≤ 8,000 · server ≤ 10,500 |
| Test wall time JS / Py | 25.5 s / 63.7 s | ≤ 10 s / ≤ 55 s |
| Test CPU JS / Py | 52 s / 220 s | ↓ (report it) |
| Second homes (table A–G) | 7 | ≤ 2 (A, C, D, E, F closed) |
| Processes that load the engine | 2 | 1 |
| LLM loops / raw model callers | 2 / 3 | 1 / 1 |
| Python tuning constants / lim fallbacks | 5 / 5 | 0 / 0 |
| Python step-name branches | 58 | ≤ 10 |
| Server deps (runtime) | 10 | 9 |
| Engine exports with no prod caller | 23 (REF, STEP_KEYS, carWords are false or planned hits) | 3, each with a reason |
| Touches to add a step kind | not measured yet | 3, each named by a failing test |
| `ponytail:` markers without trigger | 1 | 0 |

**Order of work.** Items 2, 3 and 6 go first: pure deletions, low risk, and they shrink what
item 9 has to keep bit-identical. Then 1, then 7 (step words need the stage out of Python),
then 5, 4, 8, 9 and 10. Item 9's snapshot test lands before any hot-path edit.

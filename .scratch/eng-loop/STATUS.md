# Engineering loop status

## Round 1: analysis done, nothing built yet (2026-11-03, `a3ecbbb`)

Vision, AD-1…AD-7 and the top 10 are in `review-r1.md`.

**Before** (`measure.sh --tests`, measured):

```
lines   engine=9193  server=10713  web=7879
tests   js=3895  py=6760
homes   engine_procs=2  stage_in_python=1  llm_callers=3  py_step_branches=58  py_tuning_consts=5  lim_fallbacks=5
deps    py=10  web=4
debt    2 ponytail: markers
dead    23 engine exports with no production caller
speed   npm_test=25.5s (CPU 52s; car.test.js 21.0s, drive.test.js 13.5s)  pytest=63.7s (CPU 220s, 357 passed)
```

### Step 1 done: deletions (2026-11-06)

Commits: items 2 and 3, then the small cleanups. Engine output is byte-identical: a replay of the
nine real drives through the worker (ingest, facts, overview, 8 insights, next step, questions)
diffed empty after each commit.

**Before** (`measure.sh --tests`):

```
lines   engine=9193  server=10713  web=7879
tests   js=3895  py=6760
deps    py=10  web=4
dead    23 engine exports with no production caller
speed   npm_test=22s  pytest=58s   (253 JS tests, 357 pytest passed)
```

**After:**

```
lines   engine=7654  server=10707  web=7879
tests   js=3847  py=6760
deps    py=9  web=4
stack   runtimes=3  deploy_files=0  owner_columns=0
dead    6 engine exports with no production caller: REF tableEdits smoothPreview STEP_KEYS carWords parseDriveStart
speed   npm_test=23s  pytest=57s   (244 JS tests, 357 pytest passed)
```

**Shipped:** Vietnamese text and the `window.KTA_I18N` shim gone (text files are CommonJS, entry
`engine/text/i18n-map.js`); 14 dead exports and their helpers gone; `sampleCsv` moved to
`test/sample-csv.js` (byte-identical output); `langchain-openai` gone (also drops openai,
tiktoken, regex from the lock); `deploy_units` gone from `measure.sh`; the `profile.py` shortcut
has its trigger. Nine tests deleted (they only exercised deleted code).

**Kept on purpose:** `tableEdits`, `smoothPreview` (`tools/edit-plan.js` feeds
`tools/annotate-xlsx.py`, which writes `data/KTuner-Maps-Edit-Plan.xlsx`); `REF`, `STEP_KEYS`,
`carWords`, `parseDriveStart` (planned or read by `copy.py`); `RANGES`, `TIERS`, `SAFETY_ORDER`,
`QUESTION_ORDER` as internal variables (only the export lines went); `suggestWotLean`,
`suggestBoostStep`, `toRow` (the Flash plan uses them).

**Leads for the next round:** about 640 of the 1,121 English text lines are never read by the
worker (`car`, `guide`, `map`, most of `i18n.js`); `KTA.view.*` chart builders and
`kta-engine.js` `analyze` paths may be dead too (the export scan cannot see nested exports);
`stat` and `rangeSecs` in `kta-drive.js` are unused; `kta-ask.js` still has Vietnamese
phrases in its guard regexes (kept: they reject unsafe advice in either language).

**Stack decided 2026-11-06** (`stack-r1.md`, "Final call"): keep today's stack and ship to 5–10
real owners on one small box. The Next.js port waits until 5 owners each upload a proving Drive
after a Flash. The spike stays valid as evidence: the engine runs in a Next.js route, with
214–260 ms ingest on a 1.95 MB drive, and the `window` shim crashes Next.js server code.

### Step 2 done: one container, one URL (2026-11-06)

`output: "export"` builds `web/out`; FastAPI serves it from `KTA_WEB_DIR` (mounted last in
`create_app`), so chat and API share one origin. `Dockerfile` (node:24-slim, uv, Python 3.13) and
`railway.toml` (Dockerfile builder, `/healthz`, restart on failure); the volume at `/data` is set in
the dashboard and the steps are in `server/README.md` "Deploy". No auth or caps: not safe on a public URL until step 3.

**Proof:** `grep -rl 127.0.0.1:8000 web/out` prints nothing; the browser e2e passes against one origin natively
and against the image. Data survives `docker rm` with the same volume (1 Drive before and after);
54 knowledge cards load in the container. Image 668 MB (`docker images`, uncompressed). `docs/research`
ships in the image because cards fail to load without the doc each one cites.

### Step 3 done: one app instance per owner, behind one small gate (2026-11-06)

`server/kta_server/owners.py` (ADR 0009): invite link `/join/<secret>` with the risk notice and a button
(a GET never sets the cookie), one lazy `create_app` per owner with their own database, chat file and
worker, a 15-minute idle stop, a 20 MB stated-size limit, 200 model calls per owner per UTC day in that
owner's database. The container exits if `KTA_OWNERS` is missing or bad. `make run` is unchanged. No
SQL changed apart from the `model_calls` table.

**Proof:** browser e2e (12 of 12 steps) through the invite button, natively and against the image.
Without the cookie `/`, `/api/state` and `/agent` answer 401. Ann's Drive survives a container restart
on the same volume and Ben's car stays empty. No secret in the server output or container log. The
image exits 1 with no `KTA_OWNERS`. Raw-socket path, method, cookie and content-length attacks all ended
gated or refused. Pointing all owners at one db fails the crossing test; dropping the gate check fails
the every-route test. Six start and stop cycles with a chat turn hold file handles, threads and Node
children flat.

**Found on the way:** `uploadCsv` never read the server's `detail`, so the 413 sentence could not reach
the owner (fixed). `Transfer-Encoding: chunked` with a small `Content-Length` would make h11 ignore the
length, so the gate refuses any chunked request. Login CSRF on `POST /join` (fixed with
`Sec-Fetch-Site`). `Store` opens one connection per operation, so it needs no close method. The
module-state grep in the brief uses `\w` and `\s`, which macOS ERE misses; the rescan found no
per-owner state. `knowledge/proposed/` is shared, read only by the CLI, and not on the volume.

**Not checked:** that Railway's edge forwards `Content-Length` (if it re-chunks, every POST gets 411, so
try an upload first after deploying). Real memory per live owner.

**Measure** (`measure.sh --tests`):

```
lines   engine=7654  server=11017  web=7882
tests   js=3847  py=7251
homes   engine_procs=2  stage_in_python=1  llm_callers=3  py_step_branches=58  py_tuning_consts=5  lim_fallbacks=5
deps    py=9  web=4
stack   runtimes=3  deploy_files=1  owner_columns=0
debt    3 ponytail: markers
dead    6 engine exports with no production caller: REF tableEdits smoothPreview STEP_KEYS carWords parseDriveStart
speed   npm_test=21s  pytest=49s
```

**Next, in order:**

1. Delete: items 2 and 3, `langchain-openai`, and `deploy_units` in `measure.sh` (done)
2. One container, one URL: static export served by FastAPI, Railway service with a volume (done)
3. Owners: invite link, one app instance per owner, upload limit, model cap, first-run notice,
   and a test that one owner can't reach another's car (done)
4. Deploy, then invite 5–10 owners. Track the proving Drive after a Flash, and what they asked.
   This is the owner's step: it needs their Railway account and their invitees
5. The top 10 (done, ahead of step 4 at the owner's call; scorecard in "Top 10, part 3 done")

**Independent review of steps 1–3 (2026-11-06):** suites rerun: 244 JS and 466 Python pass, `tsc`
clean. A replay of the nine drives, old engine against new, is byte-identical. A live gate on port
8765 gave 401 on every route without the cookie, kept Ben's car empty after Ann's upload and chat,
and returned 413 to a real browser for a 21 MB file, with the next upload working. No secret
in the logs. No Must fix or Should fix findings.

**Accepted risks:**
- `POST /join` allows a request with no `Sec-Fetch-Site`. Only a browser older than about 2023
  sends none, and the attacker would have to be an invited owner, since it needs a real secret.
  Refusing those requests would lock out owners on old phones.
- A disconnected `/api/ask/stream` turn that outlives the idle stop could leave one Node process
  until the next redeploy.

**Before inviting anyone:** on the first deploy, try one upload (see "Not checked" above), and check
whether Railway Hobby backs up the volume. Have the notice wording read by someone who knows the law
where the owners live. None of this has been verified.

## Top 10, part 1 done (2026-11-07)

Items 8, 6, 1 and 7 from `review-r1.md`. Replies did not change through items 6, 1 and 7: the fixture
test passed after each with no refresh. Suites: 246 JS and 469 Python pass, `tsc` clean, the browser
e2e passes with no key, and `next build` takes 8 s and leaves the fixture out of the page.

**Before** (`measure.sh --tests`, `py_step_branches` as the old regex counted it):

```
lines   engine=7654  server=11017  web=7882
tests   js=3847  py=7251
homes   engine_procs=2  stage_in_python=1  llm_callers=3  py_step_branches=58  py_tuning_consts=5  lim_fallbacks=5
deps    py=9  web=4
stack   runtimes=3  deploy_files=1  owner_columns=0
debt    3 ponytail: markers
dead    6 engine exports with no production caller: REF tableEdits smoothPreview STEP_KEYS carWords parseDriveStart
speed   npm_test=22s  pytest=58s
```

**After:**

```
lines   engine=7675  server=11015  web=8018
tests   js=3884  py=7401
homes   engine_procs=1  stage_in_python=0  llm_callers=3  py_step_branches=4  py_tuning_consts=5  lim_fallbacks=7
deps    py=9  web=4
stack   runtimes=3  deploy_files=1  owner_columns=0
debt    3 ponytail: markers
dead    5 engine exports with no production caller: REF tableEdits smoothPreview carWords parseDriveStart
speed   npm_test=22s  pytest=54s
```

**Corrected branch count.** 58 counted part names and reply keys. The new regex counts real step-key
branches: 13 at `c80b029`, 4 now. Importing `kta_server.copy` went from about 64 ms to about 30 ms.
`lim_fallbacks` rose from 5 to 7 with no new number: the two literals behind `drive_recipe`'s old `at()`
wrapper are now visible to the regex. Item 5 deletes them.

**Shipped:**

- Item 8: `web/fixtures/replies.fixture.ts`, 400 KB. It holds 11 cards, 8 `/api/state`s and 4 typed
  answers. Cut to fit: harness inputs and outputs are digests on every card, and 7 of the replay's
  states are digests only, so a change to any of them still fails the test. Two runs are byte-identical.
- Item 6: `data/car-words.json`, read by the engine and by `copy.py`. `KTA.carWords` is byte-identical.
- Item 1: `KTA.carStage`, the worker's `stage` op, `safety: true` on four `STEP_JUDGES`, ADR 0010. Old
  and new agreed on 122,472 hand-built cases plus every replayed state before `stage_of` was deleted.
- Item 7: `STEP_WORDS` in `copy.py`, `stepKeys` in `ping`, a contract test that fails both ways.

**Drift the compiler found** (all types behind the server, none a blank card): `nextStep.kind` had no
`"change"` (the Flash readback's recheck step). `OpenStep.id` is null on a step the engine has just
opened. `DriveRow.started_at`, `verdict` and `AskAnswer.window` can be null, and `calibration.text` can
be absent. Undeclared keys on `ReplyCard` (`afterFlash`, `windowDrives`, `windowSince`), `FlashPlan`,
`KTunerGroup.tableIds`, `readback`, pictures (`numbers`, `momentIndex`, `moments`), levers, `ProfileDraft`,
`AskAnswer` and most of `LoopState`. The unused snapshot `LoopState` and `DriveSummary` are deleted.

**One real flake fixed, one reply order made fixed.** Two questions from one reply could swap places in
"Waiting for you" when a millisecond fell between them (`ORDER BY asked_at, id`). It is now `asked_at, rowid`,
always the order they were asked, which is what two existing tests pin.

**Left on purpose, decisions and not words:** `loopstate.one_next_step`'s `key == "tooShort"` (a Too-short
line is never replaced) and `next_step_card`'s `channels_open` (reads another step's state to add a line).
`tooShort` and `none` in `next_step_card` are word choices, but they aren't step kinds, so the contract
test's key list doesn't hold them.

**Not in the fixture:** `verify` (the replay's fixed clock is older than the Drives), and the `map_grid`,
`maf_gap`, `baseline` and `cant-tell` pictures. `carStage`'s `verify` has engine tests. The picture types
were read against `pictures.py` by hand.

**Next:** the owner's step 4 above, then the rest of the top 10 in order.

## Top 10, part 2 done (items 5 and 4)

Measured with `.scratch/eng-loop/measure.sh --tests` after item 4 (before: server 11013 lines, `llm_callers=3`, pytest 474 pass):

```
lines   engine=7673  server=11008  web=8018
tests   js=3892  py=7482
homes   engine_procs=1  stage_in_python=0  llm_callers=1  py_step_branches=4  py_tuning_consts=0  lim_fallbacks=0
deps    py=9  web=4
stack   runtimes=3  deploy_files=1  owner_columns=0
debt    3 ponytail: markers
dead    4 engine exports with no production caller: REF tableEdits smoothPreview parseDriveStart
speed   npm_test=22s  pytest=50s
```

`llm_callers` read 0 because the grep misread a one-file result; `measure.sh` now counts the line directly and reads 1.

**Shipped:**

- Item 5: `72005a7` pins all six Stages in `web/fixtures/replies.fixture.ts` and removes `KTA.carWords`. `9e21dbc` moves
  the numbers `copy.py` held into `data/thresholds.json`, each with a source, and `lim()` raises on a missing path.
- Item 4: `kta_server/llm.py` holds the provider call (`post_chat`), `caller_for`, `message_of`, `tool_calls_of`,
  `extract_thinking`, `strip_thinking`, `wrap` and `tool`. `agent.py`, `chat.py`, `owners.py` and `scorecard.py` use it;
  `_post_chat`, `_params`, `_fn` and the copied `_wrap` are gone. Model callers: 3 to 1. The scorecard's judge call (no tools) also goes
  through `post_chat`, which leaves `tools` out of the body when the list is empty.
- Also: a stopped engine no longer blames the owner's file (`copy.unreadable_line`): `unreadable-csv` and `engine-error` keep
  the file sentence, every other worker code says the engine is down and the file is fine.

**Tool loops: not unified.** `run_agent` and `chat_turn` share only five lines (call, read the message, thinking, append the
assistant turn, read the tool calls), now all helpers. The rest is each loop's own verify, repair-once, `submit_reply`,
handoff and result rules; a shared `tool_loop` would need a callback for each, which is more code than two short loops.
`MAX_CALLS` stays 12 and 8.

**Values with no outside source** (`basis: judgement` in `data/thresholds.json`, for the Tuner to check):

- `log_brief`: 10 Hz, 600 s of moving time and ECT 80 C. The rate and moving time are "the panel's own bar, with no outside
  source"; the 80 C warm engine is a civic-x tip.
- `readback`: `rpm_tol` 30 rpm, `match_psi` 0.3, `band_psi` 1.5. "App choice, no outside source".
- `calibration_slot`: 2 (Tune 2), from ADR 0007 and the downpipe research, not a measurement.

## Top 10, part 3 done (items 9 and 10)

`measure.sh --tests` after (before: `npm_test=22s  pytest=50s`):

```
lines   engine=7691  server=11008  web=8018
tests   js=3911  py=7438
speed   npm_test=6s (budget 15)  pytest=44s (budget 90)
```

**Shipped:**

- Item 9, `5b1cb08`: `toNum` fast path, `splitLine` plain split, `rollingMedian` sliding sorted window, `quantile` typed-array sort.
  Profile of `car.test.js` before: `toNum` 4.6 s, `rollingMedian` 2.6 s, `finite` 2.1 s, `quantile` 1.5 s, `splitLine` 1.3 s.
  Proof: old and new engines equal under `Object.is` on 5.8 M checks, and the nine-drive worker replay is byte-identical (`cmp`).
  One ingest (median of 6): aug30-1601 296 to 161 ms, sep01-0813 212 to 119 ms. Two permanent pins in `test/engine.test.js`.
- Item 10, `9f2e882`: the two round files are folded into the behaviour files (475 Python tests before and after); `car.test.js`
  builds the owner-drives state once (it re-read 16 drives four times); `drive.test.js` replays the two ticket-02 sweeps once;
  `measure.sh --tests` prints each budget and exits 1 when over.
- Left alone: `finite` (still used by other callers; `quantile` no longer calls it).

### Round 1 against the targets (`review-r1.md` section 7)

| Metric | Round-1 target | Now | |
|---|---|---|---|
| Source lines engine / server+worker | engine 8,000 / server 10,500 | 7,691 / 11,008 | engine met, server missed (baseline 10,713) |
| Test wall JS / Py | 10 s / 55 s | 6 s / 44 s | met |
| Test CPU JS / Py | down | JS user about 20 s (was 52); Py user 227 s (was 220) | JS met, Py not down |
| Second homes (A to G) | 2 | 1: only B is left (the frozen English the ask tools read). A, C, D, E, F and G are closed | met, counted by reading the code |
| Processes that load the engine | 1 | 1 | met |
| LLM loops / raw model callers | 1 / 1 | 2 / 1 | callers met, loops missed (two short loops kept on purpose) |
| Python tuning constants / lim fallbacks | 0 / 0 | 0 / 0 | met |
| Python step-name branches | 10 | 4 | met |
| Server deps | 9 | 9 | met |
| Engine exports with no prod caller | 3 | 4 (REF tableEdits smoothPreview parseDriveStart) | missed by 1 |
| Touches to add a step kind | 3 | 3 by design (`STEP_JUDGES`, `STEP_WORDS`, a thresholds row); no step kind has been added yet | not proven |
| `ponytail:` markers without trigger | 0 | 0 by a crude grep | met |

**Independent review (2026-11-07):** suites rerun: 249 JS and 475 Python pass, `tsc` clean. `car.test.js` no
longer reads the owner's iCloud Desktop folder; it uses the bundled drives only.

**Open: one e2e failure, cause unknown.** One browser e2e run failed two steps (upload reply order and the work row),
and the same build passed all 12 on a rerun. Five later runs through the invite gate, one fresh owner each on one
server, all passed. Not reproduced, so not explained. If an owner sees a reply out of order, start here.

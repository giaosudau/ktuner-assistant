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
5. Then the top 10 in the `review-r1.md` §7 order, with whatever owners hit first going ahead
   of it. Item 1 (Stage) and item 8 (contract check) are next by default

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

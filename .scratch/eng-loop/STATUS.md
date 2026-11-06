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

**Next, in order:**

1. Delete: items 2 and 3, `langchain-openai`, and `deploy_units` in `measure.sh` (done)
2. One container, one URL: static export served by FastAPI, Railway service with a volume (done)
3. Owners: invite link, one app instance per owner, upload limit, model cap, first-run notice,
   and a test that one owner can't reach another's car
4. Invite 5–10 owners. Track the proving Drive after a Flash, and what they asked
5. Then the top 10 in the `review-r1.md` §7 order, with whatever owners hit first going ahead
   of it. Item 1 (Stage) and item 8 (contract check) are next by default

**Debt:** `server/kta_server/profile.py:189` `ponytail:` marker has no upgrade trigger.

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

**Stack decided 2026-11-06** (`stack-r1.md`, "Final call"): keep today's stack and ship to 5–10
real owners on one small box. The Next.js port waits until 5 owners each upload a proving Drive
after a Flash. The spike stays valid as evidence: the engine runs in a Next.js route, with
214–260 ms ingest on a 1.95 MB drive, and the `window` shim crashes Next.js server code.

**Next, in order:**

1. Delete: items 2 and 3, `langchain-openai`, and `deploy_units` in `measure.sh`
2. One container, one URL: static export served by FastAPI, Railway service with a volume
3. Owners: invite link, one app instance per owner, upload limit, model cap, first-run notice,
   and a test that one owner can't reach another's car
4. Invite 5–10 owners. Track the proving Drive after a Flash, and what they asked
5. Then the top 10 in the `review-r1.md` §7 order, with whatever owners hit first going ahead
   of it. Item 1 (Stage) and item 8 (contract check) are next by default

**Debt:** `server/kta_server/profile.py:189` `ponytail:` marker has no upgrade trigger.

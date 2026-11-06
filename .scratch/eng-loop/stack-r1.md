# Stack review: light, cheap, one person can run it

Panel: **Backend**, **Frontend**, the **Ponytail Review Engineer**, and the **Software
Engineering Architect**, who guides the debate and makes the call. Measured on `a3ecbbb`, 2026-11-06. Vendor limits were read from
vendor pages the same day; re-check them before relying on them.

This sits above the top 10. It decides what the code is written in, so it changes some of them.

---

## Final call (Engineering Lead, 2026-11-06)

**Do not port yet. Ship today's stack to 5–10 real owners on one small box. Port only if they
come back.** This reverses the panel's order: option B stays the destination if the trigger
below fires, and option A ships first.

**Why:**

- **The biggest risk is the market, not the stack.** No outside owner has used this, and
  `PRODUCT.md` records no real user interviews. A port of about 10k lines changes nothing an
  owner sees.
- **The port's cost advantage is small.** Vercel Hobby is non-commercial, so the first paying
  owner means $20 a month. Railway Hobby is a $5 minimum plus usage (read 2026-11-06). We
  estimate $5–15 a month for a small beta, not measured. This gives up the $0 goal on purpose.
- **Six of the ten review findings exist only because of the move:** 3 to 8. Finding 10 is a
  scoreboard cleanup. That leaves 1, 2 and 9, and one design below closes 1 and 9.

**The beta design:**

- **One container, one URL.** Next.js static export served by FastAPI on the same origin. No
  CORS. `NEXT_PUBLIC_SERVER_URL=""` and `NEXT_PUBLIC_AGENT_URL="/agent"` make the web calls
  relative. One Railway service with a volume, deployed by `git push`.
- **One app instance per owner.** `create_app` already takes its settings and store, so a
  dispatcher of about 30 lines maps a signed-in owner to their own instance: one database file,
  one chat file, one worker. No SQL edits, and the log cache can't cross owners. Idle instances
  shut down to save memory, because `loadLog` re-reads the stored CSV.
- **Invite links, no sign-in provider.** `/join/<secret>` sets an HttpOnly cookie. Every other
  route needs that cookie.
- **Caps (AD-10).** Upload byte limit while reading (finding 2), and model calls per owner per
  day. When capped, the built-in reply still works.
- **A first-run notice.** The owner flashes their own engine at their own risk. Update
  `PRODUCT.md:43`, which still says one owner with no login.

**Not checked:** several `create_app` instances in one process, including running their
lifespans under a dispatcher. Real memory per owner on Railway. `next build` with
`output: "export"`. Volume backups on the Hobby plan. Legal wording of the notice.

**Port trigger.** Start option B only when **5 owners each upload a proving Drive after a
Flash**, within 4 weeks of the first invite. If that does not happen, fix the product and leave
the stack alone. Before option B starts, re-check the vendor limits and fold in findings 3 to 8.

**Status of decisions:** AD-10 is accepted, with a database per owner in place of an owner
column. AD-8 and AD-9 are deferred to the port. ADR 0002 stands, and this needs no superseding
ADR unless the trigger fires. Write one small ADR for the per-owner instance when it ships.

---

## The proposal (option B, deferred by the call above)

**Make it one Next.js app in one language, deployed with `git push`.**

```
Today                                       Proposed
browser: Next.js (static page)              browser: the same page
   | AG-UI + NDJSON + CORS                     | one NDJSON stream, same origin
Python: FastAPI + LangGraph + words         Next.js route handlers: words, checks, LLM
   | stdin/stdout NDJSON                       | a function call
Node: worker.js + engine                    engine/ (unchanged, a plain library)
   |                                           |
SQLite file on local disk                   libSQL: a local file in dev, Turso when hosted
```

Three runtimes and a local disk become one runtime and a database URL. **The engine, its
rules, its tests and the vision do not change.** Python's wording, checking and memory move to
TypeScript, gated by a replay that must match.

This supersedes ADR 0002 and needs an ADR before any port work starts. It also changes one
product line: `PRODUCT.md:43` says "One car, one owner, local-first (no login, SQLite)".

---

## What we measured

| Fact | Number | What it means |
|---|---|---|
| Web pages that need a server | 0 (`next build`: `/` is static) | The web already deploys anywhere |
| `next build` | 8 s, 195 kB first load | The front end is not the deploy problem |
| AG-UI client in the page | 50 kB gzipped, about a quarter of first load | Pays for a protocol we have twice |
| Python third-party imports | fastapi, langgraph, langchain_core, httpx, dotenv, aiosqlite, ag_ui | **No numeric or data library.** Python's ecosystem gives this product nothing the platform lacks |
| Deploy files in the repo | 0 | Never deployed; no migration or live users to protect |
| Largest real drive | 1.95 MB CSV, 259 kB gzipped (7.5×) | Fits under Vercel's 4.5 MB body limit, with room when gzipped |
| Tenancy | `car_state` is `CHECK (id = 1)`, no auth, 0 owner columns | Today a public URL would give every visitor the same car |

**Spike, in the scratchpad, repo untouched.** `worker.js`'s `OPS` table called from a Next.js
production route, on a real 1.95 MB drive sent gzipped and unzipped with the native
`DecompressionStream`:

| | Result |
|---|---|
| Change to the op table | None. Removed the stdin loop, made the `require` paths static |
| Engine load | 11 ms |
| `ingestUpload` | 214–260 ms |
| Route bundle | 528 kB |
| Process memory | 238–290 MB, growing with the log cache (Vercel Hobby allows 2 GB) |

The spike also found a real blocker: **`globalThis.window = {}` crashes Next.js server code**
(`Cannot destructure property 'protocol' of 'window.location'`). Round 1 item 2 (delete the
browser-era text and the shim) is therefore a prerequisite, not just cleanup.

**Not tested:** a real Vercel deploy, Turso latency, the full upload path with SQL and LLM.
The first port slice must deploy to a preview URL to prove these.

---

## The options

| | A. Keep it, rent one box | **B. One TypeScript app** | C. All Python | D. Engine in the browser |
|---|---|---|---|---|
| Runtimes | Python, Node, browser | **Node, browser** | Python, browser | browser, thin server |
| Vercel | Web only | **Yes** | Yes, but the engine is rewritten | Yes |
| Free hosting | No: Render free loses local SQLite on spin-down | **Yes** | Yes | Yes |
| Rewrites | None | **Server (about 10k lines)** | **The engine, the tested core** | LLM tools cross to the browser |
| Risk to verdicts | None | **None: engine unchanged** | High | Low |
| Time to add a feature | Unchanged: 3 languages | **1 language** | 2 languages | 1 language |

- **A is the honest runner-up.** A Dockerfile and a small paid box with a disk would ship the
  fastest, with no port. It keeps every maintenance cost you asked to remove and misses the
  free-tier goal. Choose A only if a live product is needed before the port can finish.
- **C** rewrites the one part that must not move. ADR 0002 already rejected it.
- **D** was the old browser app. ADR 0002 left it because a key can't be protected and phones
  lose data. Those reasons still hold. B keeps D possible later, for parsing only, because the
  language is the same.

Note on ADR 0002: its options were "port the engine to Python" and "stay in the browser".
**Moving the server to JavaScript was never considered**, and its main reason, "a LangGraph
harness can't run there", no longer pulls weight (see LangGraph below).

---

## The panel debate

### Backend

- **For:** the worker protocol exists only because two languages share a process boundary.
  Removing it deletes process management, the request queue, and the extra `node` launch in
  `copy.py`. Item 6 stops being needed.
- **For:** tests get cheaper. Python spends 220 s of CPU, with a worker per test. In-process,
  one memoised replay serves a whole file.
- **Worried:** a port is where quiet bugs live. Python's `round()` is banker's rounding and
  `f"{x:.1f}"` is not `toFixed`. These words carry numbers an owner may type into an ECU.
- **Worried:** today one asyncio lock serialises all engine calls. Serverless has no such lock:
  two uploads can read the same Car history and one overwrites the other.
- **Asks:** port by slices behind a golden replay. Guard the Car history write with
  compare-and-swap.

### Frontend

- **For:** the page is already static, and same-origin removes CORS and `NEXT_PUBLIC_*_URL`.
  Types can be shared directly instead of being hand-kept in `types.ts`, which closes second
  home G better than AD-6's fixture alone.
- **For:** two stream protocols exist today: AG-UI in `useChat.ts` and NDJSON in `api.ts`. Keep
  NDJSON. That removes `@ag-ui/client` (with rxjs, zod and more) and about 50 kB from the first
  load. It should also shrink `useChat.ts` (778 lines).
- **Challenged Next.js itself.** With no server rendering, Vite + Hono would be lighter
  (`next` is 278 MB of the 382 MB `node_modules`).
- **Conceded:** changing framework costs real work and gains nothing an owner sees. Route
  handlers give one dev command and zero-config deploys.

### Architect (guide)

- **Vision check.** "One truth per thing" gets stronger: the worker boundary, the AG-UI stream
  and the second chat store are themselves second homes. Nothing moves out of `engine/`.
- **On ADR 0003**, where the Tuner's concern matters most: every map change must be checked by
  code written separately. What protects the owner is **independence, not a different
  language**. So `mapcheck.ts` imports nothing from `engine/`, reads `thresholds.json` itself,
  and a test fails if that ever changes. The generated disagreement cases stay. Frozen Python
  answers gate the port.
- **The call:** B, but **shrink first, gate second, port third.** Rewrites kill indie products
  when they run open-ended, so every slice ends green and the Python server stays until the
  replay matches. If the port stalls, A is still available.

### Ponytail Review Engineer

Ran `/ponytail:ponytail-review` on this proposal and traced the code it touches. Assumed load:
a small beta with few owners. **Findings are open: the sections below do not include them yet.**

| # | Group | Finding | Smallest fix |
|---|---|---|---|
| 1 | Must fix | The log cache is keyed by Drive id, and that id comes from the file name. A renamed file can replace another owner's cached log (`worker.js:84-93`, `kta-car.js` `carIdentity`) | Key the cache by owner and Drive id |
| 2 | Must fix | Nothing caps upload size (`app.py:154`). A small gzip can unpack past the 2 GB memory limit | Stop unpacking at a set byte limit |
| 3 | Should fix | Previews are public from step 6, and sign-in only arrives at step 13 | One shared-secret check from step 6; no model key until sign-in |
| 4 | Should fix | The no-key gate never runs the model path, so a loop that skips verify would pass | Port `server/tests/seam1/test_llm_agent.py` with step 10 |
| 5 | Should fix | Screenshots are allowed up to 6 MB (`screenshot.py:37`), but Vercel stops at 4.5 MB | Shrink the picture in the browser and cap at 4 MB |
| 6 | Should fix | Knowledge cards are listed from a folder at runtime (`knowledge.py:179`) and may not ship in the function bundle | Import a generated JSON file |
| 7 | Should fix | Step 12 deletes files that JS tests and tools read, and it contradicts the `scorecard.py` plan | Move or rewrite these before the delete |
| 8 | Should fix | "About 57,000 ingests" counts CPU only. Memory time runs out sooner during model waits | Publish both limits |
| 9 | Should fix (lean) | `owner_id` touches 46 SQL statements, and one miss exposes a car | One database per owner: `Store` already takes a path |
| 10 | Nice to have | `deploy_units` in `measure.sh` always equals `runtimes` minus 1 | Remove `deploy_units` |

Checked and dropped: the log cache's memory. 28 uploads stopped at 393 MB, because the cache
holds 24 logs at most.

### Disagreements the Architect settled

| Question | Backend | Frontend | Call | Why |
|---|---|---|---|---|
| Next.js or Vite + Hono | Either | Liked Vite | **Next.js** | Already built, 8 s build, zero config |
| LangGraph.js | Against | No view | **Plain async generators** | The graph is two short linear paths; `graph.py` already rejected `interrupt` |
| Vercel AI SDK or `fetch` | `fetch` | Liked the SDK's hooks | **`fetch` in `llm.ts`** | The loop exists, with thinking blocks and repair-once. Revisit for a non-OpenAI wire format |
| Turso or Postgres (Neon) | Turso | No view | **Turso** | Same SQL as today's schema, a plain file in dev, no Docker |
| Raw CSV storage | Object storage | No view | **Gzipped in the row** | One store. Add object storage only when storage is the limit |
| Accounts now or later | Now | Later | **Owner column now, sign-in at launch** | A column is cheap today and painful after data exists |

---

## Why LangGraph, AG-UI and the checkpointer go

- **LangGraph:** `graph.py` draws `chat -> suggest` and `ingest -> decide -> agent -> reply`.
  Nothing pauses, resumes or branches beyond the first choice.
- **Checkpointer:** chat is stored twice, in LangGraph's checkpoint tables and in
  `thread_messages`. Keep `thread_messages`.
- **`langchain-openai`:** never imported.
- **What we give up:** durable resume mid-graph, which nothing uses. The fallback already exists:
  if the model fails, the built-in reply stands.

---

## Where it runs and what it costs

| Stage | Hosting | Data | Monthly |
|---|---|---|---|
| Build and free beta, no charge | Vercel Hobby | Turso free | **$0** + model use |
| First paying owner | Vercel Pro (Hobby is non-commercial only) | Turso free | **$20** + model use |
| Prefer not to pay Vercel | Netlify or Deno Deploy (need a test deploy first) | Turso free | $0 |

**Free capacity, calculated from the limits above and the spike. Not load tested.**

| Limit | Allowance | Capacity |
|---|---|---|
| Vercel Hobby Active CPU | 4 hours | About 57,000 ingests at 250 ms, before other work |
| Vercel request body | 4.5 MB | About 33 MB of raw CSV when gzipped in the browser |
| Vercel duration | 300 s | Enough, but see the budget rule below |
| Turso storage | 5 GB | About 19,000 gzipped drives, before other data |
| Turso writes | 10 M rows | Far above expected use |

**The model is the real variable cost,** and a public URL makes it anyone's to spend. Hence the
per-owner spend cap below. The built-in reply means a capped owner still gets a working answer.

**Rejected hosts for the server:**
- Cloudflare Workers Free: 10 ms CPU against a 250 ms ingest. Paid gives 30 s, but 128 MB per
  isolate is below the 180 MB the worker alone used on one drive.
- Render Free: spins down after 15 minutes, about a minute to wake, loses local files, and free
  Postgres expires after 30 days.
- Fly.io and Railway: no lasting free tier for this use.

**Vendor note:** Turso's pricing page says it is joining Supabase. The exit is cheap because
this is plain SQLite SQL and the data exports to a file.

---

## New architecture decisions

| AD | Decision | Why it is simpler |
|---|---|---|
| **AD-8 One language, one deploy** | Everything at runtime is JS/TS in one Next.js app. `git push` deploys it; a preview URL per branch. | One test runner, one dependency tree, no process boundary |
| **AD-9 Stay portable** | Standard Web APIs and Node only. No Vercel-only storage, queues or workflows in the core. The database is a URL. | Leaving Vercel is a config change, which caps vendor risk |
| **AD-10 Hosted means owned and capped** | Every row has an owner. A signed-in owner sees only their own car. Model calls are capped per owner per day. | Closes the two ways a public URL hurts: data exposure and open-ended spend |

Changes to existing decisions: AD-3 `copy.py` -> `copy.ts`. AD-4 `Worker.limits` -> direct
`LIMITS`. AD-5 `llm.py` -> `llm.ts`. AD-6 is partly replaced by shared types, with the replay
kept as the gate. AD-1, AD-2 and AD-7 stand.

**Taste rules for an indie product** (now in `LOOP.md`):
- No new service while a table or a file will do.
- No new dependency for a few lines of code.
- Nothing runs when nobody is using the product.
- Any new feature must deploy with `git push` and no new console.

---

## What must survive the move

These are the ways this port can really hurt someone. Each one has a check.

| Risk | Guard |
|---|---|
| Different rounding or formatting changes a number the owner reads | Golden replay of the nine drives with no key, compared exactly |
| The second map check quietly stops being independent | Test: `mapcheck.ts` imports nothing from `engine/` |
| Two uploads overwrite one Car history | Compare-and-swap on the state row, with a test that races two writes |
| One owner reads another's car | Every query takes `owner_id`; a test tries to cross owners on every route |
| Long model loop hits the 300 s limit mid-reply | Deadline of about 240 s, then the built-in reply stands |
| Log cache is gone on a new instance | Already handled: `loadLog` re-reads the stored CSV (worker rule 1) |
| Public upload endpoint abused | Auth, size cap and CSV validation before parsing |

---

## Build order for option B (only if the port trigger fires)

**Phase 0: shrink what would be moved. Useful under any stack.**
1. Item 2: delete Vietnamese text and the `window` shim (the spike proved this is required)
2. Item 3: delete dead engine exports
3. Item 1: Stage into the engine, so it is never ported
4. Item 5: numbers into `thresholds.json`, so they are never ported

**Phase 1: build the gate.**
5. Item 8, grown: record every reply for the nine drives, with no key, from today's Python.
   Normalise ids and times. This fixture is the port's definition of done.

**Phase 2: port, one slice at a time. Each ends green and matching the gate.**
6. Engine as a library behind route handlers; **first preview deploy, proving the untested
   points above**
7. `db.ts` on libSQL, same schema, `owner_id` added, compare-and-swap
8. Words and decisions: `copy.ts`, `desk`, `flash`, `questions` and the rest, with `STEP_WORDS`
   built in from the start (item 7)
9. `mapcheck.ts` and `verify.ts`, written separately, against the frozen answers
10. `llm.ts`, chat and upload as async generators on one NDJSON stream (item 4); remove AG-UI
11. Port tests by behaviour, in-process, with budgets (item 10)
12. Delete `server/`

**Phase 3: go live.**
13. Sign-in, per-owner spend cap, upload limits, production deploy

**Cancelled:** item 6 (engine words through `ping`): a direct call replaces it. Interim
`llm.py`: written once, in TypeScript. **Moved later:** item 9, the hot path. Ingest is already
about 250 ms, so it now matters for test speed more than for owners.

**Stays in Python, dev-only:** `tools/knowledge-graph.py` and `kg_reason.py` do not run in
production. `scorecard.py` (833 lines, evals) moves last, or is reduced to what is still used.

**Stop rule.** If Phase 2 stalls or the gate cannot be made to match, stop and ship option A.
The Phase 0 work is not lost.

---

## How we will know it worked

| Metric | Today | Target |
|---|---|---|
| Runtime languages | 3 | 2 (TS/JS on the server and in the browser) |
| Things to deploy | 2 (web + server), neither configured | 1 |
| Runtime dependencies | 14 (10 Python, 4 web) | 4 or fewer |
| First-load JS | 195 kB | 150 kB or less |
| Commands to run locally | Python server + web | `npm run dev` |
| Hosted monthly cost before revenue | Not deployable | $0 + model use |
| Server line count | 10,713 | 8,000–9,000 (an estimate, to be measured) |
| Files touched to add a step kind | Not measured | 3 |

---

## Sources

- [Vercel Functions limits](https://vercel.com/docs/functions/limitations)
- [Vercel fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel pricing](https://vercel.com/pricing)
- [Turso pricing](https://turso.tech/pricing)
- [Neon plans](https://neon.com/docs/introduction/plans)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Render free services](https://render.com/docs/free)
- [Hosting free tiers compared, checked September 2026](https://flaviocopes.com/hosting-free-tiers/)

# The engineering loop

The sibling of `.scratch/ux-loop/LOOP.md`. That loop improves what the owner **sees**. This one
keeps the code that produces it **small, single-homed and fast**, so the UX loop's next ten
items are cheap to build. One run = one **Engineering Round**. Every run reads this file first
and `STATUS.md` second, and leaves `STATUS.md` ready for the next run.

## Vision (fixed; rounds change details, never this)

> **One truth per thing.** The engine decides, the server words and checks and remembers, the
> web lays out. Every decision, number, word and contract has exactly one home. Adding or
> removing a feature touches that one home per layer, and a test names what you forgot.
>
> **Light enough for one person.** This is an indie product: useful, simple, with taste. One
> deploy, cheap to run until it earns, and real owners before any rewrite. If a choice makes it
> harder to work on, it needs a very good reason.

Architecture decisions AD-1…AD-7 (`review-r1.md` §3) and AD-10 (`stack-r1.md`) are how the
vision holds. AD-8 and AD-9 wait for the port trigger in `stack-r1.md`. To change one, the round writes an ADR in `docs/adr/` first. An item
that needs to break one is a debate, not a commit.

## The team (each run writes its debate in their voices)

| Role | Asks, every run |
|---|---|
| Principal Software Engineer (lead) | Which second home grew since last round? What can we delete? Is the core (engine rules, map checks, verify) still pure and tested? Smallest diff that closes it. |
| Principal AI Engineer | Does the LLM still only orchestrate (ADR 0005)? One tool loop, one model client, verify outside the loop, built-in reply with no key. Prompts and tool tables small and reviewed. |
| Principal Tuner (KTuner) | Are numbers bit-identical after a refactor? Every threshold in `thresholds.json` with a source? KTuner/TunerView names spelled exactly? Safety rules in the engine, not in wording code? |
| KTuner shop | Can I add or remove a check for my customers in one afternoon? When a customer asks "why does it say X", is there one place that answers? |

**The stack panel** meets whenever a round adds a dependency, a service or a runtime, or a free
tier limit changes:

| Role | Asks |
|---|---|
| Backend | Does this deploy with `git push`? Does it run when nobody is using it? What does one more owner cost? Could a table or a file do this? |
| Frontend | What does it add to first-load JS? Does the page still work from any static host? Is this a second protocol or a second store? |
| Software Engineering Architect (guide) | Which AD does it serve? Can one person hold it in their head? What is the exit if the vendor changes terms? Makes the call and writes down why. |
| Ponytail Review Engineer | Runs `/ponytail:ponytail-review` on the proposal and traces the real code it touches. Is it correct, safe, fine at the expected load, tested, fast, lean? Every finding names a concrete case and the smallest fix. Speaks last, before the Architect's final call. |

## Architecture first, details second

Every round runs top-down and never skips a level:

1. **Vision check.** Does any change since last round make a second home or make the product
   heavier? Look at the "second homes" table A–G in `review-r1.md` §2, plus anything new
   `measure.sh` shows.
2. **Stack check.** Same languages, same single deploy, same free-tier fit? Anything new goes
   to the stack panel first.
3. **Decision level.** Which AD does each finding fall under? A finding that fits no AD is
   either a new AD (write it, debate it) or noise (drop it).
4. **Detail level.** Only now: files, lines, tests.

## The cycle (never skip a phase)

1. **Measure.** Run `.scratch/eng-loop/measure.sh --tests` and paste the output into
   `STATUS.md` as "before".
2. **Audit.**
   - `/ponytail:ponytail-audit` (whole repo, over-engineering only: delete / stdlib / native /
     yagni / shrink).
   - `/ponytail:ponytail-review` on the diff since last round.
   - `/ponytail:ponytail-debt` for the ledger of deliberate shortcuts.
   - A normal correctness review (`/code-review`) for bugs, which ponytail does not hunt.
3. **Trace.** Before touching a function, list every caller (`codegraph_callers` /
   `codegraph_impact`). Fix at the shared root, never per caller.
4. **Debate.** The SE leads and each role speaks. Disagreements stay on the page with the call
   and why. Output: `review-rN.md`.
5. **Decide.** Score each candidate 1–3 on four axes:
   - protects the core
   - removes a second home
   - lines cut
   - risk (3 = lowest)

   Take the top 10. Each gets: problem, fix, debate, verify, gain.
6. **Build.**
   - Test first where there is logic.
   - Before refactoring engine code that feeds a Verdict, snapshot `carReport` for the nine
     real drives; the refactor must `deepEqual` it.
   - Deletion before addition. One writer per file.
7. **Verify.** `npm test` · `cd server && uv run pytest -q` · `cd web && npx tsc --noEmit` ·
   e2e when a reply shape changed.
8. **Review.** A code-review subagent on the diff. Fix what it confirms.
9. **Docs.**
   - `README.md` and `server/README.md`: anything the round made untrue comes out (ops, files,
     deps).
   - A new or changed AD becomes an ADR.
   - Rebuild the knowledge graph (`python3 tools/knowledge-graph.py`, then `--check`).
10. **Commit.** One commit per item. The message says what got simpler (e.g. "Engine: Stage
    is decided once, in carStage").
11. **Record.** In `STATUS.md`: measure "after", what shipped with proof, what was cut and
    why, and the next round's top 10 ranked. Never leave the tree red.

## Rules that keep the vision

- **Decisions** (Verdict, Stage, Open step, Next step, map cell) live in `engine/`. Python and
  TS only read them.
- **Numbers** go `data/thresholds.json` → engine `LIMITS` → `Worker.limits`. Python holds no
  tuning number and no fallback literal. `mapcheck.py` is the one deliberate second reader
  (ADR 0003).
- **Words** the owner reads live in `server/kta_server/copy.py`, in tables keyed by step kind,
  check id or table family. Never `if key == "…"` chains.
- **The engine** is reached only through `server/kta_worker/worker.js`.
- **The LLM** is reached only through `kta_server/llm.py` (once AD-5 ships).
- **The contract** is `web/lib/types.ts`, checked by `tsc` against the replay fixture.
- Replies are pinned: `web/fixtures/replies.fixture.ts` changes only with a reason.
- **Add a feature:**
  - a new Open step kind = one `STEP_JUDGES` entry, one `STEP_WORDS` entry, one thresholds
    row; the contract test names any missing one.
  - a new card = one type in `types.ts`, one component, one `copy.py` builder.
- **Remove a feature:** delete those same homes. `measure.sh` must show no new dead exports.
- **Tests:**
  - Named by behaviour, never by round.
  - JS replays the nine drives once per file (memo + `structuredClone`); Python uses "replay
    once, assert many" and never shares a worker.
  - Budgets: JS ≤ 15 s wall, Python ≤ 90 s. When one trips, fix the slow path; never raise
    the number.
- **Shortcuts:** a deliberate one carries `# ponytail: <ceiling>, <upgrade trigger>`. A marker
  with no trigger is debt to pay next round.
- **Taste (indie rules):**
  - No new service while a table or a file will do.
  - No new dependency for a few lines of code.
  - Nothing runs when nobody is using the product.
  - A new feature deploys with `git push` and no new console.
  - Standard Web APIs and Node in the core; no vendor-only storage, queues or workflows.
  - Every model call counts against a per-owner cap, and the built-in reply always works.

## What the ponytail commands do here

| Command | What it does | When in the cycle |
|---|---|---|
| `/ponytail:ponytail-review` | Over-engineering review of a **diff**: one line per cut, ending `net: -N lines`. | Audit (diff since last round) and Review (this round's diff) |
| `/ponytail:ponytail-audit` | The same over the **whole repo**, ranked biggest cut first. | Audit |
| `/ponytail:ponytail-debt` | Collects every `ponytail:` comment into a ledger and flags the ones with no upgrade trigger. | Audit; pay at least one per round |
| `/ponytail:ponytail-gain` | Shows the plugin's **benchmark** medians. It is not a measurement of this repo. | Never as proof. Proof is `measure.sh` before/after. |

## Success (re-measured every round, `measure.sh --tests`)

A round succeeds when, compared with "before":

- no second home is added
- at least one is closed
- source lines go down or stay flat while features ship
- both suites stay inside budget, and wall time doesn't rise
- dead engine exports don't rise
- every new number has a row in `thresholds.json`
- the `stack` line in `measure.sh` gets no heavier: runtimes, deploys, dependencies

The long-run signal is **touches per feature**: count the files each UX-loop item changed. The
number should fall round over round.

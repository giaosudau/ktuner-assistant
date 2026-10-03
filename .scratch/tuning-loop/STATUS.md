# Tuning loop — issue tracker

16 tickets from `.scratch/tuning-loop/spec.md`, numbered so blockers come first.
Read `docs/adr/0004-tuning-loop-repository-layout.md` before touching code: it fixes where each
part lives and how Python, Node and the chat talk. `docs/adr/0002` (the Python harness calls the JS
engine) and `docs/adr/0003` (two map checks) still bind. Vocabulary is `CONTEXT.md`; numbers are
`docs/research/fact-check.md`.

## Status

| # | Ticket | Blocked by | Status |
|---|---|---|---|
| 01 | Upload a Drive in the chat, get a built-in reply (tracer) | — | ready |
| 02 | Engine: stop the false alarms | — | ready |
| 03 | Map version 1 is the KTuner basemap | 01 | ready (after 01) |
| 04 | Open steps and the Next step | 01 | ready (after 01) |
| 05 | Loop eval: 9 real drives, Drives to proof, Wasted drives | 04 | ready (after 04) |
| 06 | Diagnose: one cause per symptom pattern | 05 | ready (after 05) |
| 07 | Owner questions: pause, answer, resume | 03, 06 | ready (after 03, 06) |
| 08 | LLM agent with verify, repair and fallback | 04 | ready (after 04) |
| 09 | Knowledge cards and citations | 08 | ready (after 08) |
| 10 | Car profile, Install and the drive window | 03, 08 | ready (after 03, 08) |
| 11 | Ask without uploading | 09, 10 | ready (after 09, 10) |
| 12 | Thresholds file and the independent Python map change check | 03 | ready (after 03) |
| 13 | Flash step: KTuner card to a new Map version (and the History file) | 07, 10, 12 | ready (after 07, 10, 12) |
| 14 | Flash readback | 13 | ready (after 13) |
| 15 | Pictures in the chat | 08, 13 | ready (after 08, 13) |
| 16 | Model scorecard and clarity judge | 09 | ready (after 09) |

## Gates every ticket must pass before it is called done

1. `npm test` (the engine's 115 tests) stays green, unless the ticket says it changes the engine —
   then it adds tests and says which ones.
2. The ticket's own seam tests pass: `pytest server/tests/seam1` / `seam2`, plus the engine suite
   for engine work.
3. Every acceptance line in the ticket file is either ticked with the test that proves it, or the
   ticket is left open with a PM note saying why.
4. The reply copy follows the product rules: one verdict sentence first with the owner's own
   numbers, one Next step only, "Can't tell yet" always says why, KTuner names spelled exactly as
   KTuner spells them, no check names a table, no advice the app never gives.
5. Committed on the current branch with a message naming the ticket.

## Architecture review (3 Oct 2026) — refactor candidates

Done one by one, never changes what the owner reads or any verdict unless a row says so.
Each row is committed as "Refactor A<n> — …"; tests stay green; run `uv run pytest` from `server/`.

| # | Candidate | Status |
|---|---|---|
| A1 | Open-step lifecycle: one entry per step in `engine/kta-car.js` | ready |
| A4 | Banned-advice policy: shared case list, JS + Python both tested against it | done |
| A2 | Reply wording: stop spelling stamp/channel/status words in 3 places | ready (after A1) |
| A3 | Worker passes engine limits through, no renamed copy | ready (after A2) |
| A5 | Worker op surface collapse (speculative, only if A1–A3 confirm the pattern) | ready (after A3) |
| T  | Slow tests: `npm test` 63 s, pytest 43 s — find and fix the cause | ready |

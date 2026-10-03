# 05 — Loop eval: the 9 real drives, Drives to proof and Wasted drives

**What to build:** eval layer 1, which locks the loop's behaviour and measures the win on every run. It replays the owner's 9 drives in order at seam 1 (no LLM, no key) and asserts each Next step and each Open step status, then reports Drives to proof per settled step and the count of Wasted drives. It blocks merges.

Expected path without owner answers (from the prototype, Baseline-first):

| Drive | Next step | Settles |
|---|---|---|
| 22 Aug 09:03 | Drive: one Cool drive with 2 pulls | — |
| 22 Aug 09:50 | same step | Baseline: can't tell (hot) |
| 23 Aug 19:59 | same step | Baseline: can't tell (hot) |
| 23 Aug 20:38 | Flash: Undo | Stop |
| 30 Aug 15:09 | nothing read (Too-short) | Undo: can't tell |
| 30 Aug 15:29 | Drive: Cool drive with 2 pulls | Undo: Done in 2 Drives |
| 30 Aug 16:01 | Drive: Cool drive + habit opened | — |
| 1 Sep 08:13 | Drive: habit test on a hot afternoon | Baseline: Done |
| 5 Sep 07:56 | Watch: fix the dead gauges | habit: can't tell (cool) |

**Blocked by:** 04

**Status:** done (3 Oct 2026: seam-1 eval `server/tests/seam1/test_loop_eval.py`, 4 tests; full pytest 107/107, `npm test` 155/155)

- [x] The eval runs in the default test run and fails on any Next step or status change
- [x] It prints Drives to proof per settled step and the Wasted drive count
- [x] 23 Aug 20:38 never yields a knock fix or an AFM curve edit
- [x] A changed expectation needs the table above updated in the same change, with a reason

## PM notes (05 done, 3 Oct 2026)

1. **Actual Drives to proof:** Undo 2 uploads (asked 23 Aug 20:38, proven 30
   Aug 15:29 — the Too-short 15:09 counts as an upload, proves nothing);
   Baseline 7 uploads (asked 22 Aug 09:03, proven 1 Sep 08:13). Habit, logger
   and channels are never Done — still open/wait after all nine Drives.
2. **Wasted drives: 5 of 9** — 22 Aug 09:50, 23 Aug 19:59, 30 Aug 16:01 (too
   warm for the Baseline), 30 Aug 15:09 (too short for the Undo), 5 Sep 07:56
   (dead gauges for the habit). 23 Aug 20:38 is never wasted (a Stop Drive is
   a fault to fix, not a lesson).
3. **No table corrections.** Verified row by row against the post-04 engine:
   the table's shorthand reads as — 09:03 settles nothing; "Stop" on 20:38 is
   the Drive verdict (flashPlan kind undo, zero tables/cells); "Undo: can't
   tell" on 15:09 is the Wasted line naming the Undo (Too-short settles
   nothing); "—" on 16:01 means no Done (Baseline + channels wait, habit
   opened beside with `lastAskedOn === null`). The eval additionally locks the
   channels waits the table omits, so a channels regression fails here too.
4. **Lock sanity-checked:** perturbing one expectation (09:03 `same`) fails
   `test_loop_eval_locks_the_ticket_table_drive_by_drive`; reverted.

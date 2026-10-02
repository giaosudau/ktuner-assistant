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

**Status:** ready-for-agent

- [ ] The eval runs in the default test run and fails on any Next step or status change
- [ ] It prints Drives to proof per settled step and the Wasted drive count
- [ ] 23 Aug 20:38 never yields a knock fix or an AFM curve edit
- [ ] A changed expectation needs the table above updated in the same change, with a reason

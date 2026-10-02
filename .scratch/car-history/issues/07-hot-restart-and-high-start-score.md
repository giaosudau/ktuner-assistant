# 07 — Hot restart and high-start score

**What to build:**
- **Hot restart:** a drive is a Hot restart when it starts within 30 minutes of the previous drive's end (from the file start times and durations) with intake ≥ 50 °C. With no previous drive in the history, intake ≥ 50 °C at start is enough.
  - The advice "Drive 3–5 minutes before any hard acceleration" appears **only** when a hard pull started with intake above 48 °C in the first 5 minutes.
  - It is proven when the next such drive's first pull starts at 48 °C or less.
  - Hot restarts driven gently are listed under "checked and fine".
- **High-start score:** a Fuel-quality score that starts above Baseline gets the sentence "Starts high after a Flash, ECU reset or new tank: give it 10–15 calm minutes before judging" on its safety line.

**Blocked by:** 03 — Car module and Car history

**Status:** ready-for-agent
**Status:** done (detection + advice + proof + EN/VI; suite 95/95 with car/ask/build)

- [x] Aug 30 15:29 then 16:01 (13 min apart, start intake 64 °C): 16:01 is a Hot restart.
- [x] Of the owner's drives, the advice appears only on drives where a hard pull started hot within 5 minutes; the others list the Hot restart as fine.
- [x] Aug 21 21:37 (score starts 0.61) shows the high-start sentence.
- [x] The proof rule passes or fails correctly on a pair of drives with first-pull intake 51 °C → 46 °C.
- [x] New wording in English and Tiếng Việt.

Notes (local check on all 16): hot restarts on 15 Aug 09:22, 21 Aug 21:37, 22 Aug 09:03, 23 Aug 20:38, 30 Aug 15:29 + 16:01; advice only on 09:03 and 16:01. High-start sentence fires from any start above Baseline (0.50+ on 4 drives) — literal per spec, may read noisy; consider +0.05 later. `checkDrive` takes `{driveStartMs, prevEndMs}` (Car module passes both; intake-only rule without a previous drive). Proof requires the next drive to be a hot restart whose first pull starts ≤ 48 °C.

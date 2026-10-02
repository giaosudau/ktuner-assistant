# 07 — Hot restart and high-start score

**What to build:**
- **Hot restart:** a drive is a Hot restart when it starts within 30 minutes of the previous drive's end (from the file start times and durations) with intake ≥ 50 °C. With no previous drive in the history, intake ≥ 50 °C at start is enough.
  - The advice "Drive 3–5 minutes before any hard acceleration" appears **only** when a hard pull started with intake above 48 °C in the first 5 minutes.
  - It is proven when the next such drive's first pull starts at 48 °C or less.
  - Hot restarts driven gently are listed under "checked and fine".
- **High-start score:** a Fuel-quality score that starts above Baseline gets the sentence "Starts high after a Flash, ECU reset or new tank: give it 10–15 calm minutes before judging" on its safety line.

**Blocked by:** 03 — Car module and Car history

**Status:** ready-for-agent

- [ ] Aug 30 15:29 then 16:01 (13 min apart, start intake 64 °C): 16:01 is a Hot restart.
- [ ] Of the owner's drives, the advice appears only on drives where a hard pull started hot within 5 minutes; the others list the Hot restart as fine.
- [ ] Aug 21 21:37 (score starts 0.61) shows the high-start sentence.
- [ ] The proof rule passes or fails correctly on a pair of drives with first-pull intake 51 °C → 46 °C.
- [ ] New wording in English and Tiếng Việt.

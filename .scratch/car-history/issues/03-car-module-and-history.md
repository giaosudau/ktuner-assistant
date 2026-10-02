# 03 — Car module and Car history

**What to build:**
- **Remembering drives:** every drive the owner checks is remembered as a small summary in the browser. Loading a folder of TunerView logs rebuilds the Car history in time order. Checking the same drive twice (same start time from the file name) replaces it, never duplicates it.
- **Hiding:** the owner can hide a drive (lent car, idle test, logger fault) and unhide it. A hidden drive is out of the charts and never counts toward the Baseline.
- **Baseline:** learned as the median end-of-drive Fuel-quality score over non-hidden Cool drives, 0.49 until three exist. It replaces the fixed 0.49 from ticket 02.
- **Table view and empty state:** a Table view lists every drive's summary. The very first drive says "Your history starts with this drive".
- **The car state already holds an empty list of Flashes,** so tickets 04, 05 and 08 build on one shape.
- **Local check:** a script that runs every log in a folder through the Car module in time order and prints the per-drive table from the research report.

**Blocked by:** 01 — Log quality gate (Too-short drives are kept out of the history)

**Status:** ready-for-agent
**Status:** done (engine: identity/replace/baseline/hide/table/plan-gaps verified + fixed; suite 113/113 with car 42/42)

- [x] One public operation takes the car state plus a new drive and returns the next car state plus the drive report. Hide, unhide and table rows are operations on the same module.
- [x] Feeding the three bundled drives plus the committed fixtures in time order gives the Baseline 0.49 and a history without the Aug 30 15:09 drive.
- [x] Hiding a Cool drive removes it from the Baseline and the table; unhiding restores both. (Also verified: hidden drives leave the chart series too.)
- [x] Re-checking a drive replaces its summary (count unchanged).
- [ ] Load folder works from `file://` in Chrome, Safari and Firefox, or says clearly how to serve the folder when the browser blocks it. (UI track — other agent.)
- [ ] Nothing leaves the browser; all storage reads and writes survive storage being blocked (the app still works for the current drive). (UI track — other agent.)
- [x] The local script prints all 16 owner drives with the same numbers the app shows. (`node tools/car-history-check.js` on the Desktop folder: 15 in history + 1 too short, baseline 0.49 from 6 cool drives; also prints the flash plan.)
- [ ] New wording in English and Tiếng Việt. (UI track — other agent; engine copy uses CONTEXT.md vocabulary.)

PM note: the owner gains a history that builds itself and can be rebuilt from the log folder in one step — what changed on the car is now visible across drives instead of one drive at a time. Verified useful: replace-not-duplicate, deterministic re-checks, hidden drives out of baseline/table/charts. Residual risk: browser storage and `file://` behaviour are UI-track work; engine hands them deterministic state plus the local script as the honest reference.

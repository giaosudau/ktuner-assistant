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

- [ ] One public operation takes the car state plus a new drive and returns the next car state plus the drive report. Hide, unhide and table rows are operations on the same module.
- [ ] Feeding the three bundled drives plus the committed fixtures in time order gives the Baseline 0.49 and a history without the Aug 30 15:09 drive.
- [ ] Hiding a Cool drive removes it from the Baseline and the table; unhiding restores both.
- [ ] Re-checking a drive replaces its summary (count unchanged).
- [ ] Load folder works from `file://` in Chrome, Safari and Firefox, or says clearly how to serve the folder when the browser blocks it.
- [ ] Nothing leaves the browser; all storage reads and writes survive storage being blocked (the app still works for the current drive).
- [ ] The local script prints all 16 owner drives with the same numbers the app shows.
- [ ] New wording in English and Tiếng Việt.

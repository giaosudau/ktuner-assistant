# 02 — Engine: stop the false alarms

**What to build:** the owner stops seeing alarms the research proved wrong (`docs/research/owner-voices.md` §4, `tuner-play-panel.md` T1):

- "Unexplained change: boost" fires on 5 of 6 drives because the highest boost target depends on whether the owner did a pull. Compare boost targets only between Drives that both had hard pulls.
- A Drive whose Fuel-quality score starts at 0.60 or below and falls to the Baseline is the normal after-flash pattern (30 Aug 15:29: 0.58 → 0.49), not an Unexplained change.
- Knock Control rises above 5,200 rpm (the non-Si ECU raises it there on purpose) don't count toward fuel or heat verdicts.
- Checks diagnose, they never prescribe: remove every check remedy that names a map table; only the Flash plan names tables.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent
**Status:** done (3 Oct 2026: 4 rules in `engine/`, 14 new + 3 rewritten engine tests; suite 129/129; seam-1 34/34 unchanged)

- [x] On the owner's drives, "Unexplained change: boost" no longer fires between a Drive with pulls and one without — `test/car.test.js`: `a Drive with no pull never raises "Unexplained change: boost" against Drives that had one` (22 Aug 09:03 → 09:50: nine pulls then none, 16.3 vs 8.7 psi, no ask). The rule is not one-sided: a Drive with pulls is still compared against the pulls, and still asks when the target moved. Needs 3 pull Drives (`CAR_RULES.targetRefMin`) — one pull Drive is not this car's boost normal.
- [x] 30 Aug 15:29 is not an Unexplained change for its starting score — `30 Aug 15:29 (0.58 → 0.49) is the normal after-flash pattern`, carrying the sentence "Knock Control started at 0.58 and settled to your Baseline (0.49): that is what a fresh flash does." A start **above** 0.60 still asks; a start in the band that does not settle still asks. Threshold 0.60 = `CAR_RULES.afterFlashStart`.
- [x] A rise above 5,200 rpm is excluded from fuel and heat verdicts (fixture test) — 5 tests. `the high-rpm rule cannot remove a Stop` builds a score of 0.82 reached only above 5,200 rpm and asserts `stop`; `the same score at the same place, below 5,200 rpm, is a real Watch` is the control. `DRIVE_LIMITS.kcHighRpm` = 5,200 (`owner-voices.md` §3).
- [x] No check's text names a KTuner table; the Flash plan still does — `no check names a KTuner table, on any Drive the app can be given` walks all 39 `KTA.TABLES` ids plus a word regex over every remedy on 10 logs; `the app's own copy of every remedy names no table either, in both languages` does the same through `app/i18n.js` EN+VI. `the Flash plan still names the tables` asserts `MAF_Scaling_Custom` + the paste row and the six `Boost_Target_*_Normal_*` with cells.
- [x] Tested at the engine's public operations in the style of the existing car and drive tests; full suite green — `npm test` 129/129; `cd server && python3 -m pytest tests/seam1 -q` 34/34, no reply changed.

## PM notes

1. **`fuelCheck` was dead code and is now alive.** `DL.fuelKc` never existed (the constant is
   `DL.kcFuel`), so `I.kc.end > undefined` was always false and "check the fuel" could never appear
   in any action list, in any language, for any Drive. Fixed because rule 3 rewrites that line.
   **Expect "check the fuel" to start appearing** where the judged peak passes 0.65. That is
   correct, but it is new text the owner will see.
2. **`report.afterFlash` is a new field** on `carIngest` and `carReport` (null when something else
   fired). The server worker does not forward it yet, so the chat reply is still silent about the
   after-flash pattern. Wire it into `server/kta_worker/worker.js` + `server/kta_server/copy.py`
   before the reply ships — an "I just flashed and it settled" Drive must say so in the owner's
   words, because it is reassurance, not an alarm.
3. **The boost ask is pull-relative, so `carTableRows` now carries `hardPulls`.** Any column showing
   "highest boost target" alone is misleading on a Drive with no pulls; show it with the pull count.
4. **`episodeRpm` uses `rpmP90`, not the median.** On the owner's own 15:29 Drive a genuine top-end
   raise sits in an episode whose median rpm is 3,473 and whose p90 is 5,600; using the median would
   have counted it. The episode keeps both numbers.
5. **The owner's 9 Drives: six false asks became two.** Gone: 22 Aug 09:50, 23 Aug 19:59, 23 Aug
   20:38's boost reason, 30 Aug 15:09's, 15:29's boost + score, 16:01's. Kept: 23 Aug 20:38's
   **trim** reason (the real fault) and 1 Sep 08:13's boost (a genuine pull-to-pull target
   difference). Over all 16 CSVs: 10 asks → 6, every remaining one pull-to-pull.
6. **The honest next lever if the remaining boost asks get noisy** is to compare the *mode* the pulls
   ran in (ECO 18 psi vs Normal 21 psi, `fact-check.md` §4) — not a wider threshold.
7. **`e2e/app.e2e.js` fails on 5 steps, identically before and after this change** (verified by
   stashing). Pre-existing, not caused here, still open.

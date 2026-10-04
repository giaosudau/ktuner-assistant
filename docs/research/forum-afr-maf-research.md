# Forum and tool research: AFR, open loop and MAF calibration on the 1.5T

*4 Oct 2026. Sources: the CivicX thread "Questions on AFR and ignition timing" (pages 1–4 as
screenshots and posts #76–#88 as text, supplied by the owner), the FitFreak "Beginners Guide to
Tuning with Ktuner" (supplied by the owner), and the MAF Scaling tool's wiki
(github.com/vimsh/mafscaling/wiki/How-To-Use; the tool's site vimsh.github.io was blocked from
this environment, so only the wiki was read). `fact-check.md` still wins on any number.*

**Read the platform caveat first.** The CivicX thread is about the **10th-gen Civic and CR-V 1.5T**
(FK7, FC, RW). This owner's car is the **11th-gen Civic FE**. The engine family is the same, but
the ECU is not, so every ECU-behaviour claim below is "reported on the earlier generation", never
"true on this car" until this car's logs show it. The FitFreak guide is about the **2nd-gen Fit
(GE8), a naturally aspirated, MAP-based (speed-density) car**: its method principles transfer, its
table recipes do not.

---

## 1. What the CivicX thread says (by claim)

| # | Claim | Who | Basis | Use in the app |
|---|---|---|---|---|
| 1 | At full throttle, EU-market ECUs go **open loop**: short-term trim sits at 0 and fuel status reads 4, so the trims cannot correct the mixture; only the MAF calibration decides full-throttle AFR. US-market ECUs stay in closed loop longer and correct with trims. | varge (#posts on p.1–2) | One owner's logs across several EU cars, plus KTuner support's reply relayed | ✅ As a **check to run on this car's logs** (is STFT flat under boost?), not as a fact about the FE |
| 2 | Even on the stock map, when the MAF reads above about 4.1 V the fuelling overshoots: a whole 4th-gear pull at AFR 10.1–10.4 while the command was 10.89 (the table said 11.5). | varge | One car's logs | ✅ Supports: compare against **AFR Command**, not the table; the command and the table can differ |
| 3 | Calibrate the high-airflow end of the MAF curve (above 3.8 V on that car) against AFR Command: change values about **2 % per round**, log, repeat until AFR sits about **0.2 richer** than AFR Command; if logs read richer than **10.5**, lower the values, no more than 3 points per step. | varge | One car, labelled by the author as "not intended to be copied" | ✅ As the **method** (partial correction, small steps, re-log), never as values |
| 4 | Running AFR near or past **11.5** at full load "severely pulls timing"; **11–11.2** was the sweet spot on that car. | varge | One car | ✅ Supports keeping the WOT mixture lever (11.0 → 11.5) **locked** |
| 5 | If AFR is far off AFR.CMD, a poorly designed intake is likely throwing off fuelling and the MAF curve must be calibrated; with no intake fitted, a gap means something is wrong, especially with high trims. ECT ignition correction should not be changed on a basic setup. | **KTuner** (official account, #82 quote) | Vendor | ✅ Card; matches `kc-maf-housing` and the read-only ignition rule |
| 6 | **Knock Count and Misfires are to be ignored** on this platform (KTuner support said knock count relates to misfire detection); watch **Knock Control**. AFR Adj is also not the number to watch: watch AFR. | varge, confirmed by Anger relaying KTuner's reply (#76) | Vendor via owner | ✅ Card; matches the app's choice of Knock Control as the Fuel-quality score |
| 7 | **IAT2** is before the intercooler on some ECUs and after it on others (an Indonesian ECU, Thai-built car, reads post-intercooler; another owner says pre). | Ehtesham, arnoldo (#85–#87) | Two owners, one video | ✅ Card: **never assume** which side IAT2 is on; confirm on this car |
| 8 | "1.5 bar is a safe boost" on the stock turbo. | CAPTS (#77), "I heard" | Hearsay | ❌ Rejected: the app's ceiling comes from this car's wastegate data (`kc-21psi-no-margin`) |
| 9 | "Reduce the last value by about 10 % and interpolate from 3 V to 5 V." | dsr50 (#84) | No data | ❌ Rejected: a fixed blind cut is the opposite of claim 3's method |
| 10 | 98 RON vs 100 RON: finish the tank, switch, keep the better one if a difference shows. | Anger (#76) | Owner practice | ✅ Already the Premium-fuel test (`kc-fuel-test`) |
| 11 | "After I set LTFT min and max to 0 for an open-loop log, do I need to flash it?" | calvin13386 (#88), unanswered | Question | ⚠️ Knowledge proposal: any KTuner table change reaches the car only by a Flash (to confirm in KTuner Help) |

**What owners ask (verbatim, for the eval set, `.scratch/tuning-shop/owner-queries.md`):** "Can you
teach me how to use CSV to correct MAF?" (asked five times in a row, #79–#83); "What is the
difference between current and Basic?"; "Are you saying that this will not be an issue with my
setup?"; "How much PSI can the stock turbo take?"; "Do I need to flash it or will it already show
open loop?"; "Which ECU reads IAT2 post intercooler?".

## 2. What the FitFreak beginner guide says (method only)

Transfers to this car (principles every shop applies):

- Read the **entire log** before making changes; know which cells you already changed; never adjust
  the same cell twice from one log.
- **One thing at a time**: fuel first, log again, then ignition only if trims are in range.
- **Never advance timing** on the street; the stock ignition map is fine for most setups.
- Knock count can be **phantom** (exhaust or other noise), so it cannot alone drive a change.
- Logs are most accurate **mid-gear**; first-gear full throttle is not a valid log. Roll on, don't
  stab the pedal at a transition.
- Judge only with the **engine warm** (the guide filters coolant above 170 °F); cold-engine fuel
  corrections distort trims.
- **Apply only part of a correction** (the guide applies the trim minus 10 points); then re-log.
- Let a turbo car **cool down** before switching off after hard logging.

Does not transfer: the guide's fuel-table (MAP × rpm) recipes, VTEC crossover, injector deadtime
entry, and its fuel-status numbering, whose labels contradict the CivicX thread (the guide calls 2
closed loop "without adjustments" and 4 open loop "uses STFT"). **The app must read loop state from
STFT behaviour, never from a status number.**

## 3. The MAF Scaling tool's method (vimsh/mafscaling wiki)

A tool built for MAF-based ECUs (Subaru first) that turns logs into a corrected MAF curve. Its
method, as written in the wiki:

**Closed loop (part throttle):**
- Log time, MAF voltage, IAT, closed/open-loop status, LTFT, STFT, the stock sensor's AFR, rpm and
  load.
- Collect **at least 30 minutes** of steady top-gear cruising near the closed-to-open-loop edge,
  **30 minutes** of general driving and **15 minutes** of slow driving; smooth throttle; drop sudden
  throttle changes, stop/start and transitions.
- Per MAF bin, the correction is LTFT + STFT, taken as the average of the **mean and the mode** of
  the samples in that bin; bins with too few hits are skipped.
- Smooth once, lightly (degree 3 or 5); don't over-smooth.
- "You really need to nail the closed-loop portion first."

**Open loop (full throttle):**
- Needs a **wideband** AFR and the commanded AFR; several **3rd or 4th gear** full-throttle pulls
  from 2,000 rpm to redline.
- Raw AFR = wideband AFR ÷ ((100 − (LTFT + STFT)) ÷ 100); error % = (raw − commanded) ÷ commanded ×
  100; skip the rows at the open/closed-loop transition; drop outliers beyond an error band.
- With **about 6 pulls per round**, error reaches **under 2–3 %** within a couple of rounds.
- "It is VERY important that you collect data at a constant temperature."
- "You may not nail the calibration in one shot, so rinse and repeat."

**Log view:** filter and sort a log, plot several channels, replay a log over a table to highlight
the cells it ran in (map tracing), and compare full-throttle pulls side by side.

**Throttle maps:** builds a pedal-to-throttle table from the requested-torque tables (Subaru only;
no KTuner equivalent on this car is in the map data).

## 4. Mapping to this car and this app

| Topic | This car | The app today | Gap |
|---|---|---|---|
| MAF axis | Frequency (MAF Hz), 103 points (`kc-table-maf`) | Bins by MAF Hz | — |
| Closed-loop MAF correction | Trims at part throttle | Flash plan `afmCurve`: bin-by-bin, partial, one family per Flash | No **minimum hits per bin**, no **mean+mode** rule, no transition-row skip written down; the brief asks for one cruise, not 30 minutes |
| Open-loop (full-throttle) MAF correction | Unknown if the FE ECU runs open loop at full throttle | Not built; WOT mixture judged against the map target only | Needs **AFR Command** logged (missing on all 9 owner logs) and the open-loop check (claim 1). Then: error vs command per MAF bin above the cruise range, about 2 % per round, stop at about 0.2 richer |
| WOT mixture target | 11.0 at full load | Lever locked (no gain evidence) | Claim 4 is a second reason; add to the lock's reason |
| Knock Count / Misfires | Same family | Ignored; Knock Control used | Card so the agent can say why |
| IAT2 side | Not known for the FE | Uses intake temperature for Cool drive | Ask once, or read it from a pull (IAT2 rises far above IAT on a long pull = pre-intercooler) |
| Map tracing | — | Table viewer outlines plan cells | Replay a Drive over a table (which cells it ran in) is a cheap, high-value teaching view |

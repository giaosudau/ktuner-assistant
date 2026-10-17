Label: wayfinder:research
Ticket: issues/17-boost-target-gap.md
Fetched: 2026-10-05. KTuner help pages read directly; Hondata pages read through r.jina.ai (direct connection timed out). No Reddit.

# Why the logged boost target stops at 19.2 psi

**Key finding:** the cap is not a table. The Normal table, Final Boost Target, Boost By Gear and ethanol adjust were never the binding term in any logged sample. In all seven drives, 767 samples sit at ≥ 2,500 rpm with target ≥ 8 psi. None comes within 0.5 psi of the Normal table's top column. The closest gap is 1.8 psi and the median gap is 8.5 psi.

What holds the target down is the factory **throttle dampening plus the time ramp** that KTuner describes. The owner's pulls are:
- part pedal (TPS 41–83 % at most peaks);
- short (1.0–3.5 s above 3,500 rpm).

One pull also shows a flat **16.3 psi ceiling at ≥ 5,000 rpm** whose owner the log cannot name.

Method: node scripts in the session scratchpad (`btg/pulls.js`, `ramp.js`, `bins.js`, `reach.js`, `series.js`) decode the nine `data/example-*.js` drives and interpolate the top column of each table at the logged rpm.
- Two rows are logger glitches and are dropped: aug30-1529 t = 995.0 (target 51.7 with boost −14.0) and aug22-0950 t = 525.5 (22.8 with −14.0).
- aug30-1509 (28 rows) and sep05-0756 (flat target) have no usable boost.

## 0. What "full throttle" means in these logs

The ticket's 19.2 psi figure, and the engine, treat **TPS Command ≥ 85 %** as full throttle. In these logs that channel behaves like the **throttle-plate command**, and **TPS** behaves like the **driver's pedal**:
- **Idle:** in 14,573 of 14,788 idle samples TPS reads 0, while TPS Command reads about 5–6 %.
- **The command leads:** on tip-in, TPS Command jumps to 94 % while TPS is still at 34 % (aug22-0903, t = 77.4). Under boost, TPS Command sits ≥ 20 points above TPS in 475 of 526 samples.
- **No plate restriction:** with TPS < 60 under boost, Turbo Pressure − MAP has a median of 0.2 psi (p95 0.6). A plate 40–60 % open would drop pressure, so TPS is not the plate angle.
- **The pedal bottoms out:** TPS sits flat at 94 across three samples (aug22-0903, t = 81.6–82.1) and never exceeds 94 in any drive.

This conflicts with `docs/research/drive-check-tuner-analysis.md` line 42, which reads TPS as "throttle plate". KTuner's help does not define either channel, so this reading is an **inference from the log (M)**. It fits KTuner's rep: "even at half throttle … the throttle plate will open fully" (`research/ktuner-response-tables`, [F1]).

**Consequence:** only one logged pull came near a floored pedal: aug22-0903 t = 77, at TPS 94 for about 0.6 s.

## 1. Per-pull table

The table covers:
- **8 pulls:** TPS Command ≥ 85 % for ≥ 1 s with a peak target ≥ 10 psi;
- **2 part-plate pulls:** the peak-target pulls of the hot drive (aug30-1601) and the cool drive (sep01-0813).

What is and is not logged:
- **Load:** there is no calculated-load channel; MAP stands in for it.
- **Gear:** the logged Gear is the CVT's step number. No CVT ratio is logged.
- **Mode:** neither ECO state nor map slot is logged.
- **Ramp:** least-squares slope of the target against time over the longest rising run at ≥ 3,000 rpm.

| # | Drive, t (s) | Plate-cmd span (s) | rpm span | Gear | TPS max | Peak target (psi) @ rpm | TPS / cmd at peak | MAP / boost | IAT / IAT2 / ECT (°C) | KC | EWG % | s ≥ 3,500 rpm | Ramp (psi/s) | Normal / ECO cell at peak rpm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | aug22-0903, 54 | 3.8 | 2,383–3,196 | 3/4 | 64 | 15.0 @ 3,038 | 62 / 94 | 15.0 / 15.1 | 52 / 46 / 87 | 0.49 | 2.0 | 0 | — (flat 14.9 while TPS 62→58) | 19.2 / 18 |
| 2 | aug22-0903, 77 | 5.1 | 1,742–5,555 | 3/2/1 | **94** | **16.3 @ 4,983, flat to 5,530** | 94 / 100 | 15.4 / 16.0 | 49 / 45 / 87 | 0.50–0.52 | 3.4 | 3.5 | 1.6 | 21 / 18 |
| 3 | aug22-0903, 93 | 3.9 | 1,717–4,507 | 5→2 | 87 | 16.0 @ 4,451 | 80 / 99 | 15.7 / 16.0 | 46 / 44 / 87 | 0.52 | 3.2 | 2.2 | 2.0 | 21 / 18 |
| 4 | aug22-0903, 173 | 3.4 | 2,423–4,623 | 2/1 | 71 | 14.2 @ 4,504 | 66 / 91 | 13.8 / 13.9 | 54 / 46 / 88 | 0.49 | 3.3 | 2.6 | 1.6 | 21 / 18 |
| 5 | aug22-0903, 466 | 1.7 | 3,363–4,109 | 3 | 61 | 13.7 @ 3,698 | 58 / 90 | 13.9 / 14.0 | 45 / 41 / 85 | 0.49 | 2.8 | 1.3 | 1.7 | 21 / 18 |
| 6 | aug22-0903, 480 | 1.5 | 4,464–4,895 | 3 | 58 | 14.8 @ 4,895 | 42 / 92 | 14.6 / 15.0 | 42 / 40 / 85 | 0.49 | 3.9 | 1.5 | 2.5 | 21 / 18 |
| 7 | aug30-1529, 792 | 2.1 | 2,722–4,271 | 3/2 | 83 | **19.2 @ 4,271** | 73 / 99 | 19.1 / 19.0 | 50 / 45 / 84 | 0.50 | 2.6 | 1.1 | 4.3 (pedal rising 63→83) | 21 / 18 |
| 8 | aug30-1529, 816 | 1.8 | 2,882–4,054 | 2 | 75 | 18.7 @ 4,049 | 60 / 94 | 18.6 / 19.2 | 49 / 44 / 84 | 0.49 | 2.7 | 1.0 | 2.5 | 21 / 18 |
| 9 | aug30-1601 (hot), 86.5 | cmd 62–93 | 3,571–4,105 | 3 | 52 | 17.2 @ 4,105 | 51 / 93 | 17.3 / 16.7 | 52 / 48 / 88 | 0.49 | 2.4 | 3.0 | ≈ 1.0 at TPS 41 held; 14.7→17.2 in 0.43 s when TPS 46→52 | 21 / 18 |
| 10 | sep01-0813 (cool), 548 | cmd 71–79 | 2,566–4,078 | 1/2 | 53 | 13.7 @ 3,926 | 52 / 79 | 13.1 / 13.3 | 39 / 36 / 87 | 0.53 | 2.9 | ≈ 1.5 | follows TPS: 52→44 drops target 13.6→11.3 | 21 / 18 |

The same cells in the other tables, at every peak above:
- **`Final_Boost_Target_L/H`:** the columns at 8.2 psi and above (8.2, 10.1, 12, 13.9, 15.8, 17.7, 23.4) are identical in every row from 500 to 6,600 rpm. The table passes the target through with no rpm term.
- **`Ethanol_Boost_Target_Adj_L/H`:** 0 in every cell.
- **`Boost_By_Gear_Limits`:** 35.4 psi in every cell.
- **`Cylinder_Fill_Limitation_L/H`** at the peak rpm rows:
  - 4,000 rpm: 1,270 → 722 mg;
  - 5,000 rpm: 1,300 → 766 mg;
  - 5,500 rpm: 1,300 → 729 mg.
  - The 4,000 and 5,500 rows differ by at most 30 mg in any column.

**Second axes in the file:**
- **Normal / ECO:** not captured. The note says only "L=Low cam / Low octane, H=High cam / High octane". Columns 8–16 hold 21 (Normal) or 18 (ECO) at ≥ 3,500 rpm, so any column the pedal reaches above about the 8th returns the plateau.
- **Final Boost Target:** not captured. KTuner says its column header is TBST, the incoming target ([K-FBT]).
- **Ethanol adjust:** not captured, and every cell is 0.
- **Cylinder Fill:** not captured. The file gives the unit as mg.
- **Slots:** 1, 2 and 3 are identical (Normal 21 / ECO 18).

## 2. What the target does inside a pull

1. **It steps with the pedal.**
   - At tip-in the target jumps to about 5.3 psi, then climbs.
   - When TPS rises it climbs fast: pull 9, TPS 46→52, +2.5 psi in 0.43 s.
   - When TPS falls it drops at once: pull 10, TPS 52→44, −2.3 psi; pull 3, TPS 86→80, the climb stops.
2. **At steady pedal it climbs at a fixed rate.** Pull 3 held TPS 86–87 for 1.3 s. The target rose exactly +0.5 psi per 0.27 s log step (13.3 → 15.8), about 1.9 psi/s. The rate held constant while the gap to the 21 psi cell shrank from 7.7 to 5.2 psi.
   - That is a **rate limit (slew)**, not a first-order lag that slows as it nears the table.
   - At TPS 41 the rate was about 0.7–1.0 psi/s (pull 9). The rate grows with pedal, matching KTuner's "ramp rate aggressiveness in high throttle situations".
3. **The pulls end first.** From about 13 psi at 3,500 rpm, the logged 1.6–2.5 psi/s rates need about 3.2–5.0 s of held pedal above 3,500 rpm to reach 21. The logged pulls give 1.0–3.5 s, and the CVT gets there by holding rpm, not by sweeping.
4. **One flat ceiling.**
   - In pull 2 the target stopped at **16.3 psi from 4,983 to 5,555 rpm**, at TPS 94 and then even as TPS fell to 55.
   - The ramp had been climbing at 1.6 psi/s and the table holds 21, so something capped it. Boost met it (16.0–16.5), with EWG at 3.4–3.7 %.
   - IAT (48–49 °C) and KC (0.50–0.52) match pull 7, which reached 19.2 at 4,271 rpm. So heat and knock do not explain the lower cap.
   - Cylinder Fill rows barely change from 4,000 to 5,500 rpm, so it explains the rpm drop poorly.
   - This is one instance. The log has no channel that names its owner.

## 3. Candidate verdicts

| Candidate | Verdict | Evidence |
|---|---|---|
| **Unreached cells** | **In, partly.** The rpm rows were reached; the pedal and the time were not. | Every pull crossed the 3,500–5,500 rpm rows that hold 21. TPS was 41–83 % at 9 of 10 peaks and never above 94. Above 3,500 rpm the pulls lasted 1.0–3.5 s, where reaching 21 needs ≈ 3.2–5.0 s. Not one of 767 samples came within 0.5 psi of the table. |
| **Throttle dampening / Turbo Ramp** | **In: the main holder.** | The target follows TPS up and down and climbs at a fixed rate (≈ 1.9 psi/s at TPS 86, ≈ 1 psi/s at TPS 41). This matches KTuner exactly: "dampened by throttle, so less throttle targets less boost" and "if your target is 18 it will start at a lower level and ramp up to the target over time" [K-RAMP]. The 22+ Civic 1.5T gained "Turbo Ramp Options" in KTuner 1.0.11.9 [K-VH]. The owner's level is unknown. |
| **Final Boost Target** | **Out** | It is a near one-to-one map of the incoming TBST with a top-column ceiling [K-FBT]. In this file the upper columns are the same in every rpm row, and the ceiling is 23.4. Every logged target (≤ 19.2) sits below 23.4, and the table cannot cause the rpm-dependent 16.3 cap. Caveat: the TBST column headers were not digitized. |
| **Cylinder Fill Limitation** | **Not shown; cannot be ruled out** | No air-charge channel is logged: there is no AFM Hz, no g/s and no mg/stroke. Its rows are flat from 4,000 to 5,500 rpm, so it explains the 16.3 cap at ≥ 5,000 rpm poorly. It plays no part in the rising phase, because the target rises in steps that track the pedal. |
| **Honda heat limiter** | **Out for these logs** | The hot drive (IAT 52 °C) reached 17.2 psi at TPS 51. The cool drive (IAT 39 °C) reached only 13.7 at TPS 52. Pulls 2 and 7 share an IAT of 48–50 °C and peaked at 16.3 and 19.2. The target follows the pedal, not IAT. Hondata confirms such limits exist ("many built in protection limits for boost based on heat build up, knock control") [H-TP]; they are not binding here. |
| **Honda knock limiter** | **Out** | KC sat at 0.49–0.53 at every peak, the post-flash floor. The highest KC peak (0.53, cool drive) does not line up with the lowest targets. |
| **Torque limiter (factory, CVT)** | **Possible, for the 16.3 cap only** | Hondata names it "the next factor that will limit the boost". It can lower the boost command or close the throttle, and its signs are a table target that does not match the boost command, or a plate below the pedal [H-10G]. The plate sign is absent: the plate command is above TPS in 475 of 526 boosted samples. The target sign is present everywhere, but dampening and ramp already explain the rising phase. KTuner does not expose this limiter for the 22+ 1.5T (`research/ktuner-response-tables`). |
| **ECO state / map slot** | **Out for aug30-1529; unknown elsewhere** | ECO cells hold 18. Pulls 7 and 8 logged 18.7–19.2, so that drive ran Normal. aug22's targets (≤ 16.3) sit under 18, so the mode on that drive cannot be read from the values. Slots 1–3 are identical, so the slot cannot matter. |
| **Ethanol / IAT boost adjust** | **Out** | `Ethanol_Boost_Target_Adj_L/H` is 0 in every cell, and no ethanol channel or flex sensor is present. |
| (Boost By Gear) | **Out** | 35.4 psi in every cell. |

## 4. Would a +1 psi Normal edit show in the log?

**Not in pulls like these.**
- Every logged target sat at least 1.8 psi under the table.
- A rate-limited ramp does not change speed when its end point moves, so a +1 psi edit leaves the logged target unchanged until the target reaches the old value.
- The edit can only show on a pull that holds the target at the table plateau: pedal floored (TPS at its 94 stop) for ≥ 4–5 s above 3,500 rpm.
- Even then the 16.3 psi cap seen at ≥ 5,000 rpm may sit in the way, so read the 3,500–4,500 rpm rows.

## 5. TunerView channels that would prove it

Already logged, used as the proof:
- **Turbo Pressure Target** against TPS, read **flat** (constant at 94 %) and **long**, ≥ 4 s above 3,500 rpm.
- If the target **flattens at the table value**, the table is binding and a +1 psi edit will show.
- If the target **flattens below the table**, another limiter owns boost.
- **EWG Position** separates a target cap from a turbo limit (`research/datalog-boost-method`).

Add, if TunerView offers them:
- **Accelerator pedal position**, to confirm that TPS is the pedal;
- **ECO / drive-mode status**;
- **Cylinder air charge** (mg/stroke) or **AFM g/s or Hz**, to test Cylinder Fill against its mg table;
- an **engine torque** or **torque request** channel, for the factory torque limiter.

From the tune, not the log:
- a screenshot of the Quick Adjustments tab with the **Turbo Ramp** and **Turbo Responsiveness** levels;
- the **TBST** column headers of Final Boost Target;
- the **2nd axis** of the Normal, ECO and Cylinder Fill tables.

## Answer

1. The logged target never reached the Normal table. All 767 boosted samples at ≥ 2,500 rpm sat 1.8–8.5+ psi under it.
2. The holder is the factory throttle dampening plus the time ramp (KTuner "Boost Target Ramp Rate" / "Turbo Ramp"). The target follows the pedal and climbs at about 1–2 psi/s at fixed pedal.
3. The owner's pulls are part-pedal: TPS 41–83 % at most peaks, never above 94. They are also short: 1.0–3.5 s above 3,500 rpm, where reaching 21 needs about 3–5 s.
4. Ruled out: Final Boost Target (passes the target through, cap 23.4), ethanol adjust (all 0), Boost By Gear (35.4), heat (the hot drive beat the cool one), knock (KC 0.49–0.53), slot (slots identical). ECO is ruled out for aug30-1529 (19.2 > 18).
5. Unexplained: one flat 16.3 psi cap at ≥ 5,000 rpm with the pedal floored. The candidates are the factory torque limiter or Cylinder Fill, and neither is logged.
6. A +1 psi Normal edit would not show in pulls like these. It can show only on a pedal-floored pull held ≥ 4–5 s above 3,500 rpm, read at 3,500–4,500 rpm.
7. TPS behaves as the pedal and TPS Command as the plate command. The "TPS Command ≥ 85 % = full throttle" rule therefore over-counts full-throttle pulls.

## Sources

- [K-FBT] KTuner Help, Final Boost Target: http://www.ktuner.com/KTunerHelp/final_boost_target.htm (the incoming target is processed "nearly one to one"; the last TBST column header sets the maximum).
- [K-DBT] KTuner Help, Dual Boost Targets: http://www.ktuner.com/KTunerHelp/dual_boost_targets.htm (Civic 1.5T: ECO table in ECO mode, Normal table in Normal mode).
- [K-TR] KTuner Help, Turbo Responsiveness: http://www.ktuner.com/KTunerHelp/turbo_responsiveness.htm ("how the turbo reacts to the throttle"; improved levels reach part-throttle targets faster).
- [K-RAMP] KTuner Help, Boost Target Ramp Rate: http://www.ktuner.com/KTunerHelp/boost_target_ramp_rate.htm (throttle dampening plus a time ramp).
- [K-DIS] KTuner Help, Disable Boost Target Dampening: http://www.ktuner.com/KTunerHelp/disable_boost_target_dampening.htm (factory dampening "causes a boost target ramp up … when you go full throttle"; on CVT cars, add Boost By Gear if it is removed).
- [K-VH] KTuner Help, Version History, 1.0.11.9: http://www.ktuner.com/KTunerHelp/version_history.htm ("Civic 1.5T 2022+ — Added Turbo Ramp Options").
- [K-TEMP] KTuner Help, Turbo Pressure Limit Based On Engine Temperature (Type R): http://www.ktuner.com/KTunerHelp/turbo_pressure_limit_based_on_engine_temperature.htm (a factory IAT pull-down exists on Honda turbo ECUs).
- [H-TP] Hondata FlashPro, Turbocharger Parameters: https://www.hondata.com/help/flashpro/turbocharger_parameters.htm (built-in heat and knock protection limits; these cars "almost never" reach the pressure-ratio table).
- [H-10G] Hondata FlashPro, 10th-gen Civic Tuning Notes: https://www.hondata.com/help/flashpro/10g_civic_notes.htm (the torque limiter is the next boost limit; its log signs; it acts by closing the throttle, lowering the boost command, or changing ignition).
- Repo: `data/ktuner-maps-digitized.json`, `data/example-*.js`, and prior branches `research/datalog-boost-method`, `research/ktuner-response-tables`, `research/log-evidence`.

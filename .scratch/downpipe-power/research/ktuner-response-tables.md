# KTuner levers for throttle response and turbo lag (22+ Civic 1.5T non-Si CVT)

*Ticket 04. 5 Oct 2026. Read from the sources themselves: the KTuner Help pages fetched directly (they were reachable today, unlike on 4 Oct), the KTuner 22+ Civic 1.5T product page, Hondata FlashPro help, and CivicX / CivicXI threads read through r.jina.ai. No Reddit. Source keys are listed at the bottom. Table names are quoted exactly as each source writes them.*

## Answer

1. On our car, KTuner tunes response and lag through **settings, not tables**. The 22+ 1.5T feature list names "Throttle Control Quick Adjustment", "Turbo Responsiveness Quick Adjustment", "Dual Boost Targets With ECO Button" and "On The Fly Map Switching" [K1]. Version 1.0.11.9 added "Turbo Ramp Options" [K17]. All of these are dropdown levels, and **none of them is among the 39 digitized tables**.
2. Four tables in the owner's file do touch response: the three-slot `Boost_Target_{1,2,3}_{Normal,ECO}` (the 2nd axis spans vacuum to 21 psi, so it holds the part-throttle targets), `Final_Boost_Target` (capped at 23.4), `Boost_By_Gear_Limits` (35.4 psi everywhere, so it never acts) and `Cylinder_Fill_Limitation`.
3. As digitized, **slots 1, 2 and 3 are identical** (Normal 21 / ECO 18). Switching maps on the fly would change no boost target. Check this in KTuner before telling the owner.
4. KTuner does not document any of these for the 22+ 1.5T: an editable pedal/DBW map ("DBW Maps" exists only "on available applications" [K16]), a torque limit ("Torque Targets Per Mode" is filed under the 2017+ Civic Type-R [K15]), or wastegate feedforward/PID. Hondata has no wastegate tables for this car either (only FK2/FK8/FL5/DE5 [H5]).
5. Neither tool exposes any CVT ratio, launch or stall setting. Hondata warns that "power braking" at any torque damages the CVT, and so does going past about 250 Nm [H2].
6. A street log **can** prove turbo lag: time from TPS Command ≥ 50 % to Turbo Pressure ≥ 90 % of Turbo Pressure Target, read together with EWG Position. A log **cannot** prove a pedal-map change, because it has no accelerator-pedal channel. It also cannot prove a torque-limit or fill-limit cap, because it has no torque or air-charge channel.
7. Next action for the fix-spec: get a screenshot of the owner's **Quick Adjustments** tab (current levels are unknown) before any response card is written. The boost tables stay locked: the wastegate is about 3 % open at peak (`drive-check-tuner-analysis.md` §4 row 8 and §5).

## Lever table

"In our file?" means it is in `data/ktuner-maps-digitized.json` (39 tables). Log channels are the 36 TunerView channels in `docs/research/drive-check-tuner-analysis.md` §2.

| Lever | KTuner name & path (as the source writes it) | In our file? | Effect on response / lag | CVT risk | Can a street log prove it? | Sources / confidence |
|---|---|---|---|---|---|---|
| Pedal → throttle mapping | **"Throttle Control Quick Adjustment"** (22+ matrix [K1]). Help page "Throttle Responsiveness": "multiple levels of alterations over the factory throttle response. Each level titled 'Improved' is more aggressive" [K3]. Path: tune → Quick Adjustments tab (CivicX platform docs [K2]) | **No** (a setting, not a table). Current level unknown | Faster plate opening for the same pedal, so a sharper tip-in. It adds no torque. On a turbo car, "even at half throttle if it's trying to target a high level of boost the throttle plate will open fully" (KTuner rep on CivicXI [F1]) | Low on its own. It raises how often the car sees peak torque at part pedal. Forum: max level feels "snatchy" [F5] | **No.** The log has TPS and TPS Command but no pedal channel. The only proof is the matched 50→70 km/h test (drive-check metric 10), which is indirect | KTuner Help + 22+ matrix: **high** that it exists; level semantics **medium** (help written for Civic X) |
| Throttle setting per map slot | Throttle settings are universal across on-the-fly tunes. An 11th-gen owner: "each tune uses the same universal throttle settings" [F1]. Civic X: "the top 3 items are universally applied to all 3 of the tunes" [F2] | No | One throttle level for all three slots | — | — | Forum, two independent threads: **medium** |
| Drive-mode pedal map (ECO / Normal / Sport) | **"ECO Button"** quick adjustment: "Factory ECO Control", "Normalized ECO", "Normalized ECO and Sport+ Non-ECO" [K10]. Documented for Civic X. The 22+ matrix lists only "Dual Boost Targets With ECO Button" [K1] | No | Sets how throttle response is handled in ECO vs non-ECO. Hondata's equivalent "Econ button boost" gives "stock like power levels in Economy mode, and full power in non-eco mode" [H3] | Low | No (no drive-mode channel or pedal channel) | **Medium** for 22+ (only the Civic X page names it) |
| Editable DBW table | **"DBW Maps"** (General Parameters): "incoming TP command vs current RPM and the final TP CMD output … 83.3% is effectively 100% open" [K16] | **No.** "On available applications" only. Not listed for 22+ 1.5T | It would reshape the throttle command directly | Medium if misused | Partly: TPS Command vs TPS shows command against plate, not pedal | **Low** that it is exposed on our ECU |
| Part-throttle boost target (throttle dampening) | **"Boost Target – ECO" / "Boost Target – Normal"**, one pair per on-the-fly tune ("Tune 1 Target – Normal / ECO" in the Quick Adjustments UI [F2]) [K11]. KTuner: "From the factory the boost target is dampened by throttle, so less throttle targets less boost pressure" [K6] | **Yes**: `Boost_Target_{1,2,3}_{Normal,ECO}_{L,H}`, 20 × 16 cells. The 2nd axis is not labelled in the digitization. Its spread from −6 to 21 psi fits the throttle-dampened target. **Slots 1 = 2 = 3** | Higher cells at mid columns mean more boost asked for at part pedal, which feels like less lag on roll-on | **High.** This is the CVT torque lever. Locked by `boost_ceiling_psi` 21 and "no headroom" (EWG about 3 % at peak) | **Yes**: Turbo Pressure Target and Turbo Pressure against the cell traced | Own file + KTuner Help: **high**. Axis meaning: **medium** |
| Turbo target ramp | **"Turbo Ramp Options"** (version 1.0.11.9, "Civic 1.5T 2022+ Added Turbo Ramp Options" [K17]). Civic X help calls it "Boost Target Ramp Rate": "two levels of improved ramp rate and two levels of aggressive ramp rate" [K6] | **No** (a setting) | Removes the factory delay on the target: "if your target is 18 it will start at a lower level and ramp up to the target over time" [K6]. This is the most direct software lever on felt lag | Medium. A faster ramp brings peak torque onto the belt sooner | **Yes.** Shape of Turbo Pressure Target after tip-in. If the target ramps slowly while EWG is open, the ramp is the bottleneck | KTuner Help + version history: **high** that it exists on 22+. Level names **medium** |
| Part-throttle spool | **"Turbo Responsiveness Quick Adjustment"** (22+ matrix [K1]): "Improved level options will spool faster than factory to reach part throttle boost targets" [K4]. Civic X also has **"Turbo Spool"** ("how aggressively the turbo spools toward the current boost target" [K5]) and **"Early Spool"** (Quick Enable [K8]). The 22+ matrix does not list either | **No** (settings). The vendor says Starter maps already have "Reduced turbo lag" [K1] (vendor claim) | Wastegate closes earlier/harder at part pedal, so boost arrives sooner. Forum: going too aggressive with early spool and part-throttle responsiveness makes the car feel "amazing off the line" but it "will fizzle out a bit on the top end" (CivicX) | Medium | **Yes.** EWG Position and Duty and Turbo Pressure rise time at part pedal | 22+ matrix: **high** for Turbo Responsiveness. **Unknown** for Turbo Spool / Early Spool on 22+ |
| Full dampening removal | **"Disable Boost Target Dampening"** (Quick Enables). "CVT: Since there is absolutely no dampening it's best to also setup Boost By Gear in an effort to protect the CVT", and P0299 must be disabled [K7] | **No.** Not in the 22+ matrix | Target always at full boost above 15 % pedal | **High.** KTuner itself says to add Boost By Gear for the CVT | Yes (TC target never atmospheric) | **Low** that it exists on 22+. Do not recommend |
| Wastegate (EWG) control | No EWG target, feedforward or PID table found in KTuner Help or the 22+ matrix. Hondata added "wastegate position and flow tables" only for FK2/FK8/FL5/DE5 [H5] | **No** | Indirect only, through the Turbo Responsiveness and Ramp levels | — | The log has **EWG Position / Duty / Target**, so its behaviour is visible but not editable | **Medium** (absence in two vendors' docs) |
| Boost by gear | **"Boost By Gear Limits"**: "based on RPM (Left) and Atmospheric Pressure (Top)", one table per gear, "help prevent extra stress on CVT applications" [K13]. Plus **"Quick Boost By Gear Settings"** (Custom, Factory, Disabled, 10–21 PSI flat, 10–20 PSI ramp above 4000 RPM) [K13] | **Yes**: `Boost_By_Gear_Limits`, 35.4 psi in every cell, so it never acts. Only one gear captured | Lowering it in low "gears" trades low-speed punch for less belt shock. It never improves response | It **reduces** risk. Recommended with any extra aggression [K7] | **Yes**: Gear plus Turbo Pressure Target clipped. Unverified how the ECU defines "gear" on a CVT | KTuner Help + own file: **high** |
| Final target arbitration and cap | **"Final Boost Target"**: "takes the incoming boost target from the boost target table, partial throttle boost target, or boost by gear target limit and processes it to a final value … nearly one to one" and caps the maximum [K12] | **Yes**: `Final_Boost_Target_{L,H}`, highest cell 23.4 psi | None at part throttle (passes the target through 1:1). It only caps the top | Raising the cap is a boost raise | Yes: Turbo Pressure Target ≤ cap | KTuner Help + own file: **high** |
| Air-charge cap | KTuner: **"Cylinder Fill Limitation"** (no help page found). Hondata Civic X equivalent: **"Knock air limit – restricts the amount of cylinder filling"** [H1] | **Yes**: `Cylinder_Fill_Limitation_{L,H}`, 10 × 10, falling with rpm (H: about 1447 → 676) | Caps torque if the air charge reaches it. No effect on tip-in speed | Raising it is a torque raise | **No** air-charge channel (AFM Hz and g/s are missing). Only an indirect sign: boost below target with the EWG open | Own file + Hondata: **medium** on what it does |
| Torque request / limit | KTuner: **"Torque Targets Per Mode"** ("torque target for each gear and mode … in lb-ft", gears 1–6) is filed under **"2017+ Civic Type-R"** [K15]. Hondata Civic X: **"Torque limit"** / **"Economy torque limit"** (window → calibration → torque). It "functions by limiting power output via closing throttle, lowering bp-command, or altering the ignition timing" [H1], and was "Added torque limit tables" for 2016–17 CVT [F4] | **No.** Not exposed for 22+ 1.5T as far as KTuner documents | The factory ECU has a torque limiter (Hondata [H1]). It can cap response regardless of boost tables | This is **the** CVT guard. Hondata: CVT damaged past "about 250 nM" or by power braking [H2] | Weak. Hondata detects it by "t-pedal doesn't match the t-plate" [H1]. We have no pedal channel. Turbo Pressure Target sitting below the table target at full TPS Command is only a hint | **Medium** (the limiter exists). **Medium** (not editable in KTuner on our car) |
| On-the-fly map switching | **"On The Fly Map Switching"**: "switch between different boost targets and responsiveness levels. Three different levels"; cruise Cancel long-press. Unplugged, the ECU starts in Tune 1 [K14]. 22+: "Full Support With Map Switching" since 1.0.10.6 [K17] | **Yes**, as the three `Boost_Target_1/2/3` sets. They are identical as digitized | Per tune: boost targets and Turbo Responsiveness. Throttle is universal [F1] | Same as the boost targets | Yes, given the Map slot tag (CONTEXT.md) | KTuner Help + forum: **high** |
| Rev hang / decel throttle | **"Disable Rev Hang"** + **"Throttle Padding"** (padding is "available on Manual Transmission vehicles") [K9] | No. Not in the 22+ matrix | Off-throttle feel, not lag | Low | Partly (TPS vs TPS Command on lift-off) | **Low** on 22+ CVT |
| CVT ratio / launch / stall | None found. "On The Fly Adjustable Launch Control" needs "the clutch pedal" [K18]. KTuner reads only "Transmission Temperature From … CVT controller" (1.0.10.4 [K17]) | **No** | Not tunable with KTuner or Hondata | Hondata: power braking damages the CVT [H2] | Transmission Temperature only | **Medium** (absence) |
| Anti-lag | **"Anti-lag"**: "effectively launch control ignition retard … for race applications only" [K18] | No | Builds boost at standstill | **High.** It is power braking on a CVT, plus it is an ignition edit (product limit) | — | Out of scope |

## Hondata FlashPro equivalents

| KTuner | Hondata Civic X (10th gen) | Hondata 22+ non-Si |
|---|---|---|
| Boost_Target tables | "TC maximum pressure ratio – this is the main boost target table" (rpm × atmospheric pressure) [H1] | Supported (34 hp / 50 lb-ft basemap). Table list not published in the help pages reached |
| Boost By Gear Limits | "Boost by gear limit – boost target ceiling based on gear and rpm" [H1] | Not confirmed |
| Cylinder Fill Limitation | "Knock air limit – restricts the amount of cylinder filling" [H1] | Not confirmed |
| (not exposed) | "Torque limit" / "Economy torque limit"; "Sport torque limit" on Si [H1] | Not confirmed |
| Dual Boost Targets with ECO | "Econ button boost" (Hondata Mode) [H3] | Not confirmed |
| On The Fly Map Switching | "Multi-tune". The vehicle list includes 2022+ Civic **Si** but **not** the 22+ non-Si [H4] | **No multi-tune** per [H4] |
| Disable Rev Hang | "When rev hang has been disabled, turning the main cruise control button on will cause the throttle to go back to stock behavior" [H1] | — |

Hondata's own tuning order names the torque limiter as "the next factor that will limit the boost" after the boost table [H1]. That fits the repo's view that the CVT is protected by torque management, not by the boost tables.

## Conflicts with today's repo docs

- `docs/research/ktuner-only-tuning.md` §1 lists "Torque Targets Per Mode" as general KTuner logic. KTuner files it under **2017+ Civic Type-R** [K15], and it is not in the 22+ 1.5T matrix. Treat it as not available on our car until a screenshot shows it.
- `docs/research/drive-check-tuner-analysis.md` (§3 "Where they disagreed" and §6) says the "CVT already relies on the map's torque limiter". The limiter is in the factory ECU logic (Hondata [H1]). It is not a table in the owner's KTuner file, and its values are unknown.
- `docs/research/ktuner-help-pages.md` §2 keeps four pages as unread proposals: Boost By Gear Limits, Final Boost Target, Dual Boost Targets and On The Fly Map Switching. All four were read today and are quoted above ([K11]–[K14]). Those proposals can now be sourced.

## How a street log tells software lag from turbo lag

The TunerView channels are TPS, TPS Command, Turbo Pressure, Turbo Pressure Target, EWG Position/Duty/Target, Gear, RPM, Speed and IAT. On a matched roll-on (same Map slot, same rpm band, IAT within 8 °C), there are two cases:

- **Target-limited.** Turbo Pressure Target climbs slowly while EWG Position is still open. The software ramp or dampening is the bottleneck, so "Turbo Ramp" or "Turbo Responsiveness" can shorten it.
- **Turbo-limited.** The target jumps, but Turbo Pressure lags with the EWG shut (about 0 %). This is physical spool. No KTuner setting makes it faster. Only exhaust flow (the downpipe) changes it, and only a little.

Neither case covers pedal feel, because no pedal channel is logged.

## Sources

KTuner (vendor; feature claims on product pages are vendor claims)
- [K1] 22+ Civic 1.5T page and feature matrix: https://ktuner.com/22civicturbo/ (also 22+ Si: https://ktuner.com/22civicsi/)
- [K2] Help, table of contents: http://www.ktuner.com/KTunerHelp/table_of_contents.htm
- [K3] Throttle Responsiveness: http://www.ktuner.com/KTunerHelp/throttle_responsiveness.htm
- [K4] Turbo Responsiveness: http://www.ktuner.com/KTunerHelp/turbo_responsiveness.htm
- [K5] Turbo Spool: http://www.ktuner.com/KTunerHelp/turbo_spool.htm
- [K6] Boost Target Ramp Rate: http://www.ktuner.com/KTunerHelp/boost_target_ramp_rate.htm
- [K7] Disable Boost Target Dampening: http://www.ktuner.com/KTunerHelp/disable_boost_target_dampening.htm
- [K8] Early Spool: http://www.ktuner.com/KTunerHelp/early_spool.htm
- [K9] Disable Rev Hang / Throttle Padding: http://www.ktuner.com/KTunerHelp/disable_rev_hang.htm, http://www.ktuner.com/KTunerHelp/throttle_padding.htm
- [K10] ECO Button: http://www.ktuner.com/KTunerHelp/eco_button.htm
- [K11] Dual Boost Targets: http://www.ktuner.com/KTunerHelp/dual_boost_targets.htm
- [K12] Final Boost Target: http://www.ktuner.com/KTunerHelp/final_boost_target.htm
- [K13] Boost By Gear Limits / Quick Boost By Gear Settings: http://www.ktuner.com/KTunerHelp/boost_by_gear_limits.htm, http://www.ktuner.com/KTunerHelp/quick_boost_by_gear_settings.htm
- [K14] On The Fly Map Switching: http://www.ktuner.com/KTunerHelp/on_the_fly_map_switching.htm
- [K15] Torque Targets Per Mode / Boost By Gear (Type-R section): http://www.ktuner.com/KTunerHelp/torque_targets_per_mode.htm, http://www.ktuner.com/KTunerHelp/_boost_by_gear.htm
- [K16] DBW Maps: http://www.ktuner.com/KTunerHelp/dbw_maps.htm
- [K17] Version history (1.0.10.4, 1.0.10.6, 1.0.11.9): http://www.ktuner.com/KTunerHelp/version_history.htm
- [K18] Anti-lag / On The Fly Adjustable Launch Control: http://www.ktuner.com/KTunerHelp/anti_lag.htm, http://www.ktuner.com/KTunerHelp/on_the_fly_adjustable_launch_control.htm

Hondata (vendor)
- [H1] FlashPro Tuning Notes, 10th-gen Civic: https://www.hondata.com/help/flashpro/10g_civic_notes.htm
- [H2] Torque parameters / Torque Limit: https://www.hondata.com/help/flashpro/torque_parameters.htm, https://www.hondata.com/help/flashpro/torque_limit.htm
- [H3] Hondata Mode: https://www.hondata.com/help/flashpro/hondata_mode.htm
- [H4] Multi-tune: https://www.hondata.com/help/flashpro/multi_tune.htm
- [H5] What's new (wastegate tables for FK2/FK8/FL5/DE5 only; 2022 Turbo Civic entries): https://www.hondata.com/help/flashpro/whatsnewtopic.htm

Forums (context and corroboration only; read via r.jina.ai)
- [F1] CivicXI, "KTuner questions for JR: Idle speed, expanded quick adjustments": https://www.civicxi.com/forum/threads/ktuner-questions-for-jr-idle-speed-expanded-quick-adjustments.34408/
- [F2] CivicX, "KTuner dual tune + on the fly map switching": https://www.civicx.com/forum/threads/ktuner-dual-tune-on-the-fly-map-switching.34553/
- [F3] CivicXI, TSP Stage 1 for 22+ non-Si (Map 1/2/3 boost layout): https://www.civicxi.com/forum/threads/tsp-stage-1-tune-for-the-2022-non-si-civic-now-available.50047/
- [F4] CivicX, "CVT TQ tables (more boost) and Boost by Gear – FlashProManager 2.8.3": https://www.civicx.com/forum/threads/cvt-tq-tables-more-boost-and-boost-by-gear-flashpromanager-2-8-3.15213/
- [F5] CivicX, "Quick Enables & Quick Adjustment Recommendations": https://www.civicx.com/forum/threads/quick-enables-quick-adjustment-recommendations.24903/
- CivicX, "Tuning 1.5t cvt with ktuner" (the early-spool "fizzle out" quote): https://www.civicx.com/forum/threads/tuning-1-5t-cvt-with-ktuner.54706/

Repo
- `data/ktuner-maps-digitized.json` (shapes and values quoted above), `docs/research/drive-check-tuner-analysis.md` §2–§6, `CONTEXT.md` (Map slot), `data/thresholds.json`.

Not reached: a Hondata help page specific to the 22+ non-Si (the guessed URLs redirect to the home page), and any KTuner help page written for the 11th-gen platform (every Quick Adjustment page is filed under "CivicX/AccordX Platform").

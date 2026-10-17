Label: wayfinder:research
Ticket: issues/13-datalog-boost-method.md
Fetched: 2026-10-05. Forums read through r.jina.ai; vendor help pages read directly. No Reddit. The Hondata forum sits behind a bot check and was not read.

# How tuners add and remove boost from datalogs, and how our D1 gates compare

**Key finding:** no Honda tuner publishes a psi tolerance or a knock number for adding boost. What the sources share is a **method**:
- one small change at a time;
- repeat the pull to confirm it;
- read boost against target together with the wastegate;
- read knock as a trend, not one spike;
- throw out pulls taken right after a flash or while heat-soaked;
- stop when more boost costs timing instead of making power.

Our D1 numbers are our own judgement, and three of the seven gates do not work as written on this ECU and these logs:
- **knock retard is a scheduled value, not a knock signal;**
- **the hot-drive Knock Control gate already fails on today's map;**
- **a +1 psi table edit is not shown to reach the logged target.**

Labels: **P** = platform vendor doc (Hondata / KTuner help). **T** = tuner teaching or tuner post (HPA, IMW, TSP). **D** = this car's nine logs (measured here). **J** = our judgement. Confidence: H / M / L.

## 1. Method table

| Tuner | Step size | Channels | Pass / back-off thresholds | Pulls and conditions | Source | Conf. |
|---|---|---|---|---|---|---|
| **HP Academy, turbo method (dyno)** | Boost rows 20 kPa apart (≈ 2.9 psi). "Small adjustments" in the boost region. Creep up with extra fuel and less timing first. | Lambda, boost, power (dyno), knock | **Stop** when adding boost brings knock, you have to retard timing, and power barely rises ("cut your losses"). Retard timing one row above the expected peak as a guard. | Steady state first, then ramp runs | [HPA, 6 Steps to Tuning Your Turbocharged Engine Safely](https://www.hpacademy.com/technical-articles/6-steps-to-tuning-your-turbocharged-engine-safely/) | H (T) |
| **HP Academy, OE reflash method** | One change per flash. Timing in 0.5–1° steps. | Knock retard **per cylinder**, total retard, commanded EQ ratio, IAT / MAT / ECT, dyno torque | One cylinder retarding at the usual spot = baseline. **Several cylinders "talking" = real knock → take the step back out.** Stop even without knock once gains stop on pump fuel. | **Repeat every run.** When knock shows up after back-to-back runs, cool the car and rerun to tell heat soak from a real limit. Leave street margin for heat soak. | [HPA Practical Reflash Tuning, Step 5](https://www.hpacademy.com/courses/practical-reflash-tuning/hp-tuners-gm-gen-v-step-5-optimising-the-tune/) | H (T) |
| **HP Academy (Andre Simon, forum reply)** | **Boost in 2 psi steps**, re-optimising timing at each. Timing first in 2° steps, then smaller. | Logged knock, confirmed by ear (audio knock detection) | Max boost is where "timing starts to fall off a cliff" to avoid knock. Past that you are "chasing your tail": more boost, less timing, same power, more heat. | Dyno | [HPA forum, Tuning Tips BMW 330e B48](https://www.hpacademy.com/forum/boost-control/show/tuning-tips-bmw-330e-b48/) (the replier is addressed as "Andre" later in the thread) | M (T) |
| **HP Academy, boost control** | — | Boost aim vs measured boost, PID terms | Boost should closely track target. Oscillation or overboost comes from aggressive P/I gains or **integral wind-up against an unachievable target**: get stable open-loop control first. | — | [HPA Boost Control, closed loop](https://www.hpacademy.com/courses/boost-control/the-boost-control-tuning-process-closed-loop-boost-control-tuning/); [B48 thread](https://www.hpacademy.com/forum/boost-control/show/tuning-tips-bmw-330e-b48/) | H (T) |
| **Hondata, FlashPro help (Honda turbo DI)** | — | Boost vs target, **wastegate position**, Knock Control, knock retard | **Turbo at its limit (over-speed): boost under target with the wastegate closed (≈ 0 mm) at high rpm.** That is normal only during spool. Normal: boost on target, wastegate opening progressively. The most common cause is a boost leak. | KC "starts out high and slowly comes down"; expect near-full retard right after programming | [Hondata, Honda Turbocharger Notes](https://www.hondata.com/help/flashpro/honda_turbo_notes.htm) | H (P) |
| **Hondata, knock logic** | — | K.Control, knock retard, ignition | KC = estimated fuel octane between 100 and 90 RON, adjusted "at a fairly slow rate". Retard = KC × knock retard table. Honda knock control "will not (quickly) actively retard". **Knock retard shows even with no knock.** Do not desensitise the sensors. | Settle KC at steady rpm before judging | [Hondata, Knock control tables](https://www.hondata.com/help/flashpro/knock_control_tables.htm) | H (P) |
| **Hondata, boost arbitration** | — | — | Boost By Gear sets the **maximum**, not the actual boost. "Many built in protection limits for boost based on heat build up, knock control" mean these cars "almost never" reach the pressure-ratio ceiling. Knock Air Limit sets cylinder fill from knock retard. | — | [Hondata, Turbocharger Parameters](https://www.hondata.com/help/flashpro/turbocharger_parameters.htm); [Knock control tables](https://www.hondata.com/help/flashpro/knock_control_tables.htm) | H (P) |
| **Hondata, K20C Type R tuning note** (Honda turbo DI, not our engine) | Raise or lower boost through the Air Charge Limit | **BP, BP Cmd, AirC, Knock Retard 1–4, AF, AFCmd, Ign, fuel pump duty, DIFP vs DIFP Cmd** | Knock retard "as close to 0 as possible"; on knock, lower timing and/or **boost in that area**. Fuel pump duty ≤ 90 %. **Never let the wastegate rest at 0 mm.** "All boost gains won't equate to power gains; especially up top." | Dyno and/or street | [Hondata, Tuning the K20C FK8](https://www.hondata.com/tech-tuning-the-k20c-fk8-civic-type-r) | H (P), cross-check only (2.0T) |
| **KTuner help (platform)** | Quick Boost By Gear in 1 psi presets (10–21 psi), "set, test, and adjust" | Ignition, Knock Control, Knock Retard (rounded) | Final timing = ignition + knock limit − (KC × retard table), never above the table. **Logged retard and ignition are rounded** (3.8 → 3.5; 19.2 → 19). Boost By Gear "help[s] prevent extra stress on CVT applications". The target is **dampened by throttle** and ramped over time. Final Boost Target maps the incoming target and caps the maximum. | — | [Ignition Timing and Knock Control](http://www.ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm); [Final Boost Target](http://www.ktuner.com/KTunerHelp/final_boost_target.htm); [Boost By Gear Limits](http://www.ktuner.com/KTunerHelp/boost_by_gear_limits.htm); [Quick Boost By Gear](http://www.ktuner.com/KTunerHelp/quick_boost_by_gear_settings.htm); [Boost Target Ramp Rate](http://www.ktuner.com/KTunerHelp/boost_target_ramp_rate.htm) | H (P) |
| **KTuner, Type R pages** (factory logic, a different engine) | — | IAT, atmospheric pressure | The factory tune "pulls down the turbo pressure limit" as IAT rises (heat soak). The target is cut at altitude to prevent over-speed. | — | [Turbo pressure limit by engine temperature](http://www.ktuner.com/KTunerHelp/turbo_pressure_limit_based_on_engine_temperature.htm); [by atmospheric pressure](http://www.ktuner.com/KTunerHelp/turbo_pressure_limit_based_on_atmospheric_pressure.htm) | M (P; Type R, not 1.5T) |
| **IMW / Derek Robinson** (builds the KTuner and TSP 1.5T maps) | — | Knock Control, knock count | KC = the ECU's view of fuel quality; it "WILL move". **"Up and up and up and never comes down"** is the concern, not movement. Non-Si 1.5T KC rises on purpose above ≈ 5,200–5,400 rpm. Knock count = the misfire monitor, not knock. | — | [Derek's definitions, reposted by Vincent@27WON](https://www.civicxi.com/forum/threads/what-is-knock-count-and-knock-control-defined.38412/) | M (T, repost) |
| **TSP (official forum account)** | e-tune: starter map → logs → revision, repeated; no dyno | Fuel status, AFR vs commanded | **Pulls right after a flash are invalid**: fuel status 4 means the ECU is still learning and not yet in closed loop, so AFR sits far from command and "the data was skewed". | Drive after the flash before logging pulls | [TSP in "Hands on with TSP's Stage 1 (non-Si)", p. 13](https://www.civicx.com/forum/threads/hands-on-with-tsps-stage-1-tune-for-the-1-5t-non-si.39135/page-13); [TSP e-tune page](https://www.twostepperformance.com/products/e-tune-for-ktuner-or-hondata-email-tuning-service) (one buyer reports ≈ 7 revisions, and colder weather stopped valid WOT logs) | M (T) / L (buyer) |
| **Phearable** | e-tune: initial file → "driving routines" to log → revise → repeat | Not published | Lower fuel "may result in elevated k.con values which will increase knock retard". No parts changes during an e-tune; mechanical faults are fixed first. | Per-car routines, private | [Phearable e-tune](https://www.phearable.net/tuning-software/etune.html); k.con quote from the Stage 1.5 page (see `research/tuner-practice`) | M (T) |

**Independence.**
- HP Academy, Hondata and IMW/TSP are three independent methods.
- KTuner and IMW/TSP are linked: the KTuner dynos carry the IMW watermark (`research/tuner-practice`). Treat them as one source on numbers; the KTuner help is still the platform doc for table logic.
- Phearable describes only its process.

**Where they disagree, and why.**
1. **Knock retard as a gate.**
   - HPA and Hondata's Type R note watch per-cylinder retard (multi-cylinder = real knock; retard near 0).
   - Hondata's own knock page and the KTuner formula say Honda retard is **scheduled from KC** and shows with no knock.
   - Both are right about different ECUs or channels. Per-cylinder retard (FK8 K.Retard 1–4, the GM ECU in HPA) carries events. The single "Knock Retard" column on this car's TunerView log is KC × table.
2. **Step size.**
   - HPA uses 20 kPa rows or 2 psi on a dyno with torque feedback.
   - KTuner's presets come in 1 psi steps.
   - Without a dyno, a smaller step keeps each proof inside what the log can show. Our +1 psi is the smaller choice and needs no change.
3. **Where to stop.**
   - HPA stops on power (dyno) or timing collapse.
   - Hondata adds the fuel system and the over-speed signature.
   - IMW adds the KC trend.
   - With no dyno and no torque channel, the street proxies are achieved ignition, KC and boost vs target.

## 2. What the owner's logs carry

All nine TunerView logs have the same 23 columns:
`Engine RPM, Speed, ECT, IAT, MAP, O2 (AFR), Gear, TPS, TPS Command, Ignition, Knock Control, Knock Retard, Turbo Pressure, Turbo Pressure Target, EWG Position, EWG Target, DIFP, DIFP Target, IAT2, STFT B1, LTFT B1, Transmission Temperature`. Measured with `K.readLog` / `K.checkDrive`.

| Channel a tuner reads | In the logs? | What the nine drives show |
|---|---|---|
| Boost vs target | Yes (sep05-0756 flat) | WOT boost − target median −0.9 … +1.1 psi per 500 rpm band |
| Wastegate position | **Yes** (EWG Position) | Floor reads 0 (the closed reading). At WOT ≥ 3,500 rpm the median is 2.4–3.7 %, never resting at 0 while on target. Not over-speed by Hondata's test, and close to closed. |
| Wastegate duty / PID | No | No wastegate tables for this car (ticket 04) |
| Knock retard **per cylinder** | **No** (one "Knock Retard" column) | 5.0–6.0° in **every** hard-pull sample of the four boosted drives; the engine reads it as scheduled. This matches KTuner's formula. |
| Knock Control | Yes | Cool drives peak 0.52–0.54. **Hot drive aug30-1601: 0.49 → 0.64 (Watch).** Right after a flash: 0.58 (aug30-1529), 0.77 (aug30-1509). |
| Ignition achieved | Yes (rounded) | At hard pulls 1.5–9.5° (aug30-1529), 1.5–3.0° (hot aug30-1601), 3.0–4.5° (cool sep01-0813) |
| Ignition table / knock limit | No | — |
| AFR | Yes | WOT 10.1–10.6 AFR vs map 11.0; leanest λ 0.77 ≈ 11.3 AFR |
| AFR command | **No** | Only the map's 11.0 can stand in for it |
| Fuel status / closed loop | No | Trims stand in for it |
| DI fuel pressure vs target | **Yes** (DIFP, DIFP Target) | Worst 5 % at 97–99 % of target |
| Fuel pump duty | No | — |
| IAT / IAT2 (charge) | Yes / Yes | Hard-pull IAT max 39 °C cool, 59–60 °C hot; IAT2 36 / 51 °C |
| AFM Hz | **No** | The engine's `mafHz` check reads "not logged" on all nine |
| Gear | Yes | Hard pulls in logged Gear 1–4, mostly 2–3 |
| Torque / power | No | No road proxy beyond rpm and speed |

**Logged target vs table.**
- At TPS Command ≥ 85 %, the logged target **never exceeded 19.2 psi**. The Normal tables hold 21 psi from 3,500 rpm, and Final Boost Target tops out at 23.4.
- Per 500 rpm band ≥ 3,500, the logged target maxima were:
  - 14.3–16.3 psi on aug22-0903;
  - 17.3–19.2 psi on aug30-1529.
- Something between the table and the log already holds the target down. The candidates are KTuner's throttle dampening, the factory heat and knock limits Hondata describes, Cylinder Fill Limitation and the Final Boost Target mapping. The logs alone do not show which one.

## 3. Gate audit (D1)

| D1 gate | Verdict | Reason |
|---|---|---|
| **Undershoot ≤ 1.5 psi** (mean, rpm ≥ 3,500, after spool) | **Keep, and add a channel: EWG Position** | Hondata's over-speed test is undershoot **with the wastegate closed at high rpm**, so read both together. Undershoot with EWG ≈ 0 means the turbo is at its limit or a leak: Stop and Undo, never another step. Undershoot with the wastegate open is a control or target issue. The 1.5 psi figure is still **J** (no tuner publishes one). |
| *(missing)* **The logged target moved** | **Add** | KTuner (dampening, ramp, Final Boost Target) and Hondata (heat and knock protection limits) both say the table is not the target. Today the logs show 19.2 psi max against a 21 psi table. The proof Cool drive must show the logged WOT target in the edited rows up by about the step. If not, another limiter owns boost and the step did nothing: Undo it and do not stack the next one. |
| **Overshoot ≤ 2.5 psi** | **Tighten** | HPA: boost should track target, and overshoot is a control fault (wind-up), not headroom. At the top of the ladder, a 2.5 psi spike over a 23 psi target is 25.5 psi actual, above every file tested on this car (TSP Map 3 and Phearable L3, both ≈ 24 psi). Offer a step only at overshoot ≤ 1.5 (`LIMITS.overshoot.good`), and only while **new target + measured overshoot ≤ 24 psi**. |
| **Knock retard ≤ 1.0°** | **Replace** with achieved ignition | On this log it is KC × table (Hondata, KTuner; fact-check §2). It reads 5–6° in every boosted sample, so the engine already marks it "scheduled" and passes it: as a step gate it can never fail. The per-cylinder signal HPA and Hondata's FK8 note use is not logged. Replace it with **achieved Ignition at matched rpm and boost vs the last proven Map version**. A drop larger than the log's 1° rounding is HPA's "timing falls off a cliff": that step buys heat, not power. Stop there, Undo, and close the ladder. |
| **Knock Control ≤ 0.56** | **Keep the number, tighten the reading** | Hondata (slow octane estimate, high after programming), IMW (a trend that never comes back down is the concern; forced rise above ≈ 5,200 rpm) and TSP (post-flash data is skewed) together require:<br>(a) ignore rpm > 5,200, as the engine already does;<br>(b) a proof drive only once KC has settled back near its floor (0.49, `LIMITS.score.baseline`) **before** the first pull; aug30-1529 started at 0.58;<br>(c) a peak no higher than the last proven version's under similar IAT.<br>0.56 stays **J** (≈ 0.7° by KTuner's formula). |
| **AFR at or richer than target, never leaner than 12.0** | **Keep, and add DIFP vs DIFP Target** | Hondata reads AF against AFCmd plus DIFP vs DIFPCMD and pump duty, because the DI fuel system is the first weak point when boost rises. AFR command and pump duty are not logged; **DIFP and DIFP Target are**. Add `fuelPress` (≥ 90 % of target, `LIMITS.fuelPress.good`; today 97–99 %) to the step proof. |
| **Trims within ±5 %** | **Keep, as a validity gate** | No tuner uses trims to judge boost. TSP judges validity from closed-loop fuel status, which this log lacks; trims are the nearest stand-in for "MAF learned and settled". Also add **AFM Hz to the log layout**: more boost moves airflow toward the AFM table end (10,000 Hz), and no log carries it. |
| **Cool drive (≥ 2 hard pulls) + hot drive** | **Keep, and specify the pulls** | HPA repeats every run and separates heat soak by cooling and rerunning; KTuner/Hondata lower boost with IAT. Specify:<br>• ≥ 2 full-throttle pulls (TPS Command ≥ 85 %) in the same logged Gear, from ≤ 3,000 rpm through ≥ 5,000 rpm, so they cross every edited row (rpm span = **J**);<br>• KC settled first;<br>• the hot drive judged with the same gates.<br>**Today's hot drive (aug30-1601) already ends at KC 0.64 = Watch on the current map**, so on RON95 E10 in Vietnamese heat the ladder will not open. That matches D1's "expect it to stop early", but the owner should hear it as today's result, not a forecast. |
| **Boost By Gear / Final Boost Target** | **Keep protected, add a read** | Boost By Gear = 35.4 psi flat (inactive), so it never arbitrates today. Final Boost Target 23.4 is the app ceiling. Both vendors say these set maxima, not actual boost. The step proof should log which one bounds the target (the "target moved" check above). |

**Cells and step size.**
- +1 psi is at or below every source's step (HPA 2 psi or 20 kPa; KTuner presets 1 psi): **keep**.
- Rows ≥ 3,000 rpm: keep (TSP's gains start ≈ 2,900; Boost By Gear is there for CVT stress).
- Columns: edit only the full-throttle columns the proof pulls actually log, because the target is throttle-dampened. HPA tunes what it has run and only extrapolates the rest.

## Answer

- No Honda tuner publishes boost thresholds. HPA, Hondata and IMW/TSP share one method: one small step, repeat pulls, boost read with the wastegate, knock as a trend, post-flash and heat-soaked pulls thrown out, and a stop when boost costs timing.
- +1 psi steps, rows ≥ 3,000 rpm, Cool + hot proof, and Undo on first fail match that method. Keep them.
- Knock retard ≤ 1° is a dead gate: TunerView logs one scheduled column (KC × table, 5–6° under boost every time). Replace it with achieved Ignition vs the last proven version (a drop > 1° rounding = stop).
- Undershoot: add EWG Position. Undershoot with the wastegate at 0 = turbo limit or leak (Hondata) → Undo, never step.
- Add a "logged target moved" check: today WOT target peaks at 19.2 psi against a 21 psi table, so a table edit may not reach the car.
- Overshoot: tighten to ≤ 1.5 psi, and new target + overshoot ≤ 24 psi (highest vendor-tested on this car).
- Knock Control 0.56: keep, but only after KC settles post-flash, below 5,200 rpm, and with no rise vs the last proven version.
- AFR / 12.0: keep; add DIFP ≥ 90 % of DIFP Target (logged, 97–99 % today). Trims: keep, as validity only.
- Missing from the logs: per-cylinder retard, AFR command, fuel status, AFM Hz, pump duty. Add AFM Hz to the TunerView layout before the first step.
- On today's logs the hot drive already fails Knock Control (0.64), so on RON95 E10 the ladder stays closed until the fuel or the heat changes.

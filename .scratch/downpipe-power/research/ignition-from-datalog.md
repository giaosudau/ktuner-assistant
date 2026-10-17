# Ignition from datalogs (ticket 14)

Question: how do tuners decide, from datalogs, when to add or remove ignition timing on a Honda 1.5T DI turbo (KTuner / Hondata)? And is the owner's idea sound: "try +2 % or +5 % timing and see what happens"?

Car: Civic FE 1.5T CVT on Vietnam E10 RON95 (RON97 is also sold), with a downpipe and a PRL HVI intake, running KTuner Starter 21 Dual Tune 2 and logged with TunerView.

Evidence used: the owner's tables (`data/ktuner-maps-digitized.json`), the nine example drives (`data/example-*.js`), `engine/kta-engine.js` `KTA.LIMITS`, and the external sources listed at the end. Civic X (FC/FK) forum posts are cross-checks only (see the map's Notes). Confidence labels: **high** means primary or vendor documentation, or measured on this car; **medium** means a vendor's or named tuner's forum post; **low** means an owner anecdote or a second-hand quote. Reddit was not used.

The measurement script lives outside the repo, in the session scratchpad (`ign.js`). It decodes the nine drives, compares logged Ignition against the Base and Max rows, and flags Knock Retard that exceeds Knock Control × 10.2°.

---

## 1. How Honda ignition logic works on this engine

**The formula.** Both vendors publish the same rule:

> final = min(Ignition table, Ignition table + Knock Ignition Limit − Knock Control × Knock Retard table)

- KTuner Help gives it as a sum and then "chooses the lesser of the two" [K1].
- Hondata writes it as `minimum(MBT Ignition, MBT Ignition + knock ignition limit − (knock retard x knock control))` [H2]. **high**

What follows from the formula:
- The ECU **never runs more than the Ignition table**. It only removes timing from it.
- "The ECU already advances toward Max when fuel allows" is **false** for the table the owner can edit. Better fuel only lowers Knock Control, which gives back retard. Once Knock Control sits at its floor, nothing more comes back. **high**

**How Honda builds these tables** [H2], **high** (vendor; written for K-series, but it describes the same formula):
- Honda tunes every cell on an engine dyno with an automated process.
- MBT timing is found on very high octane fuel.
- The knock ignition limit is found on 100 RON fuel, and a low-octane limit on 90 RON fuel.
- Knock Control is "the estimated fuel octane, as a percentage of the difference between 100 and 90 octane".
- Knock Control is adjusted "at a fairly slow rate". Honda's system "will not (quickly) actively retard and advance the ignition as some other make vehicles will do".

**What the owner's KTuner file exposes:**

| Table | Axes | What it does | Source |
|---|---|---|---|
| `Ignition_Base_L/H` (20×20) | rpm × calculated load. The load axis is not digitized and the load value is not logged. | The editable main table: the "Ignition table" in the formula. KTuner: "You can use the Ignition Base table to alter final timing. Knock control will still apply its applicable ignition retard." | [K2] KTuner rep, **medium-high**; axis [F1] **medium** |
| `Ignition_Max_L/H` (20×10) | rpm × EGR | A ceiling. In driving, EGR stays in the first two columns (0 and 30). | [F2] owner post with map trace, **medium** |
| `Ethanol_Ign_Adj_L/H` (20×20) | rpm × MAP | Adds timing only as a percentage set by **flex-fuel-sensor ethanol %**. Owner's file: 0 below 4,000 rpm, rising to +5° at ≥ 5,500 rpm. Not active on E10 without a sensor. | [K3] **high** |
| Knock Ignition Limit and Knock Retard tables | — | **Not in the owner's file.** KTuner: "You do not have access to several other tables that play a role." | [K2] **medium-high** |
| `Knock_Sens_*` | rpm × load | Knock detection threshold. A product "never" table, and Hondata warns that desensitizing stops reliable detection. | [H2] **high** |

Hondata names the editable FlashPro table "Knock Ignition Limit". One CivicX post says Hondata and KTuner "edit the same ignition table" [F3], **low** (author not captured). This does not matter here: the owner uses KTuner.

**What the logs carry.** All nine drives have the same 23 TunerView channels: Ignition, Knock Control, Knock Retard, IAT, IAT2, ECT, MAP, Turbo Pressure and Target, TPS, and the rest.

What they do **not** carry: per-cylinder knock, knock count, calculated load, and EGR. That has three consequences:
1. **The logged Knock Retard is scheduled, not measured.** It equals Knock Control × the retard table: about 10.2° under boost, so 5° at the 0.49 floor (`fact-check.md` §2). A KTuner rep confirms that 0.49 "is ideal" even while Knock Retard reads 5–7 at WOT [F4], **medium**.
2. Knock count on this platform is the misfire monitor, not knock [F5], **medium**.
3. **The only real knock signal the owner has is Knock Control.** It is slow and global: one rise retards every boosted cell.

**Heat.** Honda leaves IAT to Knock Control by default, "which is part of why people see swings in knock control" [F1], **medium**. On this car, the hot-traffic drive is where the score climbs (0.64 on Aug 30 16:01).

**The artificial Knock Control rise.** On non-Si 10th-gen ECUs, Knock Control is forced up above about 5,200–5,500 rpm whatever the knock activity [H1][F6].
- Phearable disables it in its race files [P1].
- A CivicX moderator says KTuner Starter maps also remove it, while the legacy Stage maps do not [F7], **low** (second-hand).
- On the FE this rise is unverified. `KTA.LIMITS.score.highRpm` = 5,200 already treats rises above that rpm separately.

**LSPI** (low-speed pre-ignition):
- It happens at about 1,500–2,500 rpm at high load. It starts before the spark, so spark retard cannot stop it [E2] (patent excerpt, **medium**) [E3].
- The owner's Base_H already runs its lowest values in that zone: 1,500 rpm row, top-load cell −10.5°.
- The car's implied retard table there is about 11° (`fact-check.md` §2).
- More timing at low rpm and high load is the wrong direction. The remedies are fewer low-rpm boosted cells, API SP oil, and not lugging the CVT.

**Limits of the knock sensor.** Knock-sensor signal-to-noise falls as rpm rises, because background mechanical vibration grows [E1], **high**. One CivicXI tuner post (**low**) reports that a louder exhaust raised retard. That matters for a downpipe car: Knock Control rises after a downpipe may be noise, real knock, or both. Logs cannot tell them apart. That is a reason to remove timing on a rise, never to desensitize the sensor.

**MBT versus knock-limited.**
- On pump fuel under boost, the engine is knock-limited: it knocks before reaching MBT (maximum brake torque timing) [A3].
- RON95 E10 sits inside Honda's 90–100 RON design window and at the bottom of what tuners require: KTuner "91+" [K4], Phearable "91 minimum" [P1], Hondata base maps tested on 91 [H1].
- RON97 adds octane margin. On Hondata's nominal scale, 2 RON is about 0.2 Knock Control, which is about 2° of retard under boost on this map (10.2° × 0.2). That is an **inference**: on this car Knock Control already sits at its 0.49 floor under boost on RON95. So RON97 can only pay off where Knock Control rises (heat, traffic). It cannot lift timing above the table.

---

## 2. Tuner method table

| Tuner | Step | Channels | Thresholds | Cells | Back-off | Source | Confidence |
|---|---|---|---|---|---|---|---|
| HP Academy, reflash on a **dyno** | +2° over the whole region the ramp run accesses | Ignition, load, rpm, ECU knock feedback; audio knock detection first | Keep adding while torque rises. Stop at the torque plateau (MBT) or at knock. Adjacent cells differ by at most 4–5°. | WOT cells the log shows. Turbo: start at wastegate boost, raise boost while optimising. Leave cruise alone unless it knocks. | Retard to keep 2–3° below knock onset. Take out any advance that gave no torque. | [A1] | high |
| HP Academy, **road** (no dyno) | Shape-preserving; whole-map shifts only after WOT knock-threshold work | Ignition, knock | Avoid detonation only. MBT cannot be seen without a dyno. Light-load advance capped near 40°. | Each zone driven and checked | Remove 2–3° where detonation is heard. Accept a torque compromise. | [A2][A3] | high |
| Hondata (Honda knock control) | Degrees in the main and limit tables | Ignition, K.Control, K.Retard | Turbo on pump fuel is "tuned to the edge of knock": limit columns in boost should be zero. Don't desensitize the sensors. | Where the limit table is negative, lower the main table | Lower the main table where the knock limit is negative | [H2][H1] | high (vendor) |
| KTuner | Degrees in Ignition Base | Actual Ign, Knock Control, Knock Retard | A Knock Control of 0.49 "is ideal". Logged values are rounded (0.5° and 1°). | Ignition Base, followed with map trace | Not published. Knock Control applies retard on its own. | [K1][K2][F4] | high (formula) / medium (forum) |
| Pro Civic (FlashPro race tunes) | — | Knock Control | "If your tune increases (advances) timing you're most likely going to see an increase in Knock Control, which will ironically lead to decreased timing". Factory timing is "right on the edge of knock" on California 91. Race tunes hover in the high 0.5s. | — | Pull timing if Knock Control climbs each pull | [F8] | medium (vendor post) |
| Phearable | Custom file built on a DynoJet | Knock Control; datalog review service | 93 recommended, quality 91 the minimum. Lower fuel quality raises Knock Control and therefore knock retard. | Separate 91 and 93 files (11th-gen Si) | Artificial Knock Control rise disabled; knock-control parameters "optimized" | [P1][P2] | medium (vendor page) |
| TSP | Dyno-developed file (93 octane) | — | Premium 91/93 "REQUIRED" | "Numerous fuel, ignition, turbo response" changes; torque gains limited for engine and transmission safety | Not published | [T1] | medium (vendor page) |
| E-tuners (Steve at E-Tunez, Derek, John Vega) | Revision loop | WOT pulls logged for each revision | Tuner judgement | Tuner-chosen | Next revision | [F9][F10] | low–medium |
| Owner on FlashPro (counter-example) | +0.5 to +4.8° | Knock Control, knock count | First try: "mild pinging", Knock Control rose at part throttle, reverted. Second try: Knock Control peak 71 %, knock count 2 in 41 min. | Low limit table | Reverted to stock | [F9] | low (anecdote) |
| Owner on RON90 (Indonesia) | −0.2° | Knock Control, Knock Retard | Average Knock Control 0.60 → 0.57; retard never reached 10 again | 1,250–1,500 rpm, light-mid load | Removal only | [F11] | low (anecdote) |
| IWM / CAPTS | No public ignition method found | — | — | — | — | searched; not found | — |
| Engineering (Heywood; TI; LSPI patents) | — | — | Knock is detected worse as rpm rises. LSPI cannot be cured by spark retard. | — | — | [E1][E2][E3] | high / medium |

Five independent methods (HP Academy, Hondata, KTuner, Pro Civic, Phearable/TSP) agree on four points:
1. Timing moves in **degrees**, in the cells the log shows the engine using.
2. Additions need **torque proof** (a dyno) and an independent knock check.
3. On pump fuel, a turbo engine already sits at its knock limit.
4. On the street, the sound direction is to **remove** timing where knock shows.

---

## 3. Verdict on the owner's "+2 % / +5 %" idea

**Unsafe as worded. A degree-based *removal* driven by logs is the sound version. Adding timing is sound only with conditions this car does not have today.**

Tested against the methods above and the owner's own file:

1. **Percent is the wrong unit, and on this map it points the wrong way.**
   - All five methods work in degrees.
   - Base_H's boosted cells (3,000–6,000 rpm, top 8 load columns) range from −6.4° to +4.7°, with a median of −1.5°. A "+5 %" multiply there gives about **−0.08°**: slightly *less* timing on negative cells, and nothing anywhere useful.
   - Cruise cells (1,500–3,000 rpm, columns 3–7, median 21°) gain about +1.05° (+5 %) or +0.42° (+2 %). That is where the engine is not knock-limited, and HP Academy says those cells are "normally going to be very close to ideal" from the factory [A1].
   - Measured on the owner's table, **high**.
2. **"See what happens" sees nothing useful.**
   - No dyno means no torque reading, so a gain cannot be proven [A1][A3].
   - The log rounds ignition to 1° and retard to 0.5° [K1]. A +0.1° change is invisible.
   - The only knock channel is Knock Control. It is slow and global: each +0.1 costs about 1° in **every** boosted cell (10.2° × 0.1).
   - Pro Civic: advancing timing → Knock Control rises → net *less* timing [F8].
3. **No fast safety net.**
   - Honda knock control does not retard quickly [H2].
   - The fastest rise in the nine drives is +0.21 within 5 s. Over-advanced cells therefore run knocking until the score catches up.
   - The FlashPro owner who tried it heard pinging on the first attempt [F9].
4. **The fuel is at the bottom of the window.**
   - RON95 E10 is roughly US 89–91 AKI (`power-fundamentals.md` C3).
   - KTuner, Phearable and Hondata set 91 as the minimum [K4][P1][H1].
   - Pro Civic finds the factory timing already at the edge on 91 [F8].
5. **The owner can't aim the change.** The Base load axis is not digitized, and load is not logged. Hondata and HP Academy both say rpm **and load** must be logged to know which cells to change [A1].
6. **Raising the Max table does nothing under boost.** Logged timing under boost sits a median **13.6°** below Max_H's EGR-0 column (p90 8.3° below; 1,461 boosted rows). The only rows that reach it are throttle-lift transients.

**Conditions under which adding timing would be sound** (all are needed; this car meets none today):
- a dyno, or a repeatable measured gain;
- a logged load channel and a digitized Base load axis;
- audio knock detection to confirm the sensor;
- RON97, or a fuel proven better;
- steps in degrees in the WOT cells the log uses, keeping 2–3° below knock onset [A1].

That is what a custom e-tune is.

---

## 4. Are the KTuner Starter ignition tables "good enough"? How are they built?

**How they are built.** KTuner does not publish this.
- The FE page calls them "research calibrations", says "Running 91+ will give the best results", and shows dyno results as images [K4].
- Second-hand reports say Starter ignition matches the Honda factory map: a KTuner dealer said "Mostly", and TSP said "Typically only boost increases" [F7]. A 10th-gen owner who compared the factory and Starter files found "identical ignition table[s]" [F12]. **low–medium.** It cannot be checked here: the repo has no stock FE file.
- If the reports hold, the timing is **Honda's**, built on an engine dyno across a 90–100 RON window [H2], with one table per cam (L/H) rather than per fuel. Fuel adaptation is left to Knock Control.
- KTuner's own rep: "There is also room in our basemaps" [F13], **medium**. So the tables are conservative on purpose, not optimal.

**Good enough for this car?** Yes, for RON95 E10. The safety argument comes from data:
- Under boost, Knock Control sits at its 0.49 floor in normal conditions.
- No drive shows retard beyond what the score schedules (§5).
- The Max table never binds.

They are not "optimal power", and the margin thins in heat (0.64 in hot traffic). Note the L/H meaning: the digitizer note says "Low cam / Low octane, High cam / High octane", so the octane reading is unconfirmed (open question).

**What pros do differently:**
- They build on a dyno (DynoJet at Phearable; TSP on 93 octane) and ship **per-fuel files** (Phearable 91 vs 93) [P1][P2][T1].
- They tune the knock-control parameters the end user cannot reach: Knock Ignition Limit, retard tables, the artificial Knock Control rise [P1][H2].
- They move boost and timing together, starting at low boost [A1].
- They iterate custom revisions from WOT logs [F9][F10].
- On the 11th-gen Si on 93 octane, Phearable claims +32 hp / +69 lb-ft over the KTuner Starter 23 basemap [P2] (vendor; Si; higher octane; not transferable to RON95 E10).
- None of them uses a percent change.

---

## 5. What the nine drives show

Script `ign.js` (session scratchpad, outside the repo). Boosted means Turbo Pressure > 5 psi. WOT means TPS > 70 % and rpm > 2,500.

| Drive | Min | Boosted rows | WOT s / pulls | Ign under boost p10 / p50 / p90 (°) | KC max | s with KC ≥ 0.56 | KR max under boost | KR above KC × 10.2 + 1° (rows) |
|---|---|---|---|---|---|---|---|---|
| aug22-0903 | 9.0 | 527 | 6.1 / 3 | 0 / 2.5 / 6 | 0.70* | 0 | 6.0 | 0 |
| aug22-0950 | 17.5 | 46 | 0 | −2.5 / −1 / 0 | 0.53 | 0 | 5.5 | 0 |
| aug23-1959 | 28.6 | 90 | 0 | 0.5 / 2.5 / 4 | 0.57 | 0 | 5.5 | 0 |
| aug23-2038 | 14.8 | 10 | 0 | 2 / 3 / 4.5 | 0.50 | 0 | 5.0 | 0 |
| aug30-1509 | 0.1 | 0 | 0 | — | 0.77 | 3 | — | 0 |
| aug30-1529 | 19.1 | 401 | 2.4 / 2 | 2.5 / 4.5 / 12 | 0.59 | 203 | 7.0 | 3 |
| aug30-1601 (hot traffic) | 52.5 | 237 | 0 | 1 / 3 / 5.5 | 0.65 | 1,676 | 7.0 | 2 |
| sep01-0813 | 40.5 | 150 | 0 | 3 / 4.5 / 6.5 | 0.54 | 0 | 6.5 | 17 |
| sep05-0756 | 42.8 | 0 (boost channel dead) | 0 | — | 0.50 | 0 | — | 0 |

\* A single-sample glitch: the same row logs Knock Retard 0.5, and the neighbouring rows read 0.49 / 5.5.

What the table shows:
- **Very little WOT.** Five pulls, about 8.5 s in total, the highest 16.5 psi / 5,454 rpm (aug22-0903, where WOT Ignition was 0–4.5° and Knock Control 0.49–0.52). That is not enough for any ignition decision. Every method above needs repeated pulls.
- **Knock Control under boost sits at its 0.49 floor**, so the logged ~5° Knock Retard is scheduled, not knock. Matches `fact-check.md` §2.
- **No real knock event is visible.**
  - Of the 22 "excess retard" rows, 20 are part-throttle boost at 2,223–2,562 rpm (TPS 28–39 %, 5.4–9.9 psi), where the implied retard cell is larger (Knock Retard ÷ Knock Control = 12.2–13.0°). The other two are throttle-lift rows at about 5,050 rpm.
  - Read: the retard table varies by cell. It is not knock. **medium**, because the cell can't be confirmed without load.
- **Timing achieved versus Max:** a median 13.6° below the Max_H EGR-0 column under boost. Max never limits.
- **Timing achieved versus Base:** it can't be placed cell-by-cell (no load axis or channel). Logged boosted timing of −2.5 to 12° sits inside Base_H's mid-to-high-load band.
- **Score rises come from heat and lugging**, not WOT: 1,676 s at KC ≥ 0.56 in hot traffic, against 0 s in most cool drives. That is the zone where extra timing would hurt first.
- **`KTA.LIMITS` agrees with this.** `knock` is 1.0 / 3.0° (worst cylinder, WOT), but this owner's logs have no per-cylinder channel. Only `kControl` 0.56 / 0.80 and `score` (baseline 0.49, tableDeg 10.2, noHard 0.62 held 60 s) can act on these logs.

---

## 6. Safe / unsafe

**Safe**
- Keep the Starter 21 ignition tables as they are, and watch Knock Control, Ignition and Knock Retard together (`kc-ignition-formula`).
- Run RON97 in hot weather or traffic, and compare matched drives by Knock Control. It may reduce rises; it never adds timing above the table.
- Avoid lugging, and keep low-rpm boost down: the LSPI and implied-retard zone at 1,500–2,500 rpm.
- If Knock Control rises repeatably in one rpm band: **remove** timing in degrees in that band's boosted cells (HP Academy: 2–3° below onset [A1]), or step boost down first. One change per flash, then re-log the same conditions.
- Add a calculated-load channel to TunerView logging, and digitize the Base load axis, before any ignition discussion.
- For more timing, buy a dyno-built custom file for the actual fuel (e-tune).

**Unsafe**
- Any **percent** multiply on Ignition Base: it retards negative cells and advances cruise cells.
- "Add and see" without a dyno or knock audio: the only feedback is a slow, global score.
- Adding timing at low rpm and high load (LSPI band), or in hot traffic.
- Raising `Ignition_Max` to "unlock" timing: it doesn't bind under boost, and it moves light-load and decel timing.
- Using `Ethanol_Ign_Adj` without a flex sensor, or faking ethanol content.
- Lowering knock sensitivity to stop Knock Control rises (Hondata: detection stops being reliable).
- Reading the logged Knock Retard of 5° as knock, or knock count as knock.
- Adding timing and boost in the same flash.

---

## 7. Open

- Is the FE Starter 21 ignition identical to the FE factory file? It needs a stock FE ROM read from KTuner.
- The `Ignition_Base` load axis units and the `_L/_H` meaning (cam, or octane).
- Whether the FE has the non-Si artificial Knock Control rise, and whether Starter 21 removes it.
- IWM and CAPTS ignition practice: no public write-up found.
- Whether downpipe noise raises Knock Control on this car: compare matched drives before and after fitting.

---

## Answer

1. Honda's ECU never runs more timing than the Ignition Base table. It only takes timing away, through a slow, global Knock Control score (KTuner and Hondata formula).
2. On RON95 E10 this car already sits at the score's 0.49 floor under boost, so the table *is* the timing. The logged ~5° Knock Retard is scheduled, not knock.
3. The Max table (rpm × EGR) sits about 14° above the timing actually run under boost, so it never limits. Ethanol Ign Adj needs a flex sensor.
4. "+2 % / +5 %" is **unsafe as worded**. Percent retards the negative boosted cells (−0.08° at +5 %) and adds about 1° in cruise cells that are already near ideal.
5. "See what happens" can't be seen either: no dyno, logs rounded to 0.5°/1°, no load or per-cylinder knock channel.
6. HP Academy, Hondata, KTuner, Pro Civic and Phearable/TSP all work in degrees. They add only with dyno proof and keep 2–3° from knock; on the street they remove.
7. Adding timing is sound only with a dyno, a logged load channel, knock audio and better fuel. That is a custom e-tune, not a DIY step.
8. The sound DIY move is a degree-based **removal** where Knock Control rises repeatably, plus RON97 in heat.
9. The nine drives hold only five short WOT pulls (8.5 s), with no knock event beyond the schedule. Score rises come from heat and lugging, not from WOT.
10. The KTuner Starter ignition is reportedly Honda's own dyno-built map (built for 90–100 RON fuel), left conservative ("room in our basemaps"). It is good enough and safe for RON95 E10; it is not maximum power.
11. Pros differ by building on a dyno, shipping per-fuel files, retuning hidden knock-control tables and iterating custom revisions from WOT logs. None uses percent.
12. Product stance: ignition stays a no-edit table for adding. Ticket 16 may make degree-based removal a proof-gated lever once a load channel exists.

---

## Sources

- [K1] KTuner Help, "Ignition Timing And Knock Control" — ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm (read via r.jina.ai, 2026-10-05)
- [K2] KTuner (J.R., Elite Sponsor), CivicX "understanding ignition and timing", post-788835 — civicx.com/forum/threads/understanding-ignition-and-timing.48243/
- [K3] KTuner Help, "Civic/Accord Flex Fuel Tuning" — ktuner.com/KTunerHelp/civic_accord_flex_fuel_tuning.htm
- [K4] KTuner, "22+ Civic 1.5T" — ktuner.com/22civicturbo/
- [H1] Hondata FlashPro Help, 10th-gen Civic Tuning Notes — hondata.com/help/flashpro/10g_civic_notes.htm
- [H2] Hondata FlashPro Help, "Knock control tables" — hondata.com/help/flashpro/knock_control_tables.htm (same text: hondata.com/help/kmanager/knock_control.htm)
- [A1] HP Academy, Practical Reflash Tuning, "Ignition Timing" — hpacademy.com/courses/practical-reflash-tuning/basic-tuning-ignition-timing
- [A2] HP Academy, Road Tuning, "Tuning Ignition Timing On The Road" — hpacademy.com/courses/road-tuning/steady-state-ignition-tuning-tuning-ignition-timing-on-the-road/
- [A3] HP Academy, "What is MBT?" — hpacademy.com/technical-articles/what-is-mbt/
- [P1] Phearable, KTuner Stage 1.5 RACE tune (non-Si 1.5T) — phearable.net/tuning-software/ktuner-stage-1.5-race-tune-non-si.html
- [P2] Phearable, KTuner 11th-gen Civic Si Stage 1.5 RACE tune — phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-si/ktuner-11thgen-honda-civic-si-stage-1-5-race-tune.html
- [T1] Two Step Performance, TSP Stage 1 (2016–21 Civic 1.5T non-Si) — twostepperformance.com/products/tsp-stage-1-tune-for-2017-honda-civic-non-si
- [F1] CivicX, "Trying to understand ignition tables..." (reply; author not captured) — civicx.com/forum/threads/trying-to-understand-ignition-tables.21157/
- [F2] CivicX, "Ignition Max Table Ktuner" — civicx.com/forum/threads/ignition-max-table-ktuner.94771/
- [F3] CivicX, "Ignition timing and horsepower", page 2, reply to #18 — civicx.com/forum/threads/ignition-timing-and-horsepower.45614/page-2
- [F4] CivicX, "[Ktuner Starter Map] KnockRetard on WOT" (KTuner reply) — civicx.com/forum/threads/ktuner-starter-map-knockretard-on-wot.102332/
- [F5] CivicX, "Knock event tracing from csv output" #3–#4; "Knock Count / Knock Control" — civicx.com/forum/threads/knock-event-tracing-from-csv-output.44216/ ; civicx.com/forum/threads/knock-count-knock-control.41631/
- [F6] CivicXI, "Controlling Knock Control" p1–2 — civicxi.com/forum/threads/controlling-knock-control.41116/
- [F7] CivicX, "Ktuner stage 2" (OP quoting Derek and TSP; gtman) — civicx.com/forum/threads/ktuner-stage-2.86391/
- [F8] CivicX, "High Knock control reading after KTuner v2 flash" (procivic posts) — civicx.com/forum/threads/high-knock-control-reading-after-ktuner-v2-flash.19473/
- [F9] CivicX, "Guidance/Tips on Ignition Timing Tuning in Hondata Flashpro for Civic 1.5T" — civicx.com/forum/threads/guidance-tips-on-ignition-timing-tuning-in-hondata-flashpro-for-civic-1-5t.52154/
- [F10] CivicX, "2020 Si Custom Tune High Knock Control - Datalog Review" — civicx.com/forum/threads/2020-si-custom-tune-high-knock-control-datalog-review.54563/
- [F11] CivicXI, "Knocking" — civicxi.com/forum/threads/knocking.44171/
- [F12] CivicX, "About timing ignition" — civicx.com/forum/threads/about-timing-ignition.84974/
- [F13] CivicX, "Ktuner Ignition Timing" (KTuner reply) — civicx.com/forum/threads/ktuner-ignition-timing.30576/
- [E1] Texas Instruments, "Engine Knock Detection Using Spectral Analysis..." SPRA039 — ti.com/lit/pdf/spra039
- [E2] US Patent 10,823,098, "Low speed pre-ignition knock detection, mitigation, and driver notification" (search excerpt: LSPI "cannot be mitigated via conventional spark retardation"; full text not read) — USPTO ppubs
- [E3] NASA Speed News, "Preventing Low-Speed Pre-Ignition in Turbocharged, Direct-Injection Engines" — nasaspeed.news/tech/engine/preventing-low-speed-pre-ignition-in-turbocharged-direct-injection-engines/
- Repo: `docs/research/fact-check.md` §2 and §5, `docs/research/ktuner-help-pages.md`, `knowledge/cards/kc-ignition-formula.md`, `data/ktuner-maps-digitized.json`, `data/example-*.js`, `engine/kta-engine.js` `KTA.LIMITS`, `PRODUCT.md` line 50; branches `research/power-fundamentals` and `research/log-evidence`.

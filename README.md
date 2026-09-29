# Civic FE Tune Assist

A guided companion for tuning a **Honda Civic FE (11th gen) 1.5T CVT** with **KTuner** (or Hondata FlashPro) on **Vietnam E10 RON95**.

It starts from a normal drive. Load a KTuner TunerView log and the app checks safety first. It then gives you **one thing to do**: free habits before flashes, the biggest effect for the least work first. The next log **proves** whether it worked. When the evidence asks for a real calibration, the full 7-step AFR method (bolt-ons: high-volume intake, downpipe, front pipe, cat-back, big intercooler and CVT cooler) is one click away. It works in English and Tiếng Việt, and it never touches the ECU: you make every change yourself, then the log decides.

## Open it

Double-click `index.html`. It runs offline in any recent Chrome, Edge, Safari or Firefox. Your logs stay in the browser tab and are never uploaded anywhere. Settings, ticked checklists and the action you are working on are remembered on that device.

No log with you? Your own three drives are built in (Aug 30 15:29 and 16:01, Sep 1 08:13). The Full method steps also have three **simulated** sample logs (clearly labelled).

## Drive check: check a drive, do one thing, prove it

The home screen. Three steps, one action at a time:

1. **Check a drive.** You get a safety verdict (the same five gates as the Full method), your **#1 action**, and the ranked list: *up next*, *later* (locked, with exactly what unlocks each item) and *checked and fine* (with the numbers).
2. **Do one thing.** Each action has at most three steps, how the next log proves it, and how to undo it. "Start" stores a small snapshot of this drive in the browser.
3. **Prove it.** Load the next similar drive. The verdict is *keep*, *partial*, *retry*, *undo*, *stop* (a new safety problem) or *cannot tell*. A cooler drive cannot prove a heat or knock fix; a highway drive cannot prove a town habit; acceleration runs count only at a similar intake temperature.

**How the order is decided** (`KTA.planActions`, the same log always gives the same list):
- Anything that says **Stop** comes first, worst first, and while it is open nothing else is.
- Everything else scores `3 × effect − 2 × effort − 2 × risk − 1 if it needs a flash + 2 × how directly this log shows it`. Free habits usually win.
- Anything that needs something first is **locked**. Gain levers stay locked until the car is proven healthy.

**What your three drives say:**

| | Aug 30, 15:29 | Aug 30, 16:01 | Sep 1, 08:13 |
|---|---|---|---|
| Verdict | Watch | Watch | OK |
| Knock Control | 0.58 → 0.49 | 0.49 → 0.64 (peak 0.65) | 0.51 → 0.49 |
| Lugging (900-1,700 rpm with load) | 0.1 % | 6.9 % | 5.1 % |
| Full-load AFR (map asks 11.0) | 10.2 | 10.2 | 10.6 |
| Wastegate open at peak boost | 2.6 % at 19 psi | 2.7 % | 2.6 % |
| Best 50→70 km/h | 1.83 s, foot down | 2.3 s | 1.97 s |
| Your #1 | Cool the intake before a pull | **Keep the revs up in hot traffic** | Log the missing channels |

In the 16:01 drive, 31 of the 41 steps up in Knock Control came while lugging, at a median of 1,437 rpm and 44 km/h. That is the CVT holding low rpm in D on a hot day; the ECU then takes timing away everywhere. The fix is free: S mode or a paddle below 60 km/h. Nothing in the logs is damaging the engine: the mixture is never lean, DI fuel pressure holds, and fuel trims stay within ±2.4 %, so the AFM needs no correction. More boost is locked: the wastegate is nearly shut at peak, so the turbo is near its limit on this map.

**Engineering view.** Four graphs, each with a plain-words *Explain*:
- Knock Control through the drive, with lugging and intake air;
- a timing map (median ignition and scheduled knock retard by rpm × MAP, with the lugging zone outlined);
- mixture under boost against the map target and the lean limit;
- acceleration windows.

**Ask about this drive.** Built-in answers work offline. With your own Anthropic API key (AI settings; the key stays in the tab unless you tick Remember, and you pick the model from your account), an AI explains in plain words. It reads the drive only through fixed tools, never the raw log. Every number it says must match a tool result. It may only recommend actions from the list and never a locked one. Edits the app never makes (lower knock sensitivity, add ignition timing, disable a protection) are rejected. A failed check gets one repair turn, then the built-in answer is shown instead.

Why the app works this way, with the good, the bad and the debate behind each decision: [docs/PRODUCT-REVIEW.md](docs/PRODUCT-REVIEW.md).

Two reference screens sit under **Reference** in the left rail:

- **Your KTuner map**: all 39 tables from your file (base map: KTuner **Starter 21 Dual Tune 2**, 18 psi ECO / 21 psi Normal-Sport), each tagged edit, check, leave stock or never touch. Every table opens as a 2D grid, 2D lines or a 3D surface you can turn by dragging or with the arrow keys. The cells the basic stage changes are outlined, with before → after, and a Difference view shows only what an edit moves.
- **Road tune guide**: what a tuner changes on this car without a dyno (and what not), the E10 and boost answers, a safe road-pull procedure for the CVT, the "must a 3D map be smooth?" fact check, a tuner panel, and a kept/adapted/left verdict on every idea from the video lessons.

The same edit plan is also in your spreadsheet: `data/KTuner-Maps-Edit-Plan.xlsx` is a copy of your file with a first sheet listing the plan, every cell to change highlighted with a before → after comment, and each tab coloured by what to do with it.

## The Full method (AFM calibration)

**Measure air, then fuel, then gain.** One change per flash, one log per change, one decision per log:

```
Edit one table → Flash → Log the same drive → Check the five gates
        ↑                                            │
        └──────── Stop: undo the last change ────────┘   Pass: next step
```

1. **Air measurement first.** The new intake housing changes how the AFM (MAF) sensor reads air. Until the AFM Flow table matches the housing, every fuel decision starts from a wrong number.
2. **Fuel second, in two places.** At idle and cruise the ECU runs closed loop, and fuel trims reveal the error. At full throttle it runs open loop and the trims switch off, so the factory A/F sensor is checked against the commanded AFR on its own.
3. **Gains last.** Only on a tune that already passes a hot afternoon after traffic, which is Vietnam's worst case.

### The seven steps

| Stage | Step | Done when |
|---|---|---|
| Prepare | 1. Your car and mods | Six pre-checks ticked (boost leak test, no exhaust leak before the A/F sensor, plugs, ½ tank E10 RON95, CVT fluid, charger on while flashing) |
| Prepare | 2. Baseline log | A log with 5+ minutes of steady cruise |
| Tune AFR | 3. Airflow (AFM Flow) | Fuel trims within ±5 % at every AFM point you drove |
| Tune AFR | 4. Full-throttle fuel | Measured within ±0.3 AFR of command, never leaner than 12.0 (λ 0.82) |
| Tune AFR | 5. Confirm cool and hot | A cool-morning log and a hot-afternoon log, both without a Stop |
| Gain | 6. Gain, one lever at a time (optional) | A clean log after each lever |
| Review | 7. Review and sign-off | A tuner who uses KTuner or Hondata approves |

### The five gates every log is graded on

| Gate | Checks | OK | Watch | Stop |
|---|---|---|---|---|
| Fuel | Cruise trims (STFT+LTFT) per AFM point | ±5 % | ±5–10 % | beyond ±10 % |
| | Full-throttle mixture vs command (without a command channel: vs the map's full-load target; richer is safe) | ±0.3 AFR | 0.3–0.6 | > 0.6, or leaner than 12.0 held 0.3 s under boost |
| | DI fuel pressure, worst 5 % of a pull | ≥ 90 % of target | 80–90 % | < 80 % |
| Air | Boost overshoot (target 12 psi or more, held 0.3 s, target and throttle not falling) | < +1.5 psi | +1.5–2.5 | > +2.5 psi |
| | Boost undershoot after spool | < 1.5 psi | 1.5–3 | > 3 psi |
| | AFM sensor peak | < 9,500 Hz | 9,500–9,900 | > 9,900 Hz |
| Spark | Knock retard in a pull, worst cylinder (one column plus Knock Control, as KTuner logs this ECU: shown as scheduled retard, judged by Knock Control) | ≤ 1° | 1–3° | > 3°, or several cylinders together |
| | Knock control (0 ≈ RON 100, 1 ≈ RON 90; RON95 sits near 0.5) | ≤ 0.65 and steady | > 0.65, or rising > 0.10 in one drive | > 0.85 |
| Heat | Intake air temp in a pull (no pull: under boost, then while moving; standstill soak is shown apart) | ≤ 50 °C | 50–60 | > 60 °C |
| | Coolant | ≤ 100 °C | 100–105 | > 105 °C |
| CVT | CVT fluid | ≤ 90 °C | 90–100 | > 100 °C |
| | Engine torque (if logged) | within 3 % of your base map's own peak (baseline log) | 3–8 % over | > 8 % over |
| | Boost below 3,000 rpm vs the reference map (only raising it counts) | ≤ +1.5 psi | +1.5–3 | > +3 psi |

Every Watch or Stop comes with the fix and the table to look at. Without a baseline log, torque is compared with a 280 Nm guideline and can only reach Watch: your untouched base map is the reference, not a number from elsewhere.

## What you edit, and what stays stock

| Table (sheet in your file) | When | Cells | Change |
|---|---|---|---|
| **AFM Flow (Custom)** · `MAF_Scaling_Custom` | Stage A | all 103 points | The app computes the new row from your trims and full-throttle error. Copy and paste it into KTuner. |
| **WOT Enrichment** · `WOT_Enrich_L`, `WOT_Enrich_H` | Checked in Stage A; Lever 1 in Stage B | rows 3,000–6,600 rpm × columns 7–9 (27 per table) | 11.0 → 11.5 AFR (λ 0.78), 11.3 from 5,500 rpm |
| **Boost Target 1/2/3 Normal** · `Boost_Target_{1,2,3}_Normal_{L,H}` | Lever 2, only if your ceiling is above the map peak | rows 3,500–5,500 rpm × the 21 psi columns (45 per table) | +1 psi. Never below 3,000 rpm. |

Every edit is checked for shape: no cell may become a new spike or dip against its neighbours. A ramp between neighbours is fine, because the ECU interpolates between cells.

Left stock on purpose in the basic stage: ignition base and max (knock control already finds timing), knock sensitivity (raising it hides knock), the DI fuel pressure target (it tops out at 18,000 kPa = 180 bar; the values are kPa, not psi), cylinder fill limitation and boost by gear (the ECU's torque guards for the CVT), the final boost target, and exhaust VTC.

Your attached map already asks for 21 psi from 3,500 rpm, against about 16.5 psi stock. That is why the default ceiling is 21 psi and Lever 2 proposes nothing until a reviewer agrees to raise it. For RON95 E10 in tropical heat, the safer gains are an efficient mixture and a car that never has to pull timing.

## How the AFM correction is computed

- Each steady, warm, closed-loop sample adds its combined trim `(1+STFT)(1+LTFT)−1` to the AFM points either side of its frequency, weighted by distance (the same interpolation the ECU uses).
- Settled full-throttle samples add their mixture error (measured ÷ commanded − 1) at higher frequencies, but only where DI fuel pressure held at 95 % of target or more. If fuel pressure sagged, the lean reading is a fuel-supply problem, not airflow.
- The corrections are lightly smoothed and interpolated between points. Below your data the nearest value is held. Above it, a richening correction is held and a leaning one fades to zero, so cruise data never leans out the full-throttle end.
- Every point moves at most ±10 % per round, and the new curve must rise at every point.

The test suite checks the method end to end: one round on simulated Sample A brings trims from about +9.5 % to under 3 %, and full-throttle error inside 0.3 AFR.

## Is a smooth 3D map required? (fact check)

Mostly true, for a narrower reason than tuning videos usually give. The ECU interpolates between cells, so a lone spike or dip is a bump the engine drives over: surging, a knock spot, wobbling boost. So **every edit must blend with its neighbours**, and an AFM Flow curve must be a smooth, rising curve (HP Academy: bumps or dips mean a problem).

But factory tables carry deliberate shapes: boost jumps from vacuum to boost across one column, ignition dips where the engine is knock-limited, and DI pressure steps with load. Your own map shows the risk. A blind 3×3 smooth of `Ignition_Base_H` would add +1.3° at 2,000 rpm in the highest-load column, and raise 7 cells in the boosted high-load zone by 1° or more. That is the peak-torque zone, where knock lives. Our rule: **smooth what you change, not what Honda made.** The "VE table must look like a smooth hill" advice is for speed-density standalones. This ECU measures air with the AFM, so there is no VE table to build.

## E10, in one paragraph

E10 has been mandatory for petrol nationwide since 1 June 2026 (Circular 50/2025/TT-BCT; E5 RON92 stays on sale until 2030). Its chemically correct ratio is about 14.1:1, but the ECU and the A/F sensor work in lambda, and KTuner and Hondata show AFR as λ × 14.7 on any fuel. So 14.7 on screen is still λ 1.00, and 11.0 is still λ 0.75: **keep your targets**. E10 carries about 3 % less energy per litre, so expect trims 2–4 % positive and slightly higher consumption. Honda Việt Nam confirms its cars are E10-compatible.

**Does E10 need more fuel? Not by hand.** At idle and cruise the trims add it. The Stage A correction is built from those trims, so it carries the difference too; that makes the ECU read slightly more air than is there, which errs towards less timing and the safe side. At full throttle the ECU is open loop and the long-term trim doesn't apply (Hondata), so the full-throttle check decides. US pump petrol is E10 and US cars are certified on E10, so US-developed maps were built on E10-type fuel: expect a small full-throttle error, not the 4 % the prototype added everywhere.

## What Vietnam adds

- **Tune cool, verify hot.** Calibrate in the morning; prove the result on a 32 °C+ afternoon after traffic (Step 5).
- **Heat soak.** After stop-and-go traffic, cruise 5 minutes before any logged pull.
- **Flooded streets.** A cone filter low in the bumper can swallow water in the rainy season.
- **Where to pull.** Only on a closed road, at a track day or on a dyno, with a passenger running the laptop.
- **Catless downpipes** set P0420 and fail the đăng kiểm emissions test. A high-flow catted pipe avoids both.
- **Road pulls on a CVT:** in S mode the paddles hold one step (on cars that have them), so rpm sweeps cleanly; in D the CVT may hold or step rpm, which still gives a valid check. Warm up, cruise 5 minutes after traffic, pull from about 2,000 rpm, lift at once if AFR goes past 12.0, knock retard passes 3° or boost overshoots by 3 psi, and cool down 2–3 minutes between pulls. No brake-boosted launches: belt clamping follows the ECU's torque signal and can lag a sudden torque rise.
- **ECO is your hot-day mode:** your map's ECO boost is 18 psi (Stage 1). If knock control climbs past 0.65 on a hot afternoon, drive in ECO and add nothing.

## Logs the app understands

KTuner (TunerView) and Hondata CSV exports. The reader copes with a BOM, lines above the header, a units row, comma, semicolon or tab delimiters, decimal commas, AFR or lambda, °C or °F, psi, kPa (gauge or absolute) or bar, and trims as %, fraction or multiplier. Columns are matched by name; if one is picked wrongly, fix it under **Columns in this log** and the log is re-checked at once.

A KTuner TunerView export reads as it comes:
- Turbo Pressure and its target (the boost sensor ahead of the throttle);
- MAP in psi gauge;
- DIFP and its target, judged as a ratio (the export has no units);
- TPS Command;
- EWG position;
- IAT2 and Gear.

The "Acceleration" g-sensor is never taken as the pedal. Logger glitches are removed and counted, never used:
- 127.5° knock retard;
- gear 136;
- 52 psi boost spikes;
- DIFP readings of 21,000;
- lone Knock Control spikes.

Samples with the O2 sensor at its lean stop (fuel cut) are left out of mixture numbers.

Log these channels:
- engine speed;
- AFM Hz (and g/s);
- STFT and LTFT;
- AFR **and AFR command**;
- throttle and throttle command;
- boost and boost target;
- MAP;
- knock retard and knock control;
- IAT, ECT and CVT temperature;
- DI fuel pressure and its target.

Log ten samples a second or more. The default TunerView layout has no AFR command and no AFM flow. The Drive check asks you to add them, because the rich full-throttle question and any AFM correction need them.

## Review and sign-off

Step 7 runs automatic reference checks:
- The AFM curve rises at every point, no point moved more than 10 %, and the total change from factory is sensible.
- WOT targets sit inside 11.0–12.0 AFR.
- The boost peak is at or under your ceiling, and nothing below 3,000 rpm changed.
- The latest log passes, and a hot-day log was checked.

A reviewer who uses KTuner or Hondata ticks what software can't see (maps compared, untouched tables, leak tests), then approves or asks for changes. The app writes a Markdown **review packet**, in English or Vietnamese, for Zalo or a Facebook tuning group.

## Honest limits

- This is a guide and a log checker, not a certified calibration. Every change is yours; a second tuner should review it.
- The reference maps are digitized from screenshots. Their load (column) axes weren't captured, and the factory AFM curve is partly reconstructed. Paste the AFM row you actually flashed in Step 3 for exact numbers, and check a column's real load value in KTuner before you type a change.
- The tuner panel on the guide screen is a structured debate built from each camp's published guidance, not quotes from real people.
- Sample logs are simulated to show the workflow. They are not measurements of any car.
- Thresholds are deliberately conservative for RON95 E10 in heat. The 280 Nm CVT ceiling is a guideline (stock is 240 Nm; Hondata's 11th-gen CVT base map adds about 40–50 lb-ft on US 91 octane).
- That the logged Knock Retard is retard *scheduled* from Knock Control is read from your logs: steady about 5° under boost, 0 at 2,000-3,000 rpm cruise, tracking Knock Control. The app therefore judges knock by Knock Control, the ECU's own response to knock.
- The built-in drives are your logs, trimmed: 13 unused channels dropped and every second sample kept. The findings match the full logs; acceleration times can differ by a few hundredths.
- The AI helper explains; it never decides. Its answers pass a number check, but read them as explanations of the numbers above, not as tuning advice.

## Sources

- Hondata: [lambda meters and air/fuel ratios](https://www.hondata.com/tech-lambda-meters-air-fuel-ratio)
- Hondata forum: [calibrating the AFM from fuel trims](https://www.hondata.com/forum/viewtopic.php?t=25030) and [long-term trim only applies in closed loop](https://hondata.com/help/smanager/ltrim.htm)
- KTuner forum: [knock count and knock control](http://www.ktuner.com/forums/viewtopic.php?t=2600)
- Motor1: [Hondata adds 34 hp and 50 lb-ft to the 2022 Civic](https://www.motor1.com/news/522626/2022-honda-civic-aftermarket-tune/)
- VietnamNet: [Vietnam mandates nationwide E10 fuel from June 2026](https://vietnamnet.vn/en/vietnam-mandates-nationwide-e10-fuel-from-june-2026-2472045.html)
- Tuổi Trẻ: [Honda confirms its cars in Vietnam can use E10](https://tuoitre.vn/saigontimes/honda-xac-nhan-toan-bo-xe-chinh-hang-dung-duoc-xang-e10-1061241067.htm)
- IEA-AMF: [E10 fuel properties](https://iea-amf.org/content/fuel_information/ethanol/e10/ethanol_properties)
- KTuner: [2022+ Civic 1.5T and the Starter 21 Dual Tune](https://ktuner.com/22civicturbo/)
- KTuner help: [ignition timing and knock control](http://www.ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm), [Civic/Accord flex-fuel tuning](http://www.ktuner.com/KTunerHelp/civic_accord_flex_fuel_tuning.htm)
- KTuner forum: [STFT tuning and the AFM Flow table](http://www.ktuner.com/forums/viewtopic.php?t=2152)
- Hondata: [knock control tables](https://www.hondata.com/help/flashpro/knock_control_tables.htm), [FlashPro open loop and closed loop](https://www.hondata.com/forum/viewtopic.php?t=16245)
- CivicX: [what knock control means on the 1.5T](https://www.civicx.com/forum/threads/knock-control-significance.29457/), [S mode and paddles on a tuned 1.5T CVT](https://www.civicx.com/forum/threads/ktuner-hondata-and-s-mode-1-5t-cvt.39469/)
- Honda: [the 1.5-litre turbo (electric wastegate, direct injection, dual VTC)](https://hondanews.com/en-US/honda-automobiles/releases/release-40b876fa88ce36bf41449f6e441f9b95-honda-15-liter-turbo-engine)
- EIA: [E10 is over 95 % of US petrol](https://www.eia.gov/energyexplained/biofuels/ethanol-use.php); EPA: [Tier 3 certification test fuel is E10](https://www.federalregister.gov/documents/2020/05/13/2020-07202/vehicle-test-procedure-adjustments-for-tier-3-certification-test-fuel)
- US patent 6,454,675: [CVT line pressure set from engine torque](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6454675)
- HP Academy: [WinOLS map identification basics](https://www.hpacademy.com/blog/winols-map-identification-basics/); MegaManual: [keep the spark table smooth](http://www.megamanual.com/begintuning.htm)
- Civic11 forum: [Starter 21 Dual Tune 2 owner reports](https://www.civic11forum.com/threads/ktuner-starter-21-dual-tune-2-reliablity.7685/)
- Hondata forum: [no knock at WOT but high knock control at low rpm and low load (1.5T)](https://www.hondata.com/forum/viewtopic.php?t=25913)
- [Low-speed pre-ignition](https://en.wikipedia.org/wiki/Low-speed_pre-ignition) (high load at low rpm in turbo DI engines); Kendall: [API SP / ILSAC GF-6 and LSPI](https://www.kendallmotoroil.com/news/everything-you-need-to-know-about-gf-6-and-api-sp-motor-oil-standards/)
- VnExpress: [Civic RS specifications, Vietnam](https://vnexpress.net/oto-xe-may/v-car/phien-ban-xe/honda-civic-2022-rs-461)

## Project layout

```
index.html              the app (open this)
app/app.js              interface: drive check, steps, log loading, charts, map screen (2D/3D), guide, review packet
app/app.css             "dyno sheet" look, light and dark
app/i18n.js             step text in English and Vietnamese
app/i18n-map.js         map screen and road tune guide text in English and Vietnamese
app/i18n-drive.js       drive check, action catalog, graph explanations and built-in answers (EN / VI)
engine/kta-engine.js    tuning math: CSV reading, channel detection, glitch filter, the five gates, AFM correction,
                        gain levers, table catalog, edit plan, shape check, 3D surface, sample logs
engine/kta-drive.js     drive check: insights (lugging, Knock Control episodes, heat, mixture by boost, trims by
                        load, pulls and headroom, acceleration windows, timing map), the ranked queue, proof, graphs
engine/kta-ask.js       "Ask about this drive": fixed tools, the number check, the API loop, built-in answers
data/example-*.js       your three TunerView drives, trimmed (gzip + base64 so they open from file://)
docs/PRODUCT-REVIEW.md  the product review: good, bad, debate, decisions, loop, priority rules, safety, metrics
data/KTuner-Maps-Digitized.xlsx   your digitized KTuner map, as you sent it
data/ktuner-maps-digitized.json   the same map as JSON (source of truth for the app)
data/KTuner-Maps-Edit-Plan.xlsx   your map with the edit plan sheet and highlighted cells
data/ktuner-map.js      the whole map as a script, so the app works from file://
tools/sync-ref.js       rebuilds the engine's reference block and data/ktuner-map.js from the JSON
tools/edit-plan.js      prints the edit plan, cell by cell, from the engine
tools/annotate-xlsx.py  writes data/KTuner-Maps-Edit-Plan.xlsx (python3 + openpyxl)
tools/build-examples.js builds data/example-*.js from TunerView CSV exports
test/engine.test.js     engine tests (node --test)
test/drive.test.js      drive check on your three real logs
test/ask.test.js        the AI helper against a scripted fake API (no network, no key)
e2e/app.e2e.js          end-to-end run of the app in Chromium (Playwright)
```

```
npm test          # engine, drive check and AI helper tests, no dependencies
npm run e2e       # needs Playwright (npm i, or a global install on NODE_PATH)
npm run sync-ref  # after editing data/ktuner-maps-digitized.json
python3 tools/annotate-xlsx.py   # refresh the annotated spreadsheet
npm run examples -- aug30-1601=TunerView_20260830_160151.csv   # rebuild a built-in drive
```

# Civic FE Tune Assist

A guided companion for tuning a **Honda Civic FE (11th gen) 1.5T CVT** with **KTuner** (or Hondata FlashPro) on **Vietnam E10 RON95**.

It walks you through basic AFR tuning after bolt-ons: high-volume intake, downpipe, front pipe, cat-back, big intercooler and CVT cooler. It reads your datalogs and tells you in plain words what to change, in which table, and whether the next log proves it. It works in English and Tiếng Việt, and it never touches the ECU: you make every edit yourself, then the log decides.

## Open it

Double-click `index.html`. It runs offline in any recent Chrome, Edge, Safari or Firefox. Your logs stay in the browser tab and are never uploaded anywhere. Settings and ticked checklists are remembered on that device.

No car nearby? Every step has three **simulated** sample logs (clearly labelled) so you can see how a log reads before you record your own.

## The method

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
| | Full-throttle mixture vs command | ±0.3 AFR | 0.3–0.6 | > 0.6, or leaner than 12.0 under boost |
| | DI fuel pressure, worst 5 % of a pull | ≥ 90 % of target | 80–90 % | < 80 % |
| Air | Boost overshoot | < +1.5 psi | +1.5–2.5 | > +2.5 psi |
| | Boost undershoot after spool | < 1.5 psi | 1.5–3 | > 3 psi |
| | AFM sensor peak | < 9,500 Hz | 9,500–9,900 | > 9,900 Hz |
| Spark | Knock retard in a pull, worst cylinder | ≤ 1° | 1–3° | > 3°, or several cylinders together |
| | Knock control trend | steady | rising > 0.15 | |
| Heat | Intake air temp in a pull | ≤ 50 °C | 50–60 | > 60 °C |
| | Coolant | ≤ 100 °C | 100–105 | > 105 °C |
| CVT | CVT fluid | ≤ 90 °C | 90–100 | > 100 °C |
| | Engine torque (if logged) | ≤ your ceiling (280 Nm default) | +5 % | above |
| | Boost below 3,000 rpm vs the reference map | ≤ +1.5 psi | +1.5–3 | > +3 psi |

Every Watch or Stop comes with the fix and the table to look at.

## What you edit, and what stays stock

| Table | When | Change |
|---|---|---|
| **AFM Flow (Custom)** | Stage A | The app computes the new 103-value row from your trims. Copy and paste it into KTuner. |
| **WOT Enrichment L and H** | Checked in Stage A; Lever 1 in Stage B | 11.0 → 11.5 AFR (λ 0.78) in the three full-load columns from 3,000 rpm, 11.3 from 5,500 rpm. |
| **Boost Target 1/2/3, Normal, L and H** | Lever 2, only if your ceiling is above the map peak | +1 psi on the full-load plateau at 3,500–5,500 rpm. Never below 3,000 rpm. |

Left stock on purpose in the basic stage: ignition base and max (knock control already finds timing), knock sensitivity (raising it hides knock), the DI fuel pressure target (it tops out at 18,000 kPa = 180 bar; the values are kPa, not psi), cylinder fill limitation and boost by gear (the ECU's torque guards for the CVT), the final boost target, and exhaust VTC.

Your attached map already asks for 21 psi from 3,500 rpm, against about 16.5 psi stock. That is why the default ceiling is 21 psi and Lever 2 proposes nothing until a reviewer agrees to raise it. For RON95 E10 in tropical heat, the safer gains are an efficient mixture and a car that never has to pull timing.

## How the AFM correction is computed

- Each steady, warm, closed-loop sample adds its combined trim `(1+STFT)(1+LTFT)−1` to the AFM points either side of its frequency, weighted by distance (the same interpolation the ECU uses).
- Settled full-throttle samples add their mixture error (measured ÷ commanded − 1) at higher frequencies, but only where DI fuel pressure held at 95 % of target or more. If fuel pressure sagged, the lean reading is a fuel-supply problem, not airflow.
- The corrections are lightly smoothed and interpolated between points. Below your data the nearest value is held. Above it, a richening correction is held and a leaning one fades to zero, so cruise data never leans out the full-throttle end.
- Every point moves at most ±10 % per round, and the new curve must rise at every point.

The test suite checks the method end to end: one round on simulated Sample A brings trims from about +9.5 % to under 3 %, and full-throttle error inside 0.3 AFR.

## E10, in one paragraph

E10 has been mandatory for petrol nationwide since 1 June 2026 (Circular 50/2025/TT-BCT; E5 RON92 stays on sale until 2030). Its chemically correct ratio is about 14.1:1, but the ECU and the A/F sensor work in lambda, and KTuner and Hondata show AFR as λ × 14.7 on any fuel. So 14.7 on screen is still λ 1.00, and 11.0 is still λ 0.75: **keep your targets**. E10 carries about 3 % less energy per litre, so expect trims 2–4 % positive and slightly higher consumption. Honda Việt Nam confirms its cars are E10-compatible.

## What Vietnam adds

- **Tune cool, verify hot.** Calibrate in the morning; prove the result on a 32 °C+ afternoon after traffic (Step 5).
- **Heat soak.** After stop-and-go traffic, cruise 5 minutes before any logged pull.
- **Flooded streets.** A cone filter low in the bumper can swallow water in the rainy season.
- **Where to pull.** Only on a closed road, at a track day or on a dyno, with a passenger running the laptop.
- **Catless downpipes** set P0420 and fail the đăng kiểm emissions test. A high-flow catted pipe avoids both.

## Logs the app understands

KTuner and Hondata CSV exports. The reader copes with a BOM, lines above the header, a units row, comma, semicolon or tab delimiters, decimal commas, AFR or lambda, °C or °F, psi, kPa (gauge or absolute) or bar, and trims as %, fraction or multiplier. Columns are matched by name; if one is picked wrongly, fix it under **Columns in this log** and the log is re-checked at once.

Log these channels: engine speed, AFM Hz (and g/s), STFT, LTFT, AFR and AFR command, throttle, boost and boost target, knock retard for every cylinder, knock control, IAT, ECT, CVT temp, DI fuel pressure and its target. Ten samples a second or more.

## Review and sign-off

Step 7 runs automatic reference checks:
- The AFM curve rises at every point, no point moved more than 10 %, and the total change from factory is sensible.
- WOT targets sit inside 11.0–12.0 AFR.
- The boost peak is at or under your ceiling, and nothing below 3,000 rpm changed.
- The latest log passes, and a hot-day log was checked.

A reviewer who uses KTuner or Hondata ticks what software can't see (maps compared, untouched tables, leak tests), then approves or asks for changes. The app writes a Markdown **review packet**, in English or Vietnamese, for Zalo or a Facebook tuning group.

## Honest limits

- This is a guide and a log checker, not a certified calibration. Every change is yours; a second tuner should review it.
- The reference maps are digitized from screenshots. Their load (column) axes weren't captured, and the factory AFM curve is partly reconstructed. Paste the AFM row you actually flashed in Step 3 for exact numbers.
- Sample logs are simulated to show the workflow. They are not measurements of any car.
- Thresholds are deliberately conservative for RON95 E10 in heat. The 280 Nm CVT ceiling is a guideline (stock is 240 Nm; Hondata's 11th-gen CVT base map adds about 40–50 lb-ft on US 91 octane).

## Sources

- Hondata: [lambda meters and air/fuel ratios](https://www.hondata.com/tech-lambda-meters-air-fuel-ratio)
- Hondata forum: [calibrating the AFM from fuel trims](https://www.hondata.com/forum/viewtopic.php?t=25030) and [long-term trim only applies in closed loop](https://hondata.com/help/smanager/ltrim.htm)
- KTuner forum: [knock count and knock control](http://www.ktuner.com/forums/viewtopic.php?t=2600)
- Motor1: [Hondata adds 34 hp and 50 lb-ft to the 2022 Civic](https://www.motor1.com/news/522626/2022-honda-civic-aftermarket-tune/)
- VietnamNet: [Vietnam mandates nationwide E10 fuel from June 2026](https://vietnamnet.vn/en/vietnam-mandates-nationwide-e10-fuel-from-june-2026-2472045.html)
- Tuổi Trẻ: [Honda confirms its cars in Vietnam can use E10](https://tuoitre.vn/saigontimes/honda-xac-nhan-toan-bo-xe-chinh-hang-dung-duoc-xang-e10-1061241067.htm)
- IEA-AMF: [E10 fuel properties](https://iea-amf.org/content/fuel_information/ethanol/e10/ethanol_properties)
- VnExpress: [Civic RS specifications, Vietnam](https://vnexpress.net/oto-xe-may/v-car/phien-ban-xe/honda-civic-2022-rs-461)

## Project layout

```
index.html              the app (open this)
app/app.js              interface: steps, log loading, charts, review packet
app/app.css             "dyno sheet" look, light and dark
app/i18n.js             all text in English and Vietnamese
engine/kta-engine.js    tuning math: CSV reading, channel detection, the five gates,
                        AFM correction, gain levers, reference checks, sample logs
data/ktuner-maps-digitized.json   the owner's digitized KTuner maps
tools/sync-ref.js       rebuilds the engine's reference block from the JSON
test/engine.test.js     engine tests (node --test)
e2e/app.e2e.js          end-to-end run of the app in Chromium (Playwright)
```

```
npm test          # engine tests, no dependencies
npm run e2e       # needs Playwright (npm i, or a global install on NODE_PATH)
npm run sync-ref  # after editing data/ktuner-maps-digitized.json
```

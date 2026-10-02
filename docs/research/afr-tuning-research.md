# AFR Tuning on KTuner (Civic 1.5T): Research Notes

Context: "Step 3 of 7 · Tune AFR / AFM Flow" in ktuner-assistant. The question was how pro tuners do fueling without a dyno, which AFR maps in `KTuner-Maps-Digitized.xlsx` can be edited, and why PRL HVI + "PRL Race" AFM preset throws a CEL.

---

## 1. Why PRL HVI + "PRL Race" AFM preset → CEL (root cause)

**PRL sells two different MAF housings, and only the Race one needs the Race curve.**

| Housing | Tune needed? | Source |
|---|---|---|
| PRL **Street** MAF housing / HVI "High Volume MAF housing" | **No.** Designed to stay within about 4% of factory STFT/LTFT | PRL / RallySport / MAPerformance listings |
| PRL **Race** MAF housing | **Yes.** About 47–50% more flow area, so it needs the Race MAF basemap | PRL, MAPerformance ("Converting from a Street to Race MAF Housing will require a tune") |

The HVI is calibrated to read like stock. So the right curve for it is **Factory/Custom**, not PRL Race.

### What the digitized map shows
Comparing the `MAF_Scaling_PRL_Race` and `MAF_Scaling_Factory` sheets at the same sensor frequency:

| MAF Hz | Factory g/s | PRL Race g/s | Race ÷ Factory |
|---|---|---|---|
| 2031 | 0.645 | 1.72 | 2.67× |
| 3594 | 7.12 | 9.94 | 1.40× |
| 5156 | 25.4 | 36.2 | 1.42× |
| 6719 | 63.9 | 89.0 | 1.39× |
| 8281 | 131.9 | 181.5 | 1.38× |
| 10000 | 275 | 355 | 1.29× |

With the Race curve on a street-diameter housing, the ECU **believes about 40% more air is entering than really is**. Effects:
1. Fuel is scheduled for that phantom air, so the engine runs about 40% rich (more than 2.5× rich at idle).
2. STFT/LTFT go hard negative and hit their clamp. The ECU can't correct, so you get a **"system too rich" DTC (P0172 family)**.
3. The airflow/load model disagrees with MAP/throttle, which can also set a **MAF range/performance DTC (P0101 family)**.
4. Load is over-estimated. That skews torque estimation, ignition-by-load and boost control.

→ This matches "CEL after a run". **Read the actual DTC to confirm.** The codes above are the expected ones, not verified on this car.

### Fix
- PRL HVI / Street housing: flash the **Factory** AFM curve (or Custom = Factory), log 15–30 min, then correct from trims (§2).
- Only pick the "PRL Race" preset when the physical **Race** housing is installed.
- Pro sanity rule: after flashing any AFM curve, if average trims sit beyond about ±10%, or at the clamp, across most bins, **the curve is wrong for the hardware**. Revert. Don't "tune around" it.

---

## 2. How pro tuners do AFR without a dyno

A MAF-based ECU reports its own fueling error through fuel trims. Closed-loop trims plus a wideband do the fueling job a dyno would. A dyno is mainly needed for **ignition/MBT and boost optimisation**, not for matching actual AFR to target.

Order of work: **airflow first, targets second, ignition last.** Never correct a scaling error by editing lambda targets.

### Step A: Calibrate airflow (AFM Flow table, 103 pts, Hz → g/s)
1. Start from the curve that matches the physical housing (§1).
2. Warm engine (ECT above about 80 °C). Optional: set LTFT min/max to 0 so all correction shows up in STFT (civicx tip).
3. Log 15–30 min of **steady part-throttle** driving: cruise at many speeds and gears, gentle ramps, some idle.
   Channels: RPM, MAF Hz, MAF g/s, MAP, TPS, STFT, LTFT, lambda cmd, lambda actual (front A/F), ECT, IAT, closed-loop flag.
4. Filter samples. Keep closed loop only. Drop transients (fast TPS/MAP change), decel fuel cut, first seconds after tip-in, and cold engine.
5. Bin by the AFM Hz breakpoints. Per bin: `corr% = mean(STFT + LTFT)` (needs a sample-count minimum, e.g. ≥ 30).
6. New g/s = old g/s × (1 + corr%/100). Only touch bins with enough data. Blend into neighbours. **Keep the curve monotonic and smooth.** Many tuners apply about 50–80% of the correction per pass to avoid oscillation.
7. Flash, log again, repeat 2–3 passes until bins sit within about ±3–5%. Up to about ±10% is commonly called "normal". Beyond that, the table needs adjusting.

### Step B: Verify high-airflow / open-loop region
- Closed-loop trims don't run at WOT, so the high-Hz bins need a **wideband**. The factory front A/F is wide-range but not precise. ECUTek's Honda guide recommends rescaling it against a calibrated aftermarket wideband.
- Do 3rd/4th-gear pulls on a safe, legal stretch. Compare commanded vs measured lambda per Hz bin: `g/s × (λ_actual/λ_target)` → correct the high-Hz bins of the AFM table.
- If WOT is consistently rich or lean **by the same % as the part-throttle error**, it's scaling. If WOT only is off, check injector/DI pressure or the target table.

### Step C: Then adjust lambda targets (if at all)
- Table: **Nominal Lambda for Component Protection** (KTuner name). This is the `WOT_Enrich_L/H` sheets.
- Typical turbo gasoline WOT targets are about 0.78–0.85 λ (11.5–12.5 AFR). Stock 1.5T already commands 11.0 at the top load columns.
- Leaning WOT for power trades knock/EGT margin. Change in small steps (≤ 0.2 AFR), and watch knock retard every pull.
- Leave cruise and light load at 14.7 (stoich). Emissions and catalyst depend on closed loop.

### Step D: Ignition (where a dyno or careful logging matters)
- Honda knock control acts like a slow octane-learn, averaged and global. It doesn't react per event (ECUTek). So log the knock-retard trend over several pulls, not single spikes.

---

## 3. Editable AFR-related maps in `KTuner-Maps-Digitized.xlsx`

| Sheet | Size | What it is | Edit? |
|---|---|---|---|
| `MAF_Scaling_Factory` | 1×103 (Hz→g/s) | Stock AFM Flow | Base for stock/street/HVI housings |
| `MAF_Scaling_Custom` | 1×103 | User-editable AFM Flow (currently = Factory) | **Yes. This is where trim corrections go** |
| `MAF_Scaling_PRL_Race` | 1×103 | KTuner preset for PRL **Race** housing | Select only with Race housing |
| `MAF_Scaling_27Won_Race` | 1×103 | Preset for 27WON 80 mm Race housing (about 1.5× factory) | Select only with that housing |
| `AFM_Flow_Raw_Visible` | 1×31 | First 31 breakpoints visible on screen | Reference only |
| `WOT_Enrich_L` / `_H` | 20 RPM × 10 load cols, AFR | Lambda/AFR **targets** (Nominal Lambda for Component Protection), low/high cam | **Yes. Targets only, after airflow is right** |
| `DI_Fuel_Pressure_Target_0pct/55pct` | 20×10 | Direct-injection rail pressure target | Not AFR. Leave stock unless injector-limited |
| `Cylinder_Fill_Limitation_L/H` | 10×10 | Load (fill) ceiling | Not AFR. Load limiter |
| `Ethanol_*` | | Ignition/boost adjustments for ethanol | Not fueling |

Gaps in the digitized file:
- `WOT_Enrich` column headers are just `0…9`. **The real load axis values are missing.** Re-digitize them, or the app can't map log samples to cells.
- Not digitized, but present in KTuner: **Minimal Lambda Setpoint** (the floor for commanded λ), injector dead times / AFM Fuel (mg/stroke → pulse), closed-loop trim limits.

### Current WOT_Enrich (L and H identical)
- ≤ 2250 rpm: 14.7 in cols 0–5, then 11.5 / 11.0.
- 3000–4500 rpm: 14.5 → 12.8 across cols 0–5, then 11.5 / 11.0.
- ≥ 5000 rpm: 14.2 → 12.8, then 11.5 / 11.0.

---

## 4. Suggestions for the app (Step 3 flow)
1. **Preset picker must be housing-based, not brand-based.** Ask "Street/HVI housing or Race housing?" PRL HVI maps to the Factory curve.
2. **Wrong-preset detector.** After the first log, if median(STFT+LTFT) < −15% over more than 60% of populated bins (or > +15%), flag "AFM preset doesn't match the intake housing". Recommend reverting before any correction.
3. Correction math = §2 Step A (filtering, binning, sample minimum, partial apply, monotonic smooth). WOT bins come only from wideband λ error.
4. Gate lambda-target edits (Step C) behind "airflow trims within ±5%".

---

## Sources
- PRL 2022+ Civic 1.5T High Volume Intake: https://prlmotorsports.com/products/2022-honda-civic-1-5t-high-volume-intake-system
- PRL MAF Housing Conversion Kit 2016–21 1.5T (Street vs Race, tune required for Race): https://www.maperformance.com/products/prl-maf-housing-conversion-kit-2016-2019-honda-civic-1-5t-prl-hc10-int-maf
- PRL Street MAF Conversion Kit 1.5T: https://www.rallysportdirect.com/products/prl-hc10-int-maf-a-prl-motorsports-2016-2021-honda-civic-1-5t-non-si-street-maf-conversion-kit
- 27WON 1.5L Race MAF housing (80 mm, tuning required): https://store.27won.com/turbo-1-5l-civic-race-maf-housing.html?variation_id=33472
- KTuner Help: MAF Settings / Nominal Lambda / Minimal Lambda Setpoint: http://www.ktuner.com/KTunerHelp/maf_settings.htm
- ECUTek Honda Civic Tuning Guide (fueling, A/F sensor rescale, knock control): https://ecutek.atlassian.net/wiki/spaces/SUPPORT/pages/5931577/Honda+Civic+Tuning+Guide
- CivicX threads (blocked by Cloudflare for the crawler; only search snippets used): https://www.civicx.com/forum/threads/questions-on-afr-and-ignition-timing.34698/, https://www.civicx.com/forum/threads/trouble-with-27won-race-maf-scaling-on-ktuner.76479/, https://www.civicx.com/forum/threads/adjusting-fuel-tables.47850/, https://www.civicx.com/forum/threads/can-anybody-help-me-with-a-maf-curve-tune-on-the-ktuner-platform.68752/

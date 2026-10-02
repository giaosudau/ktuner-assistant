# Civic 1.5T (11th gen, CVT) on Vietnam E10: Fuel, Ignition, Boost, and "Simple Tune"

Companion to `afr-tuning-research.md`. Car: 2022+ Civic 1.5T non-Si, CVT, KTuner, Vietnam.
All web pages were fetched with local crawl4ai. civicx / civicxi forum / honda-tech / hondata / reddit block the crawler (Cloudflare), so those are cited from search snippets only.

---

## 1. Vietnam E10: what changes for a KTuner tune

### Facts
- From **1 June 2026**, all unleaded gasoline sold in Vietnam is E10 (Circular 50/2025/TT-BCT). Mineral RON95 is gone. E5RON92 stays available until the end of 2030, and E15 is proposed from 2031.
- **E10 does not mean lower octane.** "E10RON95-III" is still a **RON 95** fuel; the ethanol is part of the blend that meets that rating.
- Honda (along with Toyota, Hyundai, Ford and Mercedes) has confirmed that modern cars sold in Vietnam are E10-compatible.

### What it means for tuning

**1. Octane: pick 91-class maps, not 93.**
- Vietnam RON 95 ≈ US "91" pump octane (US labels use (R+M)/2, which is about 4–5 points below RON).
- KTuner's 22+ Civic 1.5T page says "Running 91+ will give the best results".
- Phearable Stage 1.5 says 93 is recommended and 91 is the absolute minimum.
- TSP Stage 1 requires premium (91/93).
- → On VN E10 RON95, use the **91-octane-class** calibrations: KTuner Starter 16.5 / Starter 18, or TSP Map 2 (16.5 psi).
- ~~Avoid 21 psi maps: on VN E10 RON95 they run with no knock margin.~~ **Refuted for normal conditions by data:** on Starter 21 Normal pulls the score holds 0.49–0.52. Margin shrinks in hot traffic (up to 0.65), and that is what the app watches. The 23–24 psi maps are untested on this car.
- E5RON92 ≈ US 87. **Never run a boosted map on it.** Map 1 / factory boost only.

**2. Stoichiometry: closed loop handles it, but WOT doesn't.**
- E10 stoich AFR is about 14.0–14.1:1, versus 14.7 for pure gasoline. It needs about 3–4% more fuel for the same lambda.
- Part throttle: the ECU targets lambda 1 using the A/F sensor, so the trims absorb the difference automatically. ~~Expect LTFT around +2…+4% as a normal E10 baseline.~~ **Refuted by data (2 Oct 2026):** the median cruise trim on 14 E10 drives is −0.8 % (`fact-check.md` §1).
- WOT (open loop): ~~On E10 the real lambda can come out a few % leaner than shown.~~ **Refuted:** the sensor measures lambda whatever the fuel, and this car runs λ 0.69–0.73 under boost against a 0.75 target, *richer* than asked.
- → Judge WOT in **lambda** against the map's own target (λ 0.75 on Starter 21). ~~Target λ about 0.78–0.82 under boost.~~ (shop lore, not used)

**3. Don't bake E10 into the AFM curve.**
- If you correct `MAF_Scaling_Custom` from trims on E10, the extra ~3% fuel demand gets written into the airflow table. The ECU then over-reads air by about 3%, which skews load, ignition and boost a little.
- Pro approach: correct AFM bins only where their error stands out from the car's own median trim (−0.8 % on this car's E10 data), never toward an assumed E10 offset.
- This matters for the app (§5).

**4. The Ethanol_* tables are for a flex-fuel sensor.**
- `Ethanol_Ign_Adj` (0 → +5° at 6000 rpm) and `Ethanol_Boost_Target_Adj` (all 0) scale with **measured** ethanol % from a flex-fuel sensor. They are meant for E30–E85, where real timing and boost can be added.
- E10 is too little ethanol to justify a flex sensor or extra timing. Leave these tables alone without a sensor.

**5. Practical E10 notes**
- Fuel economy is about 3% worse (less energy per litre).
- Fuel more often from busy stations. Ethanol absorbs water, and stale fuel loses quality.

---

## 2. Ignition timing tables (what's in the xlsx and how pros treat them)

| Sheet | Shape | Notes |
|---|---|---|
| `Ignition_Base_L/H` | 20 RPM × 20 load | Main spark map. L ≠ H (low/high cam). Range is about +72° at very low load down to −17° at highest load. |
| `Ignition_Max_L/H` | 20 RPM × 10 | Ceiling or limit timing table. |
| `Knock_Sens_1+4_H`, `2+3_H` | 20 × 10 | Knock detection thresholds per cylinder pair (65535 in col 0 = disabled). |
| `Ethanol_Ign_Adj_L/H` | 20 × 20 | Flex-fuel timing add (see §1). |

⚠ **The load axes were not digitized.** Columns show only 0…19 / 0…9. Without the real axis values (mg/stroke or kPa), no cell can be matched to a log sample. Fix this in the digitizer before any ignition feature.

### How pros approach ignition
- Ignition is **the one area where a dyno (or a very careful log/knock method) really matters**. Best timing (MBT) can't be seen from fuel trims.
- Street-tune method (knock-limited, no dyno):
  1. Start from a **professional basemap** for your octane. Don't build spark maps from scratch.
  2. Log knock retard / knock-control learning, IAT, boost and ignition on repeated pulls in hot weather (Vietnam IAT is high).
  3. Honda knock control works like a slow, averaged, global octane-learn (ECUTek), not per-event pull. **Judge the trend over several pulls.**
  4. Where retard shows up, **remove** timing in those RPM/load cells (1–2° steps), or step down a boost map. Pros don't add timing on the street without a dyno to show a real gain.
  5. Hot climate plus RON95 E10 = less margin than US 93 calibrations assume. Expect the ECU to pull more.
- **Simple-tune rule: don't hand-edit ignition. Use the basemap and log knock.**

---

## 3. Boost tables (turbo)

| Sheet | Shape | What it does |
|---|---|---|
| `Boost_Target_1/2/3_Normal_L/H` | 20 RPM × 16 | Boost target per drive mode / target set. In this file Target 1 = 2 = 3 (Normal). |
| `Boost_Target_1/2/3_ECO_L/H` | 20 × 16 | Separate ECO-mode targets. This is how "dual tunes" keep factory boost in ECO. |
| `Final_Boost_Target_L/H` | 20 × 20 | Final target after arbitration; tops out at 23.4 in the last column. |
| `Boost_By_Gear_Limits` | 20 × 16 | Flat 35.4 everywhere, so effectively **no limit active**. |
| `Cylinder_Fill_Limitation_L/H` | 10 × 10 | Load ceiling (airflow per cylinder). The real limiter for a torque-based ECU. |
| `WOT_Exhaust_VTC_Low_Cam` | 1 × 20 | Exhaust cam phase at WOT (5° → 38° peak at 1500 rpm → 18° from 4000 rpm). |

### Reading the values
- `Boost_Target_1_Normal` plateaus at **21** from 4000 rpm. `Final_Boost_Target` reaches **23.4**.
- That's higher than KTuner's Stage 0/1 levels (16.5 / 18 psi), so **this file looks like a 21 psi (Starter 21 / Stage 2-class) map or units other than psi**. Verify which basemap was digitized.
- If it is the 21 psi map, it is too aggressive for VN E10 RON95 plus CVT plus hot IAT.

### How the 1.5T makes boost (why "just raise boost" isn't the whole story)
- The ECU is **torque-based**: pedal → requested torque → load target → boost target. That's capped by `Cylinder_Fill_Limitation` and torque limits.
- Raising only boost targets can be blocked by the fill or torque limits. Pro basemaps change all of these together.
- Boost is the **main power lever** on this engine. Ignition and fuel are adjusted to make that boost safe.

### CVT constraint
- Community consensus for the CVT 1.5T (search snippets): the transmission is torque-limited, with a sweet spot around **~220 whp / ~250 lb-ft** at most.
- TSP notes their output was "slightly limited to avoid risk of damage to the factory engine and transmission".
- Their stock-car CVT dyno: **154 whp / 163 lb-ft → 191 whp / 227 lb-ft** (+37 whp / +64 lb-ft peak).
- Low-RPM torque spikes are what hurt the CVT belt and clutches. Good maps limit boost at low speed or low gear for traction and the CVT.

---

## 4. "Simple tuning": do less, get most

A turbo engine's gain comes mostly from **boost** (plus throttle and turbo response). A pro basemap already contains matching fuel, ignition and boost changes. Doing the same yourself takes a dyno, logs and risk.

### Do
1. **Flash a professional basemap that matches fuel and hardware.**
   - VN E10 RON95 → **Starter 16.5 (Stage 0) or Starter 18 (Stage 1)**. Dual-tune versions keep factory boost in ECO (good valet/backup).
   - KTuner claims up to about **+30 whp / +38–40 lb-ft** for Stage 1.
   - Most of the total gain comes from this step, for almost no work.
2. **Keep hardware calibration-neutral.** Stock intake, or one with a "no tune needed" housing (PRL HVI = Factory AFM curve).
3. **Use KTuner Quick Adjustments**: throttle response, turbo responsiveness. You get the feel without touching tables.
4. **Log one session after flashing**:
   - Trims: about +3% is fine on E10, ±10% is the outer limit.
   - Knock retard: should be near zero at cruise, and only small, short dips on pulls.
   - Boost actual vs target.
   - IAT.
   - Any check engine light.

### Don't (leave to the basemap)
- AFM Flow, unless intake hardware changed.
- Ignition tables.
- Lambda / WOT targets.
- DI fuel pressure, cylinder fill, cam phasing.
- 21+ psi maps on RON95 E10 with a CVT.

### Escalate only if logs say so
- Knock retard is repeated or large → drop one boost level, or switch to a more conservative map.
- Trims are well beyond the E10 baseline → check the AFM preset matches the housing (see the PRL Race issue).
- You want more than about 200 whp → that means intercooler + custom (pro) tune + accepting CVT risk. That's no longer a "simple" tune.

---

## 5. App implications (ktuner-assistant)
- Ask **fuel type** at setup. Vietnam → E10RON95 (≈ US 91) or E5RON92 (≈ US 87). Gate which basemaps can be recommended: 92 → factory boost only; 95 → ≤ 18 psi.
- **E10 trim baseline:** in the AFR step, treat about +3% LTFT as zero-error (subtract the median) before suggesting AFM corrections.
- **Digitizer fix:** capture the real load axes for `Ignition_*`, `Knock_*`, `WOT_Enrich`, `Boost_Target_*`, `Final_Boost_Target`.
- **Basemap detector:** if the boost plateau is ≥ 21, flag it as a "Stage 2-class map, needs 93 / not CVT-friendly".
- Keep the steps in **simple-tune order**: basemap → quick adjustments → log check → (only if needed) AFM → never hand-edit ignition in the app.

---

## Sources
- Vietnam E10 from 1 June 2026: https://vietnamnet.vn/en/from-june-2026-only-e10-fuel-to-be-sold-nationwide-in-vietnam-2463897.html
- Carmakers confirm E10 compatibility: https://vietnamlawmagazine.vn/carmakers-confirm-compatibility-with-e10-fuel-ahead-of-nationwide-rollout-79562.html
- RON95 → E10 (E10RON95 still 95 RON; E5RON92 until 2030): https://b-company.jp/from-ron95-to-e10-vietnams-biofuel-shift-and-its-impact-on-fuel-retail-and-mobility/
- Nationwide rollout: https://en.sggp.org.vn/vietnam-launches-nationwide-e10-biofuel-rollout-replacing-ron-95-gasoline-post126724.html
- KTuner 22+ Civic 1.5T (Starter 16.5/18/21, dual tune, 91+): https://ktuner.com/22civicturbo/
- TSP Stage 1, 2022+ non-Si (CVT dyno, maps): https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si
- Phearable Stage 1.5, 11th gen non-Si (levels, octane): https://www.phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-non-si/stage1-5-nonsi-11thgen.html
- ECUTek Honda Civic guide (knock control behaviour): https://ecutek.atlassian.net/wiki/spaces/SUPPORT/pages/5931577/Honda+Civic+Tuning+Guide
- Forum snippets only (crawler blocked): https://www.civic11forum.com/threads/whats-a-safe-amount-of-power-to-boost-the-1-5t-to.341/, https://www.civic11forum.com/threads/tuning-for-87-octane.3217/

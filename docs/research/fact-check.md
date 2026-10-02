# Fact check: every claim the Drive check relies on

*2 Oct 2026. Rule: a limit or recommendation in the app must rest on **this car's data**, a **primary source** (maker, standards body, the tuning vendor about its own product), or **physics/chemistry** we can compute. Forum posts and search excerpts are context only. A limit with no such basis is marked **provisional** and says so in the app.*

**Basis types:** **Data** = computed from the owner's 16 TunerView drives (15 Aug to 5 Sep 2026, all on E10, about 2,400 boosted rows) · **Primary** = maker or standards text, read in full · **Physics** = computed from published constants · **Secondary** = articles · **Forum** = forum posts, mostly search excerpts (Cloudflare blocked the full text) · **Judgement** = our choice, no outside basis.

---

## 1. E10 and fuel: "add more fuel or you lose power"

| Claim | Basis | Evidence | Verdict |
|---|---|---|---|
| E10 needs about 4 % more fuel **by mass** for the same lambda | Physics | Stoichiometric ratio: ethanol 9.0 (from C₂H₅OH + 3 O₂), gasoline 14.7. E10 is about 10.3 % ethanol by mass, so 0.897 × 14.7 + 0.103 × 9.0 = **14.1**, and 14.7 / 14.1 = +4.3 % fuel | ✅ True |
| E10 has less energy per litre | Primary | AFDC: gasoline/E10 lower heating value 112,114 to 116,090 Btu/gal (E10 to E0), ethanol 76,330 Btu/gal. That is **3.4 % less energy per litre**, so about 3–4 % more litres per km | ✅ True |
| E10 loses power unless you add fuel | Physics + Data | Power is set by the **air** the engine breathes. Per kg of air at the same lambda, gasoline and ethanol release almost the same energy (≈ 2.9–3.0 MJ: lower heating value ÷ stoichiometric ratio). The ECU meters fuel to a lambda **target**, so the extra 4 % comes automatically: the front A/F sensor and trims do it in closed loop, and the fuel model does it in open loop. Your data: under boost you run **λ 0.69–0.73 against a target of 0.75**, which is *richer* than asked on every drive with pulls. | ❌ **Refuted for this car.** Adding fuel makes a rich mixture richer and gains nothing. |
| On E10, expect long-term trim around +2 to +4 % (earlier note, `e10-ignition-boost-simple-tune.md` §1.2) | Data | Warm closed-loop cruise, 57,093 rows on 14 drives: total trim (STFT + LTFT) median **−0.8 %**, p10 −3.1 %, p90 +1.6 % | ❌ **Refuted.** There's no +3 % E10 offset on this car. All logs are E10, so the cause can't be separated (no E0 log exists), but none is needed. |
| On E10, real lambda at full throttle comes out a few % leaner than shown (same note) | Physics + Data | The sensor measures lambda (oxygen), whatever the fuel. The log shows λ × 14.7, so what's shown *is* the real lambda. Measured: richer than target on every drive with pulls | ❌ **Refuted.** It confused the AFR scale with the sensor's measurement. |
| Target λ 0.78–0.82 under boost (same note; the shop view in the report) | Forum/Secondary | Your map asks **λ 0.75** (11.0 on the 14.7 scale; KTuner's table name is "Nominal Lambda for Component Protection") | ⚠️ **Not used.** The rule is distance from **your map's** target. |
| E10 RON95 ≈ US 91 (AKI) | Physics (estimate) | US AKI = (RON + MON) / 2. With the usual 8–10 point RON–MON gap, RON 95 gives 90–91. Vietnam's MON for E10RON95 isn't published in what we read | ⚠️ **Estimate**, stated as one |
| "Avoid 21 psi maps on VN E10: no knock margin" (earlier note §1.1) | Data | On your Starter 21 pulls (Normal mode, boost target up to 19.3 psi), the fuel-quality score stays at **0.49–0.52** and retard is the scheduled 5° | ❌ **Refuted for normal conditions.** Margin shrinks in hot traffic (score up to 0.65), and that is what the app watches. |

**What the app does about E10:** nothing extra. No fuel is added, and E10 isn't baked into the AFM curve. Fuel is judged as *measured vs your map's target*: Watch 0.5 AFR leaner, Stop 1.0 leaner. Asked "should I add fuel for E10?", the app answers with your own numbers: under boost λ 0.69–0.73 vs the 0.75 asked, and at cruise a median trim of −0.8 %.

---

## 2. Fuel-quality score (Knock Control)

| Claim | Basis | Evidence | Verdict |
|---|---|---|---|
| It is the ECU's octane/knock adaptation, retarding timing globally | Primary | ECUTek Honda Civic tuning guide (full text) | ✅ |
| 0.49 is its floor | Data | Every drive's minimum is 0.49; 1,505 boosted rows sit at 0.48–0.50 | ✅ (on this car) |
| Knock Retard = Knock Control × knock retard table; final timing = ignition table + knock ignition limitation − knock retard (lesser of that and the table) | Primary | KTuner Help, "Ignition Timing and Knock Control" | ✅ Logged retard and ignition are **rounded** (0.5° and 1°) |
| Knock Retard in the log is *scheduled* from the score, not knock events | Data | Under boost: retard median 5.0° at a score of 0.48–0.56, 5.5° at 0.56–0.58, 6.0° at 0.58–0.64 | ✅ |
| The formula holds on this car | Data | Within each 250 rpm × 1 psi cell, retard ÷ score stays roughly constant across score levels: median ratio 0.89 (middle half 0.79–1.06) over 26 cells | ✅ Roughly (logged rounding adds noise) |
| Under boost the map's retard table is a single value, **10.2°** | Data | Retard ÷ score under boost: median 10.2°, p10 9.6°, p90 10.2° | ✅ So the **timing a score costs under boost = 10.2° × (score − 0.49)**: 0.56 → 0.7°, 0.62 → 1.3°, 0.65 → 1.6°, 0.80 → 3.2° |
| Low-rpm, high-load cruise cells carry as much retard as full boost | Data | Implied table at 1,500 rpm and −1 psi: about 11°; most other cruise cells 2–5° | ✅ The map treats the lugging zone as knock-prone, which is a second reason, besides the score rises, to avoid lugging |
| **Watch from 0.56** | Judgement on Physics + Data | Costs 0.7° under boost, and sits above the peak of 5 of the 6 Cool drives (the sixth peaked at 0.57) | ⚠️ **A judgement**, now labelled one (the first draft called it "data-based") |
| **"No hard driving" from 0.62 held over 60 s** | Judgement on Physics | Costs 1.3° under boost, more than a full degree everywhere. The earlier "cruise retard starts at 0.62" came almost entirely from one drive (Aug 30 16:01) | ⚠️ **A judgement.** It replaces 0.70 (forum), but isn't "measured" |
| **Stop from 0.80** | Forum | Not reached on this car (max 0.66). Forum excerpts only | ⚠️ **Provisional**, labelled in the app |
| 0.49–0.53 outstanding, under 0.60 fine (forum) | Forum | — | Context only; no rule uses it |
| Heat raises the score | Data | Cool drives end at 0.49–0.53; the hot traffic drive Aug 30 16:01 reached 0.64 | ✅ |

---

## 3. CVT

| Claim | Basis | Evidence | Verdict |
|---|---|---|---|
| "Keep CVT torque under 250 Nm" | Forum | A 10th-gen FlashPro warning seen only in excerpts, with the default limit at 300 and the unit disputed. KTuner's own page says Starter 21 adds **up to 58 lb-ft (79 Nm)** in Normal/Sport, past 250 on a 240 Nm car | ❌ **Removed** |
| Stock torque 240 Nm @ 1,700–4,500 rpm, 176 hp (VN Civic RS) | Secondary (VN press, launch specs) | autodaily.vn launch article | ✅ |
| CVT fluid is Honda HCF-2, don't mix | Primary | Honda 2022 Civic owner's manual (US): "Specified fluid: Honda HCF-2" | ✅ (US manual; the VN car shares the CVT family, not confirmed in the VN manual) |
| CVT fluid limits: Watch 90 °C, Stop 100 °C | Judgement + Forum | Honda publishes no limit in what we read. Data: peak 95 °C; ≥ 90 °C only in hot traffic | ⚠️ Watch 90 is **data-based** (separates hot traffic from everything else). Stop 100 is **provisional** |
| Slip shows as revs jumping without speed | Physics + Data | 0 events (> 250 rpm in 0.33 s, < 1 km/h gained, under boost) in all drives | ✅ The check works. The threshold isn't proven against a real slip, so **Watch only** |
| The g-sensor can detect slip | Data | The "Acceleration" channel is 0.0 on every row | ❌ Not usable |

---

## 4. Turbo, boost, heat

| Claim | Basis | Evidence | Verdict |
|---|---|---|---|
| Starter 21 Dual Tune 2 = 18 psi in ECO, 21 psi in Normal/Sport | Primary | KTuner 22+ Civic 1.5T page: "Stage 1 (18PSI) boost targets in ECO mode … Stage 2 (21PSI) boost targets in Normal/Sport" | ✅ |
| KTuner recommends 91+ | Primary | Same page: "Running 91+ will give the best results" (all research calibrations) | ✅ (the old report's wording "a 91-and-up map" is corrected to this) |
| Wastegate nearly shut at peak boost = little turbo headroom | Data + Physics | EWG position is 8.0 % at idle and cruise, 65.5 % maximum, and **2.5 % median at ≥ 15 psi** | ✅ The inference is sound: nearly all exhaust already goes through the turbine |
| IAT is after the intercooler, IAT2 before the turbo | Data + Physics | Under boost IAT reads 2–6 °C *above* IAT2. Compressed air can't come out of the intercooler colder than the inlet air, so IAT must be after the intercooler | ✅ Strong inference; no maker document |
| The intercooler is not the bottleneck | Data | Same numbers: it adds only 2–6 °C under boost | ✅ |
| Pull-start intake ≤ 48 °C is "good" | Judgement | App constant. Data: Cool drives 35–39 °C while moving, hot restarts 57–64 °C | ⚠️ A choice inside the data's range, labelled as one |
| Ignition timing drops with heat at −0.12°/°C | Data | Weak fit on 135 rows, confounded by load | ❌ **Not used.** Too weak to state |

---

## 5. Engine care

| Claim | Basis | Evidence | Verdict |
|---|---|---|---|
| LSPI happens mainly at 1,500–2,500 rpm and high load (BMEP > ~15 bar) on turbo DI engines | Primary (patent text) + Secondary | USPTO lubricant patents (via NASA Speed News) | ✅ |
| "Lugging is where LSPI happens" | Inference | The app's lugging band is 900–1,700 rpm, chosen because **31 of 41 score rises** happened there (data). It overlaps the LSPI band only at 1,500–1,700 | ⚠️ **Corrected to:** lugging is the main cause of score rises (data); its top end touches the LSPI band |
| API SP / ILSAC GF-6 oils pass an LSPI engine test (Sequence IX); plain API SN doesn't require it | Primary (standard, via search excerpt of SwRI and Chevron documents) | Sequence IX limits for SN+, SP and GF-6: average ≤ 5 pre-ignition events per iteration; SP and GF-6 also max ≤ 8 | ✅ (excerpt of a primary document; the full PDF failed to load) |
| Oil viscosity | Primary | Honda 2022 Civic manual: 0W-20, API premium grade | ✅ **0W-20**, API SP or newer. Forum advice to run 0W-40 is not used |
| Oil dilution is mostly a cold-climate problem | Secondary | 8020 Automotive, other articles; Honda TSB 19-039 is cited by them, not read | ⚠️ Low relevance in Vietnam; kept as a note, no rule |

---

## 6. Air measurement and mixture

| Claim | Basis | Evidence | Verdict |
|---|---|---|---|
| Normal trims on this car sit within about ±4 % | Data | p10 −3.1 %, p90 +1.6 % at cruise; worst load band within ±3.9 % on 14 drives | ✅ ±5 % = OK is **data-based** |
| Trims beyond ±10 % = Stop | Data | The one fault drive (Aug 23 20:38) sat at **−28 % median** total trim; on normal drives the p10–p90 band never passes ±6 % | ✅ |
| The Aug 23 fault was the wrong AFM preset | Inference | Negative trims from the first second, right after a change between 19:59 and 20:38; an earlier repo note found the same symptom with the PRL Race preset. A vacuum leak would give *positive* trims | ⚠️ **Most likely, not proven.** The app says "usually means", never "is" |
| Map's full-load target 11.0 (λ 0.75) | Primary (your map file) | WOT_Enrich: the top 3 load columns are 11.0, the next is 11.5, lower loads 12.8 to 14.7; the load axis wasn't captured | ✅ **Only at full load.** The rule applies at ≥ 12 psi, where all logged readings are ≤ 11.3 |
| The factory map lowers the boost limit as intake air heats up | Primary | KTuner Help, "Turbo Pressure Limit Based On Engine Temperature" | ✅ It exists. On this car's logs the effect can't be separated from mode and map changes, so **no rule uses it** |
| Mixture Watch at 0.5, Stop at 1.0 AFR leaner than target | Judgement + Data | Data: the leanest 10 % of boosted rows are 10.3–10.8, at least 0.2 richer than target, so no healthy drive comes near 0.5 leaner | ⚠️ A choice with the data's margin, labelled as one |
| The stock front A/F sensor is accurate enough under boost | — | Nothing read supports or rejects it | ❌ **Claim removed.** The rule compares against the map's own target, so a small fixed offset matters less, but a wideband check is still the gold standard |

---

## 7. What changed because of this check

- **E10:** answered with data. No fuel added; the earlier note's "+3 % E10 trim baseline" and "leaner at WOT" are struck through.
- **Fuel-quality score:** limits are now stated as **timing cost under boost** = 10.2° × (score − 0.49), from KTuner's formula, which holds on this car. Watch 0.56 (0.7°), no hard driving 0.62 (1.3°, replacing the forum 0.70), Stop 0.80 (3.2°, provisional). The cut points are judgement, and labelled so. A second check caught 0.62 wrongly called "measured": its evidence was one drive.
- **CVT:** torque number removed; slip check added (Watch only); Stop 100 °C provisional.
- **Oil:** 0W-20 per the Honda manual, API SP or newer.
- **Wording:** "lugging is where LSPI happens", "the sensor is accurate enough", "91-and-up map" and "no knock margin on 21 psi" are corrected or removed.
- **App rule:** every limit shows its basis in *Why?*. A provisional limit says "provisional: not yet seen on your car".

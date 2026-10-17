# Conflicts and contradictions: CivicX second pass

Stage 2, 17 Oct 2026. 50 newly fetched CivicX threads gave 137 new claims (civicx-132 to civicx-268), and 16 more (civicx-269 to civicx-284) came from re-reading the raw text behind the old search summaries. Of the 44 search-summary claims that now have a raw thread, 6 held, 22 needed correcting and 16 aren't in their thread at all. Findings: 10 new (`cx2-1` to `cx2-10`) and 84 update lines in `findings-civicx2.jsonl`. Checked against `fact-check.md`, the cards as they stand today, `thresholds.json`, the map file and this car's nine drives. Two new checks on our logs are in the session scratchpad: `cx2/iat.py` (IAT minus IAT2 by state) and `stage2/ol.py` (STFT frozen share by MAP band).

---

## 1. Lines in current cards that a claim contradicts

### 1.1 `kc-boost-step`: steps above 21 psi (cx2-3) · strong, Primary
- **Card:** "A Boost step adds 1 psi to Boost Target 2 Normal, Low and High cam, 3,500 to 4,500 rpm rows, never above the Final Boost Target peak, 23.4 here."
- **Claim:** KTuner, on why the base 1.5T Starter stops at 21: "we're at the safe point for the CVT and factory clutch at this 21PSI level. The rods in the base are also weaker." ([CivicX 27523](https://www.civicx.com/forum/threads/no-9-boost-base-1-5t.27523/), unsigned, but it's KTuner talking: "we chose", "our 21PSI").
- **Basis:** Primary, 10th gen. KTuner's 22+ Civic CVT Starter maps also stop at 21, so the choice carried over.
- **Why it matters:** the step's gates are all log gates (pedal, overshoot, timing, Knock Control, mixture, fuel pressure). The margin KTuner is talking about is the CVT, the clutch and the rods, and no log measures it.
- **Settle:** no log settles this. It's the owner's call whether the Boost step stays (and goes past 21) or is capped at 21. Until then the step stays closed anyway (no floored pull yet, ktuner-community-knowledge.md §2).
- **Also:** `picks-g1.md` cites "CivicX 68777 (search summary)" for "KTuner chose 21 psi as a safe limit for the CVT". That summary claim (civicx-50) isn't in 68777. The right source is 27523.

### 1.2 `kc-cvt`, `kc-power-sources`, `kc-table-boost`: the factory torque limiter (cx2-1) · weak, forum
- **Cards:** `kc-cvt` "the ECU's own factory torque limiter still protects the CVT and can pull boost back"; `kc-power-sources` "its factory torque limiter caps the result to protect the CVT"; `kc-table-boost` "the everyday cap is the factory torque limiter, which KTuner does not expose".
- **Claims:** "There is no active limiter to prevent a torque level. Basically, a non-CVT Tune is detuned to achieve less torque." (IronFusion, [CivicX 66438](https://www.civicx.com/forum/threads/1-5t-cvt-ktuner-general-questions.66438/)); "KTuner has no torque limit" (amyisquiet, [40687](https://www.civicx.com/forum/threads/did-ktuner-modify-the-cvt-torque-limit-table.40687/)).
- **Other side:** KTuner wouldn't say what it does to the torque tables ("What we do is not public", 40687). On its Starter software it said "We are re-introducing some limitations placed by the factory. We will not be introducing any limitations beyond that of factory" ([44508](https://www.civicx.com/forum/threads/hesistation-stutter-at-low-rpms-tweaked-starter-21-ktuner.44508/)).
- **Better basis:** the cards. Neither owner can see the tables. **No card change.** The owner claim goes on the never-say list.
- **Settle on our car:** the §2 floored pull, read the way cx2-2 sets out. A throttle command held under the pedal with no slip, or a target flat below 21, is a factory cap at work.

### 1.3 `kc-heat-soak`: the intercooler (g2-52, more sources) · forum, card stands
- **Card:** "The intercooler is not the problem: under boost it adds only 2 to 6 °C over the inlet air."
- **Claims:** "The stock intercooler is only good enough for a stock tune." (Benster, [51779](https://www.civicx.com/forum/threads/at-what-iat-do-you-start-to-see-heat-soak.51779/), now verified); a stock-intercooler car lost torque after a few pulls in 29-35 °C, an HKS core cured it; "the Mainline Dyno shown power gain 12-15 Bhp after bigger FMIC upgraded even without *Retune*" ([60553](https://www.civicx.com/forum/threads/hey-jr-two-questions-about-the-artificial-rise-in-knock-control-in-the-non-sis.60553/)).
- **Verdict unchanged:** conflict. The card holds on our street data: pull-start IAT *fell* over 8 back-to-back pulls. What's new is a dyno number from the other side, still 10th gen with repeated pulls. Proof if wanted is the same as before: 3 hot pulls back to back, watching IAT minus IAT2.

### 1.4 `kc-log-gate` and `kc-drive-brief`: MAF Hz in TunerView (cx2-6) · risk, one owner
- **Cards:** `kc-log-gate` "AFR Command and MAF Hz in the gauge list"; `kc-drive-brief` "in TunerView turn on every gauge the app reads (AFR Command and MAF Hz included)".
- **Claim:** "the tunerview csv log doesn't show MAF Voltage." ([55782](https://www.civicx.com/forum/threads/how-to-datalog-on-v1-2.55782/), 10th-gen volts MAF, older TunerView).
- **Why it matters:** if TunerView can't export airflow frequency, every log fails the gate on one item the owner can't fix.
- **Settle:** the owner looks for an airflow-frequency gauge in TunerView, logs it for a minute, exports and checks the column. Until then treat it as Can't tell for the headroom check, never as a failed log.

### 1.5 Challenges our data refutes (the cards stand)
| Card line | Claim | Our data |
|---|---|---|
| `kc-open-loop-wot`: "An airflow correction uses only rows below about 8 psi, where the trims are live." | "even at 1psi with that minor of a load, the fuel trims seem to stay VERY steady and nearly locked at 0." (cadams84, [93139](https://www.civicx.com/forum/threads/ltft-at-14-on-phearable-1-5-tune-okay.93139/)) | STFT exactly 0 on 28-30 % of warm rows at 0-4 psi, 16 % at 4-6, 43 % at 6-8, 89 % at 8-10 and 99-100 % from 10 psi (2,266 rows at 0-8 psi). Low boost behaves like cruise. **cx2-5 refuted.** |
| `kc-maf-trim-direction`: "A positive trim means the ECU added fuel because it measured too little air, so the airflow points covering that airflow move up" | "if you see STFT adding 20% fuel … go to maf scaling adjust the maf scaling g/s by -20%" (chuenoona, [68752](https://www.civicx.com/forum/threads/can-anybody-help-me-with-a-maf-curve-tune-on-the-ktuner-platform.68752/)) | The sign is backwards: followed literally, it doubles the error. **cx2-4 refuted.** Never-say. |
| `kc-iat2-side`: "Under boost IAT reads 2 to 6 °C above IAT2, which only works that way round" | "IAT2 temps will be 5-10C higher than IAT1 and stays that way for at least 5 min of highway driving" (Benster, 51779) | IAT minus IAT2 is never negative on 23,560 warm rows: median +4.0 °C under boost, +5.0 within 2 min after a pull, +8.0 at other cruise. **cx2-7 refuted** for this car. The card's own "check the sign on a new car" covers it. |

### 1.6 Tensions, not contradictions
- **`kc-dual-boost-targets`** "Use ECO on hot days, in traffic, or on fuel you don't trust." ECO also keeps Honda's stock ECO habits: "more sluggish throttle response and reduced A/C output" (gtman, [62291](https://www.civicx.com/forum/threads/eco-mode-as-tuned-increase.62291/)). In Vietnamese heat, weaker A/C is a real cost. Add the caveat (cx2-8) and keep the advice.
- **`kc-cvt`** "Stop at 100 °C is provisional". Owners on stock fluid say "Most OEM fluid users range from 190-220 F max" (88-104 °C) after long drives, and one 10th gen ran 108 °C after an hour on Stage 2. No failures are reported at those readings (g1-cvt-02). Keep it provisional. A single reading just over 100 is weak evidence of harm.
- **`kc-ranges`** "Stop starts at 0.80". KTuner called 0.8 after repeated pulls on a Phearable 1.5 "standard behavior" ([63214](https://www.civicx.com/forum/threads/knock-control-parameters-and-meanings.63214/)). That car keeps the forced rise above 5,200 rpm, which the card already excludes. No change.
- **`kc-flash-howto`** "start the tune with the one that matches the unit info". One owner whose ECU wasn't listed picked "the higher numbered ECU" and it worked. That's owner practice, not KTuner's rule. No change.

---

## 2. Verdict flips

| Finding | Old → new | Why |
|---|---|---|
| g1-thr-10 (low-rpm judder fixed in 1.0.9.5/1.0.9.6) | plausible → **supported** | The 5-page raw thread has KTuner running the beta and saying what the fix does, plus many owners (Starter 21 and TSP Stage 1, CVT and manual, an EU hatch) confirming 1.0.9.5/1.0.9.6 fixed it |
| g1-map-11 (Phearable 1.5R vs the artificial rise) | plausible → **supported**, merged into g2-13 | It was never one owner's report. gtman states that the 1.5R removes the rise and TSP Stage 1 keeps it, three more owners agree, and KTuner basemaps let you tick it |

No finding flips to refuted or to conflict. Two keep their verdict but lose a sentence that had no source behind it: **g3-06** (the "part-throttle knock after lowering MAF values" anecdote) and **g1-res-02** (the "10th-gen manual Starter 21 = 203 whp / 250 lb-ft" dyno). Drop both sentences.

---

## 3. Upgraded summary claims that turned out wrong

These are the old `[search-summary]` claims whose thread says something else. All 44 are marked in `claims/civicx.jsonl` (`corrected` or `unsupported`).

**Said the opposite of the thread**
- **civicx-44** said a KTuner rep agreed a downpipe "alters the AFR and can leave the engine running lean". The thread has KTuner saying "All exhaust modifications are supported with the included tunes". g3-57 (refuted) is stronger for it.
- **civicx-36** said "Honda denied the warranty on the CVT, citing the tune". The failures list has a dealer *honouring* a CVT warranty, and a third-party warranty company refusing an engine claim because the car was modified. g2-62 and g2-63 need their wording changed.

**Credited to KTuner staff, but an owner or a vendor said it**
- civicx-10 and civicx-11 (octane), civicx-60 (0.59 after a flash, "0.9+ irregular"), civicx-52 (the hot-humid "just below 200": that's CAPTS, in PS). g2-03's ladder loses its "0.9+ irregular (KTuner staff)" rung: nobody in the thread says it.

**Quote or number not in the thread at all (unsupported)**
- civicx-18 (203 whp / 250 tq Starter 21 dyno), civicx-29 (3,600 ft, 23.5 psi), civicx-34 ("140 CVT owners, fewer than 5 failures"; "8 of 427"), civicx-41 and 42 (Quick Adjustment levels and sample sets), civicx-50 (KTuner's 21 psi CVT limit: true, but it's in 27523), civicx-51, civicx-54 (17 psi first-gear BBG), civicx-59 (pre-flash checklist), civicx-61, civicx-62 ("91 octane ≈ 0.9"), civicx-71 (CEL key-off procedure), civicx-40 (rev-hang TPS 0 above 2,000 rpm).

**Quote belongs to another thread**
- civicx-16 (the less-torque-below-4,000-rpm quote is in 66438), civicx-27 (the TC.Target quote is in 20669), civicx-37 and 38 (they're in 50001 and 98511), civicx-46 (in 47850).

**Numbers out of date**
- civicx-33 had "49 major failures, 6.6 %" for the non-Si. The live list reads "100 cars with major drivetrain failures out of 1,702" (10/7/26). The fetched page holds only 46 of the entries, so the non-Si breakdown can't be re-counted.

---

## 4. The focus topics: what this pass changes

**19.2 psi and part pedal.** Nothing here changes the §2 answer: 19.2 is a part-pedal reading, and nothing changes on the map until a floored pull is logged. What's new:
- Two more sources that a floored pedal reads about 113 % TPS on these cars: KTuner via gtman ("Your TPS would show something like 113%"), and an owner who triggers logging at "113% TPS (that is full throttle)".
- A verified KTuner line that Starter software keeps factory limitations.
- The reading key for the pull (cx2-2):
  - Throttle command held under the pedal with no slip: a protection is closing the throttle.
  - Throttle wide open and the target flat below 21: the target is capped.
  - Either way, no map change.
- On the EU ECU the 95 % TPS Command cap went away in ECO (an 18 psi target). That fits a cap that only bites at higher targets. It's still not our car: ours reached 99-100 %.

**Knock control above 5,200 rpm.** More owners put the forced rise at 5,200-5,300 rpm. Vendor files differ:
- Phearable 1.5R removes it.
- TSP Stage 1 keeps it.
- Phearable's plain 1.5 keeps it but "bumps timing up a touch to compensate".

KTuner basemaps let the owner tick the removal. The safety debate has both sides on record. `kc-high-rpm` already takes the "a remaining rise is real" side. One 11th-gen *Si* owner also reports the rise, so it may not be non-Si-only on the 11th gen (T1, Si, one source).

**MAF scaling and open loop.** Open loop below 8 psi is reconfirmed against a contrary owner claim (cx2-5). New, from KTuner: a correct scale also moves the load where ignition, knock and DI fuel-pressure targets are read ("If your scale is correct for the airflow then you'd be in the correct placement for both"). A housing mismatch can show as a bog past about 4,500 rpm with boost falling 4-6 psi, not just as bad trims. One sign-backwards forum method is refuted.

**CVT protection.** KTuner's own reason for stopping at 21 (§1.1) is the strongest new item. Also:
- Vendors cut torque below 4,000 rpm on CVT files. TSP's own wording: "slightly reduced torque below 4000RPM to avoid risking damage to the CVT".
- Heat is the enemy, and it rises with torque.
- Typical stock-fluid peaks run 88-104 °C on long drives.
- The torque-limiter dispute (§1.2) leaves the cards as they are.

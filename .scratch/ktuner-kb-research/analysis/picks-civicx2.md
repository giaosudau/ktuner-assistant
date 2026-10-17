# Picks: CivicX second pass

Stage 2, 17 Oct 2026. These are findings rated value 3 or more that fit our car, or fit it with a caveat. Some are new (`cx2-*`). Others are existing findings that this pass gave a new source or nuance. Each has a proposed card change written in the card's own voice. Detail is in `findings-civicx2.jsonl`; disputes are in `conflicts-civicx2.md`.

**Ranked top 8:** cx2-3 (value 5); cx2-2, cx2-6, g3-41, g3-01, g1-boost-15, g2-51, g3-06 (value 4).

---

## Boost and the 19.2 psi question

### cx2-3 · value 5 · ⚔️ contradicts `kc-boost-step`, confirms `kc-expectations`: KTuner's own 21 psi line
- **Line to add (kc-boost-step):** "KTuner stopped its own Starter maps at 21 psi because that is the safe point for the CVT and the factory clutch, and the base engine's rods are weaker than the Si's. A step past 21 spends that margin, and no log can show it being spent."
- **Line to add (kc-expectations):** "KTuner chose 21 psi as the safe point for the CVT and clutch, and says more boost with less timing can end up making less power."
- **Needs the owner's call:** keep Boost steps above 21 (up to the 23.4 cap), or cap the step at 21. Until a floored pull exists the step is closed either way.
- **Fix in picks-g1.md:** its g1-boost-04 source "CivicX 68777 (search summary)" should be [CivicX 27523](https://www.civicx.com/forum/threads/no-9-boost-base-1-5t.27523/).
- Sources: [CivicX 27523 (KTuner)](https://www.civicx.com/forum/threads/no-9-boost-base-1-5t.27523/).

### cx2-2 · value 4 · extends `kc-boost-step`: how to read the floored pull
- **Line to add:** "On the floored pull, read the throttle as well as the target. If the throttle command sits below the pedal with no wheel slip, a factory protection is closing the throttle. If the throttle is wide open and the target flattens below 21, the target itself is capped. Either way the answer is no map change."
- KTuner setting: Cylinder Fill Limitation and Final Boost Target (both read-only for the app). Log: TPS, TPS Command, Turbo Pressure Target, EWG Position.
- Sources: [CivicX 21584](https://www.civicx.com/forum/threads/boost-pressure-low.21584/) ("It would pull back throttle, which would lower boost, but you'd notice throttle pullback in datalogging"); [38719](https://www.civicx.com/forum/threads/my-experience-with-hondata-vs-ktuner.38719/); [54703](https://www.civicx.com/forum/threads/cant-hit-the-max-target-boost-and-maintain-it.54703/); [91058](https://www.civicx.com/forum/threads/ktuner-21psi-dual-tps-cmd-stuck-at-95-during-wot-international-ecu.91058/).

### g3-41 · value 4 · extends `kc-flash-howto`: the log proves the flash
- **Line to add:** "On a floored pull a Starter map's target climbs past anything the factory map asks, about 16 to 18 psi on this generation. A target that never gets there means the map isn't on the car, whatever the screen said. Yours reached 19.2, so the Starter map is in."
- Caveat: the 10th-gen factory target is lower (13.6 to 16 psi, per KTuner). The 11th-gen 16 to 18 figure comes from g1-boost-13, where one stock run hit 14 psi against a 16-18 target.
- Log: Turbo Pressure Target on a floored pull.
- Sources: [CivicX 92846](https://www.civicx.com/forum/threads/same-performance-with-ktuner-starter-maps-and-factory-tune.92846/) ("No way that KTuner 18 psi tune should be commanding only 13 psi at near full throttle"); [CivicX 27523 (KTuner: factory target 13.6 psi at 4,000 rpm, 14.6 at 5,000)](https://www.civicx.com/forum/threads/no-9-boost-base-1-5t.27523/).

### g1-boost-15 · value 3 → 4 · new line for `kc-boost-codes`: warm misses point to the wastegate
- **Line to add:** "If boost meets its target with the engine cold but falls short once it's warm, suspect the wastegate before a leak, because a leak misses the target hot or cold."
- Log: Turbo Pressure vs Turbo Pressure Target and EWG Position vs EWG Target, on a cold pull and a warm pull.
- Sources: [CivicX 94759](https://www.civicx.com/forum/threads/make-low-boost-until-4k-rpm-feel-weird-help.94759/) (gtman reading the logs: "A boost leak wouldn't behave that way"); [CivicX 33313 (KTuner: wastegate, pressure leak, check couplers and O-rings)](https://www.civicx.com/forum/threads/ktuner-v1-2-data-logging-showing-boost-way-over-target.33313/). Caveat: 10th gen.

### g1-boost-03 · value 5 · confirms `kc-boost-step` (no wording change)
- Two more sources for "on these cars floored reads 100 to 113": KTuner via gtman ([CivicX 41190](https://www.civicx.com/forum/threads/high-altitude-no-boost-how-to-adjust.41190/): "Your TPS would show something like 113%"), and an owner logging from "113% TPS (that is full throttle)" ([55782](https://www.civicx.com/forum/threads/how-to-datalog-on-v1-2.55782/)). The key-on floored reading still settles it.

### g1-thr-03 · value 4 · confirms `kc-quick-adjustments`: Disable Boost Target Dampening stays off
- **Line to add:** "Owners who tried it say the boost then jumps straight to the full table, and even a slight incline at a steady pedal brings near-full boost."
- Sources: [CivicX 34559](https://www.civicx.com/forum/threads/can-someone-further-explain-these-3-ktuner-adjustments.34559/).

---

## Airflow, trims and open loop

### g3-01 · value 4 · extends `kc-maf-housing`: a mismatched preset can show as a bog
- **Line to add:** "A preset that doesn't match the housing can show as a full-throttle bog, not only as bad trims. One owner with a Race housing on a street preset lost 4 to 6 psi past about 4,500 rpm, and the stock intake brought it back. KTuner tells owners of off-the-shelf tunes to get the vendor's matching curve, and owners of housings with a different size to get a custom one."
- KTuner setting: MAF Scaling preset (AFM Flow on this car). Log: Turbo Pressure, O2 against AFR Command at full throttle.
- Sources: [CivicX 86351](https://www.civicx.com/forum/threads/ktuner-v2-bogging-full-throttle.86351/); [CivicX 106680 (KTuner)](https://www.civicx.com/forum/threads/ktuner-phearable-1-5r-wot-very-rich-data-log.106680/); [CivicX 98511](https://www.civicx.com/forum/threads/high-iat-with-1-5r-tune.98511/) (K&N "inconsistent fuel trims"); [CivicX 86902](https://www.civicx.com/forum/threads/maperformance-intake-tune.86902/).

### cx2-6 · value 4 · extends `kc-log-gate`: if TunerView can't log airflow frequency
- **Line to add:** "If TunerView offers no airflow-frequency gauge to log, the airflow headroom check reads Can't tell and the log still counts."
- **Owner check first:** look for an airflow (MAF Hz) gauge in TunerView, log it for a minute, export, and look for the column.
- Sources: [CivicX 55782](https://www.civicx.com/forum/threads/how-to-datalog-on-v1-2.55782/) ("the tunerview csv log doesn't show MAF Voltage"; 10th-gen volts sensor, older app).

### g3-06 · value 4 · extends `kc-shakedown`: an airflow flash moves more than trims
- **Line to add:** "After an airflow flash, also compare fuel pressure with its target. The new curve changes the load the fuel-pressure, ignition and knock tables are read at, and if the curve is right for the air, those new readings are right too."
- Log: DIFP vs DIFP Target, Knock Control, trims.
- Sources: [CivicX 82478 (KTuner)](https://www.civicx.com/forum/threads/maf-scale.82478/) (DI pressure 21,000 to 16,000-17,000 kPa after a WOT rescale).

### cx2-5 · value 3 · confirms `kc-open-loop-wot` (never-say)
- **Line to add:** "Some owners say the trims freeze from the first psi of boost. Not on this car: below about 6 psi they move as they do at cruise, and they're frozen only from about 8 psi."
- Sources: [CivicX 93139](https://www.civicx.com/forum/threads/ltft-at-14-on-phearable-1-5-tune-okay.93139/) (the claim); our logs (`stage2/ol.py`: 16-30 % of rows at 0-6 psi read exactly zero, as at cruise; 89 % at 8-10 psi).

### cx2-4 · value 3 · confirms `kc-maf-trim-direction` (never-say)
- **Line to add:** "Forum advice to cut the curve by the size of a positive trim has the sign backwards: it doubles the error."
- Sources: [CivicX 68752](https://www.civicx.com/forum/threads/can-anybody-help-me-with-a-maf-curve-tune-on-the-ktuner-platform.68752/).

### g3-13 · value 4 · extends `kc-trims`
- **Line to add:** "Long before the ECU complains there is a margin: owners report a rich-condition code once long-term trim passes about 20 percent negative."
- Sources: [CivicX 93139](https://www.civicx.com/forum/threads/ltft-at-14-on-phearable-1-5-tune-okay.93139/). Forum level, one source.

---

## Heat and intake

### g2-51 · value 3 → 4 · extends `kc-heat-soak`: which intake is fitted
- **Line to add:** "Ask which intake is fitted. An open short-ram filter in the engine bay heat-soaks worse than the stock airbox at stops: one owner went from 33 to 62 °C intake air in ten miles of hot traffic without a single pull, and heat wrap changed nothing. A cold-air intake that draws from outside the bay avoids most of it."
- Log: IAT and IAT2 at stops and right after them.
- Sources: [CivicX 98511](https://www.civicx.com/forum/threads/high-iat-with-1-5r-tune.98511/).

### g2-50 · value 4 · source for the heat line in `kc-heat-soak` (§5 proposal)
- Verified source for the forum figure "about 0.1 to 0.15 higher on a long climb in 38 °C heat": [CivicX 31884](https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/). No wording change.

### cx2-8 · value 3 · extends `kc-dual-boost-targets`: ECO and the air conditioner
- **Line to add:** "ECO also keeps Honda's ECO habits, a softer pedal and a weaker air conditioner, so on a hot day the 18 psi tune costs some cabin cooling."
- **Owner check:** does the A/C feel weaker with ECO on?
- Sources: [CivicX 62291](https://www.civicx.com/forum/threads/eco-mode-as-tuned-increase.62291/).

---

## Knock above 5,200 rpm

### g2-15 · value 3 · extends `kc-high-rpm`: vendor files differ
- **Line to add:** "Vendor files differ: Phearable's 1.5R removes the rise, TSP Stage 1 keeps it, and Phearable's plain 1.5 keeps it but adds a little timing up top to make up for it. Know which file is loaded before reading high-rpm scores."
- Sources: [CivicX 63214](https://www.civicx.com/forum/threads/knock-control-parameters-and-meanings.63214/); [CivicX 79395](https://www.civicx.com/forum/threads/sky-high-kcon-also-bad-fuel-trims-need-help-16-cvt-ktuner.79395/); [CivicX 94759](https://www.civicx.com/forum/threads/make-low-boost-until-4k-rpm-feel-weird-help.94759/). Caveat: 10th-gen vendor tunes; this car runs a KTuner Starter map with the box off.

---

## CVT

### g1-cvt-02 · value 3 · confirms `kc-cvt`: what's normal on stock fluid
- **Line to add:** "Owners on stock fluid commonly see 88 to 104 °C after long drives with no failures reported, which is why the Stop at 100 stays provisional."
- Sources: [CivicX 95524](https://www.civicx.com/forum/threads/tuning-my-2016-civic-1-5l-touring.95524/).

---

## Logging and KTuner workflow

### cx2-9 · value 3 · extends `kc-drive-brief`: live alarms
- **Line to add:** "TunerView can raise an alarm on any gauge. Set one on the Fuel-quality score at the Watch line and one on intake air at the pull-start limit."
- **Owner check:** the alarm menu in the installed TunerView version.
- Sources: [CivicX 29033](https://www.civicx.com/forum/threads/my-ktuner-experience-an-ongoing-journal.29033/).

### g3-48 · value 2 → 3 · extends `kc-flash-howto`: software updates
- **Line to add:** "A KTuner software fix reaches the car only after you open the tune in the new version and flash it again."
- Sources: [CivicX 44508 (KTuner: "The change is applied to all tunes when opened")](https://www.civicx.com/forum/threads/hesistation-stutter-at-low-rpms-tweaked-starter-21-ktuner.44508/).

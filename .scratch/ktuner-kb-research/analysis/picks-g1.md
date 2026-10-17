# Picks: group g1 (boost, maps-basemaps, throttle-drivability, cvt, results-numbers)

Stage 2, 17 Oct 2026. These are the findings with value ≥ 3 that fit our car, or fit it with a caveat: 36 of 66. Each one has a proposed card change. Card ids are in `knowledge/cards/`. "Line to add" means one sentence for the card body, written in its own voice. Full detail is in `findings-g1.jsonl`; disputes and the 19.2 psi analysis are in `conflicts-g1.md`.

Ranked top 8: g1-boost-01, g1-boost-03, g1-boost-04 (value 5); g1-boost-05, g1-boost-07, g1-boost-08, g1-thr-03, g1-boost-06 (value 4).

---

## Boost

### g1-boost-01 · value 5 · extends `kc-table-boost`: the target scales with the pedal
- **Line to add:** "At a steady part pedal the target stops at a level the pedal sets, not at the table: about 13 psi at a pedal near 45 percent and 15 psi near 60 percent on your drives, and the 19.2 peak came with the pedal still rising. So 19.2 is a part-pedal reading, not a ceiling."
- KTuner setting: Boost Target Ramp Rate; `Boost_Target_2_Normal_L/H`. Log: Turbo Pressure Target against TPS.
- Sources: [KTuner Help, Boost Target Ramp Rate](http://www.ktuner.com/KTunerHelp/boost_target_ramp_rate.htm); [KTuner forum t2429](https://www.ktuner.com/forums/viewtopic.php?f=71&t=2429&p=8350); our logs (`stage2/plateau.py`).

### g1-boost-03 · value 5 · ⚔️ contradicts `kc-boost-step`: what "floored" reads
- **Change:** replace "pedal 85 percent or more" with "pedal floored: within about 10 percent of the pedal's full reading, measured once with the key on and the engine off". Until it is measured, add: "On earlier Civics a floored pedal reads 100 to 113 percent; this car has never logged more than 94."
- Threshold: `boost_step_gates.pedal_pct` becomes 90 % of the measured stop.
- Sources: [CivicXI 41190 (KTuner staff: TPS about 113 % floored)](https://www.civicxi.com/forum/threads/41190/); [CivicXI 42278](https://www.civicxi.com/forum/threads/42278/); [KTuner forum p9224](http://www.ktuner.com/forums/viewtopic.php?f=65&p=9224).

### g1-boost-04 · value 5 · ⚔️ extends `kc-table-boost` and `kc-expectations`: Starter maps keep factory protections
- **Line to add (kc-table-boost):** "KTuner leaves many factory protections in its Starter maps. It describes a Starter 21 Dual car that never passed 19.5 psi with the pedal floored, and the answer was a custom tune. One floored pull held at least 5 seconds above 3,500 rpm shows whether your target can reach 21 at all. If it flattens below the table, no Boost step can show, and the honest answer is no map change."
- **Line to add (kc-expectations):** "KTuner chose 21 psi as a safe limit for the CVT."
- Log: Turbo Pressure Target plateau, TPS, TPS Command, EWG Position.
- Sources: [KTuner forum p9224](http://www.ktuner.com/forums/viewtopic.php?f=65&p=9224); [CivicX 68777 (search summary)](https://www.civicx.com/forum/threads/1-5-turbo-cvt-with-the-starter-dual-target-21-psi-tune-horsepower-dyno-results.68777/).

### g1-boost-05 · value 4 · new, refuted for our car: the international-ECU TPS Command cap
- **New line in kc-table-boost:** "Some export CVT ECUs log TPS Command stuck near 95 percent at full pedal, with the target held at 18 to 19 psi. Yours reached 99 to 100 percent, so that is not your gap. If a floored pull ever shows TPS Command pinned below 95 with the pedal at its stop, it is a KTuner support case, not a map change."
- Sources: [CivicX 91058 (search summary)](https://www.civicx.com/forum/threads/ktuner-21psi-dual-tps-cmd-stuck-at-95-during-wot-international-ecu.91058/); [CivicX 87438](https://www.civicx.com/forum/threads/ktuner-v1-2-with-civic-fk7-1-5t-cvt-need-help.87438/); our logs (`stage2/tps.py`).

### g1-boost-07 · value 4 · fills `kp-how-the-final-boost-target-is-arbitrated` (promote to a card)
- **Card text:** "Final Boost Target takes the incoming target from the boost table, the partial-throttle boost target or the Boost By Gear limit, passes it nearly one to one, and caps it at its last TBST column: in KTuner's example a 22 header allows 22.5 at most. Raising the cap means changing that header and its whole column. On your map every column from 8.2 psi up is the same in every rpm row, and the top is 23.4, so it passes your target through and is not what held it at 19.2. The app never edits it."
- Sources: [KTuner Help, Final Boost Target](http://www.ktuner.com/KTunerHelp/final_boost_target.htm); [CivicX 40764](https://www.civicx.com/forum/threads/adjusting-boost-tables.40764/).

### g1-boost-08 · value 4 · fills `kp-how-boost-by-gear-limits-work` (promote to a card)
- **Card text:** "Boost By Gear Limits is on in every Starter map: one table per gear, rpm by atmospheric pressure. It only limits: wherever the boost table asks less, the table wins, so values above the targets mean no limit. Quick settings offer flat 10 to 21 psi, or 10 to 20 psi ramped to full above 4,000 rpm. Your map holds 35.4 psi everywhere: no gear limit is active. KTuner suggests a first-gear limit to protect a CVT. The app does not write this table, and which gear number your CVT reports to it is unconfirmed."
- Sources: [KTuner Help, Boost By Gear Limits](http://www.ktuner.com/KTunerHelp/boost_by_gear_limits.htm); [Quick Boost By Gear Settings](http://www.ktuner.com/KTunerHelp/quick_boost_by_gear_settings.htm).

### g1-boost-06 · value 4 · extends `kc-boost-step`: overshoot that is normal
- **Line to add:** "Judge overshoot held for half a second or more. KTuner calls 1 to 2 psi of overshoot normal, and a brief 1 to 3 psi spike at the CVT's simulated shift is normal too. A single row where the target itself jumps is a logging glitch."
- Sources: [CivicX 33313 (KTuner staff)](https://www.civicx.com/forum/threads/ktuner-v1-2-data-logging-showing-boost-way-over-target.33313/); [CivicXI 42278](https://www.civicxi.com/forum/threads/42278/).

### g1-boost-02 · value 4 · extends `kc-boost-step` and `kc-quick-adjustments`: TPS is the pedal
- **Line to add (kc-quick-adjustments):** "In TunerView, TPS is your foot on the pedal (KTuner's words) and TPS Command is the throttle plate, which opens near fully even at half pedal. So pulls are judged on TPS, never on TPS Command."
- Source: [KTuner forum p9224](http://www.ktuner.com/forums/viewtopic.php?f=65&p=9224).

### g1-boost-14 · value 4 · extends `kc-expectations`: what 21 psi maps log on the road
- **Line to add:** "Owners on 21 psi maps usually log 18 to 20 psi on the road. KTuner's first checks for a low target are a bad flash and Knock Control. Yours passes both: a 19.2 target is above ECO's 18, and Knock Control sat at 0.49 to 0.53 at every peak."
- Sources: [civic11forum 1196](https://www.civic11forum.com/threads/ktuner-on-the-sport-touring.1196/); [civic11forum 9097](https://www.civic11forum.com/threads/turbo-flutter-while-pushing-higher-boost.9097/); [KTuner forum t1842](http://www.ktuner.com/forums/viewtopic.php?f=62&t=1842).

### g1-boost-13 · value 3 · extends `kc-expectations`: stock boost
- **Line to add:** "A stock 1.5T peaks around 12 to 15 psi, so your 19 to 20 psi is already 4 to 7 psi over stock."
- Sources: civicxi-115, youtube-4, youtube-21 (urls in claims).

### g1-boost-18 · value 3 · extends `kc-table-boost`: ethanol boost adjust
- **Line to add:** "Ethanol Boost Target Adjustment, a pedal-by-rpm table, holds 0 everywhere on your map and needs an ethanol sensor, so it plays no part."
- Source: [KTuner Help, Civic/Accord flex fuel tuning](http://www.ktuner.com/KTunerHelp/civic_accord_flex_fuel_tuning.htm).

### g1-boost-15 · value 3 · new: underboost diagnosis
- **New card (owner-question) "Boost doesn't reach target":** "Read boost against target with the wastegate. If the wastegate is nearly shut and boost is still short, it is a leak (couplers, O-rings after an intercooler) or the turbo's limit. If the wastegate is open and boost is short, it is the target side. KTuner support asks for a datalog. Your boost tracks target, with the wastegate at 2.4 to 3.7 percent at full load."
- Sources: civicx-120, civicxi-86; owner-voices §2 #9.

### g1-boost-11 · value 3 · confirms `kc-power-sources`
- No change. Optionally cite [CivicXI 35373](https://www.civicxi.com/forum/threads/35373/), KTuner: "a target torque based system, not target boost".

### g1-boost-12 · value 3 · confirms `kc-dual-boost-targets`
- **Line to add:** "A target above 18 psi in a log proves the drive was in Normal or Sport."
- Source: [KTuner Help, Dual Boost Targets](http://www.ktuner.com/KTunerHelp/dual_boost_targets.htm).

### g1-boost-09 · value 3 · extends `kc-cvt`: first-gear Boost By Gear (out of scope)
- **Line to add:** "KTuner's own tool for sparing a CVT is a first-gear Boost By Gear limit (owners use about 15 to 18 psi, ramped). The app explains it and does not write it."
- Source: [KTuner Help, Boost By Gear Limits](http://www.ktuner.com/KTunerHelp/boost_by_gear_limits.htm).

## CVT

### g1-map-02 · value 4 · confirms `kc-table-boost` and `kc-cvt`: Starter maps limit low-end torque
- **Line to add (kc-table-boost):** "KTuner limits low-end torque on CVT cars for longevity, and you can see it in your file: the Normal table caps at 15 psi at 2,500 rpm, 17 at 2,750 and 19 at 3,000, and reaches 21 only from 3,500. That is why a Boost step starts at 3,500 rpm."
- Sources: [KTuner forum t2429](https://www.ktuner.com/forums/viewtopic.php?f=71&t=2429&p=8350); vendors-6 (TSP).

### g1-cvt-02 · value 3 · confirms `kc-cvt`: what tuned owners see
- **Line to add:** "Owners on 21 to 23 psi maps log 77 to 90 °C normally and up to 99 °C on long freeway runs (108 °C on an older Civic before a cooler), which is why Stop at 100 °C stays provisional."
- Sources: [civic11forum 1196](https://www.civic11forum.com/threads/ktuner-on-the-sport-touring.1196/); [CivicX 95524 (search summary)](https://www.civicx.com/forum/threads/tuning-my-2016-civic-1-5l-touring.95524/).

### g1-cvt-03 · value 3 · extends `kc-cvt`: fluid interval (forum)
- **Line to add:** "Tuned-CVT owners change the fluid every 24,000 to 40,000 km, and sooner in heat (forum, not a Honda figure)."
- Source: [CivicX 87019 (search summary)](https://www.civicx.com/forum/threads/tuned-cvt-longevity.87019/).

### g1-cvt-05 · value 3 · extends `kc-cvt`: KTuner doesn't touch the transmission
- **Line to add:** "KTuner does not flash the transmission controller, so a change in how the CVT feels after a flash comes from the engine's torque delivery, not a gearbox change."
- Sources: [KTuner forum t1804](http://www.ktuner.com/forums/viewtopic.php?t=1804&p=5672); [civic11forum 663](https://www.civic11forum.com/threads/ktuner-driving-impressions-who-wants-more-power.663/).

### g1-cvt-01 · value 3 · confirms `kc-cvt`
- No change. Adds sources for "never brake-launch": [civic11forum 6433](https://www.civic11forum.com/threads/can-an-automatic-cvt-transmission-be-upgraded-or-am-i-screwed.6433/), [civic11forum 8127 (Phearable email)](https://www.civic11forum.com/threads/ktuner-question.8127/), [CivicXI 50251](https://www.civicxi.com/forum/threads/50251/).

## Throttle and drivability

### g1-thr-03 · value 4 · new: Disable Boost Target Dampening stays off
- **Line to add (kc-quick-adjustments):** "Disable Boost Target Dampening is the one setting that lifts the part-pedal target: above 15 percent pedal it always chases the table, and P0299 must be switched off. KTuner says a CVT then needs Boost By Gear, and owners call it harsh on the CVT. It stays off on this car."
- Sources: [KTuner Help, Disable Boost Target Dampening](http://www.ktuner.com/KTunerHelp/disable_boost_target_dampening.htm); [CivicX 27958 (search summary)](https://www.civicx.com/forum/threads/boost-target-ramp-rate.27958/).

### g1-thr-08 · value 4 · extends `kc-quick-adjustments`: the pedal isn't the plate
- **Line to add:** "The plate opens near fully at half pedal when boost is asked for, so TPS Command sits well above TPS under boost (20 points or more in almost every boosted row of yours)."
- Sources: [CivicXI 36421](https://www.civicxi.com/forum/threads/36421/); [CivicXI 34408](https://www.civicxi.com/forum/threads/34408/); [KTuner Help, DBW Maps](http://www.ktuner.com/KTunerHelp/dbw_maps.htm).

### g1-thr-01 · value 3 · extends `kc-quick-adjustments`: which lever does what
- **Line to add:** "Turbo Responsiveness speeds spool toward part-throttle targets. On a floored pull the slow climb is Boost Target Ramp Rate's job, so for floored-pull lag that is the lever to try first."
- Source: [KTuner Help, Turbo Responsiveness](http://www.ktuner.com/KTunerHelp/turbo_responsiveness.htm).

### g1-thr-04 · value 3 · extends `kc-quick-adjustments`: proof that Ramp Rate works
- **Line to add:** "A Ramp Rate level shows as a steeper target climb on matched floored pulls. Yours climbs about 1.6 to 2.5 psi a second at Factory."
- Source: [YouTube, Another Rich Experience](https://www.youtube.com/watch?v=S0ovmyF8pVQ&t=255s).

### g1-thr-09 · value 3 · new: VSA voids a pull
- **Line for kc-drive-brief or kc-log-gate:** "If TPS Command drops while your foot stays down, traction control stepped in: that pull doesn't count."
- Sources: [KTuner Help, Advanced VSA Control Strategy](http://www.ktuner.com/KTunerHelp/advanced_vsa_control_strategy.htm); [YouTube](https://www.youtube.com/watch?v=S0ovmyF8pVQ&t=347s).

### g1-thr-05 · value 3 · ⚔️ extends `kc-quick-adjustments`: Early Spool
- No wording change. Keep Early Spool off for the CVT and LSPI reason. If an owner says Turbo Responsiveness "needs" Early Spool, KTuner's help says otherwise.
- Sources: [KTuner Help, Early Spool](http://www.ktuner.com/KTunerHelp/early_spool.htm); [YouTube](https://www.youtube.com/watch?v=dY7oRkl_LHY&t=223s).

### g1-thr-02 · value 3 · confirms `kc-quick-adjustments`
- No change. Owners agree that aggressive Quick Adjustments liven the low end and do not add top-end power.

## Maps and basemaps

### g1-map-01 · value 3 · extends `kc-expectations`
- **Change:** "KTuner claims Starter 21 adds up to 55 whp and 58 lb-ft" (adds the whp figure and labels both as KTuner's claim).
- Source: [KTuner 22+ Civic 1.5T](https://ktuner.com/22civicturbo/).

### g1-map-04 · value 3 · extends `kc-map-switching`
- **Line to add:** "Map switching isn't supported on every ECU software number, though KTuner lists it as fully supported on the 22+ 1.5T. Before the first Boost step, switch to Tune 2 and confirm on the dash or V2 that the tune changed."
- Sources: [KTuner Help, On The Fly Map Switching](http://www.ktuner.com/KTunerHelp/on_the_fly_map_switching.htm); [TSP Stage 1 non-Si](https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si).

### g1-map-05 · value 3 · new: the ECU part number
- **New profile field and help line:** "Note your ECU part number (37820-64x-xxx). KTuner marks some international 22+ ECUs as initial support only, and some export ECUs aren't supported at all."
- Sources: KTuner 22+ page (raw `site-22civicturbo.md`); [CivicXI 53443](https://www.civicxi.com/forum/threads/53443/); [YouTube](https://www.youtube.com/watch?v=Vq26vGoROmw&t=208s).

### g1-map-13 · value 3 · extends `kc-boost-step`
- No change. It confirms "24 psi is a vendor file (TSP non-Si Map 3)". Optionally add "TSP Map 2 is 16.5 psi, below Starter 21".
- Source: [TSP Stage 1 non-Si](https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si).

## Results and numbers

### g1-res-09 · value 3 · extends `kc-expectations` and `kc-boost-step`: what one psi is worth
- **Line to add:** "One more psi is about 3 percent more air, so at most about 5 whp, and dyno tests show about 2. The hot-versus-cool swing on your car (19.9 vs 16.7 psi) is about three times a step. A step only counts when proven on matched Cool pulls."
- Sources: [civic11forum 341 (DSport figures)](https://www.civic11forum.com/threads/whats-a-safe-amount-of-power-to-boost-the-1-5t-to.341/); `stage2/psi_power.py`.

### g1-res-01 · value 3 · extends `kc-expectations`: stock wheel numbers
- **Line to add:** "A stock non-Si CVT measures about 154 to 164 whp at the wheels against its 176 hp rating."
- Sources: [CivicXI 50047 (TSP)](https://www.civicxi.com/forum/threads/50047/); [civic11forum 592 (Hondata)](https://www.civic11forum.com/threads/ktuner-coming-for-our-platform.592/).

### g1-res-02 · value 3 · extends `kc-expectations`: Starter 21 against vendor tunes (plausible)
- **Line to add, labelled as vendor arithmetic:** "On a competitor's dyno, Starter 21 sits about 18 hp and 25 lb-ft under Phearable Stage 1.5 (about 176 whp and 212 lb-ft on a stock CVT); TSP Stage 1 made 191 whp."
- Sources: [Phearable Stage 1.5 non-Si](https://www.phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-non-si/stage1-5-nonsi-11thgen.html); [CivicXI 50047](https://www.civicxi.com/forum/threads/50047/).

### g1-res-07 · value 3 · new: dyno numbers don't travel
- **Line for kc-expectations:** "Dyno numbers only compare on the same dyno on the same day. Different dynos read up to 30 hp apart, and a CVT loses more than a manual. Your proof is your own drives at matched intake temperature."
- Sources: [CivicXI 50048](https://www.civicxi.com/forum/threads/50048/); [KTuner 16+ Civic page](https://ktuner.com/16civicturbo/).

### g1-res-05 · value 3 · new: fuel economy after a tune
- **New owner-question card:** "Economy stays about the same if you drive gently and drops with a heavy foot. E10 costs about 3 percent on its own. A sudden large drop is a fault to find (trims, the downpipe cat), not the tune."
- Sources: [CivicXI 33918](https://www.civicxi.com/forum/threads/33918/); [CivicX 31306 (search summary)](https://www.civicx.com/forum/threads/ktuner-v2-dual-21psi-tune-first-impressions.31306/); [CivicXI 50406](https://www.civicxi.com/forum/threads/50406/).

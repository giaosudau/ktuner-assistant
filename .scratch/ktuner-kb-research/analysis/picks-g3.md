# Picks: group g3 (value ≥ 3, fits or fits-with-caveat)

*48 findings qualify; they're grouped below by category. Each gets a proposed card change: new card text, or the line to add to an existing card. Cards follow the house style (one plain paragraph). Finding ids point to `findings-g3.jsonl`, and conflicts are in `conflicts-g3.md`.*

**Top 8, by what they change in the app**

| # | Finding | Value | KB relation |
|---|---|---|---|
| 1 | g3-05 This car goes open loop above ~8–10 psi (STFT frozen at 0): trims can't correct airflow under boost | 5 | extends kc-open-loop-wot |
| 2 | g3-28 KTuner channel names vs the owner's CSV; the detector misses K.Cont / K.Ret / TC.Target / TC.Press / DIFPress / STFT1 / LTFT1 | 4 | new; extends kc-log-gate |
| 3 | g3-08 The 1.5T table is "WOT Enrichment" (axis MGStk); "Nominal Lambda…" is a Type-R page | 4 | **contradicts kc-table-wot** |
| 4 | g3-03 Rescale direction and method: trim sign = g/s correction sign; drop lift-off and transient rows | 4 | extends kc-maf-data-rules; promotes kp-which-way… |
| 5 | g3-06 A MAF Scaling change moves load, and so Knock Control: read KC on the Shakedown | 4 | extends kc-shakedown, kc-table-maf |
| 6 | g3-23 Disable Boost Target Dampening needs P0299 off and Boost By Gear on a CVT; logged target at closed throttle shows the state | 4 | extends kc-table-boost, kc-quick-adjustments |
| 7 | g3-19/g3-20 Downpipe codes (P0420, P2A01) and KTuner disable names; "no-code" pipes aren't always quiet | 4 | extends kc-p0420; **contradicts kc-downpipe-catted-catless** |
| 8 | g3-38/39/24/43 Flashing, recovery and after-flash help card | 4 | new |

---

## fuel-afr

**g3-05 Open loop under boost, confirmed on this car (value 5).** Update **kc-open-loop-wot**. Replace "It has not been confirmed for this car's ECU, so read it on your own log" with:
> On this car it is confirmed: across four drives with boost, short-term trim reads exactly 0 on every warm row at 12 psi and above, and on nearly all from about 8 psi, while lower down it moves as normal. So above about 8 psi the trims neither correct the mixture nor say anything about the airflow curve; only AFR Command and the map's target do. An airflow correction uses only rows below that, where the trims are live.

Also add `numbers: ol-start-psi: 8 psi; ol-full-psi: 10 psi`. Source: owner logs `data/example-aug22-0903/aug30-1529/aug30-1601/sep01-0813.js` (script `scratchpad/stage2/ol.py`); [KTuner Help, Closed Loop Settings](http://www.ktuner.com/KTunerHelp/closed_loop_settings.htm); [ktuner-forum-12](https://www.ktuner.com/forums/viewtopic.php?p=6755). **Engine follow-up:** the AFM Flow bin correction must drop rows with MAP ≥ 8 psi or STFT frozen at 0.

**g3-08 WOT Enrichment naming (value 4).** Edit **kc-table-wot**. First sentence becomes:
> WOT Enrichment (the KTuner table name on the 1.5T; its load axis is MGStk, the air per stroke in mg) holds the mixture the ECU aims for, by rpm and load, Low and High cam.

Make the same name fix in fact-check §1 row 6 and afr-tuning-research §2C/§3, plus a note there that the missing load axis is mg/stroke. Sources: [KTuner Help, Nominal Lambda (Type-R section)](http://www.ktuner.com/KTunerHelp/nominal_lambda_for_component_protection.htm), [ktuner-forum-54](https://www.ktuner.com/forums/viewtopic.php?f=40&t=2677&p=9447), [ktuner-forum-56](https://www.ktuner.com/forums/viewtopic.php?f=24&t=1766&p=9049), [civicx-124](https://www.civicx.com/forum/threads/queries-related-to-terminologies-used-in-ktuner-desktop-app-and-datalogs.68201/).

**g3-13 Trim pattern → cause (value 4).** Add to **kc-trim-cause**:
> Trims that go negative after a change, with the preset right, point to metered air escaping after the sensor: a boost leak or a vent-to-air blow-off valve. On this car that shows as negative trims only at light boost, because above about 8 psi the trims freeze; at full boost it shows as missed boost and a mixture richer than asked. A leaking injector also pulls trims negative. Flash the basemap to tell the tune from the hardware.

Sources: [civicxi-95 (KTuner staff)](https://www.civicxi.com/forum/threads/40025/), [civicx-55/56](https://www.civicx.com/forum/threads/high-ltft-after-installing-cai-and-ktuner-v2.102070/).

**g3-17 DI pressure under target (value 4).** Add to **kc-tune-order**, after "fuel pressure under target":
> (DIFP against DIFP Target, both logged: one 11th-gen Si went into limp above 4,000 rpm with fuel pressure about 89 percent of target, which is a fuel-supply limit, not something to tune around).

Source: [civic11forum-33](https://www.civic11forum.com/threads/going-limp.6521/). This confirms `boost_step_gates.difp_min_pct = 90`.

**g3-09 E10 and the flex tables (value 3).** Add to **kc-e10**:
> KTuner's flex-fuel tables (Ethanol Ignition Adjustment, Ethanol Boost Target Adjustment) only act with an ethanol sensor wired to the secondary coolant input; without one they add nothing, so pump E10 gets no ethanol timing or boost, and none is needed.

Source: [KTuner Help, Civic/Accord Flex Fuel Tuning](http://www.ktuner.com/KTunerHelp/civic_accord_flex_fuel_tuning.htm).

**g3-10 What 'O2' is (value 3).** Add to **kc-rich-wot**:
> The O2 column in the log is KTuner's 'Wideband': the factory front sensor's lambda times 14.7, whatever the fuel; a 29 on a lift is fuel cut.

Sources: [KTuner Help, Item Abbreviations](http://www.ktuner.com/KTunerHelp/item_abbreviations.htm), [youtube-83](https://www.youtube.com/watch?v=htDPjercuew&t=413s), [ktuner-forum-14](https://www.ktuner.com/forums/viewtopic.php?f=11&p=10233).

**g3-11 / g3-12 Trim swings are normal (value 3).** Add to **kc-trims**:
> Short-term trim alone swings ten percent or more around throttle changes by design, and KTuner calls minus 10 to plus 15 normal-looking; the verdict uses the warm-cruise total, never a single spike. A rule like 'five percent short-term is bad' misreads that.

Sources: [civicxi-134 (KTuner staff)](https://www.civicxi.com/forum/threads/15330/), [civicx-126](https://www.civicx.com/forum/threads/sky-high-kcon-also-bad-fuel-trims-need-help-16-cvt-ktuner.79395/), [civicxi-46](https://www.civicxi.com/forum/threads/62264/).

**g3-15 WOT AFR varies run to run (value 3).** Add to **kc-tune-one-thing**:
> The first full-throttle pull of a drive can read about ten percent different from later ones until everything is at temperature, so compare warm pulls only.

Source: [civicxi-48/49](https://www.civicxi.com/forum/threads/54736/).

**g3-16 A same-model owner who leaned WOT (value 3).** Add to **kc-wot-lean-timing**:
> A Civic FE CVT owner who aimed his full-throttle mixture at 11.3 to 11.4 through the airflow curve saw spikes to 11.7 to 11.8, so a leaner aim runs leaner still in places.

Source: [civicxi-45](https://www.civicxi.com/forum/threads/62264/).

**g3-77 Fuel tables left to the basemap (value 3).** Add to the Map tour / Capabilities list (no card needed):
> Target A/F, Fuel Trim Limits, Injector Sizing (main trim offset), AFM Fuel and Closed Loop Settings are read-only: the shop names them and leaves them to the basemap.

Source: [KTuner Help, Closed Loop Settings](http://www.ktuner.com/KTunerHelp/closed_loop_settings.htm), [Injector Sizing](http://www.ktuner.com/KTunerHelp/injector_sizing.htm).

## maf-airflow

**g3-03 Direction and method: promote `kp-which-way-a-fuel-trim-points-when-correcting-the-airflow-cur` to a card (value 4).** New card **kc-maf-trim-direction**:
> ---
> id: kc-maf-trim-direction
> title: Which way a trim moves the airflow curve
> kind: ktuner-howto
> topics: maf, afm, airflow, trims, calibration
> applies-when: The owner asks how to correct MAF Scaling from a CSV, or which way a trim points.
> status: current
> ---
> A positive trim means the ECU added fuel because it measured too little air, so the airflow points covering that airflow move up by about that percent; a negative trim moves them down. Average the trims at each point over warm, steady driving and throw away the rows where you lift off or coast, which read zero or spike, and the first seconds after a throttle change, when larger housings show ten percent that settles to one or two. Reach the higher points with a slow, steady roll-on in S, not a stab. Apply part of the correction, keep the curve rising, flash, and log again. On this car only rows below about 8 psi count: above that the trims freeze.

Also add the lift-off and transient rule to **kc-maf-data-rules**. Sources: [civicx-12/13](https://www.civicx.com/forum/threads/ktuner-stft-ltft-tuning.20980/), [youtube-68/69](https://www.youtube.com/watch?v=pUBqbpW-wNM&t=68s), [ktuner-forum-11 (staff)](https://www.ktuner.com/forums/viewtopic.php?p=6755).

**g3-06 MAF changes move knock (value 4).** Add to **kc-shakedown**:
> After an airflow (MAF Scaling) Flash, watch the Fuel-quality score as closely as the trims: the curve also sets the load the ignition tables read, and owners who lowered their airflow values saw part-throttle knock and a higher score until they flashed back.

Add to **kc-table-maf**:
> Never add one blanket percent for a housing size; correct point by point from logs.

Sources: [civicx-115](https://www.civicx.com/forum/threads/knock-control-significance.29457/), [civicx-45](https://www.civicx.com/forum/threads/trouble-with-27won-race-maf-scaling-on-ktuner.76479/).

**g3-01 Housing decides the preset (value 4).** **kc-maf-housing** is confirmed; add KTuner staff as its primary source plus one line:
> KTuner itself says to pick the Race option only with the Race housing, and that an intake whose housing size differs from factory throws fueling and knock control off.

Sources: [ktuner-forum-3/4](http://www.ktuner.com/forums/viewtopic.php?t=1638), [ktuner-forum-13](https://www.ktuner.com/forums/viewtopic.php?p=9165), [ktuner-forum-54](https://www.ktuner.com/forums/viewtopic.php?f=40&t=2677&p=9447).

**g3-02 Hz, not volts (value 3).** Add to **kc-table-maf**:
> Earlier-generation non-Si cars read their sensor in volts, so per-volt corrections in older videos never transfer.

Sources: [civicx-15](https://www.civicx.com/forum/threads/ktuner-stft-ltft-tuning.20980/), [KTuner Help, MAF Settings](http://www.ktuner.com/KTunerHelp/maf_settings.htm).

**g3-04 Zeroing LTFT limits (value 3).** Answers forum-afr-maf-research §1 #11. Add to **kc-maf-data-rules**:
> Some owners zero the long-term trim limits while logging; that is a map change that needs a Flash, and it isn't needed when short- and long-term trims are added together, as here.

Sources: [civicx-12](https://www.civicx.com/forum/threads/ktuner-stft-ltft-tuning.20980/), [KTuner Help, Real-time tuning](http://www.ktuner.com/KTunerHelp/real_time_tuning_options.htm).

**g3-07 Base tunes leave MAF alone (value 3).** kc-tune-order is confirmed; add the source [civicx-46 (KTuner rep)](https://www.civicx.com/forum/threads/trouble-with-27won-race-maf-scaling-on-ktuner.76479/) and [ktuner-forum-53](https://www.ktuner.com/forums/viewtopic.php?f=27&t=2093). No text change.

## dtc-monitors

**g3-19 Downpipe codes and the KTuner boxes (value 4).** Add to **kc-p0420**:
> Besides P0420, owners of 11th-gen downpipes see P2A01, a rear-sensor range code; KTuner's Disables and Monitors tab also lists O2 slow response, O2 performance and the post-catalyst lean and rich checks (P2096 and P2097, already off on this map), and some codes have no box at all. Unplugging the rear sensor is worse: the ECU runs rich or goes limp.

Sources: [civic11forum-20/21](https://www.civic11forum.com/threads/error-code-p2a01.6667/), [civic11forum-103/104](https://www.civic11forum.com/threads/how-can-i-disable-my-o2-sensor.6071/), [KTuner Help, Disables/Monitors](http://www.ktuner.com/KTunerHelp/disables_monitors.htm).

**g3-20 "No-code" pipes (value 4, ⚔️).** Edit **kc-downpipe-catted-catless**: change "and owners report none" to:
> and most owners report none, though a few report the rear-sensor code P2A01 or a light only in heavy rain or long highway runs

Sources in conflicts-g3.md §2.

**g3-23 P0299 and dampening (value 4).** Add to **kc-table-boost**:
> Turning off Boost Target Dampening is not a change for this CVT: KTuner says it also needs the P0299 underboost code disabled and Boost By Gear set to protect the gearbox. With dampening off, the logged boost target never falls to atmospheric even with the throttle shut, which is how a log shows it.

Sources: [KTuner Help, Disable Boost Target Dampening](http://www.ktuner.com/KTunerHelp/disable_boost_target_dampening.htm), [civicxi-146](https://www.civicxi.com/forum/threads/62488/).

**g3-22 P0046 (value 4).** New card **kc-boost-codes**:
> ---
> id: kc-boost-codes
> title: Boost codes P0046 and P0299, and what to log
> kind: owner-question
> topics: dtc, boost, wastegate, leak
> applies-when: The owner reports P0046 or P0299, a limp with a dead pedal, or boost that misses target.
> status: current
> ---
> P0046 means the ECU can't hold the wastegate where it commands it. On 11th-gen cars at high boost owners traced it to a sticking wastegate actuator, and to a pinhole leak in the vacuum line on the charge pipe; a new downpipe seemed to fix it only for a while. P0299 is underboost. In your log, compare EWG Position with EWG Target and boost with its target: a position that doesn't follow its target points to the actuator; boost under target with the wastegate shut points to a leak. Fix the hardware first; no map change.

Sources: [civic11forum-16](https://www.civic11forum.com/threads/code-p0046.9731/), [civic11forum-70/71](https://www.civic11forum.com/threads/p0046-on-ktuner-with-tsp-tune.4166/), [civicxi-146](https://www.civicxi.com/forum/threads/62488/).

**g3-24 After-flash warnings (value 4)** goes in the new help card under ktuner-ui-workflow.

**g3-21 Inspection (value 3).** kc-p0420 is confirmed; add:
> The US habit of refitting the stock pipe and clearing codes before inspection doesn't apply: đăng kiểm tests the tailpipe gas and the lamp, not the monitors.

Source: [civic11forum-21](https://www.civic11forum.com/threads/error-code-p2a01.6667/); QCVN 85:2025 via downpipe-power-research §3.

**g3-27 P0128 already off (value 3).** Add to **kc-p0420** (or a future "codes this map disables" card):
> This map also has P0128, the thermostat check, switched off, so a thermostat stuck open would show only as coolant that never reaches about 80 °C on a long drive.

Sources: [civicx-70](https://www.civicx.com/forum/threads/check-engine-light-after-tune-p0128.71350/), [KTuner Help, flex fuel](http://www.ktuner.com/KTunerHelp/civic_accord_flex_fuel_tuning.htm). Engine idea: a Watch when warm-drive ECT stays under 80 °C.

**g3-25 Codebase errors (value 3)** goes in the recovery section of the help card below.

## logging-tunerview

**g3-28 Channel names (value 4).** New card **kc-log-channels**:
> ---
> id: kc-log-channels
> title: The gauges the shop reads, by their KTuner names
> kind: ktuner-howto
> topics: logging, tunerview, gauges, channels
> applies-when: The owner asks which gauges to turn on, what a gauge abbreviation means, or why a log reads Can't tell.
> status: current
> ---
> KTuner's short names and the CSV's long names are the same gauges: K.Cont is Knock Control (the Fuel-quality score), K.Ret is Knock Retard, A.Ignition is Ignition, TC.Target and TC.Press are Turbo Pressure Target and Turbo Pressure (at the turbo, before the throttle), MAP is the manifold, EWG.Posi and EWG.Target are the wastegate, DIFPress and DIFP.Target are fuel pressure, Wideband is the O2 column, TPS.C is TPS Command. Log bank 1 trims only. Your logger already records all of these; still missing are AFR Command and MAF Hz, which the airflow and mixture checks need. Knock Count is not knock.

**Engine follow-up:** add aliases to `engine/kta-engine.js` CHANNELS (k.cont/k.con, k.ret, tc.target, tc.press, difpress, stft1/ltft1, tps.c). Sources: [KTuner Help, Item Abbreviations](http://www.ktuner.com/KTunerHelp/item_abbreviations.htm), owner CSV header (data/example-*.js).

**g3-31 LTFT −100 (value 4).** Add to **kc-log-gate**:
> A trim column pinned at minus 100 means bank 2 was picked on this one-bank engine, or a dead channel: the log reads Can't tell and the owner logs STFT and LTFT bank 1, never a trims Stop.

Sources: [civicxi-134](https://www.civicxi.com/forum/threads/15330/), [civicx-105](https://www.civicx.com/forum/threads/a-very-strange-knock-control-issue-can-the-experts-help.87992/).

**g3-30 Boost channels (value 4).** Add to **kc-table-boost**:
> Turbo Pressure is read at the turbo and MAP after the throttle; once spooled with the pedal floored both should sit near the target, and boost short of target with the wastegate almost shut points to a leak or the turbo's limit.

Sources: [civicxi-99 (KTuner staff)](https://www.civicxi.com/forum/threads/39578/), [civicx-27](https://www.civicx.com/forum/threads/ktuner-v1-2-data-logging-showing-boost-way-over-target.33313/).

**g3-29 Knock gauges (value 3).** kc-misfire-gauges and kc-ignition-formula are confirmed. Add to **kc-log-gate**:
> The V2 screen can freeze a gauge while the log keeps moving; judge from the CSV.

Source: [civic11forum-29](https://www.civic11forum.com/threads/fuel-quality-and-knock-control.7390/).

**g3-32 TunerView habits (value 3).** Add to **kc-drive-brief**:
> Start the TunerView log before you leave and check its blinking indicator; the Bluetooth link can drop.

Sources: [civicx-47/48](https://www.civicx.com/forum/threads/how-to-datalog-on-v1-2.55782/).

**g3-33 G-sensor blocked (value 3).** Add to **kc-log-gate**:
> The Acceleration and other extended gauges read zero on this car because its CAN gateway blocks them from the OBD port; no logger setting fixes that, so it never fails the gate.

Sources: [ktuner-forum-43](https://ktuner.com/forums/viewtopic.php?f=15&t=2904), [KTuner Help, V2 Extended Data](http://www.ktuner.com/KTunerHelp/v2_extended_data.htm).

## ktuner-ui-workflow

**g3-38 + g3-39 + g3-24 + g3-43 + g3-25 + g3-44 Flashing help card (value 4).** New card **kc-flash-howto**:
> ---
> id: kc-flash-howto
> title: Flashing with KTuner: power, the key, and what is normal after
> kind: ktuner-howto
> topics: flash, recovery, cel, ktuner, help
> applies-when: The owner is about to flash, a flash failed, or warning lights came on after a flash.
> status: current
> ---
> Put a battery charger on the car and use a strong USB port or the car's OBD power for the V2: low voltage is what fails flashes. Ignition on, engine off, never running. After 100 percent, key off for ten seconds, back on, and wait for 'flash successful'. Warning lights during the flash are normal, and driver-assist warnings can stay until you have driven ten to fifteen minutes. A failed flash leaves the car unable to start: reconnect and accept recovery, which returns it to factory. But a Recovery prompt while the engine runs means a loose cable: say no. If the V2 stops waking with the car, set CAN Gateway to Yes in its menu. Error codes right after a flash usually mean the wrong codebase: start the tune with the one that matches the unit info.

Sources: [KTuner Help, Flashing: What To Expect](http://www.ktuner.com/KTunerHelp/flashing__what_to_expect.htm), [ECU Recovery](http://www.ktuner.com/KTunerHelp/ecu_recovery.htm), [Download and reflash](http://www.ktuner.com/KTunerHelp/download_and_reflash_the_ecu.htm), [CAN Gateway](http://www.ktuner.com/KTunerHelp/can_gateway_option.htm), [civicxi-79](https://www.civicxi.com/forum/threads/47577/), [civicxi-65](https://www.civicxi.com/forum/threads/51333/), [vendors-21 (TSP)](https://www.twostepperformance.com/blogs/install-guides/installation-guide-for-tsp-stage-tunes-for-ktuner-or-hondata), [ktuner-forum-6](https://www.ktuner.com/forums/viewtopic.php?t=1745), [civicxi-78](https://www.civicxi.com/forum/threads/48365/).

Optional extra line:
> KTuner has tested the V2 at 82 °C inside the car, so leaving it plugged in a parked car in the sun is fine.

**g3-41 Upload ≠ flash (value 4).** Add to **kc-shakedown**:
> Saving a tune to the V2 is not flashing it, and a failed flash quietly returns to factory, so the Flash is credited only when the next log shows the change: on this map that needs a floored pull held four seconds above 3,500 rpm, since the logged boost target stays near 19 psi even on a good flash.

Sources: [civicxi-93 (KTuner staff)](https://www.civicxi.com/forum/threads/40110/), [ktuner-forum-34](https://www.ktuner.com/forums/viewtopic.php?f=58&p=9917).

**g3-36 Map switching in practice (value 4).** Add to **kc-map-switching**:
> The tach shows 1,000, 2,000 or 3,000 rpm for Tune 1, 2 or 3 while you choose, and cruise must be fully off. A V2 left plugged in brings back the last tune you used when the car starts, so a drive is in Tune 1 only if the device was unplugged; plug it in before starting and check the tune before you log.

Sources: [KTuner Help, On The Fly Map Switching](http://www.ktuner.com/KTunerHelp/on_the_fly_map_switching.htm), [civicxi-76/77](https://www.civicxi.com/forum/threads/49319/), [civicx-98](https://www.civicx.com/forum/threads/tuning-1-5t-cvt-with-ktuner.54706/).

**g3-37 Map 3 myth (value 3).** No change: kc-map-switching is already right. Add youtube-29 to the eval set as a myth to correct.

**g3-47 Quick Adjustment option names (value 3).** Add to **kc-quick-adjustments**:
> Boost Target Ramp Rate steps from Factory Ramp through Improved Ramp 1 and 2 to Aggressive Ramp 1 and an aggressive no-ramp setting; 'one level up' means the next one in that list.

Sources: [youtube-2](https://www.youtube.com/watch?v=S0ovmyF8pVQ&t=62s), [civicxi-135](https://www.civicxi.com/forum/threads/16215/), [civicx-94](https://www.civicx.com/forum/threads/k-tuner-tune-questions-for-cvt-1-5t.31175/).

**g3-46 Too many options at once (value 3).** kc-tune-one-thing is confirmed; add source [civicxi-64](https://www.civicxi.com/forum/threads/51333/). No text change.

## hardware-mods

**g3-58 Blow-off valve (value 3).** New line in **kc-maf-housing**, or a short card:
> Keep the blow-off valve recirculating: the airflow sensor sits before the turbo, so air vented to the atmosphere was already counted and the mixture goes rich on every lift.

Source: [civicxi-112 (KTuner staff)](https://www.civicxi.com/forum/threads/34434/).

**g3-59 Which parts need a map change (value 3).** Add to **kc-maf-housing**:
> Of the usual bolt-ons only a different airflow housing (or a new MAP sensor or turbo) needs a map change; an intercooler, charge pipes, inlet pipe and exhaust only need a log to compare.

Sources: [civicxi-59](https://www.civicxi.com/forum/threads/52821/), [youtube-65](https://www.youtube.com/watch?v=bvO6-GeH2S4&t=1701s), [ktuner-forum-51](http://www.ktuner.com/forums/viewtopic.php?t=1596&p=4929).

**g3-64 Head differs by generation (value 3).** In **kc-downpipe**, after "torque came 200 to 400 rpm earlier", add:
> (on the earlier generation, whose single-port head differs from this car's dual-port head)

Source: [PRL turbo blog](https://prlmotorsports.com/blogs/news/prl-1-5t-turbo-blog).

**g3-56 / g3-57 Downpipe gains; "runs lean" refuted (value 3).** kc-downpipe and kc-downpipe-catted-catless are confirmed; add sources [civicxi-42](https://www.civicxi.com/forum/threads/50212/), [vendors-57](https://twostepperformance.com/products/2022-civic-turbo-performance-downpipe-1-5t) and [ktuner-forum-15](https://www.ktuner.com/forums/viewtopic.php?p=7245). No text change.

## tuning-process

**g3-67 Vendors cap low-end torque (value 3).** kc-table-boost is confirmed; add sources [civicxi-23 (TSP)](https://www.civicxi.com/forum/threads/50047/), [civicxi-98](https://www.civicxi.com/forum/threads/39841/) and [civicxi-71 (Hondata)](https://www.civicxi.com/forum/threads/52193/). No text change.

**g3-68 Warm before the first pull (value 3).** kc-drive-brief is confirmed; add [youtube-24 (TSP: ~180 °F coolant)](https://www.youtube.com/watch?v=NtWMKcZuPI8&t=396s) as the source for the 80 °C checkpoint.

**g3-71 Vendor tunes are partly locked (value 3).** Capabilities line:
> If the owner moves to a vendor file, its hidden tables can't be read; those families turn read-only in the Map tour.

Source: [Phearable](https://www.phearable.net/information/tech-area/ktunerflashv2touchtuneslotupload.html).

---

## Answers to the five questions

1. **MAF Scaling and housings.** Our map offers Factory, PRL Race, 27Won Race and Custom (Hz axis, 103 points). The housing, not the brand, picks one; Race only with a Race housing. Owners rescale by averaging trims per bin and moving g/s by the same sign; zeroing LTFT limits is an optional trick that needs a Flash. **Safe for the app:** preset by housing; a partial bin correction to MAF_Scaling_Custom, ≤ 10 %/round, rising curve, using only closed-loop rows (below ~8 psi, STFT live), with MAF Hz logged; read Knock Control on the Shakedown. **Out of scope:** top-end/WOT calibration until AFR Command is logged, Fuel Trim Limits, AFM Fuel, injector tables.
2. **Channels.** See kc-log-channels above. We already log Knock Control, Knock Retard, Ignition, Turbo Pressure (+Target), MAP, EWG Position/Target, DIFP (+Target), O2 (=Wideband), TPS, TPS Command, IAT, IAT2, STFT B1, LTFT B1, ECT and transmission temperature. Missing: AFR Command, MAF Hz, mg/stroke. Final Boost Target is a table, not a channel. The detector misses KTuner's abbreviations.
3. **DTCs.** P0420 and P2A01 come with downpipes. P0046 is the wastegate actuator or a vacuum/boost leak, not the downpipe. P0299 is underboost and must be off if dampening is disabled. KTuner: Main Parameters → Disables/Monitors ("P0420 – Catalyst Efficiency", O2 slow response, O2 performance, P2096/P2097); off-road only. đăng kiểm tests the tailpipe and the lamp, so a disable hides a fault and doesn't help pass.
4. **Help card:** kc-flash-howto (power, key, after-flash lights, recovery and the loose-cable prompt, codebase, CAN Gateway), plus upload ≠ flash in kc-shakedown.
5. **E10.** Flex tables need a sensor and do nothing on E10. Displayed AFR is λ × 14.7 on any fuel. Ethanol's positive-trim effect isn't visible on this car (cruise median −0.8 %). No change to kc-e10 beyond one line.

# Drive check: what a tuner reads in a KTuner log, and how the page should say it

*Civic FE 1.5T CVT · KTuner Starter 21 Dual Tune 2 · Vietnam E10 RON95 · one owner, one car*
*Written 2 Oct 2026, from the 16 TunerView logs (15 Aug to 5 Sep 2026), web research and a four-person expert panel. **Every claim is checked in [`fact-check.md`](fact-check.md); that file wins where they differ.***

---

## 0. The answer in one screen

**Is the engine safe on these logs?** Yes, apart from one drive. The mixture under boost was never lean (10.1 to 10.7 AFR, where the map asks for 11.0; a fuelling fault would show as 12.0 or leaner, 1.0 AFR leaner than asked). DI fuel pressure stayed at 96 % of target or better. The ECU's fuel-quality score (Knock Control) sits at its best possible value, 0.49, on every cool drive.

**The one drive that was not safe: Aug 23, 20:38.** From the first second, the ECU removed 17 to 21 % of the fuel (short-term trim −17 %, long-term trim learning down to −16 %). Forty minutes earlier, at 19:59, both trims were 0. Something was flashed in between, and the ECU was measuring far more air than the engine took in. The most likely cause is the wrong AFM preset for the intake housing, the same fault found earlier in `afr-tuning-research.md` §1. By Aug 30 the trims were back within ±2.4 %. **This is the case the Drive check exists for**, and it correctly said **Stop**.

**What costs this car performance:** heat, not the tune. On a cool morning Knock Control stays at 0.49 for the whole drive. In hot afternoon traffic it climbs to 0.60 to 0.65, and the ECU takes timing away everywhere. The intercooler works well: under boost the air after the intercooler is only 2 to 6 °C warmer than the air going in. The problem is the air reaching the intake. When moving above 60 km/h it is 35 to 48 °C (59 °C on one soaked drive), but after a short stop the engine restarts with 57 to 64 °C in the manifold.

**What to do, in order:** (1) Never drive hard after a flash until a calm 10-minute drive shows trims within ±5 %. (2) After a hot stop, drive 3 to 5 minutes before any hard acceleration. (3) Don't lug the engine in hot traffic (S mode below 60 km/h). (4) Use 0W-20 oil rated API SP or newer (Honda manual viscosity; SP includes an LSPI engine test) and keep the HCF-2 CVT fluid fresh. (5) Fix the log setup so the next log can prove more (two channels are missing, and one was flat on Sep 5).

---

## 1. How the research was done (and its limits)

| Source type | Got it? | How |
|---|---|---|
| KTuner's own pages (Civic X testing, 22+ Civic Turbo, Help: MAF settings) | Full text | crawl4ai (local, v0.9.4) |
| ECUTek Honda Civic tuning guide (knock control behaviour) | Full text | crawl4ai |
| DSport "Boosting to the limits of the Civic's TD03" (Hondata on the dyno) | Full text | crawl4ai |
| LSPI (NASA Speed News, Wikipedia), L15B7 known problems (8020 Automotive) | Full text | crawl4ai |
| Tuner product pages (TSP Stage 1 22+ non-Si CVT, Phearable Stage 1.5) | Full text | crawl4ai |
| **CivicX, CivicXI, Civic11Forum, Hondata forum, HRV forum** | **Search excerpts only** | Cloudflare/403 blocked both crawl4ai and the in-app browser. I did not try to get around the bot check. Forum claims below are marked *forum*, and none is used as a hard limit unless a primary source agrees. |
| Reddit | Nothing useful came up | Search returned forum threads instead |

**The expert panel** below is four *roles*, not real people. Each one argues from the sources listed in §9 and from the owner's own logs. Where they disagree, the decision is written down.

---

## 2. What a KTuner TunerView log actually contains (this car)

36 channels at about 15 rows per second (0.067 s). What each one tells a tuner:

| Channel | What it really is on this ECU | Why a tuner cares |
|---|---|---|
| Engine RPM, Speed, Gear, TPS, **TPS Command** | Throttle plate and the ECU's throttle request. *Acceleration* is a g-sensor, **not** the pedal. | Find the pulls and the cruise. The 1.5T makes 19 psi with the plate about 45 % open, so a pull is "boost ≥ 12 psi with TPS Command ≥ 50 %", not "TPS ≥ 80 %". |
| **MAP** (psi, gauge) / **Turbo Pressure** / **Turbo Pressure Target** | Manifold pressure; boost before the throttle and what the ECU asked for | Boost tracking, overshoot, how close the turbo is to its limit |
| **EWG Position / Duty / Target** | Electric wastegate. 0 % = shut. | Shut at peak boost = no turbo headroom left |
| **O2 (AFR)** | Stock wide-band front A/F sensor; the log shows λ × 14.7 | Mixture. Its accuracy under boost is unverified, so the app judges against the map's own target, not an absolute number. |
| **STFT / LTFT B1** | Short- and long-term fuel trims | Is the ECU measuring air correctly? (AFM preset, leaks, injectors) |
| **Knock Control** | ECU's learned fuel-quality / knock-margin score: 0.49 = best, higher = more timing pulled everywhere | **The** Honda safety number. ECUTek: it is "a fuel octane adjustment ... as opposed to an instantaneous knock adjustment". |
| **Knock Retard** | Retard *scheduled from* Knock Control (about 5° under boost even at 0.49) | Not a knock event counter. Treating it as knock gives a false Stop (bug B1, fixed). |
| **Ignition** | Final spark advance | Map-limited or knock-limited? |
| **IAT** | Manifold air, **after** the intercooler | What the engine breathes. Drives timing and Knock Control. |
| **IAT2** | Inlet air at the AFM, **before** the turbo | Physics check: under boost IAT runs 2 to 6 °C *above* IAT2, which is only possible with IAT after the intercooler and IAT2 before the turbo |
| **DIFP / DIFP Target** | Direct-injection rail pressure, actual vs target | High-pressure pump keeping up. This fails first on tuned DI cars. |
| ECT, ECT2, Battery | Coolant, voltage | Basic health |
| CAM Command/Actual, CAM EX Command/Actual | VTC intake/exhaust | Cam tracking. The channel shows −49.5 glitches here, so treat it as *cannot judge*. |
| **Transmission Temperature** | CVT fluid temperature | CVT life and slip risk |
| Ethanol | Flex-fuel content | 0 on every log: no flex sensor. E10 is a fixed fuel, so this is expected. |
| Steering, Brake Pressure | Chassis | Not engine; useful to mark "braking, ignore" |

**Missing, and asked for by every tuner:** the **AFR / lambda command** (what the ECU *wants* at each moment) and **AFM Hz** (raw airflow sensor). Without them the app checks the mixture against the map's full-load target, not the live command.

---

## 3. The expert panel

*These are roles arguing a case, not evidence. Every claim a rule depends on is checked in [`fact-check.md`](fact-check.md); where it failed, the text below is marked.*

### Ksenia, KTuner lead tuner (leads the panel)
- "Knock Control is the first thing I open. 0.49 to 0.53 is outstanding. Under 0.60 is fine. If it sits above 0.70 in normal driving, stop pulling and find out why." *(forum excerpts: 0.49 to 0.60 good, 0.6 to 0.7 acceptable. **Superseded by data:** on this car the ECU starts pulling timing at cruise from 0.62, so "no hard driving" is 0.62, not 0.70. See `fact-check.md` §2.)*
- "On this map Knock Retard is scheduled. Five degrees at 0.49 under boost is normal, not knock."
- "KTuner's page says 'Running 91+ will give the best results' for its research calibrations. Vietnam E10 RON95 is about US 91 by estimate (AKI = (RON + MON)/2), so you're at that floor. On your pulls the score still holds 0.49–0.52; it's heat in traffic that moves it."
- "Send me one pull from a roll in S mode, 2,500 to 6,000 rpm, at a normal temperature, with the AFR command logged. Not ten pulls back to back."
- On the Aug 23 log: "Trims at −17 % from cold start means the AFM preset doesn't match the housing. Re-flash the right preset and don't drive it hard until trims are within ±5 %."

### Hiro, Hondata FlashPro specialist
- "Same ECU logic, different names. Our *Knock Control* study is the same idea: it averages knock and retards globally."
- "Watch DI pressure against target. On a tuned 1.5T the high-pressure pump is the first thing to run out. Yours is at 96 % or better on every drive, so it's fine."
- "The CVT is protected by the map's torque limiter, which holds the ECU's own torque estimate under a table by closing the throttle, lowering boost or pulling timing. The old 250 Nm warning is from 10th-gen FlashPro; our 11th-gen CVT maps add about 50 lb-ft. Your log has no torque value, so watch for slip and fluid heat instead." *(correction 2 Oct: the first draft quoted 250 Nm as a limit)*
- "Wastegate 2.6 to 3.3 % open at 16 to 20 psi means the turbo is working hard. More boost on this turbo means more heat, not more power." DSport's Hondata session saw this turbo deliver 23 to 25 psi on a manual car, and gains got small as boost went up.

### Minh, Honda service technician (knows the FE 1.5T CVT)
- "This engine is direct-injected and turbocharged. Engineers put the low-speed pre-ignition (LSPI) risk band at about 1,500 to 2,500 rpm at high cylinder pressure. The lugging the app counts, 900 to 1,700 rpm, overlaps it only at the top. The real case against lugging on your car is the data: 31 of 41 score rises happened while lugging."
- "Use **0W-20** (Honda manual) rated **API SP or ILSAC GF-6 or newer**. Those ratings include the Sequence IX LSPI engine test; plain API SN does not. This is free insurance on a tuned car."
- "Fuel in the oil (dilution) is a cold-climate problem for this engine, so it's small in Vietnam. Long idling in traffic and short trips still add to it. If the oil level rises or smells of fuel, shorten the change interval."
- "CVT fluid: Honda HCF-2, and change it on the severe-service schedule on a tuned car in hot traffic. Your peak of 95 °C is fine. Forum owners put damage above about 100 to 102 °C (215 °F) and slip risk at full throttle above about 105 °C."
- "The 5 Sep log shows Turbo Pressure flat at −0.3 psi for 43 minutes while MAP reached 7.7 psi. That's a logging or sensor-channel problem, not the turbo. Check the TunerView channel list before trusting that drive's boost numbers."

### Dũng, general tuning shop (WinOLS, bFlash, Alientech KESS3)
- "I can read almost any ECU, but on Honda 11th gen the tools that understand the tables are KTuner, Hondata and ECUTek. I wouldn't hand-edit this ECU in WinOLS without a proper definition file. I couldn't confirm KESS3 or bFlash support for this ECU, so treat that as *unknown*."
- "My simple E10 approach works the same anywhere: keep stock ignition, keep the mixture under boost rich, raise boost a little, then watch knock. Your basemap is already rich: 11.0 asked (0.75 lambda), 10.2 measured." *(His 0.78–0.82 lambda range is shop lore and is not used; the app judges against your map's own target. On E10 he'd "add a bit of fuel"; your data says no. See `fact-check.md` §1.)*
- "Before any tune I do the boring checks: a **boost leak test**, spark plug condition and gap, and fuel from the same busy station every time. A boost leak looks like low boost with the wastegate shut. Yours reaches target, so no sign of a leak."
- "A generic 'Stage 1 file' isn't built for E10 RON95, 35 °C traffic and a CVT. Don't chase dyno numbers made in the US on 93."

### Where they disagreed, and what was decided
| Question | Positions | Decision |
|---|---|---|
| Which Knock Control limits? | Forum: ≤0.60 fine, >0.70 bad. App: ≤0.65 good, ≤0.85 watch. | **Use the car's own baseline.** This car sits at 0.49 when cool, so judge the *rise* above 0.49: Judge by what the score costs: on this map each 0.01 above 0.49 costs about 0.1° under boost (10.2° table). Watch from 0.56 (0.7°), **no hard driving** from 0.62 held over 60 s (1.3°), Stop at 0.80 (3.2°, provisional). The cut points are judgement. *(Amended after two fact checks; see `fact-check.md` §2.)* Tighter than the app today (see §8). |
| More power next? | Dũng: a bit more boost. Hiro: the turbo is at its limit. | **Locked.** Wastegate is ~3 % open at peak, and the CVT already relies on the map's torque limiter. Gains come from heat, not from boost. |
| Is a hot-afternoon pull a valid test? | Ksenia: no. Owner: that's when I drive. | Compare only like with like (the current *Prove it* rule). For tuning, use the cool-morning drive. |
| Are habits "tuning"? | Dũng: no. Minh: lugging is the most important thing on this car. | Habits rank first when they score higher. That is already the rule (PRODUCT-REVIEW D2-D3). |

---

## 4. Top 10 analyses a tuner runs, ranked for this car

Ranked by **what it protects or gains on this exact car**: engine damage first, then CVT damage, then power, then fun. "Your value" is from the 16 logs.

| # | Analysis | What it answers | Limit (source) | Your value | Verdict |
|---|---|---|---|---|---|
| **1** | **Mixture under boost**: AFR at full load vs the map target and the lean line | Is the commanded fuel arriving under boost? | Map asks 11.0 (λ 0.75, Honda's component-protection target). Watch 0.5 leaner than target, Stop 1.0 leaner (fuelling fault, not an absolute danger line) | 10.1 to 10.7 on all 8 drives with pulls | ✅ Richer than asked = safe |
| **2** | **Fuel trims** (STFT + LTFT), by load band and at idle | Is the ECU measuring air correctly? Catches a wrong AFM preset, leaks, injector faults | ±5 % fine, ±10 % look, beyond ±10 % Stop (common tuner practice) | ±4 % on 14 drives; **−21.4 % on Aug 23 20:38** | 🛑 once, after a flash. Fixed by Aug 30 |
| **3** | **Knock Control**: level, rise and what moved it | Is the fuel + heat margin OK? Every degree of timing depends on it | Watch ≥ 0.56 (0.7°), no hard driving ≥ 0.62 (1.3°), Stop ≥ 0.80 (3.2°, provisional); degrees from KTuner's formula and this map's 10.2° table | 0.49 flat on cool drives; peak **0.65** on Aug 30 16:01; 0.63 on Aug 21 21:37 | ⚠️ Heat driven, not fuel |
| **4** | **DI fuel pressure**, actual / target under load | Is the high-pressure pump keeping up? | ≥ 95 % (tuner practice) | **≥ 96 %** on every drive (1st percentile) | ✅ |
| **5** | **Intake heat**: manifold IAT moving, stopped, at the start of a pull; IAT vs IAT2 | How much timing is heat costing? Which part is hot? | Pull start ≤ 48 °C (app) | Pull start 38 to 60 °C; moving >60 km/h 35 to 48 °C; stopped 41 to 66 °C; intercooler adds only 2 to 6 °C | ⚠️ Soak and inlet air, not the intercooler |
| **6** | **Lugging**: time at 900 to 1,700 rpm with real load | The main cause of Knock Control rising in traffic (data); its top end touches the LSPI band | 5 % of moving time = a habit (app); LSPI band 1,500 to 2,500 rpm at high load (SAE/patents via NASA Speed News) | 0 to 10.3 % of moving time; 6.9 % on the hot 16:01 drive | ⚠️ Habit |
| **7** | **CVT fluid temperature**: peak and time above 90 °C | CVT life; slip at full throttle | Good ≤ 90, Watch ≤ 100 (app); damage above ~102 °C, slip ~105 °C (forum). Plus a slip check (revs jump, speed doesn't): 0 events in 16 drives | Peak **95 °C**; 29 min above 90 °C on Aug 30 16:01 | ⚠️ Fine, watch in heat |
| **8** | **Boost control**: actual vs target, overshoot, wastegate at peak | Does boost do what's asked? Is there turbo headroom? | Overshoot ≤ 2 psi held 0.3 s (app); wastegate < 5 % = no headroom | Peak 19.9 psi; overshoot ≤ 1.9 psi; wastegate **2.6 to 3.3 %** | ✅ Healthy, but at its limit |
| **9** | **Ignition under boost** with scheduled knock retard, same rpm and load cell, vs IAT | Is timing limited by the map or by knock? | No hard limit; trend only | 2 to 3.5° at 4,000 to 5,500 rpm and 14 to 17 psi; retard a flat 5°; Knock Control 0.49 to 0.52 during pulls | ℹ️ Map-limited. No road edit. |
| **10** | **Repeatable acceleration**: 50→70 km/h with pedal ≥ 60 %, same intake temperature | Did a change make it faster, or was it the weather? (the fun number) | Compare only within ±8 °C IAT (app) | Best **1.63 s** (Aug 22 09:03) to 2.30 s (Aug 30 16:01) | 🎯 Proof metric |

**Gate 0, before any of the ten: is the log good enough?** Rate ≥ 10 Hz, ≥ 10 min of moving time, no flat channel, AFR command and AFM Hz present. *Two of the 16 logs fail it:* Aug 30 15:09 (3.6 s long) and Sep 5 07:56 (Turbo Pressure flat).

**Checked and fine, shown only on request:** coolant (peak 90 to 94 °C), battery (≥ 12.1 V running), DI pressure (#4), fuel trims on the other 14 drives.

---

## 5. What the 16 drives say

| Drive | Min | App verdict | Knock Control start → end (peak) | Lugging % | IAT moving | CVT peak | Hard pulls | Peak boost | Wastegate at peak | Full-load AFR | Worst trim | 50→70 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Aug 15 08:37 | 22 | OK | 0.49 → 0.49 (0.52) | 2.1 | 39 | 68 | 3 | 16.8 | 3.3 % | 10.4 | −1.6 | 1.67 s |
| Aug 15 09:22 | 6 | Watch (overshoot 1.7) | 0.49 flat | 1.7 | 47 | 77 | 1 | 15.9 | 2.5 % | 10.4 | +2.3 | 1.90 s |
| Aug 15 20:18 | 38 | OK | 0.49 → 0.53 (0.57) | 7.4 | 36 | 73 | 0 | 11.9 | – | – | +2.3 | 2.07 s |
| Aug 15 22:15 | 33 | Watch (IAT 54) | 0.49 → 0.49 (0.60) | **10.2** | 48 | 78 | 1 | 12.5 | 1.3 % | 10.2 | +1.6 | – |
| Aug 21 21:08 | 26 | OK | 0.49 → 0.50 (0.52) | 7.9 | 35 | 59 | 0 | 9.6 | – | – | −2.3 | – |
| Aug 21 21:37 | 36 | Watch (IAT 54) | **0.61** → 0.55 (0.63) | 0 | 47 | 88 | 0 | 8.7 | – | – | −2.4 | – |
| Aug 22 08:24 | 21 | OK | 0.55 → 0.51 | 1.9 | 38 | 65 | 1 | 13.7 | 2.7 % | 10.7 | −1.5 | – |
| Aug 22 09:03 | 9 | Watch (overshoot 1.9, IAT 57) | 0.49 → 0.50 | 5.7 | 49 | 79 | 9 | 16.8 | 3.2 % | 10.1 | −1.6 | **1.63 s** |
| Aug 22 09:50 | 17 | **Stop: IAT 64** | 0.49 → 0.50 | **10.3** | **60** | 79 | 0 | 9.1 | – | – | −3.9 | – |
| Aug 23 19:59 | 29 | OK | 0.49 flat | 6.8 | 49 | 68 | 0 | 9.3 | – | – | −1.6 | – |
| Aug 23 20:38 | 15 | **Stop: trims −21 %** | 0.50 → 0.49 | 2.4 | 45 | 85 | 0 | 8.5 | – | – | **−21.4** | – |
| Aug 30 15:09 | 0.06 | *(too short)* | 0.77 (one value) | – | – | 33 | – | – | – | – | – | – |
| Aug 30 15:29 | 19 | Watch | 0.58 → 0.49 | 0.1 | 51 | 93 | 8 | **19.9** | 2.6 % | 10.2 | −2.3 | 1.83 s |
| Aug 30 16:01 | 53 | Watch | 0.49 → **0.64 (0.65)** | 6.9 | 53 | **95** | 2 | 18.0 | 2.7 % | 10.2 | −2.4 | 2.30 s |
| Sep 1 08:13 | 40 | OK | 0.51 → 0.49 | 5.1 | 37 | 73 | 2 | 13.9 | 2.6 % | 10.6 | +1.6 | 1.97 s |
| Sep 5 07:56 | 43 | OK *(boost channel flat)* | 0.49 flat | 6.6 | 39 | 79 | 0 | *flat*, MAP 7.7 | – | – | −1.6 | – |

*Numbers come from the app's own engine (`KTA.checkDrive`), so the page will show exactly these. IAT is °C after the intercooler, boost is psi, trims are %.*

**Six patterns across the drives:**
1. **Cool means about 0.49.** On the six drives with IAT under 42 °C while moving, Knock Control ends at 0.49 to 0.53 and never peaks above 0.57. The fuel is good. Keep the same station.
2. **Hot traffic raises Knock Control and it stays up.** On Aug 30 16:01 it rose from 0.49 to 0.63 within 20 minutes, dipped to 0.52, and ended at 0.64 (5-minute medians), with 6.9 % lugging and IAT at 53 °C moving.
3. **Restarts are the hottest moment.** Every drive started soon after another one begins at 57 to 64 °C IAT (Aug 15 09:22, 22:15; Aug 22 09:03, 09:50; Aug 23 20:38; Aug 30 15:29, 16:01). It takes 1 to 17 minutes of moving to fall below 50 °C. Aug 22 09:50 never fell below 50.
4. **The intercooler is not the problem.** Above 60 km/h, IAT is only 1 to 7 °C above IAT2 (the inlet air); the exception is the heat-soaked Aug 22 09:50 drive, at 14 °C. Under boost it is 2 to 6 °C above. A bigger intercooler would not help. Cooler inlet air and less soak would.
5. **The turbo is at its limit on this map.** The wastegate is 1.3 to 3.3 % open at peak boost on every hard pull, and boost tracks target within 1.9 psi.
6. **Timing is limited by the map, not by knock.** During pulls Knock Control stays at 0.49 to 0.52 and retard is a flat 5°. The ECU is already giving all the timing this map allows. More timing means a different map, which is a tuner's job and is locked in the app.

---

## 6. Recommended tuning foundation: what this evidence supports

| Lever | Evidence on this car | Recommendation | Status |
|---|---|---|---|
| AFM preset ↔ intake housing | Aug 23 20:38: trims −21 % right after a change | Keep the preset that gave ±2.4 % (Aug 30 onward). After **any** flash: a calm 10 minutes first, trims within ±5 % before any pull. | **Rule, now** |
| Mixture under boost | 10.1 to 10.7 vs 11.0 asked | Leave it. Slightly rich on E10 in the heat is the safe side. | Leave |
| Boost | Wastegate ~3 % at 19.9 psi; CVT protected by the map's torque limiter | No increase. If Knock Control is ≥ 0.60 in summer, ECO mode (18 psi) is the safe choice for the day. | Locked |
| Ignition | Map-limited, knock margin full | No road edits. | Never in app |
| Heat | Restart IAT 57 to 64 °C; intercooler adds 2 to 6 °C | Habits first (soak rule, no lugging), then inlet air: airbox lid or heat shield, cold-air feed. | Habit now; hardware later, prove with IAT2 |
| Oil | Lugging up to 10 %; LSPI risk | 0W-20 (Honda manual), API SP / ILSAC GF-6 or newer. Shorter interval when tuned and in hot traffic. | Do now (free if due) |
| CVT | Peak 95 °C, 29 min above 90 °C | HCF-2 on the severe schedule. No pulls with CVT ≥ 95 °C. | Habit + maintenance |
| Log setup | AFR command, AFM Hz missing; Turbo Pressure flat Sep 5 | Add both channels; check the boost channel shows a value at idle before you drive | Do now (free) |

---

## 7. Page design: the Drive check, as a product spec

### 7.1 Who and what for
- **User:** the owner of this one car. Not a tuner. Reads on a phone in a car park or at home on a laptop.
- **Job:** "After I drive, tell me in 10 seconds whether the car is OK, then the one thing worth doing, and later prove whether it worked."
- **Value delivered:** (1) **catches a bad flash before it hurts the engine** (Aug 23 is the proof); (2) turns 36 channels into **one action**; (3) **stops weather being credited** as a tune gain; (4) builds a **car history** across drives, so slow changes show up.
- **Non-goals:** making new maps, editing timing, comparing to other people's cars.

### 7.2 Words rules (copy deck)
1. **Number, then meaning, then action.** Use "Mixture under boost: 10.2. The map asks 11.0, and danger starts at 12.0. Safe, nothing to do." Never use "AFR nominal".
2. **One name per thing,** always the same: *Knock Control (fuel-quality score)*, *intake air after the intercooler*, *CVT fluid*, *fuel trims (air measurement)*, *lugging (low revs, foot down)*.
3. **Compare to this car,** not to forums: "0.64, your car's best is 0.49".
4. **Say what the log cannot tell:** "This drive can't prove a heat fix: it was 15 °C cooler."
5. **Verbs the owner can do today:** "Shift to S below 60 km/h", "Wait 3 minutes before a pull". Never write "optimise thermal management".
6. **Four words for status, and only these:** **OK**, **Watch**, **Stop**, **Can't tell**.

### 7.3 Layout (top to bottom; phone first)

```
┌──────────────────────────────────────────────────────────────┐
│ ① DRIVE CARD                                                  │
│ Sat 30 Aug · 16:01 · 53 min · Hot (intake 53 °C) · Traffic    │
│ 2 hard pulls · Boost target max 17.3 psi · Log quality: Good  │
├──────────────────────────────────────────────────────────────┤
│ ② SAFETY  ─  Watch                                            │
│ Can I drive hard today?  Yes, after it cools. Not in traffic. │
│  ● Mixture under boost   10.2  (asks 11.0, danger 12.0)  OK   │
│  ● Air measurement       −2.4 %  (fine within ±5 %)      OK   │
│  ● Fuel-quality score    0.49 → 0.64  (your best 0.49) Watch  │
│  ● Fuel pressure         ≥ 96 % of target                OK   │
│  ● Heat  intake 60 °C at pull · CVT 95 °C              Watch  │
│  [Why?] opens the graph for that line                        │
├──────────────────────────────────────────────────────────────┤
│ ③ YOUR ONE THING                                              │
│ Keep the revs up in hot traffic                               │
│ Why: 31 of 41 rises in the fuel-quality score came at         │
│      ~1,440 rpm and 44 km/h, foot down (lugging, 6.9 %).      │
│ Do:  1. Below 60 km/h in traffic, use S or the − paddle.      │
│      2. Let it rev 2,000 rpm or more before you press harder. │
│ Proof: next hot traffic drive, lugging < 3 % and score ≤ 0.55 │
│ Undo: nothing to undo.          [Start]   [Not now]           │
├──────────────────────────────────────────────────────────────┤
│ ④ YOUR CAR OVER TIME  (all drives, newest right)              │
│ Fuel-quality peak   ▁▁▂▁▁▃▁▁▁▁▁ ▃▅▁▁   best 0.49              │
│ Air measurement     ▁▁▁▁▁▁▁▁▁▁█ ▁▁▁▁   Aug 23 20:38: −21 % ⚑   │
│ Intake moving       ▂▃▁▃▁▃▁▃█▃▃ ▃▄▁▁                          │
│ CVT peak            ▁▂▂▂▁▃▁▂▂▁▃ ▄▄▂▂   limit 100              │
│ 50→70 km/h          ▂▃▄ ▁       ▃▅▄    best 1.63 s (Aug 22)    │
│ Tap a dot to open that drive.                                 │
├──────────────────────────────────────────────────────────────┤
│ ⑤ PERFORMANCE (the fun part)                                  │
│ Best 50→70 km/h today: 2.30 s at intake 60 °C.                │
│ Your best is 1.63 s at 51 °C. Not comparable: 9 °C hotter.    │
├──────────────────────────────────────────────────────────────┤
│ ⑥ UP NEXT · LATER (locked, and what unlocks it) · FINE        │
├──────────────────────────────────────────────────────────────┤
│ ⑦ WHAT THIS LOG CAN'T TELL  (+ fix your log setup)            │
│ Missing: AFR command, AFM Hz. Flat: none.                     │
├──────────────────────────────────────────────────────────────┤
│ ⑧ ENGINEERING VIEW (collapsed): the four graphs + Explain     │
│ ⑨ SEND TO MY TUNER: one-page PDF/CSV of the pulls             │
└──────────────────────────────────────────────────────────────┘
```

### 7.4 Each block: data → message → action → proof

| Block | Data used | Shows | Owner does | How it's proven |
|---|---|---|---|---|
| ① Drive card | duration, IAT moving, share of town speed, pulls, boost target max, Gate 0 | Whether this drive can judge heat, habits or power | Nothing; sets expectations | n/a |
| ② Safety | Analyses #1 to #5 and #7 | 5 lines, worst first; one sentence answering "can I drive hard today?" | Stop or Watch tells them exactly what not to do | Re-checked on every log; a new Stop after a change = **undo** |
| ③ One thing | `KTA.planActions` #1 | One action, ≤ 3 steps, evidence sentence with numbers | Start / Not now | `KTA.proveAction` on the next like-for-like drive |
| ④ Over time | `KTA.driveFacts` per drive, stored locally | 5 sparklines with a flag on any Stop | Tap a flag to see that drive | A step change after a flash date is the alarm |
| ⑤ Performance | #10, IAT-matched | Best time today vs best at a similar IAT | Choose whether to try a pull (only if ② is OK) | Counts only within ±8 °C IAT |
| ⑥ Queue | plan.next / later / fine | Locked items list exactly what unlocks them | Nothing, or pick the next | n/a |
| ⑦ Can't tell | Gate 0 | Missing or flat channels, short log | 2-minute TunerView setup steps | Next log shows them present |
| ⑨ For my tuner | pulls, channel list, verdicts | The log a KTuner/Hondata tuner asks for (§3) | Sends it themselves | n/a |

### 7.5 What a "Stop" screen must do (Aug 23 20:38 as the example)
> **Stop: the ECU is pulling 21 % of the fuel.**
> This started at the first second of this drive. At 19:59 it was 0 %. That usually means the AFM preset doesn't match your intake housing.
> **Do now:** drive gently home. No hard acceleration. Re-flash the map you used before 19:59, or the preset for your housing.
> **Then:** a calm 10-minute drive. The app will say OK when the trims are within ±5 %.
> Everything else is paused until this is fixed.

---

## 8. Gaps found in the app while running all 16 logs

| # | Gap | Seen on | Fix |
|---|---|---|---|
| G1 | **A flat channel isn't detected.** Turbo Pressure stayed −0.3 for 43 min while MAP reached 7.7, and the app reports "peak boost −0.3". | Sep 5 07:56 | Gate 0: a channel with no change while its partner moves is *flat*. Show it under ⑦ and drop it from the checks. |
| G2 | **A tiny log gets a verdict.** 3.6 s, one Knock Control reading of 0.77, graded Watch. | Aug 30 15:09 | Under 60 s moving: *Can't tell: too short*. |
| G3 | **No car history.** The Aug 23 trim fault is obvious as a step across drives but invisible one drive at a time. | all | Block ④. Store `driveFacts` per drive in the browser. |
| G4 | **Knock Control limits are looser than tuners use** (good ≤ 0.65, Stop > 0.85). | design | Data rule from §3: Watch ≥ 0.56, no hard driving ≥ 0.62 for over 60 s, Stop ≥ 0.80 (provisional). |
| G5 | **"Timing lost while lugging" sometimes comes out negative** (−7.5 to −14.7°), which is meaningless to show. | 7 drives | Hide it when negative or when the reference band has under 30 s; it isn't needed for the lugging action. |
| G6 | **Restart heat soak isn't its own finding.** | 7 drives | New habit action: "after a hot stop, drive 3 to 5 minutes before a pull". Proof: pull-start IAT ≤ 48 °C. |
| G7 | **A Knock Control start above baseline isn't explained** (0.61 on Aug 21 21:37, 0.58 on Aug 30 15:29). | 2 drives | Say "starts high after a reflash, ECU reset or new tank; give it 10 to 15 min of calm driving before judging". |

---

## 9. Sources

**Primary or full text (crawl4ai):**
- KTuner, Civic X testing and reliability (IAT 130 to 150 °F in Phoenix testing; Stage 1 at 18 psi; CVT under daily WOT): https://ktuner.com/ktuner-civic-x-testing/
- KTuner, 22+ Civic 1.5T (Starter maps, 91+ octane): https://ktuner.com/22civicturbo/
- KTuner Help, MAF settings: http://www.ktuner.com/KTunerHelp/maf_settings.htm
- ECUTek, Honda Civic tuning guide (Knock Control is a fuel-octane adjustment that retards globally): https://ecutek.atlassian.net/wiki/spaces/SUPPORT/pages/5931577/Honda+Civic+Tuning+Guide
- DSport, Boosting to the limits of the Civic's TD03 (factory wastegate 16.5 psi on the L15B7; Hondata at 23 to 25 psi): https://dsportmag.com/the-tech/boosting-to-the-limits-of-the-civics-td03-turbo/
- NASA Speed News, Preventing LSPI in turbo DI engines: https://nasaspeed.news/tech/engine/preventing-low-speed-pre-ignition-in-turbocharged-direct-injection-engines/
- Wikipedia, Low-speed pre-ignition: https://en.wikipedia.org/wiki/Low-speed_pre-ignition
- 8020 Automotive, Common L15B7 problems (oil dilution): https://8020automotive.com/the-3-most-common-honda-1-5t-l15b7-engine-problems/
- TSP Stage 1, 2022+ non-Si: https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si
- Phearable Stage 1.5, 11th gen non-Si: https://www.phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-non-si/stage1-5-nonsi-11thgen.html

**Forum, search excerpts only (Cloudflare blocked full text):**
- Knock Control ranges: https://www.civicx.com/forum/threads/acceptable-knock-values-and-kcontrol-percentage.25229/, https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/, https://www.civicxi.com/forum/threads/what-is-knock-count-and-knock-control-defined.38412/, https://www.civic11forum.com/threads/k-con-knock-control.6222/
- Knock Control in daily driving vs pulls; CVT temps: https://www.civic11forum.com/threads/2-0-ktuner-what-to-monitor.7195/, https://www.civicx.com/forum/threads/ktuner-11th-gen-civic-cvt-sport-touring.93257/
- Heat raises Knock Control by 0.1 to 0.15: https://www.civicx.com/forum/threads/k-control-values-running-high.47886/
- CVT torque: a 10th-gen FlashPro "don't exceed 250" warning, with the default limit at 300 and the unit disputed (not a valid limit for this car): https://www.hondata.com/forum/viewtopic.php?t=22898, https://www.civicx.com/forum/threads/cvt-torque-table-vs-dyno-test-result-formula-flashpro-manager-v-3-5-0.44579/; CVT limit found by Hondata: https://www.civicx.com/forum/threads/hondata-r-d-finds-limit-of-civic-cvt.9957/
- CVT temperature observations: https://www.civicx.com/forum/threads/cvt-transmission-temp-observation.67079/page-2, https://www.hrvforum.com/threads/cvt-transmission-temperature-monitoring.41384/
- Hondata FlashPro datalogging notes: https://www.hondata.com/forum/viewtopic.php?t=22339, https://fk8.wiki/Datalogging
- Tuned reliability: https://www.civicx.com/forum/threads/failures-from-the-tuning-reliability-thread.54181/
- KESS3/WinOLS (no confirmation of support for this ECU found): https://www.alientech-tuning.com/product/alientech-kess3-tool-hardware/

**Earlier notes in this repo:** `afr-tuning-research.md` (AFM preset ↔ housing, CEL root cause) and `e10-ignition-boost-simple-tune.md` (E10 RON95 ≈ US 91, boost tables, CVT constraint).

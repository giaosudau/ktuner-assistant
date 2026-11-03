# UX loop research: where owners get confused, and what the UI may show

*3 Nov 2026. This file only collects facts that are already in the repo: nothing new was crawled. File:line references point to the repo as of commit d66895d. Cards are cited by id, and each card names its own `source-doc`. Forum links are listed in `docs/research/owner-voices.md` §5 (L94–133). `fact-check.md` wins on any number.*

Abbreviations: **OV** = `docs/research/owner-voices.md` · **FC** = `docs/research/fact-check.md` · **CK** = `docs/research/ktuner-community-knowledge.md` · **DC** = `docs/research/drive-check-tuner-analysis.md` · **OQ** = `.scratch/tuning-shop/owner-queries.md` · **TH** = `data/thresholds.json` · **CX** = `CONTEXT.md`.

---

## 1. Top 15 owner confusions and mistakes

Ranked by how often they cost a round or scare the owner. Each one lists the fact, where it comes from, how often it happens, and a check the UI could run to prevent it.

**1. The pedal isn't floored, so a part-pedal pull is read as the ceiling**
- Fact: the boost target follows the pedal. TPS never logged above 94 on any drive, but a floored pedal reads 100–113 on these cars (CK L28; `kc-calibration-drive`). A pull counts as floored at 90 % of the Pedal full reading (TH `boost_step_gates.pedal_floored_ratio` 0.9; `kc-boost-step` floored-share). A TPS Command drop while TPS holds steady means VSA stepped in, and that pull doesn't count (CK L100). An owner can also confuse TPS with TPS.C (CK L94; `kc-log-channels`).
- How often: none of this owner's 16 drives had a floored pull (CK L28). He asked: *"Why does my boost stop at 19.2 psi when the map says 21?"* (OQ L40). Another Starter 21 Dual owner "never passed 19.5 psi floored" (CK L32).
- UI: a parked step that asks the owner to floor the pedal three times and type the highest TPS. On each pull, a badge (floored or not) against the 90 % line. The pull is voided if TPS reads more than 2 points above that reading (TH `pedal_guard_pct`). A flag when TPS.C falls while TPS holds.

**2. The log was taken on the wrong Map slot or in the wrong mode (ECO)**
- Fact: no log channel records the tune or the ECO button (`kc-map-switching`, `kc-dual-boost-targets`). With the device unplugged the car starts in Tune 1. While the owner chooses a tune, the tach shows 1,000, 2,000 or 3,000 rpm. ECO runs 18 psi and Normal runs 21. Drives on different slots are never compared (CX L204).
- How often: no owner quote, but the risk is built into the setup because the log can't show the slot. A mismatch shows up only in the Flash readback (CX L108): the logged target misses the table by more than 0.5 psi (TH `boost_step_gates.target_gap_psi`).
- UI: make the slot and ECO state required fields when a log is attached. Add "See 2,000 on the tach?" to the pre-drive checklist. When the readback misses the table, ask "Was this Tune 2, ECO off?" before giving any verdict.

**3. The logger is set up wrong: missing gauges, slow rate, wrong trim bank**
- Fact: a readable log has a rate of 10 Hz or more, at least 10 moving minutes, no stuck gauge, and both AFR Command and MAF Hz (`kc-log-gate`; DC L120). This owner's logger still lacks AFR Command and MAF Hz (`kc-log-channels`). A trim pinned at −100 means bank 2 was picked on a one-bank engine, so it reads Can't tell (CK L97).
- How often: *"I'm not owning a laptop. I'm using TunerView on my android phone."* (OV L18). One owner says the TunerView CSV has no MAF signal at all (CK L137).
- UI: a Logger setup panel (CX L78) built from the last CSV, with each gauge marked present or missing and the measured rate. If TunerView can't log MAF Hz, show Can't tell rather than fail every log (CK L137).

**4. The log is too short, has no pulls, or has a flat channel**
- Fact: 2 of 16 logs failed Gate 0 (DC L120). Aug 30 15:09 was 3.6 s long and still got a Watch (DC L141, G2 L265). On Sep 5 07:56, Turbo Pressure sat flat at −0.3 for 43 min while MAP reached 7.7 (DC L145, G1 L264). A drive with under 60 s of moving gets no verdict (CX L61). Boost proof needs 2 pulls held 4 s above 3,500 rpm (TH `boost_step_gates.pulls_min`, `hold_s`, `rpm_min`).
- How often: 2 of 16 logs (12.5 %). An owner wrote: *"I haven't done a WOT pull yet because I first want to make sure it's safe to do so."* (OV L15)
- UI: a "what this drive can settle" strip with three parts: a moving-minutes bar to 10, a pull counter (0 of 2), and a flat-channel flag. A failed drive is labelled a Wasted drive with the fix to make (CX L100), never a verdict on the car.

**5. The engine isn't warm, or the thermostat is stuck open without a warning**
- Fact: the brief says to drive 10 minutes until coolant passes 80 °C (`kc-drive-brief` brief-warm-ect, brief-moving-min) and to judge with the engine fully warm (`kc-tune-one-thing`). This map disables P0128, so a stuck-open thermostat shows only as coolant that never reaches about 80 °C (CK L85, L99).
- How often: no owner quote. On this car coolant peaks at 90–94 °C (DC L122).
- UI: a warm-up ring that turns green at 80 °C. Pulls before then are tagged "cold, not counted". A Watch when coolant stays under 80 °C after 10 moving minutes.

**6. Judging power in the heat, or right after a hot restart**
- Fact: two drives on the same afternoon, 31 minutes apart: pull-start intake 49 → 60 °C, peak boost 19.9 → 16.7 psi, 50→70 km/h time 1.77 → 2.23 s (OV L32; `kc-heat-soak`). A Hot restart is a drive started within 30 min of the last one with intake air at 50 °C or more (CX L53). Restarts begin at 57–64 °C, and the intake takes 1–17 min to fall below 50 (DC L152). Intake heat retards timing on a schedule: nothing up to 40 °C, 4.5° at 50 °C, 9° at 90 °C (`kc-iat-retard`).
- How often: *"This car is completely different in the heat."* (OV L32, the #1 complaint in hot climates, OV L85). Hot restarts happened on 7 of 16 drives (DC G6 L269).
- UI: an IAT gauge with bands at 42 and 48 °C. After a hot stop, a 3–5 min calm-drive countdown. Comparisons are allowed only between drives within 8 °C of intake temperature (`kc-fuel-test` fuel-iat-match; DC L118).

**7. Reading a rich WOT mixture as a fault, mixing up AFR and lambda, or blaming E10**
- Fact: the map asks 11.0 AFR (λ 0.75). This car reads 10.1–10.7 (λ 0.69–0.73), which is richer than asked and the safe side (`kc-rich-wot`; FC L15). The log shows λ × 14.7, so the reading is the real lambda on E10 too (FC L17; superseded `kc-wot-lean-display`). Trims freeze above about 8 psi (`kc-open-loop-wot`). The "29" seen on lift-off is fuel cut (OV L30).
- How often: this is owner question #1: *"My WOT AFR is 10.6. What went wrong? Is it my E10?"* (OV L30). Another asked: *"My logs read rich, lower than 10.5. Should I decrease the values?"* (OQ L37)
- UI: show AFR and λ side by side against the map's target line, with the rich side shaded "safe". Hide fuel-cut rows on lift-off. Add a scale note: "λ × 14.7; E10 doesn't change the reading".

**8. Knock Control numbers look scary**
- Fact: the floor is 0.49. Watch starts at 0.56 (costs 0.7°), no hard driving at 0.62 held 60 s (1.3°), and Stop at 0.80, which is provisional (3.2°). Each 1.0 above the floor costs 10.2° (`kc-ranges`; FC L35–39). Rises above 5,200 rpm are forced while "Eliminate Artificial Knock Control Rise" is unticked (`kc-high-rpm`; CK L48).
- How often: *"Knock control went to 0.6/0.7. Am I hurting the engine?"* (OV L31). *"I'm paranoid as hell."* (OV L16). On this car, 31 of 41 rises came while lugging (`kc-oil` rises-lugging).
- UI: show the cost in degrees first and the score second, with the caption "costs timing, not damage" (OV L83). Grey out the part of the trace above 5,200 rpm. Name the cause next to the number (lugging %, IAT).

**9. Knock Count read as knock**
- Fact: Knock Count is a misfire count, so the gauge to watch is Knock Control. AFR Adj isn't the mixture to watch either (`kc-misfire-gauges`; OV L51; CK L109).
- How often: *"I had already started to search for spark plugs"* (OQ L34).
- UI: never draw Knock Count or Misfire as a knock gauge. If either is in the CSV, list it as "Misfire count (not knock)" in a secondary area.

**10. The Knock Control start after a flash sets off an alarm**
- Fact: KTuner resets Knock Control to 0.59 after every flash, and it falls back to 0.49 after 10–15 calm minutes (`kc-after-flash`; CK L53). The engine used to raise an "Unexplained change" on this normal pattern (OV L72). A start of 0.61 also follows an ECU reset or a new tank (DC G7 L270).
- How often: 2 of 16 drives started high (DC G7). The pattern is common on owner forums (OV L49).
- UI: during the Shakedown, show a "relearning" band from 0.49 to 0.60 with a 15-minute timer, and hold the score verdict until it settles.

**11. The wrong MAF preset was flashed (picked by brand, not housing)**
- Fact: the Race curves read 1.29–1.43 × the air, so a Race preset on a street housing runs about 40 % rich (`kc-maf-housing`). On Aug 23 20:38, trims sat at −21.4 % from the first minute after a change (DC L140), with a median of −28 % (`kc-trims`; FC L89–90). Trims of −15 % or worse everywhere after a change mean Undo first (`kc-trim-cause`). Never infer the housing from the brand (`kc-maf-housing`; OV L56, L77). A mismatch can also show as a bog past about 4,500 rpm with boost 4–6 psi down (CK L145).
- How often: *"I installed an intake / intercooler. Are my fuel trims OK? Do I need a tune?"* (OV L33). It happened on 1 of 16 drives here.
- UI: a housing picker that shows Factory, Street and Race housings with photos and no brand list. Check the preset against the housing before any flash. A trims gauge with bands at ±5, ±10 and ±15, and an "Undo to vN" button at 15.

**12. Flash process mistakes: saved but not flashed, a CEL after the flash, no file to undo to**
- Fact: put a charger on the battery. Flash with the ignition on and the engine off, then key off for 10 s. Warning lights during the flash are normal. A Recovery prompt while the engine runs means a loose cable: say no. Error codes after a flash mean the wrong codebase. Saving a tune to the V2 is not flashing it (`kc-flash-howto`). Save the earlier file under its own name so Undo is one flash back (`kc-shakedown`). Undo means flashing that earlier file (`knowledge/playbook.md` L56–63). Reverting to the KTuner basemap makes it the active Map version (CX L112). If a floored target stays at the factory level, the map didn't flash (CK L144).
- How often: *"Check engine light right after flashing."* (OV L39)
- UI: a flash checklist with a file-name prompt ("save Map vN−1 as …"). After the flash, a "Saved ≠ flashed" check through the Flash readback. Single-tap "Undo to vN" and "Revert to KTuner basemap" actions, each of which sets the active Map version.

**13. The fuel test is done wrong: mixed tank, no fuel tag, octane booster**
- Fact: run the tank low and fill with RON97. Drive calmly until Knock Control settles. Then log the same hot route in the same mode and slot, with intake within 8 °C, and tag each log with its fuel. A gap of 0.5° or less is inside the logging step. Cool drives sit at the 0.49 floor on either fuel, so only a hot pair can show a difference (`kc-fuel-test`). The owner sets the Fuel tag when attaching a log (CX L196). Don't add octane booster (`kc-octane-booster`). Fuel varies by station and week (OV L52).
- How often: *"I'll finish my half tank of 98RON and move to 100RON."* (OQ L35) mixes the two fuels in one tank. *"Should I pay for better fuel?"* (OV L30)
- UI: a required Fuel tag that includes a "tank mixed" option, which keeps the log out of the test. A test wizard that shows when the pair is ready: both drives hot, intake gap within 8 °C, same slot.

**14. Pulling with a hot CVT, or brake-launching**
- Fact: Watch at 90 °C and Stop at 100 °C (provisional); this car's peak is 95 °C. No pulls at or above 90 °C, and never brake-launch (`kc-cvt`). On Aug 30 16:01 the fluid spent 29 min above 90 °C (DC L115). An owner census found 12 of 580 tuned CVTs failed (2.1 %), from brake launches and track heat (CK L81).
- How often: *"Is my CVT slipping since the tune? Will it survive?"* (OV L35)
- UI: a CVT temperature gauge with bands at 90 and 100. Pulls at or above 90 are marked "not counted, CVT hot". A slip-event counter (0 so far).

**15. Turning off P0420 to get through inspection**
- Fact: the switch is in KTuner under Main Parameters → Disables/Monitors. The đăng kiểm inspection tests tailpipe gas and checks the warning lamp, so turning the code off hides a fault without helping the car pass (`kc-p0420`). Most 200-cell pipes set P0420 within days (`kc-downpipe-catted-catless`).
- How often: *"The CEL came back two days after I disabled the O2 sensor."* (OV L34)
- UI: no "disable code" action anywhere. When a downpipe Install is recorded, ask for its cell count and show the inspection warning.

*Also seen, lower rank:* adding timing by a percentage (`kc-timing-percent`), lugging in traffic (`kc-oil`; DC L114), changing several things in one flash (`kc-tune-one-thing`), and expecting a wastegate duty map (OV L60).

---

## 2. Safe-range facts the UI may draw as gauges or bands

Only values found in TH or in a current card. "J" = our judgement, "D" = this car's data, "P" = a primary source or the map file.

| Gauge | Bands / marks | Exact source | Basis |
|---|---|---|---|
| Knock Control (score) | floor 0.49 · Watch 0.56 · no hard driving 0.62 held 60 s · Stop 0.80 (provisional) | `kc-ranges` kc-floor, kc-watch, kc-nohard, kc-nohard-hold, kc-stop; TH `boost_step_gates.kc_max` 0.56 | J on D+P |
| Knock Control as degrees | 10.2° per 1.0 above 0.49: 0.7° / 1.3° / 1.6° / 3.2° | `kc-ranges` kc-table-boost, cost-at-056/062/065/080 | D+P |
| Relearn after a flash | starts 0.59, allowed up to 0.60, 10–15 min | `kc-after-flash` flash-start, flash-start-max | P (KTuner notes) |
| Knock Control rpm mask | exclude above 5,200 rpm while the artificial-rise box is off | `kc-high-rpm` high-rpm-from; `kc-boost-step` kc-judged-rpm | Forum + screenshot |
| WOT mixture (AFR) | target 11.0 (λ 0.75) · Watch 0.5 leaner · Stop 1.0 leaner · never leaner than 12.0 · too rich below 10.5 · judged at 12 psi and up | `kc-rich-wot` map-target-afr, mix-watch, mix-stop, mix-danger, mixture-rule-psi; TH `boost_step_gates.afr_lean_max` 12.0; TH `wot_target_band` 11.0–12.0; `kc-maf-wot-calibration` afr-too-rich | P (map) + J |
| WOT observed | 10.1–10.7 AFR (λ 0.69–0.73) | `kc-rich-wot` wot-afr-lo/hi, wot-lambda-lo/hi | D |
| Fuel trims (STFT+LTFT) | OK ±5 · Stop ±10 · Undo ±15 · live only below 8 psi | `kc-trims` trim-ok, trim-stop; `kc-trim-cause` undo-trim; TH `boost_step_gates.trim_max_pct` 5; `kc-open-loop-wot` ol-start-psi | D |
| Trim normal band | p10 −3.1 · median −0.8 · p90 +1.6 | `kc-trims` cruise-trim-* | D |
| Intake air (IAT, manifold) | Cool drive below 42 moving · pull start 48 or less · timing retard 0° up to 40, 4.5° at 50, 9° at 90 | `kc-drive-brief` brief-cool-iat, brief-pull-iat; `kc-heat-soak` pull-iat-good; `kc-iat-retard` iat-free-max, iat-mid, iat-hot | J (48), P (retard table) |
| IAT − IAT2 under boost | 2–6 °C is normal; a widening gap means the intercooler is saturating | `kc-iat2-side` ic-added-lo/hi | D |
| Coolant | warm at 80 °C or more (lower limit only) | `kc-drive-brief` brief-warm-ect | J |
| CVT fluid | Watch 90 · Stop 100 (provisional) · peak 95 | `kc-cvt` cvt-fluid-watch, cvt-fluid-stop, cvt-peak | D + J |
| Boost (psi) | ECO 18 · Normal 21 (KTuner's "safe point") · Final target top 23.4 · hard cap 24 · logged max 19.9 | `kc-dual-boost-targets`; `kc-boost-step` ktuner-safe-psi; `kc-final-boost-target`; TH `boost_ceiling_psi` 24, `boost_step_gates.total_psi` 24; `kc-expectations` logged-boost-max | P + J |
| Boost tracking | under/overshoot 1.5 psi (overshoot held 0.5 s) · target-to-table gap 0.5 | TH `boost_step_gates.undershoot_psi`, `overshoot_psi`, `overshoot_hold_s`, `target_gap_psi`; `kc-boost-step` under-over-max | J |
| Boost step | +1 psi per flash · rows 3,500–4,500 · raises only at 3,000 rpm or more | TH `boost_step_max`, `boost_step_gates.rows_rpm`, `boost_raise_min_rpm` | J |
| Wastegate at peak | 2.5 % (idle 8.0, max 65.5) means no headroom left | `kc-expectations` ewg-at-boost, ewg-idle, ewg-max | D |
| DI fuel pressure | 90 % of target or more | TH `boost_step_gates.difp_min_pct`; `kc-boost-step` rail-min | J |
| Pedal / throttle | floored at 90 % of the Pedal full reading · +2-point guard · TPS Command at 98 or more = throttle open · floored reads 100–113 | TH `pedal_floored_ratio`, `pedal_guard_pct`, `ceiling_read.throttle_open_pct`; `kc-calibration-drive` floored-lo/hi | J + P |
| Timing vs proven map | a drop of 1° or less | TH `boost_step_gates.ign_drop_deg`; `kc-boost-step` timing-drop-max | J |
| Log quality | 10 Hz or more · 10 min or more moving | `kc-log-gate` gate-rate, gate-moving | J |
| Lugging band | 900–1,700 rpm under load | `kc-oil` lugging-lo/hi | D |
| Fuel-test match | intake within 8 °C · a gap of 0.5° or less = no difference | `kc-fuel-test` fuel-iat-match, fuel-noise | J |

**Conflicts between TH, the cards and the engine:**
- **Log rate.** TH `boost_step_gates.rate_min_hz` is **6**, but `kc-log-gate` gate-rate is **10 Hz**. A 6–9 Hz log fails Gate 0 yet passes the boost proof. One of the two needs to change.
- **What "floored" means.** `kc-quick-adjustments` pedal-floored is **85 %**, but TH `pedal_floored_ratio` and `kc-boost-step` use **90 %**. CK L47 says 85 % lets part-pedal pulls count. The card was never updated.
- **Limits that live only in the engine.** These sit in `engine/kta-engine.js` L159–174 and appear in neither TH nor any card: IAT good 50 / watch 60 (the cards use 42 and 48), coolant good 100 / watch 105 (Stop marked provisional), overshoot watch 2.5, fuel pressure watch 0.80, MAF Hz good 9,500 / watch 9,900. **No card backs them, so the UI must not draw them as bands** until a card does. IAT is a direct conflict: the engine's "good" goes up to 50 °C, while the cards' pull-start limit is 48 °C.
- **Agreements.** TH and the cards agree on Knock Control 0.56, AFR 12.0, trims 5 %, 24 psi, the 1 psi step and the 1° timing drop. `knowledge/index.json` holds the 47 current cards, its numbers match each card's front-matter, and the 7 superseded cards are left out.

---

## 3. Cross-check: cards against `fact-check.md` and `ktuner-community-knowledge.md`

| # | Card or doc | Says | Conflicts with | Action |
|---|---|---|---|---|
| 1 | `kc-table-boost`, `kc-calibration-drive` | The Normal table "plateaus at 21 psi from 4,000 rpm" | CK L75: "21 only from 3,500"; CK L131: the "3,500–4,500 rpm rows already ask 21" | **Real conflict.** Check `data/ktuner-maps-digitized.json` and fix whichever is wrong. It matters because the Boost step starts at 3,500 |
| 2 | `kc-p0420` | "owners of 400-cell pipes report none" | CK L54 corrected this to "a few see P2A01 or a light in rain", but only in `kc-downpipe-catted-catless` | Apply the same correction to `kc-p0420` |
| 3 | `kc-quick-adjustments` | pedal-floored 85 % | CK L47; TH 0.9 | Change it to 90 % of the Pedal full reading |
| 4 | `kc-after-flash` | after-flash pattern up to 0.60 at most | DC G7 L270: a 0.61 start (Aug 21 21:37) after an ECU reset or new tank | Decide whether 0.61 counts as relearn; today it falls outside |
| 5 | `kc-ranges` | hot-peak-max 0.66 | CK L79 and OV L48: "peak 0.65"; FC L39: "max 0.66" | Different measures (single row vs 5-min median). Label which one the gauge shows |
| 6 | `kc-e10` | vn95-aki-honda 90 AKI "by Honda's own octane scale" | FC L19 only gives the 90–91 estimate; OV L36 says "≈ US 91" | The Honda-scale source isn't in FC. Cite it or drop it |
| 7 | `kc-table-maf` | "Up to about 10 percent is commonly called normal" | `kc-trims` and FC L88–89: OK ±5, beyond 10 is Stop | Wording tension: the gauge should label 5–10 as Watch, not "normal" |
| 8 | `kc-log-gate` | MAF Hz is required for a readable log | CK L137: TunerView may not log MAF Hz on this car | Open owner check. If it can't, MAF headroom should read Can't tell, not fail the gate |
| 9 | `kc-cvt` | the factory torque limiter protects the CVT | CK L139: two owners say there's no limiter | The card stands (KTuner is the better source). Noted only |
| 10 | `kc-heat-soak` | the intercooler isn't the bottleneck | CK L139: one dyno claims +12–15 bhp from a bigger intercooler | The card stands (CK L56: street data). Noted only |
| 11 | `kc-iat-retard` vs `kc-heat-soak` | retard starts above 40 °C (4.5° at 50), but a pull start of 48 °C is "good" | FC L67: 48 is a judgement | Not a contradiction: a "good" pull still sits on the retard ramp. Don't colour 40–48 pure green |
| 12 | `docs/research/ktuner-help-pages.md` L20, L29 | logged retard is "rounded" | `kc-ignition-formula`, CK L49, FC L32: "cut down, not rounded" | The doc is out of date; the card is right |
| 13 | DC L109 | λ 0.75 is "Honda's component-protection target" | `kc-table-wot`, CK L51: that's a Type R page; the 1.5T table is WOT Enrichment | The doc is out of date |
| 14 | DC L116 | overshoot ≤ 2 psi held 0.3 s | TH `overshoot_psi` 1.5, `overshoot_hold_s` 0.5; `kc-boost-step` | The doc is out of date; TH wins |
| 15 | DC L112 | DI fuel pressure ≥ 95 % | TH `difp_min_pct` 90; `kc-boost-step` rail-min 90 | The doc is out of date; TH wins |
| 16 | DC L115 | CVT "Good ≤ 90, Watch ≤ 100"; forum says damage around 102, slip around 105 | `kc-cvt`: Watch 90, Stop 100 (provisional) | Same cut points under different labels. Use the card's labels and never show the forum 102/105 figures |

No conflict found for E10 fuel and trims (`kc-e10`, `kc-trims` against FC §1, §6), open loop (`kc-open-loop-wot` against CK L134), the ignition formula, IAT/IAT2 sides, or the Boost step past 21 psi (`kc-boost-step` against CK L131, the owner's decision).

# KTuner community knowledge for our car: what checks out, what changes

*17 Oct 2026. A crawl of what KTuner, vendors and owners say about tuning the 1.5T, checked against our car's logs and our own docs, then cut to what fits a Civic FE 1.5T CVT on E10 in a hot climate. `fact-check.md` still wins on any number. §3 corrections and §4 new cards were **applied on 17 Oct 2026** (owner approved); §5 additions are still proposals. The §6 engine follow-ups are done.*

Working files (claims, findings, conflicts, per-group picks): `.scratch/ktuner-kb-research/`. Raw page text stays local (git-ignored).

---

## 1. What was read

| Source | Read | Claims | Notes |
|---|---|---|---|
| KTuner Help (all 144 pages) + ktuner.com product pages | 150 pages | 118 | Primary. Exact table and setting names |
| Old KTuner forum (Wayback Machine; live forum is offline) | 243 snapshots of 541 topic ids | 69 | 68 staff answers; most kept threads are other Hondas |
| CivicXI (11th gen) | 115 threads | 156 | Main same-car source |
| Civic11forum (11th gen) | 63 threads | 113 | |
| CivicX (10th gen 1.5T) | 84 threads + 37 search summaries | 284 | Second pass 18 Oct (§9): 153 new claims; 44 snippet-only claims checked against the full text: 6 confirmed, 22 corrected, 16 unsupported |
| Vendors (TSP, Phearable, PRL, 27WON, Hybrid Racing) | 24 pages | 59 | Primary only about their own product |
| YouTube | 45 transcripts | 115 | YouTube blocked our IP after ~50 requests; 68 videos left |
| TikTok | search captions | 3 | Needs an anti-bot challenge; not solved by design. Almost no value |

**917 claims → 207 findings** (first pass 764 → 197, verdicts 129 supported, 55 plausible (forum level), 7 conflicts, 6 refuted; the CivicX second pass added 153 claims, 10 findings and 2 verdict upgrades). Each finding was checked against `fact-check.md`, the 46 cards, `thresholds.json`, our map file and **this car's 9 logs (108,918 rows)**.

---

## 2. The 19.2 psi question: answered as far as logs allow

**19.2 psi is a part-pedal reading, not a ceiling.** KTuner Help says the target scales with the pedal and then ramps over time. On our logs the target settles where the pedal puts it (about 13 psi at TPS 41–46, 15 psi at TPS 62). The 19.2 peak came with the pedal still rising, TPS 63 → 83. **TPS never passed 94 on any drive**, while KTuner staff say a floored pedal reads about 100–113 % on these cars. So no logged pull has the pedal truly floored.

Ruled out on our data: the export-ECU TPS Command cap at ~95 % (ours reached 99–100), Final Boost Target (top 23.4, passes the target through), Boost By Gear (35.4 psi everywhere = no limit), ethanol boost adjust (0, no sensor), ECO mode, knock (0.49–0.53 at every peak), heat, altitude.

Still open: KTuner says Starter maps keep factory protections; one Starter 21 Dual owner never passed 19.5 psi floored and was told to go custom (KTuner forum p9224). That may cap our target below 21 even when floored. A KTuner post from the 10th gen era (CivicX 27523) adds why: "we're at the safe point for the CVT and factory clutch at this 21PSI level", and "the rods in the base are also weaker".

**To settle it (owner, one drive):**
1. Key on, engine off, pedal floored: read TPS. That sets what "floored" means on this car.
2. One floored pull held ≥ 5 s from ~3,000 to past 5,000 rpm, S mode, ECO off, Cool conditions. Log TPS, TPS Command, Turbo Pressure Target, Turbo Pressure, EWG Position, EWG Target, RPM, Gear.
3. Screenshot the column header of `Boost_Target_2_Normal` (its columns step 19.0 → 20.0; the axis may be pedal).

Reading it: target flattens at 21 → a Boost step can show. Target flattens below 21 with TPS Command ≥ 99 → the target is capped → **no map change**. TPS Command held below the pedal with no wheel slip → a protection is closing the throttle → **no map change**. **Until that pull exists: no map change, and the Boost step stays closed.**

---

## 3. Corrections to cards we hold today

| Card | What's wrong | Basis | Proposed fix |
|---|---|---|---|
| `kc-boost-step` | "Pedal ≥ 85 % = floored" can accept part-pedal pulls: a floored pedal reads 100–113 % on these cars; ours never passed 94 | KTuner staff (CivicXI 41190) + our logs | "Floored" = within ~10 % of the key-on full reading; `boost_step_gates.pedal_pct` set from that reading. Judge overshoot held ≥ 0.5 s; KTuner calls 1–2 psi overshoot and a 1–3 psi spike at the CVT's simulated shift normal |
| `kc-high-rpm` | Assumes the forced Knock Control rise above 5,200 rpm is present. It is, **but only because** "Eliminate Artificial Knock Control Rise" is unticked on our map (screenshot, KTuner 1.0.14.0) | KTuner release notes 1.0.10.1 / 1.0.11.0 + owner screenshot | Make the exclusion depend on that box; store it in the Car profile. Ticked → a rise up there is real knock |
| `kc-ignition-formula` | Says the log shows ignition in 1° steps | KTuner Help + our rows | On TunerView both Ignition and Knock Retard move in 0.5° steps, and values are cut down, not rounded. Under boost every score 0.49–0.54 logs the same 5.0° retard, so read Knock Control itself. Fix the same wording in `fact-check.md` §2 |
| `kc-iat2-side` | Still says IAT2's side is unknown | `fact-check.md` §4 (our data) + KTuner abbreviations | IAT = after the intercooler, IAT2 = before the turbo. Judge the intercooler by IAT − IAT2 under boost |
| `kc-table-wot` | Calls the table "Nominal Lambda for Component Protection" | Our map file names it `WOT_Enrich`; that KTuner page is in the Type R section | Name it **WOT Enrichment** (load axis: mg per stroke). Same fix in `fact-check.md` §1 and `afr-tuning-research.md` |
| `kc-open-loop-wot` | Says open loop under boost isn't confirmed on this car | Our logs: STFT exactly 0 on 100 % of warm rows ≥ 12 psi, 89 % at 8–10 psi | Confirmed: above ~8 psi trims are frozen, so airflow corrections use only rows below that |
| `kc-after-flash` | "Starts around 0.58" | KTuner release notes 1.0.6.2; our 30 Aug log | Exactly **0.59** after every flash |
| `kc-downpipe-catted-catless` | "400-cell owners report no light" | Forum: one RV6 owner got P2A01 twice; one TSP owner gets a light in heavy rain | "Most report none; a few see P2A01 or a light in rain or long highway runs" |

`kc-heat-soak` was challenged (forum: the stock intercooler saturates) and **stands**: across 8 street pulls in 7 minutes our pull-start intake air *fell* (54 → 43 °C). Proof if wanted: 3 back-to-back hot pulls, watch IAT − IAT2.

---

## 4. New cards proposed

| New card | What it says | Main sources |
|---|---|---|
| `kc-log-channels` | KTuner short names = our CSV columns (K.Cont = Knock Control, K.Ret = Knock Retard, TC.Target/TC.Press = boost at the turbo, TPS.C = TPS Command, Wideband = our O2 column, DIFPress = fuel pressure). Our logger records all of them. Still missing: AFR Command, MAF Hz | KTuner Help, Item Abbreviations |
| `kc-flash-howto` | Battery charger on; ignition on, engine off; key off 10 s after 100 %; warning lights clear after 10–15 min of driving; failed flash → accept recovery; a Recovery prompt with the engine running is a loose cable, say no; error codes after a flash = wrong codebase; V2 not waking → CAN Gateway = Yes. Saving to the V2 isn't flashing | KTuner Help (Flashing, ECU Recovery, CAN Gateway), KTuner forum, TSP guide |
| `kc-maf-trim-direction` (promotes the proposal) | Positive trim → raise g/s at that point by about that %. Average warm steady rows, drop lift-off and transient rows, slow roll-on for upper points, partial correction, curve keeps rising. Only rows below ~8 psi count | KTuner staff + owners + our open-loop data |
| `kc-boost-codes` | P0046 = wastegate not following command (sticking actuator, vacuum-line leak); P0299 = underboost. Compare EWG Position to EWG Target, boost to target. Hardware first, no map change | Civic11forum (2 traced cases), CivicXI |
| `kc-final-boost-target`, `kc-boost-by-gear` (promote the two proposals) | Final Boost Target passes the target ~1:1 and caps at its last column (ours 23.4). Boost By Gear only limits; ours is 35.4 everywhere = off. App explains, never writes either | KTuner Help |
| `kc-octane-booster` | Don't. KTuner staff, Phearable and the reliability thread advise against it. Test a different station or E10 RON97, tank against tank, by Knock Control | KTuner forum t768, reliability threads |

---

## 5. Best additions to existing cards (value 4)

- **`kc-table-boost`:** KTuner limits low-end torque on CVTs for longevity; it's visible in our file (Normal table 15 psi at 2,500 rpm, 17 at 2,750, 19 at 3,000, 21 only from 3,500). This is why a Boost step starts at 3,500 rpm.
- **`kc-quick-adjustments`:** Disable Boost Target Dampening is the only setting that lifts the part-pedal target. It needs P0299 off and Boost By Gear on a CVT, and owners call it harsh. **It stays off on this car.** With it off, the logged target never drops to atmospheric at closed throttle. Turbo Responsiveness doesn't raise the boost ceiling; for floored-pull lag, Boost Target Ramp Rate is the lever (Factory → Improved 1 → Improved 2 → Aggressive 1 → no-ramp).
- **`kc-shakedown`:** after a MAF Scaling flash, watch Knock Control as closely as trims: the airflow curve also sets the load the ignition tables read.
- **`kc-fuel-test`:** vendors' "+5 % on 93 vs 91" comes from a separate higher-timing file. On one map, better fuel only returns what Knock Control took: ~0° on cool pulls, up to ~1.6° in hot traffic. Try a different busy station before paying for RON97.
- **`kc-ranges`:** forum Knock Control labels in degrees on this map: 0.70 ≈ 2.1°, 0.80 ≈ 3.2°, 0.90 ≈ 4.2°, 1.00 ≈ 5.2° (10.2° per 1.0 above 0.49). Our peak is 0.65. The scale stays as it is.
- **`kc-heat-soak`:** our score stays ≤ 0.52 under 45 °C intake air and climbs to 0.55–0.65 above it (mostly one hot-traffic drive).
- **`kc-cvt`:** largest census (10th gen, 1,704 tuned cars): 12 of 580 tuned CVTs failed (2.1 %); causes were brake launches, track heat, factory defects. Base tunes failed least (4.2 % all failures). Voluntary survey, no untuned control: expectations, not limits. The 11th gen census (87 cars, 0 of 21 CVTs failed) is too small to show anything yet.
- **`kc-timing-percent`:** near-zero timing at boost onset is the map, not knock (KTuner staff; our pulls −1.5 to +0.5° at onset, 3.5–4.5° at 16 psi near 5,000 rpm).
- **`kc-trim-cause`:** negative trims after a change with the right preset → air escaping after the sensor (boost leak, vent-to-air blow-off valve) or a leaking injector. Keep the blow-off valve recirculating.
- **`kc-map-switching`:** the tach shows 1,000 / 2,000 / 3,000 rpm for Tune 1/2/3 while choosing; cruise fully off; a V2 left plugged in restores the last tune at start. Confirm Tune 2 before a Boost-step drive.
- **`kc-p0420`:** downpipes also bring P2A01; KTuner's Disables/Monitors lists O2 slow response and O2 performance too. Our map already disables P2096/P2097 and P0128 (so a stuck-open thermostat shows only as coolant that never reaches ~80 °C). đăng kiểm tests tailpipe gas and the lamp, so a disabled code hides a fault rather than helping a car pass.
- **`kc-expectations`:** a stock non-Si CVT measures ~154–164 whp; stock boost peaks ~12–15 psi; owners on 21 psi maps log 18–20 on the road; one more psi ≈ at most 5 whp (dynos show ~2); published gains are cool-air numbers (PRL's run at 23 °C intake). KTuner claims Starter 21 adds up to 55 whp / 58 lb-ft.

The full list (≈ 120 picks with wording and links): `.scratch/ktuner-kb-research/analysis/picks-g1.md`, `picks-g2.md`, `picks-g3.md`.

---

## 6. Engine follow-ups the research implies

1. Add KTuner short-name aliases to the channel detector in `engine/kta-engine.js` (K.Cont/K.Con, K.Ret, TC.Target, TC.Press, DIFPress, STFT1/LTFT1, TPS.C). Today TPS.C could be read as TPS.
2. Make the high-rpm Knock Control exclusion depend on the "Eliminate Artificial Knock Control Rise" box in the Car profile.
3. Airflow-curve correction: drop rows at MAP ≥ 8 psi or with STFT frozen at 0.
4. A trim column pinned at −100 is a logger fault (bank 2 picked on a one-bank engine) → Can't tell, never a trims Stop.
5. Boost step: `pedal_pct` from the key-on floored reading; overshoot judged over ≥ 0.5 s; a single-row target jump is a glitch (one row on 30 Aug logs a 51.7 psi target).
6. A Watch when coolant stays under 80 °C on a warm drive (P0128 is off on this map).
7. A pull where TPS Command drops while TPS holds is VSA stepping in: that pull doesn't count.

---

## 7. Never say (refuted or wrong for this car)

- "On 91 octane Knock Control sits near 0.9." Our E10 RON95 holds 0.49–0.54 cool.
- "Starter maps remove the artificial knock rise." Not on ours.
- "Your 19.2 psi is the export-ECU TPS Command cap." Ours reached 99–100 %.
- "Knock Count shows knock." It's a misfire count; watch Knock Control.
- "Add fuel for E10" / "set a flex correction for E10": no ethanol sensor, flex tables do nothing, trims show no E10 offset (cruise median −0.8 %).
- "Pick the Race MAF option for a better intake." Only with a Race housing; the housing decides, not the brand.
- "KTuner says a downpipe runs lean." The thread says the opposite: "All exhaust modifications are supported with the included tunes".
- "Trims lock from 1 psi of boost." Our logs: short-term trim is zero on only 16–30 % of rows up to 6 psi, about 100 % from 10 psi.
- "Trims add 20 %, so lower g/s by 20 %." Backwards: a positive trim raises g/s.

---

## 8. Gaps and what's not done

- **YouTube:** still IP-blocked at the last probe (18 Oct 01:50); a waiter retries every 30 minutes until about 08:45. 68 videos not fetched, including the four official KTuner tutorials and Derek Robinson's 2022 Si walkthrough. Resume: `scratchpad/yt_grab_kb.py` (skips saved ids).
- **CivicX:** done (§9). 37 snippet-only claims remain with no fetched thread; they stay low-confidence.
- **TikTok:** no transcripts by design (anti-bot challenge). **Facebook groups and Vietnamese sources (Otofun)** not reached; they remain the biggest gap for this market.
- Not in any source: what exactly caps the target below 21 on a floored pull (only the test in §2 answers it), and KTuner's internal Knock Control model.

---

## 9. Second CivicX pass (18 Oct 2026)

The 50 CivicX threads fetched after the block lifted were read in full (153 claims; quotes checked word for word). The 44 claims that rested on search snippets were checked against their threads: **16 had no support and 22 needed correcting**, so snippet-only claims were right to be marked low-confidence. Worst cases: a "KTuner agreed a downpipe runs lean" snippet (KTuner said the opposite), and four snippets crediting KTuner staff with what owners or a vendor said. That leaves the "0.9 and above is irregular" rung of the forum Knock Control scale with no staff source.

**One decision for the owner: how far past 21 psi a Boost step may go.** KTuner says it stopped its Starter maps at 21 psi as "the safe point for the CVT and factory clutch" on the base engine, whose rods are weaker (10th gen era post, CivicX 27523). `kc-boost-step` today allows a step up to the Final Boost Target peak, 23.4. Vendors run past 21 on stock 11th gen CVTs (TSP Map 3 targets 24 psi; the 11th gen census has 0 failures in 21 tuned CVTs, too few to prove anything). No log can measure that margin. **Recommendation: cap the Boost step at 21 psi target for now.** On this map that closes the step outright, because its 3,500–4,500 rpm rows already ask 21, so the honest power answer becomes "no map change". Going past 21 means using up KTuner's own margin, and that's the owner's call. The step stays closed either way until the floored pull in §2.

**Checks on our logs added this pass:**
- Open loop: short-term trim reads exactly zero on 16–30 % of rows at 0–6 psi (the same as cruise), 43 % at 6–8 psi, 89 % at 8–10 psi and about 100 % from 10 psi. The 8 psi cut in `kc-open-loop-wot` and the engine stands.
- IAT − IAT2 is never negative on 23,560 warm rows, which backs `kc-iat2-side`.

**Owner check needed:** one owner says the TunerView CSV has no MAF signal. If TunerView offers no airflow-frequency gauge on this car, the MAF headroom check must read Can't tell and the log still counts, or every log fails the gate on something the owner can't fix (`kc-log-gate`, `kc-drive-brief`).

**Card tensions found, no change made:** `kc-heat-soak` (an owner cites +12–15 bhp from a bigger intercooler on a dyno; our street data still says the stock cooler holds), `kc-cvt` (owners on stock fluid see 88–104 °C, so the 100 °C Stop stays provisional), `kc-dual-boost-targets` (ECO also reduces A/C output, a real cost in Vietnamese heat), `kc-cvt` / `kc-power-sources` (two owners say there's no torque limiter; KTuner says Starter maps keep factory limits, which is the better source).

**Best new picks** (wording and links in `.scratch/ktuner-kb-research/analysis/picks-civicx2.md`):
1. `kc-boost-step`: read the floored pull by TPS Command as well as target (see §2).
2. `kc-boost-codes`: boost on target cold but short warm points to the wastegate, not a leak.
3. `kc-flash-howto`: a floored-pull target stuck at the factory level means the map didn't flash; ours reached 19.2, so the Starter map is in.
4. `kc-maf-housing`: a preset that doesn't match the housing can show as a bog past about 4,500 rpm with boost 4–6 psi down, not only as bad trims.
5. `kc-heat-soak`: ask which intake is fitted; a short-ram filter heat-soaks to about 62 °C in hot traffic, and heat wrap doesn't help.
6. `kc-shakedown`: after an airflow flash also compare DI fuel pressure with its target.

Verdicts upgraded with the full text: the low-rpm judder fix in KTuner 1.0.9.5 (plausible → supported) and Phearable's maps keeping the artificial knock rise (merged into the §3 `kc-high-rpm` finding).


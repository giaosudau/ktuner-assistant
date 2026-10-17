# Conflicts and contradictions, group g2 (ignition-knock, fuel-octane, heat-iat, reliability-failures)

*Stage 2, 17 Oct 2026. Every ⚔️ finding and every `contradicts <card-id>` in `findings-g2.jsonl`, plus smaller disputes found along the way. Our car's data = the 9 TunerView logs in `data/example-*.js` (108,918 rows). Scripts: `scratchpad/stage2/drives*.py`.*

## Contradicts a card (flag; not resolved in the cards)

### 1. g2-07 contradicts `kc-ignition-formula` (and the wording of `fact-check.md` §2)
- **Card / fact-check:** "The log rounds both: retard shows as 3.5 and ignition as 19"; fact-check §2: "Logged retard and ignition are rounded (0.5° and 1°)".
- **Source:** KTuner Help says ignition is rounded to 19 **"on OBD platforms"**, not on every logger.
- **Our data:** on TunerView (V2) Ignition and Knock Retard **both** move in 0.5° steps. 43 % of all Ignition samples end in .5. Knock Control moves in 0.01 steps.
- **Extra:** KTuner's own example (3.8 logged as 3.5) means the value is cut down to the step below, not rounded to the nearest. Our boosted rows fit "cut down, table ≈ 10.25°" and "rounded, table ≈ 10.0°" equally well (337 vs 331 of 360 rows). So the 10.2° boosted table in fact-check §2 is right to within ±0.3°.
- **Resolution proposed:** our data wins for this car. Card text: "on TunerView, Ignition and Knock Retard step in 0.5°; the 1° ignition step is for OBD loggers". The 0.5° noise floor in `kc-fuel-test` stays correct.
- **What the step hides:** under boost, every score from 0.49 to 0.54 logs Knock Retard as 5.0. Read Knock Control itself, not Knock Retard.

### 2. g2-52 (⚔️) contradicts `kc-heat-soak` ("The intercooler is not the problem")
- **Side A, forum (6 sources, 10th gen, Phearable sells the part):**
  - The stock intercooler saturates over repeated pulls, and power is cut.
  - Fit an intercooler first.
- **Side B, our data (better basis for this car on the street):**
  - Under boost, IAT (after the intercooler) is only 2–11 °C above IAT2.
  - Across 8 pulls in about 7 minutes, IAT at the start of each pull **fell** (aug22-0903: 54 → 43 °C; aug30-1529: 53 → 45 °C). The cooler never saturated.
  - What cost boost was heat soak at stops: 19.9 → 16.7 psi, 31 minutes apart.
- **Why they differ:** the forum describes long or track pulls and higher-output tunes. Our pulls are short street pulls.
- **What would settle it on our car:** 3 or more back-to-back full pulls of 4 s or more at ≥ 15 psi on a hot afternoon. Log IAT − IAT2 for each pull. If the gap grows from pull to pull, the cooler is saturating; if not, the card stands.
- **Card action:** keep the card. Add "on short street pulls" and the test above.

### 3. g2-53 contradicts `kc-iat2-side` ("the shop never assumes which side IAT2 is on")
- **fact-check §4 (data + physics) already settled it:** IAT reads 2–6 °C above IAT2 under boost. Air leaving the intercooler can't be cooler than the air going in, so IAT is after the intercooler and IAT2 is before the turbo.
- **civicx-37 agrees:** on the 1.5T in KTuner, "IAT 1 = MAP (post intercooler), IAT 2 = MAF (pre intercooler)", the reverse of Hondata's labels.
- **The problem:** the card lags its own fact-check.
- **Resolution proposed:** say so for this car: IAT2 is the inlet (pre-turbo) air and IAT is the manifold (post-intercooler) air. Judge the intercooler by IAT − IAT2 under boost. Keep the "other ECUs may differ" sentence as a caveat for other cars.

## ⚔️ Conflicts with no card contradicted

### 4. g2-03: the forum's Knock Control scale is not one scale
The forum labels disagree with each other:

| Level | What owners say |
|---|---|
| 0.69 | "danger zone" (second-hand, attributed to Phearable) |
| 0.70 | "normal" (long-time member, KTuner staff excerpt) |
| about 0.8 | "you feel the power loss" |
| 0.85 | "not damage" |
| 0.9+ | "irregular" (KTuner staff, search excerpt) vs "on 91 expect about 0.9" (civicx-62, refuted below) |
| above 1.0 | "concerning" / "likely a bent rod" (second-hand) |

None of these comes with evidence. Our basis is better: KTuner's formula with this car's 10.2° boosted table turns any score into degrees of timing lost.

| Score | Timing lost under boost |
|---|---|
| 0.53 | 0.4° |
| 0.59 | 1.0° |
| 0.70 | 2.1° |
| 0.80 | 3.2° |
| 0.85 | 3.7° |
| 0.90 | 4.2° |
| 1.00 | 5.2° |

`kc-ranges` stays as it is. Its provisional Stop at 0.80 sits where owners say they feel the power loss.

Side dispute: civicx-61 (search excerpt) says 1.0 is the ceiling and the ECU can't pull more timing beyond it. KTuner staff saw 0.8 → 1.2 on an Element turbo (ktuner-forum-57, a T3 car with a different ECU). Unsettled, and moot at our 0.65 peak.

## Smaller disputes and corrections (not ⚔️, listed so nothing is resolved silently)

- **"KTuner Starter maps also remove the artificial rise"** (`[F7]` in `.scratch/downpipe-power/research/ignition-from-datalog.md`, second-hand, low basis).
  - This is **refuted for our map.** The owner's KTuner 1.0.14.0 screenshot of Starter 21 Dual Tune 2 shows Quick Enables → "Eliminate Artificial Knock Control Rise" **off** (issue 11).
  - Base and Starter maps let the owner choose (civicx-128). Phearable 1.5R removes the rise; TSP Stage 1 and base Phearable 1.5 keep it (civicx-127).
  - `kc-high-rpm` is consistent with this, but its exclusion must become conditional on that box (g2-13).
- **Does an Si ECU have the artificial rise?**
  - No, say 10th-gen sources (civicx-127, civicxi-138).
  - Yes, say two 11th-gen Si owners on stock tunes (civic11forum-30, civic11forum-41).
  - Irrelevant to us: the FE is non-Si, and KTuner's 1.0.11.0 note lists "Civic 1.5T 2022+" codebases that have it.
- **Starting score after a Flash: 0.58 vs 0.59** (`kc-after-flash`).
  - The card says "around 0.58" (from the drive summary).
  - KTuner's release notes (1.0.6.2) set it to 0.59. Our aug30-1529 log's first sample is 0.59.
  - Minor; the card's "≤ 0.60" rule holds. Quote 0.59.
- **"Every drive's minimum is 0.49"** (fact-check §2).
  - True for settled values.
  - But 1.0 % of moving rows dip to 0.33–0.47 for 1–3 samples at throttle changes. There is also one single-sample 0.70 spike at lift-off (aug22-0903, t = 391 s).
  - Rules that read peaks should ignore single-sample spikes. The engine's "settled" reading may already do this; check.
- **"On 91 expect Knock Control near 0.9, on premium 0.5–0.6"** (civicx-62, attributed to KTuner).
  - **Refuted** by our E10 RON95 data: 0.49–0.54 on cool drives, 0.65 at most on the hot one.
  - Also refuted by two 91-octane owners on 21 psi maps: youtube-33 (max 0.52) and civicxi-109 (about 0.49).
- **"Knock Retard drives Knock Control"** (civic11forum-61).
  - **Refuted** by KTuner's formula: Knock Retard = Knock Control × the retard table.
  - Our logs show 5.0° of retard at the 0.49 floor under boost.
- **"Base maps: no blown engine on an unaltered base tune"** (civicxi-117).
  - Softened by the CivicX census: one CVT failed on a base tune with a stock setup (likely a factory defect, replaced under warranty), and one hatch engine failed on a Hondata +6 base tune.
  - The census base-tune failure rate is 4.2 % across all models and failure types.

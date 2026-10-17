# Fix spec: the downpipe owner who wants more power

Synthesis of [Fix-spec synthesis](issues/09-fix-spec-synthesis.md). Every line traces to a closed ticket on [the map](map.md). The owner asked (2026-10-09) to carry implementation into the map.

## What the shop tells the owner (the owner-goal table)

| Goal | KTuner action | Proof | What to expect |
|---|---|---|---|
| More power / torque | **No map change** today. The downpipe + HVI gain is already in the car (vendor: +7 to +12 whp untuned). | — | No Honda tuner changes the map for a downpipe on the stock turbo. |
| More boost | **Boost step**, +1 psi on **Boost Target 2 Normal L/H** (Tune 2), rows 3,500–4,500, only when every gate passes. A proven step is copied to Tunes 1 and 3. Ceiling = the active map's Final Boost Target peak (23.4). 24 psi = a vendor file. | 2 floored pulls (TPS ≥ 85 % held ≥ 4 s above 3,500 rpm) + 1 hot drive. Gates: target moved, undershoot ≤ 1.5 with EWG, overshoot ≤ 1.5 and target + overshoot ≤ 24, timing ≤ 1° below the last proven version, KC settled ≤ 5,200 rpm with no rise and ≤ 0.56, AFR never leaner than 12.0, DIFP ≥ 90 %. | **Closed today:** hot-drive KC 0.64, no floored pulls. On RON95 E10 (≈ 90 AKI) expect it to stop early. |
| Less turbo lag | Teach-only. One Quick Adjustment one level up (Turbo Responsiveness / Boost Target Ramp Rate), **only if** logs show the target ramp, not the turbo, is the limit. Early Spool stays off. | lagS and spoolRpm on ≥ 2 matched floored pulls each side. | Today all Factory; no floored pull to read yet. |
| Throttle response | Teach-only: Throttle Responsiveness is pedal feel, not power. | Nothing to prove. | Owner's taste. |
| Premium fuel | **No map change.** Hot matched pair RON97 vs RON95, KC/timing ≤ 5,200 rpm. | > 0.5° better = gain. | Pays only in heat (≤ ≈ 1.6°). Petrolimex sells no RON97; smaller retailers sell E10 RON97-III. |
| More timing ("+2 / +5 %") | **Never added.** Percent retards the 150 negative boosted cells; the ECU never exceeds Ignition Base; pros add only on a dyno. | — | Removal in degrees where KC rises is teach-only until a load channel exists. |
| Catted vs catless | No map change for any. 400-cell catted is the pick. | Overshoot ≤ 1.5 on the proof pulls (B2 trim otherwise). | Catless: ≈ 0–6 whp, smell, P0420, tailpipe-test risk + 65–75 M VND fine. |

## Wave 1: in parallel (disjoint files)

**K. Knowledge** (`knowledge/cards/`, `knowledge/index.json`, server knowledge tests)
- Fix `kc-p0420`: the rear O2 sits in the pipe, the front A/F on the turbo outlet; VN inspection = tailpipe + MIL; spacer hit-and-miss (P1039).
- Fix `kc-expectations`: stance kept; "measured with a downpipe and front pipe fitted"; "58 lb-ft / 79 Nm" labelled KTuner's claim; "at up to 19.9 psi"; "only from a step proven on your logs".
- Fix `kc-table-boost`: Fill Limitation is a knock safeguard, the everyday cap is the factory torque limiter; boost targets are per Tune 1/2/3; the logged target is held by throttle dampening + ramp.
- Fix `kc-cvt`: the app sets no torque number, but the ECU's limiter still protects the CVT.
- Fix `kc-rich-wot`: measured λ0.69–0.73 is richer than asked and costs a little power (wording).
- Fix `kc-e10`: RON95 ≈ 90 AKI.
- Fix `kc-fuel-test`: hot pair only; ≤ 5,200 rpm; Petrolimex has no RON97.
- New `kc-downpipe`: what changes (spool sooner, no map change, B2 only on proof, rear-O2 leak check, no fuel/spark change).
- New `kc-downpipe-catted-catless`
- New `kc-power-sources`: only air makes power; fuel follows; spark is knock-capped; torque-based ECU.
- New `kc-timing-percent`: the "+2 / +5 %" answer; how Honda timing works; degree removal.
- New `kc-boost-step`: the ladder, gates, Tune 2 A/B, closed today.
- New `kc-quick-adjustments`: response / lag / Early Spool, teach-only, the owner's Factory settings.
- New `kc-iat-retard`: 4.5° at 50 °C, 9° at 90 °C, high load: why heat costs power.
- Promote the two `kp-` proposals on on-the-fly switching and dual boost targets into cards.
- Every number pinned to its `source-doc` / `numbers:`. Rebuild the index.

**B. Build ladder, text, profile, routing** (`engine/kta-build.js`, `engine/text/i18n-drive.js`, `server/kta_server/profile.py`, `server/kta_server/ask.py`, their tests)
- `kta-build.js` dpCat:
  - only the rear O2 is in the pipe (step 1 reason);
  - the B2 rows are where overshoot was logged, all three tunes;
  - drop `Final_Boost_Target_H`;
  - gain "+12 whp / +13 lb-ft on the factory ECU (27WON vendor dyno; a first CVT test gave +7 / +11)".
- `dp12` claim → `partly` / `low`, labelled vendor.
- `map24` → "24 psi vendor file (TSP Map 3 / Phearable L3)": 191 whp is Map 3 only, "output limited for engine and transmission".
- `catless`: "risks the tailpipe test + 65–75 M VND fine" (not "fails đăng kiểm").
- `hondata` claim → vendor-true, drop "on the CVT".
- The "3 % at 21 psi" note → "≤ 19.9 psi".
- `i18n-drive.js:260` headroom text → "the turbo is near its limit" (both languages).
- `profile.py`: the downpipe part gets an optional `type` (`catted-200 | catted-400 | catless | unknown`), with keywords "catless", "200 cell", "400 cell", "GESI", "27WON", "TSP", "RV6".
- `ask.py`: downpipe / catless / catted questions with no drives go to knowledge, not the `boost` no-drive gate.

**E1. Engine core** (`engine/kta-car.js`, `engine/kta-engine.js`, `engine/kta-drive.js`, engine tests)
- `carFuelTest`:
  - compare the **judged** KC peak (≤ 5,200 rpm; add `kcPeakJudged` to the drive summary);
  - pair only **hot** drives;
  - skip drives whose KC starts > 0.56 (unsettled after a Flash).
- B2 downpipe trim:
  - rows = the rpm rows where held overshoot was measured (summarise `overshootRpm`), cells ≥ 8 psi, all six Normal tables;
  - label from the real rows (no phantom "3,250");
  - proof = ≥ 2 hard pulls on a Cool drive, overshoot ≤ 2.5, AFR at or richer than target and never leaner than 12.0, trims within ±5 %.
- carDiagnose:
  - "Faster spool after the downpipe" only when the Install is a downpipe (generic "after the change" otherwise);
  - "leaner than target under boost" after a downpipe no longer blames a leak ahead of the A/F sensor; the cause reads "real lean, fuel pressure or the airflow sensor; downpipe flange leaks show on the rear O2 / P0420".
- Spool signal: per floored pull (TPS ≥ 85 % held ≥ 2 s, start ≤ 3,500 rpm) → `spoolRpm` (15 psi), `lagS` (pedal 85 % → boost ≥ 90 % of target), `ewg`; in drive insights as `I.floored`.

## Wave 2: after E1 merges

**E2. Boost step** (`engine/kta-car.js`, `data/thresholds.json`, `server/kta_server/mapcheck.py`, tests; ADR)
- `boostPlus` lever → **Boost step**:
  - offered only when the latest Cool drive has ≥ 2 floored proof pulls and every gate passes, the latest hot drive passes, and no Stop or Open step is open;
  - writes Boost_Target_2_Normal L/H, rows 3,500–4,500, +1 psi, never above the Final Boost Target peak at that row;
  - proof judged with the same gates; the first failure → Undo.
- `thresholds.json`:
  - `boost_ceiling_psi` → a rule "active map Final Boost Target peak", with `boost_step_max` 1;
  - `boost_raise_min_rpm` stays 3,000;
  - add the gate numbers (overshoot 1.5, undershoot 1.5, timing drop 1.0, KC 0.56, rail 90 %, total 24) with basis "judgement" and their source tickets;
  - `boost_pairs` allows Tune 2 alone for a Boost step.
- `mapcheck.py` mirrors the ceiling, rows and Tune-2-only rule (ADR 0003).
- `map24` lock: drop the `turbo` (wastegate-guess) lock; keep `final`; `octane` stays.
- ADR 0007: "Boost ceiling proven by datalog, not fixed; steps on Tune 2".

## Out of this spec
- Ignition edits; knock-sensitivity / Final Boost Target / Cylinder Fill / Boost By Gear edits.
- Writing Quick Adjustments for the owner.
- Logger-setup channel discovery beyond "add AFM Hz" (TunerView channel list unknown).
- Eval queries for the scorecard (fog).

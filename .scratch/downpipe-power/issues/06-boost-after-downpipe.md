Type: grilling
Label: wayfinder:grilling
Status: resolved
Assignee: Chanh
Blocked by: 01-power-fundamentals, 02-downpipe-effects, 03-tuner-practice, 05-log-evidence

## Question

When the owner with a downpipe asks for more boost and power, what does the shop say and do? Decide: does a measured downpipe change `kc-expectations` ("no headroom"), the 21 psi `boost_ceiling_psi`, or the `map24` lock set (turbo / final / octane) — and if any boost raise is ever allowed, where (rpm ≥ 3,000 only), by how much, and proven by what log; or is the answer "no map change, the gain is the pipe itself" plus the B2 overshoot trim. Resolve the "more air, more fire, more fuel" answer: no leaner WOT, no timing.

## Answer

Owner's product intent: boost is not a fixed 21 psi ceiling (TSP ships 24 psi on this car); every psi must be proven by datalog. The rest is decided from research tickets 01–05 and 12.

**D1 — Boost is proven, not capped. The boost ladder:**
- A **Boost step** is +1 psi on the six Normal Boost Target tables (1/2/3, L and H), rows ≥ 3,000 rpm only, flashed alone (one family per Flash). Lowering stays allowed anywhere.
- **Offered only when the latest Cool drive (≥ 2 hard pulls) passes every gate**, using the existing `KTA.LIMITS`:
  - boost reaches target: undershoot ≤ 1.5 psi;
  - overshoot ≤ 2.5 psi;
  - knock retard ≤ 1.0°;
  - Knock Control ≤ 0.56;
  - WOT AFR at or richer than target, never leaner than 12.0;
  - trims within ±5 %;
  - the latest hot drive passes too;
  - no open Stop or Open step.
- **Kept only if the proof passes**: a Cool drive with 2 pulls plus one hot drive pass the same gates at the new target. Undershoot at the new target is the direct test of turbo headroom; it replaces the "wastegate ≤ 5 % = no headroom" inference, which stays shown as context only.
- **First failed gate:** Undo to the last proven Map version. The ladder stays closed until a fuel or part change (a RON97 Fuel tag or an Install).
- **App-written range:** up to the active map's Final Boost Target peak (23.4 in this file), i.e. 22, then 23 psi. Final Boost Target, Cylinder Fill Limitation and ECO tables stay protected; the app never edits them.
- **24 psi** = a vendor file (TSP Map 3 / Phearable L3) the owner flashes as a basemap. The app reads its logs through the same gates and says keep or revert.
- **Fuel:** the gates decide, not the fuel label. On E10 RON95 (≈ 89–91 AKI, the vendor floor) the owner is told up front to expect the ladder to stop early. With a RON97 tag, the Premium-fuel test runs first.
- A Goal never opens a step. Asking for "more power" only reorders the wording.

**D2 — Overshoot trim (B2) kept, corrected:**
- Rows come from where held overshoot was measured. The engine already computes `overshootRpm` (kta-engine.js:943) but drops it, so it must summarise it.
- The cell rule lives in the engine only; Play B and dpCat read it from there.
- The cause "Faster spool after the downpipe" is shown only when the Install is a downpipe.
- **One proof:** a Cool drive with ≥ 2 hard pulls, overshoot ≤ 2.5, AFR at or richer than target and never leaner than 12.0, trims within ±5 %.
- The ladder is blocked while overshoot > 2.5 is held: fix the overshoot first.

**D3 — A downpipe changes nothing on fuel or spark.** The WOT target stays 11.0; no timing change; the mixture lever is untouched by a downpipe.

**D4 — `kc-expectations`: keep the stance** (more boost mostly means more heat; most drives end with no change). Edits:
- add "measured with a downpipe and front pipe already fitted";
- label "58 lb-ft / 79 Nm" as KTuner's claim;
- "at 21 psi" → "at up to 19.9 psi";
- "never from typing a higher target" → "only from a step proven on your logs".
Also fix the inverted headroom text at i18n-drive.js:260.

**Conflicts this resolves:**
| Source | Change |
|---|---|
| `thresholds.json` `boost_ceiling_psi` 21 | Becomes the active map's Final Boost Target peak plus proof per step; `boost_step_max` 1 and `boost_raise_min_rpm` 3,000 stay |
| `kta-car.js:1416` boostPlus "Never on this turbo" | Becomes the proof-gated Boost step lever |
| `kta-build.js` map24 | Becomes "24 psi vendor file": owner flashes it, app proves or reverts. Gain text: 191 whp is Map 3 only, "limited for engine and transmission" |
| `mapcheck.py` (independent check) | Mirrors the new ceiling rule (ADR 0003) |

**What the shop tells the owner who asks for more power and boost:**
1. The pipe's gain is already in the car: it spools sooner (vendor: +7 to +12 whp untuned).
2. More boost comes 1 psi at a time, from 3,000 rpm up, to about 23 psi on this map. Each step needs one Cool drive with 2 pulls plus one hot drive. The app stops at the first sign of knock, lean or a turbo that can't reach target; on RON95 E10 expect it to stop early.
3. 24 psi = a vendor file, then the same checks.
4. Never: timing, leaner fuel, low-rpm boost (CVT, LSPI).
5. Beyond that = a custom e-tune or a bigger turbo, outside the app.

ADR candidate (for the fix-spec): "Boost ceiling proven by datalog, not fixed" amends the `boost_ceiling_psi` basis and the ADR 0001 / 0003 checks.

> Note (2026-10-05): the owner asked for the boost method to be grounded in tuner datalog practice. D1's gates are provisional until [Datalog step method](16-datalog-step-method.md) audits them against [Datalog boost method](13-datalog-boost-method.md).

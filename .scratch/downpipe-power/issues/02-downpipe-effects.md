Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

What does each downpipe class do on the 11th-gen 1.5T (and, as cross-check, 10th-gen L15B7): 200-cell 27WON catted, 400-cell GESI-core catted (TSP, RV6), catless? Cover, with numbers and source quality: backpressure / flow difference between 200, 400 and catless; spool rpm and boost-at-rpm change on the same map; wastegate (EWG) position at the same boost before vs after (does turbo headroom open up?); boost overshoot reports; dyno deltas with and without a tune (27WON +12 whp / +13 lb-ft vendor claim, TSP, RV6, any independent dyno); P0420 / rear-O2 code rates per class; front A/F sensor location and leak-reads-lean; O2 spacers; sound / smell / drone; Vietnam đăng kiểm OBD/emissions rules for catless or monitor-off cars.

Output: fact sheet with ≥2 independent sources per claim, vendor claims labelled, confidence, and contradictions with `knowledge/cards/kc-p0420.md`, `kc-expectations.md` and `engine/kta-build.js` (dpCat, catless items, `dp12` claim). AFK — call the Skill tool with "research".

## Answer

Findings: branch `research/downpipe-effects` (commit b9561df), file `.scratch/downpipe-power/research/downpipe-effects.md` (35-row fact sheet, per-class summary, contradictions, gaps).
- Power small, vendor-only: 27WON 200-cell on untuned 11th gen +12 whp / +13 wtq peak, ~+8/+9 average (earlier figure +7/+11). No independent 11th-gen dyno; TSP/RV6 publish none. Catless ≈ 0–6 whp over a good catted pipe.
- Spool: torque 200–400 rpm earlier (10th-gen dynos: 27WON, PRL, Vit Tuned); no 11th-gen boost-at-rpm data. Overshoot ~+0.9 psi same map (10th gen); catless on unadjusted maps spikes up to ~4 psi.
- **Owner already has downpipe + front pipe** (tuner-play-panel.md:52): logs are post-downpipe — wastegate 2.5 % at ≥ 15 psi, overshoot ≤ +1.9 → pipe opened no real headroom; `kc-expectations` stands.
- Codes: 200-cell → P0420 for most; 400-cell GESI (TSP, RV6 22+, old PRL) claim and report no CEL; catless always. Spacer/defouler mixed, can swap P0420 → P1039. Older RV6 pipes were 300-cell — ask which version.
- Sensor (medium confidence, install guides only): only the **rear** O2 sits in the downpipe; front A/F stays put → see [Front A/F sensor location](12-front-af-sensor-location.md).
- VN: QCVN 85:2025 (from 1 Mar 2026) = tailpipe CO / HC / lambda + MIL bulb check; 2022+ limit CO 0.5 % / HC 300 ppm (0.3 / 150 in HN/HCMC from 2028). No source says inspectors read OBD monitors. Unapproved modification fine 65–75 M VND (NĐ 168/2024).
- Contradictions: `kc-p0420` (front sensor moves; OBD-monitor fail is US-documented, not VN; spacer-first); dpCat step 1 sensor reason; dpCat "+12 whp on the stock map" = factory ECU, not Starter 21; `dp12` should be partly / low / vendor; catless "fails đăng kiểm" unverified → "risks the tailpipe test + possible fine".

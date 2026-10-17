Type: grilling
Label: wayfinder:grilling
Status: resolved
Assignee: Chanh
Blocked by: 02-downpipe-effects, 12-front-af-sensor-location

## Question

Does the car profile record the downpipe class (200-cell catted / 400-cell catted / catless), and what does the shop say for each — pre-install ("which should I buy?") and post-install? Decide: profile subtype or not (`profile.py` PARTS), the one catted-vs-catless card's stance (power gap, code risk, smell / sound, đăng kiểm), whether "same tune response for all three" holds, and how pre-install questions escape the `boost` no-drive gate in `ask.py`.

## Answer

Decided from [Downpipe effects](02-downpipe-effects.md), [Front A/F sensor location](12-front-af-sensor-location.md) and the owner's Disables screenshot.
- **Profile records the class:** the downpipe part carries an optional type `catted-200 | catted-400 | catless | unknown` (default unknown; the chat asks once).
- **One card ("Catted or catless downpipe"):**
  - 400-cell catted (TSP, RV6 22+): reports no CEL; the shop's pick.
  - 200-cell (27WON): P0420 for most owners.
  - catless: ≈ 0–6 whp over a good catted pipe, smell, always P0420, risks the tailpipe CO/HC test (QCVN 85:2025), plus a 65–75 M VND unapproved-modification fine (NĐ 168/2024).
  - **Same tune response for all three:** no map change, B2 trim only on proof.
  - Vendor numbers labelled.
- **`kc-p0420` corrected:**
  - the rear O2 sits in the downpipe; the front A/F threads into the turbo outlet;
  - a VN inspection checks tailpipe gas and the MIL, not OBD monitors;
  - an O2 spacer is hit-and-miss (P0420 → P1039).
  - This owner already has P2096/7 off and P0420 on.
- **Pre-install questions** (downpipe / catless / catted wording, no drives) answer from the cards instead of the `boost` no-drive gate.
- **Leak diagnosis:** after a downpipe Install, "leaner than target under boost" no longer blames "exhaust leak ahead of A/F sensor". Downpipe flange leaks go to the rear-O2 / P0420 path.

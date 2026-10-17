Type: grilling
Label: wayfinder:grilling
Status: resolved
Assignee: Chanh
Blocked by: 02-downpipe-effects

## Question

Should the engine gain a spool / boost-at-rpm signal so a downpipe Install can be proven before vs after (today pulls keep only start and max rpm, overshoot rpm is not summarised, undershoot skips < 3,500 rpm — see [Log evidence](05-log-evidence.md))? Decide: the signal (e.g. rpm where boost first reaches a fixed psi on throttle-matched pulls, or boost-minus-target per rpm band), the matching rule for like-for-like drives, the minimum samples, and whether it shows in the Health report / Map tour — or whether "felt faster" stays unprovable and the shop says so.

## Answer

- **Yes: one engine signal per floored pull** (pedal TPS ≥ 85 % held ≥ 2 s, start ≤ 3,500 rpm). It carries:
  - `spoolRpm`: rpm where boost first reaches 15 psi;
  - `lagS`: seconds from the pedal crossing 85 % to boost ≥ 90 % of target;
  - EWG Position at that moment.
- **Like-for-like:** same gear, start rpm ± 250, intake within 8 °C.
- **Shown only with ≥ 2 matched pulls on each side** of an Install or Flash; otherwise "can't tell yet, log a floored pull".
- **Today:** 0 floored pulls in the 9 drives, so the shop says so honestly rather than inventing a spool gain.
- The Drive brief asks for the floored pull. It is the same pull the Boost step proof uses.

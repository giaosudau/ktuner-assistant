Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

What can the owner's TunerView logs prove about a downpipe, using what the engine already computes? Read `engine/` (carDiagnose, carFlashPlan, boost summary: `overshoot`, `headroom`, wastegate / EWG fields, spool or boost-at-rpm, hard pulls) and the nine example drives in `data/example-*.js`. Answer: is EWG position / duty logged and summarised; can spool rpm (boost reaching e.g. 15 psi) be measured before vs after an Install; how `I.boost.headroom` is derived and whether a downpipe could flip the `map24` `turbo` lock; what proof the downpipe B2 step uses; any gap between `kta-car.js` (six Normal tables, rows 2,500/2,750/3,000, cells ≥ 8 psi) and `kta-build.js` dpCat (Boost Target 1 only, "2,500–3,250 rpm", Final Boost Target).

Output: signal list (logged? summarised? threshold?) and the exact drift list with file:line. AFK — local resources; call the Skill tool with "research".

## Answer

Findings: branch `research/log-evidence` (commit f3c9ab8), file `.scratch/downpipe-power/research/log-evidence.md`.
- EWG Position + EWG Target logged on all 9 drives; no EWG duty, no AFR command. `wgAtPeak` 2.5–3.2 % → `headroom` "small" on all 4 drives with hard pulls (kta-drive.js:38,276). EWG Target parsed, unused.
- No drive reaches 21 psi (max 19.9 boost / 19.2 target): the "3 % at 21 psi" claim (kta-build.js:163) was measured ≤ 19.9 psi.
- Overshoot per drive +1.9 / +1.4 / +1.0 / +0.1 psi; peaks all at 3,236–3,964 rpm — above the 2,500/2,750/3,000 rows B2 edits.
- Spool rpm before vs after an Install not measurable today (pulls keep start/max rpm only; overshoot rpm not summarised; undershoot skips < 3,500 rpm).
- Downpipe clears map24 `turbo` lock only if wgAtPeak > 5 %; `final` (23.4 < 24) and `octane` locks stay; kta-car boostPlus is hard-locked "Never on this turbo" (kta-car.js:1416).
- B2 proof (kta-car.js:1748-1772) = ≥1 hard pull, overshoot ≤ 2.5, leanest < map+0.5 — weaker than kta-build / Play B (two cool pulls, AFR ≥ 12.0 line, trims ±5 %).
- Drift: phantom 3,250 rpm row (axis 3,000 → 3,500); tables six vs Boost_Target_1 only; cells ≥ 8 psi = 41/table vs Play B cols 8–16 = 27/table; "Faster spool after the downpipe" fires after any change (kta-car.js:1983-1997,2078); i18n-drive.js:260 headroom text says "has headroom" for the no-headroom state.

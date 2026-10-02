# 06 — Diagnose: one cause per symptom pattern

**What to build:** the engine reads the pattern like a tuner before deciding the Next step (tuner-play-panel T7): one cause, one step, instead of the worst check first.

| Pattern | Cause | Next step |
|---|---|---|
| Trims beyond ±10 % in every load band from the first minute, after a Flash or Install | MAF Scaling / housing mismatch | Undo, then MAF Scaling for the housing |
| Trims ≥ +8 % at idle and low airflow only, after an Install | Unmetered air | Check the install, no map change |
| Leaner than target under boost after a downpipe Install | Exhaust leak ahead of the A/F sensor, or real lean | Check the flanges, then the mixture plan |
| High Knock Retard with a flat Fuel-quality score | Scheduled retard | Not a finding |
| Score rising mostly while lugging on hot drives | Lugging on hot E10 | Keep the revs up (habit); boost step only if proven |
| Boost overshoot above +2.5 psi held, after a downpipe | Faster spool | Downpipe boost trim |

The reply states the cause in one sentence with its evidence ("trims pulled 21.4 % in every band from the first minute, right after a change").

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Diagnose is an engine operation that runs before the Next step decision, tested per pattern with fixtures
- [ ] 23 Aug 20:38: cause = MAF Scaling / housing mismatch, Next step = Undo; never a knock fix or curve edit
- [ ] Scheduled retard with a flat score never produces a finding
- [ ] The loop eval stays green (or its table is updated with a reason)

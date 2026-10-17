Label: wayfinder:map

## Destination

A fix-spec (`fix-spec.md`) for the owner who fitted a high-flow downpipe — 200-cell 27WON catted, 400-cell GESI / TSP / RV6 catted, or catless — and asks for more power, torque, throttle response, less turbo lag and more boost: the exact knowledge cards to add or change (card text drafted in `knowledge/proposed/`), every conflict with today's cards, engine and Build ladder resolved to one source, and each owner goal ending in one KTuner action or an honest "no map change" — plus the shop's datalog step method for boost and ignition (how much, when to add, when to back off: proven by logs, never guessed).

## Notes

Domain: one-car Civic FE (11th gen) 1.5T CVT, Vietnam E10 RON95, hot traffic, KTuner Starter 21 Dual Tune 2, TunerView logs. Civic X (FC/FK) and Hondata are cross-check evidence only, never card numbers. Vocabulary in `CONTEXT.md`; product limits in `PRODUCT.md` (never ignition / knock / protection tables, never promise power, đăng kiểm warning; the ignition limit is under review in Datalog step method); caps in `data/thresholds.json` (`boost_ceiling_psi` 21 — replaced by proof-gated Boost steps, see Boost after downpipe — `boost_raise_min_rpm` 3,000, `boost_step_max` 1, one family per Flash); tables in `data/ktuner-maps-digitized.json` (39, no pedal / wastegate / torque-limit tables).
Today's downpipe behaviour: `knowledge/cards/kc-p0420.md` (only card), `engine/kta-car.js` carDiagnose spool → downpipe step and carFlashPlan B2 trim, `engine/kta-build.js` dpCat / catless / map24 items, `docs/research/tuner-play-panel.md` Play B, `server/kta_server/desk.py` car-change, `profile.py` PARTS.
Skills every session should consult: `research` for external sources (forums via `https://r.jina.ai/<url>`; Reddit excluded on purpose; see `docs/research/owner-voices.md`), `grilling` + `domain-modeling` for decision tickets.
Standing preferences: the owner asked on 2026-10-09 to carry implementation into the map (fix-spec waves); engine decides numbers and cells, cards teach; every fact cross-checked against two independent sources, vendor claims labelled as vendor claims; PM gates: one source per table, full value story, expectations managed (no power the turbo or fuel doesn't have).

Research findings: the `research/*` branches named in tickets were deleted 2026-10-11; their files live in `research/<name>.md` next to this map, and the tracked summary is `docs/research/downpipe-power-research.md`.

## Decisions so far

<!-- one line per closed ticket: gist + link -->
- [Log evidence](issues/05-log-evidence.md) — EWG position logged, headroom "small" everywhere, no 21 psi pulls, spool rpm unmeasurable today; 5 drift points incl. phantom 3,250 rpm row and B2 cells/peaks mismatch.
- [KTuner response tables](issues/04-ktuner-response-tables.md) — response/lag live in Quick Adjustment dropdowns (Throttle Control, Turbo Responsiveness, Turbo Ramp), not in our 39 tables; no pedal/torque/wastegate tables for this car; lag provable via TPS→90 % target time + EWG.
- [Power fundamentals](issues/01-power-fundamentals.md) — only air makes power; fuel follows (λ0.75 on purpose), spark knock-capped on RON95 E10 (≈ 89–91 AKI), torque limiter not exposed; 5 card wordings to fix.
- [Downpipe effects](issues/02-downpipe-effects.md) — gain small and vendor-only (+12 whp untuned 200-cell), spool 200–400 rpm sooner; owner already runs a downpipe and the wastegate still sits at 2.5 % → no new headroom; 400-cell = no CEL, VN test is tailpipe + MIL, not OBD monitors.
- [Tuner practice](issues/03-tuner-practice.md) — no Honda tuner changes anything for a downpipe on the stock turbo; 21 psi cap and 3,000 rpm rule hold; extra power only via custom e-tune (ignition + boost, outside product); KTuner/TSP one source (IMW).
- [Front A/F sensor location](issues/12-front-af-sensor-location.md) — front A/F threads into the turbo outlet (high confidence); downpipe flange leaks hit the rear O2 / P0420, never the A/F → engine diagnosis, Play B, dpCat and kc-p0420 wording wrong.
- [Boost after downpipe](issues/06-boost-after-downpipe.md) — no fixed 21 psi cap: proof-gated +1 psi Boost steps ≥ 3,000 rpm up to Final Boost Target peak (≈ 23), 24 psi only as a vendor file; B2 trim rows from measured overshoot; no fuel/spark change; kc-expectations stance kept.
- [Fuel and slot strategy](issues/15-fuel-slot-strategy.md) — no boost raise for RON97; slots switch boost only, not ignition; RON97 pays only in heat (≤ 1.6°), proven by a hot matched pair at ≤ 5,200 rpm; fuel test reads the wrong Knock Control peak.
- [Datalog boost method](issues/13-datalog-boost-method.md) — tuners share a method, not numbers; D1 shape holds; knock-retard gate dead → timing achieved vs last proven; add EWG, target-moved, rail pressure; overshoot ≤ 1.5; today's hot drive already fails (KC 0.64) → ladder closed on RON95 now.
- [Ignition from datalog](issues/14-ignition-from-datalog.md) — ECU never exceeds Ignition Base, only removes; car already at KC floor; "+2/+5 %" unsafe (percent retards boost cells, unprovable); pros add only on a dyno; sound DIY = degree removal where KC rises; Starter ignition good enough; no load channel blocks any ignition lever.
- [Boost target gap](issues/17-boost-target-gap.md) — no table caps it: throttle dampening + fixed ramp hold the target, owner's pulls are part-pedal and short; a +1 psi edit shows only on a floored ≥ 4–5 s pull; TPS = pedal, so the engine's full-throttle gate is wrong.
- [Quick Adjustments screenshot](issues/11-quick-adjustments-screenshot.md) — all Factory (throttle, ramp, turbo responsiveness); boost targets per Tune 1/2/3; Early Spool off; artificial KC rise on; P0420 on, P2096/7 off; IAT retard 4.5° at 50 °C.
- [Response and lag](issues/07-response-and-lag.md) — teach-only; lag measured (pedal ≥ 85 % → 90 % target, with EWG); one Quick Adjustment step only if the ramp, not the turbo, is the limit; Early Spool stays off.
- [Catted vs catless](issues/08-catted-catless-subtype.md) — profile records pipe class; 400-cell is the pick; same tune response for all; kc-p0420 corrected; pre-install questions answered from cards; leak diagnosis moved to rear-O2 path.
- [Spool proof signal](issues/10-spool-proof-signal.md) — per floored pull: spoolRpm (15 psi), lagS, EWG; ≥ 2 matched pulls each side; today none.
- [Datalog step method](issues/16-datalog-step-method.md) — ignition adding stays out, removal teach-only; Boost step gates amended (proof pull, target-moved, EWG, timing vs proven, rail, overshoot ≤ 1.5); lever order log → fuel → B2 → step → response; steps go to Tune 2 for slot A/B.
- [Fix-spec synthesis](issues/09-fix-spec-synthesis.md) — fix-spec.md: owner-goal table + Wave 1 (knowledge, build/text/routing, engine core) and Wave 2 (Boost step on Tune 2, thresholds, mapcheck, ADR).

## Status

Destination reached 2026-10-11: fix-spec Waves 1 and 2 merged (commits 248d37a … 918f816); engine 236/236, server 317/317.

## Not yet specified

- How the chat routes pre-install questions ("what will change if I add a downpipe?") that today fall into the `boost` no-drive gate — depends on which cards exist and whether the part subtype is recorded.
- Eval coverage: downpipe owner queries for `server/eval` / scorecard (`owner-queries.md`), once the card set and answers are known.
- Vietnamese owner voices (Otofun, Facebook groups) on downpipes and đăng kiểm — still the biggest source gap; may graduate into a research ticket if the synthesis finds VN-specific claims unverified.

- How a vendor 24 psi file (TSP Map 3 / Phearable L3) enters the app — as a KTuner basemap / new Map version the gates then read — and what the Build ladder item says before the owner buys it.

- Logger setup for step proof: which TunerView channels the owner must add (AFM Hz, a calculated-load channel, final boost target, rail pressure) so a log row maps to a table cell — graduates once Boost target gap says what proves the target.

## Out of scope

- Writing cards into `knowledge/cards/` and changing engine / server code — happens after handoff from the fix-spec.
- Civic X (FC/FK) as a supported car, Si / Type R, big-turbo builds (`bigTurbo` stays `notForThisCar`).
- Knock-sensitivity and protection-table edits (Final Boost Target, Cylinder Fill, Boost By Gear) — product limit, not reopened. Ignition was here; the owner reopened it on 2026-10-05 for research → [Datalog step method](issues/16-datalog-step-method.md).
- Helping disable emissions monitors to pass inspection — `kc-p0420` stance stands.

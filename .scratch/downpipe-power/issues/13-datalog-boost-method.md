Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

How do professional tuners add and remove boost **from datalogs** (not from guesses or forum numbers) on a turbo DI engine, and specifically on Honda 1.5T with KTuner / Hondata? Cover:
- step size (psi or %);
- which rpm and load cells;
- which log channels decide (boost vs target, wastegate position or duty, knock retard per cylinder, Honda Knock Control learned value, IAT and charge temp, AFR vs command, fuel pressure, timing achieved vs table);
- the pass and back-off thresholds each tuner uses;
- how many pulls and conditions (gear, ambient, heat soak);
- how they handle a turbo that can't reach target vs one that overshoots;
- Boost By Gear and Final Boost Target arbitration;
- when they stop.
Sources: HP Academy, Hondata and KTuner docs or knowledge base, TSP / Phearable / IWM / CAPTS / 27WON write-ups, CivicX/CivicXI tuner posts (via r.jina.ai; no Reddit), and general remap practice.

Then audit the gates decided in [Boost after downpipe](06-boost-after-downpipe.md) D1 against that practice:
- undershoot ≤ 1.5;
- overshoot ≤ 2.5;
- knock retard ≤ 1.0°;
- Knock Control ≤ 0.56;
- AFR never leaner than 12.0;
- trims within ±5 %;
- Cool drive + hot drive.
Say where those gates are too loose, too tight or missing a channel, and read `engine/kta-engine.js` `KTA.LIMITS` plus the nine `data/example-*.js` drives to say which channels this owner's logs actually carry. Don't settle on the first answer: test our gates against at least three independent tuner methods.

## Answer

Findings: branch `research/datalog-boost-method` (commit 48760c4), file `.scratch/downpipe-power/research/datalog-boost-method.md`.

Sources: HP Academy, Hondata (FlashPro help, Type R note) and IMW/TSP (KTuner = IMW, one source); Phearable for its process only. The 9 drives were measured with the engine's `readLog` / `checkDrive`.

- **No Honda tuner publishes boost thresholds; they share a method:**
  - one small step at a time, repeated pulls;
  - boost read together with the wastegate, knock read as a trend;
  - pulls right after a Flash or while heat-soaked thrown out;
  - stop when more boost costs timing.

  D1's shape matches it (+1 psi, rows ≥ 3,000 rpm, cool + hot proof, undo on first fail). Our numbers are labelled judgement.
- **Gate audit:**
  - **Knock retard ≤ 1° → dead gate.** The logs carry one Knock Retard column, which the ECU schedules from Knock Control (5–6° under boost every time). Replace it with *ignition achieved vs the last proven Map version*: a drop > 1° = stop.
  - **Undershoot → also read EWG Position.** Undershoot with the wastegate at 0 = turbo at its limit or a boost leak (Hondata): undo, never step again.
  - **Add:** the logged boost target actually moved. Today it peaks at 19.2 psi at full throttle against a 21 psi table.
  - **Overshoot → tighten to ≤ 1.5 psi.** New target + measured overshoot must stay ≤ 24 psi, the highest any vendor file has run on this car.
  - **Knock Control 0.56 → keep the number.** Read it only once settled after a Flash, only ≤ 5,200 rpm, and require no rise vs the last proven version.
  - **AFR never leaner than 12.0 → keep.** Add fuel rail pressure ≥ 90 % of target (in the logs, 97–99 % today).
  - **Trims → keep**, as a check that the log is valid only.
- **Missing channels:** per-cylinder knock retard, AFR command, fuel status, AFM Hz, pump duty. Add AFM Hz to the TunerView layout before any step.
- **Today:** the hot drive (aug30-1601) rises 0.49 → 0.64 Knock Control (Watch), so D1 fails on today's map. On RON95 E10 the ladder is closed now, until fuel or heat changes. Tell the owner that as today's result, not a forecast.
- **Wastegate:** reads 0 when closed; 2.4–3.7 % at full throttle from 3,500 rpm. It never sits at 0 while on target, so the turbo is not over-speeding by Hondata's test, but it is close to closed.
- **Pulls cover what is edited:** edit only the full-throttle columns the proof pulls log. At least 2 pulls in the same gear, from ≤ 3,000 to ≥ 5,000 rpm (span = judgement).
- **Open:** why the logged target tops at 19.2 vs the table's 21 (throttle damping, ramp, heat/knock limiter?) → [Boost target gap](17-boost-target-gap.md).

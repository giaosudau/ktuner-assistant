# 02 — Evidence-based limits

**What to build:** Every safety line uses the limits from `docs/research/fact-check.md`, and says in its *Why?* what the limit is based on.
- **Fuel-quality score:** judged by the timing it costs under boost, 10.2° × (score − Baseline), with the Baseline at 0.49 until ticket 03 learns it.
  - Watch ≥ 0.7° (0.56); Watch "No hard driving until it drops" ≥ 1.3° held over 60 s (0.62); Stop ≥ 3.2° (0.80, labelled provisional).
  - The score line says "under boost your score costs about X° of timing" when X ≥ 0.5°.
- **Mixture:** only at boost ≥ 12 psi, against the Map's full-load target: Watch 0.5 AFR leaner, Stop 1.0 leaner. The Stop says "the fuel asked for isn't arriving".
- **Heat:** intake heat goes no higher than Watch. CVT ≥ 100 °C and coolant ≥ 105 °C are Stop, labelled provisional.
- **Torque check removed.** A CVT slip check is added at Watch only: revs rise more than 250 rpm in 0.33 s while speed gains under 1 km/h, under boost.
- **Numbers that are never shown:** a change smaller than a channel's logged step (Knock Retard 0.5°, ignition 1°); "timing lost while lugging" when it's negative or rests on under 30 s.
- **The app's own Fact check and Build path** no longer say Starter 21 has "no knock margin" on E10.
- **"Should I add fuel for E10?"** is answered with the owner's own numbers: λ under boost vs target, and the median cruise trim.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent
**Status:** done (limits + basis + slip + text; suite 92/92 with car/ask/build)

- [x] Aug 30 16:01: Watch on the Fuel-quality score (ends 0.64 ≈ 1.5°), not "No hard driving"; the line shows "costs about 1.5° of timing under boost".
- [x] Sep 1 08:13: OK, with no timing-cost line.
- [x] Aug 22 09:50 (intake 64 °C, score 0.50): Watch on heat, not Stop. Committed as a compressed fixture.
- [x] All 16 drives (local check): no mixture Watch or Stop (10.1–10.7 against 11.0); CVT slip 0 events.
- [x] A synthetic drive at 12.0 AFR held 0.3 s at ≥ 12 psi → Stop; at 12.5 AFR and 6 psi → no mixture line.
- [x] Every safety line's *Why?* shows its basis in one line: from your data / from Honda or KTuner / physics / our judgement / provisional ("provisional: not yet seen on your car").
- [x] No torque line appears on any drive.
- [x] The Fact check and Build path text match `fact-check.md` §1 and §4.
- [x] New wording in English and Tiếng Việt.

Notes: "no hard driving" fires only when a drive STARTS at 0.62+ and holds it 60 s+ (a score earned mid-drive, like 16:01's climb, keeps its plain Watch — the sentence "until it drops" is about a pre-existing elevation). Timing cost = 10.2° × (end − Baseline 0.49), shown from 0.5°. Mixture Watch is median-based, Stop is held-based. `Why?` basis rides on every check (`c.basis` + `drive.basisLine` EN/VI) ready for the story track to render. fuelCheck habit still fires at 0.65; timeline line moved to the 0.56 Watch.

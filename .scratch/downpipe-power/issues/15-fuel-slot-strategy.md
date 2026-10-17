Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

The owner has a downpipe, a PRL HVI intake, RON97 premium fuel available, KTuner on-the-fly map switching and dual maps (Dual Boost Targets with the ECO button). What do the best tuners do with that combination?

Cover:
- slot strategy: one slot per fuel, a hot-day slot vs a cool-day slot, a valet / ECO slot;
- what changes between a RON95 E10 slot and a RON97 slot: boost, timing, nothing;
- how KTuner Starter 21 / TSP / Phearable / Hondata treat 93 vs 91 octane and E-blends;
- how to prove a premium-fuel gain from logs (Knock Control, timing achieved, matched drives) before raising anything;
- what is safe and what isn't: switching slots mid-drive, tank mixing, ethanol content, heat.

Ground every answer in what a log can prove.

Read:
- `engine/` premium-fuel test (`KTA.carFuelTest`);
- `knowledge/cards/kc-fuel-test.md`, `kc-e10.md`, `kc-e10-trim-baseline.md`;
- `knowledge/proposed/kp-how-ktuner-on-the-fly-map-switching-works.md`, `kp-how-ktuner-picks-between-the-dual-boost-targets.md`;
- the Map slot / Fuel tag terms in `CONTEXT.md`;
- `.claude/worktrees/*/.scratch/downpipe-power/research/ktuner-response-tables.md`, if present, or `git show research/ktuner-response-tables:.scratch/downpipe-power/research/ktuner-response-tables.md`.

Flag conflicts with them. Sources: KTuner help / product pages, Hondata, TSP, Phearable, 27WON / PRL, CivicX/CivicXI (r.jina.ai), Vietnamese fuel specs (Petrolimex RON95-III / RON97 / E10 standards). No Reddit.

## Answer

Findings: branch `research/fuel-slot-strategy` (commit ae14bba), file `.scratch/downpipe-power/research/fuel-slot-strategy.md` (strategy table, safe/unsafe list, 10 repo conflicts).
- **Don't raise boost for RON97.** No tuner does it on the stock-turbo non-Si: TSP, Phearable and KTuner run the same boost on 91 and 93. Hondata's 93 file changes ignition only (Type R forum analysis, cross-check only).
- **KTuner slots switch only boost targets and responsiveness, not ignition** (KTuner help). The ECU harvests octane by slowly re-learning Knock Control.
- **On this map RON97 can pay off only in heat.** Cool drives already sit at Knock Control 0.49 (the floor of the channel; timing is map-limited). The ceiling is the ≈ 1.6° that heat costs at 0.65, not extra cool-day power.
- **Proof:**
  - a settled tank (not right after a Flash, when Knock Control starts ≈ 0.59);
  - a hot matched pair: same slot, ECO state and route, intake within 8 °C;
  - read Knock Control, knock retard and ignition at ≤ 5,200 rpm only;
  - more than 0.5° better on RON97 = gain, else none.
- **Slots:**
  - Slot 1 = Starter 21 Dual Tune 2, proven on RON95; the car starts in it when the device is unplugged.
  - Slots 2 and 3 stay identical.
  - ECO (18 psi) is the map for hot days or unknown fuel.
- **VN fuel:**
  - Petrolimex lists only E10 RON95-III, E10 RON95-V and E5 RON92.
  - Plain RON95 and RON97 left the market on 1 Jun 2026; E10 RON97-III is sold only by smaller retailers.
  - E10 = 8–10 % ethanol.
  - RON95 ≈ 90 AKI by Hondata's conversion, at or below the 91 vendor minimum.
- **KTuner action: none.** App fixes:
  - `KTA.carFuelTest` compares the raw Knock Control `peak` (verified kta-engine.js:1199; the judged ≤ 5,200 rpm peak sits beside it at :1200). It should read `judgedPeak`.
  - It accepts cool pairs, which can never differ; require a hot pair.
  - It has no settled-tank check.
  - Fuel tags lack E10 RON95-V. The "E10 RON97 III" wording in `kc-fuel-test`, `CONTEXT.md`, `PRODUCT.md` and `README.md` needs the retailer caveat.
  - `kc-e10` "≈ US 91" → ≈ 90.
  - The two `kp-` proposals on map switching and dual boost can become cards (both KTuner pages now read).
- Gaps: no KTuner or Hondata 91-vs-93 statement for the 22+ non-Si; QCVN 01:2022 E10 octane table paywalled.

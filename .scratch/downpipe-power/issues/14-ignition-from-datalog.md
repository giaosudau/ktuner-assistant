Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

How do tuners decide when to add or remove ignition timing from datalogs on the Honda 1.5T DI turbo (KTuner / Hondata), and is the owner's idea (try +2 % or +5 % and see what happens) sound?

Cover:
- how Honda's ignition logic works on this engine: Ignition Base vs Ignition Max tables, Knock Control learned value, per-cylinder knock retard, ethanol adjust, and how the ECU already advances toward Max when fuel allows;
- what a street tuner reads, and the thresholds they use: knock retard, timing achieved vs table, Knock Control trend, IAT;
- step size in degrees vs percent, and why;
- which cells (rpm × load), and how many pulls;
- MBT vs knock-limited on RON95 E10 vs RON97;
- LSPI at low rpm and high load;
- the limits of the factory knock sensor (false knock, CVT noise);
- whether a street tune without a dyno is sound;
- how pros back off.

Then test the owner's percent idea against at least three independent tuner methods: % or degrees, where it is safe, what it misses (e.g. the ECU may already be at Max, so adding table timing changes nothing, or knock control just pulls it back).

Answer: are the KTuner Starter ignition tables "good enough", and how are they built (dyno, per fuel)? What do Hondata and KTuner say about editing them? What are Phearable / TSP / IWM / CAPTS doing differently?

Read the owner's file: `Ignition_Base_*`, `Ignition_Max_*` and `Ethanol_Ign_Adj_*` in `data/ktuner-maps-digitized.json`. Read `docs/research/fact-check.md` and `kc-ignition-formula.md`, the knock / timing channels in `data/example-*.js`, and `engine/kta-engine.js` knock / kControl limits. Report which timing channels exist and what the 9 drives show (timing achieved vs Max, knock retard events). Sources: HP Academy, Hondata KB, KTuner help, tuner write-ups, CivicX/CivicXI (r.jina.ai), SAE / engineering texts. No Reddit.

## Answer

Findings: branch `research/ignition-from-datalog` (commit 484ade9), file `.scratch/downpipe-power/research/ignition-from-datalog.md`. Sources: Hondata "Knock control tables" help, KTuner help, HP Academy, Pro Civic, Phearable/TSP; the 9 drives measured.

- **Honda logic** (Hondata = KTuner formula: `min(MBT, MBT + KIL − KR×KC)`):
  - the ECU never runs more timing than Ignition Base; it only removes, via the slow global Knock Control score;
  - on RON95 E10 this car sits at the 0.49 floor under boost, so the table *is* the timing;
  - the logged ~5° Knock Retard is scheduled, not knock;
  - Ignition Max (rpm × EGR, medium confidence) sits ~14° above the timing run under boost and never limits;
  - Ethanol Ign Adj needs a flex sensor.
- **Owner's "+2 % / +5 %": unsafe as worded.**
  - Percent *retards* the negative boosted cells (−0.08° at +5 %) and adds ~1° in cruise cells already near ideal.
  - "See what happens" can't be seen: no dyno, logs rounded to 0.5°/1°, no load channel, no per-cylinder knock.
  - All pros work in degrees, add only with dyno proof and keep 2–3° from knock; on the street they remove.
- **Sound DIY move = the reverse:** a degree-based removal where Knock Control rises repeatably, plus RON97 in heat. Adding timing = a custom e-tune (dyno, load channel, knock audio, better fuel).
- **KTuner Starter ignition:** reportedly Honda's own dyno-built map (for 90–100 RON), left conservative. Good enough and safe for RON95 E10, not maximum power. Pros differ by dyno, per-fuel files, hidden knock-control tables (not in the owner's file, not reachable per a KTuner rep) and custom WOT-log revisions. None uses percent.
- **9 drives:**
  - only 5 short WOT pulls (8.5 s) and no knock event beyond the schedule; score rises come from heat and lugging, not WOT;
  - 22 rows log more retard than scheduled (20 part-throttle boost at 2,223–2,562 rpm, 2 throttle-lift at ~5,050), none real knock.
- **Blocking gap for any ignition lever:** the Base load axis isn't digitized and no calculated-load channel is logged, so a row can't be matched to a cell.
- `KTA.LIMITS.knock` (worst cylinder) can't act: the logs have no per-cylinder channel.
- **Stance proposed:** ignition stays no-edit for adding. [Datalog step method](16-datalog-step-method.md) may make degree-based removal a proof-gated lever once a load channel exists.
- **Open:**
  - FE Starter 21 vs factory ignition;
  - Base load-axis units and `_L/_H` meaning (cam vs octane);
  - whether the FE has the > 5,200 rpm KC rise;
  - no IWM / CAPTS write-up found;
  - the LSPI source is a patent excerpt;
  - forum evidence is Civic X only.

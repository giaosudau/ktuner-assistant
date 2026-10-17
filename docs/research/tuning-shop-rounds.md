# How a tuning shop runs a car: rounds, not one shot

*16 Oct 2026. Feeds `knowledge/playbook.md` (the shop round in the knowledge graph). Primary sources
first; a vendor page is a vendor page, a review is one owner. Everything about this car is in
`drive-check-tuner-analysis.md` and `fact-check.md`; this note adds only how the work is paced.*

## §1. The e-tune loop is the industry's remote shop

- A KTuner/Hondata e-tune vendor describes the service as: the tuner sends a **starter map**, asks
  the owner to **record a datalog and email it back**, makes **revisions** and sends them back, and
  "this process is repeated until your tune is perfected". No dyno needed.
  ([Two Step Performance / IMW e-Tune](https://twostepperformance.com/products/e-tune-for-ktuner-or-hondata-email-tuning-service), read 16 Oct 2026)
- Same page: standard service replies **within 5–10 business days** per revision, priority **within
  1 business day**; standard tune listed at **$499.99**.
- One verified review on that page (one owner, bolt-ons, stock turbo, stock fuel): **about seven
  revisions over 8 weeks**; by the last revisions the weather had turned too cold to record valid
  full-throttle logs. *One car, one shop — context, not a rule.*

**What it means here.** A tune is a loop of Flash → log → read → revise, several times. The slow
part is the round trip and **conditions changing between logs** (heat, fuel, season). This app's
round trip is one upload, and it compares like with like (Cool drive vs Cool drive, `kc-heat-soak`).

## §2. Confirming a tune is datalogging

- HP Academy (Practical Standalone Tuning, "Using Datalogging"): it is hard to pinpoint where in the
  map the mixture was wrong while driving, so **datalogging is an essential element of confirming a
  tune**; review the log when stationary; many ECUs show which part of the map was in use at each
  point of the log. ([HP Academy](https://hpacademy.com/courses/practical-standalone-tuning/step-10-confirming-a-tune-on-the-road-track-using-datalogging), read 16 Oct 2026)
- KTuner gives the same tools: Graph (when), map tracing (where), lambda overlay (measured vs target,
  cell by cell), scatter (why), on-board logging with activation windows (`ktuner-only-tuning.md` §1,
  from KTuner Help).

## §3. The order and the pace

- Order of reading every log: usable log → safety → air before fuel → fuel against target → spark is
  the ECU's job → boost (`ktuner-only-tuning.md` §2; card `kc-tune-order`). HP Academy's full-power
  module also tunes fuelling first and returns to ignition after (search summary, not read in full).
- Pace: **one change, one reflash, one log under the same conditions** (`ktuner-only-tuning.md` §2
  step 8; card `kc-tune-one-thing`). Community practice adds a revision note after each drive
  (forum advice, not a primary source).
- Priority on this car, ranked by what each check protects: engine first, then CVT, then power, then
  fun (`drive-check-tuner-analysis.md` §4, with this car's numbers).

## §4. What KTuner can and can't do (for the shop's plan)

| KTuner can | KTuner can't (or this app won't) | Source |
|---|---|---|
| Hold three tunes in one map, switch on the fly; tunes differ only in boost targets and Turbo Responsiveness | Make a second tune with different ignition or fuel | `kc-map-switching` (KTuner Help) |
| Pick a MAF Scaling preset per intake housing, or a custom curve | Fix a preset mismatch by bending fuel targets | `kc-maf-housing`, `kc-trim-cause` |
| Show final timing = table + limitation − Knock Control × retard table | Show best timing from a street log | `kc-ignition-formula`, `kc-table-ignition` |
| Turn the catalyst monitor off | Make that pass an OBD inspection | `kc-p0420` |
| Change throttle and spool in Quick Adjustments | Do it through map tables | `kc-quick-adjustments` |
| Log on-board without a laptop | Log a load axis the app can map to columns today | `knowledge-graph-panel.md` §1 |

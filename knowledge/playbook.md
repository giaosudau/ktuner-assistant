# The shop round

How this shop tunes a car: rounds of Flash, log, read and revise, the way an e-tune shop works
(`docs/research/tuning-shop-rounds.md` §1), each round read in the order of `kc-tune-order`.
Numbers live in the cards and `data/thresholds.json`; this file names the steps, links them, and
says why each comes where it does.

The knowledge graph reads this file (`tools/knowledge-graph.py`): `### <id>: <title>` starts a stage
or a car trait, each `key: a, b` line links it to cards, terms, families, thresholds or code, and
the paragraph is what a reader learns. Every id must exist, or the build fails.

## Stages

### intake: Take the car in
next: log
cards: kc-expectations, kc-power-sources, kc-maf-housing, kc-downpipe
terms: Car profile, Install, Goal
code: server/kta_server/profile.py, server/kta_server/desk.py, engine/kta-build.js
source: docs/research/owner-voices.md §1
A shop writes the car down before it touches the map: parts fitted, intake housing, fuel, basemap,
what the owner wants. It sets expectations first: on this basemap the turbo has little headroom
left, so the early rounds buy safety and consistency, not power.

### log: Log a Drive the shop can read
next: read
cards: kc-drive-brief, kc-log-gate
terms: Drive, Logger setup, Cool drive
code: engine/kta-drive.js
source: docs/research/drive-check-tuner-analysis.md §4
Every round starts with a log taken the way the shop asks: every gauge the shop reads turned on,
the fastest rate, a warm engine, pulls on a cool morning when boost is the question. A log that
skips this costs a round.

### read: Is the log usable?
next: safety (usable), log (log again)
channels: time, rpm, vss
cards: kc-log-gate, kc-misfire-gauges
terms: Too-short drive, Wasted drive
code: engine/kta-drive.js, server/kta_server/window.py
source: docs/research/ktuner-only-tuning.md §2
Gate zero. A short drive, a slow rate or a stuck gauge settles nothing, so the shop says what to
fix in the logger and asks for the drive again instead of guessing.

### safety: Safety first
next: undo (Stop), airflow (OK or Watch)
channels: afr, afrCmd, kControl, knock, fp, fpTarget, iat, ect, cvt, boost
cards: kc-tune-order, kc-ranges, kc-trims, kc-after-flash, kc-heat-soak, kc-cvt
terms: Fuel-quality score (Knock Control), Unexplained change, Safety channel
thresholds: boost_step_gates
code: engine/kta-engine.js, engine/kta-car.js
source: docs/research/drive-check-tuner-analysis.md §4
Before any change: anything lean under boost, a step up in Knock Control, fuel pressure under
target, or heat. Ranked by what it protects: the engine first, then the CVT, then power. A Stop
ends the round here.

### undo: Undo first
next: prove
cards: kc-trim-cause, kc-shakedown
terms: Map version, Flash
code: server/kta_server/flash_routes.py
source: docs/research/fact-check.md §6
When a Stop follows a Flash, the cheapest proven fix is the file that ran before it. Flash it back,
then find the cause.

### airflow: Air before fuel
next: mixture (trims fine), plan (trims off)
channels: mafHz, mafGs, stft, ltft, loop
cards: kc-trims, kc-trim-cause, kc-maf-housing, kc-table-maf, kc-maf-data-rules
families: airflow
thresholds: maf_step_max_pct, maf_curve_rising
code: engine/kta-car.js
source: docs/research/ktuner-only-tuning.md §2
Trims against airflow show whether the airflow table matches the intake. Wrong everywhere right
after a part or a Flash points to the preset for the housing; never fix a scaling error with fuel
targets.

### mixture: Fuel against its target under boost
next: spark
channels: afr, afrCmd, map, pedal
cards: kc-rich-wot, kc-table-wot, kc-wot-lean-timing, kc-open-loop-wot, kc-e10
families: mixture
thresholds: wot_target_band, wot_pairs
code: engine/kta-engine.js
source: docs/research/fact-check.md §6
Full-throttle mixture is judged against the map's own target, cell by cell. Richer than asked is
the safe side on E10 in the heat; leaning it for power can cost timing instead.

### spark: Spark is the ECU's job
next: boost
channels: ign, knock, kControl, iat
cards: kc-table-ignition, kc-ignition-formula, kc-timing-percent, kc-high-rpm, kc-iat-retard
families: ignition, knock
thresholds: forbidden_tables
source: docs/research/ktuner-only-tuning.md §1
Ignition and knock sensitivity are read, never edited on the street. Rising Knock Control means
less margin; the remedy is fuel, heat or boost, not more timing.

### boost: Boost last, one proven step
next: plan
channels: boost, boostTarget, wgPos, wgTarget, pedal, rpm
cards: kc-boost-step, kc-table-boost, kc-expectations, kc-dual-boost-targets, kc-map-switching
families: boost
thresholds: boost_step_gates, boost_step_max, boost_ceiling_psi, boost_pairs, boost_raise_min_rpm
code: engine/kta-car.js
source: docs/research/downpipe-power-research.md §8
Boost comes last because every earlier stage must hold under it. A raise is one small step on the
second tune only, offered only after floored pulls on a Cool drive and a hot drive pass every gate,
so switching tunes undoes it.

### plan: One change: the Flash plan
next: flash
cards: kc-tune-one-thing, kc-tune-order
terms: Flash plan, Open step
thresholds: one_family_per_flash, editable_tables, forbidden_tables
code: engine/kta-car.js, server/kta_server/flash.py, server/kta_server/mapcheck.py, server/kta_server/tour.py
source: docs/research/ktuner-only-tuning.md §2
One family per Flash, the earliest in tune order that needs it. The engine writes the cells; two
independent checks pass them before the owner sees them. "No map change" is a plan too.

### flash: Flash and confirm
next: prove
cards: kc-after-flash
terms: Flash, Flash readback, Map version
code: server/kta_server/flash_routes.py, server/kta_server/readback.py
source: docs/research/tuner-play-panel.md
The owner types the cells into KTuner, flashes, and confirms. The next log is read back against
the plan, so a typo or a missed table shows up before it is judged.

### prove: Prove it, like for like
next: keep (gates pass), undo (a gate fails)
cards: kc-shakedown, kc-drive-brief, kc-after-flash
terms: Shakedown drive, Drives to proof, Next step
code: engine/kta-car.js
source: docs/research/tuning-shop-rounds.md §1
A calm Shakedown drive first, then the drive the change needs, under the same conditions as the
one before it. Weather and fuel move between logs; comparing unlike drives is how e-tunes lose
weeks.

### keep: Keep it, then the next round
next: log (next round)
cards: kc-tune-one-thing, kc-boost-step
terms: Map version, Car history
code: engine/kta-car.js, server/kta_server/loopstate.py
source: docs/research/tuning-shop-rounds.md §1
A proven change becomes the new Map version and the Baseline moves with it. The round ends; the
next one starts from a fresh log. Rounds stop when the logs ask nothing more of the map.

## Car traits

### heat: Heat soak and hot intake air
affects: safety, boost, prove
channels: iat, iat2
cards: kc-heat-soak, kc-iat-retard, kc-iat2-side
terms: Hot restart, Cool drive
source: docs/research/drive-check-tuner-analysis.md §4
Hot traffic and restarts soak the intake; timing comes out on a schedule before any knock. Judge
power and boost on Cool drives, and treat a hot drive as the stress test.

### cvt: The CVT
affects: safety, boost
channels: cvt
cards: kc-cvt
source: docs/research/fact-check.md §3
CVT care is heat management; the ECU's own torque limiter protects it. Fluid temperature and slip
are read every drive; hard pulls wait for a cool gearbox.

### fuel: Vietnam E10 RON95
affects: mixture, spark, boost
channels: kControl, ethanol
cards: kc-e10, kc-fuel-test, kc-rich-wot, kc-expectations
source: docs/research/fact-check.md §1
E10 needs no extra fuel and no trim offset. Octane sets the knock margin, so fuel is tested tank
against tank by Knock Control, never by feel.

### lugging: Lugging and oil
affects: safety
channels: rpm, map
cards: kc-oil
source: docs/research/drive-check-tuner-analysis.md §4
Low revs under real load are what raise Knock Control in traffic. A habit to change and an oil
grade to keep, not a map change.

### logger: The logger and its gauges
affects: log, read
cards: kc-log-gate, kc-misfire-gauges, kc-drive-brief
terms: Logger setup
source: docs/research/drive-check-tuner-analysis.md §4
The shop can only judge what was logged. Missing channels make gates read Can't tell; a flat
channel wastes the drive.

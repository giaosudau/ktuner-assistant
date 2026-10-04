# Civic FE Tune Assist

A companion for one owner tuning one car (Civic FE 1.5T CVT, KTuner, Vietnam E10 RON95): it reads the owner's drives, judges safety, and names one thing to do next.

## Language

### Drives and history

**Drive**:
One TunerView log of one trip, identified by its start time.
_Avoid_: log, session, run (when meaning the whole trip)

**Car history**:
The remembered summary of every drive the owner has checked, in time order, used to see this car change over time.
_Avoid_: dashboard, trends, database

**History file**:
One file the owner exports and imports holding the Car history and every Flash; the only copy of Flash records outside the browser.
_Avoid_: backup, sync, save

**Hidden drive**:
A drive the owner has left out of the Car history (lent car, idle test, logger fault); its log is untouched and it never sets the Baseline.
_Avoid_: deleted drive

**Unexplained change**:
A jump against the Car history (trims, boost target, or a high starting Fuel-quality score) with no Flash recorded to explain it.
_Avoid_: anomaly, alert

**Flash**:
A change of map written to the ECU, recorded by the owner with a date, the map name and what changed (AFM preset, boost, fuel, other).
_Avoid_: tune (as an event), update, upload

**Flash plan**:
The single set of map changes proposed for the next Flash: one table family, with evidence, proof and undo; it can also be "Undo" or "no change".
_Avoid_: edit plan, tune plan, change list, stage

**Map**:
The calibration file on the ECU. A drive's map is the Map version active when it started; it is never guessed from the log.
_Avoid_: tune, basemap (except for KTuner's shipped starting maps), mode

**Shakedown drive**:
The first drive after a Flash, during which hard driving waits until a calm stretch shows the new map is measuring air and fuel correctly.
_Avoid_: test drive, break-in

**Cool drive**:
A drive with intake air under 42 °C while moving; the only kind that can set the Baseline.
_Avoid_: good drive, normal drive

**Hot restart**:
A drive started within 30 minutes of the previous one with the intake already at 50 °C or more.
_Avoid_: heat soak (that is the cause, not the drive)

**Key moment**:
A point in a drive worth the owner's attention (a Stop starting, a score step, a hard pull, lugging, a hot restart), shown with its clock time.
_Avoid_: event, highlight, incident

**Too-short drive**:
A drive with under 60 s of moving; it gets no verdict and stays out of the Car history.

### The car

**Car profile**:
The owner's one car as the app knows it: model, transmission, fuel, climate, the parts fitted, and the KTuner basemap it started from.
_Avoid_: garage, vehicle settings, account

**Install**:
A part fitted to or removed from the car, recorded with its date; like a Flash, it explains a change in the drives that follow.
_Avoid_: mod (that is the part itself), upgrade

### The loop

**Next step**:
The one thing the app asks of the owner after each Drive: a Flash (from the Flash plan), a gauge to watch, a drive to log, or nothing; it always names the drive whose upload will settle it.
_Avoid_: recommendation, suggestion, action item, task

**Open step**:
A Next step still waiting for the Drive that proves or disproves it.
_Avoid_: ask, pending item, todo

**Drives to proof**:
The number of Drives from the moment a Next step is given to the Drive that settles it; fewer is the product's win.
_Avoid_: loop count, iterations, cycles

**Wasted drive**:
A Drive that could settle none of the Open steps: too short, the wrong conditions (hot when the step needs cool), or a logger fault.
_Avoid_: bad log, useless drive

**Map version**:
One numbered copy of the Map's tables kept by the app: the first is the map the owner gave the app, and each Flash plan the owner confirms flashing becomes the next one.
_Avoid_: revision, tune version, file version

**Flash readback**:
The check, on the first Drive after a Flash, that what the ECU runs matches the Map version that was planned (logged boost targets against the changed cells, trims against the MAF Scaling choice); a mismatch means the Flash is not credited.
_Avoid_: verification, confirmation, flash check

**KTuner basemap**:
One of KTuner's shipped starting maps (this car: Starter 21 Dual Tune 2); reverting to it makes it the active Map version.
_Avoid_: stock map, base tune, default map

### Safety

**Fuel-quality score (Knock Control)**:
The ECU's learned knock margin for the current fuel and heat; 0.49 is the best it can read, and higher means timing is pulled everywhere.
_Avoid_: knock, knock count, K-con (alone), knock retard

**Verdict**:
One of four words for a safety line or a whole drive: **OK**, **Watch**, **Stop**, **Can't tell**. **Stop** means danger to the engine or CVT now, never a broken procedure. "No hard driving" is a Watch with that sentence, not a fifth word.
_Avoid_: good, warn, fail, pass, nodata

**Safety channel**:
One of the four channels a safe verdict cannot do without: mixture, fuel trims, Fuel-quality score, fuel pressure. If one is flat or missing, the drive's verdict is Can't tell.

**Timing pulled**:
The degrees of ignition timing the ECU removes because of the Fuel-quality score, shown against this car's normal.
_Avoid_: knock retard (that's the channel name), knock, timing loss

**Baseline**:
This car's own normal value for a measure, judged from its cool drives; limits are set as distance from the baseline, not from forum numbers.
_Avoid_: normal range, default, community limit

### The shop

**Round**:
One turn of the shop's loop: log the brief, read it, change and flash, prove it with the next log. Rounds are counted from Flashes (Round N = Flashes so far + 1), not from the Map version number, because an Undo returns to an earlier version.
_Avoid_: iteration, cycle, session

**Drive brief**:
The drive the shop asks for, written as a customer brief: where and when, warm-up, the cruise for trims, the pulls (gear mode, from what speed, how far, the break between), how long, which gauges and how fast to log, and the checkpoints the log will be read against.
_Avoid_: recipe (that's one step's list), instructions, procedure

**Log checkpoints**:
After an upload, whether the log met the Drive brief, one line each: logging rate, moving time, every gauge moving, AFR Command and MAF Hz logged, engine warm, cool intake, two pulls, pull-start intake. Met, not met, or can't say.
_Avoid_: log quality score, gate (inside replies)

**Health report**:
The engine's checks of a Drive grouped by system (Fuel, Air & boost, Spark, Heat, CVT), each with its value and Verdict word.
_Avoid_: dashboard, diagnostics, scan

**Map tour**:
The whole map at a high level, family by family in the order a tuner works (airflow, full-throttle mixture, boost, ignition, knock sensitivity, left to the basemap), each with its status this Round: this round, locked (why, and what unlocks it), no change needed, or read-only.
_Avoid_: map overview, table list

**Read-only table**:
A table the assistant reads and explains but never proposes a value for (ignition, knock sensitivity, and the tables left to the basemap).
_Avoid_: locked table (Locked means "not this round, here's what unlocks it")

**Fuel tag**:
The fuel in the tank when a log was recorded (E10 RON95 III or E10 RON97 III), chosen by the owner when attaching the log.
_Avoid_: fuel setting, octane mode

**Premium-fuel test**:
The comparison of two fuels on matched Drives (both with hard pulls, intake within 8 °C, same Map slot) by the Fuel-quality score and the timing it costs; a gap of 0.5° or less is inside KTuner's logging step, so no measurable difference.
_Avoid_: fuel A/B, octane test

**Map slot**:
Which of the maps KTuner can switch between on the fly a Drive ran on, chosen by the owner when attaching the log. Drives on different slots are never compared.
_Avoid_: map mode, profile, preset (that's a MAF Scaling choice)

**Knowledge proposal**:
A fact the assistant needed but no knowledge card holds; recorded for review in `knowledge/proposed/` instead of being stated, and never cited until a reviewer sources it into a card.
_Avoid_: learned fact, memory

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
The calibration file on the ECU. A drive's map is the one from the latest Flash before it started; with no Flash recorded it is "not recorded", never guessed from the log.
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

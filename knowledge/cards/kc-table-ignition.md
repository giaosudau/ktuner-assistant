---
id: kc-table-ignition
title: Ignition tables: read them, don't add timing on the street
kind: rule
topics: ignition, timing, spark, knock, tables, ktuner
applies-when: The owner asks about ignition, timing or knock-sensitivity tables, or asks for more timing.
status: current
source-doc: docs/research/e10-ignition-boost-simple-tune.md
source-section: §2; ktuner-only-tuning.md §1
numbers:
- ign-step-min: 1 deg
- ign-step: 2 deg
---
Ignition Base (Low and High cam) is the main spark map by rpm and load; Ignition Max is a ceiling; Ethanol Ign Adj adds timing for ethanol; the Knock Sens tables set how sensitive knock detection is. KTuner's own formula: final timing is the ignition table plus the knock limit, minus the timing Knock Control pulls. Best timing can't be seen from a street log, so the street rule is: start from a professional basemap, log Knock Control trends over several pulls, and only ever remove timing, in steps of 1 to 2 degrees, where retard collects. Never add timing or lower knock sensitivity without a dyno. This app reads these tables but doesn't edit them.

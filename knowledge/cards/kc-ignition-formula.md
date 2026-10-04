---
id: kc-ignition-formula
title: How the ECU sets final ignition, with KTuner's own example
kind: ktuner-howto
topics: ignition, retard, formula, tables, ktuner, datalog
applies-when: The owner asks how timing is decided, why Actual Ign is lower than the table, or what Knock Retard means.
status: current
source-doc: docs/research/ktuner-help-pages.md
source-section: §1
numbers:
- ign-table-example: 21 deg
- ign-limit-example: 2 deg
- ign-sum-example: 23 deg
- kc-example: 0.38 score
- retard-table-example: 10 deg
- retard-example: 3.8 deg
- retard-logged-example: 3.5 deg
- final-example: 19.2 deg
- final-logged-example: 19 deg
---
KTuner's help gives the rule: ignition table plus knock ignition limitation, minus knock retard, is the final timing, and the ECU uses the lesser of that and the table, so it never runs more than the table. Knock retard is Knock Control times the knock retard table. Their example: 21 plus 2 is 23 degrees; Knock Control 0.38 times a table value of 10 is 3.8 degrees of retard, so the final is 19.2. The log rounds both: retard shows as 3.5 and ignition as 19. So follow three gauges together, Actual Ign, Knock Control and Knock Retard, and never read meaning into a half-degree change. Intake-temperature corrections can also ride in the knock limit in the background.

---
id: kc-timing-percent
title: Should I add 2 or 5 percent timing?
kind: owner-question
topics: ignition, timing, spark, percent, knock
applies-when: The owner asks to add timing by a percentage, or to try more timing and see what happens.
status: current
source-doc: docs/research/downpipe-power-research.md
source-section: §5
numbers:
- pct-small: 2 %
- pct-large: 5 %
- kc-floor: 0.49 score
- base-negative-cells: 150 count
- boosted-cell-change-5pct: 0.08 deg
- cruise-cell-change-5pct: 1.05 deg
- knock-margin-lo: 2 deg
- knock-margin-hi: 3 deg
---
No. Honda's ECU never runs more timing than Ignition Base; it only takes timing away through Knock Control, and on E10 RON95 this car already sits at the 0.49 floor under boost, so the table is the timing. A percent works the wrong way here: Ignition Base holds 150 negative cells, the high-load ones where boost lives, and plus 5 percent makes them more negative, about 0.08 degrees less on a typical boosted cell, while it adds about 1 degree in cruise cells that are already near ideal. Every tuner works in degrees and adds timing only on a dyno, keeping 2 to 3 degrees from knock. On the street the sound move is the reverse: remove timing in degrees where Knock Control rises repeatably. That stays teach-only here until a load channel is logged.

---
id: kc-open-loop-wot
title: Under boost the trims stop correcting the mixture
kind: fact
topics: mixture, trims, open-loop, closed-loop, maf, afm, wot, fuel
applies-when: The owner asks why trims look fine but full-throttle mixture is off, or what open loop means.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §3
numbers:
- ol-start-psi: 8 psi
- ol-full-psi: 12 psi
---
On this car it is confirmed from the logs: short-term trim reads exactly zero on every warm row at 12 psi and above, and on nearly all from about 8 psi, while lower down it moves as normal. So under boost the ECU runs open loop: the trims neither correct the mixture nor say anything about the airflow curve there, and only the airflow calibration (MAF Scaling) and the map's target decide it. An airflow correction uses only rows below about 8 psi, where the trims are live. Judge full-throttle mixture against AFR Command, the value the ECU actually asked for, which can differ from the table. Read the loop state from the trims, never from a status number alone.

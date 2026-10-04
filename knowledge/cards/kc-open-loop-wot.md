---
id: kc-open-loop-wot
title: At full throttle the trims may stop correcting the mixture
kind: fact
topics: mixture, trims, open-loop, closed-loop, maf, afm, wot, fuel
applies-when: The owner asks why trims look fine but full-throttle mixture is off, or what open loop means.
status: current
source-doc: docs/research/forum-afr-maf-research.md
source-section: §1 claims 1 and 2
numbers:
---
On the earlier-generation Civic 1.5T, owners report that ECUs sold outside the US go open loop at full throttle: short-term trim sits flat at zero, so the trims cannot correct the mixture there and only the airflow calibration (MAF Scaling) decides it. US ECUs stay in closed loop longer. It has not been confirmed for this car's ECU, so read it on your own log: if short-term trim is flat at zero under boost, full-throttle mixture is open loop, and your cruise trims say nothing about it. Then judge the measured mixture against AFR Command, the value the ECU actually asked for, which can differ from the table. Read the loop state from the trims, never from a status number alone.

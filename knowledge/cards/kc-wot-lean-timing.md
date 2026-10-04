---
id: kc-wot-lean-timing
title: Leaning the full-throttle mixture can cost timing, not add power
kind: fact
topics: mixture, wot, afr, ignition, timing, power, e10
applies-when: The owner asks to lean the full-throttle target for power, or why the mixture lever is locked.
status: current
source-doc: docs/research/forum-afr-maf-research.md
source-section: §1 claim 4
numbers:
- lean-pull: 11.5 AFR
- sweet-lo: 11 AFR
- sweet-hi: 11.2 AFR
---
An owner who calibrated his own 1.5T found that running full-throttle mixture near or past 11.5 made the ECU pull timing hard, so it lost power instead of gaining it; 11 to 11.2 worked best on his car. That is one car, not a rule, but it is the same direction this car's data points: no gain shown from leaning, and a real risk. That is why the shop keeps the full-throttle mixture target where the basemap has it. What would change that is a log with AFR Command, the car healthy in heat, and a like-for-like proof drive.

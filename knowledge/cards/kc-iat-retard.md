---
id: kc-iat-retard
title: Why hot intake air costs power: IAT Ignition
kind: fact
topics: heat, iat, ignition, timing, power
applies-when: The owner asks why the car feels slower when hot, or what intake temperature does to timing.
status: current
source-doc: docs/research/downpipe-power-research.md
source-section: §7
numbers:
- iat-free-max: 40 °C
- iat-mid: 50 °C
- iat-hot: 90 °C
- iat-high-load-mid: 4.5 deg
- iat-high-load-hot: 9 deg
- iat-low-load-mid: 1 deg
- iat-low-load-hot: 3 deg
---
Hot intake air costs timing on a schedule, before any knock. This map's IAT Ignition High Load (Retard) takes nothing up to 40 °C, 4.5 degrees at 50 °C and 9 degrees at 90 °C and above; at low load it takes 1 to 3 degrees. KTuner applies it through the knock limit, so it can take up to that much as the air heats, and on E10 RON95 Knock Control rises in heat and pulls more on top. That is why a heat-soaked pull makes less power on the same map, and why the cure is cooler intake air and a few calm minutes after a hot stop, not a map change.

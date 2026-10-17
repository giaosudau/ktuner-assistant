---
id: kc-high-rpm
title: Score rises above 5,200 rpm do not count while the artificial rise is on
kind: fact
topics: knock, rpm
applies-when: A Drive shows Fuel-quality score rises at high revs.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §3
numbers:
- high-rpm-from: 5200 rpm
- forced-rise-cost: 2 deg
---
Non-Si ECUs raise Knock Control on purpose above about 5,200 rpm. KTuner can remove it with Quick Enables, Eliminate Artificial Knock Control Rise; on this car's Starter map that box is off, so the rise is present, and the Car profile records the box. While it is off, those rises say nothing about fuel quality or heat and are excluded from fuel and heat verdicts; the forced rise costs about 2 degrees only at the top of a pull. If the box is ever ticked, a rise up there is real knock and counts like any other. This owner rarely revs past 5,200 rpm. Judge the tank by what the score does in normal driving and in traffic, where heat and lugging are the real movers.

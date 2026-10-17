---
id: kc-iat2-side
title: IAT is after the intercooler, IAT2 before the turbo
kind: fact
topics: heat, iat, iat2, intercooler, sensors, gauges
applies-when: The owner asks what IAT2 measures, or a reply would judge the intercooler from IAT2.
status: current
source-doc: docs/research/fact-check.md
source-section: §4
numbers:
- ic-added-lo: 2.0 °C
- ic-added-hi: 6.0 °C
---
On this car IAT is the manifold air after the intercooler and IAT2 the inlet air before the turbo. Under boost IAT reads 2 to 6 °C above IAT2, which only works that way round, and KTuner's gauge names and owners of the same engine label them the same. So the intercooler is judged by IAT minus IAT2 under boost: a gap that grows over back-to-back pulls means it is saturating. Some owners report other ECUs of this engine the other way round, so on a new car check the sign of the gap before trusting it.

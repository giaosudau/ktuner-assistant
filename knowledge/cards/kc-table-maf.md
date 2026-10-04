---
id: kc-table-maf
title: The airflow (MAF Scaling) table comes first
kind: ktuner-howto
topics: maf, afm, airflow, trims, tables, ktuner, intake
applies-when: Trims are off, an intake was fitted, or the owner asks what MAF Scaling does.
status: current
source-doc: docs/research/afr-tuning-research.md
source-section: §2 Step A and §3
numbers:
- maf-points: 103 points
- maf-good: 5 %
- maf-normal: 10 %
---
MAF Scaling turns the airflow sensor's frequency into grams of air, over 103 points. Every fuel calculation starts from it, which is why tuners fix airflow before anything else. Presets exist per intake housing: Factory, and Race presets for the larger housings; Custom is the one you edit. A tuner corrects it from steady part-throttle trims, bin by bin, applying only part of the correction each round and keeping the curve smooth, then flashes and logs again until trims sit within about 5 percent. Up to about 10 percent is commonly called normal; beyond that the table, or the preset, is wrong.

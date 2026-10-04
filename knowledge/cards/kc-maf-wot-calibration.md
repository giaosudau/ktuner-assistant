---
id: kc-maf-wot-calibration
title: How tuners correct the full-throttle end of the airflow curve
kind: ktuner-howto
topics: maf, afm, airflow, mixture, wot, calibration, tables, ktuner
applies-when: The owner asks how to correct MAF from a CSV, or full-throttle mixture is far from AFR Command.
status: current
source-doc: docs/research/forum-afr-maf-research.md
source-section: §1 claim 3 and §3
numbers:
- maf-step: 2 %
- afr-margin: 0.2 AFR
- afr-too-rich: 10.5 AFR
---
At full throttle the airflow table is corrected against AFR Command, not against trims. Log several full-throttle pulls in the same gear mode at the same intake temperature, with AFR Command and MAF Hz logged. Where the measured mixture is leaner than commanded, the points covering that airflow read too little air; where it is richer, too much. Change only those points, by about 2 % per round, keep the curve smooth, flash, and log the same pulls again. Stop when the mixture sits a little richer than commanded, about 0.2 AFR. Richer than 10.5 means the points are too high. One owner's numbers are never copied to another car, and a blind fixed cut to the top of the curve is not a calibration. Done wrong, this leans the engine at full load, so the shop checks every point before you flash.

---
id: kc-table-wot
title: WOT Enrich is the full-throttle mixture target
kind: ktuner-howto
topics: afr, mixture, lambda, wot, tables, ktuner
applies-when: The owner asks about AFR, lambda or WOT Enrich, or a mixture change is in the plan.
status: current
source-doc: docs/research/afr-tuning-research.md
source-section: §2 Step C and §3
numbers:
- wot-target-top: 11.0 AFR
- wot-step-max: 0.2 AFR
- trims-gate: 5 %
---
WOT Enrich (KTuner calls it Nominal Lambda for Component Protection) holds the mixture the ECU aims for, by rpm and load, Low and High cam. Cruise and light load stay at 14.7 for the catalyst; the highest load columns ask 11.0. It is a target, not a fix: change it only after the airflow table is right, with trims within 5 percent, and in steps of 0.2 AFR or less, watching Knock Control on every pull. Leaner at full throttle trades knock and exhaust heat margin for a little power; richer than asked is safe. Low and High are changed together.

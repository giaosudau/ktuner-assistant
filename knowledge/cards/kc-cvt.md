---
id: kc-cvt
title: CVT care is heat management, not a torque number
kind: rule
topics: cvt, heat
applies-when: Any reply that judges CVT fluid temperature, slip, or hard driving in heat.
status: current
source-doc: docs/research/fact-check.md
source-section: §3; downpipe-power-research.md §1
numbers:
- cvt-fluid-watch: 90 °C
- cvt-fluid-stop: 100 °C
- cvt-peak: 95 °C
- slip-events: 0 count
- hcf-spec: 2 spec
---
The old keep-torque-under-a-number warning is removed: the app sets no torque number for this car, but the ECU's own factory torque limiter still protects the CVT and can pull boost back. What the logs can judge is fluid heat and slip. Watch starts at 90 °C of fluid temperature, and Stop at 100 °C is provisional, not yet seen on this car, whose peak is 95 °C. No pulls with the fluid at or above 90 °C, and never brake-launch: failures owners report come from launching and heavy low-end torque, not from steady pulls. Slip shows as revs jumping without speed, with zero such events across all drives here. The fluid is the Honda HCF-2 grade, changed on the severe schedule on a tuned car in hot traffic.

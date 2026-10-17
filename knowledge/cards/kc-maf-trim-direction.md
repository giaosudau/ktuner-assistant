---
id: kc-maf-trim-direction
title: Which way a trim moves the airflow curve
kind: ktuner-howto
topics: maf, afm, airflow, trims, calibration
applies-when: The owner asks how to correct MAF Scaling from a CSV, or which way a trim points.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §4
numbers:
- ol-start-psi: 8 psi
---
A positive trim means the ECU added fuel because it measured too little air, so the airflow points covering that airflow move up by about that percent; a negative trim moves them down. Average the trims at each point over warm, steady driving, and throw away the rows where you lift off or coast, which read zero or spike, and the first seconds after a throttle change. Reach the higher points with a slow, steady roll-on, not a stab. Apply part of the correction, keep the curve rising, flash, and log again. On this car only rows below about 8 psi count: above that the trims freeze. Owners and KTuner staff describe the same method.

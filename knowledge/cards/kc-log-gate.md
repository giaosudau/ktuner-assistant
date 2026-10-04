---
id: kc-log-gate
title: Is the log good enough to read?
kind: rule
topics: logging, quality, gauges, tunerview
applies-when: Every upload, before any verdict; when a log settles nothing.
status: current
source-doc: docs/research/drive-check-tuner-analysis.md
source-section: §4 Gate 0
numbers:
- gate-rate: 10 Hz
- gate-moving: 10 min
---
A tuner checks the log before the car. Four things make a log readable: a fast enough rate (10 samples a second or more), at least 10 minutes of moving time, no gauge stuck on one number while the revs move, and AFR Command and MAF Hz in the gauge list. Without AFR Command the mixture can only be judged against the map's target, not what the ECU actually asked for; without MAF Hz the airflow sensor's headroom can't be checked. A log that misses the gate is not a failure of the car: fix the logger and drive the brief again.

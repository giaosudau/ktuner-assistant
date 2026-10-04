---
id: kc-maf-data-rules
title: What a log needs before the airflow curve can be corrected
kind: rule
topics: maf, afm, airflow, trims, calibration, log, drive
applies-when: Before any MAF Scaling change, or the owner asks how much driving a MAF correction needs.
status: current
source-doc: docs/research/forum-afr-maf-research.md
source-section: §3
numbers:
- cl-cruise: 30 min
- cl-slow: 15 min
---
A MAF correction is only as good as the samples behind each point. The method MAF tools use: an engine fully warm, intake temperature steady, throttle smooth, and the rows around sudden throttle changes, stops and loop transitions thrown away. Each point is corrected from the trims logged at that airflow, averaged so one odd moment can't move it, and a point with too few samples is left alone. The usual guide is at least 30 min of steady cruising, as much mixed driving, and 15 min of slow driving across rounds. Smooth the result once, lightly. Fix part throttle first, then full throttle. Expect two or three rounds: nobody nails it in one shot.

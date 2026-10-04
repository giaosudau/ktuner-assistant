---
id: kc-tune-order
title: The order a tuner works in
kind: rule
topics: tuning, order, safety, airflow, fuel, ignition, boost
applies-when: Before any map change, and when the owner asks why one table comes before another.
status: current
source-doc: docs/research/ktuner-only-tuning.md
source-section: §2
---
Every log is read in the same order. First, is the log usable. Second, safety: anything lean under boost, a step up in Knock Control, fuel pressure under target, or heat — stop and find the cause. Third, air before fuel: trims against airflow show whether the airflow table matches the intake; never fix a scaling error with fuel targets. Fourth, fuel against its target under boost. Spark is the ECU's job: rising Knock Control means less margin, and the remedy is fuel, heat or boost, not more timing on the street. Then boost, actual against target. One change, one reflash, one log under the same conditions.

---
id: kc-table-boost
title: The boost tables in KTuner
kind: ktuner-howto
topics: boost, turbo, tables, ktuner, map
applies-when: The owner asks what a boost table does, wants more boost, or a boost change is in the plan.
status: current
source-doc: docs/research/e10-ignition-boost-simple-tune.md
source-section: §3
numbers:
- boost-plateau-map: 21 psi
- boost-plateau-rpm: 4000 rpm
- final-boost-top: 23.4 psi
---
The three Boost Target tables (Normal and ECO, each Low and High cam) are rpm by load tables of the boost the ECU aims for; on this map Normal plateaus at 21 psi from 4,000 rpm, and ECO keeps factory-like boost. Final Boost Target is the target after the ECU arbitrates, topping out near 23.4. Boost By Gear Limits is flat, so no gear limit is active. Cylinder Fill Limitation caps air per cylinder: this ECU is torque-based, so raising boost alone can be blocked by fill or torque limits. Low-rpm torque is what hurts the CVT, so good maps keep boost down there. Change the paired tables together.

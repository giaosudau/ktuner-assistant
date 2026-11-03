---
id: kc-table-boost
title: The boost tables in KTuner
kind: ktuner-howto
topics: boost, turbo, tables, ktuner, map
applies-when: The owner asks what a boost table does, wants more boost, or a boost change is in the plan.
status: current
source-doc: docs/research/e10-ignition-boost-simple-tune.md
source-section: §3; downpipe-power-research.md §1 and §6; ktuner-community-knowledge.md §2; plateau row from data/ktuner-maps-digitized.json: Boost_Target_1/2/3_Normal_L and _H are identical, rpm axis 550…6600, first row reaching 21.0 psi is 3500 (rows 2500 max 15.0, 2750 max 17.0, 3000 max 19.0, 3500 to 6600 max 21.0), matching ktuner-community-knowledge.md §5 and §9
numbers:
- boost-plateau-map: 21 psi
- boost-plateau-rpm: 3500 rpm
- final-boost-top: 23.4 psi
- logged-target-max: 19.2 psi
---
Each of the three tunes has its own Boost Target tables, Normal and ECO, each Low and High cam: rpm by load tables of the boost the ECU aims for. On this map Normal plateaus at 21 psi from 3,500 rpm, ECO keeps factory-like boost, and as digitized the three tunes hold the same values. Final Boost Target is the target after the ECU arbitrates, topping out near 23.4. Boost By Gear Limits is flat, so no gear limit is active. The logged target follows the pedal and climbs over seconds; it never passed 19.2 psi, but no pull had the pedal floored (the Calibration drive). Cylinder Fill Limitation is a knock safeguard; the everyday cap is the factory torque limiter, which KTuner does not expose. Low-rpm torque is what hurts the CVT, so good maps keep boost down there. Change the paired tables together.

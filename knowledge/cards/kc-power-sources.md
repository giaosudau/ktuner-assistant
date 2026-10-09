---
id: kc-power-sources
title: More air, more fire, more fuel? Where power comes from
kind: fact
topics: power, torque, boost, fuel, ignition, air
applies-when: The owner asks how to make more power or torque, or asks for more fuel, more timing or more boost.
status: current
source-doc: docs/research/downpipe-power-research.md
source-section: §1
numbers:
- best-power-lambda-lo: 0.82 lambda
- best-power-lambda-hi: 0.85 lambda
- map-target-lambda: 0.75 lambda
---
Only air makes power. Torque follows the mass of air trapped in each cylinder, and boost is a pressure, not a flow. Fuel follows air: best power sits near lambda 0.82 to 0.85, and this map asks 0.75 on purpose to cool the charge against knock and keep turbine heat down, so more fuel adds nothing and leaner is wrong on hot E10 RON95. Spark is capped by knock before its best point on pump fuel, so more boost on this fuel forces timing out: about the same power, more heat. Honda's ECU is torque-based: the pedal asks for torque, the ECU sets boost and throttle, and its factory torque limiter caps the result to protect the CVT. A downpipe makes the same air cheaper to get; it does not lift that cap.

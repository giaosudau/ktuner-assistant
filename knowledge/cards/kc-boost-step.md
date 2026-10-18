---
id: kc-boost-step
title: More boost, one proven step at a time
kind: play
topics: boost, step, proof, datalog, turbo
applies-when: The owner asks for more boost, or asks how a boost raise would be proven.
status: current
source-doc: docs/research/downpipe-power-research.md
source-section: §8
numbers:
- step-psi: 1 psi
- tune-two: 2 tune
- rows-lo: 3500 rpm
- rows-hi: 4500 rpm
- final-target-top: 23.4 psi
- ktuner-safe-psi: 21 psi
- pedal-floored: 85 %
- floored-lo: 100 %
- floored-hi: 113 %
- tps-max-logged: 94 %
- hold-s: 4 s
- under-over-max: 1.5 psi
- total-max: 24 psi
- timing-drop-max: 1 deg
- kc-watch: 0.56 score
- kc-judged-rpm: 5200 rpm
- afr-lean-max: 12.0 AFR
- rail-min: 90 %
---
A Boost step adds 1 psi to Boost Target 2 Normal, Low and High cam, 3,500 to 4,500 rpm rows, capped at the Final Boost Target peak, 23.4. A step past 21 psi exceeds what KTuner calls the safe point for the CVT and factory clutch. Only Tune 2 gets it; once proven it is copied. Offered when the latest Cool drive holds two floored pulls held 4 seconds above 3,500 rpm plus a passing hot drive. Floored is pedal 85 percent or more until a key-on reading sets it (these cars read 100 to 113; yours never passed 94). Gates: target moved; under- and overshoot held half a second within 1.5 psi, total at most 24; timing within 1 degree of the proven map; Knock Control settled, at most 0.56 below 5,200 rpm; mixture never leaner than 12.0; fuel pressure at least 90 percent. Any failure undoes it.

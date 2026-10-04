---
id: kc-fuel-test
title: Is premium fuel worth it? Test it tank against tank
kind: play
topics: fuel, ron97, ron95, e10, premium, knock, experiment
applies-when: The owner asks whether E10 RON97 III is worth it, or logs a drive on a different fuel.
status: current
source-doc: docs/research/owner-voices.md
source-section: §2 #7 and §4; ktuner-only-tuning.md §1; drive-check-tuner-analysis.md §4 #10
numbers:
- fuel-iat-match: 8 °C
- fuel-noise: 0.5 deg
---
Better fuel is judged by Knock Control, tank against tank, never by feel. Drive one tank of your usual E10 RON95 III and log the drive brief on it. Then run the tank low, fill E10 RON97 III, drive calmly until Knock Control settles, and log the same brief again, same route, same mode, the same map slot, with the intake within 8 °C of the first. Tag each log with its fuel when you attach it. If the timing Knock Control pulls differs by 0.5 degrees or less, that is inside KTuner's logging step: no measurable gain. A real gain shows as a lower Knock Control peak under the same pulls.

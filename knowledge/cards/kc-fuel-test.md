---
id: kc-fuel-test
title: Is premium fuel worth it? Test it tank against tank
kind: play
topics: fuel, ron97, ron95, e10, premium, knock, experiment
applies-when: The owner asks whether E10 RON97 III is worth it, or logs a drive on a different fuel.
status: current
source-doc: docs/research/downpipe-power-research.md
source-section: §5; owner-voices.md §2 #7 and §4; drive-check-tuner-analysis.md §4 #10
numbers:
- fuel-iat-match: 8 °C
- fuel-noise: 0.5 deg
- kc-floor: 0.49 score
- kc-judged-rpm: 5200 rpm
- cost-at-065: 1.6 °
---
Better fuel is judged by Knock Control, tank against tank, never by feel. Petrolimex sells no RON97; smaller retailers sell E10 RON97 III. On cool drives both fuels sit at the 0.49 floor, so only a hot pair can show a difference. Drive your usual E10 RON95 III until Knock Control settles, then log a hot drive. Run the tank low, fill E10 RON97 III, drive calmly until it settles again, and log the same hot drive: same route, same mode, same map slot, intake within 8 °C. Tag each log with its fuel. Read Knock Control and timing at or below 5,200 rpm only, because above that the ECU raises the score on purpose. A gap of 0.5 degrees or less is inside KTuner's logging step: no measurable gain. The most RON97 can win back is what heat costs, about 1.6 degrees.

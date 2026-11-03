---
id: kc-calibration-drive
title: Can more boost show? Why boost stops at 19.2 psi, and the Calibration drive
kind: play
topics: boost, more, ceiling, calibration, pedal, floored, psi, target
applies-when: The owner asks why boost stops at 19.2 psi or below 21, asks for more boost, or the ceiling read is not settled yet.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §2; .scratch/calibration-drive/spec.md C1, C2, C6, C7; plateau row from data/ktuner-maps-digitized.json: Boost_Target_1/2/3_Normal_L and _H are identical, rpm axis 550…6600, first row reaching 21.0 psi is 3500 (rows 2500 max 15.0, 2750 max 17.0, 3000 max 19.0, 3500 to 6600 max 21.0), matching ktuner-community-knowledge.md §5 and §9
numbers:
- logged-target-max: 19.2 psi
- normal-psi: 21 psi
- boost-plateau-rpm: 3500 rpm
- tps-max-logged: 94 %
- floored-lo: 100 %
- floored-hi: 113 %
- tune-two: 2 tune
- pull-held-min: 5 s
- rows-lo: 3500 rpm
- hold-s: 4 s
---
Your logged boost target never passed 19.2 psi on a map whose Normal table reaches 21 from 3,500 rpm. That is a part-pedal reading, not a ceiling: the target follows the pedal, and TPS never logged past 94 while a floored pedal reads 100 to 113 on these cars. The Calibration drive answers it once. Parked the evening before, key on, engine off: floor the pedal three times and type the highest TPS, your Pedal full reading, and say what TunerView can log. On a cool morning, Tune 2, ECO off: two pulls with the pedal all the way down, held 5 seconds or more, above 3,500 rpm for 4 seconds. The app reads the target against the table, TPS Command and the wastegate. Capped below the table: no map change. Reaching it: the Boost step gates decide. The drive adds no power itself.

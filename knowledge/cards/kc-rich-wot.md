---
id: kc-rich-wot
title: My full-throttle mixture reads richer than the map asks
kind: owner-question
topics: mixture, fuel, e10
applies-when: The owner asks whether a rich full-throttle reading is a fault, or blames E10.
status: current
source-doc: docs/research/drive-check-tuner-analysis.md
source-section: §4
numbers:
- map-target-afr: 11.0 AFR
- map-target-lambda: 0.75 lambda
- wot-afr-lo: 10.1 AFR
- wot-afr-hi: 10.7 AFR
- wot-lambda-lo: 0.69 lambda
- wot-lambda-hi: 0.73 lambda
- wot-lambda-target: 0.75 lambda
- mix-watch: 0.5 AFR
- mix-stop: 1.0 AFR
- mix-danger: 12.0 AFR
- mixture-rule-psi: 12 psi
- boosted-readings-max: 11.3 AFR
---
The map asks 11.0 at full load, which is 0.75 in lambda, and this car reads 10.1 to 10.7 there, or 0.69 to 0.73 against the 0.75 asked. Richer than asked is the safe side, not a fault, and every logged reading sits at 11.3 or richer. E10 does not make it lean: the sensor measures lambda whatever the fuel, and no fuel is added for E10. The mixture is judged at 12 psi and above, where the full-load target applies. Watch starts half an AFR leaner than asked, and danger starts at 12.0, a full AFR leaner. Without the live lambda command channel, lower-load cells with leaner targets stay out of the verdict.

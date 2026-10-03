---
id: kc-e10
title: E10 needs no extra fuel and no trim offset
kind: fact
topics: fuel, e10
applies-when: The owner asks about E10, fuel quality, or adding fuel for ethanol.
status: current
source-doc: docs/research/fact-check.md
source-section: §1
numbers:
- gasoline-stoich: 14.7 AFR
- ethanol-stoich: 9.0 AFR
- e10-stoich: 14.1 AFR
- e10-extra-fuel: 4.3 %
- e10-less-energy: 3.4 %
- vn95-us-aki: 91 AKI
- cruise-trim-median: -0.8 %
---
Pure gasoline burns at 14.7 and ethanol at 9.0, so E10 lands at 14.1 and needs about 4.3 percent more fuel by mass for the same lambda. The ECU delivers that itself: the front sensor and the trims in closed loop, the fuel model in open loop. E10 carries about 3.4 percent less energy per litre, so economy drops a little and nothing else changes. Vietnam RON95 is about US 91 by estimate, the floor KTuner asks for with its 91-and-up maps. Cruise trims sit near 0.8 percent negative on E10, so no E10 offset is ever written into the airflow curve, and WOT stays judged against the map's own target.

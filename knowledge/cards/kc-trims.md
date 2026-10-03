---
id: kc-trims
title: Trims within 5 percent are fine, beyond 10 is a Stop
kind: rule
topics: trims, mixture
applies-when: Any reply that judges fuel trims or air measurement.
status: current
source-doc: docs/research/fact-check.md
source-section: §6
numbers:
- trim-ok: 5 %
- trim-stop: 10 %
- cruise-trim-median: -0.8 %
- cruise-trim-p10: -3.1 %
- cruise-trim-p90: 1.6 %
- fault-trim-median: -28 %
---
Trims within 5 percent either way are fine, and beyond 10 percent either way is a Stop. On this car warm cruise trims sit at a median of 0.8 percent negative, with the middle band from 3.1 percent negative to 1.6 percent positive, all on E10, so there is no E10 offset to subtract. The one fault drive sat at 28 percent negative median total trim, far outside anything healthy. A Stop here means the ECU cannot measure air correctly, so hard driving waits until a calm drive shows trims back within 5 percent. The cause comes from the trim pattern, never from the size of the number alone.

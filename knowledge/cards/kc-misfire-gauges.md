---
id: kc-misfire-gauges
title: The Misfire and count gauges are not the ones to judge by
kind: owner-question
topics: misfire, gauges, log, knock
applies-when: The owner worries about a Knock Count or Misfire number in TunerView, or asks which gauge matters.
status: current
source-doc: docs/research/forum-afr-maf-research.md
source-section: §1 claim 6
numbers:
---
On the 1.5T, the Knock Count and Misfire gauges are not the ones to judge by. KTuner support told owners that the count is tied to misfire detection, and experienced owners ignore both on this platform. The number that matters is the Fuel-quality score: it is the ECU's learned margin, and it is what the shop reads. AFR Adj is not the mixture to watch either: watch the measured AFR against AFR Command. So a rising count on its own is no reason to buy spark plugs or change the map; a step up in the Fuel-quality score is.

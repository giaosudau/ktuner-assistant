---
id: kc-boost-codes
title: Boost codes P0046 and P0299, and what to log
kind: owner-question
topics: dtc, boost, wastegate, leak
applies-when: The owner reports P0046 or P0299, a limp with a dead pedal, or boost that misses target.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §4
numbers:
---
P0046 means the ECU can't hold the wastegate where it commands it. On this generation owners traced it to a sticking wastegate actuator, and to a pinhole leak in the vacuum line on the charge pipe; a new downpipe seemed to fix it only for a while. P0299 is underboost. In your log, compare EWG Position with EWG Target, and boost with its target: a position that doesn't follow its target points to the actuator; boost under target with the wastegate shut points to a leak or the turbo's limit. Fix the hardware first; no map change.

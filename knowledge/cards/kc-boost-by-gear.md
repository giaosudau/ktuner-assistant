---
id: kc-boost-by-gear
title: Boost By Gear Limits only limit, and yours are off
kind: ktuner-howto
topics: boost, tables, boost-by-gear, ktuner
applies-when: The owner asks about Boost By Gear, or how KTuner protects a CVT.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §4
numbers:
- bbg-off-value: 35.4 psi
---
Boost By Gear Limits is one table per gear, rpm by atmospheric pressure, and it only limits: wherever the boost table asks less, the table wins, so values above every target mean no limit. Your map holds 35.4 psi everywhere, so no gear limit is active. KTuner's own tool for sparing a CVT is a first-gear limit, and its quick settings offer flat or ramped versions. The app explains it and does not write this table, and which gear number your CVT reports to it is unconfirmed.

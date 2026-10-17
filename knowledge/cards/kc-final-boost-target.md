---
id: kc-final-boost-target
title: Final Boost Target passes the target through and caps it
kind: ktuner-howto
topics: boost, tables, final-boost-target, ktuner
applies-when: The owner asks what Final Boost Target does, or whether it limits boost.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §4
numbers:
- final-target-top: 23.4 psi
---
Final Boost Target takes the incoming target, from the boost table, the part-pedal target or the Boost By Gear limit, passes it nearly one to one, and caps it at its last column header. Raising that cap means changing the header and its whole column. On your map every column is the same in every rpm row and the top is 23.4 psi, so it passes your target through and is not what holds a pull below the table. The app explains it and never edits it.

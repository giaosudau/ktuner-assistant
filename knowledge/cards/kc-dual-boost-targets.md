---
id: kc-dual-boost-targets
title: How KTuner picks between the dual boost targets
kind: ktuner-howto
topics: eco, boost, mode, ktuner, heat
applies-when: The owner asks what the ECO button does to boost, or which boost table is in use.
status: current
source-doc: docs/research/downpipe-power-research.md
source-section: §6
numbers:
- eco-psi: 18 psi
- normal-psi: 21 psi
- dual-tune-name: 2 name
---
Dual Boost Targets With ECO Button gives each tune two boost tables: on the 1.5T the ECU uses Boost Target ECO while the ECO button is on and Boost Target Normal otherwise, so Sport runs the Normal table too. On Starter 21 Dual Tune 2 that is 18 psi in ECO and 21 psi in Normal. The button is the switch: no flash, no device. Use ECO on hot days, in traffic, or on fuel you don't trust. No log channel records ECO, so note it when you attach a log and compare only drives in the same mode.

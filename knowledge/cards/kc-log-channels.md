---
id: kc-log-channels
title: The gauges the shop reads, by their KTuner names
kind: ktuner-howto
topics: logging, tunerview, gauges, channels, datalog
applies-when: The owner asks which gauges to log, what a gauge abbreviation means, or why a log reads Can't tell.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §4
numbers:
---
KTuner's short gauge names and the CSV's long names are the same gauges. K.Cont is Knock Control, the Fuel-quality score; K.Ret is Knock Retard; A.Ignition is Ignition. TC.Target and TC.Press are Turbo Pressure Target and Turbo Pressure, read at the turbo before the throttle, while MAP is the manifold. EWG.Posi and EWG.Target are the wastegate; DIFPress and DIFP.Target are fuel pressure; Wideband is the O2 column. TPS is your foot on the pedal and TPS.C is TPS Command, the throttle plate. Log bank one trims only: a trim pinned at its lowest value is a wrong bank or a dead channel and reads Can't tell. Your logger already records all of these; still missing are AFR Command and MAF Hz, which the airflow and mixture checks need. Knock Count is a misfire count, not knock.

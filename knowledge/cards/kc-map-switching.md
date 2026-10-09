---
id: kc-map-switching
title: How KTuner on-the-fly map switching works
kind: ktuner-howto
topics: slot, tune, switching, boost, ktuner
applies-when: The owner asks about map slots, Tune 1, 2 or 3, or switching maps while driving.
status: current
source-doc: docs/research/downpipe-power-research.md
source-section: §6
numbers:
- tune-one: 1 tune
- tune-two: 2 tune
---
On The Fly Map Switching holds three tunes in one map. They differ only in boost targets and Turbo Responsiveness; ignition, fuel, knock and the throttle setting are shared by all three, so a tune cannot carry a fuel's timing. Switch with a long press of the cruise Cancel button; switching while moving is supported. With the KTuner device unplugged the car starts in Tune 1, so Tune 1 holds the proven map and a trial goes in Tune 2. As digitized, the three tunes on this map hold the same boost targets, so switching changes nothing yet. No log channel records the tune: tag each log with its map slot and switch only between logs.

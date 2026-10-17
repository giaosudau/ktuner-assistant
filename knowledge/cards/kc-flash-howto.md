---
id: kc-flash-howto
title: Flashing with KTuner: power, the key, and what is normal after
kind: ktuner-howto
topics: flash, recovery, cel, ktuner, help
applies-when: The owner is about to flash, a flash failed, or warning lights came on after a flash.
status: current
source-doc: docs/research/ktuner-community-knowledge.md
source-section: §4
numbers:
---
Put a battery charger on the car and power the V2 from a strong port: low voltage is what fails flashes. Ignition on, engine off, never running. When it finishes, key off for ten seconds, back on, and wait for flash successful. Warning lights during the flash are normal, and driver-assist warnings can stay until you have driven ten to fifteen minutes. A failed flash leaves the car unable to start: reconnect and accept recovery, which returns it to factory. A Recovery prompt while the engine runs means a loose cable: say no. Error codes right after a flash usually mean the wrong codebase: start the tune with the one that matches the unit info. If the V2 stops waking with the car, set CAN Gateway to Yes. Saving a tune to the V2 is not flashing it: the next log proves the change.

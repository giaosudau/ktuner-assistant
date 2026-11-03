---
id: kc-quick-adjustments
title: Throttle response and turbo lag live in Quick Adjustments
kind: ktuner-howto
topics: response, lag, throttle, spool, ktuner, quick-adjustments
applies-when: The owner asks for sharper throttle response, less turbo lag, or about Early Spool.
status: current
source-doc: docs/research/downpipe-power-research.md
source-section: §6; floored from ktuner-community-knowledge.md §3 (kc-boost-step row) and data/thresholds.json boost_step_gates.pedal_floored_ratio 0.9, replacing the ≥ 85 % TPS in downpipe-power-research.md §8
numbers:
- pedal-floored: 90 %
- boost-reached: 90 %
---
Response and lag live in KTuner's Quick Adjustments dropdowns, not map tables; on this car every level is Factory: Throttle Responsiveness, Boost Target Ramp Rate and each tune's Turbo Responsiveness. Throttle Responsiveness is pedal feel, not power: no log proves it, so it is your taste. For lag, a floored pull shows the cause: time from the pedal at 90 percent of your Pedal full reading to boost at 90 percent of target, read with the wastegate. If the target ramps slowly while the wastegate is still open, one level up on Turbo Responsiveness or Boost Target Ramp Rate can help, one change at a time, proven on matched pulls. If the wastegate is shut and boost still lags, that is the turbo, and no setting helps. Early Spool stays off: it adds low-rpm torque where the CVT and pre-ignition risk sit. The app explains these; it never writes them.

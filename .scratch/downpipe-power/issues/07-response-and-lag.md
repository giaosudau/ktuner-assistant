Type: grilling
Label: wayfinder:grilling
Status: resolved
Assignee: Chanh
Blocked by: 01-power-fundamentals, 04-ktuner-response-tables, 05-log-evidence, 11-quick-adjustments-screenshot

## Question

When the owner asks for throttle response and less turbo lag, what does the shop offer? Decide whether any KTuner lever (pedal map, wastegate, low-rpm boost, Sport mode / map switch) becomes a Flash-plan family, a teach-only card ("set it in KTuner yourself, here is why, here is the risk"), or "no map change" — given the 3,000 rpm boost-raise floor (LSPI, CVT low-rpm torque), tables absent from the file, and what a street log can prove.

## Answer

Decided from [KTuner response tables](04-ktuner-response-tables.md), [Boost target gap](17-boost-target-gap.md) and [Quick Adjustments screenshot](11-quick-adjustments-screenshot.md) (all Factory).
- **Teach-only, never a Flash-plan family.** The levers are KTuner dropdowns (Throttle Responsiveness, Boost Target Ramp Rate, Turbo Responsiveness per tune, Early Spool), not cells in the owner's file, and a pedal-map change has no log channel to prove it.
- **Lag is measured, then explained:**
  - lag = seconds from pedal (TPS) ≥ 85 % to boost ≥ 90 % of target, on a floored pull, read with EWG Position;
  - target ramping slowly while the wastegate is still open → software ramp: one Quick Adjustment one level up (Turbo Responsiveness for the tune in use, or Boost Target Ramp Rate), one change at a time, proven by the lag number on matched pulls;
  - wastegate shut and boost still lagging → physical spool: no setting helps.
- **Early Spool stays off.** It adds low-rpm boost/torque where the CVT and LSPI risk sit (`boost_raise_min_rpm` 3,000).
- **Throttle Responsiveness** (pedal feel) is the owner's taste: no power, nothing to prove. Said plainly.
- **Today:** no floored pull exists in the logs, so the app first asks for one in the Drive brief.

Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

Which KTuner tables and settings on the 22+ Civic 1.5T non-Si CVT govern throttle response and turbo lag, and which of them exist in the owner's file? Look for: accelerator pedal / drive-by-wire maps, torque request / torque limit tables, wastegate (EWG) target / feedforward / PID, boost-by-gear, Cylinder Fill Limitation, CVT ratio / launch / stall-related settings, Sport mode pedal maps, on-the-fly map switching. Compare with Hondata FlashPro equivalents for 10th gen. Then cross with `data/ktuner-maps-digitized.json` (39 tables, none of the pedal / wastegate / torque-limit kind) and `docs/research/ktuner-help-pages.md`.

Output: table of lever → KTuner name and path → in our file? → what it changes for response → risk on a CVT → whether a street log can prove it. AFK — call the Skill tool with "research".

## Answer

Findings: branch `research/ktuner-response-tables` (commit 0c0c4e9), file `.scratch/downpipe-power/research/ktuner-response-tables.md` (17-lever table, Hondata compare, sources).
- Response/lag on the 22+ 1.5T live in KTuner **Quick Adjustment dropdowns**, not tables: "Throttle Control Quick Adjustment", "Turbo Responsiveness Quick Adjustment", "Turbo Ramp Options" (v1.0.11.9), "Dual Boost Targets With ECO Button", "On The Fly Map Switching". None in our 39 tables; owner's current levels unknown.
- In-file tables touching response: Boost_Target_{1,2,3}_{Normal,ECO} (second axis vacuum → 21 psi = part-throttle targets), Final_Boost_Target (23.4 cap), Boost_By_Gear_Limits (35.4 flat, inactive), Cylinder_Fill_Limitation. Slots 1/2/3 identical as digitized → map switching changes no boost (verify in KTuner).
- No editable pedal map, torque-limit or wastegate FF/PID table documented for this car (DBW Maps "on available applications"; Torque Targets Per Mode is Type R; Hondata wastegate tables Type R / Integra Type S only). No CVT ratio/launch/stall setting in KTuner or Hondata; Hondata warns power-braking / > ~250 Nm hurts the CVT.
- Log can prove lag: time TPS Command ≥ 50 % → Turbo Pressure ≥ 90 % target, with EWG position: target ramping slow + EWG open = software ramp (Turbo Ramp / Responsiveness can help); EWG shut + pressure lagging = physical spool (no setting helps). Pedal-map / torque-limit changes not provable (no channels).
- Doc conflicts: `ktuner-only-tuning.md` treats Torque Targets Per Mode as general (Type R only); `drive-check-tuner-analysis.md` "map's torque limiter" is factory logic, not a table. Not reached: an 11th-gen-specific KTuner Quick Adjustment page (pages are 10th-gen).

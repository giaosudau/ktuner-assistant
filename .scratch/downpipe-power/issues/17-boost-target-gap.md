Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

Why does the logged boost target on this car never exceed 19.2 psi at full throttle, when Boost Target Normal holds 21 psi from 3,500–4,000 rpm and Final Boost Target tops out at 23.4? Until we know, a Boost step edit may never reach the car.

Candidates:
- the pulls never reach the rpm × load cells that hold 21 (the CVT keeps rpm low, or the load column isn't reached);
- KTuner throttle damping or Turbo Ramp;
- Final Boost Target arbitration;
- Cylinder Fill Limitation;
- Honda's built-in heat or knock boost limiter;
- ECO state or map slot;
- the IAT / ethanol boost adjust.

Method:
1. Locally, for each full-throttle sample in the nine `data/example-*.js` drives, find the rpm, TPS, load proxy, IAT, Knock Control and slot/ECO state when the target peaks.
2. Look up the matching cells in `Boost_Target_*_Normal_*`, `Final_Boost_Target_*`, `Ethanol_Boost_Target_Adj_*` and `Cylinder_Fill_Limitation_*` in `data/ktuner-maps-digitized.json`.
3. Back that with KTuner help pages (Final Boost Target, Dual Boost Targets, Turbo Responsiveness, Turbo Ramp) and Hondata docs on Honda's boost-target arbitration.

Answer which limiter holds the target, whether a Normal-table +1 psi would show in the log, and which TunerView channels would prove it. Read prior findings with `/usr/bin/git show research/datalog-boost-method:.scratch/downpipe-power/research/datalog-boost-method.md` and `research/ktuner-response-tables:...`. No Reddit; forums via r.jina.ai.

## Answer

Findings: branch `research/boost-target-gap` (commit a673d41), file `.scratch/downpipe-power/research/boost-target-gap.md` (per-pull table, candidate verdicts).
- **No table caps the target.** All 767 boosted samples at ≥ 2,500 rpm sat 1.8–8.5+ psi under the Normal table.
- **What holds it:** the factory throttle dampening plus the time ramp (KTuner "Boost Target Ramp Rate" / "Turbo Ramp"). The target follows the pedal and climbs ~1–2 psi/s at a steady pedal; it rose exactly +0.5 psi per 0.27 s step, a fixed rate.
- **The owner's pulls are part-pedal and short:** TPS 41–83 % at most peaks, never > 94; 1.0–3.5 s above 3,500 rpm, while 21 psi needs ~3–5 s.
- **Ruled out:**
  - Final Boost Target (passes through, ceiling 23.4);
  - ethanol adjust (all 0);
  - Boost By Gear (35.4 flat);
  - heat (the hot drive reached a higher target);
  - knock (KC 0.49–0.53);
  - map slot (slots identical);
  - ECO (ruled out for aug30-1529 only).
- **Unexplained:** a flat 16.3 psi cap at ≥ 5,000 rpm, pedal floored (aug22-0903). Factory torque limiter or Cylinder Fill; neither is logged, and Fill fits poorly.
- **A +1 psi Normal edit would not show in pulls like these.** It shows only on a pull with the pedal floored and held ≥ 4–5 s above 3,500 rpm, read in the 3,500–4,500 rpm rows.
- **Engine bug (verified):** TPS = pedal, TPS Command = throttle-plate command. In aug30-1529, TPS Command ≥ TPS + 20 in 140 of 146 samples with TPS > 40, and TPS tops at 83. The engine's full-throttle gate (TPS Command ≥ 85) counts part-pedal pulls as full throttle. `drive-check-tuner-analysis.md:42` reads TPS as the plate.
- **Proof channels:**
  - already logged: Turbo Pressure Target + EWG Position on a held-floored pull;
  - add if TunerView offers them: accelerator pedal, ECO / drive mode, air charge / AFM, torque or torque request;
  - from the tune: Turbo Ramp / Turbo Responsiveness levels ([Quick Adjustments screenshot](11-quick-adjustments-screenshot.md)), Final Boost Target column headers, and the second axes of the Normal / ECO / Cylinder Fill tables (not digitized).

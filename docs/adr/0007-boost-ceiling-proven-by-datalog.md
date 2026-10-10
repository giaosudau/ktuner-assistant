# Boost ceiling proven by datalog, not fixed; steps on Tune 2

*10 Oct 2026. Amends the `boost_ceiling_psi` basis in `data/thresholds.json` and the ceiling check of ADR 0003. ADR 0001 still sets how Knock Control is judged.*

## Context

The app capped boost at a fixed 21 psi (the KTuner Stage 2 page) and locked "+1 psi" as "never on this turbo", from a wastegate reading of about 3 % open at peak. Vendors run this car at 24 psi (TSP Map 3, Phearable L3), and the owner wants more boost as long as every psi is proven on his own logs (ticket 06). No Honda tuner publishes boost limits, but they share one method: one small step at a time, read on repeated full-throttle pulls, stop when more boost costs timing (ticket 13). The wastegate guess is indirect. The direct test of turbo headroom is whether boost reaches the new target. The owner's pulls so far are part-pedal and short, so the logged target never reached the 21 psi table (ticket 17).

## Decision

1. **The ceiling is a rule, not a number:** the active map's Final Boost Target peak at the cell's rpm row (23.4 psi on Starter 21), and never above 24 psi, the highest any vendor file has run on this car. Both map checks (`KTA.checkMapChange`, `mapcheck.py`) apply it per cell.
2. **A Boost step** is +1 psi on Boost_Target_2_Normal L and H only (Tune 2). It covers the 3,500, 4,000 and 4,500 rpm rows the proof pulls log, and only cells of 15 psi and up. The owner A/B's it by switching slots and goes back to Tune 1 instantly. Tune 1 and 3 rise only as a **promote** whose cells equal the proven Tune 2 cells. Safety trims (B2) still move all six tables together, and nothing is raised below 3,000 rpm.
3. **Offered only when every gate passes** (`boost_step_gates`, basis judgement):
   - the latest Cool drive has 2 floored proof pulls (pedal ≥ 85 % held ≥ 4 s above 3,500 rpm);
   - on those pulls, the logged target reaches the table (within 0.5 psi);
   - undershoot and overshoot are each ≤ 1.5 psi, and target + overshoot ≤ 24;
   - Knock Control is read from a settled start and is ≤ 0.56 judged;
   - AFR is never leaner than 12.0 and is at or richer than target;
   - DIFP is ≥ 90 % of target, and trims are within ±5 %;
   - the latest hot drive's Knock Control is ≤ 0.56 judged;
   - no Stop, no Open step and no B2 trim is pending.
4. **Proof:** the next Cool drive with 2 floored pulls on slot 2, plus a hot drive on slot 2, pass the same gates. Ignition achieved must also stay within 1.0° of the last proven Map version. The first failure is an Undo, and a pass lets the next plan promote the step.
5. The 24 psi vendor file is no longer locked by the wastegate guess, only by the map (Final Boost Target) and the fuel.

## Considered Options

- **Keep 21 psi fixed**: simple, but it contradicts every vendor file on this car and the owner's intent. It also leaves no path to a proven gain.
- **Raise the fixed number to 24**: matches the vendors, but proves nothing on this car and fuel (RON95 E10 in tropical heat).
- **Write the step to all three tunes**: one table set to track, but no instant A/B, and a failed step is on every slot.

## Consequences

- On today's nine drives the step is locked: the hot drive's Knock Control reached 0.65 judged and no Cool drive has a floored pull. On RON95 E10, expect the ladder to stop early.
- Drives must carry their map slot tag; a drive on slot 1 never proves Tune 2.
- The gate numbers are judgement and live in one data file with their ticket sources. Changing one is a reviewed data change (ADR 0003).
- Not done yet: holding the ladder closed after a failed proof until a fuel or part change (ticket 06), and reading undershoot with EWG ≈ 0 as "turbo at its limit" (ticket 16).

Type: grilling
Label: wayfinder:grilling
Status: resolved
Assignee: Chanh
Blocked by: 13-datalog-boost-method, 14-ignition-from-datalog, 15-fuel-slot-strategy, 17-boost-target-gap

## Question

What is the shop's datalog step method for boost **and** ignition on this car?

Decide:
- whether ignition stays a product limit, becomes teach-only, or becomes a proof-gated lever; if a lever, which tables (Base vs Max), what step size, which cells, gates and undo;
- whether the Boost step gates decided in [Boost after downpipe](06-boost-after-downpipe.md) D1 hold or change after the tuner-method audit;
- the order of levers when the owner has downpipe + HVI + RON97 + dual maps: fuel proof → slot → boost → timing, or another order;
- what goes in which map slot.

Product intent from the owner (2026-10-05): every change must be proven by datalog, never guessed; small trial steps are welcome if they're safe. Decide the technical side from research; ask the owner only product calls.

## Answer

Owner intent: everything proven by datalog, small safe trial steps welcome. Technical calls from tickets 13, 14, 15, 17 and 11.

**Ignition**
- Adding stays a product limit, now with evidence:
  - the ECU never runs more than Ignition Base;
  - the car sits at the KC floor;
  - "+2 / +5 %" retards the 150 negative boosted cells;
  - pros add only on a dyno.
- **Degree-based removal is teach-only** until a load channel is logged and the Base load axis (seen in the screenshot, units unlabelled) is digitized.
- One card answers the owner's % idea.

**Boost step gates (amending [Boost after downpipe](06-boost-after-downpipe.md) D1)**
- **Proof pull:** pedal (TPS) ≥ 85 % held ≥ 4 s above 3,500 rpm; ≥ 2 pulls, same gear. Edit only the rows those pulls log (3,500–4,500).
- **Pass, all of:**
  - logged target moved to the new value;
  - undershoot ≤ 1.5 psi, read with EWG (undershoot with EWG ≈ 0 = turbo limit or leak → undo, never step again);
  - overshoot ≤ 1.5 psi, and target + overshoot ≤ 24 psi;
  - ignition achieved not more than 1° below the last proven Map version;
  - Knock Control settled after the Flash, ≤ 5,200 rpm, no rise vs the last proven version, and ≤ 0.56;
  - AFR never leaner than 12.0;
  - DIFP ≥ 90 % of DIFP Target;
  - trims within ±5 % (log validity).
- **Hot drive passes too.**
- **Dropped:** the per-cylinder knock-retard gate (dead: one scheduled channel).

**Lever order** (one family per Flash; the first open step wins)
1. Log setup: add AFM Hz; log a floored pull.
2. Heat and fuel proof: RON97 hot pair, no map change.
3. B2 overshoot trim, only if overshoot is held.
4. Boost step.
5. Response: Quick Adjustment, teach-only.

Ignition is never added.

**Slots** (on-the-fly)
- Slot 1 (Tune 1) = the proven map, never edited by a step.
- **A Boost step is written to Tune 2 only** (Boost_Target_2_Normal L/H), so the owner A/B's it by switching slots and reverts instantly. A proven step is then copied to Tunes 1 and 3.
- Safety trims (B2) still write all three tunes.
- ECO = hot days and unknown fuel.

**Today:** the ladder is closed. The hot drive's KC peaked at 0.64, and there are no floored pulls.

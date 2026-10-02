# 10 — Flash plan: one conflict-free answer for the KTuner map

**What to build:** One "Next Flash" card is the only place in the app that says what to change in the owner's KTuner map. It applies the spec's rules P1–P9 in order, so that two proposals can never conflict.

The card shows one of three things:
- **Undo** when a Stop is open: "Flash your previous map file (name, date)".
- **"Your logs support no map change right now"**, followed by every lever with its lock reason and what unlocks it.
- **One table family's changes:** AFM Flow, *or* mixture targets, *or* boost targets. Each change comes with:
  - its evidence, its basis and the proof the next drive must show;
  - the KTuner-ready listing: the table name as KTuner shows it, L and H, levels 1/2/3, cells as rpm row × column N of M with before → after, and curves as a paste-ready row;
  - a new file name to save as, an Undo naming the previous file, and "Record this Flash" prefilled, which starts the Shakedown drive.

The Map reference, Build path, Drive check flash actions and Full method stop giving their own edit steps and link to this card. The spreadsheet edit plan is generated from it.

**Blocked by:** 02 — Evidence-based limits; 05 — Flashes, Map on the drive card, Shakedown drive

**Status:** ready-for-agent

- [ ] On the owner's 16 drives the plan is "no map change". It lists:
  - AFM: no change, trims ±4 %;
  - WOT target to 11.5: locked, provisional;
  - boost +1 psi and 24 psi: locked, no headroom;
  - boost lower at low rpm: waits for the "keep the revs up" habit;
  - downpipe boost trim: not needed, overshoot ≤ 1.9 psi;
  - hot days: use ECO, which already runs 18 psi.
- [ ] With Aug 23 20:38 open (trims Stop after a Flash): the plan is Undo; no AFM curve edit is offered. Trims off everywhere from the first second are routed to "pick the right preset / Undo".
- [ ] Two boost candidates at once (−1 psi at low rpm, +1 psi plateau): only one is in the plan; the other is listed "after the first is proven".
- [ ] Any boost change carries identical cells for all six Normal tables (1/2/3 × L/H); any WOT change for both L and H.
- [ ] Bounds hold:
  - AFM ±10 % per round, the curve keeps rising;
  - no boost raised below 3,000 rpm, and none above the ceiling;
  - ignition, knock sensitivity and protection tables never appear.
- [ ] A change in the opposite direction from the previous Flash on the same table is held until that Flash has a Prove-it verdict.
- [ ] "Record this Flash" creates the Flash with Map name and what changed prefilled, and starts the Shakedown drive.
- [ ] No other screen shows its own edit steps; each links to the Next Flash card. The spreadsheet's highlighted cells equal the plan's cells.
- [ ] New wording in English and Tiếng Việt.

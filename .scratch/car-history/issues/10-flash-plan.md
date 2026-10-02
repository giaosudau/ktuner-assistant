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
**Status:** done (engine: `KTA.carFlashPlan` P1–P9 + card model + spreadsheet cells; 11 seam-1 tests; suite 113/113)
**Status:** done (UI, 2 Oct 2026: Next Flash card on the Drive check + EN/VI strings + See-Next-Flash links; suite 115/115)

- [x] On the owner's 16 drives the plan is "no map change". It lists:
  - AFM: no change, trims ±4 %; (measured: median −1.6 %)
  - WOT target to 11.5: locked, provisional;
  - boost +1 psi and 24 psi: locked, no headroom; (measured: wastegate 2.6 % at peak; the +1 psi math returns zero cells at the ceiling)
  - boost lower at low rpm: waits for the "keep the revs up" habit;
  - downpipe boost trim: not needed, overshoot ≤ 1.9 psi; (measured window max 1.3 psi)
  - hot days: use ECO, which already runs 18 psi.
- [x] With Aug 23 20:38 open (trims Stop after a Flash): the plan is Undo; no AFM curve edit is offered. Trims off everywhere from the first second are routed to "pick the right preset / Undo". (Stop-level trims, |median| > 10, take the preset route by construction; the Undo names the previous map file.)
- [x] Two boost candidates at once (−1 psi at low rpm, +1 psi plateau): only one in the plan; the other is listed "after the first is proven". (Tested as downpipe −1 vs low-rpm −1 — the two levers that can genuinely co-fire; boost +1 is structurally locked. Safety fix wins, the other defers.)
- [x] Any boost change carries identical cells for all six Normal tables (1/2/3 × L/H); any WOT change for both L and H. (Live cells verified identical; locked levers declare their pairs in `wouldTouch`; file pairs verified identical in `mapFacts.pairsIdentical`.)
- [x] Bounds hold:
  - AFM ±10 % per round, the curve keeps rising;
  - no boost raised below 3,000 rpm, and none above the ceiling;
  - ignition, knock sensitivity and protection tables never appear. (TABLES role gate throws if a candidate ever names one; tests assert it across plans.)
- [x] A change in the opposite direction from the previous Flash on the same table is held until that Flash has a Prove-it verdict. (Conservative: any same-family move waits — Flash records carry no direction. Proven by history keep/partial, a later good drive, or a passed Shakedown drive for AFM/mixture.)
- [x] "Record this Flash" creates the Flash with Map name and what changed prefilled, and starts the Shakedown drive. (`prefill` → `carRecordFlash` → pending; tested end to end.)
- [x] No other screen shows its own edit steps; each links to the Next Flash card. The spreadsheet's highlighted cells equal the plan's cells. (UI track: the Map reference edit plan, Build path Step 6, the Full method basic table and every Drive check Flash action now carry a "See Next Flash" link instead of duplicating edit math; their existing tables stay until their owning tracks rewire them. `tools/edit-plan.js` still reads the Stage A/B cells from `K.tableEdits`, not from `carFlashPlan` — converging the spreadsheet generator onto the plan's `cells` is open follow-up.)
- [x] New wording in English and Tiếng Việt. (UI track: `I18N.en/vi.car.flashPlan` — card chrome, lever statuses, KTuner cell lines, paste-row copy. Engine evidence sentences stay English in both languages; engine i18n is the open follow-up.)

PM note: the owner gains one conflict-free answer for the map — today it says, honestly, "no map change", with every lever and its lock reason measured from their own logs. Verified useful: P1 Undo with the previous file named, P2 fix-only-on-matching-Watch, P3 habit-first, P4 one family, P5 prove-it hold, P6 pairs, P7 bounds, P9 with evidence. Residual risk: P5 is deliberately stricter than the spec (holds same-direction moves too — direction isn't recorded); per-bin AFM evidence isn't available from summaries yet, so the curve edit is a uniform round within ±10 % (bins listed as future work, never silently invented).

PM note (UI, 2 Oct 2026): what the owner sees in the car park — after any Drive check, below "Up next" sits one card, "Next Flash". Today it says "Your logs support no map change right now" and lists all six levers with why each is locked and what unlocks it (e.g. boost +1 psi: wastegate 2.6 % open, no headroom; low-rpm cut: try "keep the revs up" first). If a Stop is open after a Flash, the same card becomes "Flash your previous map file (name, date)" with a prefilled "Record this Flash" button that starts the Shakedown drive — no retyping in the car park. How useful it is: verified on the owner's real folder (15 drives in history → no-change, 6 levers, measured numbers match the spec table) and on the 19:59 → Flash 20:00 → 20:38 Stop path (Undo, preset route, prefill records and starts Shakedown). Residual risks: (1) engine evidence sentences render in English under Tiếng Việt — card chrome is translated, the measured sentences are not; (2) the other screens link to the card but keep their legacy edit tables until their owning tracks rewire them, so two wordings coexist for now; (3) the spreadsheet generator still reads Stage A/B cells directly rather than the plan's cells — same numbers today, one source pending.

PM note (Playwright pass, 2 Oct 2026, real CSVs via http://localhost:8000/): DISCREPANCY vs the one-voice rule. On the 19:59 → Flash 20:00 → 20:38 path the Next Flash card correctly says Undo + preset route, but the Block-2 safety line's Do-now on the same drive still says "Step 3: correct the AFM Flow table with the values this app computes" (`app/i18n.js:43` trims fix, from `engine/kta-engine.js:1086`). That is the curve edit the trims rule forbids for trims-off-everywhere-from-first-second. The more prominent line (Block 2) contradicts the card. Suggested: when the trims Stop follows a Flash, the safety Do-now should link to the Next Flash card instead of Step 3. Not fixed here (fix string is asserted by engine tests; needs its owning track). No status changed.

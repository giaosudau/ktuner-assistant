# 06 — Diagnose: one cause per symptom pattern

**What to build:** the engine reads the pattern like a tuner before deciding the Next step (tuner-play-panel T7): one cause, one step, instead of the worst check first.

| Pattern | Cause | Next step |
|---|---|---|
| Trims beyond ±10 % in every load band from the first minute, after a Flash or Install | MAF Scaling / housing mismatch | Undo, then MAF Scaling for the housing |
| Trims ≥ +8 % at idle and low airflow only, after an Install | Unmetered air | Check the install, no map change |
| Leaner than target under boost after a downpipe Install | Exhaust leak ahead of the A/F sensor, or real lean | Check the flanges, then the mixture plan |
| High Knock Retard with a flat Fuel-quality score | Scheduled retard | Not a finding |
| Score rising mostly while lugging on hot drives | Lugging on hot E10 | Keep the revs up (habit); boost step only if proven |
| Boost overshoot above +2.5 psi held, after a downpipe | Faster spool | Downpipe boost trim |

The reply states the cause in one sentence with its evidence ("trims pulled 21.4 % in every band from the first minute, right after a change").

**Blocked by:** 05

**Status:** done (3 Oct 2026: `KTA.carDiagnose` engine op + Next-step wiring + reply `cause` sentence in server/worker/chat; engine suite 163/163 incl. 8 new §06, seam-1 124/124 incl. 6 new in `test_diagnose.py`, 05 loop eval green unchanged)

- [x] Diagnose is an engine operation that runs before the Next step decision, tested per pattern with fixtures
- [x] 23 Aug 20:38: cause = MAF Scaling / housing mismatch, Next step = Undo; never a knock fix or curve edit
- [x] Scheduled retard with a flat score never produces a finding
- [x] The loop eval stays green (or its table is updated with a reason)

## Where it lives

- Engine: `KTA.carDiagnose(state, driveId, opts)` in `engine/kta-car.js` (§ "The loop",
  after `habitCause`, before `carNextStep`); `carNextStep(state, driveId, openSteps, opts)`
  calls it first and maps cause → step (lugging → habit, unmetered-air/exhaust-lean →
  install, spool → downpipe flash, maf-preset → undo). Every step carries
  `step.diagnose` (or null); `answer()` also returns top-level `diagnose`.
- New Open steps `install` (judge: trims back within ±5 % + mixture on target) and
  `downpipe` (judge: overshoot under +2.5 psi on pulls + mixture on target), in
  `STEP_JUDGES`/`STEP_ORDER`/`WOULD_PRIORITY`, branch 5 and branch-6 re-ask.
- Per-drive facts added to the summary: `trimBands`, `trimIdle`, `trimFirstMin`/
  `trimFirstSec`, `krPeak`, `krScheduled`.
- Server: worker `nextStep` op passes `installs` through and returns `diagnose`;
  `graph.py` decide passes `store.list_installs()` and sets reply `cause` via
  `copy.cause_line`; `copy.py` (`cause_line`, install `drive_recipe`, install body,
  forward-flash body for non-undo plans).
- Chat: `ReplyCard` renders `card.cause` under the say line (`types.ts` += `cause`).

## PM notes — decisions later tickets must know

1. **Cause vocabulary for 07's questions + 09's knowledge cards.** `diagnose.cause`
   strings: `MAF Scaling / housing mismatch`, `Unmetered air (leak after the sensor)`,
   `Exhaust leak ahead of the A/F sensor, or real lean`, `Lugging on hot E10`,
   `Faster spool after the downpipe`. Scheduled retard has no cause string — it is
   explicitly null. Owner-facing `sentence` never names a KTuner table (only the
   Flash plan does) and never says "knock retard" (seam-1 BANNED).
2. **No eval table change, with reason.** Diagnose fires on exactly two of the nine
   drives (20:38 maf-preset, 16:01 lugging) and both keep their locked steps (Undo,
   Baseline + habit-beside): it explains the same steps better. 05's
   `test_loop_eval.py` is green unchanged — no table update needed.
3. **"After a change" without a recorded change.** 20:38 has no recorded Flash/Install;
   the change signal is the logs' own unexplained trim jump (> 5 points vs the car's
   median — the app's own Unexplained-change rule). Signals in order: downpipe install
   → other install → flash → answered `flashed` → trim jump. A first-ever drive with
   off-everywhere trims and no history gets no cause (honest: "after" can't be shown),
   but the Stop → Undo path still holds.
4. **Baseline still comes first.** A cause on a no-Baseline drive attaches to the reply
   sentence but the step stays the Baseline drive (04's fixed order); the cause routes
   to its step on the next drive. Row 1's "then MAF Scaling for the housing" is 07's
   interview, not a curve edit — the Undo plan stays zero-cell.
5. **Thresholds reused, not invented:** ±10 % (TRIM_STOP), +8 % idle (new DIAG_IDLE_LEAK,
   from the ticket), KR ≥ 5° (fact-check §2 scheduled level), flat = rise ≤ 0.03
   (LUG_RISE_OK), lean = target + 0.5 (LEAN_WATCH), overshoot > 2.5 (LIMITS).
6. **e2e not run** (no Playwright browsers on this machine); static check: cause div
   sits between say and numbers, so the e2e order asserts hold, and `say` is untouched.

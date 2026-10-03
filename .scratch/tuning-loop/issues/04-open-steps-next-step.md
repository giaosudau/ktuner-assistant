# 04 — Open steps and the Next step

**What to build:** every reply closes the loop and gives one Next step. The engine settles each Open step against the new Drive (Done / Not yet / Still off / Can't tell yet, always with the reason and numbers), marks the Drive a Wasted drive when it settled none (and says what would have), and decides exactly one Next step: a Flash (from the Flash plan), a gauge to watch in TunerView, a drive to log, or nothing — always naming the drive whose upload will settle it.

The reply shows "What I asked last time", then the Next step with its gauge table (gauge as TunerView spells it, OK, if you see, then) or drive recipe, and "Upload when". A repeated step shows compactly as "same step as last time". Open steps sit beside the thread (above it on phones).

Decision order (from `prototypes/next-step/`, amended: Baseline before habit):
```
open Stop            → Flash: Undo (the only step)
Too-short drive      → nothing read; previous step stands
logger fault         → watch in TunerView: fix the dead gauges
no Baseline yet      → drive: one Cool drive with 2 pulls
                       (+ a cause seen today is added as an Open step, told as a free habit)
cause seen today     → its step
Open step still open → its step, compact "same step"
otherwise            → nothing: upload after a Flash, Install, new fuel, or Knock Control > 0.60
```

**Blocked by:** 01

**Status:** done (3 Oct 2026: settle + one-Next-step engine ops, reply card + Open steps panel in server/worker/chat; engine suite 150/150, seam-1 67/67 incl. 11 new in `test_open_steps.py`)

- [x] Settling and the Next step decision are engine operations, tested in the engine suite
- [x] Every Next step names the drive that will settle it ("after your next hot-afternoon drive")
- [x] "Can't tell yet" always carries why (too short, cool when hot is needed, dead gauge)
- [x] Wasted drives are flagged with what would have settled an Open step
- [x] The chat shows the settled Open steps, the Next step (gauge table or drive recipe), and the Open steps list
- [x] Seam-1 test: 30 Aug 16:01 gives the Baseline step with the lugging habit added as an Open step

## Where it lives

- Engine: `KTA.carOpenSteps / carSettle / carNextStep` in `engine/kta-car.js` (§ "The loop",
  after the Flash plan). Limits only read (`CAR_RULES`, `KTA.LIMITS`); no threshold
  value changed — only `UPLOAD_SCORE = 0.60` added.
- Engine tests: `test/car.test.js` §04 — the owner's nine Drives through
  settle → next step (`loop()`), plus settle/wasted/repeat/ordering unit tests.
- Server: `graph.py` decide node (settle, then one Next step, both as harness steps);
  `copy.py` (`settled_rows`, `wasted_line`, `gauge_table`, `drive_recipe`,
  `next_step_card`); `db.py` (`open_steps` table, `save/list_open_steps`);
  `kta_worker/worker.js` ops `settleOpenSteps`, `nextStep`.
- Seam-1: `server/tests/seam1/test_open_steps.py` (11 tests: the nine-Drive loop,
  upload-when on every step, compact repeats, settled numbers, can't-tell whys,
  the 16:01 case, gauge table + recipe, wasted lines, panel, determinism).
- Chat: `ReplyCard` (settled → wasted → plan → harness → one Next step),
  `SettledSteps` ("What I asked last time"), `NextStepCard` (recipe / gauge table /
  "Upload when" / "Same step as last time"), `OpenStepsPanel` beside the thread
  (above it on phones, `.layout` in `globals.css`).
- Verified numbers on 30 Aug 16:01: lugging 6.93 % hot, KC 0.49 → 0.65 peak
  (0.64 end), 31 of 41 step-ups while the CVT held 1,509 rpm. The step says the
  peak (0.65); the ticket summary's 0.64 is the end score.

## PM notes — decisions a later ticket must know

1. **What 05 eval should assert (Drives to proof / scoring the habit).**
   `askedOn` is the Drive that FIRST asked (proof counts from here); re-asks move
   only `lastAskedOn` and keep the step's place. A Too-short Drive settles nothing
   and advances no proof; a Wasted drive proves nothing either. The habit scores
   ONLY on a hot drive — a Cool drive is "Can't tell yet" with the hot-afternoon
   reason, never a fail. `done` proves a step; `fail` ("Still off") is asked again.
   `lastAskedOn === null` means opened-beside (never asked for, e.g. the habit on
   16:01) — 05 must treat those as unasked, not as repeats. Proof across a Flash
   is refused (`carProofSpansFlash`). Concrete proofs 05 can reuse: Undo = trims
   within ±5 % over 10 calm minutes; Baseline = one Cool drive with 2 pulls.
2. **Settle runs before decide, always.** `carNextStep` reads the settled statuses,
   so the step a Drive is given knows what that Drive proved. A Drive never
   settles the step it asked itself (`askedOn === driveId` is skipped).
3. **Decision order is fixed and tested as a sequence** (Baseline before habit —
   the ticket's amendment to `prototypes/next-step/`): open Stop → Too-short →
   logger fault → no Baseline (cause beside it as a free habit) → cause seen
   today → open step still open (compact) → nothing. The nine-Drive loop test
   pins the branch each Drive takes; reorder only by amending the ticket first.
4. **Copy constraints live in two banned-word lists** (`test_reply_words.py`:
   BANNED + the settle/wasted asserts): no KTuner table name in any step (only
   the Flash plan names tables), no "waste/d", "failed", "mistake", "wrong",
   "try again" anywhere owner-facing. "Upload when" format is pinned:
   `Upload when: {upload}.` Keep it — the chat renders `uploadWhen` verbatim.
5. **Ticket 07 slot is ready, not filled.** `GET /api/state` returns
   `unansweredQuestions: []` and `OpenStepsPanel` renders the "Waiting for you"
   slot; 07 fills both. `list_open_steps()` (all, for settle) vs
   `list_open_steps(only_open=True)` (panel) — don't collapse them.
6. **No EN+VI pattern exists yet.** Copy is English-only; the ticket's "via
   existing i18n pattern if present" found nothing to reuse (only a
   PRODUCT-REVIEW mention). VI copy is a later ticket's job, not a 04 gap.
7. **Scratch helpers left untracked on purpose:** `.scratch/tuning-loop/04-loop.js`
   (nine Drives through the engine, prints every settle/waste/step) and
   `04-shot.js` (390 px + 1280 px screenshots). Re-runnable, not product.

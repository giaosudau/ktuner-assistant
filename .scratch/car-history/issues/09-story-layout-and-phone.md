# 09 — Story layout and phone

**What to build:**
- **Fixed block order:** the Drive check shows its blocks in the order of the story contract on every screen size:
  - 0 banner (only when active)
  - 1 drive card + Key moments
  - 2 safety
  - 3 your one thing
  - 4 your car over time
  - 5 performance
  - 6 up next / later / fine
  - 7 what this drive can't tell
  - 8 engineering view (collapsed)
- **First lines:** each block answers its question in its first line.
- **Key moments:** up to five per drive, each with its clock time, chosen in this order:
  1. Stop starts
  2. Watch events
  3. hard pulls (best first)
  4. the longest lugging stretch
  5. a hot restart
- **One *Why?* picture:** every *Why?* shows when (the moment on the drive's timeline) and where (the same moment as highlighted rows on a small rpm × boost grid).
- **Stop collapse:** a Stop folds blocks 3–5 into "Paused until the Stop is fixed".
- **Phone:** works at 375 px with no sideways scroll; the first screen shows blocks 1–3.

**Blocked by:** 01 — Log quality gate; 02 — Evidence-based limits

**Status:** done (app side; verdicts/plan/proof consumed read-only from the engine)

- [x] The end-to-end check asserts the block order and first lines on Aug 30 16:01, at 375 px and on a laptop.
- [x] Aug 30 15:29 shows at most 5 Key moments, hard pulls first, each opening its *Why?*.
- [x] Aug 23 20:38: blocks 3–5 are collapsed; safety and Key moments still show.
- [x] Every Verdict shows icon + word; nothing is colour-only; light and dark both render.
- [x] Performance hides when the drive has no acceleration window; every other block answers "Can't tell: …" rather than disappearing.
- [x] Numbers follow one rule each: psi 1 decimal, score 2 decimals, °C whole, trims 1 decimal with sign, acceleration 2 decimals, dates "Sat 30 Aug · 16:01" / "T7 30/8 · 16:01".
- [x] New wording in English and Tiếng Việt.

**PM note (2 Oct 2026, verified against the owner's 16 TunerView files via UI + e2e):**
- What the owner sees: the same 9-block story on phone and laptop — banner only when active; drive card ("Sun 30 Aug · 16:01 · 53 min · Hot · Traffic · Hot restart", Map, highest boost target 17.2 psi, log quality) with ≤5 Key moments, each with its clock time (16:01 shows 3 score watches + 2 hard pulls; 15:29 shows 5 pulls, coolest first); safety opens with one "Can I drive hard" sentence, then 5 lines (Fuel/Air/Spark/Heat/CVT) each with number, meaning, limit, Verdict icon + word and Do-now (the 16:01 Spark line carries "costs about 1.5° of timing"); one thing with steps/proof/undo; history; performance ("Best 50→70 km/h 2.23 s", like-for-like within 8 °C or "not comparable (…hotter)" with the reason, hidden with no window); up-next/later-locked/fine with counts; can't-tell (Sep 5 lists Turbo Pressure flat; 15:09 says too-short and stays out of history); engineering collapsed. 20:38 collapses 3–5 to "Paused until the Stop is fixed" while safety + moments stay; 22 Sep-09:50 is a heat Watch, never a Stop. Every *Why?* opens one inline picture (timeline + revs×boost grid + one-line basis), so it works on the phone with block 8 shut.
- Usefulness: the car-park read is verdict → action in two blocks at 375 px with no sideways scroll; the laptop keeps the identical order with charts in a 2×3 grid.
- Residual risk: Key moments are built on the screen from the report's timed data (heat/CVT Stop times fall back to the drive start when the log gives no timestamp); Traffic/Highway is a heuristic (≥10 % of moving time above 80 km/h — all 16 owner drives read Traffic); the Why picture reuses the drive's own graphs rather than a moment-zoomed view; with a long 5-moment drive card the one-thing block sits below the first phone screenful (order is contractual, position is not).

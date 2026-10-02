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

**Status:** ready-for-agent

- [ ] The end-to-end check asserts the block order and first lines on Aug 30 16:01, at 375 px and on a laptop.
- [ ] Aug 30 15:29 shows at most 5 Key moments, hard pulls first, each opening its *Why?*.
- [ ] Aug 23 20:38: blocks 3–5 are collapsed; safety and Key moments still show.
- [ ] Every Verdict shows icon + word; nothing is colour-only; light and dark both render.
- [ ] Performance hides when the drive has no acceleration window; every other block answers "Can't tell: …" rather than disappearing.
- [ ] Numbers follow one rule each: psi 1 decimal, score 2 decimals, °C whole, trims 1 decimal with sign, acceleration 2 decimals, dates "Sat 30 Aug · 16:01" / "T7 30/8 · 16:01".
- [ ] New wording in English and Tiếng Việt.

# 02 — Engine: stop the false alarms

**What to build:** the owner stops seeing alarms the research proved wrong (`docs/research/owner-voices.md` §4, `tuner-play-panel.md` T1):

- "Unexplained change: boost" fires on 5 of 6 drives because the highest boost target depends on whether the owner did a pull. Compare boost targets only between Drives that both had hard pulls.
- A Drive whose Fuel-quality score starts at 0.60 or below and falls to the Baseline is the normal after-flash pattern (30 Aug 15:29: 0.58 → 0.49), not an Unexplained change.
- Knock Control rises above 5,200 rpm (the non-Si ECU raises it there on purpose) don't count toward fuel or heat verdicts.
- Checks diagnose, they never prescribe: remove every check remedy that names a map table; only the Flash plan names tables.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] On the owner's drives, "Unexplained change: boost" no longer fires between a Drive with pulls and one without
- [ ] 30 Aug 15:29 is not an Unexplained change for its starting score
- [ ] A rise above 5,200 rpm is excluded from fuel and heat verdicts (fixture test)
- [ ] No check's text names a KTuner table; the Flash plan still does
- [ ] Tested at the engine's public operations in the style of the existing car and drive tests; full suite green

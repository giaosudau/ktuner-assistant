# 12 — Thresholds file and the independent Python map change check

**What to build:** the safety net from ADR 0003, built early beside the loop. Every threshold that bounds a map change lives in one data file, each entry with value, unit, basis (measured / source / judgement) and source (`fact-check.md` section or the log it came from). The engine reads its limits from it. A separate, deterministic Python check (no LLM, no engine code) takes a proposed change and the active Map version and accepts or rejects it, with the reason:

- the table and its axes exist; every row and column index is in range;
- every before equals the active Map version's value exactly;
- every after is within the thresholds: boost step ≤ 1 psi; no boost raised below 3,000 rpm; nothing above the ceiling; MAF Scaling within ±10 % per round and still rising; WOT target within its band;
- pairs identical (Boost 1=2=3 × L/H; WOT L=H); one table family;
- ignition, knock-sensitivity and protection tables never present.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Every thresholds entry has value, unit, basis and source (test)
- [ ] The engine's limits come from the thresholds file; its suite stays green
- [ ] Seam-2 tests: the engine's rules and the Python check get the same generated changes (valid, off-by-one index, wrong before, out of bounds, broken pair, two families, forbidden table, against the wrong Map version) and agree on every one
- [ ] Any disagreement fails the test with both reasons

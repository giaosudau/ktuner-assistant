# 06 — Unexplained change

**What to build:** When a drive differs from the drives since the last Flash and no Flash explains it, the app asks "Something changed since your last drive" with *I flashed / New tank of fuel / Neither*.

It asks when any of these is true:
- the worst trim moved by more than 5 points;
- the highest boost target moved by more than 2 psi;
- the Fuel-quality score started at Baseline + 0.08 or more.

"The drives since the last Flash" means their median, needing at least 3; with fewer, the last 5 non-hidden drives are used.

The answers:
- *I flashed* opens the Flash form, pre-dated to just before this drive.
- *New tank of fuel* says "give it 10–15 calm minutes, then judge".
- *Neither* keeps the line at Watch, "Unexplained change".

Each answer is stored with the drive and never asked again for it.

**Blocked by:** 05 — Flashes, Map on the drive card, Shakedown drive

**Status:** ready-for-agent
**Status:** done (engine: median-since-flash + sticky answers verified; suite 113/113)

- [x] Aug 23 19:59 then 20:38 with no Flash recorded: asks (trim moved > 5 points).
- [x] Aug 30 15:29 after earlier drives at 0.49: asks (score starts 0.58). (Isolated pair: baseline 0.49 → 0.58 ≥ 0.57 asks. Full-folder note: the learned baseline reaches 0.505 by Aug 30, so 0.58 misses the +0.08 line by 0.005 — the drive still asks, via the boost-target step. Spec-literal; threshold untouched.)
- [x] Loading the owner's folder asks about the boost-target change between 22 Aug and 30 Aug (16.3 → 19.3 psi). (Folder run: 10 of 15 drives ask on boost-target. Noisy-but-correct per the rule — the highest target varies with how the drive was driven, not only with the Map — flagged here, threshold NOT retuned.)
- [x] *I flashed* creates a Flash and turns the drive into a Shakedown drive (ticket 05 rules apply).
- [x] Each answer persists through reload and through the History file once ticket 08 exists. (Tested: re-ingest never re-asks; answers ride the export/import.)
- [ ] New wording in English and Tiếng Việt. (UI track — other agent.)

PM note: the owner gains a backstop for forgotten Flashes — the 23 Aug trim fault and the 22→30 Aug target step both get asked about instead of silently entering the history. Verified useful: median-since-flash (≥3) vs last-5 fallback is now pinned by a test that distinguishes them. Residual risk: the boost-target question fires often on unmapped history (10/15 drives) — correct today, but the UI should render it as a quiet line, not an alarm, until Flashes are recorded and the reference tightens.

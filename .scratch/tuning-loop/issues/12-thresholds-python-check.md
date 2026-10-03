# 12 — Thresholds file and the independent Python map change check

**What to build:** the safety net from ADR 0003, built early beside the loop. Every threshold that bounds a map change lives in one data file, each entry with value, unit, basis (measured / source / judgement) and source (`fact-check.md` section or the log it came from). The engine reads its limits from it. A separate, deterministic Python check (no LLM, no engine code) takes a proposed change and the active Map version and accepts or rejects it, with the reason:

- the table and its axes exist; every row and column index is in range;
- every before equals the active Map version's value exactly;
- every after is within the thresholds: boost step ≤ 1 psi; no boost raised below 3,000 rpm; nothing above the ceiling; MAF Scaling within ±10 % per round and still rising; WOT target within its band;
- pairs identical (Boost 1=2=3 × L/H; WOT L=H); one table family;
- ignition, knock-sensitivity and protection tables never present.

**Blocked by:** 03

**Status:** done (3 Oct 2026: `data/thresholds.json` holds the 11 map-change bounds, the engine derives its limits from it, `KTA.checkMapChange` + `server/kta_server/mapcheck.py` are the two independent checks; npm 155/155, pytest 88/88 with 18 agreement cases green)

- [x] Every thresholds entry has value, unit, basis and source (test)
- [x] The engine's limits come from the thresholds file; its suite stays green
- [x] Seam-2 tests: the engine's rules and the Python check get the same generated changes (valid, off-by-one index, wrong before, out of bounds, broken pair, two families, forbidden table, against the wrong Map version) and agree on every one
- [x] Any disagreement fails the test with both reasons

## PM notes — decisions a later ticket must know

1. **Threshold sources:** `boost_ceiling_psi` 21 is source (KTuner page, fact-check §4);
   `wot_target_band` 11.0–12.0 is source (the map file, fact-check §6);
   `maf_curve_rising` is measured (the four MAF curves in the digitized map);
   the other eight (1 psi step, 3000 rpm floor, ±10 % MAF round, pairs identical,
   editable/forbidden lists, one family) are judgement with the fact-check
   section or engine rule cited per entry.
2. **Accessor used:** the Python check never opens SQLite itself. Tests seed
   Map version 1 with `store.ensure_map_version(1, name, basemap_tables())` and
   read it back through `store.map_version(1)`; `check_against_version` refuses
   `wrong-map-version` (change written against another number) and
   `map-change-pending` (version holds no tables) before reading any cell.
3. **What ticket 13 needs:** a worker op (e.g. `checkMapChange`) that resolves
   the named version with the existing `tablesToCheck` refusal, runs
   `KTA.checkMapChange` on the engine side and `mapcheck` on the Python side,
   blocks the Flash on any disagreement, and on accept stores the checked
   change's tables into `map_versions.tables` to clear `tablesPending`.
4. **Parallel-commit note:** the 3-line `kta-car.js` hunk for this ticket (P7
   floor reads `KTA.THRESHOLDS.boost_raise_min_rpm`, ticket-12 scope) was swept
   into commit 44a3735 (ticket 04, same file) while both agents worked. Content
   is exactly this ticket's; nothing was lost. This commit holds the rest.

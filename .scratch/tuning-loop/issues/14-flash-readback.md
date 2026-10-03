# 14 — Flash readback

**What to build:** the first Drive after a Flash checks that what the ECU runs is what was planned. For boost tables, the logged Turbo Pressure Target in the changed cells the Drive visited must match the new Map version. For MAF Scaling, the trims pattern must match the choice. A mismatch names the cell ("2,750 rpm column 9 reads 17.0, planned 16.0"), the Flash isn't credited, and the Next step is "re-check what you typed in KTuner". Tables whose result the log can't show say "readback not possible" on the card.

**Blocked by:** 13

**Status:** done

- [x] Seam-1 test: a Drive matching version 2's changed cells is credited — `server/tests/seam1/test_flash_readback.py::test_a_drive_matching_version_2s_changed_cells_is_credited`
- [x] A Drive whose logged target differs in a changed cell is not credited and names the cell — `test_a_drive_whose_logged_target_differs_is_not_credited_and_names_the_cell` (Next step: "Re-check what you typed in KTuner")
- [x] A Drive that never visits the changed cells says readback is still open ("can't tell yet", with the rpm band to drive in) — `test_a_drive_that_never_visits_the_changed_cells_says_readback_is_still_open`
- [x] The KTuner card states, per table family, whether readback is possible — `test_the_ktuner_card_states_per_table_family_whether_readback_is_possible`

**What changed:** `server/kta_server/readback.py` (judge + words), worker op `logTargets` (tallies of the logged Turbo Pressure Target near each changed rpm row, never rows), readback on the reply and the KTuner card, a mismatch becomes the one Next step.

**PM notes:** only boost tables are read back; AFM Flow (MAF Scaling) and WOT say "readback not possible" on the card — the log shows trims and the commanded mixture, not those cells, and no trims rule was invented (the spec's "trims pattern" check stays open for a later ticket). The log has no pedal/column channel, so a reading is placed by rpm row and nearest planned value; cells of one row sharing a value are named "one of columns 8 to 16". Readings that equal an untouched column's value are ignored (ambiguous), so a forgotten cell in a flat row reads "can't tell yet", never a false alarm.

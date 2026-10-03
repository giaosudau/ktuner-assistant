# 13 — Flash step: KTuner card to a new Map version (and the History file)

**What to build:** when the Next step is a Flash, the owner can type it into KTuner safely and the app knows what's on the car afterwards.

- The proposed change passes both checks (engine and the independent Python check) before the owner sees it; a blocked Flash says why.
- The **KTuner card** is drawn only from the checked change: table as KTuner names it with L/H and level, rows by rpm, columns as "N of 16", before → after in each table's own units and decimals, what it means, what it does for this car, save-as name, Undo version, and the proof. Reply text whose cell or number differs from the card fails verify.
- A **per-cell checklist** the owner ticks while typing, then **I flashed it** → Map version N+1 becomes active and the next Drive is a Shakedown drive, or **Not now** → nothing is created.
- **Undo** flashes an earlier Map version; **Revert** ("In KTuner, load Starter 21 Dual Tune 2 and flash it") makes the KTuner basemap active on confirm.
- **History file:** export and import include Map versions, Flashes, Installs and owner answers; merge never overwrites (raw CSVs stay on the server).

**Blocked by:** 07, 10, 12

**Status:** done

- [x] Seam-1 test with a fixture where the Flash plan proposes cells: the card matches the checked change exactly; "I flashed it" creates version 2 with those cells and a Shakedown drive; "Not now" creates nothing — `server/tests/seam1/test_flash_step.py`: `test_the_card_matches_the_checked_change_cell_for_cell`, `test_i_flashed_it_makes_map_version_2_with_exactly_those_cells`, `test_not_now_creates_nothing`, `test_a_reply_that_names_a_different_cell_or_number_fails_verify`
- [x] A change rejected by either check never reaches the card; the reply says why — `test_a_change_both_checks_refuse_never_reaches_the_card_and_says_why`, `test_two_checks_that_disagree_fail_loudly_and_block`, `test_a_map_version_whose_cells_are_not_stored_cannot_be_checked`, `test_an_air_flow_curve_change_is_checked_and_drawn_by_point`
- [x] Undo to version 1 and Revert to basemap each make the right version active — `test_undo_to_version_1_makes_it_the_active_map`, `test_revert_loads_the_ktuner_basemap_and_makes_it_active`; engine: `test/car.test.js` "Undo puts an earlier Map version back…"
- [x] History file round-trips Map versions, Flashes, Installs and answers; merging keeps both sides — `test_the_history_file_round_trips_versions_flashes_installs_and_answers`, `test_merging_a_history_file_keeps_both_sides`; engine: "the History file carries restores…"

**What changed (engine tests added: 3 in `test/car.test.js`):** the engine gains `carRecordRestore` (Undo/Revert make an earlier Map version active again with no new number, and start a Shakedown drive) and `carStoreMapTables`; Flash plan safety rules P5–P9 untouched. Python: `flash.py` (both checks, change, card), `flash_routes.py` (confirm, not-now, restore, History file). Web: `KTunerCard.tsx` (per-cell checklist), `MapPanel.tsx` (active version, Revert, History file).

**PM notes:** the owner's nine real Drives propose no cell, so the seam-1 fixture gives one Drive an overshoot over the hold. Only the low-rpm boost change comes out of the engine's Flash plan today; the AFM Flow curve card is proven with a unit test, not yet an end-to-end Drive. The 41-cell boost card is long: ticking by rpm row is there to keep it quick. Flash readback is ticket 14.

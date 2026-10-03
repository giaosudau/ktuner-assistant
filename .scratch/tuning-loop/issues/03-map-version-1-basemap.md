# 03 — Map version 1 is the KTuner basemap

**What to build:** the app knows which map every Drive ran on from the first upload. The original KTuner basemap Starter 21 Dual Tune 2, as held in the app's map data, is Map version 1 and is active from the first Drive. It starts no Shakedown drive (the owner didn't just flash it). Every reply says which Map version the Drive ran on ("on Map version 1 · Starter 21 Dual Tune 2"). Map versions are stored in SQLite with their full tables.

This replaces "Map not recorded" and fixes the prototype's side effect where recording the starting map made the first Drive a Shakedown drive.

**Blocked by:** 01

**Status:** done (3 Oct 2026: Map versions in the engine state and in SQLite, a worker seam to check a change against a named version, the Map version line in the reply card and in `web/`; engine 136/136, seam-1 50/50, browser smoke 6/6)

- [x] A fresh car has Map version 1 = Starter 21 Dual Tune 2 with its tables, before any upload — `test/car.test.js`: `a fresh car is on Map version 1, the KTuner basemap, before any Drive`; `server/tests/seam1/test_upload_reply.py::test_a_fresh_car_is_on_map_version_1_before_any_upload` asserts `GET /api/state` on an empty car is `mapVersions [1]`, `activeMapVersion 1`, and that `Store.map_version(1)` holds all 39 tables. `KTA.carEmpty()` already carries version 1, so it cannot be missing.
- [x] The first Drive is not a Shakedown drive and shows "on Map version 1" — `test/car.test.js`: `Map version 1 starts no Shakedown drive: the first Drive is an ordinary Drive` (including when the owner dates it, which is the prototype's side effect) and `server/tests/seam1/test_upload_reply.py::test_the_first_drive_is_not_a_shakedown_drive`; `test_upload_streams_a_reply_with_the_verdict_sentence_the_four_numbers_and_the_plan` asserts the line on a single upload.
- [x] The engine's Map for a Drive is the Map version active at its start (engine test) — `test/car.test.js`: `the map on the card is the Map version active when the drive started` and `the Map a Drive ran on is the version active at its start, never the log` (a Drive before a Flash keeps version 1 after the Flash is recorded; re-checking an older Drive does not move it).
- [x] The Flash plan's Undo can name a Map version (engine test) — `test/car.test.js`: `the Flash plan Undo names a Map version, and never invents one`, `a Flash the owner confirms is the next Map version; Undo names the one before`, and `next-flash card contract: 19:59, one Flash at 20:00, 20:38 Stop → Undo naming that Map version`. Copy: `server/tests/seam1/test_reply_words.py::test_the_undo_names_the_map_version_not_just_the_file`, `::test_the_undo_never_invents_a_map_name`, `::test_the_stop_next_step_names_the_map_version_to_flash_back`.
- [x] Seam-1 test: uploading the 9 drives shows Map version 1 on each — `server/tests/seam1/test_upload_reply.py::test_every_one_of_the_owners_nine_drives_says_which_map_version_it_ran_on` (8 read Drives say `on Map version 1 · Starter 21 Dual Tune 2`, the Too-short one says one thing only; no "not recorded" anywhere; every Car history row carries `mapVersion: 1`).
- [x] The engine's existing suite still passes — `npm test` 136/136 (129 + 7 new). Four existing tests changed on purpose, because "not recorded" is what this ticket replaces; each says why in its own name.
- [x] The browser smoke test still passes, with the Map version line asserted in place — `web/e2e/chat.e2e.js`: `the card says which Map version this Drive ran on, under the numbers` (order: sentence → numbers → Map version → Flash plan; no sideways scroll at 390 px). `cd web && npm run e2e` 6/6.

## PM notes — decisions a later ticket must know

1. **The Map version's tables are NOT in the Car history document.** The state JSON carries
   `{ n, name, kind, tablesFrom, tablesPending, from, flashId, changed, note, updatedAt }`; the
   166 kB of tables live in SQLite (`map_versions.tables`). Otherwise every Drive report, every
   harness step and the History file would grow by half a megabyte. `tablesFrom` names where the
   tables are; the worker resolves it (`ktuner-basemap` → `data/ktuner-maps-digitized.json`).
   **`store.map_version(n)` is the accessor ticket 12/13 wants** (and
   `app.ensure_map_version_one_full`), `mapdata.basemap_tables()` is the one Python read of the
   KTuner map data (ADR 0003 wants two independent reads of one source — the engine's and
   Python's), and `GET /api/state` returns the version *without* its tables.
2. **`map_versions.id` IS the Map version number** (`Map version 1`, `2`, …). Not a separate
   column: a small integer the owner can say out loud, never a UUID or an autoincrement that
   drifts from the engine's `n`. `ensure_map_version(n, …)` is idempotent by design, so seeding at
   startup and again on first use never grows a second copy.
3. **`recordFlash` now creates the next Map version** (`carRecordFlash` returns `version`). So the
   Undo has something to name, and a Flash's Map version keeps step with the Flash: an edit renames
   it, a delete removes it and closes the numbering gap. **Ticket 10's "I flashed it" needs no
   new plumbing** — it records the Flash and the version appears. Ticket 07's Undo copy should read
   `plan.undo`, not `plan.undoName`.
4. **A version whose flashed change is not stored yet carries `tablesPending: true`.** Until the
   app stores the change the owner flashed, the version points at the tables it was written on, so
   the Flash plan can still be read, and `worker.mapVersion` **refuses** with `map-change-pending`
   rather than handing an older map's tables to a check. **Ticket 12/13 clears the flag** when it
   stores the checked change (and writes the new tables into `map_versions.tables`).
5. **The Map version line is one quiet line, and the explanation is a separate footnote.**
   `reply.mapVersion = { line, version, name, since, kind, note? }`. `line` is always
   `on Map version N · <KTuner's own name>`; `note` (what a Map version is) rides the **first**
   Drive's reply only, as a footnote under the line, never inside it. It is card-only: it is not
   streamed as prose, so the two streamed sentences are unchanged. In `web/` it sits **between the
   four numbers and the Flash plan**, with a left rule, `--ink-2` at 13 px; at 390 px it is one
   line and the note wraps to three.
6. **A Too-short Drive names no Map version.** It read nothing and says exactly one thing (ticket
   01's promise). The engine still reports the active version honestly on its card; only the copy
   omits the line.
7. **Undo names the version, or asks once — it never invents a name.** With no earlier version
   (`undo.known === false`) the plan headline is "Stop open: flash your previous map file, and tell
   me which one it is" and the Next step says "I have no Map version before the one this Drive ran
   on — tell me what you flashed and I can name the file to flash back." **This is the real state
   of the owner's 23 Aug 20:38 Stop**: nothing was recorded, so Map version 1 is the only version
   and the app asks. Ticket 09's "what changed" question is what turns that into a named file.
8. **The string "not recorded" is gone from every owner-facing surface** (engine plan strings,
   reply copy, the chat) and is in the seam-1 banned-word list. `test_reply_words.py` also bans
   `map v1`, `map rev` and `revision 1`.
9. **New worker ops**: `mapVersions`, `mapVersion {version}` (tables, for checks), `recordBasemap`.
   `flashPlan` takes an optional `mapVersion` and writes against that named version; with no
   argument it writes against the active one, and the plan carries `mapVersion` (with
   `tablesPending`) so Verify can refuse a plan made on a version whose change is not stored.
   `carHistory` now returns `mapVersions` and `activeMapVersion`; rows carry `mapVersion`.
10. **`p.saveAs` is now named after the Map version** (`Starter 21 Dual Tune 2 · 20260905 · … r1`)
    instead of the invented `Starter 21`. One test assertion moved with it.
11. **`report.map` keeps `recorded`/`name`/`since`** for the parked `app/`, and gains
    `version`/`label`. `carTableRows` rows keep `map` (the name) and gain `mapVersion` (the
    number). `mapOut` never returns `recorded: false` for a car that has version 1.
12. **Engine tests that moved on purpose** (each rewritten to say why in its name): the four that
    asserted `map.recorded === false` or `carMapAt(...) === null`, plus two that read the Undo or
    the file name. Nothing else in the 129 moved.
13. **The History file carries Map versions** (`doc.mapVersions`), merged by number, never
    overwritten; a Flash in the file that no version claims becomes the next version. `CAR_VERSION`
    stays 1: the key is additive and a file without it imports (version 1 is what a fresh car has).
14. **`db.py` migrates an owner's existing database** — `map_versions` gains `kind`, `source`,
    `changed`, `note`, `flashed_at`, `tables`, `updated_at` by `ALTER TABLE` at startup. An old row
    keeps its `created_at`; its tables are filled in once, never overwritten.
15. **Untouched on purpose**: `graph.py`'s Decide node, `nextStep`, Open steps, settling and
    Wasted drives (ticket 04). `graph.py` changed in one place only — `ingest` passes
    `first_drive` to `build_reply`. Ticket 04 should keep that argument.
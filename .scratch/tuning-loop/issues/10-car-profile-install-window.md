# 10 — Car profile, Install and the drive window

**What to build:** setup in about a minute, and answers about the car as it is now.

- **First open:** the chat asks the owner to describe the car in their own words (with an example). The LLM fills a typed Car profile card (model, engine, transmission, fuel, climate, KTuner basemap prefilled Starter 21 Dual Tune 2, parts fitted as enums); the owner corrects any field and confirms. Nothing is saved before confirm.
- **No Drive yet:** only Car profile setup runs; tuning questions get "upload a drive first".
- **Editing parts later** records an Install with its date.
- **Drive window:** the latest Drive plus every Drive since the last Flash or Install, capped at 14 days; older Drives feed only the Baseline and trend pictures. Every reply states its window ("based on your 3 drives since the Flash on 30 Aug").

**Blocked by:** 03, 08

**Status:** done — Car profile card (draft, correct, confirm), plain-form fallback, Installs and the 14-day drive window with its sentence on every reply; 14 seam-1 tests in `server/tests/seam1/test_car_profile.py`, full suites green (npm test 206, pytest 204 passed).

- [x] Describing the owner's car fills the card correctly; a corrected field is saved as corrected — `test_describing_the_car_fills_the_card_and_saves_nothing, test_a_corrected_field_is_saved_as_corrected`
- [x] With no key, setup falls back to a plain form with the same fields — `test_no_key_setup_falls_back_to_a_plain_form_with_the_same_fields`
- [x] An Install appears in the Car history and starts the drive window like a Flash — `test_an_install_appears_in_the_car_history_and_starts_the_window, test_a_flash_starts_the_window_the_same_way`
- [x] Every reply states its drive window; drives outside it don't change the Next step (seam-1 test) — `test_with_drives_a_typed_question_states_its_window, test_drives_outside_the_window_dont_change_the_next_step, test_the_window_is_capped_at_fourteen_days`
- [x] With no Drive, a tuning question is answered with "upload a drive first" — `test_with_no_drive_a_tuning_question_is_answered_with_upload_a_drive_first`

# 16 — Model scorecard and clarity judge

**What to build:** eval layers 2 and 3, run on demand with the key from `.env`, so the choice between `qwen3.8-flash:free` and a paid model is measured, not guessed.

- **Grounding scorecard:** replay the 9 drives plus a set of no-upload questions through each listed model; report per model the share of replies that pass verify first time, after repair, and that fall back, broken down by failure (wrong number, wrong cell, uncited claim, wrong action, banned advice).
- **Clarity judge:** an LLM judge scores each reply for one action, plain words, and naming the drive to log; a sample is written out for the owner to grade, and judge/owner agreement is reported.

**Blocked by:** 09

**Status:** done — 3 Oct 2026. `kta_server/scorecard.py` (`KTA_SCORECARD=1 uv run python -m kta_server.scorecard`): 23 offline tests + 2 gated replay tests (pass with the gate on, skip cleanly without); pytest 227 passed/2 skipped, npm test 206 passed. Live run against a real model not done (no key here); a paid model id is not pinned, add it to `KTA_LLM_MODELS`.

- [x] One command runs the scorecard for every model listed in config and prints a table (test_the_table_names_the_model_and_the_five_classes, test_default_models_include_the_ticket_free_model, test_env_example_documents_the_model_list; seam1/test_scorecard_live.py::test_the_scorecard_reports_first_repaired_and_fallback_per_model)
- [x] Results are saved with the date and model so runs can be compared (test_results_are_saved_under_the_date_and_model)
- [x] The clarity sample is written in a form the owner can grade quickly (test_the_clarity_sample_grades_in_under_a_minute, test_owner_grades_round_trip_and_report)
- [x] Not part of the default test run; needs no key to be skipped cleanly (test_gate_needs_the_env_var, test_no_env_skips_with_one_line_reason, test_env_without_key_skips_with_one_line_reason)

# Tuning shop — tracker

Why: `analysis.md`. What: `spec.md`. Architecture: `docs/adr/0005-llm-orchestrates-engine-decides.md`.
Eval: `eval.md`. Every row is committed as its own commit (author giaosudau).

| # | Ticket | Status | Proof |
|---|---|---|---|
| TS-01 | Whole log read, no cherry-picking | verified | 9/9 logs: engine samples = CSV lines − 2 header lines |
| TS-02 | D7 Older log = history only | done | `test_an_older_log_uploaded_later_joins_history_and_leaves_the_steps_alone`; found in the owner's own DB |
| TS-03 | D16 A drive that is the Baseline drive sets the Baseline | done | engine test; live run contradiction |
| TS-04 | D1 Agent orchestrates every reply and question | done | live runs; `test_a_request_for_a_change_reaches_the_tuner_but_can_never_grant_it` |
| TS-05 | Verify false positive: rpm read as psi | done | `test_an_rpm_next_to_a_psi_figure_is_not_read_as_boost` |
| TS-06 | D4 Drive brief + Log checkpoints | done | `copy.log_guide`, `copy.log_checkpoints`; browser |
| TS-07 | D5 Health report | done | `copy.health_rows`; browser |
| TS-08 | D6 Map tour + read any table + teach | done | `tour.py`; live "Explain these tables" |
| TS-09 | D8 Cite or propose | done | `propose_knowledge`, `--proposals`; 8 new sourced cards |
| TS-10 | D9 Edit and resend | done | browser |
| TS-11 | D10 Sidebar shop ticket | done | browser 1280 + 390 |
| TS-12 | Live scorecard fixed + real ask path + teaching questions | done | `eval.md` |
| TS-13 | D11 Hard map rules in verify | done | `test_verify.py` map rules (invented table, advice outside plan, wrong value, psi grounding, run/set/try) |
| TS-14 | Live typed answers stream their tool steps | done | `test_a_typed_answer_streams_its_tool_steps_then_the_answer`; browser |
| TS-15 | D13 Table viewer 2D/3D | done | `/api/map/table` tests; browser captures |
| TS-16 | D14 Fuel tag + premium-fuel test | done | engine `Fuel test…`; `test_fuel_test.py` |
| TS-17 | D15 Map slot tag, phase 1 | done | slot pairing rule in engine + seam test |
| TS-18 | D12 Recommendation eval | done | `test_map_recommendations.py` (6 overshoot levels) |
| TS-19 | Retire the old browser app | done | engine + server suites green after the move |

## Next

- D15 phase 2: slot-aware Map versions.
- Citation-support judge.
- Ignition "remove timing" proposals once the load axis is digitized.
- Confirm TunerView's maximum logging rate (all owner logs are 7.5/s against the 10/s checkpoint).

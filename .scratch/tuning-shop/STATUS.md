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

| TS-20 | Knowledge from the forum and the MAF tool: research note + 7 cards | done | `docs/research/forum-afr-maf-research.md`; `kc-open-loop-wot`, `kc-maf-wot-calibration`, `kc-maf-data-rules`, `kc-misfire-gauges`, `kc-iat2-side`, `kc-wot-lean-timing`, `kc-tune-one-thing`; `test_knowledge.py` green |
| TS-21 | D24 One car editor (bug F4: Edit car adds a card per click) | todo | "Edit car" twice → one editor; an older unsaved card can't save |
| TS-22 | D19 + D23 Front desk intents and a knowledge-search floor (bug F1) | todo | `owner-queries.md` §A as a seam test: "Hello I want to tune my car" never returns a card, at every stage |
| TS-23 | D20 Recap on a new chat and as the answer to a greeting | todo | seam test per stage; browser "New chat" shows the Recap before typing |
| TS-24 | D21 Agent prompt from the Car file, not a hard-coded car | todo | prompt test: a different profile → a different car sentence; no profile → asks which car |
| TS-25 | D22 Say what you read (bug F2) | todo | an answer that read no Drive has no Drive line; the window line names the car file's total and the Flash it starts from |
| TS-26 | D18 Chats stored in SQLite and listed (bug F6) | todo | routes + seam tests; reload and "New chat" keep the old chat in the list; delete never removes a Drive |
| TS-27 | D25 Suggested replies on every turn (bug F5) | todo | `owner-queries.md` §C; chips only under the latest message |
| TS-28 | D17 Car file panel (bug F7) | todo | browser 1280 + 390 |
| TS-29 | D26 Logger setup + D27 goal at intake | todo | brief names the owner's missing gauges; goal stored and reorders options only |
| TS-30 | D28 phase 1 Open-loop check + full-throttle error vs AFR Command | todo | engine test on a log with STFT flat under boost; Health report row |
| TS-31 | `kta-knowledge approve`: the reviewer step D8 names | todo | a proposal becomes a card only with a source doc + section |

## Next

Build order: TS-21 (bug, smallest) → TS-22 → TS-23 → TS-24 → TS-25 → TS-26 → TS-27 → TS-28 →
TS-29 → TS-30 → TS-31. The front desk (TS-21 to TS-27) comes before any new tuning feature: an
owner who is greeted with a table lecture never uploads the log that every round needs.

- Pre-existing failure found on 4 Oct (also red on the base commit): `tests/test_scorecard.py::
  test_a_table_outside_the_plan_is_a_wrong_cell` classifies the issue as "other".
- D15 phase 2: slot-aware Map versions.
- Citation-support judge.
- Ignition "remove timing" proposals once the load axis is digitized.
- Confirm TunerView's maximum logging rate (all owner logs are 7.5/s against the 10/s checkpoint).

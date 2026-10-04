# Tuning shop — tracker

Why: `analysis.md`. Architecture: `docs/adr/0005-llm-orchestrates-engine-decides.md`. Eval: `eval.md`.

| # | Ticket (decision) | Status | Proof |
|---|---|---|---|
| TS-01 | Whole log read, no cherry-picking | verified | 9/9 logs: engine samples = CSV lines − 2 headers (analysis §3) |
| TS-02 | D7 Older log = history only, never settles current steps | done | `test_an_older_log_uploaded_later_joins_history_and_leaves_the_steps_alone`; root cause found in the owner's own DB |
| TS-03 | A drive that is the Baseline drive sets the Baseline | done | engine `A Drive that already is the Baseline drive sets the Baseline…`; live run contradiction |
| TS-04 | D1 Agent orchestrates every reply and every question | done | live run: teaching answers pass verify first time; `test_a_request_for_a_change_reaches_the_tuner_but_can_never_grant_it` |
| TS-05 | Verify false positive: rpm read as psi | done | `test_an_rpm_next_to_a_psi_figure_is_not_read_as_boost`; was ~half of baseline fallbacks |
| TS-06 | D4 Drive brief with sections + checkpoints; log checkpoints after upload | done | `copy.log_guide`, `copy.log_checkpoints`; browser |
| TS-07 | D5 Health report (engine's 13 checks) | done | `copy.health_rows`; browser |
| TS-08 | D6 Map tour + read any table + teach | done | `tour.py`, `get_map_table`; live "Explain these tables" |
| TS-09 | D8 Knowledge harness: cite or propose | done | `propose_knowledge` → `knowledge/proposed/`, `--proposals`; 7 new sourced cards |
| TS-10 | D9 Edit and resend a message | done | browser |
| TS-11 | D10 Sidebar = shop ticket, steps grouped under the drive that settles them | done | browser 1280 + 390 |
| TS-12 | Live scorecard fixed (never ran) + questions on the real ask path + teaching questions | done | `eval.md` |

## Follow-ups (not done)

- Stream a typed answer's tool steps live (today they appear when the answer lands; Drive replies stream).
- Judge whether a cited card actually supports its sentence (verify checks the card exists, not support).
- Sample-rate checkpoint: all 9 owner logs are 7.5 samples/s against the 10/s bar from research — confirm TunerView's maximum before keeping the bar.
- Ignition: read-only until the load axis is digitized; then only "remove timing" proposals.
- Undo step body repeats a sentence (server copy).

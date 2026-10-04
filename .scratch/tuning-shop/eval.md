# Eval — the tuning shop harness vs the narrator (4 Oct 2026)

Live runs on TokenHarbor's free models, the owner's 9 real drives, the real app in process
(`python -m kta_server.scorecard`). "Pass" = the model's reply cleared verify (numbers, step, cells,
real tables, banned advice, citations); "fallback" = the built-in reply stood.

## Model scorecard

| Model | Baseline: narrator (9 drives + 3 questions) | Shop harness (9 drives + 8 questions) |
|---|---|---|
| | first / repaired / fallback | first / repaired / fallback |
| qwen3.8-flash | 50% / 0% / 50% | **82% / 0% / 18%** |
| deepseek-v4.1-flash | 42% / 17% / 42% | **82% / 6% / 12%** |
| mimo-v2.6-flash | 25% / 25% / 50% | **65% / 24% / 12%** |

Replies that pass (first + repaired): qwen 50% → 82%, deepseek 58% → 88%, mimo 50% → 88%.
"Wrong number" failures: 2–3 per model → **0** for every model.

Raw results: `server/eval-results/2026-10-04/` (shop) and `2026-10-04-baseline-narrator/`.

## What moved the numbers

1. **Verify false positives were the biggest cost**, not the model: an rpm next to a psi figure,
   or a temperature near the word "boost", was read as a boost above the ceiling (about half of the
   baseline's drive fallbacks). Fixed with regression tests.
2. **The questions now run the real ask path** with tools; the baseline's questions came from a
   tool-less stand-in that could only "invent" numbers.
3. **The map tour and table reader hand the model the cards they cite**, so citing a table card is
   no longer an "unknown card".

## What still falls back — and is meant to

| Case | Why it's correct |
|---|---|
| 30 Aug 15:09 (3 s log) | Too short: the built-in "nothing read" reply is the answer by design (scored as fallback). |
| "Which tables would you change first?" (qwen, mimo) | The model advised changing `WOT_Enrich_L`, which the checked plan doesn't change: the hard map rule rejected it and the safe answer stood. |
| deepseek 1 Sep 08:13 | Suggested boost as something to change; the plan doesn't raise boost: banned advice rejected. |
| mimo "names None as the step" (4, all repaired) | The model forgot to name the decided step; one repair fixed each. A prompt nudge, not a safety issue. |
| qwen 5 Sep 07:56 | Provider connection failure; the built-in reply stood. |

## Map recommendation eval (deterministic, every run)

`server/tests/seam1/test_map_recommendations.py`: across 6 boost-overshoot levels, every Flash plan
the engine produces is audited against `data/ktuner-maps-digitized.json`: real editable table, cell
inside it, `before` = the map's value in its own decimals, `after` lower by ≤ 1 psi in the same
decimals and under the ceiling, both independent checks accepting, verify rejecting any other value.
6/6 pass.

## Live product runs (browser, real model)

- Upload → shop reply: checkpoints, health report, map tour, Next step, the tuner's markdown answer
  — passed verify first time on 1 Sep 08:13 and 30 Aug 16:01.
- "Explain these tables" (mixture) → a teaching answer with the owner's WOT Enrich values, locked
  status, what unlocks it.
- Edit and resend, live tool-step streaming on typed answers, the 2D/3D table viewer, fuel/slot tags.
- Browser smoke (`web/e2e/chat.e2e.js`) 8/8 against the live model.

## Known limits

- Verify proves numbers and citations exist, not that a cited card supports its sentence — a judge
  layer is next.
- Free-provider latency: a live Drive reply takes 1–3 minutes (the built-in report shows in seconds).

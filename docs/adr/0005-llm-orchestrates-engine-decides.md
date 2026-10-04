# The LLM orchestrates and teaches; the engine and the map checks decide

*4 Oct 2026. Supersedes the "explainer, never a decider, ≤150 words" role in ticket 08. ADR 0002 (the
engine is the only source of tuning math) and ADR 0003 (two independent map checks) still bind.*

## Context

The owner wants an AI-native tuning shop: every chat message and every Drive reply goes through the
model, which chooses tools, reasons, and teaches table by table. Until now the model only rephrased
a decided reply in 150 words, and typed questions reached it only when a regex and a knowledge card
matched. A live run on the owner's 9 drives (`.scratch/tuning-shop/analysis.md` §3) showed the model
could do much more — and that most of its rejected drafts were the verify step's own false
positives, not model mistakes.

## Decision

1. **Every chat message and every Drive reply runs the agent** when a key is set. The agent picks
   its tools (drive facts, insights, health report, log checkpoints, map tour, any whole map table,
   knowledge search, a picture) and writes the answer in markdown, up to ~280 words.
2. **What the model may never do, enforced in code (`verify.py`), not in the prompt:** quote a number
   no tool returned; name a step other than the engine's Next step; name a cell or value outside the
   checked Flash plan; advise lower knock sensitivity, added timing, boost above the ceiling, or a
   hand AFM curve; make a claim without a card citation. A failing draft gets one repair, then the
   built-in reply stands.
3. **Teach every table, change only checked families.** The model can read any table in the Map
   version and explain it with the owner's real values; changes come only from the Flash plan
   (MAF Scaling, WOT/mixture target, boost). Ignition and knock sensitivity are read-only
   (`kc-table-ignition`).
4. **Unknown facts become proposals, not claims.** `propose_knowledge` writes
   `knowledge/proposed/kp-*.md`; a reviewer sources it into a card (`python -m kta_server.knowledge
   --proposals`) before it can be cited.
5. **Hard map rules, in code:** a table the reply names must exist in this car's map data;
   advising a change to a table the checked plan doesn't change fails; an advised before → after
   must equal a plan cell; a psi figure above the ceiling passes only as an advice-free reference a
   cited card holds. An eval (`test_map_recommendations.py`) audits every cell of every plan the
   engine produces against `data/ktuner-maps-digitized.json`: real editable table, inside the
   table, `before` equal to the map's value in its own decimals, `after` in the right direction by
   at most one step, both checks accepting.
6. **Measured, not assumed:** the live scorecard (`kta_server.scorecard`) replays the 9 drives and
   8 owner questions through each model and reports first-pass, repaired and fallback rates by
   failure class.

## Consequences

- With no key the app still works: every reply is the built-in one.
- Verify is now on the critical path of the product's quality; its false positives cost good
  answers (the "rpm read as psi" bug cost about half of all drive replies). Every verify rule gets a
  regression test from a real rejected draft.
- Verify proves numbers and citations exist, not that a cited card supports the sentence: a judge
  check for citation support is the next eval layer.

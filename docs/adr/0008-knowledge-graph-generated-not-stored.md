# The knowledge graph is generated from what already holds the facts, never a new store

*10 Oct 2026. Panel: `docs/research/knowledge-graph-panel.md`. ADR 0001 (limits relative to the car's
Baseline), 0002 (the engine is the only tuning math), 0003 (two map checks share `thresholds.json`)
and 0005 (the LLM orchestrates, the engine decides) still bind.*

## Context

The owner proposed an ontology for tuning knowledge: Goal → Constraint → Context → Map (family,
table, cell range) → Observation → Judgment → Action, with cards carrying cell deltas, gate numbers
and evidence queries. Hand-running it on this car showed the spine is right, but the Boost step was
already defined in four places (card, `thresholds.json`, engine, glossary) and one disagreed; the
proposal added a fifth. The map file has no load axis (columns are unnamed, 10–20 per table), so
rpm × load cell ranges cannot be checked. Gate numbers like 0.56 are derived per car (ADR 0001),
not constants.

## Decision

1. `knowledge/graph.json` is **generated** (`python -m kta_server.knowledge --graph`) from cards,
   `data/ktuner-maps-digitized.json`, `data/thresholds.json` and engine registries (measures, lever
   ids). Nobody edits it; CI checks it is fresh.
2. Cards **reference** table, threshold, measure and lever ids. Tuning numbers live only in
   `thresholds.json` and the engine; a number a card prints under a threshold's name must equal it.
3. Cells are addressed as table + rpm rows + column `c of N`. A `load` range is refused until that
   table's column axis is digitized.
4. The build fails on: a dangling reference; a row or column outside the table; a change edge into a
   forbidden table; two Play families editing one table; a Play without proof and undo; an engine
   plan that changes rows its card does not name.
5. Two lifecycles: **knowledge** (proposed → current → superseded; a reviewer promotes it with sources
   and an impact replay over the example drives) and **outcome** (per car, written by Flash readback;
   outcomes raise proposals, never change rules).
6. One JSON file and Python dicts. No graph database, embeddings or ontology language.

## Consequences

- Drift between card, thresholds and engine becomes a build failure, not a wrong answer in chat.
- Every proposal shows which of the 9 drives would get a different Next step before it is accepted.
- Glossary entries define terms without numbers and point to their card.
- ≈ 15 of 46 cards need the new frontmatter; the rest are unchanged.
- Cell-level evidence ("where in the table knock collects") waits for Phase 2: digitized column axes
  and a matching load channel in the log.

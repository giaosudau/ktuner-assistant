# Panel 3: a tuning knowledge graph the agent can't drift from

*10 Oct 2026. Panel: Principal AI Engineer, Principal Software Engineer, Principal Product Manager,
and a Honda turbo Tuner. Input: the owner's ontology proposal (Goal → Constraint → Context → Map →
Observation → Judgment → Action, node and edge types, card frontmatter `table-ref`/`evidence`/`gates`,
`graph.json`, validate-and-learn gates, three code guards). Every number below comes from the repo:
`data/ktuner-maps-digitized.json`, `data/thresholds.json`, `knowledge/cards/`, `engine/`, ADRs 0001–0006.
Decision recorded in ADR 0008.*

**Verdict.** The proposal's spine is right and matches how a tuner works and how this repo already
talks (Flash plan, Verdict, Drive brief, Flash readback). Hand-running it on this car breaks it in
four places: it addresses table cells by a load axis the data does not have, it stores tuning
numbers in a third place next to the engine and `thresholds.json`, it invents a query language
nothing runs, and it pins gates that ADR 0001 says must move with the car. Phase 1 keeps the spine
and changes what the graph *is*: a **generated index that joins three things that already exist**
(sourced cards, the map file, the engine's gates and measures), never a new place where tuning
facts live. Its value is shown end to end by one command: change a card or a threshold, replay
the 9 drives, see which Next steps change.

---

## 1. The test: hand-run the proposal on this car

Three real situations, traversed by hand through the proposed graph.

**Scene 1 — "I want more power" (downpipe + PRL HVI, E10 RON95, hottest drive Fuel-quality score 0.64, no floored pull logged).**
`Goal(power) -blocked-by-> Threshold(kc<=0.56<5200rpm)` fires, correctly. Then
`Play(boost-step) -targets-cell-> BoostTarget2-Normal CellRange[3500-4500rpm, load idx 6..15]`.

- *Breaks:* the map file has no load axis. Every table stores `rpm_axis` for its rows and unnamed
  columns: 10 columns for Ignition Max, Knock Sens, WOT Enrich and DI Fuel Pressure; 11 for Ethanol
  Boost Adj; 16 for the nine Boost Target tables and Boost By Gear; 20 for Ignition Base and Final
  Boost Target. The engine's plan cells already say so honestly: `{rpmRow, col, of}`
  (`engine/kta-car.js:1538`). `load: idx 6..15` cannot be validated, and no logged channel maps to
  that column, so `CellEvidence` per rpm × load cannot be computed. The fix-spec already concluded
  "teach-only until a load channel exists" for ignition removal.
- *Breaks:* 0.56 is not a constant. ADR 0001 derives it: Baseline 0.49 + 0.7° ÷ 10.2° (this map's
  retard table under boost, re-measured after every Flash). Today `thresholds.json` pins
  `boost_step_gates.kc_max = 0.56` and `kc-boost-step` repeats it; both are wrong the day a Flash
  changes the retard table. The proposal would add a third pinned copy.

**Scene 2 — 23 Aug 20:38: trims −20.8 / −20.8 / −21.4 % in every load band, right after a Flash (19:59 was within −1.6 %).**
`Signal(ltft) -judged-by-> Threshold(trim)` → `Card(kc-trim-cause)` → `Play(AFM preset)`.
Works conceptually, but the proposal's `Evidence.query: pull.median(...) WHERE ...` is a new
language with no interpreter. The engine already computes trims by load band, Log checkpoints and
judged peaks; a second, string-typed query layer is a place for silent disagreement.

**Scene 3 — four places define the Boost step; one already disagrees.**
Today, with no graph:

| Source | Boost step = |
|---|---|
| `kc-boost-step` | +1 psi, **Boost Target 2 Normal L/H only (Tune 2)**, rows **3,500–4,500** |
| `data/thresholds.json` | `boost_step_gates.rows_rpm` [3,500, 4,000, 4,500]; `boost_pairs.tune2_alone` |
| `engine/kta-car.js` (commit c4f6b28) | Tune 2 only, rows from `thresholds.json`, cells ≥ 15 psi, capped by the Final Boost Target peak |
| `CONTEXT.md` (uncommitted) | +1 psi on **the Normal boost targets**, **3,000 rpm and above** |

And the engine cites "ADR 0007" for it, which exists only on the `wave2-boost-step` branch. The
proposal's `changes-cell[delta, step-max]` edge would be a fifth copy. This is the real problem a
knowledge graph must solve for this product: **not storing more, but catching drift between the
places that already store it.**

## 2. The panel

| | Keep | Cut | Change |
|---|---|---|---|
| **Tuner** | Tune order and one-thing-at-a-time as hard method; proof + undo on every Play; read-only ignition and knock sensitivity. | `CellRange.load` until the column axis is digitized. Fixed gate numbers. | Address cells as KTuner shows them: table, L/H cam, Tune 1/2/3, Normal/ECO, rpm row, column `c of N`. Gates in the unit that hurts the engine (degrees of timing, % of rail target), converted per car. |
| **AI Engineer** | Tools-only numbers, `verify.py`, banned advice, method cards loaded before any Flash plan; `propose_knowledge`. | Free-text `Evidence.query`. Graph DB, embeddings, RDF/OWL: 46 cards, 39 tables, ~40 thresholds fit in one JSON file. | Retrieval by **entity** (table, threshold, measure, family), not only by tokens: the agent's real questions name a table or a Health-report line. Citation-support judge as the next eval layer (ADR 0005 named it). |
| **Software Engineer** | Files are the source; graph is generated; CI validates. | `changes-cell` deltas in cards (ADR 0002: engine is the only tuning math). `Vehicle/Mod/Fuel/Env` nodes (that is the Car file). Stored `Event/Evidence` (computed per Drive). | Cards **reference** threshold ids, engine measure ids and engine play ids; the build fails when a reference is dangling or a number a card prints disagrees with `thresholds.json`. |
| **PM** | Every answer ends in one KTuner action or an honest "no map change". | "Learning" that changes rules from one car's drives. | Two lifecycles, not one: **knowledge** (proposed → current → superseded, gated by sources) and **outcome** (offered → flashed → read back → proved / undone, gated by logs). Each review shows its impact on real drives before it is accepted. |

Pros of the proposal, as the panel weighs them: right layering; frontmatter extension keeps
`knowledge.py` parsing; CI validation against map and thresholds; explicit `undone-by`; the
guards it keeps are already in code. Cons: three new sources of tuning truth (cell deltas, gates,
queries); a load axis that doesn't exist; conflates car learning (Baseline, trim median) with
knowledge; no way to see knowledge in practice before it ships.

## 3. Final design (Phase 1)

### 3.1 Three layers, one owner each

| Layer | What | Lives in | Who changes it |
|---|---|---|---|
| **Schema** (the ontology) | Node and edge types below | `server/kta_server/knowledge.py` (constants + checks) | Code review |
| **Knowledge** (general, sourced) | Cards, thresholds, table roles, Play definitions | `knowledge/cards/`, `data/thresholds.json`, `data/ktuner-maps-digitized.json`, engine `KTA.TABLES` / play ids | Reviewer, after sources and impact replay |
| **This car** (observed) | Car profile, Installs, Map versions, Flashes, Baseline, Drives, **Outcomes** | Car file / server DB | The engine from logs; the owner for profile facts |

The graph (`knowledge/graph.json`) is **generated** from the first two layers and **read** against the
third at runtime. Nobody edits it.

### 3.2 Node types

| Node | Id example | Built from |
|---|---|---|
| `Family` | `boost` | Fixed list in tune order: airflow, wot-mixture, boost, ignition, knock-sens, basemap (the Map tour order) |
| `Table` | `Boost_Target_2_Normal_H` | Map file key; attributes parsed from the id: family, tune 1/2/3, Normal/ECO, cam L/H; `role` edit/read from `thresholds.json` `editable_tables` / `forbidden_tables` (the lists the engine and `mapcheck.py` already share); `rows` = rpm axis; `cols` = N with `colAxis: "unknown"` until digitized |
| `Threshold` | `kc_watch_deg` | `thresholds.json` entry: value, unit, basis (measured / source / judgement / provisional), source; optional `derive` (e.g. `baseline + deg / retard_table`) |
| `Measure` | `kc.peakJudged`, `pull.floored`, `trim.lt.byBand`, `fp.ratio` | One exported engine registry, each with its log channels from `KTA.REQUIRED` |
| `Card` | `kc-boost-step` | `knowledge/cards/*.md`, kinds unchanged |
| `Play` | `boostPlus` | A `kind: play` card plus `engine-id` (the engine's lever id); status `actionable` if the engine builds it, else `teach-only` |
| `Proposal` | `kp-how-the-final-boost-target-is-arbitrated` | `knowledge/proposed/` |

Not nodes: Goal (a Car-file field that reorders, never unlocks — CONTEXT.md), Vehicle/Mod/Fuel/Env
(Car-file state; cards test them with `requires`), Event/Evidence (computed per Drive by the engine).

### 3.3 Edges (all generated)

| Edge | From → to | Source of truth |
|---|---|---|
| `about` | Card → Table / Threshold / Measure / Family | card frontmatter |
| `in-family` | Table → Family | table id |
| `changes` | Play → Table (rows, cols, direction) | **engine plan builder** for that `engine-id`, read by building the plan on fixture drives |
| `gated-by` | Play → Threshold | card frontmatter, checked against the engine's gate list |
| `measured-by` | Threshold → Measure | `thresholds.json` (`measure` field) |
| `proved-by` | Play → Drive-brief kind (cool pulls, hot drive, shakedown) | card frontmatter |
| `undone-by` | Play → previous Map version / KTuner slot | card frontmatter |
| `requires` | Card → Car-file predicate (`install: downpipe`, `fuel: E10`) | card frontmatter |
| `supersedes` | Card → Card | `status: superseded-by` |

### 3.4 Card frontmatter v2 (additive; the body is untouched)

`kc-boost-step`, rewritten. Numbers it cites come from `thresholds.json` by id; the card no longer
owns them.

```yaml
id: kc-boost-step
kind: play
basis: judgement            # measured | source | judgement | provisional
engine-id: boostPlus        # absent or unknown to the engine -> status teach-only
about: [family:boost, Final_Boost_Target_L, Final_Boost_Target_H]
tables:                     # what the card talks about; checked against map file AND engine plan
  - { id: Boost_Target_2_Normal_L, rows: [3500, 4500], cols: all }
  - { id: Boost_Target_2_Normal_H, rows: [3500, 4500], cols: all }
thresholds: [boost_step_max, boost_ceiling_psi, boost_step_gates.kc_max, boost_step_gates.afr_lean_max,
             boost_step_gates.difp_min_pct, boost_step_gates.overshoot_psi, boost_step_gates.undershoot_psi]
measures: [pull.floored, kc.peakJudged, boost.overshoot, boost.undershoot, afr.min, fp.ratio]
proved-by: [cool-floored-pulls x2, hot-drive x1]
undone-by: switch-to-tune-1
requires: {}
```

Rules: `rows` must be values on that table's rpm axis; `cols` is `all` or `[c1, c2]` within `of`;
a `load` key fails the build until the table has a digitized column axis.

### 3.5 Integrity checks (fail the build)

Extends `validate_cards` in `server/kta_server/knowledge.py`; runs in `make test`.

1. Every `about`, `tables`, `thresholds`, `measures`, `engine-id` reference resolves.
2. Table rows exist on its rpm axis; columns fit `of`; no `load` without a column axis.
3. A number a current card prints under a name that matches a threshold id equals `thresholds.json`
   (value and unit). Replaces the separate fact-check pin list with one source.
4. A table in `forbidden_tables` (ignition, knock sensitivity, ECO, Final Boost Target, …) is never
   the target of a `changes` edge, and no card's `tables` claims to change it.
5. **One editor per editable table:** each `editable_tables` entry has exactly one actionable Play
   family that changes it (with `one_family_per_flash`, the map-actionability rule, now enforced
   across cards, not only inside one plan).
6. Every Play has `proved-by` and `undone-by`; every actionable Play's `changes` edge, built on the
   fixture drives, stays inside the rows and tables its card names (catches Scene 3).
7. `graph.json` is fresh (rebuild and diff in CI), like `index.json` today.

### 3.6 How the agent uses it

The guards stay in code (ADR 0005); the graph makes them reachable and explainable.

- **One new read tool, `knowledge_for(entity)`**: a table, threshold, measure, family or Play id →
  connected cards, the threshold **as derived for this car today** (0.56 with its 0.7° and 10.2°
  inputs), the Play's status and, when locked, the engine's `locked_until` reason with the Drive
  that measured it. The tuner calls it when a reply names a table or a Health-report line.
- **Method cards as pre-prompt**: `kc-tune-order`, `kc-tune-one-thing`, `kc-log-gate`,
  `kc-shakedown` load before any Flash plan reply; read-only table cards load whenever such a
  table is named.
- **`verify.py` gains one rule**: a sentence naming a table must cite a card whose `about` or
  `tables` include it.

### 3.7 Learning, split in two

**Knowledge lifecycle** (general facts). `proposed` → `current` only with: a primary or KTuner
source (forum = one car, not a rule — `kc-maf-wot-calibration`); integrity checks green; and the
**impact replay** attached (3.8). Promotion is a reviewer action, never the model's.

**Outcome lifecycle** (experience on this car). Every actionable Play that is flashed gets an
Outcome row: Play id, Map version, Flash, proof Drives, result (proved / undone / can't tell), the
failing gate and its measured value. Flash readback writes it. Outcomes never change a rule. Two
outcomes failing the same gate on the same Play raise a **Knowledge proposal** with the outcomes
attached ("Boost step undone twice on overshoot after a downpipe: should B2 trim come first?") for
review. Car learning (Baseline 0.49, trim median) stays where it is, in the engine and Car file.

### 3.8 Eval: knowledge in practice

| Layer | What it proves | Gate |
|---|---|---|
| **Integrity** (3.5) | The graph is consistent with map, thresholds and engine | Build fails |
| **Impact replay** `python -m kta_server.knowledge --impact <card-or-threshold>` | For each of the 9 example drives: Verdict, Next step, Flash plan cells, Map tour status — before vs after the change | Attached to every proposal review; unexpected diffs block |
| **Retrieval** | Golden set of ≥ 20 owner questions (the 10 in `docs/research/owner-voices.md` §2, the 8 scorecard questions, then real chat questions as they arrive), each with expected card ids | recall@5 ≥ 0.9 by token search + `knowledge_for` |
| **Grounded answer** | Live scorecard (ADR 0005) per question: first-pass verify rate, cited cards ⊇ expected, citation-support judge | Reported per model; regressions block a card change |

The impact replay is the product's demonstration: knowledge goes in, and you see exactly which
drives would now get a different Next step, before any owner does.

## 4. In the chat

Two people talk to the shop: the **owner** (one car, not a tuner) and the **reviewer** (the
maintainer). The shop asks only for things it cannot read: a source, a fact about the car, a
confirmation of a Flash. It never asks either of them to make a tuning call.

**A. A gap becomes a proposal, not a claim.**
> Owner: How does KTuner pick the final boost target when Tune 2 says 21?
> Shop: I don't have a sourced card for how KTuner arbitrates the final target, so I won't guess.
> What I can show: your Final Boost Target tops out at 23.4 psi (its top column, every rpm row), and the logged target
> is held lower by the throttle ramp (`kc-table-boost`). I've saved the question for review.
> *Chips:* `Add a source` · `Show the boost tables` · `What can I do today?`

**B. The owner teaches.** "KTuner help says …" → the shop asks one thing: *"Paste the link or a
screenshot — I can only record it with its source."* It writes the proposal with the owner as
`why` and the link as `source-hint`. Nothing is cited until review.

**C. The reviewer reviews** (reviewer mode, a card per proposal): claim; sources; integrity result
(e.g. "prints `kc-watch 0.60`, `thresholds.json` says 0.56: conflict"); **impact replay** ("changes
the Next step on 0 of 9 drives; Map tour boost text now cites it"). Actions: `Accept as card` ·
`Edit` · `Needs source` · `Reject`. Accept writes the card, rebuilds index and graph, re-runs checks.

**D. An outcome lands.** After the proof drive:
> Shop: Boost step: **undone**. Overshoot reached 1.9 psi at 4,000 rpm; the limit is 1.5. Flash
> Tune 1 now (that is your undo); nothing else changes. Next: one cool drive with two floored pulls,
> to confirm you're back where you were.
> *Chips:* `I flashed Tune 1` · `Show the pull` · `Why 1.5?`

It asks the owner to confirm the Flash only when Flash readback can't tell from the log.

**E. The owner disagrees with a limit.** "Forums say 0.7 is fine." → `knowledge_for(kc_watch_deg)`:
the 0.7° rule, its basis (judgement, labelled), why forum numbers come from US 91/93 cars
(ADR 0001), what 0.64 costs this car (1.5°). `Propose a different limit` opens a proposal with the
impact replay. The limit does not move in the chat.

## 5. The same scenes on the final design

Each ends in one KTuner action or an explicit "no map change", with the full value story.

**Scene 1 — more power.** `knowledge_for(family:boost)` → Play `boostPlus` (actionable, locked):
gates `boost_step_gates.kc_max`, shown as derived for this car (hot drive 0.64 = 1.5° of timing
against 0.7° allowed) and `pull.floored` (0 of 2). **No map change today.** Unlock path: a Drive brief for two floored pulls
on a cool morning, then a hot drive. *Other ways:* a forum "+2 psi", a shop's 24 psi vendor file —
both skip the knock and overshoot proof this car fails today. *Expectation:* on E10 RON95 (≈ 90 AKI)
the ladder will likely stop early; the downpipe gain is already in the car.

**Scene 2 — 23 Aug 20:38.** `trim.lt.byBand` ≈ −21 % in every band, right after a Flash →
`kc-trim-cause` → Play `afm-preset` (actionable) → `changes MAF_Scaling_*` (the preset the fitted
housing calls for, `kc-prl-hvi-factory`). **One action:** select that MAF Scaling preset, save a new
Map version; undo = the file flashed before 20:38. Proof: trims within ±5 % on the next calm drive
(19:59 was −1.6 %). *Why better:* the old engine called this drive a knock Stop; the cause was air
metering, and no amount of fuel or timing editing fixes it.

**Scene 3 — drift.** Card, `thresholds.json` and engine are now checked against each other:
change `rows_rpm` to start at 3,000 and the build fails on check 6 ("engine plan changes row 3,000;
`kc-boost-step` names 3,500–4,500"). The glossary is prose no check reads, so the rule is:
**glossary entries define the term without numbers and point to the card** — the uncommitted
"3,000 rpm and above" goes.

**Scene 4 — new knowledge.** The Final Boost Target proposal gets the KTuner help page as source →
card `kc-final-boost-target` (`about: Final_Boost_Target_L/H`, threshold `boost_ceiling_final_peak`
derived as that table's max, 23.4) → impact replay: 0 of 9 Next steps change; Map tour boost line
and Scene 1 now cite the arbitration. Accepted.

## 6. Missing pieces and risks

1. **The column axis.** Digitize what the columns of each table mean (from KTuner screenshots) and
   whether TunerView logs that axis. Until then: rpm-row evidence only, cell-level "where knock
   collects" stays teach-only.
2. **Logger gaps.** AFR Command and MAF Hz are often missing (Logger setup); gates that need them
   say Can't tell, and the graph shows which Measure is blind.
3. **Engine registries.** `Measure` and Play (lever) ids need one export from the engine
   (`KTA.MEASURES`, `KTA.PLAYS`); today they're implicit in code.
4. **Branches in flight.** ADR 0007 (boost ceiling proven by datalog) lives on `wave2-boost-step`
   while the engine on this branch already cites it. Merge before the graph's checks land, or
   check 1 fails on its first run.
5. **Reviewer bottleneck.** One maintainer reviews. Impact replay keeps a review to minutes; a
   proposal older than 14 days surfaces in the reviewer's Recap.
6. **Risk: frontmatter tax.** Only cards that name tables, thresholds or Plays need v2 fields
   (≈ 15 of 46); the rest stay as they are.

## 7. Roadmap

| Phase | Goal | Ships | Exit criteria |
|---|---|---|---|
| **1. Foundation** (this doc) | Knowledge is consistent, reachable by entity, and its effect is visible | Frontmatter v2, `graph.json`, integrity checks, `knowledge_for`, Outcome rows, impact replay, retrieval golden set, chat flows A–E | All checks green on the 46 cards; Scene 3 drift resolved; impact replay attached to the next 3 proposals; retrieval recall@5 ≥ 0.9; no answer naming a table without a matching card |
| **2. Cell evidence** | Read where in a table a problem collects | Column axes digitized; load channel in the Logger setup; per-cell evidence (KC retard, boost error) on fixture drives; a remove-only ignition Play (degrees, where retard collects) | Two matched drives show a measurable change in the cells named |
| **3. Many cars** | Knowledge that generalizes, outcomes that teach | `requires` evaluated per Car profile; outcomes pooled across cars as priors with counts; proposals from pooled outcomes | A rule backed by ≥ N cars' outcomes, still promoted by a reviewer |

## 8. Phase 1 tickets (in order)

1. **Engine registries** — export `KTA.MEASURES` and `KTA.PLAYS` ids from `engine/kta-engine.js` /
   `engine/kta-car.js`; test that each id resolves. *(Unblocks checks 1 and 6.)*
2. **Resolve the boost-step drift** — glossary entry without numbers, pointing to `kc-boost-step`;
   merge ADR 0007 from `wave2-boost-step`.
3. **Frontmatter v2 + parser** — `knowledge.py` parses the new keys; migrate the ≈ 15 cards that
   name tables, thresholds or Plays; add `measure` to `thresholds.json` entries; turn
   `boost_step_gates.kc_max` into a degree value with `derive` (ADR 0001).
4. **Graph build + integrity checks** — `python -m kta_server.knowledge --graph`; checks 1–7;
   `test_knowledge_graph.py` with one failing fixture per check.
5. **`knowledge_for` tool + verify rule** — in the tuner's tool list; one seam test per entity kind.
6. **Impact replay** — `--impact`, reusing `seam1/replay.py` over the 9 drives.
7. **Outcome rows** — written by Flash readback; Outcome card in chat; proposal on two same-gate fails.
8. **Retrieval golden set + scorecard citation judge.**
9. **Chat flows** — reviewer mode card (C), owner source capture (B), outcome card (D).

## 9. Decisions

- **K1.** The knowledge graph is generated from cards, map data, thresholds and engine registries;
  it is never a source of tuning facts.
- **K2.** Cards reference threshold, measure, table and Play ids; tuning numbers live in
  `thresholds.json` and the engine only.
- **K3.** Cells are addressed as table + rpm rows + column `c of N`; no load axis until digitized.
- **K4.** Gates are thresholds derived per car (ADR 0001), shown with their inputs.
- **K5.** Two lifecycles: knowledge (review-gated by sources and impact replay) and outcome
  (log-gated, per car). Outcomes propose; they never change a rule.
- **K6.** The reviewer, not the owner and not the model, promotes knowledge. *(Product call; revisit
  if the app serves more than one owner.)*
- **K7.** No graph database, embeddings or ontology language in Phase 1: one JSON file and Python
  dicts are enough for this size.

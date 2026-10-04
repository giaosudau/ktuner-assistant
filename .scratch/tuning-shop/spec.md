# Spec: the tuning shop that talks

*Status: D1–D16 built (4 Oct 2026); D17–D28 specified, not built (second review, `analysis.md` §6–7)
· Why: `analysis.md` · Architecture: ADR 0005 · Vocabulary: `CONTEXT.md`
("The shop") · Supersedes the narrator role of `.scratch/tuning-loop/` ticket 08 and its "Chat UI"
section (now `.scratch/chat-app/spec.md`).*

## The value

A remote tuning shop in a chat. The customer bought KTuner, fitted parts, flashed a basemap and
wants the map fitted to their car. Like a shop: brief the log → read it → propose → teach → the
customer flashes → verify with the next log → repeat until the car is safe and the customer is
happy. No tuner's first change is the last, and engine safety is proven only by the next log.

## Decisions

| # | Decision |
|---|---|
| D1 | **The LLM orchestrates and teaches.** Every Drive reply and every typed question runs the agent: it chooses tools, reasons (thinking shown, labelled unchecked) and writes markdown up to ~280 words. Typed answers stream their tool steps live. |
| D2 | **The engine and the two map checks decide.** Verdicts, steps and cells are the engine's; verify enforces it in code; one repair, then the built-in reply. |
| D3 | **Teach every table, change only checked families.** Read any table; change only what the Flash plan changes (MAF Scaling, WOT mixture target, boost). Ignition and knock sensitivity are read-only; DI pressure, VTC and ethanol boost are left to the basemap. |
| D4 | **Drive brief + Log checkpoints.** The brief: TunerView setup (every gauge incl. AFR Command and MAF Hz, 10 samples/s), when and where (before 8 am or 1 h shade, intake < 42 °C, straight empty legal road), warm-up (10 min, coolant ≥ 80 °C), cruise for trims, two pulls in S from 50 to 100 km/h with a calm minute between (pull start < 48 °C), ≥ 10 min moving, idle, export. After upload, each checkpoint is met / not met / can't say. |
| D5 | **Health report**: the engine's 13 checks by system. |
| D6 | **Map tour**: every family, status this round, why, what unlocks it; "Explain these tables" asks the tuner; "View the tables" opens the viewer. |
| D7 | **Older log = history only**: never settles or re-decides current steps. |
| D8 | **Cite or propose**: unknown facts become `knowledge/proposed/` entries, never claims. |
| D9 | **Edit and resend** a sent message. |
| D10 | **Sidebar = the shop ticket**: Round N, stage track, "What I need from you", steps under "Your next drive can settle". |
| D11 | **Hard map rules (verify)**: a table named must exist in this car's map data; advising a change to a table outside the plan fails; an advised before → after must equal a plan cell (±0.05); a psi figure above the ceiling passes only as an advice-free card reference; advice verbs include run/set/try. |
| D12 | **Recommendation eval**: for every plan the engine produces (overshoot sweep), every cell is audited — real table, editable family, inside the table, `before` = map value in the table's decimals, `after` in the right direction by ≤ 1 step in the same decimals, both checks accept, verify rejects any other value. |
| D13 | **Table viewer (2D/3D)**: any table of the Map version as KTuner draws it — rpm × load grid with every value and the plan's cells outlined before → after, a turnable 3D surface, MAF as a curve — opened from the map tour and the KTuner card. Read-only. |
| D14 | **Fuel tag + premium-fuel test**: each log is tagged E10 RON95 III / RON97 III; the engine pairs matched drives (hard pulls, intake within 8 °C, same slot) and compares Knock Control and timing; ≤ 0.5° is no measurable difference (KTuner's logging step). Card `kc-fuel-test` is the brief. |
| D15 | **Map slots, phase 1**: each log is tagged with the KTuner map slot it ran on; drives on different slots are never compared. **Phase 2 (not built)**: a Map version per slot (the Flash step asks which slot it goes in; a Drive's Map is the active version of its slot), so a "daily RON95" and a "premium RON97" map can each be tuned in their own rounds. |
| D16 | **A drive that is the Baseline drive sets the Baseline** instead of asking for the same drive again. |

## Decisions — the front desk (second review, 4 Oct 2026)

Why: `analysis.md` §7 (findings F1–F7). Order of build: `STATUS.md` TS-20 onward.

| # | Decision |
|---|---|
| D17 | **Car file.** Everything the shop keeps about the car is one record in SQLite, shown as one panel with sections: Car (model, gearbox, fuel, climate, ECU, **goal**), Parts (Installs), Maps (Map versions per slot, Flashes), Logger setup, Drives (Car history, tags, hidden), Where we are (Round, stage, Open steps). The Car profile is its first section. A chat never holds a car fact. |
| D18 | **Chats are stored and listed.** Every message of every chat (owner text, attachment reference, the assistant's reply with its card payload, chip taps) is written server-side in `threads` / `thread_messages`; the sidebar lists chats newest first with a title from the first owner message; rename and delete; `localStorage` keeps only the open chat's id. Routes: `GET /api/threads`, `GET /api/threads/{id}`, `PATCH /api/threads/{id}`, `DELETE /api/threads/{id}`. Deleting a chat never deletes a Drive, a Flash or a Map version. Thread messages written before this change in `localStorage` are imported once. |
| D19 | **The front desk (intents before the tuner).** A typed message is first sorted into: `greeting` (hello / hi / I want to tune my car / help, or any message with no car word), `car-change` (I fitted / removed / changed fuel / flashed something), `question`, `out-of-scope`. A greeting never reaches a knowledge search. The reply per stage is `analysis.md` §7.3; it always names the car and the stage. With an LLM, the intent is the model's first tool call (`classify_intent`) and the regex is the no-key fallback; both are tested on the same cases (`owner-queries.md`). |
| D20 | **The Recap.** The first reply of a new chat for a car with a profile is a Recap card: the car in one line (model, map, fuel), Round N on Map version N, the last Drive with its Verdict word and date, the Next step and what it waits for, and anything waiting for the owner (unanswered questions, a Flash not confirmed). Shown on "New chat" before the owner types, and as the answer to a greeting. Built from `GET /api/state`; no model needed. |
| D21 | **The car is read, not assumed.** The agent's system prompt is built from the Car file (model, gearbox, fuel, parts, basemap, goal, Round, active Map version) — never a hard-coded sentence. With no Car profile, the agent may not answer a car-specific question: it asks which car first. |
| D22 | **Say what you read.** The "based on" line names only what the answer used, in words: "Your car file holds 9 Drives; I read the 3 since your Flash on 30 Aug (30 Aug 16:01 to 5 Sep 07:56)", or "From your map (Map version 3)", or "From what I know about this car [cards]". An answer that read no Drive has no Drive line. |
| D23 | **Knowledge search has a floor.** A card is returned only if the query shares a topic or a title word with it beyond stop words (car, tune, want, help, my …); otherwise `search` returns nothing and the reply says it can't tell, or the front desk takes over. Built-in typed answers no longer seed the agent's first sentence; the agent writes its own opening, then verify checks it. |
| D24 | **One car editor.** "Edit car" opens the Car file panel's editor (a sheet on desktop, full screen on a phone). Clicking it again focuses the open editor, never adds a second one. In the chat, a profile card exists only during first setup; once saved it collapses to a one-line summary ("Car profile saved · Edit") and any older unsaved card turns read-only. Saving a parts change still records an Install (unchanged). |
| D25 | **Suggested replies on every turn.** Under the latest assistant message only: up to 3 chips, one primary (the stage's action) and up to two follow-ups built server-side from the reply's facts (the Verdict lines that aren't OK, the Next step, the plan's family, the fuel test state). Never free model text, never a chip for a change the plan doesn't hold. The welcome screen's chips follow the same stage rules. |
| D26 | **Logger setup in the Car file.** After each upload the gauges seen, the logging rate and what's missing (AFR Command, MAF Hz) are stored; the Drive brief then opens with "Your last log had no AFR Command: turn it on in TunerView" instead of the generic list. |
| D27 | **Goal at intake.** The Car profile asks one question: daily / spirited / economy. The goal only reorders options and wording (economy → lugging and cruise trims first); it never unlocks a lever. |
| D28 | **Open-loop check and full-throttle MAF (forum research, phase 1 = read only).** The engine reports per Drive whether full-throttle mixture runs in open loop (short-term trim flat at zero under boost; `kc-open-loop-wot`), and, when AFR Command is logged, the full-throttle error against AFR Command per MAF Hz bin. Phase 1 shows it in the Health report and the map tour (airflow family: "full throttle: N % richer/leaner than commanded"). **Phase 2 (later, behind the two map checks)**: a full-throttle MAF Scaling plan, ≤ 2 % per point per round, stop at ≈ 0.2 AFR richer than commanded (`kc-maf-wot-calibration`), only with ≥ 2 matched pulls at constant intake temperature (`kc-maf-data-rules`). The part-throttle `afmCurve` plan gains the same data rules: a minimum of samples per bin and the rows around throttle steps dropped. |

## What the assistant can and can't do today (4 Oct 2026)

The owner asked: does the assistant help with AFR tuning, E10, E10 RON95 III / RON97 III, and
KTuner on-the-fly map switching?

| Topic | Reads and judges | Teaches | Changes the map | Next |
|---|---|---|---|---|
| **AFR at full throttle** | ✅ measured AFR vs the map's 11.0 target at ≥ 12 psi; Watch +0.5, Stop +1.0, danger 12.0 | ✅ `kc-rich-wot`, `kc-table-wot`, `kc-wot-lean-timing` | ❌ WOT target locked by design (no gain shown; leaning cost timing on an owner's car) | D28: judge against AFR Command once logged |
| **AFR via airflow (MAF Scaling)** | ✅ trims by airflow bin | ✅ `kc-table-maf`, `kc-maf-housing`, new MAF cards | ✅ part throttle only: `afmCurve` bin-by-bin, partial, one family per Flash; preset choice when trims are off everywhere | D28: data rules; full-throttle MAF from AFR Command (phase 2) |
| **E10** | ✅ no E10 offset in trims (data, `kc-trims`, `kc-e10`) | ✅ | Nothing to change: no fuel added for E10 (fact-check §1) | — |
| **E10 RON95 III vs RON97 III** | ✅ Fuel tag per log; Premium-fuel test on matched drives by the Fuel-quality score and timing cost | ✅ `kc-fuel-test` | ❌ no fuel-specific map | Map slot phase 2 (below) |
| **KTuner map slots (on-the-fly switching)** | ✅ Map slot tag per log; drives on different slots never compared | ⚠️ no card on how KTuner switching works | ❌ one Map version line for the car, not per slot; the Flash step doesn't ask which slot | D15 phase 2: a Map version per slot; "daily RON95" and "premium RON97" maps tuned in their own rounds |
| **Ignition** | ✅ timing pulled, retard by cell | ✅ read-only tables | ❌ never (street rule) | Remove-timing proposals only after the load axis is digitized |

## Measured

`eval.md`: baseline (narrator) vs shop harness on the live scorecard; the recommendation eval; the
live browser runs. New for D19–D25: `owner-queries.md`, the front-desk and forum query set, run
through the intent sorter (deterministic) and the live model (scorecard).

## Not built (next)

- D17–D28 (`STATUS.md` TS-20 onward).
- D15 phase 2 (slot-aware Map versions).
- A judge that checks a cited card actually supports its sentence (verify checks the card exists).
- `kta-knowledge approve`: the reviewer step that turns a proposal into a card (D8 names it; only
  `--proposals` exists).
- Ignition proposals: only after the load axis is digitized, and only "remove timing" where retard
  repeats in the same cells.
- The sample-rate checkpoint (10/s) fails on all 9 of the owner's logs (7.5/s): confirm TunerView's
  maximum before keeping the bar.

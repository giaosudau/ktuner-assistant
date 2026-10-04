# Spec: the tuning shop that talks

*Status: built (4 Oct 2026) · Why: `analysis.md` · Architecture: ADR 0005 · Vocabulary: `CONTEXT.md`
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

## Measured

`eval.md`: baseline (narrator) vs shop harness on the live scorecard; the recommendation eval; the
live browser runs.

## Not built (next)

- D15 phase 2 (slot-aware Map versions).
- A judge that checks a cited card actually supports its sentence (verify checks the card exists).
- Ignition proposals: only after the load axis is digitized, and only "remove timing" where retard
  repeats in the same cells.
- The sample-rate checkpoint (10/s) fails on all 9 of the owner's logs (7.5/s): confirm TunerView's
  maximum before keeping the bar.

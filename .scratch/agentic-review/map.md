## Destination

A Principal AI Engineer agentic audit ending in a fix-ordered spec: is the tuner-shop chat truly agentic per harness/graph-engineering standards, where it still hardcodes, and what to fix first — file by file.

## Notes

Domain: one-car Civic FE 1.5T CVT tuner shop loop (intake → brief → read → propose → teach → flash → verify). Vocabulary in `CONTEXT.md`; decisions in `.scratch/tuning-shop/spec.md` D1–D31, `analysis.md` §6–§7; architecture in `docs/adr/0005-llm-orchestrates-engine-decides.md`, `0006-agentic-chat-front-agent.md`; product in `PRODUCT.md`, `DESIGN.md`.
Skills every session should consult: `research` for external sources, `grilling` + `domain-modeling` for decision tickets, `prototype` only if fidelity helps.
Standing preferences: plan don't do (decisions not deliverables); engine decides numbers/cells, LLM orchestrates; verify stays code; refer to tickets by name, never bare ids.

## Decisions so far

<!-- one line per closed ticket: gist + link -->
- [Harness engineering lessons](issues/01-harness-lessons.md) — 14 lessons read; redacted/measured/unchecked-merge verified, debt is e2e/OTel/rubric.
- [Graph engineering standards](issues/02-graph-standards.md) — linear graph right-sized, strong deterministic/model split; gaps are model-router, fan-out, cost-per-success.
- [CopilotKit patterns](issues/03-copilotkit-patterns.md) — four ideas copied, transport hand-rolled: snapshot-only, no DELTA, no suspending HITL.
- [Backend agentic leverage](issues/04-backend-agentic-leverage.md) — unshackle opener, model routes, strict verify + support-judge, caps + merged trace.
- [Frontend harness UX](issues/05-frontend-harness-ux.md) — keep 4 cards, add DELTA streaming, chat/drive work-row parity.
- [Shop flow intelligence](issues/06-shop-flow-intelligence.md) — personalize brief, keep teaching locks + verify gates.
- [Fix spec synthesis](issues/07-fix-spec-synthesis.md) — 4-wave fix spec in fix-spec.md; map complete.

## Not yet specified

None — the fog graduated: per-family depth → Wave 1 locks; eval layer → extend `eval.md`/`owner-queries.md` (Wave 4); live-model reruns → deepseek/qwen scorecard (Wave 4); logger-setup/goal intake → Wave 4 personalized brief (tracker TS-28 → TS-29).

## Out of scope

- Code changes themselves — this map ends at the fix spec, build happens after handoff.
- Engine tuning-math correctness (limits, verdict thresholds, trim logic) except where it forces hardcoded vs agentic choices.
- Dashboard-of-cards vs chat-shell restyling beyond agentic UX (already locked in `DESIGN.md`).
- Slot-aware Map versions (D15 phase 2), ignition load-axis + remove-timing proposals, OTel spans, separate reviewer node — queued beyond this spec, per [Fix spec synthesis](issues/07-fix-spec-synthesis.md).

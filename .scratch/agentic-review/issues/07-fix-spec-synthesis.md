Type: grilling
Status: resolved
Blocked by: 01, 02, 03, 04, 05, 06

## Question

Given the six answers above, what is the fix-ordered spec: what to improve vs what to fix, ordered by safety × leverage, with exact files (`server/kta_server/*`, `web/lib/*`, `knowledge/cards/*`, evals) and what stays deterministic (engine verdicts/cells, verify, two map checks) vs what becomes agentic? Must be hand-off ready for build.

HITL — call the Skill tool twice, for "grilling" and "domain-modeling".

## Answer

Spec asset: [fix-spec.md](../fix-spec.md) — verdict (agentic architecture, hardcoded prompts/router, snapshot-only transport), 4 waves safety-first (verify+judge → model routes/speaks → trace/streaming parity → personalized brief + eval), deterministic-vs-agentic table, acceptance per wave. Ordered with owner (safety first, extend eval, full spec). Two implement agents already on Waves 1–3; Wave 4 + eval queued. Map is now complete — no open tickets.

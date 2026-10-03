# 09 — Knowledge cards and citations

**What to build:** the agent's knowledge base: small typed cards it can retrieve and must cite, so "based on facts" holds for claims that don't come from the drive itself (what's normal on this car, what owners report, where things live in KTuner).

Each card: id, title, kind (fact / rule / play / owner-question / ktuner-howto), topics, applies-when, numbers (name, value, unit), source (doc and section), status (current / superseded-by); body at most 150 words. Built from `docs/research/`, `CONTEXT.md` and the ADRs. `fact-check.md` wins on any number. Corrected claims (for example "PRL HVI = Factory curve") are kept as superseded so the agent never repeats them. A generated index serves `search_knowledge(query, topics, kind)`, returning at most 5 cards, keyword search first.

**Blocked by:** 08

**Status:** done — 3 Oct 2026

- [x] Cards cover at least: Knock Control ranges and timing cost, after-flash pattern, rises above 5,200 rpm, rich WOT on E10, heat soak, trims normal/leak/mismatch, MAF Scaling per housing, P0420 and đăng kiểm, CVT care, expectation lines (no headroom)
- [x] The build fails on a card with no source or a number conflicting with `fact-check.md`
- [x] Superseded cards are never returned as current
- [x] Verify rejects a factual claim that cites neither a tool result nor a card id (seam-1 test with the fake model)

**What was built:** `knowledge/cards/*.md` (21 cards: 14 current + 7 superseded; ADR 0004 layout), `server/kta_server/knowledge.py` (strict frontmatter parser with no new dependency, shape validation at import, inverted keyword index, `search(query, topics, kind)` ≤ 5 hits, `check_numbers` against the fact-check table), generated `knowledge/index.json` (rebuilt with `python3 -m kta_server.knowledge --dump-index`; a test fails when it drifts). `search_knowledge` is a read-only agent tool in the 08 pattern (streams as a `knowledge` harness step; its numbers never enter the tool-facts pool). `verify.py` takes `knowledge=` (cards the run read): a number may come from tool results or a cited card, an unknown `[id]` fails, and without `knowledge=` behaviour is byte-identical to 08. The agent prompt carries the cite rule; verified replies carry `citations: [{id, title}]` through `reply.agent`. Chat renders `[id]` markers as quiet superscript footnote refs with a title list (`web/components/Citations.tsx`); built-in prose renders unchanged.

**Test counts:** `pytest server/tests` 148 passed (21 new knowledge build/citation unit + 3 new seam-1 + 16 verify + rest incl. 08's 10 agent tests, all still green); `npm test` 168 passed, 0 failed; `tsc --noEmit` clean in `web/`.

**PM notes:** card count 14 current / 7 superseded. Superseded list (never served, kept so the agent never repeats them): `kc-e10-trim-baseline` (+3 % E10 trim), `kc-wot-lean-display` (leaner-than-shown on E10), `kc-prl-hvi-factory` (PRL HVI = Factory curve — not verified, ask the housing), `kc-torque-250nm` (250 Nm CVT cap — removed), `kc-knock-070` (no-hard-driving from 0.70 → 0.62), `kc-21psi-no-margin` (avoid 21 psi on local fuel — refuted for normal conditions), `kc-stock-sensor-accurate` (stock A/F accurate under boost — claim removed). Two gates beyond the ticket: every digit in a current card's body must be a declared number or FREE (so anything quotable is checkable), and every pinned fact-check number must be carried by at least one card. `fact-check.md` has no machine-readable table, so its numbers are hand-encoded in `server/tests/test_knowledge.py` (PINNED with § refs) — re-encode by hand if fact-check changes. What 11 reuses: `K.search(query, topics, kind)` for ask-between-uploads, `reply.agent.citations` for the footnote list, and the same `verify(knowledge=)` path over the drive window.

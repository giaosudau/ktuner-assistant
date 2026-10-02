# 09 — Knowledge cards and citations

**What to build:** the agent's knowledge base: small typed cards it can retrieve and must cite, so "based on facts" holds for claims that don't come from the drive itself (what's normal on this car, what owners report, where things live in KTuner).

Each card: id, title, kind (fact / rule / play / owner-question / ktuner-howto), topics, applies-when, numbers (name, value, unit), source (doc and section), status (current / superseded-by); body at most 150 words. Built from `docs/research/`, `CONTEXT.md` and the ADRs. `fact-check.md` wins on any number. Corrected claims (for example "PRL HVI = Factory curve") are kept as superseded so the agent never repeats them. A generated index serves `search_knowledge(query, topics, kind)`, returning at most 5 cards, keyword search first.

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] Cards cover at least: Knock Control ranges and timing cost, after-flash pattern, rises above 5,200 rpm, rich WOT on E10, heat soak, trims normal/leak/mismatch, MAF Scaling per housing, P0420 and đăng kiểm, CVT care, expectation lines (no headroom)
- [ ] The build fails on a card with no source or a number conflicting with `fact-check.md`
- [ ] Superseded cards are never returned as current
- [ ] Verify rejects a factual claim that cites neither a tool result nor a card id (seam-1 test with the fake model)

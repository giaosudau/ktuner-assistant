# 11 — Ask without uploading

**What to build:** the owner can talk to the assistant between uploads ("why is my car slower in the heat?", "what does MAF Scaling do?"). The graph runs agent → verify → repair/fallback over the current drive window and the knowledge cards, with the same checks as an upload reply. A request for a change ("give me +2 psi", "add timing") gets the Flash plan's answer and exactly what would unlock it, never a new edit.

**Blocked by:** 09, 10

**Status:** ready-for-agent

- [ ] "Why is my car slower in the heat?" is answered from the owner's own drives (for example 30 Aug 15:29 vs 16:01) with citations
- [ ] "Give me +2 psi" returns the Flash plan's answer with its lock reasons; no cells
- [ ] "Add timing" is refused with the reason (ignition is never edited)
- [ ] The reply states its drive window
- [ ] Seam-1 tests with the fake model cover the three questions above

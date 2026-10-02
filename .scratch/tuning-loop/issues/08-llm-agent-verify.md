# 08 — LLM agent with verify, repair and fallback

**What to build:** the reply is written by an LLM that orchestrates read-only engine tools, and nothing it says reaches the owner unchecked. The provider is any OpenAI-compatible endpoint from `.env` (base URL, key, model; TokenHarbor for testing); the key stays on the server. Tools go through the Node worker: drive facts (reusing the existing in-browser ask module's drive tools: overview, insight by topic, channel stats by window, timing cell, one pull), Car history window, Open steps, the decided Next step and Flash plan, map cells.

The agent may choose what to look at and how to explain; it may not add, remove or change the Next step. Verify checks: every number matches a tool result; the action named is the decided Next step; any table, cell or value matches the Flash plan; banned advice (less knock sensitivity, more timing, boost above the ceiling, a curve edit for trims-everywhere) is rejected. A failed reply gets one repair turn, then the built-in reply is shown. The model's own thinking, when the model returns it, is a separate collapsed block labelled "unchecked". With no key configured, the built-in reply is used.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Seam-1 tests with a scripted fake model: a correct reply passes; a wrong number, a different action, a cell not in the Flash plan, and banned advice each trigger one repair, then the built-in reply
- [ ] Tool calls stream as harness steps with inputs and outputs
- [ ] Thinking, when present, shows as "unchecked", separate from the steps
- [ ] No key → built-in reply, loop unchanged
- [ ] One manual run against TokenHarbor with a real (rotated) key produces a verified reply

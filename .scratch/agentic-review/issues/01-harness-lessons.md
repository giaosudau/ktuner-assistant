Type: research
Status: resolved
Blocked by:

## Question

What do the walkinglabs harness-engineering lessons actually require (https://walkinglabs.github.io/learn-harness-engineering/en/ — read all lesson pages), and where does our harness (`server/kta_server/harness.py`, `graph.py` ingest/decide/agent/reply + `chat.py` chat/suggest, `verify.py`, `worker.py`) meet or miss it? Cover: harness steps vs raw chain, inputs-redacted-by-construction, measured count/seconds, tool-call streaming as AG-UI events, thinking labelled unchecked, merge across nodes.

Record findings as a context pointer usable by the synthesis ticket. AFK — call the Skill tool with "research".

## Answer

All 14 walkinglabs lessons read. Harness = instructions+tools+env+state+feedback, not a chain; steps recorded as replayable trace; least-privilege tools; measured done (WIP=1, verify-cmd, external termination); maker≠checker, thinking≠checked; loop→graph with merge; eval hooks.
Meets: `harness.py` redacted inputs-by-construction, server-measured count/seconds, think() unchecked-separate, merge() across nodes; `graph.py` explicit graph + per-node harness + WIP=1 Next step; `chat.py` supervisor + validated cards + MAX_CALLS=8 + verify+repair; `verify.py` deterministic no-LLM judge.
Gaps: no OTel spans / sprint-contract artifact; `_suggest` untraced; no durable handoff file; tuner handoff trace not merged into front trace; verify is binary ok/issues with no rubric/anchors, no e2e runner, no feedback-promotion log.

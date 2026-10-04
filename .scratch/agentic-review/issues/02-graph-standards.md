Type: research
Status: resolved
Blocked by:

## Question

What does 2026 graph engineering require (https://www.aibuilderclub.com/blog/graph-engineering-guide-2026, https://flowtivity.ai/blog/graph-engineering-2026-guide-openclaw-codex/, https://roadmap.sh/ai-engineer plus similar), and where does our LangGraph (`server/kta_server/graph.py` START routing, chat→suggest vs ingest→decide→agent→reply, checkpointer `AsyncSqliteSaver`, `threads.snapshot`, no `interrupt`) meet or miss it? Cover: supervisor/router node, state shape (`LoopState`), deterministic vs model nodes, memory per thread_id, single-turn AG-UI contract, eval/scorecard hooks.

AFK — call the Skill tool with "research".

## Answer

2026 graph guides: graph only when forced (specialties/fan-out/audit); supervisor router via tool-calls; explicit typed state; deterministic vs model split with separate reviewer; per-thread checkpointer + long-term layers; suspending interrupt is default HITL; eval on cost/success.
Meets: linear `chat→suggest` / `ingest→decide→agent→reply` right-sized; `LoopState` TypedDict + tools-from-run + STATE_SNAPSHOT; deterministic ingest/decide/reply + model chat/agent + verify-with-teeth + MAX_CALLS; AsyncSqliteSaver per thread_id + threads.snapshot; scripted llm_caller seam + loop eval + scorecard.
Gaps: deterministic `_route` not model router, no fan-out; no typed-edge vocabulary; reviewer inline not separate node; no long-term memory split; deliberate no-interrupt deviation (documented, breaks single-turn otherwise); no cost-per-success / upload-path spend cap.

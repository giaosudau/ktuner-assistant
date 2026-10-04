Type: grilling
Status: resolved
Blocked by:

## Question

Does the backend really leverage the agent, or does it hardcode around it? Decide file by file: `agent.system_prompt` (car_sentence D21, Start-with-this-sentence, 280-word cap), `TOOLS()` read-only set vs teaching needs, `chat.system_prompt` + `backend_tools` + `ask_tuner` handoff, `desk.py` regex fallback vs front-agent, `ask.classify` + `knowledge.search` floor (D23), `verify.py` hard map rules (D11) and false-positive cost, `MAX_CALLS` budgets, suggestion node. For each: keep deterministic vs make agentic, with why.

HITL — call the Skill tool twice, for "grilling" and "domain-modeling".

## Answer

Decided with owner (4 grilling Qs, all recommended accepted):
- Prompt: unshackle — drop Start-with-this-sentence verbatim opener; model opens in own words; keep 280-word, one-step, cite-or-propose as code checks in verify (`agent.py:system_prompt`, `chat.py:submit_reply`).
- Router: model routes — front-agent + `ask_tuner` handoff decide every typed message with key; `desk.sort_intent` + `ask.classify` + keyword search become no-key fallback only, never pre-filter (`desk.py`, `ask.py:classify`, `chat.py:_without_model`).
- Verify: keep strict + add judge — numbers-from-tools, cells==plan, banned EN+VI, citations stay; add citation-support judge (cited card must support sentence) + false-positive regression per rule (`verify.py`, `mapcheck.py`).
- Budgets/trace: caps + merged trace — keep linear graph, add upload-path spend cap, trace `suggest` steps, merge tuner handoff steps into front trace; reviewer stays inline, no separate node (`graph.py`, `chat.py:MAX_CALLS=8`, `agent.py:MAX_CALLS=12`).
Engine still decides verdicts/cells; LLM orchestrates prose/routing only. Feeds synthesis as backend half of fix spec.

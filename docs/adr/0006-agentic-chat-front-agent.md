# The chat is one agent graph: a front agent with tools, frontend cards and memory

*4 Oct 2026. Builds on ADR 0005 (the LLM orchestrates, the engine decides). ADR 0002 and 0003 still
bind: the engine is the only source of tuning math, and every map change passes two checks.*

## Context

The owner's report (`.scratch/tuning-shop/analysis.md` §7): "Hello, I want to tune my car" was
answered with a boost-table lecture "based on your 3 Drives"; the app never asked which car or
said where the car stood; "Edit car" added a new card per click; suggestions only existed on an
empty chat; a new chat lost the old one. A first fix sorted messages with regular expressions
(a hand-built front desk). The owner rejected that: *"we have an LLM behind us — leverage it; we
have LangGraph and CopilotKit/AG-UI; do not hardcode, it is an agentic world."*

How comparable products are built (sources below):

- **Supervisor / router node** (LangGraph): one model node reads every message and routes with
  tool calls or structured output to the right worker; business logic stays out of the router.
- **Frontend tools and generative UI** (CopilotKit `useCopilotAction`, AG-UI `tools`): the UI
  declares the cards it can draw; the agent calls them; the call is rendered as a card; human
  in the loop when the card changes something (`renderAndWaitForResponse`).
- **Shared state** (CopilotKit CoAgents `useCoAgent`, AG-UI `STATE_SNAPSHOT`/`STATE_DELTA`): the
  agent's state streams to the UI; the UI's context reaches the agent.
- **Chat suggestions** (CopilotKit `useCopilotChatSuggestions`): follow-up chips generated from
  app state and the conversation.
- **Persistence** (LangGraph checkpointers, `AsyncSqliteSaver`): each thread's state is
  checkpointed by `thread_id`, so the agent remembers the conversation.

The installed `ag_ui_langgraph` (0.0.46) confirms the mechanics: a run's `tools` and `context`
are merged into graph state as `state["tools"]`, `state["copilotkit"]["actions"]` and
`state["ag-ui"]["context"]`.

## Decision

1. **Every chat turn runs one LangGraph graph** (`graph.py`): `mode: "chat"` routes to
   `chat → suggest`; an upload routes to the existing `ingest → decide → agent → reply`.
2. **The `chat` node is a front agent** (`chat.py`): the model reads the message (natural
   language, any wording) with tools and decides:
   - backend tools: `get_car_file`, `get_capabilities`, `search_knowledge`;
   - **hand-off**: `ask_tuner` passes any tuning question to the checked tuner (ADR 0005), whose
     answer goes to the owner as it is;
   - **frontend tools** declared by the web in the run (`web/lib/uiTools.ts`): `show_recap`,
     `show_car_editor`, `show_drive_brief`, `show_capabilities`. The server validates every
     argument (parts and fields from fixed lists) and fills the card from the Car file; the model
     only chooses the card. The car editor is the one card in the thread; the owner saves it.
3. **What the assistant can and can't do is data** (`desk.CAPABILITIES`: can / partly / cannot,
   each with its limit). It is in the front agent's and the tuner's prompts, behind
   `get_capabilities`, in `GET /api/state`, and drawn by `show_capabilities`, so the assistant
   steers the owner to what it can do and says when it is not sure.
4. **The car is read, never assumed**: the tuner's prompt is written from the saved Car profile.
5. **Suggested replies are written by the model** in the `suggest` node and **checked in code**:
   an allowed action (send, guide, attach, edit-car), short, no number, no banned advice, never a
   request for more boost or timing; else the stage's own chips.
6. **Guardrails stay code**: every front reply passes `verify.py` (numbers from tool results,
   banned advice, citations); one repair; then the fixed answer. The same turn runs behind
   `POST /api/ask` for clients that don't speak AG-UI.
7. **Memory**: the graph's checkpointer is `AsyncSqliteSaver` on `server/ktuner-chat.db` (swapped
   in at startup); chats are also kept as the owner saw them (`threads.snapshot`) for the sidebar
   list, rename and delete. A chat never holds a car fact.
8. **No key**: the deterministic front desk (`desk.py`) answers in the same shape. It is the
   fallback, not the design.

## Consequences

- Natural language works: "my car feels sluggish since I put the new pipe on" is a question for
  the tuner, not a part change, because a model reads it.
- One more model call per turn (the suggestions), run after the answer is already in state.
- Seam tests drive the real `/agent` endpoint with a scripted model (`test_chat_agent.py`),
  including a restart that keeps the conversation in SQLite.

## Sources

- CopilotKit, "Everything You Need To Build Agent-Native Applications (with LangGraph and
  CoAgents)": https://www.copilotkit.ai/blog/everything-you-need-to-build-agent-native-applications
- Better Stack, "CopilotKit: Building Agent-Native AI Features with Generative UI and Shared
  State": https://betterstack.com/community/guides/ai/copilotkit-agent-native/
- CopilotKit docs, `useCopilotChatSuggestions`: https://docs.copilotkit.ai/reference/v1/hooks/useCopilotChatSuggestions
- LangChain docs, "Workflows and agents" (routing): https://docs.langchain.com/oss/python/langgraph/workflows-agents
- focused.io, "Multi-agent orchestration in LangGraph (supervisor vs swarm)": https://focused.io/lab/multi-agent-orchestration-in-langgraph-supervisor-vs-swarm-tradeoffs-and-architecture
- LangChain docs, "Checkpointers": https://docs.langchain.com/oss/python/langgraph/checkpointers
- LangGraph reference, `AsyncSqliteSaver`: https://reference.langchain.com/python/langgraph.checkpoint.sqlite/aio/AsyncSqliteSaver
- CopilotKit, "Master the 17 AG-UI event types": https://www.copilotkit.ai/blog/master-the-17-ag-ui-event-types-for-building-agents-the-right-way
- LangChain docs, "Agent User Interaction Protocol (AG-UI)": https://docs.langchain.com/oss/python/deepagents/ag-ui

Several of these sites were blocked from the build environment; the search summaries and the
installed `ag_ui_langgraph` source were read instead.

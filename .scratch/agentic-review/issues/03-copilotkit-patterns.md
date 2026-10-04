Type: research
Status: resolved
Blocked by:

## Question

How do real CopilotKit/AG-UI apps leverage agentic UI (useCopilotAction/frontend tools, CoAgents shared state STATE_SNAPSHOT/DELTA, useCopilotChatSuggestions, renderAndWaitForResponse HITL confirms), and where do we (`web/lib/uiTools.ts`, `web/lib/useChat.ts`, `chat.default_ui_tools`/`ui_card` validation, `show_recap`/`show_car_editor`/`show_drive_brief`/`show_capabilities`, suggest node + `checked_chips`) copy the pattern vs hardcode it? Include what people build with CopilotKit today.

AFK — call the Skill tool with "research".

## Answer

Real apps: useFrontendTool generative cards; CoAgents STATE_SNAPSHOT+DELTA two-way sync; useCopilotChatSuggestions chips; renderAndWaitForResponse HITL (ApprovePlan etc); 17→31 AG-UI events incl CUSTOM/MESSAGES_SNAPSHOT.
Meets: uiTools mirror + allowlist filter + server-validated ui_card; snapshot carries reply/answer; model-proposes/code-checks chips; one-editor HITL pause.
Gaps: no @copilotkit/react-core dep, raw HttpAgent not useCopilotAction; STATE_SNAPSHOT only in useChat.ts:301,366 — no STATE_DELTA/MESSAGES_SNAPSHOT/no useCoAgent setState; suggestions custom REST not hook, welcome chips static; logical pause via POST /api/answer not suspending respond()/interrupt (deliberate — broke same-thread uploads).

Type: grilling
Status: resolved
Blocked by:

## Question

Does the frontend + harness read as agentic (generative UI the model drives) or as a deterministic renderer with model prose pasted on? Decide: cards as frontend tools validated server-side (D30) vs model freedom, one-car-editor invariant (D24/F4), Recap (D20), capabilities card (D29), basis line (D22), work-row streaming (harness steps, say/think/summary events), suggestion chips checked in code (D25). Name every hardcoded copy spot and what should become model-chosen vs code-checked.

HITL — call the Skill tool twice, for "grilling" and "domain-modeling".

## Answer

Decided with owner (3 grilling Qs, all recommended accepted):
- Cards: keep 4 (`show_recap`/`show_car_editor`/`show_drive_brief`/`show_capabilities`) — model picks, server validates/fills from Car file (`web/lib/uiTools.ts` ↔ `chat.default_ui_tools`/`ui_card`); map tour/table/KTuner plan stay in prose + viewer, not new tools.
- Streaming: add deltas — handle STATE_DELTA + MESSAGES_SNAPSHOT and TOOL_CALL_END in `web/lib/useChat.ts:301,366`; stream chat tool args like drive path (`TOOL_CALL_ARGS` accumulation), not just live name + count.
- Work row: parity — chat turns stream harness steps/say/think/summary same as drive turns; keep one-editor reuse (`openEditor`), basis line (D22), checked chips (D25) as-is.
Deterministic renderer stays for values; model drives choice/timing. Feeds synthesis as frontend half.

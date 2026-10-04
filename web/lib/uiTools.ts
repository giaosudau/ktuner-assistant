/**
 * The cards the chat lets the agent show: AG-UI frontend tools (the CopilotKit `useCopilotAction`
 * pattern). They ride in every chat run's `tools`; the front agent calls one when a card answers
 * better than words; the server validates its arguments against its own lists before the card is
 * drawn, and the owner confirms anything that changes the car in the card itself.
 *
 * Mirrors `default_ui_tools()` in `server/kta_server/chat.py`.
 */
const PARTS = ["intake", "downpipe", "front-pipe", "catback", "intercooler", "cvt-cooler"];

export type UiTool = { name: string; description: string; parameters: Record<string, unknown> };

export const UI_TOOLS: UiTool[] = [
  {
    name: "show_recap",
    description: "Show the owner's car and where it is in the tuning loop as a card.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "show_car_editor",
    description:
      "Open the one car editor card in the chat, filled with what the owner just said: parts they fitted or removed, or car details. The owner checks and saves it; nothing is saved before.",
    parameters: {
      type: "object",
      properties: {
        parts_fitted: { type: "array", items: { type: "string", enum: PARTS } },
        parts_removed: { type: "array", items: { type: "string", enum: PARTS } },
        fields: {
          type: "object",
          properties: Object.fromEntries(["model", "engine", "transmission", "fuel", "climate"].map((k) => [k, { type: "string" }])),
          additionalProperties: false,
        },
      },
    },
  },
  {
    name: "show_drive_brief",
    description: "Show the drive brief card: exactly how to drive and log the next drive.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "show_capabilities",
    description: "Show what the shop can, can partly, and can't do, as a card.",
    parameters: { type: "object", properties: {} },
  },
];

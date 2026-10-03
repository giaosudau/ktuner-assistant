# Spec: KTuner Assistant as a chat app

*Status: ready-for-agent · 3 Oct 2026 · Replaces the UI parts of `.scratch/tuning-loop/spec.md`
("Chat UI"); every engine, server and safety decision there still binds. Why: `review-ooda.md`.
Who: `user-research.md`. Product truth: `/PRODUCT.md`. Vocabulary: `CONTEXT.md`.*

## Problem

The owner bought KTuner, fitted parts, flashed a KTuner basemap and wants it tuned for *their*
car. They want to do that by **chatting** with someone who knows how, the way they use Claude or
ChatGPT. The current `web/` is a page of forms and cards with the upload button, the question box
and the reply in three different places. It is not a chat, and the owner can't use it.

## Solution in one line

Copy the Claude / ChatGPT chat shell exactly, and fill the assistant's messages with our
engine-checked cards (CopilotKit-style generative UI), so the whole tuning loop happens in one
conversation.

## The journey (what the conversation walks)

| Phase | Assistant does | Owner does | Ends when |
|---|---|---|---|
| **1 Car** | Greets; no Car profile → asks "Tell me about your car: model, gearbox, fuel, parts, which KTuner map you flashed." Shows the filled **Car profile card** in the thread | Types in their words; corrects fields; taps **Save to my car** | Profile saved (Map version 1 = basemap) |
| **2 Baseline log** | Explains the first log: one Cool drive, 2 pulls, the gauges to have on (from the engine) | Attaches a TunerView CSV with + or drag & drop | First Drive uploaded |
| **3 Read** | Streams: steps (collapsible) → verdict sentence → **report card** (verdict, 4 numbers, map version) → **chart** → what the drive settled → cause | Reads; may ask follow-ups in the composer | Reply finished |
| **4 Options** | **Options card**: what can change now (from Flash plan levers), each with status; locked ones say what unlocks them. Owner questions appear as quick-reply chips | Taps an answer chip / an option | One option chosen, or "no change" |
| **5 Plan** | **Plan card**: overview steps (open file → change N cells → save as → flash), then the **KTuner card** with every table, row, column, before → after and a tick list; undo file | Types cells into KTuner, ticks | All cells ticked |
| **6 Flash** | Asks "Did you flash it?" with **I flashed it** / **Not now** | Taps one; it posts as their message | Map version N+1 saved, or nothing |
| **7 Verify** | Gives the Shakedown rule and the **logging recipe** for the drive that proves the change (gauges, conditions, pulls) | Drives, attaches the next CSV | Readback + settle → back to 3 |

Loop 3 → 7 until the Flash plan says "no map change" and no Open step is left: the assistant says
so plainly, and the active Map version + Car profile are the saved result.

The **sidebar** mirrors the journey: Car summary (model, parts, active Map version), the journey
stepper with the current phase, Open steps / Waiting for you, History file.

## Layout (copied from Claude / ChatGPT)

```
┌────────────┬──────────────────────────────────────────────┐
│ ▣ KTuner   │  Civic FE · Map v1 ▾                    ◐   │  top bar (title + theme)
│ + New chat │                                              │
│            │        ┌──────────── 768px ────────────┐     │
│ YOUR CAR   │        │                    [user bubble]│   │  user: right, filled bubble
│ Civic FE…  │        │ ◆ Worked 1.1 s · 9 steps   ▸   │     │  assistant: no bubble,
│ Map v1     │        │ Engine healthy: …              │     │  avatar + prose + cards
│            │        │ ┌ report ┐ ┌ chart ┐ ┌ plan ┐  │     │
│ JOURNEY    │        │ [chip] [chip] [chip]           │     │  quick replies
│ ● Car      │        └────────────────────────────────┘     │
│ ● Baseline │   ┌──────────────────────────────────────┐    │
│ ◐ Read     │   │ 📎 TunerView_…csv ×                  │    │  attachment chip
│ ○ Plan     │   │ Message KTuner Assistant…            │    │  auto-grow textarea
│ ○ Flash    │   │ (+)                            (↑)   │    │  attach + send
│ ○ Verify   │   └──────────────────────────────────────┘    │
│ OPEN STEPS │   Checks every number against your logs.      │
└────────────┴──────────────────────────────────────────────┘
```

- Desktop ≥ 1024 px: sidebar 260 px, collapsible. < 1024 px: sidebar is a drawer behind a menu
  button; composer sticks to the bottom with safe-area padding.
- Empty thread: centred greeting ("What are we tuning today?"), the composer in the middle, and
  3–4 suggestion chips (Set up my car · Upload a log · How should I log? · Why is it slower in the
  heat?). The first message after that moves the composer to the bottom (ChatGPT behaviour).
- Drag & drop a CSV or image anywhere on the thread → drop overlay → attachment chip.

## Message anatomy

**User message:** right-aligned filled bubble, max 80 % width; attachments as file chips above
the text.

**Assistant message** (left, avatar mark, no bubble), in this order, each part optional:

1. **Work row** — collapsed "Worked for 1.1 s · Checked 9 things" (live: shimmering
   "Reading your log…" with the current tool name). Expands to one row per tool (icon, title,
   duration, ✓), each expandable to inputs/outputs in mono. The model's thinking is a separate
   collapsed row labelled **Thinking (unchecked)**.
2. **Prose** — the verdict sentence and cause, markdown-light, citations as superscripts.
3. **Cards** (generative UI), in decision order: Report (verdict + numbers + map version) ·
   Chart · What I asked last time · Options · Plan / KTuner card / Undo · Next step (gauge table
   or drive recipe) · Question (only inside, as chips).
4. **Quick replies** — chips under the *latest* assistant message only: owner-question answers,
   "Show the plan", "How do I log this?", "Why?".
5. **Message actions** on hover: copy.

## Composer routing

| Input | Goes to | Assistant reply |
|---|---|---|
| CSV attached (± text) | `POST /upload` then AG-UI `POST /agent` | Drive reply (steps stream, cards) |
| Image attached | `POST /api/screenshot` (text as prompt) | Answer + citations |
| Text, no Car profile | `POST /api/ask {flow:"setup"}` | Car profile card |
| Text, profile saved | `POST /api/ask` | Answer + window + citations |
| Chip: owner question | `POST /api/answer` | Updated Next step / options |
| I flashed it / Not now / Undo | `POST /api/flash/confirm`, `/not-now`, `/restore` | Result line + Shakedown + logging recipe |

## Visual system (canon, not invention)

- **Neutral greys** copied from ChatGPT/Claude: dark `#212121` page, `#171717` sidebar, `#2f2f2f`
  user bubble and composer, `#ececec` text, `#b4b4b4` muted; light `#ffffff` page, `#f9f9f9`
  sidebar, `#f4f4f4` bubble, `#0d0d0d` text, `#5d5d5d` muted. Hairlines `rgba(…,.1)`.
- **One accent**, CopilotKit indigo (`#8b78e6` dark — lifted from `#6e56cf`, which fails 4.5:1 for links on `#212121` — / `#5b45c2` light) for the send button, focus
  ring, links, active step, primary card actions.
- **Semantic only:** OK green, Watch amber, Stop red, Can't tell grey — always with the word, never
  colour alone.
- **Type:** system UI stack (as ChatGPT); 16 px body / 1.6; mono stack for numbers, tables, cells.
- **Cards:** 12 px radius, 1 px hairline, no shadow, no coloured borders. Buttons: pill (send,
  chips) or 8 px radius.
- Light and dark follow the system; a toggle in the top bar overrides (stored per viewer).
- Motion: 150–200 ms fades; shimmer on the live work row; respects reduced motion.

## Out of scope

- Server/engine rule changes (except the read-only additions a ticket names).
- Multiple chats per car (New chat clears the local thread; the Car history is one).
- Voice, Vietnamese copy, accounts.

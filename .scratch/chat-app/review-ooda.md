# OODA review of the tuning-loop UI (3 Oct 2026)

*Subject: `web/` as built by `.scratch/tuning-loop/` tickets 01–16. Evidence: the owner's
screenshot of the live page, `web/app/page.tsx`, `web/components/*`, `web/lib/useThread.ts`,
`server/kta_server/app.py`, `flash_routes.py`.*

## Observe — what is on screen

Top to bottom, the page renders as a **dashboard of forms**, not a conversation:

1. A marketing hero ("Upload a Drive. Is it OK, what do I do next?") with an eyebrow of car facts.
2. A big blue **Upload a TunerView CSV** button, alone.
3. A **Car profile** card with a "Correct it" link and an Install form (select, select, date, "Record it").
4. A separate **Ask** text box with its own answer area (answers are *not* in the thread and vanish
   on the next question).
5. A **Your map** card with Export / Import.
6. A two-column layout: **Open steps** on the right, and the "thread" on the left, which holds only
   upload turns: an "Uploaded <file>" chip and a giant reply card.
7. Inside the reply card: verdict pill, sentence, window, 4 number tiles, map version line, "what I
   asked last time", Flash plan, "Checked 9 things" (collapsed), and the Next step box with a gauge
   table. All visible at once, same weight.

Function inventory (the backend is rich and works):

| Capability | Server | UI today |
|---|---|---|
| Upload a Drive → streamed AG-UI reply | `POST /upload`, `POST /agent` | separate button, reply card only |
| Typed question | `POST /api/ask` | separate box outside the thread |
| Car profile from words | `POST /api/profile/draft`, `/api/profile` | form card above the page |
| Install | `POST /api/installs` | form inside profile card |
| Owner questions | `POST /api/answer` | buttons in the card, no user message |
| I flashed it / Not now / Undo / Revert | `/api/flash/*` | buttons deep in the card |
| History file | `GET/POST /api/history` | card above the thread |
| Screenshot | `POST /api/screenshot` | **no UI** |
| Pictures (charts) | `reply.pictures` | **not drawn** |
| Tool steps, thinking | AG-UI TOOL_CALL_*, CUSTOM | one collapsed `<details>` with raw JSON |

## Orient — why it fails the product

1. **It is not a chat.** There is no composer; no user messages; no conversation memory on screen.
   Typing and uploading are two different widgets in two places. The spec said "a chat app" and
   "CopilotKit chat"; the build said "own React cards" and stopped there (ADR 0004 dropped
   CopilotKit's renderer for precision, and nobody replaced the chat shell it provided).
2. **Tickets were sliced by backend capability, never by owner journey.** Each ticket added its
   card to the page. No ticket owned "the conversation", so nothing joined the cards into one.
   The acceptance tests (seam 1, e2e) asserted *data on screen*, never *a usable flow*.
3. **No journey state.** The owner can't see where they are (setup → baseline → read → plan →
   flash → verify). Open steps exist but read as a to-do list, not a path.
4. **Everything at once.** The reply card shows ~11 blocks at equal weight. Chat apps show prose
   first and fold detail (Claude's "thinking", Cursor's tool rows, ChatGPT's generated UI).
5. **Setup is a form, not a question.** The spec's story 1 ("greet me and ask me to describe my
   car") was implemented as a textarea card above the page.
6. **Colour.** Navy page, bright periwinkle button, blue-outlined boxes, green/amber pills, a
   blue-bordered "watch" card: five competing accents, low hierarchy, nothing like the reference
   apps the owner named.
7. **Missing on-screen features the backend already supports:** charts, screenshot attach,
   options-as-choices, flash confirm as a conversational turn, how-to-log guidance.

## Decide — what changes

| Decision | Why |
|---|---|
| **Rebuild `web/` as a chat shell copied from Claude / ChatGPT**: left sidebar, centred thread (max 768 px), one bottom composer with attach (+) for CSV and screenshots, drag & drop, Enter to send | Owner's explicit brief; category canon; no invention |
| **Every interaction is a message.** Setup, answers, "I flashed it" post a user bubble and get an assistant reply | A conversation is the product |
| **Assistant message anatomy:** collapsible "Worked for 1.1 s · 9 steps" (tool rows, Cursor-style) → prose (verdict sentence) → generative-UI cards in order of decision (report → chart → what changed → options → plan / next step) → suggested replies | Prose first, detail folded, actions last |
| **Journey stepper** in the sidebar (Car · Baseline · Read · Plan · Flash · Verify) computed from server state | Owner always knows where they are |
| **Conversational onboarding:** no profile → assistant asks; owner's words → profile card in-thread → Confirm | Spec story 1–3, done as chat |
| **Options card** from Flash plan levers: valid ones selectable, locked ones say what unlocks them | "Give them options if valid" |
| **Plan → Flash → Verify as three turns**: plan card with steps + KTuner cells; "I flashed it"/"Not now" as replies; the assistant then gives the logging recipe for the verify drive | Pro-tuner loop (user-research.md) |
| **Charts drawn** from `reply.pictures` (trace, bars, map grid, MAF gap) in SVG, every number also in text | Spec stories 26–27 |
| **Restrained neutral palette** (ChatGPT/Claude greys) + one indigo accent (CopilotKit) + semantic verdict colours only; light/dark from system | Owner hated the colours; copy the canon |
| **Thread persists locally** (localStorage) and re-greets with the current state on reload | Chat apps keep history |
| Server untouched except where a ticket names it | Backend works; the failure was the shell |

## Act — how we work this time (process fixes)

1. **Tickets are journey slices**, each ending in something the owner can *do* in the chat, with
   an acceptance line written as a user action ("type X → see Y").
2. **Every UI ticket is verified in a real browser** at 375 px and 1280 px with screenshots before
   it's called done; the e2e test drives the composer, not a hidden button.
3. **Design review against the canon**: side-by-side with Claude/ChatGPT patterns (composer,
   bubbles, collapsible steps), checked by the impeccable detector and a finish review.
4. The PM owns `spec.md` here; a ticket that adds a card must say where it sits in the message
   anatomy.

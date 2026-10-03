# CA-01 — The chat shell: sidebar, thread, one composer (tracer)

*Blocked by: — · Spec: `../spec.md` §Layout, §Composer routing, §Visual system*

## What to build
Replace `web/app/page.tsx` and `globals.css` with the Claude/ChatGPT shell: sidebar (brand, New
chat), top bar (car + Map version, theme toggle), centred thread (max 768 px), bottom composer
(auto-grow textarea, + attach for CSV, send, Enter to send / Shift+Enter newline, drag & drop),
empty-state greeting with suggestion chips. Every send becomes a user bubble; CSV → upload + AG-UI
run → assistant message; text → `/api/ask`. Thread persists in `localStorage`; New chat clears it.

## Acceptance (owner actions)
- [ ] Open the app with no thread → greeting + chips + composer centred; no forms on screen.
- [ ] Click + → pick a TunerView CSV → chip shows file name → Send → user bubble "📎 file", assistant reply streams below.
- [ ] Type "why is my car slower in the heat?" → Enter → user bubble, then the answer as an assistant message in the same thread.
- [ ] Drag a CSV onto the page → drop overlay → chip in the composer.
- [ ] Reload → the thread is still there. New chat → empty greeting.
- [ ] 375 px: no horizontal scroll, composer pinned bottom, sidebar in a drawer.
- [ ] Light and dark follow the system; toggle overrides.

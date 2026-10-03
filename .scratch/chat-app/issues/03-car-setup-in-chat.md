# CA-03 — Car setup as a conversation

*Blocked by: CA-01 · Spec: journey phase 1*

## What to build
No Car profile → the greeting asks for the car. The owner's typed words go to
`/api/ask {flow:"setup"}`; the assistant replies with an editable Car profile card in the thread
(fields + parts chips + "Still to say" line) and **Save to my car**. Saved → assistant confirms
(Map version 1 = KTuner basemap) and asks for the first log. Sidebar "Edit car" posts a new
profile card into the thread prefilled with the saved profile; a changed parts list records an
Install (server already does this on save).

## Acceptance
- [ ] Fresh DB: type "Civic FE CVT E10, intake + downpipe, Starter 21 Dual" → card filled → Save → confirmation + "attach your first log".
- [ ] No LLM key: the same flow works (built-in draft from words).
- [ ] Edit car → card in thread → change parts → Save → Install recorded line.

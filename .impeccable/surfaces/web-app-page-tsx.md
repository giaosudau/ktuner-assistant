---
version: 1
slug: "web-app-page-tsx"
primary_target: "web/app/page.tsx"
related_targets: ["web/components"]
---

# Surface: the chat (web/app/page.tsx)

Mode: Operate. Audience: one owner-tuner on phone or laptop, tuning their KTuner map by chatting. Task: talk, attach a TunerView log, read the verdict, pick an option, follow the plan, confirm the flash, log the proof drive. Constraints: every number from the engine; owner confirms every state change. Spec: `.scratch/chat-app/spec.md`.

## Direction contract

THESIS: A tuning loop that lives entirely inside a Claude/ChatGPT-style conversation: one composer, one thread, generative-UI cards in the assistant's turns. Refuses the dashboard-of-forms arrangement the previous build shipped.

OWN-WORLD: The category canon played straight (brief-pinned by the owner: "COPY it, do not invent"). ChatGPT/Claude neutral greys (#212121 / #171717 / #2f2f2f dark; #fff / #f9f9f9 / #f4f4f4 light), system UI type, mono numerals in cards, one CopilotKit indigo accent for send/focus/primary, verdict colours only as semantic pills with words. Hairline 12 px cards, pill composer, no shadows except the composer.

STORY: The owner sees a greeting asking about their car, answers in words, attaches a log, watches the steps work, reads "Engine healthy…" with their numbers, sees which changes are open, follows a cell-by-cell plan, taps "I flashed it", and is told exactly which drive to log next.

FIRST VIEWPORT: Desktop: 260 px sidebar (brand, New chat, Your car, Journey stepper, Open steps) left; centre column 768 px with greeting "What are we tuning today?" at ~40% height, the rounded composer directly below it (+ attach left, send right), 4 suggestion chips under it. Mobile: top bar with menu + car/Map version, greeting, composer pinned bottom.

FORM: Category canon (standing exit taken by the owner's brief; no roll, brief-pinned). Seed key: none (brief-pinned canon). Signature interaction: the live work row — shimmering "Reading your log…" naming each tool as it runs, collapsing to "Worked for 1.1 s · Checked 9 things".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

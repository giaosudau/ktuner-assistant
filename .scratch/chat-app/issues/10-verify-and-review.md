# CA-10 — Browser smoke test through the composer + design review

*Blocked by: CA-01..07*

Rewrite `web/e2e/chat.e2e.js` to drive the chat like a person: attach through +, send, wait for
the assistant message, expand the work row, answer a chip. Screenshots at 375 and 1280 px, light
and dark. Impeccable detector + finish review against `../spec.md`.

## Acceptance
- [ ] `npm run e2e` green against `make run`.
- [ ] Screenshots in `.impeccable/review/`; review findings fixed or listed.

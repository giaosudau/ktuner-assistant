# Chat app — issue tracker

Why: `review-ooda.md`. Who: `user-research.md`. What: `spec.md`. Product truth: `/PRODUCT.md`.
Every ticket is done only when its acceptance lines pass **in a real browser** (375/390 and 1280/1440 px).

| # | Ticket | Blocked by | Status |
|---|---|---|---|
| CA-01 | Chat shell: sidebar, thread, one composer | — | done — e2e steps 1, 3, 8; drag & drop and paste checked by hand |
| CA-02 | Assistant message anatomy | 01 | done — e2e steps 4, 5 (work row, prose → report → one Next step) |
| CA-03 | Car setup as a conversation | 01 | done — e2e step 2 on a fresh DB, no key |
| CA-04 | Owner questions as quick replies | 02 | done — checked by hand on 23 Aug 20:38: what-changed → Undo naming Map version 1; housing; answer updates every copy in the thread |
| CA-05 | Options → Plan → Flash → Verify as turns | 02 | done for Undo (checked by hand: "I flashed it back" → Map version restored, Shakedown line). The one-family KTuner card path renders the same `KTunerCard` but none of the 9 real drives produces one — **PM: verify on the first real one-family plan** |
| CA-06 | Charts in the reply | 02 | done — trace, proof bars and map grid drawn; built-in replies now carry one picture (server `graph.py`, `test_pictures.py`). `maf_gap` drawn but no real drive yields it yet |
| CA-07 | Journey stepper, Open steps, History in sidebar | 01 | done — e2e step 7; phase read from `/api/state` |
| CA-08 | First-log guide from the engine | 03 | done — `logGuide` in `/api/state` (`copy.log_guide`), seam-1 `test_state_carries_the_first_log_guide` |
| CA-09 | Screenshot attach | 01 | done for no-key (plain "can't read pictures" answer); the model path needs a key in `.env` |
| CA-10 | e2e through the composer + design review | 01–07 | done — `web/e2e/chat.e2e.js` 9/9 (run with `CHROMIUM_PATH` to system Chrome); impeccable finish review, fix round applied |

## Follow-ups found while building (not done here)

- Server copy repeats a sentence in the Undo step body ("Stop open: flash your previous map file (…). Flash your previous map file (…).") — `server/kta_server/copy.py` / engine wording.
- The Knock Control trace's 120 s window can miss the peak its title names (title 0.49 → 0.65, window tops out near 0.55) — `engine/kta-picture.js` `trace()`.
- Ticket 15 (pictures, screenshots) files are still untracked (`pictures.py`, `screenshot.py`, `kta-picture.js`, `test_pictures.py`) while committed `app.py`/`graph.py` import them: commit ticket 15 or HEAD does not run on a clean checkout.
- Past chats list under "New chat" (canon) — the thread is one per browser today.

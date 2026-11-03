# UX loop — tracker

Procedure: `LOOP.md`. One row per item; done only when its test line passes. The next run starts
at the first round whose status is not `done`, else opens a new round from the backlog below.

## Round 2 (3 Nov 2026) — status: done

Focus: the whole owner journey, car setup through the nine real drives (`journey.js`, before and
after). Debate and items: `discussion-r2.md`. Gates at close: `npm test` 253/253 ·
`cd server && uv run pytest -q` 357 passed · `cd web && npx tsc --noEmit` clean ·
`npm run e2e` 12/12 on a fresh DB with the spinner-only idle restored · knowledge-graph check
clean. Code review: 3 findings, all fixed (a live line left spinning after a reload, the Undo
said twice when the Map version is known, MAF strings the first pass missed).

| # | Item | Proof | Status |
|---|---|---|---|
| R2-1 | Round never goes backwards | journey: "Round 1 · Calibration drive" on 1 Sep (was "Round 0 · Calibrate") | done |
| R2-2 | A proved step leads the reply | journey 30 Aug 15:29: "Done · Undo: trims back within ±5 %. Trims −2.3 % over 15 calm minutes (they were −21.4 %)" above the report | done |
| R2-3 | "Same as last time" says why | journey 22 Aug 09:50: "This Drive settles nothing: it was too warm to be a Cool Drive…" inside the Next step | done |
| R2-4 | Undo as three numbered steps | `test_ux_round2.py`; journey 23 Aug 20:38: save today's map · open the file you ran before and flash it · 10 calm minutes then attach; no "Stop open" | done |
| R2-5 | "Flash back" pill on an Undo | journey 23 Aug 20:38 | done |
| R2-6 | Stop chips fit a Stop | journey 23 Aug 20:38: "Is my engine OK to drive home?", "How do I put my old map back?", "Why this step?" | done |
| R2-7 | No map tour on a too-short drive | journey 30 Aug 15:09: no `flash-plan` | done |
| R2-8 | One name: MAF Hz | engine tests; health row "MAF sensor headroom / MAF Hz not logged" | done |
| R2-9 | "I read this drive before" | `test_ux_round2.py` (same CSV twice, 1 drive stored); browser: "I read this drive before, on 3 Nov: nothing new is added to your car file." | done |
| R2-10 | Debt: `sendNow` reverted | `git diff e80b186~1` on Composer/page is empty | done |
| R2-11 | Debt: no busy chat after the spinner | root cause: the graph's `suggest` model call runs after the answer's snapshot; a "Suggesting replies" live line now covers it, so spinner and busy end together; e2e passes with spinner-only idle | done |

Also paid: `undo_sentence` deleted (its tests now guard `undo_recipe`); the e2e no longer pins the
model's own sentence (the built-in one stays pinned in three server tests).

## Tech debt list

- The legacy "AFM Flow" family name (~40 engine uses, an internal key) vs KTuner's "MAF Scaling":
  rename the owner-facing label once the key is separated from the words.
- Web words chips, pills and "Done" itself (KIND, Suggestions, the banner), against "the server
  words it": move them into the server's copy when that file next changes.
- `NextStepCard`'s "This drive didn't count:" branch never runs today (every Wasted line starts
  "This Drive settles nothing"): delete it if the server's wording stays.

## Backlog for Round 3 (ranked)

1. The model's prose repeats the cards (a "Tuner order" list beside the map tour, health numbers
   beside the health card): the explainer's prompt says one paragraph and points to the cards.
2. "Can't tell yet · Log AFR Command and MAF Hz" repeats in "Since last time" on every drive:
   say it once, then fold it.
3. The re-upload line names the day it was read; name the drive too ("your 5 Sep 07:56 drive").
4. Chat titles from the result ("5 Sep 07:56 · Watch: dead gauges").
5. Table viewer: human title, axis units, the logged range overlaid.
6. Hot-restart notice with a calm-drive countdown (`kc-heat-soak`).
7. Labels for each number's window (verdict tiles vs health vs map tour).
8. `kc-log-gate` 10 Hz vs thresholds `rate_min_hz` 6.
9. 44 px sidebar rows on a phone; the console 404; the frozen fuel-pressure line reading "Not logged".

## Round 1 (3 Nov 2026) — status: done

Debate and items: `discussion-r1.md`. Audit: `audit.md`. Research: `research.md`.
Gates at close: `npm test` 253/253 · `cd server && uv run pytest -q` 354 passed, 3 skipped ·
`cd web && npx tsc --noEmit` clean · `python3 tools/knowledge-graph.py --check` clean · `cd web && npm run e2e` 12/12 on a fresh DB · real app
walked on a fresh DB at 390 and 1280 (`walk.js`), dark mode checked at 1280. Code review: 7
findings, all fixed (CVT limits from the engine, IAT lines as reference only, one label/tone per
kc-ranges line, half-up rounding, the brief slot is the attachment's default only, old chats keep
their seconds, the raw Ceiling read).

| # | Item | Proof | Status |
|---|---|---|---|
| 1 | Slot guard | `test_ux_round1.py` brief `slot` 2 / None; browser: sep01 attach pre-selects slot 2, slot 1 shows "Your drive brief asks for slot 2 (Tune 2)…", sent meta "map slot 2" | done |
| 2 | Honest health summary | `ask.test.js` 0/1/3 nodata; browser: "Nothing wrong seen, but 1 check couldn't be read on this log." Safety channel: the flat-DIFP-without-pulls exception is deliberate (bdfb94b); CONTEXT.md now says so | done |
| 3 | One Next step on stage calibrate | `test_ux_round1.py`; browser: Next step "The Calibration drive: can more boost show on your car?" with what's missing first; no "no headroom" | done |
| 4 | Car card explains itself | browser 390: segmented 44 px Offered / Not offered / Haven't looked, "Still to read…" line, sticky Save | done |
| 5 | Live progress, honest time | browser: live "· N s" counter; "Worked for 1 min 17 s" after a 77 s wait | done |
| 6 | Verdict first | DOM order reply-card → checkpoints | done |
| 7 | Checkpoints ring | browser: "6 of 8 met" ring, unmet first, "6 met" folded; brief shows empty circles | done |
| 8 | Health bullet bars | `test_ux_round1.py` (cited ids only, no band on Can't tell, tie rounding); browser: trims, Knock Control, intake, CVT bars, "Watch from 0.56" | done |
| 9 | Knock Control chart scale | `drive.test.js` marks/yRange; browser: 0.45–0.70 scale, Floor 0.49 / Watch 0.56 / No hard driving 0.62 lines | done |
| 10 | Map tour strip + folds | browser 1280: "2 Locked · 1 No change · 3 Read-only" strip, six one-line folds | done |
| 11 | Sidebar details | browser: "Map version 1 / Starter 21 Dual Tune 2" on two lines; drawer footer no longer covers open steps | done |
| 12 | Message details | browser: "My working notes · not checked"; 44 px Copy/Edit hit area | done |
| 13 | Fact fixes | floored 90 % (`kc-quick-adjustments`, downpipe research §8), P0420 400-cell note, 21 psi from 3,500 rpm (digitized Boost_Target_*_Normal); `test_knowledge.py` 23 passed | done |

Round 1's backlog moved into Round 2 and the Round 3 backlog above.

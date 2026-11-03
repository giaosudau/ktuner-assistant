# UX loop — tracker

Procedure: `LOOP.md`. One row per item; done only when its test line passes. The next run starts
at the first round whose status is not `done`, else opens a new round from the backlog below.

## Round 1 (3 Nov 2026) — status: done

Debate and items: `discussion-r1.md`. Audit: `audit.md`. Research: `research.md`.
Gates at close: `npm test` 253/253 · `cd server && uv run pytest -q` 354 passed, 3 skipped ·
`cd web && npx tsc --noEmit` clean · `python3 tools/knowledge-graph.py --check` clean · real app
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

## Backlog for Round 2 (ranked)

1. "I already read this drive" notice on a re-upload (server flag + reply line).
2. Chat titles from the result ("5 Sep 07:56 · Watch: dead gauges"), not the first message.
3. Table viewer: human title (raw KTuner name as subtitle), axis units, the logged range overlaid.
4. The model's prose repeats the cards (map families list, capabilities twice): front-agent and
   explainer prompt — the card says it, the prose points to it.
5. "AFM Hz" (model prose, health row "AFM sensor headroom") vs "MAF Hz" (car card, checkpoints):
   one name, as TunerView spells the channel — check TunerView's gauge list.
6. Hot-restart notice with a calm-drive countdown (`kc-heat-soak`, CONTEXT Hot restart).
7. Numbers disagreeing across cards: label each one's window (verdict tiles vs health vs map tour).
8. "What can you do?" chip after setup (stage suggestions).
9. Rate conflict: `kc-log-gate` 10 Hz vs thresholds `rate_min_hz` 6 — decide and word it once.
10. Sidebar rows 38 px and "Show the drive brief" 34 px on a phone: 44 px in the drawer.
11. Sidebar and Recap open steps on stage calibrate still list the habit / logger steps apart from
    the Calibration drive; fold them under it.
12. Console 404 on every page load (find the resource: favicon?).
13. A frozen fuel pressure line on 5 Sep reads "Not logged": say "stuck on one number" (engine
    `flatOut` skips lines already Can't tell).

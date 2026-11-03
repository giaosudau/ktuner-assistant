# UX friction audit: first-time owner, end to end

Walked 3 Nov 2026 on the running app (chat :3000, server :8000) with Playwright + system Chrome,
fresh browser context, at 390x844 (`m*` shots) and 1280x800 (`d*` shots).
Script: `/private/tmp/claude-501/-Users-bean-codespace-ktuner-assistant/a7a530e0-8029-452c-8569-92308eb0add9/scratchpad/audit/walk.js`.
Shots, page text and touch-target metrics: same folder, `shots/` (`*-pN.png` = scrolled viewport pages,
`*-full.png` = whole thread). The server DB started with no car profile; the 390 run did car setup,
so the 1280 run starts at "Welcome back" (no setup screens at desktop). DB copy taken before the walk:
`.../scratchpad/audit/ktuner.db.before`.

Measured waits: drive 1 reply 53.9 s (m) / 46.0 s (d); chip answer 49.0 s / 53.0 s; drive 2 46.9 s / 59.1 s;
"What can you do?" 10.6 s. Every reply card still says "Worked for 0.4–0.5 s".

## 1. Journey

| # | Step | What the owner sees | Must understand / decide | Friction | Sev | Shot |
|---|---|---|---|---|---|---|
| 1 | Land | "Let's tune your car." + composer + 2 chips | Type a description or use the example | Clean. Sidebar already lists an old chat ("Civic FE 1.5T CVT on E10 RON95…") while "Your car: Not set up yet" (probably DB leftover) | low | m01 |
| 2 | Example filled, send | Text in composer | Nothing | None | – | m02 |
| 3 | Car card | Prose, then a 13-field form; "Save to my car" at the very bottom | Check 6 fields, tick a KTuner checkbox, type a TPS number, pick two "Not checked" selects, a logging rate | Save button sits ~1,800 px below "Please check it and save it" on a phone; Pedal reading looks optional ("Not read yet") but later blocks the boost answer; "Thinking unchecked" badge | high | m03-car-card-full |
| 4 | Saved | Saved summary + "The Calibration drive" brief: 6 numbered sections, 4 watch gauges, 10 checkpoints (~3,000 px) | Do an evening-before TPS step, set up logger, drive, two pulls, slot 2 | Wall of text before the first drive. Prose asked "Want the drive brief card now?" and the brief then appeared anyway | high | m04-saved-log-guide-full |
| 5 | Attach CSV | File chip + "Fuel in the tank E10 RON95 III" + "Map slot 1" | Confirm fuel and slot | Slot defaults to 1 though the brief just said "Choose slot 2 (Tune 2)" | high | m05-drive1-attached |
| 6 | Wait | Report cards appear fast, then ~50 s of "Working…" in the composer only | Is it done? | Next step card is missing for ~50 s with no message saying more is coming | med | m06, m07 |
| 7 | Drive 1 reply | Verdict line, "Did this log meet the brief? 6 of 8", OK card, 15-row health report, Calibration card, chart, 6 map families, Next step (8 viewport pages at 390) | What to do next | Three different next actions (see 2.1); numbers disagree between cards; very long | high | m08-drive1-reply-p7…p12 |
| 8 | Table viewer | "MAF_Scaling_Custom", "1 × 103 · 0.6452 to 275", line from "point 1" to "point 103" | What this curve means for my car | Raw table name, no units, no "your drive sits here"; half the sheet empty at 390 | med | m09, d06 |
| 9 | Work row | 29 tool rows with code names (`readLog`, `ingestUpload`, "177 ms") | Nothing | Fine as opt-in; collapsed by default | low | m10 |
| 10 | Chip "What's safe to change on my car?" | Sends a different sentence: "What is safe to change in my map right now, and what would unlock more?" | – | 49 s wait; answer ends "Next step: Nothing to change. Drive it." after listing 3 things to do | med | m12, m13 |
| 11 | Drive 2 | Verdict "Engine healthy", "3 of 8", health "Yes. Every check passed on this drive." over 9 "Can't tell" rows; Next step "Your logger recorded 4 dead gauges" | Is my car fine? | False reassurance (2.1) | high | m16-drive2-reply-* |
| 12 | Sidebar | Two identical chat titles, car, Round 1 stepper, "What I need from you" | Which chat is which | "Your next drive can settle" pushed under the pinned Export/Import footer | low | m17, d14 |
| 13 | New chat | "Welcome back." recap card, chips "Attach my latest log / Is my knock control OK? / Is RON97 worth it?" | – | "What can you do?" chip is gone once a car exists; had to type it | low | m18, d15 |
| 14 | "What can you do?" (typed, 1280) | Prose list of I can / with a limit / I can't, then a card repeating the same list | – | Same content twice in one reply | med | d17-capabilities-* |
| 15 | Wrong file (.txt) | Red "Attach a TunerView CSV, or a PNG, JPEG or WebP screenshot." | – | Good: rejected before sending | – | m19, d18 |
| 16 | Same CSV again (1280 run re-sent sep01) | A full new report; "2 Drives in your car file" (not 3) | Did it count twice? | No "I already read this drive" notice; silent dedupe | med | d05-drive1-reply-* |

## 2. Problems by group

### 2.1 Comprehension
- **Contradictory next steps in one reply (high).** Drive 1 Next step: "Nothing to change. Drive it. … on this car the turbo has no headroom left. Nothing to type in KTuner." Same reply, Calibration card: "What it means: No map change yet: type the Pedal full reading in your car profile, then drive the Calibration drive." Sidebar (d-text-drive1-reply.txt): "Your next drive can settle: Log AFR Command and MAF Hz". PRODUCT.md promises exactly one next step. Copy: `server/kta_server/copy.py:1108`; card `web/components/Cards.tsx:153,196`.
- **"Can't tell" vs "no headroom" (high).** "Can more boost show? Can't tell yet" (m08-p10) sits above "the turbo has no headroom left" (m12). The owner can't know which to believe.
- **False "all clear" (high).** Drive 2: "Yes. Every check passed on this drive." heads a report with 9 "Can't tell" rows and a reply that says "This Drive settles nothing: the logger lost DIFP, … Turbo Pressure". Verdict pill still "OK", line "Engine healthy". String: `engine/text/i18n-drive.js:58`; card `web/components/ShopCards.tsx:48`.
- **Numbers disagree (med).** Full-throttle AFR: "AFR 10.8" (verdict) / "10.6 AFR at 12 psi and up" (health) / "measured already 10.1–10.7" (map). Knock Control: "0.51 → 0.54" (stat) / "0.51 → 0.49 (peak 0.54)" (health) / "Fuel-quality score 0.49 → 0.54" (chart title). Boost: "peak 13.9 psi" vs citation "Why boost stops at 19.2 psi" (m-text-chip1-reply.txt). Each may be a different window, but none says so.
- **Jargon left raw (med).** "Knock retard at WOT · 5.5° under boost, scheduled by Knock Control (not knock events) · OK"; "Boost below 3,000 rpm · -8.5 psi vs reference map · OK"; "DI fuel pressure at WOT"; "STFT B1 + LTFT B1"; "“Eliminate Artificial Knock Control Rise” is ticked on my map" (`Cards.tsx:386`). A nervous owner reads "5.5° retard" as damage.
- **"Thinking unchecked" (med).** Badge under every reply (`web/components/Messages.tsx:189`). Reads as "something was not checked". 
- **Wall of text (high).** First brief = 6 sections + 10 checkpoints before the owner has driven once (m04). Drive 1 reply = 8 phone screens; 6 map-family blocks each with a grey "Unlocks when:" paragraph even though "Your logs support no map change right now" (m08-p11, m07).
- **Brief checklist looks pre-ticked (low).** Before any drive the 10 "Checkpoints I'll read your log against" each have a grey ✓ (m05, m08-p6).
- **Chip label ≠ sent text (low).** "What's safe to change on my car?" posts "What is safe to change in my map right now, and what would unlock more?" (m12).

### 2.2 Mistake prevention
- **Wrong map slot (high).** Brief: "Choose slot 2 (Tune 2) when you start the car" and checkpoint "On slot 2 (Tune 2)" (`server/kta_server/copy.py:599`). Composer defaults "Map slot 1" (m05, `web/components/Composer.tsx:104-110`). Drive 1 was tagged "map slot 1"; the result shows "6 of 8" and silently drops the slot and floored-pull checkpoints the brief listed (10 in brief, 8 in result). No warning.
- **Pedal reading skipped (high).** The car card's "Pedal full reading (TPS %)" placeholder "Not read yet" (`Cards.tsx:392`) does not say it is needed; both drives then answer "Ceiling: Can't tell: the drive was read without a Pedal full reading". Two wasted drives for the main question (more boost).
- **Logger not set up (high).** Both drives fail "Logged 10 times a second or faster · 7.5 a second" and "AFR Command and MAF Hz in the log · missing". Car card selects say "Not checked" (m03) with no warning at Save that the next drive will miss two checkpoints.
- **Forgetting to save the car (med).** "Nothing saves until you do." but Save is at the end of a 2,237 px thread on a phone (m03-car-card-full); the composer with "+ Attach a TunerView CSV" stays live above it. (Not tested what an unsaved attach does.)
- **Re-sending the same drive (med).** Same CSV re-attached gave a full fresh report with no "already read" note (d05; "2 Drives in your car file").
- **Wrong file type (ok).** .txt refused with "Attach a TunerView CSV, or a PNG, JPEG or WebP screenshot." (m19). Too-short logs not tested (no short fixture used).

### 2.3 Visualization gaps
- **Health report is 15 text rows (med).** "Intake air temp 39 °C peak", "Coolant temp 92 °C peak", "CVT fluid temp 73 °C peak", "DI fuel pressure 99 % of target" each against a known limit: a bullet bar (value vs OK/Watch/Stop band) would read in one glance (m08-p9, p10).
- **Verdict stats have no scale (med).** "0.51 → 0.54 Knock Control" and "+1.6 % worst fuel trim" (m08-p8) never show the 0.60 line the Next step names ("Knock Control over 0.60 on the gauge") or the ±5 % band.
- **Chart exaggerates a tiny change (med).** "Fuel-quality score 0.49 → 0.54": y-axis 0.48–0.54 auto-fits min/max (`web/components/Chart.tsx:36-39`), so +0.05 looks like a cliff, with no 0.56/0.60 reference line. Axis text ~7 px at 390 because the SVG scales down (m08-p11). Caption repeats the title: "Seconds around fuel-quality score 0.49 → 0.54 (dotted line)" (`Chart.tsx:153`).
- **Brief score as text (low).** "Did this log meet the brief? 6 of 8" / "3 of 8" with a long row list; a progress ring + only the failed rows would be shorter (m08-p7).
- **Table viewer (med).** "point 1 … point 103", "0.65 … 275" with no units (`web/components/TableViewer.tsx:224-232`); no overlay of where the owner's own drive sat.
- **Long wait feedback (med).** ~50 s with only "Working…" in the composer (`web/components/Composer.tsx:176`) on drive uploads (m06, m07, m14, m15). Chip answers do show "Car history… · 8 checked" inline (m12): that pattern is missing for uploads. "Worked for 0.5 s" (`Messages.tsx:158`) contradicts the 54 s the owner waited.

### 2.4 Mobile (390 px)
- No sideways scroll on any screen (metrics `overflow=0px`).
- Reply is 8 viewport pages; the verdict "OK" card is on page 2 below the brief checklist (m08-p7, p8): the first thing seen after the one-line verdict is a red ✕ "Logged 10 times a second or faster".
- Table viewer sheet: chart fills the top third, rest blank (m09).
- Sidebar drawer: "Your next drive can settle" is cut by the pinned "Export History file / Import History file" footer (m17).
- Car card: 13 fields in one column, Save ~1,800 px below the instruction (m03-car-card-full).

### 2.5 Accessibility
- **Targets under 44 px** (m-metrics-*.json): "Explain these tables" and "View the N tables (2D / 3D)" 22 px tall, 12 of them per drive reply (`web/app/globals.css:1098` `.link-btn`, `padding: 0`); KTuner checkbox 13×16 px (`Cards.tsx:381`); Copy / Edit message 30×30; "Thinking unchecked" 30 px; Delete chat 36×36; sidebar rows 38 px.
- **Colour-only?** No: pills always carry a word ("OK", "Can't tell", "Locked"; `web/components/Pill.tsx:1`), checklist uses ✓/✕ shapes. Good.
- **Contrast:** `--ink-3 #6b6b6b` on white ≈ 5.3:1, passes AA; but chart/table axis text is 11 px mono scaled down to ~7 px on phone (m08-p11, m09).

## 3. Top fixes (ordered)
1. One Next step per reply: Calibration "What it means", sidebar open step and Next step must name the same action; when the ceiling is "Can't tell", never say "no headroom left".
2. Health summary must not say "Every check passed" when any row is "Can't tell"; drive 2 verdict should be "Can't tell" or "Watch: log broken", not "OK / Engine healthy".
3. Composer slot defaults to the slot the open brief asks for, and warns when tagged slot ≠ brief slot.
4. Car card: mark Pedal reading and logger fields as "needed for the boost answer", sticky Save bar on phone.
5. Upload wait: inline step progress like the chip answer; drop or fix "Worked for 0.5 s".
6. Collapse the 6 map families to one line each when nothing changes; open on tap.

## 4. Detail review

| Element | Where | What's wrong | Why it matters to the owner | Proposed fix |
|---|---|---|---|---|
| Sidebar map pill | d05-p5, d17 at 1280: "Map version 1 · Starter 21 Dual…"; `web/components/Sidebar.tsx:159-163` | Truncated with ellipsis; full name only in `title` (no hover on phone) | The map name is the one thing they must match in KTuner before flashing | Two lines: "Map version 1" / "Starter 21 Dual Tune 2", no ellipsis |
| Chat titles | m17, d14, d17: two rows "Civic FE 1.5T CVT on E…", one "Log TunerView_20260…"; `Sidebar.tsx:124`, `globals.css:2138-2140` | Titles are the first message, so identical or a raw filename | Can't find "the chat with my 5 Sep drive" | Title from the result: "5 Sep 07:56 · Watch: dead gauges" |
| "Thinking unchecked" | every reply, m03, m08-p7; `Messages.tsx:189` | Amber badge looks like a warning, label is jargon | Owner thinks something about their car was not checked | Rename "My notes (not checked)" in muted grey, or hide |
| "Worked for 0.5 s · Checked 29 things" | m08-p7; `Messages.tsx:158` | Shows tool time, owner waited 54 s | Erodes trust in every other number | Show wall time, or drop the time |
| Prose question "Want the drive brief card now?" | m03; brief then shows unasked in m04 | Asks, then does it anyway | Owner doesn't know if a reply is expected | Drop the question; just show the brief |
| Car card Model / Engine | m03: "Civic FE 1.5T" and "1.5T" | Engine repeated inside Model | Looks like a misread; owner edits it and may break matching | Model "Civic FE", engine "1.5T" |
| "Save to my car" | m03 bottom; `Cards.tsx:451` | Primary sits after 13 fields and 3 help paragraphs; correct weight, wrong position on phone | Owner scrolls away before saving | Sticky footer in the card on narrow screens |
| Pedal field | m03 "Pedal full reading (TPS %)" "Not read yet"; `Cards.tsx:392` | Looks optional; no "needed for" | Two drives later: "Ceiling: Can't tell" | Label "Needed to answer 'can more boost show?'" + inline status |
| AFR Command / MAF Hz selects | m03 "Not checked" | "Not checked" reads as an unticked box, options "Offered / Not offered" hidden | Logger stays wrong; checkpoint fails | Yes / No / Haven't looked radio pills |
| KTuner checkbox | m03; `Cards.tsx:381-388` | 13×16 px target, long jargon label | Mis-tap; wrong setting changes how Knock Control is read | 44 px row-wide toggle; short label + "What's this?" |
| Map slot select | m05; `Composer.tsx:104-110` | Defaults "1"; label only "Map slot"; brief says slot 2 | Drive logged on wrong slot is compared wrongly | Default to brief slot; show "Brief asks for slot 2" |
| Brief checkpoint icons | m05, m08-p6 | Grey ✓ before any drive | Looks already done | Empty circle until read |
| "Did this log meet the brief? 6 of 8" | m08-p7 vs brief's 10 checkpoints | Count drops 2 checkpoints (slot, floored pulls) silently | Owner thinks slot was fine | Show all 10; unmet slot as ✕ |
| Verdict card order | m08-p7/p8 | Red ✕ rows appear before the green "OK" card | First visual after "Engine healthy" is red | Verdict card first, brief result after |
| Health summary line | m16: "Yes. Every check passed on this drive." over 9 "Can't tell"; `engine/text/i18n-drive.js:58` | Contradicts its own rows | False reassurance on a broken log | "Nothing wrong seen, but 9 checks couldn't be read" |
| "Nothing to do" pill + Next step | m12; `Cards.tsx:153`; `copy.py:1108` | Says "Nothing to change. Drive it." beside a card asking to type the Pedal reading | Owner skips the step that unlocks progress | Next step = first open requirement |
| "Explain these tables" | m08-p11; `ShopCards.tsx:195-199`; `globals.css:1098` | Looks like a link, actually sends a chat message; 22 px tall | Surprise 50 s answer; mis-taps | Make it a chip/ghost button ≥44 px; keep links for "View" only |
| "View the 13 tables (2D / 3D)" | m08-p11 | Same style as Explain, opens a modal; 22 px tall | Two different actions look identical | Ghost button with table icon |
| Table viewer header | m09, d06: "MAF_Scaling_Custom", "changed only through the checked plan"; `TableViewer.tsx:295` | Raw KTuner name and dev phrase as title | Owner can't tell what table this is | Title "Airflow (MAF Scaling)", raw name as subtitle |
| Table viewer axes | m09, d06; `TableViewer.tsx:224-232` | "point 1 / point 103", "0.65 / 275" no units | Unreadable curve | Hz on x, g/s on y; mark the logged range |
| Chart caption | m08-p11; `Chart.tsx:153` | Caption repeats title; y-axis auto-fit | A 0.05 rise looks like a spike | Fixed 0.40–0.70 axis with 0.56 / 0.60 lines |
| Suggestion chips while busy | `Messages.tsx:432` `disabled={a.busy}` | Disabled with no reason for ~50 s | Owner taps, nothing happens | Tooltip/aria "Wait for the reply to finish" or queue the tap |
| Send button | m01 grey disabled; `Composer.tsx:178` | Disabled, no hint why | Minor; composer hint covers it | – (acceptable) |
| Capabilities reply | d17: prose "I can … I can't" then same lists in a card; `Messages.tsx:445-456` | Same content twice | Doubles the scroll | Card only, one-line intro |
| "What can you do?" chip | m01 has it; m18/d15 don't | Disappears after setup | Returning owner loses the discover entry | Keep it as last welcome chip |
| Sidebar "Your next drive can settle" | m17 | Cut under pinned footer | The actionable list is hidden | Pin footer only on desktop, or put open steps above "Your car" |
| Copy / Edit message icons | m08; metrics 30×30 | Below 44 px | Mis-tap near text | 44 px hit area |
| Old chat on fresh profile | m01 landing text lists a chat while "Not set up yet" | Leftover thread shown with no car | Confusing on first open | Hide chats whose car was deleted (or DB hygiene) |

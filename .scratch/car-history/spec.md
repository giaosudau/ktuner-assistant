# Spec: Drive check v2 — safe verdicts, Car history and Flashes

*Status: ready-for-agent · Sources: `docs/research/drive-check-tuner-analysis.md`, `docs/research/ktuner-only-tuning.md`, `docs/research/fact-check.md` (wins on any number), grilling Q1–Q33, `CONTEXT.md`, ADR 0001.*
*Vocabulary: every capitalised term below (Drive, Car history, Flash, Map, Shakedown drive, Cool drive, Hot restart, Too-short drive, Hidden drive, Unexplained change, History file, Verdict, Safety channel, Baseline, Fuel-quality score) is defined in `CONTEXT.md`. Use those words in code names, copy and tests; do not invent synonyms.*

---

## Problem Statement

I own one car — a Civic FE 1.5T CVT on KTuner, running Vietnam E10 RON95 — and I log every drive with TunerView. The app checks one drive at a time, and that is not enough:

- **A bad Flash can hide in plain sight.** On 23 Aug at 20:38 the ECU was pulling 17–21 % of the fuel from the first second, right after something was flashed. The app said Stop, but nothing connected it to the Flash, nothing told me not to drive hard *before* I tested the new map, and nothing showed that 19:59 was fine and 20:38 was not.
- **I can't see my car change over time.** I have 16 drives. Whether the Fuel-quality score creeps up, the CVT runs hotter, or my lugging habit is improving is invisible one drive at a time.
- **Some verdicts are wrong or misleading.** A 3.6-second log gets a verdict. A flat Turbo Pressure channel is reported as "peak boost −0.3 psi". A hot intake with a perfect Fuel-quality score is called Stop. A score of 0.64 is called "good" on a car whose normal is 0.49.
- **The page doesn't tell a story.** Numbers are there, but the order and the words don't walk me from "which drive is this?" to "is it safe?" to "what do I do?" to "is my car getting better?".
- **I don't know which Map a drive was on.** The log does not say.

## Solution

The Drive check becomes a short story told in the same order every time, on my phone in the car park or on my laptop at home:

1. **Which drive is this?** Date, length, hot or cool, traffic or highway, the Map it was on (from my Flash records), log quality.
2. **Is it safe?** One sentence — "Can I drive hard today?" — then five safety lines, each a number, what it means and a Verdict word (OK / Watch / Stop / Can't tell). Limits are judged against *my* car's Baseline.
3. **What do I do?** One thing, with the evidence, at most three steps, how the next drive proves it, and how to undo it.
4. **Is my car changing?** Six small charts across all my drives, with my Flashes marked, hot drives drawn differently from cool ones, and Stops flagged.
5. **Was it faster?** The best acceleration today against my best at a similar intake temperature — or an honest "not comparable".
6. **What's next?** The ranked list: up next, later (locked, with what unlocks it), checked and fine.
7. **What couldn't this drive tell?** Missing, flat or too-short data, and how to fix my TunerView setup.
8. **Engineering view** — the graphs, collapsed.

After I record a Flash, the next drive is a **Shakedown drive**: the app tells me to drive calmly until it has seen ten calm minutes with healthy trims, then releases everything else. If the logs jump with no Flash recorded, the app asks me — *I flashed / New tank of fuel / Neither* — instead of guessing. My Car history lives in my browser, can be rebuilt by loading my log folder, and can be exported to one History file that holds my Flashes too. Nothing leaves my machine.

---

## The story contract (order of information)

Each block answers exactly one question, answers it in its **first line**, and appears in this order on every screen size. A block whose question cannot be answered says so in its first line ("Can't tell: …") instead of disappearing — except Performance, which hides when the drive has no acceleration window, and the Shakedown banner, which only exists during a Shakedown.

| # | Block | Question it answers | First line example |
|---|---|---|---|
| 0 | Shakedown / Unexplained change banner (only when active) | "Is something about my car new?" | "Shakedown drive: drive calmly. 6 of 10 calm minutes done." |
| 1 | Drive card + Key moments | "Which drive is this, and what can it judge?" | "Sat 30 Aug · 16:01 · 53 min · Hot · Traffic", then up to 5 Key moments ("16:24 hard pull, intake 60 °C") |
| 2 | Safety | "Can I drive hard today?" | "Watch — yes after it cools, not in traffic." |
| 3 | Your one thing | "What should I do?" | "Keep the revs up in hot traffic." |
| 4 | Your car over time | "Is my car changing?" | "16 drives since 15 Aug · 1 Stop · Map not recorded before today" |
| 5 | Performance | "Was it faster?" | "50→70 km/h 2.30 s — not comparable to your best (9 °C hotter)." |
| 6 | Up next · Later · Fine | "What comes after?" | "2 up next · 3 locked · 9 fine" |
| 7 | What this drive can't tell | "What is missing?" | "Turbo Pressure was flat for the whole drive." |
| 8 | Engineering view (collapsed) | "Show me the graphs." | — |

The story has one rule: **safety before advice, advice before history, history before fun, fun before detail.** A Stop anywhere collapses blocks 3–5 into a single line ("Paused until the Stop is fixed") so nothing competes with it.

---

## Design system: visual and colour rules

The app already has a token set ("dyno sheet" look, light and dark). This spec adds **no new hues**. Every new element maps to an existing token:

| Element | Token(s) | Rule |
|---|---|---|
| Verdict OK / Watch / Stop / Can't tell | `good-*`, `watch-*`, `stop-*`, `none-*` (bg, fg, icon) | **Status tokens are reserved for Verdicts.** Always icon + word + colour, never colour alone. Never used for a chart series, a limit line or decoration. |
| Car-history chart series | `--meas` (one series per chart) | One hue for every chart. Each chart is one measure; six charts are small multiples sharing the same x positions (one per drive). **No dual axes, ever.** |
| Cool vs hot drive | shape, not colour | Filled dot = Cool drive, hollow dot (2 px `--meas` ring on `--sheet`) = hot drive. Dots ≥ 8 px, 2 px surface ring when overlapping. |
| Stop drive | `--stop-ic` ring around the dot + a small ✕ glyph | The only status colour inside a chart; also named in the tooltip ("Stop: trims −21 %"). |
| Flash marker | `--ink-3` 1 px vertical line across all six charts + Map name label at the top | Same x as the first drive after the Flash. |
| Baseline | `--axis`, dashed | Labelled "your normal 0.49" at the right end. |
| Limit | `--line-3`, solid | Labelled with its number ("limit 100 °C"). |
| Gridlines, axes | `--grid`, `--axis` | Recessive; at most 3 gridlines per small chart. |
| Text, values, labels | `--ink`, `--ink-2`, `--ink-3` | Text never wears a series or status colour. Numbers in the mono font with tabular figures. |
| Existing `--third` green | — | Fails 3:1 contrast on the light surface (2.74:1, validator run 2 Oct 2026). Not used in new charts; where it already appears it must carry a direct text label. |

**Validator record (dataviz `validate_palette.js`, 2 Oct 2026):** `--meas, --cmd, --third` light: all checks pass, contrast WARN on `--third` (2.74). Dark: all pass. Re-run if any chart token changes.

**Typography:** the display font only for the Verdict word, block titles and the drive date; body font for sentences; mono for every number and unit. One size step between block title and body; no other sizes.

**Numbers and units (one rule each, everywhere):** psi 1 decimal · Fuel-quality score 2 decimals · °C integer · % trims 1 decimal with sign · seconds 2 decimals for acceleration, minutes integer for durations · dates "Sat 30 Aug · 16:01" (Vietnamese: "T7 30/8 · 16:01").

**Hover/tap layer:** every dot has a hit target ≥ 24 px and a tooltip: drive date, value with unit, Cool/hot, Verdict, Map. Tapping a dot opens that drive. A table view of the Car history exists behind a "Table" toggle (accessibility, and the honest view of the numbers).

**Layout:** one column, same order, at every width. Phone (≤ 480 px): full-width blocks, 16 px gutters, no horizontal scroll, the six charts stacked. Laptop: max text width ~720 px; the six charts sit in a 2 × 3 grid; the rest of the order is unchanged.

---

## Map changes: one Flash plan, no conflicts

Today five places propose edits to the owner's KTuner map: the Map reference levers, the Drive check's flash actions, the Build path, the Full method and the spreadsheet edit plan. They can disagree. Boost alone has +1 psi, −1 psi and "lower at low rpm" on the same table family. **From this release, only one thing can say what to change in the map: the Flash plan.** Every other screen may *mention* a map lever, but it links to the Flash plan instead of giving its own instructions.

**What the Flash plan is:** the single set of map changes proposed for the **next** Flash, built only from evidence in the Car history.

**Rules (applied in this order, so two proposals can never conflict):**

| # | Rule | Why |
|---|---|---|
| P1 | **A Stop open → the only plan is Undo:** "Flash your previous map file (*name, date*)". | A fault comes first, and the last Map is the known-good state |
| P2 | **A Watch, an unfinished Shakedown drive or an unanswered Unexplained change open → no gain lever.** Only a fix whose evidence is that very Watch may appear. | Never add power on top of an open question |
| P3 | **Habit first:** a map change that has a free habit doing the same job waits until the habit has been tried and proven (for example, "lower boost at low rpm" waits for "keep the revs up"). | Free beats a flash (existing rule D2–D3) |
| P4 | **One table family per Flash:** AFM Flow, *or* mixture targets, *or* boost targets. Never two. | One change, one log, one decision |
| P5 | **No cell is changed by two proposals,** and a table can't move in the opposite direction from the previous Flash until that Flash has a Prove-it verdict. | No tug-of-war |
| P6 | **Pairs move together:** when the file's _L and _H tables are identical, both change identically. Boost Target 1/2/3 Normal (the cruise-button switching levels) change identically unless the owner says they use switching. | Otherwise the car behaves differently by cam or by button level |
| P7 | **Bounds always hold:** AFM ±10 % per round and the curve keeps rising; no boost raised below 3,000 rpm; boost ≤ the ceiling; ignition, knock sensitivity and the protection tables never appear. | The existing safety caps |
| P8 | **Each change carries its evidence and its proof:** which drives, which number, the basis type (`fact-check.md`), and what the next drive must show. | Every edit is accountable |
| P9 | **"No change" is a valid plan,** stated as "Your logs support no map change right now", followed by the next lever and exactly what would unlock it. | An empty, honest plan beats a busy one |

**Trims rule (one symptom, one remedy):** trims off by a similar amount everywhere, from the first second → the wrong AFM preset or housing: **Undo / pick the preset**, never a curve edit. Trims off in some airflow bins only → an AFM Flow curve edit, within P7.

**What the owner sees (one card, "Next Flash"):**
1. One line: what changes and why ("Boost targets, low rpm: −1 psi at 2,500–3,250 rpm, because …"), or the P9 sentence.
2. **Save as:** a new file name, "<Map> · <date> · <family> r<n>", so the old file stays untouched for Undo.
3. **In KTuner, per table:** the table name exactly as KTuner shows it, then L and H (and 1/2/3), and the cells as **rpm row × column N of M, counted from the left**. The load axis wasn't captured, so columns are counted as KTuner draws them. Before → after for each cell. Curves such as AFM Flow come as a paste-ready row, since KTuner copies tables as tab-separated text.
4. **After flashing:** a "Record this Flash" button, prefilled from the plan, which starts the Shakedown drive.
5. **Undo:** "Flash <previous file>".

**What the owner's map gets from this today** (16 drives, `fact-check.md`):

| Lever | Verdict | Unlocks when |
|---|---|---|
| AFM Flow curve | No change: trims ±4 % | A drive's trims beyond ±5 % in some airflow bins |
| Mixture target (WOT 11.0 → 11.5, "lever B1") | **Locked, provisional:** no evidence of gain on this car; measured already 10.1–10.7 | The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible |
| Boost +1 psi ("lever B2"), 24 psi map | **Locked:** wastegate 1.3–3.3 % open at peak, so no headroom | Never on this turbo |
| Boost lower at low rpm | **Locked by P3:** "keep the revs up" comes first | The habit was tried and the score still rises while lugging |
| Boost −1 psi at 2,500–3,250 (downpipe overshoot) | Not needed: overshoot ≤ 1.9 psi | Overshoot > 2.5 psi held |
| Hot days | **No edit needed:** ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2) | — |

**→ The Flash plan for this car today is P9: no map change.**

## User Stories

**Drive card and story**

1. As the owner, I want every Drive check to show the blocks in the same order, so that I learn where to look and never hunt for the verdict.
2. As the owner, I want the first line of every block to answer that block's question, so that I can stop reading as soon as I have my answer.
3. As the owner, I want the drive card to show date, start time, length, Hot or Cool, and traffic or highway, so that I know what this drive can and cannot judge.
4. As the owner, I want the drive card to show the Map this drive was on, from my Flash records, so that I know which calibration produced these numbers.
5. As the owner, I want a drive with no earlier Flash recorded to say "Map: not recorded" with an *Add Flash* button, so that the app never invents a Map name.
6. As the owner, I want the drive card to show the highest boost target measured, so that I can see what the car actually did even when the Map is unknown.
7. As the owner, I want the drive card to show log quality (Good / Missing channels / Flat channel / Too short), so that I trust or discount the verdict before I read it.
8. As the owner, I want the drive card to list up to five Key moments (hard pulls, lugging stretches, score steps, hot restart, the moment a Stop began), each with its clock time, so that I never have to scrub a 50-minute log to find what matters.

**Safety**

9. As the owner, I want one sentence answering "Can I drive hard today?", so that I don't have to combine five lines myself.
10. As the owner, I want each safety line to show the number, what it means, my limit and a Verdict word with its icon, so that I understand it without colour and without tuner jargon.
11. As the owner, I want the Fuel-quality score judged against my car's Baseline, so that 0.64 is a Watch on a car whose normal is 0.49.
12. As the owner, I want the score shown as "Fuel-quality score (Knock Control)", so that I understand it and can still match it to TunerView and talk to a tuner.
13. As the owner, I want the score line to also say how much timing the ECU pulled under boost compared with my normal ("under boost your score costs about 1.5° of timing"), so that an abstract score becomes a consequence I understand.
14. As the owner, I want a Watch with "No hard driving until it drops" when the score holds at 0.62 or more for over 60 seconds (about 1.3° of timing lost under boost on my map), so that I get a clear instruction without a fifth status word.
15. As the owner, I want a Stop when the score reaches 0.80, shown as "provisional: not yet seen on your car", so that the app halts me before knock damage without pretending the number came from my data.
16. As the owner, I want the drive's Verdict to be Can't tell when a Safety channel (mixture, fuel trims, Fuel-quality score, fuel pressure) is flat or missing, so that the app never says OK on incomplete safety data.
17. As the owner, I want a flat non-safety channel (for example Turbo Pressure) to make only its own lines Can't tell, so that one bad channel doesn't throw away a good drive.
18. As the owner, I want intake heat alone to go no higher than Watch, so that a hot intake with a perfect score doesn't cry wolf.
19. As the owner, I want intake heat never to give a Stop on its own, because the score's own limits already catch the case where heat becomes knock, so that one danger isn't counted twice.
20. As the owner, I want CVT fluid at 100 °C or more and coolant at 105 °C or more to stay a Stop, so that real damage limits are never softened.
21. As the owner, I want a CVT slip check (revs jumping more than 250 rpm in 0.33 s while speed gains under 1 km/h, under boost) instead of a torque number my logs can't measure, so that the CVT is judged on what the log actually shows.
22. As the owner, I want every Watch, Stop and Can't tell to carry a "Do now" line, so that I always know my next physical action.
23. As the owner, I want a Stop to collapse the action, history and performance blocks into one "Paused until the Stop is fixed" line, so that nothing distracts from it.
24. As the owner, I want a Stop caused by fuel trims after a Flash to name the likely cause (Map's AFM preset) and the fix (re-flash the previous Map or the right preset), so that I know what to undo.
25. As the owner, I want a *Why?* on each safety line that opens one picture: the moment on the drive's timeline and the same moment as highlighted cells on a small revs × boost grid, so that I see when and where it happened, the way a tuner reads it in KTuner.
26. As the owner, I want each *Why?* to state the limit's basis in one line (from my data / from Honda or KTuner / physics / our judgement / provisional), so that I know how far to trust it.
23b. As the owner, I want no change smaller than a channel's logged step (Knock Retard 0.5°, ignition 1°) ever shown as a finding, so that rounding noise is never sold to me as a problem.

**Too-short and flat data**

27. As the owner, I want a drive with under 60 seconds of moving to say "Can't tell: too short" and stay out of my Car history, so that a 3-second log can't put a false 0.77 on my chart.
28. As the owner, I want a channel that doesn't move while its partner does to be called flat, so that a dead logger channel isn't read as a real value.
29. As the owner, I want Block 7 to list missing and flat channels with the TunerView setup steps to fix them, so that my next log can prove more.

**Flashes and the Shakedown drive**

30. As the owner, I want to record a Flash with date and time, Map name, what changed (AFM preset / boost / fuel / other) and a note, so that the app can link changes in my logs to what I did.
31. As the owner, I want the first drive after a Flash to be a Shakedown drive, so that I am told to drive calmly before I test the new Map hard.
32. As the owner, I want the Shakedown banner to show progress ("6 of 10 calm minutes"), so that I know how much longer to drive calmly.
33. As the owner, I want the Shakedown to pass only after ten calm minutes (engine warm, moving, boost under 4 psi) with trims within ±5 %, score within +0.06 of Baseline and no lean mixture, so that "passed" means the Map measures air and fuel correctly.
34. As the owner, I want a Shakedown that didn't finish to carry over to my next drive, so that a short trip doesn't skip the check.
35. As the owner, I want hard driving during an unfinished Shakedown to give a Watch ("You drove hard before the check finished"), and real danger to still give a Stop, so that Stop keeps meaning danger.
36. As the owner, I want every other action to wait until the Shakedown passes, so that I change one thing at a time.
37. As the owner, I want to edit a Flash record, and be asked once before deleting one, so that a typo is fixable and a deletion is deliberate.

**Unexplained change**

38. As the owner, I want the app to notice when my worst trim moves more than 5 points, my highest boost target moves more than 2 psi, or my score starts 0.08 or more above Baseline, compared with my drives since the last Flash, so that a change I forgot to record is caught.
39. As the owner, I want it to ask "Something changed since your last drive" with *I flashed / New tank of fuel / Neither*, so that I explain it instead of the app guessing.
40. As the owner, I want *I flashed* to open the Add Flash form pre-dated to just before this drive, so that recording it takes seconds.
41. As the owner, I want *New tank of fuel* to tell me to give it 10–15 calm minutes before judging, so that a fresh tank isn't mistaken for a fault.
42. As the owner, I want *Neither* to keep the line at Watch ("Unexplained change"), so that an unexplained jump stays visible.

**Car history**

43. As the owner, I want every drive I check to be remembered as a small summary in my browser, so that my history builds itself.
44. As the owner, I want to load my whole log folder at once and have the history rebuilt, so that a new browser or cleared storage costs me one step.
45. As the owner, I want loading the same drive twice to replace it rather than duplicate it, so that the history stays clean.
46. As the owner, I want six charts — Fuel-quality score peak, worst fuel trim, intake while moving, CVT peak, lugging %, best 50→70 km/h — one dot per drive, so that I see my car change.
47. As the owner, I want Cool drives filled and hot drives hollow, so that weather can't masquerade as change.
48. As the owner, I want Flashes drawn as labelled vertical lines across all charts, so that I can see what happened before and after each Map.
49. As the owner, I want my Baseline drawn dashed and limits drawn solid with their numbers, so that I see "normal" and "too far" without reading the axis.
50. As the owner, I want a Stop drive marked with a ring and ✕ and named in its tooltip, so that faults stand out without relying on colour.
51. As the owner, I want to tap a dot to open that drive, so that the chart is a way in, not just a picture.
52. As the owner, I want a Table view of my Car history, so that I can read exact numbers or use a screen reader.
53. As the owner, I want to hide a drive from my history (lent car, idle test, logger fault) and undo it, so that bad data doesn't distort my charts or Baseline.
54. As the owner, I want my first-ever drive to show "Your history starts with this drive" instead of empty charts, so that the empty state explains itself.
55. As the owner, I want the Baseline learned from my Cool drives once I have three, and 0.49 until then, so that limits fit my car and start strict.

**History file**

56. As the owner, I want to export my Car history and Flashes to one file, so that my Flash records survive a browser reset.
57. As the owner, I want importing a History file to merge with what's already there, never overwrite, so that I can't lose drives by importing an older file.
58. As the owner, I want the file to stay on my machine and never be uploaded, so that my data is private.

**Proof and actions**

59. As the owner, I want a before/after that spans a Flash to say "Can't tell: Map changed in between", so that a new Map isn't credited to a habit.
60. As the owner, I want a Hot restart advice ("drive 3–5 minutes before any hard acceleration") only when a hard acceleration started with the intake above 48 °C within the first 5 minutes, so that I'm not nagged on drives where nothing went wrong.
61. As the owner, I want that advice proven when my next pull starts at 48 °C or less, so that I know the habit worked.
62. As the owner, I want a score that starts high explained ("after a Flash, ECU reset or new tank, give it 10–15 calm minutes"), so that I don't panic in the first minutes.
63. As the owner, I want "timing lost while lugging" hidden when it is negative or based on under 30 seconds of reference, so that I never see a meaningless number.

**Performance**

64. As the owner, I want my best 50→70 km/h today compared only with my best at an intake within 8 °C, so that weather isn't sold to me as a tune gain.
65. As the owner, I want "not comparable" to say why ("9 °C hotter"), so that I know what to change to get a fair comparison.

**Language, layout, access**

66. As the owner, I want every new word in English and Tiếng Việt in the same release, so that the safety wording is clear in my language.
67. As the owner, I want the Drive check to work at 375 px wide with no horizontal scroll, so that I can read it in the car park.
68. As the owner, I want dark mode to use its own validated colours, so that charts stay readable at night.
69. As the owner, I want no information carried by colour alone, so that the page works in sunlight, in print and for colour-blind readers.
70. As the owner, I want the engineering graphs available on my phone, collapsed, so that *Why?* works anywhere.

---

**Map changes**

71. As the owner, I want exactly one place, the Flash plan, to tell me what to change in my KTuner map, so that I never get two different instructions for the same table.
72. As the owner, I want the Flash plan to say "Your logs support no map change right now", followed by the next lever and what unlocks it, so that "nothing to change" is a clear answer, not an empty screen.
73. As the owner, I want a Stop to turn the Flash plan into "Flash your previous map file", so that the fix for a bad Flash is always the known-good file.
74. As the owner, I want each Flash to change only one table family, so that the next drive can prove that one change.
75. As the owner, I want each change listed as KTuner shows it (table name, L and H, levels 1/2/3, rpm row × column N of M, before → after) and curves as a paste-ready row, so that I can type it into KTuner without translating.
76. As the owner, I want a new file name for each Flash and an Undo naming the previous file, so that I can always go back.
77. As the owner, I want a "Record this Flash" button prefilled from the plan, so that my history and the Shakedown drive start without retyping.
78. As the owner, I want trims that are off everywhere from the first second sent to "pick the right preset / Undo", never to a curve edit, so that a preset mismatch isn't hidden inside my AFM curve.
79. As the owner, I want the Map reference, Build path, Drive check and Full method to link to the Flash plan instead of giving their own edit steps, so that the whole app speaks with one voice about my map.

## Implementation Decisions

**Modules**

- **New deep module: Car** (in the engine layer, pure, no DOM, no storage). It owns the Car history, Flashes, Baseline, Shakedown state and Unexplained change. Its one main operation takes the current car state, a parsed drive and its metadata (start time, file name) and returns the next car state plus the drive report. All other owner actions are operations on the same module: record / edit / delete a Flash, hide / unhide a drive, answer an Unexplained change, export to a History file, import (merge) a History file, and produce the chart series and table rows for the Car history view.
- **Drive check (existing engine) is modified, not replaced.** The drive check accepts a context from the Car module — the Baseline, whether this is a Shakedown drive, the previous drive's summary, the drives since the last Flash — and applies the new verdict rules. It can still run with no context (first drive, tests), in which case the Baseline is 0.49 and there is no Shakedown or Unexplained change.
- **App (UI) is modified** to render the story contract, the banner, the Car history charts and table, the Flash form, the Unexplained-change question, Export / Import / Load folder, and Hide. It holds the car state in browser storage and passes it to the Car module; it never computes a verdict itself.
- **Language files** gain every new string in English and Vietnamese.

**Car state (schema, versioned)**

- `version`; `drives` keyed by Drive identity; `flashes` ordered by time; `answers` to Unexplained-change questions keyed by Drive identity; `hidden` Drive identities; `shakedown` state.
- A **drive summary** holds: identity, start time, duration, moving seconds, Cool / hot, Hot restart flag, Too-short flag, Verdict, Fuel-quality score start / end / peak, worst fuel trim, intake while moving, CVT peak, lugging %, best 50→70 km/h with its intake temperature, highest boost target, flat and missing channels, Map (derived from Flashes, not stored per drive).
- A **Flash** holds: time, Map name, what changed (AFM preset / boost / fuel / other), note.
- **Drive identity** = start time from the TunerView file name (`TunerView_YYYYMMDD_HHMMSS`); if the name doesn't match, the first timestamp plus a short content hash. Re-checking a drive with the same identity replaces its summary.
- **History file** = the car state serialised as one JSON document with its `version`. **Import merges:** drives by identity (newer summary wins), Flashes by time + Map (edits win over originals), hidden and answers unioned. Import never deletes.

**Verdict rules (changes to the drive check)**

- Verdict words on screen: OK / Watch / Stop / Can't tell; engine ids are translated at the screen edge.
- **Fuel-quality score (ADR 0001):** limits are set in **timing it costs under boost**: Watch ≥ 0.7° (score 0.56), "no hard driving" ≥ 1.3° held over 60 s (0.62), Stop ≥ 3.2° (0.80, **provisional**: never reached). The degree cut points are judgement and labelled so. The score values follow from the Map's measured boost retard table (10.2°), re-measured after a Flash once 100 boosted rows exist. **Baseline** = median end-of-drive score over non-hidden Cool drives, 0.49 until three exist; it is used for the Shakedown (+0.06) and Unexplained change (+0.08), not for the Watch limits.
- **Safety channels** (mixture, fuel trims, Fuel-quality score, fuel pressure): flat or missing → the drive's Verdict is Can't tell. Other channels flat → only their lines are Can't tell.
- **Flat channel:** a channel whose value does not change across the moving part of the drive while engine rpm changes; Turbo Pressure is also flat if it stays within 0.5 psi while MAP rises above 4 psi.
- **Too-short drive:** under 60 s moving → Can't tell, not added to the Car history.
- **Heat:** intake heat caps at Watch and never Stops on its own. CVT ≥ 100 °C and coolant ≥ 105 °C are Stop, both **provisional** (no Honda limit published in what was read; this car peaks at 95 °C and 94 °C).
- **Every limit carries its basis** (Data / Primary / Physics / Judgement / Provisional) from `docs/research/fact-check.md`; *Why?* shows it in one line, and a provisional limit says "provisional: not yet seen on your car".
- **E10:** no fuel is added and no E10 correction exists anywhere. Fuel is judged only as measured vs the Map's own target. The built-in answer to "should I add fuel for E10?" quotes the owner's numbers: λ under boost vs target, and median cruise trim.
- **CVT torque check removed from the Drive check.** TunerView logs no torque value, so it was always Can't tell; the 250 Nm figure is a 10th-gen FlashPro warning contradicted by Hondata's own 11th-gen CVT maps (+50 lb-ft ≈ 300 Nm). The map's torque limiter (KTuner "Torque Targets Per Mode") is a one-time Map check once that table is digitized, not a per-drive check.
- **CVT slip (new):** under boost (MAP ≥ 8 psi, throttle command ≥ 50 %, speed > 20 km/h), revs rise more than 250 rpm within 0.33 s while speed rises under 1 km/h. Watch only until a real slip has validated the threshold (0 events in the owner's 16 drives, ~2,400 boosted rows). The g-sensor channel is 0 on every row and is not used.
- **Mixture under boost:** only at boost ≥ 12 psi, where the Map's WOT_Enrich target is its full-load value (the lower-load columns ask 11.5 to 14.7, and the load axis is not captured, so no per-cell check yet). Judged as distance from the Map's own full-load target (11.0 = λ 0.75 on Starter 21), boost ≥ 12 psi, held 0.3 s: Watch at 0.5 AFR leaner than target, Stop at 1.0 leaner (11.5 / 12.0 on this Map). The Stop means "commanded fuel isn't arriving" (pump, AFM preset, injector), not an absolute danger line. Logged AFR is gasoline-scale (λ × 14.7), so no E10 correction.
- **Key moments:** at most five per drive, chosen in this order: the start of each Stop, each Watch event (score step, lean or slip), hard pulls (best first), the longest lugging stretch, a hot restart. Each has a clock time and opens the matching *Why?*.
- **Timing pulled:** what the score costs under boost = the Map's boost retard table (measured as median retard ÷ score over boosted rows; 10.2° on Starter 21) × (score − Baseline). Shown on the score line when ≥ 0.5° (the channel's step): "Under boost your score costs about 1.5° of timing". Basis: KTuner's formula (Primary), table and its linearity measured in the logs (Data). A per-drive median of logged retard is **not** used: it changes with where on the map you drove.
- ***Why?* picture:** a timeline strip with the moment marked, plus an rpm × boost grid (the Engineering view's timing-map axes) with the rows of that moment highlighted. One picture, two views, no extra screens.
- **Hidden numbers:** "timing lost while lugging" is not shown when negative or when the reference band has under 30 s.
- **New action — Hot restart:** a drive is a Hot restart if it starts within 30 min of the previous drive's end (from identity + duration) with intake ≥ 50 °C, or with intake ≥ 50 °C alone when the previous drive is unknown. The action appears only if a hard acceleration starts with intake > 48 °C in the first 5 minutes; proof is the next pull starting at ≤ 48 °C.
- **Score starting high:** explained in the safety line, not a separate action.
- **Proof across a Flash:** Can't tell, "Map changed in between".

**Shakedown state machine**

- *None* → (Flash recorded) → *Pending* → (a drive accumulates 10 calm minutes: coolant ≥ 70 °C, moving, boost < 4 psi; with trims within ±5 %, score ≤ Baseline + 0.06, no lean mixture) → *Passed* → *None*.
- *Pending* carries across drives until it passes. While *Pending*, the action list shows only "Finish the Shakedown drive". Hard driving while *Pending* → Watch. Trims beyond ±10 % or a lean mixture → Stop as always, and the Stop names the Flash as the likely cause.

**Unexplained change**

- Compared with the median of non-hidden drives since the last Flash (at least 3), else the last 5 non-hidden drives.
- Triggers: worst trim moves > 5 points; highest boost target moves > 2 psi; score starts ≥ Baseline + 0.08.
- Answers: *I flashed* → Flash form pre-dated to this drive's start; *New tank of fuel* → "give it 10–15 calm minutes"; *Neither* → line stays Watch "Unexplained change". The answer is stored with the drive and never asked again for it.

**Map on the drive card**

- From the latest Flash before the drive's start; "not recorded" otherwise. Mode (ECO / Normal / Sport) is not shown.

---

- **Flash plan (new operation on the Car module):** input = car state (history, Flashes, open Watch/Stop/Shakedown/Unexplained change, proven habits) + the digitized Map; output = either Undo, the P9 no-change message, or one table family's cell changes with evidence, proof, bounds and the KTuner-form listing. Existing lever math (AFM suggestion, WOT and boost steps, table roles) is reused as *candidates*; P1–P9 pick at most one. The Map reference, Build path, Drive check flash actions and Full method stop emitting their own edit steps and link here. The spreadsheet edit plan is generated from the Flash plan.
- **Map facts the plan relies on (checked):** Boost Target 1 = 2 = 3 and L = H in the owner's file; WOT_Enrich L = H; ECO peak 18 psi, Normal 21 psi; the load axes were not captured, so columns are indexed as KTuner draws them.

## Testing Decisions

**What a good test is here:** it feeds real drives (or a real car state) in through the public operation and checks what the owner would see — the Verdict, the action, the banner, the chart point — never internal masks, helper functions or storage calls. The same log and the same car state must always give the same result.

**Seam 1 — the Car module (Node, `node --test`).** Prior art: the existing drive-check tests, which load the bundled real drives and assert on verdicts, checks and plans. New fixtures, committed compressed in the same way: **Aug 23 20:38** (trims Stop after a Flash), **Sep 5 07:56** (flat Turbo Pressure), **Aug 30 15:09** (too short), and **Aug 22 09:50** (hot intake, score 0.50 — the only drive that flips Stop → Watch under the heat rule; ~0.3 MB, added to the agreed three because no other drive locks that rule). Expected outcomes to lock:

| Drive(s) fed in order | Must produce |
|---|---|
| Aug 23 19:59 then 20:38 | 20:38 Stop on fuel trims; Unexplained change (trim) asked; with a Flash recorded at 20:00, the Stop names the Flash and the drive is a Shakedown drive that does not pass |
| Sep 5 07:56 | Verdict OK; boost lines Can't tell; Block 7 lists Turbo Pressure flat |
| Aug 30 15:09 | Can't tell: too short; not in the Car history |
| Aug 22 09:50 | Watch on heat (not Stop) |
| All 16 drives | CVT slip: 0 events; mixture: no Watch or Stop (10.1–10.7 against 11.0) |
| Flash plan on the owner's 16 drives | P9: "no map change", listing every lever with its lock reason as in the table above |
| Flash plan with Aug 23 20:38 open (trims Stop after a Flash) | Undo: "Flash your previous map file"; no AFM curve edit offered |
| Two candidates on the same table family (e.g. boost −1 psi low rpm and +1 psi plateau) | Only one in the plan; the other is listed "after the first is proven" |
| Any plan touching boost | All six Normal tables (1/2/3 × L/H) carry identical changes |
| Aug 30 16:01 | Watch: score 0.64 against Baseline 0.49; not "no hard driving" |
| Aug 30 15:29 alone | Score starts 0.58 → Unexplained change (score) asked |
| Sep 1 08:13 | OK |
| Aug 30 16:01 timing pulled | At its end score 0.64: "costs about 1.5° under boost"; Sep 1 08:13 (ends 0.49) shows nothing |
| Aug 30 15:29 Key moments | At most 5, the hard pulls first, each with a clock time inside the drive |
| Boost < 12 psi with AFR 12.5 at part load | No mixture Watch or Stop (outside the full-load rule) |
| Any two drives with a Flash between | Proof = Can't tell, "Map changed in between" |
| Export → import into empty state; import an older file into a newer state | Round-trip identical; merge never loses a drive or Flash |
| Hide a Cool drive | It no longer counts toward the Baseline or charts; unhide restores |

**Seam 2 — the screen (Playwright, `npm run e2e`).** Prior art: the existing end-to-end script that opens the standalone page in Chromium and drives the real UI. New checks: block order matches the story contract; at 375 px there is no horizontal scroll and the first screen shows blocks 1–3; every Verdict has icon + word; a Stop collapses blocks 3–5; chart encoding (filled vs hollow, Flash line with label, dashed Baseline, Stop ring) is present in the DOM; tap a dot opens that drive; Table view lists every drive; light and dark both render; Export then Import restores Flashes; Hide/Unhide.

**Local check (not in CI):** a script that runs every TunerView file in a folder through the Car module in time order and prints the per-drive table from the research report, for the owner's own 16+ drives.

**Not tested:** drawing helpers, storage wrappers, CSS values.

---

## Out of Scope

- *Send to my tuner* (block ⑨ of the research).
- Fuel-station tracking; mode (ECO / Normal / Sport) entry.
- Sync, accounts, upload of any kind.
- Attaching Map files to Flash records; reading a Map from the log.
- Per-Map Baselines (ADR 0001, revisit rule).
- New table edits, ignition changes, boost increases — all remain locked as today.
- Laptop-only screens (Map editor, Full method) getting the phone layout.

## Further Notes

- **The app's built-in Fact check and Build path contradict the data** (`fact-check.md` §1): they advise 16.5–18 psi maps because E10 RON95 "has no knock margin" at 21 psi, but this car holds a score of 0.49–0.52 on Starter 21 pulls. Fix that text in the verdict-rules ticket, and source every Fact check entry from `fact-check.md`.
- **Owner fact still open (not blocking):** the dates and Maps of past Flashes. Until entered, old drives show "Map: not recorded". The logs suggest a change between 22 Aug and 30 Aug (boost target with foot down 16.3 → 19.3 psi) and one around 23 Aug 20:00 (trims); the Unexplained-change rule will ask about both when the folder is loaded.
- **Suggested slicing for `/to-tickets`** (tracer bullets, each shippable): (1) verdict-rule fixes G1/G2/G4/G5 + heat cap + torque fallback, no new UI; (2) Car module with history + Baseline + Load folder + Table view; (3) charts; (4) Flash records + Map on card + Shakedown; (5) Unexplained change; (6) Hot restart action; (7) History file export/import; (8) story-contract layout + phone + Stop collapse; (9) Vietnamese strings across all of the above (or per ticket).
- **Issue tracker:** none configured. Run `/setup-matt-pocock-skills` to choose one; until then this spec lives here and the tickets go to `.scratch/car-history/issues/`.

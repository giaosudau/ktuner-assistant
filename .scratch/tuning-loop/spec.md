# Spec: The tuning loop — a chat that reads every Drive and gives one Next step

*Status: ready-for-agent · Sources: grilling Rounds 1–4 (2 Oct 2026), `prototypes/next-step/` (the loop on the owner's 9 real drives), `docs/research/tuner-play-panel.md` (decisions T1–T8), `docs/research/owner-voices.md`, `docs/research/fact-check.md` (wins on any number), `CONTEXT.md`, ADR 0001, ADR 0002, ADR 0003. Builds on `.scratch/car-history/` (tickets 01–10, all done).*
*Vocabulary: every capitalised term (Drive, Car history, Car profile, Install, Flash, Flash plan, Map, Map version, KTuner basemap, Flash readback, Shakedown drive, Cool drive, Too-short drive, Unexplained change, Verdict, Baseline, Fuel-quality score, Next step, Open step, Drives to proof, Wasted drive, Key moment) is defined in `CONTEXT.md`. Use those words in code names, copy and tests.*

---

## Problem Statement

I own one car (Civic FE 1.5T CVT, KTuner Starter 21 Dual Tune 2, Vietnam E10 RON95) and I log my drives with TunerView. What I need after every log is someone who knows to tell me: is it OK, did the last thing I changed work, and what do I do next — in KTuner, on the gauges, or on my next drive.

Today nobody does that well:

- **The forum** reads one log, without my history, days later, and never hears how it went.
- **KTuner alone** gives me tables and gauges with no meaning. I don't know which number matters today or which drive to log to find out.
- **The current app** checks one drive at a time in my browser. Its Flash plan says "Your logs support no map change right now" on 8 of my 9 drives and leaves me with nothing to do. It doesn't remember what it asked me last time, so it can't tell me whether it worked. When my 23 Aug 20:38 drive showed trims at −21 % after a change, it couldn't name the file to flash back, because it didn't know which map I'd started from or what I'd changed.
- **Loops take too many drives.** On my real drives, proving the 20:38 Undo took 2 drives (one was too short). The "keep the revs up in hot traffic" habit is still unproven after 2 more drives, because both were cool mornings and couldn't test it. One drive had 4 dead gauges and I didn't know. Every drive that can't settle anything is a wasted week.
- **Typing a map change into KTuner is risky.** A wrong cell, a wrong number, or a change written against the wrong map can hurt the engine, and nothing checks what I typed.

## Solution

A chat app. I upload a TunerView log (from my phone or laptop) and the assistant answers like a tuner who remembers my car:

1. **Is it OK?** One sentence first, with my numbers ("Engine healthy: full-throttle AFR 10.8 (map asks 11.0, lean limit 12.0), Knock Control peak 0.54: costs timing, not damage").
2. **Did last time's step work?** Each Open step is settled against this Drive — Done, Not yet, Still off, or Can't tell yet — with the numbers and the reason.
3. **One Next step**: a Flash (from the Flash plan, as an exact KTuner card), a gauge to watch in TunerView, a drive to log, or nothing — always naming the drive whose upload will settle it.
4. **Only the questions that matter**, as tap-to-answer choices (which intake housing, did you flash), saved to my Car history.

While it works I can watch what it checked — collapsible steps like Cursor or Claude, plus the model's own thinking labelled "unchecked". Every insight and every action comes from the engine on my real logs; the LLM orchestrates the tools, synthesises and explains, and it never decides a verdict or writes a map cell.

When the Next step is a Flash, the change is checked twice (engine and independent Python), drawn as a KTuner card I can type in cell by cell, and becomes a new Map version only when I say "I flashed it". The first Drive after the Flash checks that what's on the ECU matches what was planned (Flash readback).

The win, measured on every release: **fewer Drives to proof and fewer Wasted drives** — said to me in plain words, never as a metric.

**What I can expect:** most Drives end in "no map change", and that is an answer, not a gap. Heat never counts as tuning. The app never edits ignition or knock tables, never turns off an emissions monitor without the đăng kiểm warning, and never promises power the turbo doesn't have.

## User Stories

### Starting
1. As the owner, I want the chat to greet me and ask me to describe my car in my own words, so that setup takes about a minute.
2. As the owner, I want the assistant to turn my description into a Car profile card (model, engine, transmission, fuel, climate, KTuner basemap, parts fitted), so that I confirm instead of filling a form.
3. As the owner, I want to correct any field of the Car profile card before I confirm it, so that a misread word doesn't become a fact about my car.
4. As the owner, I want my KTuner basemap prefilled as Starter 21 Dual Tune 2 from the map the app holds, so that I don't type table names.
5. As the owner, I want my original map to become Map version 1 without starting a Shakedown drive, so that my first drive isn't treated as just-flashed.
6. As the owner, I want to be asked only questions that change a decision, and only when they matter, so that the app doesn't interrogate me.
7. As the owner, I want the chat to ask for a Drive before any tuning conversation, so that every answer is about my car, not generic advice.
8. As the owner, I want to edit my Car profile later, so that it stays true as the car changes.
9. As the owner, I want fitting or removing a part to record an Install with its date, so that the app knows something changed before a drive looks odd.

### Uploading a Drive
10. As the owner, I want to upload a TunerView CSV from my phone browser, so that I don't need a laptop.
11. As the owner, I want the raw CSV kept, so that my whole history can be re-checked when the engine improves.
12. As the owner, I want a Too-short drive acknowledged ("Nothing read: under a minute moving") and kept out of the Car history, so that a mistap doesn't pollute my baseline.
13. As the owner, I want a drive with dead gauges caught and named (for example Turbo Pressure, DIFP, Transmission Temperature stuck on one number), so that I fix the logger before my next drive is wasted.
14. As the owner, I want the reply to stream in as it's built, so that I'm not staring at a blank screen.

### The reply
15. As the owner, I want the first sentence to answer "am I hurting it?" with my numbers, so that the fear goes first.
16. As the owner, I want Knock Control shown as the timing it costs ("about 1.6° of timing, not damage"), so that I understand what the number means for my engine.
17. As the owner, I want each Open step settled against this Drive with Done / Not yet / Still off / Can't tell yet and the reason, so that I know whether my last change worked.
18. As the owner, I want "Can't tell yet" to say why ("cool drive: the habit only shows on a hot afternoon"), so that I don't think I failed.
19. As the owner, I want exactly one Next step per reply, so that I'm never handed a pile of suggestions.
20. As the owner, I want the Next step to name the drive to log (when, how warm, how many pulls, how long), so that my next upload can settle it.
21. As the owner, I want a "same step as last time" Next step shown compactly, so that the thread doesn't repeat itself.
22. As the owner, I want a gauge table for a watch step (gauge name as TunerView spells it, what's OK, what's not, what to do), so that I know what to look at while driving.
23. As the owner, I want the reply to say which drives it used ("your 3 drives since the Flash on 30 Aug"), so that I know what the answer is based on.
24. As the owner, I want the answer based on my latest Drive plus every Drive since my last Flash or Install, capped at 14 days, so that it describes my car as it is now.
25. As the owner, I want older drives used only for the Baseline and trend charts, so that last month's heat doesn't decide today's step.
26. As the owner, I want at most one picture per reply (plus the map grid when the step is a Flash), so that the picture answers the step's one question.
27. As the owner, I want every number on a picture also in the text, so that the picture can't say something the text doesn't.
28. As the owner, I want replies in English, with KTuner names exactly as KTuner shows them, so that I can find them in KTuner.

### Seeing the work
29. As the owner, I want the harness's steps (read log, checked safety lines, compared with earlier drives, Flash plan, verified numbers) shown as a collapsed line I can expand, so that I trust the answer without reading all of it.
30. As the owner, I want each step expandable to its tool inputs and outputs, so that I can check exactly what was looked at.
31. As the owner, I want the model's own thinking shown separately and labelled "unchecked", when the model provides it, so that I never mistake it for a verified fact.

### Answering questions
32. As the owner, I want a question to appear as tap-to-answer choices inside the reply, so that answering takes one tap.
33. As the owner, I want my answer to pause and resume the reply with the answer applied, so that the Next step reflects it immediately.
34. As the owner, I want to change an answer later, so that a wrong tap doesn't stick.
35. As the owner, I want unanswered questions listed with my Open steps as "Waiting for you", so that I don't lose them.
36. As the owner whose trims went −21 % after a change, I want to be asked what changed (flashed with MAF Scaling changed / flashed something else / fitted a part / nothing), so that the cause is recorded, not guessed.
37. As the owner, I want to be asked which intake housing is fitted only when the Flash plan routes to the MAF Scaling choice, so that MAF Scaling matches my housing.
38. As the owner, I want "Not sure" to be a valid answer that keeps me on the Undo file, so that I'm never pushed to guess.
39. As the owner, I want the app to recognise the after-flash Knock Control pattern (starts near 0.58, settles to the Baseline) and ask whether I flashed, so that an unrecorded Flash doesn't break the proof.

### Asking without uploading
40. As the owner, I want to ask questions in the chat ("why is my car slower in the heat?", "what does MAF Scaling do?"), so that the chat is a conversation, not an upload box.
41. As the owner, I want those answers grounded in my recent Drives and the knowledge cards, so that they're about my car and checkable.
42. As the owner who asks for a change ("give me +2 psi"), I want the Flash plan's answer with what would unlock it, so that a request never produces an unchecked edit.

### Flashing
43. As the owner, I want a Flash Next step to show a KTuner card: table as KTuner names it with L/H and levels, rows by rpm, columns as "N of 16", before → after for every cell, what it means, what it does for my car, save-as name, Undo file, and the proof, so that I can type it in 30 seconds and check it.
44. As the owner, I want numbers on the card in each table's own units and decimals, so that what I read is what I type.
45. As the owner, I want a cell-by-cell checklist I tick as I type, so that I don't skip a cell.
46. As the owner, I want "I flashed it" to create the next Map version and start the Shakedown drive, so that the app knows which map my next drive ran on.
47. As the owner, I want "Not now" to create nothing, so that a suggestion I didn't flash never becomes my map.
48. As the owner, I want every change checked by the engine and by independent Python code against my active Map version before I see it, so that a wrong cell or a change against the wrong map never reaches me.
49. As the owner, I want a blocked Flash to tell me why, so that I'm not left guessing.
50. As the owner, I want pairs changed together (Boost 1/2/3 × L/H, WOT L/H) and only one table family per Flash, so that my map stays consistent and the proof is clean.
51. As the owner, I want Undo to name the earlier Map version's file, so that I flash back the right one.
52. As the owner, I want to revert to the KTuner basemap ("In KTuner, load Starter 21 Dual Tune 2 and flash it") and have it become the active Map version when I confirm, so that I can always get back to known-good.
53. As the owner, I want the first Drive after a Flash to check my logged boost targets against the new Map version's changed cells (Flash readback), so that a typo is caught on the road, not later.
54. As the owner, I want a readback mismatch to name the cell ("2,750 rpm column 9 reads 17.0, planned 16.0") and not credit the step, so that I re-check what I typed.
55. As the owner, I want the card to say when a table's result can't be read back from the log, so that I know the readback limit.
56. As the owner, I want the Shakedown drive's rule (calm minutes, trims within ±5 %) shown with my progress, so that I know when hard driving is allowed again.

### Safety and honesty
57. As the owner, I want an open Stop to make Undo the only Next step, so that nothing else distracts from the fix.
58. As the owner, I want trims off by the same amount everywhere right after a change routed to the MAF Scaling choice or Undo, never to an AFM curve edit or a WOT change, so that the fix touches the cause.
59. As the owner, I want a flat Fuel-quality score with high Knock Retard never called knock, so that scheduled retard isn't a false Stop.
60. As the owner, I want Knock Control rises above 5,200 rpm excluded from fuel and heat verdicts, so that the ECU's built-in behaviour isn't blamed on my fuel.
61. As the owner, I want the after-flash Knock Control start not flagged as an Unexplained change, so that a normal flash doesn't raise an alarm.
62. As the owner, I want boost targets compared only between drives that both had hard pulls, so that "no pulls today" doesn't look like a boost change.
63. As the owner, I want every factual claim in a reply to cite a tool result or a knowledge card, so that nothing is made up.
64. As the owner, I want a reply that fails its checks repaired once and otherwise replaced by the built-in reply, so that I always get a correct answer even when the model slips.
65. As the owner, I want the loop to keep working with no LLM configured (built-in replies), so that the tuning never depends on a model.
66. As the owner, I want the app never to suggest ignition or knock-sensitivity edits, so that the riskiest tables are never touched.
67. As the owner, I want any advice about disabling an emissions monitor to carry the đăng kiểm warning, so that I don't fail inspection by surprise.
68. As the owner, I want honest expectation lines ("the turbo has no headroom left on this car"), so that I don't chase power that isn't there.

### The loop over time
69. As the owner, I want my Open steps listed beside the chat with their status, so that I see the whole loop at a glance.
70. As the owner, I want the Baseline step (one Cool drive with 2 pulls) to come before habit tests, so that every later proof has something to compare against.
71. As the owner, I want a cause seen before the Baseline exists (for example Knock Control climbing while lugging) added to my Open steps and told as a free habit to start now, so that nothing is lost while the Baseline waits.
72. As the owner, I want a Drive that settles nothing called out gently with what would have settled it, so that my next drive isn't wasted too.
73. As the owner, I want to export my Car history (with Map versions, Flashes, Installs and answers) as a History file, so that my data isn't trapped.

### Developer, evals and operations
74. As the developer, I want the LLM endpoint, key and model in `.env` (any OpenAI-compatible provider, TokenHarbor for testing), so that switching to a paid provider is a config change.
75. As the developer, I want the key held only by the server, so that it never reaches a browser.
76. As the developer, I want the knowledge base as typed cards built from `docs/` with a generated index, so that the agent retrieves small, sourced facts instead of whole documents.
77. As the developer, I want the build to fail on a card with no source, or a number that conflicts with `fact-check.md`, so that the knowledge base can't drift.
78. As the developer, I want a loop eval that replays the 9 real drives with scripted answers and asserts each Next step, Drives to proof and Wasted drives, so that the loop's behaviour is locked and the win is measured.
79. As the developer, I want 23 Aug 20:38 to give "Undo / MAF Scaling" and never a knock fix or curve edit, so that the known false Stop never returns.
80. As the developer, I want a grounding scorecard per model (numbers matched, cells matched, citations present, no invented actions), so that `qwen3.8-flash:free` vs a paid model is measured, not guessed.
81. As the developer, I want a clarity judge (one action, plain words, says which drive to log) checked by the owner on a sample, so that "simple to consume" is enforced.
82. As the developer, I want every threshold in one data file with its value, unit, basis and source, so that each can be audited and tested on its own.
83. As the developer, I want everything to run locally first (no login, SQLite), so that the loop is proven before hosting is decided.

## Implementation Decisions

### Architecture (ADR 0002)
- **Three parts:** the existing JavaScript engine (unchanged rules, the only source of tuning math); a Python backend (FastAPI, LangGraph, LangChain, SQLite) that orchestrates; a Next.js chat front end using CopilotKit, connected to the LangGraph agent over AG-UI.
- **The engine is called through a Node worker:** JSON requests in, compact JSON summaries out — never raw logs back to the model. Worker operations wrap what exists: read a log, ingest into the Car history, report a Drive, Car history rows and Baseline, the Flash plan, record a Flash, answer an Unexplained change, the History file. New engine operations below go through the same worker.
- The drive tools from the existing in-browser ask module (overview, insight by topic, channel stats by window, timing cell, one pull) are reused through the worker as agent tools; its answer checks move into the Python verify step.
- `app/` is parked: untouched, not wired to the backend.

### The graph (one upload)
1. **Ingest** (engine): read the CSV, add the Drive to the Car history against the active Map version; save the raw CSV.
2. **Settle** (engine): judge every Open step against this Drive → done / open / fail / wait, with a reason; mark the Drive a Wasted drive if it settled none and the reason.
3. **Diagnose** (engine): one cause per symptom pattern, before any ranking (tuner-play-panel T7):

   | Pattern | Cause | Next step |
   |---|---|---|
   | Trims beyond ±10 % in every load band from the first minute, after a Flash or Install | MAF Scaling / housing mismatch | Undo, then MAF Scaling for the housing |
   | Trims ≥ +8 % at idle and low airflow only, after an Install | Unmetered air | Check the install, no map change |
   | Leaner than target under boost after a downpipe Install | Exhaust leak ahead of the A/F sensor, or real lean | Check the flanges, then the mixture plan |
   | High Knock Retard with a flat Fuel-quality score | Scheduled retard | Not a finding |
   | Score rising mostly while lugging on hot drives | Lugging on hot E10 | Keep the revs up (habit), boost step only if proven |
   | Boost overshoot above +2.5 psi held, after a downpipe | Faster spool | Downpipe boost trim |

4. **Decide** (engine): the Next step and the owner questions. The Next step order, carried from the prototype and amended by the grilling (Baseline before habit):
   ```
   open Stop            → Flash: Undo (the only step)
   Too-short drive      → nothing read; previous step stands
   logger fault         → watch in TunerView: fix the dead gauges
   no Baseline yet      → drive: one Cool drive with 2 pulls
                          (+ a cause seen today is added as an Open step, told as a free habit)
   cause seen today     → its step (habit drive / Flash from the Flash plan)
   Open step still open → its step, compact "same step"
   otherwise            → nothing: drive it; upload after a Flash, Install, new fuel, or Knock Control > 0.60
   ```
   *(Order from `prototypes/next-step/`.)* A Flash Next step's cells come only from the Flash plan.
5. **Agent** (LLM): with read-only tools (drive facts, Car history window, Open steps, Flash plan and KTuner card, map cells, knowledge search, picture choice), it explores and writes the reply. It may not add, remove or reorder the Next step.
6. **Verify** (code): every number matches a tool result; every table, cell and value matches the KTuner card; the action named is the decided Next step; every factual claim cites a tool result or card id; banned advice (less knock sensitivity, more timing, boost above the ceiling, curve edit for trims-everywhere) is rejected.
7. **Repair once**, then fall back to the built-in reply (templated from the same engine facts).
- **Pauses:** owner questions and "I flashed it" use LangGraph interrupts; the answer is persisted, then the graph resumes from Decide.
- **No-upload questions** run Agent → Verify → Repair/Fallback against the current drive window. With no Drive at all, only Car profile setup runs.
- **Drive window:** the latest Drive plus every Drive since the last Flash or Install, capped at 14 days; older Drives feed only the Baseline and trend pictures. Every reply states its window.

### Owner answers and Car profile
- The Car profile is extracted by the LLM from the owner's words into a typed form (enums for parts and housings), shown as a card, persisted only on confirm.
- Questions are generated by the engine (never the model) with fixed options; answers are applied through engine operations at their point in time (record a Flash before the Drive it explains; answer an Unexplained change after it), then the Car history is re-derived.
- Questions shipped first: what changed (at a trims Stop after a change); which intake housing (only when the Flash plan routes to the MAF Scaling choice); did you flash (after-flash Knock Control pattern with an open Stop).
- MAF Scaling choice per housing: factory airbox → Factory; PRL HVI → Factory, proven by the next calm Drive's trims, never assumed; PRL Race housing → PRL Race; 27WON Race → 27Won Race; not sure → stay on the Undo file. Shown only inside the Flash plan's KTuner card.
- An Install is recorded when the parts list changes; it starts the drive window like a Flash.

### Map versions and map change safety (ADR 0003)
- Map version 1 is the original KTuner basemap Starter 21 Dual Tune 2 as held in the app's map data; it is the active version from the first Drive and starts no Shakedown drive.
- A Flash Next step holds a **proposed change** (table, L/H, level, rpm row, column N of 16, before, after). It becomes Map version N+1 only on "I flashed it"; "Not now" discards it.
- Undo flashes an earlier Map version; Revert makes the KTuner basemap the active version on confirm.
- **Two checks, both deterministic, neither an LLM:** the engine's P1–P9 rules, then an independent Python check against the active Map version: table and axes exist; indices in range; every before equals the active version's value exactly; every after within the thresholds; pairs identical (Boost 1=2=3 × L/H; WOT L=H); one table family; boost step ≤ 1 psi; no boost raised below 3,000 rpm; nothing above the ceiling; MAF Scaling within ±10 % per round and rising; ignition, knock-sensitivity and protection tables never present. Disagreement blocks the Flash and says why.
- **Thresholds in one data file**, each with value, unit, basis (measured / source / judgement) and source; both checks read it, neither shares the other's code.
- **The KTuner card is rendered only from the checked change**, in each table's own units and decimals. The owner gets a per-cell checklist, then "I flashed it".
- **Flash readback** on the first Drive after a Flash: boost tables → logged Turbo Pressure Target in the visited changed cells vs the new version; MAF Scaling → the trims pattern. Mismatch → not credited, Next step "re-check what you typed", naming the cell. Tables whose result isn't logged say "readback not possible".

### Knowledge base
- One card per file, front matter: id, title, kind (fact / rule / play / owner-question / ktuner-howto), topics, applies-when, numbers (name, value, unit), source (doc and section), status (current / superseded-by). Body ≤ 150 words.
- Built from `docs/research/`, `CONTEXT.md` and the ADRs; `fact-check.md` wins on numbers; corrected claims (for example "PRL HVI = Factory curve") are cards with status superseded.
- A generated index serves `search_knowledge(query, topics, kind)` → at most 5 cards; keyword search first, no vector store. The build fails on a missing source or a number conflicting with `fact-check.md`.

### Chat UI
- CopilotKit chat with our own cards rendered in the thread: Verdict, Open steps settled, Next step (with gauge table or drive recipe), owner questions (interrupt UI), KTuner card with checklist, Car profile card, pictures.
- Harness steps stream as a collapsed summary ("Checked 6 things · 4.2 s") that expands to each step with tool inputs and outputs; the model's thinking, when provided, is a separate collapsed block labelled "unchecked".
- Own upload button for CSVs; the upload creates the Drive server-side and posts a message referencing it.
- Open steps and "Waiting for you" questions shown beside the thread on desktop, above it on phones.
- Pictures (engine produces data, the web app draws, the agent picks the kind): trace around a Key moment; this Drive vs Baseline; map grid with changed cells and cells the Drives sat in; before/after proof bars; MAF Scaling curve gap.

### Storage
- SQLite holds Car profile, Car history (as the engine's state), Map versions, Flashes, Installs, owner answers, Open steps, chat threads and the raw CSV of every upload. The History file export includes all of it except raw CSVs.

### LLM configuration
- `.env`: base URL, key, model, optional vision model; any OpenAI-compatible provider; no settings screen yet. With no key, built-in replies only.

### Engine changes (tested in the engine's own suite)
- Diagnose (one cause per symptom pattern) and the Next step decision with Open step settling, exposed as engine operations.
- Fix the false "Unexplained change: boost" alarm: compare boost targets only between Drives that both had hard pulls.
- Treat a starting score ≤ 0.60 that falls to the Baseline as the after-flash pattern, not an Unexplained change.
- Exclude Knock Control rises above 5,200 rpm from fuel and heat verdicts.
- Map version as the Drive's Map (replaces "not recorded"); an Install record beside Flashes; the starting Map version recorded without a Shakedown drive.
- Remove table-naming fix strings from checks: only the Flash plan prescribes (T1).

## Testing Decisions

- **A good test drives external behaviour only:** what the owner sends in and what the chat would show back. No assertions on graph internals, prompt text or private helpers.
- **Seam 1, the tuning loop at the server's front door (main seam).** Tests post an upload, an answer or "I flashed it" and assert the reply events: steps, Verdict, settled Open steps, Next step, KTuner card, questions. The LLM is a scripted fake (fixed tool calls and text), so tests are deterministic with no key.
  - **Loop eval (eval layer 1, blocks merges):** replay the owner's 9 drives in order with scripted answers; assert each Next step kind and title, each Open step status, Drives to proof per step, and Wasted drives. Expected path (from the prototype, Baseline-first): 09:03 Cool-drive step; 09:50 and 19:59 same step; 20:38 Undo (with answers, naming the Map version 1 file); 15:09 Too-short; 15:29 Undo Done in 2 Drives; 16:01 Baseline step plus habit opened; 1 Sep 08:13 Baseline Done, habit step; 5 Sep 07:56 logger fault. 20:38 never yields a knock fix or curve edit.
  - **Verify path:** the fake model returns a wrong number, a cell not on the card, an uncited claim, a different action, banned advice → one repair, then the built-in reply.
  - **Map versions and readback:** "I flashed it" creates version 2 and a Shakedown drive; "Not now" creates nothing; a Drive whose logged boost target differs in a changed cell is not credited and names the cell.
  - **No-upload questions:** none without a Drive (profile only); the drive window is stated and respected.
- **Seam 2, map change checks (ADR 0003), separate on purpose.** The engine's rules and the Python check receive the same generated changes — valid, off-by-one index, wrong before, out of bounds, broken pair, two families, forbidden table, against the wrong Map version — and must agree on every one; any disagreement fails. Thresholds-file tests assert every entry has value, unit, basis and source.
- **Seam 3, the engine's existing suite (`npm test`).** Engine changes are tested at the engine's public operations, in the style of the current car and drive tests (fixtures from the owner's real drives).
- **Knowledge base build test:** missing source or conflicting number fails.
- **One browser smoke test**, in the style of the existing Playwright end-to-end check: upload a drive in the chat, see the reply card, expand the steps, answer a question.
- **Evals layers 2–3 are not tests:** run on demand with a real key from `.env`; they print a per-model scorecard (grounding pass rate) and a clarity score for owner review.
- **Prior art:** the engine's car and drive test files (real-drive fixtures, deterministic `now`), the existing end-to-end app check, and the next-step prototype's replay (the expected Next step path above).

## Out of Scope

- Reading screenshots (KTuner tables, TunerView screens, dash codes) — a later, more interactive stage; the vision model setting exists but no feature uses it yet.
- The parked browser app (`app/`): not changed, not wired to the backend, not retired yet.
- Hosting, login, and more than one owner or car.
- A settings screen for the LLM.
- Writing a file KTuner can open: the owner types the cells.
- Ignition, knock-sensitivity and protection table edits; IAT-ignition tricks; custom tunes; promising power.
- Vietnamese replies (the app answers in English for now).
- Vector search for the knowledge base.

## Further Notes

- **The win is measured:** the loop eval reports Drives to proof and Wasted drives on the 9 real drives on every run; any change that raises either needs a reason.
- **Expectation copy matters as much as features:** "no map change" is an answer; heat never counts as tuning; "Can't tell yet" always says why.
- **The prototype is the reference** for reply structure and the Next step path: `prototypes/next-step/` replays the 9 drives through the real engine with owner answers wired through the engine's own operations.
- **Security:** the TokenHarbor key used for testing lives only in a gitignored `.env`; the token pasted during the grilling must be rotated.
- **Next:** `/to-tickets` into `.scratch/tuning-loop/issues/`, first ticket = the thinnest end-to-end slice (upload → engine → SQLite → built-in reply with visible steps, no LLM), then LLM agent with verify and repair, knowledge cards, Car profile and questions, Map versions and Flash readback, pictures, eval layers 2–3.

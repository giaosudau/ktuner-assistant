# KTuner Assistant as a tuning shop — problem analysis

*4 Oct 2026. PM analysis before any detail. Inputs: the owner's brief (4 Oct), a live run of the
app on the owner's 9 real drives with a real LLM key, the owner's own database (read-only), and
`docs/research/` (drive-check-tuner-analysis.md §4 "Top 10 analyses", ktuner-only-tuning.md §2
"The reasoning a tuner applies", e10-ignition-boost-simple-tune.md §2–4, afr-tuning-research.md §2).*

## 1. The value we sell

A remote tuning shop in a chat. The owner bought KTuner, fitted parts and flashed a basemap. A shop
would now do this, and so must we:

```
intake ─► brief the log ─► read the log ─► propose ─► explain/teach ─► owner flashes ─► verify log ─┐
  ▲                                                                                                │
  └──────────────────────── repeat until the car is safe and the owner is happy ◄──────────────────┘
```

Why a loop and not an answer: **no tuner's first change is the last one, and engine safety is
proven only by the next log.** Our moat is that every round is checked: the engine reads the
whole log, two independent checks guard every cell, and the next log proves or refutes the change.

What the owner should feel: *"a tuner who knows my car is talking me through it, and I'm learning
why."*

## 2. How a shop actually runs each stage, and where we are

| Stage | What a good tuner does | What the app does today | Gap |
|---|---|---|---|
| Intake | Car, parts, fuel, climate, goal, what's flashed | Car profile from words | Goal (daily/fun/economy) never asked |
| **Brief the log** | A precise drive brief: where, warm-up, gear/mode, throttle %, speed range, how long, breaks between pulls, temperatures, gauges on, sample rate — and checkpoints the customer can tick | One "Cool drive with 2 pulls" recipe + 4 watch gauges | **Not a brief.** No location/safety, throttle %, speeds, duration, breaks, sample rate, full gauge list, no checkpoints |
| Read the log | Gate 0 (is the log usable?), then 10 analyses in a fixed order (research §4) | Engine runs most of them; reply shows 4 numbers + 1 sentence | **Findings hidden.** No "did your log meet the brief" checkpoints; no health table (AFR vs command vs target, trims by band, KC, DI pressure, IAT, lugging, CVT temp, boost vs target, ignition under boost, 50→70) |
| Propose | Options with reasons; airflow first, fuel targets second, ignition last; one change per round | Flash plan levers (one family) | OK in engine; presented as a list, no "why this order" |
| Explain / teach | Walk the customer table by table: what it does, current values, what changes, what it will feel like, risk | One KTuner card for the one change | **No map tour**, no table explanations, the model can't read whole tables, can't answer "what does Ignition_Max do?" from data |
| Flash | Exact cells, save-as, undo file | Exact (KTuner card, two checks) | OK |
| Verify | Same brief again, compare like with like | Next step + readback + settle | OK in engine; **broken with out-of-order uploads** (below) |
| Repeat | Round N, history of maps | Map versions exist | No visible "round" model; journey stepper is decorative |

## 3. What the live run found (evidence, not opinion)

1. **The whole file is read.** All 9 logs: engine samples = CSV lines − 2 header lines
   (4,327 … 25,321 samples, 3 s … 52 min). No cherry-picking. ✅
2. **The LLM is a narrator, not the shop's brain.** Today it may only rephrase a decided reply in
   ≤150 words; typed questions are routed by regex and only "knowledge" questions with drives reach
   the model. It has no tool to read a whole map table, no tool for the health checks as a set, no
   way to teach. → The owner's brief ("LLM orchestrates to reach the answer") is not met.
3. **The eval never ran live.** `scorecard.py` crashed on a nested event loop on first real use —
   the "per-model grounding scorecard" had never produced a number. Fixed; first real numbers in
   `eval.md`.
4. **Open steps go wrong with out-of-order uploads (real bug, owner's own DB).** The owner uploaded
   1 Sep, 5 Sep, 30 Aug, then **15 Aug**. The 15 Aug drive re-settled every current step:
   `open_steps.settled_at = 15 Aug` on steps opened **1 Sep** — a step "proved" by a drive two
   weeks older than the step. That's why the panel showed three "Can't tell yet" with reasons that
   didn't match the latest drive. Owners *will* back-fill old logs.
5. **The sidebar journey is decorative** (five static labels); the Open steps list repeats the
   same pill without saying what drive would settle them all.

## 4. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | **The LLM is the shop's conversational brain**: every chat message and every Drive reply runs through the agent, which chooses tools, reasons (thinking shown, labelled unchecked), and writes a structured answer (markdown, as long as the question needs). | Owner brief; that is the signature of an AI-native app. |
| D2 | **The engine and the two map checks stay the only source of numbers, verdicts and cells.** The model can't invent a cell; verify rejects a number not in a tool result, a cell not in the checked plan, banned advice, and uncited claims; one repair, then the built-in reply. | "Ensure engine safety" is the shop's first promise; an unverified LLM writing ECU cells is the opposite. |
| D3 | **Teach every table, change only checked families.** The model can read and explain *any* table in `ktuner-maps-digitized.json` (ignition, knock sensitivity, boost, WOT, MAF, fill, DI pressure, VTC). Changes stay limited to the Flash plan's families (MAF Scaling, WOT/mixture target, boost targets). **Ignition**: shown and explained; edits locked, because the load axis isn't digitized and the sourced street rule is "remove timing only, never add without a dyno" (e10-ignition §2). The lock says what unlocks it. | Owner asked for AFR *and* ignition tuning; safety and evidence say teach-yes, edit-later. |
| D4 | **Drive brief with checkpoints**, written like a shop's brief, every number from the engine's limits or a sourced card; after upload, a **Log checkpoints** card says which ones the log met. | Owner brief: "as much guidance as detail … checkpoints". Wasted drives are our #2 metric. |
| D5 | **Health report** after every readable log: the research's ten checks as one table, each with value, limit, verdict. | "Show insights — current status of car, engine, AFR…". |
| D6 | **Map tour**: after the report, a high-level list of the tables that matter for this car with status (in this round's plan / locked + why / leave to basemap), then detail on request, table by table. | "Show high level which table … then detail each one". |
| D7 | **Older drive = history only.** A Drive that starts before the latest Drive already held is added to the Car history and Baseline, but never settles or re-decides the current steps; the reply says so. | Fixes finding 4. |
| D8 | **Knowledge harness**: every claim cites a card; when the agent needs a fact that no card holds, it proposes one (`knowledge/proposed/`, with source and reason) instead of asserting it; proposals are reviewed (`kta-knowledge approve`) before they can be cited. | "ALL suggestion must based on knowledge … harness to add new knowledge". |
| D9 | **Edit and resend** a previous message (ChatGPT/Claude): editing a text message re-runs from there; uploads are re-sent as a new attachment. | Owner brief. |
| D10 | **Sidebar = the shop ticket**: "Round N on Map version N", what we need from you now (one action), Open steps grouped under the drive that settles them. | Journey stepper and Open steps were confusing. |

## 5. What success looks like (measured)

- Eval layer 1 (loop eval, 9 drives): unchanged path; plus out-of-order replay gives the same steps.
- Eval layer 2 (live scorecard, 3 models): pass-first-time rate, fallback rate, failure classes.
- Eval layer 3 (clarity judge): one action, plain words, names the drive to log.
- New: **teaching eval** — 8 owner questions (what does WOT_Enrich do; why not more timing; what
  will the boost change feel like …) answered by the live model, each checked by verify (numbers,
  citations, banned advice) and by a judge for "answers the question, cites, plain words".
- Browser: the full shop loop on real drives, phone and desktop.

---

## 6. Implementation audit (4 Oct 2026, second review)

How much of §4 is built, checked against the code, not the tracker.

| # | Decision | Built? | What is missing |
|---|---|---|---|
| D1 | LLM is the shop's brain for every reply and question | ⚠️ **Partly** | Typed questions still go through `ask.classify` (regex) and a keyword card search first, and the agent is told to *"Start with this sentence: {built-in answer}"*. With no relevance floor, any text matches some card, so **"Hello, I want to tune my car" is answered with a table card** (live: the boost tables; after today's cards: the ignition table). The agent is also told the car from a hard-coded sentence in `agent.system_prompt`, not from the Car profile. |
| D2 | Engine and two map checks decide | ✅ | — |
| D3 | Teach every table, change only checked families | ✅ | The lock reasons don't yet cite the forum evidence (`kc-wot-lean-timing`). |
| D4 | Drive brief + Log checkpoints | ✅ | The brief is the same for every owner; it doesn't say "your last log had no AFR Command, turn it on". The 10/s checkpoint fails all 9 owner logs (7.5/s), still unconfirmed. |
| D5 | Health report | ✅ | — |
| D6 | Map tour | ✅ | — |
| D7 | Older drive = history only | ✅ | — |
| D8 | Cite or propose | ⚠️ **Partly** | `propose_knowledge` writes `knowledge/proposed/`; the reviewer step (`kta-knowledge approve`) is named in docs and code comments but **does not exist**: proposals can only be listed (`--proposals`). |
| D9 | Edit and resend | ✅ | — |
| D10 | Sidebar = the shop ticket | ✅ | — |
| §2 Intake | Goal (daily / fun / economy) | ❌ | Never asked, never stored. |
| §5 | Teaching eval, clarity judge, out-of-order replay | ✅ / ✅ / ✅ | No eval case for greetings, vague openers or a returning owner; no eval from real forum questions (now `owner-queries.md`). |

**Score:** 8 of 10 decisions fully built, 2 partly; the intake goal is missing. The gaps below are
not in §4 at all: they are what the second review found.

## 7. Second review: the shop has no front desk

The owner's report (4 Oct), in their words: *"User types hello, I want to tune my car, and the
assistant answers about boost tables 'based on your 3 Drives'. Where do 3 drives come from? Did
you even ask what car, or show the current stage? Edit car adds a new Car profile card every
click. Suggestions only on a new chat. How is chat history stored?"*

A real shop has a **front desk**. Walk in and say "hi, I want to tune my car": the person at the
desk asks *which car*, pulls up its job card if you've been before, says where you left off, and
asks what you came in for today. Nobody starts explaining boost tables. Our app has a workshop
(engine, verify, map checks) and no front desk.

### 7.1 What went wrong, each traced to the code

| # | What the owner saw | Cause (code) | Human logic it broke |
|---|---|---|---|
| F1 | "Hello I want to tune my car" → a boost-table lecture | `ask.classify` has no greeting / vague intent; `knowledge.search` returns any card with one shared word ("car", "tune"); the agent is told to start with that card's sentence | A greeting gets a greeting and a question back, never a lecture |
| F2 | "based on your 3 Drives, 30 Aug 16:01 to 05 Sep 07:56", unexplained | The drive window line (Drives since the last Flash or Install) is attached to every answer, even one that read no drive | Say what you read, in words: "Your car file holds 9 drives; I read the 3 since your Flash on 30 Aug". Say nothing about drives when the answer used none |
| F3 | No "which car?" / no "where are we" in a new chat | A new chat is an empty thread; the stage lives only in the sidebar; the agent prompt names a hard-coded car | Returning customer: "Welcome back — your Civic FE, Round 2, waiting on the Shakedown drive. What do you want to do today?" |
| F4 | Edit car → a new Car profile card with Save every click (2 clicks → 2 cards) | `useChat.editCar` appends a profile message on every click, with no check for an open editor; old cards keep a live Save button | One car, one editor. Editing the car is a sheet over the chat, not a message; a stale card can't save |
| F5 | Suggestions only on the empty screen | `Suggestions` renders only for `kind === "drive"` replies; typed answers, notes, flash and profile replies get none; the welcome chips are fixed | Every reply ends with 2–3 next moves that fit the stage and what was just said, like Gemini/ChatGPT follow-ups |
| F6 | New chat loses the old one; no chat list | The thread lives in `localStorage` (`kta-chat-v1`), one at a time; `newChat` wipes it. SQLite has `threads` / `thread_messages` but only Drive replies are written there, and no route reads them | Chats are kept and listed like any chat app; the car's facts never live in a chat |
| F7 | "What is the Car profile for?" | Profile = model/fuel/parts only; maps, installs, logger setup and round sit in other panels | One **Car file**: everything the shop keeps about the car, in one place |

### 7.2 The model: one Car file, many Chats

```
Car file (one per car, in SQLite — the shop's job card)        Chats (many, in SQLite)
├─ Car profile: model, gearbox, fuel, climate, ECU, goal        ├─ "Tune my car"          4 Oct
├─ Parts: Installs with dates                                   ├─ "Is RON97 worth it?"   2 Oct
├─ Maps: Map versions (per slot), active, Flashes               └─ "First log"            1 Sep
├─ Logger setup: gauges seen in the last log, rate, gaps            every message stored, cards included
├─ Drives: Car history, tags (fuel, slot), hidden drives            a chat reads the Car file, never owns it
└─ Where we are: Round N, stage, Open steps, Next step
```

- A chat never holds a fact about the car. The Car file is the only truth; every chat reads it.
- **New chat ≠ new customer.** A new chat opens with the **Recap** (who, where we are, what's open)
  and the stage's options, not a blank page.
- A chat is a conversation, so its title comes from its first message and it can be renamed or
  deleted; deleting a chat never deletes a Drive (Drives belong to the Car file).

### 7.3 What the front desk does, by what the owner says

| Owner says | Stage | The reply |
|---|---|---|
| "Hello" / "Hi" / "I want to tune my car" / anything vague, **no Car profile** | car | Greeting + "Which car are we tuning?" + the profile card (filled if they named it) |
| Same, **profile, no drives** | baseline | "I have your Civic FE on Starter 21 Dual Tune 2 — still right?" [Yes] [Something changed] + the Drive brief + [How do I log?] |
| Same, **returning** | read / plan / verify | The Recap: car, Round N on Map version N, the last drive's Verdict, the Next step and what it waits for; options [Attach my latest log] [Continue: <Next step>] [Ask about my car] [Something changed on the car] |
| A question about the car | any | The tuner's answer (D1), with only the drives/maps/cards it actually read named |
| Something outside tuning | any | One line: what the shop can help with, and the stage's options |

### 7.4 Suggested replies at every turn

Every assistant reply ends with up to 3 chips: **one primary** (the stage's action: attach the
log / I flashed it / start the brief) and **two follow-ups** drawn from what the reply just said
(the engine's findings and the Next step, never free model text): e.g. after a Watch on the
Fuel-quality score → "Why is my Fuel-quality score high?", "Is RON97 worth it?"; after a Flash
plan → "Show me the cells in 3D", "What if I don't flash it?". Chips are deterministic, built
server-side from the reply's facts, and stay only under the latest message.

### 7.5 What the forum adds (docs/research/forum-afr-maf-research.md)

- Owners' first real question is **"teach me how to use my CSV to correct the MAF"** (asked five
  times in a row, unanswered). We answer it for part throttle (the `afmCurve` plan); full
  throttle needs AFR Command and the open-loop check, both missing today.
- The 10th-gen evidence that EU ECUs run **open loop at full throttle** means cruise trims say
  nothing about WOT mixture there; the app must check this on the owner's own logs.
- Leaning WOT toward 11.5 cost timing on an owner's car: one more reason the mixture lever is locked.
- Knock Count / Misfires are noise on this platform (KTuner support); IAT2's side of the
  intercooler differs by ECU and must not be assumed.

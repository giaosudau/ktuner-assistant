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

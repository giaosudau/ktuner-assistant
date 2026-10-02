# Panel 2: does it tune like a pro? Mods, the map, and the Play

*Chaired by the PM, 2 Oct 2026. Follows `chat-tuner-panel.md`. The vendor and Honda voices are roles written to stress-test the design. They are not statements by PRL, TSP (Two Step Performance), 27WON or Honda.*
*Every number below comes from the owner's map file (`data/ktuner-maps-digitized.json`), the engine (`KTA.checkDrive`, `KTA.build`) or `fact-check.md`. Each one can be re-run.*

> **Corrected by `owner-voices.md` (same day).** Two things here need correcting:
> 1. The claims that "the PRL HVI is a street housing that keeps the factory diameter, so Factory is right" are **not verified**. PRL says the HVI gives proper fuel trims with no tune; Phearable calibrates "PRL HVI Street" as its own MAF housing option. Play A must **ask which housing is fitted and set the matching MAF Scaling option**, never infer it.
> 2. The Plays' owner stories were invented. Use the owners' own questions in `owner-voices.md` §2.
>
> The decisions (T1–T8), the KTuner card format and the cell tables stand.

**The question:** when the owner fits a part or asks "what do I change?", does the app answer like a professional tuner? That means one cause, one change in KTuner (exact table and cells), what it means, what it does for the car, and how the next drive proves it.

**Short answer today: no.** The test below shows why.

---

## 0. The test: the owner's real mod-fault drive

On 23 Aug the owner logged at 19:59, changed something, flashed and logged again at 20:38. Same car, same evening.

| | 19:59 | 20:38 |
|---|---|---|
| Fuel trims by load band | worst −1.6 % | **−20.8 / −20.8 / −21.4 %** in every band, from the first second |
| Fuel-quality score | — | 0.50 → 0.49 (flat) |
| Engine verdict | OK | Stop |

The owner's map file holds four AFM curves. Reading the same sensor frequency through each one (`KTA.build.afmCompare`):

| AFM sensor | Factory curve | PRL Race curve | PRL Race ÷ Factory | Trim the ECU needs to cancel it |
|---|---|---|---|---|
| 2,500 Hz | 2.08 g/s | 2.83 g/s | 1.36 | −26.4 % |
| 4,375 Hz | 14.09 g/s | 20.17 g/s | 1.43 | −30.2 % |
| 6,719 Hz | 63.88 g/s | 89.03 g/s | 1.39 | −28.3 % |
| 10,000 Hz | 275 g/s | 355.28 g/s | 1.29 | −22.6 % |

**What each one says about 20:38:**

| Who | Says | Right? |
|---|---|---|
| **App #1 (today's engine)** | "Fix first: knock. 6.0° worst at 1,434 rpm. Richen WOT 0.3 AFR or drop 1 psi in that rpm." | ❌ The score is flat at 0.49–0.50. That 6° is retard *scheduled* from the score (fact-check §2: 10.2° × score under boost, about 11° in the lugging cells). It is a **false Stop, and it carries a map edit.** |
| **App #2** | "Fuel trims −18.6 %: correct the AFM Flow table with the values this app computes." | ❌ Trims off by the same amount everywhere, from the first second, is a preset or housing mismatch. Bending the curve would hide it. The spec's own rule says "never a curve edit". These logs don't have AFM Hz either, so no curve could be computed. |
| **Pro tuner** | "Your trims are pulling about 21 % everywhere, right after a flash. That's what the PRL Race AFM curve does on a street housing: it reads about 1.3–1.4× the air. Flash 19:59 back, or set AFM Flow to Factory. Drive calm until the trims sit within ±5 %." | ✅ One cause, one change, and a proof. Same direction as the numbers; "most likely, not proven" until the Shakedown confirms it (fact-check §6). |

---

## The panel

| Voice | Brings |
|---|---|
| **PM** (chair) | The loop, the gate: every plan ends in one conflict-free KTuner action or an honest "no change" |
| **Owner** | Civic FE 1.5T CVT, KTuner Starter 21 Dual Tune 2, E10 RON95, intake, downpipe, front pipe, catback, intercooler, CVT cooler |
| **KTuner tuner** | Street-tunes the 1.5T and reads customer logs daily |
| **Tuner shop owner** | Installs parts, flashes cars, takes the comeback call |
| **Honda technical manager, FE 1.5T CVT** | L15 and CVT behaviour, field failures, what the ECU protects |
| **Parts sellers (PRL, TSP, 27WON roles)** | Intakes, downpipes, intercoolers, AFM housings |
| **Principal AI Engineer** | Agent, harness, evals (`kta-ask.js`) |

---

## Round 1: why didn't it act like a tuner?

- **KTuner tuner:** "The app thinks in *checks*. I think in *causes*. Five red lines don't mean five problems. On 20:38 one cause made two red lines, and the app ranked the wrong one first and gave a remedy for each."
- **Honda:** "Fuel trims off by a fixed percentage from a cold start is air measurement, not fuel and not knock. The ECU believes in air that isn't there."
- **Shop:** "And it didn't know he'd fitted anything. The first thing I ask a customer is *what did you change?*"
- **AI Engineer:** "Three root causes in the code:
  1. remedies live as free-text `fix` strings inside the checks (`kta-engine.js`), so they bypass the Flash plan;
  2. there is no notion of the car's *build*, the parts fitted;
  3. nothing maps a *pattern of symptoms* to *one cause*. The safety order puts knock above trims whatever the evidence."
- **PM:** Agreed, and it fails our own gate: two screens can give two edits (WOT richen *and* an AFM curve edit) for one fault. **Decision T1: checks diagnose, they never prescribe.** Remove every `fix` string that names a table. The only things that can say what to change in KTuner are the **Flash plan** and the **Play** it runs (below). A check's job is its number, its verdict and its evidence.

## Round 2: the owner fits a part. What does a pro do?

- **KTuner tuner:** "Four questions before I touch the map:
  1. What exactly? Brand, part, housing.
  2. Is there a log from *before*, on a cool day?
  3. Did the AFM move, or the A/F sensor?
  4. Which map is on the car now?

  Then I change **only** what the part forces. Usually that's nothing, or one preset."
- **Parts sellers:** "We can answer most of those for our parts. The PRL HVI is a street housing: same AFM size as factory, so the preset stays Factory. A Race housing is bigger and needs the Race curve. A downpipe moves the front A/F sensor into our pipe. An intercooler changes nothing in the map."
- **Shop:** "Write that down per part, or every customer guesses. Half my comebacks are a Race preset on a street intake, or a leaking downpipe flange that reads lean."
- **Honda:** "And a *before* log. Without it, the owner credits the weather to the part."
- **PM:** **Decision T2: a new record, the Install.** It holds the date, the part (from a fitment list), and the facts that part brings (housing, preset, sensor moved, expected effect). It sits in the Car history next to Flashes. **Decision T3: fitment facts are data, not chat.** Each part in the fitment list declares:
  - `preset`: the AFM curve it needs;
  - `moves`: the sensors it relocates;
  - `tables`: the map tables it can affect;
  - `expect`: what the logs should show;
  - `risk`: what a bad install looks like in the log.

  Vendors can supply rows. Rows never rank parts.

## Round 3: the Play

- **PM:** "A tuner doesn't hand a customer a table. He runs a routine he's run a hundred times. I want that routine on screen: same shape every time, grounded in *this* car."
- **KTuner tuner:** "Mine is: baseline, change one thing, flash, drive gently, check, then push."
- **AI Engineer:** "Then it's a state machine, not a conversation. The engine owns the state. The model narrates it and asks the questions."
- **PM:** **Decision T4: a Play** is a fixed routine with seven beats, started by a trigger (an Install, a symptom pattern, or an owner ask). The beats are always in this order:

| Beat | Owner sees | Done when |
|---|---|---|
| **1 Why now** | The trigger, in one sentence, with the evidence ("trims −21 % from the first second at 20:38, right after a change") | — |
| **2 Before** | The baseline drive the proof will compare against (the latest Cool drive on the current Map), or "log one cool drive first" | A baseline exists |
| **3 The change** | The **KTuner card** (below): exact table, L/H, rows × columns, before → after, or "no map change" | The owner taps "I made this change" |
| **4 Flash** | Save-as name, Undo file, "Record this Flash" (prefilled) | Flash recorded |
| **5 Shakedown** | "Drive calm: 6 of 10 calm minutes", plus what's being watched (trims, score) | 10 calm minutes with healthy trims |
| **6 Prove** | Like-for-like against beat 2: keep / undo / can't tell, with the numbers | A verdict |
| **7 Next** | The next Play this one unlocks, or "nothing to do: enjoy it" | — |

  A Stop anywhere jumps to **Undo** (rule P1). One Play is open at a time, and it carries one table family (P4).

## Round 4: the KTuner card, which must be exact

- **KTuner tuner:** "If it doesn't say which table, which cells and the number, it's a forum post."
- **Shop:** "And I want to check it in 30 seconds before I flash a customer's car."
- **Honda:** "Every boost change says what it does to torque at the CVT."
- **PM:** **Decision T5: the KTuner card** has six parts, always:
  1. **What:** the table as KTuner names it, with L and H and levels 1/2/3 as the file holds them.
  2. **Where:** rows by rpm (from the file's axis), columns as "N of 16, counted from the left". The load axis wasn't captured, so columns are counted, never named.
  3. **Before → after** for every cell, and a paste-ready row for curves.
  4. **What it means:** one sentence on what the ECU does differently.
  5. **What it does for your car:** the effect on *this* car's numbers, and its cost.
  6. **Save as / Undo / Proof.**

  The engine generates the card from the file. The model never types a cell.

## Round 5: agent and harness

**AI Engineer:** "The tuner's judgement goes into the engine as Plays. The model does three jobs and none of them is deciding:
1. **Interview:** fills the fitment form ('Which intake? PRL HVI / PRL Race housing / 27WON / other'). It asks with structured choices, and the answer is an enum, never free text.
2. **Narrate:** turns a beat into two sentences.
3. **Explain:** 'what does AFM Flow mean?'"

| Piece | What it is |
|---|---|
| `KTA.plays` | Pure functions: `match(history, installs)` → the open Play and its beat; `card(play, map)` → the KTuner card from the map file |
| `KTA.fitment` | The fitment list (part → preset, moves, tables, expect, risk) |
| `KTA.diagnose` | **Symptom pattern → one cause** before any ranking (table below). It replaces "worst check first" |
| New tools | `get_play()`, `get_ktuner_card()`, `get_map_cells(table, rows, cols)`, `record_install(part)`, `record_flash(play)` |
| New checks | **Card check:** any table, cell or psi/AFR target in prose must equal `get_ktuner_card()`. **Remedy check:** the remedy must match the diagnosed cause (trims off everywhere → never an AFM curve edit or a WOT change). **Pair check:** boost edits are identical across 1/2/3 × L/H (P6). **Bounds check:** P7 |
| Eval set | The 9 real drives as golden cases. **20:38 must give "AFM preset → Factory / Undo 19:59"**: no knock fix, no curve edit. It fails today, so it becomes the first regression test. Plus red-team asks: "+3 psi", "add timing", "my intake is PRL HVI and I picked PRL Race, is that fine?" |

### `KTA.diagnose`: one cause per symptom pattern

These rules run first. A tuner reads the pattern, not the worst line.

| Pattern in the drive and the history | Cause | Play |
|---|---|---|
| Trims beyond ±10 % in **every** load band, from the first minute, after a Flash or an Install | AFM preset or housing mismatch | **Fix the AFM preset** (Undo or preset) |
| Trims ≥ +8 % at idle and low airflow, fine at high airflow, after an Install | Unmetered air (leak after the AFM) | **Check the install** (clamps, no map change) |
| Leaner than target under boost, after a downpipe Install | Exhaust leak ahead of the A/F sensor, or a real lean | **Check the flanges**, then the mixture Play |
| Knock Retard high **with the score flat** | Scheduled retard (fact-check §2) | None: it is not a finding |
| Score rising, mostly while lugging, on hot drives | Lugging on hot E10 | **Keep the revs up**, then the low-rpm boost Play |
| Boost overshoot above +2.5 psi held, after a downpipe | Faster spool | **Downpipe boost trim** |

## Round 6: graph engineering, one picture per beat

- **KTuner tuner:** "I look at three things: the trace, the map with the cells it used lit up, and the before/after."
- **PM:** **Decision T6:** each Play beat gets exactly one picture, built by the engine:

| Beat | Picture | Why this one |
|---|---|---|
| 1 Why now | **Trace:** the drive with the trigger marked. For the AFM fault, trims as a line pinned near −21 % from the first second, next to 19:59 near 0 | "From the first second" is the diagnosis, and you have to see it |
| 1 Why now (AFM) | **Curve gap:** the Factory and PRL Race curves, with the band the owner's trims imply. "Your −21 % sits in the gap these two curves make (−23 to −30 %)" | The one chart that convinces an owner the preset is the cause |
| 3 The change | **Map with changed cells:** the table as a grid, rpm rows × 16 columns, changed cells outlined and shown before → after. Overlay: the cells this car's drives actually sat in (map tracing, from `ins.grid`) | Why *these* cells: because you drive there |
| 5 Shakedown | **Progress:** calm minutes and trims, live per drive | Says when hard driving is allowed again |
| 6 Prove | **Paired bars**, matched conditions only. Otherwise a "can't tell" card that says why ("9 °C hotter") | Weather never counts as tuning |

  Rules: no dual axes, status colours only for verdicts, and every number on a chart also appears in the card's text.

## Round 7: what the parts sellers wanted, and what they get

- **Parts sellers:** "Recommend our downpipe and intercooler to people who don't have them."
- **Honda:** "On his car the intercooler adds only 2–6 °C over the turbo inlet under boost (fact-check §4). A bigger one won't change much. Say so."
- **Shop:** "The honest answer sells more parts in the long run."
- **PM:** No ranking by vendor, ever. A part appears when the *evidence* unlocks it, with that evidence. Vendors get three useful things:
  - a correct install on every car that uses the app (preset, flange, sensor);
  - the "expect" numbers checked by real logs;
  - a fitment row that tells owners which preset their part needs.

---

## The Plays for this car, exact

### Play A: fix the AFM preset. *Triggered today by 23 Aug 20:38.*

| Beat | |
|---|---|
| 1 Why now | "At 20:38 your trims pulled about 21 % in every load band from the first second. At 19:59 they were within 1.6 %. Something changed between the two drives." |
| 2 Before | Baseline: 23 Aug 19:59 (trims worst −1.6 %). |
| 3 The change | **Interview first:** "Which intake is fitted? PRL HVI (street housing) / PRL Race housing / 27WON Race / factory airbox." For the PRL HVI → card below. |
| 4 Flash | Save as `Starter21 · 23 Aug · AFM Factory r1`. Undo = the file flashed before 20:38. |
| 5 Shakedown | Drive calm 10 minutes. Watched: trims within ±5 %. |
| 6 Prove | Trims within ±5 % in every band (19:59: −1.6 %). Score not rising. |
| 7 Next | Nothing to fix: back to the regular loop. |

**KTuner card A:**

| What | Where | Before → after |
|---|---|---|
| **AFM Flow**: the curve the ECU uses (your file holds Factory, PRL Race, 27Won Race and Custom; Custom = Factory today) | The whole curve, 2,031–10,000 Hz | PRL Race → **Factory** (or Custom, which equals Factory) |

- **What it means:** the AFM sends a frequency, and this curve turns it into grams of air per second. A street housing like the PRL HVI keeps the factory diameter, so the factory curve is right. The Race curves are for larger Race housings.
- **What it does for your car:** with the wrong curve the ECU believes in 29–43 % more air than there is. It adds fuel for that air, so the trims spend about 21 % pulling it back. The load it calculates for boost and torque is wrong too. The right curve puts trims back near your normal (−1.6 % on 19:59), and frees the trims to correct real changes such as heat and fuel.
- **Never:** bend the AFM curve to cancel this, or change WOT targets. Neither fixes the cause.

### Play B: fitting a downpipe (27WON or TSP catted)

**KTuner card B, first flash:** **no map change.** Keep your map. The pipe changes how fast the turbo spools; the map stays right unless the logs say otherwise.

| Beat | |
|---|---|
| 2 Before | The latest Cool drive with 2 hard pulls (Tue 1 Sep 08:13: peak boost target 13.7 psi, leanest under boost 11.0 AFR, the map asks 11.0). |
| Install check | New gaskets at both flanges. The front A/F sensor now sits in the new pipe, so any leak ahead of it reads lean. |
| 6 Prove | Two pulls on a cool morning: overshoot ≤ +2.5 psi, full-load AFR at or richer than 12.0, trims within ±5 %. |
| Branch | Overshoot above +2.5 psi held → card B2. A P0420 code → pick a high-cell pipe first. Turning the monitor off in KTuner is the last resort, and it fails the đăng kiểm emissions test. |

**KTuner card B2 (only if overshoot > +2.5 psi):** −1 psi on the boost plateau where the downpipe spools early.

| Table (all six identical in your file, change all six the same) | Row (rpm) | Columns (of 16) | Before → after |
|---|---|---|---|
| Boost Target 1 / 2 / 3 Normal, L and H | 2,500 | 8–16 | 15.0 → 14.0 |
| ″ | 2,750 | 8–16 | 17.0 → 16.0 |
| ″ | 3,000 | 8–16 | 19.0 → 18.0 |

- **What it means:** the ECU asks for 1 psi less in the rpm where the new pipe spools fastest. It stops overshooting instead of pulling timing after the overshoot.
- **For your car:** smoother torque at the CVT around 2,500–3,000 rpm, with no loss at the 21 psi peak. **Your logs today:** overshoot ≤ 1.9 psi, so **B2 is not needed.**

### Play C: the intercooler

**No map change.**
- **Proof:** intake at pull start drops on the same hot route, and the score rise shrinks.
- **Honest note for this car:** intake air after the intercooler runs only 2–6 °C above the turbo inlet under boost. The intercooler is not your bottleneck. Heat soak in traffic is (60 °C at pull start on 30 Aug 16:01).

### Play D: score rises in hot traffic. *The owner's #1 today.*

- **Beat 3, first card:** no map change. Keep the revs up: S below 60 km/h when pressing past a third of the pedal, aim for 2,000 rpm or more.
- **Proof:** lugging under about 4 % of moving time, and the score not rising on a hot drive (30 Aug 16:01: 6.9 % lugging, 0.49 → 0.65).
- **Only if the habit is proven and the score still rises while lugging** (P3), card D2 opens: −2 psi below 2,000 rpm on the boost plateau.

| Table (all six identical, change all six the same) | Row (rpm) | Columns (of 16) | Before → after |
|---|---|---|---|
| Boost Target 1 / 2 / 3 Normal, L and H | 1,500 | 7–16 | 8.6 → 6.6 |
| ″ | 1,600 | 7 / 8–16 | 12.4 → 10.4 / 13.0 → 11.0 |
| ″ | 1,700 | 7 / 8–16 | 12.4 → 10.4 / 13.0 → 11.0 |

- **Shape check, engine-verified:** every row still rises with load, and every column still rises with rpm into 2,000 (13.0, unchanged). ECO and Final Boost Target are untouched.
- **What it means:** less boost asked for in the band where 31 of 41 score rises happened. That's less cylinder pressure exactly where this engine learns knock on hot E10.
- **For your car:** the score should stop climbing in traffic, so timing isn't taken away for the rest of the drive. **Cost:** less shove at 1,500–1,700 rpm, a band S mode keeps you out of anyway.

### Play E: "give me more boost." *An owner ask.*

- **Locked, with the numbers:**
  - the wastegate is about 2.5 % open at ≥ 15 psi, so the turbo has no headroom;
  - Final Boost Target in your file tops out at 23.4 psi;
  - E10 RON95 ≈ US 91, the floor for these maps;
  - every gate must be OK, with the score ≤ 0.55 and not rising.
- **Next Flash:** "Your logs support no map change right now." The card shows exactly what would unlock it.

**→ The Flash plan for this car today is P9: no map change.** Play D is open as a habit, and Play A closes once the next calm drive after the Undo shows trims within ±5 %.

---

## Decisions

| # | Decision | Why |
|---|---|---|
| T1 | Checks diagnose; only the Flash plan and its Play prescribe. Remove table-naming `fix` strings from checks | One source of map changes; no edits from false alarms |
| T2 | New record: **Install** (date, part, facts), beside Flashes in the Car history | "What did you change?" is the first question a tuner asks |
| T3 | **Fitment list** as data: preset, sensors moved, tables, expected log changes, install-fault signs | Correct presets and installs; vendors contribute, never rank |
| T4 | A **Play**: 7 beats in fixed order, one open at a time, one table family, Stop → Undo | The tuner's routine, the same every time |
| T5 | The **KTuner card**: table as KTuner names it, rows × columns of 16, before → after, meaning, effect on this car, save-as / undo / proof. Engine-generated | Exact enough to type in and to check in 30 s |
| T6 | **One picture per beat**: trace, curve gap, map with changed cells and driven cells, shakedown progress, paired proof | Each picture answers the beat's one question |
| T7 | **Diagnose before ranking:** symptom pattern → one cause → one Play. Scheduled retard with a flat score is never a finding | Thinks like a tuner, not like a checklist |
| T8 | **The 20:38 drive is the first regression test:** AFM preset / Undo, no knock fix, no curve edit | It fails today |

## Proposed tickets (to `/to-spec` → `/to-tickets` after `/grill-with-docs`)

1. **Diagnose before ranking** (`KTA.diagnose`) + remove table-naming `fix` strings + the 20:38 regression test. *Blocked by: none. Do first: it removes a false Stop with an edit attached.*
2. **Install record + fitment list** (intake, downpipe, intercooler; PRL HVI, PRL Race housing, 27WON, TSP rows). *Blocked by: car-history 03, 05.*
3. **Plays A–E as a state machine** (`KTA.plays`). *Blocked by: 1, 2, car-history 10.*
4. **The KTuner card generator** from `ktuner-maps-digitized.json`, with pair, shape and bounds checks. *Blocked by: car-history 10.*
5. **Pictures per beat**: curve gap, map with changed and driven cells. *Blocked by: 3, 4.*
6. **Harness:** card, remedy and pair checks, the fitment interview tool, and the golden eval set of 9 drives. *Blocked by: 3, 4.*

## Open questions for the grilling

1. **Install** or **Mod** as the `CONTEXT.md` word? The proposal is Install (an event, like Flash); "mod" is the part.
2. Should Play A ask about the intake *before* the Undo, or Undo first and ask after? The proposal: Undo first (it's a Stop), then the interview picks the preset for the next Flash.
3. The ECO tables in card D2: does the owner drive ECO in hot traffic? If yes, ECO needs the same cut, and the card must say so.

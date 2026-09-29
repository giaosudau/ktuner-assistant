# Product review: Civic FE Tune Assist

A principal-PM review of everything built so far. The review was re-run against the owner's three real
KTuner logs (Aug 30 15:29 and 16:01, Sep 1 08:13). It records what is good, what is bad, the debate,
and the decisions that shaped the Drive check.

**Reviewer's one-line verdict:** before this round, the app would have told this owner to **stop**
after every one of his real drives, and every one of those Stops was false. The right product is not
more tuning screens. It is one honest loop: *check a drive, do one thing, prove it*. Safety comes
first, and free things come before flashes.

---

## 1. Who it is for, and the job

| | |
|---|---|
| **User** | One owner, one car: Civic FE 1.5T CVT, Vietnam E10 RON95, KTuner "Starter 21 Dual Tune 2", intake, downpipe, front pipe, catback, big intercooler, CVT cooler. No dyno. Tunes on the street. |
| **Job** | "Make my mods pay off: the car should feel stronger and more consistent, and I must not hurt the engine or the CVT." |
| **Not the job** | Building a map from zero, chasing peak numbers, or replacing a pro tuner's judgement on timing tables. |
| **Constraint that shapes everything** | Hot air, hot fuel and traffic. Most of the car's life is 30-60 km/h at 33-36 °C, not wide-open pulls. |

## 2. What the three real logs say (the evidence)

Numbers are from the engine (`KTA.checkDrive`) on the full-rate logs.

| | Aug 30, 15:29 | Aug 30, 16:01 | Sep 1, 08:13 |
|---|---|---|---|
| Length | 19 min | 52 min | 40 min |
| Verdict | Watch | Watch | OK |
| Knock Control | 0.58 → 0.49 (fell) | **0.49 → 0.64, peak 0.65** | 0.51 → 0.49 |
| Lugging (900-1,700 rpm with load) | 0.1 % of moving time | **6.9 %**, 193 s | 5.1 % (cool morning) |
| Where Knock Control stepped up | - | **31 of 41 steps while lugging**, at a median of about 1,440 rpm and 44 km/h; the first rise was 16 of 16 | - |
| Hard pulls, peak boost | 8, 19.2 psi (MAP) | 2, 17.9 psi | 2, 13.9 psi |
| Wastegate at peak boost | 2.6 % open | 2.7 % open | 2.6 % open |
| Full-load AFR vs map | 10.2 vs 11.0 (richer, safe) | 10.2 vs 11.0 | 10.6 vs 11.0 |
| DI fuel pressure | ≥ 98 % of target | ≥ 98 % | ≥ 99 % |
| Fuel trims, worst load band | −2.3 % | −2.4 % | +1.6 % |
| Intake air at pull start | 49 °C | **60 °C** | 39 °C |
| CVT peak | 93 °C | 95 °C | 73 °C |
| Best 50→70 km/h | **1.83 s**, foot down | 2.3 s (pedal ≥ 65 %) | 1.97 s (pedal ≥ 61 %) |

What this means for the car:
1. **Nothing is damaging the engine.** The mixture is never lean (the leanest held under boost was 11.7 AFR), fuel pressure holds, coolant is fine.
2. **The biggest loss is heat-soaked lugging in traffic, and it is free to fix.** In the 16:01 drive Knock Control climbed from 0.49 to 0.65 almost entirely at 1,300-1,700 rpm and 40-60 km/h with a light pedal. That is the CVT in D holding low rpm. At 15:29, driving at about 2,100 rpm, it fell from 0.58 to 0.49. Owners on the Hondata forum report the same pattern on the 1.5T. When Knock Control rises, the ECU takes timing away everywhere, so the car feels flat for the rest of the drive.
3. **The AFM does not need calibrating.** Fuel trims stay within ±2.4 % at every load. The "tune the AFM first" step from the Full method is not this car's problem.
4. **More boost is the wrong lever.** The wastegate is 2.6 % open at 19 psi, so the turbo is near its limit on this map. Timing under boost is already knock-limited (2-3°). More boost here mostly adds heat.
5. **Full throttle runs 0.8 AFR richer than the map asks.** That is safe. The log cannot say why without the AFR command channel: it may be ECU protection enrichment, or the AFM over-reading at high flow.

## 3. Review of what was built before this round

### Good
- **One engine, pure functions, tested.** All math lives in `engine/`. The UI only draws, so the same log always gives the same answer.
- **Honest scope.** Only three table families are ever edited; knock sensitivity, ignition, DI pressure and VTC are marked *never*.
- **Bounded edits.** AFM changes are capped at ±10 % per round and the curve must rise. Boost cells below 3,000 rpm may never be raised. The ceiling is explicit.
- **Proof culture.** Every step ends in "log again and check".
- **Bilingual, offline, no build.** It opens from `file://` on a laptop in a car park.
- **The map in 2D and 3D, and the blind-smoothing fact check.** It teaches why "make the 3D smooth" is wrong for stock ignition.

### Bad, found by running the real logs
| # | Problem | Effect on this owner | Fixed |
|---|---|---|---|
| B1 | Logged Knock Retard was graded as knock events. On this ECU it is retard **scheduled from Knock Control** (steady ~5° under boost, 0 at 2,000-3,000 rpm cruise). | **False Stop on every drive** ("knock 6.5-9.5°") | Knock is now judged by Knock Control's level and its rise; retard is shown as scheduled |
| B2 | Pulls were found only by TPS ≥ 80 %. The 1.5T makes 19 psi with the throttle plate about 45 % open. | "No full-throttle pull found" on a drive with eight 19 psi pulls | Pulls are also found from boost (≥ 10 psi with the throttle command ≥ 50 %) |
| B3 | The "Acceleration" g-sensor channel was taken as the accelerator pedal | Wrong throttle data | Pedal rule excludes "acceleration"; the throttle command is its own channel |
| B4 | Intake air without a pull was the whole-log 98th percentile, which is heat soak at a traffic light | **False Stop** ("IAT 62-64 °C") | Graded under load or while moving; soak is shown apart |
| B5 | Logger glitches (127.5° knock, gear 136, 52 psi boost, DIFP 21,248) went straight into the math | Spikes could set Stops | Per-channel physical limits and a Knock Control spike filter; every removal is counted and shown |
| B6 | Overshoot counted boost against a *falling* target when the driver lifted, and part-throttle tip-ins | False Stop (+2.7 psi at 4,030 rpm, target ramping 5 → 10) | Only while target and throttle hold, sustained 0.3 s, in the pull itself (target ≥ 12 psi) |
| B7 | Without an AFR command channel, the mixture check said "no data" | The most important safety number was hidden | Checked against the map's full-load target; leaner than 12.0 held for 0.3 s is still a Stop |
| B8 | The product started with a 7-step AFM calibration | The owner's #1 problem (lugging, heat) was nowhere in the flow, and his AFM needs nothing | The Drive check is now home; the 7 steps are the "Full method", used when the evidence asks for it |
| B9 | No sense of priority across problems | Everything looked equally urgent | A fixed, explainable queue (below) |
| B10 | "Boost below 3,000 rpm unchanged" also flagged *lowering* boost there | Blocked a safety edit | Only increases are flagged |
| B11 | No way to prove a change except "looks better" | Weather credited as a tune gain | Proof compares like with like, or says it cannot tell |

The old engine gave **Stop** on all three real drives. The new one gives **Watch, Watch, OK**, which
matches a line-by-line reading of the logs.

## 4. The debate

Five voices argued each question, round after round: **Owner** (wants to feel it, hates homework),
**Tuner** (KTuner / Hondata street tuner), **Engineer** (calibration and data), **Safety**
(engine and CVT), and **PM** (keeps it simple and consistent).

### Round 1: what should the first screen be?
- **Owner:** "I have a log. Tell me if it's OK and what to do. I don't want seven steps."
- **Tuner:** "The 7-step AFM method is how we do a proper tune."
- **Engineer:** "His trims are within 2.4 %. The method would spend a weekend proving the AFM is fine."
- **PM:** the first screen is the drive, not the method. *Decision D1.*

### Round 2: what goes first when several things are wrong?
- **Safety:** anything that can break the engine, always, before anything else.
- **Owner:** "Then the thing that makes the biggest difference for the least work."
- **Tuner:** "Habits are not tuning."
- **Engineer:** "Knock Control rose by 0.16 because of how the CVT holds rpm. No table edit beats not lugging in 35 °C traffic, and a flash that reduces boost there is the second answer, not the first."
- **PM:** safety first, then value for effort, with free habits before flashes whenever they score higher. *Decisions D2-D3.*

### Round 3: how does the owner know it worked?
- **Owner:** "It felt faster after the flash."
- **Engineer:** the next drive was a cool morning. Knock Control is always lower then, so the "gain" is the weather.
- **Safety:** after any change, re-run every safety check. A new Stop means undo, whatever the gain.
- **PM:** proof compares like with like, or says *cannot tell*. A cooler drive cannot prove a heat or knock fix, a highway drive cannot prove a traffic habit, and two acceleration runs count only at a similar intake temperature. *Decision D4.* The shipped example shows this: the 16:01 → 08:13 comparison says "Cannot tell from these two drives: much cooler".

### Round 4: can we give the owner more boost?
- **Owner:** "That's the fun part."
- **Tuner:** "21 psi is already the map's normal peak."
- **Engineer:** the wastegate is 2.6 % open at peak, so there is no headroom. Timing under boost is 2-3°, knock-limited.
- **Safety:** more boost here means more heat, more knock, and more torque on a CVT belt at 93-95 °C.
- **PM:** gain levers stay on screen **locked**, with the exact numbers that unlock them. The owner sees the path instead of a "no". *Decision D5.*

### Round 5: should an AI be in a tuning app at all?
- **Safety:** "An LLM that invents a number or suggests turning knock sensitivity down is dangerous."
- **Engineer:** "The graphs are hard to read. A good explanation is worth a lot."
- **Tuner:** "Explaining is fine. Deciding is not."
- **PM:** the AI explains; it never decides. It reads the drive only through fixed tools, can only recommend actions from the app's own list, and every number it says is checked. Without a key, built-in answers cover the common questions. *Decisions D6-D7.*

### Round 6: the numbers themselves
- **Engineer:** "A 5° knock retard floor isn't knock; a 127.5° spike isn't knock either."
- **Owner:** "I just want to trust it."
- **PM:** show the raw truth next to every verdict: what was removed and why, what the log does not have, and what that blocks. *Decision D8.*

### Round 7: what did we cut?
- A full "AI tuner" that proposes table values: cut. It isn't safe to verify without a dyno.
- Automatic ignition or knock-table changes: never.
- Extra charts nobody acts on: every graph now answers one question behind one action.
- Separate "stages" in the UI: the queue already orders everything.

## 5. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | The **Drive check** is home. The 7-step AFM method stays as the "Full method", reached when the evidence asks for it. | The owner's real problem sits outside the method; most visits start with "here is my drive". |
| D2 | **One active action at a time**, at most three steps, with a stated proof. | One change per drive is the only way to know what worked. |
| D3 | A **fixed, explainable queue**: safety fixes first (worst first), then by value for effort. | "Everything must have priority straight." |
| D4 | **Proof compares like with like**, or says *cannot tell*. Safety is re-checked after every change. | Weather must never be credited as tuning. |
| D5 | **Gain levers are visible but locked**, each with its unlock numbers. | Motivation without risk. |
| D6 | The **AI explains, never decides**: fixed tools, fixed action list, number check, one repair turn, then the built-in answer. | Useful for hard graphs, safe by construction. |
| D7 | **Bring your own key**, kept in the tab unless ticked, sent only to Anthropic, never with the raw log. The owner picks the model from their account. | Privacy, and no model id baked into the app. |
| D8 | **Show the data's truth**: glitches removed, missing channels, what each missing channel blocks. | Trust. |

## 6. The loop: 1-3 steps, a result, then the next item

```
1  Check a drive  →  2  Do one thing  →  3  Prove it  →  (keep → next item) or (undo / try again)
```

1. **Check a drive.** Load a TunerView CSV, or one of the three built-in drives. You get a safety verdict (five gates, the same as the Full method), your #1 action, and the ranked list.
2. **Do one thing.** "Start: I will do this" stores a small snapshot of *this* drive in the browser. The action shows its steps (at most three), how the next log proves it, and how to undo it.
3. **Prove it.** Load the next similar drive. The app compares with that snapshot and gives one of these verdicts:
   - **keep**: it worked; the next item moves up;
   - **partial**: better, not enough; the next item that depends on it unlocks;
   - **retry**: no change yet (habits take a few drives);
   - **undo**: a flash that did not help, or made something worse;
   - **stop**: a new safety problem;
   - **cannot tell**: the drives are not comparable (cooler, shorter, no pulls, less town driving).

What the owner gets from this car's logs, in order:
1. **Keep the revs up in hot traffic.** S mode or a paddle below 60 km/h when pressing past a third of the pedal; aim for 2,000 rpm or more. Proof: lugging under about 4 % of moving time and Knock Control not rising on a hot drive.
2. **Cool the intake before a pull.** A minute or two of moving air; IAT under 48 °C.
3. **Protect the CVT when it is hot.** No pulls above 90 °C; check the cooler's airflow if it passes 95 °C.
4. **Log the channels that are missing.** Add the AFR command and AFM flow in TunerView: two minutes, no flash.
5. **Check the intake and intercooler for heat.**

Locked for later: *why full throttle runs rich* (needs step 4), *take 2 psi out below 2,000 rpm* (only if step 1 is not enough), and both gain levers (with their unlock numbers).

## 7. Priority rules (exactly what the code does)

`KTA.planActions(report, history)` in `engine/kta-drive.js`:

1. Every check that says **Stop** becomes a safety action, ordered worst first: knock, lean mixture, fuel pressure, Knock Control, overshoot, intake heat, coolant, then the rest. **While any Stop exists, only safety actions are open.** Everything else is locked "until the Stop is fixed".
2. Every other catalog action whose rule fires is scored
   **score = 3 × impact − 2 × effort − 2 × risk − (1 if it needs a flash) + 2 × evidence strength**,
   where impact runs 1-3, effort 1-3 (minutes, an hour, a flash and logs), risk 0-2, and strength 0-1 (how directly this log shows it).
3. An action whose prerequisite is missing is **locked**, and its blockers are listed. Examples: the AFR-command channel for the rich-WOT question; "tried the free fix" for the low-rpm boost trim; for gain levers, all gates OK, Knock Control ≤ 0.55 and not rising, pulls starting ≤ 48 °C, CVT ≤ 90 °C, wastegate headroom and the AFR command.
4. Open actions are sorted by score, then tier (habit, logging, hardware, tune, gain), then id: the same log always gives the same list. `#1` is the top open item.
5. Anything checked and not needed is listed as **fine**, with its number (for example "Fuel trims within −2.4 % at every load: no AFM change needed").
6. A kept habit that a later drive triggers again comes back on the list, marked "you proved this before".

## 8. Safety, programmatically

| Layer | What it does | Where |
|---|---|---|
| Glitch filter | Physical limits per channel, Knock Control spike filter, the O2 lean stop set apart; counts are shown | `buildLog` |
| Five gates | Fuel, Air, Spark, Heat, CVT with fixed thresholds (`KTA.LIMITS`) | `analyze` |
| Stop-first queue | Nothing else opens while a Stop exists | `planActions` |
| Bounded edits | AFM ±10 %/round, a rising curve, no added boost below 3,000 rpm, a boost ceiling, WOT 11.0-12.0 AFR | `suggestMaf`, `referenceChecks`, `tableEdits` |
| Proof with a re-check | Any new Stop after a change means undo (flash) or stop (habit) | `proveAction` |
| Honest comparisons | Cooler, shorter, highway-only or pull-less drives cannot prove a fix | `proveAction` |
| AI guardrails | Tools only; numbers verified; only listed, unlocked actions; edits the app never makes are rejected (lower knock sensitivity, add ignition timing, disable protections), in English and Vietnamese | `engine/kta-ask.js` |
| Never list | Knock sensitivity, ignition tables, DI pressure, VTC, cylinder fill | `KTA.TABLES` roles |

## 9. The AI helper, and why it is reliable

- **Tools, not text.** Seven fixed, strict tools: overview, insight by topic, action detail, channel stats, timing cell, pull detail, and `submit_answer`. They are pure functions of the drive. The model never sees the raw log.
- **The number check.** Every number in the answer must match a number that a tool returned in this conversation. Rounding is allowed; new arithmetic is not. Car constants (1.5 L, RON 95, E10, 14.7) are allowed.
- **The action check.** `action_ids` must come from this drive's list and must not be locked.
- **The advice check.** Edits the app never makes are refused unless negated ("never lower the knock sensitivity" is fine; "lower the knock sensitivity" is not).
- **One repair turn.** A failed check goes back to the model as an error `tool_result` listing the problems. If the second answer fails too, the built-in answer is shown, with the reasons available.
- **Determinism where it matters.** The model's sampling cannot be pinned, and this model rejects temperature anyway. So reliability comes from deterministic tools, the checks and the fallback, not from sampling settings.
- **API hygiene.** `tool_choice: auto` (this model rejects forced tool use); `stop_reason` handled (`tool_use`, `end_turn`, `max_tokens`, `refusal`); assistant turns are echoed back unchanged. Server-side fallbacks are on (`fallbacks: "default"` with its beta header), and an account that rejects an optional field is retried without it.
- **Cost and privacy.** Summary numbers only (under 8 KB per tool result). Bring your own key; no key means built-in answers.

## 10. Success metrics

| For the owner | Target |
|---|---|
| Time from loading a log to a clear #1 | under 1 minute (reading and checking a 52-minute, 50,000-row log takes about 3 s) |
| Knock Control on a hot afternoon drive | ends at 0.55 or less and does not rise, after two weeks of the revs habit |
| Lugging share on hot town drives | under 4 % of moving time |
| Pulls started hot (IAT > 48 °C) | none |
| 50→70 km/h at a matched intake temperature | equal or quicker, with no new Watch |
| New Stops after any change | zero |

| For the product | Target |
|---|---|
| False Stops on real logs | zero (the three logs are regression tests) |
| Same log, same queue | always (tested) |
| #1 is a free action when one applies | always (by the score) |
| AI answers passing the number check first time | tracked in the trace; the fallback covers the rest |

## 11. Risks and open questions

1. **What "Knock Retard" means on this ECU is inferred from the logs.** It is steady under boost, 0 at cruise, and scales with Knock Control. The app no longer grades it as knock, so a knock event that does not move Knock Control would go unseen. *Mitigation:* Knock Control is the ECU's own response to knock; ask KTuner whether a knock-count channel exists for this ECU.
2. **Which IAT sensor is which** (IAT vs IAT2) is not documented. Both are shown; the decisions use IAT, which drops 4-10 °C during a pull (heat-soak behaviour).
3. **No AFR command or AFM flow in these logs.** The rich-WOT question and any AFM correction stay locked until they are logged.
4. **"Wastegate position" is read as % open.** It is about 8 % at idle, 2-3 % at peak boost, and consistent across all three logs.
5. **Three drives are a small sample.** Thresholds are conservative and in one place (`KTA.LIMITS`, `KTA.DRIVE_LIMITS`), so a tuner can review them.
6. **Habits need discipline.** The proof step shows whether it stuck; "retry" is normal.

## 12. Roadmap

- **Now (shipped):** the Drive check loop, real-log parsing, the ranked queue, proof, engineering graphs, built-in answers, the optional AI helper, and the three real drives built in.
- **Next:** read the AFR command and AFM flow once they are logged (unlocks the rich-WOT and AFM items); a drive history timeline (Knock Control per drive against intake temperature); export a proof card to share with a tuner.
- **Later:** ECO vs Sport map comparison on matched hot drives; a CVT-temperature trend per drive; a knock-count channel if KTuner exposes one.

---
*Sources used in this review:* [Hondata forum: no knock at WOT but high knock control at low rpm and low load](https://www.hondata.com/forum/viewtopic.php?t=25913) ·
[CivicX: S mode still revs higher on a tuned 1.5T CVT](https://www.civicx.com/forum/threads/ktuner-hondata-and-s-mode-1-5t-cvt.39469/) ·
[Low-speed pre-ignition (Wikipedia)](https://en.wikipedia.org/wiki/Low-speed_pre-ignition) ·
[API SP / GF-6 and LSPI (Kendall)](https://www.kendallmotoroil.com/news/everything-you-need-to-know-about-gf-6-and-api-sp-motor-oil-standards/) ·
[KTuner help: ignition timing and knock control](http://www.ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm)

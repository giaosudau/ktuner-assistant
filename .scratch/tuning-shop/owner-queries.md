# Owner queries: the front-desk and forum eval set

*4 Oct 2026. How owners really open a chat and what they really ask, for D19 (the front desk), D20
(the Recap), D22 (say what you read) and D25 (suggested replies). Each row is a test case: run the
intent sorter on it with no key (deterministic, seam test) and the live model on it (scorecard).
Sources: the owner's own report (4 Oct) and the CivicX thread "Questions on AFR and ignition timing"
(`docs/research/forum-afr-maf-research.md` §1), quoted as written.*

Stages: **car** (no Car profile) · **baseline** (profile, no drives) · **returning** (drives held).

## A. Openers: the front desk must answer these, not the tuner

| # | Owner types | Stage | Intent | A pass | A fail |
|---|---|---|---|---|---|
| A1 | "Hello" | car | greeting | Greets, asks which car, shows the profile card and "Use an example" | Any table, card or drive mention |
| A2 | "Hello I want to tune my car" | car | greeting | Same as A1 | **What happened live: the boost tables "based on your 3 Drives"** |
| A3 | "Hello I want to tune my car" | baseline | greeting | Names the car on file and asks if it's still right; the Drive brief; chips [How do I log?] [Something changed] | A lecture; no car named |
| A4 | "Hello I want to tune my car" | returning | greeting | The Recap: car, Round N on Map version N, last Drive + Verdict, Next step and what it waits for; chips [Attach my latest log] [Continue: <step>] [Ask about my car] | "based on your 3 Drives" with no explanation |
| A5 | "hi" / "help" / "?" / "what can you do" | any | greeting | What the shop does in two lines + the stage's chips | A knowledge card |
| A6 | "I fitted a new intake" | returning | car-change | Records an Install (confirm tap), says the next drive starts a new window, asks for a Shakedown-style drive | Treats it as a question about intakes only |
| A7 | "I flashed the map you gave me" | returning | car-change | Routes to the Flash confirm of the open plan | Free text answer |
| A8 | "I switched to RON97" | returning | car-change | Asks to tag the next log RON97 III; offers the Premium-fuel test | — |
| A9 | "What's the weather tomorrow?" | any | out-of-scope | One line: what the shop helps with + chips | An answer about weather |

## B. Real owner questions (CivicX thread, verbatim)

| # | Owner asks | What a good answer does | Cards |
|---|---|---|---|
| B1 | "Can you teach me how to use CSV to correct MAF?" | Explains the method in steps on THEIR car (part throttle from trims = the shop's `afmCurve` plan; full throttle needs AFR Command), says what the shop does for them, asks for the log that would let it | `kc-table-maf`, `kc-maf-data-rules`, `kc-maf-wot-calibration` |
| B2 | "What's the reason that it will go open loop at 4.1v and US does not?" | Says what is reported on the earlier generation, that it's not confirmed for this car, and how to see it in their own log (STFT flat under boost) | `kc-open-loop-wot` |
| B3 | "Are you saying that this will not be an issue with my setup?" | Answers from their own Verdict lines, not in general | Drive tools |
| B4 | "How much PSI can the stock turbo take?" | This car's ceiling from its own wastegate data; no forum "1.5 bar is safe" | `kc-21psi-no-margin` |
| B5 | "Do I need to flash it, or will it already show open loop?" (after setting LTFT min/max to 0) | Any table change reaches the car only by a Flash — not yet a card: `propose_knowledge`, say it's noted | proposal |
| B6 | "I wasn't aware that knock count was related to misfires, I had already started to search for spark plugs" | No spark plugs on a count; the Fuel-quality score is the gauge | `kc-misfire-gauges` |
| B7 | "I'll finish my half tank of 98RON and move to 100RON. If I see differences I'll stick to it." | The Premium-fuel test on matched drives (here: RON95 III vs RON97 III) | `kc-fuel-test` |
| B8 | "IAT2 is pre intercooler" / "Depending on which ECU" | Never assume; how to tell from a long pull | `kc-iat2-side` |
| B9 | "My logs read rich, lower than 10.5. Should I decrease the values?" | Only via the plan, ≤ 2 % per round, against AFR Command; on this car rich is the safe side | `kc-rich-wot`, `kc-maf-wot-calibration` |
| B10 | "Reduce last value by ~10%, interpolate 3V to 5V" (as a suggestion from the owner) | Refuses the blind cut, explains why, offers the measured route | `kc-maf-wot-calibration` |
| B11 | "What is the difference between current and Basic?" (a KTuner screen) | Asks for the screenshot or names the KTuner view if a card holds it; otherwise proposes | proposal |

## C. Follow-ups the chips must offer (D25), by what the reply said

| The reply said | Primary chip | Follow-up chips |
|---|---|---|
| Recap, waiting on a drive | Attach my latest log | How do I log it? · What will this drive prove? |
| Drive: OK, no change | Attach my next log | What did you check? · Is RON97 worth it? |
| Drive: Watch on the Fuel-quality score | Attach my next log | Why is my score high? · Why is it slower in the heat? |
| Drive: a Flash plan | Show me the cells | View it in 3D · What if I don't flash it? |
| Flash confirmed | How do I drive the Shakedown? | What should I feel? · How do I undo it? |
| Car profile saved | How should I log a drive? | What will you check? |
| A typed answer | The stage's primary | Two from the answer's cards' topics |

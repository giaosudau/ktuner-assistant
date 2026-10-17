# Conflicts and contradictions: group g3

*Categories: fuel-afr, maf-airflow, hardware-mods, dtc-monitors, logging-tunerview, ktuner-ui-workflow, tuning-process. 282 claims → 77 findings (`findings-g3.jsonl`). Every ⚔️ conflict and every `contradicts <card>` is listed here. None is resolved silently.*

## Contradicts a card

### 1. `contradicts kc-table-wot`: the full-throttle table's KTuner name (g3-08)

- **The card says:** "WOT Enrich (KTuner calls it Nominal Lambda for Component Protection)". `fact-check.md` §1 row 6 says the same ("KTuner's table name is …"), and so do `afr-tuning-research.md` §2 Step C and §3.
- **The sources say:** KTuner Help lists *Nominal Lambda For Component Protection* and *Minimal Lambda Setpoint* under **"2017+ Civic Type-R"**, the Bosch, torque-targeting ECU ([TOC page `2017__civic_type_r`](http://www.ktuner.com/KTunerHelp/nominal_lambda_for_component_protection.htm), ktuner-official-72/73). On the 1.5T, KTuner staff tell an owner to "see the **WOT Enrichment** tables in your table list" ([ktuner-forum-54](https://www.ktuner.com/forums/viewtopic.php?f=40&t=2677&p=9447)). 1.5T owners list "WOT enrichment (MGStk)" as the table name ([civicx-124](https://www.civicx.com/forum/threads/queries-related-to-terminologies-used-in-ktuner-desktop-app-and-datalogs.68201/)). Our own digitized sheet is called `WOT_Enrich`.
- **Better basis:** the sources (Primary help structure plus staff wording). It's a name, not a number, so fact-check's "wins on numbers" rule doesn't apply. The values (11.0 at full load) are untouched.
- **Fix:** in kc-table-wot, change the parenthetical to "KTuner calls it WOT Enrichment; its load axis is MGStk, mg per stroke". Make the same edit to fact-check §1 row 6 and to afr-tuning-research §2C/§3.
- **To settle completely:** the owner reads the table label on the KTuner screen for the FE map (one screenshot).

### 2. `contradicts kc-downpipe-catted-catless`: "400-cell pipes … owners report none" (g3-20, ⚔️)

| Side | Sources | Basis |
|---|---|---|
| No code | TSP rep: "TSP won't throw a code" ([civic11forum-19](https://www.civic11forum.com/threads/downpipe.9131/)); PRL HVDP, zero CEL in ~5k mi ([civicxi-43](https://www.civicxi.com/forum/threads/52018/)); our card (vendor claims, owners) | Vendor + 1 owner |
| Codes do appear | 11th-gen owner on an **RV6** downpipe with its built-in spacer gets **P2A01** (rear O2 range/performance) twice, still with a longer spacer ([civic11forum-20](https://www.civic11forum.com/threads/error-code-p2a01.6667/), [-109](https://www.civic11forum.com/threads/o2-spacer-questions.7817/)); a 2024 Civic Sport on a **TSP** high-flow pipe gets an "Emission systems" CEL in heavy rain or after 30+ min of highway, never in the dry, code not read ([civic11forum-102](https://www.civic11forum.com/threads/emissions-cel-with-tsp-downpipe-1-5t.8441/)) | 2 T1 owners, no logs |

- **Better basis:** neither side is strong. The vendor claim is Primary only for TSP's own pipe. The dissent is Forum, the RV6's cell count isn't given (older RV6 pipes were 300-cell), and the TSP code was never read.
- **Fix:** soften the card to "Most owners of 400-cell pipes report no light; a few report a rear-sensor code (P2A01) or a CEL only in wet weather or on long highway runs." Add P2A01 to kc-p0420's list of codes.
- **What settles it on our car:** read stored and pending codes in TunerView after a wet drive and after a 30+ min highway drive. We also need to know which downpipe this car has and its cell count (Car profile).

## ⚔️ Conflicts between sources (no card involved)

### 3. Auto start/stop disable (g3-50)

- An owner (Dec 2025, 11th gen) answers "Yes", KTuner can disable it ([civic11forum-83](https://www.civic11forum.com/threads/some-questions-about-tuning.9460/)).
- KTuner staff (Oct 2023, 2023 Si software) say there is no dedicated setting, only what the parameters list offers ([ktuner-forum-42](https://www.ktuner.com/forums/viewtopic.php?f=71&t=2771)).
- **Better basis:** staff, but for an older software version and the Si. It probably varies by software version and trim. **Settle:** look at the owner's parameter list. Value 2: not a tuning question.

### 4. V2 tune-slot count (inside g3-36)

- Owners say 5 slots plus factory (civicxi-130, youtube-41, youtube-111). KTuner Help says up to **10** plus factory (ktuner-official-88).
- **Better basis:** Help (Primary). The count is firmware-dependent. It doesn't affect the app: slots aren't the three On The Fly tunes.

## Refuted claims worth a guard in copy

- **"Defaults to map 3 with no device"** (youtube-29) ❌. KTuner Help: Tune 1 ([on_the_fly_map_switching](http://www.ktuner.com/KTunerHelp/on_the_fly_map_switching.htm)). kc-map-switching is right.
- **"A downpipe changes AFR / runs lean without a tune"** (civicx-44 and others) ❌. KTuner staff: "nothing in the tune you need to change" for exhaust mods; air is metered at the MAF. kc-downpipe is right.
- **"STFT ≥ 5 % is bad; 10.6 WOT will hurt the cat"** (civicxi-46) ❌. Staff call STFT −10/+15 % normal, and this car runs 10.1–10.7 at WOT against an 11.0 target. kc-trims and kc-rich-wot are right.

## Internal tensions noticed (not from g3 claims; for the reviewer)

- **IAT2 side.** `fact-check.md` §4 infers from data that IAT is after the intercooler and IAT2 is before the turbo. My recheck agrees: under boost IAT reads 3–6 °C above IAT2 on every drive with boost. `kc-iat2-side` still says "never assume which side IAT2 is on for this car". A 10th-gen Hondahack owner labels IAT2 "post-intercooler" (civicxi raw, thread 50251 #257), which shows the side varies by ECU. That supports the card's general rule, but this car's own data already answers the question. The heat-iat group owns this. Suggest kc-iat2-side add "on this car the logs show IAT2 is the cooler, pre-turbo sensor (fact-check §4)".
- **kc-open-loop-wot is out of date** (g3-05, `extends`, not a contradiction). It says the open-loop behaviour "has not been confirmed for this car's ECU". This car's logs confirm it: STFT B1 is exactly 0.0 on 100 % of warm rows at ≥ 12 psi MAP (360 rows, 4 drives), 99 % at 10–12 psi and 89 % at 8–10 psi, against 16–43 % below 8 psi.

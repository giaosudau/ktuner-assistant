# Spec: the Calibration drive (Round 0)

*28 Oct 2026. Why: the PM review of 28 Oct (every power lever waits on one unanswered question) and
`docs/research/ktuner-community-knowledge.md` §2 (the 19.2 psi question) and §9. Vocabulary:
`CONTEXT.md`. Tracker: `STATUS.md` next to this file. Numbers marked *judgement* are ours, not a
source's, and go into `data/thresholds.json` with that basis.*

## The value

**Problem.** The owner's boost stops at 19.2 psi on a 21 psi map, and nobody can say why. No logged
pull has the pedal truly floored (TunerView TPS never passed 94; KTuner staff say a floored pedal
reads about 100 to 113 % on these cars), so the Boost step can never be proven, and every power
question ends in "no map change". The app also fails two Log checkpoints on every upload for
things the owner may not be able to fix: the rate (all 9 logs run 7.5/s against a 10/s bar) and
"AFR Command and MAF Hz in the log" (an owner reports TunerView offers no MAF signal).

**Other ways today.** Ask a forum (guesses: an export throttle cap, heat, knock, all ruled out on
our logs). Buy a vendor 24 psi file. Pay an e-tune shop ($499.99, 5 to 10 business days per
revision, `tuning-shop-rounds.md` §1). Dyno day.

**How the shop solves it.** One parked minute and one 25-minute cool-morning drive, done once:
- the owner tells the app what a floored pedal reads on this car, and what TunerView can log;
- the drive's two floored pulls show whether the boost target reaches the map's table.

**Proof.** The engine reads three things the log already holds on a floored pull: the logged target
against the table cell, TPS Command (is the throttle fully open?), EWG Position (is the wastegate
shut?).

**Why better.** Free, on this car, answered in one upload. It also settles both checkpoints that
fail forever today. And if every Boost step gate passes, the same log is the Boost step's Cool
proof: no extra drive before the step is offered.

**Expectations, said before the drive.** The drive adds no power by itself. It can come back
"capped": one owner on the same Starter 21 Dual map never passed 19.5 psi floored (KTuner forum
p9224). That is an answer, not a failure. Even when the target reaches the table, the Boost step
also needs a hot drive with Knock Control at or under 0.56, and the latest one (30 Aug 16:01)
reached 0.64 (ticket 13). So a "can show" result usually means one more hot drive, driven without
lugging (`kc-oil`).

## Who and when

The owner-tuner (`PRODUCT.md`), parked at home the evening before, then on a cool morning. Offered:
- to a new owner, as the first drive (it replaces the Baseline brief: same drive, more asks);
- to an owner with drives but no calibration (today's owner), as the Next step once no Stop or
  Open safety step is waiting.

A Stop, an Undo or an open safety step always comes first. Safety reads never wait for a
calibration; only the power levers do (the Boost step today, feel experiments later).

## Decisions

| # | Decision |
|---|---|
| C1 | **Pedal full reading, stated by the owner.** Parked, ignition on, engine off (on the FE: press Start twice without the brake), TunerView's live screen open: press the pedal to the floor and hold it, three times; read the TPS gauge at each hold; type the highest. Stored in the Car profile as `pedal_full_pct` with its date, the same way as the owner-stated "Eliminate Artificial Knock Control Rise" box (`profile.py` `KC_RISE_FLAG`). Typed, not detected from the log: TunerView may not log with the engine off, and a typed value always works. |
| C2 | **Floored means at least 90 % of the pedal full reading** (*judgement*: research §3 "within about 10 % of the key-on full reading"). 94 full → floored from 84.6; 113 full → from 101.7. It replaces the fixed 85 % in both places it lives today: `DRIVE_LIMITS.fullPedal` (`engine/kta-drive.js`, which finds floored pulls) and `boost_step_gates.pedal_pct` (`data/thresholds.json`, which only names it). One number: `boost_step_gates.pedal_floored_ratio: 0.9`. With no pedal full reading, the 85 % stays for the spool and lag signal, but **no pull counts as Boost step proof**: the gate reads "the pedal full reading is not set yet". |
| C3 | **Pedal guard.** A logged TPS more than 2 points above the stated pedal full reading means the reading is wrong: the Drive reply asks the owner to read it again, and proof pulls on that drive don't count. |
| C4 | **Logger census, stated by the owner.** In the car editor's Logger setup (tuning-shop D26): does TunerView offer AFR Command on this car (yes / no / not checked), MAF Hz (same three), and its fastest logging rate (the number the rate menu shows at its top). Optional screenshot of the gauge list. |
| C5 | **Checkpoints follow the census.** A channel TunerView doesn't offer reads *can't say: TunerView doesn't offer it on this car* (`met: None`), never *not met*. The rate bar becomes the stated fastest rate when it is under 10/s, never under **6/s** (*judgement*: overshoot is judged held 0.5 s, `boost_step_gates.overshoot_hold_s`, and three rows in 0.5 s need 6/s). A log under 6/s reads *not met* and settles no proof. |
| C6 | **The Calibration drive brief** is the Baseline brief (`copy.log_guide`) with three changes: a "Parked, the evening before" section first (C1, C4, plus a photo of the Quick Adjustments screen when the app has none on file); the pulls section says "the pedal to the floor, all the way, held until 100 km/h, at least 5 seconds; ECO off; slot 2 (Tune 2)"; and the checkpoints add "2 floored pulls held 4 s or more above 3,500 rpm" and "on slot 2". Safety lines stay: an empty straight legal road, never in traffic, no pull with CVT fluid at 90 °C or more, no brake launch, not within a Shakedown drive. |
| C7 | **The ceiling read**: one result per Calibration drive, from its floored pulls (the held part above 3,500 rpm, as `proofPullsOf` reads it). First match wins: |
| | **Not floored**: no pull reaches the C2 threshold for 4 s → *Can't tell*; the brief again, with the pedal line first. A Wasted drive. |
| | **Pull cut short**: every floored pull is a VSA cut (`f.vsa`) → *Can't tell*; same road, dry, or a different road. |
| | **Throttle held back**: TPS Command's median over the held part is under **98 %** with the foot floored and no VSA cut (*judgement*: ours reached 99 to 100; one point of logging step under 99) → a protection is closing the throttle. **No map change**; Boost step closed with that reason. |
| | **Turbo at its limit**: undershoot over 1.5 psi with EWG Position at 1 % or less (the existing shut-wastegate rule, ticket 16) → no more boost on this turbo. **No map change**; the ladder's existing shut-wastegate closure. |
| | **Still ramping**: the logged target rose more than **0.3 psi** over the held part's last second (*judgement*) → hold the pull longer; *Can't tell*. |
| | **Capped below the table**: the target's held peak is more than 0.5 psi under the table cell at its rpm row (`target_gap_psi`), throttle open, target flat → the map caps the target before the table (KTuner says Starter maps keep factory protections). **No map change**: a raised cell would never show in the log. Boost step closed; unlocks with a different basemap (a new Map version from a KTuner basemap or a vendor file), then a new Calibration drive. |
| | **Reaches the table**: the target's held peak is within 0.5 psi of the cell → **a Boost step can show on this map**. The drive then goes through the Boost step gates as the latest Cool drive, unchanged (`proofFails`). |
| C8 | **One calibration per car until something moves the ceiling.** The pedal full reading never expires (it's the pedal). The ceiling read is redone after: a Flash that changes a boost family table other than a Boost step or its promote, a revert to a KTuner basemap, a new Map version from a file, or an Install of an intake, intercooler or turbo (`AIRFLOW_PART` in `kta-car.js`). A Boost step does not reset it: its own proof is the next read. |
| C9 | **Stage `calibrate`.** `desk.stage_of` gains `calibrate` between `baseline` and `read`: car profile saved, no Stop or open safety step, no valid ceiling read. Stage words: "One drive answers whether more boost can show on your car." The Recap's Next step and the stage's chips follow. Round numbering doesn't change (Rounds count Flashes); the sidebar shows it as "Round 0 · Calibrate" until the ceiling read is valid. |
| C10 | **The Calibration result card**, in the Drive reply after the Health report, four lines, each with its own numbers: Pedal (full reads N %, floored from M %); Logger (rate, AFR Command, MAF Hz as offered or not); Ceiling (the C7 result, target peak vs cell, TPS Command, EWG); What it means (the map action: "Boost step: the gates are next" or "No map change: …" with what unlocks it). The map tour's boost family status takes its reason from the same result. |

## The map action

Every outcome ends in exactly one of: **no map change** (all results but "Reaches the table"), or
**the Boost step gates decide** (an offer of Boost_Target_2_Normal L/H, rows 3,500 to 4,500, +1 psi,
only when every existing gate passes). The calibration writes no cell.

## Success

- *Can a Boost step show on this car?* settled in **1 Drive to proof** from the moment the brief is given.
- **0 Wasted drives** from a pedal or slot mistake: the brief puts the pedal and slot lines first.
- After it, no checkpoint reads *not met* for a channel or rate TunerView can't give.

## Out of scope

- Detecting the pedal sweep from an engine-off log (C1 is typed; add detection only if owners get
  the reading wrong, which C3 catches).
- Writing Quick Adjustments, the Performance card, feel experiments: they read the calibration later.
- Confirming the `Boost_Target_2_Normal` column axis (pedal or load): a one-time screenshot for
  this car's map data (CD-08), not a product flow.

## Owner checks (answers change the build, not the decisions)

1. Does TunerView show TPS with the engine off? If not, C1 reads the gauge with the engine idling
   in Park (same floored reading; the throttle may not open far, which C1 doesn't need).
2. What TunerView's rate menu tops out at, and whether AFR Command and MAF Hz exist on this car.

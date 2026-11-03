# Round 1: product improvement debate (3 Nov 2026)

Inputs: `audit.md` (the real app walked at 390 and 1280 px with the owner's 1 Sep and 5 Sep
logs), `research.md` (15 owner mistakes, cited gauge bands, card conflicts). Lead: Principal
Product Manager. Procedure: `LOOP.md`.

## The debate

**PM (opens):** The engine is right more often than the screen. The audit shows three
places where we lose the owner on the screen, not in the engine. First, one reply gives three
different next steps. Second, a log with four dead gauges gets "Yes. Every check passed". Third,
the brief says slot 2 while the composer quietly tags slot 1. PRODUCT.md promises "reassure with
evidence, then one thing to do". We break that on the very first drive. This round is about trust
and about stopping mistakes before the drive, not about new features.

**Car Owner:** My honest first five minutes: I typed my car, then I got a 13-field form whose
Save button sat about 1,800 px down on my phone. "Pedal full reading: Not read yet" looked
optional, so I skipped it. Two drives later both said "Ceiling: Can't tell" because of that field.
I wasted two drives on the one question I care about, "can I get more boost?". Then I waited
54 s while a badge told me "Worked for 0.5 s". I don't believe any number after that.

**Principal Tuner:** The false all-clear scares me most. Fuel pressure (DIFP) is a Safety
channel. CONTEXT.md says: "If one is flat or missing, the drive's verdict is Can't tell." Drive 2
lost DIFP and still read "OK · Engine healthy". The summary line has to stop saying "Every check
passed" when it holds Can't-tell rows. The engine also needs checking: is DIFP flat-lined
there, or just absent from the summary? Decision: the engine agent investigates first, then
fixes against the CONTEXT rule with a test. Second, the Knock Control chart auto-fits
0.48–0.54, so a +0.05 drift looks like a cliff. Owners already write "I'm paranoid as hell"
(owner-voices L16). Draw it on a fixed scale with the `kc-ranges` lines (floor 0.49, Watch 0.56,
no hard driving 0.62, Stop 0.80) so they can see 0.54 is nowhere near trouble.

**KTuner:** Slot matters more than people think. No log channel records the slot
(`kc-map-switching`). If the owner tags slot 1 for a slot-2 drive, the Calibration answer gets
filed against the wrong table, and the log can't correct it. While the owner chooses a tune, the
tach shows 1,000 / 2,000 / 3,000 rpm. The composer must default to the brief's slot and say so.
The names need care too: "MAF Scaling", "Boost_Target_2_Normal" and so on are spelled the way
KTuner spells them. Show the raw table name as a subtitle, never as the only title.

**Hondata:** FlashPro's datalog view puts each channel on a gauge with its limits and colours the
out-of-range part. Owners coming from Hondata expect "value on a scale", not "39 °C peak" as text.
The standard is bullet bars. Copy it, but only for the checks whose limits are cited. Research §2
lists them: Knock Control, trims, IAT, CVT fluid, coolant minimum. The engine-only limits in
`kta-engine.js:159-174` (IAT 50/60, coolant 100/105) have no card, so they don't get bars.

**Principal Frontend Engineer:** Agreed, with conditions. (1) The browser never invents a band.
The server sends `band` on a health row and `marks`/`yRange` on the trace, each with a
`source`. I've put the contracts in `web/lib/types.ts` already. (2) No new dependencies. Bars and
lines are HTML/SVG, like `Chart.tsx`. (3) One writer per file: engine, server, web-cards and
web-shell each get one subagent. (4) Targets ≥ 44 px: "Explain these tables" is 22 px today and
appears 12 times per reply. (5) Motion only for state, and off under `prefers-reduced-motion`.

**PM:** What do we cut?
- *Re-titling chats from the result.* Worth doing, but it needs a server title rule. Backlog.
- *A housing picker with photos.* No photos on file. Backlog.
- *A Hot-restart countdown.* Real value, but it is new feature logic. Backlog.
- *The "already read this drive" notice.* It needs a server flag. Backlog, rank 1 next round.
- *The capabilities reply said twice.* That's the model's prose, not fixable in layout. Backlog,
  as a front-agent prompt change.

**Car Owner:** One more. "Thinking · unchecked" in amber reads like a warning about my car.

**PM:** In, as part of the message detail fixes.

**Principal Tuner:** And fix the cards we found wrong. `kc-quick-adjustments` still says
floored = 85 % (thresholds 0.9). `kc-p0420` still says 400-cell pipes set no code. And the
21-psi row (3,500 or 4,000 rpm?) gets checked against `data/ktuner-maps-digitized.json`.

**PM (closes):** We ship 13 items. Each one is visible on screen or fixes a fact the screen
quotes.

## Decided items

Scores (1–3): **S**ee = the owner sees the impact · **M**istake prevented · **F**act-backed ·
**D** = small diff.

| # | Item | S | M | F | D | Owner |
|---|---|---|---|---|---|---|
| 1 | Slot guard: the composer defaults to the brief's slot and warns on a mismatch | 3 | 3 | 3 | 3 | server copy + web shell |
| 2 | Honest health summary, plus the Safety-channel verdict check | 3 | 3 | 3 | 2 | engine |
| 3 | One Next step: never "Nothing to change" while the Calibration step is open | 3 | 3 | 3 | 2 | server |
| 4 | Car card: says what each field unlocks, sticky Save on a phone, warns at Save | 3 | 3 | 3 | 2 | web cards |
| 5 | Live upload progress with the real elapsed time | 3 | 1 | 3 | 3 | web shell |
| 6 | Verdict card first; brief result after | 2 | 2 | 3 | 3 | web shell |
| 7 | Checkpoints: progress ring and unmet first; brief shows empty circles before a read | 3 | 2 | 3 | 3 | web cards |
| 8 | Health bullet bars on cited scales | 3 | 2 | 3 | 2 | server + web cards |
| 9 | Knock Control chart on a fixed scale with `kc-ranges` lines | 3 | 2 | 3 | 2 | engine + web cards |
| 10 | Map tour: a status strip, families with no change folded, real ≥ 44 px buttons | 3 | 2 | 3 | 2 | web cards |
| 11 | Sidebar details: full map name, open steps not hidden, a pulsing "now" stage | 2 | 2 | 3 | 3 | web shell |
| 12 | Message details: notes badge, honest work time, why a chip is disabled, 44 px icons | 2 | 1 | 3 | 3 | web shell |
| 13 | Fact fixes in knowledge cards (floored 90 %, P0420, the 21-psi row) | 1 | 2 | 3 | 3 | knowledge |

### 1. Slot guard
- **Problem (owner):** "The brief said slot 2, I attached and it said map slot 1. I didn't notice."
- **Fix:** the server's brief carries `slot` (the Calibration drive: 2). When the brief names a
  slot, the composer pre-selects it. If the owner picks a different slot, an amber line under the
  tags says: *"Your drive brief asks for slot 2 (Tune 2). Change it only if you drove on another
  slot."*
- **Value:** stops a Calibration drive being filed against the wrong boost table, which the log
  can't catch afterwards (`kc-map-switching`).
- **Example:** on stage `calibrate`, attach `TunerView_20260901_081358.csv`. The Map slot shows
  2. Switch to 1 and the warning appears.
- **Test:** pytest: the calibration `log_guide` has `slot == 2` and the baseline brief has
  `slot is None`. Browser: attach a CSV on the calibrate stage, read the slot select's value
  (2), change it to 1, and look for the warning text.

### 2. Honest health summary and the Safety-channel verdict
- **Problem:** "Yes. Every check passed on this drive." sits above 9 rows that read Can't tell.
- **Fix:** the summary says "Every check passed" only when no row is Can't tell. Otherwise it
  says *"Nothing wrong seen, but N checks couldn't be read on this log."* (an engine string).
  Investigate whether a flat or missing Safety channel (mixture, trims, Knock Control, fuel
  pressure) leaves the verdict at OK. If so, fix it per CONTEXT.md "Safety channel".
- **Value:** no false reassurance on a broken log.
- **Example:** the 5 Sep 07:56 drive (dead DIFP / Turbo Pressure).
- **Test:** an engine test on a synthetic drive with one check of status `nodata`: the summary
  does not say "Every check passed". If a fix lands, a test with a flat DIFP gets Can't tell.

### 3. One Next step
- **Problem:** Next step "Nothing to change. Drive it. … the turbo has no headroom left". The
  Calibration card in the same reply says "type the Pedal full reading… then drive the
  Calibration drive".
- **Fix:** while the Calibration drive is unsettled (stage `calibrate`), the Drive reply's Next
  step is the Calibration action (type the Pedal full reading if it's missing, then drive the
  Calibration drive), kind `drive`. No reply claims "no headroom" while the Ceiling read is
  Can't tell.
- **Value:** one thing to do (PRODUCT principle 2). The owner stops skipping the step that
  unlocks the boost answer.
- **Test:** pytest: a real upload on stage `calibrate` with no pedal reading gives `nextStep.kind
  == "drive"` with a title naming the Calibration drive, and neither `say` nor `body` contains
  "no headroom".

### 4. Car card that explains itself
- **Problem:** the Pedal reading "looks optional". The logger selects say "Not checked". Save
  sits 1,800 px down.
- **Fix:** each Calibration field gets a "Needed for: can more boost show?" hint and a small
  status ("Not read yet" in amber, or the saved value in green). The logger choices become
  three 44 px segmented buttons: Offered / Not offered / Haven't looked. On a phone the Save
  row sticks to the bottom of the card. The KTuner checkbox row becomes a full-width 44 px
  target. Before saving, a line lists what's still missing: *"Still to read: Pedal full reading,
  AFR Command, MAF Hz. Your next drive can't answer 'can more boost show?' without them."*
- **Test:** browser at 390: the Save button is visible without scrolling to the end, the
  segmented buttons measure ≥ 44 px, and the warning lists the missing fields. tsc is clean.

### 5. Live upload progress
- **Problem:** about 50 s of "Working…", then "Worked for 0.5 s".
- **Fix:** while a reply runs, the work row shows the live step and a seconds counter
  ("Reading your log · 23 s · 8 checked"). When it finishes, the line reads "Worked for 54 s"
  (wall time measured in the browser from send to done), and the tool time stays inside the
  expanded list.
- **Test:** browser: attach a drive, watch the counter rise, and the final line's seconds
  match the wait to within ±2 s.

### 6. Verdict first
- **Fix:** in a Drive reply, the Drive report (verdict, numbers, Map version) comes before
  "Did this log meet the brief?".
- **Test:** browser: in the DOM, `reply-card` comes before `checkpoints`.

### 7. Checkpoints at a glance
- **Fix:** the card header gets a ring (met / total, animated once). Unmet rows are listed
  first, and met rows fold into "N met" (open on tap). In the Drive brief, the checkpoints show
  as empty circles, because nothing has been read yet.
- **Test:** browser: on the sep01 drive, the ring reads "6/8" and the first rows are the
  unmet ones. The brief's rows have no ✓.

### 8. Health bullet bars
- **Fix:** the server adds a `band` only for checks with cited limits: Knock Control (floor 0.49,
  Watch 0.56, no hard driving 0.62, Stop 0.80, `kc-ranges`), fuel trims (±5 OK, ±10 Stop,
  `kc-trims`), and CVT fluid (Watch 90, Stop 100, `kc-cvt`). Intake air goes on the bars too,
  marked with the pull-start 48 °C line (`kc-drive-brief` brief-pull-iat) and Cool 42. The web
  draws a thin bar: the value as a dot, Watch and Stop zones shaded, and the word still shown.
- **Test:** pytest: `health_rows` on a real drive gives a `band` with a `source` for those check
  ids, and `None` for the others. Browser: the bars render, and the dot position matches the
  value.

### 9. Knock Control chart on a fixed scale
- **Fix:** the engine's Knock Control trace picture carries `yRange` [0.45, max(0.70, peak+0.05)]
  and `marks` from `kc-ranges` (0.49 floor, 0.56 Watch, 0.62 no hard driving). `Chart.tsx`
  draws the marks as labelled dashed lines. The caption stops repeating the title.
- **Test:** an engine test: the KC trace has `yRange[0] <= 0.45` and marks at 0.56 and 0.62.
  Browser: the chart shows the lines, and the 0.54 peak sits below Watch.

### 10. Map tour you can scan
- **Fix:** a strip across the top counts families by status (This round / Locked / No change /
  Read-only). Families with no change this round fold into one line each and open on tap.
  "Explain" and "View" become 44 px ghost buttons with icons.
- **Test:** browser: on a no-change drive, the tour shows the strip, and every family is folded
  to a single line. The buttons measure ≥ 44 px.

### 11. Sidebar details
- **Fix:** the map pill shows two lines ("Map version 1" / "Starter 21 Dual Tune 2") with no
  ellipsis. On a phone the footer no longer pins over "Your next drive can settle". The current
  stage bar gets a slow pulse (off under reduced motion).
- **Test:** browser at 1280 and 390: the full map name is visible, and the open-steps list is not
  covered.

### 12. Message details
- **Fix:** "Thinking · unchecked" becomes "My working notes · not checked", in muted grey. A
  disabled suggestion chip gets the title "Wait for this reply to finish". The Copy / Edit icon
  hit areas become 44 px.
- **Test:** browser: measure the icon buttons, and read the badge text.

### 13. Fact fixes
- `kc-quick-adjustments`: floored = 90 % of the Pedal full reading (TH
  `pedal_floored_ratio` 0.9, `kc-boost-step`).
- `kc-p0420`: a few 400-cell owners do see a code (CK L54, as in `kc-downpipe-catted-catless`).
- The 21-psi row: check `data/ktuner-maps-digitized.json`, then correct `kc-table-boost` /
  `kc-calibration-drive` or record why the card stands.
- **Test:** `cd server && uv run pytest tests/test_knowledge.py`, and the knowledge graph
  `--check`.

## Real-world scenarios covered this round
Wrong slot (1) · broken logger, dead safety channel (2) · skipped Pedal reading or logger census
(3, 4) · long wait on a slow phone (5) · a nervous owner reading a Knock Control rise (8, 9) ·
mis-taps on a phone (10, 12) · the wrong map name typed in KTuner (11).

## Backlog for Round 2 (ranked)
1. An "I already read this drive" notice on a re-upload.
2. Chat titles from the result ("5 Sep 07:56 · Watch: dead gauges").
3. The table viewer: a human title, axis units, the logged range overlaid.
4. A Hot-restart notice with a calm-drive countdown (`kc-heat-soak`, CX Hot restart).
5. The capabilities reply said twice (front-agent prompt).
6. Model / Engine duplication in the parsed car ("Civic FE 1.5T" + "1.5T").
7. Numbers disagreeing across cards: label each one's window (verdict vs health vs map).
8. The "What can you do?" chip after setup (stage suggestions).
9. Rate conflict: `kc-log-gate` 10 Hz vs TH `rate_min_hz` 6 (decide and word it once).

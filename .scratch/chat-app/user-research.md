# User research synthesis — how tuners actually work a map

*3 Oct 2026. **No live interviews were run** (no participants available in this session). This is
a structured synthesis written as three proto-persona interviews, grounded in
`docs/research/owner-voices.md` (forum threads read in full), `docs/research/tuner-play-panel.md`,
`docs/research/drive-check-tuner-analysis.md`, and the public workflow of KTuner, Hondata FlashPro
and WinOLS. Treat every quote below as a paraphrase of research, not a recorded answer. Next step:
run these scripts with 3–5 real owners (Otofun / Facebook VN groups are the biggest gap).*

---

## Persona A — the owner-tuner (primary user)

> "I bought KTuner, put on an intake and a downpipe, flashed Starter 21 Dual. Now help me make it
> right for *my* car."

**Their loop today**

1. Flash a KTuner basemap that matches their parts (Stage 1 / Starter / Dual).
2. Drive with TunerView logging on the phone. Export CSV.
3. Post the zip on a forum or Facebook group, wait days for a volunteer who sees one log and none
   of their history.
4. Get "looks fine" or a list of numbers. Don't know which one matters or what to change.
5. Maybe change something in KTuner from a forum post; no one checks what they typed.

**What they ask (owner-voices §2):** "WOT AFR 10.6, what went wrong?", "Knock control 0.6/0.7, am I
hurting it?", "Car is different in the heat", "Installed an intake, are trims OK, do I need a
tune?", "Downpipe: will I get a CEL / pass đăng kiểm?", "Is my CVT slipping?".

**Needs → design implications**

| Need | Implication for the chat |
|---|---|
| Fear first: "am I hurting it?" | First line of every analysis reply is the verdict in their numbers |
| Doesn't know what to log | The app tells them *how* to log the next drive: gauges, conditions, pulls |
| Wants it fitted to their parts | Ask for the car + parts in conversation, save to Car profile, reuse forever |
| Wants options, not orders | Show which changes are valid now, which are locked and what unlocks them |
| Types cells by hand into KTuner | Exact table name, L/H, rpm row, column N of 16, before → after, tick list |
| Doesn't trust a black box | Visible tool steps and checks, collapsible |
| Logs on a phone | Attach from phone, one-thumb composer, cards readable at 375 px |

## Persona B — the Hondata / KTuner pro tuner (reference workflow)

> "I never change a map off one log. Baseline first, one table family at a time, then a log that
> proves it."

**Their process**

1. **Intake interview:** car, parts, fuel, climate, goals (daily vs track), what's been flashed.
2. **Baseline log:** a specific recipe — warm engine, cool intake, 2–3 full pulls in one gear
   (CVT: from ~2,500 rpm), the right gauges (AFR + command, STFT/LTFT, knock control/retard, boost
   + target, IAT, MAF).
3. **Read the log:** safety first (mixture, trims, knock, fuel pressure), then cause by symptom.
4. **Decide one change**, smallest step, one table family, with an undo map saved.
5. **Flash, then a shakedown** (calm drive, trims settle) before hard driving.
6. **Verification log** with the same recipe as the baseline, compare like for like.
7. Repeat until targets are met; then stop and save the final map.

**Implications:** the chat must have explicit phases (baseline → read → change → flash → verify),
never propose a change before a baseline exists, always keep an undo file, and compare only
matched drives. The app already implements this in the engine (Next step order, Shakedown drive,
Flash readback); the UI must make the phase *visible*.

## Persona C — the WinOLS remapper (reference workflow)

> "I work on maps, not on logs. The customer sends a read and a log; I send back a file and a list
> of what changed."

**Their process:** read ECU → identify maps → compare against stock/known file → change maps →
checksum → write → customer logs → adjust. Deliverable is always **a change list with before →
after per map** and a file to flash.

**Implication:** the plan message must read like a change list: map name, cells, before → after,
save-as name, undo file. Same as the KTuner card, presented as the step the owner confirms.

---

## The journey all three share (what the chat must walk)

```
Car  →  Baseline log  →  Read  →  Options  →  Plan  →  Flash  →  Verify log  ─┐
 ▲                                                                            │
 └──────────────────────────── repeat until nothing to change ────────────────┘
                                        └→ final map + settings saved to Car profile
```

## Interview script for the real round (to run next)

1. Walk me through the last time you changed your map. What did you do first?
2. What did you log, and how did you know it was the right drive to log?
3. When you got the log back, what did you look at first? What scared you?
4. How did you decide what to change? Who did you ask?
5. How did you type it into KTuner? What went wrong?
6. How did you know it worked?
7. If a chat could do one of those steps for you, which one?

# Round 2: the owner journey (3 Nov 2026)

Input: `journey.js` replayed car setup and the owner's nine real drives in the order they were
driven, at 390 px, on a fresh DB. Each drive's reply was screenshotted at its top and at its Next
step, and the sidebar's stage was read after each one. Lead: Principal Product Manager.
New lens (owner, 3 Nov): what the owner meets at each step, the words used, how information is
laid out along the journey, and tech debt paid as we go (`LOOP.md`).

## What the journey looked like

| # | Drive | Verdict | Next step | Sidebar |
|---|---|---|---|---|
| 0 | car saved | – | the Calibration brief, about 3,000 px | Round 1 |
| 1 | 22 Aug 09:03 | Watch | Log one Cool-morning drive with 2 pulls | Round 1 |
| 2 | 22 Aug 09:50 | Watch | *same as last time* (no reason given) | Round 1 |
| 3 | 23 Aug 19:59 | OK | *same as last time* | Round 1 |
| 4 | 23 Aug 20:38 | **Stop** | Put the map from before back on the car (one paragraph) | Round 1 |
| 5 | 30 Aug 15:09 | – (too short) | Nothing read; a full map tour below | Round 1 |
| 6 | 30 Aug 15:29 | Watch | back to the Cool-morning drive; **the Undo was proved, but the reply's top doesn't say so** | Round 1 |
| 7 | 30 Aug 16:01 | Watch | Cool-morning drive | Round 1 |
| 8 | 1 Sep 08:13 | OK | The Calibration drive | **Round 0** · Calibrate |
| 9 | 5 Sep 07:56 | OK | Your logger recorded 4 dead gauges | Round 1 |

## The debate

**PM:** Read the journey as the owner lived it. The two moments that matter most are the Stop
(drive 4) and the Undo proved (drive 6). The Stop gives one paragraph and no way to tell us we did
it. The Undo proved is buried below the fold. Meanwhile the label that says where we are goes
Round 1 → Round 0 → Round 1. Today's job: every turn of the journey is announced, said in the
owner's words, and the label that says where they are never goes backwards.

**Car Owner:**
- **Drives 2 and 3:** I drove twice and both times got "Next step, same as last time" and
  nothing else. Why didn't it count? I can't see it unless I scroll back to a grey line in the
  report.
- **Drive 4, the Stop:** I'm scared. The step says "Stop open: flash your previous map file, and
  tell me which one it is." *Stop open* means nothing to me, and I can't find where to tell it.
  The chips under it say "What's safe to change on my car?" — I don't want to change anything,
  I want to know if I broke it.
- **Drive 6:** I fixed it, and the reply opens with "Nothing broken, but there is a Watch". Where
  is "you fixed it"?

**Principal Tuner:** The Undo body is right in substance but not in order. The owner must save
today's file first, then flash the old one, then do a calm Shakedown. That's three physical
steps; give them as a numbered list like every other recipe. "Too short" (drive 5) should not
draw a map tour: nothing was read, so a tour of what the logs support is noise. And one name for
the airflow channel: KTuner's help (`kc-log-channels`) and the car card say **MAF Hz**, while the
engine's health row says "AFM sensor headroom / AFM Hz not logged". The owner's log has no such
column at all. Pick MAF everywhere the owner reads; keep parsing "AFM Hz" headers from other
loggers.

**KTuner:** For an Undo where the app doesn't know the old file, there's nothing to type: it's
KTuner → Open → the old file → Flash. Calling the pill "Flash" suggests cells to type. Call it
**Flash back**.

**Hondata:** FlashPro's history shows each flash as a milestone on a timeline. We don't need a
timeline yet, but a proved step deserves a banner at the top of the reply, not a row in "Since
last time".

**Principal Frontend Engineer:** All of this is layout of what the server already sends, except
the Undo recipe (server copy) and the re-upload note (a server fact). The milestone banner comes
from `settled` rows with status `done`. The "why it didn't count" line is `card.wasted`, shown
inside a Next step that has `same: true`. The Round label is one line in `Sidebar.tsx`. Tech debt
this round: revert `sendNow` (review finding 1: it guarded a race React rules out), and find why
the chat stays busy after the spinner stops (Round 1 backlog 14). The owner meets it as an
ignored Enter.

**PM (closes):** Eleven items. The cuts:
- *Chat titles from the result.* Real value, but the journey here is one chat. Backlog.
- *A flash timeline.* The banner covers the need for now.
- *The prose repeating the cards.* That's prompt work. Backlog.

## Decided items

| # | Item | Owner | Test / verify |
|---|---|---|---|
| R2-1 | **The Round never goes backwards.** On the Calibrate stage the label reads "Round N · Calibration drive" | web shell | browser on stage calibrate: "Round 1 · Calibration drive" |
| R2-2 | **A proved step leads the reply.** A Done row from `settled` shows as a green banner under the verdict sentence ("Done: Undo — …why…"), with a one-time fade-in | web cards | drive 6: the banner sits above the report and names the Undo |
| R2-3 | **"Same as last time" says why.** A Next step with `same` carries the reply's Wasted line ("This drive didn't count: …") | web cards | drives 2–3: the line shows inside the Next step card |
| R2-4 | **Undo as three numbered steps** (save today's file under a new name · open the file you ran before and flash it · drive 10 calm minutes and attach the log), no "Stop open" | server copy | pytest on the 23 Aug 20:38 reply: recipe has 3 steps, the body has no "Stop open" |
| R2-5 | **The pill on an Undo reads "Flash back"** | web cards | drive 4: the pill text |
| R2-6 | **Stop chips fit a Stop.** On a Stop verdict: "Is my engine OK to drive home?", "How do I put my old map back?", "Why this step?" | web shell | drive 4: the chips |
| R2-7 | **A too-short drive draws no map tour** | web shell | drive 5: no `flash-plan` section |
| R2-8 | **One name: MAF Hz.** The owner-facing English strings say MAF; the parsing of "AFM Hz" headers stays | engine | engine tests; the health row reads "MAF sensor headroom" |
| R2-9 | **"I read this drive before."** A re-upload of a Drive already in the Car history says so in one line at the top of the reply | server + web | pytest: the second upload of the same CSV carries `repeat` with its date; browser line |
| R2-10 | **Debt: revert `sendNow`** in Composer (review finding 1) | web shell | tsc; e2e |
| R2-11 | **Debt: no busy chat after the spinner stops**: find what still runs and finish it before the reply is done, or let a send through | web shell | e2e passes with the Round-1 spinner-only idle restored |

## Backlog after Round 2
Chat titles from the result · the table viewer (title, units, logged range) · the prose
repeating the cards · a Hot-restart notice · labels for each number's window ·
`kc-log-gate` 10 Hz vs `rate_min_hz` 6 · 44 px sidebar rows on a phone · the console 404 ·
the frozen fuel-pressure line reading "Not logged".

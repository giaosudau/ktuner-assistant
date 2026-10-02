# 05 — Flashes, Map on the drive card, Shakedown drive

**What to build:**
- **Recording Flashes:** the owner can record a Flash (date and time, Map name, what changed: AFM preset / boost / fuel / other, a note). They can edit it, and deleting one asks once first.
- **Map on the drive card:** "Map: <name> · since Flash <date>" from the latest Flash before the drive started, or "Map: not recorded" with an *Add Flash* button. The Map is never guessed from the log. The highest boost target measured is shown as a fact.
- **Shakedown drive:** after a Flash, the next drive is a Shakedown drive.
  - A banner shows progress ("6 of 10 calm minutes"). Calm means engine warm (coolant ≥ 70 °C), moving, boost < 4 psi.
  - It passes after 10 calm minutes with trims within ±5 %, the Fuel-quality score ≤ Baseline + 0.06, and no lean mixture.
  - It carries over to later drives until it passes. While it's open, the only action is "Finish the Shakedown drive".
  - Hard driving before it passes gives Watch ("You drove hard before the check finished"). Real danger still gives Stop, and that Stop names the Flash as the likely cause.
- **Proof across a Flash:** any before/after that spans a Flash says "Can't tell: Map changed in between".

**Blocked by:** 03 — Car module and Car history

**Status:** ready-for-agent

- [ ] Aug 23 19:59 then a Flash at 20:00 ("AFM preset") then 20:38: 20:38 is a Shakedown drive that does not pass; its Stop names the Flash and says "re-flash the previous Map or the right preset".
- [ ] A Shakedown with 6 calm minutes carries to the next drive and passes there after 4 more.
- [ ] A drive with no Flash before it shows "Map: not recorded"; after adding a Flash dated before it, the card shows that Map.
- [ ] Proving "keep the revs up" across a recorded Flash gives "Can't tell: Map changed in between".
- [ ] Flash records live in the car state from ticket 03 and appear as lines on the charts if ticket 04 is in.
- [ ] New wording in English and Tiếng Việt.

# 06 — Unexplained change

**What to build:** When a drive differs from the drives since the last Flash and no Flash explains it, the app asks "Something changed since your last drive" with *I flashed / New tank of fuel / Neither*.

It asks when any of these is true:
- the worst trim moved by more than 5 points;
- the highest boost target moved by more than 2 psi;
- the Fuel-quality score started at Baseline + 0.08 or more.

"The drives since the last Flash" means their median, needing at least 3; with fewer, the last 5 non-hidden drives are used.

The answers:
- *I flashed* opens the Flash form, pre-dated to just before this drive.
- *New tank of fuel* says "give it 10–15 calm minutes, then judge".
- *Neither* keeps the line at Watch, "Unexplained change".

Each answer is stored with the drive and never asked again for it.

**Blocked by:** 05 — Flashes, Map on the drive card, Shakedown drive

**Status:** ready-for-agent

- [ ] Aug 23 19:59 then 20:38 with no Flash recorded: asks (trim moved > 5 points).
- [ ] Aug 30 15:29 after earlier drives at 0.49: asks (score starts 0.58).
- [ ] Loading the owner's folder asks about the boost-target change between 22 Aug and 30 Aug (16.3 → 19.3 psi).
- [ ] *I flashed* creates a Flash and turns the drive into a Shakedown drive (ticket 05 rules apply).
- [ ] Each answer persists through reload and through the History file once ticket 08 exists.
- [ ] New wording in English and Tiếng Việt.

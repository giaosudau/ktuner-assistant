# 04 — Open steps and the Next step

**What to build:** every reply closes the loop and gives one Next step. The engine settles each Open step against the new Drive (Done / Not yet / Still off / Can't tell yet, always with the reason and numbers), marks the Drive a Wasted drive when it settled none (and says what would have), and decides exactly one Next step: a Flash (from the Flash plan), a gauge to watch in TunerView, a drive to log, or nothing — always naming the drive whose upload will settle it.

The reply shows "What I asked last time", then the Next step with its gauge table (gauge as TunerView spells it, OK, if you see, then) or drive recipe, and "Upload when". A repeated step shows compactly as "same step as last time". Open steps sit beside the thread (above it on phones).

Decision order (from `prototypes/next-step/`, amended: Baseline before habit):
```
open Stop            → Flash: Undo (the only step)
Too-short drive      → nothing read; previous step stands
logger fault         → watch in TunerView: fix the dead gauges
no Baseline yet      → drive: one Cool drive with 2 pulls
                       (+ a cause seen today is added as an Open step, told as a free habit)
cause seen today     → its step
Open step still open → its step, compact "same step"
otherwise            → nothing: upload after a Flash, Install, new fuel, or Knock Control > 0.60
```

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Settling and the Next step decision are engine operations, tested in the engine suite
- [ ] Every Next step names the drive that will settle it ("after your next hot-afternoon drive")
- [ ] "Can't tell yet" always carries why (too short, cool when hot is needed, dead gauge)
- [ ] Wasted drives are flagged with what would have settled an Open step
- [ ] The chat shows the settled Open steps, the Next step (gauge table or drive recipe), and the Open steps list
- [ ] Seam-1 test: 30 Aug 16:01 gives the Baseline step with the lugging habit added as an Open step

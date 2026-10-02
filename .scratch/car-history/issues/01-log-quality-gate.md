# 01 — Log quality gate: flat and missing channels, Too-short drive

**What to build:** When the owner checks a drive, the app first decides whether the drive can be judged at all. If a Safety channel (mixture, fuel trims, Fuel-quality score, fuel pressure) is flat or missing, the drive's Verdict is **Can't tell**, never OK. A flat or missing non-safety channel (for example, Turbo Pressure on Sep 5) turns only its own lines into Can't tell. A drive with under 60 s of moving is a Too-short drive: "Can't tell: too short", with no other verdict. Block 7, "What this drive can't tell", lists every missing or flat channel and the TunerView setup step that fixes it. Everywhere on screen, the Verdict words are OK / Watch / Stop / Can't tell; the engine's internal status names never appear.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent
**Status:** done (engine gate + fixtures + EN/VI strings; suite 82/82)

- [x] A channel is **flat** when its value doesn't change across the moving part of the drive while engine rpm does; Turbo Pressure is also flat when it stays within 0.5 psi while MAP rises above 4 psi.
- [x] Sep 5 07:56: overall Verdict OK; every boost line Can't tell; Block 7 says "Turbo Pressure was flat for the whole drive" and how to check the channel in TunerView. "Peak boost −0.3 psi" no longer appears anywhere.
- [x] Aug 30 15:09 (3.6 s): "Can't tell: too short"; no safety lines, no actions, no Fuel-quality score verdict.
- [x] A drive with the mixture channel removed: Verdict Can't tell, and the first line says which Safety channel is missing.
- [x] The engine's internal status names (`good`, `nodata`, …) never reach the screen in either language.
- [x] Sep 5 and Aug 30 15:09 are committed as compressed fixtures, alongside the three bundled drives.
- [x] New wording in English and Tiếng Việt.
- [x] Existing drive tests still pass; new tests go in through the public drive check only.

Notes: Sep 5 also has frozen fuel pressure + CVT temp; fuel pressure only sinks the verdict when the drive has full-throttle samples to judge it by (it is judged under boost), so Sep 5 stays OK with Block 7 listing all four dead channels. A frozen channel on a drive with pulls → Can't tell. The sample-log generator now steps Knock Control in realistic 0.01 moves (a frozen value is a dead channel).

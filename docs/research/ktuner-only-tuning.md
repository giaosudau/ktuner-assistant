# How tuners tune with only KTuner and a datalog, and what the app should learn

*2 Oct 2026. Sources: KTuner's own help pages (read in full via crawl4ai), the owner's map file and 16 drives. Forum posts are context only (see `fact-check.md`).*

## 1. What KTuner gives a tuner (primary: KTuner Help)

| Tool in the KTuner PC software | What it does | What a tuner uses it for |
|---|---|---|
| **Graph** | Overlays recorded channels over time. You can scrub, trim, zoom and add comments | Find **when** something happened: the pull, the knock step, the lean spike |
| **Tuning Map** with **map tracing** | The table being edited, with a cursor marking the cell the ECU is using as the log plays | Find **where on the map** it happened (rpm × load cell) |
| **Lambda overlay** (on the Tuning Map) | Measured lambda drawn onto the cells it was logged in | Compare **measured vs target, cell by cell** |
| **Scatter plot** | "Overlay two data types against each other to find trends and patterns" | Find **why**: trim against airflow, Knock Control against intake temperature |
| **Data List, gauges, lights, Live Graph** (last 10 s) | Live values while driving | Watching a pull as it happens |
| **On-board logging** with activation windows | Records only inside a set window (for example, full throttle) | Capture only the moments that matter |
| **Real-time tuning** (some platforms) | Edit some maps while connected; you must reflash to keep the changes | Fast change-and-check loops on a dyno or road |
| **Direct serial wideband logging** | Logs a supported aftermarket wideband | A second, trusted mixture reading |

**How the ECU sets timing** (KTuner Help, "Ignition Timing and Knock Control"):

> final timing = ignition table + knock ignition limitation − knock retard, where **knock retard = Knock Control × knock retard table**

The ECU then uses the lesser of that and the ignition table. Two consequences:
- The **Fuel-quality score (Knock Control) multiplied by a map table gives the degrees of timing taken away**, so the score can be shown as degrees.
- The logged values are **rounded**: Knock Retard to 0.5°, and ignition to whole degrees on OBD platforms. Never read meaning into a 0.5° change.

**Other KTuner-documented logic relevant here:**
- **Nominal Lambda for Component Protection** = the mixture targets, under any load, low and high cam.
- **Minimal Lambda Setpoint** = the richest mixture allowed.
- **Torque Targets Per Mode** = the torque each gear and mode may ask for, in lb-ft.
- **Turbo Pressure Limit Based on Engine Temperature** = the factory map lowers the boost limit as intake air heats up; KTuner relaxes it, but still tapers boost.

## 2. The reasoning a tuner applies to every log

This is a synthesis of the tools above with the tuning order already used in this repo (`afr-tuning-research.md` §2). It isn't quoted from one source.

1. **Is the log usable?** Right channels, enough rate, the right conditions (warm engine; a pull from a roll in a fixed mode). If not, log again; don't guess.
2. **Safety first, in time view:** scrub the Graph for anything lean under boost, a step in Knock Control, fuel pressure falling below target, or heat. Any of those means stop and find the cause before anything else.
3. **Air before fuel, in cell view:** a scatter of trims against airflow shows whether the AFM table matches the intake. Trims that are wrong everywhere point to the preset; trims wrong in a few cells point to those cells.
4. **Fuel against target, in cell view:** lambda overlay on the target table, cell by cell, under boost.
5. **Spark is the ECU's job:** map tracing shows which cells collect retard. A rising Knock Control means "less margin". The remedy is fuel, heat or boost, not adding timing on the street.
6. **Boost:** actual against target and wastegate position. A shut wastegate means no headroom left.
7. **Find the cause with a scatter:** Knock Control against intake temperature, rpm or load.
8. **One change, one reflash, one log under the same conditions.** Compare like with like.

**The mental model:** a drive is a **path across the map**. Tuners move between *when* (Graph) and *where* (map tracing), and judge every number **against its own target**, never against a number from memory.

## 3. What KTuner alone doesn't do, which is this app's job

| A tuner brings | KTuner shows | The owner is missing |
|---|---|---|
| Which channel matters, and in what order | All channels, equally | **The order**: the story in the spec |
| What's normal for *this* car | Raw values | **The Baseline** and limits learned from his own drives |
| Memory of past logs and the weather they were logged in | One log at a time | **Car history**, with Cool/hot drives marked |
| "This came after the flash" | Nothing | **Flash records, Shakedown drive, Unexplained change** |
| A verdict and the next step | Data, no verdict | **One Verdict, one thing to do** |

## 4. What the app takes from this

| Learned | Decision for the owner's screen | Why it simplifies |
|---|---|---|
| Score × table = degrees taken (KTuner's formula; it holds on this car's logs, and the boost table is 10.2°) | The score line also says **"under boost your score costs about 1.5° of timing"** = 10.2° × (score − normal). It isn't a per-drive average of logged retard, which changes with where on the map you drove (the tuner's lesson: compare per cell) | Degrees are a consequence the owner can feel; a score of 0.64 is abstract |
| *When* + *where* (Graph + map tracing) | Every Watch or Stop *Why?* opens one picture: the moment on the drive's timeline **and** the same moment as highlighted cells on a small rpm × boost grid | One picture answers "when" and "where", the two questions a tuner asks first |
| Measured vs **target**, cell by cell (lambda overlay) | Mixture judged against the map's own target. Today only at ≥ 12 psi, where the target is the full-load 11.0; per-cell checks wait until the map's load axes are captured | Removes false alarms: lower-load cells ask for 11.5 to 14.7 |
| Scatter to find the cause | The cause is told as **one sentence with counts** ("31 of 41 rises came while lugging, at about 1,440 rpm"). The scatter itself stays in the Engineering view | The owner needs the cause, not the method |
| Logged values are rounded | Never show or act on a change smaller than the channel's step (Knock Retard 0.5°, ignition 1°) | No noise presented as a finding |
| Log only what matters (activation windows) | The app finds the moments itself (pulls, lugging, hot restart) and lists them on the drive card as **Key moments**, each opening its *Why?* | The owner never scrubs a 50-minute log |
| One change, one log, like with like | Already the rule (Prove it, Shakedown, no proof across a Flash) | Unchanged; confirmed by how tuners work |

**Left out:** live gauges and real-time tuning (the app reads logs after the drive and never writes to the ECU), and a second wideband (it needs new hardware).

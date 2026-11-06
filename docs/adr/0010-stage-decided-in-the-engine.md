# Stage is decided once, in the engine

*7 Nov 2026. `.scratch/eng-loop/review-r1.md` item 1 (AD-1). ADR 0002 (the engine is reached over one
Node worker) and ADR 0004 (a pure engine, the state document in and back) still bind.*

## Context

`desk.stage_of` worked out in Python where the car is, from flashes, verdicts and step keys, and kept
its own list of safety steps. The sidebar, the Recap, the model's prompt and the "is the next drive the
Calibration drive?" rule all read it, so a safety rule lived in wording code.

## Decision

1. **`KTA.carStage(facts)` is the one rule**, beside `STEP_JUDGES`. It returns `car`, `baseline`,
   `calibrate`, `read`, `plan` or `verify`.
2. **Safety is a field on the registry.** `safety: true` on `undo`, `install`, `downpipe` and `logger`,
   so one registry holds step kinds.
3. **The server asks once per use**, through the worker's `stage` op: `loop_state` sets `loop.stage`,
   and everything else reads that. `one_next_step` runs outside `loop_state`, on a reply, and asks too.
4. **`STAGE_WORDS` stays in `desk.py`.** The engine decides; the server words.

## Considered Options

- **`carNextStep` returns the stage** (the review's first idea). It doesn't hold the profile, the
  flashes or the Ceiling read, so every caller would pass them anyway, and it would answer two questions.
- **Keep it in Python and test it harder.** The rule would still be a second home for a decision.

## Consequences

A Stage needs a worker. Without one `/api/state` fails the way every worker failure does: a 502 with
the error's code, which `carHistory` already did first. A test pins it.

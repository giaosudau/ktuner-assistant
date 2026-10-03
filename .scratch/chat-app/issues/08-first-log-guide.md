# CA-08 — How to log: the first-log guide from the engine

*Blocked by: CA-03 · touches server (read-only addition)*

`GET /api/state` adds `logGuide`: the Baseline drive recipe and the gauges the engine needs
(`KTA.REQUIRED`), named as TunerView shows them. The assistant shows it after setup and on the
"How should I log?" chip, and repeats the relevant recipe after a Flash.

## Acceptance
- [ ] After setup → assistant message with the gauge list and the Cool-drive-with-2-pulls recipe.
- [ ] Seam-1 test asserts `logGuide` present with recipe + gauges.

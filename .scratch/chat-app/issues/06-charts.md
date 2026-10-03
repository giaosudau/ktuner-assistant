# CA-06 — Charts in the reply

*Blocked by: CA-02, tuning-loop 15 (pictures data)*

Draw `reply.pictures` (and `agent.pictures`) in inline SVG: `trace` (line, target dashed, moment
marker), `baseline`/`proof` (two labelled bars), `map_grid` (rpm × 16 grid, changed cells
outlined with after value, driven rows shaded), `maf_gap` (two lines, gap %), `cant-tell` (why).
Every printed number is also in text; no chart library.

## Acceptance
- [ ] A Flash reply shows the map grid with changed cells; a settled step shows proof bars.
- [ ] Charts readable in light and dark, at 375 px, with a text caption.

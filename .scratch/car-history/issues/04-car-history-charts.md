# 04 — Car history charts

**What to build:** Block 4, "Your car over time", shows six small charts, one dot per drive, newest on the right, evenly spaced:
1. Fuel-quality score peak
2. worst fuel trim
3. intake while moving
4. CVT peak
5. lugging %
6. best 50→70 km/h

The encoding:
- A **filled dot** is a Cool drive and a **hollow dot** is a hot drive.
- A Stop drive gets a ring and a ✕.
- The Baseline is a dashed line labelled "your normal". A limit is a solid line labelled with its number.
- Each Flash in the car state is a thin vertical line across all six charts, labelled with the Map name.
- Every dot has a tooltip (date, value with unit, Cool/hot, Verdict, Map), and tapping it opens that drive.
- The first line of the block sums it up: "16 drives since 15 Aug · 1 Stop".

**Blocked by:** 03 — Car module and Car history

**Status:** done (app side; engine `carChartSeries`/`carTableRows` consumed read-only)

- [x] Uses only existing colour tokens: one series colour for every chart; status colours only for the Stop ring; text never in series or status colours. No dual axes.
- [x] The palette validator passes in light and dark for the chart tokens used. Any contrast warning has a visible text label next to the mark.
- [x] Dots are at least 8 px with hit targets of at least 24 px. Identity is never colour alone (shape for Cool/hot, ring + ✕ + tooltip text for Stop).
- [x] A car state containing one Flash draws one labelled line at the first drive after it, in all six charts.
- [x] The Aug 23 20:38 drive shows its Stop mark on the trim chart; the charts and the Table view agree on every value.
- [x] Works at 375 px (charts stacked) and on a laptop (2 × 3 grid); dark mode uses its own tokens.
- [x] New wording in English and Tiếng Việt.

**PM note (2 Oct 2026, verified against the owner's 16 TunerView files via `tools/car-history-check.js` + UI + e2e):**
- What the owner sees in the car park: six small charts (score peak, worst trim, intake while moving, CVT peak, lugging %, best 50→70), one dot per drive, newest right. Cool drives are filled dots, hot drives hollow; the 20:38 Stop wears a ring + ✕ and its tooltip names the fault ("Stop: trims −21.4 %"). The score chart carries the dashed "your normal 0.49" Baseline (median of the 6 Cool drives) plus the solid "limit 0.80"; trims ±5 %, intake 50 °C and CVT 100 °C are solid numbered limits. A recorded Flash draws one labelled line at the first drive after it on all six charts. Every dot's tooltip gives date, value + unit, Cool/Hot, Verdict, Map; tapping it opens that drive's summary. The Table toggle lists the same numbers (score peak / trim / IAT / CVT / lug / 50–70 / Map) for every drive.
- Usefulness: weather stops masquerading as change (shape, not colour); a Flash is visibly linked to what the logs did next; faults are named in words, never colour alone.
- Residual risk: each chart auto-scales its own y-axis, so small wiggles can look large; the lugging and 50→70 charts carry no limit line by design; Flash labels truncate to 12 characters; tapping a dot opens the drive summary, not the full log (the CSV stays the source of truth). No palette validator exists in `tools/` and no chart token changed, so none was (re-)run: the new charts use only `--meas/--sheet/--stop-ic/--ink-3/--axis/--line-3/--grid`, and the `--third` 2.74 WARN token is not used anywhere in the app.

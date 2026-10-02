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

**Status:** ready-for-agent

- [ ] Uses only existing colour tokens: one series colour for every chart; status colours only for the Stop ring; text never in series or status colours. No dual axes.
- [ ] The palette validator passes in light and dark for the chart tokens used. Any contrast warning has a visible text label next to the mark.
- [ ] Dots are at least 8 px with hit targets of at least 24 px. Identity is never colour alone (shape for Cool/hot, ring + ✕ + tooltip text for Stop).
- [ ] A car state containing one Flash draws one labelled line at the first drive after it, in all six charts.
- [ ] The Aug 23 20:38 drive shows its Stop mark on the trim chart; the charts and the Table view agree on every value.
- [ ] Works at 375 px (charts stacked) and on a laptop (2 × 3 grid); dark mode uses its own tokens.
- [ ] New wording in English and Tiếng Việt.

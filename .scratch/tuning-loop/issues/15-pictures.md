# 15 — Pictures in the chat

**What to build:** one picture per reply, each answering the step's one question. The engine produces the chart data; the chat draws it; the agent picks the kind through a `show_chart` tool. Kinds:

- trace around a Key moment (with the marked moment);
- this Drive vs the Baseline;
- map grid: rpm rows × 16 columns, changed cells outlined before → after, cells the Drives actually sat in shaded;
- before/after proof bars, matched conditions only (otherwise a "can't tell" card that says why);
- MAF Scaling curve gap (the curves and the band the trims imply).

At most one per reply, plus the map grid when the Next step is a Flash. No dual axes; status colours only for Verdicts; every number on a picture also appears in the reply text (verify checks it). Pictures are readable on a phone.

**Blocked by:** 08, 13

**Status:** ready-for-agent

- [ ] Each kind renders from engine data for at least one of the owner's drives
- [ ] A Flash reply shows the map grid with the changed and driven cells
- [ ] Verify fails a reply whose picture shows a number missing from the text (seam-1 test)
- [ ] Pictures fit a 390 px wide screen without sideways scrolling

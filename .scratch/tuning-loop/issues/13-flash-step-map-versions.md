# 13 — Flash step: KTuner card to a new Map version (and the History file)

**What to build:** when the Next step is a Flash, the owner can type it into KTuner safely and the app knows what's on the car afterwards.

- The proposed change passes both checks (engine and the independent Python check) before the owner sees it; a blocked Flash says why.
- The **KTuner card** is drawn only from the checked change: table as KTuner names it with L/H and level, rows by rpm, columns as "N of 16", before → after in each table's own units and decimals, what it means, what it does for this car, save-as name, Undo version, and the proof. Reply text whose cell or number differs from the card fails verify.
- A **per-cell checklist** the owner ticks while typing, then **I flashed it** → Map version N+1 becomes active and the next Drive is a Shakedown drive, or **Not now** → nothing is created.
- **Undo** flashes an earlier Map version; **Revert** ("In KTuner, load Starter 21 Dual Tune 2 and flash it") makes the KTuner basemap active on confirm.
- **History file:** export and import include Map versions, Flashes, Installs and owner answers; merge never overwrites (raw CSVs stay on the server).

**Blocked by:** 07, 10, 12

**Status:** ready-for-agent

- [ ] Seam-1 test with a fixture where the Flash plan proposes cells: the card matches the checked change exactly; "I flashed it" creates version 2 with those cells and a Shakedown drive; "Not now" creates nothing
- [ ] A change rejected by either check never reaches the card; the reply says why
- [ ] Undo to version 1 and Revert to basemap each make the right version active
- [ ] History file round-trips Map versions, Flashes, Installs and answers; merging keeps both sides

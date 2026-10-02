# 14 — Flash readback

**What to build:** the first Drive after a Flash checks that what the ECU runs is what was planned. For boost tables, the logged Turbo Pressure Target in the changed cells the Drive visited must match the new Map version. For MAF Scaling, the trims pattern must match the choice. A mismatch names the cell ("2,750 rpm column 9 reads 17.0, planned 16.0"), the Flash isn't credited, and the Next step is "re-check what you typed in KTuner". Tables whose result the log can't show say "readback not possible" on the card.

**Blocked by:** 13

**Status:** ready-for-agent

- [ ] Seam-1 test: a Drive matching version 2's changed cells is credited
- [ ] A Drive whose logged target differs in a changed cell is not credited and names the cell
- [ ] A Drive that never visits the changed cells says readback is still open ("can't tell yet", with the rpm band to drive in)
- [ ] The KTuner card states, per table family, whether readback is possible

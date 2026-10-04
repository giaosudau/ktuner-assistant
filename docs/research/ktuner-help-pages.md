# KTuner Help pages the owner pointed to (4 Oct 2026)

*What the shop knows from KTuner's own help, and what it does not know yet. KTuner's site was
blocked from the research environment on 4 Oct 2026, so only text the owner pasted into the chat
is quoted here; the other pages are recorded as knowledge proposals until someone reads them.
`fact-check.md` still wins on any number.*

## 1. "Ignition Timing And Knock Control" (text supplied by the owner)

Source: KTuner Help → General Tuning Logic → Ignition Timing And Knock Control.

> Ignition Table Value + Knock Ignition Limitation Value − Knock Retard Value = Final Calculated
> Ignition Timing. It then compares the Final Calculated Ignition Timing and the original Ignition
> Table Value and chooses the lesser of the two. Keep in mind that items like IAT ignition
> correction can also be added to the Knock Ignition Limit Table Value in the background.

The page's worked example, with its datalist (Actual Ign 19.0, Knock Control 0.38, Knock Retard 3.5):

- ignition table 21.0° + knock ignition limitation 2.0° = 23°;
- knock retard = Knock Control × knock retard table = 0.38 × 10 = 3.8°, **logged rounded as 3.5**;
- final = 23 − 3.8 = 19.2°, **logged as 19 on OBD platforms**.

The three data items to follow: Actual Ign, Knock Control, Knock Retard. The page shows example
ignition, knock ignition limitation and knock retard tables (rpm × load); the knock retard example
holds 10 at low rpm and 20 above about 1,000 rpm, dropping to 15 and 10 at the lightest loads.

This confirms what `ktuner-only-tuning.md` §1 and `fact-check.md` §2 already use: Knock Control ×
the retard table is the timing pulled, the final timing is never above the table, and logged
values are rounded (so a 0.5° change means nothing). On this car the retard table under boost
works out at about 10.2° (fact-check §2).

| Claim | Covered by | Status |
|---|---|---|
| Final timing formula, lesser of final and table | `kc-table-ignition`, `kc-ignition-formula` | ✅ |
| Knock retard = Knock Control × table | `kc-ranges`, `kc-ignition-formula` | ✅ |
| Logged retard and ignition are rounded | `kc-ignition-formula` | ✅ (new card) |
| IAT ignition correction rides in the knock limit table | `kc-ignition-formula` | ✅ (new card) |

## 2. Pages not read yet (proposals, not facts)

| Page | What the app knows today | Proposal |
|---|---|---|
| Boost By Gear Limits | The owner's map: 35.4 psi in every gear, so no gear limit acts (`kc-table-boost`) | `kp-how-boost-by-gear-limits-work` |
| Final Boost Target | The owner's map: tops out at 23.4 psi (`kc-table-boost`) | `kp-how-the-final-boost-target-is-arbitrated` |
| Dual Boost Targets | Normal and ECO tables exist, each Low and High cam (`kc-table-boost`) | `kp-how-ktuner-picks-between-the-dual-boost-targets` |
| On The Fly Map Switching | Logs are tagged with a map slot; slots are never compared (spec D15 phase 1) | `kp-how-ktuner-on-the-fly-map-switching-works` |

The assistant does not state how these work until a reviewer reads the KTuner page and sources a
card; when an owner asks, it says what the map data shows and that the rest is noted to check.

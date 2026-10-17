# Log evidence for a downpipe (ticket 05)

Local research only: `engine/`, `data/example-*.js` (nine TunerView drives), `data/ktuner-maps-digitized.json`, `docs/research/tuner-play-panel.md`. Numbers measured with small node scripts that call `K.readLog` + `K.checkDrive` the same way `test/drive.test.js:10-13` does.

## Channels in the nine drives

All nine logs carry the same 23 TunerView columns (sep01-0813 header): `Engine RPM; Speed; ECT; IAT; MAP; O2; Gear; TPS; TPS Command; Ignition; Knock Control; Knock Retard; Turbo Pressure; Turbo Pressure Target; EWG Position; EWG Target; DIFP; DIFP Target; IAT2; STFT B1; LTFT B1; Transmission Temperature`.

- Present in all nine: boost, boost target, EWG Position, EWG Target, Knock Control, O2 AFR, rpm, TPS Command.
- Absent in all nine: **EWG duty** (`wg`), **AFR command** (`lamCmd`), pedal (TPS Command stands in, `engine/kta-drive.js:107`).
- sep05-0756: boost and boost target flat (dead logger channel), so no boost reading at all.

## Signal table

| Signal | Logged? | Summarised where | Threshold | file:line |
|---|---|---|---|---|
| Boost (Turbo Pressure) | Yes, 9/9 (flat on sep05) | `I.boost.peakBoost`, per-pull `boostMax` | pull = load ≥ 4 psi and TPS cmd ≥ 40 %; hard pull = MAP ≥ 12 psi | `engine/kta-engine.js:431`, `engine/kta-drive.js:30-31,252,260,265,274` |
| Boost target | Yes, 9/9 | `I.boost.peakTarget`; car summary `boostTarget` | — | `engine/kta-engine.js:430`, `engine/kta-drive.js:275`, `engine/kta-car.js:318` |
| Overshoot (boost − target, sustained ≥ 0.15 s, target ≥ 12 psi and holding) | Derived | `an.numbers.overshoot` → `I.boost.overshoot` → car summary `overshoot` | check good < 1.5, watch 2.5; downpipe trigger > 2.5 | `engine/kta-engine.js:162,943-957,1164-1167`, `engine/kta-drive.js:281`, `engine/kta-car.js:319,1329,2075` |
| rpm of the overshoot peak | Derived | **only** the check's `display` / `data.rpm`; not in `numbers`, `I.boost` or the car summary | — | `engine/kta-engine.js:955,1165,1167,1316` |
| Undershoot (target − boost after spool) | Derived | `an.numbers.undershoot` (check only) | only rpm ≥ 3,500 and ≥ 1.5 s into the pull, target ≥ 10 — the spool zone is excluded on purpose | `engine/kta-engine.js:952,1168-1171` |
| EWG Position | Yes, 9/9 | per hard pull `wgAtPeak` (median at MAP ≥ peak − 1); drive `I.boost.wgAtPeak` = median of hard pulls; car summary `wgAtPeak`; `wgMed` over last 5 drives in the lever text | — | `engine/kta-engine.js:447,685`, `engine/kta-drive.js:260,269-270,276`, `engine/kta-car.js:320,1296,1417` |
| `I.boost.headroom` | Derived from EWG Position | drive only (not stored in the car summary) | small ≤ 5 % open, some ≤ 15 %, else large; `unknown` with no hard pull | `engine/kta-drive.js:38,276` |
| EWG Target | Yes, 9/9 | **parsed, never read** by any insight | — | `engine/kta-engine.js:448,686` (no other use in `engine/` or `server/`) |
| EWG duty | **No** (no column) | channel def exists, unused | — | `engine/kta-engine.js:449` |
| Hard pulls | Derived | `I.boost.hard` → car summary `hardPulls` | MAP ≥ 12 psi | `engine/kta-drive.js:31,265,272`, `engine/kta-car.js:326` |
| Spool rpm / boost-at-rpm | **No field** | pulls keep only `rpm0` (start) and `rpm1` (max); no time- or rpm-to-boost | — | `engine/kta-drive.js:258` |
| AFR (O2) | Yes, 9/9 | per-pull `afr`, `I.mix.leanest` → car summary `mixLeanest`, vs map `mixTarget` | lean = leanest ≥ map AFR + 0.5 | `engine/kta-drive.js:262`, `engine/kta-car.js:63,321-322` |
| AFR command | **No**, 0/9 | `I.quality.hasAfrCmd = false` → gain blocker `data` on every drive | — | `engine/kta-drive.js:122,569` |
| Knock Control | Yes, 9/9 | `I.kc` (start, end, peak, rises); per-pull `kc` at pull start | steady ≤ 0.55, step 0.04 | `engine/kta-drive.js:26,39,263` |

## Measured on the example drives

| Drive | Pulls / hard | Peak boost / target (psi) | EWG at peak, per hard pull (%) | Drive `wgAtPeak` → headroom | Overshoot (rpm of peak) |
|---|---|---|---|---|---|
| aug22-0903 | 14 / 9 | 16.7 / 16.3 | 2.1–3.8 | 3.2 → small | +1.9 (3,964) |
| aug22-0950 | 2 / 0 | 9.1 / 8.7 | — | unknown | — |
| aug23-1959 | 4 / 0 | 9.2 / 8.7 | — | unknown | — |
| aug23-2038 | 0 / 0 | — | — | unknown | — |
| aug30-1509 | 0 / 0 (28-row stub) | — | — | unknown | — |
| aug30-1529 | 14 / 8 | 19.9 / 19.2 | 2.3–3.6 | 2.7 → small | +1.4 (3,236) |
| aug30-1601 | 10 / 2 | 16.7 / 17.2 | 2.4, 3.0 | 2.7 → small | +1.0 (3,521) |
| sep01-0813 | 8 / 2 | 13.9 / 13.7 | 3.0, 1.9 | 2.5 → small | +0.1 (3,793) |
| sep05-0756 | 2 / 0 | flat | — | unknown | — |

- **EWG at 21 psi cannot be measured:** no sample in any drive reaches 20.5 psi boost; the highest logged target is 19.2 psi. At boost ≥ 18 psi (aug30-1529, 18 samples) EWG median 2.6 %, max 7.9 %.
- **Overshoot peaks sit at 3,236–3,964 rpm** in every drive with hard pulls — above the 2,500/2,750/3,000 rows the B2 trim edits.
- **"rpm where boost first reaches 15 psi" is not a stable number today:** within one drive it ranges 2,928–4,595 rpm (aug22-0903) and 3,031–4,810 rpm (aug30-1529), driven by start rpm (1,990–3,619) and how far the throttle went; half the hard pulls never reach 15 psi. Full-throttle (TPS cmd ≥ 85 %) samples in the 2,500–3,000 rpm band: 26 on aug22-0903 (boost 12.4 / target 12.6), 7 on aug30-1529 (8.3 / 9.3), none on aug30-1601 or sep01-0813. The target itself differs by throttle column, so boost alone is not comparable across pulls; boost − target is.
- Play B's "Before" drive (sep01-0813, `docs/research/tuner-play-panel.md:215`) has zero full-throttle samples below 3,500 rpm, so it cannot serve as a spool "before".

## Answers to the ticket's sub-questions

1. **EWG position / duty.** Position and target are logged in 9/9; duty is not logged. Position is summarised (median at the boost peak of hard pulls → `wgAtPeak` → `headroom`); target is parsed and ignored (`engine/kta-engine.js:448,686`).
2. **Spool rpm before vs after an Install.** Not with current fields: pulls keep start and max rpm only (`engine/kta-drive.js:258`), the overshoot rpm is dropped before the car summary (`engine/kta-engine.js:1316`, `engine/kta-car.js:319`), and undershoot excludes rpm < 3,500 (`engine/kta-engine.js:952`). The raw channels (rpm, TPS Command, boost, target, gear) are enough for a new field, but only for throttle-matched pulls (TPS cmd ≥ 85 % from a similar start rpm), and the owner's logs today have few such samples.
3. **`I.boost.headroom` and the map24 `turbo` lock.** `headroom` = band of the median EWG position at the boost peak across hard pulls: ≤ 5 % small, ≤ 15 % some, else large (`engine/kta-drive.js:38,269-270,276`). map24 adds `turbo` only when headroom is `small` (`engine/kta-build.js:119`). A downpipe that makes the wastegate open more than 5 % at the peak (median of hard pulls, one drive) would clear `turbo` — that rests on the engine's reading that EWG Position is "% open" (`engine/kta-drive.js:38`), not checked here. It would **not** unlock map24: `final` stays because `Final_Boost_Target_H` tops out at 23.4 psi < 24 (`engine/kta-build.js:120`, map file), and `octane` is pushed unconditionally (`engine/kta-build.js:121`). Separately, kta-car's `boostPlus` lever is locked with "Never on this turbo" regardless of the EWG number (`engine/kta-car.js:1416-1417`), and the server repeats "no headroom" as fixed copy (`server/kta_server/desk.py:56`, `server/kta_server/copy.py:952`).
4. **Proof the downpipe B2 step uses.** Step `downpipe` (`engine/kta-car.js:1748-1772`): needs boost + target alive; **done** when ≥ 1 hard pull, overshoot ≤ 2.5 psi and not lean (leanest < map AFR + 0.5, `engine/kta-car.js:63,1762-1764`); **fail** when overshoot > 2.5 on pulls (`:1766-1768`); otherwise open/wait. It does not check a cool drive, two pulls, trims, an absolute 12.0 AFR, or where in rpm the overshoot happened.

## Drift list

1. **Phantom 3,250 rpm row.** The Normal boost tables' rpm axis is `… 2,500, 2,750, 3,000, 3,500 …` (no 3,250; `data/ktuner-maps-digitized.json` `Boost_Target_1_Normal_L.rpm_axis`). Labels say "2,500–3,250 rpm": `engine/kta-car.js:1254,1430,1434,1435,1436` (lever), `:1518` (headline), `engine/kta-build.js:91,101`. The engine edits rows 2,500/2,750/3,000 only (`engine/kta-car.js:1481`); Play B says "around 2,500–3,000 rpm" (`docs/research/tuner-play-panel.md:227`).
2. **Tables: six vs two.** kta-car edits all six `Boost_Target_{1,2,3}_Normal_{L,H}` (`engine/kta-car.js:1097-1101,1491-1501`); Play B agrees, "all six identical … change all six" (`docs/research/tuner-play-panel.md:220-224`); kta-build dpCat lists only `Boost_Target_1_Normal_L` and `_H` (`engine/kta-build.js:91-92`) and its step says "Boost Target Normal (L and H)" (`:101`). The six tables are byte-identical in the map file today.
3. **Final Boost Target.** dpCat names `Final_Boost_Target_H` "Leave stock" (`engine/kta-build.js:93`); kta-car and Play B do not mention it. Its axis is not the plateau shape of the Normal tables (rows 2,500–3,000 run −0.2 … 23.4 across the columns), so it is a check-only line, not a contradiction — but only one of three sources says it.
4. **Cells: ≥ 8 psi vs columns 8–16.** kta-car's gate is every cell ≥ 8 psi in `Boost_Target_1_Normal_L` at those rows (`engine/kta-car.js:1482-1489`): columns 4–16 at 2,500 rpm, 3–16 at 2,750 and 3,000 = **41 cells per table, 246 total**, including the ramp (9.5 → 8.5, 11.5 → 10.5 …). Play B shows columns 8–16 only, plateau 15/17/19 → 14/16/18 = 27 per table, 162 total (`docs/research/tuner-play-panel.md:220-224`). dpCat names no cells.
5. **Trim rpm vs observed overshoot rpm.** Every measured overshoot peak is at 3,236–3,964 rpm (table above); the trim edits 2,500–3,000 and fades by interpolation to zero at 3,500. The overshoot rpm is computed (`engine/kta-engine.js:955`) but never reaches the plan (`engine/kta-engine.js:1316`, `engine/kta-car.js:319`), so the plan cannot aim at it.
6. **Proof wording, three versions.** kta-car candidate: "Two pulls hold overshoot under +2.5 psi with full-load mixture on target" (`engine/kta-car.js:1337`); step ask: "overshoot under +2.5 psi on pulls with the mixture on target" (`:1755`), judge accepts **one** pull and map-relative lean (`:1761-1764`), "would: two pulls on a cool morning" but never checks cool (`:1750`). dpCat: "overshoot stays under +2.5 psi; full-load mixture still on target" (`engine/kta-build.js:97`) plus "AFR at or richer than 12.0 and cruise trims inside ±5 %" (`:102`). Play B: "overshoot ≤ +2.5 psi, full-load AFR at or richer than 12.0, trims within ±5 %" (`docs/research/tuner-play-panel.md:215`).
7. **Trigger scope.** Candidate fires on the max overshoot of the last 5 non-Stop drives > 2.5, no change required (`engine/kta-car.js:1291-1294,1329`); diagnose fires on one drive > 2.5 after **any** change — an install of any part, a Flash, an "I flashed" answer, or a trim jump (`engine/kta-car.js:1983-1997,2075-2076`) — yet always names "Faster spool after the downpipe" (`:2078`). Play B and dpCat key off "overshoot > +2.5 psi" only (`docs/research/tuner-play-panel.md:218`, `engine/kta-build.js:91`).
8. **"Faster spool" is inferred, not measured.** Every source says the pipe spools sooner (`engine/kta-build.js:96`, `engine/kta-car.js:2078-2080`, `docs/research/tuner-play-panel.md:209`); the only log signal behind it is overshoot (signal table). No spool field exists to show it.
9. **Headroom wording flips meaning.** The `headroom` blocker fires when `I.boost.headroom === 'small'` (`engine/kta-drive.js:571`) yet its text opens "the turbo has headroom: … only X % open, so it is near its limit" (`engine/text/i18n-drive.js:260`; VN `:678` "turbo còn dư"). kta-car and kta-build say "no headroom" for the same state (`engine/kta-car.js:1417`, `engine/kta-build.js:177`).
10. **"21 psi" is the map, not the log.** `turbo21` claim: "wastegate about 3 % open at the boost peak … near its limit before your 21 psi target" (`engine/kta-build.js:163`); logged targets peak at 19.2 psi and boost at 19.9 psi, so the 3 % is measured at ≤ 19.9 psi, never at 21.

## Answer

- EWG **Position** and **Target** are logged in all nine drives; **duty is not**. Position is summarised as the median at the boost peak of hard pulls (`wgAtPeak`, 2.5–3.2 % on the four drives with hard pulls → `headroom` "small"); Target is parsed and never used.
- No drive reaches 21 psi (max 19.9 boost / 19.2 target), so "EWG at 21 psi" is not measurable. Overshoot per drive: +1.9, +1.4, +1.0, +0.1 psi, all peaking at 3,236–3,964 rpm.
- Spool rpm before/after an Install **cannot** be measured with current fields (pulls keep start/max rpm only; overshoot rpm is dropped; undershoot skips < 3,500 rpm). The raw channels allow a new boost − target field on throttle-matched pulls, but today's logs have few full-throttle samples at 2,500–3,000 rpm.
- A downpipe could flip map24's `turbo` lock only if median EWG at peak exceeds 5 %; map24 still stays locked by `final` (23.4 < 24) and the unconditional `octane`, and kta-car's boostPlus is "Never on this turbo".
- B2 proof (`kta-car.js:1748-1772`): ≥ 1 hard pull, overshoot ≤ 2.5 psi, leanest < map AFR + 0.5. No cool, two-pull, trims or 12.0 AFR check, unlike kta-build and Play B.
- Drift: phantom 3,250 rpm row (axis jumps 3,000 → 3,500); six tables (kta-car, Play B) vs two (dpCat); 41 cells per table (≥ 8 psi gate) vs 27 in Play B (columns 8–16); the trim's rpm band sits below every observed overshoot peak.

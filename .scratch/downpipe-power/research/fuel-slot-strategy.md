Label: wayfinder:research
Ticket: issues/15-fuel-slot-strategy.md
Fetched: 2026-10-05. Vendor and Help pages were read directly or through r.jina.ai, forums through r.jina.ai only. No Reddit. Source keys are listed at the bottom.

# Fuel and map-slot strategy: downpipe + HVI + RON97 + on-the-fly slots + Dual Boost Targets

Labels: **V** = vendor claim, **F** = forum or owner report, **R** = this repo's own logs or cards. Confidence: H / M / L.

## Key findings

1. **A KTuner slot cannot carry a fuel's ignition.** KTuner's own help says on-the-fly switching changes "boost targets and responsiveness levels", with three levels [K14]. Ignition, fuel and knock tables are shared by all three tunes, and so is the throttle setting [K14; F2 in `ktuner-response-tables.md`]. A "RON97 slot" can therefore only differ in boost and Turbo Responsiveness.
2. **The ECU takes a premium-fuel gain by itself, in every slot.** Honda knock control is "designed to cope with different quality fuel". The ECU learns a long-term octane estimate, "Knock Control", "at a fairly slow rate", and moves timing between a low-octane and a high-octane knock limit [H1]. No slot or flash is needed to use better fuel. All that is needed is time for the score to settle.
3. **On this map, RON97 can only win in the heat.** On cool drives Knock Control already sits at 0.49 and "timing is limited by the map, not by knock" (R: drive-check §5 #6). Owners on 91, 92, 93, 94 and 100 RON all report 0.49 as the lowest the KTuner channel reads [F3, F4, F5]. RON97 cannot read lower than 0.49. It can only keep the score from rising when RON95 would let it rise: in hot traffic (0.60 to 0.65, R). The most it can save is the timing that rise costs, about 1.6° at 0.65 on this map's 10.2° table (R: kc-ranges). That figure is a ceiling, not a promised gain.
4. **Tuners spend extra octane on ignition, not on boost.** Hondata's 91 and 93 basemaps are separate files. On the FK8, the 93 file adds "2.25 degrees >= 130 air charge" and "Nothing else is changed" [F7, cross-check car only]. TSP and Phearable sell one 22+ non-Si file for 91 or 93, with the same boost per map either way [V2, V3]. KTuner says only "Running 91+ will give the best results" [K1]. **No source raises boost for 93 on the stock-turbo non-Si.**
5. **Petrolimex sells no RON97 today.** Its own retail table on 5 Oct 2026 lists E10 RON95 Mức 5, E10 RON95 Mức 3 and E5 RON92 Mức 2 only [VN1]. Mineral RON95 and RON97 left the market on 1 Jun 2026 (Circular 50/2025/TT-BCT) [VN2]. Petrolimex is still "researching" an E10 RON97 [VN3]. E10 RON97-III exists at smaller retailers, for example S.T.S Petro [VN4].

## 1. Strategy table

| Tuner / source | Slot plan | RON95 E10 vs RON97 difference | Proof from logs | Source | Conf. |
|---|---|---|---|---|---|
| **KTuner (platform rules)** | 3 tunes switched by cruise Cancel long-press. Unplug the device and the car "will startup in Tune 1", so Tune 1 works as valet. Switching "while the vehicle is in motion" is supported. Dual Boost Targets: "Boost Target - ECO" in ECO, "Boost Target - Normal" in Normal (1.5T). | Slots differ only in boost targets and responsiveness, so a slot cannot change ignition. Basemaps: "91+ will give the best results". There is no 93-specific 22+ basemap. Starter 21 Dual Tune 2 = 18 psi ECO, 21 psi Normal/Sport. | No slot or tune channel in the 36 TunerView channels (R: drive-check §2). The slot is only known from the owner's tag. | [K14], [K11], [K1] | H (V, documented behaviour) |
| **TSP Stage 1, 22+ non-Si** (IMW-built) | Map 1 stock boost ("easy 'valet' mode when the KTuner unit is unplugged"). Map 2 16.5 psi. Map 3 24 psi Normal/Sport, 16.5 psi ECO. | None per map. "Premium fuel (91 or 93 octane) is REQUIRED", one file. A forum post says it is "designed to run on 93" [F5]. | Not published | [V2], [F5] | H (page) / M (93 design, F) |
| **Phearable Stage 1.5, 22+ non-Si** | Level 1 ≈ 16.4, Level 2 ≈ 18, Level 3 ≈ 23–24 psi. "Power level target is the same with or without Eco mode." | None per level. "93oct+ recommended 91oct at absolute minimum. Use of lower quality fuel may result in elevated k.con values which will increase knock retard." Separate "91 octane version" files exist for the Si 1.5R (F). | Knock Control (k.con) and knock retard | [V3], [F6] | H (page) / L (91-version file) |
| **Hondata FlashPro, 22+ 1.5T** | Ships "91, 93 and Flex Fuel base maps": **one file per fuel**. No multi-tune on the 22+ non-Si (`ktuner-response-tables.md` [H4]). | 10th-gen notes: "Higher octane-based fuel can have a higher limit" on the **knock ignition limit**; "all base maps were tested on 91 octane". FK8 cross-check: 93 = +2.25° ignition ≥ 130 % air charge, boost unchanged [F7]. FK8 owner: "put a 91 basemap on the second slot" [F8]. | Knock control is a "% of the difference between 100 and 90 octane" and moves slowly. Retard = knock-retard table × Knock Control. | [H1], [H2], [H3], [F7], [F8] | H (mechanism) / M (FK8 numbers, other car) |
| **IMW / DRob (forum)** | — | On non-Si ECUs "even completely stock cars will consistently raise the knock control value at higher engine speeds". The rise above ≈ 5,200 rpm "appears to be a background behavior". | Knock Control above ≈ 5,200 rpm is **not** fuel evidence. 11th-gen owners: 0.72 on 93 above 5,000 rpm, back to 0.49 when cruising [F3, F4]. Hondata: no WOT knock-control recovery after 5,500 rpm [H2]. | [F9], [F3], [F4], [H2] | M (three independent voices) |
| **This repo's logs** (RON95 E10, Starter 21 DT2) | One map line; the 3 slots are identical as digitized (Normal 21 / ECO 18). | — | Cool: 0.49 flat, map-limited. Hot traffic: 0.60–0.65. ECO (18 psi) is the safe choice when ≥ 0.60 in summer. | R: drive-check §3 #3, §4, §5; kc-ranges | H (own data) |

**Synthesis (judgement, labelled as such).** The best practice across these sources is the following.
- One file or slot per fuel exists only where a fuel changes **ignition**: Hondata 91/93 files, Hondata FK8 slot 2. KTuner slots cannot change ignition, so they are not fuel slots.
- Slot 1 is always the lowest-risk map, because the car falls back to it with the device unplugged (KTuner, TSP).
- The higher-boost slots run the same file whatever the premium fuel. Owners prove the fuel by Knock Control at matched conditions.
- For this car, the ECO button (18 psi) is the hot-day map that already exists. A separate hot-day slot adds nothing until slots 2 and 3 actually differ.

## 2. What a log can prove about RON97, and the test that proves it

The Hondata ignition formula (KTuner Help states the same rule): advance = min(MBT, MBT + knock limit − knock retard × Knock Control) [H1]. Better fuel lowers Knock Control. That raises timing **only** where the dynamic limit sat below the table. With Knock Control at its 0.49 floor, nothing is left to gain.

Proof, in order. Each step is readable in TunerView today.

1. **Settled tank.** The ECU learns "at a fairly slow rate" [H1]. After a flash it reads about 0.59 at first [F5]. Do not judge until a calm drive ends at its usual level (R: drive-check G7, "10 to 15 min of calm driving").
2. **Matched pair in the heat.** On cool drives both fuels read 0.49, so a cool pair can only ever say "no difference". A pair proves something only when the RON95 drive shows a rise: same route, same slot, ECO state and IAT within 8 °C, with IAT in the range where RON95 rose (R: ≥ 0.60 at 53 °C moving).
3. **Read Knock Control at or below 5,200 rpm only.** Above that the ECU raises the score on purpose [F9, F3, H2].
4. **Read the cost, not the score.** The question is whether the Ignition channel is higher in the same rpm / MAP cell with Knock Retard lower. A gap of 0.5° or less is inside the logging step (R: kc-fuel-test).
5. **Optional outcome check.** The 50→70 km/h time on both drives (drive-check metric 10). It is indirect and must not be used alone.

Only steps 2 to 4 together show a RON97 gain. A log **cannot** show the fuel's real RON or ethanol percentage: the Ethanol channel reads 0 because there is no flex sensor (R).

## 3. Vietnamese fuel facts (checked)

| Fact | Source | Conf. |
|---|---|---|
| Petrolimex retail list, 5 Oct 2026: E10 RON 95 Mức 5, E10 RON 95 Mức 3, E5 RON 92 Mức 2. **No RON97.** | Petrolimex price table [VN1] | H |
| From 1 Jun 2026 mineral gasoline (RON95, RON97) stopped circulating; only E10 and E5 RON92 remain (Circular 50/2025/TT-BCT). Petrolimex finished switching on 20 May. | [VN2], [VN1] | H |
| Petrolimex is still "researching" an E10 RON97 (Euro 5). | [VN3] | H (May 2026) |
| E10 RON97-III is sold by smaller retailers (S.T.S Petro lists it). | [VN4] | M (one retailer page) |
| QCVN 01:2022/BKHCN: E10 = 9–10 % ethanol by volume. Petrolimex's base standard TCCS 07:2026/PLX says **8–10 %**, citing Amendment 01:2026 (Circular 19/2026/TT-BKHCN, 30 Apr 2026). The national committee is reviewing a change to "≤ 10 %". | [VN5], [VN6], [VN7] | H |
| "III" / "V" = quality level 3 / 5 (Euro 3 / 5 class: sulfur, benzene, aromatics), **not** octane. | [VN5] | H |
| QCVN 01:2022 covers gasoline grades RON 90/92/95/97. The exact minimum RON for E10 per level was not read from the regulation text. | [VN8] | M |
| Octane scale: Honda calibrates knock control between RON 90 and 100, "approx 85 and 95 octane r+m/2". By that rule RON95 ≈ 90 AKI and RON97 ≈ 92 AKI. This is an estimate: VN pumps publish no MON. | [H1] | M |

## 4. Safe / unsafe

**Safe**
- Filling E10 RON97-III in any slot. The ECU adapts by itself, slowly [H1]. No flash is needed.
- Mixing E10 RON95 and E10 RON97 in one tank. Both are E10 in the same 8–10 % band, so the tank holds an in-between fuel. **But** that tank cannot be tagged as either fuel for the test.
- Keeping **Slot 1 = the RON95-proven map** (today's Starter 21 Dual Tune 2). With the device unplugged the car starts in Tune 1 [K14]. TSP uses Map 1 the same way [V2].
- Using the **ECO button (18 psi on Dual Tune 2)** as the hot-day / unknown-fuel / traffic map. It already exists, so no flash is needed (R: drive-check §5; [K11]).
- Switching slots while moving at light load. KTuner supports it and shortens the press when moving [K14]. Start a new log after a switch, because no channel records the slot.

**Unsafe or unproven**
- **Raising boost "because RON97".** No vendor does it for the stock-turbo non-Si [V2, V3, K1]. On this map premium fuel buys at most the timing that heat costs (≈ 1.6° at 0.65, R). Any boost step follows the proof-gated Boost-step method (ticket 06), proven on the **worst fuel the slot may see**.
- Putting a higher-boost "RON97 slot" in Slot 1, or using it on a tank that holds RON95 or unknown fuel. The ignition is shared, so only Knock Control would protect the engine, and it reacts slowly [H1].
- Changing ignition or the knock limit for RON97. That is the real premium-fuel change Hondata makes [H2, F7], but it is outside the product (PRODUCT.md) and belongs to a custom e-tune.
- Judging the fuel by Knock Control **above 5,200 rpm**, by the **first drive after a fill or a flash**, or by a **cool-day pair** (both read 0.49).
- Topping up with extra ethanol (the US "gallon of E85" practice, [F10]). There is no flex sensor (Ethanol = 0), and the map assumes E10.
- Hard pulls on a heat-soaked restart, on any fuel (R: drive-check §1).
- Telling the owner Petrolimex sells RON97. It does not, as of 5 Oct 2026 [VN1].

## 5. Conflicts with repo files

1. **`engine/kta-car.js` `KTA.carFuelTest` uses the raw `kcPeak`.** That peak includes the deliberate rise above 5,200 rpm. `kta-engine.js` already computes `kcPeakJudged` (≤ `score.highRpm` 5,200) for verdicts and says the rise "does not count". A RON97 tank driven harder up top would look *worse*. Fix: pair on the judged (≤ 5,200 rpm) peak [F9, F3, H2].
2. **`carFuelTest` accepts cool pairs.** Two cool drives both read 0.49 and give "no measurable difference", which proves nothing on this car. The test should require the RON95 drive of the pair to show a rise above baseline (for example ≥ watch 0.56), or say "can't tell: too cool to separate the fuels".
3. **`carFuelTest` does not check "settled".** `kc-fuel-test` tells the owner to wait until Knock Control settles, but the engine pairs any tagged drive, including the first one after a fill or a flash (start ≈ 0.59 [F5]). Fix: skip drives whose `kcStart` sits above baseline, or the first drive after a Flash.
4. **`kc-fuel-test`: "A real gain shows as a lower Knock Control peak under the same pulls."** This is incomplete. On this map the gain can only show in heat, and only ≤ 5,200 rpm. The card should say so and set the expectation: at most the timing heat costs (R: kc-ranges), not power on a cool day.
5. **`kc-fuel-test`, `CONTEXT.md` (Fuel tag), `PRODUCT.md` l.56, `README.md` l.10, `desk.py` chip: "E10 RON97 III".** The name is valid (S.T.S Petro sells it [VN4]), but **Petrolimex does not sell it** [VN1]. Also, the tag set has no **E10 RON95-V** (Mức 5), which Petrolimex does sell. It has the same octane and is Euro 5 clean [VN5]. Add it as a RON95 variant, or tell owners to tag it as RON95.
6. **`kc-e10`: "Vietnam RON95 is about US 91 by estimate".** Hondata's own conversion (RON 90–100 ≈ 85–95 AKI [H1]) puts RON95 at ≈ 90 AKI, **at or below** the 91 floor every vendor names [K1, V2, V3]. Word it as "about 90–91, at the floor".
7. **`kc-e10` and `kc-e10-trim-baseline`: E10 = 10 %.** The ethanol band is 9–10 % (QCVN) or 8–10 % (Petrolimex TCCS 07:2026) [VN6]. That does not change the card's trim logic, because closed loop absorbs it. Card numbers that assume exactly E10 should say "8–10 %".
8. **`kp-how-ktuner-on-the-fly-map-switching-works` / `kp-how-ktuner-picks-between-the-dual-boost-targets`** are still "not readable". Both pages were read today [K14, K11] and can be sourced into cards. Key facts: 3 tunes, boost targets and responsiveness only, Tune 1 at key-on when unplugged, switching allowed while moving; ECO table in ECO mode, Normal table in Normal (1.5T).
9. **`desk.py` "slots" limit: "can't yet tune a separate RON97 map in its own slot".** This **agrees**: no separate RON97 map is needed or possible for ignition. Reword it from "can't yet" to "not needed: the ECU adapts to better fuel by itself" so it does not promise a future feature.
10. **`CONTEXT.md` Map slot: "Drives on different slots are never compared".** This rule holds, but the log cannot verify the slot (there is no slot channel), and a mid-drive switch breaks the tag. Add: "switch slots only between logs".

## Answer

- **Don't raise boost for RON97.** No tuner does it on the stock-turbo non-Si. TSP, Phearable and KTuner run the same boost on 91 or 93. Hondata's premium file changes ignition only (FK8 cross-check).
- **KTuner slots can't hold a fuel's ignition.** They switch only boost targets and responsiveness. The ECU takes the octane gain itself by slowly learning Knock Control.
- **On this map RON97 can only pay off in heat.** Cool drives already sit at the 0.49 floor and are map-limited. The ceiling is the ≈ 1.6° that heat costs at 0.65, not power on a cool day.
- **Proof** is a settled tank and a hot matched pair (same slot, ECO state, route, IAT ±8 °C). Read Knock Control, Knock Retard and Ignition at ≤ 5,200 rpm only. More than 0.5° better on RON97 is a gain; anything less is none.
- **Slots:** keep Slot 1 = Starter 21 DT2 (RON95-proven, what the car falls back to unplugged). Leave slots 2 and 3 identical. Use ECO (18 psi) as the hot-day / unknown-fuel map.
- **Fuel facts:** Petrolimex sells no RON97 (E10 RON95-III/-V and E5 RON92 only). E10 RON97-III is at smaller retailers. E10 = 8–10 % ethanol.
- **KTuner action: none (no map change).** App action: make `carFuelTest` use the ≤ 5,200 rpm peak, require a hot pair and a settled start, and fix the card and fuel-tag wording.

## Sources

KTuner (vendor)
- [K1] 22+ Civic 1.5T page (basemaps, "Running 91+ will give the best results", Dual Tune 2 = 18 psi ECO): https://ktuner.com/22civicturbo/
- [K11] Dual Boost Targets: http://www.ktuner.com/KTunerHelp/dual_boost_targets.htm
- [K14] On The Fly Map Switching: http://www.ktuner.com/KTunerHelp/on_the_fly_map_switching.htm

Hondata (vendor)
- [H1] Knock control tables (octane estimate, slow learning, ignition formula, 90/100 RON ≈ 85/95 AKI): https://www.hondata.com/help/flashpro/knock_control_tables.htm
- [H2] 10th-gen Civic tuning notes (knock ignition limit by octane, base maps tested on 91, no WOT knock-control recovery after 5,500 rpm): https://www.hondata.com/help/flashpro/10g_civic_notes.htm
- [H3] FlashPro 22+ Civic 1.5T ("ships with 91, 93 and Flex Fuel base maps"): https://www.hondata.com/flashpro-civic-2022

Tune vendors
- [V2] TSP Stage 1, 2022+ non-Si: https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si
- [V3] Phearable Stage 1.5, 11th-gen non-Si: https://www.phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-non-si/stage1-5-nonsi-11thgen.html

Forums (r.jina.ai; corroboration only)
- [F3] civic11forum "K-Con (Knock Control)" (0.49 floor, spikes after 5,200 rpm, 0.72 on 93): https://www.civic11forum.com/threads/k-con-knock-control.6222/
- [F4] CivicXI "What is Knock Count and Knock Control defined": https://www.civicxi.com/forum/threads/what-is-knock-count-and-knock-control-defined.38412/
- [F5] CivicX "KTuner knock control question" (0.49–0.53 outstanding, ".59 is the exact starting point when you flash", 0.49 on 91 and 94): https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/ ; CivicX "K-control values running high" (TSP "designed to run on 93", E85 top-up): https://www.civicx.com/forum/threads/k-control-values-running-high.47886/
- [F6] CivicXI "The Tuned 11th gen Experience & Reliability Thread" (Phearable 1.5R "91 octane version"; K.Con above 0.8 on 91): https://www.civicxi.com/forum/threads/the-tuned-11th-gen-experience-reliability-thread-for-all-models.50251/
- [F7] CivicX "Analyzing Hondata's basemaps" (FK8; 93 = +2.25° ≥ 130 air charge, nothing else): https://www.civicx.com/forum/threads/analyzing-hondatas-basemaps.44983/
- [F8] CivicX "Hondata 91 vs 93 vs Open" (91 basemap on second slot): https://www.civicx.com/forum/threads/hondata-91-vs-93-vs-open.60302/
- [F9] CivicXI "Controlling knock control" (Derek Robinson / IMW: background rise above ≈ 5,200 rpm on non-Si ECUs): https://www.civicxi.com/forum/threads/controlling-knock-control.41116/page-2
- [F10] Same thread as [F5] (K-control running high), the E85 top-up advice.

Vietnam fuel
- [VN1] Petrolimex home page / E10 transition notice with retail table (read 5 Oct 2026): https://www.petrolimex.com.vn/ ; https://www.petrolimex.com.vn/nd/tin-chuyen-nganh/petrolimex-day-nhanh-chuyen-doi-kinh-doanh-xang-e10-tu-giua-thang-5-2026.html
- [VN2] VietNamNet, 1 Jun 2026, mineral RON95/RON97 stop; Circular 50/2025/TT-BCT: https://vietnamnet.vn/tu-hom-nay-1-6-xang-e10-ban-dai-tra-dung-luu-hanh-xang-ron95-ron97-2520897.html
- [VN3] CafeF, 15 May 2026, Petrolimex researching E10 RON97: https://cafef.vn/petrolimex-ban-xang-e10-toan-quoc-tu-20-5-nghien-cuu-them-loai-cao-cap-e10-ron97-188260515070107429.chn
- [VN4] S.T.S Petro product page "Xăng E10 RON 97-III": https://stspetro.com/ten-san-pham-05 (search-result price only; page not read in full)
- [VN5] VnExpress, 29 May 2026, E10 RON95-III vs -V (QCVN 01:2022, 9–10 % ethanol, III/V = quality level): https://vnexpress.net/xang-e10-ron-95-iii-va-e10-ron-95-v-khac-nhau-the-nao-5079088.html
- [VN6] Petrolimex Sài Gòn, conformity of E10 RON95 (TCCS 07:2026/PLX, 8–10 %, Amendment 01:2026 / Circular 19/2026/TT-BKHCN): https://saigon.petrolimex.com.vn/linh-vuc-hoat-dong/linhvuc-kd-hang_hoa/chung-nhan-hop-quy-xang-e10-ron-95.html
- [VN7] TCVN committee, 4 Mar 2026, review of QCVN 01:2022 (proposal "≤ 10 %"): https://tcvn.gov.vn/ra-soat-qcvn-012022-bkhcn-ve-xang-nhien-lieu-diezen-va-nhien-lieu-sinh-hoc/04/03/2026/
- [VN8] Lạng Sơn Dept. of Science & Technology summary of QCVN 01:2022 (RON 90/92/95/97 grades): https://sokhcn.langson.gov.vn/tin-tuc-su-kien/pho-bien-van-ban-phap-quy-moi2/quy-chuan-ky-thuat-quoc-gia-moi-ve-xang-nhien-lieu-diezen-va-nhien-lieu-sinh-hoc.html

Repo (R)
- `engine/kta-car.js` `KTA.carFuelTest`; `engine/kta-engine.js` (`kcPeakJudged`, `score.highRpm` 5,200); `knowledge/cards/kc-fuel-test.md`, `kc-e10.md`, `kc-e10-trim-baseline.md`, `kc-ranges.md`; `knowledge/proposed/kp-how-ktuner-*`; `CONTEXT.md` (Fuel tag, Premium-fuel test, Map slot); `PRODUCT.md`; `server/kta_server/desk.py`; `docs/research/drive-check-tuner-analysis.md` §2–§5; branch `research/ktuner-response-tables`, `research/tuner-practice`.

Not reached: a Hondata or KTuner statement of what differs between 91 and 93 files for the **22+ non-Si** specifically (the FK8 analysis is the nearest), and the QCVN 01:2022 E10 octane table itself (paywalled; the summaries above were used).

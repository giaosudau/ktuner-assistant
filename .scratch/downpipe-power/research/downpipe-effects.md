# Downpipe effects on the 1.5T: 200-cell, 400-cell GESI, catless

Ticket: `.scratch/downpipe-power/issues/02-downpipe-effects.md`. Researched 2026-10-05.
Car: Civic FE (11th gen) 1.5T CVT, KTuner Starter 21. Civic X (FC/FK, L15B7) data is labelled **10th gen** and is cross-check evidence only, never card numbers.
Forums read in full through `https://r.jina.ai/<url>`. No Reddit. "Vendor" = the seller of the part; "tuner" = a tuning shop selling maps; "owner" = a forum post by one owner.

## Answer

1. **Power is small and only vendor-measured.** 200-cell 27WON on an untuned 11th gen: +12 whp / +13 wtq peak, about +8 / +9 average (vendor). 27WON's own first post said +7 hp / +11 tq. No independent 11th-gen dyno found; TSP and RV6 publish none.
2. **Catless over a good catted pipe: about 0-6 whp**, mostly a little earlier spool (PRL, owners, 27WON 10th-gen chart). Not worth the code, smell and inspection risk.
3. **Spool: 200-400 rpm earlier** torque on 10th-gen dynos (27WON, PRL, Vit Tuned). No 11th-gen boost-at-rpm numbers found.
4. **Overshoot on the same map:** about +0.9 psi at the same target (Vit Tuned, 10th gen catless); catless 10th gens on maps not adjusted for the pipe logged spikes of up to about 4 psi. No 11th-gen numbers found. This owner's log shows ≤ +0.1 psi overshoot with DP + front pipe.
5. **Turbo headroom:** no before/after wastegate log found anywhere. This car's 2.5 % wastegate at ≥ 15 psi already comes with a downpipe fitted, so the downpipe opened no real headroom. kc-expectations stands.
6. **Codes:** 200-cell (27WON) sets P0420 for most owners (vendor: "CEL can be illuminated"). 400-cell GESI (TSP, RV6, ex-PRL HV) claims no CEL, and owners report none. Catless always sets P0420. No code rates found, only reports.
7. **O2 spacer / defouler: mixed.** It works for some 27WON owners; PRL found it did not; it can swap P0420 for a slow-response code (P1039).
8. **Sensor:** only the **rear (secondary) O2** sits in the downpipe and moves; 27WON's install guides for both gens leave the front A/F sensor alone. kc-p0420 and dpCat say the opposite.
9. **Vietnam:** from 1 Mar 2026 (QCVN 85:2025) a petrol car gets a tailpipe CO/HC/lambda test plus a check that the MIL bulb lights at key-on and goes out once the engine runs. Mức 4 for 2022+ cars is CO ≤ 0.5 %, HC ≤ 300 ppm; Hà Nội and HCM move to Mức 5 (0.3 % / 150 ppm) from 2028. No source says inspectors read OBD monitors. Separately, a self-made structural change carries a 65-75 M VND fine (ND 168/2024).

## Fact sheet

Conf = confidence. Src kinds: V vendor, T tuner, O owner/forum, R regulation/official, P press.

| # | Claim | Number | Sources (kind) | Conf |
|---|---|---|---|---|
| 1 | 27WON 11th-gen DP uses a 200-cell metallic-foil cat, 80 mm bellmouth | 200 cpsi | 27WON product page (V); TSP listing of the same part (V, search snippet) | high (spec) |
| 2 | 27WON 11th-gen DP gain, no tune, over OEM DP | +12 whp / +13 wtq peak; ~+8 whp / +9 wtq avg 2,000-6,500 rpm | 27WON product page (V); Vincent@27WON, civicxi launch thread #13, Feb 2022 (V) | medium as a vendor claim; **low** as a fact (no independent dyno) |
| 3 | 27WON's first published 11th-gen figure was lower | +7 hp / +11 tq peak | Vincent@27WON, civicxi launch thread #3, Nov 2021 (V); owner reply "Seems low" (O) | high that it was said |
| 4 | 27WON 10th-gen DP, no tune: earlier spool, no top-end gain | +13 whp / +13 wtq peak; spool gain 2,000-2,500 rpm; "little to no gains" 5,500+ | 27WON design blog part 2 (V) | medium (vendor) |
| 5 | PRL 10th-gen catted (300 cpsi, 4.0") DP + front pipe, untuned CVT | +10 whp / +14 lb-ft peak; peak torque ~400 rpm sooner | PRL posts in civicxi 8633 and 10thcivicforum 15153 (V, same text on 2 forums) | medium (vendor) |
| 6 | Same PRL test "+40 whp / +50 lb-ft at 4,300 rpm" includes Hondata's +6 psi flash, not the pipe alone | — | PRL post (V); owner correction in the same thread (O) | high |
| 7 | Same boost before vs after a (catless PRL race) DP, 10th gen 6MT | Target cut 18.4 → 17.5 psi to hold the same boost; +8-9 whp top, +10-20 wtq; torque 200-300 rpm sooner; +1 psi with retimed map: +20 whp, +30-32 wtq | Vit Tuned blog, quoted by PRL in civicxi 8633 and 10thcivicforum 15153 (T via V). Blog itself timed out | medium |
| 8 | Catless vs good catted pipe | PRL: old catted lost 5-6 whp to catless; owner: 3-5 whp; 27WON 10th-gen chart: catted ≈ catless at peak, catless spools slightly sooner | civicx 69508 p2 (O citing V); civic11forum 1357 (O); civicx 92701 (O reading 27WON chart) | medium |
| 9 | TSP 400-cell GESI DP for 22+ 1.5T | 4.5" OD, 400 cpsi GESi G-Sport, "EPA compliant", rated 850 hp; "will NOT result in a check engine light"; no tune | TSP product page (V); Phearable, Hybrid Racing, Unity listings (V resellers) | high (spec), medium (no-CEL claim) |
| 10 | TSP 1.5T dyno numbers | **not found**. The page lists only "Increased power… decreased backpressure" | TSP product page (V) | — |
| 11 | RV6 GESi DP for 22+ 1.5T | 400 cpsi GESi G-Sport, 4.5" core, 3.0" outlet, "(No CEL)"; RV6 dyno **not found** | RV6 product page (V); TSP listing of the RV6 part (V) | high (spec) |
| 12 | TSP HE DP = the discontinued PRL High Volume DP design | 4.5" 400 cpsi vs PRL's old 4.0" 300 cpsi: +27 % cat face area | TSP rep in civicxi 56069 and 53540 (V); PRL post in civicx 69508 (V) | high |
| 13 | 400-cell GESI pipes in owner use: no codes | PRL HV: "never had a single code"; PRL HV owner passed NY OBD test, factory tune, no disables | civicxi 53540 (O); civicx 73861 (O) | medium |
| 14 | 200-cell 27WON sets a CEL for most owners | Vendor: "CEL can be illuminated"; owners: CEL after ~2 days; disabled P0420 in KTuner | 27WON product page (V); civicxi 51165 (O); civic11forum 7481 and 1357 (O); civicxi 53540 (O) | high |
| 15 | P0420 / rear-O2 code **rates** per class | **not found** (reports only, no counts) | — | — |
| 16 | Catless sets P0420; a Hondata disable still came back after 2 days (FL5) | — | civicxi 54186 (O, FL5); civic11forum 1357 (O) | high (code), low (FL5 relapse cause) |
| 17 | O2 spacer / defouler on a catted DP: mixed | 27WON: two owners no CEL with spacer, one used a 46 mm M18×1.5 plug; PRL (10th gen, 300 cpsi): spacer "does not look to be" a fix; RV6 FL5: P1039 slow response, 2 CELs in 1,000-1,500 mi; civicx: defouler can trade for slow-response code | 27WON reviews (O on V page); PRL in civicxi 8633 (V); civicxi 52487 (O); civicx 71440 (O) | medium |
| 18 | Only the rear (secondary) O2 sensor is in the downpipe | 11th-gen 27WON guide: unplug and refit the secondary O2 only; 10th-gen guide: "Move the primary O2 sensor wire" aside, refit secondary into a defouler | 27WON install guide L15-6-209-15 (V); 27WON 10th-gen install PDF (V) | medium (one web page claims the A/F is in the downpipe; see contradictions) |
| 19 | Exhaust leak near an O2 sensor skews it lean; a leak can pull air in some inches downstream of the sensor | AFR read ~20-25:1 after a DP install leak (9th gen) | search snippets: 9thgencivic "PO2 exhaust leak after downpipe install" (O), dsmtuners (O); civicx 89797 lists leaks as a P0420 cause (O) | medium (general), low (1.5T-specific) |
| 20 | Overshoot on an unchanged map after a DP (10th gen) | KTuner 21.5 psi target, catless: overshoots "pretty much all your targets"; Hondata +9: 22-24 → 23-27 psi in Sport; TSP Stage 1 + catless: target 23, spikes to 27.4 | civicx 41481, 22106, 73190 (O) | medium (10th gen only) |
| 21 | Mechanism: less turbine back pressure → turbo spools faster at the same wastegate position → ECU must open the gate more | — | civicx 41481 (O); 27WON and TSP pages "reduce back-pressure" (V) | medium (physics agrees) |
| 22 | Wastegate position at the same boost, before vs after | **not found** in any log or post | — | — |
| 23 | Backpressure in kPa before vs after | **not found**. Proxies only: cell count (200 cpsi cells are "2x the size" of 400 per PRL) and cat diameter | civicx 69508 (V) | — |
| 24 | OEM 1.5T cat cell density | **not found**. "600-800 cells" appears only in a Gemini answer pasted into civicxi 62265 | — | — |
| 25 | Sound: deeper tone, more pops, louder in the cabin; a stock catback hides most of it | TSP DP + PRL FP: new in-cabin tones near 4k rpm; 27WON + stock exhaust: "no droning"; a CVT owner heard no change with the stock catback | civicxi 56069 (O); civic11forum 7481 (O); civic11forum 7730 (O); 27WON reviews (O) | medium |
| 26 | Smell: catless brings exhaust smell into the cabin; catted does not | — | civicx 92701 (two owners, O); civic11forum 1357 (O: "no smell" with high-flow cat); 27WON (V) | medium |
| 27 | Drone from a downpipe | **not found** as a DP problem; drone posts are about catbacks | — | — |
| 28 | VN in-use emissions test for petrol cars from 1 Mar 2026 | Low idle then high idle; CO, HC, CO2, O2, lambda; **MIL must light at key-on and go out after start**; exhaust system must have no leaks | tapchixaydung "quy trình…xe xăng" (P, quoting the procedure); gotech.vn (P); thanhnien 1.3.2026 (P) | high |
| 29 | VN limits by build year (QCVN 85:2025/BNNMT, QĐ 43/2025/QĐ-TTg) | 2022+ cars: Mức 4 = CO 0.5 %, HC 300 ppm. Hà Nội and HCM: Mức 5 (CO 0.3 %, HC 150 ppm) from 1 Jan 2028; nationwide Mức 5 for 2022+ from 2032 | luatvietnam QCVN 85 table (R); dantri, gotech, nld (P) | high |
| 30 | VN inspection reads OBD readiness monitors | **not found**: both procedure write-ups describe only the MIL bulb check plus tailpipe gas | tapchixaydung, gotech (P). QCVN text on thuvienphapluat blocked (captcha) | low (absence of evidence) |
| 31 | A catless 2022+ 1.5T exceeds Mức 4 at idle | **not found** | — | — |
| 32 | Unapproved structural change to a car: fine | 65-75 M VND (person), 130-150 M (organisation), ND 168/2024 | otosaigon summary (P); carpla on Điều 32 (P). Whether a downpipe swap is "thay đổi kết cấu": no ruling found | medium (fine), low (applies to a DP) |
| 33 | VN shops describe catless DPs as setting CEL and not fit for đăng kiểm | — | daotaooto.edu.vn (P); no Otofun owner thread on 1.5T downpipes found | low |
| 34 | KTuner P0420 switch: Main Parameters → Disables/Monitors | — | civicxi 53656 (O); civicxi 51165 (O) | high |
| 35 | In US states that read OBD (MA, NY) a disabled monitor can fail inspection | — | civicxi 53656 (O, MA); civicx 62345 (O); civicx 73861 (O, NY) | medium (US only) |

## Per class

### 200-cell catted (27WON)
- **Flow:** least restrictive catted option (owner: "least restrictive downpipe with a 200 cell cat"). Bigger cells than 400 cpsi. Measured backpressure not found.
- **Power:** vendor +12 whp / +13 wtq peak, +8 / +9 average, factory ECU, no tune. The vendor's earlier figure was +7 / +11. Independent 11th-gen dyno not found. On a tuned car (Starter 21) the gain is unmeasured.
- **Spool / overshoot:** 10th-gen vendor chart shows a 2,000-2,500 rpm spool gain and nothing above 5,500. 11th-gen overshoot not found.
- **Codes:** expect P0420 within days (vendor and several owners). A spacer works for some; others need the KTuner disable.
- **Sound:** deeper, pops on lift; a stock catback mutes most of it.

### 400-cell GESI catted (TSP HE, RV6 GESi, ex-PRL HV)
- **Flow:** 4.5" OD core; its face area makes up for the denser cells (PRL: +27 % area over its old 4.0" pipe). No published backpressure.
- **Power:** **no dyno published** by TSP or RV6 for the 1.5T. One owner says a plot "didn't show much of an improvement" (civic11forum 7481, unsourced). For 10th-gen, PRL expected it to match its old catted pipe (no test run).
- **Codes:** TSP and RV6 claim no CEL and no tune needed. Owners of the same PRL design report none, and one passed a NY OBD test on the factory tune. Older RV6 pipes were 300 cpsi and threw codes (see contradictions).
- **Best fit** for a car that must pass inspection: same small power, keeps the monitor on.

### Catless
- **Power:** 0-6 whp over a good catted pipe, mostly earlier spool (row 8). Big claims (owner "270whp/350wtq") come with E30 and an intercooler and "nuked rods": not this car.
- **Overshoot:** the worst of the three on 10th gens (rows 7, 20).
- **Codes:** always P0420. The disable hides it from the MIL.
- **Smell / sound:** cabin exhaust smell, rasp.
- **Vietnam:** a tailpipe test at idle could fail with no cat (2022+ limit CO 0.5 % / HC 300 ppm), but no measurement was found. Separately, an unapproved change can carry the ND 168 fine. Stays `notForThisCar`.

## Contradictions with today's repo

| File | Today's text (≤ 15 words) | Evidence | Fix direction |
|---|---|---|---|
| `knowledge/cards/kc-p0420.md` | "A downpipe moves the front oxygen sensor into a new pipe" | Rows 18: the 27WON guides move only the **rear** O2; the front A/F stays put | Say the rear O2 sensor moves with the pipe |
| `knowledge/cards/kc-p0420.md` | "an OBD inspection can see the disabled monitor, and the car fails đăng kiểm" | Rows 28, 30: VN procedure checks the MIL bulb and tailpipe gas; no OBD monitor read found. The "can see the monitor" risk comes from US states (row 35) | Reword: VN tests tailpipe gas and the MIL; a catless car risks the gas test and the ND 168 fine. Keep "don't disable to pass" stance |
| `knowledge/cards/kc-p0420.md` | "Prefer a high-cell-count catted pipe or an oxygen sensor spacer first" | Row 17: spacer results mixed, can trade P0420 for P1039 | Keep the high-cell pipe first; call the spacer hit-and-miss |
| `engine/kta-build.js` dpCat step 1 | "the factory A/F sensor sits in the downpipe, so any leak ahead of it reads lean" | Row 18 | Leak check stays (row 19), reason changes: a leak near the rear O2 skews the cat check and trims |
| `engine/kta-build.js` dpCat `gain` | "+12 whp / +13 lb-ft on the stock map (27WON dyno, no tune)" | Rows 2-3: 27WON tested the factory ECU, not a tuned map; their own first figure was +7 / +11 | "27WON claim, factory ECU: +12 whp peak, ~+8 average; unmeasured on Starter 21" |
| `engine/kta-build.js` claim `dp12` | verdict 'true', conf 'medium', one source `won27dp` | One vendor source only, the vendor gave two figures, no independent 11th-gen dyno | `partly` / `low`, labelled vendor claim |
| `engine/kta-build.js` claim `dp12` note | "27WON says a code (CEL) will come on" | Product page says "CEL can be illuminated" (row 14). Owners say it usually does | Quote the vendor wording; owners report it within days |
| `engine/kta-build.js` catless `change` | "fails the đăng kiểm emissions test" | Rows 28-31: test is tailpipe CO/HC + MIL bulb; no measurement shows a catless 1.5T failing | "risks failing the tailpipe test, and an unapproved change can be fined" |
| `engine/kta-build.js` dpCat `features` | "TSP's 400-cell pipe claims no code" | Agrees (row 9); RV6 22+ GESi also claims it (row 11) | Add RV6, keep "claims" |
| civicxi 62265 (FL5 thread) vs RV6 page | "27won (200) or RV6 (300) will trigger a CEL" | RV6 22+ page: 400 CPSI GESi "(No CEL)". The 300 figure fits older RV6 and PRL pipes | Treat RV6 22+ GESi as the 400 class; ask the owner which RV6 they have |
| `knowledge/cards/kc-expectations.md` | "nearly all exhaust already drives the turbine" | Consistent: row 4 (no gain above 5,500 rpm, "OE turbo is the real bottle-neck") and this car's 2.5 % gate already with a DP fitted (owner-voices §2 row 5, fact-check §4). No contradiction | None. A downpipe is not a headroom fix |

Not contradicted: dpCat's overshoot rule (> +2.5 psi → −1 psi at 2,500-3,250 rpm) fits rows 7 and 20; dpCat "Turbo spools sooner on the same map" fits rows 4, 5, 7.

## Sources

Vendor and tuner pages
- 27WON 11th-gen downpipe: https://store.27won.com/2022-civic-turbo-performance-downpipe-11th-gen.html
- 27WON 11th-gen install guide L15-6-209-15: https://www.performanceinstalls.com/Guide/L15-6-209-15+11th+Gen+Downpipe/175
- 27WON 10th-gen install PDF: https://store.27won.com/support/instructions/L15-6-209-Honda-Civic-SI-Downpipe-Installation-Instructions.pdf
- 27WON 10th-gen design blog part 2: https://www.27won.com/blog/downpipe-design-blog-part-2
- TSP High Efficiency DP (1.5T): https://www.twostepperformance.com/products/high-efficiency-downpipe-upgrade-for-2022-honda-civic-1-5t-2023-acura-integra-1-5t-2018-honda-accord-1-5t
- RV6 GESi DP 22+ Civic 1.5T: https://rv6-p.com/products/rv6-high-temp-catted-downpipe-for-22-civic
- Hybrid Racing TSP listing: https://www.hybrid-racing.com/products/two-step-performance-high-efficiency-downpipe-22-civic-23-integra-18-22-accord-1-5t
- Phearable 11th-gen guide (DP ranked after intercooler and intake, no number): https://www.phearable.net/information/tech-area/11th-gen-civic-modification-guide.html
- Vit Tuned PRL race DP test (timed out; quoted in PRL threads): http://blog.vittuned.com/tested-prl-motorsports-civicx-race-downpipe/

Forums (CivicXI, Civic11forum, CivicX, 10thcivicforum)
- civicxi 27WON launch: https://www.civicxi.com/11th-gen-honda-civic-downpipe-from-27won-launches/
- civicxi 51165 27WON O2 CEL: https://www.civicxi.com/forum/threads/27-won-downpipe-oxygen-sensor-is-tripping-emissions-light.51165/
- civicxi 53656 catted downpipe: https://www.civicxi.com/forum/threads/catted-downpipe.53656/
- civicxi 53540 aftermarket downpipe: https://www.civicxi.com/forum/threads/aftermarket-downpipe.53540/
- civicxi 56069 downpipe differences: https://www.civicxi.com/forum/threads/downpipe-differences.56069/
- civicxi 54186 CEL after catless (FL5): https://www.civicxi.com/forum/threads/check-engine-light-after-installing-catless-downpipe-and-front-pipe.54186/
- civicxi 52487 RV6 P1039 (FL5): https://www.civicxi.com/forum/threads/rv6-catted-downpipe-and-p1039-cel.52487/ and /page-2
- civicxi 62265 DP without tune (FL5, contains a pasted Gemini answer, not used as evidence): https://www.civicxi.com/forum/threads/installing-downpipe-without-getting-tune-have-effect-on-motor.62265/
- civicxi 8633 PRL 10th-gen DP: https://www.civicxi.com/forum/threads/prl-motorsports-downpipe-front-pipe-pre-order-1-5t-civic-x.8633/
- 10thcivicforum 15153 PRL development: https://www.10thcivicforum.com/threads/prl-motorsports-1-5t-civic-product-line-development.15153/
- civic11forum 7481 DP options: https://www.civic11forum.com/threads/downpipe-options-27won-need-some-suggestion.7481/
- civic11forum 1357 catless: https://www.civic11forum.com/threads/catless-downpipe.1357/
- civic11forum 7047 how much difference: https://www.civic11forum.com/threads/how-much-difference-does-a-downpipe-make.7047/
- civic11forum 7730 DP and tune: https://www.civic11forum.com/threads/downpipe-and-tune-on-22-civic-1-5t.7730/
- civicx 41481 24 psi after DP: https://www.civicx.com/forum/threads/24psi-after-downpipe-install.41481/
- civicx 22106 boost spike: https://www.civicx.com/forum/threads/boost-spike-with-test-pipe-hollow-cat.22106/
- civicx 73190 overboost: https://www.civicx.com/forum/threads/overboost-pls-help.73190/
- civicx 69508 PRL High Volume: https://www.civicx.com/forum/threads/prl-motorsports-10th-gen-civic-1-5t-high-volume-downpipe.69508/ and page-2
- civicx 92701 catless recommendations: https://www.civicx.com/forum/threads/catless-downpipe-recommendations.92701/
- civicx 73861 catted DP, NY OBD: https://www.civicx.com/forum/threads/catted-downpipe.73861/
- civicx 62345 P0420, MA: https://www.civicx.com/forum/threads/got-a-p0420-cel.62345/
- civicx 71440 weird P0420: https://www.civicx.com/forum/threads/weird-p0420-error-and-behavior.71440/
- civicx 51570 PRL or MAPerformance: https://www.civicx.com/forum/threads/prl-of-maperformance-downpipe.51570/
- civicx 89797 11th-gen non-Si codes: https://www.civicx.com/forum/threads/11th-gen-civic-non-si-codes.89797/

Vietnam
- Procedure, petrol cars (QCVN 85:2025 method): https://giaothong.tapchixaydung.vn/quy-trinh-kiem-tra-khi-thai-xe-o-to-chay-bang-xang-theo-quy-dinh-moi-183290000000000590.htm
- QCVN 85:2025/BNNMT limits table: https://luatvietnam.vn/giao-thong/quy-chuan-ky-thuat-quoc-gia-qcvn-85-2025-bnnmt-khi-thai-xe-o-to-tham-gia-giao-thong-duong-bo-408747-d3.html
- gotech.vn summary: https://gotech.vn/quy-dinh-khi-thai-xe-o-to/
- Thanh Niên, 1.3.2026 rules: https://thanhnien.vn/quy-dinh-moi-ve-dang-kiem-o-to-tu-132026-chu-xe-can-biet-185260227143629988.htm
- Dân Trí, from 1/3: https://dantri.com.vn/thoi-su/tu-13-se-siet-chat-kiem-dinh-khi-thai-o-to-20260211095939934.htm
- Người Lao Động: https://nld.com.vn/tu-thang-3-2026-o-to-khong-dat-muc-khi-thai-co-bi-cam-luu-thong-196251201113351936.htm
- ND 168/2024 car fine summary (otosaigon): https://www.otosaigon.com/threads/loi-do-xe-o-to-tu-y-thay-doi-ket-cau-co-the-bi-phat-toi-150-trieu-dong.10031025/
- carpla on Điều 32 khoản 8: https://carpla.vn/blog/do-po-co-bi-phat-khong
- daotaooto downpipe explainer: https://daotaooto.edu.vn/tin-tuc/downpipe-la-gi-trong-o-to-cong-dung-cau-tao-luu-y-khi-lap-466.html
- Otofun threads read, no downpipe or OBD content: https://www.otofun.net/threads/quy-dinh-khi-thai-khi-dang-kiem.1310633/, https://www.otofun.net/threads/ban-ve-quy-dinh-moi-khi-thai-xe-oto-tai-hn-tu-2026.1935045/

## Gaps
- No independent 11th-gen dyno for any class; no TSP or RV6 numbers at all.
- No 11th-gen log showing boost-at-rpm or wastegate position before vs after. The cheapest fix is the owner's own TunerView logs: same route, before and after.
- No measured backpressure (kPa) or OEM cat cell count.
- Vietnamese owner voices on 1.5T downpipes (Otofun, Facebook) still not found; QCVN 85 full text not read (captcha).

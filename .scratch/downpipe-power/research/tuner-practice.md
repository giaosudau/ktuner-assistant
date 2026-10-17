Label: wayfinder:research
Ticket: issues/03-tuner-practice.md
Fetched: 2026-10-05 (r.jina.ai for tuner and forum pages; vendor dyno images opened directly). No Reddit.

# What Honda tuners and remap shops change after a downpipe on the 1.5T

**Key finding:** for the Honda specialists, "Stage 2" does not mean a downpipe. The KTuner, TSP and Phearable maps for the 22+ non-Si CVT were all built and dyno-tested on **unmodified** cars. Each vendor lists a downpipe as "compatible", not "required", and none publishes a separate downpipe map for the stock turbo. A downpipe gets its own calibration only from a **custom e-tune** or a **general remap shop's "Stage 2"** file.

Labels: **V** = vendor claim (seller of the tune or part). **F** = forum or owner report. **S** = search snippet only (page not read in full). Confidence: H / M / L.

## 1. Table: tuner → parts required → boost / power claim → tables changed → source

### Honda specialists (KTuner / Hondata platform)

| Tuner / product | Parts required | Boost / power claim (car tested) | Tables changed (as the vendor states them) | Source | Conf. |
|---|---|---|---|---|---|
| **KTuner basemaps, 22+ Civic 1.5T** (Starter 16.5 "Stage 0", Starter 18 "Stage 1", Starter 21 "Stage 2", Dual Tune 1/2) | **None listed.** The page names no parts for any Starter map. "Stage" is a boost level, not a parts level. "Running 91+ will give the best results." | V: Starter 18 up to +30 whp / +38–40 lb-ft. Starter 21 up to +55 whp / +58 lb-ft. Dual Tune 2 = 18 psi ECO, 21 psi Normal/Sport. Dyno charts are labelled **CVT**. From the 21 psi chart: torque ≈ 203 lb-ft at 3,300 rpm vs ≈ 150 stock, and already ≈ +15 lb-ft at 2,600 rpm. | "Improved throttle response, removed throttle dampening on low end, reduced turbo lag, boost level adjusted". Feature list: Throttle Control and Turbo Responsiveness Quick Adjustments, Dual Boost Targets with ECO, ignition/fuel tuning, Disable Sensors. | [ktuner.com/22civicturbo](https://ktuner.com/22civicturbo/); dyno images [16-5](http://www.ktuner.com/dyno/CivicXI/16-5.png), [18](http://www.ktuner.com/dyno/CivicXI/18.png), [21](http://www.ktuner.com/dyno/CivicXI/21.png) (**Innovative MotorWorks watermark**) | H (what the page says); M (power, V) |
| **TSP Stage 1, 2022+ non-Si** (Derek Robinson, i.e. IMW) | **None.** "Dyno testing was completed on an unmodified 2022 Non-Si Civic 1.5T with a CVT". "Compatible with basic bolt-on parts such as … downpipes, intercoolers". Premium **91 or 93 REQUIRED**, no E85. | V: 154 → **191 whp / 163 → 227 lb-ft** (peak +37 whp / +64 lb-ft; +56 whp at 3,800, +78 lb-ft at 3,700). Map 1 stock boost; **Map 2 16.5 psi**; **Map 3 24 psi** Normal/Sport, 16.5 psi ECO. "Output was slightly limited to avoid risk of damage to the factory engine and transmission." From the chart: tuned torque is ≤ stock until ≈ 2,800 rpm, and the gains start ≈ 2,900 rpm. | "Custom fuel, ignition, and boost tables"; improved throttle and turbo response; "boost pressure limited at slow speed to aid in traction"; monitors and disables adjustable by the user. | [TSP Stage 1 non-Si](https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si); [chart](https://cdn.shopify.com/s/files/1/0013/5708/6779/files/TSP_Stage1_NonSi_XI.png?v=1632319186) | H (page); M (power, V) |
| **TSP x PRL "Stage 2" bundle, 2022+ non-Si** | Bundle = KTuner V2 + **TSP Stage 1 tune** + TSP downpipe + PRL intake + intercooler. | No separate power claim. The tune in the "Stage 2" bundle is **the same Stage 1 file**. TSP sells a Stage 2 tune (flex fuel) **for the Si only**. | Same as Stage 1 | [bundle](https://www.twostepperformance.com/products/tsp-x-prl-stage-2-bundle-kit-for-2022-honda-civic-non-si-1-5t); [compatibility page](https://www.twostepperformance.com/pages/tsp-tune-compatibility) ("Stage 2 (Si Only)") | H |
| **TSP Stage 2 (Si, 10th/11th gen)**, for the naming check | "A flex fuel setup including an ethanol content sensor is **REQUIRED**". Downpipe not required. | V: 22+ Si 192 → 254 whp on flex fuel | Boost by map, flex fuel | [22+ Si Stage 2](https://www.twostepperformance.com/products/tsp-stage-2-flex-fuel-tune-for-2017-2020-honda-civic-si-ktuner-only); [17 Si Stage 2](https://www.twostepperformance.com/products/tsp-stage-2-flex-fuel-tune-for-2017-honda-civic-si) | H |
| **Phearable Stage 1.5, 11th gen non-Si** (John Vega) | **None.** "Complete stock" test car. "Compatible with bolt-ons such as Intake, Inlet Pipe, Downpipe, Frontpipe, Intercooler, Exhaust". "Premium fuel is REQUIRED. **93oct+ recommended, 91oct at absolute minimum**." "For use with the factory turbo ONLY." | V: **194 hp / 237 lb-ft**, 2022 non-Si **CVT**, DynoJet. +60 hp / +79 lb-ft "power band", peak +38 hp / +80 lb-ft. **"+18 hp / +25 lb-ft over Ktuner 21 psi basemap."** Level 1 ≈ 16.4, Level 2 ≈ 18, **Level 3 ≈ 23–24 psi**, same in ECO. | Not itemised on the page. Lower fuel "may result in elevated k.con values which will increase knock retard." | [Phearable Stage 1.5 non-Si](https://www.phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-non-si/stage1-5-nonsi-11thgen.html); [mod guide](https://www.phearable.net/information/tech-area/11th-gen-civic-modification-guide.html) (downpipe is #3 under "additional power with supporting mods", not a requirement) | H (page); M (power, V) |
| **Phearable mod-aware revision** | Owner's bolt-ons (intake, downpipe…) | None published | Still an off-the-shelf file, revised for the listed mods | F: [civic11forum "TSP or Phearable?"](https://www.civic11forum.com/threads/tsp-or-phearable.4540/) (cites a Phearable Instagram post) | L |
| **Hondata FlashPro, 2022+ Civic 1.5T** | Not stated. Ships with **91, 93 and Flex Fuel** base maps. | V (Hondata's own dyno image, CARB preset tune): "22 Civic 1.5 stock 162 hp 170 lb ft → Tuned **197 hp 210 lb ft**" (+34 hp / +50 lb-ft), **91 octane**. Transmission not shown. From the chart: tuned torque ≈ 216 lb-ft at ≈ 2,650 rpm vs ≈ 170 stock, so the gain starts **below 3,000 rpm**. | Not itemised | [FlashPro 2022](https://www.hondata.com/flashpro-civic-2022); [CARB page](https://hondata.com/flashpro-2016-civic-carb?route=product/product&language=en-gb) → [image](https://hondata.com/image/catalog/flashpro/22-civic-hondata-flashpro-91-octane.png) | M |
| **Hondata FlashPro, 2016–21 (10th gen)**, cross-check only | Calibrations "for different intakes and boost levels" | S: "+3 / +6 / +9 psi" calibrations. 91 octane: **MT +7 psi +23 hp / +50 lb-ft; CVT +6 psi +25 hp / +35 lb-ft** (less torque allowed on the CVT) | Boost, by-intake calibrations | [hondata.com/flashpro-2016-civic](https://www.hondata.com/flashpro-2016-civic) (text read); psi and hp figures S | M / L |
| **IMW, Innovative MotorWorks** (Derek Robinson, Carlisle PA) | Custom e-tune for the owner's parts: 91+ single fuel or E30. IMW also writes 27WON's KTuner basemaps for the GIN turbo. | No downpipe figure published for the non-Si | Custom: every table the platform exposes | [imwtuned.com](https://www.imwtuned.com/); [Kenji Garage](https://www.kenjigarage.com/16-honda-civic-ecu/ktuner-v12-tuning-package-w-free-tsp-tune-16-21-honda-civic-15t) ("Derek Robinson of Innovative Motorworks"); [27WON GIN](https://store.27won.com/2022-civic-integra-1-5t-turbocharger-upgrade.html) | H (who); — (numbers) |
| **CAPTS** (Italy; 10th-gen 1.5 tuner, KTuner) | Custom | F, Civic X CVT, 98 RON, 33 °C dyno, KTuner self-tune with CAPTS parts: stock turbo + **catless downpipe**, custom tune at a **20 psi boost limit**: 178 → 239 BHP (Dastek). The owner kept low/mid-rpm torque near stock "to maintain CVT reliability" and let power come in from 4,000 rpm. CAPTS (forum): the EWG can hold 30+ psi "up to certain limits". | Custom | F: [civicx CAPTS Stage-2 turbo review](https://www.civicx.com/forum/threads/capts-stage-2-turbocharger-td03-hybrid-result-review.61937/); [civicx "Not hitting 30 psi"](https://www.civicx.com/forum/threads/not-hitting-30-psi-sport-hatch.75492/); [civicx KTuner release thread](https://www.civicx.com/forum/threads/new-ktuner-software-version-released.60234/page-2) | L (Civic X, one owner) |
| **27WON** (parts vendor; tunes via IMW) | Its downpipe: "no tuning changes … straight drop in"; "**CEL will be illuminated**" | V: product page "+12 hp / +13 wtq peak, ~8 whp / 9 wtq average 2,000–6,500, no tuning". **First test, posted by 27WON on the forum: "7 hp and 11 tq at peak"**, re-test planned on the Si "since it's much easier to dyno a manual", so the 12/13 figure is most likely from a manual Si. Blog: "The stock turbo is designed to run anywhere up to **18 PSI**". Stock MAP sensors read "~28 PSI". | Base maps: "increasing boost, modifying ignition timing, altering camshaft phasing". Made "off of a fully stock car … or with just 1–2 basic bolt-on parts like an intake or downpipe". Custom tune recommended to use the parts fully. | [27WON downpipe](https://store.27won.com/2022-civic-turbo-performance-downpipe-11th-gen.html); [civicxi launch thread](https://www.civicxi.com/forum/threads/11th-gen-honda-civic-downpipe-from-27won-launches.50212/); [300 whp blog](https://www.27won.com/blog/how-to-safely-and-cost-effectively-hit-300whp-on-your-2022-civic-or-integra-with-the-l15-engine); [tune types blog](https://www.27won.com/blog/what-kind-of-tune-is-right-for-me) | M |
| **PRL** | Its downpipe: no calibration needed (S). PRL figures in our repo are big-turbo, manual (`prlTurbo`). | No 11th-gen non-Si downpipe + tune figure found | — | S only | L |

### General remap shops (file services: WinOLS / KESS / bFlash class)

| Shop | Parts required | Claim | What they say they change, and why | Source | Conf. |
|---|---|---|---|---|---|
| **File services: Dyno-ChiptuningFiles, JR Tuning, Technomend, AMT** | Stage 1: none | V: 182 → **220 hp, 240 → 300 Nm**. The same figures on every site point to one shared file database, so this is **one source**, not four. Every entry found is the **10th-gen EU/US 182 hp (2017–2020)** car with a **Keihin TC1782** ECU, not the FE. | AMT: "ignition, injection, throttle response, **torque limiters**", "adapted to accommodate additional modifications" | [dyno-chiptuningfiles](https://www.dyno-chiptuningfiles.com/chiptuning-file/honda-civic-15-vtec-182hp/); [JR](https://www.jrtuning.co.uk/remap-tuning-files/viewdetails.php?make=honda&model=Civic&modelyear=2020+-%3E&engine=1.5T+VTEC+182hp); [AMT](https://amttuning.com/Honda-Civic-1-5T-STAGE-1-PERFORMANCE-SOFTWARE-TUNE-p550552611) | M (what they claim); L (true for the FE) |
| **AMT Stage 2** (Canada, OBD remote flash) | "**Stage 2: Cold Air Intake, Downpipe w/ high flow cat., Exhaust**"; intercooler recommended; "Optimized for 91/93". Manual and CVT. | V: **238 hp / 240 lb-ft** (crank, from 182 / 177) | Same list as Stage 1, more aggressive | [AMT](https://amttuning.com/Honda-Civic-1-5T-STAGE-1-PERFORMANCE-SOFTWARE-TUNE-p550552611) | L |
| **Generic Stage 2 practice** (Viezu, Lonestar, TuningBot) | Downpipe (+ intake, intercooler; clutch or gearbox tune for autos) | V: "power 30–40 %" (generic, not for this car) | **Boost / wastegate targets** re-set for the new exhaust flow; **AFR / lambda** tables re-checked; **ignition** advanced "where the engine can safely handle it"; **torque limiters** raised to match the hardware; on automatics, gearbox torque limits raised or "the gearbox may hold back power or trigger torque intervention". Why: the downpipe lowers back-pressure, so the turbo spools sooner and boost and heat build differently. | [Viezu](https://viezu.com/stage-2-remap/); [Lonestar](https://lonestarperformance.co.uk/stage-2-remap-required-upgrades/); [TuningBot](https://tuningbot.com/exhaust-upgrade-remap-what-it-is-and-why-it-matters/) | L (marketing pages) |
| **Torque-model ECU principle** (HP Academy) | — | — | When airflow rises, the torque model and **driver demand / torque request** tables must agree with it, or the ECU sees torque errors, may fault or go to limp mode. "Not a case of … just maxing them out." | [HPA reflash, torque tables](https://www.hpacademy.com/courses/practical-reflash-tuning/hp-tuners-ford-f150-step-5-c-configuring-torque-tables/) (Ford example, general principle) | M |

## 2. What the practice adds up to

- **Basemap / OTS vs custom.**
  - Basemaps and OTS files: one file for stock and lightly modified cars, a downpipe just "compatible".
  - Custom e-tune: the only route where a downpipe changes tables. Offered by IMW, Phearable e-tune, TSP e-tune and CAPTS.
  - No 11th-gen non-Si CVT dyno of "downpipe + custom tune vs OTS" was found. **Gap**.
- **CVT vs manual.**
  - The CVT torque limit shows up as:
    - TSP's "slightly limited" output;
    - Hondata's 10th-gen CVT calibration giving less torque than the MT one (S);
    - the owner reports keeping low/mid torque near stock (CAPTS thread).
  - Manual owners report clutch slip on the 21–24 psi maps instead (civic11forum, civicx: several owners).
- **Fuel.** Every US file asks for **91 AKI minimum** (TSP: required; Phearable: 91 absolute minimum, 93 recommended; KTuner: "91+ best"; Hondata: 91 / 93 maps). E10 RON95 ≈ US 91, so this car sits at the floor of every one of them. No source calibrates for RON95 E10.
- **What gets touched.**
  - Honda files (KTuner platform): boost targets per mode, throttle response and dampening, turbo response, fuel and ignition, low-speed boost limit, cam phasing (27WON).
  - General shops add torque limiters / torque request and gearbox limits. On this platform those are not tables in our 39-table file.

## 3. Conflicts with our caps and the Build ladder

1. **`boost_ceiling_psi` 21 vs vendor maps.**
   - TSP Map 3 (24 psi) and Phearable Level 3 (23–24 psi) run above 21 on 91/93 and stock parts. So do Hondata's 10th-gen "+9 psi" (S) and the DSPORT custom 25.6 psi (Civic X, F).
   - Our cap is stricter than the market, which stays defensible: E10 RON95 ≈ 91 floor, tropical heat, and our log showing the wastegate ≈ 2.5–3 % at peak (fact-check §4).
   - Two sources point at or below 21 on the stock turbo: 27WON (V: "designed to run up to 18 PSI") and the CAPTS-thread owner (20 psi limit with a catless downpipe, 98 RON).
   - **No source raises boost because a downpipe was fitted.** Keep the cap. Never tell a downpipe owner "now you can run 24".
2. **`boost_raise_min_rpm` 3,000.**
   - Agrees: TSP (gains start ≈ 2,900 rpm, torque ≤ stock below) and the CAPTS-thread practice (power from 4,000 rpm to protect the CVT).
   - **Disagrees: Hondata's 22+ 91 tune adds ≈ +40 lb-ft at ≈ 2,500–2,700 rpm.** KTuner Starter 21 also adds ≈ +15 lb-ft at 2,600, but our file already holds 13–17 psi there, and the rule only blocks *further* raises.
   - Keep the rule: it is our LSPI and CVT judgement, and Hondata's chart shows a choice, not a safety proof.
3. **No ignition edits.**
   - Every OTS and remap product edits ignition (TSP "custom fuel, ignition, and boost tables"; 27WON base maps; AMT; generic Stage 2).
   - The app therefore cannot reproduce an OTS or Stage 2 file. When the owner wants "what a tuned downpipe car makes", the honest answer is a custom e-tune or OTS file from a tuner, not a table edit by the app.
4. **"Stage 2 = downpipe" (ticket premise; `ktuner` claim note "Starter 21 (Stage 2)").**
   - True only for general remap shops (AMT).
   - For KTuner, "Stage 2" means 21 psi on stock parts. For TSP and Phearable, Stage 2 / 2.5 means **flex fuel** (Si / 10th gen).
   - Cards must not tell the owner his Starter 21 "needs" or "assumes" a downpipe. The KTuner page lists no parts.
5. **`map24` item, `gain` text: "TSP: 154 → 191 whp … (all maps, output limited for the CVT)".**
   - 191 whp is the max map. TSP says "your file will be equivalent to map slot 3 (max power)", so "all maps" is wrong.
   - TSP's wording is "slightly limited to avoid risk of damage to the factory engine **and transmission**", not "limited for the CVT".
   - The 154 / 191 run is the stock car, so `map24` gains nothing from a downpipe by vendor design.
   - The only vendor figure for the 21 → 24 psi step is Phearable's **"+18 hp / +25 lb-ft over the KTuner 21 psi basemap"** (V, 91–93).
   - Title and tables are otherwise consistent: our `Final_Boost_Target_H` peak is 23.4 psi, so it must rise (the lock `final` holds), and the stock MAP sensors read to ≈ 28 psi (27WON).
6. **Source independence (`ktuner` + `tsp` counted as two sources).**
   - The KTuner 22+ dyno images carry the **Innovative MotorWorks** watermark. TSP tunes are built "with Derek Robinson", i.e. IMW.
   - The two charts show the **same factory baseline curve** (≈ 120 lb-ft at 2,700, ≈ 150 at 3,600, ≈ 160 at 4,600).
   - Treat KTuner and TSP dyno claims as **one source**. Phearable and Hondata are the independent ones.
7. **`dpCat` item, `gain` "+12 whp / +13 lb-ft on the stock map (27WON dyno, no tune)".**
   - 27WON's first test, likely the CVT car, gave **+7 hp / +11 tq** peak. The 12/13 figure is probably the manual Si.
   - Card text should say "≈ +7–12 whp, vendor dyno" or name the car.
8. **`dpCat` table action (lower Boost Target by 1 psi at 2,500–3,250 rpm only if overshoot > +2.5 psi).**
   - No tuner source describes this step, and none contradicts it. It stays our judgement, labelled as one.
   - The vendors' implied practice: keep the same file; boost control holds target, and the spool simply arrives sooner.
9. **`hondata` claim (verdict `unverified`, "+34 hp / +50 lb-ft on the CVT").** Now visible on Hondata's own image: +34 hp / +50 lb-ft, 91 octane, 22 Civic 1.5. Upgrade to "true (vendor), medium", but **drop "on the CVT"**: the chart does not show the transmission.
10. **General-shop numbers (220 hp / 300 Nm, 238 hp Stage 2)** are for the 10th-gen 182 hp Keihin car and repeated from one database. They are never card numbers (map Notes: Civic X is cross-check only).

## Answer

- Honda specialists change **nothing extra** for a downpipe on the stock turbo:
  - KTuner Starter 16.5/18/21, TSP Map 1/2/3 (stock / 16.5 / 24 psi) and Phearable Level 1/2/3 (16.4 / 18 / 23–24 psi) are all one file per car, dyno-proven on a **stock CVT**.
  - A downpipe is "compatible", not required. 91 AKI is the minimum; E10 RON95 ≈ 91, the floor.
- Promises (vendor):
  - KTuner 21 psi: up to +55 whp. TSP: 154 → 191 whp.
  - Phearable: 194 hp, +18 hp over KTuner 21. Hondata 22+: +34 hp / +50 lb-ft on 91.
  - Downpipe alone: +7 to +12 whp (27WON).
- "Stage 2" means flex fuel at TSP and Phearable and 21 psi at KTuner. Only general remap shops make Stage 2 mean a downpipe; there they raise boost / wastegate targets, torque limits, fuel and ignition, and gearbox limits on automatics.
- Downpipe-specific gains come from a **custom e-tune** (IMW, Phearable, CAPTS), which edits ignition and boost together: outside our product limits.
- KTuner and TSP dynos share IMW and the same baseline: count them as one source.
- Conflicts:
  - Every 24 psi map exceeds our 21 psi cap (keep it).
  - Hondata adds torque below 3,000 rpm (keep our rule).
  - The `map24` gain text ("all maps", "limited for the CVT") and the `dpCat` +12/+13 figure need correcting.
- For this car the honest downpipe answer is: same map, spool arrives sooner, check boost overshoot and AFR. More power means a tuner's custom file, not a higher boost cap.

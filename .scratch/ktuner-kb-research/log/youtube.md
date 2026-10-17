# YouTube run log (2026-10-17)

Tools: yt-dlp flat-playlist search (29 queries incl. all briefed ones + extras), official channel K Tuner (UCza3lEChkPEVeOOP182iTkQ, 10 uploads), youtube-transcript-api for transcripts, yt-dlp --dump-json for metadata.

Candidates listed in sources.md: ~227 (>=150 s). Targeted for fetch: ~110. Transcripts saved: 45 (raw/youtube). Claims: 115 ({'T1': 52, 'T3': 1, 'T2': 62}).

## Access problems
- YouTube returned IpBlocked from the transcript endpoint repeatedly after ~50 requests; yt-dlp subtitle fallback returned HTTP 429 too. Waited and probed for >1.5 h; still blocked at close. Videos not fetched (blocked) are listed below and can be retried by rerunning the fetch.
- Not retrievable: 68 ids tried and failed: D49ccJOvpUw(TranscriptsDisabled), yDdQtudB_u0(TranscriptsDisabled), CdJhAYaxJKk(TranscriptsDisabled), 3DQ0GfTwloE(TranscriptsDisabled), Dxjmpw_nGq0(NoTranscriptFound), kAigBhhGnS0(NoTranscriptFound), 57QVTFnE1VM(IpBlocked), Gqt-YILhtOM(IpBlocked), Q7-VSxsFO64(IpBlocked), M5GqU_zeQoQ(IpBlocked), gHcGAcYXIns(TypeError), 3zM13cXDb7I(RuntimeError), HCCOf9Yjp1A(IpBlocked), UDCayK19wlU(IpBlocked), u6KrecbDhLE(IpBlocked), t-e5gySpqBo(IpBlocked), 7E1tZ6eVdtE(IpBlocked), Pa0b24NQxHM(IpBlocked), obD_ghuJdoQ(IpBlocked), Sb_f1SH4e3s(IpBlocked), OtYMPP2jUaw(IpBlocked), kd-ohu3H0uA(IpBlocked), eUf7Hbskl2U(IpBlocked), GRt36Tay4Po(IpBlocked), 4nZaLkkNpeA(IpBlocked), DW4vbV26K0k(IpBlocked), h8eIN5cA-Cc(IpBlocked), v9G9ethX75E(IpBlocked), 30a9NOWxGww(IpBlocked), dpnGdND_8vc(IpBlocked), HgeafrSYiUQ(IpBlocked), DTlARsw148A(IpBlocked), dHtNo97bDOM(IpBlocked), K-tAZIv3oog(IpBlocked), PTGBEiZAqd0(IpBlocked), 2s2BhLq30SM(IpBlocked), QtBBT6CQ2N0(IpBlocked), YX4XXKQa_4k(IpBlocked), c_Q4hfYvnE8(IpBlocked), TY44KWF8wJo(IpBlocked), xXvDg35hzpI(TranscriptsDisabled), LeWet3l8GBw(IpBlocked), 13UQPCHEJww(TranscriptsDisabled), ShtY-ZidAsw(IpBlocked), -qE7MTPtrEo(IpBlocked), 1KnOyOvRc3s(IpBlocked), ysb-AP3yV58(IpBlocked), AoGOhC97Kts(IpBlocked), FgjzrgVKRbM(IpBlocked), 4zERYOpETRU(IpBlocked), fB6xKNswSZg(IpBlocked), gbc44nHf13w(IpBlocked), XMSZnlm3oII(IpBlocked), cKo6ISBN7k4(IpBlocked), wYjfva5srkY(IpBlocked), XYUIuPXXxdg(IpBlocked), 5pfGKvzjWSE(IpBlocked), e_3T78_w4zw(IpBlocked), 1VDnNA5VFr4(IpBlocked), nV-6jVv_bjA(TranscriptsDisabled), Z-bRzQZ97ms(IpBlocked), MaiW24xXU2g(TranscriptsDisabled), nnjcBGw3glA(IpBlocked), YLdLmHba7co(IpBlocked), ooA2UOBvo_I(IpBlocked), rXhYqkV-Fa0(IpBlocked), v5FjW2P8vC4(IpBlocked), 2nTCzEcdKzI(IpBlocked)
- Never attempted because of the block: remaining queue incl. official KTuner tutorials (ysb-AP3yV58, AoGOhC97Kts, FgjzrgVKRbM, 4zERYOpETRU), gHcGAcYXIns (Derek Robinson, KTuner 2022 Si), 3zM13cXDb7I, HCCOf9Yjp1A, Sb_f1SH4e3s, VcBtYyEnIfg, GzlIiahrFEU, 6MGdzFLo1fk, fB6xKNswSZg, gbc44nHf13w, and most T3 how-tos.

## Saved transcripts (ok)
- S0ovmyF8pVQ | T1 | 11 min | Another Rich Experience | "Got Boost?" Ktuners new blessing to the Integra and 11th gen Civics called Boost Target Ramp Rate.
- dY7oRkl_LHY | T1 | 6 min | Another Rich Experience | 2023 Acura Integra Ktuner:  My Quick Adjustments and Settings.
- O2HpkoPiKkw | T1 | 22 min | AHC Garage | 2023 Acura Integra A-Spec - Dyno Pulls with K-Tuner Phearable Stage 1.5 Race Tune (Episode 7)
- 3mDQy-2xgzQ | T1 | 4 min | Dardantuned | 2023 acura integra dyno numbers| stock vs custom tune
- NtWMKcZuPI8 | T1 | 8 min | Two Step Performance | Tuning the FIRST 2025 Honda Civic Si with KTuner!!
- FZown9cAgPY | T1 | 11 min | Dale Does Stuff | Tune Your Honda Civic Si with KTuner (Step-by-Step Guide)
- 0q8M5nZvfp8 | T1 | 12 min | Auto District | How to tune your 2022 Civic Si
- yBCukfR7agc | T1 | 3 min | Mitch Mc | 2022 Honda Civic SI | A quick look at Tunerview App for Ktuner!
- Vo6GqWCzIwg | T1 | 6 min | Mitch Mc | 2022 Honda Civic SI | Ktuner vs Factory Tune comparison!
- 7XVksMuOf0w | T1 | 7 min | SargentO_GiO 🟣 | Testing Phearable Stage 1.5 Tune on my 2022 Civic 11th gen + Bloopers
- 7RXFZXquOo8 | T1 | 8 min | SargentO_GiO 🟣 | 11th Gen Civic Si Phearable 1.5 Vs 11th Gen Civic Si TSP
- t8drRkFzAEU | T1 | 4 min | SargentO_GiO 🟣 | 11th Gen Honda Civic Si Phearable 1.5 (11th Gen) 1/4 Mile test | Dragy | Full Bolts On 91 Octane
- W4CfY_yad8s | T1 | 15 min | Two Step Performance | Do This One Modification before Tuning Your 1.5T Civic.
- 0HdFnInVsOE | T1 | 10 min | TheFOAT Media | Big Torque Gains | E85 Tuning Our 2022 Honda Civic | Powermetric Stage 2 | PRL Flex Fuel Kit Install
- J_fnYKXQhaI | T1 | 17 min | TheFOAT Media | Our 2022 Civic Si Makes More Power Than The New Type R FL5 | PRL Motorsports Prototype Turbo | R&D
- 04kPNDaIV9Y | T1 | 35 min | AHC Garage | 11th Gen 2023 Honda Civic Si // Full PRL Motorsports & Two-Step Performance Upgrades
- bIFgg5BkwOI | T1 | 7 min | Axion Industries | Our 2022 Civic Hatchback 1.5t hits the dyno: What will we make?
- pp2u5wXk2Hs | T1 | 3 min | Pentagon Racing | 2022 Honda Civic FE 1.5T Upgrades PRL filter, DP & FP with new dyno comparison modified
- i7IaNd2dtVs | T1 | 4 min | Pentagon Racing | 2022 Honda Civic FE 1.5T PRL USA Intercooler VS FK8R Stock Intercooler
- -imBwyNoGaQ | T1 | 12 min | Leonardo Cruz | Installing KTUNER V2 on Honda Civic RS Turbo 1.5T CVT at NEOGEN
- 3tbJ9EA-9EA | T1 | 28 min | Two Step Performance | Swapping the turbo on your 2022+ Civic 1.5T | UNCUT.
- ilhfiXFIQ48 | T1 | 32 min | Two Step Performance | Installing a PRL 4847RS Turbocharger and Carbon Fiber Inlet Pipe on our 1.5T Civic.
- gcOKpMSyrUo | T1 | 19 min | Raul Rivera | 2025 Honda Civic Si  11th gen | STOCK ECU | Performance Parts Break Down
- RiR1hJ8XOLs | T1 | 8 min | Parking Lot Trucks and Watson Tech | KTuner Honda Civic 1.5t non-si CVT Running Derek Robertson Tune Part 1
- r402oUV6dyk | T1 | 13 min | Unity Performance | 27WON Cold Air Intake (HVI) Install - 2022+ Honda Civic 1.5T/Si, 2023+ Acura Integra 1.5T
- bvO6-GeH2S4 | T1 | 32 min | Justin V. | 27won Turbo Inlet Pipe Install/Review for my 2025 11th Gen Honda Civic Si!
- Tl0SfnpAWIg | T1 | 6 min | HondaPro Jason | How to Quickly Add Performance & Fun to the New Honda Civic Si
- n2spmensZA0 | T1 | 4 min | Wish | Installing Ktuner V2 on my Built 2022 Honda Civic Si + Pov Drive
- TYMrGhYX7Ks | T1 | 36 min | AudiuX | Civic Si Mod Install Recap - MAP Intercooler / PRL Cobra Intake / KTuner / TSP Tune
- AbclDpoIj90 | T1 | 15 min | Donut | We Tried Tuning a Car with AI
- Bn03GonKMqY | T2 | 23 min | caraddict | 2017 Honda civic EXT 1.5T Ktuner V2 testing stock, stage 1, and stage 2 50-70 and 20-90 pulls
- sfwP7cUteAE | T2 | 20 min | caraddict | VERY beginners guide to Ktuner V2 how to setup /flash / log on the CivicX
- 38cfEOQcTys | T2 | 3 min | caraddict | How to speed up knock control learning down ktuner V2 2017 Honda Civic EXT
- pUBqbpW-wNM | T2 | 36 min | caraddict | 2017 Honda CivicX 1.5T MAF scale tuning Ktuner how to DIY
- kbRlZO9SJ6Q | T2 | 11 min | caraddict | I figured out how to brake boost my Honda CivicX turbo plus LED giveaway info.
- htDPjercuew | T2 | 15 min | caraddict | 2017 Honda CIvic turbo 6MT Ktuner flex fuel. e85 is a GO!
- nB7NyWIsYxg | T2 | 8 min | caraddict | CivicX TURBO UPGRADE !!!! 2017 Honda Civic 1.5T  PURE STG2  AWESOME!!!
- aNgg_zEY4Ag | T2 | 10 min | Tony Castillo | The Difference between e85 Tune and 91 Tune | 2017 Honda Civic Hatchback Vs 2020 Honda Civic Si
- 1NjQ8MuHnjc | T2 | 20 min | Chris Time | KTUNER V2 INSTALL FOR 10TH GEN CIVIC | 0-60 Times
- ObNVwyiGviA | T2 | 13 min | Chris Time | KTUNER REVIEW | POV | 2021 Honda Civic Sport Hatchback |After 1000 miles
- Vq26vGoROmw | T2 | 13 min | Cameron Hill | Ktuner v1.2 and v2.. Which One Should You Buy? | The BASICS
- 0oc2YW7B0x0 | T2 | 14 min | Cameron Hill | NEW KTUNER FEATURES for 10TH GEN CIVICS!! + NEW MERCH STORE!
- Ye0CtLGfkB8 | T2 | 11 min | Cameron Hill | Ktuner/Tuning Problems with my 2020 Civic Si | FIXING STUFF
- 3LrjV-F0T1A | T2 | 11 min | Cameron Hill | I Installed TSP Stage 1 on my 2020 Civic Si.. But Somethings NOT RIGHT
- O-VCM8RE6vc | T2 | 18 min | Cameron Hill | TSP STAGE 1 for 10th Gen Civics: EVERYTHING YOU NEED TO KNOW!

## Notes
- Hondata-only videos (Tl0SfnpAWIg, J_fnYKXQhaI, pentagon dyno ones) saved but no claims, no KTuner bearing. AbclDpoIj90 (AI tuning), W4CfY_yad8s (head studs), ilhfiXFIQ48/3tbJ9EA-9EA (turbo swaps), r402oUV6dyk (intake): read, no tuning claims.
- Tier overrides: 10th gen Si videos tagged T2; 2025 Si connectivity device claim T3.

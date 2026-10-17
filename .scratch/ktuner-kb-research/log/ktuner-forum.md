# Log: ktuner-forum (17 Oct 2026)

Live forum: https://ktuner.com/forums/ shows only a notice (PhpBB disabled because of attacks; support by email). Same via www and jina reader.

## Wayback
- CDX API (ktuner.com/forums/viewforum.php* and viewtopic.php*, status 200, collapsed by urlkey): 132 viewforum and 1019 viewtopic captures (www and bare host return identical lists), snapshots 2016-2025; ~645 distinct post/topic ids, 287 with t=.
- Forum index snapshot (2022-08-08) gives sections: Welcome (f=2), General Questions (15), KTuner Software (13), Software Installation (21), Hardware Installation (9), General Hardware (12), KTunerFlash V1.2 (65), V2 (58), KTuner Reflash (11), platform forums incl. Civic Platform (f=30), Integra Platform (73), Accord 31, CR-V 62, RDX 67, TLX 60, etc.
- There is NO separate 22+ Civic 1.5T / 16-21 Civic 1.5T subforum: one "Civic Platform" (f=30) and "Integra Platform" (f=73). Archived viewforum pages are sparse (f=30 only 2016/2017 captures, f=73 only 2022), so thread titles could not be listed; CDX gives URLs only.
- Selection: since titles are unknown, I fetched the 90 newest/most relevant-looking post URLs (priority: 2021+ snapshots, forums 30/73/13/15/58/65/11/62, or unknown forum). Only 1 request errored (after 120 s back-off it retried ok). 16 s spacing. 90/90 saved (about 45 distinct threads; many captures are the same thread via different p= ids). The coordinator's 40-80 target is met in distinct-thread terms only partly: ~45 threads, of which most are other platforms (CR-V, RSX, TL, K-swap) and hardware/registration support; only ~8 are Civic 1.5T.
- Staff identity: posts by user "KTuner", rank "Site Admin", are the staff voice (claims tagged ktuner-staff). One quoted community reply (TurboEclipse, 2.0 CVT owner) is tagged owner.
- Date notes: snapshot date is NOT the post date; `posted` uses post datetimes. A few posts have no date in old-style captures (set unknown).

## Counts
90 raw files + forum-index.md; 36 claims in claims/ktuner-forum.jsonl (quotes script-verified verbatim). Nothing found on: boost target tuning internals, quick adjustments, TunerView channel meaning for the 11th gen. Staff answers are terse and often "email support".
## Not done
Remaining ~550 archived topic ids were not fetched; titles unknown, so a next pass would need to fetch them blind (≈2.5 h at 16 s).

## Pass 2: remaining topic ids (cat of every id; one row per id)
format: id | status | forum | title. SKIP = not Civic/Integra 1.5T/turbo-relevant (platform-specific NA, hardware/registration chatter); DUP = same topic already captured; ERR = Wayback has no capture (404); NOPOSTS = unparsable page.

t2243 | ERR | https://web.archive.org/web/20230101id_/http://www.ktuner.com/forums/viewtopic.php?t=2243 | HTTP Error 404: NOT FOUND
t2199 | ERR | https://web.archive.org/web/20230101id_/https://ktuner.com/forums/viewtopic.php?t=2199 | HTTP Error 404: NOT FOUND
t1799 | ERR | https://web.archive.org/web/20230101id_/http://ktuner.com/forums/viewtopic.php?t=1799&start=10 | HTTP Error 404: NOT FOUND
t548 | ERR | https://web.archive.org/web/20230101id_/http://www.ktuner.com/forums/viewtopic.php?f=54&t=548 | HTTP Error 404: NOT FOUND
t2186 | ERR | https://web.archive.org/web/20230101id_/https://ktuner.com/forums/viewtopic.php?t=2186/ | HTTP Error 404: NOT FOUND
t2536 | ERR | https://web.archive.org/web/20230101id_/https://www.ktuner.com/forums/viewtopic.php?t=2536 | HTTP Error 404: NOT FOUND
t2102 | ERR | https://web.archive.org/web/20230101id_/http://www.ktuner.com/forums/viewtopic.php?t=2102 | HTTP Error 404: NOT FOUND
t760 | ERR | https://web.archive.org/web/20230101id_/http://www.ktuner.com/forums/viewtopic.php?f=54&t=760 | HTTP Error 404: NOT FOUND
t2508 | ERR | https://web.archive.org/web/20230101id_/https://ktuner.com/forums/viewtopic.php?f=30&t=2508 | HTTP Error 404: NOT FOUND
t147 | ERR | https://web.archive.org/web/20230101id_/https://ktuner.com/forums/viewtopic.php?t=147 | HTTP Error 404: NOT FOUND
t2457 | ERR | https://web.archive.org/web/20230101id_/http://ktuner.com/forums/viewtopic.php?t=2457/ | HTTP Error 404: NOT FOUND
t767 | ERR | https://web.archive.org/web/20230101id_/http://www.ktuner.com/forums/viewtopic.php?t=767 | HTTP Error 404: NOT FOUND
t2014 | ERR | https://web.archive.org/web/20230101id_/http://www.ktuner.com/forums/viewtopic.php?f=39&t=2014 | HTTP Error 404: NOT FOUND
t825 | ERR | https://web.archive.org/web/20230101id_/http://ktuner.com/forums/viewtopic.php?t=825 | HTTP Error 404: NOT FOUND
t2255 | ERR | https://web.archive.org/web/20230101id_/http://www.ktuner.com/forums/viewtopic.php?t=2255 | HTTP Error 404: NOT FOUND
p9470 | ERR | https://web.archive.org/web/20230101id_/https://www.ktuner.com/forums/viewtopic.php?p=9470 | HTTP Error 404: NOT FOUND
p6666 | ERR | https://web.archive.org/web/20230101id_/http://www.ktuner.com/forums/viewtopic.php?p=6666 | HTTP Error 404: NOT FOUND
p10550 | SKIP | staff | Platform Specific Questions > K Swapped Vehicles | TPS reading is not changing
p10397 | KEEP | staff | Platform Specific Questions > TLX Platform > 15-20 TLX V6 | 2016 TLX ZF 9 Speed potential tuning options?
p10588 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 13-17 Accord V6 Specific | Would the 91 octace tune cover ported intake/intake spacer?
p10562 | SKIP | staff | Platform Specific Questions > RSX Platform | unlock ecu
p10544 | SKIP | staff | KTuner Hardware Questions > KTunerFlash V2 Specific | LED Setup not saving
t2485 | KEEP | staff | Platform Specific Questions > Civic Platform > 2022+ Civic 2.0 | ETA?
p10556 | KEEP | staff | Platform Specific Questions > CR-V Platform | ecu info and boost maps
p10585 | KEEP | staff | Welcome > Welcome | Stage 2 Accord 1.5t- Oil Grade
t2910 | NOPOSTS | KTuner.com • Performance and fuel economy improvements
t1832 | KEEP | staff | Platform Specific Questions > CR-V Platform > 17+ CR-V 1.5T Specific | Manual EUDM support?
p10365 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 03-05 Accord / Euro CL7 Specific | ECU Not Getting Power
t462 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 13-17 Accord i4 Specific | CVT and Ktuner questions
t2808 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 13-17 Accord i4 Specific | No pops above 3k rpm
t1590 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform | Retaining ECO button features and setting DBW to be linear
t2542 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 07-08 TSX Specific | fuel status 1 issue - Page 2
t435 | SKIP | staff | Platform Specific Questions > TL Platform > 07-08 TL Specific | 2 Step Broken!!!!!!!
t2427 | SKIP | staff | Platform Specific Questions > TL Platform > 07-08 TL Specific | Base Map & fuel injectors
t2343 | KEEP | staff | Platform Specific Questions > Civic Platform > 16-21 Civic 2.0 | Rev Hang Option
t170 | SKIP | staff | Platform Specific Questions > TL Platform > 07-08 TL Specific | 04-06 TLs
t2377 | SKIP | staff | Platform Specific Questions > TL Platform > 07-08 TL Specific | Fan control & Intake runner adjustments - Page 2
t511 | KEEP | staff | Platform Specific Questions > Civic Platform > 16-21 Civic 2.0 | KTuner update?
p10533 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 06-07 Accord Specific | DBW to DBC conversion
t198 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 07-08 TSX Specific | Reverse Lockout
t2061 | SKIP | staff | Platform Specific Questions > TL Platform | 12 TL not able to custom tune v2 touch
t2708 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 07-08 TSX Specific | ECT2 stuck at 35 degrees
t631 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 07-08 TSX Specific | Ktuner wont connect
t679 | KEEP | staff | Platform Specific Questions > Civic Platform > 16-21 Civic 2.0 | Body options like automatic door locking, honks, etc.
t878 | SKIP | staff | Platform Specific Questions > TL Platform > 07-08 TL Specific | Reflash
t138 | SKIP | nostaff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 07-08 TSX Specific | 08 tsx beta options list
t673 | SKIP | staff | Platform Specific Questions > TL Platform | popping exhaust sound
t248 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 07-08 TSX Specific | ktuner for 0708 ecu disables
t2213 | KEEP | staff | Platform Specific Questions > TL Platform > 07-08 TL Specific | Touch V2 ability to tune for boost?
t2003 | SKIP | staff | Welcome > General Questions | Suggestion: Kensington cable lock?
t2487 | SKIP | nostaff | Platform Specific Questions > MDX Platform > 07-13 MDX | big mod boys check in
t553 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform | Running Slightly Lean
t1732 | SKIP | staff | Platform Specific Questions > MDX Platform > 07-13 MDX | Disable code p0420
p10289 | SKIP | nostaff | Welcome > General Questions | Performance and fuel economy improvements
t862 | SKIP | staff | Platform Specific Questions > MDX Platform > 07-13 MDX | 2011 MDX VTEC ENGAGEMENT
p10581 | KEEP | staff | Welcome > General Questions | Compatibility of KTuner with 2022 Honda Civic Sport 2.0L
t2321 | KEEP | staff | Welcome > Welcome | 2013 Accord V6
t1723 | KEEP | staff | Platform Specific Questions > Civic Platform > 07-11 Civic Type-R Specific | fuel gauge and fuel consumption are off
t2829 | KEEP | staff | Welcome > Welcome | 2021 Accord 2.0T - Honestly just talk me into it
t2022 | KEEP | staff | Platform Specific Questions > Civic Platform > 06-11 Civic Si Specific | After flash, Honda HDS HIM cannot connect?
t2056 | ERR | https://web.archive.org/web/20250623132218id_/https://www.ktuner.com/forums/viewtopic.php?f=2&t=2056&sid=d141c04dc55a78dac798ceafbd89ec36 | HTTP Error 404: NOT FOUND
t1639 | KEEP | staff | Platform Specific Questions > Civic Platform > 07-11 Civic Type-R Specific | Speed density tuning always lean
t2825 | KEEP | staff | Platform Specific Questions > Civic Platform > 06-11 Civic Si Specific | Vtec window - mBar
t2038 | SKIP | staff | Welcome > Welcome | new-to-me KMiata + Ktuner drivability issues
t432 | SKIP | nostaff | Welcome > General Questions | 02 ep3 with 04 k24a2 tsx motor
t2148 | KEEP | staff | Platform Specific Questions > Civic Platform > 06-11 Civic Si Specific | Custom MAP sensor
t2671 | KEEP | staff | Platform Specific Questions > Civic Platform > 06-11 Civic Si Specific | Throttle response
t2417 | SKIP | staff | Welcome > Welcome | newbie here
t1575 | KEEP | staff | Platform Specific Questions > Civic Platform > 06-11 Civic Si Specific | Misfire and knock count
t1576 | SKIP | staff | Welcome > Welcome | led set up or bad led ?
t2771 | KEEP | staff | Platform Specific Questions > Civic Platform > 2022+ Civic 1.5T | Auto Start/Stop
t562 | KEEP | staff | Platform Specific Questions > Civic Platform > 06-11 Civic Si Specific | Rev limits for 2006-2011 Civic Si
t2241 | KEEP | staff | Welcome > Welcome | 2019 Civic Si Coupe
t1607 | KEEP | nostaff | Platform Specific Questions > Civic Platform > 17-21 Civic Type-R FK8 | FK2 dyno
t2547 | KEEP | staff | Platform Specific Questions > Civic Platform > 2022+ Civic 1.5T | Rev Hang
t2522 | KEEP | staff | Platform Specific Questions > Civic Platform > 2022+ Civic 1.5T | Help needed, Civic 1.5T
t1766 | KEEP | staff | Platform Specific Questions > Civic Platform > 07-11 Civic Type-R Specific | WOT enrichment and WOT enrichment Cat heating
t2429 | KEEP | staff | Platform Specific Questions > Civic Platform > 2022+ Civic 1.5T | Hatchback availability and misc ?s
t2272 | KEEP | staff | Platform Specific Questions > Civic Platform > 07-11 Civic Type-R Specific | Remapped ecu
t633 | KEEP | staff | Platform Specific Questions > Civic Platform > 07-11 Civic Type-R Specific | Boost control and
t2723 | KEEP | staff | Platform Specific Questions > Civic Platform > 2022+ Civic 1.5T | 2023 Si Throttle Padding
p10517 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 04-06 TSX / Euro CL9 Specific | Ecu connectivity
p10454 | SKIP | staff | KTuner Hardware Questions > General Hardware Questions | OBD2 monitors reset because End User board
t2997 | DUP-of-t2997 | unlock ecu
p10455 | KEEP | staff | Platform Specific Questions > Civic Platform > 16-21 Civic 1.5T | Strong smell of fuel
p10487 | SKIP | staff | KTuner Hardware Questions > KTunerFlash V1.2 Specific Questions | I locked my ktuner to unsupported ecu now its not unlocking from ecu
t669 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 18+ Accord Specific | Few Quick Clarifying Questions
t1877 | KEEP | staff | KTuner Software Questions > KTuner Software | Quick Adjustments
t2616 | KEEP | staff | Platform Specific Questions > S2000 Platform | 4 Bar Map support
t2991 | DUP-of-t2991 | TPS reading is not changing
t817 | KEEP | staff | Platform Specific Questions > S2000 Platform | New to Turbo tuning
t2973 | SKIP | staff | Welcome > General Questions | Incompatible request for help
t2906 | KEEP | staff | Welcome > General Questions | Ktuner's Hardware Failures issues
t2904 | KEEP | staff | Welcome > General Questions | General data access
t2806 | KEEP | nostaff | Welcome > General Questions | KTuner is in OBDII port, doesn't remember setting
t2814 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform | Honda accord cl9
t1970 | SKIP | staff | Platform Specific Questions > TL Platform > 09-14 TL Specific | Fuel corrections
t1588 | SKIP | staff | Platform Specific Questions > TL Platform > 09-14 TL Specific | Ktuner v2 questions
t1897 | SKIP | staff | Platform Specific Questions > TL Platform > 09-14 TL Specific | Rev limiter does not changed when commanded - Page 2
t129 | SKIP | staff | Platform Specific Questions > TL Platform > 09-14 TL Specific | Feedback after install
t1565 | SKIP | staff | Platform Specific Questions > TL Platform > 09-14 TL Specific | Shift Points
t2859 | KEEP | staff | Platform Specific Questions > Civic Platform > 16-21 Civic 1.5T | Can i unlock KTuner V2?
p10450 | DUP-of-t2829 | 2021 Accord 2.0T - Honestly just talk me into it
p10421 | SKIP | staff | Platform Specific Questions > K Swapped Vehicles | Car suddenly will not start and ecu LED not lighting up
t2877 | KEEP | staff | Welcome > Welcome | Newbie
t1934 | NOPOSTS | KTuner.com • KTuner for a AT CVT?
t270 | SKIP | nostaff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 04-06 TSX / Euro CL9 Specific | Does anyone have a Reflash file for TSX 04-05 ?
t2932 | KEEP | nostaff | Platform Specific Questions > Civic Platform > 2022+ Civic 2.0 | Running Rich on Tune 1 for 2022 sport sedan
t2943 | SKIP | nostaff | Platform Specific Questions > K Swapped Vehicles | EG civic with K24 AC control
t2957 | KEEP | nostaff | Platform Specific Questions > Civic Platform > 16-21 Civic 1.5T | Need some help here!
t873 | SKIP | staff | Platform Specific Questions > Fit Platform > 15+ Fit | Customizing GK5 Tune
p10333 | SKIP | staff | Platform Specific Questions > RSX Platform > 05-06 RSX Specific | 02-04 Transmission
p10279 | SKIP | staff | Platform Specific Questions > TL Platform > 07-08 TL Specific | Speed adjustment for different FD gears
p10382 | DUP-of-t2936 | Car suddenly will not start and ecu LED not lighting up
p10186 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 07-08 TSX Specific | Will KTuner work with my 07-08 TSX ECU? - Page 2
p1329 | KEEP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 10-14 TSX V6 | 2011 Acura TSX V6 trials and tribulations
p10183 | SKIP | staff | Platform Specific Questions > Ridgeline Platform | 2013 Ridgeline tuneup
t3 | NOPOSTS | KTuner.com • Welcome to KTuner
p9972 | KEEP | staff | Platform Specific Questions > CR-Z Platform | Boost? - Page 4
p10115 | KEEP | staff | Platform Specific Questions > RDX Platform | Limitations / Thresholds
p10261 | KEEP | staff | Platform Specific Questions > Civic Platform > 2022+ Civic 1.5T | ECU Supported? 64B-AA1
p10205 | SKIP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 06-07 Accord Specific | Accord 2007 Executive CL7 K24a3 swapped - cannot see map uploaded by tuner.
p10232 | SKIP | staff | Platform Specific Questions > RSX Platform > 05-06 RSX Specific | 02-04 rsx type-s trans
p10124 | SKIP | staff | Platform Specific Questions > TLX Platform > 15-20 TLX V6 | Acura TLX went into safe mode with Stage 1 tune
p10254 | SKIP | staff | Platform Specific Questions > K Swapped Vehicles | Idle air control valve not functioning?
t2048 | SKIP | staff | Platform Specific Questions > CR-Z Platform | Map Sensor Scaling and IMA Signal
t259 | SKIP | staff | Platform Specific Questions > CR-Z Platform | 2016 Support - Page 2
t648 | SKIP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 09-14 TSX i4 Specific | LWFW misfire
t2192 | NOPOSTS | KTuner.com • Turn off close loop
t2782 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 08-12 Accord i4 Specific | Tuning for boost/MAP sensor support
t479 | SKIP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 08-12 Accord i4 Specific | Throttle latency on 2009 k24 MT
t2651 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 08-12 Accord i4 Specific | Speedometer Calibration
t2665 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 08-12 Accord i4 Specific | Automatic to Manual Swap - Manual ECU Required?
p10004 | KEEP | staff | Platform Specific Questions > Element Platform > 03-06 Element Specific | k24a4 w/ crv awd auto trans
p10054 | SKIP | staff | Platform Specific Questions > S2000 Platform > 06-09 S2000 Specific | Flex fuel question
t2850 | DUP-of-t2850 | Limitations / Thresholds
t2848 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 18+ Accord Specific | Stage 2 CVT Power figures
t2364 | SKIP | nostaff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 07-08 TSX Specific | Ktuner v2
t625 | KEEP | nostaff | Platform Specific Questions > Civic Platform > 16-21 Civic 1.5T | Tuneviwerlite
t2413 | SKIP | nostaff | Platform Specific Questions > Element Platform > 07-08 Element Specific | Disables/monitors
t2849 | SKIP | staff | Platform Specific Questions > RDX Platform | 2024 RDX ECU 37820-5YF-AR2
t1600 | SKIP | nostaff | Platform Specific Questions > K Swapped Vehicles | Wiring Diagrams
t765 | SKIP | nostaff | Welcome > Welcome | DEALERS AND TUNERS LIST
t2798 | KEEP | nostaff | Platform Specific Questions > Civic Platform > 2022+ Civic 1.5T | feature update requirement
t1602 | SKIP | nostaff | Platform Specific Questions > RSX Platform > 05-06 RSX Specific | 02/04-05/06 ECU Pinouts
t2565 | SKIP | nostaff | Platform Specific Questions > RSX Platform > 05-06 RSX Specific | A3 stock map and tuned map.
t426 | SKIP | nostaff | Platform Specific Questions > RSX Platform > 05-06 RSX Specific | flash help
p8027 | SKIP | staff | Platform Specific Questions > Fit Platform > 12-13 Fit | IAT fuel correction
p9722 | KEEP | staff | Platform Specific Questions > Fit Platform > 15+ Fit | GK5 2STEP
p9644 | SKIP | staff | Platform Specific Questions > TL Platform > 09-14 TL Specific | WOT enrichment
p9778 | SKIP | staff | Platform Specific Questions > Fit Platform > 09-10 Fit | OnBoard Logging Fields
p9870 | KEEP | staff | Platform Specific Questions > RDX Platform | 2021 RDX KTuner Software
p9879 | DUP-of-t259 | 2016 Support - Page 2
p9837 | KEEP | nostaff | Platform Specific Questions > Civic Platform > 06-11 Civic Si Specific | Aftermarket Android Head Unit - Page 2
p9849 | SKIP | staff | Platform Specific Questions > Element Platform > 07-08 Element Specific | Basemap for 07-08 Element AT w/ K24A2 swap
p9886 | KEEP | staff | Platform Specific Questions > TSX / CL9 Euro-R Accord Platform > 09-14 TSX i4 Specific | Please support the TSX
p8953 | SKIP | nostaff | Platform Specific Questions > CR-Z Platform > 13-15 CR-Z Specific | 37820RTWA120M1 Hardware Support by V1.2?
t2625 | SKIP | staff | Platform Specific Questions > CR-Z Platform | Map sensor & Live tuning
t492 | SKIP | staff | Platform Specific Questions > CR-Z Platform | KTuner Map Edit
t2425 | SKIP | nostaff | Platform Specific Questions > CR-Z Platform | E85 Flex Fuel Please!
t2348 | KEEP | staff | Platform Specific Questions > CR-Z Platform | Ktuner
p2324 | SKIP | staff | Platform Specific Questions > CR-Z Platform > 11-12 CR-Z Specific | Subject to internet connection required after every upload
t499 | DUP-of-t499 | Boost? - Page 4
t1896 | SKIP | staff | Platform Specific Questions > Fit Platform > 12-13 Fit | Ktuner V1 Compatibility
t239 | SKIP | staff | Platform Specific Questions > Fit Platform > 12-13 Fit | '13 Fit AT issue
t1965 | SKIP | staff | Platform Specific Questions > Fit Platform > 12-13 Fit | Setting RPM Based Output Light
t2285 | KEEP | staff | Platform Specific Questions > Fit Platform > 12-13 Fit | Extra Gauges with Ktuner V2
t2295 | KEEP | staff | Platform Specific Questions > Fit Platform > 12-13 Fit | P0101 with speed density map
t1741 | KEEP | staff | Platform Specific Questions > CR-Z Platform | Any new turbo information?
t2356 | DUP-of-t2356 | IAT fuel correction
p9565 | SKIP | staff | Welcome > Welcome | Welcome to KTuner - Page 10
p9275 | DUP-of-t2487 | big mod boys check in
t2620 | KEEP | staff | Platform Specific Questions > TLX Platform | 2015 intake/maf high flow cat downpipes
p9400 | SKIP | staff | Platform Specific Questions > Fit Platform > 09-10 Fit | 37820-rb7-q02 08 GE ECU
p9631 | SKIP | staff | Platform Specific Questions > RSX Platform > 05-06 RSX Specific | K20A2 base map help!!!!
p8626 | SKIP | staff | Platform Specific Questions > Fit Platform > 15+ Fit | Rev Hang
t2543 | KEEP | nostaff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 18+ Accord Specific | Knock Control on Factory Tune
t2177 | SKIP | staff | Platform Specific Questions > Element Platform > 03-06 Element Specific | Speedo calibration not working
t660 | SKIP | staff | Platform Specific Questions > Fit Platform | 2017 gk5
t2675 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 13-17 Accord V6 Specific | KTuner Not Disabling O2 & EGR
p9403 | DUP-of-t2671 | Throttle response
t2677 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 13-17 Accord V6 Specific | Understanding the 91+ Octane tune
p9193 | SKIP | staff | Platform Specific Questions > K Swapped Vehicles | Flex fuel question
p9175 | SKIP | staff | Platform Specific Questions > RDX Platform | Difference in maps?
p9181 | SKIP | staff | Platform Specific Questions > TL Platform > 09-14 TL Specific | 12 tl a/t
p9238 | SKIP | staff | Platform Specific Questions > MDX Platform | 22+ MDX
p9129 | KEEP | staff | Welcome > Welcome | My first time here …
p9014 | SKIP | staff | Platform Specific Questions > Ridgeline Platform | Support for 2017 Honda Ridgeline or Pilot - Page 2
p9156 | DUP-of-t2616 | 4 Bar Map support
p9207 | DUP-of-t2542 | fuel status 1 issue - Page 2
p9188 | DUP-of-t2625 | Map sensor & Live tuning
p9215 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 06-07 Accord Specific | Reverse Lockout
t47 | SKIP | staff | Platform Specific Questions > Element Platform > 03-06 Element Specific | 03-06 Element STOCK reflash
t2550 | SKIP | staff | Platform Specific Questions > Element Platform > 03-06 Element Specific | TPS Calibration Issues (Continued)
t888 | KEEP | staff | Platform Specific Questions > RSX Platform > 02-04 RSX/EP3 Specific | 05 civic si (EP3)
t70 | SKIP | staff | Platform Specific Questions > RSX Platform > 02-04 RSX/EP3 Specific | 2002 RSX K24A2
t1601 | SKIP | nostaff | Platform Specific Questions > RSX Platform > 02-04 RSX/EP3 Specific | 02/04-05/06 ECU Pinouts
t2566 | KEEP | staff | Platform Specific Questions > Element Platform > 03-06 Element Specific | Running out of fuel? - Page 2
t1614 | SKIP | staff | Platform Specific Questions > Element Platform > 03-06 Element Specific | 2005 Element manual immobilizer issue
t2569 | KEEP | staff | Platform Specific Questions > Element Platform > 03-06 Element Specific | KTuner PRB hard to start
t2408 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 18+ Accord Specific | KTuner for 87 octane gas?
t2571 | KEEP | staff | Platform Specific Questions > Civic Platform > 16-21 Civic 1.5T | Rolling anti lag
t71 | KEEP | staff | Platform Specific Questions > Accord / CL7 Euro-R Platform > 08-12 Accord i4 Specific | Welcome! - Page 2
p8814 | SKIP | staff | Platform Specific Questions > Fit Platform > 09-10 Fit | Just got my first Ktuner...
t2134 | KEEP | staff | Platform Specific Questions > RDX Platform | Quick adjustments
p7295 | KEEP | staff | Platform Specific Questions > RDX Platform | 2021 RDX Stage 2 Tune
p8820 | DUP-of-t2542 | fuel status 1 issue
p7648 | KEEP | staff | Platform Specific Questions > HR-V Platform | US market 2016 HRV 1.8 LX CVT
p8518 | KEEP | staff | Platform Specific Questions > S2000 Platform > 06-09 S2000 Specific | Tuning for E85 using the stock O2 sensor?
p8825 | SKIP | staff | Platform Specific Questions > K Swapped Vehicles | data logs
t1696 | KEEP | staff | Platform Specific Questions > Civic Platform > 12-15 Civic R18 Specific | 2015 Civic EX CVT
p8789 | SKIP | staff | Platform Specific Questions > RSX Platform > 05-06 RSX Specific | Anti lag button?
t475 | DUP-of-t475 | Subject to internet connection required after every upload
t168 | SKIP | staff | Platform Specific Questions > S2000 Platform | 00-05 ECU options
t255 | SKIP | staff | Platform Specific Questions > CR-Z Platform > 11-12 CR-Z Specific | Error loading tune
t321 | SKIP | staff | Platform Specific Questions > Fit Platform > 15+ Fit | Support of GK5
t691 | SKIP | staff | Platform Specific Questions > Element Platform > 07-08 Element Specific | Can you flash PZD-A45 ?
t2206 | KEEP | staff | Platform Specific Questions > Element Platform > 07-08 Element Specific | 08 turbo Knock control
t1646 | SKIP | staff | Platform Specific Questions > S2000 Platform > 06-09 S2000 Specific | S2000 DBW - unsupported ECU, how to unlock and next steps?
t700 | SKIP | staff | Platform Specific Questions > HR-V Platform > 16+ HR-V | International HRV
t480 | KEEP | staff | Platform Specific Questions > Civic Platform > 12-15 Civic Si Specific | 1000cc Injectors - Page 2
t2093 | KEEP | staff | Platform Specific Questions > Civic Platform > 12-15 Civic Si Specific | MPG drop since tuning
t2096 | KEEP | staff | KTuner Hardware Questions > Hardware Installation Questions | KTuner End User Board for 06-07 Accord
t273 | KEEP | staff | Platform Specific Questions > Civic Platform > 12-15 Civic Si Specific | China version civic si available of Ktuner?
p6874 | DUP-of-t2096 | KTuner End User Board for 06-07 Accord
p5820 | DUP-of-t1832 | Manual EUDM support?
t2181 | NOPOSTS | KTuner.com • Settings with a PRL Cat back downpipe
p6037 | SKIP | staff |  | Factory Tune
p7253 | KEEP | staff |  | Any Advice On Automatic V6 tune
p7146 | SKIP | staff |  | 05 base/end-user/bad Ecu?
p6991 | SKIP | staff |  | Inconsistent AFR?
p7278 | DUP-of-t878 | Reflash
p6683 | DUP-of-t2048 | Map Sensor Scaling and IMA Signal
p6601 | SKIP | staff |  | Couple of questions
p7268 | KEEP | staff |  | 08 A/T element
p7144 | SKIP | staff |  | K20 Euro TypeR CL7 Swap on EK
p7252 | SKIP | staff |  | Ktuner end user cl9 k24a3 j35 throttle isue
p7275 | SKIP | staff |  | 2019 TLX transmission tuning
p3795 | DUP-of-t700 | International HRV
p2854 | SKIP | staff |  | V1.2 Tunes
p2859 | DUP-of-t629 | V1.2 Tunes
p2860 | DUP-of-t629 | V1.2 Tunes
t629 | NOPOSTS | V1.2 Tunes
p2853 | DUP-of-t629 | V1.2 Tunes
t779 | SKIP | staff |  | RAD ecu
t785 | SKIP | staff |  | Base maps
t2043 | SKIP | staff |  | Suggestions for future update
p6110 | SKIP | staff |  | Error running stage 2
p6111 | DUP-of-t1891 | Error running stage 2
p6112 | DUP-of-t1891 | Error running stage 2
p6115 | DUP-of-t1891 | Error running stage 2
p6116 | DUP-of-t1891 | Error running stage 2
p6117 | DUP-of-t1891 | Error running stage 2
t2119 | SKIP | staff |  | ECU Communication Failed
t1930 | KEEP | staff |  | Tunerview Freezing
t823 | SKIP | staff |  | new tune
t1891 | NOPOSTS | Error running stage 2
t810 | KEEP | staff |  | Ktuner maf
t1622 | SKIP | staff |  | No Maps
t1625 | SKIP | staff |  | Failure communicating with server
t2010 | KEEP | staff |  | tunerview lite no bluetooth found
t1721 | SKIP | staff |  | Unlocking from another ecu
t1770 | SKIP | staff |  | Ktuner firmware fail
p5780 | SKIP | staff |  | Can't load a tune file
p5782 | DUP-of-t1823 | Can't load a tune file
p5784 | DUP-of-t1823 | Can't load a tune file
p5787 | DUP-of-t1823 | Can't load a tune file
t1823 | DUP-of-t1823 | Can't load a tune file
p5776 | DUP-of-t1823 | Can't load a tune file
p5777 | DUP-of-t1823 | Can't load a tune file
p5779 | DUP-of-t1823 | Can't load a tune file
t586 | SKIP | staff |  | VTC not commanding or functioning.
t1894 | SKIP | staff |  | OnBoard Logging Causes Erratic EMS operation
p6282 | KEEP | staff |  | Unlocked unit won't lock to my ECU. HELP!
t1900 | SKIP | staff |  | problem connecting ktuner unit to PC
p5556 | DUP-of-t1762 | Unlocked unit won't lock to my ECU. HELP!
t1893 | KEEP | nostaff |  | Full description of Adjustments Toolbar?
t1892 | KEEP | staff |  | ECU-37820-5AN-J610
t1890 | SKIP | staff |  | Full support
p5549 | DUP-of-t1762 | Unlocked unit won't lock to my ECU. HELP!
t351 | SKIP | staff |  | Is a45 ecu available to run ktuner end user?
p6420 | DUP-of-t1762 | Unlocked unit won't lock to my ECU. HELP!
t1762 | NOPOSTS | Unlocked unit won't lock to my ECU. HELP!
t1899 | KEEP | staff |  | Sup people?
p6413 | DUP-of-t1762 | Unlocked unit won't lock to my ECU. HELP!
p6418 | DUP-of-t1762 | Unlocked unit won't lock to my ECU. HELP!
t1898 | KEEP | staff |  | Missing settings (AG-Q61)
p5351 | DUP-of-t1721 | Unlocking from another ecu
p5352 | DUP-of-t1721 | Unlocking from another ecu
p5790 | DUP-of-t1823 | Can't load a tune file
p5783 | DUP-of-t1823 | Can't load a tune file
p5775 | DUP-of-t1823 | Can't load a tune file
p6736 | SKIP | staff |  | Change the outputs in the datalog?
p6737 | DUP-of-t2063 | Change the outputs in the datalog?
p6739 | DUP-of-t2063 | Change the outputs in the datalog?
p6280 | DUP-of-t1762 | Unlocked unit won't lock to my ECU. HELP!
t2063 | NOPOSTS | Change the outputs in the datalog?
p6279 | DUP-of-t1762 | Unlocked unit won't lock to my ECU. HELP!
p6750 | DUP-of-t2063 | Change the outputs in the datalog?
p6751 | DUP-of-t2063 | Change the outputs in the datalog?
p6752 | DUP-of-t2063 | Change the outputs in the datalog?
p6792 | SKIP | staff |  | KTuner Questions!!
p6740 | DUP-of-t2063 | Change the outputs in the datalog?
t2070 | SKIP | staff |  | Ktuner program wont recognize my ktuner device
p6745 | DUP-of-t2063 | Change the outputs in the datalog?
p6746 | DUP-of-t2063 | Change the outputs in the datalog?
p6749 | DUP-of-t2063 | Change the outputs in the datalog?
p6414 | DUP-of-t1762 | Unlocked unit won't lock to my ECU. HELP!
p6791 | DUP-of-t2070 | Ktuner program wont recognize my ktuner device
t1824 | NOPOSTS | VSA Traction control & TPMS settings?
t2024 | KEEP | staff |  | Rev limiter
t1821 | NOPOSTS | CRZ w/k24a2 using 06 si ecu - stock k24 basemap?
t1808 | SKIP | staff |  | KTuner In-ECU communication failure
p5781 | SKIP | staff |  | VSA Traction control & TPMS settings?
p5785 | DUP-of-t1824 | VSA Traction control & TPMS settings?
p5786 | DUP-of-t1824 | VSA Traction control & TPMS settings?
t2004 | KEEP | staff |  | AFTER FLASHING -Warning Light displays HELP !!!!!!
p5778 | DUP-of-t1824 | VSA Traction control & TPMS settings?
p5572 | DUP-of-t1770 | Ktuner firmware fail
p2609 | SKIP | staff |  | Stored Flash Profiles
t540 | DUP-of-t540 | Stored Flash Profiles
p2913 | DUP-of-t540 | Stored Flash Profiles
p2908 | DUP-of-t540 | Stored Flash Profiles
p2584 | DUP-of-t540 | Stored Flash Profiles
p2585 | DUP-of-t540 | Stored Flash Profiles
p2586 | DUP-of-t540 | Stored Flash Profiles
p2610 | DUP-of-t540 | Stored Flash Profiles
p5594 | SKIP | staff |  | cant flash/upload tune
t1795 | KEEP | staff |  | Disabling Pin for Bluetooth?
t768 | KEEP | staff |  | Knock control weird after using Lucus octane boost
t1730 | SKIP | staff |  | Element or TSX platform/ECU?
p5391 | KEEP | staff |  | ECU software not on the Supported List!
p5392 | DUP-of-t825 | ECU software not on the Supported List!
t1804 | KEEP | staff |  | Extremely high knock count and other issues
t1801 | SKIP | staff |  | Acura RDX 2019 Bought in Panama
t1800 | SKIP | staff |  | Open Loop Logic
t1787 | KEEP | staff |  | Downloading Tunes from Ecu
p5042 | SKIP | staff |  | Is my ktuner bricked!?
t1624 | NOPOSTS | Is my ktuner bricked!?
t1786 | KEEP | staff |  | Feature Roadmap
p5038 | DUP-of-t1624 | Is my ktuner bricked!?
t1793 | SKIP | staff |  | Vehicle wiring for full functionality
t1781 | KEEP | staff |  | ktuner ecu questions
p2723 | DUP-of-t499 | Boost?
t1739 | NOPOSTS | Logging instead of connected
t1743 | NOPOSTS | Disabling BOS Brake Override Sensor
p5451 | SKIP | staff |  | Disabling BOS Brake Override Sensor
p5452 | DUP-of-t1743 | Disabling BOS Brake Override Sensor
p5453 | DUP-of-t1743 | Disabling BOS Brake Override Sensor
p5454 | DUP-of-t1743 | Disabling BOS Brake Override Sensor
p5455 | DUP-of-t1743 | Disabling BOS Brake Override Sensor
p5456 | DUP-of-t1743 | Disabling BOS Brake Override Sensor
p5442 | SKIP | staff |  | Logging instead of connected
p5443 | DUP-of-t1739 | Logging instead of connected
p5444 | DUP-of-t1739 | Logging instead of connected
p4839 | DUP-of-t825 | ECU software not on the Supported List!
t828 | KEEP | staff |  | Ktuner v2
p2284 | DUP-of-t467 | 08 A/T element
p2285 | DUP-of-t467 | 08 A/T element
p2286 | DUP-of-t467 | 08 A/T element
p2288 | DUP-of-t467 | 08 A/T element
t736 | SKIP | staff |  | 2017 Fit EX MT
t1736 | SKIP | staff |  | Not connected to Car, asking if I want to lock ECU?
p4829 | DUP-of-t825 | ECU software not on the Supported List!
t833 | KEEP | staff |  | Missing Tunes
t1742 | ERR | https://web.archive.org/web/20190919171138id_/http://www.ktuner.com/forums/viewtopic.php?t=1742&p=5462 | HTTP Error 404: NOT FOUND
t1744 | KEEP | staff |  | Fuel Injector Scaling
t467 | NOPOSTS | 08 A/T element
p3762 | DUP-of-t825 | ECU software not on the Supported List!
p4898 | DUP-of-t825 | ECU software not on the Supported List!
p3750 | DUP-of-t825 | ECU software not on the Supported List!
p3748 | DUP-of-t825 | ECU software not on the Supported List!
p4830 | DUP-of-t825 | ECU software not on the Supported List!
p3681 | SKIP | staff |  | ktuner r1 bluetooth trouble
p1439 | SKIP | staff |  | J37A4 Swap Completed
t647 | KEEP | staff |  | 2018 Accord 1.5T Tuning
p3291 | KEEP | staff |  | element ecu in a turbo EP3
t696 | KEEP | staff |  | Ktuner cycles between connected and disconnected
p3760 | DUP-of-t828 | Ktuner v2
t1617 | KEEP | staff |  | Horsepower/Torque?
t656 | KEEP | staff |  | Ktuner issues on laptop
p4995 | DUP-of-t1617 | Horsepower/Torque?
p4997 | DUP-of-t1617 | Horsepower/Torque?
p4998 | DUP-of-t1617 | Horsepower/Torque?
p1427 | DUP-of-t258 | J37A4 Swap Completed
t710 | KEEP | staff |  | 07-08 Element Turbo
t50 | SKIP | staff |  | 05 RSX TYPE S I/H/E reflash 2
p3710 | SKIP | staff |  | New registration time
t830 | KEEP | staff |  | 2017 Aus Civic 1.8L KTuner?
t653 | SKIP | staff |  | Suggestion: Kensington cable lock
p1463 | DUP-of-t258 | J37A4 Swap Completed
p1465 | DUP-of-t258 | J37A4 Swap Completed
p1466 | DUP-of-t258 | J37A4 Swap Completed
p2993 | SKIP | staff |  | Malaysia 2013 CRZ
p2712 | DUP-of-t3 | Welcome to KTuner
t650 | KEEP | staff |  | Flex fuel converter
t1719 | KEEP | staff |  | New to tuners
t1718 | SKIP | staff |  | Direction for understanding the Ktuner softward better
t550 | SKIP | staff |  | Speed Input Wiring Diagram
t1717 | SKIP | staff |  | Fuel Dilution Update
t1716 | KEEP | staff |  | Locking Ecu to Ktuner
t15 | SKIP | staff |  | Ask your KTuner Reflash questions
p3769 | SKIP | staff |  | Fuel Overrun for exhaust pops?
t109 | SKIP | staff |  | "Incorrect Username"
t684 | KEEP | staff |  | Ktuner Problem
p3441 | KEEP | staff |  | False knock and misfire reading
p2951 | KEEP | staff |  | IACV Tuning
t1715 | SKIP | staff |  | ECU - 37820-5AN-E32
t1714 | KEEP | staff |  | Car was running fine for months and then went to limp mode
t1712 | KEEP | staff |  | Canadian data log
p5001 | DUP-of-t1617 | Horsepower/Torque?
t1711 | KEEP | staff |  | Missing Base Maps?
t1710 | SKIP | staff |  | Tsx swap into 06 AT element
t258 | DUP-of-t258 | J37A4 Swap Completed
t637 | SKIP | staff |  | Setting up for the first time
t1596 | KEEP | staff |  | 2018 1.5T CVT Accord Questions
t1597 | KEEP | staff |  | FK8 Anti Lag/ 2 step?
p1440 | DUP-of-t258 | J37A4 Swap Completed
t604 | SKIP | staff |  | Error code
p1441 | DUP-of-t258 | J37A4 Swap Completed
t1594 | KEEP | staff |  | Do any members offer a be all/end all tune??
p3139 | KEEP | staff |  | 04 K24a2 (TSX) into '01 Insight
p3461 | DUP-of-t647 | 2018 Accord 1.5T Tuning
p3462 | DUP-of-t647 | 2018 Accord 1.5T Tuning
p3437 | SKIP | staff |  | Will K Tuner leave a foot print?
p2731 | DUP-of-t3 | Welcome to KTuner
p3414 | SKIP | staff |  | RDX Injectors
t468 | SKIP | staff |  | Honda Pilot support
t580 | SKIP | staff |  | V1.2
t860 | SKIP | staff |  | How to disable O2 while keeping Tune 1 for 2011 MDX
p2283 | DUP-of-t467 | 08 A/T element
p2442 | DUP-of-t499 | Boost?
p2724 | DUP-of-t499 | Boost?
t642 | KEEP | staff |  | Reflash?
p2840 | SKIP | staff |  | Auto On when car is started.
t826 | SKIP | staff |  | which ECU for K24a2 swap
t702 | KEEP | staff |  | Using an Apple MacBook Pro with KTuner V2
p3774 | KEEP | staff |  | Base tune with Boost Support
t260 | KEEP | staff |  | Boost control solenoid
p3370 | SKIP | staff |  | K24A3 ACCORD CL9
t1598 | KEEP | staff |  | Does this version (13-17 Accord V6) have Full Throttle Shift
p3546 | DUP-of-t779 | RAD ecu
p3544 | KEEP | staff |  | Base maps for 06-11 Civic si
t1593 | KEEP | staff |  | Car was disabled for a day because two ECU’s showed up
p2271 | DUP-of-t462 | CVT and Ktuner questions
t160 | KEEP | staff |  | Weird VSS Datalog reading
p3545 | DUP-of-t372 | Base tune with Boost Support
t775 | KEEP | staff |  | New Ktuner Driving Issues
p2998 | SKIP | staff |  | Dash display MPG
p4837 | DUP-of-t825 | ECU software not on the Supported List!
p3863 | DUP-of-t15 | Ask your KTuner Reflash questions
p3003 | DUP-of-t3 | Welcome to KTuner
p2891 | DUP-of-t109 | "Incorrect Username"
p2977 | DUP-of-t656 | Ktuner issues on laptop
t425 | DUP-of-t425 | RDX Injectors
t253 | KEEP | staff |  | Support For Boost & Additional Features
t1637 | SKIP | staff |  | Dealer Enquiries for South Africa
p2192 | DUP-of-t15 | Ask your KTuner Reflash questions
p2967 | DUP-of-t656 | Ktuner issues on laptop
p2885 | DUP-of-t109 | "Incorrect Username"
p2969 | DUP-of-t656 | Ktuner issues on laptop
p2759 | DUP-of-t604 | Error code
t877 | SKIP | staff |  | KTuner V2 SD Card Failure
p1860 | DUP-of-t15 | Ask your KTuner Reflash questions
t1560 | SKIP | staff |  | Case for Ktuner
t1589 | KEEP | staff |  | turbo boost
p2952 | DUP-of-t650 | Flex fuel converter
p2954 | DUP-of-t650 | Flex fuel converter
p3438 | DUP-of-t760 | False knock and misfire reading
p3279 | DUP-of-t722 | element ecu in a turbo EP3
p2587 | DUP-of-t540 | Stored Flash Profiles
p2095 | DUP-of-t425 | RDX Injectors
p2949 | DUP-of-t650 | Flex fuel converter
p2290 | DUP-of-t467 | 08 A/T element
p3707 | DUP-of-t813 | New registration time
p1488 | DUP-of-t3 | Welcome to KTuner
p2730 | DUP-of-t3 | Welcome to KTuner
p2734 | DUP-of-t3 | Welcome to KTuner
p2735 | DUP-of-t3 | Welcome to KTuner
p1438 | DUP-of-t258 | J37A4 Swap Completed
p3019 | KEEP | staff |  | Dual tunes
p2811 | KEEP | staff |  | 2013 Accord V6 AT Paddle Shifting Update Suggestion
t612 | KEEP | staff |  | Let get it started
p1426 | DUP-of-t258 | J37A4 Swap Completed
p1464 | DUP-of-t258 | J37A4 Swap Completed
t707 | SKIP | staff |  | Error during installation
t566 | SKIP | staff |  | Round v2
t712 | KEEP | staff |  | No tunes to upload or chose from. :(
p2986 | KEEP | staff |  | 2006 - Boost Capability?
p3068 | KEEP | staff |  | ECT2 and ecu connection
p2316 | SKIP | staff |  | Tuning my TLX 15
p3146 | DUP-of-t673 | popping exhaust sound
p3136 | SKIP | staff |  | 05 Honda element with tsx engine swap need help with base ma
p3168 | SKIP | staff |  | ktuner disable option
p3004 | DUP-of-t3 | Welcome to KTuner
p3104 | DUP-of-t642 | Reflash?
p3167 | SKIP | staff |  | Bluethooth password
p2613 | SKIP | staff |  | 2018 ridgeline
p3182 | SKIP | staff |  | trying to download software.
p3115 | SKIP | staff |  | IAT correction available yet?
p3173 | DUP-of-t700 | International HRV
p3179 | DUP-of-t702 | Using an Apple MacBook Pro with KTuner V2
p3166 | DUP-of-t696 | Ktuner cycles between connected and disconnected
p1766 | SKIP | staff |  | Disable o2 Sensors to Prevent Cel with PCDs
p1392 | SKIP | staff |  | runtime error
p1755 | SKIP | staff |  | Steering Calibration, VSA, Hill hold
p1702 | DUP-of-t321 | Support of GK5
p1745 | SKIP | staff |  | K TUNER Horse power limit
p1477 | DUP-of-t15 | Ask your KTuner Reflash questions
p1727 | KEEP | staff |  | 1996 civic cam angles
p1585 | DUP-of-t259 | 2016 Support
p1608 | SKIP | staff |  | 2008 TL Type-S Automatic
p1757 | SKIP | staff |  | high idle
p1689 | SKIP | staff |  | Another interested Wagon
p1350 | DUP-of-t239 | '13 Fit AT issue
p1341 | SKIP | staff |  | Crash during reflash help!?
p1158 | KEEP | staff |  | BOOST BY GEAR MAC SOLENOID
p529 | KEEP | staff |  | Ktuner trouble installation
p1228 | SKIP | staff |  | Oooops...
p980 | DUP-of-t168 | 00-05 ECU options
p1237 | SKIP | staff |  | A little guidance
p991 | DUP-of-t15 | Ask your KTuner Reflash questions
p1099 | SKIP | staff |  | Speed/density
p1344 | SKIP | staff |  | Immobilizer Issue
p1312 | SKIP | staff |  | Calibration for TPS
p1338 | KEEP | staff |  | Individual cylinder fuel trim
p905 | DUP-of-t3 | Welcome to KTuner
p1347 | KEEP | staff |  | Ecu Pin Locations
p1307 | SKIP | staff |  | k24z3 using 05-06 ecu
p966 | DUP-of-t170 | 04-06 TLs
p506 | SKIP | staff |  | Tuning solution for 09-13 Honda Fit GE8
p510 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8
p512 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8
p504 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8
p509 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8
p508 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8
p503 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8
t89 | NOPOSTS | Tuning solution for 09-13 Honda Fit GE8
p505 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8
p511 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8
p507 | DUP-of-t89 | Tuning solution for 09-13 Honda Fit GE8

Pass 2 summary: 541 ids attempted; 153 KEEP (raw saved as *-w2.md), 190 SKIP, 163 DUP, 19 ERR, 16 NOPOSTS. The titled WebSearch hits (e.g. t=2243 Boost control with KTuner V2, 2199 Weird Boost Limiter, 548 Dual tunes, 2186, 2536 Knock count, 2102, 760, 2508 Knock Control Driving and on Idle, 147, 2457, 767) are NOT in the Wayback CDX (archive.org has no capture) so they could not be fetched. The KEEP filter is loose; many kept files are non-1.5T platforms, claims were extracted only from Civic/Accord-1.5T/turbo-logic/TunerView/flashing/DTC staff answers. Claims total now 69 (all quotes script-verified).

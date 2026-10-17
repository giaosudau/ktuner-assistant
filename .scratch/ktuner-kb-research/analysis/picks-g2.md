# Picks, group g2: value ≥ 3 and fits / fits-with-caveat

*Stage 2, 17 Oct 2026. Each pick lists: finding id, value, KB relation, and the proposed card change. Sources are linked as forum threads and KTuner pages; claim ids live in `findings-g2.jsonl`. `fact-check.md` wins on any number. Our car's numbers come from the 9 TunerView logs in `data/example-*.js` and the owner's KTuner 1.0.14.0 screenshots (`.scratch/downpipe-power/issues/11-quick-adjustments-screenshot.md`).*

**Top 8, in order:** g2-13 (5) · g2-07 (4) · g2-53 (4) · g2-52 (4) · g2-14 (4) · g2-34 (4) · g2-60 (4) · g2-50 (4). Also value 4: g2-03, g2-06, g2-12, g2-16.

---

## ignition-knock

### g2-13 · value 5 · extends `kc-high-rpm`: the artificial rise is ON for this car, and the exclusion depends on a checkbox
**Proposed card change.** Replace the second sentence of `kc-high-rpm` with:

> KTuner can remove the rise with Quick Enables → "Eliminate Artificial Knock Control Rise" (since 1.0.11.0 for 2022+ codebases that have it). On this car's Starter 21 Dual Tune 2 (KTuner 1.0.14.0) the box is off, so the rise is present and rises above 5,200 rpm are excluded. If the box is ever ticked, a rise up there is real knock and counts like any other.

**Engine change.** Store the box state in the Car profile. Make `KTA.LIMITS.score.highRpm` apply only while it is off.

Setting: Quick Enables → Eliminate Artificial Knock Control Rise. Log: Knock Control vs Engine RPM > 5,200.

Sources: [KTuner version history](http://www.ktuner.com/KTunerHelp/version_history.htm) (1.0.10.1, 1.0.11.0, 1.0.11.9) · [Artificial knock rise control](https://www.civicx.com/forum/threads/artificial-knock-rise-control.69583/) · [Auto District video](https://www.youtube.com/watch?v=0q8M5nZvfp8&t=276s) · [Sky-high K.Con, 16 CVT](https://www.civicx.com/forum/threads/sky-high-kcon-also-bad-fuel-trims-need-help-16-cvt-ktuner.79395/)

### g2-14 · value 4 · extends `kc-high-rpm`: with the rise removed, a high-rpm rise is real knock
**Proposed line**, added after the g2-13 text:

> Owners who removed it report 0.49 to 0.52 up to 6,500 rpm on US 91.

Basis stays provisional until one of our pulls above 5,500 rpm is logged with the box ticked. The US remedy (an E85 splash) maps to E10 RON97 III here.

Sources: [Aggressive dual 21 without forced KC rise](https://www.civicx.com/forum/threads/aggressive-dual-21-ktuner-without-forced-knock-control-rise.60757/) · [Artificial knock rise control](https://www.civicx.com/forum/threads/artificial-knock-rise-control.69583/)

### g2-12 · value 4 · confirms `kc-high-rpm`
No text change. Add `source-doc: version_history.md 1.0.11.0`.

Our logs saw one excursion above 5,200 rpm in 9 drives (0.8 s, KC 0.50 → 0.52), so the rule almost never acts for this owner.

Sources: [High knock control during WOT](https://www.civicx.com/forum/threads/high-knock-control-during-wot.71665/) · [KTuner knock control question](https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/) · [K.Con (knock control)](https://www.civic11forum.com/threads/k-con-knock-control.6222/)

### g2-15 · value 3 · extends `kc-high-rpm`: what the forced rise costs
**Proposed line:**

> The forced rise adds about 0.2 per pull, which costs about 2 degrees (0.2 × 10.2) only above 5,500 rpm.

Sources: as g2-12, plus [Aggressive dual 21](https://www.civicx.com/forum/threads/aggressive-dual-21-ktuner-without-forced-knock-control-rise.60757/)

### g2-07 · value 4 · contradicts `kc-ignition-formula`: logging step
**Proposed replacement** for "The log rounds both: retard shows as 3.5 and ignition as 19":

> The log shows both in steps: KTuner's example logs 3.8 degrees of retard as 3.5. On TunerView, ignition and retard both move in half-degree steps (the 1-degree ignition step is for OBD loggers). Under boost every score from 0.49 to 0.54 logs the same 5.0 of retard, so read Knock Control itself.

Also fix the fact-check §2 wording "(0.5° and 1°)".

Source: [KTuner Help, Ignition Timing and Knock Control](http://www.ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm) + our 108,918 rows.

### g2-03 · value 4 · extends `kc-ranges`: translate forum numbers into degrees
**Proposed line:**

> Forum numbers are labels, not limits: in degrees under boost on this map, 0.70 costs about 2.1, 0.85 about 3.7, 0.90 about 4.2 and 1.00 about 5.2 degrees. Owners call 0.7 normal and feel power loss near 0.8, which is where this car's provisional Stop sits.

Sources: [Rising knock control and knock retard](https://www.civicx.com/forum/threads/rising-knock-control-and-knock-retard.60900/) · [KTuner knock control question](https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/) · [A very strange knock control issue](https://www.civicx.com/forum/threads/a-very-strange-knock-control-issue-can-the-experts-help.87992/) · [Another Rich Experience video](https://www.youtube.com/watch?v=sfwP7cUteAE)

### g2-06 · value 4 · extends `kc-timing-percent`: low WOT timing is the map
**Proposed line**, for a new owner question "My timing is near zero under boost, is that bad?":

> KTuner says several tables decide final timing and about 0 degrees at WOT on a base map is not uncommon. On your pulls Ignition logs −1.5 to +0.5 at boost onset and 3.5 to 4.5 degrees at 16 psi near 5,000 rpm, with Knock Control at the floor: that is the map, not knock.

Source: [CivicXI thread 30576](https://www.civicxi.com/forum/threads/30576/) (KTuner staff)

### g2-16 · value 4 · confirms `kc-oil`: low-rpm rises on CVT cars
**Proposed line:**

> Other CVT owners see the same thing: a hot-climate Indonesian CVT on RON90 logged its rises at 1,250 to 1,500 rpm under load, and US CVTs at 1,400 rpm.

Context only: the Indonesian ignition edit is out of scope.

Sources: [Knocking (Indonesia, RON 90)](https://www.civicxi.com/forum/threads/44171/) · [A very strange knock control issue](https://www.civicx.com/forum/threads/a-very-strange-knock-control-issue-can-the-experts-help.87992/) · [Civic Si KTuner 2.0 first impressions](https://www.civic11forum.com/threads/civic-si-ktuner-2-0-first-impressions-questions.1807/)

### g2-01 · value 3 · extends `kc-ranges`: floor, blips, Hondata offset
**Proposed line:**

> KTuner's floor is 0.49; Hondata displays the same state as about 0.54, so subtract about 0.05 from a Hondata owner's number. A 0.47 or a one-sample jump at a throttle change is a blip; judge settled values.

Our data: 1 % of rows blip below 0.48 for 1–3 samples.

Sources: [High knock control reading after V2 flash](https://www.civicx.com/forum/threads/high-knock-control-reading-after-ktuner-v2-flash.19473/) · [Knock control significance](https://www.civicx.com/forum/threads/knock-control-significance.29457/) · [KTuner knock control question](https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/)

### g2-02 · value 3 · extends `kc-after-flash`: KTuner sets 0.59
**Proposed change:** replace "around 0.58" with:

> exactly 0.59, the value KTuner sets after every flash (since 1.0.6.2); your 30 Aug log starts at 0.59

Sources: [KTuner version history](http://www.ktuner.com/KTunerHelp/version_history.htm) · [caraddict video](https://www.youtube.com/watch?v=Bn03GonKMqY&t=99s) · [KTuner knock control question](https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/)

### g2-17 · value 3 · extends `kc-after-flash`: how it learns down
**Proposed line:**

> It learns down fastest at steady light load in a high gear with the manifold near zero boost, typically within five minutes. Low revs with the foot down is lugging and pushes it up instead.

Sources: [CivicXI 38412](https://www.civicxi.com/forum/threads/38412/) · [CivicXI 41116](https://www.civicxi.com/forum/threads/41116/) · [KTuner numbers](https://www.civic11forum.com/threads/ktuner-numbers.8148/)

### g2-08 · value 3 · confirms `kc-ranges` / CONTEXT
No text change. Optional quote for the "Why?" panel, from KTuner staff: Knock Control "is a product of your fuel quality and your environmental factors."

Sources: [KTuner forum t=1638](http://www.ktuner.com/forums/viewtopic.php?t=1638) · [KTuner forum t=1842](http://www.ktuner.com/forums/viewtopic.php?f=62&t=1842)

### g2-09 · value 3 · extends `kc-misfire-gauges`
**Proposed line:**

> The one count that matters is a steep one: 50 or more in a few seconds with the check-engine light flashing, which the ECU flags itself.

Sources: [CivicXI 51853](https://www.civicxi.com/forum/threads/51853/) · [Rising knock control and knock retard](https://www.civicx.com/forum/threads/rising-knock-control-and-knock-retard.60900/)

### g2-05, g2-10, g2-11 · value 3 · confirm `kc-ignition-formula` / `kc-ranges`
- **g2-05:** no change.
- **g2-10 and g2-11:** add a guard line to `kc-ranges`:

> Retard does not drive the score; the score drives retard. 5 to 8 degrees of logged retard on a pull that drops to zero at lift-off is the schedule. 10 or more on every pull means a score near 1.0.

Sources: [KTuner numbers](https://www.civic11forum.com/threads/ktuner-numbers.8148/) · [Fuel quality and knock control](https://www.civic11forum.com/threads/fuel-quality-and-knock-control.7390/) · [Is this knock or the injectors](https://www.civic11forum.com/threads/is-this-knock-or-is-this-the-fuel-injectors.8355/)

### g2-04 · value 3 · confirms `kc-ranges`: refuted claim to guard against
**Proposed guard line**, in the agent's never-say list:

> "On 91 octane Knock Control sits near 0.9" is wrong for this car: E10 RON95 holds 0.49 to 0.54 cool.

Source: [KTuner knock control question](https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/)

### g2-19 · value 3 · extends `kc-table-ignition`: noise can look like knock
**Proposed line:**

> A score rise right after fitting a part can be vibration or noise as well as knock (a loose engine mount did it on one car): check mounts and shields, compare matched drives before and after, and never desensitize the sensors.

Sources: [Fuel quality and knock control](https://www.civic11forum.com/threads/fuel-quality-and-knock-control.7390/) · [CivicXI 51853](https://www.civicxi.com/forum/threads/51853/)

---

## fuel-octane

### g2-34 · value 4 · extends `kc-fuel-test`: why RON97 won't give a vendor's 5 %
**Proposed line:**

> Vendors show about 5 percent more power on 93 than 91 (Phearable's Si dyno: 246 hp against 234 hp), but that comes from a separate 93 file with more timing. On one map like Starter 21 better fuel can only return what Knock Control took: nothing on cool pulls, up to about 1.6 degrees in hot traffic.

Sources: [Phearable Si Stage 1.5 RACE](https://www.phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-si/ktuner-11thgen-honda-civic-si-stage-1-5-race-tune.html) · [CivicXI reliability thread, CAPTS FE](https://www.civicxi.com/forum/threads/the-tuned-11th-gen-experience-reliability-thread-for-all-models.50251/post-822991)

### g2-32 · value 3 · confirms `kc-e10`: RON vs AKI
**Proposed line**, for `kc-fuel-test`:

> E10 RON97 III is about US 92 to 93 by the same estimate.

Keep "estimate" in the wording. Note for later: ethanol's wide RON–MON gap probably makes AKI understate E10 on a boosted direct-injection engine (octane-index literature, not read yet).

Source: [Knocking (Indonesia, RON 90)](https://www.civicxi.com/forum/threads/44171/)

### g2-30, g2-33 · value 3 · confirm `kc-e10`
No change. Add the basemap list's own words as a source: "Starter 21 Dual Target 2 … 91+ Octane Recommended."

Sources: [KTuner 22+ Civic 1.5T](https://ktuner.com/22civicturbo/) · [KTuner 16+ Civic 1.5T](https://ktuner.com/16civicturbo/) · [TSP Stage 1, 2022 non-Si](https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si)

### g2-31 · value 3 · confirms `kc-fuel-test`
No change.

Sources: [Less than 91 on base maps](https://www.civicx.com/forum/threads/can-you-use-less-than-91-octane-on-ktuner-base-maps-for-2016-non-si-1-5t.95387/) · [Most aggressive V2 tune on a stock CVT](https://www.civicx.com/forum/threads/whats-the-most-aggressive-ktuner-v2-tune-i-can-use-on-my-stock-1-5t-cvt.52490/)

### g2-39 + g2-35 · value 3 · extend `kc-fuel-test`: cheapest first step, and the US E85 fix translated
**Proposed line:**

> Before paying for RON97, refill at a different, busy station and burn the tank off; owners and KTuner staff say a raised score is usually the tank. The US fix, a splash of E85, isn't sold here; E10 RON97 III is the local equivalent, tested the same way.

Sources: [CivicXI reliability thread](https://www.civicxi.com/forum/threads/50251/) · [KTuner forum t=768](http://www.ktuner.com/forums/viewtopic.php?t=768&p=5666) · [K.Con (knock control)](https://www.civic11forum.com/threads/k-con-knock-control.6222/) · [How to pump E85](https://www.civic11forum.com/threads/how-to-pump-e85-into-civic.8857/)

### g2-38 · value 3 · new card `kc-octane-booster` (kind: owner-question)
**Proposed card text:**

> Don't add octane booster. KTuner staff, Phearable and the long-running reliability thread all advise against it, and one engine failure in the 1,704-car census lists booster as a possible cause. If you suspect the fuel, test a different station or E10 RON97 III tank against tank by Knock Control.

Sources: [KTuner forum t=768](http://www.ktuner.com/forums/viewtopic.php?t=768&p=5666) · [CivicXI reliability thread](https://www.civicxi.com/forum/threads/50251/) · [CivicX reliability project](https://www.civicx.com/forum/threads/the-tuned-civicx-experience-reliability-project.42361/)

### g2-37 · value 3 · new note (fuel-afr), shelved until a flex sensor exists
**Proposed note** in `kc-e10`:

> If a flex sensor is ever fitted, set E10 as the zero point: KTuner's flex tables add fuel from 0 percent ethanol, and one owner's trims went about 7 percent negative on pump E10.

Sources: [caraddict flex video](https://www.youtube.com/watch?v=htDPjercuew&t=62s) · [CivicXI 40841](https://www.civicxi.com/forum/threads/40841/)

---

## heat-iat

### g2-53 · value 4 · contradicts `kc-iat2-side`
**Proposed replacement card text:**

> On this car IAT is the manifold air after the intercooler and IAT2 the inlet air before the turbo: under boost IAT reads 2 to 6 °C above IAT2, which only works that way round, and KTuner owners on the 1.5T label them the same. So the intercooler is judged by IAT minus IAT2 under boost. Other ECUs may differ, so check the gap's sign on a new car.

Sources: [At what IAT do you see heat soak](https://www.civicx.com/forum/threads/at-what-iat-do-you-start-to-see-heat-soak.51779/) · [KTuner item abbreviations](http://www.ktuner.com/KTunerHelp/item_abbreviations.htm) · fact-check §4

### g2-52 · value 4 · ⚔️ vs `kc-heat-soak`: keep the card, add the test
**Proposed line:**

> Owners often say the stock intercooler saturates; on your street pulls it doesn't: across eight pulls in seven minutes the pull-start intake air fell. If you want proof on a hot day, do three back-to-back pulls and watch IAT minus IAT2: a growing gap means the cooler is saturating.

Sources: [Resolved: Phearable Stage 1.5](https://www.civic11forum.com/threads/resolved-phearable-stage-1-5-tune.5219/) · [Phearable modification guide](https://www.phearable.net/information/tech-area/11th-gen-civic-modification-guide.html) · [Cameron Hill video](https://www.youtube.com/watch?v=O-VCM8RE6vc&t=156s)

### g2-50 · value 4 · extends `kc-heat-soak`: when heat starts moving the score
**Proposed line:**

> On your logs the score stays at 0.52 or below while intake air is under 45 °C and climbs to 0.55 to 0.65 above it, which is why pulls wait for 48 °C or less. A US shop saw the same from about 37 °C.

Caveat: the hot rows come mostly from the one hot-traffic drive.

Sources: [Fuel quality and knock control](https://www.civic11forum.com/threads/fuel-quality-and-knock-control.7390/) · [CivicXI 35654](https://www.civicxi.com/forum/threads/35654/) · [KTuner knock control question](https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/)

### g2-51 · value 3 · confirms `kc-heat-soak`
No change.

Sources: [At what IAT do you see heat soak](https://www.civicx.com/forum/threads/at-what-iat-do-you-start-to-see-heat-soak.51779/) · [Chris Time video](https://www.youtube.com/watch?v=ObNVwyiGviA&t=361s)

### g2-54 · value 3 · extends `kc-iat-retard`: add coolant retard
**Proposed line:**

> The map also pulls timing for engine heat, 0.8 degrees at 95 °C coolant and 1.6 at 105 °C.

Numbers from the owner's map, issue 11.

Sources: [CivicXI 44531](https://www.civicxi.com/forum/threads/44531/) · [KTuner Help, ignition & knock control](http://www.ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm)

### g2-56 · value 3 · extends `kc-expectations`
**Proposed line:**

> Published gains are cool-air numbers: PRL's pull was at 18 °C outside and 23 °C intake, 15 to 25 °C cooler than a Vietnamese afternoon.

Sources: [PRL 1.5T turbo blog](https://prlmotorsports.com/blogs/news/prl-1-5t-turbo-blog) · [AHC Garage video](https://www.youtube.com/watch?v=O2HpkoPiKkw&t=751s)

---

## reliability-failures

### g2-60 · value 4 · extends `kc-cvt`: what the 1,704-car census really shows
**Proposed line**, for the "Will my CVT survive?" answer:

> In the largest owner census (10th gen, 1,704 tuned cars, about 26,000 tuned miles each) 12 of 580 tuned CVTs failed, about 2 percent, and the listed causes are brake launches, track time in 100 °F heat and factory defects, not steady pulls. Base tunes failed least of all tune types (4.2 percent, every model and failure). It is a voluntary survey with no untuned comparison, so it sets expectations, not limits.

Sources: [CivicX reliability project](https://www.civicx.com/forum/threads/the-tuned-civicx-experience-reliability-project.42361/) · [Failures from the reliability thread](https://www.civicx.com/forum/threads/failures-from-the-tuning-reliability-thread.54181/)

### g2-61 · value 3 · extends `kc-cvt`: the 11th-gen census is too small
**Proposed line:**

> The 11th-gen census is young: 87 cars, 8,500 miles each, 21 CVTs with no failure yet, which can't rule out much. One Starter 21 owner reports 13,000 trouble-free miles.

Sources: [CivicXI reliability thread](https://www.civicxi.com/forum/threads/the-tuned-11th-gen-experience-reliability-thread-for-all-models.50251/) · [CVT upgrade thread](https://www.civic11forum.com/threads/can-an-automatic-cvt-transmission-be-upgraded-or-am-i-screwed.6433/)

### g2-62 · value 3 · confirms `kc-cvt`
No change. "Boost by gear protects CVTs" stays context: Boost_By_Gear_Limits is forbidden in the app.

Sources: [CivicX reliability project](https://www.civicx.com/forum/threads/the-tuned-civicx-experience-reliability-project.42361/) · [CivicXI 33918](https://www.civicxi.com/forum/threads/33918/)

### g2-65 · value 3 · extends `kc-expectations`: engine headroom
**Proposed line:**

> Owners report head-gasket trouble near 300 lb-ft (about 400 Nm). KTuner's figure for this map is about 320 Nm, well below that. Forum figures, context only.

Sources: [2022 Civic Si tuned to rock](https://www.civic11forum.com/threads/2022-civic-si-tuned-to-rock.4405/) · [How much horsepower am I making](https://www.civic11forum.com/threads/how-much-horsepower-am-i-making.8636/) · [Failures from the reliability thread](https://www.civicx.com/forum/threads/failures-from-the-tuning-reliability-thread.54181/)

### g2-67 · value 3 · confirms `kc-oil`, `kc-shakedown`, `kc-cvt`
No card change. Optional flash-day help line:

> keep a battery charger on while flashing

Source: [CivicXI reliability thread](https://www.civicxi.com/forum/threads/50251/)

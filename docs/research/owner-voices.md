# Owner voices: what real 1.5T owners ask, what the community answers, and what this car's logs say

*2 Oct 2026. The research behind `prototypes/owner-cases/`. It replaces the made-up owner stories in `tuner-play-panel.md` §"The Plays" as the source of truth for **what owners actually ask**. `fact-check.md` still wins on any number.*

**Read this before writing any story, Play, copy or prompt for the owner.** Use the owners' own words (§2), this car's traits (§3) and the corrections (§4).

---

## 1. The job owners hire help for

Before any specific question, the job is always the same: **"Can someone who knows read my log and tell me if it's OK?"**

- *"If anyone could take a peek and give me some insight as to whether it's running well or not, I'd really appreciate it."* ([CivicX](https://www.civicx.com/forum/threads/fuel-trim-review-im-paranoid-and-need-you-guys-%E2%9D%A4.42301/), thread title: "I'm paranoid and need you guys")
- *"Post a datalog … Put the log into a zip file … Someone will read it for you and let you know if something looks off."* ([CivicX](https://www.civicx.com/forum/threads/make-low-boost-until-4k-rpm-feel-weird-help.94759/))
- *"I haven't done a WOT pull yet because I first want to make sure it's safe to do so."* ([CivicXI](https://www.civicxi.com/forum/threads/lean-fuel-trims-on-phearable-tune.53399/))
- *"Let's hope it's any of those and not engine damage … I'm paranoid as hell."* ([Civic11forum](https://www.civic11forum.com/threads/fuel-quality-and-knock-control.7390/))

**How it works today:** post a zip, wait for a volunteer. The best-known reader limits log reads to owners who have joined his reliability thread. The reader sees one log and none of the owner's history. Some owners can't even post a CSV: *"I'm not owning a laptop. I'm using TunerView on my android phone."*

**Feelings to design for:** paranoia after a flash or a part, the fear of having broken something, and the fear of paying for the wrong fix. **The product's first promise is reassurance with evidence**, then one thing to do.

---

## 2. The questions, in owners' words

Ranked by how directly they match this owner (E10, hot climate, Starter 21 Dual, CVT, bolt-ons) and how often they come up.

| # | Owners ask | Community answer | This car's logs (8 drives) | The app's answer |
|---|---|---|---|---|
| 1 | **"My WOT AFR is 10.6. What went wrong? Is it my E10? Should I pay for better fuel?"** Same map as this owner, on TunerView with a phone. "Is my AFR just ok because European ECUs like running rich?" | AFR is basically normal. With E10 it's fine as long as WOT isn't leaner than about 11.7–12. The "29" on lift is fuel cut. "If you need to obsess on something, concentrate on knock control." | Full-throttle AFR 10.1–10.6 on all 4 drives with pulls; the map asks 11.0; lean limit 12.0 | Safe. No map change. Better fuel is judged by knock control, tank against tank |
| 2 | **"Knock control went to 0.6/0.7. Am I hurting the engine? Can I still drive hard?"** "What's considered high?" | 0.49–0.53 outstanding; up to about 0.70 normal; "0.7 isn't going to damage your engine, it just limits the power and the fun"; know *why* (heat, gas, a hill, a long climb in 100 °F adds 0.10–0.15) | 30 Aug 16:01: 0.49 → 0.65 in traffic, 31 of 41 steps while lugging (≈ 1.6° timing under boost). No rise above 5,200 rpm | Not damage: lost timing. The cause is lugging in heat. Free habit first |
| 3 | **"This car is completely different in the heat."** Boost drops to about 15 psi; to 13 after idling in a hot car park. "Power loss using AC … would a CAI help?" | Every turbo loses power in hot, humid air; idling heat-soaks the intercooler; AC is correlation, not cause. Ideas: bigger intercooler, meth, KTuner's IAT-ignition trick (unlocked maps) | **Same afternoon, 31 min apart** (30 Aug 15:29 → 16:01): pull-start intake 49 → 60 °C, peak boost 19.9 → 16.7 psi, 50→70 km/h 1.77 → 2.23 s, CVT 93 → 95 °C | Heat soak, nothing broken; an intake won't fix it (the intercooler adds only 2–6 °C). Cool down before a pull; ECO on very hot days |
| 4 | **"I installed an intake / intercooler. Are my fuel trims OK? Do I need a tune?"** "I see high STFT (+5–19) at idle sometimes." | PRL: the HVI's one-piece MAF housing delivers "proper fuel trims", no tune needed. 27WON: trims within ±1.5 % of stock on the same route. Cold air → positive STFT at idle (normal). Ethanol → positive trims. Leaks → positive. Phearable asks which **MAF housing** you have (Stock / Other Stock Size / PRL HVI Street) | Normal −3.9 to +1.6 % on every drive except 23 Aug 20:38: −21.4 % in every band from the first minute, right after a change. Back to −2.3 % on the next drive | ±5 % → leave it. Positive at idle only → a leak, not a map job. −15 % or worse everywhere after a change → Undo, then the **MAF Scaling** option for your housing |
| 5 | **"Downpipe: will I get a CEL? How do I turn it off? Will I pass inspection?"** "The CEL came back two days after I disabled the O2 sensor." | KTuner: **Main Parameters → Disables/Monitors → "P0420 – Catalyst Efficiency"**; Hondata: the DTC tab. An OBD inspection can see the disabled monitor. A high-efficiency catted pipe (TSP's claims no code) or an O2 spacer/defouler avoids it. 27WON: "CEL can be illuminated" | Owner runs a downpipe + front pipe: overshoot ≤ +0.1 psi on the cool baseline, never leaner than 10.8 under boost | Healthy. The code switch is an inspection risk (đăng kiểm reads OBD), not a tuning step |
| 6 | **"Is my CVT slipping since the tune? Will it survive?"** "A loud thud after the rpm goes up then slams down." "Jerks when accelerating and decelerating." | Post a log. Tuned CVTs have held up in the owner survey; failures came from **brake launching** or tunes with too much torque down low. "250 lb-ft conservative limit" (forum). A thump when stopping is often a simulated downshift | No slip events in 8 of 8 drives. CVT 68–79 °C normally, 93–95 °C in hot afternoons | No slip. Manage heat: no pulls above 90 °C, never brake-launch |
| 7 | **"Can I run 87/89 (or RON 90/92) on a 91+ basemap? Is 21 psi safe in my country?"** (US, Indonesia, Germany) | Yes, but knock control rises, timing drops, "you lose more power than you gain". Don't push hard on low-octane fuel. RON ≠ US AKI. Vendors tune to your fuel: Phearable asks 91/92/93 or 95/98 RON | E10 RON95 ≈ US 91 (estimate, `fact-check.md` §1). Knock control peaks 0.50–0.65 | Answer from knock control, per tank |
| 8 | **"It bogs or hesitates from a stop. Is KTuner worth it?"** | Turbo + CVT lag; a basemap with throttle and spool quick adjustments "transforms drivability"; some lag below 1,500 rpm stays | — | Out of scope for the logs today. Quick adjustments are KTuner settings, not tables |
| 9 | **"Boost doesn't reach target."** | Misses only when warm → wastegate (the electronic wastegate linkage is a known weak point); never reaches it → boost leak | Boost tracks target (overshoot ≤ 1.9 psi) | A future check: target vs actual, warm vs cold |
| 10 | **"Check engine light right after flashing."** | Key off, wait, key on without starting, let KTuner finish; it clears | — | A help card, not a verdict |

---

## 3. Car traits learned, checked against this owner's logs

| Trait | Source | This owner's logs | Use it as |
|---|---|---|---|
| Knock control's floor is 0.49; 0.49–0.53 outstanding; ≤ 0.70 normal; investigate above | Forum consensus (CivicX, many threads) | Floor 0.49 on every drive; peak 0.65 | Copy: "costs timing, not damage" below 0.70 |
| **Knock control starts at about 0.59 after every new flash and drops with calm driving** | CivicX, Civic11forum | **30 Aug 15:29 starts 0.58 → 0.49** | Shakedown: normal, never an Unexplained change |
| **Non-Si ECUs raise knock control on purpose above about 5,200 rpm**. Starter/base maps can turn it off with a checkbox; TSP Stage 1 and older locked tunes keep it | CivicX (several answers) | Owner rarely passes 5,200 rpm (2 rises, 1 drive) | Exclude rises above 5,200 rpm from fuel and heat verdicts |
| **"Knock count" is a misfire count on this setup**; watch knock control instead | CivicXI ("How to detect real knock") | — | Never show knock count as knock |
| Fuel varies by station and week; an E85 splash drops knock control; ethanol pushes trims positive | CivicX, CivicXI, Civic11forum | All logs are E10 | A tank-to-tank fuel test is a real owner need |
| Euro/export ECUs run open loop at WOT, so WOT richer than target is common. KTuner's MAF Scaling offers "Factory MAF w/ scaled top end" (the ECU sees less air at the top) | CivicX ("Running rich at WOT") | WOT 0.4–0.9 AFR richer than the map's 11.0 | Rich WOT is not a fault; no AFR edits without the AFR command channel |
| Hot weather cuts boost (to about 15 psi); hot idle cuts it harder (about 13 psi) | CivicX ("completely different in high temps") + KTuner Help (boost limit by temperature) | 19.9 → 16.7 psi peak 31 min later after traffic | Show heat soak as the cause, with the owner's own numbers |
| Underboost only when warm → wastegate; never → boost leak | CivicX | — | A future boost check |
| PRL HVI: one-piece High Volume MAF housing, "proper fuel trims", no tune required. Phearable calibrates "PRL HVI Street" as its own MAF housing option | PRL product page; Phearable order form | — | **Don't assume the PRL HVI uses the factory curve or the Race curve: ask the housing** |
| P0420 disable: KTuner Main Parameters → Disables/Monitors | CivicXI | — | Exact KTuner location for the help card |
| Tuned CVTs: failures mostly from brake launching and high low-rpm torque; a stop-thump is a simulated downshift | CivicX/CivicXI survey threads | No slip | CVT guidance |
| KTuner Starter 21 ≈ 200–205 whp, 260–270 Nm (forum figure) | CivicX ("Fear of remapping") | — | Expectation setting |

---

## 4. What this changes in the product

**Engine bugs found by running the real logs (fix first):**
1. **"Unexplained change" fires on 5 of 6 drives.**
   - **The "boost" reason is a false alarm:** the highest boost target per drive depends on whether the owner did a pull (8.7 psi with no pulls, 19.2 with them). Compare boost targets only between drives that both have pulls.
   - **The "score" reason flags the normal after-flash start** (0.58 on 30 Aug 15:29). Treat a start ≤ 0.60 that falls to the Baseline as the after-flash pattern.
2. **False knock Stop with a map edit on 23 Aug 20:38** (see `tuner-play-panel.md` §0). Still live.
3. **Knock-control rises above 5,200 rpm** must not count toward fuel or heat verdicts.

**Corrections to our own docs:**
- `tuner-play-panel.md` Play A said "the PRL HVI keeps the factory diameter, so Factory is right". **Not verified.** PRL says it gives proper trims with no tune; Phearable treats it as its own housing. The rule: ask which housing, then pick the MAF Scaling option for it; never infer it.
- The KTuner selector is **MAF Scaling** (owners' word), with options such as Factory MAF, Factory MAF w/ scaled top end, and race-housing curves.
- Stories must start from §2 questions in owners' words, not invented ones.

**Product decisions:**
- **Lead with reassurance + evidence** (§1): the verdict sentence answers "am I hurting it?" before anything else.
- **Speak in the owner's units of worry:** "costs about 1.6° of timing, not damage" next to every knock-control number.
- **Add a fuel test:** "Is better fuel worth it?" becomes a tank-to-tank knock-control comparison on matched drives.
- **Heat is the #1 hot-climate complaint.** The same-afternoon comparison is the most convincing picture we have.
- **Inspection matters in Vietnam:** any code-disable advice carries the đăng kiểm warning.
- **Out of scope, said honestly:** IAT-ignition edits (ignition), quick adjustments (settings, not log-judged), custom tunes.

---

## 5. Sources

**Forums (owner threads, read in full):**
- [Question about fuel, AFR and knock control, Starter Dual Target 21 PSI](https://www.civicx.com/forum/threads/question-about-the-right-fuel-octane-and-o2-afr-air-fuel-ratio-and-knock-control-for-the-ktuner-starter-dual-target-21-psi-tune.67784/)
- [Running rich at WOT](https://www.civicx.com/forum/threads/running-rich-at-wot-how-to-adjust-afr.53529/)
- [Driving hard with high kcon](https://www.civicx.com/forum/threads/driving-hard-with-high-kcon.79440/)
- [KTuner knock control question](https://www.civicx.com/forum/threads/ktuner-knock-control-question.31884/)
- [High K.Con values & slight knock](https://www.civicx.com/forum/threads/high-k-con-values-slight-knock.70186/)
- [Fuel quality and knock control](https://www.civic11forum.com/threads/fuel-quality-and-knock-control.7390/)
- [How to detect real knock](https://www.civicxi.com/forum/threads/how-to-detect-when-real-knock-occurs.41930/)
- [Summer heat, high IATs and high knock control](https://www.civicx.com/forum/threads/summer-heat-high-iats-and-high-knock-control.84316/)
- [This car is completely different in high temps](https://www.civicx.com/forum/threads/this-car-is-completely-different-in-high-temps.41311/)
- [Power loss using AC](https://www.civicx.com/forum/threads/power-loss-using-ac.25748/)
- [Fuel trim review, "I'm paranoid"](https://www.civicx.com/forum/threads/fuel-trim-review-im-paranoid-and-need-you-guys-%E2%9D%A4.42301/)
- [CAIs and fuel trims (27WON)](https://www.civicxi.com/forum/threads/cais-and-fuel-trims.23884/)
- [Lean fuel trims on Phearable tune](https://www.civicxi.com/forum/threads/lean-fuel-trims-on-phearable-tune.53399/)
- [Catted downpipe](https://www.civicxi.com/forum/threads/catted-downpipe.53656/)
- [CEL after catless downpipe](https://www.civicxi.com/forum/threads/check-engine-light-after-installing-catless-downpipe-and-front-pipe.54186/)
- [CVT slip after tune](https://www.civicx.com/forum/threads/cvt-slip-after-tune.16076/)
- [Is my CVT slipping](https://www.civicx.com/forum/threads/is-my-cvt-slipping-on-pherable-1-5-r-tune-car-tends-to-jerk-when-accelerating-and-decelerating-rpms-look-like-they-hesitate.98209/)
- [Why is 11th gen slower](https://www.civicxi.com/forum/threads/why-is-11th-gen-slower-than-10th-gen.50039/page-2)
- [Fear of remapping (Indonesia)](https://www.civicx.com/forum/threads/fear-of-remapping-issue.47455/)
- [Knocking (Indonesia, RON 90)](https://www.civicxi.com/forum/threads/knocking.44171/)
- [Less than 91 octane on basemaps](https://www.civicx.com/forum/threads/can-you-use-less-than-91-octane-on-ktuner-base-maps-for-2016-non-si-1-5t.95387/)
- [Most aggressive tune on a stock CVT](https://www.civicx.com/forum/threads/whats-the-most-aggressive-ktuner-v2-tune-i-can-use-on-my-stock-1-5t-cvt.52490/)
- [Is KTuner worth it](https://www.civicx.com/forum/threads/is-ktuner-worth-it.60997/)
- [Low boost until 4k](https://www.civicx.com/forum/threads/make-low-boost-until-4k-rpm-feel-weird-help.94759/)
- [KTuner check engine after flash](https://www.civicx.com/forum/threads/solved-ktuner-check-engine.39677/)
- [Tuned 11th gen reliability thread, p6](https://www.civicxi.com/forum/threads/the-tuned-11th-gen-experience-reliability-thread-for-all-models.50251/page-6) and [p9](https://www.civicxi.com/forum/threads/the-tuned-11th-gen-experience-reliability-thread-for-all-models.50251/page-9)
- [Failures from the tuning reliability thread](https://www.civicx.com/forum/threads/failures-from-the-tuning-reliability-thread.54181/)
- [2022 1.5T fuel octane](https://www.civic11forum.com/threads/2022-1-5l-turbo-manufacturer-recomended-fuel-octane-rating.977/)

**Vendors and KTuner:**
- [PRL High Volume Intake, 11th gen 1.5T](https://prlmotorsports.com/products/2022-honda-civic-1-5t-high-volume-intake-system)
- [Phearable Stage 1.5, 11th gen non-Si](https://www.phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-non-si/stage1-5-nonsi-11thgen.html)
- [Phearable modification guide](https://www.phearable.net/information/tech-area/11th-gen-civic-modification-guide.html)
- [TSP Stage 1, 2022 non-Si](https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si)
- [27WON 300 whp blog](https://www.27won.com/blog/how-to-safely-and-cost-effectively-hit-300whp-on-your-2022-civic-or-integra-with-the-l15-engine)
- [27WON downpipe](https://store.27won.com/2022-civic-turbo-performance-downpipe-11th-gen.html)
- [KTuner Help: ignition timing and knock control](http://www.ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm)
- [KTuner Help: boost target dampening](http://www.ktuner.com/KTunerHelp/disable_boost_target_dampening.htm)

---

## 6. Method and access notes (for the next research run)

- **CivicX / CivicXI** block headless browsers (Cloudflare). They were read through the `r.jina.ai/<url>` reader. **Civic11forum** works the same way.
- **Reddit blocks Anthropic's crawler.** It is excluded on purpose; don't route around it.
- **Hondata forum** (Cloudflare captcha) was not reached. **DuckDuckGo HTML** shows a captcha after about 2 queries. Use the built-in web search for discovery.
- **crawl4ai** Docker (`localhost:11235`) works for vendor sites with `Authorization: Bearer $CRAWL4AI_API_TOKEN`. The MCP entry was added with an unset variable, so its header is empty; re-add it with the right variable.
- **YouTube** (TubeAlfred) was out of credits. Owner comments under tuning videos are the next source to add.
- **Vietnamese-language sources** (Otofun, Facebook groups) were not reached. They are the biggest gap for this owner's market.
- Raw captures lived in the session scratchpad and are not kept. Quotes above are short excerpts with links.

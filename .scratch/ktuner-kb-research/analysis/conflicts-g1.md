# Conflicts and contradictions: group g1 (boost, maps-basemaps, throttle-drivability, cvt, results-numbers)

Stage 2, 17 Oct 2026. 293 claims → 66 findings (`findings-g1.jsonl`). The numbers here were checked against `docs/research/fact-check.md`, the knowledge cards, `data/ktuner-maps-digitized.json` and the nine `data/example-*.js` drives. The scripts are in the session scratchpad under `stage2/`: `tps.py` gives TPS and TPS Command maxima, `plateau.py` finds where the target settles for each pedal position and reads the baro reference, and `psi_power.py` works out what one psi is worth.

---

## 1. The 19.2 psi boost-target gap

**Question (ticket 17):** Boost Target 2 Normal L/H holds 21 psi from 3,500 rpm, and Final Boost Target tops out at 23.4. Why has the logged Turbo Pressure Target never passed 19.2 psi?

### Candidate explanations from this crawl, tested against our car

| Candidate | Source (basis) | Our car's data | Verdict for our car |
|---|---|---|---|
| **The target scales with the pedal, then a time ramp moves it toward the table** ("less throttle targets less boost"; KTuner calls the input the "partial throttle boost target") | KTuner Help, Boost Target Ramp Rate and Final Boost Target (Primary); g1-boost-01, g1-boost-07 | At a steady pedal the target **settles at a level the pedal sets**: TPS 41–46 → 12.0–13.8 psi, TPS 62 → 15.0 psi. The 19.2 peak came at TPS 73 with the pedal still rising from 63 to 83 (aug30-1529) | **Main cause of the gap seen so far.** Every logged peak was at part pedal |
| **Short pulls against the ramp** | boost-target-gap research (Data) | 1.0–3.5 s above 3,500 rpm; at about 1.6–2.5 psi/s, reaching 21 needs about 3–5 s | **Contributes** |
| **Factory protections that Starter maps keep.** A Starter 21 Dual owner whose pedal read 106 % and TPS Command 96 % never passed 19.5 psi. KTuner's answer: "we leave many factory protections in place", so a custom tune is needed to get past them | ktuner-forum-9 (Primary; car generation not stated); civicx-50 (21 psi chosen for CVT longevity) | Only one near-floored moment exists, aug22-0903 at TPS 92–94. The target sat **flat at 16.3 psi from 5,215 to 5,403 rpm**, below the 19.2 reached at TPS 73 and 4,271 rpm. Heat and Knock Control match the 19.2 pull | **Open; a strong candidate for the high-rpm cap.** It could also set a ceiling below 21 even with the pedal floored. Untested, because no pull has had a floored pedal held long enough |
| **TPS Command stuck at about 95 % on international or CVT ECUs**, giving an 18–19 psi target on a 21 psi map (EU 5AN-EKx). A 10th-gen CVT logged TPS Command at 80–90 % and missed its target until a KTuner beta build fixed it | civicx-66, -122 (Forum, search summary or owner logs); civicxi-143 | TPS Command reached **100 % (aug22-0903) and 99 % (aug30-1529)** | **❌ Refuted for this car** (g1-boost-05) |
| **Torque-based ECU / factory torque limiter** | civicxi-106 and civicx-123 (KTuner, Primary); Hondata 10th-gen notes (research) | Not logged. It is the same family as "factory protections" | Same open item as above |
| **Cylinder Fill Limitation** | KTuner support pointed a 10th-gen owner at it (as the owner reported it). Raising it did not fix his car; the real cause was software | Fill rows barely change from 4,000 to 5,500 rpm, so they fit the 16.3 cap poorly. No air-charge channel is logged | Not shown; cannot be ruled out |
| **Boost By Gear** | KTuner Help (Primary): Boost By Gear only limits | Our map holds 35.4 psi in every cell | ❌ Out |
| **Final Boost Target** | KTuner Help (Primary): passes the target through almost one to one; the cap is the last TBST column | Top 23.4; every column ≥ 8.2 is identical in every rpm row | ❌ Out |
| **ECO mode / not flashed** | KTuner (ktuner-forum-8): a low target means the tune isn't flashed properly, or Knock Control | A 19.2 target is above ECO's 18, so the 21 psi Normal table is flashed and active on aug30-1529. aug22-0903 can't be judged: all its targets sit at or under 16.3 | ❌ Out for aug30-1529 |
| **Knock Control pullback** | ktuner-forum-8 | Knock Control 0.49–0.53 at every peak | ❌ Out |
| **Altitude / absolute reference** | civicxi-88, KTuner (Primary) | Turbo Pressure reads −0.3 psi at 0 rpm: sea level | ❌ Out |
| **Ethanol Boost Target Adjustment** | KTuner Help (TPS × RPM) | 0 in every cell | ❌ Out |

### One new hypothesis worth a screenshot

KTuner documents the ethanol boost table on a **TPS (pedal) × RPM** axis (g1-boost-18). The Normal table's column axis was not captured when the map was digitized. At ≥ 3,500 rpm its columns step 13.5 → 15.5 → 17.5 → **19.0** → 20.0 → 21.0. If that axis is pedal, the boost table itself does the pedal scaling: a pedal around 70–80 % would land between the 19.0 and 20.0 columns, which is consistent with the 19.2 peak. That changes nothing about what the owner does. It would mean the logged target can never reach 21 unless the pedal reaches the column that holds 21.

### Best-supported conclusion

1. **19.2 psi is a part-pedal reading, not a ceiling.** The factory target scales with the pedal and ramps over time (KTuner primary). This car's pulls settle at levels the pedal sets, and no logged pull held a floored pedal.
2. **The international-ECU "TPS Command 95 %" bug is not happening here**: TPS Command reached 99–100 %. Final Boost Target, Boost By Gear, ethanol adjust, ECO mode, knock, heat and altitude are all ruled out.
3. **What stays open is a factory protection that KTuner leaves in Starter maps.** It is the likely owner of the flat 16.3 psi at 5,200+ rpm, and KTuner documents it capping a 21 psi dual map at 19.5 psi with the pedal floored. It may stop a Boost step from ever showing up in the log.

### The tests that settle it (exact channels on this car)

1. **Key on, engine off, pedal floored** (TunerView): read **TPS**. If it reads about 94, that is the 11th-gen pedal stop. If it reads 100–113 like the 10th gen, every logged "floored" pull was part pedal, and the proof gate at 85 % needs raising (see §2a).
2. **One floored pull held at least 5 s, from about 3,000 rpm to past 5,000 rpm**, in S, ECO off, on a recorded tune slot and on a Cool drive. Log **TPS, TPS Command, Turbo Pressure Target, Turbo Pressure, EWG Position, EWG Target, Engine RPM and Gear**. Read it as follows:
   - **Target flattens at 21 in the 3,500–4,500 rpm rows**: the table is binding, and a +1 psi Boost step will show.
   - **Target flattens below 21 (around 19–19.5) with TPS at its stop and TPS Command ≥ 99**: a factory protection owns it. The Boost step can't show; the honest answer is "no map change, a custom tune is the only route".
   - **TPS Command pinned at 80–95 % while TPS is at its stop**: the software-build case (g1-boost-05), to report to KTuner support.
   - **TPS Command drops while TPS holds**: a VSA intervention. The pull is void (g1-thr-09).
3. **From the tune, not the log**: screenshots of the **Boost Target Normal** table's column header, the **TBST headers** of Final Boost Target, and the second axis of **Cylinder Fill Limitation**.

### What this means for the fix spec (ticket 17 and wave E2)

- Keep the Boost step closed until test 2 has been done once. Without it, nobody knows whether a +1 psi edit can show at all.
- The proof-pull gate "TPS ≥ 85 %" depends on test 1 (§2a).
- Keep "TPS Command ≥ 85 = full throttle" out of the engine. KTuner now states as a primary fact that TPS is the pedal (g1-boost-02, g1-thr-08).
- The "Unexplained change" boost false alarm (owner-voices §4) follows from the same mechanism: the peak target depends on how far the pedal went.

---

## 2. Contradicts a card (flag; not resolved here)

### 2a. `contradicts kc-boost-step`: "floored = pedal 85 % or more" (g1-boost-03)

- **The card**: a Boost step is offered on "floored pulls (pedal 85 percent or more, held 4 seconds above 3,500 rpm)". `thresholds.json` sets `boost_step_gates.pedal_pct` to 85.
- **The evidence**: on the 10th gen, a floored pedal reads about **113 %** TPS (KTuner staff, civicxi-88/89), 100–104 % (civicxi-143) and 106 % (ktuner-forum-9). Our TPS has never passed 94: six samples on one drive, never held.
- **Why it matters**: if the 11th-gen stop also reads 100 % or more, a pull at TPS 85–94 is part pedal. Such a pull would pass the gate while the target is still held by the pedal scaling, and the step would read as "target didn't move", so it gets undone. Undo is the safe failure mode, but it is a false one.
- **Settles it**: key-on, engine-off TPS with the pedal floored (§1 test 1). Then set `pedal_pct` to about 90 % of the measured stop.
- **Basis**: Primary for the 10th-gen scale, Data for ours. The car's generation is not confirmed, so this is conditional.

### 2b. Tension with `kc-boost-step`: the overshoot gate (g1-boost-06, not a contradiction)

- KTuner reading logs: 1–2 psi of overshoot is normal for the PID (22.8 psi on a 21 psi target). A 1–3 psi spike during the CVT's simulated shift is also normal. A single sample where the target channel itself jumps is a logging glitch.
- Our gate (overshoot ≤ 1.5 psi; target plus overshoot ≤ 24) is a judgement and stricter than that.
- **Proposal**: judge overshoot held for at least 0.5 s, exclude the simulated-shift spike, and drop the glitch rows. The fix spec already says "held".

### 2c. Tension with `kc-table-boost`: "Cylinder Fill Limitation is a knock safeguard" (g1-boost-04)

KTuner support pointed a 10th-gen owner at Cylinder Fill Limitation (mg/stroke) as a cap on the boost target. This is the owner's paraphrase, so Forum basis. Not enough to change the card. Add a line that it "may also cap the target; it can't be tested without an air-charge channel".

### 2d. Wording nuance with `kc-table-boost`: "throttle dampening"

KTuner's 22+ page says every Starter map "removed throttle dampening on low end". The card says factory throttle dampening holds the target. Our plateaus at 3,500–4,100 rpm show the target still scaling with the pedal there. Both statements hold if KTuner's line covers only low rpm or pedal-to-plate feel. Say it that way in the card (g1-map-01).

---

## 3. ⚔️ Conflicts between sources

| Finding | Side A | Side B | Better basis | Settles it on our car |
|---|---|---|---|---|
| g1-boost-03: pedal scale | 10th-gen floor reads 100–113 % (KTuner staff and owners) | Research inference that TPS 94 is our pedal stop | A (Primary, but another generation) | Key-on, engine-off TPS, pedal floored |
| g1-boost-04: owner of the cap | KTuner: Starter maps keep factory protections; 19.5 psi cap on a floored 21 dual | Our data: part-pedal scaling plus ramp explains every logged peak | Both. Ours explains the logged peaks; KTuner's may bind once the pedal is floored | Floored pull held ≥ 5 s: Turbo Pressure Target plateau vs table, with TPS, TPS Command and EWG Position |
| g1-thr-05: Early Spool | KTuner Help: Turbo Responsiveness improves part-throttle spool on its own; Early Spool "pairs well", no overboost, no long-term harm | One owner: Turbo Responsiveness only fully works with Early Spool; another: Early Spool wears the turbo | KTuner (Primary) | Not needed. `kc-quick-adjustments` keeps Early Spool off for CVT and LSPI reasons, which neither side addresses |

**Refuted for our car:** g1-boost-05 (TPS Command 95 % cap). Contradicted by TPS Command reaching 99–100 % on two drives.

Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

What do the best Honda tuners and general remap shops actually change after a downpipe on the 1.5T, and what do they promise? Honda specialists: KTuner basemaps for the 22+ non-Si CVT (which maps assume a downpipe — Starter 16.5/18/21, any "Stage 2"), Hondata FlashPro calibrations for 10th/11th gen (by-mod maps), TSP (Map 1/2/3 requirements, CVT output limits), Phearable (levels and their part requirements), IWM, CAPTS Tuning, 27WON / PRL notes. General shops: WinOLS / bFlash / Alientech Stage 1 vs Stage 2 practice (Stage 2 = downpipe) — which maps they touch (boost, wastegate, torque limits / torque request, pedal, ignition, lambda) and why. Separate basemap vs custom tune, CVT vs manual, US 91/93 vs E10 RON95.

Output: a table tuner → parts required → boost / power claim → tables changed → source, plus where their practice conflicts with our caps (`boost_ceiling_psi` 21, `boost_raise_min_rpm` 3,000, no ignition edits) and the `map24` Build ladder item. AFK — call the Skill tool with "research".

## Answer

Findings: branch `research/tuner-practice` (commit 2bf850c), file `.scratch/downpipe-power/research/tuner-practice.md` (tuner table, 10 conflicts).
- No Honda tuner changes anything extra for a downpipe on the stock turbo. KTuner Starter 16.5/18/21, TSP Map 1/2/3 (stock/16.5/24), Phearable L1/2/3 (16.4/18/23–24) = one file per car, dyno'd on unmodified CVT cars; downpipe "compatible", never "required". Starter 21 does not assume a downpipe.
- All ask ≥ US 91 — this car sits at the floor (01 says E10 RON95 ≈ 89–91 AKI: synthesis must reconcile, take the conservative reading).
- Vendor promises: KTuner 21 psi up to +55 whp; TSP 154 → 191 whp (Map 3 only); Phearable 194 hp (+18 over KTuner 21); Hondata 22+ on 91 +34 hp / +50 lb-ft; downpipe alone +7 to +12 whp (27WON).
- "Stage 2" = flex fuel (TSP, Phearable) or 21 psi (KTuner); only general remap shops mean downpipe (raise boost, wastegate, torque limits, fuel, ignition, gearbox limits).
- Downpipe power is harvested only by a custom e-tune (IMW, Phearable, CAPTS) editing ignition + boost together — outside product limits.
- Caps hold: 24 psi maps exceed 21 cap and no source raises boost because of a downpipe; Hondata adds ~+40 lb-ft below 3,000 rpm, TSP gains start ~2,900 → keep 3,000 rpm rule.
- Corrections: KTuner and TSP are one source (IMW watermark, same baseline), Phearable + Hondata independent; `map24` "all maps" wrong (191 = Map 3; limited "for engine and transmission"); dpCat +12/+13 likely manual Si, first CVT test +7/+11; `hondata` claim → vendor-true, drop "on the CVT"; −1 psi overshoot step is our own judgement (no tuner describes or contradicts it).

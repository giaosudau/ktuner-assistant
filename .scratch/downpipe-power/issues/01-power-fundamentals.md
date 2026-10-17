Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

Where does power and torque actually come from on the FE 1.5T (L15 family, direct injection, single-scroll turbo with electric wastegate, CVT), and what does each lever do? Answer "more air, more fire, more fuel?" precisely: air mass per cylinder → torque; boost pressure vs airflow (a downpipe can raise airflow at the same psi via lower backpressure / better VE); full-load AFR on a DI turbo (power-best vs knock/heat-limited lambda, why this map asks 11.0 / λ0.75, why leaner WOT for power is wrong on the street); spark advance limited by knock and fuel octane (E10 RON95 ≈ US 91 AKI); Honda's torque-based ECU (pedal → torque request → air/boost, Cylinder Fill Limitation, CVT torque limits); throttle response vs turbo lag (spool, boost threshold, transient, CVT ratio behaviour); LSPI risk at low rpm high load.

Output: a fact sheet, each fact with ≥2 independent sources (engineering texts, HP Academy, Honda / KTuner / Hondata docs, tuner write-ups), confidence, and a flag wherever it contradicts a current card (`knowledge/cards/kc-expectations.md`, `kc-table-boost.md`, `kc-tune-order.md`, `kc-open-loop-wot.md`, `kc-rich-wot.md`, `kc-ignition-formula.md`, `kc-cvt.md`). AFK — call the Skill tool with "research".

## Answer

Findings: branch `research/power-fundamentals` (commit dd9b62d), file `.scratch/downpipe-power/research/power-fundamentals.md` (22 facts, ≥2 sources each, vendor claims labelled).
"More air, more fire, more fuel?" — only air makes power; fuel follows it, fire is capped.
1. Torque ∝ air mass trapped per cylinder; boost psi is pressure, not flow — same psi with lower backpressure traps more air (downpipe). FE size of gain unknown.
2. Fuel follows air: best power ≈ λ0.82–0.85; map asks λ0.75 (11.0) on purpose for knock and turbine-inlet heat. More fuel adds nothing; leaner WOT for power is wrong on RON95 E10 in VN heat.
3. Spark capped by knock before MBT on pump fuel; E10 RON95 ≈ US 89–91 AKI (not "≈ 91"). More boost on knock-limited fuel → timing pulled → same power, more heat.
4. Torque-based ECU: pedal → torque request → boost/throttle, capped by factory torque limiter (protects CVT, not exposed in KTuner) and Cylinder Fill Limitation. Downpipe makes same air cheaper, doesn't lift caps.
5. Lag = exhaust energy vs turbine pressure ratio; downpipe can bring boost sooner (direction medium confidence, size unknown). CVT keeps rpm in LSPI zone (1,500–2,500 at high load) → keep low-rpm boost down.
Card conflicts: `kc-expectations` (needs downpipe line; "58 lb-ft" is KTuner claim, unlabelled); `kc-table-boost` + `e10-ignition-boost-simple-tune.md` (Fill Limitation = knock safeguard, real everyday cap = torque limiter); `kc-rich-wot` (λ0.69–0.73 measured costs a little power — wording); `kc-cvt` ("no torque limit used" reads as nothing limits torque); "E10 RON95 ≈ US 91" → 89–91. Consistent: `kc-tune-order`, `kc-open-loop-wot`, `kc-ignition-formula`.
Open: FE downpipe backpressure/spool data (→ 02); whether FE boost target is pressure-ratio based (10th-gen Hondata evidence only); FE CVT torque-limit values.

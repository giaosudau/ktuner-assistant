Type: research
Label: wayfinder:research
Status: resolved
Assignee: Chanh (research subagent)
Blocked by:

## Question

On the 11th-gen Civic 1.5T (FE, L15CA-family) where exactly is the primary (front) A/F sensor — turbine outlet / turbo elbow, or in the factory downpipe / close-coupled cat that a 27WON / TSP / RV6 downpipe replaces? Confirm from a Honda parts diagram or service manual (e.g. Honda parts catalogue exhaust/turbo diagrams, sensor part numbers), plus aftermarket install guides. Then state what a leak at each downpipe flange does to the front A/F reading and to the rear O2 / catalyst monitor. Matters for `kc-p0420`, `kta-build.js` dpCat step 1, and carDiagnose "Exhaust leak ahead of A/F sensor" (`engine/kta-car.js` ~2130) / `tuner-play-panel.md:151`.

## Answer

Findings: branch `research/front-af-sensor` (commit 98d7995), file `.scratch/downpipe-power/research/front-af-sensor.md`.
- Location (high): front A/F ("SENSOR, LAF" 36531-64A-A01, 2022+ Civic 1.5T and Si) threads into the **turbocharger turbine outlet** — Honda catalogue "Upstream. 1.5L turbo, to turbocharger"; 27WON 11th-gen guide moves only the secondary O2. 10th-gen L15B7 same (36531-5K8-004 "turbocharger LAF").
- Turbo-to-downpipe flange leak (medium): downstream of the A/F → front reading and fuel trims clean; air drawn in ahead of cat + rear O2 → rear O2 reads falsely lean → can wrongly fail catalyst monitor (P0420).
- Downpipe-to-front-pipe flange leak (medium): downstream of both sensors → A/F unaffected; rear O2 / cat monitor effect small.
- Repo impact: a true "leak ahead of the A/F sensor" can only be manifold/turbo side, which a downpipe swap doesn't touch. carDiagnose "Exhaust leak ahead of A/F sensor" after a downpipe (`engine/kta-car.js` ~2130), `tuner-play-panel.md:151`, dpCat step 1, Play B install check and `kc-p0420` ("front oxygen sensor moves") are wrong; downpipe flange leaks belong on the rear-O2 / P0420 path. "Leaner than target under boost after a downpipe" needs another cause (real lean, fuel pressure, AFM).
- Not verified: Honda diagram page title; secondary O2 position vs cat in TSP / RV6 pipes.

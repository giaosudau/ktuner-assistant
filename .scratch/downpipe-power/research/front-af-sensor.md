# Front A/F sensor location: 11th-gen Civic 1.5T (L15CA), cross-checked against 10th gen L15B7

Ticket: `.scratch/downpipe-power/issues/12-front-af-sensor-location.md`. Researched 2026-10-05.

## Answer

- **Location (high):** the front A/F sensor (Honda "SENSOR, LAF", **36531-64A-A01**, fits 2022+ Civic 1.5T EX/EX-L/Touring/Sport Touring CVT and Si) threads into the **turbocharger's turbine outlet**. It is **not** in the factory downpipe/close-coupled cat. Honda's catalogue says "Upstream. 1.5L turbo, to turbocharger."
- **Downpipe swap (high):** a 27WON 11th-gen downpipe bolts to studs in the turbine housing. The only sensor that moves is the **secondary O2**. The A/F sensor stays in the turbo.
- **10th gen L15B7 (high):** same layout. The LAF is 36531-5K8-004 and is sold as "turbocharger LAF". The 27WON 10th-gen guide only moves the primary sensor's wire aside. CivicX owners: "the primary is on the turbo"; the downpipe sensor is the secondary.
- **Leak at the turbo-to-downpipe flange (medium):** this joint is just *downstream* of the A/F sensor, so the front A/F reading and the closed-loop fuel trims stay clean. Pulsing can pull outside air into the gas *ahead of the cat and the secondary O2*. The rear O2 then reads a false lean, the rear-O2 trim adds fuel, and the catalyst monitor can wrongly fail (**P0420**). It does **not** fit "exhaust leak ahead of A/F sensor".
- **Leak at the downpipe-to-front-pipe flange (medium):** this joint is downstream of both sensors (the secondary O2 sits in the downpipe body). The A/F sensor is unaffected. Small effect on the rear O2 or monitor; mostly noise.
- **A true "leak ahead of the A/F sensor"** can only be at the exhaust manifold or turbo-inlet side, which on the L15 is the integrated head/turbine side. A downpipe install does not touch it.

## Evidence

### Location: Honda OEM catalogue data (primary)
- Honda 36531-64A-A01 "Upper Oxygen Sensor, Sensor Laf". Position: "Front Upper". Catalogue note: "Air-Fuel Ratio Sensor. Civic. 1.5l. Upstream. 1.5L turbo, to turbocharger." It fits 2022–2025 Civic. Source: https://www.hondapartsconnection.com/oem-parts/honda-oxygen-sensor-3653164aa01 and the same text at https://www.hondapartsonline.net/oem-parts/honda-sensor-air-fuel-ratio-3653164aa01
- HondaPartsNow: 36531-64A-A01 "SENSOR, LAF". Fitment covers 2022–2024 Civic 1.5T EX / EX-L / Touring / Sport Touring (CVT) and Si (6MT). It is Ref 21 in the diagram, but the page did not render the diagram's title. https://www.hondapartsnow.com/genuine/honda~sensor~air~fuel~ratio~36531-64a-a01.html
- A Honda salvage listing calls the same part a "2022 Honda Civic **Turbocharger** Laf Oxygen Sensor". https://ahparts.com/buy-used/2022-honda-civic-turbocharger-laf-oxygen-sensor-36531-64a-a01-3653164aa01/410446-1

### Location: aftermarket install guide, 11th gen (independent)
- 27WON L15-6-209-15 (2022+ 1.5T) install guide:
  - The downpipe bolts to the "turbine side of the turbocharger". The guide warns against breaking "a stud inside the turbine housing".
  - The only sensor steps are removing the **secondary** O2 (22 mm) and refitting it "into the downpipe".
  - The guide never removes an A/F sensor.
  - https://www.performanceinstalls.com/Guide/L15-6-209-15+11th+Gen+Downpipe/175 (PDF: https://store.27won.com/support/instructions/L15-6-209-Honda-Civic-11thgen-Downpipe-Installation-Instructions.pdf)

### Cross-check: 10th gen L15B7
- 27WON L15-6-209-10 guide: "Move the primary O2 sensor wire to the side out of the way" and "Locate the secondary O2 sensor on the downpipe". Only the secondary is removed. https://www.performanceinstalls.com/Guide/L15-6-209-10+10th+Gen+Downpipe/149
- The 10th-gen LAF, 36531-5K8-004, is listed as "Oxygen Turbocharger Laf Sensor". https://ahparts.com/buy-used/2017-honda-civic-oxygen-turbocharger-laf-sensor-1-5l-htbk-36531-5k8-004-365315k8004/338290-1
- CivicX thread: the sensor in the downpipe below the turbo is the downstream one, and "the primary is on the turbo". https://www.civicx.com/forum/threads/request-primary-o2-sensor-location-check.19822/

### Leak effects
- Identifix says a P0420 sets when the upstream and downstream O2 readings stop showing the catalyst's oxygen change. It lists "a small exhaust leak that changes the oxygen content seen by the downstream sensor" as a false-P0420 cause, and says to rule out exhaust leaks before replacing the cat. https://www.identifix.com/blogs/p0420-code-the-guide-to-diagnosis-and-fast-fixes/
- From the source above plus the geometry: air pulled in after the A/F sensor never reaches it, so primary fuel control is unaffected. Air pulled in ahead of the rear O2 biases it lean. That moves the rear-O2 trim and corrupts the catalyst monitor's front-vs-rear comparison. This is an inference, so it is marked medium.
- Related (owner report): a 27WON downpipe on a 2022 Si set a catalyst/O2 CEL, cleared by disabling P0420 in KTuner. This is about catalyst efficiency, not a leak. https://www.civicxi.com/forum/threads/27-won-downpipe-oxygen-sensor-is-tripping-emissions-light.51165/

## Confidence and gaps
- Location: **high**. Honda catalogue text and the 27WON install procedure agree, and the 10th gen matches.
- Leak effects: **medium**. These follow from the sensor positions and a general OBD diagnostic source. No Honda service-manual excerpt was found.
- Not verified: the rendered Honda diagram title (turbocharger vs. exhaust manifold page). Where the secondary O2 bung sits relative to the cat brick in each aftermarket catted downpipe (TSP, RV6) was not checked.
- Repo impact: carDiagnose "Exhaust leak ahead of A/F sensor" (`engine/kta-car.js` ~2130) and `tuner-play-panel.md:151` should not be attributed to downpipe flanges. A turbo-to-downpipe flange leak belongs under the rear-O2 / `kc-p0420` path.

Type: task
Label: wayfinder:task
Status: resolved
Assignee: Chanh
Blocked by:

## Question

What are the owner's current KTuner Quick Adjustment levels on the Starter 21 Dual Tune 2 map? HITL checklist for the owner: open the map in KTuner → Quick Adjustments tab → screenshot Throttle Control, Turbo Responsiveness, Turbo Ramp Options, Dual Boost Targets / ECO, On The Fly Map Switching (and any knock / Boost By Gear options shown); also confirm whether map slots 1/2/3 really hold identical boost targets. Save under `.scratch/downpipe-power/assets/` and record the levels here. Unblocks [Response and lag](07-response-and-lag.md).

## Answer

Done 2026-10-09 from the owner's KTuner 1.0.14.0 screenshots (23 Aug 2026; source folder `KtunerOnMacVirtualBox/.../ktuner-screenshot/`; key shots copied to `../assets/`).
- **Quick Adjustments** ([quick-adjustments.png](../assets/quick-adjustments.png)):
  - Throttle Responsiveness = Factory Throttle Response CVT;
  - Boost Target Ramp Rate = Factory Ramp;
  - Advanced VSA = Factory Throttle VSA Only;
  - Turbo Responsiveness for Tunes 1/2/3 = Factory Responsiveness;
  - Normal and ECO Boost Target for Tunes 1/2/3 = Custom Boost Level, i.e. the Boost_Target_{1,2,3} tables are the on-the-fly slots.
- **Quick Enables** ([quick-enables.png](../assets/quick-enables.png)):
  - Early Spool off; Advanced VSA off; 4 Bar MAP off; Disable Idle Stop/Start on;
  - **Eliminate Artificial Knock Control Rise off**, so the > 5,200 rpm KC rise is present on this FE.
- **Disables** ([disables-monitors.png](../assets/disables-monitors.png)): P0420 enabled (not disabled); **P2096/7 Post Catalyst Too Lean/Rich disabled**; P0128 disabled; Misfire Monitor enabled.
- **IAT Ignition** ([iat-ignition.png](../assets/iat-ignition.png)): high-load retard 0° ≤ 40 °C, 4.5° at 50 °C, 9° at 90 °C+. Low load: 1° / 3° / 3°.
- **ECT Retard:** 0.8° at 95 °C, 1.6° at 105 °C.
- **Ignition Base:** Load axis visible, −11.8 … 8.x (units unlabelled).
- **Boost By Gear:** Custom for gears 1–6.
- **Flex Fuel:** off; ethanol PSI adj all 0.
- **Basemap list:** Starter 21 Dual Target 2 = "21PSI. 18 PSI Target In ECO Mode. 91+ Octane Recommended."
- Slots 1/2/3 identical is still unconfirmed: the screenshot shows the dropdowns, not the cell values.

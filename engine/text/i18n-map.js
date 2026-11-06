/* Text for the Map screen (your KTuner map in 2D and 3D) and the Guide screen (road tune,
 * fact checks, tuner panel), in English. Extends the object i18n-drive.js exports; this is the entry the worker requires. */
(function () {
  'use strict';
  var en = require('./i18n-drive.js');

  var SOURCES = [
    ['https://ktuner.com/22civicturbo/', 'KTuner: 2022+ Civic 1.5T and the Starter 21 Dual Tune'],
    ['http://www.ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm', 'KTuner help: ignition timing and knock control'],
    ['http://www.ktuner.com/KTunerHelp/civic_accord_flex_fuel_tuning.htm', 'KTuner help: Civic/Accord flex-fuel tuning'],
    ['http://www.ktuner.com/forums/viewtopic.php?t=2152', 'KTuner forum: STFT tuning and the AFM Flow table'],
    ['https://www.hondata.com/help/flashpro/knock_control_tables.htm', 'Hondata help: knock control tables'],
    ['https://www.hondata.com/forum/viewtopic.php?t=16245', 'Hondata forum: FlashPro open loop and closed loop'],
    ['https://www.civicx.com/forum/threads/knock-control-significance.29457/', 'CivicX: what knock control means on the 1.5T'],
    ['https://www.civicx.com/forum/threads/ktuner-hondata-and-s-mode-1-5t-cvt.39469/', 'CivicX: S mode and paddles on a tuned 1.5T CVT'],
    ['https://hondanews.com/en-US/honda-automobiles/releases/release-40b876fa88ce36bf41449f6e441f9b95-honda-15-liter-turbo-engine', 'Honda: the 1.5-litre turbo (electric wastegate, DI, dual VTC)'],
    ['https://www.eia.gov/energyexplained/biofuels/ethanol-use.php', 'EIA: E10 is over 95 % of US petrol'],
    ['https://www.federalregister.gov/documents/2020/05/13/2020-07202/vehicle-test-procedure-adjustments-for-tier-3-certification-test-fuel', 'EPA: Tier 3 certification test fuel is E10'],
    ['https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6454675', 'CVT line pressure is set from engine torque (US patent 6,454,675)'],
    ['https://www.hpacademy.com/blog/winols-map-identification-basics/', 'HP Academy: WinOLS map identification basics'],
    ['http://www.megamanual.com/begintuning.htm', 'MegaManual: keep the spark table smooth'],
    ['https://www.civic11forum.com/threads/ktuner-starter-21-dual-tune-2-reliablity.7685/', 'Civic11 forum: Starter 21 Dual Tune 2 owner reports']
  ];

  // ---------------------------------------------------------------------------
  // English
  // ---------------------------------------------------------------------------
  en.nav2 = {
    reference: 'Reference',
    map: 'Your KTuner map', mapSub: '39 tables · 2D and 3D',
    guide: 'Road tune guide', guideSub: 'Fact checks · tuner panel',
    showIn: function (name) { return 'Show ' + name + ' in your map'; }
  };
  en.tables = {
    MAF_Scaling_Custom: { name: 'AFM Flow (Custom)',
      what: 'Turns the air-flow sensor’s frequency (Hz) into grams of air per second at 103 points. Fuel, load, the torque estimate and the CVT’s torque signal all start from this number.',
      edit: 'Stage A, required after an intake. The app computes the whole corrected row from your cruise trims and full-throttle error (Step 3). Paste it over this row.',
      verify: 'Trims within ±5 % at every AFM point you drove; full throttle within 0.5 AFR of the map at 12 psi and up.',
      shape: 'Rises at every point, and the percentage change is smooth: no single-point bumps.' },
    MAF_Scaling_Factory: { name: 'AFM Flow (factory)', what: 'Honda’s curve for the stock intake housing. Above 4,375 Hz it is partly reconstructed from your screenshot.', edit: 'Reference only. Compare your corrected row against it.' },
    MAF_Scaling_PRL_Race: { name: 'AFM Flow (PRL Race preset)', what: 'KTuner’s curve for the PRL Race intake housing. A bigger housing passes more air at the same frequency, so the curve sits higher than factory.', edit: 'Start from it only if you run that exact housing. Then correct it from your logs.' },
    MAF_Scaling_27Won_Race: { name: 'AFM Flow (27WON Race preset)', what: 'KTuner’s curve for the 27WON Race intake housing. It sits higher than factory for the same reason.', edit: 'Start from it only if you run that exact housing. Then correct it from your logs.' },
    AFM_Flow_Raw_Visible: { name: 'AFM Flow (screenshot part)', what: 'The 31 values visible in your screenshot, 2,031-4,375 Hz. Kept to check the digitizing.', edit: 'Nothing to do.' },
    WOT_Enrich: { name: 'WOT Enrichment',
      what: 'The AFR the ECU commands at full load, on the λ × 14.7 scale. Columns 7-9 are full load (11.0); column 6 is the step in (11.5).',
      edit: 'Lever 1, optional, only after Step 5 passes: 11.0 → 11.5 from 3,000 rpm and 11.3 from 5,500 rpm, columns 7-9, the same in L and H.',
      verify: 'Measured AFR within ±0.3 of the command and never leaner than 12.0; no new knock; knock control steady.',
      shape: 'A block with a gentle ramp at 2,750-3,000 rpm. No spikes.' },
    Boost_Target_Normal: { name: 'Boost Target, Normal',
      what: 'The boost the ECU aims for in Normal and Sport, psi gauge, by rpm (rows) and load (columns). Your map: 13 psi at 1,600-2,250 rpm, 21 psi from 3,500 rpm. Stock peaks near 16.5 psi.',
      edit: 'The Boost step, optional, offered only when your logs unlock it: +1 psi on the 3,500-4,500 rpm rows, cells of 15 psi and up, in Boost Target 2 Normal (L and H) only. Tune 2 carries it, so Tune 1 stays your proven map. It unlocks when a Cool drive with two floored pulls and a hot drive pass every gate. Once it is proven on Tune 2, the same cells go to Boost Target 1 and 3. Never above the Final Boost Target peak at that row (23.4 psi on this map), 24 psi at most. Nothing below 3,000 rpm.',
      verify: 'On Tune 2, a Cool drive with two floored pulls and a hot drive: the logged target reaches the new value; undershoot and overshoot each within 1.5 psi, target + overshoot at most 24; timing within 1° of the last proven map; knock control settled and at most 0.56; mixture never leaner than 12.0; fuel pressure at least 90 % of target. The first failure undoes it.',
      shape: 'The 3,000 → 3,500 rpm ramp gets 1 psi steeper, and 4,500 → 5,000 rpm steps back down 1 psi. No spikes.' },
    Boost_Target_ECO: { name: 'Boost Target, ECO', what: 'The ECO-button boost: 18 psi from 3,000 rpm. This is Stage 1 of your Dual Tune.', edit: 'Leave it. Use ECO on hot afternoons and in heavy traffic: less heat and less knock.' },
    Final_Boost_Target: { name: 'Final Boost Target', what: 'A final boost table, −0.2 to 23.4 psi. Its axes and exact role weren’t captured in the screenshots; it may act as a final cap.', edit: 'Leave stock. Don’t edit a table whose axes you can’t see.' },
    Boost_By_Gear_Limits: { name: 'Boost by gear limits', what: 'Per-gear boost caps. Yours are 35.4 psi everywhere, so this table isn’t limiting anything: the boost targets decide.', edit: 'Leave it. It isn’t a tuning knob in the basic stage.' },
    Cylinder_Fill_Limitation: { name: 'Cylinder fill limitation', what: 'The most air (mg per cylinder) the ECU allows at each rpm: a torque guard that also protects the CVT.', edit: 'Leave stock. If you reach it, the log shows boost falling short of target.' },
    Ignition_Base: { name: 'Ignition base', what: 'The main timing table. KTuner: final timing = table + knock limit − knock retard, and the ECU uses the lower of that and the table.', edit: 'Leave stock. Without a dyno there is no torque feedback, and on RON95 E10 under boost the engine is knock-limited: knock control finds the timing.' },
    Ignition_Max: { name: 'Ignition max', what: 'The upper timing limits the knock system works under.', edit: 'Leave stock, for the same reasons as Ignition base.' },
    Knock_Sens: { name: 'Knock sensitivity', what: 'How loud a noise must be before it counts as knock, for one pair of cylinders.', edit: 'Never touch. Raising it hides knock; it doesn’t stop it.' },
    Ethanol_Ign_Adj: { name: 'Ethanol ignition adjustment', what: 'Extra timing added in proportion to measured ethanol content. KTuner: it needs an ethanol sensor and its flex-fuel converter.', edit: 'Leave it. Pump E10 needs no flex setup. Don’t enter 10 % to unlock timing.' },
    Ethanol_Boost_Target_Adj: { name: 'Ethanol boost adjustment', what: 'Extra boost with measured ethanol (flex fuel). Yours is zero in every cell.', edit: 'Leave it.' },
    DI_Fuel_Pressure_Target: { name: 'DI fuel pressure target', what: 'Direct-injection rail pressure target by rpm and load, in kPa: 18,000 = 180 bar. The file’s note says psi, but the numbers only make sense as kPa.', edit: 'Check only: in a pull, actual pressure should hold 90 % of target or more. Don’t add “+250 psi”.' },
    WOT_Exhaust_VTC_Low_Cam: { name: 'WOT exhaust cam (VTC)', what: 'Exhaust cam angle at full throttle by rpm. It shapes spool and scavenging.', edit: 'Leave stock.' }
  };
  en.map = {
    eyebrow: 'Reference · your map',
    title: 'Your KTuner map',
    goal: 'All 39 tables from the file you sent, what each one does, and exactly which cells the basic stage changes. Pick a table, then switch between 2D and 3D.',
    base: {
      title: 'Base map: KTuner Starter 21 Dual Tune 2', tag: 'KTuner’s figures',
      facts: [['ECO button · Stage 1', '18 psi · up to +40 lb-ft, +30 whp'], ['Normal and Sport · Stage 2', '21 psi · up to +58 lb-ft, +55 whp'], ['Also in the map', 'Sharper throttle, low-end damping removed, less turbo lag']],
      means: 'The boost gain is already in your map: 21 psi against about 16.5 psi stock. So the basic stage adds no boost. It makes the air reading and the fuel right for your parts, then proves the car stays safe in Vietnam heat.',
      eco: 'ECO (18 psi) is your hot-day mode. If knock control holds 0.62 or more on a hot afternoon, drive in ECO.'
    },
    plan: {
      title: 'The edit plan, in order',
      head: ['Step', 'Table in your file', 'Cells', 'Change'],
      A: ['Stage A · required', 'AFM Flow, 103 points', 'Computed from your log'],
      B1: ['Lever 1 · optional', 'Rows 3,000-6,600 rpm × columns 7-9, in L and H', '11.0 → 11.5 (11.3 from 5,500 rpm)'],
      B2: ['Boost step · optional', 'Rows 3,500-4,500 rpm × cells of 15 psi and up, in Boost Target 2 L and H (Tune 2)', '+1 psi, under the Final Boost Target peak (23.4), 24 at most; to Tunes 1 and 3 once proven'],
      pending: 'waiting for a log',
      none: 'none until your logs pass every gate',
      cells: function (n) { return n + ' per table'; },
      open: 'Open'
    },
    digitized: 'Digitized from your screenshots (data/KTuner-Maps-Digitized.xlsx). RPM rows are real. The load (column) axes weren’t captured, so columns are numbered 0 to N as in your sheets. Check a column’s real load value in KTuner before you type a change.',
    lh: 'L and H: your notes read low/high cam or low/high octane. Honda’s knock control moves between high- and low-octane limits by itself (KTuner and Hondata help), so any edit goes into both halves.',
    roles: { edit: 'Edit in the basic stage', check: 'Check against logs, don’t edit', leave: 'Leave stock', never: 'Never touch', preset: 'Reference curves', info: 'Screenshot part' },
    stage: { A: 'Stage A · required', B1: 'Lever 1 · optional', B2: 'Boost step · optional, unlocked by your logs' },
    pick: 'Table',
    views: { grid: '2D grid', lines: '2D lines', surface: '3D' },
    show: { label: 'Show', after: 'After the edit', before: 'As in your file', diff: 'Difference', smooth: 'If smoothed' },
    reset: 'Reset view',
    turnLeft: 'Turn left', turnRight: 'Turn right', tiltUp: 'Tilt up', tiltDown: 'Tilt down',
    surfaceLabel: function (name) { return '3D surface of ' + name + '. Drag, or use the arrow keys, to turn it.'; },
    noSurface: 'A single curve has no 3D view. Use 2D lines.',
    axes3d: function (unit, diff, lo, hi) { return 'Height: ' + (diff ? 'change, ' : '') + lo + ' to ' + hi + (unit ? ' ' + unit : '') + ' · along: rpm · across: load column'; },
    dragHint: 'Drag to turn it, or use the arrow keys. RPM keeps its real spacing; columns are evenly spaced because their load values weren’t captured.',
    axis: { rpm: 'rpm', hz: 'AFM frequency (Hz)', col: 'column (load axis not captured)' },
    cells: function (n) { return n === 1 ? '1 cell changes' : n + ' cells change'; },
    points: function (n) { return n === 1 ? '1 point changes' : n + ' points change'; },
    noEdit: 'The basic stage leaves this table as it is.',
    pendingAfm: 'Load a baseline log in Step 2 (or a sample) and the app computes this row. Until then there is nothing to paste.',
    atCeiling: 'At the Final Boost Target peak (23.4 psi on this map, 24 at most) the Boost step has no room left, so it changes nothing.',
    shapeOk: 'Shape check: no new spikes or dips.',
    shapeBad: function (n) { return 'Shape check: ' + n + (n === 1 ? ' new spike or dip.' : ' new spikes or dips.') + ' Blend the edge before you flash.'; },
    step: function (a, b, unit) { return 'Largest step between neighbours: ' + a + ' → ' + b + (unit ? ' ' + unit : '') + '. The ECU interpolates, so a step is a ramp, not a jump.'; },
    also: function (pair) { return 'Make the same change in ' + pair + '.'; },
    info: { what: 'What it does', edit: 'Basic stage', verify: 'How the log proves it', shape: 'Shape' },
    how: 'How to make this change in KTuner',
    howSteps: {
      A: ['Open AFM Flow and choose Custom.', 'Copy the corrected row from Step 3 (103 values).', 'Select the whole row, paste, and check the graph still rises everywhere.', 'Save under a new file name, flash, then log the same drive.'],
      B1: ['Only after Step 5 passes.', 'Open WOT Enrichment L. Select rows 3,000-5,000 rpm, columns 7-9, set 11.5.', 'Select rows 5,500-6,600 rpm, columns 7-9, set 11.3.', 'Do the same in WOT Enrichment H.', 'Save under a new file name, flash, log a pull (Step 4 checks).'],
      B2: ['Only when the app offers it: a Cool drive with two floored pulls and a hot drive passed every gate.', 'In Boost Target 2 Normal L and H only, select rows 3,500-4,500 rpm, the cells of 15 psi and up, and add 1 psi (never above the Final Boost Target peak at that row: 23.4 here, 24 at most).', 'Leave Boost Target 1 and 3, and every row below 3,000 rpm, as they are.', 'Save under a new file name, flash, switch to Tune 2, and log a Cool drive with two floored pulls and a hot drive.', 'If they pass, copy the same cells to Boost Target 1 and 3. If one fails, flash your previous file back.']
    },
    blind: function (p, name, F) {
      var top = p.topHighLoad[0];
      if (!top) return 'Blind smoothing test on ' + name + ': a 3×3 smooth adds no timing in the boosted zone here, but it still moves ' + p.cut + ' cells away from Honda’s values. Smooth only what you change.';
      var n = p.raisedHighLoad;
      return 'Blind smoothing test on ' + name + ': a 3×3 smooth would add +' + F.num(top.delta, 1) + '° at ' + F.num(top.x) + ' rpm in column ' + top.c + (n ? ', and raise ' + n + (n === 1 ? ' cell' : ' cells') + ' in the boosted, high-load zone (1,500 rpm and up) by 1° or more' : '') + '. That is the peak-torque zone, where knock lives. Honda and KTuner shaped those cells on purpose. Smooth only what you change.';
    },
    legend: { changed: 'Changed cell', before: 'As in your file', after: 'After the edit', add: 'Smoothing adds timing', cut: 'Smoothing removes timing' },
    gridCurve: { hz: 'Hz', value: 'g/s', change: 'change' }
  };
  en.guide = {
    eyebrow: 'Reference · road tune guide',
    title: 'Road tune guide and tuner panel',
    goal: 'What a tuner changes on this car without a dyno, how to do a safe road pull, whether a map must look smooth in 3D, and what we kept from the videos you sent.',
    basic: {
      title: 'Basic road tune: what changes and what doesn’t',
      head: ['Item', 'Verdict', 'Where', 'How you know'],
      rows: [
        ['Air measurement (AFM Flow)', 'good', 'Change, first', 'AFM Flow (Custom) · Stage A', 'Trims ±5 %; full throttle within 0.5 AFR of the map'],
        ['AFR at full throttle', 'watch', 'Check; one small optional lean', 'WOT Enrichment L/H · Lever 1', 'Within 0.5 of the map at 12 psi and up; never 1.0 leaner held 0.3 s'],
        ['Fuel for E10', 'watch', 'No blanket +4 %', 'Nothing to type (see below)', 'Cruise trims sit around -0.8 % (median) on your logs; the full-throttle check decides'],
        ['Boost', 'nodata', 'No change in the basic stage', 'Boost Target Normal: already 21 psi (stock ≈ 16.5)', 'Tracks target ±1.5 psi; no overshoot with the downpipe'],
        ['Ignition timing', 'nodata', 'Leave stock', 'The ECU’s knock control', 'Knock retard ≤ 1°; knock control ≤ 0.56 and steady'],
        ['Knock sensitivity', 'stop', 'Never', '-', '-'],
        ['DI fuel pressure', 'nodata', 'Check only', 'DI Fuel Pressure Target', 'Actual ≥ 90 % of target in a pull'],
        ['CVT protection', 'nodata', 'Leave stock', 'Cylinder fill limit, boost by gear', 'CVT ≤ 90 °C; torque within 3 % of the base map'],
        ['Ethanol (flex) tables', 'nodata', 'Leave', 'They need an ethanol sensor', '-']
      ]
    },
    e10: {
      title: 'Does E10 need more fuel?',
      lead: 'Not by hand. Three facts and one check:',
      points: [
        'At idle and cruise the ECU runs closed loop. The A/F sensor measures lambda, so E10 needs no offset: your cruise trims sit around -0.8 % (median). Nothing to type.',
        'The Step 3 AFM correction is built from those trims, so it carries the E10 difference too. The ECU then reads a little more air than there is. That errs towards less timing and meeting its torque guard slightly early: the safe direction.',
        'At full throttle the ECU runs open loop. Hondata’s FlashPro guidance: the long-term trim only works in closed loop, and the ECU goes open loop once the target is richer than about 13:1. Nothing corrects E10 there on its own, so the full-throttle check is the proof.'
      ],
      us: 'US pump petrol is E10 (EIA) and US cars are certified on E10 (EPA Tier 3), so maps developed in the US were developed on E10-type fuel. Expect a small full-throttle error, not 4 %.',
      then: 'If a pull reads more than 0.3 AFR lean with fuel pressure healthy, the Step 3 correction adds fuel at those AFM points, or a reviewer richens WOT Enrichment by the same amount. Never a blanket +4 %.'
    },
    boost: {
      title: 'Boost: why not more?',
      points: [
        'Your map already asks 21 psi from 3,500 rpm (ECO 18). That’s +4.5 psi over stock and where KTuner’s +55 whp comes from.',
        'The bolt-ons help without more boost. The intercooler lowers intake temperature, so knock control pulls less timing. The downpipe spools the turbo sooner. Both show up as power at the same boost.',
        'What they can do is make boost overshoot: a freer exhaust spools faster than the ECU’s wastegate control expects. The 1.5T’s wastegate is electric (Honda), so there is no solenoid plumbing to fix, but new intercooler couplers and clamps are a common leak. Overshoot over 2.5 psi is a Stop.',
        'More boost on RON95 E10 at 35 °C mostly buys knock control, which takes the timing back. The fastest car on a hot afternoon is the one that doesn’t knock.'
      ]
    },
    pull: {
      title: 'A safe road pull, no dyno',
      source: 'Adapted from HP Academy’s road-tuning lesson for a CVT on Vietnamese roads.',
      steps: [
        'Where: a closed road, a track day or a dyno. Never in traffic. A passenger runs the laptop or phone.',
        'Warm up: coolant 80 °C or more. After city traffic, cruise 5 minutes so intake temperature settles. Heat-soaked logs lie.',
        'Hold one ratio: in S mode the paddles hold a fixed step on cars that have them, so rpm sweeps cleanly. In D the CVT can hold rpm or step it, which gives fewer rpm points but is still a valid check.',
        'Log at 10 samples a second or more, with the channels on Step 2.',
        'From about 2,000 rpm, roll smoothly to full throttle and pull to about 6,300 rpm, or to the speed you can safely reach. Stabbing the pedal adds transient fuel and muddles the log.',
        'Lift at once if AFR goes leaner than 12.0, knock retard passes 3°, or boost overshoots by 3 psi.',
        'Cool down 2-3 minutes between pulls. Same road, same direction, same step, so logs compare. Trust logs, not the seat of your pants.',
        'No brake-boosted launches on a CVT: belt clamping follows the ECU’s torque signal and can lag a sudden torque rise.'
      ]
    },
    smooth: {
      title: 'Does a 3D map have to look smooth?',
      verdict: 'Mostly true, for a narrower reason than the video gives.',
      points: [
        ['True', 'The ECU interpolates between cells, so a table is really a surface the engine drives across. A lone spike or dip is a bump it drives over: surging, a knock spot, wobbling boost. Every edit should keep neighbours in line. HP Academy says the same of AFM curves: a good calibration is a smooth rising curve, and bumps or dips point to a problem.'],
        ['Not true', '“Every table must be smooth.” Factory tables have deliberate shapes: boost jumps from vacuum to boost across one column, ignition dips where the engine is knock-limited, DI pressure steps with load. Smoothing those undoes choices Honda and KTuner made.'],
        ['Your map', ''],
        ['Axes', 'A 3D view exaggerates or hides slopes when the axis spacing is uneven (500, 650, 750, 1,000 rpm…). This app keeps real rpm spacing; columns are evenly spaced because their values weren’t captured.'],
        ['This car', 'The video smooths a VE table on a speed-density standalone. This ECU measures air with the AFM, so there is no VE table to build. The smooth-shape rule applies to the AFM curve and to your edits.']
      ],
      rule: 'Our rule: smooth what you change, not what Honda made. The app checks every edit for new spikes or dips, and the Difference view shows only what your edit moved (the WinOLS habit of comparing before and after).',
      show: 'Show it on Ignition Base H'
    },
    panel: {
      title: 'Tuner panel',
      note: 'A structured debate built from each camp’s published guidance, not quotes from real people. The verdicts are for this car and the basic stage.',
      who: { kt: 'KTuner tuner', hd: 'Hondata tuner', ols: 'WinOLS calibrator', honda: 'Honda engineer' },
      verdict: 'Verdict for your FE',
      topics: [
        { q: 'Where to start after bolt-ons?',
          kt: 'Calibrate the AFM first. An intake pushes trims positive; fix AFM Flow until mean trims sit near zero.',
          hd: 'Tune with closed loop on. The software reads trims and lambda to work out the change; no need to switch the sensor off.',
          ols: 'Air mass is the root input. Load, the torque model and the limiters hang off it. Fix the root before the branches.',
          honda: 'The torque the CVT is told about is calculated from measured air. If the AFM reads low, the transmission clamps for less torque than it gets.',
          v: ['good', 'Adopt: AFM Flow first (Stage A). Every later decision depends on it.'] },
        { q: 'AFR target under boost',
          kt: 'About 11.0-11.5 AFR (λ 0.75-0.78) at full load, like these maps already use.',
          hd: 'The ECU goes open loop when the target is richer than about 13:1. At full load you get the command, if the AFM is right.',
          ols: 'Full-load lambda also protects the turbo and the catalyst. Don’t lean it to chase peak numbers.',
          honda: 'Rich at full load is heat management: fuel cools the charge. HP Academy’s dyno test shows power barely moves between λ 0.86 and 1.0.',
          v: ['watch', 'Adapt: one small lean-out (11.0 → 11.5, 11.3 up top), after the hot-day check. Not the 12.5-13 of the naturally aspirated Z06 test: different engine, fuel and climate.'] },
        { q: 'E10: add fuel?',
          kt: 'Pump E10 needs no flex setup; the ethanol tables are for a sensor kit.',
          hd: 'Long-term trim only works in closed loop, so prove full throttle with a log.',
          ols: 'A fuel property belongs in the fuel model, but on a closed platform the AFM carries it. Keep it small and measured.',
          honda: 'Honda Việt Nam says its cars run on E10. US certification fuel is E10.',
          v: ['good', 'Adopt the check; reject the blanket +4 %.'] },
        { q: 'Boost',
          kt: 'Starter 21 gives 18 psi in ECO and 21 psi in Normal and Sport; the Dual Tune lets you choose.',
          hd: 'CVT maps keep low-rpm boost down to protect the belt.',
          ols: 'Raising targets alone runs into the torque limiter: the ECU caps what the targets ask for.',
          honda: 'Belt clamping follows the torque signal. A sudden torque rise at low speed is the CVT’s hardest job.',
          v: ['good', 'Adopt: no boost in the basic stage. +1 psi at 3,500-5,500 rpm only with a reviewer, never below 3,000 rpm; ECO on hot days.'] },
        { q: 'Ignition timing',
          kt: 'Final timing = table + knock limit − knock retard, and the lower of that and the table wins. Knock control runs 0-1.3.',
          hd: 'Knock control 0 % behaves like RON 100, 100 % like RON 90; RON95 sits near 50 %. The knock limit tables are for experienced tuners.',
          ols: 'Timing needs torque feedback. Without a dyno you can’t find MBT; you only find knock.',
          honda: 'The knock system adapts to fuel and heat. That’s its job.',
          v: ['good', 'Leave timing stock. The videos’ MBT sweeps and “±2° and compare” need a dyno. On the road, watch knock retard and knock control.'] },
        { q: 'Must the 3D map be smooth?',
          kt: 'Graph the table after every edit to catch typos and spikes.',
          hd: 'Blend the edges of any block you change.',
          ols: 'Use 3D to compare original and modified, and check the axes before you trust a shape.',
          honda: 'Factory tables carry deliberate features: shape follows the engine, not the eye.',
          v: ['good', 'Smooth what you change, not what Honda made.'] },
        { q: 'Knock sensitivity',
          kt: 'It sets what counts as knock. Raising it hides knock.',
          hd: 'Same on FlashPro: find the cause instead.',
          ols: 'A detection threshold is a sensor calibration, not a power table.',
          honda: 'It is tuned for this block and these sensors.',
          v: ['stop', 'Reject. The prototype’s “raise knock thresholds” is the one change that can hide damage.'] }
      ]
    },
    videos: {
      title: 'From the videos: kept, adapted, left',
      head: ['Idea', 'Verdict', 'For this car'],
      tags: { kept: 'Kept', adapted: 'Adapted', left: 'Left' },
      rows: [
        ['AFR and spark are the two big things (standalone tuning video)', 'kept', 'On this car spark stays with the ECU’s knock control; you work on air and fuel.'],
        ['Build a VE fuel table and make its 3D shape smooth', 'left', 'No VE table to tune: this ECU measures air with the AFM. The smooth-shape idea applies to the AFM curve and your edits.'],
        ['Interpolate to blend an edit into its neighbours', 'kept', 'Blend the edge of any block you change; the app checks for new spikes.'],
        ['Retard 1° per psi; ±2° timing sweeps; MBT', 'left', 'Needs torque feedback from a dyno. On RON95 E10 under boost the engine is knock-limited before MBT.'],
        ['11.5 AFR is the pump-petrol boost standard; richer for more boost', 'kept', 'Matches 11.0-11.5 in this map.'],
        ['Leaner makes a few lb-ft (Z06 test, 11 → 13)', 'adapted', 'True for that naturally aspirated V8. Here the lean-out stops at 11.5 (11.3 up top).'],
        ['Power barely changes between λ 0.86 and 1.0 (HP Academy)', 'kept', 'AFR is a safety knob, not a power knob.'],
        ['Pick AFR by goal: power, reliability, economy, emissions (NACA 189)', 'kept', 'A street car in tropical heat: reliability first at full load; cruise stays at λ 1.'],
        ['Ethanol lets a knock-limited engine take more timing (E85 test)', 'adapted', 'E10 is far from E85, and RON95 E10 is still RON95. The ECU finds any extra timing itself.'],
        ['Correction tables and knock learning shift final timing (GM video)', 'kept', 'Honda’s knock control works the same way between high- and low-octane limits. Log knock control.'],
        ['Hear knock with audio (det cans)', 'left', 'Useful on a dyno. On the road, log knock retard for every cylinder.'],
        ['Road pulls in a fixed ratio, heat soak first, abort on bad AFR (HP Academy)', 'kept', 'Step 4 and the road pull above.'],
        ['MAF scaling: error per MAF point, steady state plus a ramp run, skip the lambda lag, ignore thin data, extrapolate, keep it smooth, 2-3 rounds (HP Academy webinar)', 'kept', 'This is Stage A: trims binned per AFM point, the first 0.6 s of each pull skipped, ±10 % per round, smooth and rising.'],
        ['Switch closed loop off and scale the MAF from a wideband (HP Academy)', 'adapted', 'Hondata tunes with closed loop on and reads the trims; the full-throttle part uses the A/F reading.'],
        ['Shape the boost curve by rpm; use torque as the limit', 'kept', 'Your map already shapes it; Lever 2 adds only where torque falls away (3,500-5,500 rpm).'],
        ['Throttle-based boost for drivability', 'left', 'The ECU is torque-based and already does it.'],
        ['Boost troubleshooting: leaks, plumbing, an overboost cut', 'kept', 'Boost leak test in Step 1; overshoot over 2.5 psi is a Stop.'],
        ['Aftermarket boost controller set-up (eBoost)', 'left', 'This car’s wastegate is electric and ECU-controlled.'],
        ['Lambda overlay: compare actual with target per cell, clear, re-log after each change (Honda S300)', 'kept', 'The check after every flash.'],
        ['Idle timing 16° and distributor sync (OBD1 video)', 'left', 'Coil-on-plug, no distributor; idle belongs to Honda.']
      ]
    },
    sourcesTitle: 'Sources for this page',
    sources: SOURCES,
    videosNote: 'Also the video lessons you sent (HP Academy, Evans Tuning and others), checked against the sources above.'
  };

  module.exports = en;
})();

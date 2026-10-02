/* Text for the Map screen (your KTuner map in 2D and 3D) and the Guide screen (road tune,
 * fact checks, tuner panel), in English and Vietnamese. Extends window.KTA_I18N from app/i18n.js. */
(function () {
  'use strict';
  var I = window.KTA_I18N;

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
  var en = I.en;
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
      edit: 'Lever 2, optional and off by default: +1 psi on the 3,500-5,500 rpm plateau, only if a reviewer raises your ceiling above 21 psi. Same change in Boost Target 1, 2 and 3, L and H. Nothing below 3,000 rpm.',
      verify: 'Boost within 1.5 psi of target, knock 1° or less, knock control steady, CVT 90 °C or less, torque within 3 % of the base map.',
      shape: 'The 3,000 → 3,500 rpm ramp gets 1 psi steeper. No spikes.' },
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
      B2: ['Lever 2 · optional', 'Rows 3,500-5,500 rpm × the 21 psi columns, in 1/2/3 L and H', '+1 psi, only above a 21 psi ceiling'],
      pending: 'waiting for a log',
      none: 'none at your 21 psi ceiling',
      cells: function (n) { return n + ' per table'; },
      open: 'Open'
    },
    digitized: 'Digitized from your screenshots (data/KTuner-Maps-Digitized.xlsx). RPM rows are real. The load (column) axes weren’t captured, so columns are numbered 0 to N as in your sheets. Check a column’s real load value in KTuner before you type a change.',
    lh: 'L and H: your notes read low/high cam or low/high octane. Honda’s knock control moves between high- and low-octane limits by itself (KTuner and Hondata help), so any edit goes into both halves.',
    roles: { edit: 'Edit in the basic stage', check: 'Check against logs, don’t edit', leave: 'Leave stock', never: 'Never touch', preset: 'Reference curves', info: 'Screenshot part' },
    stage: { A: 'Stage A · required', B1: 'Lever 1 · optional', B2: 'Lever 2 · optional, off by default' },
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
    atCeiling: 'At your 21 psi ceiling this lever changes nothing. It proposes +1 psi only if a reviewer raises the ceiling in Step 6.',
    shapeOk: 'Shape check: no new spikes or dips.',
    shapeBad: function (n) { return 'Shape check: ' + n + (n === 1 ? ' new spike or dip.' : ' new spikes or dips.') + ' Blend the edge before you flash.'; },
    step: function (a, b, unit) { return 'Largest step between neighbours: ' + a + ' → ' + b + (unit ? ' ' + unit : '') + '. The ECU interpolates, so a step is a ramp, not a jump.'; },
    also: function (pair) { return 'Make the same change in ' + pair + '.'; },
    info: { what: 'What it does', edit: 'Basic stage', verify: 'How the log proves it', shape: 'Shape' },
    how: 'How to make this change in KTuner',
    howSteps: {
      A: ['Open AFM Flow and choose Custom.', 'Copy the corrected row from Step 3 (103 values).', 'Select the whole row, paste, and check the graph still rises everywhere.', 'Save under a new file name, flash, then log the same drive.'],
      B1: ['Only after Step 5 passes.', 'Open WOT Enrichment L. Select rows 3,000-5,000 rpm, columns 7-9, set 11.5.', 'Select rows 5,500-6,600 rpm, columns 7-9, set 11.3.', 'Do the same in WOT Enrichment H.', 'Save under a new file name, flash, log a pull (Step 4 checks).'],
      B2: ['Only with a reviewer, a clean hot-day log, and a ceiling above 21 psi.', 'In Boost Target 1, 2 and 3 Normal (L and H), select rows 3,500-5,500 rpm across the 21 psi columns and set 22.', 'Leave every row below 3,000 rpm as it is.', 'Save under a new file name, flash, log a hot-afternoon pull.']
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

  // ---------------------------------------------------------------------------
  // Tiếng Việt
  // ---------------------------------------------------------------------------
  var vi = I.vi;
  vi.nav2 = {
    reference: 'Tham khảo',
    map: 'Map KTuner của bạn', mapSub: '39 bảng · 2D và 3D',
    guide: 'Hướng dẫn tune trên đường', guideSub: 'Kiểm chứng · hội đồng tuner',
    showIn: function (name) { return 'Xem ' + name + ' trong map của bạn'; }
  };
  vi.tables = {
    MAF_Scaling_Custom: { name: 'AFM Flow (Custom)',
      what: 'Đổi tần số của cảm biến lưu lượng khí (Hz) thành gram khí mỗi giây, qua 103 điểm. Xăng, tải, mô-men ước tính và tín hiệu mô-men gửi cho hộp CVT đều bắt đầu từ con số này.',
      edit: 'Giai đoạn A, bắt buộc sau khi thay cổ hút. App tính cả hàng đã hiệu chỉnh từ trim khi chạy đều và sai số khi đạp hết ga (Bước 3). Dán đè lên hàng này.',
      verify: 'Trim trong khoảng ±5 % ở mọi điểm AFM bạn đã chạy qua; đạp hết ga trong 0.5 AFR so với map từ 12 psi trở lên.',
      shape: 'Tăng ở mọi điểm, và phần trăm thay đổi phải mượt: không có điểm lồi đơn lẻ.' },
    MAF_Scaling_Factory: { name: 'AFM Flow (zin)', what: 'Đường cong của Honda cho họng gió zin. Từ 4,375 Hz trở lên được dựng lại một phần từ ảnh chụp của bạn.', edit: 'Chỉ để tham khảo. So hàng đã hiệu chỉnh của bạn với nó.' },
    MAF_Scaling_PRL_Race: { name: 'AFM Flow (preset PRL Race)', what: 'Đường cong KTuner làm sẵn cho họng PRL Race. Họng lớn hơn cho nhiều khí đi qua hơn ở cùng tần số, nên đường cong nằm cao hơn bản zin.', edit: 'Chỉ bắt đầu từ nó nếu bạn dùng đúng họng đó. Sau đó hiệu chỉnh tiếp từ log.' },
    MAF_Scaling_27Won_Race: { name: 'AFM Flow (preset 27WON Race)', what: 'Đường cong KTuner làm sẵn cho họng 27WON Race. Nó cũng nằm cao hơn bản zin vì cùng lý do.', edit: 'Chỉ bắt đầu từ nó nếu bạn dùng đúng họng đó. Sau đó hiệu chỉnh tiếp từ log.' },
    AFM_Flow_Raw_Visible: { name: 'AFM Flow (phần ảnh chụp)', what: '31 giá trị nhìn thấy trong ảnh chụp của bạn, 2,031-4,375 Hz. Giữ lại để kiểm tra việc số hoá.', edit: 'Không cần làm gì.' },
    WOT_Enrich: { name: 'WOT Enrichment',
      what: 'AFR mà ECU ra lệnh khi đầy tải, theo thang λ × 14.7. Cột 7-9 là đầy tải (11.0); cột 6 là bước chuyển (11.5).',
      edit: 'Đòn bẩy 1, tuỳ chọn, chỉ sau khi Bước 5 đạt: 11.0 → 11.5 từ 3,000 rpm và 11.3 từ 5,500 rpm, cột 7-9, sửa giống nhau ở L và H.',
      verify: 'AFR đo được lệch không quá ±0.3 so với lệnh và không bao giờ nghèo hơn 12.0; không có kích nổ mới; knock control ổn định.',
      shape: 'Một khối có dốc nhẹ ở 2,750-3,000 rpm. Không có gai.' },
    Boost_Target_Normal: { name: 'Boost Target, Normal',
      what: 'Mức boost ECU nhắm tới ở chế độ Normal và Sport, psi, theo rpm (hàng) và tải (cột). Map của bạn: 13 psi ở 1,600-2,250 rpm, 21 psi từ 3,500 rpm. Xe zin đạt đỉnh khoảng 16.5 psi.',
      edit: 'Đòn bẩy 2, tuỳ chọn và mặc định tắt: +1 psi trên vùng phẳng 3,500-5,500 rpm, chỉ khi người duyệt nâng trần của bạn lên trên 21 psi. Sửa giống nhau ở Boost Target 1, 2 và 3, cả L và H. Không đụng dưới 3,000 rpm.',
      verify: 'Boost lệch không quá 1.5 psi so với mục tiêu, kích nổ từ 1° trở xuống, knock control ổn định, CVT từ 90 °C trở xuống, mô-men không quá 3 % so với map gốc.',
      shape: 'Đoạn dốc 3,000 → 3,500 rpm dốc thêm 1 psi. Không có gai.' },
    Boost_Target_ECO: { name: 'Boost Target, ECO', what: 'Boost khi bấm nút ECO: 18 psi từ 3,000 rpm. Đây là Stage 1 trong Dual Tune của bạn.', edit: 'Giữ nguyên. Dùng ECO vào buổi chiều nóng và khi kẹt xe: ít nhiệt, ít kích nổ hơn.' },
    Final_Boost_Target: { name: 'Final Boost Target', what: 'Bảng boost cuối, từ −0.2 tới 23.4 psi. Trục và vai trò chính xác không có trong ảnh chụp; có thể nó là mức trần cuối cùng.', edit: 'Giữ nguyên. Đừng sửa một bảng mà bạn không thấy trục của nó.' },
    Boost_By_Gear_Limits: { name: 'Giới hạn boost theo số', what: 'Mức trần boost cho từng số. Của bạn đều là 35.4 psi, nên bảng này không giới hạn gì cả: bảng boost mục tiêu mới quyết định.', edit: 'Giữ nguyên. Đây không phải nút để tune ở giai đoạn cơ bản.' },
    Cylinder_Fill_Limitation: { name: 'Giới hạn nạp khí xi-lanh', what: 'Lượng khí tối đa (mg mỗi xi-lanh) ECU cho phép ở từng mức rpm: một lớp bảo vệ mô-men, đồng thời bảo vệ hộp CVT.', edit: 'Giữ nguyên. Nếu chạm tới nó, log sẽ cho thấy boost không đạt mục tiêu.' },
    Ignition_Base: { name: 'Ignition base', what: 'Bảng góc đánh lửa chính. Theo KTuner: góc cuối = bảng + giới hạn kích nổ − lùi lửa, và ECU dùng giá trị nhỏ hơn giữa kết quả đó và bảng.', edit: 'Giữ nguyên. Không có dyno thì không có phản hồi mô-men, và với RON95 E10 khi có boost, máy bị giới hạn bởi kích nổ: knock control tự tìm góc lửa.' },
    Ignition_Max: { name: 'Ignition max', what: 'Các giới hạn góc lửa trên cùng mà hệ thống kích nổ làm việc bên dưới.', edit: 'Giữ nguyên, cùng lý do như Ignition base.' },
    Knock_Sens: { name: 'Độ nhạy kích nổ', what: 'Tiếng gõ phải lớn tới đâu mới bị tính là kích nổ, cho một cặp xi-lanh.', edit: 'Không bao giờ đụng. Nâng nó lên chỉ che kích nổ, không làm hết kích nổ.' },
    Ethanol_Ign_Adj: { name: 'Bù lửa theo ethanol', what: 'Góc lửa cộng thêm theo lượng ethanol đo được. Theo KTuner: cần cảm biến ethanol và bộ chuyển flex-fuel của họ.', edit: 'Giữ nguyên. Xăng E10 ngoài cây xăng không cần bộ flex. Đừng nhập 10 % để mở thêm lửa.' },
    Ethanol_Boost_Target_Adj: { name: 'Bù boost theo ethanol', what: 'Boost cộng thêm theo ethanol đo được (flex fuel). Của bạn bằng 0 ở mọi ô.', edit: 'Giữ nguyên.' },
    DI_Fuel_Pressure_Target: { name: 'Áp suất xăng DI mục tiêu', what: 'Áp suất ray phun trực tiếp mục tiêu theo rpm và tải, đơn vị kPa: 18,000 = 180 bar. Ghi chú trong file ghi psi, nhưng các con số chỉ hợp lý nếu là kPa.', edit: 'Chỉ kiểm tra: khi kéo ga, áp suất thực phải giữ từ 90 % mục tiêu trở lên. Đừng cộng “+250 psi”.' },
    WOT_Exhaust_VTC_Low_Cam: { name: 'Cam xả khi đạp hết ga (VTC)', what: 'Góc cam xả khi đạp hết ga theo rpm. Nó ảnh hưởng tới lúc turbo lên và việc quét khí.', edit: 'Giữ nguyên.' }
  };
  vi.map = {
    eyebrow: 'Tham khảo · map của bạn',
    title: 'Map KTuner của bạn',
    goal: 'Cả 39 bảng trong file bạn gửi, mỗi bảng làm gì, và chính xác những ô nào giai đoạn cơ bản sẽ sửa. Chọn một bảng rồi chuyển qua lại giữa 2D và 3D.',
    base: {
      title: 'Map gốc: KTuner Starter 21 Dual Tune 2', tag: 'Số liệu của KTuner',
      facts: [['Nút ECO · Stage 1', '18 psi · thêm tới +40 lb-ft, +30 whp'], ['Normal và Sport · Stage 2', '21 psi · thêm tới +58 lb-ft, +55 whp'], ['Map còn thay đổi', 'Chân ga nhạy hơn, bỏ độ trễ ga ở dải thấp, turbo lên sớm hơn']],
      means: 'Phần tăng boost đã có sẵn trong map của bạn: 21 psi so với khoảng 16.5 psi zin. Vì vậy giai đoạn cơ bản không tăng boost. Nó làm cho số đo khí và lượng xăng đúng với đồ độ của bạn, rồi chứng minh xe vẫn an toàn trong cái nóng Việt Nam.',
      eco: 'ECO (18 psi) là chế độ cho ngày nóng. Nếu knock control giữ từ 0.62 trở lên vào buổi chiều nóng, hãy chạy ECO.'
    },
    plan: {
      title: 'Kế hoạch sửa, theo thứ tự',
      head: ['Bước', 'Bảng trong file của bạn', 'Ô', 'Thay đổi'],
      A: ['Giai đoạn A · bắt buộc', 'AFM Flow, 103 điểm', 'Tính từ log của bạn'],
      B1: ['Đòn bẩy 1 · tuỳ chọn', 'Hàng 3,000-6,600 rpm × cột 7-9, ở L và H', '11.0 → 11.5 (11.3 từ 5,500 rpm)'],
      B2: ['Đòn bẩy 2 · tuỳ chọn', 'Hàng 3,500-5,500 rpm × các cột 21 psi, ở 1/2/3 L và H', '+1 psi, chỉ khi trần trên 21 psi'],
      pending: 'đang chờ log',
      none: 'không có ở trần 21 psi của bạn',
      cells: function (n) { return n + ' ô mỗi bảng'; },
      open: 'Mở'
    },
    digitized: 'Số hoá từ ảnh chụp của bạn (data/KTuner-Maps-Digitized.xlsx). Các hàng rpm là thật. Trục tải (cột) không chụp được, nên cột được đánh số từ 0 như trong sheet của bạn. Hãy kiểm tra giá trị tải thật của cột trong KTuner trước khi gõ thay đổi.',
    lh: 'L và H: ghi chú của bạn là cam thấp/cao hoặc octane thấp/cao. Knock control của Honda tự chuyển giữa giới hạn octane cao và thấp (theo trợ giúp của KTuner và Hondata), nên mọi thay đổi phải làm ở cả hai nửa.',
    roles: { edit: 'Sửa ở giai đoạn cơ bản', check: 'Kiểm tra bằng log, không sửa', leave: 'Giữ nguyên', never: 'Không bao giờ đụng', preset: 'Đường cong tham khảo', info: 'Phần ảnh chụp' },
    stage: { A: 'Giai đoạn A · bắt buộc', B1: 'Đòn bẩy 1 · tuỳ chọn', B2: 'Đòn bẩy 2 · tuỳ chọn, mặc định tắt' },
    pick: 'Bảng',
    views: { grid: 'Bảng 2D', lines: 'Đường 2D', surface: '3D' },
    show: { label: 'Hiển thị', after: 'Sau khi sửa', before: 'Như trong file', diff: 'Chênh lệch', smooth: 'Nếu làm mượt' },
    reset: 'Đặt lại góc nhìn',
    turnLeft: 'Xoay trái', turnRight: 'Xoay phải', tiltUp: 'Nghiêng lên', tiltDown: 'Nghiêng xuống',
    surfaceLabel: function (name) { return 'Mặt 3D của ' + name + '. Kéo, hoặc dùng phím mũi tên, để xoay.'; },
    noSurface: 'Một đường cong đơn không có dạng 3D. Hãy dùng Đường 2D.',
    axes3d: function (unit, diff, lo, hi) { return 'Chiều cao: ' + (diff ? 'mức thay đổi, ' : '') + lo + ' tới ' + hi + (unit ? ' ' + unit : '') + ' · chiều dọc: rpm · chiều ngang: cột tải'; },
    dragHint: 'Kéo để xoay, hoặc dùng phím mũi tên. Trục rpm giữ đúng khoảng cách thật; các cột cách đều vì giá trị tải của chúng không chụp được.',
    axis: { rpm: 'rpm', hz: 'Tần số AFM (Hz)', col: 'cột (trục tải không chụp được)' },
    cells: function (n) { return n + ' ô thay đổi'; },
    points: function (n) { return n + ' điểm thay đổi'; },
    noEdit: 'Giai đoạn cơ bản giữ nguyên bảng này.',
    pendingAfm: 'Nạp log nền ở Bước 2 (hoặc log mẫu), app sẽ tính hàng này. Trước lúc đó chưa có gì để dán.',
    atCeiling: 'Ở trần 21 psi của bạn, đòn bẩy này không đổi gì. Nó chỉ đề xuất +1 psi khi người duyệt nâng trần ở Bước 6.',
    shapeOk: 'Kiểm tra hình dạng: không có gai hay hõm mới.',
    shapeBad: function (n) { return 'Kiểm tra hình dạng: ' + n + ' gai hoặc hõm mới. Làm mượt mép vùng sửa trước khi nạp.'; },
    step: function (a, b, unit) { return 'Bước nhảy lớn nhất giữa hai ô cạnh nhau: ' + a + ' → ' + b + (unit ? ' ' + unit : '') + '. ECU nội suy, nên một bước là một đoạn dốc, không phải cú nhảy.'; },
    also: function (pair) { return 'Sửa giống hệt ở ' + pair + '.'; },
    info: { what: 'Bảng này làm gì', edit: 'Giai đoạn cơ bản', verify: 'Log chứng minh thế nào', shape: 'Hình dạng' },
    how: 'Cách sửa trong KTuner',
    howSteps: {
      A: ['Mở AFM Flow và chọn Custom.', 'Copy hàng đã hiệu chỉnh ở Bước 3 (103 giá trị).', 'Chọn cả hàng, dán, rồi kiểm tra đồ thị vẫn tăng ở mọi chỗ.', 'Lưu thành file mới, nạp, rồi log lại đúng đoạn đường cũ.'],
      B1: ['Chỉ sau khi Bước 5 đạt.', 'Mở WOT Enrichment L. Chọn hàng 3,000-5,000 rpm, cột 7-9, đặt 11.5.', 'Chọn hàng 5,500-6,600 rpm, cột 7-9, đặt 11.3.', 'Làm giống hệt ở WOT Enrichment H.', 'Lưu thành file mới, nạp, log một lần kéo ga (Bước 4 kiểm tra).'],
      B2: ['Chỉ khi có người duyệt, một log ngày nóng sạch, và trần trên 21 psi.', 'Ở Boost Target 1, 2 và 3 Normal (L và H), chọn hàng 3,500-5,500 rpm trên các cột 21 psi và đặt 22.', 'Giữ nguyên mọi hàng dưới 3,000 rpm.', 'Lưu thành file mới, nạp, log một lần kéo ga vào buổi chiều nóng.']
    },
    blind: function (p, name, F) {
      var top = p.topHighLoad[0];
      if (!top) return 'Thử làm mượt “mù” ' + name + ': làm mượt 3×3 không thêm lửa ở vùng có boost, nhưng vẫn kéo ' + p.cut + ' ô lệch khỏi giá trị của Honda. Chỉ làm mượt phần bạn sửa.';
      var n = p.raisedHighLoad;
      return 'Thử làm mượt “mù” ' + name + ': làm mượt 3×3 sẽ cộng +' + F.num(top.delta, 1) + '° ở ' + F.num(top.x) + ' rpm, cột ' + top.c + (n ? ', và nâng ' + n + ' ô ở vùng có boost, tải cao (từ 1,500 rpm) thêm từ 1° trở lên' : '') + '. Đó là vùng mô-men đỉnh, nơi kích nổ hay xảy ra. Honda và KTuner đã cố ý tạo hình các ô đó. Chỉ làm mượt phần bạn sửa.';
    },
    legend: { changed: 'Ô thay đổi', before: 'Như trong file', after: 'Sau khi sửa', add: 'Làm mượt thêm lửa', cut: 'Làm mượt bớt lửa' },
    gridCurve: { hz: 'Hz', value: 'g/s', change: 'thay đổi' }
  };
  vi.guide = {
    eyebrow: 'Tham khảo · hướng dẫn tune trên đường',
    title: 'Hướng dẫn tune trên đường và hội đồng tuner',
    goal: 'Không có dyno thì tuner thay đổi gì trên xe này, kéo ga trên đường thế nào cho an toàn, map 3D có bắt buộc phải mượt không, và những gì chúng tôi giữ lại từ các video bạn gửi.',
    basic: {
      title: 'Tune cơ bản trên đường: cái gì đổi, cái gì không',
      head: ['Hạng mục', 'Kết luận', 'Ở đâu', 'Biết bằng cách nào'],
      rows: [
        ['Đo khí nạp (AFM Flow)', 'good', 'Sửa, làm đầu tiên', 'AFM Flow (Custom) · Giai đoạn A', 'Trim ±5 %; đạp hết ga trong 0.5 AFR so với map'],
        ['AFR khi đạp hết ga', 'watch', 'Kiểm tra; một lần làm nghèo nhẹ tuỳ chọn', 'WOT Enrichment L/H · Đòn bẩy 1', 'Trong 0.5 so với map từ 12 psi trở lên; không bao giờ loãng hơn 1.0 giữ 0.3 giây'],
        ['Xăng cho E10', 'watch', 'Không cộng thẳng +4 %', 'Không cần gõ gì (xem bên dưới)', 'Trim chạy đều quanh -0.8 % (trung vị) trên log của bạn; kiểm tra đạp hết ga mới quyết định'],
        ['Boost', 'nodata', 'Không đổi ở giai đoạn cơ bản', 'Boost Target Normal: đã là 21 psi (zin ≈ 16.5)', 'Bám mục tiêu ±1.5 psi; không vọt boost khi có downpipe'],
        ['Góc đánh lửa', 'nodata', 'Giữ nguyên', 'Knock control của ECU', 'Lùi lửa ≤ 1°; knock control ≤ 0.56 và ổn định'],
        ['Độ nhạy kích nổ', 'stop', 'Không bao giờ', '-', '-'],
        ['Áp suất xăng DI', 'nodata', 'Chỉ kiểm tra', 'DI Fuel Pressure Target', 'Thực tế ≥ 90 % mục tiêu khi kéo ga'],
        ['Bảo vệ CVT', 'nodata', 'Giữ nguyên', 'Giới hạn nạp khí, boost theo số', 'CVT ≤ 90 °C; mô-men không quá 3 % so với map gốc'],
        ['Bảng ethanol (flex)', 'nodata', 'Giữ nguyên', 'Cần cảm biến ethanol', '-']
      ]
    },
    e10: {
      title: 'E10 có cần thêm xăng không?',
      lead: 'Không cần làm tay. Ba sự thật và một lần kiểm tra:',
      points: [
        'Khi nổ không tải và chạy đều, ECU chạy vòng kín. Cảm biến A/F đo lambda nên E10 không cần bù thêm: trim chạy đều của bạn quanh -0.8 % (trung vị). Không cần gõ gì.',
        'Hiệu chỉnh AFM ở Bước 3 được tính từ chính các trim đó, nên nó mang luôn phần chênh của E10. Khi đó ECU đọc lượng khí hơi nhiều hơn thực tế. Sai lệch này nghiêng về phía ít lửa hơn và chạm lớp bảo vệ mô-men sớm hơn một chút: tức là phía an toàn.',
        'Khi đạp hết ga, ECU chạy vòng hở. Theo hướng dẫn FlashPro của Hondata: trim dài hạn chỉ tác dụng ở vòng kín, và ECU chuyển sang vòng hở khi mục tiêu giàu hơn khoảng 13:1. Ở đó không có gì tự bù cho E10, nên kiểm tra khi đạp hết ga là bằng chứng.'
      ],
      us: 'Xăng bán ở Mỹ là E10 (EIA) và xe ở Mỹ được chứng nhận bằng E10 (EPA Tier 3), nên các map làm ở Mỹ đã được làm trên loại xăng giống E10. Sai số khi đạp hết ga thường nhỏ, không phải 4 %.',
      then: 'Nếu một lần kéo ga nghèo hơn 0.3 AFR trong khi áp suất xăng vẫn tốt, hiệu chỉnh ở Bước 3 sẽ thêm xăng ở các điểm AFM đó, hoặc người duyệt làm giàu WOT Enrichment đúng bằng lượng đó. Không bao giờ cộng thẳng +4 %.'
    },
    boost: {
      title: 'Boost: sao không tăng thêm?',
      points: [
        'Map của bạn đã yêu cầu 21 psi từ 3,500 rpm (ECO 18). Tức là +4.5 psi so với zin, và đó là nguồn của +55 whp mà KTuner công bố.',
        'Đồ độ giúp xe mạnh hơn mà không cần tăng boost. Intercooler hạ nhiệt khí nạp nên knock control rút ít lửa hơn. Downpipe giúp turbo lên sớm hơn. Cả hai thành công suất ở cùng mức boost.',
        'Cái chúng có thể gây ra là vọt boost: pô thoáng hơn làm turbo lên nhanh hơn mức bộ điều khiển wastegate của ECU dự tính. Wastegate của máy 1.5T là loại điện (theo Honda), nên không có đường ống solenoid để sửa, nhưng khớp nối và cổ dê của intercooler mới rất hay bị xì. Vọt quá 2.5 psi là Dừng.',
        'Tăng boost với RON95 E10 ở 35 °C chủ yếu chỉ làm knock control tăng, và nó rút lại lửa. Xe nhanh nhất vào buổi chiều nóng là xe không bị kích nổ.'
      ]
    },
    pull: {
      title: 'Kéo ga trên đường an toàn, không dyno',
      source: 'Chuyển thể từ bài tune trên đường của HP Academy, cho xe CVT trên đường Việt Nam.',
      steps: [
        'Ở đâu: đường khép kín, ngày chạy track hoặc dyno. Không bao giờ giữa dòng xe. Người ngồi cạnh cầm laptop hoặc điện thoại.',
        'Làm nóng: nước làm mát từ 80 °C trở lên. Sau khi đi phố kẹt xe, chạy đều 5 phút cho nhiệt khí nạp ổn định. Log bị ngấm nhiệt sẽ nói sai.',
        'Giữ một tỉ số: ở chế độ S, lẫy chuyển số giữ một cấp cố định trên xe có lẫy, nên rpm quét đều. Ở D, hộp CVT có thể giữ rpm hoặc nhảy cấp, cho ít điểm rpm hơn nhưng vẫn là một lần kiểm tra hợp lệ.',
        'Log từ 10 mẫu mỗi giây trở lên, với các kênh ở Bước 2.',
        'Từ khoảng 2,000 rpm, đạp đều tới hết ga và kéo tới khoảng 6,300 rpm, hoặc tới tốc độ bạn có thể đạt an toàn. Đạp giật chân ga sẽ thêm xăng tức thời và làm rối log.',
        'Nhả ga ngay nếu AFR nghèo hơn 12.0, lùi lửa vượt 3°, hoặc boost vọt quá 3 psi.',
        'Nghỉ 2-3 phút giữa các lần kéo. Cùng đoạn đường, cùng chiều, cùng cấp số, để log so sánh được. Tin log, đừng tin cảm giác.',
        'Không đạp phanh giữ rồi dồn ga để đề-pa với xe CVT: lực kẹp dây đai theo tín hiệu mô-men của ECU và có thể chậm hơn một cú tăng mô-men đột ngột.'
      ]
    },
    smooth: {
      title: 'Map 3D có bắt buộc phải mượt không?',
      verdict: 'Phần lớn là đúng, nhưng vì một lý do hẹp hơn video nói.',
      points: [
        ['Đúng', 'ECU nội suy giữa các ô, nên một bảng thực ra là một mặt cong mà động cơ chạy trên đó. Một gai hay một hõm đơn lẻ là một ổ gà nó phải chạy qua: xe giật, một điểm kích nổ, boost dao động. Mọi lần sửa phải giữ các ô cạnh nhau hài hoà. HP Academy cũng nói vậy về đường cong AFM: hiệu chỉnh tốt là một đường tăng mượt, còn chỗ lồi lõm là dấu hiệu có vấn đề.'],
        ['Không đúng', '“Bảng nào cũng phải mượt.” Bảng zin có những hình dạng cố ý: boost nhảy từ chân không lên có boost qua một cột, góc lửa trũng xuống ở vùng bị giới hạn kích nổ, áp suất DI tăng từng bậc theo tải. Làm mượt những chỗ đó là xoá đi lựa chọn của Honda và KTuner.'],
        ['Map của bạn', ''],
        ['Trục', 'Góc nhìn 3D phóng đại hoặc che mất độ dốc khi khoảng cách trục không đều (500, 650, 750, 1,000 rpm…). App này giữ đúng khoảng cách rpm thật; các cột cách đều vì giá trị của chúng không chụp được.'],
        ['Xe này', 'Video làm mượt bảng VE trên ECU độc lập chạy speed-density. ECU này đo khí bằng AFM, nên không có bảng VE nào để dựng. Quy tắc hình dạng mượt áp dụng cho đường cong AFM và cho các chỗ bạn sửa.']
      ],
      rule: 'Quy tắc của chúng tôi: làm mượt cái bạn sửa, không làm mượt cái Honda đã làm. App kiểm tra mọi lần sửa xem có gai hay hõm mới không, và chế độ Chênh lệch chỉ hiện đúng phần bạn đã đổi (thói quen so sánh trước và sau của dân WinOLS).',
      show: 'Xem trên Ignition Base H'
    },
    panel: {
      title: 'Hội đồng tuner',
      note: 'Một cuộc tranh luận có cấu trúc, dựng từ hướng dẫn đã công bố của từng phía, không phải lời trích của người thật. Kết luận dành cho chiếc xe này và giai đoạn cơ bản.',
      who: { kt: 'Tuner KTuner', hd: 'Tuner Hondata', ols: 'Kỹ sư WinOLS', honda: 'Kỹ sư Honda' },
      verdict: 'Kết luận cho FE của bạn',
      topics: [
        { q: 'Độ xong thì bắt đầu từ đâu?',
          kt: 'Hiệu chỉnh AFM trước. Cổ hút mới đẩy trim lên dương; sửa AFM Flow tới khi trim trung bình gần 0.',
          hd: 'Tune với vòng kín đang bật. Phần mềm đọc trim và lambda để tính lượng cần sửa; không cần tắt cảm biến.',
          ols: 'Khối lượng khí là đầu vào gốc. Tải, mô hình mô-men và các bộ giới hạn đều bám vào nó. Sửa gốc trước khi sửa cành.',
          honda: 'Mô-men báo cho hộp CVT được tính từ lượng khí đo được. Nếu AFM đọc thấp, hộp số kẹp dây đai cho mức mô-men thấp hơn mức nó thực nhận.',
          v: ['good', 'Chọn: AFM Flow trước (Giai đoạn A). Mọi quyết định sau đều dựa vào nó.'] },
        { q: 'AFR mục tiêu khi có boost',
          kt: 'Khoảng 11.0-11.5 AFR (λ 0.75-0.78) khi đầy tải, như các map này đang dùng.',
          hd: 'ECU chuyển sang vòng hở khi mục tiêu giàu hơn khoảng 13:1. Khi đầy tải bạn nhận đúng lệnh, nếu AFM đúng.',
          ols: 'Lambda khi đầy tải còn bảo vệ turbo và bộ xúc tác. Đừng làm nghèo để đuổi theo con số đỉnh.',
          honda: 'Giàu khi đầy tải là để quản lý nhiệt: xăng làm mát hòa khí. Bài dyno của HP Academy cho thấy công suất gần như không đổi giữa λ 0.86 và 1.0.',
          v: ['watch', 'Điều chỉnh: chỉ một lần làm nghèo nhẹ (11.0 → 11.5, 11.3 ở vòng tua cao), sau khi kiểm tra ngày nóng. Không phải 12.5-13 như bài test Z06 hút khí tự nhiên: khác máy, khác xăng, khác khí hậu.'] },
        { q: 'E10: có thêm xăng không?',
          kt: 'Xăng E10 ngoài cây không cần bộ flex; các bảng ethanol dành cho bộ có cảm biến.',
          hd: 'Trim dài hạn chỉ tác dụng ở vòng kín, nên hãy chứng minh lúc đạp hết ga bằng log.',
          ols: 'Đặc tính xăng thuộc về mô hình nhiên liệu, nhưng trên nền tảng đóng thì AFM gánh nó. Giữ thay đổi nhỏ và có đo đạc.',
          honda: 'Honda Việt Nam xác nhận xe của họ dùng được E10. Xăng chứng nhận ở Mỹ là E10.',
          v: ['good', 'Chọn việc kiểm tra; bỏ việc cộng thẳng +4 %.'] },
        { q: 'Boost',
          kt: 'Starter 21 cho 18 psi ở ECO và 21 psi ở Normal và Sport; Dual Tune cho bạn chọn.',
          hd: 'Map cho CVT giữ boost thấp ở vòng tua thấp để bảo vệ dây đai.',
          ols: 'Chỉ tăng mục tiêu thì sẽ đụng bộ giới hạn mô-men: ECU chặn bớt những gì bảng mục tiêu yêu cầu.',
          honda: 'Lực kẹp dây đai theo tín hiệu mô-men. Mô-men tăng đột ngột ở tốc độ thấp là việc khó nhất của hộp CVT.',
          v: ['good', 'Chọn: không tăng boost ở giai đoạn cơ bản. +1 psi ở 3,500-5,500 rpm chỉ khi có người duyệt, không bao giờ dưới 3,000 rpm; ngày nóng dùng ECO.'] },
        { q: 'Góc đánh lửa',
          kt: 'Góc cuối = bảng + giới hạn kích nổ − lùi lửa, và giá trị nhỏ hơn giữa kết quả đó với bảng sẽ được dùng. Knock control chạy từ 0 tới 1.3.',
          hd: 'Knock control 0 % tương đương RON 100, 100 % tương đương RON 90; RON95 quanh 50 %. Bảng giới hạn kích nổ dành cho tuner có kinh nghiệm.',
          ols: 'Chỉnh lửa cần phản hồi mô-men. Không có dyno thì không tìm được MBT; bạn chỉ tìm được kích nổ.',
          honda: 'Hệ thống kích nổ tự thích nghi với xăng và nhiệt. Đó là việc của nó.',
          v: ['good', 'Giữ nguyên góc lửa. Việc quét MBT và “±2° rồi so sánh” trong video cần dyno. Trên đường, hãy theo dõi lùi lửa và knock control.'] },
        { q: 'Map 3D có phải mượt không?',
          kt: 'Xem đồ thị bảng sau mỗi lần sửa để bắt lỗi gõ và gai.',
          hd: 'Làm mượt mép của khối bạn vừa sửa.',
          ols: 'Dùng 3D để so bản gốc với bản sửa, và kiểm tra trục trước khi tin vào hình dạng.',
          honda: 'Bảng zin có những đặc điểm cố ý: hình dạng đi theo động cơ, không theo mắt nhìn.',
          v: ['good', 'Làm mượt cái bạn sửa, không làm mượt cái Honda đã làm.'] },
        { q: 'Độ nhạy kích nổ',
          kt: 'Nó quyết định cái gì được tính là kích nổ. Nâng lên là che kích nổ.',
          hd: 'Trên FlashPro cũng vậy: hãy tìm nguyên nhân.',
          ols: 'Ngưỡng phát hiện là hiệu chuẩn cảm biến, không phải bảng công suất.',
          honda: 'Nó được chỉnh cho đúng lốc máy và cảm biến này.',
          v: ['stop', 'Loại bỏ. Lời khuyên “nâng ngưỡng kích nổ” trong bản prototype là thay đổi duy nhất có thể che giấu hư hỏng.'] }
      ]
    },
    videos: {
      title: 'Từ các video: giữ lại, điều chỉnh, bỏ qua',
      head: ['Ý tưởng', 'Kết luận', 'Với xe này'],
      tags: { kept: 'Giữ lại', adapted: 'Điều chỉnh', left: 'Bỏ qua' },
      rows: [
        ['AFR và đánh lửa là hai thứ lớn nhất (video tune ECU độc lập)', 'kept', 'Trên xe này góc lửa để knock control của ECU lo; bạn làm phần khí và xăng.'],
        ['Dựng bảng VE và làm mặt 3D của nó thật mượt', 'left', 'Không có bảng VE để tune: ECU này đo khí bằng AFM. Ý tưởng hình dạng mượt áp dụng cho đường cong AFM và các chỗ bạn sửa.'],
        ['Nội suy để hoà chỗ sửa vào các ô bên cạnh', 'kept', 'Làm mượt mép của khối bạn sửa; app kiểm tra gai mới.'],
        ['Lùi 1° mỗi psi; quét lửa ±2°; MBT', 'left', 'Cần phản hồi mô-men từ dyno. Với RON95 E10 khi có boost, máy bị giới hạn kích nổ trước khi tới MBT.'],
        ['11.5 AFR là chuẩn cho xăng thường khi có boost; boost cao hơn thì giàu hơn', 'kept', 'Khớp với 11.0-11.5 trong map này.'],
        ['Nghèo hơn thì thêm vài lb-ft (bài test Z06, 11 → 13)', 'adapted', 'Đúng với chiếc V8 hút khí tự nhiên đó. Ở đây làm nghèo dừng ở 11.5 (11.3 ở vòng tua cao).'],
        ['Công suất gần như không đổi giữa λ 0.86 và 1.0 (HP Academy)', 'kept', 'AFR là núm an toàn, không phải núm công suất.'],
        ['Chọn AFR theo mục tiêu: công suất, độ bền, tiết kiệm, khí thải (NACA 189)', 'kept', 'Xe đi phố ở xứ nóng: độ bền trước tiên khi đầy tải; chạy đều vẫn ở λ 1.'],
        ['Ethanol cho máy bị giới hạn kích nổ thêm được lửa (bài test E85)', 'adapted', 'E10 khác xa E85, và RON95 E10 vẫn là RON95. ECU tự tìm phần lửa dư nếu có.'],
        ['Bảng bù và việc học kích nổ làm lệch góc lửa cuối (video GM)', 'kept', 'Knock control của Honda cũng chuyển giữa giới hạn octane cao và thấp như vậy. Hãy log knock control.'],
        ['Nghe kích nổ bằng tai nghe (det can)', 'left', 'Hữu ích trên dyno. Trên đường, log lùi lửa cho từng xi-lanh.'],
        ['Kéo ga trên đường ở một tỉ số cố định, xử lý ngấm nhiệt trước, nhả ga khi AFR sai (HP Academy)', 'kept', 'Bước 4 và phần kéo ga ở trên.'],
        ['Hiệu chỉnh MAF: sai số theo từng điểm MAF, chạy đều cộng một lần kéo, bỏ độ trễ lambda, bỏ dữ liệu mỏng, ngoại suy, giữ mượt, 2-3 vòng (webinar HP Academy)', 'kept', 'Đây chính là Giai đoạn A: trim gom theo từng điểm AFM, bỏ 0.6 s đầu mỗi lần kéo, ±10 % mỗi vòng, mượt và luôn tăng.'],
        ['Tắt vòng kín và hiệu chỉnh MAF bằng wideband (HP Academy)', 'adapted', 'Hondata tune với vòng kín bật và đọc trim; phần đạp hết ga dùng số đọc A/F.'],
        ['Tạo hình đường boost theo rpm; lấy mô-men làm giới hạn', 'kept', 'Map của bạn đã tạo hình sẵn; Đòn bẩy 2 chỉ thêm ở nơi mô-men giảm dần (3,500-5,500 rpm).'],
        ['Boost theo độ mở bướm ga để dễ lái', 'left', 'ECU điều khiển theo mô-men và đã làm việc này.'],
        ['Xử lý boost: xì, đường ống, cắt boost khi vọt', 'kept', 'Thử xì boost ở Bước 1; vọt quá 2.5 psi là Dừng.'],
        ['Cài bộ điều khiển boost rời (eBoost)', 'left', 'Wastegate của xe này là loại điện, do ECU điều khiển.'],
        ['Lambda overlay: so thực tế với mục tiêu từng ô, xoá, log lại sau mỗi lần sửa (Honda S300)', 'kept', 'Lần kiểm tra sau mỗi lần nạp.'],
        ['Góc lửa không tải 16° và cân chia điện (video OBD1)', 'left', 'Bô-bin đơn cho từng máy, không có chia điện; không tải là việc của Honda.']
      ]
    },
    sourcesTitle: 'Nguồn cho trang này',
    sources: SOURCES,
    videosNote: 'Cùng các video bạn gửi (HP Academy, Evans Tuning và các kênh khác), đã đối chiếu với các nguồn trên.'
  };
})();

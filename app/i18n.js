/* Civic FE Tune Assist: interface text in English and Vietnamese.
 * Dynamic strings are functions of the engine's structured data (d) and formatter (F). */
(function () {
  'use strict';
  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  var en = {
    code: 'en',
    other: 'Tiếng Việt',
    app: {
      title: 'Civic FE Tune Assist',
      subtitle: 'KTuner companion for the 1.5T CVT on Vietnam E10',
      car: 'Civic FE · 1.5T · CVT',
      stage: 'Stage A: fuel matches the mods',
      stepsOf: function (n) { return n + ' of 5 steps'; },
      mods: function (n) { return n + (n === 1 ? ' mod' : ' mods'); },
      lastLog: 'Last log',
      themeDark: 'Dark theme', themeLight: 'Light theme',
      langSwitch: 'Tiếng Việt',
      skip: 'Skip to the step',
      stepsNav: 'Tuning steps',
      explain: 'Explanations',
      sessionNote: 'Logs stay in this browser tab. Settings and ticks are remembered on this device.'
    },
    groups: { Prepare: 'Prepare', Tune: 'Tune AFR', Gain: 'Gain and review' },
    steps: [
      { title: 'Your car and mods', sub: 'Mods, fuel and pre-checks', goal: 'Your build decides which tables need work. Confirm it, and finish the checks that make every later log trustworthy.', done: 'All six pre-checks ticked' },
      { title: 'Baseline log', sub: 'Measure before changing anything', goal: 'One honest log of the car as it is today. Every later log is compared with it.', done: 'A log with five or more minutes of steady cruise' },
      { title: 'Airflow (AFM Flow)', sub: 'Match the new intake', goal: 'Make the ECU measure air correctly again, so it fuels correctly everywhere.', done: 'Fuel trims within ±5 % at every AFM point you drove' },
      { title: 'Full-throttle fuel', sub: 'Measured matches commanded', goal: 'At full throttle, get the mixture you ask for. Trims don’t work there, so check it directly.', done: 'Within ±0.3 AFR of command, never leaner than 12.0 (λ 0.82)' },
      { title: 'Confirm cool and hot', sub: 'Morning, then afternoon traffic', goal: 'Prove the tune in Vietnam’s worst case, not only on a cool morning.', done: 'Both logs finish without a Stop' },
      { title: 'Gain, one lever at a time', sub: 'Optional, after Step 5', goal: 'Small, safe gains where the CVT can take them.', done: 'A clean log after each lever' },
      { title: 'Review and sign-off', sub: 'A second tuner checks it', goal: 'Someone who tunes with KTuner or Hondata reviews the evidence before you call it done.', done: 'The reviewer approves' }
    ],
    stepOf: function (n, group) { return 'Step ' + n + ' of 7 · ' + group; },
    chips: { done: 'Done', here: 'You are here', progress: 'In progress', todo: 'To do', optional: 'Optional', after5: 'After Step 5' },
    doneWhen: 'Done when', doneTag: 'Done',
    loop: { title: 'The loop, every time', flow: ['Edit', 'Flash', 'Log', 'Check'], note: 'One change per flash. If a check says Stop, undo the last change before anything else.', tables: 'tables edited (+1 optional)', logs: 'logs to finish Stage A' },
    status: { good: 'OK', watch: 'Watch', stop: 'Stop', nodata: 'No data' },
    verdict: { good: 'Pass', watch: 'OK to continue, carefully', stop: 'Fix this before you continue', nodata: 'Not enough data in this log' },
    gates: { fuel: 'Fuel', air: 'Air', spark: 'Spark', heat: 'Heat', cvt: 'CVT' },
    checks: {
      trims: { label: 'Fuel trims (cruise)', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' %') + (isNum(d.hz) ? ' at ' + F.hz(d.hz) : '') : 'No steady cruise found'; }, fix: function () { return 'Step 3: correct the AFM Flow table with the values this app computes.'; } },
      wotAfr: { label: 'WOT mixture vs command', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 2) + ' AFR ' + (d.signed > 0 ? 'lean' : 'rich') + ' on average' : 'No full-throttle pull found'; }, fix: function (d, F) { return d.leanStop ? 'Stop pulls. Leanest ' + F.afrLambda(d.leanest) + ' under boost. Step 4: fix fuel before any more full-throttle runs.' : 'Step 4: extend the AFM correction into the high-Hz end, then log again.'; } },
      fuelPress: { label: 'DI fuel pressure at WOT', display: function (d, F) { return isNum(d.value) ? F.num(d.value * 100, 0) + ' % of target (worst 5 %)' : 'Not logged'; }, fix: function () { return 'The high-pressure pump is at its limit. Do not add boost. Check the fuel filter; E10 needs about 4 % more fuel.'; } },
      overshoot: { label: 'Boost overshoot', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' psi') + (isNum(d.rpm) ? ' at ' + F.num(d.rpm) + ' rpm' : '') : 'Needs boost and boost target'; }, fix: function () { return 'Downpipe spools earlier. Lower the boost target 1 psi at 2,500-3,250 rpm (spool zone) and log again.'; } },
      undershoot: { label: 'Boost reaches target', display: function (d, F) { if (!isNum(d.value)) return 'Needs boost and boost target'; if (Math.abs(d.value) < 0.3) return 'On target after spool'; return F.num(Math.abs(d.value), 1) + ' psi ' + (d.value > 0 ? 'below' : 'above') + ' target after spool'; }, fix: function () { return 'Look for a boost leak (intercooler couplers, clamps) before changing any table.'; } },
      mafHz: { label: 'AFM sensor headroom', display: function (d, F) { return isNum(d.value) ? F.hz(d.value) + ' peak' : 'AFM Hz not logged'; }, fix: function () { return 'The sensor is close to 10,000 Hz, the end of the table. Do not add boost.'; } },
      knock: { label: 'Knock retard at WOT', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 1) + '° worst' + (isNum(d.rpm) ? ' at ' + F.num(d.rpm) + ' rpm' : '') + (d.multi ? ', several cylinders together' : '') : 'Knock retard not logged'; }, fix: function () { return 'Find the cause before adding anything: heat soak, fuel, boost. Richen WOT 0.3 AFR or drop 1 psi in that rpm. Never desensitize the knock sensors.'; } },
      kControl: { label: 'Knock control trend', display: function (d, F) { return isNum(d.end) ? F.num(d.start, 2) + ' → ' + F.num(d.end, 2) : 'Not logged'; }, fix: function () { return 'The ECU keeps finding knock and is drifting to its safer timing map. Treat it like knock retard.'; } },
      iat: { label: 'Intake air temp', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C peak' + (d.inPull ? ' in a pull' : '') : 'Not logged'; }, fix: function () { return 'Heat-soaked. Cruise 5 minutes to cool before a pull. If it stays high, check the intercooler airflow and the intake heat shield.'; } },
      ect: { label: 'Coolant temp', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C peak' : 'Not logged'; }, fix: function () { return 'Stop logging until coolant is back under 95 °C. Check the radiator, fan and coolant level.'; } },
      cvtTemp: { label: 'CVT fluid temp', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C peak' : 'Not logged'; }, fix: function () { return 'Stop pulls and cruise gently until under 90 °C. Hot CVT fluid lets the belt slip, and the ECU cuts torque.'; } },
      torque: { label: 'Engine torque', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' Nm peak (ceiling ' + d.ceiling + ')' : 'Not logged (fine)'; }, fix: function () { return 'Above your CVT ceiling. Lower the boost target where it peaks.'; } },
      lowBoost: { label: 'Boost below 3,000 rpm', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' psi') + ' vs reference map' : 'Needs a pull and boost'; }, fix: function () { return 'More low-rpm torque than the reference map. Put the boost target below 3,000 rpm back to stock: that is where the CVT belt is most stressed.'; } }
    },
    readiness: {
      hzEstimated: function () { return 'Log has AFM g/s but no Hz: Hz estimated from your current AFM table.'; },
      noAfm: function () { return 'No AFM Hz or g/s column: the app can grade the log but cannot compute AFM corrections.'; },
      shortCruise: function (r) { return 'Only ' + r.seconds + ' s of steady warm cruise. Drive 5-10 minutes at steady speeds for a reliable AFM correction.'; },
      noPull: function () { return 'No full-throttle pull found. Fuel, Air and Spark under load stay unchecked.'; },
      fuelLimited: function () { return 'Fuel pressure fell under 90 % of target during a pull. Only pull samples with fuel pressure at 95 % of target or more feed the AFM correction: a lean reading there can come from fuel supply, not airflow.'; },
      missing: function (r, T) { return 'Not in this log: ' + r.keys.map(function (k) { return T.channels[k] || k; }).join(', ') + '.'; }
    },
    refs: {
      afmRising: function (d) { return d.none ? { label: 'AFM Flow correction', detail: 'No correction computed yet.' } : { label: 'AFM Flow curve rises at every point', detail: d.ok ? 'All ' + d.n + ' points rise.' : 'A point is not higher than the one before it.' }; },
      afmStep: function (d, F) { return { label: 'No AFM point moved more than ' + d.limit + ' % this round', detail: 'Largest change ' + F.signed(d.largest, 1, ' %') + '.' }; },
      afmDrift: function (d, F) { return { label: 'Total change vs the factory curve', detail: 'Up to ' + F.num(d.drift, 1) + ' % from factory' + (d.drift > 25 ? '. Large for a housing that should match a preset: confirm the intake preset.' : '.') }; },
      wotBand: function (d) { return { label: 'WOT targets inside 11.0-12.0 AFR (λ 0.75-0.82)', detail: d.bad && d.bad.length ? 'Outside the band at ' + d.bad.join(', ') + ' rpm.' : 'Full-load columns from 3,000 rpm are in the band.' }; },
      boostPeak: function (d) { return { label: 'Boost map peak at or under your ceiling', detail: 'Peak ' + d.peak + ' psi, ceiling ' + d.ceiling + ' psi.' }; },
      boostLow: function (d) { return { label: 'Boost below 3,000 rpm unchanged (CVT belt)', detail: d.changed ? 'Low-rpm cells differ from the reference map.' : 'Same as the reference map.' }; },
      evidence: function (d, F, T) { return { label: 'Latest log passes the five gates', detail: d.none ? 'Load a verification log in Step 5.' : T.verdict[d.verdict] + (d.hasPull ? '' : ' (no full-throttle pull in it)') }; },
      hotLog: function (d) { return { label: 'Verified on a hot afternoon after traffic', detail: d.done ? 'Hot-day log checked.' : 'Still to do: Vietnam heat is the worst case.' }; },
      untouched: function (d) { return { label: 'Ignition, knock sensitivity, DI pressure, cylinder fill, VTC untouched', detail: d.done ? 'Confirmed by the reviewer.' : 'Tick it after comparing the maps in KTuner.' }; }
    },
    samples: {
      before: { title: 'Sample A: after mods, before calibration', short: 'A · After mods, before calibration', note: 'Simulated. The new intake makes the factory AFM curve under-read airflow by 4-10 %.' },
      after: { title: 'Sample B: after one AFM correction', short: 'B · After the AFM fix', note: 'Simulated. Same car after one correction round and a 0.5 psi spool-zone trim.' },
      hot: { title: 'Sample C: hot afternoon, heat-soaked', short: 'C · Hot afternoon', note: 'Simulated. 36 °C ambient after 20 minutes of traffic.' },
      notYours: 'Not your car: load your own CSV to tune.'
    },
    src: { log: 'Cruise trims', wot: 'Full-throttle mixture', interp: 'Between data points', hold: 'Held from nearest data', taper: 'Tapered to zero', none: 'Unchanged' },
    channels: {
      time: 'Time', rpm: 'Engine speed', mafHz: 'AFM frequency (Hz)', mafGs: 'AFM airflow (g/s)', stft: 'Short-term fuel trim', ltft: 'Long-term fuel trim',
      afr: 'AFR / lambda (sensor)', afrCmd: 'AFR / lambda command', tps: 'Throttle', pedal: 'Accelerator pedal', boost: 'Boost', boostTarget: 'Boost target',
      map: 'Manifold pressure (MAP)', baro: 'Barometric pressure', knock: 'Knock retard', kControl: 'Knock control', ign: 'Ignition timing', iat: 'Intake air temp',
      ect: 'Coolant temp', cvt: 'CVT fluid temp', fp: 'Fuel pressure (DI)', fpTarget: 'Fuel pressure target', torque: 'Engine torque', wg: 'Wastegate duty',
      loop: 'Closed loop status', ethanol: 'Ethanol content', vss: 'Vehicle speed'
    },
    sections: { build: 'Your build', fuel: 'Fuel', tool: 'Tuning tool', prep: 'Before your first log', vietnam: 'What Vietnam adds', doIn: function (tool) { return 'Do in ' + tool; }, drive: 'Drive', channels: 'Log these channels', check: 'Check the log', stuck: 'Stuck?', leftAlone: 'Left alone in the basic stage', refs: 'Reference checks (automatic)', ticks: 'Reviewer ticks', signoff: 'Sign-off', packet: 'Review packet' },
    s1: {
      carLine: 'Honda Civic FE · 176 hp @ 6,000 rpm · 240 Nm @ 1,700-4,500 rpm (Vietnam spec)',
      mods: {
        intake: { name: 'High-volume intake', effect: 'Changes how the AFM sensor reads air. Must be calibrated.', badge: 'Tune: Step 3' },
        downpipe: { name: 'Downpipe', effect: 'Spools sooner and can overshoot boost. The A/F sensor now sits in it: no leaks upstream.', badge: 'Check: boost' },
        frontpipe: { name: 'Front pipe', effect: 'A little more flow. No table change.', badge: 'No change' },
        catback: { name: 'Cat-back exhaust', effect: 'Sound. No tuning effect.', badge: 'No change' },
        ic: { name: 'Big intercooler', effect: 'Cooler intake air and steadier timing in heat. More joints: leak-test it.', badge: 'Check: IAT' },
        cvtCooler: { name: 'CVT cooler', effect: 'Keeps CVT fluid below the temperature where the belt slips.', badge: 'Check: CVT temp' }
      },
      notFitted: 'Not fitted',
      housing: 'AFM housing', presetOther: 'No KTuner preset: start from Custom', presetPrl: 'KTuner preset: PRL Race', presetWon: 'KTuner preset: 27WON Race',
      catalyst: 'Catalyst', catted: 'High-flow catted', catless: 'Catless',
      catlessWarn: 'Catless sets a catalyst code (P0420) and fails the đăng kiểm emissions test. A high-flow catted pipe avoids both.',
      e10Note: 'Keep your AFR targets as they are. The ECU and the A/F sensor work in lambda, so E10 needs no target changes. Expect trims 2-4 % positive and about 3 % more fuel per km. Fill at one station for the whole tune.',
      e5Warn: 'Don’t tune or log on RON92. This map and its limits assume RON95.',
      why: 'Why?',
      toolK: 'Table names follow KTuner: AFM Flow, WOT Enrichment, Boost Target. Logs export as CSV from the KTuner app.',
      toolH: 'FlashPro has the same three levers: the AFM calibration, the WOT fuel target and the boost target. Export logs as CSV from FlashPro Manager.',
      prepCount: function (n) { return n + ' of 6 done'; },
      prep: {
        leak: ['Boost leak test passed', 'Pressurise to about 20 psi. New intercooler couplers and clamps are the usual leak.'],
        exhaust: ['No exhaust leak before the A/F sensor', 'Check the downpipe flange and gaskets. A leak there reads lean.'],
        plugs: ['Spark plugs in good shape', 'Correct gap, no oil or white deposits.'],
        fuel: ['Half a tank of E10 RON95 or more', 'From the station you will use for the whole tune.'],
        cvt: ['CVT fluid fresh, cooler lines dry', 'Honda HCF-2. Check the new cooler fittings for weeping.'],
        lights: ['No warning lights, charger on while flashing', 'A dropped voltage mid-flash is the one way to brick an ECU.']
      },
      vn: [
        ['sun', 'Tune cool, verify hot', 'Log calibration runs in the morning. Prove the result on a 32 °C+ afternoon: that’s Step 5.'],
        ['car', 'Traffic heat-soaks the intake', 'After stop-and-go, cruise 5 minutes before any logged pull, or the first pull will knock.'],
        ['rain', 'Flooded streets and a low filter', 'A cone filter low in the bumper can swallow water in the rainy season. Don’t drive through standing water.'],
        ['road', 'Where to do full-throttle runs', 'Only on a closed road, a track day or a dyno, with a passenger running the laptop. Never among motorbikes.']
      ]
    },
    s2: {
      why: 'The new intake shifted the AFM reading. This log shows by how much, and whether anything else needs fixing first: a boost leak, heat, or knock. Everything after this is compared with it. It also shows why the order matters: {loop}.',
      loopLink: 'closed loop vs open loop',
      do: ['Flash the map you run today. Save a copy named <code>baseline</code>.', 'Turn on datalogging with the channels below, 10 samples a second or faster.', 'After the drive, export the log as CSV and load it below.'],
      drive: ['Warm up until coolant reads 80 °C.', 'Idle for 2 minutes.', 'Cruise 10 minutes at 40-90 km/h. Hold the pedal still for 5-10 seconds at a time.', 'Closed road or dyno only: one pull in M mode, 2,500 → 6,000 rpm.'],
      inLog: 'in log', missing: 'missing'
    },
    s3: {
      why: 'A bigger intake housing changes how the AFM sensor sees airflow. When the ECU under-reads air it under-fuels. At cruise the {trims} cover it up. At full throttle they switch off, and that is where engines get hurt. So the fix goes into the {afm}, not the trims.',
      trimsLink: 'fuel trims', afmLink: 'AFM Flow table',
      do1: function (intake) { return '<strong>Choose the starting curve.</strong> KTuner has AFM Flow presets for some housings (PRL Race, 27WON Race). If yours has one, select it, flash, and log again before using the numbers below. Your intake: <strong>' + intake + '</strong>.'; },
      intake: { other: 'no KTuner preset, so start from Custom', prl: 'PRL Race preset', won27: '27WON Race preset' },
      do2: '<strong>Tell the app what was flashed</strong> when you logged (optional). Paste the AFM Flow row; without it, the app uses the Custom curve from your attached maps.',
      pasteLabel: function (tool) { return 'AFM Flow (g/s), 103 values, copied from ' + tool; },
      usingDefault: 'Using the Custom curve from your attached maps.',
      usingPasted: function (n) { return 'Using your pasted row (' + n + ' values).'; },
      do3: '<strong>Copy the corrected row</strong> into AFM Flow (Custom). Flash, drive 15 minutes so the trims relearn, then log again and load it in the check below.',
      corrected: 'Corrected AFM Flow', from: 'From', simulated: '(simulated)',
      needBaseline: 'Load a baseline log in Step 2 first. The correction is computed from its fuel trims.',
      legend: ['Cruise trim, measured', 'Full-throttle mixture error, measured', 'Proposed AFM change', 'Target band ±5 %'],
      chartLabel: 'Fuel trim by AFM frequency with the proposed correction',
      axis: 'AFM frequency (Hz)',
      rising: function (fixes) { return fixes ? 'Curve rises at every point (' + fixes + ' nudged up)' : 'Curve rises at every point'; },
      largest: function (v, F) { return 'Largest change ' + F.signed(v, 1, ' %') + ' (limit ±10 %)'; },
      points: function (a, b) { return a + ' points from cruise trims, ' + b + ' from full-throttle mixture'; },
      head: ['AFM range', 'Average', 'Span', 'Based on'],
      rowLabel: function (tool) { return 'New AFM Flow row, ready to paste (' + tool + ' copies tables as tab-separated text)'; },
      copy: 'Copy row', copied: 'Copied', manual: 'Selected: press Ctrl+C', download: 'Download CSV',
      rules: [
        ['±10 % per point per round, at most.', 'Big jumps come from bad data, not a better calibration.'],
        ['Cruise data never leans the top end.', 'Above your cruise data a richening change is held; a leaning one fades to zero.'],
        ['The curve must rise at every point.', 'A flat or falling step confuses the ECU’s airflow.'],
        ['Two rounds is normal.', 'Needing a third usually means an air leak after the sensor.']
      ],
      stuck: [
        ['Trims still positive everywhere after two rounds', 'Air is getting in after the sensor. Check couplers, intercooler pipes, and the recirculation and PCV hoses.'],
        ['Trims jump around at idle only', 'Turbulence at the sensor. Check the housing is seated and clocked the way its maker says.'],
        ['Trims negative only above 6,000 Hz', 'Leave them. The app won’t lean the full-throttle end from cruise data; Step 4 decides it.']
      ]
    },
    s4: {
      why: 'At full throttle the ECU runs {loop}. It trusts the AFM reading and the WOT target table, and the trims do nothing. So we compare what the factory A/F sensor measured with what the ECU commanded: {afr}.',
      loopLink: 'open loop', afrLink: 'the full-throttle check',
      e10: function (tool) { return 'Targets stay on the gasoline scale. ' + tool + ' shows AFR = λ × 14.7 on any fuel, so 11.0 on screen is λ 0.75 on E10 too. Don’t "correct" targets for ethanol.'; },
      e10Link: 'More on E10',
      do: ['Keep the factory targets in <code>WOT Enrichment</code> L and H: 11.0-11.5 AFR (λ 0.75-0.78). Leaning out is a Step 6 choice.', 'Measured leaner than commanded at high AFM Hz? The Step 3 row already includes it (the rings on its chart). Apply that row.', 'Fuel pressure dropped in the pull? Stop here: that’s fuel supply, not airflow.'],
      drive: ['Cruise 5 minutes so intake heat clears.', 'Pull in M mode, 2,500 → 6,000 rpm. Closed road or dyno only.', 'Two minutes of gentle cruise, then a second pull.'],
      chart: 'Full-throttle mixture by rpm', fromLatest: '(latest log with pulls)', noPull: 'This log has no settled full-throttle pull with AFR and AFR command.',
      avgErr: 'Average error', leanest: 'Leanest under boost', fp: 'DI fuel pressure', notLogged: 'Not logged', ofTarget: '% of target', lean: 'lean', rich: 'rich',
      legend: ['Measured (A/F sensor)', 'Commanded (ECU)', 'Lean limit 12.0 (λ 0.82)'], limit: 'lean limit',
      axis: 'Engine speed (rpm) · AFR on the gasoline scale', chartLabel: 'Measured versus commanded air-fuel ratio across the pull',
      pull: 'Pull 1: boost against target', pullLegend: ['Boost (actual)', 'Boost target'], pullAxis: 'Engine speed (rpm) · boost in psi', pullLabel: 'Boost and boost target across the first pull', overshoot: 'Overshoot'
    },
    s5: {
      why: 'One good morning log is not proof. The worst case here is 35 °C after twenty minutes of traffic: intake heat-soaked, {cvt} hot, and the knock margin at its thinnest. The tune has to pass both.',
      cvtLink: 'CVT fluid',
      cool: 'Cool morning', coolBody: 'Repeat the Step 2 drive, with two pulls.',
      hot: 'Hot afternoon', hotBody: '32 °C or hotter. Twenty minutes of traffic, five minutes of cruise, then one pull.',
      notLoaded: 'Not loaded', which: 'Which log',
      boostTip: 'Downpipe overshoot over +2.5 psi: lower <code>Boost Target</code> (Normal, L and H) by 1 psi at 2,500-3,250 rpm only, then log again.',
      boostLink: 'Why it overshoots', done: 'Stage A done: the fuel matches your mods.'
    },
    s6: {
      locked: '<strong>Finish Step 5 first.</strong> Gains are only safe on a tune that already passes a hot-afternoon log.',
      why: function (peak) { return 'Your map already asks for ' + peak + ' psi from 3,500 rpm. For RON95 E10 in our heat that is near a sensible ceiling. The easy wins now are a less wasteful mixture and keeping the ECU from pulling timing. Boost comes last, and never below 3,000 rpm: {why}.'; },
      whyLink: 'why',
      l1: 'Lever 1 · Lean the full-load mixture a little', first: 'First',
      l1Body: 'In <code>WOT Enrichment</code> L and H, the three full-load columns: 11.0 → 11.5 AFR (λ 0.78) from 3,000 rpm, 11.3 (λ 0.77) from 5,500 rpm. Expect a crisper mid-range and slightly better economy, not a big dyno number.',
      l1Head: ['rpm', 'Column 7', 'Column 8', 'Column 9'],
      l1Pass: '<strong>Pass:</strong> the next log shows knock at 1° or less, IAT at 50 °C or less, and measured mixture within 0.3 of the new command.',
      l2: 'Lever 2 · One more psi, mid-range only', l2Tag: 'Only after Lever 1 passes hot',
      ceiling: 'Your boost ceiling (psi)',
      peakToday: function (peak) { return 'Map peak today: ' + peak + ' psi · stock 11th gen ≈ 16.5 psi'; },
      atCeiling: 'No boost change: your map already peaks at your ceiling. Raise the ceiling only if a tuner reviewing your hot-day logs agrees.',
      l2Head: ['rpm', 'Full-load cells in Boost Target 1, 2, 3 · Normal · L and H'],
      l2Rules: '<strong>Rules:</strong> nothing below 3,000 rpm, one psi per log, and stop at the first repeatable knock.',
      alone: [
        ['Ignition base and max', 'Knock control already finds the timing. Adding more on RON95 in the heat buys knock, not power.'],
        ['Knock sensitivity', 'Turning it down hides knock. It doesn’t stop it.'],
        ['DI fuel pressure target', 'Stock is enough at this power. Your table tops out at 18,000 kPa (180 bar).'],
        ['Cylinder fill limit, boost by gear', 'The ECU’s torque guard for the CVT.'],
        ['Exhaust VTC', 'Needs a dyno to prove any gain.']
      ]
    },
    s7: {
      why: 'Before calling it done, a tuner who uses KTuner or Hondata looks at the same evidence. The app runs the reference checks; the reviewer checks what software can’t see.',
      ticks: [
        ['logs', 'Logs reviewed: trims, full-throttle mixture, knock, fuel pressure, boost, IAT, CVT temp'],
        ['diff', 'Only the intended tables changed (compared with the baseline map)'],
        ['untouched', 'Ignition, knock sensitivity, DI pressure, cylinder fill and VTC untouched'],
        ['mech', 'Mechanical checks done: boost leak test, no exhaust leak before the A/F sensor']
      ],
      reviewer: 'Reviewer', reviewerPh: 'Name, shop or forum handle', uses: 'Tunes with', both: 'KTuner and Hondata',
      approve: 'Approve', changes: 'Changes needed', notes: 'Notes', notesPh: 'What to change, or what to watch next',
      packetNote: 'Paste it into Zalo or your tuning group, with the CSV logs attached. Markdown keeps the table readable.',
      copy: 'Copy packet', copied: 'Copied', manual: 'Selected: press Ctrl+C', download: 'Download .md'
    },
    check: {
      load: 'Load a CSV log', or: 'or try a simulated log:', drop: 'Drop a CSV file here',
      empty: {
        2: 'No baseline yet. Load the CSV from the drive above, or try Sample A to see how a log reads.',
        3: 'Load the log you record after flashing the corrected AFM Flow. Sample B shows what a pass looks like.',
        4: 'Load a log with two full-throttle pulls. Until then the charts use your latest airflow log.',
        5: 'Load the cool-morning log first, then switch to Hot afternoon.',
        '5hot': 'Load the hot-afternoon log. Sample C shows a car that is not ready.',
        6: 'Load the log you record after applying one lever.'
      },
      facts: function (an, F) { return F.num(an.meta.duration / 60, 1) + ' min · ' + an.events.length + (an.events.length === 1 ? ' pull · ' : ' pulls · ') + F.num(an.closedLoopSeconds / 60, 1) + ' min steady cruise · ' + an.meta.rows + ' rows'; },
      whatToDo: 'What to do',
      columns: 'Columns in this log', columnsNote: 'Detected automatically. Fix any column the app picked wrongly; the log is re-checked at once.',
      none: 'Not in log', sampleCsv: 'Download this sample as CSV'
    },
    hints: {
      e10: { title: 'E10 and your AFR numbers', paras: ['E10 is petrol with 10 % ethanol. Its chemically correct ratio is about 14.1:1, not 14.7:1. The ECU and the A/F sensor work in lambda (λ), where 1.00 is the correct mix on any fuel.', 'KTuner and Hondata show AFR as λ × 14.7. So 14.7 on screen is λ 1.00 on E10 too, and a target of 11.0 is λ 0.75. Keep your targets.'], facts: [['Cruise', 'λ 1.00 · shows 14.7'], ['Full throttle', 'λ 0.75-0.82 · shows 11.0-12.0']], note: 'E10 is mandatory for petrol nationwide from 1 June 2026 (E5 RON92 stays on sale until 2030). It carries about 3 % less energy per litre: expect trims a little positive and slightly higher consumption.' },
      trims: { title: 'Fuel trims (STFT + LTFT)', paras: ['How much fuel the ECU adds or removes to hold λ 1.00 at idle and cruise. STFT reacts instantly; LTFT is what it has learned. Read them together: +8 % means the engine ran lean and the ECU is adding 8 %.', 'Positive across the AFM range after an intake swap means the sensor under-reads air. Step 3 moves that correction into the AFM Flow table, where it also works at full throttle.'], bands: [['good', 'within ±5 %'], ['watch', '±5 to ±10 %'], ['stop', 'beyond ±10 %']], note: 'Hondata’s forum guidance treats ±10 % as acceptable. This app aims for ±5 % so the full-throttle end starts accurate.' },
      afm: { title: 'The AFM Flow table', paras: ['The air-flow meter reports a frequency in Hz. The AFM Flow table turns it into grams of air per second across 103 points, from 2,031 to 10,000 Hz. A bigger housing passes more air at the same frequency, so the table has to change with it.', 'KTuner ships curves for some housings (PRL Race, 27WON Race). Start from yours if it exists; the app then fine-tunes it from your logs.'], facts: [['Shape', 'Rises at every point'], ['Headroom', 'Peak under 9,500 Hz in a pull']] },
      loop: { title: 'Closed loop and open loop', paras: ['Idle and cruise run closed loop: the ECU reads the A/F sensor and trims fuel to λ 1.00. Full throttle runs open loop: the ECU trusts the AFM reading and the WOT target table, and the trims stop acting.', 'That’s why the order matters. Fix the AFM first, where the trims show the error. Then check full throttle on its own, where only the A/F sensor shows it.'] },
      afr: { title: 'Full-throttle mixture check', paras: ['Command is what the ECU asks for. Measured is what the factory A/F sensor sees in the downpipe. At full throttle they should agree within 0.3 AFR.'], bands: [['good', 'within ±0.3 AFR'], ['watch', '0.3 to 0.6 AFR off'], ['stop', 'more than 0.6 off, or leaner than 12.0 (λ 0.82) under boost']], note: 'The first 0.6 s of each pull is skipped: the sensor lags the command.' },
      knock: { title: 'Knock retard', paras: ['Degrees of timing the ECU removes when a knock sensor hears detonation. One 0.5-1° blip on one cylinder is usually noise. Several cylinders together, at the same rpm, pull after pull, is real knock.'], bands: [['good', '1° or less'], ['watch', '1 to 3°'], ['stop', 'over 3°, or several cylinders together']], note: 'Fix the cause: heat, fuel or boost. Never turn the knock sensitivity down to make the number go away.' },
      kcontrol: { title: 'Knock control', paras: ['How far the ECU has moved from its high-octane timing towards its safer low-octane timing. It climbs while knock keeps happening and eases back slowly. Read the trend across a log, not a single value.'] },
      boost: { title: 'Boost target and actual', paras: ['Target is what the ECU asks the turbo for; actual is what it makes. A downpipe lowers back-pressure, so the turbo spools sooner and can overshoot the moment it reaches target.'], bands: [['good', 'overshoot under +1.5 psi'], ['watch', '+1.5 to +2.5 psi'], ['stop', 'over +2.5 psi']], note: 'Your map asks for 13 psi at 1,600-2,250 rpm, rising to 21 psi from 3,500 rpm. The stock 11th-gen peak is about 16.5 psi.' },
      iat: { title: 'Intake air temperature', paras: ['Hot air knocks sooner and the ECU pulls timing for it. With a big intercooler, 10-15 °C over ambient in a pull is normal. After twenty minutes of city traffic it can pass 60 °C.'], bands: [['good', '50 °C or less in a pull'], ['watch', '50 to 60 °C'], ['stop', 'over 60 °C']], note: 'Cruise five minutes before a logged pull to clear heat soak.' },
      ect: { title: 'Coolant temperature', paras: ['Normal is 85-100 °C. Over 105 °C, stop logging and check the radiator, fan and coolant level before another pull.'] },
      cvt: { title: 'CVT fluid temperature', paras: ['Past about 100 °C the belt can slip and the ECU cuts torque to protect the CVT. The cooler buys margin in traffic; the log proves it.'], bands: [['good', '90 °C or less'], ['watch', '90 to 100 °C'], ['stop', 'over 100 °C']], note: 'A tuned car in hot traffic should get its CVT fluid changed sooner than the book says.' },
      fuelPress: { title: 'DI fuel pressure', paras: ['The high-pressure pump feeds the direct injectors. At full throttle, actual should stay within 10 % of target. If it sags, the pump is at its limit, and more boost would run lean.'], note: 'Your DI target table tops out at 18,000. Those are kPa (180 bar), not psi.' },
      cvtbelt: { title: 'Why low-rpm boost stays stock', paras: ['High torque at low rpm and low road speed is the hardest job for the CVT belt. Your map holds boost down there on purpose: 13 psi at 1,600-2,250 rpm and 15 psi at 2,500 rpm.', 'Gains belong higher in the rev range, where the engine makes power without a low-speed torque spike.'] },
      torque: { title: 'Engine torque', paras: ['An ECU estimate, and not every log has it. If yours does, keep the peak at or under your CVT ceiling: 280 Nm by default, against 240 Nm stock.'], note: 'For scale: Hondata’s base map for the 11th-gen CVT adds about 40-50 lb-ft (55-68 Nm) on US 91 octane.' }
    },
    terms: [['e10', 'E10 and λ'], ['trims', 'Fuel trims'], ['afm', 'AFM Flow'], ['loop', 'Open vs closed loop'], ['afr', 'Full-throttle check'], ['knock', 'Knock retard'], ['kcontrol', 'Knock control'], ['boost', 'Boost'], ['iat', 'Intake temp'], ['ect', 'Coolant temp'], ['cvt', 'CVT temp'], ['fuelPress', 'Fuel pressure'], ['cvtbelt', 'Low-rpm boost'], ['torque', 'Torque']],
    explain: 'Explain', termsTitle: 'Terms',
    sources: { title: 'Sources behind the numbers', items: [
      ['https://www.hondata.com/tech-lambda-meters-air-fuel-ratio', 'Hondata: lambda meters and air/fuel ratios'],
      ['https://www.hondata.com/forum/viewtopic.php?t=25030', 'Hondata forum: calibrating the AFM from fuel trims'],
      ['http://www.ktuner.com/forums/viewtopic.php?t=2600', 'KTuner forum: knock count and knock control'],
      ['https://www.motor1.com/news/522626/2022-honda-civic-aftermarket-tune/', 'Motor1: Hondata’s 11th-gen Civic 1.5T gains'],
      ['https://vietnamnet.vn/en/vietnam-mandates-nationwide-e10-fuel-from-june-2026-2472045.html', 'VietnamNet: nationwide E10 from June 2026'],
      ['https://tuoitre.vn/saigontimes/honda-xac-nhan-toan-bo-xe-chinh-hang-dung-duoc-xang-e10-1061241067.htm', 'Tuổi Trẻ: Honda Việt Nam confirms E10 compatibility'],
      ['https://iea-amf.org/content/fuel_information/ethanol/e10/ethanol_properties', 'IEA-AMF: E10 fuel properties']
    ] },
    nav: { back: 'Back', next: { 1: 'Next: baseline log', 2: 'Next: airflow', 3: 'Next: full-throttle fuel', 4: 'Next: confirm cool and hot', 5: 'Next: gain (optional)', 6: 'Next: review' } },
    packet: {
      title: 'Civic FE Tune Assist: review packet',
      car: 'Car', fuel: 'Fuel', tool: 'Tool', mods: 'Mods', stage: 'Stage', stageA: 'A (fuel matches the mods)', date: 'Date', none: 'none listed',
      changes: 'Changes',
      afm: function (s, F) { return 'AFM Flow (Custom): ' + s.stats.changed + ' of ' + s.after.length + ' points changed, ' + F.signed(Math.min.apply(null, s.pct), 1, '%') + ' to ' + F.signed(Math.max.apply(null, s.pct), 1, '%') + '.'; },
      afmNone: 'AFM Flow: unchanged', wot: 'WOT AFR targets', boost: 'Boost targets', unchanged: 'unchanged',
      evidence: 'Evidence',
      evidenceLine: function (an, F) { return F.num(an.meta.duration / 60, 1) + ' min, ' + an.events.length + ' full-throttle pull(s), ' + F.num(an.closedLoopSeconds / 60, 1) + ' min steady cruise'; },
      verdict: 'Verdict', noLog: 'No verification log loaded.', table: ['Gate', 'Status', 'Numbers'],
      refs: 'Reference checks', reviewer: 'Reviewer', name: 'Name', uses: 'Uses', decision: 'Decision', decisionBlank: 'Approve / Changes needed', notes: 'Notes'
    },
    mods: { intake: 'High-volume intake', downpipe: function (t) { return 'Downpipe (' + (t === 'catless' ? 'catless' : 'catted') + ')'; }, frontpipe: 'Front pipe', catback: 'Cat-back', ic: 'Big intercooler', cvtCooler: 'CVT cooler' },
    errors: { read: function (n) { return 'Could not read ' + n + '.'; } }
  };

  var vi = {
    code: 'vi',
    other: 'English',
    app: {
      title: 'Civic FE Tune Assist',
      subtitle: 'Trợ lý KTuner cho 1.5T CVT chạy xăng E10 Việt Nam',
      car: 'Civic FE · 1.5T · CVT',
      stage: 'Giai đoạn A: nhiên liệu khớp đồ độ',
      stepsOf: function (n) { return n + '/5 bước'; },
      mods: function (n) { return n + ' món độ'; },
      lastLog: 'Log gần nhất',
      themeDark: 'Giao diện tối', themeLight: 'Giao diện sáng',
      langSwitch: 'English',
      skip: 'Tới nội dung bước',
      stepsNav: 'Các bước tune',
      explain: 'Giải thích',
      sessionNote: 'Log chỉ nằm trong tab trình duyệt này. Cài đặt và các ô đã tích được nhớ trên máy này.'
    },
    groups: { Prepare: 'Chuẩn bị', Tune: 'Chỉnh AFR', Gain: 'Tăng công suất và duyệt' },
    steps: [
      { title: 'Xe và đồ độ', sub: 'Đồ độ, nhiên liệu, kiểm tra trước', goal: 'Cấu hình xe quyết định bảng nào cần chỉnh. Xác nhận lại, và làm xong các mục kiểm tra để mọi log sau đều đáng tin.', done: 'Đã tích đủ 6 mục kiểm tra' },
      { title: 'Log gốc', sub: 'Đo trước khi sửa bất cứ gì', goal: 'Một log trung thực của xe như hiện tại. Mọi log sau đều so với log này.', done: 'Một log có từ 5 phút chạy đều trở lên' },
      { title: 'Lưu lượng khí (AFM Flow)', sub: 'Khớp với cổ hút mới', goal: 'Làm cho ECU đo khí nạp đúng trở lại, để phun xăng đúng ở mọi chế độ.', done: 'Fuel trim trong khoảng ±5 % ở mọi điểm AFM đã chạy qua' },
      { title: 'Nhiên liệu khi đạp hết ga', sub: 'Đo thực tế khớp với lệnh', goal: 'Khi đạp hết ga, hòa khí phải đúng như lệnh. Lúc đó fuel trim không hoạt động, nên phải kiểm tra trực tiếp.', done: 'Lệch lệnh không quá ±0.3 AFR, không bao giờ loãng hơn 12.0 (λ 0.82)' },
      { title: 'Xác nhận lúc mát và lúc nóng', sub: 'Buổi sáng, rồi chiều kẹt xe', goal: 'Chứng minh bản tune trong điều kiện khắc nghiệt nhất ở Việt Nam, không chỉ vào buổi sáng mát.', done: 'Cả hai log không có mục Dừng' },
      { title: 'Tăng công suất, từng bước', sub: 'Tuỳ chọn, sau Bước 5', goal: 'Tăng nhẹ, an toàn, ở vùng hộp số CVT chịu được.', done: 'Log sạch sau mỗi thay đổi' },
      { title: 'Duyệt và ký xác nhận', sub: 'Một thợ tune khác kiểm tra', goal: 'Người có kinh nghiệm tune KTuner hoặc Hondata xem bằng chứng trước khi coi là xong.', done: 'Người duyệt chấp thuận' }
    ],
    stepOf: function (n, group) { return 'Bước ' + n + '/7 · ' + group; },
    chips: { done: 'Xong', here: 'Bạn đang ở đây', progress: 'Đang làm', todo: 'Chưa làm', optional: 'Tuỳ chọn', after5: 'Sau Bước 5' },
    doneWhen: 'Xong khi', doneTag: 'Xong',
    loop: { title: 'Vòng lặp, lần nào cũng vậy', flow: ['Sửa', 'Nạp', 'Log', 'Kiểm tra'], note: 'Mỗi lần nạp chỉ một thay đổi. Nếu có mục Dừng, hoàn tác thay đổi vừa rồi trước đã.', tables: 'bảng cần sửa (+1 tuỳ chọn)', logs: 'log để xong giai đoạn A' },
    status: { good: 'Ổn', watch: 'Theo dõi', stop: 'Dừng', nodata: 'Không có dữ liệu' },
    verdict: { good: 'Đạt', watch: 'Có thể tiếp tục, cẩn thận', stop: 'Sửa trước khi làm tiếp', nodata: 'Log chưa đủ dữ liệu' },
    gates: { fuel: 'Nhiên liệu', air: 'Khí nạp', spark: 'Đánh lửa', heat: 'Nhiệt', cvt: 'Hộp số CVT' },
    checks: {
      trims: { label: 'Fuel trim (chạy đều)', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' %') + (isNum(d.hz) ? ' tại ' + F.hz(d.hz) : '') : 'Không có đoạn chạy đều'; }, fix: function () { return 'Bước 3: sửa bảng AFM Flow bằng giá trị app tính ra.'; } },
      wotAfr: { label: 'Hòa khí WOT so với lệnh', display: function (d, F) { return isNum(d.value) ? 'lệch ' + F.num(d.value, 2) + ' AFR, ' + (d.signed > 0 ? 'loãng' : 'giàu') + ' hơn lệnh (trung bình)' : 'Không có lần đạp hết ga'; }, fix: function (d, F) { return d.leanStop ? 'Dừng kéo ga. Loãng nhất ' + F.afrLambda(d.leanest) + ' khi có boost. Bước 4: sửa nhiên liệu trước khi kéo ga tiếp.' : 'Bước 4: kéo phần hiệu chỉnh AFM lên vùng Hz cao, rồi log lại.'; } },
      fuelPress: { label: 'Áp suất xăng DI khi WOT', display: function (d, F) { return isNum(d.value) ? F.num(d.value * 100, 0) + ' % mục tiêu (5 % thấp nhất)' : 'Không có trong log'; }, fix: function () { return 'Bơm cao áp đã tới giới hạn. Không tăng boost. Kiểm tra lọc xăng; E10 cần thêm khoảng 4 % nhiên liệu.'; } },
      overshoot: { label: 'Boost vượt mục tiêu', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' psi') + (isNum(d.rpm) ? ' tại ' + F.num(d.rpm) + ' rpm' : '') : 'Cần cột boost và boost mục tiêu'; }, fix: function () { return 'Downpipe làm turbo lên sớm hơn. Giảm boost mục tiêu 1 psi ở 2,500-3,250 rpm (vùng turbo bắt đầu lên), rồi log lại.'; } },
      undershoot: { label: 'Boost đạt mục tiêu', display: function (d, F) { if (!isNum(d.value)) return 'Cần cột boost và boost mục tiêu'; if (Math.abs(d.value) < 0.3) return 'Đúng mục tiêu sau khi lên boost'; return (d.value > 0 ? 'Thấp hơn' : 'Cao hơn') + ' mục tiêu ' + F.num(Math.abs(d.value), 1) + ' psi sau khi lên boost'; }, fix: function () { return 'Tìm chỗ xì boost (khớp nối, cổ dê intercooler) trước khi sửa bất kỳ bảng nào.'; } },
      mafHz: { label: 'Dư địa cảm biến AFM', display: function (d, F) { return isNum(d.value) ? F.hz(d.value) + ' cao nhất' : 'Không có AFM Hz'; }, fix: function () { return 'Cảm biến đã gần 10,000 Hz, điểm cuối của bảng. Không tăng boost.'; } },
      knock: { label: 'Lùi lửa do kích nổ (WOT)', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 1) + '° cao nhất' + (isNum(d.rpm) ? ' tại ' + F.num(d.rpm) + ' rpm' : '') + (d.multi ? ', nhiều máy cùng lúc' : '') : 'Không có trong log'; }, fix: function () { return 'Tìm nguyên nhân trước khi thêm gì: hầm nóng, xăng, boost. Làm giàu WOT 0.3 AFR hoặc giảm 1 psi ở dải vòng tua đó. Không bao giờ giảm độ nhạy cảm biến kích nổ.'; } },
      kControl: { label: 'Xu hướng knock control', display: function (d, F) { return isNum(d.end) ? F.num(d.start, 2) + ' → ' + F.num(d.end, 2) : 'Không có trong log'; }, fix: function () { return 'ECU liên tục gặp kích nổ và đang chuyển dần sang map đánh lửa an toàn. Xử lý như lùi lửa.'; } },
      iat: { label: 'Nhiệt độ khí nạp', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C cao nhất' + (d.inPull ? ' khi kéo ga' : '') : 'Không có trong log'; }, fix: function () { return 'Xe đang bị hầm nóng. Chạy đều 5 phút cho mát rồi mới kéo ga. Nếu vẫn cao, kiểm tra luồng gió qua intercooler và tấm chắn nhiệt cổ hút.'; } },
      ect: { label: 'Nhiệt độ nước làm mát', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C cao nhất' : 'Không có trong log'; }, fix: function () { return 'Ngừng log tới khi nước làm mát về dưới 95 °C. Kiểm tra két nước, quạt và mức nước.'; } },
      cvtTemp: { label: 'Nhiệt độ dầu CVT', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C cao nhất' : 'Không có trong log'; }, fix: function () { return 'Ngừng kéo ga, chạy nhẹ tới khi dưới 90 °C. Dầu CVT quá nóng làm dây đai trượt, và ECU cắt mô-men.'; } },
      torque: { label: 'Mô-men xoắn động cơ', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' Nm cao nhất (trần ' + d.ceiling + ')' : 'Không có trong log (không sao)'; }, fix: function () { return 'Vượt trần CVT của bạn. Giảm boost mục tiêu ở vùng đạt đỉnh.'; } },
      lowBoost: { label: 'Boost dưới 3,000 rpm', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' psi') + ' so với map tham chiếu' : 'Cần một lần kéo ga và cột boost'; }, fix: function () { return 'Mô-men ở vòng tua thấp cao hơn map tham chiếu. Trả boost mục tiêu dưới 3,000 rpm về như cũ: đây là nơi dây đai CVT chịu tải nặng nhất.'; } }
    },
    readiness: {
      hzEstimated: function () { return 'Log có AFM g/s nhưng không có Hz: Hz được ước tính từ bảng AFM hiện tại của bạn.'; },
      noAfm: function () { return 'Không có cột AFM Hz hoặc g/s: app chấm được log nhưng không tính được hiệu chỉnh AFM.'; },
      shortCruise: function (r) { return 'Chỉ có ' + r.seconds + ' giây chạy đều khi máy đã nóng. Chạy 5-10 phút ở tốc độ ổn định để hiệu chỉnh AFM đáng tin.'; },
      noPull: function () { return 'Không có lần đạp hết ga nào. Nhiên liệu, khí nạp và đánh lửa khi tải cao chưa được kiểm tra.'; },
      fuelLimited: function () { return 'Áp suất xăng tụt dưới 90 % mục tiêu khi kéo ga. Chỉ mẫu có áp suất từ 95 % mục tiêu trở lên được dùng để hiệu chỉnh AFM: loãng ở đó có thể do thiếu xăng, không phải do khí.'; },
      missing: function (r, T) { return 'Log thiếu: ' + r.keys.map(function (k) { return T.channels[k] || k; }).join(', ') + '.'; }
    },
    refs: {
      afmRising: function (d) { return d.none ? { label: 'Hiệu chỉnh AFM Flow', detail: 'Chưa tính hiệu chỉnh.' } : { label: 'Đường AFM Flow tăng dần ở mọi điểm', detail: d.ok ? 'Cả ' + d.n + ' điểm đều tăng.' : 'Có điểm không cao hơn điểm trước nó.' }; },
      afmStep: function (d, F) { return { label: 'Không điểm AFM nào đổi quá ' + d.limit + ' % trong vòng này', detail: 'Thay đổi lớn nhất ' + F.signed(d.largest, 1, ' %') + '.' }; },
      afmDrift: function (d, F) { return { label: 'Tổng thay đổi so với đường gốc', detail: 'Tối đa ' + F.num(d.drift, 1) + ' % so với gốc' + (d.drift > 25 ? '. Khá lớn cho một cổ hút lẽ ra khớp preset: kiểm tra lại preset.' : '.') }; },
      wotBand: function (d) { return { label: 'Mục tiêu WOT trong 11.0-12.0 AFR (λ 0.75-0.82)', detail: d.bad && d.bad.length ? 'Ngoài khoảng tại ' + d.bad.join(', ') + ' rpm.' : 'Các cột tải tối đa từ 3,000 rpm đều nằm trong khoảng.' }; },
      boostPeak: function (d) { return { label: 'Đỉnh boost của map không vượt trần của bạn', detail: 'Đỉnh ' + d.peak + ' psi, trần ' + d.ceiling + ' psi.' }; },
      boostLow: function (d) { return { label: 'Boost dưới 3,000 rpm giữ nguyên (dây đai CVT)', detail: d.changed ? 'Các ô vòng tua thấp khác map tham chiếu.' : 'Giống map tham chiếu.' }; },
      evidence: function (d, F, T) { return { label: 'Log mới nhất qua cả năm cổng', detail: d.none ? 'Nạp log xác nhận ở Bước 5.' : T.verdict[d.verdict] + (d.hasPull ? '' : ' (không có lần đạp hết ga)') }; },
      hotLog: function (d) { return { label: 'Đã xác nhận vào chiều nóng sau kẹt xe', detail: d.done ? 'Đã kiểm tra log ngày nóng.' : 'Chưa làm: trời nóng Việt Nam là trường hợp xấu nhất.' }; },
      untouched: function (d) { return { label: 'Đánh lửa, độ nhạy kích nổ, áp suất DI, giới hạn nạp, VTC giữ nguyên', detail: d.done ? 'Người duyệt đã xác nhận.' : 'Tích sau khi so sánh map trong KTuner.' }; }
    },
    samples: {
      before: { title: 'Mẫu A: sau khi độ, trước khi hiệu chỉnh', short: 'A · Sau khi độ, chưa hiệu chỉnh', note: 'Mô phỏng. Cổ hút mới làm đường AFM gốc đọc thiếu khí 4-10 %.' },
      after: { title: 'Mẫu B: sau một lần hiệu chỉnh AFM', short: 'B · Sau khi sửa AFM', note: 'Mô phỏng. Cùng xe sau một vòng hiệu chỉnh và giảm 0.5 psi ở vùng lên boost.' },
      hot: { title: 'Mẫu C: chiều nóng, xe bị hầm', short: 'C · Chiều nóng', note: 'Mô phỏng. 36 °C sau 20 phút kẹt xe.' },
      notYours: 'Không phải xe của bạn: nạp CSV của bạn để tune.'
    },
    src: { log: 'Fuel trim khi chạy đều', wot: 'Hòa khí khi đạp hết ga', interp: 'Nội suy giữa các điểm', hold: 'Giữ theo điểm gần nhất', taper: 'Giảm dần về 0', none: 'Không đổi' },
    channels: {
      time: 'Thời gian', rpm: 'Vòng tua', mafHz: 'Tần số AFM (Hz)', mafGs: 'Lưu lượng AFM (g/s)', stft: 'Fuel trim ngắn hạn', ltft: 'Fuel trim dài hạn',
      afr: 'AFR / lambda (cảm biến)', afrCmd: 'AFR / lambda lệnh', tps: 'Bướm ga', pedal: 'Chân ga', boost: 'Boost', boostTarget: 'Boost mục tiêu',
      map: 'Áp suất cổ hút (MAP)', baro: 'Áp suất khí quyển', knock: 'Lùi lửa kích nổ', kControl: 'Knock control', ign: 'Góc đánh lửa', iat: 'Nhiệt độ khí nạp',
      ect: 'Nhiệt độ nước làm mát', cvt: 'Nhiệt độ dầu CVT', fp: 'Áp suất xăng (DI)', fpTarget: 'Áp suất xăng mục tiêu', torque: 'Mô-men động cơ', wg: 'Duty wastegate',
      loop: 'Trạng thái vòng kín', ethanol: 'Hàm lượng ethanol', vss: 'Tốc độ xe'
    },
    sections: { build: 'Cấu hình xe', fuel: 'Nhiên liệu', tool: 'Phần mềm tune', prep: 'Trước log đầu tiên', vietnam: 'Điều riêng ở Việt Nam', doIn: function (tool) { return 'Làm trong ' + tool; }, drive: 'Cách chạy', channels: 'Các kênh cần log', check: 'Kiểm tra log', stuck: 'Bị kẹt?', leftAlone: 'Giữ nguyên ở giai đoạn cơ bản', refs: 'Kiểm tra tham chiếu (tự động)', ticks: 'Người duyệt tích', signoff: 'Ký xác nhận', packet: 'Gói duyệt' },
    s1: {
      carLine: 'Honda Civic FE · 176 mã lực @ 6,000 rpm · 240 Nm @ 1,700-4,500 rpm (bản Việt Nam)',
      mods: {
        intake: { name: 'Cổ hút lưu lượng lớn', effect: 'Thay đổi cách cảm biến AFM đọc khí nạp. Bắt buộc hiệu chỉnh.', badge: 'Tune: Bước 3' },
        downpipe: { name: 'Downpipe', effect: 'Turbo lên sớm hơn và boost có thể vọt. Cảm biến A/F giờ nằm trên nó: không được xì phía trước.', badge: 'Kiểm tra: boost' },
        frontpipe: { name: 'Front pipe', effect: 'Thoát khí tốt hơn một chút. Không đổi bảng nào.', badge: 'Không đổi' },
        catback: { name: 'Pô sau (cat-back)', effect: 'Chỉ thay đổi tiếng. Không ảnh hưởng tune.', badge: 'Không đổi' },
        ic: { name: 'Intercooler lớn', effect: 'Khí nạp mát hơn, góc đánh lửa ổn định hơn khi nóng. Nhiều khớp nối hơn: phải test xì.', badge: 'Kiểm tra: IAT' },
        cvtCooler: { name: 'Két làm mát dầu CVT', effect: 'Giữ dầu CVT dưới mức nhiệt khiến dây đai trượt.', badge: 'Kiểm tra: nhiệt CVT' }
      },
      notFitted: 'Chưa lắp',
      housing: 'Họng AFM', presetOther: 'Không có preset KTuner: bắt đầu từ Custom', presetPrl: 'Preset KTuner: PRL Race', presetWon: 'Preset KTuner: 27WON Race',
      catalyst: 'Bộ xúc tác', catted: 'Có cat lưu lượng cao', catless: 'Không cat',
      catlessWarn: 'Không cat sẽ báo lỗi xúc tác (P0420) và trượt kiểm định khí thải khi đăng kiểm. Downpipe có cat lưu lượng cao tránh được cả hai.',
      e10Note: 'Giữ nguyên các mục tiêu AFR. ECU và cảm biến A/F làm việc theo lambda, nên E10 không cần đổi mục tiêu. Fuel trim sẽ dương 2-4 % và tốn thêm khoảng 3 % xăng mỗi km. Đổ xăng ở một cây xăng cố định trong suốt quá trình tune.',
      e5Warn: 'Không tune hay log bằng RON92. Map và các giới hạn ở đây giả định RON95.',
      why: 'Tại sao?',
      toolK: 'Tên bảng theo KTuner: AFM Flow, WOT Enrichment, Boost Target. Log xuất CSV từ app KTuner.',
      toolH: 'FlashPro có đủ ba nhóm tương đương: hiệu chỉnh AFM, mục tiêu nhiên liệu WOT và boost mục tiêu. Xuất log CSV từ FlashPro Manager.',
      prepCount: function (n) { return 'Xong ' + n + '/6'; },
      prep: {
        leak: ['Đã test xì boost', 'Bơm áp khoảng 20 psi. Khớp nối và cổ dê intercooler mới là chỗ hay xì nhất.'],
        exhaust: ['Không xì khí thải trước cảm biến A/F', 'Kiểm tra mặt bích và gioăng downpipe. Xì ở đó sẽ đọc loãng.'],
        plugs: ['Bugi còn tốt', 'Đúng khe hở, không dính dầu hay cặn trắng.'],
        fuel: ['Từ nửa bình E10 RON95 trở lên', 'Ở cây xăng bạn sẽ dùng suốt quá trình tune.'],
        cvt: ['Dầu CVT còn mới, đường ống két khô ráo', 'Honda HCF-2. Kiểm tra các đầu nối két mới có rịn dầu không.'],
        lights: ['Không có đèn báo lỗi, cắm sạc khi nạp map', 'Tụt điện áp giữa lúc nạp là cách duy nhất làm hỏng ECU.']
      },
      vn: [
        ['sun', 'Tune lúc mát, xác nhận lúc nóng', 'Log hiệu chỉnh vào buổi sáng. Chứng minh kết quả vào buổi chiều từ 32 °C: đó là Bước 5.'],
        ['car', 'Kẹt xe làm hầm nóng khí nạp', 'Sau khi đi đường đông, chạy đều 5 phút trước mọi lần kéo ga có log, nếu không lần kéo đầu sẽ kích nổ.'],
        ['rain', 'Đường ngập và lọc gió đặt thấp', 'Lọc gió kiểu nấm đặt thấp trong cản có thể hút nước mùa mưa. Không lội qua chỗ ngập.'],
        ['road', 'Kéo ga hết ở đâu', 'Chỉ trên đường kín, ngày chạy track hoặc trên dyno, có người ngồi cạnh cầm laptop. Không bao giờ kéo giữa dòng xe máy.']
      ]
    },
    s2: {
      why: 'Cổ hút mới đã làm lệch số đọc AFM. Log này cho biết lệch bao nhiêu, và có gì khác cần sửa trước không: xì boost, nhiệt, hay kích nổ. Mọi thứ sau đều so với log này. Nó cũng cho thấy vì sao thứ tự quan trọng: {loop}.',
      loopLink: 'vòng kín và vòng hở',
      do: ['Nạp map bạn đang chạy. Lưu một bản tên <code>baseline</code>.', 'Bật datalog với các kênh bên dưới, từ 10 mẫu mỗi giây trở lên.', 'Chạy xong, xuất log ra CSV rồi nạp vào bên dưới.'],
      drive: ['Chạy cho nóng máy tới khi nước làm mát đạt 80 °C.', 'Để nổ không tải 2 phút.', 'Chạy đều 10 phút ở 40-90 km/h. Giữ chân ga yên 5-10 giây mỗi lần.', 'Chỉ trên đường kín hoặc dyno: một lần kéo ga ở chế độ M, 2,500 → 6,000 rpm.'],
      inLog: 'có trong log', missing: 'thiếu'
    },
    s3: {
      why: 'Họng cổ hút lớn hơn làm thay đổi cách cảm biến AFM nhìn thấy lưu lượng khí. Khi ECU đọc thiếu khí, nó phun thiếu xăng. Lúc chạy đều thì {trims} che đi. Khi đạp hết ga chúng tắt, và đó là lúc máy bị hại. Nên phải sửa trong {afm}, không phải sửa trim.',
      trimsLink: 'fuel trim', afmLink: 'bảng AFM Flow',
      do1: function (intake) { return '<strong>Chọn đường cong xuất phát.</strong> KTuner có preset AFM Flow cho một số họng (PRL Race, 27WON Race). Nếu họng của bạn có, chọn nó, nạp, rồi log lại trước khi dùng số bên dưới. Cổ hút của bạn: <strong>' + intake + '</strong>.'; },
      intake: { other: 'không có preset KTuner, bắt đầu từ Custom', prl: 'preset PRL Race', won27: 'preset 27WON Race' },
      do2: '<strong>Cho app biết map đã nạp</strong> lúc bạn log (tuỳ chọn). Dán hàng AFM Flow; nếu không, app dùng đường Custom trong map bạn gửi.',
      pasteLabel: function (tool) { return 'AFM Flow (g/s), 103 giá trị, sao chép từ ' + tool; },
      usingDefault: 'Đang dùng đường Custom trong map bạn gửi.',
      usingPasted: function (n) { return 'Đang dùng hàng bạn dán (' + n + ' giá trị).'; },
      do3: '<strong>Sao chép hàng đã hiệu chỉnh</strong> vào AFM Flow (Custom). Nạp, chạy 15 phút cho trim học lại, rồi log lại và nạp vào phần kiểm tra bên dưới.',
      corrected: 'AFM Flow đã hiệu chỉnh', from: 'Từ', simulated: '(mô phỏng)',
      needBaseline: 'Nạp log gốc ở Bước 2 trước. Hiệu chỉnh được tính từ fuel trim của log đó.',
      legend: ['Trim khi chạy đều, đo được', 'Sai lệch hòa khí khi đạp hết ga, đo được', 'Thay đổi AFM đề xuất', 'Vùng mục tiêu ±5 %'],
      chartLabel: 'Fuel trim theo tần số AFM và hiệu chỉnh đề xuất',
      axis: 'Tần số AFM (Hz)',
      rising: function (fixes) { return fixes ? 'Đường cong tăng ở mọi điểm (' + fixes + ' điểm được nâng nhẹ)' : 'Đường cong tăng ở mọi điểm'; },
      largest: function (v, F) { return 'Thay đổi lớn nhất ' + F.signed(v, 1, ' %') + ' (giới hạn ±10 %)'; },
      points: function (a, b) { return a + ' điểm từ trim khi chạy đều, ' + b + ' từ hòa khí khi đạp hết ga'; },
      head: ['Dải AFM', 'Trung bình', 'Khoảng', 'Dựa trên'],
      rowLabel: function (tool) { return 'Hàng AFM Flow mới, sẵn để dán (' + tool + ' sao chép bảng dạng cách bằng tab)'; },
      copy: 'Sao chép hàng', copied: 'Đã sao chép', manual: 'Đã chọn: nhấn Ctrl+C', download: 'Tải CSV',
      rules: [
        ['Tối đa ±10 % mỗi điểm mỗi vòng.', 'Nhảy lớn là do dữ liệu xấu, không phải hiệu chỉnh tốt hơn.'],
        ['Dữ liệu chạy đều không bao giờ làm loãng vùng trên.', 'Phía trên vùng có dữ liệu, thay đổi làm giàu được giữ; thay đổi làm loãng giảm dần về 0.'],
        ['Đường cong phải tăng ở mọi điểm.', 'Một bậc phẳng hay đi xuống làm ECU tính sai lưu lượng.'],
        ['Hai vòng là bình thường.', 'Cần tới vòng thứ ba thường là do xì khí sau cảm biến.']
      ],
      stuck: [
        ['Sau hai vòng trim vẫn dương ở mọi nơi', 'Khí lọt vào sau cảm biến. Kiểm tra khớp nối, đường ống intercooler, ống hồi và ống PCV.'],
        ['Trim nhảy lung tung chỉ khi nổ không tải', 'Dòng khí rối ở cảm biến. Kiểm tra họng lắp đúng vị trí và đúng góc như nhà sản xuất hướng dẫn.'],
        ['Trim âm chỉ trên 6,000 Hz', 'Để yên. App không làm loãng vùng đạp hết ga từ dữ liệu chạy đều; Bước 4 quyết định vùng đó.']
      ]
    },
    s4: {
      why: 'Khi đạp hết ga ECU chạy {loop}. Nó tin số đọc AFM và bảng mục tiêu WOT, còn trim không làm gì. Nên ta so sánh cảm biến A/F zin đo được với lệnh của ECU: {afr}.',
      loopLink: 'vòng hở', afrLink: 'kiểm tra khi đạp hết ga',
      e10: function (tool) { return 'Mục tiêu vẫn theo thang xăng. ' + tool + ' hiển thị AFR = λ × 14.7 với mọi loại xăng, nên 11.0 trên màn hình vẫn là λ 0.75 với E10. Đừng "sửa" mục tiêu vì ethanol.'; },
      e10Link: 'Thêm về E10',
      do: ['Giữ mục tiêu zin trong <code>WOT Enrichment</code> L và H: 11.0-11.5 AFR (λ 0.75-0.78). Làm loãng là lựa chọn ở Bước 6.', 'Đo loãng hơn lệnh ở vùng Hz AFM cao? Hàng ở Bước 3 đã tính cả phần đó (các vòng tròn trên biểu đồ). Áp dụng hàng đó.', 'Áp suất xăng tụt khi kéo ga? Dừng ở đây: đó là do cấp xăng, không phải do khí.'],
      drive: ['Chạy đều 5 phút cho hết hầm nóng.', 'Kéo ga ở chế độ M, 2,500 → 6,000 rpm. Chỉ trên đường kín hoặc dyno.', 'Chạy nhẹ hai phút, rồi kéo lần hai.'],
      chart: 'Hòa khí khi đạp hết ga theo vòng tua', fromLatest: '(log gần nhất có kéo ga)', noPull: 'Log này không có lần đạp hết ga ổn định với AFR và AFR lệnh.',
      avgErr: 'Sai lệch trung bình', leanest: 'Loãng nhất khi có boost', fp: 'Áp suất xăng DI', notLogged: 'Không có trong log', ofTarget: '% mục tiêu', lean: 'loãng', rich: 'giàu',
      legend: ['Đo thực tế (cảm biến A/F)', 'Lệnh (ECU)', 'Giới hạn loãng 12.0 (λ 0.82)'], limit: 'giới hạn loãng',
      axis: 'Vòng tua (rpm) · AFR theo thang xăng', chartLabel: 'Tỉ lệ hòa khí đo được so với lệnh trong lần kéo ga',
      pull: 'Lần kéo 1: boost so với mục tiêu', pullLegend: ['Boost (thực tế)', 'Boost mục tiêu'], pullAxis: 'Vòng tua (rpm) · boost tính bằng psi', pullLabel: 'Boost và boost mục tiêu trong lần kéo đầu', overshoot: 'Vọt'
    },
    s5: {
      why: 'Một log buổi sáng đẹp chưa phải bằng chứng. Trường hợp xấu nhất ở đây là 35 °C sau hai mươi phút kẹt xe: khí nạp bị hầm nóng, {cvt} nóng, và biên độ kích nổ mỏng nhất. Bản tune phải qua được cả hai.',
      cvtLink: 'dầu CVT',
      cool: 'Buổi sáng mát', coolBody: 'Lặp lại cách chạy ở Bước 2, có hai lần kéo ga.',
      hot: 'Buổi chiều nóng', hotBody: 'Từ 32 °C trở lên. Hai mươi phút kẹt xe, năm phút chạy đều, rồi một lần kéo ga.',
      notLoaded: 'Chưa nạp', which: 'Log nào',
      boostTip: 'Downpipe làm boost vọt quá +2.5 psi: giảm <code>Boost Target</code> (Normal, L và H) 1 psi chỉ ở 2,500-3,250 rpm, rồi log lại.',
      boostLink: 'Vì sao bị vọt', done: 'Xong giai đoạn A: nhiên liệu đã khớp đồ độ.'
    },
    s6: {
      locked: '<strong>Làm xong Bước 5 trước.</strong> Chỉ tăng công suất trên bản tune đã qua log buổi chiều nóng.',
      why: function (peak) { return 'Map của bạn đã đặt ' + peak + ' psi từ 3,500 rpm. Với E10 RON95 trong thời tiết nóng ở đây, như vậy đã gần mức trần hợp lý. Cái lợi dễ lấy bây giờ là hòa khí bớt lãng phí và giữ ECU không phải lùi lửa. Boost để sau cùng, và không bao giờ dưới 3,000 rpm: {why}.'; },
      whyLink: 'vì sao',
      l1: 'Thay đổi 1 · Làm loãng nhẹ hòa khí tải tối đa', first: 'Trước tiên',
      l1Body: 'Trong <code>WOT Enrichment</code> L và H, ba cột tải tối đa: 11.0 → 11.5 AFR (λ 0.78) từ 3,000 rpm, 11.3 (λ 0.77) từ 5,500 rpm. Kỳ vọng dải giữa bốc hơn và tiết kiệm xăng hơn một chút, không phải một con số lớn trên dyno.',
      l1Head: ['rpm', 'Cột 7', 'Cột 8', 'Cột 9'],
      l1Pass: '<strong>Đạt khi:</strong> log tiếp theo có lùi lửa từ 1° trở xuống, IAT từ 50 °C trở xuống, và hòa khí đo được lệch không quá 0.3 so với lệnh mới.',
      l2: 'Thay đổi 2 · Thêm một psi, chỉ ở dải giữa', l2Tag: 'Chỉ sau khi thay đổi 1 qua được log nóng',
      ceiling: 'Trần boost của bạn (psi)',
      peakToday: function (peak) { return 'Đỉnh map hiện tại: ' + peak + ' psi · xe zin đời 11 ≈ 16.5 psi'; },
      atCeiling: 'Không đổi boost: map của bạn đã chạm trần. Chỉ nâng trần nếu một thợ tune xem log ngày nóng của bạn đồng ý.',
      l2Head: ['rpm', 'Các ô tải tối đa trong Boost Target 1, 2, 3 · Normal · L và H'],
      l2Rules: '<strong>Quy tắc:</strong> không đụng dưới 3,000 rpm, mỗi log một psi, và dừng ngay ở lần kích nổ lặp lại đầu tiên.',
      alone: [
        ['Đánh lửa base và max', 'Knock control đã tự tìm góc đánh lửa. Thêm nữa với RON95 lúc trời nóng chỉ mua thêm kích nổ, không thêm công suất.'],
        ['Độ nhạy kích nổ', 'Giảm độ nhạy chỉ che kích nổ. Nó không làm kích nổ biến mất.'],
        ['Áp suất xăng DI mục tiêu', 'Zin là đủ ở mức công suất này. Bảng của bạn tối đa 18,000 kPa (180 bar).'],
        ['Giới hạn nạp xi-lanh, boost theo số', 'Lớp bảo vệ mô-men của ECU cho CVT.'],
        ['VTC xả', 'Cần dyno để chứng minh có lợi.']
      ]
    },
    s7: {
      why: 'Trước khi coi là xong, một người tune bằng KTuner hoặc Hondata xem cùng bằng chứng. App chạy các kiểm tra tham chiếu; người duyệt kiểm tra những gì phần mềm không thấy.',
      ticks: [
        ['logs', 'Đã xem log: trim, hòa khí khi đạp hết ga, kích nổ, áp suất xăng, boost, IAT, nhiệt CVT'],
        ['diff', 'Chỉ các bảng dự định mới thay đổi (so với map gốc)'],
        ['untouched', 'Đánh lửa, độ nhạy kích nổ, áp suất DI, giới hạn nạp và VTC giữ nguyên'],
        ['mech', 'Đã kiểm tra cơ khí: test xì boost, không xì khí thải trước cảm biến A/F']
      ],
      reviewer: 'Người duyệt', reviewerPh: 'Tên, tiệm hoặc nick diễn đàn', uses: 'Tune bằng', both: 'KTuner và Hondata',
      approve: 'Chấp thuận', changes: 'Cần sửa', notes: 'Ghi chú', notesPh: 'Cần sửa gì, hoặc lần sau cần chú ý gì',
      packetNote: 'Dán vào Zalo hoặc nhóm tune của bạn, kèm các file log CSV. Định dạng Markdown giữ bảng dễ đọc.',
      copy: 'Sao chép gói duyệt', copied: 'Đã sao chép', manual: 'Đã chọn: nhấn Ctrl+C', download: 'Tải .md'
    },
    check: {
      load: 'Nạp log CSV', or: 'hoặc thử log mô phỏng:', drop: 'Thả file CSV vào đây',
      empty: {
        2: 'Chưa có log gốc. Nạp CSV từ lần chạy ở trên, hoặc thử Mẫu A để xem một log trông thế nào.',
        3: 'Nạp log bạn ghi sau khi nạp AFM Flow đã hiệu chỉnh. Mẫu B cho thấy thế nào là đạt.',
        4: 'Nạp log có hai lần đạp hết ga. Trong lúc chờ, biểu đồ dùng log lưu lượng khí gần nhất.',
        5: 'Nạp log buổi sáng mát trước, rồi chuyển sang Buổi chiều nóng.',
        '5hot': 'Nạp log buổi chiều nóng. Mẫu C là một xe chưa sẵn sàng.',
        6: 'Nạp log bạn ghi sau khi áp dụng một thay đổi.'
      },
      facts: function (an, F) { return F.num(an.meta.duration / 60, 1) + ' phút · ' + an.events.length + ' lần kéo ga · ' + F.num(an.closedLoopSeconds / 60, 1) + ' phút chạy đều · ' + an.meta.rows + ' dòng'; },
      whatToDo: 'Cần làm gì',
      columns: 'Các cột trong log', columnsNote: 'Được nhận diện tự động. Sửa cột nào app chọn sai; log sẽ được kiểm tra lại ngay.',
      none: 'Không có', sampleCsv: 'Tải mẫu này dạng CSV'
    },
    hints: {
      e10: { title: 'E10 và các con số AFR', paras: ['E10 là xăng pha 10 % ethanol. Tỉ lệ cháy hoàn toàn của nó khoảng 14.1:1, không phải 14.7:1. ECU và cảm biến A/F làm việc theo lambda (λ), trong đó 1.00 luôn là hòa khí chuẩn với mọi loại xăng.', 'KTuner và Hondata hiển thị AFR = λ × 14.7. Nên 14.7 trên màn hình vẫn là λ 1.00 với E10, và mục tiêu 11.0 là λ 0.75. Giữ nguyên mục tiêu.'], facts: [['Chạy đều', 'λ 1.00 · hiển thị 14.7'], ['Đạp hết ga', 'λ 0.75-0.82 · hiển thị 11.0-12.0']], note: 'Xăng E10 bắt buộc trên toàn quốc từ 1/6/2026 (E5 RON92 vẫn bán tới hết 2030). E10 ít năng lượng hơn khoảng 3 % mỗi lít: fuel trim sẽ hơi dương và tốn xăng hơn một chút.' },
      trims: { title: 'Fuel trim (STFT + LTFT)', paras: ['Lượng xăng ECU thêm hoặc bớt để giữ λ 1.00 khi nổ không tải và chạy đều. STFT phản ứng tức thì; LTFT là phần ECU đã học. Đọc cả hai cùng nhau: +8 % nghĩa là máy đang loãng và ECU thêm 8 % xăng.', 'Sau khi thay cổ hút, trim dương trên khắp dải AFM nghĩa là cảm biến đọc thiếu khí. Bước 3 chuyển phần bù đó vào bảng AFM Flow, nơi nó có tác dụng cả khi đạp hết ga.'], bands: [['good', 'trong ±5 %'], ['watch', '±5 tới ±10 %'], ['stop', 'vượt ±10 %']], note: 'Hướng dẫn trên diễn đàn Hondata coi ±10 % là chấp nhận được. App này nhắm ±5 % để vùng đạp hết ga bắt đầu chính xác.' },
      afm: { title: 'Bảng AFM Flow', paras: ['Cảm biến lưu lượng khí báo về một tần số (Hz). Bảng AFM Flow đổi nó thành gram khí mỗi giây qua 103 điểm, từ 2,031 tới 10,000 Hz. Họng lớn hơn cho nhiều khí đi qua hơn ở cùng tần số, nên bảng phải đổi theo.', 'KTuner có sẵn đường cong cho một số họng (PRL Race, 27WON Race). Nếu họng của bạn có, bắt đầu từ đó; app sẽ tinh chỉnh tiếp từ log của bạn.'], facts: [['Hình dạng', 'Tăng ở mọi điểm'], ['Dư địa', 'Đỉnh dưới 9,500 Hz khi kéo ga']] },
      loop: { title: 'Vòng kín và vòng hở', paras: ['Khi nổ không tải và chạy đều, ECU chạy vòng kín: đọc cảm biến A/F và chỉnh xăng về λ 1.00. Khi đạp hết ga, ECU chạy vòng hở: tin số đọc AFM và bảng mục tiêu WOT, còn trim ngừng tác dụng.', 'Vì vậy thứ tự rất quan trọng. Sửa AFM trước, nơi trim cho thấy sai lệch. Rồi kiểm tra riêng lúc đạp hết ga, nơi chỉ cảm biến A/F cho thấy sai lệch.'] },
      afr: { title: 'Kiểm tra hòa khí khi đạp hết ga', paras: ['Lệnh là thứ ECU yêu cầu. Đo thực tế là thứ cảm biến A/F zin thấy trong downpipe. Khi đạp hết ga, hai con số phải khớp trong khoảng 0.3 AFR.'], bands: [['good', 'trong ±0.3 AFR'], ['watch', 'lệch 0.3 tới 0.6 AFR'], ['stop', 'lệch quá 0.6, hoặc loãng hơn 12.0 (λ 0.82) khi có boost']], note: '0.6 giây đầu mỗi lần kéo ga được bỏ qua: cảm biến trễ hơn lệnh.' },
      knock: { title: 'Lùi lửa do kích nổ', paras: ['Số độ đánh lửa ECU rút bớt khi cảm biến kích nổ nghe thấy tiếng gõ. Một lần 0.5-1° ở một máy thường chỉ là nhiễu. Nhiều máy cùng lúc, cùng vòng tua, lần kéo nào cũng bị, mới là kích nổ thật.'], bands: [['good', 'từ 1° trở xuống'], ['watch', '1 tới 3°'], ['stop', 'quá 3°, hoặc nhiều máy cùng lúc']], note: 'Sửa nguyên nhân: nhiệt, xăng hoặc boost. Không bao giờ giảm độ nhạy kích nổ để con số biến mất.' },
      kcontrol: { title: 'Knock control', paras: ['Mức ECU đã chuyển từ góc đánh lửa cho xăng octane cao sang góc an toàn cho xăng octane thấp. Nó tăng khi kích nổ còn xảy ra và giảm chậm lại sau đó. Hãy đọc xu hướng trong cả log, không phải một con số.'] },
      boost: { title: 'Boost mục tiêu và thực tế', paras: ['Mục tiêu là mức ECU yêu cầu turbo; thực tế là mức turbo tạo ra. Downpipe giảm áp suất ngược, nên turbo lên sớm hơn và có thể vọt quá ngay lúc chạm mục tiêu.'], bands: [['good', 'vọt dưới +1.5 psi'], ['watch', '+1.5 tới +2.5 psi'], ['stop', 'quá +2.5 psi']], note: 'Map của bạn đặt 13 psi ở 1,600-2,250 rpm, tăng lên 21 psi từ 3,500 rpm. Xe zin đời 11 đạt đỉnh khoảng 16.5 psi.' },
      iat: { title: 'Nhiệt độ khí nạp', paras: ['Khí nóng dễ kích nổ hơn và ECU sẽ rút góc đánh lửa. Với intercooler lớn, cao hơn nhiệt độ môi trường 10-15 °C khi kéo ga là bình thường. Sau hai mươi phút kẹt xe trong thành phố, nó có thể vượt 60 °C.'], bands: [['good', 'từ 50 °C trở xuống khi kéo ga'], ['watch', '50 tới 60 °C'], ['stop', 'quá 60 °C']], note: 'Chạy đều năm phút trước mỗi lần kéo ga có log để hết hầm nóng.' },
      ect: { title: 'Nhiệt độ nước làm mát', paras: ['Bình thường là 85-100 °C. Quá 105 °C, ngừng log và kiểm tra két nước, quạt và mức nước trước lần kéo tiếp theo.'] },
      cvt: { title: 'Nhiệt độ dầu CVT', paras: ['Quá khoảng 100 °C, dây đai có thể trượt và ECU cắt mô-men để bảo vệ CVT. Két làm mát tạo thêm biên độ khi kẹt xe; log sẽ chứng minh điều đó.'], bands: [['good', 'từ 90 °C trở xuống'], ['watch', '90 tới 100 °C'], ['stop', 'quá 100 °C']], note: 'Xe đã tune đi trong kẹt xe nóng nên thay dầu CVT sớm hơn sách hướng dẫn.' },
      fuelPress: { title: 'Áp suất xăng DI', paras: ['Bơm cao áp cấp xăng cho kim phun trực tiếp. Khi đạp hết ga, áp suất thực tế phải giữ trong khoảng 10 % so với mục tiêu. Nếu tụt, bơm đã tới giới hạn, và thêm boost sẽ bị loãng.'], note: 'Bảng áp suất DI mục tiêu của bạn tối đa 18,000. Đơn vị là kPa (180 bar), không phải psi.' },
      cvtbelt: { title: 'Vì sao boost vòng tua thấp giữ zin', paras: ['Mô-men cao ở vòng tua thấp và tốc độ thấp là việc nặng nhất với dây đai CVT. Map của bạn cố ý giữ boost thấp ở đó: 13 psi ở 1,600-2,250 rpm và 15 psi ở 2,500 rpm.', 'Phần tăng công suất nên nằm ở dải vòng tua cao hơn, nơi máy tạo công suất mà không có cú giật mô-men ở tốc độ thấp.'] },
      torque: { title: 'Mô-men xoắn động cơ', paras: ['Đây là số ECU ước tính, và không phải log nào cũng có. Nếu log của bạn có, giữ đỉnh không vượt trần CVT: mặc định 280 Nm, so với 240 Nm zin.'], note: 'Để so sánh: map cơ bản của Hondata cho CVT đời 11 thêm khoảng 40-50 lb-ft (55-68 Nm) với xăng 91 octane ở Mỹ.' }
    },
    terms: [['e10', 'E10 và λ'], ['trims', 'Fuel trim'], ['afm', 'AFM Flow'], ['loop', 'Vòng kín, vòng hở'], ['afr', 'Kiểm tra WOT'], ['knock', 'Lùi lửa kích nổ'], ['kcontrol', 'Knock control'], ['boost', 'Boost'], ['iat', 'Nhiệt khí nạp'], ['ect', 'Nhiệt nước làm mát'], ['cvt', 'Nhiệt dầu CVT'], ['fuelPress', 'Áp suất xăng'], ['cvtbelt', 'Boost vòng tua thấp'], ['torque', 'Mô-men']],
    explain: 'Giải thích', termsTitle: 'Thuật ngữ',
    sources: { title: 'Nguồn của các con số', items: en_sources() },
    nav: { back: 'Quay lại', next: { 1: 'Tiếp: log gốc', 2: 'Tiếp: lưu lượng khí', 3: 'Tiếp: nhiên liệu khi đạp hết ga', 4: 'Tiếp: xác nhận mát và nóng', 5: 'Tiếp: tăng công suất (tuỳ chọn)', 6: 'Tiếp: duyệt' } },
    packet: {
      title: 'Civic FE Tune Assist: gói duyệt',
      car: 'Xe', fuel: 'Xăng', tool: 'Phần mềm', mods: 'Đồ độ', stage: 'Giai đoạn', stageA: 'A (nhiên liệu khớp đồ độ)', date: 'Ngày', none: 'chưa liệt kê',
      changes: 'Thay đổi',
      afm: function (s, F) { return 'AFM Flow (Custom): đổi ' + s.stats.changed + '/' + s.after.length + ' điểm, từ ' + F.signed(Math.min.apply(null, s.pct), 1, '%') + ' tới ' + F.signed(Math.max.apply(null, s.pct), 1, '%') + '.'; },
      afmNone: 'AFM Flow: không đổi', wot: 'Mục tiêu AFR WOT', boost: 'Boost mục tiêu', unchanged: 'không đổi',
      evidence: 'Bằng chứng',
      evidenceLine: function (an, F) { return F.num(an.meta.duration / 60, 1) + ' phút, ' + an.events.length + ' lần đạp hết ga, ' + F.num(an.closedLoopSeconds / 60, 1) + ' phút chạy đều'; },
      verdict: 'Kết luận', noLog: 'Chưa nạp log xác nhận.', table: ['Cổng', 'Trạng thái', 'Số liệu'],
      refs: 'Kiểm tra tham chiếu', reviewer: 'Người duyệt', name: 'Tên', uses: 'Dùng', decision: 'Quyết định', decisionBlank: 'Chấp thuận / Cần sửa', notes: 'Ghi chú'
    },
    mods: { intake: 'Cổ hút lưu lượng lớn', downpipe: function (t) { return 'Downpipe (' + (t === 'catless' ? 'không cat' : 'có cat') + ')'; }, frontpipe: 'Front pipe', catback: 'Pô sau', ic: 'Intercooler lớn', cvtCooler: 'Két làm mát CVT' },
    errors: { read: function (n) { return 'Không đọc được ' + n + '.'; } }
  };

  function en_sources() { return en.sources.items; }
  vi.sources.items = en.sources.items;

  window.KTA_I18N = { en: en, vi: vi };
})();

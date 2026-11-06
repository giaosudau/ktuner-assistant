/* Civic FE Tune Assist: interface text, English. Plain CommonJS: i18n-map.js is the entry (it requires i18n-drive.js, which requires this).
 * Dynamic strings are functions of the engine's structured data (d) and formatter (F). */
(function () {
  'use strict';
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  // The engine sends the numbers (KTA.LIMITS.score.highRpm, owner-voices.md §3:
  // the non-Si ECU raises the score above that on purpose); the sentence says plainly
  // why those rises do not count.
  // `sep` joins it to the line: '. ' mid-sentence, ' ' after a full stop.
  function highRpmNote(d, F, sep, clause) {
    if (!d || !isNum(d.highRpmPeak) || !(d.highRpmPeak > d.judgedPeak)) return '';
    return sep + clause;
  }
  function n2(F, v) { return F.num(v, 2); }
  function n0(F, v) { return F.num(v, 0); }

  var en = {
    code: 'en',
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
      { title: 'Full-throttle fuel', sub: 'Measured matches commanded', goal: 'At full throttle, get the mixture you ask for. Trims don’t work there, so check it directly.', done: 'Within 0.5 AFR of the map at 12 psi and up, never 1.0 leaner held 0.3 s' },
      { title: 'Confirm cool and hot', sub: 'Morning, then afternoon traffic', goal: 'Prove the tune in Vietnam’s worst case, not only on a cool morning.', done: 'Both logs finish without a Stop' },
      { title: 'Gain, one lever at a time', sub: 'Optional, after Step 5', goal: 'Small, safe gains where the CVT can take them.', done: 'A clean log after each lever' },
      { title: 'Review and sign-off', sub: 'A second tuner checks it', goal: 'Someone who tunes with KTuner or Hondata reviews the evidence before you call it done.', done: 'The reviewer approves' }
    ],
    stepOf: function (n, group) { return 'Step ' + n + ' of 7 · ' + group; },
    chips: { done: 'Done', here: 'You are here', progress: 'In progress', todo: 'To do', optional: 'Optional', after5: 'After Step 5' },
    doneWhen: 'Done when', doneTag: 'Done',
    loop: { title: 'The loop, every time', flow: ['Edit', 'Flash', 'Log', 'Check'], note: 'One change per flash. If a check says Stop, undo the last change before anything else.', tables: 'tables edited (+1 optional)', logs: 'logs to finish Stage A' },
    status: { good: 'OK', watch: 'Watch', stop: 'Stop', nodata: 'Can\'t tell' },
    verdict: { good: 'OK', watch: 'OK to continue, carefully', stop: 'Fix this before you continue', nodata: 'Can\'t tell: not enough in this log to judge' },
    gates: { fuel: 'Fuel', air: 'Air', spark: 'Spark', heat: 'Heat', cvt: 'CVT' },
    checks: {
      trims: { label: 'Fuel trims (cruise)', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' %') + (isNum(d.hz) ? ' at ' + F.hz(d.hz) : '') : 'No steady cruise found'; }, fix: function () { return 'The ECU is correcting fuel against the air meter. Wide trims in every airflow bin mean the wrong air-meter preset or unmetered air after it; trims off in some bins only point at one airflow range. Check what changed since the last Drive.'; } },
      wotAfr: { label: 'Mixture at 12 psi and up', display: function (d, F) { return isNum(d.measured) ? F.num(d.measured, 1) + ' AFR at 12 psi and up, map asks ' + F.num(d.target, 1) + (d.diff < -0.05 ? ' (richer: safe)' : '') : 'No time at 12 psi or more'; }, fix: function (d, F) { if (d.leanStop) return 'Stop pulls: the fuel asked for isn\'t arriving (fuel pump, AFM preset or injector). Fix fuel before any more full-throttle runs.'; return 'Leaner than the map asks at 12 psi and up: the fuel asked for is not fully arriving, or the air meter over-reads at that flow. Leave the map alone and check fuel supply and the air-meter reading first.'; } },
      fuelPress: { label: 'DI fuel pressure at WOT', display: function (d, F) { return isNum(d.value) ? F.num(d.value * 100, 0) + ' % of target (worst 5 %)' : 'Not logged'; }, fix: function () { return 'The high-pressure pump is at its limit. Do not add boost. Check the fuel filter; E10 needs about 4 % more fuel.'; } },
      overshoot: { label: 'Boost overshoot', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' psi') + (isNum(d.rpm) ? ' at ' + F.num(d.rpm) + ' rpm' : '') : 'Needs boost and boost target'; }, fix: function () { return 'Boost passes the pressure the ECU asked for: the exhaust is delivering air faster than the wastegate control expected, usually a freer exhaust system. Rides the overshoot, then the ECU pulls timing for it. Check the exhaust and the wastegate before anything else.'; } },
      undershoot: { label: 'Boost reaches target', display: function (d, F) { if (!isNum(d.value)) return 'Needs boost and boost target'; if (Math.abs(d.value) < 0.3) return 'On target after spool'; return F.num(Math.abs(d.value), 1) + ' psi ' + (d.value > 0 ? 'below' : 'above') + ' target after spool'; }, fix: function () { return 'Boost never reaches the pressure the ECU asked for. Warm-only misses point at the wastegate, misses even cold at a boost leak (intercooler couplers, clamps). Check the hoses and the wastegate before anything else.'; } },
      mafHz: { label: 'MAF sensor headroom', display: function (d, F) { return isNum(d.value) ? F.hz(d.value) + ' peak' : 'MAF Hz not logged'; }, fix: function () { return 'The air meter is near 10,000 Hz, the end of what it can measure. Above that the ECU cannot know how much air there is, so more boost would be unmeasured fuel. Leave it alone; it is not a fault to chase.'; } },
      knock: { label: 'Knock retard at WOT', display: function (d, F) { if (d.scheduled) return F.num(d.loadMedian, 1) + '° under boost, scheduled by Knock Control (not knock events)'; return isNum(d.value) ? F.num(d.value, 1) + '° worst' + (isNum(d.rpm) ? ' at ' + F.num(d.rpm) + ' rpm' : '') + (d.multi ? ', several cylinders together' : '') : 'Knock retard not logged'; }, fix: function () { return 'Find the cause before adding anything: heat soak, fuel, boost. Rises while lugging are a driving habit; rises under load are fuel or heat. The Fuel-quality score line and the Drive check show where it came from. Never desensitize the knock sensors.'; } },
      kControl: { label: 'Fuel-quality score (Knock Control)', display: function (d, F) { return isNum(d.end) ? F.num(d.start, 2) + ' → ' + F.num(d.end, 2) + (d.peak > Math.max(d.start, d.end) + 0.02 ? ' (peak ' + F.num(d.peak, 2) + ')' : '') + (d.timingCost >= 0.5 ? '. Under boost your score costs about ' + F.num(d.timingCost, 1) + '° of timing' : '') + (d.noHard ? '. No hard driving until it drops' : '') + (d.highStart ? '. Starts high after a Flash, ECU reset or new tank: give it 10–15 calm minutes before judging' : '') + highRpmNote(d, F, '. ', 'Above ' + n0(F, d.highRpmLimit) + ' rpm it reached ' + n2(F, d.highRpmPeak) + ': the ECU raises the score there on purpose, so those rises do not count toward this line') : 'Not logged'; }, fix: function (d, F) { return (d.noHard ? 'No hard driving until it drops below 0.62: fill RON95 E10 at a busy station, drive the ECO map (18 psi), and wait for a calm stretch.' : (d.high ? 'The ECU is pulling timing for fuel or heat. Add nothing; on hot days use ECO (18 psi).' : 'The ECU kept hearing knock during this drive and moved toward its safer timing. The Drive check shows where it rose; fix that before adding anything.')) + highRpmNote(d, F, ' ', 'Above ' + n0(F, d.highRpmLimit) + ' rpm it reached ' + n2(F, d.highRpmPeak) + ': the ECU raises the score there on purpose, so those rises do not count toward this line.'); } },
      iat: { label: 'Intake air temp', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C peak' + ({ pull: ' in a pull', load: ' under boost', moving: ' while moving' }[d.where] || '') : 'Not logged'; }, fix: function () { return 'Heat-soaked. Cruise 5 minutes to cool before a pull. If it stays high, check the intercooler airflow and the intake heat shield.'; } },
      ect: { label: 'Coolant temp', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C peak' + (d.cold ? ': never warmed to ' + n0(F, d.coldMin) + ' °C' : '') : 'Not logged'; }, fix: function (d, F) { return d.cold ? 'Coolant never reached ' + n0(F, d.coldMin) + ' °C on a drive long enough to warm up: the thermostat may be stuck open. This map turns its code (P0128) off, so the dash stays quiet. Have the thermostat checked.' : 'Stop logging until coolant is back under 95 °C. Check the radiator, fan and coolant level.'; } },
      cvtTemp: { label: 'CVT fluid temp', display: function (d, F) { return isNum(d.value) ? F.num(d.value, 0) + ' °C peak' : 'Not logged'; }, fix: function () { return 'Stop pulls and cruise gently until under 90 °C. Hot CVT fluid lets the belt slip, and the ECU cuts torque.'; } },
      slip: { label: 'CVT slip (revs without speed)', display: function (d, F) { return isNum(d.events) ? (d.events > 0 ? d.events + ' slip event' + (d.events === 1 ? '' : 's') + ' under boost' : 'No slip seen under boost') : 'Needs rpm, speed, boost and throttle'; }, fix: function () { return 'If the revs jump without speed under boost, the belt may be slipping. Log again with rpm, speed, boost and throttle; if it repeats, have the CVT fluid and belt checked.'; } },
      lowBoost: { label: 'Boost below 3,000 rpm', display: function (d, F) { return isNum(d.value) ? F.signed(d.value, 1, ' psi') + ' vs reference map' : 'Needs a pull and boost'; }, fix: function () { return 'More torque than the reference asks for below 3,000 rpm, which is where the CVT belt is most stressed. Log a pull at the same revs twice to confirm it is real before anyone changes the map.'; } }
    },
    readiness: {
      hzEstimated: function () { return 'Log has MAF g/s but no Hz: Hz estimated from your current MAF table.'; },
      noAfm: function () { return 'No MAF Hz or g/s column: the app can grade the log but cannot compute MAF corrections.'; },
      shortCruise: function (r) { return 'Only ' + r.seconds + ' s of steady warm cruise. Drive 5-10 minutes at steady speeds for a reliable MAF correction.'; },
      noPull: function () { return 'No full-throttle pull found. Fuel, Air and Spark under load stay unchecked.'; },
      fuelLimited: function () { return 'Fuel pressure fell under 90 % of target during a pull. Only pull samples with fuel pressure at 95 % of target or more feed the MAF correction: a lean reading there can come from fuel supply, not airflow.'; },
      missing: function (r, T) { return 'Not in this log: ' + r.keys.map(function (k) { return T.channels[k] || k; }).join(', ') + '.'; }
    },
    refs: {
      afmRising: function (d) { return d.none ? { label: 'AFM Flow correction', detail: 'No correction computed yet.' } : { label: 'AFM Flow curve rises at every point', detail: d.ok ? 'All ' + d.n + ' points rise.' : 'A point is not higher than the one before it.' }; },
      afmStep: function (d, F) { return { label: 'No AFM point moved more than ' + d.limit + ' % this round', detail: 'Largest change ' + F.signed(d.largest, 1, ' %') + '.' }; },
      afmDrift: function (d, F) { return { label: 'Total change vs the factory curve', detail: 'Up to ' + F.num(d.drift, 1) + ' % from factory' + (d.drift > 25 ? '. Large for a housing that should match a preset: confirm the intake preset.' : '.') }; },
      wotBand: function (d) { return { label: 'WOT targets inside 11.0-12.0 AFR (λ 0.75-0.82)', detail: d.bad && d.bad.length ? 'Outside the band at ' + d.bad.join(', ') + ' rpm.' : 'Full-load columns from 3,000 rpm are in the band.' }; },
      boostPeak: function (d) { return { label: 'Boost map peak at or under your ceiling', detail: 'Peak ' + d.peak + ' psi, ceiling ' + d.ceiling + ' psi.' }; },
      boostLow: function (d) { return { label: 'No added boost below 3,000 rpm (CVT belt)', detail: d.changed ? d.raised + ' low-rpm cell(s) above the reference map.' : (d.cut ? d.cut + ' low-rpm cell(s) lowered, none raised.' : 'Same as the reference map.') }; },
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
        intake: { name: 'High-volume intake', effect: 'Changes how the MAF sensor reads air. Must be calibrated.', badge: 'Tune: Step 3' },
        downpipe: { name: 'Downpipe', effect: 'Spools sooner and can overshoot boost. The A/F sensor now sits in it: no leaks upstream.', badge: 'Check: boost' },
        frontpipe: { name: 'Front pipe', effect: 'A little more flow. No table change.', badge: 'No change' },
        catback: { name: 'Cat-back exhaust', effect: 'Sound. No tuning effect.', badge: 'No change' },
        ic: { name: 'Big intercooler', effect: 'Cooler intake air and steadier timing in heat. More joints: leak-test it.', badge: 'Check: IAT' },
        cvtCooler: { name: 'CVT cooler', effect: 'Keeps CVT fluid below the temperature where the belt slips.', badge: 'Check: CVT temp' }
      },
      notFitted: 'Not fitted',
      housing: 'AFM housing', presetOther: 'No KTuner preset: start from Custom', presetPrl: 'KTuner preset: PRL Race', presetWon: 'KTuner preset: 27WON Race',
      catalyst: 'Catalyst', catted: 'High-flow catted', catless: 'Catless',
      catlessWarn: 'Catless always sets a catalyst code (P0420) and risks the đăng kiểm tailpipe test + 65–75 M VND fine. A 400-cell catted pipe reports no code.',
      e10Note: 'Keep your AFR targets as they are. The ECU and the A/F sensor work in lambda, so E10 needs no target changes. Your logs prove it: cruise trims sit around -0.8 % (median), and under boost you run λ 0.69–0.73 against the 0.75 asked — richer than asked, so adding fuel gains nothing. E10 carries about 3 % less energy per litre. Fill at one station for the whole tune.',
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
      why: 'A bigger intake housing changes how the MAF sensor sees airflow. When the ECU under-reads air it under-fuels. At cruise the {trims} cover it up. At full throttle they switch off, and that is where engines get hurt. So the fix goes into the {afm}, not the trims.',
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
      why: 'At full throttle the ECU runs {loop}. It trusts the AFM reading and the WOT target table, and the trims do nothing. So we compare what the factory A/F sensor measured at 12 psi and up with the map\'s own full-load 11.0: {afr}.',
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
      e10: { title: 'E10 and your AFR numbers', paras: ['E10 is petrol with 10 % ethanol. Its chemically correct ratio is about 14.1:1, not 14.7:1. The ECU and the A/F sensor work in lambda (λ), where 1.00 is the correct mix on any fuel.', 'KTuner and Hondata show AFR as λ × 14.7. So 14.7 on screen is λ 1.00 on E10 too, and a target of 11.0 is λ 0.75. Keep your targets.'], facts: [['Cruise', 'λ 1.00 · shows 14.7'], ['Full throttle', 'λ 0.75-0.82 · shows 11.0-12.0']], note: 'E10 is mandatory for petrol nationwide from 1 June 2026 (E5 RON92 stays on sale until 2030). It carries about 3 % less energy per litre: your cruise trims sit around -0.8 % (median), so expect slightly higher consumption but no trim offset.' },
      trims: { title: 'Fuel trims (STFT + LTFT)', paras: ['How much fuel the ECU adds or removes to hold λ 1.00 at idle and cruise. STFT reacts instantly; LTFT is what it has learned. Read them together: +8 % means the engine ran lean and the ECU is adding 8 %.', 'Positive across the AFM range after an intake swap means the sensor under-reads air. Step 3 moves that correction into the AFM Flow table, where it also works at full throttle.'], bands: [['good', 'within ±5 %'], ['watch', '±5 to ±10 %'], ['stop', 'beyond ±10 %']], note: 'Hondata’s forum guidance treats ±10 % as acceptable. This app aims for ±5 % so the full-throttle end starts accurate.' },
      afm: { title: 'The AFM Flow table', paras: ['The air-flow meter reports a frequency in Hz. The AFM Flow table turns it into grams of air per second across 103 points, from 2,031 to 10,000 Hz. A bigger housing passes more air at the same frequency, so the table has to change with it.', 'KTuner ships curves for some housings (PRL Race, 27WON Race). Start from yours if it exists; the app then fine-tunes it from your logs.'], facts: [['Shape', 'Rises at every point'], ['Headroom', 'Peak under 9,500 Hz in a pull']] },
      loop: { title: 'Closed loop and open loop', paras: ['Idle and cruise run closed loop: the ECU reads the A/F sensor and trims fuel to λ 1.00. Full throttle runs open loop: the ECU trusts the AFM reading and the WOT target table, and the trims stop acting.', 'That’s why the order matters. Fix the AFM first, where the trims show the error. Then check full throttle on its own, where only the A/F sensor shows it.'] },
      afr: { title: 'Full-throttle mixture check', paras: ['Measured is what the factory A/F sensor sees in the downpipe, judged only at 12 psi and up, where your map asks its full-load 11.0 (λ 0.75). The lower-load columns ask 11.5 to 14.7, so part-load leanness is not judged.', 'A Stop here means the fuel asked for is not arriving (pump, AFM preset, injector) — not an absolute danger line.'], bands: [['good', 'within 0.5 AFR of the map at 12 psi and up'], ['watch', '0.5 to 1.0 AFR leaner than the map'], ['stop', '1.0 AFR or more leaner, held 0.3 s']], note: 'The first 0.6 s of each pull is skipped: the sensor lags the command.' },
      knock: { title: 'Knock retard', paras: ['Degrees of timing the ECU removes when a knock sensor hears detonation. One 0.5-1° blip on one cylinder is usually noise. Several cylinders together, at the same rpm, pull after pull, is real knock.'], bands: [['good', '1° or less'], ['watch', '1 to 3°'], ['stop', 'over 3°, or several cylinders together']], note: 'Fix the cause: heat, fuel or boost. Never turn the knock sensitivity down to make the number go away.' },
      kcontrol: { title: 'Fuel-quality score (Knock Control)', paras: ['How far the ECU has moved from its high-octane timing towards its safer low-octane timing. It climbs while knock keeps happening and eases back slowly.', 'Hondata’s scale: 0 % behaves like RON 100 fuel, 100 % like RON 90. RON95 sits near 0.5, so about 0.5 is normal on Vietnam E10 RON95. KTuner shows it from 0.00 to 1.30.', 'Judge it by the timing it costs under boost: 10.2° × (score − 0.49) from KTuner\'s formula, measured on your logs. On your Starter 21 pulls the score holds 0.49–0.52: the 21 psi map has knock margin in normal conditions.'], bands: [['good', '0.56 or less (costs under 0.7° of timing)'], ['watch', 'over 0.56; no hard driving from 0.62 held over 60 s (costs 1.3°)'], ['stop', '0.80 or more (provisional: not yet seen on your car)']], note: 'High on a hot afternoon? Switch to ECO (18 psi) and add nothing. A map that never makes the ECU pull timing is faster on a real Vietnamese day than one with more boost.' },
      boost: { title: 'Boost target and actual', paras: ['Target is what the ECU asks the turbo for; actual is what it makes. A downpipe lowers back-pressure, so the turbo spools sooner and can overshoot the moment it reaches target.'], bands: [['good', 'overshoot under +1.5 psi'], ['watch', '+1.5 to +2.5 psi'], ['stop', 'over +2.5 psi']], note: 'Your map asks for 13 psi at 1,600-2,250 rpm, rising to 21 psi from 3,500 rpm. The stock 11th-gen peak is about 16.5 psi.' },
      iat: { title: 'Intake air temperature', paras: ['Hot air knocks sooner and the ECU pulls timing for it. With a big intercooler, 10-15 °C over ambient in a pull is normal. After twenty minutes of city traffic it can pass 60 °C.'], bands: [['good', '50 °C or less in a pull'], ['watch', 'over 50 °C (never a Stop on its own)']], note: 'Cruise five minutes before a logged pull to clear heat soak. Heat alone never stops: the score\'s own limits catch heat turning into knock.' },
      ect: { title: 'Coolant temperature', paras: ['Normal is 85-100 °C. Over 105 °C, stop logging and check the radiator, fan and coolant level before another pull.'], note: 'Stop 105 °C is provisional: no Honda limit published in what was read.' },
      cvt: { title: 'CVT fluid temperature', paras: ['Past about 100 °C the belt can slip and the ECU cuts torque to protect the CVT. The cooler buys margin in traffic; the log proves it.'], bands: [['good', '90 °C or less'], ['watch', '90 to 100 °C'], ['stop', 'over 100 °C (provisional: not yet seen on your car)']], note: 'A tuned car in hot traffic should get its CVT fluid changed sooner than the book says. No Honda limit was published in what was read.' },
      fuelPress: { title: 'DI fuel pressure', paras: ['The high-pressure pump feeds the direct injectors. At full throttle, actual should stay within 10 % of target. If it sags, the pump is at its limit, and more boost would run lean.'], note: 'Your DI target table tops out at 18,000. Those are kPa (180 bar), not psi.' },
      cvtbelt: { title: 'Why low-rpm boost stays stock', paras: ['High torque at low rpm and low road speed is the hardest job for the CVT belt. Your map holds boost down there on purpose: 13 psi at 1,600-2,250 rpm and 15 psi at 2,500 rpm.', 'Gains belong higher in the rev range, where the engine makes power without a low-speed torque spike.'] },
      torque: { title: 'Engine torque and CVT slip', paras: ['TunerView logs no torque value, so the drive check has no torque line: the old 250 Nm figure was a 10th-gen FlashPro warning, and 11th-gen maps add about 50 lb-ft themselves.', 'Instead the log is watched for slip: revs jumping 250 rpm in 0.33 s while speed gains under 1 km/h under boost. Zero events in your 16 drives; the threshold is unproven against a real slip, so it only ever says Watch.'], note: 'For scale: KTuner quotes up to +58 lb-ft at 21 psi for your Starter 21 map, and Hondata’s 11th-gen CVT base map adds about 40-50 lb-ft on US 91 octane.' },
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
      ['https://iea-amf.org/content/fuel_information/ethanol/e10/ethanol_properties', 'IEA-AMF: E10 fuel properties'],
      ['https://ktuner.com/22civicturbo/', 'KTuner: Starter 21 Dual Tune for the 2022+ Civic 1.5T'],
      ['https://www.hondata.com/help/flashpro/knock_control_tables.htm', 'Hondata help: knock control tables']
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

  module.exports = en;
})();

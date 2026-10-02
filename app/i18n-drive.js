/* Text for the Drive check page: the 1-2-3 loop, the ranked actions, the engineering graphs and
 * the "Ask about this drive" helper, in English and Vietnamese. Extends window.KTA_I18N.
 * Functions take the engine's numbers (ev, I) and the formatter F; they never invent numbers. */
(function () {
  'use strict';
  var I18N = window.KTA_I18N;
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function n0(F, v) { return isNum(v) ? F.num(v, 0) : '-'; }
  function n1(F, v) { return isNum(v) ? F.num(v, 1) : '-'; }
  function n2(F, v) { return isNum(v) ? F.num(v, 2) : '-'; }

  var SOURCES = [
    ['https://www.hondata.com/forum/viewtopic.php?t=25913', 'Hondata forum: no knock at WOT, high knock control at low rpm and low load (1.5T)'],
    ['https://www.civicx.com/forum/threads/ktuner-hondata-and-s-mode-1-5t-cvt.39469/', 'CivicX: S mode still revs higher on a tuned 1.5T CVT'],
    ['https://www.civicx.com/forum/threads/knock-control-significance.29457/', 'CivicX: what knock control means on the 1.5T'],
    ['http://www.ktuner.com/KTunerHelp/ignition_timing_and_knock_control.htm', 'KTuner help: ignition timing and knock control'],
    ['https://en.wikipedia.org/wiki/Low-speed_pre-ignition', 'Low-speed pre-ignition: high load at low rpm in turbo DI engines'],
    ['https://www.kendallmotoroil.com/news/everything-you-need-to-know-about-gf-6-and-api-sp-motor-oil-standards/', 'API SP / ILSAC GF-6 oils: tested against low-speed pre-ignition']
  ];

  // ---------------------------------------------------------------------------
  // English
  // ---------------------------------------------------------------------------
  I18N.en.drive = {
    whyBtn: 'Why?',
    limits: {
      fuel: 'Limits: trims within ±5 %, mixture within 0.5 of the map’s 11.0, fuel pressure at 90 % of target or more.',
      air: 'Limits: overshoot no more than +2.5 psi, boost on target within ±1.5 psi after spool.',
      spark: 'Limits: score Watch at 0.56, no hard driving at 0.62 held 60 s, Stop at 0.80 (provisional).',
      heat: 'Limits: intake Watch at 50 °C in a pull (heat alone never Stops), coolant Stop at 105 °C (provisional).',
      cvt: 'Limits: CVT Watch at 90 °C, Stop at 100 °C (provisional); slip is Watch only.'
    },
    nav: { title: 'Drive check', sub: 'Your log, one thing to do' },
    startHere: 'Start here', navFull: 'Full method (AFM calibration)',
    eyebrow: 'Drive check · real TunerView logs',
    title: 'Drive, check, do one thing, prove it',
    goal: 'Load a normal drive. The app checks safety first, then ranks what to do: free habits before flashes, the biggest effect for the least work first. Do one thing, drive again, and let the next log prove it.',
    loop: [
      { title: 'Check a drive', empty: 'Load a KTuner TunerView CSV, or try one of your own three drives.', done: function (r) { return r; } },
      { title: 'Do one thing', empty: 'Your #1 appears here after a check.', active: 'Doing now' },
      { title: 'Prove it', empty: 'After you have done it, drive a similar route and load that log.', ready: 'Load the next drive to see if it worked.' }
    ],
    load: 'Load a TunerView CSV', loadNext: 'Load the next drive', another: 'Check another drive',
    examplesTitle: 'Your three drives (built in)',
    examples: {
      'aug30-1601': { title: 'Aug 30, 16:01 · hot traffic', note: '52 min, 36 °C afternoon, lots of 40-60 km/h' },
      'aug30-1529': { title: 'Aug 30, 15:29 · pulls to 19 psi', note: '19 min, eight hard pulls' },
      'sep01-0813': { title: 'Sep 1, 08:13 · cool morning', note: '40 min, intake 37 °C while moving' }
    },
    exampleNote: 'Your own logs, trimmed for the app: 13 unused channels dropped and every second sample kept (7.5 per second). The results match the full logs.',
    exampleLoading: 'Opening the example…', exampleError: 'This browser cannot open the built-in example. Load the CSV instead.',
    reading: 'Reading the log…', cameBack: 'You proved this before, and this drive shows it again.',
    asNext: 'Use as the next drive',
    source: { ktuner: 'KTuner TunerView', hondata: 'Hondata FlashPro', other: 'CSV' },
    facts: function (I, F) { return F.num(I.meta.duration / 60, 0) + ' min · ' + F.num(I.meta.rateHz, 1) + ' samples/s · ' + (I.boost ? I.boost.hard + ' hard pull' + (I.boost.hard === 1 ? '' : 's') : 'no boost channel'); },
    safeTitle: 'Is it safe?',
    safe: {
      good: 'Yes. Every check passed on this drive.',
      watch: 'Yes, with things to watch. Nothing here is damaging the engine; the list below fixes them in order.',
      stop: 'Not yet. Fix the Stop before any more hard pulls.',
      nodata: 'Not enough in this log to say. Log a longer drive with the engine warm.'
    },
    nowTitle: 'Your #1 now', nextTitle: 'Up next, in order', laterTitle: 'Later: locked until', fineTitle: 'Checked and fine',
    doNow: 'Do now',
    noActions: 'Nothing to fix. Enjoy it, and log a hot afternoon now and then.',
    why: 'Why', steps: 'Do this', proof: 'How the next log proves it', undo: 'Undo', rankWhy: 'How the order is decided',
    rankRules: [
      'Anything that says Stop comes first, worst first (knock and a lean mixture before heat and the CVT). While a Stop is open, nothing else is.',
      'Everything else is scored: 3 × effect − 2 × effort − 2 × risk − 1 if it needs a flash, + 2 × how directly this log shows it. Free habits usually win.',
      'An action that needs something first is locked, with exactly what unlocks it. Gain levers stay locked until the car is proven healthy.',
      'The same log always gives the same list. One thing at a time: the next log proves it before the next item.'
    ],
    reviewLink: 'Product review: why the app works this way (docs/PRODUCT-REVIEW.md)',
    badges: {
      impact: ['', 'Small effect', 'Medium effect', 'Big effect'],
      effort: ['', 'Minutes', 'An hour', 'Flash and logs'],
      flash: 'Needs a flash', noFlash: 'No flash', free: 'Free', risk: ['No risk', 'Low risk', 'Some risk'],
      tier: { safety: 'Safety', drive: 'Habit', data: 'Logging', hardware: 'Hardware check', tune: 'Tune edit', gain: 'Gain' }
    },
    start: 'Start: I will do this', stopDoing: 'Stop doing this', doing: 'Doing now', startedOn: function (d) { return 'Started ' + d; },
    unlocksWhen: 'Unlocks when',
    proveTitle: 'Did it work?',
    verdicts: { keep: 'It worked: keep it', partial: 'Better, not there yet', retry: 'No change yet', undo: 'Undo it', stop: 'Stop: a new safety problem', inconclusive: 'Cannot tell from these two drives' },
    verdictHelp: {
      keep: 'Marked done. The list below moved up one.',
      partial: 'Keep doing it. The next item that needed this is now open.',
      retry: 'Do it again on the next drive. Habits take a few drives.',
      undo: 'Put back what you changed (see Undo), then log again.',
      stop: 'A check that was fine is now a Stop. Fix that first.',
      inconclusive: 'The drives are not comparable yet. Drive again in similar conditions.'
    },
    reasons: {
      cooler: 'The second drive was much cooler. A cool drive cannot prove a heat or knock fix.',
      short: 'The second drive is too short (under 10 minutes of moving).',
      noPulls: 'The second drive has no hard pull to compare.',
      noKc: 'Knock Control is not in the second log.',
      noData: 'The second log does not have that channel.',
      accelNotMatched: 'The two drives have no matching acceleration run (same speed window, foot down, similar intake temperature).',
      lessTown: 'The second drive had much less town driving (15-60 km/h), where lugging shows.',
      notHotRestart: 'The second drive is no hot restart, so it cannot prove the hot-restart habit.'
    },
    keepNext: 'Keep it and go to the next item', undoIt: 'I undid it', tryAgain: 'Try again',
    before: 'Before', after: 'After',
    metricNames: {
      lugShare: 'Lugging (% of moving time)', pullIat: 'Intake air at pull start (°C)', cvtMax: 'CVT peak (°C)', kcEnd: 'Knock Control at the end',
      channels: 'Missing channels', iatMoving: 'Intake air while moving (°C)', trimWorst: 'Worst fuel trim (%)', wotAfr: 'Full-load AFR', kcRise: 'Knock Control rise', accel: '50→70 km/h (s)', firstPullIAT: 'First pull intake (°C)'
    },
    actions: {
      revs: {
        title: 'Keep the revs up in hot traffic',
        why: function (ev, F) {
          var s = ev.rises
            ? 'Knock Control climbed from ' + n2(F, ev.kcFrom) + ' to ' + n2(F, ev.kcTo) + ' while you drove at about ' + n0(F, ev.riseRpm) + ' rpm with a light-to-medium pedal. '
            : 'On this hot drive, ' + n1(F, ev.lugShare) + ' % of your moving time was lugging, with up to ' + n1(F, ev.kr) + '° of scheduled retard there. ';
          s += ev.rises ? n1(F, ev.lugShare) + ' % of your moving time was at 900-1,700 rpm with load: the CVT holds low rpm in D, and that is where this engine knocks on hot E10. ' : 'That is where this engine knocks first on hot E10. ';
          return s + 'When Knock Control rises, the ECU takes timing away everywhere, so the car feels flat for the rest of the drive.';
        },
        steps: [
          'Below 60 km/h on hot days, drive in S (or tap a paddle) when you press past about a third of the pedal. Aim for 2,000 rpm or more when you ask for torque.',
          'Let D drop the revs only for light cruising. Do not press hard at 1,300-1,700 rpm: ease off or shift down first.',
          'Drive a similar hot afternoon route with the same logging, then load it in step 3.'
        ],
        proof: function (ev, F) { return 'Lugging under ' + F.num(Math.max(2, ev.lugShare * 0.6), 1) + ' % of moving time, and Knock Control not rising (this drive: ' + n2(F, ev.kcFrom) + ' → ' + n2(F, ev.kcTo) + ').'; },
        undo: 'Nothing to undo: it is a habit. It costs a little fuel in town.',
        note: 'Owners report the same on the Hondata forum: Knock Control climbing at 1,300-1,700 rpm just below 0 psi while full throttle stays clean. High load at low rpm is also where turbo DI engines risk low-speed pre-ignition; API SP / GF-6 oils are tested against it.'
      },
      hotRestart: {
        title: 'Give a hot restart 3–5 minutes before any hard acceleration',
        why: function (ev, F) { return 'This drive started ' + (ev.gapMin != null ? n1(F, ev.gapMin) + ' minutes after the previous one ' : '') + 'with intake air already at ' + n0(F, ev.startIAT) + ' °C, and the first hard pull began ' + n0(F, ev.firstPullT) + ' s in at ' + n0(F, ev.firstPullIAT) + ' °C. Pulling hard on heat-soaked air is where this engine knocks first.'; },
        steps: [
          'After a hot restart, drive 3–5 minutes of moving air before any hard acceleration, and wait for IAT at 48 °C or less.',
          'No pulls straight out of a car park, a fuel stop or a traffic queue.',
          'Log your next hot restart the same way and load it in step 3.'
        ],
        proof: function (ev, F) { return 'The next hot restart\'s first pull starts at 48 °C or less (this drive: ' + n0(F, ev.firstPullIAT) + ' °C).'; },
        undo: 'Nothing to undo: it is a habit.'
      },
      cooldown: {
        title: 'Cool the intake before a pull',
        why: function (ev, F) { return 'Your hard pulls started with intake air at ' + n0(F, ev.pullIat) + ' °C (up to ' + n0(F, ev.pullIatMax) + ' °C). Standing still, it soaks to ' + n0(F, ev.soak) + ' °C; moving air brings it to ' + n0(F, ev.moving) + ' °C. Hot air makes the ECU take timing away and raises the knock risk: a slower pull, and a less safe one.'; },
        steps: [
          'Before a hard pull, drive 1-2 minutes at steady speed and wait for IAT under 48 °C (45 is better).',
          'No pulls straight after a traffic light queue, a car park or a long idle.',
          'Log your next pulls and load the log in step 3.'
        ],
        proof: function (ev, F) { return 'Pulls start at 48 °C or less (this drive: ' + n0(F, ev.pullIat) + ' °C).'; },
        undo: 'Nothing to undo: it is a habit.'
      },
      cvtHeat: {
        title: 'Protect the CVT when it is hot',
        why: function (ev, F) { return 'CVT fluid reached ' + n0(F, ev.cvtMax) + ' °C (' + n0(F, ev.cvtMed) + ' °C typical while driving). Above 90 °C the fluid thins, the belt can slip under full torque, and the ECU trims torque to protect it.'; },
        steps: [
          'Before any pull, check CVT temperature: under 90 °C. Above that, drive gently until it drops.',
          'No hard launches from a stop in traffic: they load the belt most.',
          'If it passes 95 °C in normal driving, check the CVT cooler (clean fins, in moving air, not behind the intercooler) and the fluid age.'
        ],
        proof: function (ev, F) { return 'CVT at 90 °C or less, or no pull started above 90 °C (this drive: ' + n0(F, ev.cvtMax) + ' °C peak).'; },
        undo: 'Nothing to undo.'
      },
      fuelCheck: {
        title: 'Check the fuel: Knock Control is high',
        why: function (ev, F) { return 'Knock Control ended at ' + n2(F, ev.kcEnd) + ' (it started at ' + n2(F, ev.kcStart) + '). Above 0.65 the ECU treats your fuel as worse than RON95 and runs its safer timing everywhere.'; },
        steps: [
          'Fill up with RON95 E10 at a busy station and drive gently for a tank.',
          'Until Knock Control is back under 0.6, drive the ECO map (18 psi).',
          'If it stays high after two tanks, have the injectors and intake valves checked: carbon builds up on DI engines.'
        ],
        proof: function () { return 'Knock Control ends at 0.65 or less on a similar drive.'; },
        undo: 'Nothing to undo.'
      },
      data: {
        title: 'Log the channels that are missing',
        why: function (ev) {
          var names = ev.missing.map(function (k) { return { afrCmd: 'the AFR (lambda) command', mafHz: 'the AFM flow (Hz or g/s)' }[k] || k; }).join(' and ');
          return 'This log has no ' + names + '. Without the AFR command the app cannot tell whether a rich full-throttle mixture is asked for by the ECU or caused by an airflow error. Without AFM flow it cannot compute an AFM correction. Two minutes in KTuner, no flash.';
        },
        steps: [
          'In KTuner, open the datalog (TunerView) channel list and add the AFR or lambda command (target) and the AFM (air flow meter) flow.',
          'Keep every channel you log now, at the same rate (about 15 samples a second).',
          'Drive your usual route and load the new log in step 3.'
        ],
        proof: function () { return 'The next log has both channels.'; },
        undo: 'Nothing to undo.'
      },
      hotLog: {
        title: 'Log one hot afternoon too',
        why: function (ev, F) { return 'This drive was cool (intake ' + n0(F, ev.iatMoving) + ' °C while moving). Heat is where this car loses timing and where problems show. A clean cool log proves little about 35 °C traffic.'; },
        steps: ['Log a 20-30 minute afternoon drive with some traffic.', 'Include one or two pulls after at least a minute of moving air.', 'Load it in step 3.'],
        proof: function () { return 'A log with intake air at 45 °C or more while moving.'; },
        undo: ''
      },
      heatHw: {
        title: 'Check the intake and intercooler for heat',
        why: function (ev, F) { return 'Intake air stays at ' + n0(F, ev.iatMoving) + ' °C even while moving, and ' + n0(F, ev.iatLoad) + ' °C under boost. With a big intercooler it should sit much closer to the outside air once you are moving.'; },
        steps: [
          'Check the intake: the filter should draw outside air, with a heat shield or box between it and the turbo, exhaust and radiator.',
          'Check the intercooler face and duct for debris, bent fins or anything blocking the air.',
          'Log a similar drive and compare intake air while moving.'
        ],
        proof: function (ev, F) { return 'Intake air while moving at least 4 °C lower on a similar day (this drive: ' + n0(F, ev.iatMoving) + ' °C).'; },
        undo: 'Put back any part you changed if the number does not move.'
      },
      afm: {
        title: 'Correct the AFM Flow table',
        why: function (ev, F) { return 'Fuel trims reach ' + F.signed(ev.worst, 1, ' %') + ' at some load: the ECU measures your intake airflow wrong. The Full method computes the correction.'; },
        steps: ['Open the Full method, step 2, and load this log as the baseline.', 'Step 3 computes the AFM Flow correction: paste it into KTuner and flash.', 'Log again and load it here.'],
        proof: function () { return 'Fuel trims within ±5 % at every load.'; },
        undo: 'Flash the previous AFM Flow table.'
      },
      richWot: {
        title: 'Find out why full throttle runs rich',
        why: function (ev, F) { return 'At full load the mixture measures ' + n1(F, ev.measured) + ' AFR; the map asks ' + n1(F, ev.map) + '. Richer is safe, but ' + n1(F, ev.richBy) + ' AFR richer costs some power and fuel. Either the ECU asks for extra fuel (heat or part protection), or the AFM over-reads airflow at the top. Only the AFR command channel can tell which.'; },
        steps: [
          'With the AFR command in the log, the app compares measured with commanded at full load.',
          'If the command itself is richer than the map, the ECU is protecting something: leave it.',
          'If the measured mixture is richer than the command, follow Full method step 4 (AFM top end) and log again.'
        ],
        proof: function () { return 'Measured within ±0.3 AFR of the command at full load.'; },
        undo: 'Flash the previous AFM Flow table.'
      },
      lowBoost: {
        title: 'Take 2 psi out below 2,000 rpm (only if the habit is not enough)',
        why: function (ev, F) { return 'Knock Control still rose while lugging (' + n0(F, ev.lugRises) + ' time(s)). Less boost at 1,250-2,000 rpm lowers cylinder pressure exactly where it knocks, and lightens the load on the CVT belt.'; },
        steps: [
          'In Boost_Target_*_Normal L and H, lower the 1,250-2,000 rpm rows by 2 psi in the high-load columns. Leave 2,250 rpm and up alone.',
          'Check the edit on the Map page (smooth, no new spikes), then flash.',
          'Drive the same hot route and load the log.'
        ],
        proof: function () { return 'Knock Control does not rise while lugging on a hot drive.'; },
        undo: 'Flash the previous boost tables.'
      },
      wotLean: {
        title: 'Gain lever 1: full throttle at 11.5 AFR',
        why: function () { return 'Full method step 6, lever 1: WOT target 11.0 → 11.5 from 3,000 rpm (11.3 from 5,500). A small, real gain, only on a car that is proven healthy.'; },
        steps: ['Open Full method step 6.', 'Apply lever 1 in KTuner and flash.', 'Log pulls at the same intake temperature and load them.'],
        proof: function () { return '50→70 km/h quicker at the same intake temperature, with no new Watch.'; },
        undo: 'Flash the previous WOT tables.'
      },
      moreBoost: {
        title: 'Gain lever 2: +1 psi at 3,500-5,500 rpm',
        why: function () { return 'Full method step 6, lever 2: one psi where torque falls off, never below 3,000 rpm (CVT belt).'; },
        steps: ['Open Full method step 6.', 'Apply lever 2 in KTuner and flash.', 'Log pulls at the same intake temperature and load them.'],
        proof: function () { return '50→70 km/h quicker at the same intake temperature, with no new Watch.'; },
        undo: 'Flash the previous boost tables.'
      },
      fix: {
        title: function (label) { return 'Fix first: ' + label; },
        why: function (display) { return 'This drive: ' + display + '.'; },
        steps: function (fix) { return [fix, 'Log again with the same channels and load it in step 3.']; },
        proof: function (label) { return label + ' no longer a Stop.'; },
        undo: 'Undo the last change you flashed, if any.'
      }
    },
    blockers: {
      gates: function () { return 'every check is OK (this drive has a Watch or a Stop)'; },
      kc: function (I, F) { return 'Knock Control stays at 0.55 or less (this drive ' + n2(F, I.kc && I.kc.end) + ', peak ' + n2(F, I.kc && I.kc.peak) + ')'; },
      pullIat: function (I, F) { return 'pulls start at 48 °C or less (this drive ' + n0(F, I.boost && I.boost.pullIat) + ' °C)'; },
      cvt: function (I, F) { return 'CVT stays at 90 °C or less (this drive ' + n0(F, I.heat.cvtMax) + ' °C)'; },
      data: function () { return 'the AFR command is in the log (see "Log the channels")'; },
      headroom: function (I, F) { return 'the turbo has headroom: at ' + n1(F, I.boost && I.boost.peakBoost) + ' psi the wastegate is only ' + n1(F, I.boost && I.boost.wgAtPeak) + ' % open, so it is near its limit on this map. More boost here mostly adds heat'; },
      pulls: function () { return 'a log with hard pulls'; },
      revs: function () { return 'you have tried the free fix first (keep the revs up)'; },
      safety: function () { return 'the Stop above is fixed'; }
    },
    fine: {
      revs: function (I, F) { return I.lug ? 'Knock Control did not climb while lugging (lugging ' + n1(F, I.lug.share) + ' % of moving time).' : 'No lugging data.'; },
      cooldown: function (I, F) { return I.boost && I.boost.hard ? 'Pulls started with intake air at ' + n0(F, I.boost.pullIat) + ' °C.' : 'No hard pull in this drive.'; },
      hotRestart: function (I, F) { return I.hotRestart && I.hotRestart.isRestart ? 'Hot restart (intake ' + n0(F, I.hotRestart.startIAT) + ' °C), driven gently: no hard pull started hot in the first 5 minutes.' : 'No hot restart.'; },
      cvtHeat: function (I, F) { return 'CVT peaked at ' + n0(F, I.heat.cvtMax) + ' °C.'; },
      fuelCheck: function (I, F) { return I.kc ? 'Knock Control ended at ' + n2(F, I.kc.end) + ': the ECU is happy with the fuel.' : 'Knock Control not logged.'; },
      data: function () { return 'All the channels the app needs are in the log.'; },
      hotLog: function (I, F) { return 'A warm-to-hot drive (intake ' + n0(F, I.heat.iatMoving) + ' °C while moving): a real test.'; },
      heatHw: function (I, F) { return 'Intake air while moving: ' + n0(F, I.heat.iatMoving) + ' °C.'; },
      afm: function (I, F) { return I.trims ? 'Fuel trims within ' + F.signed(I.trims.worst, 1, ' %') + ' at every load: the AFM reads your intake right. No AFM change needed.' : 'No closed-loop trims in this log.'; },
      richWot: function (I, F) { return I.mix && isNum(I.mix.fullLoadAfr) ? 'Full-load mixture ' + n1(F, I.mix.fullLoadAfr) + ' AFR against the map\'s ' + n1(F, I.mix.mapAfr) + ': close enough.' : 'Not enough full-load time to judge the mixture.'; },
      lowBoost: function () { return 'No Knock Control rise while lugging.'; }
    },
    unavailableLine: function (d, F, T) { var nm = ((T.drive.qualityChannels || {})[d.flat] || d.flat); return 'Can\'t tell: ' + nm + ' was flat for the whole drive.'; },
    unavailableFix: function (d, F, T) { var nm = ((T.drive.qualityChannels || {})[d.flat] || d.flat); return T.drive.channelFix(nm); },
    basisNotes: {
      'trims-data': 'cruise trims on your 16 drives sit within ±4%',
      'mixture-rule': 'Watch 0.5 / Stop 1.0 AFR leaner than your map\'s 11.0; healthy drives run 0.2+ richer',
      'fuelpress-rule': 'actual pressure must hold 90% of target under load',
      'overshoot-rule': 'over +2.5 psi the downpipe spool needs a retune',
      'undershoot-rule': '1.5 psi band around target after spool',
      'mafheadroom': 'the AFM table ends at 10,000 Hz',
      'knock-rule': 'over 3°, or several cylinders together, is real knock',
      'score-rule': 'timing cost 10.2° × (score − 0.49) from KTuner\'s formula on your logs; the cut points are judgement',
      'score-stop': 'Stop 0.80 (3.2° of timing): never reached on your car',
      'iat-cap': 'heat alone never stops: the score catches heat turning into knock',
      'ect-stop': 'Stop 105 °C: no Honda limit published in what was read',
      'cvt-stop': 'Stop 100 °C: no Honda limit published in what was read; this car peaks at 95 °C',
      'slip-watch': '0 events in your 16 drives: threshold unproven, Watch only',
      'lowboost-rule': 'low-rpm torque is the CVT belt\'s hardest job',
      'app-limit': 'an app limit'
    },
    basisLine: function (b) {
      var head = { data: 'from your data', primary: 'from Honda or KTuner', physics: 'physics', judgement: 'our judgement', provisional: 'provisional' }[b.t] || 'judgement';
      var note = (this.basisNotes || {})[b.k] || b.k || '';
      var s = 'Basis: ' + head + ' — ' + note + '.';
      if (b.t === 'provisional') s += ' Provisional: not yet seen on your car.';
      return s;
    },
    feelTitle: 'The feel, in numbers',
    feel: function (h, F) { return h ? 'Best ' + h.from + '→' + h.to + ' km/h: ' + F.num(h.seconds, 2) + ' s' + (h.full ? ' with your foot down' : ' (pedal ' + h.pedalMin + ' % or more)') + ', boost up to ' + n1(F, h.mapMax) + ' psi, intake ' + n0(F, h.iat) + ' °C.' : 'No clean acceleration run in this drive (pedal held at 60 % or more through a speed window).'; },
    feelNote: 'Compare runs only at a similar intake temperature (±8 °C): heat alone changes these by a few tenths.',
    graphsTitle: 'Engineering view',
    graphsNote: 'The same numbers a tuner reads off the log. Tap a graph\'s "Explain" for plain words, or ask about it below.',
    explain: 'Explain', askThis: 'Ask about this',
    graphs: {
      kc: {
        title: 'Knock Control through the drive',
        legend: ['Knock Control', 'Lugging', 'Intake air (°C)', 'Watch line 0.56'],
        explain: function (I, F) {
          var k = I.kc;
          var s = 'The blue line is Knock Control: about 0.5 means RON95; higher means the ECU heard knock and moved toward its safer timing everywhere. Orange bars mark time spent lugging (900-1,700 rpm with load). The grey line is intake air.';
          if (!k) return s;
          s += ' This drive: ' + n2(F, k.start) + ' → ' + n2(F, k.end) + ' (peak ' + n2(F, k.peak) + ').';
          if (k.upSteps) s += ' ' + k.lugUpSteps + ' of its ' + k.upSteps + ' steps up happened while lugging, at a median ' + n0(F, k.upRpm) + ' rpm and ' + n0(F, k.upVss) + ' km/h.';
          var fall = k.episodes.filter(function (e) { return e.kind === 'fall' && e.cause === 'revs'; })[0];
          if (fall) s += ' It fell back from ' + n2(F, fall.from) + ' to ' + n2(F, fall.to) + ' while you drove at a median ' + n0(F, fall.rpm) + ' rpm.';
          return s;
        }
      },
      timing: {
        title: 'Timing map: where the ECU gives and takes spark',
        legend: ['Ignition advance (darker = more)', 'Scheduled knock retard', 'Lugging zone'],
        explain: function (I, F) {
          var s = 'Each cell is the median ignition advance at that rpm and manifold pressure in this drive; darker is more advance. Orange dots are knock retard (on this ECU, retard scheduled from Knock Control). The outlined box is the lugging zone.';
          if (I.lug && isNum(I.lug.ignDeltaShown)) s += ' In the lugging zone the median advance is ' + n1(F, I.lug.ign) + '° with ' + n1(F, I.lug.kr) + '° retard; at the same load at 2,000-3,000 rpm it is ' + n1(F, I.lug.ignRef) + '° with ' + n1(F, I.lug.krRef) + '°. The engine works hardest there for the least torque.';
          return s;
        }
      },
      afr: {
        title: 'Mixture under boost',
        legend: ['Measured AFR (5-95 %)', 'Median', 'Map target at full load', 'Lean limit 12.0'],
        explain: function (I, F) {
          var m = I.mix;
          var s = 'Each bar is the measured air-fuel ratio in one boost band (5-95 % of samples, dot = median). The dashed line is what your map asks at full load; the red line is the lean limit, 12.0 AFR. Under the dashed line = richer than asked: safe, a little slower.';
          if (m && isNum(m.fullLoadAfr)) s += ' This drive at 12 psi and up: ' + n1(F, m.fullLoadAfr) + ' AFR against ' + n1(F, m.mapAfr) + ' asked; leanest held ' + n1(F, m.leanest) + '.';
          return s;
        }
      },
      accel: {
        title: 'Acceleration windows',
        legend: ['Best time, pedal held 60 % or more', 'Foot down (85 % or more)'],
        explain: function () { return 'The best time through each speed window with the pedal held at 60 % or more the whole way. Bars in the darker blue had your foot down. Heat changes these by a few tenths, so compare only at a similar intake temperature.'; }
      }
    },
    qualityTitle: 'What this log has',
    qualityChannels: {
      mixture: 'Mixture (the O2 sensor)', trims: 'Fuel trims', score: 'Fuel-quality score (Knock Control)', fuelPressure: 'Fuel pressure',
      boost: 'Turbo Pressure', boostTarget: 'Turbo Pressure target', iat: 'Intake air temp', ect: 'Coolant temp', cvt: 'CVT fluid temp',
      lam: 'Mixture (the O2 sensor)', stft: 'Fuel trims', ltft: 'Fuel trims', kControl: 'Fuel-quality score (Knock Control)', fp: 'Fuel pressure'
    },
    cantTell: {
      tooShort: function (c) { return 'Can\'t tell: too short. Only ' + c.movingSeconds + ' s of moving in this log; a drive needs 60 s before it can be judged, and this one stays out of your car history.'; },
      safety: function (c, names) { return 'Can\'t tell: ' + names.join(', ') + (c.missing && c.missing.length ? ' missing from this log' : ' flat for the whole drive') + '. Safety cannot be judged without it.'; }
    },
    channelFlat: function (name) { return name + ' was flat for the whole drive: the logger wrote one value while the engine moved.'; },
    channelMissing: function (name) { return name + ' is not in this log.'; },
    channelFix: function (name) { return 'In TunerView, remove ' + name + ' from the layout and add it again, then log a short drive and check the value moves. Keep every channel you log now.'; },
    quality: function (I, F, T) {
      var q = I.quality, out = [];
      var names = function (keys) { return keys.map(function (k) { return (T.drive.qualityChannels || {})[k] || k; }); };
      if (q.cantTell && q.cantTell.reason === 'tooShort') out.push(T.drive.cantTell.tooShort(q.cantTell));
      else if (q.cantTell) out.push(T.drive.cantTell.safety(q.cantTell, names(q.cantTell.channels)));
      (q.flat || []).forEach(function (k) {
        var nm = names([k])[0];
        out.push(T.drive.channelFlat(nm) + ' ' + T.drive.channelFix(nm));
      });
      out.push((q.glitchTotal ? F.num(q.glitchTotal, 0) + ' impossible values removed (logger glitches: ' + Object.keys(q.glitches).map(function (k) { return k + ' ' + q.glitches[k]; }).join(', ') + ')' : 'No logger glitches') + '.');
      if (q.fuelCutSamples) out.push(F.num(q.fuelCutSamples, 0) + ' samples with the O2 sensor at its lean stop (fuel cut on lift-off) left out of mixture numbers.');
      if (q.knockScheduled) out.push('Knock Retard here follows Knock Control (the retard the ECU schedules), so the app judges knock by Knock Control.');
      if (q.missing.length) out.push('Missing: ' + q.missing.map(function (k) { return { afrCmd: 'AFR command', mafHz: 'AFM flow' }[k] || k; }).join(', ') + '.');
      return out;
    },
    ask: {
      title: 'Ask about this drive',
      sub: 'Answers come from this drive\'s numbers. Built-in answers work offline. With your own Anthropic API key, an AI explains in plain words: it can only read the drive through fixed tools, every number it quotes is checked against them, and only actions from the list above are allowed.',
      suggestions: ['Why did Knock Control go up?', 'Is my mixture safe under boost?', 'Can I add boost?', 'What should I do first, and why?', 'Explain the timing map'],
      graphQ: { kc: 'Why did Knock Control go up in this drive?', timing: 'Explain the timing map for this drive', afr: 'Is my mixture under boost safe, and why is it rich?', accel: 'How quick was the car in this drive, and what slows it down?' },
      placeholder: 'Ask about this drive…', send: 'Ask',
      builtIn: 'Built-in answer', ai: 'AI answer', verified: 'Every number checked against this drive', repaired: 'Checked after one correction',
      unverified: 'The AI answer did not pass the number check, so the built-in answer is shown.', refused: 'The AI declined this question; here is the built-in answer.', failed: 'Could not reach the AI; here is the built-in answer.',
      working: 'Reading the drive…', looked: 'What the AI looked at', issues: 'Check failures',
      settings: 'AI settings (optional)', key: 'Anthropic API key', keyNote: 'Kept in this tab only unless you tick Remember. Sent only to api.anthropic.com.', remember: 'Remember the key on this device',
      model: 'Model', loadModels: 'Load my models', modelsLoaded: function (n) { return n + ' models'; }, modelHint: 'Pick a model from your account.', noKey: 'No key set: built-in answers only.',
      privacy: 'Sends your question and summary numbers from this drive (never the raw log) to Anthropic with your key.',
      clear: 'Clear'
    },
    offline: {
      kc: function (I, F) {
        if (!I.kc) return 'Knock Control is not in this log, so the app cannot tell. Add it to the TunerView layout.';
        var k = I.kc, s = 'Knock Control went from ' + n2(F, k.start) + ' to ' + n2(F, k.end) + ' (peak ' + n2(F, k.peak) + '). ';
        if (k.lugUpSteps) s += k.lugUpSteps + ' of ' + k.upSteps + ' steps up happened while lugging: about ' + n0(F, k.upRpm) + ' rpm at ' + n0(F, k.upVss) + ' km/h with a light pedal. That is the CVT holding low rpm in D on a hot day. Fix: keep the revs up (S mode or a paddle below 60 km/h). ';
        else if (k.upSteps) s += 'Its steps up were not mostly while lugging; check intake heat and fuel. ';
        else s += 'It did not climb in this drive. ';
        return s + 'The ECU raises Knock Control when it hears knock, and it takes timing away everywhere until it comes back down.';
      },
      afr: function (I, F) {
        var m = I.mix;
        if (!m || !isNum(m.fullLoadAfr)) return 'Not enough time at full load in this drive to judge the mixture.';
        return 'Yes. At 12 psi and up it measured ' + n1(F, m.fullLoadAfr) + ' AFR against ' + n1(F, m.mapAfr) + ' in the map, and never held leaner than ' + n1(F, m.leanest) + ' (the limit is 12.0). Richer than asked is the safe side. To learn why it is rich, log the AFR command.';
      },
      boost: function (I, F, P) {
        var lock = P.later.filter(function (a) { return a.id === 'moreBoost'; })[0];
        if (!lock) return 'Only after every check is OK. See Gain lever 2 in the Full method.';
        return 'Not now. More boost is locked until ' + lock.blockedBy.map(function (b) { return (I18N.en.drive.blockers[b] || function () { return b; })(I, F); }).join('; ') + '.';
      },
      first: function (I, F, P) {
        var a = P.now[0];
        if (!a) return I18N.en.drive.noActions;
        var d = I18N.en.drive.actions[a.id] || I18N.en.drive.actions.fix;
        var title = typeof d.title === 'function' ? d.title(a.check) : d.title;
        return 'First: ' + title + '. It is first because it is the ' + (a.tier === 'safety' ? 'safety fix' : 'biggest effect for the least work') + ' in this drive (' + I18N.en.drive.badges.impact[a.impact].toLowerCase() + ', ' + I18N.en.drive.badges.effort[a.effort].toLowerCase() + (a.flash ? ', needs a flash' : ', no flash') + ').';
      },
      heat: function (I, F) { return 'Intake air: ' + n0(F, I.heat.iatMoving) + ' °C while moving, up to ' + n0(F, I.heat.iatStill) + ' °C standing still, pulls started at ' + n0(F, I.boost && I.boost.pullIat) + ' °C. CVT peaked at ' + n0(F, I.heat.cvtMax) + ' °C.'; },
      timing: function (I, F) { return I18N.en.drive.graphs.timing.explain(I, F); },
      accel: function (I, F) { return I18N.en.drive.feel(I.accel && I.accel.headline, F); },
      unknown: 'The built-in answers cover knock control, mixture, boost, heat, timing, acceleration and what to do first. Add an API key in AI settings for other questions.'
    },
    sources: SOURCES
  };

  I18N.en.hints.lugging = {
    title: 'Lugging',
    paras: ['Asking for torque at low rpm: 900-1,700 rpm with the manifold near or above atmospheric pressure. The CVT in D does this on purpose to save fuel when you press gently.', 'On a turbo DI engine this is where cylinder pressure is high for the longest time per combustion, so it knocks first on hot fuel. It is also where low-speed pre-ignition happens, the rare event API SP / GF-6 oils are tested against.'],
    bands: [['good', 'under 2 % of moving time, or no Knock Control rise'], ['watch', 'Knock Control rises while lugging']],
    note: 'Fix it with the right foot, not the map: S mode or a paddle below 60 km/h keeps the revs up.'
  };
  I18N.en.hints.kcsched = {
    title: 'Scheduled knock retard',
    paras: ['On this ECU the logged Knock Retard is the retard the ECU schedules from Knock Control and its own table, not a count of knock events. That is why it sits at about 5° under boost at a normal Knock Control of 0.5, and at 0 at 2,000-3,000 rpm cruise.', 'So the app judges knock by Knock Control: its level, and whether it climbs during a drive.'],
    note: 'A steady 5° under boost is not a problem on its own. Knock Control climbing is.'
  };
  I18N.en.terms.push(['lugging', 'Lugging'], ['kcsched', 'Scheduled knock retard']);

  // ---------------------------------------------------------------------------
  // Tiếng Việt
  // ---------------------------------------------------------------------------
  I18N.vi.drive = {
    whyBtn: 'Vì sao?',
    limits: {
      fuel: 'Giới hạn: trim trong ±5 %, hòa khí trong 0.5 so với 11.0 của map, áp suất xăng từ 90 % mục tiêu trở lên.',
      air: 'Giới hạn: vượt mục tiêu không quá +2.5 psi, boost đúng mục tiêu trong ±1.5 psi sau khi lên boost.',
      spark: 'Giới hạn: điểm số Theo dõi từ 0.56, không chạy gắt từ 0.62 giữ 60 giây, Dừng từ 0.80 (tạm thời).',
      heat: 'Giới hạn: khí nạp Theo dõi từ 50 °C khi kéo (nhiệt độ một mình không bao giờ Dừng), nước làm mát Dừng từ 105 °C (tạm thời).',
      cvt: 'Giới hạn: CVT Theo dõi từ 90 °C, Dừng từ 100 °C (tạm thời); trượt dây đai chỉ Theo dõi.'
    },
    nav: { title: 'Kiểm tra chuyến đi', sub: 'Log của bạn, một việc cần làm' },
    startHere: 'Bắt đầu ở đây', navFull: 'Quy trình đầy đủ (hiệu chỉnh AFM)',
    eyebrow: 'Kiểm tra chuyến đi · log TunerView thật',
    title: 'Chạy, kiểm tra, làm một việc, chứng minh',
    goal: 'Nạp một chuyến đi bình thường. App kiểm tra an toàn trước, rồi xếp hạng việc cần làm: thói quen miễn phí trước khi nạp map, hiệu quả lớn nhất với công sức ít nhất trước. Làm một việc, chạy lại, và để log sau chứng minh.',
    loop: [
      { title: 'Kiểm tra một chuyến', empty: 'Nạp file CSV TunerView của KTuner, hoặc thử một trong ba chuyến của chính bạn.', done: function (r) { return r; } },
      { title: 'Làm một việc', empty: 'Việc số 1 hiện ở đây sau khi kiểm tra.', active: 'Đang làm' },
      { title: 'Chứng minh', empty: 'Làm xong thì chạy một cung đường tương tự và nạp log đó.', ready: 'Nạp chuyến tiếp theo để xem có hiệu quả không.' }
    ],
    load: 'Nạp CSV TunerView', loadNext: 'Nạp chuyến tiếp theo', another: 'Kiểm tra chuyến khác',
    examplesTitle: 'Ba chuyến của bạn (có sẵn)',
    examples: {
      'aug30-1601': { title: '30/8, 16:01 · kẹt xe, trời nóng', note: '52 phút, chiều 36 °C, chạy nhiều ở 40-60 km/h' },
      'aug30-1529': { title: '30/8, 15:29 · kéo ga tới 19 psi', note: '19 phút, tám lần kéo mạnh' },
      'sep01-0813': { title: '1/9, 08:13 · sáng mát', note: '40 phút, khí nạp 37 °C khi xe chạy' }
    },
    exampleNote: 'Log của chính bạn, rút gọn cho app: bỏ 13 kênh không dùng và giữ một mẫu mỗi hai mẫu (7.5 mẫu/giây). Kết quả khớp với log đầy đủ.',
    exampleLoading: 'Đang mở ví dụ…', exampleError: 'Trình duyệt này không mở được ví dụ có sẵn. Hãy nạp file CSV.',
    reading: 'Đang đọc log…', cameBack: 'Bạn đã chứng minh việc này trước đây, và chuyến này lại cho thấy nó.',
    asNext: 'Dùng làm chuyến tiếp theo',
    source: { ktuner: 'KTuner TunerView', hondata: 'Hondata FlashPro', other: 'CSV' },
    facts: function (I, F) { return F.num(I.meta.duration / 60, 0) + ' phút · ' + F.num(I.meta.rateHz, 1) + ' mẫu/giây · ' + (I.boost ? I.boost.hard + ' lần kéo mạnh' : 'không có kênh boost'); },
    safeTitle: 'Có an toàn không?',
    safe: {
      good: 'Có. Mọi mục kiểm tra đều đạt trong chuyến này.',
      watch: 'Có, nhưng cần theo dõi vài thứ. Không có gì đang làm hại máy; danh sách dưới đây xử lý chúng theo thứ tự.',
      stop: 'Chưa. Sửa mục Dừng trước khi kéo ga mạnh tiếp.',
      nodata: 'Log này chưa đủ để kết luận. Hãy log một chuyến dài hơn khi máy đã nóng.'
    },
    nowTitle: 'Việc số 1 lúc này', nextTitle: 'Tiếp theo, theo thứ tự', laterTitle: 'Để sau: mở khi', fineTitle: 'Đã kiểm tra, ổn',
    doNow: 'Làm ngay',
    noActions: 'Không có gì cần sửa. Cứ tận hưởng, thỉnh thoảng log một buổi chiều nóng.',
    why: 'Vì sao', steps: 'Làm thế này', proof: 'Log sau chứng minh bằng cách nào', undo: 'Hoàn tác', rankWhy: 'Thứ tự được quyết định thế nào',
    rankRules: [
      'Mục nào báo Dừng thì đứng đầu, nặng nhất trước (kích nổ và hòa khí loãng trước nhiệt và CVT). Khi còn mục Dừng, không việc nào khác được mở.',
      'Các việc còn lại được chấm điểm: 3 × hiệu quả − 2 × công sức − 2 × rủi ro − 1 nếu cần nạp map, + 2 × mức log này cho thấy rõ. Thói quen miễn phí thường thắng.',
      'Việc nào cần việc khác trước thì bị khóa, kèm đúng điều kiện để mở. Các đòn bẩy tăng sức mạnh bị khóa cho tới khi xe chứng minh khỏe.',
      'Cùng một log luôn cho cùng một danh sách. Mỗi lần một việc: log sau chứng minh rồi mới sang việc tiếp theo.'
    ],
    reviewLink: 'Đánh giá sản phẩm: vì sao app làm như vậy (docs/PRODUCT-REVIEW.md)',
    badges: {
      impact: ['', 'Hiệu quả nhỏ', 'Hiệu quả vừa', 'Hiệu quả lớn'],
      effort: ['', 'Vài phút', 'Khoảng một giờ', 'Nạp map và log'],
      flash: 'Cần nạp map', noFlash: 'Không cần nạp map', free: 'Miễn phí', risk: ['Không rủi ro', 'Rủi ro thấp', 'Có rủi ro'],
      tier: { safety: 'An toàn', drive: 'Thói quen', data: 'Ghi log', hardware: 'Kiểm tra phần cứng', tune: 'Sửa map', gain: 'Tăng sức mạnh' }
    },
    start: 'Bắt đầu: tôi sẽ làm việc này', stopDoing: 'Thôi không làm nữa', doing: 'Đang làm', startedOn: function (d) { return 'Bắt đầu ' + d; },
    unlocksWhen: 'Mở khi',
    proveTitle: 'Có hiệu quả không?',
    verdicts: { keep: 'Có hiệu quả: giữ lại', partial: 'Tốt hơn, nhưng chưa đủ', retry: 'Chưa thay đổi', undo: 'Hoàn tác', stop: 'Dừng: có vấn đề an toàn mới', inconclusive: 'Hai chuyến này chưa so được' },
    verdictHelp: {
      keep: 'Đã đánh dấu xong. Danh sách bên dưới được đẩy lên một bậc.',
      partial: 'Tiếp tục làm. Việc tiếp theo cần việc này đã được mở.',
      retry: 'Làm lại ở chuyến sau. Thói quen cần vài chuyến.',
      undo: 'Trả lại thứ bạn đã thay đổi (xem Hoàn tác), rồi log lại.',
      stop: 'Một mục trước đó ổn giờ thành Dừng. Sửa mục đó trước.',
      inconclusive: 'Hai chuyến chưa so sánh được. Hãy chạy lại trong điều kiện tương tự.'
    },
    reasons: {
      cooler: 'Chuyến sau mát hơn nhiều. Một chuyến mát không chứng minh được việc sửa nhiệt hay kích nổ.',
      short: 'Chuyến sau quá ngắn (xe chạy dưới 10 phút).',
      noPulls: 'Chuyến sau không có lần kéo mạnh nào để so.',
      noKc: 'Log sau không có Knock Control.',
      noData: 'Log sau không có kênh đó.',
      accelNotMatched: 'Hai chuyến không có lần tăng tốc nào so được (cùng khoảng tốc độ, đạp lút ga, nhiệt độ khí nạp tương tự).',
      lessTown: 'Chuyến sau chạy trong phố (15-60 km/h) ít hơn nhiều, trong khi ì máy chỉ lộ ra ở đó.',
      notHotRestart: 'Chuyến sau không phải nổ máy lúc còn nóng, nên không chứng minh được thói quen này.'
    },
    keepNext: 'Giữ lại và sang việc tiếp theo', undoIt: 'Tôi đã hoàn tác', tryAgain: 'Làm lại',
    before: 'Trước', after: 'Sau',
    metricNames: {
      lugShare: 'Ì máy (% thời gian xe chạy)', pullIat: 'Khí nạp lúc bắt đầu kéo (°C)', cvtMax: 'CVT cao nhất (°C)', kcEnd: 'Knock Control cuối chuyến',
      channels: 'Số kênh còn thiếu', iatMoving: 'Khí nạp khi xe chạy (°C)', trimWorst: 'Trim nhiên liệu lệch nhất (%)', wotAfr: 'AFR khi tải tối đa', kcRise: 'Mức tăng Knock Control', accel: '50→70 km/h (giây)', firstPullIAT: 'Khí nạp lúc bắt đầu kéo (°C)'
    },
    actions: {
      revs: {
        title: 'Giữ vòng tua cao hơn khi kẹt xe trời nóng',
        why: function (ev, F) {
          var s = ev.rises
            ? 'Knock Control tăng từ ' + n2(F, ev.kcFrom) + ' lên ' + n2(F, ev.kcTo) + ' khi bạn chạy khoảng ' + n0(F, ev.riseRpm) + ' rpm với chân ga nhẹ tới vừa. '
            : 'Trong chuyến nóng này, ' + n1(F, ev.lugShare) + ' % thời gian xe chạy là ì máy, với tới ' + n1(F, ev.kr) + '° lùi lửa theo lịch ở đó. ';
          s += ev.rises ? n1(F, ev.lugShare) + ' % thời gian xe chạy ở 900-1,700 rpm có tải: hộp CVT ở số D giữ vòng tua thấp, và đó là chỗ máy này kích nổ với xăng E10 khi trời nóng. ' : 'Đó là chỗ máy này kích nổ đầu tiên với xăng E10 khi trời nóng. ';
          return s + 'Khi Knock Control tăng, ECU rút góc lửa ở mọi nơi, nên xe thấy đuối suốt phần còn lại của chuyến.';
        },
        steps: [
          'Dưới 60 km/h vào ngày nóng, chuyển sang S (hoặc gạt lẫy một lần) khi đạp quá khoảng một phần ba chân ga. Cố giữ từ 2,000 rpm trở lên khi cần lực kéo.',
          'Chỉ để số D hạ vòng tua khi chạy đều nhẹ ga. Đừng đạp mạnh ở 1,300-1,700 rpm: nhả bớt ga hoặc về số trước.',
          'Chạy một cung đường chiều nóng tương tự, log như cũ, rồi nạp ở bước 3.'
        ],
        proof: function (ev, F) { return 'Ì máy dưới ' + F.num(Math.max(2, ev.lugShare * 0.6), 1) + ' % thời gian xe chạy, và Knock Control không tăng (chuyến này: ' + n2(F, ev.kcFrom) + ' → ' + n2(F, ev.kcTo) + ').'; },
        undo: 'Không có gì để hoàn tác: đây là thói quen. Tốn thêm chút xăng trong phố.',
        note: 'Chủ xe trên diễn đàn Hondata cũng gặp đúng như vậy: Knock Control tăng ở 1,300-1,700 rpm ngay dưới 0 psi trong khi đạp hết ga vẫn sạch. Tải cao ở vòng tua thấp cũng là vùng máy turbo phun xăng trực tiếp dễ bị đánh lửa sớm ở tốc độ thấp (LSPI); dầu chuẩn API SP / GF-6 được thử nghiệm để chống hiện tượng này.'
      },
      hotRestart: {
        title: 'Sau khi nổ máy lúc còn nóng, chạy 3–5 phút rồi mới kéo ga mạnh',
        why: function (ev, F) { return 'Chuyến này nổ máy ' + (ev.gapMin != null ? n1(F, ev.gapMin) + ' phút sau chuyến trước ' : '') + 'khi khí nạp đã ở ' + n0(F, ev.startIAT) + ' °C, và lần kéo mạnh đầu tiên bắt đầu ở giây thứ ' + n0(F, ev.firstPullT) + ' với ' + n0(F, ev.firstPullIAT) + ' °C. Kéo ga mạnh khi khí còn hầm nóng là lúc máy này kích nổ đầu tiên.'; },
        steps: [
          'Sau khi nổ máy lúc còn nóng, chạy 3–5 phút đón gió rồi mới kéo ga mạnh, chờ IAT từ 48 °C trở xuống.',
          'Không kéo ga ngay khi ra khỏi bãi xe, cây xăng hay đoạn kẹt xe.',
          'Log chuyến nổ máy nóng tiếp theo như cũ và nạp ở bước 3.'
        ],
        proof: function (ev, F) { return 'Lần kéo đầu của chuyến nổ máy nóng tiếp theo bắt đầu từ 48 °C trở xuống (chuyến này: ' + n0(F, ev.firstPullIAT) + ' °C).'; },
        undo: 'Không có gì để hoàn tác: đây là thói quen.'
      },
      cooldown: {
        title: 'Làm mát khí nạp trước khi kéo ga',
        why: function (ev, F) { return 'Các lần kéo mạnh bắt đầu khi khí nạp ở ' + n0(F, ev.pullIat) + ' °C (tới ' + n0(F, ev.pullIatMax) + ' °C). Khi xe đứng yên nó hầm tới ' + n0(F, ev.soak) + ' °C; gió khi xe chạy đưa nó về ' + n0(F, ev.moving) + ' °C. Khí nóng khiến ECU rút góc lửa và tăng nguy cơ kích nổ: kéo chậm hơn, và kém an toàn hơn.'; },
        steps: [
          'Trước khi kéo mạnh, chạy đều 1-2 phút và chờ IAT dưới 48 °C (45 càng tốt).',
          'Không kéo ga ngay sau khi chờ đèn đỏ lâu, ra khỏi bãi xe hay nổ máy đứng lâu.',
          'Log các lần kéo tiếp theo và nạp ở bước 3.'
        ],
        proof: function (ev, F) { return 'Các lần kéo bắt đầu ở 48 °C trở xuống (chuyến này: ' + n0(F, ev.pullIat) + ' °C).'; },
        undo: 'Không có gì để hoàn tác: đây là thói quen.'
      },
      cvtHeat: {
        title: 'Bảo vệ hộp CVT khi nó nóng',
        why: function (ev, F) { return 'Dầu CVT lên tới ' + n0(F, ev.cvtMax) + ' °C (thường ' + n0(F, ev.cvtMed) + ' °C khi chạy). Trên 90 °C dầu loãng ra, dây đai có thể trượt khi mô-men tối đa, và ECU cắt bớt mô-men để bảo vệ.'; },
        steps: [
          'Trước mỗi lần kéo, xem nhiệt độ CVT: dưới 90 °C. Nếu cao hơn, chạy nhẹ nhàng cho tới khi hạ xuống.',
          'Không đề-pa mạnh từ chỗ dừng khi kẹt xe: đó là lúc dây đai chịu tải nặng nhất.',
          'Nếu vượt 95 °C khi chạy bình thường, kiểm tra két làm mát CVT (lá tản nhiệt sạch, đón gió, không nằm sau intercooler) và tuổi dầu.'
        ],
        proof: function (ev, F) { return 'CVT từ 90 °C trở xuống, hoặc không lần kéo nào bắt đầu trên 90 °C (chuyến này: cao nhất ' + n0(F, ev.cvtMax) + ' °C).'; },
        undo: 'Không có gì để hoàn tác.'
      },
      fuelCheck: {
        title: 'Kiểm tra xăng: Knock Control đang cao',
        why: function (ev, F) { return 'Knock Control kết thúc ở ' + n2(F, ev.kcEnd) + ' (lúc đầu ' + n2(F, ev.kcStart) + '). Trên 0.65, ECU coi xăng của bạn kém hơn RON95 và chạy góc lửa an toàn hơn ở mọi nơi.'; },
        steps: [
          'Đổ RON95 E10 ở một cây xăng đông khách và chạy nhẹ nhàng hết một bình.',
          'Cho tới khi Knock Control về dưới 0.6, chạy map ECO (18 psi).',
          'Nếu vẫn cao sau hai bình, kiểm tra kim phun và xu-páp nạp: máy phun trực tiếp dễ đóng muội than.'
        ],
        proof: function () { return 'Knock Control kết thúc ở 0.65 trở xuống trong một chuyến tương tự.'; },
        undo: 'Không có gì để hoàn tác.'
      },
      data: {
        title: 'Log thêm các kênh còn thiếu',
        why: function (ev) {
          var names = ev.missing.map(function (k) { return { afrCmd: 'lệnh AFR (lambda)', mafHz: 'lưu lượng AFM (Hz hoặc g/s)' }[k] || k; }).join(' và ');
          return 'Log này chưa có ' + names + '. Không có lệnh AFR, app không phân biệt được hòa khí giàu khi đạp hết ga là do ECU yêu cầu hay do đo gió sai. Không có lưu lượng AFM, app không tính được hiệu chỉnh AFM. Hai phút trong KTuner, không cần nạp map.';
        },
        steps: [
          'Trong KTuner, mở danh sách kênh log (TunerView) và thêm lệnh AFR hoặc lambda (mục tiêu) và lưu lượng AFM (cảm biến lưu lượng gió).',
          'Giữ mọi kênh đang log, cùng tốc độ log (khoảng 15 mẫu/giây).',
          'Chạy cung đường quen thuộc và nạp log mới ở bước 3.'
        ],
        proof: function () { return 'Log sau có cả hai kênh.'; },
        undo: 'Không có gì để hoàn tác.'
      },
      hotLog: {
        title: 'Log thêm một buổi chiều nóng',
        why: function (ev, F) { return 'Chuyến này mát (khí nạp ' + n0(F, ev.iatMoving) + ' °C khi xe chạy). Nhiệt là chỗ xe này mất góc lửa và là chỗ vấn đề lộ ra. Một log sáng mát sạch sẽ chưa nói được gì về kẹt xe 35 °C.'; },
        steps: ['Log một chuyến chiều 20-30 phút có kẹt xe.', 'Có một hai lần kéo ga sau ít nhất một phút xe chạy đón gió.', 'Nạp ở bước 3.'],
        proof: function () { return 'Một log có khí nạp từ 45 °C trở lên khi xe chạy.'; },
        undo: ''
      },
      heatHw: {
        title: 'Kiểm tra cổ hút và intercooler vì nhiệt',
        why: function (ev, F) { return 'Khí nạp vẫn ở ' + n0(F, ev.iatMoving) + ' °C ngay cả khi xe chạy, và ' + n0(F, ev.iatLoad) + ' °C khi có boost. Với intercooler lớn, khi xe đã chạy nó phải gần nhiệt độ ngoài trời hơn nhiều.'; },
        steps: [
          'Kiểm tra cổ hút: lọc gió phải hút gió bên ngoài, có tấm chắn hoặc hộp ngăn với turbo, pô và két nước.',
          'Kiểm tra mặt intercooler và ống dẫn gió: rác, lá tản nhiệt bị dập, hay vật gì chắn gió.',
          'Log một chuyến tương tự và so khí nạp khi xe chạy.'
        ],
        proof: function (ev, F) { return 'Khí nạp khi xe chạy thấp hơn ít nhất 4 °C trong một ngày tương tự (chuyến này: ' + n0(F, ev.iatMoving) + ' °C).'; },
        undo: 'Lắp lại phần đã thay nếu con số không đổi.'
      },
      afm: {
        title: 'Hiệu chỉnh bảng AFM Flow',
        why: function (ev, F) { return 'Trim nhiên liệu tới ' + F.signed(ev.worst, 1, ' %') + ' ở một mức tải: ECU đo gió qua cổ hút của bạn chưa đúng. Quy trình đầy đủ tính phần hiệu chỉnh.'; },
        steps: ['Mở Quy trình đầy đủ, bước 2, và nạp log này làm log gốc.', 'Bước 3 tính hiệu chỉnh AFM Flow: dán vào KTuner và nạp map.', 'Log lại và nạp ở đây.'],
        proof: function () { return 'Trim nhiên liệu trong ±5 % ở mọi mức tải.'; },
        undo: 'Nạp lại bảng AFM Flow cũ.'
      },
      richWot: {
        title: 'Tìm hiểu vì sao đạp hết ga bị giàu xăng',
        why: function (ev, F) { return 'Khi tải tối đa, hòa khí đo được ' + n1(F, ev.measured) + ' AFR; map yêu cầu ' + n1(F, ev.map) + '. Giàu hơn thì an toàn, nhưng giàu hơn ' + n1(F, ev.richBy) + ' AFR làm mất chút công suất và tốn xăng. Hoặc ECU yêu cầu thêm xăng (bảo vệ vì nhiệt hay bảo vệ chi tiết), hoặc AFM đo dư gió ở vùng cao. Chỉ kênh lệnh AFR mới cho biết là cái nào.'; },
        steps: [
          'Khi log có lệnh AFR, app so hòa khí đo được với lệnh khi tải tối đa.',
          'Nếu chính lệnh đã giàu hơn map, ECU đang bảo vệ thứ gì đó: để nguyên.',
          'Nếu hòa khí đo được giàu hơn lệnh, làm theo Quy trình đầy đủ bước 4 (phần cao của AFM) và log lại.'
        ],
        proof: function () { return 'Hòa khí đo được trong ±0.3 AFR so với lệnh khi tải tối đa.'; },
        undo: 'Nạp lại bảng AFM Flow cũ.'
      },
      lowBoost: {
        title: 'Bớt 2 psi dưới 2,000 rpm (chỉ khi thói quen chưa đủ)',
        why: function (ev, F) { return 'Knock Control vẫn tăng khi ì máy (' + n0(F, ev.lugRises) + ' lần). Bớt boost ở 1,250-2,000 rpm làm giảm áp suất trong xi-lanh đúng chỗ nó kích nổ, và nhẹ tải cho dây đai CVT.'; },
        steps: [
          'Trong Boost_Target_*_Normal L và H, hạ các hàng 1,250-2,000 rpm đi 2 psi ở các cột tải cao. Giữ nguyên từ 2,250 rpm trở lên.',
          'Kiểm tra chỗ sửa ở trang Map (mượt, không gai mới), rồi nạp map.',
          'Chạy lại cung đường nóng đó và nạp log.'
        ],
        proof: function () { return 'Knock Control không tăng khi ì máy trong một chuyến nóng.'; },
        undo: 'Nạp lại các bảng boost cũ.'
      },
      wotLean: {
        title: 'Đòn bẩy 1: đạp hết ga ở 11.5 AFR',
        why: function () { return 'Quy trình đầy đủ bước 6, đòn bẩy 1: mục tiêu WOT 11.0 → 11.5 từ 3,000 rpm (11.3 từ 5,500). Tăng ít nhưng thật, chỉ trên xe đã chứng minh khỏe.'; },
        steps: ['Mở Quy trình đầy đủ bước 6.', 'Áp dụng đòn bẩy 1 trong KTuner và nạp map.', 'Log các lần kéo ở cùng nhiệt độ khí nạp và nạp vào.'],
        proof: function () { return '50→70 km/h nhanh hơn ở cùng nhiệt độ khí nạp, không có Theo dõi mới.'; },
        undo: 'Nạp lại các bảng WOT cũ.'
      },
      moreBoost: {
        title: 'Đòn bẩy 2: +1 psi ở 3,500-5,500 rpm',
        why: function () { return 'Quy trình đầy đủ bước 6, đòn bẩy 2: thêm một psi ở chỗ mô-men giảm dần, không bao giờ dưới 3,000 rpm (dây đai CVT).'; },
        steps: ['Mở Quy trình đầy đủ bước 6.', 'Áp dụng đòn bẩy 2 trong KTuner và nạp map.', 'Log các lần kéo ở cùng nhiệt độ khí nạp và nạp vào.'],
        proof: function () { return '50→70 km/h nhanh hơn ở cùng nhiệt độ khí nạp, không có Theo dõi mới.'; },
        undo: 'Nạp lại các bảng boost cũ.'
      },
      fix: {
        title: function (label) { return 'Sửa trước: ' + label; },
        why: function (display) { return 'Chuyến này: ' + display + '.'; },
        steps: function (fix) { return [fix, 'Log lại với cùng các kênh và nạp ở bước 3.']; },
        proof: function (label) { return label + ' không còn là Dừng.'; },
        undo: 'Hoàn tác thay đổi vừa nạp, nếu có.'
      }
    },
    blockers: {
      gates: function () { return 'mọi mục kiểm tra đều OK (chuyến này có Theo dõi hoặc Dừng)'; },
      kc: function (I, F) { return 'Knock Control giữ ở 0.55 trở xuống (chuyến này ' + n2(F, I.kc && I.kc.end) + ', đỉnh ' + n2(F, I.kc && I.kc.peak) + ')'; },
      pullIat: function (I, F) { return 'các lần kéo bắt đầu ở 48 °C trở xuống (chuyến này ' + n0(F, I.boost && I.boost.pullIat) + ' °C)'; },
      cvt: function (I, F) { return 'CVT giữ ở 90 °C trở xuống (chuyến này ' + n0(F, I.heat.cvtMax) + ' °C)'; },
      data: function () { return 'log có lệnh AFR (xem "Log thêm các kênh")'; },
      headroom: function (I, F) { return 'turbo còn dư: ở ' + n1(F, I.boost && I.boost.peakBoost) + ' psi wastegate chỉ mở ' + n1(F, I.boost && I.boost.wgAtPeak) + ' %, tức là gần giới hạn trên map này. Thêm boost ở đây chủ yếu chỉ thêm nhiệt'; },
      pulls: function () { return 'có log với các lần kéo mạnh'; },
      revs: function () { return 'bạn đã thử cách miễn phí trước (giữ vòng tua cao)'; },
      safety: function () { return 'mục Dừng ở trên đã được sửa'; }
    },
    fine: {
      revs: function (I, F) { return I.lug ? 'Knock Control không tăng khi ì máy (ì máy ' + n1(F, I.lug.share) + ' % thời gian xe chạy).' : 'Không có dữ liệu ì máy.'; },
      cooldown: function (I, F) { return I.boost && I.boost.hard ? 'Các lần kéo bắt đầu với khí nạp ' + n0(F, I.boost.pullIat) + ' °C.' : 'Chuyến này không có lần kéo mạnh.'; },
      hotRestart: function (I, F) { return I.hotRestart && I.hotRestart.isRestart ? 'Nổ máy lúc còn nóng (khí nạp ' + n0(F, I.hotRestart.startIAT) + ' °C), chạy nhẹ nhàng: không lần kéo mạnh nào bắt đầu lúc nóng trong 5 phút đầu.' : 'Không phải nổ máy lúc còn nóng.'; },
      cvtHeat: function (I, F) { return 'CVT cao nhất ' + n0(F, I.heat.cvtMax) + ' °C.'; },
      fuelCheck: function (I, F) { return I.kc ? 'Knock Control kết thúc ở ' + n2(F, I.kc.end) + ': ECU hài lòng với xăng.' : 'Không log Knock Control.'; },
      data: function () { return 'Log có đủ các kênh app cần.'; },
      hotLog: function (I, F) { return 'Một chuyến ấm tới nóng (khí nạp ' + n0(F, I.heat.iatMoving) + ' °C khi xe chạy): một bài thử thật.'; },
      heatHw: function (I, F) { return 'Khí nạp khi xe chạy: ' + n0(F, I.heat.iatMoving) + ' °C.'; },
      afm: function (I, F) { return I.trims ? 'Trim nhiên liệu trong ' + F.signed(I.trims.worst, 1, ' %') + ' ở mọi mức tải: AFM đo đúng cổ hút của bạn. Không cần sửa AFM.' : 'Log này không có trim vòng kín.'; },
      richWot: function (I, F) { return I.mix && isNum(I.mix.fullLoadAfr) ? 'Hòa khí tải tối đa ' + n1(F, I.mix.fullLoadAfr) + ' AFR so với ' + n1(F, I.mix.mapAfr) + ' của map: đủ gần.' : 'Chưa đủ thời gian tải tối đa để đánh giá hòa khí.'; },
      lowBoost: function () { return 'Knock Control không tăng khi ì máy.'; }
    },
    unavailableLine: function (d, F, T) { var nm = ((T.drive.qualityChannels || {})[d.flat] || d.flat); return 'Không kết luận được: ' + nm + ' đứng yên suốt chuyến.'; },
    unavailableFix: function (d, F, T) { var nm = ((T.drive.qualityChannels || {})[d.flat] || d.flat); return T.drive.channelFix(nm); },
    basisNotes: {
      'trims-data': 'trim chạy đều trên 16 chuyến của bạn nằm trong ±4%',
      'mixture-rule': 'Theo dõi khi loãng hơn 0.5 / Dừng khi loãng hơn 1.0 AFR so với 11.0 của map; xe khỏe chạy giàu hơn từ 0.2',
      'fuelpress-rule': 'áp suất thực phải giữ 90% mục tiêu khi có tải',
      'overshoot-rule': 'vọt quá +2.5 psi thì downpipe cần chỉnh lại',
      'undershoot-rule': 'biên 1.5 psi quanh mục tiêu sau khi lên boost',
      'mafheadroom': 'bảng AFM kết thúc ở 10,000 Hz',
      'knock-rule': 'quá 3°, hoặc nhiều máy cùng lúc, mới là kích nổ thật',
      'score-rule': 'giá trị góc lửa mất đi 10.2° × (điểm − 0.49) theo công thức KTuner trên log của bạn; các ngưỡng là nhận định',
      'score-stop': 'Dừng ở 0.80 (mất 3.2° góc lửa): chưa từng thấy trên xe bạn',
      'iat-cap': 'riêng nhiệt không bao giờ Dừng: điểm chất lượng xăng bắt được nhiệt biến thành kích nổ',
      'ect-stop': 'Dừng ở 105 °C: chưa đọc được giới hạn Honda công bố',
      'cvt-stop': 'Dừng ở 100 °C: chưa đọc được giới hạn Honda công bố; xe bạn cao nhất 95 °C',
      'slip-watch': '0 lần trượt trên 16 chuyến của bạn: ngưỡng chưa kiểm chứng, chỉ Theo dõi',
      'lowboost-rule': 'mô-men ở vòng tua thấp là việc nặng nhất của dây đai CVT',
      'app-limit': 'một giới hạn của app'
    },
    basisLine: function (b) {
      var head = { data: 'từ số liệu của bạn', primary: 'từ Honda hoặc KTuner', physics: 'vật lý', judgement: 'nhận định của chúng tôi', provisional: 'tạm thời' }[b.t] || 'nhận định';
      var note = (this.basisNotes || {})[b.k] || b.k || '';
      var s = 'Căn cứ: ' + head + ' — ' + note + '.';
      if (b.t === 'provisional') s += ' Tạm thời: chưa từng thấy trên xe của bạn.';
      return s;
    },
    feelTitle: 'Cảm giác, bằng con số',
    feel: function (h, F) { return h ? 'Nhanh nhất ' + h.from + '→' + h.to + ' km/h: ' + F.num(h.seconds, 2) + ' giây' + (h.full ? ' khi đạp lút ga' : ' (chân ga từ ' + h.pedalMin + ' % trở lên)') + ', boost tới ' + n1(F, h.mapMax) + ' psi, khí nạp ' + n0(F, h.iat) + ' °C.' : 'Chuyến này không có lần tăng tốc sạch nào (giữ chân ga từ 60 % trở lên qua một khoảng tốc độ).'; },
    feelNote: 'Chỉ so các lần chạy ở nhiệt độ khí nạp tương tự (±8 °C): riêng nhiệt đã thay đổi các con số này vài phần mười giây.',
    graphsTitle: 'Góc nhìn kỹ thuật',
    graphsNote: 'Chính những con số một thợ tune đọc từ log. Bấm "Giải thích" ở mỗi biểu đồ để đọc bằng lời, hoặc hỏi ở bên dưới.',
    explain: 'Giải thích', askThis: 'Hỏi về biểu đồ này',
    graphs: {
      kc: {
        title: 'Knock Control trong suốt chuyến đi',
        legend: ['Knock Control', 'Ì máy', 'Khí nạp (°C)', 'Ngưỡng theo dõi 0.56'],
        explain: function (I, F) {
          var k = I.kc;
          var s = 'Đường xanh là Knock Control: khoảng 0.5 nghĩa là RON95; cao hơn nghĩa là ECU nghe thấy kích nổ và chuyển dần sang góc lửa an toàn ở mọi nơi. Các vạch cam là lúc ì máy (900-1,700 rpm có tải). Đường xám là khí nạp.';
          if (!k) return s;
          s += ' Chuyến này: ' + n2(F, k.start) + ' → ' + n2(F, k.end) + ' (đỉnh ' + n2(F, k.peak) + ').';
          if (k.upSteps) s += ' ' + k.lugUpSteps + ' trên ' + k.upSteps + ' bước tăng xảy ra khi ì máy, trung vị ' + n0(F, k.upRpm) + ' rpm và ' + n0(F, k.upVss) + ' km/h.';
          var fall = k.episodes.filter(function (e) { return e.kind === 'fall' && e.cause === 'revs'; })[0];
          if (fall) s += ' Nó giảm lại từ ' + n2(F, fall.from) + ' xuống ' + n2(F, fall.to) + ' khi bạn chạy ở trung vị ' + n0(F, fall.rpm) + ' rpm.';
          return s;
        }
      },
      timing: {
        title: 'Bản đồ góc lửa: ECU cho và lấy lửa ở đâu',
        legend: ['Góc đánh lửa sớm (đậm = nhiều hơn)', 'Lùi lửa kích nổ theo lịch', 'Vùng ì máy'],
        explain: function (I, F) {
          var s = 'Mỗi ô là góc đánh lửa sớm trung vị ở vòng tua và áp suất cổ hút đó trong chuyến này; càng đậm càng sớm. Chấm cam là lùi lửa kích nổ (trên ECU này là lùi lửa lên lịch từ Knock Control). Khung viền là vùng ì máy.';
          if (I.lug && isNum(I.lug.ignDeltaShown)) s += ' Trong vùng ì máy góc lửa trung vị là ' + n1(F, I.lug.ign) + '° với ' + n1(F, I.lug.kr) + '° lùi lửa; cùng mức tải ở 2,000-3,000 rpm là ' + n1(F, I.lug.ignRef) + '° với ' + n1(F, I.lug.krRef) + '°. Máy làm việc vất vả nhất ở đó mà được ít mô-men nhất.';
          return s;
        }
      },
      afr: {
        title: 'Hòa khí khi có boost',
        legend: ['AFR đo được (5-95 %)', 'Trung vị', 'Mục tiêu của map khi tải tối đa', 'Giới hạn loãng 12.0'],
        explain: function (I, F) {
          var m = I.mix;
          var s = 'Mỗi cột là tỉ lệ khí-xăng đo được trong một dải boost (5-95 % số mẫu, chấm = trung vị). Đường gạch là thứ map yêu cầu khi tải tối đa; đường đỏ là giới hạn loãng, 12.0 AFR. Dưới đường gạch = giàu hơn yêu cầu: an toàn, chậm hơn một chút.';
          if (m && isNum(m.fullLoadAfr)) s += ' Chuyến này từ 12 psi trở lên: ' + n1(F, m.fullLoadAfr) + ' AFR so với ' + n1(F, m.mapAfr) + ' yêu cầu; loãng nhất giữ được ' + n1(F, m.leanest) + '.';
          return s;
        }
      },
      accel: {
        title: 'Các khoảng tăng tốc',
        legend: ['Thời gian tốt nhất, giữ chân ga từ 60 %', 'Đạp lút ga (từ 85 %)'],
        explain: function () { return 'Thời gian tốt nhất qua mỗi khoảng tốc độ khi giữ chân ga từ 60 % trở lên suốt quãng. Cột xanh đậm là lúc bạn đạp lút ga. Nhiệt làm các con số này thay đổi vài phần mười giây, nên chỉ so ở nhiệt độ khí nạp tương tự.'; }
      }
    },
    qualityTitle: 'Log này có gì',
    qualityChannels: {
      mixture: 'Hòa khí (cảm biến O2)', trims: 'Fuel trim', score: 'Điểm chất lượng xăng (Knock Control)', fuelPressure: 'Áp suất xăng',
      boost: 'Turbo Pressure', boostTarget: 'Turbo Pressure mục tiêu', iat: 'Nhiệt độ khí nạp', ect: 'Nhiệt độ nước làm mát', cvt: 'Nhiệt độ dầu CVT',
      lam: 'Hòa khí (cảm biến O2)', stft: 'Fuel trim', ltft: 'Fuel trim', kControl: 'Điểm chất lượng xăng (Knock Control)', fp: 'Áp suất xăng'
    },
    cantTell: {
      tooShort: function (c) { return 'Không kết luận được: chuyến quá ngắn. Log này xe chỉ chạy ' + c.movingSeconds + ' giây; một chuyến cần 60 giây xe chạy mới chấm được, và chuyến này không được tính vào lịch sử xe.'; },
      safety: function (c, names) { return 'Không kết luận được: ' + names.join(', ') + (c.missing && c.missing.length ? ' không có trong log' : ' đứng yên suốt chuyến') + '. Thiếu nó thì không thể chấm an toàn.'; }
    },
    channelFlat: function (name) { return name + ' đứng yên suốt chuyến: logger ghi một giá trị trong khi động cơ thay đổi.'; },
    channelMissing: function (name) { return name + ' không có trong log.'; },
    channelFix: function (name) { return 'Trong TunerView, gỡ ' + name + ' khỏi layout rồi thêm lại, sau đó log một chuyến ngắn và kiểm tra giá trị có nhảy không. Giữ nguyên mọi kênh đang log.'; },
    quality: function (I, F, T) {
      var q = I.quality, out = [];
      var names = function (keys) { return keys.map(function (k) { return (T.drive.qualityChannels || {})[k] || k; }); };
      if (q.cantTell && q.cantTell.reason === 'tooShort') out.push(T.drive.cantTell.tooShort(q.cantTell));
      else if (q.cantTell) out.push(T.drive.cantTell.safety(q.cantTell, names(q.cantTell.channels)));
      (q.flat || []).forEach(function (k) {
        var nm = names([k])[0];
        out.push(T.drive.channelFlat(nm) + ' ' + T.drive.channelFix(nm));
      });
      out.push((q.glitchTotal ? 'Đã bỏ ' + F.num(q.glitchTotal, 0) + ' giá trị không thể có (lỗi ghi log: ' + Object.keys(q.glitches).map(function (k) { return k + ' ' + q.glitches[k]; }).join(', ') + ')' : 'Không có lỗi ghi log') + '.');
      if (q.fuelCutSamples) out.push(F.num(q.fuelCutSamples, 0) + ' mẫu cảm biến O2 ở mức loãng tối đa (cắt xăng khi nhả ga) được loại khỏi số liệu hòa khí.');
      if (q.knockScheduled) out.push('Knock Retard ở đây đi theo Knock Control (lùi lửa ECU lên lịch), nên app đánh giá kích nổ bằng Knock Control.');
      if (q.missing.length) out.push('Còn thiếu: ' + q.missing.map(function (k) { return { afrCmd: 'lệnh AFR', mafHz: 'lưu lượng AFM' }[k] || k; }).join(', ') + '.');
      return out;
    },
    ask: {
      title: 'Hỏi về chuyến đi này',
      sub: 'Câu trả lời lấy từ số liệu của chuyến này. Câu trả lời có sẵn chạy không cần mạng. Với API key Anthropic của riêng bạn, AI giải thích bằng lời dễ hiểu: nó chỉ đọc được chuyến đi qua các công cụ cố định, mọi con số nó nêu đều được đối chiếu, và chỉ được đề xuất các việc có trong danh sách ở trên.',
      suggestions: ['Vì sao Knock Control tăng?', 'Hòa khí khi có boost có an toàn không?', 'Tôi có thể tăng boost không?', 'Nên làm gì trước, vì sao?', 'Giải thích bản đồ góc lửa'],
      graphQ: { kc: 'Vì sao Knock Control tăng trong chuyến này?', timing: 'Giải thích bản đồ góc lửa của chuyến này', afr: 'Hòa khí khi có boost có an toàn không, vì sao lại giàu?', accel: 'Xe tăng tốc nhanh cỡ nào trong chuyến này, và điều gì làm nó chậm lại?' },
      placeholder: 'Hỏi về chuyến đi này…', send: 'Hỏi',
      builtIn: 'Câu trả lời có sẵn', ai: 'Câu trả lời của AI', verified: 'Mọi con số đã được đối chiếu với chuyến này', repaired: 'Đã đối chiếu sau một lần sửa',
      unverified: 'Câu trả lời của AI không qua được bước đối chiếu số liệu, nên hiển thị câu trả lời có sẵn.', refused: 'AI từ chối câu hỏi này; đây là câu trả lời có sẵn.', failed: 'Không kết nối được AI; đây là câu trả lời có sẵn.',
      working: 'Đang đọc chuyến đi…', looked: 'AI đã xem những gì', issues: 'Lỗi đối chiếu',
      settings: 'Cài đặt AI (tùy chọn)', key: 'API key Anthropic', keyNote: 'Chỉ giữ trong tab này trừ khi bạn chọn Ghi nhớ. Chỉ gửi tới api.anthropic.com.', remember: 'Ghi nhớ key trên thiết bị này',
      model: 'Mô hình', loadModels: 'Tải danh sách mô hình', modelsLoaded: function (n) { return n + ' mô hình'; }, modelHint: 'Chọn một mô hình trong tài khoản của bạn.', noKey: 'Chưa có key: chỉ có câu trả lời có sẵn.',
      privacy: 'Gửi câu hỏi và các con số tóm tắt của chuyến này (không bao giờ gửi log gốc) tới Anthropic bằng key của bạn.',
      clear: 'Xóa'
    },
    offline: {
      kc: function (I, F) {
        if (!I.kc) return 'Log này không có Knock Control nên app không kết luận được. Hãy thêm kênh này vào TunerView.';
        var k = I.kc, s = 'Knock Control đi từ ' + n2(F, k.start) + ' tới ' + n2(F, k.end) + ' (đỉnh ' + n2(F, k.peak) + '). ';
        if (k.lugUpSteps) s += k.lugUpSteps + ' trên ' + k.upSteps + ' bước tăng xảy ra khi ì máy: khoảng ' + n0(F, k.upRpm) + ' rpm ở ' + n0(F, k.upVss) + ' km/h với chân ga nhẹ. Đó là hộp CVT giữ vòng tua thấp ở số D vào ngày nóng. Cách sửa: giữ vòng tua cao hơn (chế độ S hoặc gạt lẫy dưới 60 km/h). ';
        else if (k.upSteps) s += 'Các bước tăng phần lớn không phải lúc ì máy; hãy kiểm tra nhiệt khí nạp và xăng. ';
        else s += 'Nó không tăng trong chuyến này. ';
        return s + 'ECU tăng Knock Control khi nghe thấy kích nổ, và rút góc lửa ở mọi nơi cho tới khi nó giảm lại.';
      },
      afr: function (I, F) {
        var m = I.mix;
        if (!m || !isNum(m.fullLoadAfr)) return 'Chuyến này chưa đủ thời gian ở tải tối đa để đánh giá hòa khí.';
        return 'Có. Từ 12 psi trở lên đo được ' + n1(F, m.fullLoadAfr) + ' AFR so với ' + n1(F, m.mapAfr) + ' trong map, và không lúc nào giữ loãng hơn ' + n1(F, m.leanest) + ' (giới hạn là 12.0). Giàu hơn yêu cầu là phía an toàn. Muốn biết vì sao giàu, hãy log lệnh AFR.';
      },
      boost: function (I, F, P) {
        var lock = P.later.filter(function (a) { return a.id === 'moreBoost'; })[0];
        if (!lock) return 'Chỉ khi mọi mục kiểm tra đều OK. Xem Đòn bẩy 2 trong Quy trình đầy đủ.';
        return 'Chưa. Tăng boost bị khóa cho tới khi ' + lock.blockedBy.map(function (b) { return (I18N.vi.drive.blockers[b] || function () { return b; })(I, F); }).join('; ') + '.';
      },
      first: function (I, F, P) {
        var a = P.now[0];
        if (!a) return I18N.vi.drive.noActions;
        var d = I18N.vi.drive.actions[a.id] || I18N.vi.drive.actions.fix;
        var title = typeof d.title === 'function' ? d.title(a.check) : d.title;
        return 'Trước tiên: ' + title + '. Nó đứng đầu vì là ' + (a.tier === 'safety' ? 'việc sửa an toàn' : 'việc hiệu quả lớn nhất với công sức ít nhất') + ' trong chuyến này (' + I18N.vi.drive.badges.impact[a.impact].toLowerCase() + ', ' + I18N.vi.drive.badges.effort[a.effort].toLowerCase() + (a.flash ? ', cần nạp map' : ', không cần nạp map') + ').';
      },
      heat: function (I, F) { return 'Khí nạp: ' + n0(F, I.heat.iatMoving) + ' °C khi xe chạy, tới ' + n0(F, I.heat.iatStill) + ' °C khi đứng yên, các lần kéo bắt đầu ở ' + n0(F, I.boost && I.boost.pullIat) + ' °C. CVT cao nhất ' + n0(F, I.heat.cvtMax) + ' °C.'; },
      timing: function (I, F) { return I18N.vi.drive.graphs.timing.explain(I, F); },
      accel: function (I, F) { return I18N.vi.drive.feel(I.accel && I.accel.headline, F); },
      unknown: 'Câu trả lời có sẵn gồm: knock control, hòa khí, boost, nhiệt, góc lửa, tăng tốc và nên làm gì trước. Thêm API key trong Cài đặt AI để hỏi những câu khác.'
    },
    sources: SOURCES
  };
  I18N.vi.hints.lugging = {
    title: 'Ì máy',
    paras: ['Đòi mô-men ở vòng tua thấp: 900-1,700 rpm khi áp suất cổ hút gần hoặc trên áp suất khí quyển. Hộp CVT ở số D cố tình làm vậy để tiết kiệm xăng khi bạn đạp ga nhẹ.', 'Với máy turbo phun xăng trực tiếp, đây là chỗ áp suất trong xi-lanh cao lâu nhất trong mỗi kỳ nổ, nên nó kích nổ đầu tiên khi xăng nóng. Đây cũng là chỗ xảy ra đánh lửa sớm ở tốc độ thấp (LSPI), hiện tượng hiếm mà dầu API SP / GF-6 được thử nghiệm để chống lại.'],
    bands: [['good', 'dưới 2 % thời gian xe chạy, hoặc Knock Control không tăng'], ['watch', 'Knock Control tăng khi ì máy']],
    note: 'Sửa bằng chân phải, không phải bằng map: chế độ S hoặc gạt lẫy dưới 60 km/h để giữ vòng tua.'
  };
  I18N.vi.hints.kcsched = {
    title: 'Lùi lửa kích nổ theo lịch',
    paras: ['Trên ECU này, Knock Retard trong log là mức lùi lửa ECU lên lịch từ Knock Control và bảng của nó, không phải số lần kích nổ. Vì vậy nó nằm quanh 5° khi có boost với Knock Control bình thường 0.5, và bằng 0 khi chạy đều ở 2,000-3,000 rpm.', 'Nên app đánh giá kích nổ bằng Knock Control: mức của nó, và nó có tăng trong chuyến đi hay không.'],
    note: 'Riêng 5° đều đặn khi có boost không phải là vấn đề. Knock Control tăng dần mới là vấn đề.'
  };
  I18N.vi.terms.push(['lugging', 'Ì máy'], ['kcsched', 'Lùi lửa theo lịch']);

  // ---------------------------------------------------------------------------
  // Car history, Flashes, Shakedown drive, Unexplained change, History file
  // ---------------------------------------------------------------------------
  I18N.en.car = {
    bannerShakedown: function (done, total) { return 'Shakedown drive: drive calmly. ' + done + ' of ' + total + ' calm minutes done.'; },
    bannerPassed: 'Shakedown passed: the new Map measures air and fuel correctly.',
    bannerHard: 'You drove hard before the check finished.',
    bannerUnexplained: 'Something changed since your last drive.',
    whyTrim: 'worst trim moved more than 5 points',
    whyBoost: 'highest boost target moved more than 2 psi',
    whyScore: 'the score started high',
    answerFlashed: 'I flashed',
    answerFuel: 'New tank of fuel',
    answerNeither: 'Neither',
    fuelAdvice: 'New fuel needs 10–15 calm minutes before you judge it.',
    unexplainedWatch: 'Unexplained change.',
    flashCauseTitle: 'Stop right after a Flash.',
    flashCauseWhy: 'Fuel trims are far off from the first second, which usually means the Map’s AFM preset, not the engine.',
    driveTitle: 'This drive',
    mapRecorded: function (name, date) { return 'Map: ' + name + ' · since Flash ' + date; },
    mapMissing: 'Map: not recorded',
    addFlash: 'Add Flash',
    boostTarget: function (v) { return 'Highest boost target ' + v + ' psi.'; },
    boostTargetNone: 'No boost target logged on this drive.',
    logQuality: function (q) { return 'Log quality: ' + q + '.'; },
    qualityGood: 'Good', qualityMissing: 'Missing channels', qualityFlat: 'Flat channel', qualityShort: 'Too short',
    cool: 'Cool', hot: 'Hot', mild: 'Mild',
    historyTitle: 'Your car over time',
    historyLine: function (n, since, stops, map) { return (n === 1 ? '1 drive since ' : n + ' drives since ') + since + ' · ' + stops + ' · ' + map; },
    historyEmpty: 'Your history starts with this drive.',
    stops: function (n) { return n === 1 ? '1 Stop' : n + ' Stops'; },
    tableHeaders: ['Drive', 'Verdict', 'Score peak', 'Trim', 'IAT', 'CVT', 'Lug', '50–70', 'Map'],
    hide: 'Hide', unhide: 'Unhide',
    hideNote: 'Hidden drives leave the charts and never set the Baseline. The log stays untouched.',
    loadFolder: 'Load log folder',
    loadNote: 'Reads every TunerView CSV in the folder, oldest first. Nothing leaves this browser.',
    serveHint: 'If your browser will not open the folder, serve it instead: in the log folder run python3 -m http.server, then open http://localhost:8000.',
    loaded: function (n) { return n + ' drives read.'; },
    storeBlocked: 'Browser storage is blocked: the history lasts until you close this tab. Export a History file to keep it.',
    exportBtn: 'Export History file', importBtn: 'Import History file',
    imported: function (d, f) { return 'Merged: ' + d + ' new drives, ' + f + ' new Flashes. Nothing was deleted.'; },
    importError: 'That file is not a History file.',
    importFuture: function (v) { return 'This History file is from a newer app (version ' + v + '). Update the app first — nothing was imported.'; },
    hotRestart: 'Hot restart',
    flashesTitle: 'Flashes',
    flashesEmpty: 'No Flash recorded yet. Old drives show “Map: not recorded” until you add one.',
    flashWhen: 'Flash',
    changed: { afm: 'AFM preset', boost: 'Boost', fuel: 'Fuel', other: 'Other' },
    flashNew: 'Record a Flash', flashEdit: 'Edit', flashDelete: 'Delete',
    flashDeleteAsk: function (name) { return 'Delete the Flash “' + name + '”? The drives stay; their Map becomes “not recorded” again.'; },
    formTime: 'Date and time', formMap: 'Map name', formChanged: 'What changed', formNote: 'Note (optional)',
    formSave: 'Save Flash', formCancel: 'Cancel',
    formNeedTime: 'A Flash needs a date and time.', formNeedMap: 'A Flash needs a Map name.',
    finishShakedown: 'Finish the Shakedown drive: 10 calm minutes, then the rest unlocks.',
    proofBlocked: 'Can’t tell: the Map changed in between.',
    modeHint: 'Switched ECO / Normal? That moves boost targets with no Flash: choose Neither.',
    traffic: 'Traffic',
    highway: 'Highway',
    keyMoments: 'Key moments',
    momStop: function (t, label) { return 'Stop starts ' + t + ' — ' + label; },
    momWatch: function (t, label) { return 'Watch ' + t + ' — ' + label; },
    momPull: function (t, label) { return 'Hard pull ' + t + ' — ' + label; },
    momLug: function (t, label) { return 'Lugging ' + t + ' — ' + label; },
    momRestart: function (t) { return 'Hot restart ' + t + ' — intake already hot at start'; },
    momPullLabel: function (tgt, iat) { return 'target ' + tgt + ' psi, intake ' + iat + ' °C'; },
    momLugLabel: function (s) { return s + ' % of moving time'; },
    momWatchLabel: function (a, b) { return 'score ' + a + ' → ' + b; },
    whyTitle: 'Why this moment',
    paused: 'Paused until the Stop is fixed.',
    historyMapNone: 'Map not recorded before today',
    chartsBtn: 'Charts', tableBtn: 'Table',
    chartsHint: 'Tap a dot to open that drive.',
    chScore: 'Fuel-quality score peak', chTrim: 'Worst fuel trim', chIat: 'Intake while moving',
    chCvt: 'CVT peak', chLug: 'Lugging', chAccel: 'Best 50→70 km/h',
    yourNormal: function (v) { return 'your normal ' + v; },
    limitIs: function (v) { return 'limit ' + v; },
    perfTitle: 'Performance',
    perfLine: function (s, cmp) { return 'Best 50→70 km/h ' + s + ' s — ' + cmp; },
    perfBest: function (s) { return 'your best at similar intake (' + s + ' s)'; },
    perfOff: function (s, d) { return d + ' s off your best at similar intake (' + s + ' s)'; },
    perfNew: 'your first timed run at this intake — the next similar drive proves it',
    perfNot: function (why) { return 'not comparable to your best (' + why + ')'; },
    perfHotter: function (d) { return d + ' °C hotter than your best run'; },
    perfColder: function (d) { return d + ' °C colder than your best run'; },
    perfNote: 'Only runs within 8 °C of intake count: heat alone moves these by tenths.',
    queueLine: function (a, b, c) { return a + ' up next · ' + b + ' locked · ' + c + ' fine'; },
    qualityOk: 'Nothing missing: every channel the verdict needs is in this log.',
    qualitySome: function (names) { return 'Watch these channels: ' + names + '.'; },
    flashPlan: {
      title: 'Next Flash',
      sub: 'The only place that says what to change in your KTuner map: one table family with its evidence and proof — or an honest no-change.',
      see: 'See Next Flash',
      seeWhy: 'Map edits live in one place, so two screens can never disagree.',
      evidence: 'Evidence', basis: 'Basis', proof: 'How the next drive proves it',
      saveAs: 'Save as', undoIs: 'Undo',
      record: 'Record this Flash',
      leversTitle: 'Every lever, and what unlocks it',
      deferredTitle: 'Waits until the first change is proven',
      inKtuner: 'In KTuner',
      afmPaste: 'AFM Flow: a paste-ready row (tab-separated, 103 values)',
      copy: 'Copy row', copied: 'Copied',
      columnsNote: 'Cells are rpm row × column N of M, counted from the left as KTuner draws them: the load axis was not captured.',
      noMap: 'The map file did not load, so there is no table listing. The verdict above still stands.',
      status: { locked: 'Locked', deferred: 'Waiting', held: 'Waiting', planned: 'Planned', 'not-needed': 'Not needed', 'no-edit': 'No edit' },
      cellLine: function (rpm, col, of, before, after, unit, F) { return F.num(rpm) + ' rpm · column ' + col + ' of ' + of + ': ' + before + ' → ' + after + (unit ? ' ' + unit : ''); }
    }
  };
  I18N.vi.car = {
    bannerShakedown: function (done, total) { return 'Chuyến chạy rà (Shakedown): chạy nhẹ nhàng. Đã được ' + done + ' trên ' + total + ' phút êm.'; },
    bannerPassed: 'Chạy rà xong: Map mới đo gió và xăng đúng.',
    bannerHard: 'Bạn đã chạy mạnh trước khi kiểm tra xong.',
    bannerUnexplained: 'Có gì đó đã đổi từ chuyến trước.',
    whyTrim: 'trim tệ nhất lệch hơn 5 điểm',
    whyBoost: 'mục tiêu boost cao nhất lệch hơn 2 psi',
    whyScore: 'điểm số lúc khởi hành đã cao',
    answerFlashed: 'Tôi đã nạp map',
    answerFuel: 'Vừa đổ xăng mới',
    answerNeither: 'Không phải hai cái trên',
    fuelAdvice: 'Xăng mới cần 10–15 phút chạy êm rồi hãy đánh giá.',
    unexplainedWatch: 'Thay đổi chưa rõ nguyên nhân.',
    flashCauseTitle: 'Stop ngay sau khi nạp Map.',
    flashCauseWhy: 'Trim xăng lệch nhiều ngay từ giây đầu, thường là do preset AFM của Map chứ không phải động cơ.',
    driveTitle: 'Chuyến này',
    mapRecorded: function (name, date) { return 'Map: ' + name + ' · từ lần Flash ' + date; },
    mapMissing: 'Map: chưa ghi nhận',
    addFlash: 'Thêm Flash',
    boostTarget: function (v) { return 'Mục tiêu boost cao nhất ' + v + ' psi.'; },
    boostTargetNone: 'Chuyến này không log mục tiêu boost.',
    logQuality: function (q) { return 'Chất lượng log: ' + q + '.'; },
    qualityGood: 'Tốt', qualityMissing: 'Thiếu kênh', qualityFlat: 'Kênh đứng yên', qualityShort: 'Quá ngắn',
    cool: 'Mát', hot: 'Nóng', mild: 'Ấm',
    historyTitle: 'Xe của bạn theo thời gian',
    historyLine: function (n, since, stops, map) { return (n === 1 ? '1 chuyến từ ' : n + ' chuyến từ ') + since + ' · ' + stops + ' · ' + map; },
    historyEmpty: 'Lịch sử của bạn bắt đầu từ chuyến này.',
    stops: function (n) { return n + ' lần Stop'; },
    tableHeaders: ['Chuyến', 'Kết luận', 'Điểm đỉnh', 'Trim', 'IAT', 'CVT', 'Ì máy', '50–70', 'Map'],
    hide: 'Ẩn', unhide: 'Hiện lại',
    hideNote: 'Chuyến bị ẩn không lên biểu đồ và không đặt Baseline. Log gốc giữ nguyên.',
    loadFolder: 'Nạp cả thư mục log',
    loadNote: 'Đọc mọi file CSV TunerView trong thư mục, chuyến cũ trước. Không có gì rời khỏi trình duyệt này.',
    serveHint: 'Nếu trình duyệt không mở được thư mục, hãy serve nó: trong thư mục log chạy python3 -m http.server, rồi mở http://localhost:8000.',
    loaded: function (n) { return 'Đã đọc ' + n + ' chuyến.'; },
    storeBlocked: 'Bộ nhớ trình duyệt bị chặn: lịch sử chỉ giữ tới khi bạn đóng tab. Hãy xuất History file để giữ lại.',
    exportBtn: 'Xuất History file', importBtn: 'Nhập History file',
    imported: function (d, f) { return 'Đã gộp: ' + d + ' chuyến mới, ' + f + ' Flash mới. Không xóa gì cả.'; },
    importError: 'File đó không phải History file.',
    importFuture: function (v) { return 'History file này từ app bản mới hơn (bản ' + v + '). Hãy cập nhật app trước — chưa nhập gì cả.'; },
    hotRestart: 'Khởi động nóng',
    flashesTitle: 'Các lần Flash',
    flashesEmpty: 'Chưa ghi nhận lần Flash nào. Các chuyến cũ sẽ hiện “Map: chưa ghi nhận” cho tới khi bạn thêm.',
    flashWhen: 'Flash',
    changed: { afm: 'Preset AFM', boost: 'Boost', fuel: 'Xăng', other: 'Khác' },
    flashNew: 'Ghi nhận Flash', flashEdit: 'Sửa', flashDelete: 'Xóa',
    flashDeleteAsk: function (name) { return 'Xóa lần Flash “' + name + '”? Các chuyến đi vẫn giữ; Map của chúng lại thành “chưa ghi nhận”.'; },
    formTime: 'Ngày giờ', formMap: 'Tên Map', formChanged: 'Thứ đã đổi', formNote: 'Ghi chú (tùy chọn)',
    formSave: 'Lưu Flash', formCancel: 'Hủy',
    formNeedTime: 'Flash cần có ngày giờ.', formNeedMap: 'Flash cần có tên Map.',
    finishShakedown: 'Chạy nốt chuyến Shakedown: 10 phút êm, rồi các mục còn lại mới mở.',
    proofBlocked: 'Không kết luận được: Map đã đổi ở giữa.',
    modeHint: 'Bạn có đổi ECO / Normal? Nó làm mục tiêu boost đổi mà không cần Flash: hãy chọn Không phải.',
    traffic: 'Kẹt xe',
    highway: 'Đường trường',
    keyMoments: 'Điểm đáng chú ý',
    momStop: function (t, label) { return 'Bắt đầu Dừng ' + t + ' — ' + label; },
    momWatch: function (t, label) { return 'Theo dõi ' + t + ' — ' + label; },
    momPull: function (t, label) { return 'Lần kéo mạnh ' + t + ' — ' + label; },
    momLug: function (t, label) { return 'Ì máy ' + t + ' — ' + label; },
    momRestart: function (t) { return 'Nổ máy nóng ' + t + ' — khí nạp đã nóng từ đầu'; },
    momPullLabel: function (tgt, iat) { return 'mục tiêu ' + tgt + ' psi, khí nạp ' + iat + ' °C'; },
    momLugLabel: function (s) { return s + ' % thời gian xe chạy'; },
    momWatchLabel: function (a, b) { return 'điểm ' + a + ' → ' + b; },
    whyTitle: 'Vì sao có điểm này',
    paused: 'Tạm dừng cho tới khi sửa xong mục Dừng.',
    historyMapNone: 'Chưa ghi nhận Map nào trước hôm nay',
    chartsBtn: 'Biểu đồ', tableBtn: 'Bảng',
    chartsHint: 'Chạm một chấm để mở chuyến đó.',
    chScore: 'Đỉnh điểm chất lượng xăng', chTrim: 'Trim lệch nhất', chIat: 'Khí nạp khi xe chạy',
    chCvt: 'Đỉnh nhiệt CVT', chLug: 'Ì máy', chAccel: 'Nhanh nhất 50→70 km/h',
    yourNormal: function (v) { return 'bình thường của bạn ' + v; },
    limitIs: function (v) { return 'giới hạn ' + v; },
    perfTitle: 'Hiệu năng',
    perfLine: function (s, cmp) { return 'Nhanh nhất 50→70 km/h ' + s + ' giây — ' + cmp; },
    perfBest: function (s) { return 'ngang với tốt nhất của bạn ở nhiệt độ khí nạp tương tự (' + s + ' giây)'; },
    perfOff: function (s, d) { return 'chậm hơn ' + d + ' giây so với tốt nhất ở nhiệt độ tương tự (' + s + ' giây)'; },
    perfNew: 'lần chạy tính giờ đầu tiên ở nhiệt độ này — chuyến tương tự tiếp theo sẽ chứng minh',
    perfNot: function (why) { return 'không so được với tốt nhất của bạn (' + why + ')'; },
    perfHotter: function (d) { return 'nóng hơn ' + d + ' °C so với lần chạy tốt nhất'; },
    perfColder: function (d) { return 'mát hơn ' + d + ' °C so với lần chạy tốt nhất'; },
    perfNote: 'Chỉ tính các lần chạy trong 8 °C nhiệt độ khí nạp: riêng nhiệt độ đã làm lệch vài phần mười giây.',
    queueLine: function (a, b, c) { return a + ' việc tiếp · ' + b + ' việc khóa · ' + c + ' việc ổn'; },
    qualityOk: 'Không thiếu gì: mọi kênh cần để kết luận đều có trong log.',
    qualitySome: function (names) { return 'Chú ý các kênh này: ' + names + '.'; },
    flashPlan: {
      title: 'Lần Flash tiếp theo',
      sub: 'Nơi duy nhất nói cần đổi gì trong map KTuner của bạn: một nhóm bảng kèm bằng chứng và cách chứng minh — hoặc một câu trả lời trung thực là chưa cần đổi.',
      see: 'Xem Lần Flash tiếp theo',
      seeWhy: 'Mọi chỉnh map nằm ở một chỗ để hai màn hình không bao giờ mâu thuẫn.',
      evidence: 'Bằng chứng', basis: 'Căn cứ', proof: 'Chuyến sau chứng minh bằng cách nào',
      saveAs: 'Lưu thành', undoIs: 'Hoàn tác',
      record: 'Ghi nhận Flash này',
      leversTitle: 'Mọi đòn bẩy, và điều kiện để mở',
      deferredTitle: 'Chờ tới khi thay đổi đầu tiên được chứng minh',
      inKtuner: 'Trong KTuner',
      afmPaste: 'AFM Flow: hàng sẵn để dán (cách nhau bằng tab, 103 giá trị)',
      copy: 'Chép hàng', copied: 'Đã chép',
      columnsNote: 'Ô được ghi theo hàng rpm × cột N trên M, đếm từ trái như KTuner vẽ: trục tải không được ghi lại.',
      noMap: 'File map chưa tải được nên không liệt kê bảng. Kết luận ở trên vẫn đúng.',
      status: { locked: 'Đang khóa', deferred: 'Đang chờ', held: 'Đang chờ', planned: 'Đã lên kế hoạch', 'not-needed': 'Chưa cần', 'no-edit': 'Không sửa' },
      cellLine: function (rpm, col, of, before, after, unit, F) { return F.num(rpm) + ' rpm · cột ' + col + ' trên ' + of + ': ' + before + ' → ' + after + (unit ? ' ' + unit : ''); }
    }
  };
})();

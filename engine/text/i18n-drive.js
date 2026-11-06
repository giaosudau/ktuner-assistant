/* Text for the Drive check page: the 1-2-3 loop, the ranked actions, the engineering graphs and
 * the "Ask about this drive" helper, in English. Extends the object i18n.js exports.
 * Functions take the engine's numbers (ev, I) and the formatter F; they never invent numbers. */
(function () {
  'use strict';
  var en = require('./i18n.js');
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
  en.drive = {
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
      goodUnread: function (n) { return 'Nothing wrong seen, but ' + n + ' check' + (n === 1 ? '' : 's') + ' couldn\'t be read on this log.'; },
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
          return 'This log has no ' + names + '. Without the AFR command the app cannot tell whether a rich full-throttle mixture is asked for by the ECU or caused by an airflow error. Without MAF Hz it cannot compute a MAF correction. Two minutes in KTuner, no flash.';
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
      headroom: function (I, F) { return 'a logged pull shows the turbo can reach a higher target (today the turbo is near its limit: at ' + n1(F, I.boost && I.boost.peakBoost) + ' psi the wastegate is only ' + n1(F, I.boost && I.boost.wgAtPeak) + ' % open on this map, so more boost here mostly adds heat)'; },
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
      'ect-cold': 'Watch under 80 °C after 10 minutes moving: this map turns P0128 (thermostat) off; your cold starts pass 80 °C within 4 minutes',
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
        return 'Not now. More boost is locked until ' + lock.blockedBy.map(function (b) { return (en.drive.blockers[b] || function () { return b; })(I, F); }).join('; ') + '.';
      },
      first: function (I, F, P) {
        var a = P.now[0];
        if (!a) return en.drive.noActions;
        var d = en.drive.actions[a.id] || en.drive.actions.fix;
        var title = typeof d.title === 'function' ? d.title(a.check) : d.title;
        return 'First: ' + title + '. It is first because it is the ' + (a.tier === 'safety' ? 'safety fix' : 'biggest effect for the least work') + ' in this drive (' + en.drive.badges.impact[a.impact].toLowerCase() + ', ' + en.drive.badges.effort[a.effort].toLowerCase() + (a.flash ? ', needs a flash' : ', no flash') + ').';
      },
      heat: function (I, F) { return 'Intake air: ' + n0(F, I.heat.iatMoving) + ' °C while moving, up to ' + n0(F, I.heat.iatStill) + ' °C standing still, pulls started at ' + n0(F, I.boost && I.boost.pullIat) + ' °C. CVT peaked at ' + n0(F, I.heat.cvtMax) + ' °C.'; },
      timing: function (I, F) { return en.drive.graphs.timing.explain(I, F); },
      accel: function (I, F) { return en.drive.feel(I.accel && I.accel.headline, F); },
      unknown: 'The built-in answers cover knock control, mixture, boost, heat, timing, acceleration and what to do first. Add an API key in AI settings for other questions.'
    },
    sources: SOURCES
  };

  en.hints.lugging = {
    title: 'Lugging',
    paras: ['Asking for torque at low rpm: 900-1,700 rpm with the manifold near or above atmospheric pressure. The CVT in D does this on purpose to save fuel when you press gently.', 'On a turbo DI engine this is where cylinder pressure is high for the longest time per combustion, so it knocks first on hot fuel. It is also where low-speed pre-ignition happens, the rare event API SP / GF-6 oils are tested against.'],
    bands: [['good', 'under 2 % of moving time, or no Knock Control rise'], ['watch', 'Knock Control rises while lugging']],
    note: 'Fix it with the right foot, not the map: S mode or a paddle below 60 km/h keeps the revs up.'
  };
  en.hints.kcsched = {
    title: 'Scheduled knock retard',
    paras: ['On this ECU the logged Knock Retard is the retard the ECU schedules from Knock Control and its own table, not a count of knock events. That is why it sits at about 5° under boost at a normal Knock Control of 0.5, and at 0 at 2,000-3,000 rpm cruise.', 'So the app judges knock by Knock Control: its level, and whether it climbs during a drive.'],
    note: 'A steady 5° under boost is not a problem on its own. Knock Control climbing is.'
  };
  en.terms.push(['lugging', 'Lugging'], ['kcsched', 'Scheduled knock retard']);

  // ---------------------------------------------------------------------------
  // Car history, Flashes, Shakedown drive, Unexplained change, History file
  // ---------------------------------------------------------------------------
  en.car = {
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
    // Said in the owner's words, never as a status name: a fresh flash starts the
    // Fuel-quality score high and calm driving settles it (owner-voices.md §3).
    afterFlash: function (a) {
      return 'Knock Control started at ' + a.start.toFixed(2) + ' and settled to your Baseline (' +
        a.baseline.toFixed(2) + '): that is what a fresh flash does.';
    },
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

  module.exports = en;
})();

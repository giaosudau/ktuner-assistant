/*!
 * KTA car module: one owner's Car history, Flashes, Shakedown drive,
 * Unexplained change and the History file.
 *
 * Pure functions, no DOM, no storage: window.KTA in a browser, require() in Node.
 *   KTA.carEmpty()                          a fresh Car history
 *   KTA.carIngest(state, log, meta)         remember one drive (checkDrive runs inside)
 *   KTA.carReport(state, driveId)           what the screen shows for a remembered drive
 *   KTA.carRecordFlash / carEditFlash / carDeleteFlash
 *   KTA.carHide / carUnhide                 a Hidden drive leaves charts and the Baseline
 *   KTA.carAnswer(state, driveId, answer)   I flashed / New tank of fuel / Neither
 *   KTA.carBaseline(state)                  this car's own normal Fuel-quality score
 *   KTA.carMapAt(state, startMs)            the Map a drive ran on, never guessed
 *   KTA.carTableRows(state)                 the honest table behind the charts
 *   KTA.carChartSeries(state)               data stub for the charts (drawn elsewhere)
 *   KTA.carProofSpansFlash(state, a, b)     before/after across a Flash proves nothing
 *   KTA.carExport(state) / carImport(state, doc)  the History file, merged never overwritten
 *
 * Vocabulary is CONTEXT.md: Drive, Car history, Flash, Map, Shakedown drive,
 * Cool drive, Hot restart, Too-short drive, Hidden drive, Unexplained change,
 * History file, Verdict, Baseline, Fuel-quality score.
 * Verdict thresholds live in kta-engine.js / kta-drive.js (another ticket owns
 * them); this module only reads their numbers. The same log and car state
 * always give the same next state (pass meta.now to fix the clock in tests).
 */
(function (root, factory) {
  var KTA = typeof module === 'object' && module.exports ? require('./kta-drive.js') : root.KTA;
  var api = factory(KTA);
  if (typeof module === 'object' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (KTA) {
  'use strict';

  var isNum = KTA.util.isNum, median = KTA.util.median;

  var CAR_VERSION = 1;
  var DEFAULT_BASELINE = 0.49;   // the ECU's floor: every drive bottoms here (fact-check.md §2)
  var COOL_IAT = 42;             // a Cool drive breathes under 42 °C while moving
  var MIN_MOVING = 60;           // under 60 s moving: a Too-short drive, no verdict, no history
  var SHAKEDOWN_CALM = 600;      // 10 calm minutes bank the new Map
  var TRIM_OK = 5;               // ±5 %: this car's normal trims (fact-check.md §6)
  var TRIM_STOP = 10;            // beyond ±10 %: the wrong AFM preset until proven otherwise
  var SCORE_SHAKEDOWN = 0.06;    // a Shakedown passes with the score near the Baseline
  var TRIM_JUMP = 5;             // an Unexplained change moves the worst trim more than 5 points
  var TARGET_JUMP = 2;           // ... or the highest boost target more than 2 psi
  var SCORE_JUMP = 0.08;         // ... or starts the score this far above the Baseline
  var LEAN_WATCH = 0.5;          // AFR points leaner than the Map's full-load target
  var LEAN_STOP = 1.0;
  var VIETNAM_OFFSET = 7 * 3600 * 1000; // TunerView names are Vietnam wall time
  KTA.CAR_RULES = {
    version: CAR_VERSION, defaultBaseline: DEFAULT_BASELINE, coolIat: COOL_IAT,
    minMoving: MIN_MOVING, shakedownCalm: SHAKEDOWN_CALM, trimOk: TRIM_OK,
    scoreShakedown: SCORE_SHAKEDOWN, trimJump: TRIM_JUMP, targetJump: TARGET_JUMP,
    scoreJump: SCORE_JUMP
  };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  function emptyShakedown() { return { status: 'none', flashId: null, calmSec: 0, driveIds: [] }; }
  KTA.carEmpty = function () {
    return { version: CAR_VERSION, drives: {}, flashes: [], answers: {}, hidden: [], shakedown: emptyShakedown() };
  };
  function normalize(state) {
    var s = state && typeof state === 'object' ? state : {};
    return {
      version: CAR_VERSION,
      drives: s.drives && typeof s.drives === 'object' ? s.drives : {},
      flashes: Array.isArray(s.flashes) ? s.flashes : [],
      answers: s.answers && typeof s.answers === 'object' ? s.answers : {},
      hidden: Array.isArray(s.hidden) ? s.hidden : [],
      shakedown: s.shakedown && typeof s.shakedown === 'object'
        ? { status: s.shakedown.status || 'none', flashId: s.shakedown.flashId || null, calmSec: s.shakedown.calmSec || 0, driveIds: Array.isArray(s.shakedown.driveIds) ? s.shakedown.driveIds : [] }
        : emptyShakedown()
    };
  }
  function clone(state) { return JSON.parse(JSON.stringify(normalize(state))); }
  function nowOf(meta) { return (meta && isNum(meta.now)) ? meta.now : Date.now(); }

  // ---------------------------------------------------------------------------
  // Drive identity: the TunerView file name, else first timestamp + content hash
  // ---------------------------------------------------------------------------
  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8).slice(0, 6);
  }
  KTA.carIdentity = function (log, meta) {
    meta = meta || {};
    var m = meta.fileName ? /TunerView_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/.exec(meta.fileName) : null;
    if (m) {
      var start = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) - VIETNAM_OFFSET;
      return { id: m[1] + m[2] + m[3] + '-' + m[4] + m[5] + m[6], start: start };
    }
    var startMs = isNum(meta.startTime) ? meta.startTime : null;
    var sample = [log.n, Math.round(log.duration || 0)];
    if (log.has.rpm) for (var i = 0; i < Math.min(log.n, 50); i += 5) sample.push(Math.round(log.rpm[i] || 0));
    return { id: 'log-' + (startMs == null ? 'nostart' : startMs) + '-' + fnv1a((meta.fileName || '') + '|' + sample.join(',')), start: startMs };
  };

  // ---------------------------------------------------------------------------
  // Reading one drive out of a normalized log
  // ---------------------------------------------------------------------------
  function movingMask(log) {
    var n = log.n, has = log.has, m = new Uint8Array(n);
    for (var i = 0; i < n; i++) m[i] = has.vss ? (log.vss[i] >= 3 ? 1 : 0) : ((!has.rpm || log.rpm[i] >= 900) ? 1 : 0);
    return m;
  }
  function calmSeconds(log) {
    // Calm: moving, engine warm, boost under 4 psi.
    var n = log.n, has = log.has, mv = movingMask(log), s = 0;
    var load = has.load ? log.load : null, boost = has.boost ? log.boost : null;
    for (var i = 0; i < n; i++) {
      if (!mv[i]) continue;
      if (has.ect && !(log.ect[i] >= 70)) continue;
      if (load ? !(load[i] < 4) : (boost ? !(boost[i] < 4) : false)) continue;
      s += log.w[i];
    }
    return Math.round(s);
  }
  function startIat(log) {
    if (!log.has.iat) return null;
    var vals = [];
    for (var i = 0; i < log.n && log.t[i] <= 30; i++) if (isNum(log.iat[i])) vals.push(log.iat[i]);
    return vals.length ? median(vals) : null;
  }
  function flatChannels(log) {
    // A channel that does not move across the moving part while the revs do:
    // a dead logger channel, never a real value. (The verdict gate is the
    // drive check's; this list only travels with the summary.)
    var out = [], has = log.has, mv = movingMask(log);
    if (!log.has.rpm) return out;
    var rpmLo = Infinity, rpmHi = -Infinity;
    for (var i = 0; i < log.n; i++) {
      if (!mv[i] || !isNum(log.rpm[i])) continue;
      if (log.rpm[i] < rpmLo) rpmLo = log.rpm[i];
      if (log.rpm[i] > rpmHi) rpmHi = log.rpm[i];
    }
    if (!(rpmHi - rpmLo > 500)) return out;
    var chans = [
      ['boost', 0.5], ['boostTarget', 0.5], ['lam', 0.002], ['lamCmd', 0.002],
      ['kControl', 0.002], ['fp', 0.5], ['fpTarget', 0.5], ['stft', 0.05], ['ltft', 0.05]
    ];
    chans.forEach(function (c) {
      var key = c[0], eps = c[1], a = log[key];
      if (!has[key] || !a) return;
      var lo = Infinity, hi = -Infinity, k = 0;
      for (var j = 0; j < log.n; j++) {
        if (!mv[j] || !isNum(a[j])) continue;
        k++;
        if (a[j] < lo) lo = a[j];
        if (a[j] > hi) hi = a[j];
      }
      if (k > 10 && hi - lo <= eps) out.push(key);
    });
    return out;
  }

  function summarize(log, rep, ident, meta, verdict) {
    var I = rep.ins;
    var acc = I.accel && I.accel.best['50-70'] ? { seconds: I.accel.best['50-70'].seconds, iat: I.accel.best['50-70'].iat } : null;
    return {
      id: ident.id,
      start: ident.start,
      fileName: (meta && meta.fileName) || '',
      duration: I.meta.duration,
      moving: I.meta.movingSeconds,
      cool: I.heat.iatMoving != null && I.heat.iatMoving < COOL_IAT,
      hot: !!I.heat.hot,
      hotRestart: false, // set by ingest, which sees the previous drive
      tooShort: false,
      verdict: verdict,
      kcStart: I.kc ? I.kc.start : null,
      kcEnd: I.kc ? I.kc.end : null,
      kcPeak: I.kc ? I.kc.peak : null,
      trimWorst: I.trims ? I.trims.worst : null,
      iatMoving: I.heat.iatMoving,
      cvtPeak: I.heat.cvtMax,
      lugShare: I.lug ? I.lug.share : null,
      accel5070: acc,
      boostTarget: I.boost ? I.boost.peakTarget : null,
      mixLeanest: I.mix ? I.mix.leanest : null,
      mixTarget: I.mix ? I.mix.mapAfr : null,
      missing: (log.missing || []).slice(),
      flat: flatChannels(log),
      calmSec: calmSeconds(log),
      hardPulls: I.boost ? I.boost.hard : 0,
      shakedown: 'none', // this drive's role: none | pending | passed
      updatedAt: nowOf(meta)
    };
  }

  // ---------------------------------------------------------------------------
  // Baseline: this car's own normal Fuel-quality score
  // ---------------------------------------------------------------------------
  KTA.carBaseline = function (state) {
    var s = normalize(state), hidden = {};
    s.hidden.forEach(function (id) { hidden[id] = true; });
    var ends = Object.keys(s.drives)
      .map(function (id) { return s.drives[id]; })
      .filter(function (d) { return !hidden[d.id] && d.cool && isNum(d.kcEnd); })
      .map(function (d) { return d.kcEnd; });
    if (ends.length < 3) return { value: DEFAULT_BASELINE, n: ends.length };
    return { value: median(ends), n: ends.length };
  };

  // ---------------------------------------------------------------------------
  // Flashes and the Map a drive ran on (never guessed from the log)
  // ---------------------------------------------------------------------------
  var CHANGED = { afm: 1, boost: 1, fuel: 1, other: 1 };
  function slug(map) {
    return String(map || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 16) || 'map';
  }
  function sortFlashes(s) { s.flashes.sort(function (a, b) { return a.time - b.time || (a.id < b.id ? -1 : 1); }); }
  KTA.carRecordFlash = function (state, flash, meta) {
    var s = clone(state);
    if (!flash || !isNum(flash.time)) throw new Error('A Flash needs a date and time.');
    if (!flash.map || !String(flash.map).trim()) throw new Error('A Flash needs a Map name.');
    var base = 'f' + flash.time.toString(36) + '-' + slug(flash.map), id = base, k = 1;
    while (s.flashes.some(function (f) { return f.id === id; })) id = base + '-' + (++k);
    var rec = {
      id: id,
      time: flash.time,
      map: String(flash.map),
      changed: CHANGED[flash.changed] ? flash.changed : 'other',
      note: flash.note ? String(flash.note) : '',
      updatedAt: nowOf(meta)
    };
    s.flashes.push(rec);
    sortFlashes(s);
    // The next drive is a Shakedown drive.
    s.shakedown = { status: 'pending', flashId: id, calmSec: 0, driveIds: [] };
    return { state: s, flash: rec };
  };
  KTA.carEditFlash = function (state, id, patch, meta) {
    var s = clone(state), found = false;
    s.flashes.forEach(function (f) {
      if (f.id !== id) return;
      found = true;
      if (patch.time != null) { if (!isNum(patch.time)) throw new Error('A Flash needs a date and time.'); f.time = patch.time; }
      if (patch.map != null) { if (!String(patch.map).trim()) throw new Error('A Flash needs a Map name.'); f.map = String(patch.map); }
      if (patch.changed != null) f.changed = CHANGED[patch.changed] ? patch.changed : 'other';
      if (patch.note != null) f.note = String(patch.note);
      f.updatedAt = nowOf(meta);
    });
    if (!found) throw new Error('Flash not found: ' + id);
    sortFlashes(s);
    return s;
  };
  KTA.carDeleteFlash = function (state, id) {
    var s = clone(state);
    s.flashes = s.flashes.filter(function (f) { return f.id !== id; });
    if (s.shakedown.flashId === id) s.shakedown = emptyShakedown();
    return s;
  };
  KTA.carMapAt = function (state, startMs) {
    var s = normalize(state), best = null;
    s.flashes.forEach(function (f) {
      if (f.time <= startMs && (!best || f.time > best.time)) best = f;
    });
    return best ? { id: best.id, map: best.map, time: best.time, changed: best.changed } : null;
  };

  // ---------------------------------------------------------------------------
  // The main operation: check a drive, remember it, judge the new state
  // ---------------------------------------------------------------------------
  function orderedSummaries(s) {
    return Object.keys(s.drives)
      .map(function (id) { return s.drives[id]; })
      .sort(function (a, b) { return (a.start == null ? -1 : a.start) - (b.start == null ? -1 : b.start); });
  }
  function medianOf(vals) {
    var xs = vals.filter(isNum);
    return xs.length ? median(xs) : null;
  }
  function unexplainedFor(s, summary, baseline) {
    // Compared with the median of non-hidden drives since the last Flash
    // (at least 3), else the last 5 non-hidden drives.
    var hidden = {};
    s.hidden.forEach(function (id) { hidden[id] = true; });
    var prior = orderedSummaries(s).filter(function (d) {
      return d.id !== summary.id && !hidden[d.id] && d.start != null && summary.start != null && d.start < summary.start;
    });
    var flash = summary.start != null
      ? KTA.carMapAt({ drives: {}, flashes: s.flashes, answers: {}, hidden: [] }, summary.start)
      : null;
    var since = flash ? prior.filter(function (d) { return d.start >= flash.time; }) : prior;
    var ref = since.length >= 3 ? since : prior.slice(-5);
    var reasons = [];
    if (ref.length) {
      var trimMed = medianOf(ref.map(function (d) { return d.trimWorst; }));
      if (isNum(summary.trimWorst) && isNum(trimMed) && Math.abs(summary.trimWorst - trimMed) > TRIM_JUMP) reasons.push('trim');
      var tgtMed = medianOf(ref.map(function (d) { return d.boostTarget; }));
      if (isNum(summary.boostTarget) && isNum(tgtMed) && Math.abs(summary.boostTarget - tgtMed) > TARGET_JUMP) reasons.push('boost');
    }
    // The starting score needs no history: the Baseline alone judges it.
    if (isNum(summary.kcStart) && summary.kcStart >= baseline.value + SCORE_JUMP) reasons.push('score');
    return reasons.length ? { reasons: reasons } : null;
  }

  KTA.carIngest = function (state, log, meta, opts) {
    var s = clone(state);
    meta = meta || {};
    var rep = KTA.checkDrive(log, { history: (opts && opts.history) || [] });
    var ident = KTA.carIdentity(log, meta);
    var moving = rep.ins.meta.movingSeconds;
    var tooShort = !(moving >= MIN_MOVING);
    if (tooShort) {
      return {
        state: s,
        report: {
          identity: ident.id, tooShort: true, replaced: false, summary: null,
          verdict: 'nodata', baseline: KTA.carBaseline(s),
          map: { recorded: false, name: null, since: null },
          isShakedown: false,
          shakedown: { role: 'none', status: s.shakedown.status, calmSec: 0, needed: SHAKEDOWN_CALM, passed: false },
          flashCause: null, hardDrivingWatch: false,
          unexplained: null, unexplainedWatch: false,
          hotRestart: false, firstDrive: false,
          drive: rep
        }
      };
    }
    var verdict = rep.an.verdict;
    var summary = summarize(log, rep, ident, meta, verdict);
    var replaced = !!s.drives[summary.id];

    // Hot restart: within 30 min of the previous drive's end with the intake
    // already at 50 °C — or that intake alone when the previous drive is unknown.
    var siat = startIat(log);
    var prev = null;
    orderedSummaries(s).forEach(function (d) {
      if (d.start != null && summary.start != null && d.start < summary.start) prev = d;
    });
    if (isNum(siat) && siat >= 50) {
      summary.hotRestart = !prev || !isNum(prev.start) || !isNum(prev.duration)
        ? true
        : (summary.start - (prev.start + prev.duration * 1000) <= 30 * 60 * 1000);
    }

    s.drives[summary.id] = summary;
    var baseline = KTA.carBaseline(s);

    // Shakedown: only a drive that starts at or after the Flash banks minutes.
    // A pass already banked resets first: the next drive is ordinary again.
    if (s.shakedown.status === 'passed') s.shakedown = emptyShakedown();
    var flash = summary.start != null ? KTA.carMapAt(s, summary.start) : null;
    var pendingFlash = s.shakedown.status === 'pending'
      ? s.flashes.filter(function (f) { return f.id === s.shakedown.flashId; })[0] || null
      : null;
    var applies = !!(pendingFlash && summary.start != null && summary.start >= pendingFlash.time);
    if (applies) {
      // Re-checking replaces: take this drive's earlier share out first so
      // banked minutes never double-count.
      var shares = s.shakedown.shares || (s.shakedown.shares = {});
      if (replaced && isNum(shares[summary.id])) {
        s.shakedown.calmSec = Math.max(0, s.shakedown.calmSec - shares[summary.id]);
      }
      s.shakedown.calmSec += summary.calmSec;
      shares[summary.id] = summary.calmSec;
      if (s.shakedown.driveIds.indexOf(summary.id) < 0) s.shakedown.driveIds.push(summary.id);
      var trimsOk = isNum(summary.trimWorst) && Math.abs(summary.trimWorst) <= TRIM_OK;
      var scoreOk = isNum(summary.kcEnd) && summary.kcEnd <= baseline.value + SCORE_SHAKEDOWN;
      var lean = isNum(summary.mixLeanest) && isNum(summary.mixTarget) && summary.mixLeanest >= summary.mixTarget + LEAN_WATCH;
      if (s.shakedown.calmSec >= SHAKEDOWN_CALM && trimsOk && scoreOk && !lean) {
        s.shakedown.status = 'passed';
        summary.shakedown = 'passed';
      } else {
        summary.shakedown = 'pending';
      }
    }
    var isShakedown = summary.shakedown !== 'none';
    var passed = summary.shakedown === 'passed';

    // A Stop on a Shakedown drive names the Flash as the likely cause.
    var flashCause = null;
    if (isShakedown && verdict === 'stop' && pendingFlash) {
      var trimStop = isNum(summary.trimWorst) && Math.abs(summary.trimWorst) > TRIM_STOP;
      var leanStop = isNum(summary.mixLeanest) && isNum(summary.mixTarget) && summary.mixLeanest >= summary.mixTarget + LEAN_STOP;
      flashCause = {
        flashId: pendingFlash.id,
        map: pendingFlash.map,
        changed: pendingFlash.changed,
        trimStop: trimStop,
        leanStop: leanStop,
        advice: pendingFlash.changed === 'afm' || trimStop
          ? 'Re-flash the previous Map or the right preset.'
          : 'Re-flash the previous Map.'
      };
    }
    var hardDrivingWatch = isShakedown && !passed && (summary.hardPulls || 0) > 0;

    // Unexplained change: never on a Shakedown drive — the Flash explains it.
    var unexplained = (!isShakedown && s.answers[summary.id] == null)
      ? unexplainedFor(s, summary, baseline)
      : null;
    if (unexplained) unexplained.state = 'open';
    else if (s.answers[summary.id] != null) {
      var prior2 = orderedSummaries(s).filter(function (d) { return d.id !== summary.id; });
      unexplained = unexplainedFor(s, summary, baseline) || { reasons: [] };
      unexplained.state = 'answered-' + s.answers[summary.id];
    }
    var unexplainedWatch = s.answers[summary.id] === 'neither';

    var rows = KTA.carTableRows(s);
    return {
      state: s,
      replaced: replaced,
      report: {
        identity: summary.id, tooShort: false, replaced: replaced, summary: summary,
        verdict: verdict, baseline: baseline,
        map: flash ? { recorded: true, name: flash.map, since: flash.time } : { recorded: false, name: null, since: null },
        isShakedown: isShakedown,
        shakedown: {
          role: summary.shakedown, status: s.shakedown.status,
          calmSec: applies ? s.shakedown.calmSec : 0, needed: SHAKEDOWN_CALM, passed: passed
        },
        flashCause: flashCause, hardDrivingWatch: hardDrivingWatch,
        unexplained: unexplained, unexplainedWatch: unexplainedWatch,
        hotRestart: summary.hotRestart,
        firstDrive: rows.length > 0 && rows[0].id === summary.id,
        drive: rep
      }
    };
  };

  /** What the screen shows for a remembered drive, recomputed from the state. */
  KTA.carReport = function (state, driveId) {
    var s = normalize(state), summary = s.drives[driveId];
    if (!summary) return null;
    var baseline = KTA.carBaseline(s);
    var flash = summary.start != null ? KTA.carMapAt(s, summary.start) : null;
    var isShakedown = summary.shakedown !== 'none';
    var unexplained = s.answers[driveId] != null
      ? Object.assign(unexplainedFor(s, summary, baseline) || { reasons: [] }, { state: 'answered-' + s.answers[driveId] })
      : (!isShakedown ? Object.assign(unexplainedFor(s, summary, baseline) || {}, {}) : null);
    if (unexplained && !unexplained.state) unexplained = Object.assign(unexplained, { state: 'open' });
    if (unexplained && !unexplained.reasons) unexplained = null;
    // An answered drive whose reasons no longer fire keeps its answer, not a banner.
    if (!unexplained && s.answers[driveId] != null) unexplained = { reasons: [], state: 'answered-' + s.answers[driveId] };
    var rows = KTA.carTableRows(s);
    return {
      identity: driveId, tooShort: false, replaced: true, summary: summary,
      verdict: summary.verdict, baseline: baseline,
      map: flash ? { recorded: true, name: flash.map, since: flash.time } : { recorded: false, name: null, since: null },
      isShakedown: isShakedown,
      shakedown: {
        role: summary.shakedown, status: s.shakedown.status,
        calmSec: isShakedown ? s.shakedown.calmSec : 0, needed: SHAKEDOWN_CALM, passed: summary.shakedown === 'passed'
      },
      flashCause: null, hardDrivingWatch: false,
      unexplained: unexplained, unexplainedWatch: s.answers[driveId] === 'neither',
      hotRestart: summary.hotRestart,
      firstDrive: rows.length > 0 && rows[0].id === driveId,
      drive: null
    };
  };

  // ---------------------------------------------------------------------------
  // Hide / unhide, answers
  // ---------------------------------------------------------------------------
  KTA.carHide = function (state, driveId) {
    var s = clone(state);
    if (s.hidden.indexOf(driveId) < 0) s.hidden.push(driveId);
    return s;
  };
  KTA.carUnhide = function (state, driveId) {
    var s = clone(state);
    s.hidden = s.hidden.filter(function (id) { return id !== driveId; });
    return s;
  };
  KTA.carAnswer = function (state, driveId, answer) {
    var s = clone(state);
    if (['flashed', 'fuel', 'neither'].indexOf(answer) < 0) throw new Error('Answer one of: flashed, fuel, neither.');
    if (!s.drives[driveId]) throw new Error('Drive not in the Car history: ' + driveId);
    s.answers[driveId] = answer;
    return s;
  };

  // ---------------------------------------------------------------------------
  // Table rows and the chart stub (the charts themselves are another ticket)
  // ---------------------------------------------------------------------------
  KTA.carTableRows = function (state) {
    var s = normalize(state), hidden = {};
    s.hidden.forEach(function (id) { hidden[id] = true; });
    return orderedSummaries(s)
      .filter(function (d) { return !hidden[d.id]; })
      .map(function (d) {
        var flash = d.start != null ? KTA.carMapAt(s, d.start) : null;
        return {
          id: d.id, start: d.start, fileName: d.fileName,
          duration: d.duration, moving: d.moving,
          cool: d.cool, hot: d.hot, hotRestart: d.hotRestart,
          verdict: d.verdict,
          kcStart: d.kcStart, kcEnd: d.kcEnd, kcPeak: d.kcPeak,
          trimWorst: d.trimWorst, iatMoving: d.iatMoving, cvtPeak: d.cvtPeak,
          lugShare: d.lugShare,
          accel5070: d.accel5070 ? { seconds: d.accel5070.seconds, iat: d.accel5070.iat } : null,
          boostTarget: d.boostTarget,
          map: flash ? flash.map : null,
          shakedown: d.shakedown,
          answered: s.answers[d.id] || null
        };
      });
  };
  KTA.carChartSeries = function (state) {
    // Data only, one series per chart (another ticket draws them): six small
    // multiples sharing one x position per drive.
    var rows = KTA.carTableRows(normalize(state));
    function series(key, pick) {
      return {
        key: key,
        points: rows.map(function (r) {
          return { x: r.id, date: r.start, value: pick(r), cool: r.cool, verdict: r.verdict, map: r.map };
        })
      };
    }
    var s = normalize(state);
    return {
      stub: true,
      series: [
        series('kcPeak', function (r) { return r.kcPeak; }),
        series('trimWorst', function (r) { return r.trimWorst; }),
        series('iatMoving', function (r) { return r.iatMoving; }),
        series('cvtPeak', function (r) { return r.cvtPeak; }),
        series('lugShare', function (r) { return r.lugShare; }),
        series('accel5070', function (r) { return r.accel5070 ? r.accel5070.seconds : null; })
      ],
      flashes: s.flashes.map(function (f) { return { time: f.time, map: f.map }; }),
      baseline: KTA.carBaseline(s)
    };
  };

  /** A before/after that spans a Flash proves nothing about the habit. */
  KTA.carProofSpansFlash = function (state, beforeId, afterId) {
    var s = normalize(state), a = s.drives[beforeId], b = s.drives[afterId];
    if (!a || !b || a.start == null || b.start == null) return { spans: false, flash: null, message: '' };
    var lo = Math.min(a.start, b.start), hi = Math.max(a.start, b.start);
    var between = s.flashes.filter(function (f) { return f.time > lo && f.time <= hi; });
    if (!between.length) return { spans: false, flash: null, message: '' };
    var f = between[between.length - 1];
    return { spans: true, flash: { id: f.id, map: f.map, time: f.time }, message: "Can't tell: the Map changed in between." };
  };

  // ---------------------------------------------------------------------------
  // History file: export one JSON document, import by merging, never deleting
  // ---------------------------------------------------------------------------
  KTA.carExport = function (state) {
    var s = normalize(state);
    return {
      version: CAR_VERSION,
      exportedAt: new Date().toISOString(),
      drives: s.drives,
      flashes: s.flashes,
      hidden: s.hidden,
      answers: s.answers,
      shakedown: s.shakedown.status === 'none' ? undefined : s.shakedown
    };
  };
  KTA.carImport = function (state, doc) {
    var s = clone(state);
    if (!doc || typeof doc !== 'object') return { state: s, added: { drives: 0, flashes: 0 }, error: 'Not a History file.' };
    if (doc.version > CAR_VERSION) {
      return {
        state: s, added: { drives: 0, flashes: 0 },
        error: 'future-version', futureVersion: doc.version
      };
    }
    var added = { drives: 0, flashes: 0 };
    Object.keys(doc.drives || {}).forEach(function (id) {
      var inc = doc.drives[id];
      if (!inc || typeof inc !== 'object') return;
      var cur = s.drives[id];
      if (!cur || (isNum(inc.updatedAt) && isNum(cur.updatedAt) && inc.updatedAt > cur.updatedAt)) {
        if (!cur) added.drives++;
        s.drives[id] = inc;
      }
    });
    (doc.flashes || []).forEach(function (inc) {
      if (!inc || typeof inc !== 'object') return;
      var cur = s.flashes.filter(function (f) {
        return f.id === inc.id || (f.time === inc.time && f.map === inc.map);
      })[0];
      if (!cur) { s.flashes.push(inc); added.flashes++; }
      else if (isNum(inc.updatedAt) && isNum(cur.updatedAt) && inc.updatedAt > cur.updatedAt) {
        Object.keys(inc).forEach(function (k) { cur[k] = inc[k]; });
      }
    });
    sortFlashes(s);
    (doc.hidden || []).forEach(function (id) { if (s.hidden.indexOf(id) < 0) s.hidden.push(id); });
    Object.keys(doc.answers || {}).forEach(function (id) { if (s.answers[id] == null) s.answers[id] = doc.answers[id]; });
    if (s.shakedown.status === 'none' && doc.shakedown && doc.shakedown.status && doc.shakedown.status !== 'none') {
      s.shakedown = {
        status: doc.shakedown.status, flashId: doc.shakedown.flashId || null,
        calmSec: doc.shakedown.calmSec || 0,
        driveIds: Array.isArray(doc.shakedown.driveIds) ? doc.shakedown.driveIds : []
      };
      if (doc.shakedown.shares) s.shakedown.shares = doc.shakedown.shares;
    }
    return { state: s, added: added };
  };

  return KTA;
}));

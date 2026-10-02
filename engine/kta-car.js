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
 *   KTA.carFlashPlan(state, map, opts)       the Next Flash card model (spec P1–P9)
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
    var sh = (s.shakedown && typeof s.shakedown === 'object') ? s.shakedown : null;
    return {
      version: CAR_VERSION,
      drives: s.drives && typeof s.drives === 'object' ? s.drives : {},
      flashes: Array.isArray(s.flashes) ? s.flashes : [],
      answers: s.answers && typeof s.answers === 'object' ? s.answers : {},
      hidden: Array.isArray(s.hidden) ? s.hidden : [],
      shakedown: sh
        ? { status: sh.status || 'none', flashId: sh.flashId || null, calmSec: sh.calmSec || 0, driveIds: Array.isArray(sh.driveIds) ? sh.driveIds : [], shares: sh.shares && typeof sh.shares === 'object' ? sh.shares : {} }
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
  function engineFlat(rep) {
    // The drive check owns flat detection (its quality gate); the summary only
    // carries the list. Fall back to a local read when the engine predates it.
    if (rep && rep.an && Array.isArray(rep.an.flatChannels) && rep.an.flatChannels.length) return rep.an.flatChannels.slice();
    if (rep && rep.ins && rep.ins.quality && Array.isArray(rep.ins.quality.flat) && rep.ins.quality.flat.length) return rep.ins.quality.flat.slice();
    return null;
  }
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
      overshoot: I.boost ? I.boost.overshoot : null,
      wgAtPeak: I.boost ? I.boost.wgAtPeak : null,
      mixLeanest: I.mix ? I.mix.leanest : null,
      mixTarget: I.mix ? I.mix.mapAfr : null,
      missing: (log.missing || []).slice(),
      flat: engineFlat(rep) || flatChannels(log),
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
  /** The latest Flash strictly before the target (the known-good file for Undo). */
  function latestFlashBefore(s, target) {
    var best = null;
    s.flashes.forEach(function (f) {
      if (f.id === target.id) return;
      if (f.time < target.time || (f.time === target.time && f.id < target.id)) {
        if (!best || f.time > best.time || (f.time === best.time && f.id > best.id)) best = f;
      }
    });
    return best;
  }
  /** The likely cause of a Stop on a Shakedown drive: the Flash it ran on,
   *  plus the previous map file to undo to. Shared by carIngest and carReport
   *  so a reopened drive names the same Flash. */
  function flashCauseFor(s, flash, summary) {
    var trimStop = isNum(summary.trimWorst) && Math.abs(summary.trimWorst) > TRIM_STOP;
    var leanStop = isNum(summary.mixLeanest) && isNum(summary.mixTarget) && summary.mixLeanest >= summary.mixTarget + LEAN_STOP;
    var previousFlash = latestFlashBefore(s, flash);
    return {
      flashId: flash.id,
      map: flash.map,
      changed: flash.changed,
      previousMap: previousFlash ? { id: previousFlash.id, map: previousFlash.map, time: previousFlash.time } : null,
      trimStop: trimStop,
      leanStop: leanStop,
      advice: flash.changed === 'afm' || trimStop
        ? 'Re-flash the previous Map or the right preset.'
        : 'Re-flash the previous Map.'
    };
  }
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
      flashCause = flashCauseFor(s, pendingFlash, summary);
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
    // A Stop on a Shakedown drive names the Flash whenever the drive is viewed,
    // not just at ingest time.
    var flashCause = null;
    if (isShakedown && summary.verdict === 'stop' && flash) {
      flashCause = flashCauseFor(s, flash, summary);
    }
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
      flashCause: flashCause, hardDrivingWatch: false,
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
          overshoot: d.overshoot != null ? d.overshoot : null,
          wgAtPeak: d.wgAtPeak != null ? d.wgAtPeak : null,
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
    var doc = {
      version: CAR_VERSION,
      exportedAt: new Date().toISOString(),
      drives: s.drives,
      flashes: s.flashes,
      hidden: s.hidden,
      answers: s.answers
    };
    if (s.shakedown.status !== 'none') doc.shakedown = s.shakedown;
    return doc;
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

  // ---------------------------------------------------------------------------
  // Flash plan: the single set of map changes for the next Flash (spec P1–P9)
  //
  // KTA.carFlashPlan(state, map, opts) is pure engine, no DOM: input is the car
  // state (Car history, Flashes, answers, Hidden drives, Shakedown drive) plus
  // the digitized KTuner map (data/ktuner-maps-digitized.json, flat or wrapped
  // in { tables }), opts { now, history } where history is Prove-it records
  // [{ id, verdict }] in the planActions shape. Output is the Next Flash card
  // model: { kind: 'undo' | 'no-change' | 'one-family' } with tables and cells
  // (rpm row x column N of M, counted from the left: the load axis was not
  // captured), a paste-ready AFM row, a save-as name, an Undo name, a prefilled
  // Flash and evidence/basis/proof per change. The other agent renders it.
  //
  // Rules apply in order so two proposals can never conflict:
  //   P1 open Stop -> Undo (the previous map file) and nothing else.
  //   P2 open Watch / unfinished Shakedown drive / unanswered Unexplained
  //      change -> no gain lever; only a fix whose evidence is that very Watch.
  //   P3 habit first: lower boost at low rpm waits for keep the revs up proven.
  //   P4 one table family per Flash; the rest wait to be proven.
  //   P5 no cell changed twice; no same-family move before the previous Flash
  //      has a Prove-it (conservative: any same-family move, not just reversals,
  //      because Flash records carry no direction).
  //   P6 pairs move together (Boost 1=2=3 x L/H; WOT L=H), verified in the file.
  //   P7 bounds: AFM within +-10 % per round (LIMITS.mafStepMax) and rising; no
  //      boost raised below 3,000 rpm; boost at or under the ceiling; ignition,
  //      knock and protection tables never appear (TABLES role gate).
  //   P8 every change carries evidence, basis and proof.
  //   P9 no change is a valid plan, with every lever and its lock reason.
  //
  // Candidate shapes reuse the existing lever math: suggestBoostStep builds the
  // +1 psi lever (locked at the ceiling on this car), suggestWotLean builds the
  // WOT 11.0 -> 11.5 lever (locked provisional), LIMITS.mafStepMax caps the AFM
  // round, pairOf/TABLES enforce P6/P7, toRow renders the paste-ready AFM row.
  // ---------------------------------------------------------------------------
  var NORMAL_BOOST_IDS = [
    'Boost_Target_1_Normal_L', 'Boost_Target_1_Normal_H',
    'Boost_Target_2_Normal_L', 'Boost_Target_2_Normal_H',
    'Boost_Target_3_Normal_L', 'Boost_Target_3_Normal_H'
  ];
  var WOT_IDS = ['WOT_Enrich_L', 'WOT_Enrich_H'];
  var CHANGED_FAMILY = { afm: 'AFM Flow', boost: 'boost', fuel: 'mixture', other: null };
  var FAMILY_CHANGED = { 'AFM Flow': 'afm', mixture: 'fuel', boost: 'boost' };
  var FAMILY_ACTIONS = { 'AFM Flow': ['afm'], mixture: ['richWot', 'wotLean'], boost: ['lowBoost', 'moreBoost'] };
  var LEVER_ORDER = ['afm', 'mixture', 'boostPlus', 'boostLow', 'downpipe', 'hot'];

  function planTables(map) {
    if (!map || typeof map !== 'object') return {};
    if (map.tables && typeof map.tables === 'object') return map.tables;
    var looks = Object.keys(map).some(function (k) { return map[k] && Array.isArray(map[k].values); });
    return looks ? map : {};
  }
  function tableVals(T, id) {
    if (!T[id]) return null;
    try { return KTA.readTable(id, T[id]).values; } catch (e) { return null; }
  }
  function tableRpm(T, id) {
    if (!T[id]) return null;
    try { return KTA.readTable(id, T[id]).x; } catch (e) { return null; }
  }
  function tableMax(vals) {
    var m = -Infinity;
    vals.forEach(function (row) { row.forEach(function (v) { if (isNum(v) && v > m) m = v; }); });
    return m === -Infinity ? null : m;
  }
  function vnStamp(ms) {
    return new Date(ms + VIETNAM_OFFSET).toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
  }
  function vnDay(ms) { return vnStamp(ms).slice(0, 8); }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  function planRows(s) {
    var hidden = {};
    s.hidden.forEach(function (id) { hidden[id] = true; });
    return orderedSummaries(s).filter(function (d) { return !hidden[d.id]; });
  }
  function issueCause(d, baseline) {
    if (isNum(d.trimWorst) && Math.abs(d.trimWorst) > TRIM_OK) return 'trims';
    if (isNum(d.overshoot) && d.overshoot > 2.5) return 'overshoot';
    if (isNum(d.mixLeanest) && isNum(d.mixTarget) && d.mixLeanest >= d.mixTarget + LEAN_WATCH) return 'mixture';
    if ((isNum(d.kcEnd) && d.kcEnd >= baseline.value + SCORE_JUMP) ||
        (isNum(d.kcStart) && d.kcStart >= baseline.value + SCORE_JUMP)) return 'score';
    if (isNum(d.cvtPeak) && d.cvtPeak >= 90) return 'cvt';
    if (d.hot || (isNum(d.iatMoving) && d.iatMoving >= 50)) return 'heat';
    return 'unknown';
  }
  var UNEXPLAINED_CAUSE = { trim: 'trims', boost: 'boost-target', score: 'score' };
  function planOpenIssues(s, baseline) {
    var rows = planRows(s);
    var out = { stop: null, watch: null, shakedownPending: s.shakedown.status === 'pending', unexplained: [] };
    if (rows.length) {
      var last = rows[rows.length - 1];
      if (last.verdict === 'stop') out.stop = { driveId: last.id, start: last.start, cause: issueCause(last, baseline) };
      else if (last.verdict === 'watch') out.watch = { driveId: last.id, start: last.start, cause: issueCause(last, baseline) };
    }
    rows.forEach(function (d) {
      if (d.shakedown !== 'none' || s.answers[d.id] != null) return; // a Flash explains it, or it stays answered
      var u = unexplainedFor(s, d, baseline);
      if (u) out.unexplained.push({ driveId: d.id, reasons: u.reasons });
    });
    return out;
  }
  function openCauses(issues) {
    var out = [];
    if (issues.watch) out.push(issues.watch.cause);
    issues.unexplained.forEach(function (u) {
      u.reasons.forEach(function (r) { if (UNEXPLAINED_CAUSE[r]) out.push(UNEXPLAINED_CAUSE[r]); });
    });
    return out;
  }
  function lastFlashOf(s) { return s.flashes.length ? s.flashes[s.flashes.length - 1] : null; }
  function flashProven(s, history, flash, family) {
    var acts = FAMILY_ACTIONS[family] || [];
    if ((history || []).some(function (h) { return acts.indexOf(h.id) >= 0 && (h.verdict === 'keep' || h.verdict === 'partial'); })) return true;
    var hidden = {};
    s.hidden.forEach(function (id) { hidden[id] = true; });
    var laterGood = Object.keys(s.drives).some(function (id) {
      var d = s.drives[id];
      if (hidden[id] || d.start == null || !(d.start > flash.time)) return false;
      if (d.verdict === 'stop') return false;
      if (family === 'AFM Flow' && !(isNum(d.trimWorst) && Math.abs(d.trimWorst) <= TRIM_OK)) return false;
      if (family === 'boost' && !(d.verdict === 'good')) return false;
      return true;
    });
    if (laterGood) return true;
    // A passed Shakedown drive proves the new Map measures air and fuel
    // correctly (AFM Flow, mixture) — not that a boost change behaved.
    if ((family === 'AFM Flow' || family === 'mixture') &&
        s.shakedown.flashId === flash.id && s.shakedown.status === 'passed') return true;
    return false;
  }

  KTA.carFlashPlan = function (state, map, opts) {
    var s = normalize(state);
    opts = opts || {};
    var now = isNum(opts.now) ? opts.now : Date.now();
    var history = Array.isArray(opts.history) ? opts.history : [];
    var baseline = KTA.carBaseline(s);
    var issues = planOpenIssues(s, baseline);
    var T = planTables(map);
    var normals = {}, nok = true;
    NORMAL_BOOST_IDS.forEach(function (id) {
      var v = tableVals(T, id), rpm = tableRpm(T, id);
      if (!v || !rpm || v.length !== rpm.length) nok = false;
      else normals[id] = { rpm: rpm, values: v };
    });
    var customVals = tableVals(T, 'MAF_Scaling_Custom');
    var wotVals = tableVals(T, 'WOT_Enrich_H');
    var finalVals = tableVals(T, 'Final_Boost_Target_H') || tableVals(T, 'Final_Boost_Target_L');
    var mapOk = nok && !!customVals && !!wotVals;
    var normalPeak = null, ecoPeak = null, finalPeak = null;
    NORMAL_BOOST_IDS.forEach(function (id) {
      if (normals[id]) { var m = tableMax(normals[id].values); if (m != null && (normalPeak == null || m > normalPeak)) normalPeak = m; }
    });
    var ecoVals = tableVals(T, 'Boost_Target_1_ECO_H');
    if (ecoVals) ecoPeak = tableMax(ecoVals);
    if (finalVals) finalPeak = tableMax(finalVals);
    var ceiling = isNum(finalPeak) ? Math.min(KTA.LIMITS.boostCeilingPsi, finalPeak) : KTA.LIMITS.boostCeilingPsi;
    function sameTable(a, b) { return !!a && !!b && JSON.stringify(a.values) === JSON.stringify(b.values); }
    var pairsIdentical = mapOk ? {
      boost12: sameTable(normals[NORMAL_BOOST_IDS[0]], normals[NORMAL_BOOST_IDS[2]]) && sameTable(normals[NORMAL_BOOST_IDS[1]], normals[NORMAL_BOOST_IDS[3]]),
      boost23: sameTable(normals[NORMAL_BOOST_IDS[2]], normals[NORMAL_BOOST_IDS[4]]) && sameTable(normals[NORMAL_BOOST_IDS[3]], normals[NORMAL_BOOST_IDS[5]]),
      boostLH: NORMAL_BOOST_IDS.filter(function (id) { return /_L$/.test(id); }).every(function (id) { return sameTable(normals[id], normals[id.replace(/_L$/, '_H')]); }),
      wotLH: JSON.stringify(tableVals(T, 'WOT_Enrich_L')) === JSON.stringify(wotVals)
    } : null;

    var levers = [];
    function lever(id, family, title, status, reason, unlocks, wouldTouch, extra) {
      var l = { id: id, family: family, title: title, status: status, reason: reason, unlocks: unlocks, wouldTouch: wouldTouch || [] };
      if (extra) Object.keys(extra).forEach(function (k) { l[k] = extra[k]; });
      levers.push(l);
      return l;
    }

    // ---- P1: an open Stop -> Undo is the only plan ---------------------------
    if (issues.stop) {
      var stopD = s.drives[issues.stop.driveId];
      var target = stopD && stopD.start != null ? KTA.carMapAt(s, stopD.start) : lastFlashOf(s);
      var prev = target ? latestFlashBefore(s, target) : null;
      var undoName = prev
        ? 'Flash ' + prev.map + ' · ' + vnStamp(prev.time)
        : (target ? 'Flash ' + target.map + ' · ' + vnStamp(target.time) + ' (previous file not recorded)'
          : 'Previous map file not recorded — record your Flashes first');
      var trimRouted = stopD && isNum(stopD.trimWorst) && Math.abs(stopD.trimWorst) > TRIM_STOP;
      lever('afm', 'AFM Flow', 'AFM Flow curve', 'locked',
        'Superseded by the open Stop: undo first. Trims off everywhere route to pick the right preset / Undo, never a curve edit.',
        'Flash the previous map file, then a passing Shakedown drive.', []);
      lever('mixture', 'mixture', 'Mixture target (WOT 11.0 → 11.5)', 'locked',
        'Superseded by the open Stop: undo first.', 'Flash the previous map file, then a passing Shakedown drive.', WOT_IDS.slice());
      lever('boostPlus', 'boost', 'Boost +1 psi (24 psi map)', 'locked',
        'Superseded by the open Stop: undo first.', 'Flash the previous map file, then a passing Shakedown drive.', NORMAL_BOOST_IDS.slice());
      lever('boostLow', 'boost', 'Boost lower at low rpm', 'locked',
        'Superseded by the open Stop: undo first.', 'Flash the previous map file, then a passing Shakedown drive.', NORMAL_BOOST_IDS.slice());
      lever('downpipe', 'boost', 'Boost −1 psi at 2,500–3,250 rpm', 'locked',
        'Superseded by the open Stop: undo first.', 'Flash the previous map file, then a passing Shakedown drive.', NORMAL_BOOST_IDS.slice());
      lever('hot', null, 'Hot days', 'no-edit',
        'No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2).', '—', []);
      return {
        kind: 'undo', changeId: 'undo', family: null,
        headline: 'Stop open: flash your previous map file (' + undoName + ').',
        route: trimRouted ? 'preset' : 'previous-map',
        evidence: [{
          drives: [issues.stop.driveId],
          text: 'Drive ' + issues.stop.driveId + ' is a Stop' +
            (stopD && isNum(stopD.trimWorst) ? ' (worst trim ' + stopD.trimWorst.toFixed(1) + ' %)' : '') +
            (target ? ' on the Map from Flash ' + target.map + '.' : ' with no Flash recorded.'),
          basis: 'Data'
        }],
        basis: 'Data',
        proof: 'The next Shakedown drive passes: 10 calm minutes with trims within ±5 %, score near the Baseline, no lean mixture.',
        tables: [], cells: [], afmPasteRow: null,
        saveAs: null, undoName: undoName,
        prefill: { time: now, map: prev ? prev.map : (target ? target.map : ''), changed: target ? target.changed : 'other', note: 'Undo after the ' + issues.stop.driveId + ' Stop.' },
        deferred: [], levers: levers, openIssues: issues,
        mapFacts: { normalPeak: normalPeak, ecoPeak: ecoPeak, finalPeak: finalPeak, pairsIdentical: pairsIdentical },
        ceiling: ceiling
      };
    }

    // ---- Evidence window: the last 5 non-hidden drives; a Stop is a fault, ----
    // ---- not tuning evidence, so it never sets a correction. ------------------
    var rows = planRows(s);
    var window = rows.filter(function (d) { return d.verdict !== 'stop'; }).slice(-5);
    function nums(key) { return window.map(function (d) { return d[key]; }).filter(isNum); }
    var trimMed = medianOf(nums('trimWorst'));
    var overMax = nums('overshoot').length ? Math.max.apply(null, nums('overshoot')) : null;
    var lugMed = medianOf(nums('lugShare'));
    var wgMed = medianOf(nums('wgAtPeak'));
    var causes = openCauses(issues);
    // P2: an open Watch, an unfinished Shakedown drive or an unanswered
    // Unexplained change means no gain lever, and a fix may appear only for
    // that very Watch. A pending Shakedown drive alone (no open question)
    // defers everything to "Finish the Shakedown drive".
    var needMatch = causes.length > 0 || issues.shakedownPending;

    var lastF = lastFlashOf(s);
    function p5hold(family) {
      if (!lastF || CHANGED_FAMILY[lastF.changed] !== family) return false;
      return !flashProven(s, history, lastF, family);
    }

    // ---- Candidates (at most one family survives P4) --------------------------
    var cands = [];
    if (isNum(trimMed) && Math.abs(trimMed) > TRIM_OK) {
      if (Math.abs(trimMed) > TRIM_STOP) {
        lever('afm', 'AFM Flow', 'AFM Flow curve', 'locked',
          'Trims off everywhere (|median| ' + Math.abs(trimMed).toFixed(1) + ' %): pick the right AFM preset / re-flash the previous Map — never a curve edit (trims rule).',
          'Trims back within ±10 % on a calm drive.', ['MAF_Scaling_Custom']);
      } else if (mapOk) {
        cands.push({
          id: 'afmCurve', leverId: 'afm', family: 'AFM Flow', gain: false, matches: ['trims'],
          evidence: {
            drives: window.filter(function (d) { return isNum(d.trimWorst); }).map(function (d) { return d.id; }),
            text: 'Median worst trim ' + trimMed.toFixed(1) + ' % across the last ' + window.length + ' drives: inside some airflow bins, not everywhere (trims rule).',
            basis: 'Data'
          },
          proof: 'The next Shakedown drive holds cruise trims within ±5 % with no lean mixture.'
        });
      }
    }
    if (isNum(overMax) && overMax > 2.5 && mapOk) {
      cands.push({
        id: 'downpipe', leverId: 'downpipe', family: 'boost', gain: false, matches: ['overshoot'],
        evidence: {
          drives: window.filter(function (d) { return isNum(d.overshoot) && d.overshoot > 2.5; }).map(function (d) { return d.id; }),
          text: 'Boost overshoot ' + overMax.toFixed(1) + ' psi, over the 2.5 psi hold.',
          basis: 'Data'
        },
        proof: 'Two pulls hold overshoot under +2.5 psi with full-load mixture on target.'
      });
    }
    var revsProven = history.some(function (h) { return h.id === 'revs' && (h.verdict === 'keep' || h.verdict === 'partial'); });
    if (!revsProven) {
      lever('boostLow', 'boost', 'Boost lower at low rpm', 'locked',
        'Locked by P3: keep the revs up comes first — free beats a Flash.',
        'Try keep the revs up; if the score still rises while lugging, this lever unlocks.', NORMAL_BOOST_IDS.slice());
    } else if (isNum(lugMed) && lugMed >= 3 && mapOk) {
      cands.push({
        id: 'boostLow', leverId: 'boostLow', family: 'boost', gain: false, matches: ['score'],
        evidence: {
          drives: window.filter(function (d) { return isNum(d.lugShare); }).map(function (d) { return d.id; }),
          text: 'Lugging persists (median ' + lugMed.toFixed(1) + ' %) after keep the revs up was proven.',
          basis: 'Data'
        },
        proof: 'The next town drive shows no score rise from lugging.'
      });
    } else if (mapOk) {
      lever('boostLow', 'boost', 'Boost lower at low rpm', 'not-needed',
        'Not needed: lugging is down' + (isNum(lugMed) ? ' (median ' + lugMed.toFixed(1) + ' %)' : '') + ' with the habit proven.',
        'Lugging median back above 3 % with score rises.', NORMAL_BOOST_IDS.slice());
    }

    // ---- P2/P3/P5 gate per candidate, first blocker names the status ------------
    var FAMILY_RANK = { 'AFM Flow': 0, boost: 1, mixture: 2 };
    var CAND_RANK = { afmCurve: 0, downpipe: 1, boostLow: 2 };
    cands.forEach(function (c) {
      c.block = null;
      if (needMatch && c.matches.every(function (m) { return causes.indexOf(m) < 0; })) {
        c.block = {
          status: 'deferred',
          reason: issues.shakedownPending && !causes.length
            ? 'Finish the Shakedown drive first: while it is open nothing else is planned (P2).'
            : 'An open ' + causes.join(' + ') + ' question comes first; this fix answers a different one (P2).',
          unlocks: issues.shakedownPending && !causes.length ? 'A passing Shakedown drive.' : 'After the open question clears.'
        };
      } else if (p5hold(c.family)) {
        c.block = {
          status: 'held',
          reason: 'Held: the last Flash already touched ' + c.family + ' — no move before its Prove-it (P5).',
          unlocks: 'After the ' + c.family + ' Flash is proven (Prove-it: keep).'
        };
      }
    });
    var firing = cands.filter(function (c) { return !c.block; })
      .sort(function (a, b) { return (CAND_RANK[a.id] - CAND_RANK[b.id]) || (FAMILY_RANK[a.family] - FAMILY_RANK[b.family]); });
    var winner = firing.length ? firing[0] : null;
    var deferred = [];
    cands.forEach(function (c) {
      if (c === winner || c.block) return;
      deferred.push({ id: c.id, family: c.family, note: 'After the first change (' + winner.id + ') is proven.' });
    });

    // ---- Lever rows for the six spec levers --------------------------------------
    function leverFor(id) { return levers.filter(function (l) { return l.id === id; })[0]; }
    if (!leverFor('afm')) {
      if (winner && winner.leverId === 'afm') {
        lever('afm', 'AFM Flow', 'AFM Flow curve', 'planned', 'In the plan below.', 'The Shakedown drive proves it.', ['MAF_Scaling_Custom']);
      } else {
        var heldAfm = cands.filter(function (c) { return c.leverId === 'afm' && c.block; })[0];
        var defAfm = deferred.filter(function (d) { return d.id === 'afmCurve'; })[0];
        if (heldAfm) lever('afm', 'AFM Flow', 'AFM Flow curve', heldAfm.block.status, heldAfm.block.reason, heldAfm.block.unlocks, ['MAF_Scaling_Custom']);
        else if (defAfm) lever('afm', 'AFM Flow', 'AFM Flow curve', 'deferred', 'After the first change (' + winner.id + ') is proven (P4: one family per Flash).', 'After the first change is proven.', ['MAF_Scaling_Custom']);
        else lever('afm', 'AFM Flow', 'AFM Flow curve', 'not-needed',
          'No change: trims within ±5 %' + (isNum(trimMed) ? ' (median ' + trimMed.toFixed(1) + ' %)' : ' (no trim data yet)') + '.',
          'A drive whose trims pass ±5 % in some airflow bins.', ['MAF_Scaling_Custom']);
      }
    }
    var wotTouch = WOT_IDS.slice();
    var b2detail = '';
    if (mapOk && normals[NORMAL_BOOST_IDS[0]]) {
      try {
        var step = KTA.suggestBoostStep(ceiling, normals[NORMAL_BOOST_IDS[0]].values);
        b2detail = step.atCeiling ? ' The +1 psi math already returns zero cells at the ceiling.' : '';
      } catch (e) { b2detail = ''; }
    }
    lever('mixture', 'mixture', 'Mixture target (WOT 11.0 → 11.5)', 'locked',
      'Locked, provisional: no evidence of gain on this car; measured already 10.1–10.7 under boost against the 11.0 target.', 'The AFR command is logged, the car is healthy in heat, and a like-for-like proof is possible.', wotTouch);
    lever('boostPlus', 'boost', 'Boost +1 psi (24 psi map)', 'locked',
      'Locked: wastegate ' + (isNum(wgMed) ? wgMed.toFixed(1) : 'about 3') + ' % open at peak, so no headroom.' + b2detail, 'Never on this turbo.', NORMAL_BOOST_IDS.slice());
    if (!leverFor('boostLow')) {
      if (winner && winner.leverId === 'boostLow') {
        lever('boostLow', 'boost', 'Boost lower at low rpm', 'planned', 'In the plan below.', 'The next town drive proves it.', NORMAL_BOOST_IDS.slice());
      } else {
        var heldLow = cands.filter(function (c) { return c.leverId === 'boostLow' && c.block; })[0];
        var defLow = deferred.filter(function (d) { return d.id === 'boostLow'; })[0];
        if (heldLow) lever('boostLow', 'boost', 'Boost lower at low rpm', heldLow.block.status, heldLow.block.reason, heldLow.block.unlocks, NORMAL_BOOST_IDS.slice());
        else if (defLow) lever('boostLow', 'boost', 'Boost lower at low rpm', 'deferred', 'After the first change (' + winner.id + ') is proven (P4: one family per Flash).', 'After the first change is proven.', NORMAL_BOOST_IDS.slice());
      }
    }
    if (!leverFor('downpipe')) {
      if (winner && winner.leverId === 'downpipe') {
        lever('downpipe', 'boost', 'Boost −1 psi at 2,500–3,250 rpm', 'planned', 'In the plan below.', 'Two pulls prove it.', NORMAL_BOOST_IDS.slice());
      } else {
        var heldDp = cands.filter(function (c) { return c.leverId === 'downpipe' && c.block; })[0];
        var defDp = deferred.filter(function (d) { return d.id === 'downpipe'; })[0];
        if (heldDp) lever('downpipe', 'boost', 'Boost −1 psi at 2,500–3,250 rpm', heldDp.block.status, heldDp.block.reason, heldDp.block.unlocks, NORMAL_BOOST_IDS.slice());
        else if (defDp) lever('downpipe', 'boost', 'Boost −1 psi at 2,500–3,250 rpm', 'deferred', 'After the first change (' + winner.id + ') is proven (P4: one family per Flash).', 'After the first change is proven.', NORMAL_BOOST_IDS.slice());
        else lever('downpipe', 'boost', 'Boost −1 psi at 2,500–3,250 rpm', 'not-needed',
          'Not needed: overshoot ' + (isNum(overMax) ? 'max ' + overMax.toFixed(1) : 'never over 2.5') + ' psi.',
          'Overshoot above 2.5 psi held on pulls.', NORMAL_BOOST_IDS.slice());
      }
    }
    lever('hot', null, 'Hot days', 'no-edit',
      'No edit needed: ECO mode already runs the 18 psi targets (KTuner Starter 21 Dual Tune 2)' +
      (isNum(ecoPeak) ? ' (file peak ' + ecoPeak.toFixed(0) + ' psi)' : '') + '.', '—', []);
    levers.sort(function (a, b) { return LEVER_ORDER.indexOf(a.id) - LEVER_ORDER.indexOf(b.id); });
    cands.forEach(function (c) {
      if (!c.block) return;
      var l = leverFor(c.leverId);
      if (l && (l.status === 'planned' || l.status === 'not-needed' || l.status === 'locked')) { l.status = c.block.status; l.reason = c.block.reason; l.unlocks = c.block.unlocks; }
    });

    // ---- P9: no firing candidate --------------------------------------------------
    if (!winner) {
      return {
        kind: 'no-change', changeId: null, family: null,
        headline: 'Your logs support no map change right now.',
        evidence: [], basis: 'Data',
        proof: null, tables: [], cells: [], afmPasteRow: null,
        saveAs: null, undoName: null, prefill: null,
        deferred: deferred, levers: levers, openIssues: issues,
        mapFacts: { normalPeak: normalPeak, ecoPeak: ecoPeak, finalPeak: finalPeak, pairsIdentical: pairsIdentical },
        ceiling: ceiling
      };
    }

    // ---- Expand the one family (P6 pairs, P7 bounds) -------------------------------
    var tables = [], cells = [], afmPasteRow = null, afmAfter = null, afmPct = null;
    var proof = winner.proof, basis = winner.evidence.basis;
    if (winner.family === 'AFM Flow') {
      if (KTA.TABLES.MAF_Scaling_Custom.role !== 'edit') throw new Error('AFM Flow is not an editable table.');
      var factor = clamp(trimMed / 100, -KTA.LIMITS.mafStepMax, KTA.LIMITS.mafStepMax);
      afmAfter = customVals.map(function (v) { return Math.round(v * (1 + factor) * 1000) / 1000; });
      var k;
      for (k = 1; k < afmAfter.length; k++) if (!(afmAfter[k] > afmAfter[k - 1])) afmAfter[k] = Math.round(afmAfter[k - 1] * 1.002 * 1000) / 1000;
      afmPct = afmAfter.map(function (v, i) { return customVals[i] ? (v / customVals[i] - 1) * 100 : 0; });
      afmPasteRow = KTA.toRow(afmAfter);
      tables.push({ id: 'MAF_Scaling_Custom', kind: 'curve', cells: [], pasteRow: afmPasteRow });
    } else if (winner.family === 'boost') {
      var refId = NORMAL_BOOST_IDS[0];
      var ref = normals[refId];
      var wantRows = winner.id === 'downpipe' ? [2500, 2750, 3000] : null; // downpipe overshoot band
      var gate = winner.id === 'downpipe' ? 8 : 6;
      var shape = [];
      ref.values.forEach(function (row, r) {
        if (wantRows ? wantRows.indexOf(ref.rpm[r]) < 0 : !(ref.rpm[r] >= 1250 && ref.rpm[r] <= 2250)) return;
        row.forEach(function (v, c) {
          if (!(v >= gate)) return;
          shape.push({ rpm: ref.rpm[r], rpmRow: r, col: c + 1, of: row.length, delta: -1 });
        });
      });
      NORMAL_BOOST_IDS.forEach(function (id) {
        if (KTA.TABLES[id].role !== 'edit') throw new Error(id + ' is not an editable table (P7).');
        var tcells = shape.map(function (cell) {
          var before = normals[id].values[cell.rpmRow][cell.col - 1];
          var after = Math.round(Math.min(before + cell.delta, ceiling) * 10) / 10;
          // P7: no boost raised below 3,000 rpm — a raise here is dropped, never shipped.
          if (cell.rpm < 3000 && after > before + 1e-9) return null;
          return { table: id, rpm: cell.rpm, rpmRow: cell.rpmRow, col: cell.col, of: cell.of, before: before, after: after };
        }).filter(Boolean);
        tables.push({ id: id, kind: 'map', cells: tcells });
        tcells.forEach(function (c) { cells.push(c); });
      });
    }
    var revCount = s.flashes.filter(function (f) { return CHANGED_FAMILY[f.changed] === winner.family; }).length;
    var mapName = lastF ? lastF.map : 'Starter 21';
    var saveAs = mapName + ' · ' + vnDay(now) + ' · ' + winner.family + ' r' + (revCount + 1);
    var undoPrev = lastF;
    var undoName2 = undoPrev ? 'Flash ' + undoPrev.map + ' · ' + vnStamp(undoPrev.time) : 'Previous map file not recorded';
    return {
      kind: 'one-family', changeId: winner.id, family: winner.family,
      headline: winner.id === 'afmCurve'
        ? 'AFM Flow: ' + (trimMed < 0 ? '−' : '+') + Math.abs(trimMed).toFixed(1) + ' % everywhere the log corrects, because the median worst trim is ' + trimMed.toFixed(1) + ' %.'
        : winner.id === 'downpipe'
          ? 'Boost targets, low rpm: −1 psi at 2,500–3,250 rpm, because overshoot held ' + overMax.toFixed(1) + ' psi.'
          : 'Boost targets, low rpm: −1 psi at 1,250–2,250 rpm, because lugging persists after the habit was proven.',
      evidence: [Object.assign({ drives: winner.evidence.drives, text: winner.evidence.text }, { basis: basis })],
      basis: basis, proof: proof,
      tables: tables, cells: cells,
      afmPasteRow: afmPasteRow, afmAfter: afmAfter, afmPct: afmPct,
      saveAs: saveAs, undoName: undoName2,
      prefill: { time: now, map: saveAs, changed: FAMILY_CHANGED[winner.family], note: winner.id + ': ' + winner.evidence.text },
      deferred: deferred, levers: levers, openIssues: issues,
      mapFacts: { normalPeak: normalPeak, ecoPeak: ecoPeak, finalPeak: finalPeak, pairsIdentical: pairsIdentical },
      ceiling: ceiling
    };
  };

  return KTA;
}));

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
 *   KTA.carMapVersions(state)               every Map version the app holds, in order
 *   KTA.carActiveMapVersion(state)          the Map version the car is on now
 *   KTA.carRecordBasemap(state, opts)       Map version 1: the KTuner basemap, no Shakedown
 *   KTA.carMapAt(state, startMs)            the Map version a drive ran on, never guessed
 *   KTA.carMapVersionBefore(state, n)       the version before n — the file Undo names
 *   KTA.carTableRows(state)                 the honest table behind the charts
 *   KTA.carChartSeries(state)               data stub for the charts (drawn elsewhere)
 *   KTA.carProofSpansFlash(state, a, b)     before/after across a Flash proves nothing
 *   KTA.carExport(state) / carImport(state, doc)  the History file, merged never overwritten
 *   KTA.carFlashPlan(state, map, opts)       the Next Flash card model (spec P1–P9)
 *   KTA.carOpenSteps(list)                   the Open steps as they are stored, one per key
 *   KTA.carSettle(state, driveId, steps)     judge every Open step against one Drive
 *   KTA.carDiagnose(state, driveId, opts)    one cause per symptom pattern, before deciding
 *   KTA.carNextStep(state, driveId, steps)   exactly one Next step, and the Open step it opens
 *   KTA.carQuestions(state, driveId, opts)   owner questions with tap-to-answer choices
 *   KTA.mafOptionFor(housing)                the MAF Scaling option for one housing
 *
 * Vocabulary is CONTEXT.md: Drive, Car history, Flash, Map, Map version, KTuner
 * basemap, Shakedown drive, Cool drive, Hot restart, Too-short drive, Hidden drive,
 * Unexplained change, History file, Verdict, Baseline, Fuel-quality score, Next
 * step, Open step, Drives to proof, Wasted drive. Verdict thresholds live in
 * kta-engine.js / kta-drive.js (another ticket owns them); this module only reads
 * their numbers. The same log and car state always give the same next state
 * (pass meta.now to fix the clock in tests).
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
  var TARGET_REF_MIN = 3;        // Drives with pulls needed before boost targets are compared
                                 // (the same floor as every other median here: 1 drive is not a normal)
  var SCORE_JUMP = 0.08;         // ... or starts the score this far above the Baseline
  var AFTER_FLASH_START = 0.60;  // a Drive starting at or below this and settling to the
                                 // Baseline is what a fresh flash does (owner-voices.md §3),
                                 // not an Unexplained change. A start above it still counts.
  var LEAN_WATCH = 0.5;          // AFR points leaner than the Map's full-load target
  var LEAN_STOP = 1.0;
  var LUG_OK = 4;               // under 4 % of moving time lugging: keep-the-revs-up is holding
  var LUG_RISE_OK = 0.03;       // a Fuel-quality score that ends within 0.03 of its start: holding
  var LUG_RISE_SEEN = 0.08;     // a rise of 0.08 or more: the lugging cause seen today
  var LUG_STEPS_SHARE = 0.5;    // ... and more than half of its step-ups came while lugging
  var UPLOAD_SCORE = 0.60;      // Knock Control on the gauge that means "upload and tell me":
                                 // the loop's own trigger when there is nothing else to ask
  var KTUNER_BASEMAP = 'Starter 21 Dual Tune 2'; // the KTuner basemap this car started from
  var VIETNAM_OFFSET = 7 * 3600 * 1000; // TunerView names are Vietnam wall time
  KTA.CAR_RULES = {
    version: CAR_VERSION, defaultBaseline: DEFAULT_BASELINE, coolIat: COOL_IAT,
    minMoving: MIN_MOVING, shakedownCalm: SHAKEDOWN_CALM, trimOk: TRIM_OK,
    scoreShakedown: SCORE_SHAKEDOWN, trimJump: TRIM_JUMP, targetJump: TARGET_JUMP,
    scoreJump: SCORE_JUMP, afterFlashStart: AFTER_FLASH_START,
    targetRefMin: TARGET_REF_MIN, ktunerBasemap: KTUNER_BASEMAP,
    lugOk: LUG_OK, lugRiseOk: LUG_RISE_OK, lugRiseSeen: LUG_RISE_SEEN,
    lugStepsShare: LUG_STEPS_SHARE, uploadScore: UPLOAD_SCORE
  };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  function emptyShakedown() { return { status: 'none', flashId: null, calmSec: 0, driveIds: [] }; }

  // ---------------------------------------------------------------------------
  // Map versions: one numbered copy of the Map's tables, kept by the app.
  //
  // A Map version is identified by its small number (Map version 1, 2, …) and
  // carries the map's name, where its tables come from and when it became the
  // map on the car. Map version 1 is the KTuner basemap the owner gave the app:
  // active from the first Drive, and it starts no Shakedown drive, because the
  // owner did not just flash it. Every recorded Flash becomes the next version.
  //
  // The tables themselves are NOT in this document: they are held by the app
  // (SQLite, `map_versions.tables`; the basemap comes from the app's own
  // `data/ktuner-maps-digitized.json`). `tablesFrom` names where they live, so a
  // check can re-read a named version's tables without this document growing by
  // half a megabyte on every Drive.
  //
  // A Flash that becomes the next version carries `changePending: true` until the
  // app has stored the change she flashed: until then the version points at the
  // tables it was written on, so the plan can still be read, and the flag says
  // plainly that a check must not sign off on those tables. Nothing here pretends
  // the stored tables are the flashed ones.
  // ---------------------------------------------------------------------------
  function basemapVersion() {
    return {
      n: 1, name: KTUNER_BASEMAP, kind: 'ktuner-basemap',
      tablesFrom: 'ktuner-basemap', from: null,   // from the first Drive: nothing before it
      flashId: null, changed: null, note: '', changePending: false, updatedAt: null
    };
  }
  /** The version as a caller outside the module sees it. */
  function versionOut(v) {
    if (!v) return null;
    return {
      n: v.n, name: v.name, label: 'Map version ' + v.n, kind: v.kind,
      tablesFrom: v.tablesFrom || null, tablesPending: !!v.changePending,
      from: v.from == null ? null : v.from,
      flashId: v.flashId || null, changed: v.changed || null, note: v.note || '',
      updatedAt: v.updatedAt == null ? null : v.updatedAt
    };
  }
  function normVersions(list) {
    var out = [], seen = {};
    (Array.isArray(list) ? list : []).forEach(function (v) {
      if (!v || typeof v !== 'object' || !isNum(v.n) || v.n < 1) return;
      if (seen[v.n]) return;
      seen[v.n] = true;
      out.push({
        n: v.n,
        name: String(v.name || KTUNER_BASEMAP),
        kind: v.kind === 'flash' ? 'flash' : 'ktuner-basemap',
        tablesFrom: v.tablesFrom ? String(v.tablesFrom) : null,
        changePending: !!v.changePending,
        from: isNum(v.from) ? v.from : null,
        flashId: v.flashId ? String(v.flashId) : null,
        changed: CHANGED[v.changed] ? v.changed : null,
        note: v.note ? String(v.note) : '',
        updatedAt: isNum(v.updatedAt) ? v.updatedAt : null
      });
    });
    out.sort(function (a, b) { return a.n - b.n; });
    // A History file written before Map versions existed, or a hand-made state:
    // Map version 1 is the map the owner gave the app, so it is always there.
    // No clock is read here, so normalize stays pure.
    if (!out.length || out[0].n !== 1) out.unshift(basemapVersion());
    return out;
  }
  KTA.carEmpty = function () {
    return {
      version: CAR_VERSION, drives: {}, flashes: [], answers: {}, hidden: [],
      shakedown: emptyShakedown(), mapVersions: normVersions([])
    };
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
      mapVersions: normVersions(s.mapVersions),
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
    var firstMin = firstMinuteTrim(log);
    var krPeak = rep.an && rep.an.numbers ? rep.an.numbers.knockMax : NaN;
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
      // What the trims looked like per load band, at idle, and in the first
      // minute: the shapes Diagnose reads (a housing mismatch pulls every band
      // from the first second; unmetered air only the idle and low bands).
      trimBands: I.trims && I.trims.bands ? I.trims.bands.map(function (b) {
        return { from: b.from, to: b.to, seconds: b.seconds, trim: b.trim };
      }) : [],
      trimIdle: I.trims ? I.trims.idle : null,
      trimFirstMin: firstMin.trim,
      trimFirstSec: firstMin.sec,
      // The worst knock retard in the log, and whether the engine already calls
      // it scheduled from the Fuel-quality score (fact-check §2). Diagnose
      // needs both to tell scheduled retard apart from a finding.
      krPeak: isNum(krPeak) ? Math.round(krPeak * 10) / 10 : null,
      krScheduled: !!(rep.an && rep.an.knockScheduled),
      iatMoving: I.heat.iatMoving,
      cvtPeak: I.heat.cvtMax,
      lugShare: I.lug ? I.lug.share : null,
      // Why the score moved while the car was lugging: how many of its step-ups
      // came below 1,700 rpm, and the revs the CVT held while it did. These are
      // the facts the habit cause is diagnosed from, so they are remembered with
      // the Drive rather than re-derived from a log nobody has open.
      kcUpSteps: I.kc ? I.kc.upSteps : null,
      lugUpSteps: I.kc ? I.kc.lugUpSteps : null,
      lugRpm: I.lug ? I.lug.rpm : null,
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
  /** Median total trim over the first 60 s of the log: "from the first minute". */
  function firstMinuteTrim(log) {
    var vals = [], sec = 0, i;
    if (!(log.has.stft || log.has.ltft)) return { trim: null, sec: 0 };
    for (i = 0; i < log.n && log.t[i] <= 60; i++) {
      var s1 = log.has.stft ? log.stft[i] : 0, l1 = log.has.ltft ? log.ltft[i] : 0;
      if (!isNum(s1) || !isNum(l1)) continue;
      vals.push(((1 + s1 / 100) * (1 + l1 / 100) - 1) * 100);
      sec += log.w[i];
    }
    if (!vals.length) return { trim: null, sec: 0 };
    return { trim: Math.round(median(vals) * 10) / 10, sec: Math.round(sec) };
  }
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
  // Map versions, Flashes and the Map a drive ran on (never guessed from the log)
  // ---------------------------------------------------------------------------
  var CHANGED = { afm: 1, boost: 1, fuel: 1, other: 1 };
  function slug(map) {
    return String(map || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 16) || 'map';
  }
  function sortFlashes(s) { s.flashes.sort(function (a, b) { return a.time - b.time || (a.id < b.id ? -1 : 1); }); }
  function versionsOf(s) { return s.mapVersions; }
  /** Every Map version the app holds, oldest first, as callers see them. */
  KTA.carMapVersions = function (state) { return versionsOf(normalize(state)).map(versionOut); };
  /** The Map version the car is on now: the highest number, as versions only grow. */
  KTA.carActiveMapVersion = function (state) {
    var vs = versionsOf(normalize(state));
    return vs.length ? versionOut(vs[vs.length - 1]) : null;
  };
  /** The Map version before number n — the file Undo names — or null. */
  KTA.carMapVersionBefore = function (state, n) {
    if (!isNum(n)) return null;
    var best = null;
    versionsOf(normalize(state)).forEach(function (v) {
      if (v.n >= n) return;
      if (!best || v.n > best.n) best = v;
    });
    return best ? versionOut(best) : null;
  };
  /**
   * Map version 1: the KTuner basemap the owner gave the app, active from the
   * first Drive. It starts NO Shakedown drive — the owner did not just flash it,
   * so their first Drive is an ordinary Drive (the prototype made it a Shakedown
   * drive by recording the starting map as a Flash; that is what this replaces).
   *
   * Idempotent: calling it on a car that already has Map version 1 changes
   * nothing unless a name or a date is passed. opts { name, from, tablesFrom }.
   */
  KTA.carRecordBasemap = function (state, opts, meta) {
    var s = clone(state);
    opts = opts || {};
    var v = s.mapVersions.filter(function (x) { return x.n === 1; })[0] || basemapVersion();
    var had = s.mapVersions.some(function (x) { return x.n === 1; });
    if (opts.name != null) {
      if (!String(opts.name).trim()) throw new Error('A Map needs a name.');
      v.name = String(opts.name).trim();
    }
    if (opts.from != null) {
      if (!isNum(opts.from)) throw new Error('A Map version needs a date and time.');
      v.from = opts.from;
    }
    if (opts.tablesFrom != null) v.tablesFrom = String(opts.tablesFrom);
    if (!had || opts.name != null || opts.from != null || opts.tablesFrom != null) v.updatedAt = nowOf(meta);
    if (!had) {
      s.mapVersions = normVersions(s.mapVersions.filter(function (x) { return x.n !== 1; }).concat([v]));
    }
    return { state: s, version: versionOut(v), created: !had };
  };
  /**
   * The Map version a Drive ran on: the version active at its start, taken from
   * the app's own record, never guessed from the log. Map version 1 (from: null)
   * is active from the first Drive. A Drive with no known start cannot be placed
   * in time, so it is only answered when Map version 1 is the only version.
   */
  KTA.carMapAt = function (state, startMs) {
    var vs = versionsOf(normalize(state));
    if (!isNum(startMs)) return vs.length === 1 ? versionOut(vs[0]) : null;
    var best = null;
    vs.forEach(function (v) {
      if (v.from != null && v.from > startMs) return;
      if (!best || v.n > best.n) best = v;
    });
    return best ? versionOut(best) : null;
  };
  /** What the owner reads for a Drive's Map: the name, the number, when it went on. */
  function mapOut(v) {
    if (!v) return { recorded: false, name: null, since: null, version: null, label: null };
    return {
      recorded: true, name: v.name, since: v.from == null ? null : v.from,
      version: v.n, label: 'Map version ' + v.n, kind: v.kind,
      flashId: v.flashId || null, changed: v.changed || null
    };
  }
  function versionOfFlash(s, flashId) {
    return s.mapVersions.filter(function (v) { return v.flashId === flashId; })[0] || null;
  }
  /**
   * Undo, naming the Map version to flash back to: the file, its number and the
   * owner's own spelling. `known` is false only when there genuinely is no
   * earlier version — the app then says so plainly and asks once, rather than
   * inventing a name.
   */
  function undoTo(v) {
    if (!v) {
      return {
        known: false, version: null, name: null, from: null, stamp: null,
        label: null,
        headline: 'your previous map file — I need you to tell me which one'
      };
    }
    var stamp = isNum(v.from) ? vnStamp(v.from) : null;
    var label = 'Map version ' + v.n + ' · ' + v.name + (stamp ? ', flashed ' + stamp : '');
    return {
      known: true, version: v.n, name: v.name,
      from: isNum(v.from) ? v.from : null, stamp: stamp, label: label,
      headline: 'Flash your previous map file (' + label + ')'
    };
  }
  /** Undo for a plan written on a given version: the version before it. */
  function undoFor(s, version) {
    return undoTo(version ? KTA.carMapVersionBefore(s, version.n) : null);
  }
  /** The likely cause of a Stop on a Shakedown drive: the Flash it ran on,
   *  plus the Map version before it to undo to. Shared by carIngest and carReport
   *  so a reopened drive names the same Flash and the same version. */
  function flashCauseFor(s, flash, summary) {
    var trimStop = isNum(summary.trimWorst) && Math.abs(summary.trimWorst) > TRIM_STOP;
    var leanStop = isNum(summary.mixLeanest) && isNum(summary.mixTarget) && summary.mixLeanest >= summary.mixTarget + LEAN_STOP;
    var version = versionOfFlash(s, flash.id);
    var previous = version ? KTA.carMapVersionBefore(s, version.n) : null;
    var previousFlash = previous && previous.flashId
      ? s.flashes.filter(function (f) { return f.id === previous.flashId; })[0] || null
      : null;
    return {
      flashId: flash.id,
      map: flash.map,
      changed: flash.changed,
      version: version ? version.n : null,
      previousMap: previous
        ? {
            id: previousFlash ? previousFlash.id : null,
            map: previous.name,
            time: isNum(previous.from) ? previous.from : null,
            version: previous.n,
            label: 'Map version ' + previous.n + ' · ' + previous.name
          }
        : null,
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
    // A Flash the owner confirms is the next Map version (CONTEXT.md). Its tables
    // are the ones it was written on until the app stores the change she flashed
    // (`changePending`), so a plan can still be read and a check knows to refuse.
    var last = s.mapVersions[s.mapVersions.length - 1];
    s.mapVersions.push({
      n: (last ? last.n : 0) + 1, name: rec.map, kind: 'flash',
      tablesFrom: last ? last.tablesFrom : KTUNER_BASEMAP, changePending: true,
      from: rec.time, flashId: rec.id, changed: rec.changed, note: rec.note, updatedAt: rec.updatedAt
    });
    // The next drive is a Shakedown drive. (Map version 1 never gets here: it is
    // the map the owner gave the app, not a Flash.)
    s.shakedown = { status: 'pending', flashId: id, calmSec: 0, driveIds: [] };
    return { state: s, flash: rec, version: versionOut(s.mapVersions[s.mapVersions.length - 1]) };
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
    // The Map version that Flash produced keeps step with it, or Undo would name
    // a file the owner has just renamed.
    s.mapVersions.forEach(function (v) {
      if (v.flashId !== id) return;
      var f = s.flashes.filter(function (x) { return x.id === id; })[0];
      if (f) { v.name = f.map; v.from = f.time; v.changed = f.changed; v.note = f.note; }
      v.updatedAt = nowOf(meta);
    });
    return s;
  };
  KTA.carDeleteFlash = function (state, id) {
    var s = clone(state);
    s.flashes = s.flashes.filter(function (f) { return f.id !== id; });
    if (s.shakedown.flashId === id) s.shakedown = emptyShakedown();
    // The Map version that Flash produced goes with it, or Undo would name a
    // version the Car history no longer has a Flash for.
    var kept = s.mapVersions.filter(function (v) { return v.flashId !== id; });
    if (kept.length !== s.mapVersions.length) s.mapVersions = normVersions(renumber(kept));
    return s;
  };
  /** Versions numbered 1..n with no gaps, so a deleted Flash leaves no hole. */
  function renumber(list) {
    return list.slice().sort(function (a, b) { return a.n - b.n; }).map(function (v, i) {
      return Object.assign({}, v, { n: i + 1 });
    });
  }

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
  function afterFlashPattern(summary, baseline) {
    // The normal after-flash pattern: the Fuel-quality score starts at or below
    // AFTER_FLASH_START and settles back to the Baseline (owner-voices.md §3: a fresh
    // flash starts the score near 0.59 and calm driving drops it to 0.49). Said in the
    // owner's words, so the screen never shows a status name for it.
    if (!isNum(summary.kcStart) || !isNum(summary.kcEnd)) return null;
    if (summary.kcStart > AFTER_FLASH_START) return null;
    if (summary.kcEnd > baseline.value + SCORE_SHAKEDOWN) return null;
    return {
      start: summary.kcStart,
      end: summary.kcEnd,
      baseline: baseline.value,
      text: 'Knock Control started at ' + summary.kcStart.toFixed(2) +
        ' and settled to your Baseline (' + baseline.value.toFixed(2) + '): that is what a fresh flash does.'
    };
  }

  function unexplainedFor(s, summary, baseline) {
    // Compared with the median of non-hidden drives since the last Flash
    // (at least 3), else the last 5 non-hidden drives.
    var hidden = {};
    s.hidden.forEach(function (id) { hidden[id] = true; });
    var prior = orderedSummaries(s).filter(function (d) {
      return d.id !== summary.id && !hidden[d.id] && d.start != null && summary.start != null && d.start < summary.start;
    });
    var version = summary.start != null
      ? KTA.carMapAt({ flashes: s.flashes, mapVersions: s.mapVersions }, summary.start)
      : null;
    var since = (version && isNum(version.from)) ? prior.filter(function (d) { return d.start >= version.from; }) : prior;
    var ref = since.length >= 3 ? since : prior.slice(-5);
    var reasons = [];
    if (ref.length) {
      var trimMed = medianOf(ref.map(function (d) { return d.trimWorst; }));
      if (isNum(summary.trimWorst) && isNum(trimMed) && Math.abs(summary.trimWorst - trimMed) > TRIM_JUMP) reasons.push('trim');
      // Boost targets are only comparable between Drives that both had a hard pull:
      // the highest target per Drive depends on whether the owner pulled at all
      // (owner-voices.md §4: 8.7 psi with no pulls, 19.2 with them). So a Drive with
      // pulls is compared only against Drives with pulls, and a Drive without a pull
      // is never asked about its target. Like every median here, the reference needs
      // three Drives: one pull Drive is not this car's normal (TARGET_REF_MIN).
      if ((summary.hardPulls || 0) > 0) {
        var pulled = ref.filter(function (d) { return (d.hardPulls || 0) > 0; });
        if (pulled.length >= TARGET_REF_MIN) {
          var tgtMed = medianOf(pulled.map(function (d) { return d.boostTarget; }));
          if (isNum(summary.boostTarget) && isNum(tgtMed) && Math.abs(summary.boostTarget - tgtMed) > TARGET_JUMP) reasons.push('boost');
        }
      }
    }
    // The starting score needs no history: the Baseline alone judges it. The normal
    // after-flash start is not an Unexplained change; a start above 0.60 still is.
    if (isNum(summary.kcStart) && summary.kcStart >= baseline.value + SCORE_JUMP && !afterFlashPattern(summary, baseline)) {
      reasons.push('score');
    }
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
          // A Too-short Drive read nothing, but the car is still on a Map: the
          // reply says nothing more than its one sentence, so this only has to
          // be honest for anything that reads the card.
          map: mapOut(KTA.carActiveMapVersion(s)),
          isShakedown: false,
          shakedown: { role: 'none', status: s.shakedown.status, calmSec: 0, needed: SHAKEDOWN_CALM, passed: false },
          flashCause: null, hardDrivingWatch: false,
          unexplained: null, unexplainedWatch: false, afterFlash: null,
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
    // The Map this Drive ran on: the Map version active at its start, never the
    // one active now, and never guessed from the log.
    var version = KTA.carMapAt(s, summary.start);
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
    // Said in the owner's words when the starting score was the normal after-flash
    // pattern, so the screen never shows a status name for it.
    var afterFlash = unexplained ? null : afterFlashPattern(summary, baseline);

    var rows = KTA.carTableRows(s);
    return {
      state: s,
      replaced: replaced,
      report: {
        identity: summary.id, tooShort: false, replaced: replaced, summary: summary,
        verdict: verdict, baseline: baseline,
        map: mapOut(version),
        isShakedown: isShakedown,
        shakedown: {
          role: summary.shakedown, status: s.shakedown.status,
          calmSec: applies ? s.shakedown.calmSec : 0, needed: SHAKEDOWN_CALM, passed: passed
        },
        flashCause: flashCause, hardDrivingWatch: hardDrivingWatch,
        unexplained: unexplained, unexplainedWatch: unexplainedWatch,
        afterFlash: afterFlash,
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
    var version = KTA.carMapAt(s, summary.start);
    // The Flash that produced that Map version, when there was one.
    var flash = version && version.flashId
      ? s.flashes.filter(function (f) { return f.id === version.flashId; })[0] || null
      : null;
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
      map: mapOut(version),
      isShakedown: isShakedown,
      shakedown: {
        role: summary.shakedown, status: s.shakedown.status,
        calmSec: isShakedown ? s.shakedown.calmSec : 0, needed: SHAKEDOWN_CALM, passed: summary.shakedown === 'passed'
      },
      flashCause: flashCause, hardDrivingWatch: false,
      unexplained: unexplained, unexplainedWatch: s.answers[driveId] === 'neither',
      afterFlash: unexplained ? null : afterFlashPattern(summary, baseline),
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
        var version = KTA.carMapAt(s, d.start);
        return {
          id: d.id, start: d.start, fileName: d.fileName,
          duration: d.duration, moving: d.moving,
          cool: d.cool, hot: d.hot, hotRestart: d.hotRestart,
          verdict: d.verdict,
          kcStart: d.kcStart, kcEnd: d.kcEnd, kcPeak: d.kcPeak,
          trimWorst: d.trimWorst, iatMoving: d.iatMoving, cvtPeak: d.cvtPeak,
          lugShare: d.lugShare,
          accel5070: d.accel5070 ? { seconds: d.accel5070.seconds, iat: d.accel5070.iat } : null,
          boostTarget: d.boostTarget, hardPulls: d.hardPulls,
          overshoot: d.overshoot != null ? d.overshoot : null,
          wgAtPeak: d.wgAtPeak != null ? d.wgAtPeak : null,
          map: version ? version.name : null,
          mapVersion: version ? version.n : null,
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
      mapVersions: s.mapVersions.map(function (v) { return versionOut(v); }),
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
      answers: s.answers,
      mapVersions: s.mapVersions.map(function (v) { return versionOut(v); })
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
    var added = { drives: 0, flashes: 0, mapVersions: 0 };
    // Map versions merge by number, never overwrite: a History file that knows
    // a later version adds it, one that knows the same version later updates it.
    (doc.mapVersions || []).forEach(function (inc) {
      if (!inc || typeof inc !== 'object' || !isNum(inc.n)) return;
      var cur = s.mapVersions.filter(function (v) { return v.n === inc.n; })[0];
      if (!cur) {
        s.mapVersions.push(normVersions([inc]).filter(function (v) { return v.n === inc.n; })[0]);
        added.mapVersions++;
      } else if (isNum(inc.updatedAt) && isNum(cur.updatedAt) && inc.updatedAt > cur.updatedAt) {
        Object.keys(inc).forEach(function (k) { cur[k] = inc[k]; });
      }
    });
    s.mapVersions = normVersions(s.mapVersions);
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
    // A Flash the incoming file knows but this car does not is the next Map
    // version: the history it names is the map that Flash put on the car.
    s.flashes.forEach(function (f) {
      if (versionOfFlash(s, f.id)) return;
      var last = s.mapVersions[s.mapVersions.length - 1];
      s.mapVersions.push({
        n: (last ? last.n : 0) + 1, name: f.map, kind: 'flash',
        tablesFrom: last ? last.tablesFrom : KTUNER_BASEMAP, changePending: true,
        from: f.time, flashId: f.id, changed: f.changed, note: f.note || '', updatedAt: f.updatedAt
      });
    });
    s.mapVersions = normVersions(s.mapVersions);
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
      // The Map version that Drive ran on, and the version before it to flash
      // back to. When there is genuinely no earlier version, Undo says so and
      // the owner is asked once — it never invents a file name.
      var target = KTA.carMapAt(s, stopD && stopD.start) || KTA.carActiveMapVersion(s);
      var undo = undoFor(s, target);
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
        headline: undo.known
          ? 'Stop open: flash your previous map file (' + undo.label + ').'
          : 'Stop open: flash your previous map file, and tell me which one it is.',
        route: trimRouted ? 'preset' : 'previous-map',
        evidence: [{
          drives: [issues.stop.driveId],
          text: 'Drive ' + issues.stop.driveId + ' is a Stop' +
            (stopD && isNum(stopD.trimWorst) ? ' (worst trim ' + stopD.trimWorst.toFixed(1) + ' %)' : '') +
            (target ? ' on ' + target.label + ' · ' + target.name + '.' : ' with no Map version on record.'),
          basis: 'Data'
        }],
        basis: 'Data',
        proof: 'The next Shakedown drive passes: 10 calm minutes with trims within ±5 %, score near the Baseline, no lean mixture.',
        tables: [], cells: [], afmPasteRow: null,
        saveAs: null, undoName: undo.headline, undo: undo,
        mapVersion: target,
        prefill: {
          time: now,
          map: undo.name || (target ? target.name : ''),
          changed: target && target.changed ? target.changed : 'other',
          note: 'Undo after the ' + issues.stop.driveId + ' Stop.'
        },
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
        saveAs: null, undoName: null, undo: null, prefill: null,
        mapVersion: KTA.carActiveMapVersion(s),
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
          // P7: no boost raised below the thresholds floor — a raise here is dropped, never shipped.
          var lowFloor = KTA.THRESHOLDS ? KTA.THRESHOLDS.boost_raise_min_rpm.value : 3000;
          if (cell.rpm < lowFloor && after > before + 1e-9) return null;
          return { table: id, rpm: cell.rpm, rpmRow: cell.rpmRow, col: cell.col, of: cell.of, before: before, after: after };
        }).filter(Boolean);
        tables.push({ id: id, kind: 'map', cells: tcells });
        tcells.forEach(function (c) { cells.push(c); });
      });
    }
    var revCount = s.flashes.filter(function (f) { return CHANGED_FAMILY[f.changed] === winner.family; }).length;
    // The change is written on top of the Map version the car is on now, so that
    // version is the Undo file — named, with the KTuner map name the owner gave
    // it, not a shortened invention.
    var baseVersion = KTA.carActiveMapVersion(s);
    var mapName = baseVersion ? baseVersion.name : KTUNER_BASEMAP;
    var saveAs = mapName + ' · ' + vnDay(now) + ' · ' + winner.family + ' r' + (revCount + 1);
    var undo = undoTo(baseVersion);
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
      saveAs: saveAs, undoName: undo.headline, undo: undo, mapVersion: baseVersion,
      prefill: { time: now, map: saveAs, changed: FAMILY_CHANGED[winner.family], note: winner.id + ': ' + winner.evidence.text },
      deferred: deferred, levers: levers, openIssues: issues,
      mapFacts: { normalPeak: normalPeak, ecoPeak: ecoPeak, finalPeak: finalPeak, pairsIdentical: pairsIdentical },
      ceiling: ceiling
    };
  };

  // ---------------------------------------------------------------------------
  // The loop: Open steps, settling them against a Drive, and exactly one Next step
  //
  // An **Open step** is a Next step still waiting for the Drive that proves or
  // disproves it (CONTEXT.md). Three public operations move it, all pure:
  //
  //   KTA.carOpenSteps(list)            the steps as they are stored, one per key
  //   KTA.carSettle(state, id, steps)   judge every Open step against one Drive
  //   KTA.carDiagnose(state, id, opts)  one cause per symptom pattern, before deciding
  //   KTA.carNextStep(state, id, steps) exactly one Next step, and what it opens
  //
  // Settling runs first and the decision second, so the step a Drive is given is
  // chosen knowing everything that Drive proved. A Drive that settled none of the
  // Open steps it could have settled is a **Wasted drive** (CONTEXT.md), and the
  // operation says which step would have been settled instead — never as a
  // verdict on the owner.
  //
  // The order the Next step is decided in (prototypes/next-step/, amended: the
  // Baseline before the habit) never reorders. Diagnose runs before all of it:
  // a cause seen today goes to the step its pattern names.
  //
  //   open Stop            → Flash: Undo (the only step)
  //   Too-short Drive      → nothing read; the previous step stands
  //   logger fault         → watch in TunerView: fix the dead gauges
  //   no Baseline yet      → drive: one Cool drive with 2 pulls
  //                          (+ a cause seen today is opened as a free habit)
  //   cause seen today     → its step: lugging → habit, unmetered air or a lean
  //                          mixture → check the install, faster spool → the
  //                          downpipe boost trim, housing mismatch → Undo
  //   Open step still open → its step, compact "same step as last time"
  //   otherwise            → nothing: upload after a Flash, Install, new fuel,
  //                          or Knock Control over the upload score
  //
  // Every step names the Drive whose upload will settle it (`settlesOn`). A
  // repeated step is one short line (`same`), never a second essay. Only the
  // Flash plan names a KTuner table: nothing here writes a cell or a table name.
  // ---------------------------------------------------------------------------
  var LOG_CHANNEL_NAMES = {
    boost: 'Turbo Pressure', boostTarget: 'Turbo Pressure Target', fp: 'DIFP',
    fpTarget: 'DIFP Target', cvt: 'Transmission Temperature', stft: 'STFT B1',
    ltft: 'LTFT B1', kControl: 'Knock Control', lam: 'O2', lamCmd: 'AFR Command',
    afrCmd: 'AFR Command', mafHz: 'MAF Hz', mafGs: 'MAF Hz',
    iat: 'IAT', iat2: 'IAT2', egt: 'EGT', map: 'MAP', rpm: 'Engine RPM', vss: 'Vehicle Speed'
  };
  /** The four words an Open step's status shows, and the pill tone each wears. */
  var STEP_STATUS = {
    done: { word: 'Done', tone: 'good' }, open: { word: 'Not yet', tone: 'watch' },
    fail: { word: 'Still off', tone: 'stop' }, wait: { word: "Can't tell yet", tone: 'none' }
  };
  /** A logged channel named the way TunerView spells it. */
  function logChannel(key) { return LOG_CHANNEL_NAMES[key] || key; }
  function logChannelList(keys) {
    var names = (keys || []).map(logChannel).filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }
  function n0(v) { return isNum(v) ? v.toFixed(0) : '–'; }
  function n1(v) { return isNum(v) ? v.toFixed(1) : '–'; }
  function n2(v) { return isNum(v) ? v.toFixed(2) : '–'; }
  /** Signed, with the real minus sign the owner reads (copy.py spells it the same). */
  function sg1(v) { return KTA.fmt.signed(v, 1, '').replace('-', '−'); }
  function minutes(sec) { return Math.round((isNum(sec) ? sec : 0) / 60); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /** A Drive's id the way the owner reads it: `20260830-160151` → `30 Aug 16:01`. */
  function driveStamp(id) {
    var m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(String(id == null ? '' : id));
    if (!m) return String(id == null ? '' : id);
    return Number(m[3]) + ' ' + (MONTHS[Number(m[2]) - 1] || '') + ' ' + m[4] + ':' + m[5];
  }

  /** The dead channels among `keys`, as TunerView names them, or null. */
  function deadOf(sum, keys) {
    var dead = (sum.flat || []).filter(function (k) { return keys.indexOf(k) >= 0; });
    return dead.length ? logChannelList(dead) : null;
  }

  function judged(status, why, because) {
    return { status: status, why: why, because: because || null };
  }
  /** `done` and `fail` answered the question; `open` and `wait` did not. */
  function settledStatus(status) { return status === 'done' || status === 'fail'; }
  /** Only `done` proves the step. A step that came back "Still off" is asked again. */
  function doneStatus(status) { return status === 'done'; }

  // One entry per step, read by every part of the lifecycle: what the owner was
  // told to do (title), what settling it settles (`short`), and the Drive that
  // would settle it (`would`) — the three words the Wasted drive line is made of.
  // `reask` and `wasted` rank the step: the order Open steps are re-asked, and the
  // order the Wasted drive line names one (lowest first). `ask` is how the Next
  // step tells it: `first` the opening words (when they are fixed), `title` the
  // compact words when it is asked again, then its kind, gauges, when it settles
  // and what proves it. The judge reads only the summary of the new Drive, so a
  // Drive this car never logged can never settle anything.
  var STEP_JUDGES = {
    undo: {
      key: 'undo', title: 'Undo: trims back within ±' + TRIM_OK + ' %', short: 'the Undo',
      would: 'a drive of ' + (SHAKEDOWN_CALM / 60) + ' calm minutes', needs: ['stft', 'ltft'],
      reask: 1, wasted: 1,
      ask: {
        first: 'Put the map from before back on the car', title: 'Undo: put the map from before back on the car',
        kind: 'flash', gauges: ['trims', 'kc'], when: 'after the first calm drive on the old file',
        proves: 'trims back within ±' + TRIM_OK + ' % over ' + (SHAKEDOWN_CALM / 60) + ' calm minutes'
      },
      judge: function (s, step, ctx) {
        if (!s) return judged('wait', 'Too short to judge: it needs ' + (SHAKEDOWN_CALM / 60) + ' calm minutes.', 'it was too short');
        var dead = deadOf(s, ['stft', 'ltft']);
        if (dead) return judged('wait', 'The fuel trims were dead in this log (' + dead + '), so nothing could be read.', 'the logger lost ' + dead);
        if (isNum(s.trimWorst) && Math.abs(s.trimWorst) <= TRIM_OK && s.calmSec >= SHAKEDOWN_CALM) {
          return judged('done', 'Trims ' + sg1(s.trimWorst) + ' % over ' + minutes(s.calmSec) + ' calm minutes' +
            (isNum(ctx.was) ? ' (they were ' + sg1(ctx.was) + ' %)' : '') + '.');
        }
        if (isNum(s.trimWorst) && Math.abs(s.trimWorst) > TRIM_STOP) {
          return judged('fail', 'Trims still ' + sg1(s.trimWorst) + ' %.');
        }
        return judged('open', 'Trims ' + sg1(s.trimWorst) + ' %, ' + minutes(s.calmSec) + ' calm min: not enough yet.',
          s.calmSec >= SHAKEDOWN_CALM ? 'the trims were still ' + sg1(s.trimWorst) + ' %' : 'it was not ' + (SHAKEDOWN_CALM / 60) + ' calm minutes');
      }
    },
    baseline: {
      key: 'baseline', title: 'Baseline: one Cool drive with 2 pulls', short: 'the Baseline',
      would: 'a Cool Drive with 2 pulls', needs: [],
      // Asked only while there is no Baseline, never as a held step: no compact words.
      reask: 5, wasted: 4,
      ask: {
        first: 'Log one Cool-morning drive with 2 pulls', kind: 'drive', gauges: ['iat', 'kc', 'afr', 'boost'],
        when: 'after that morning Drive', proves: 'a Cool Drive with 2 pulls to measure every later Drive against'
      },
      judge: function (s) {
        var pulls = s && s.hardPulls ? s.hardPulls : 0;
        if (!s) return judged('wait', 'Too short: a Baseline Drive is ' + (SHAKEDOWN_CALM / 60) + ' minutes with 2 pulls.', 'it was too short');
        if (s.cool && pulls >= 2) {
          return judged('done', 'Intake ' + n0(s.iatMoving) + ' °C, ' + pulls + ' pulls' +
            (s.accel5070 ? ', 50→70 km/h in ' + n2(s.accel5070.seconds) + ' s' : '') +
            '. Every later Drive is compared to this one.');
        }
        if (!s.cool) return judged('wait', 'Intake ' + n0(s.iatMoving) + ' °C while moving: not a Cool Drive.', 'it was too warm to be a Cool Drive');
        return judged('wait', 'Cool (' + n0(s.iatMoving) + ' °C) but ' + (pulls ? 'only ' + pulls + ' pull' + (pulls === 1 ? '' : 's') : 'no hard pulls') + '.', 'it had no hard pulls');
      }
    },
    habit: {
      key: 'habit', title: 'Habit test: revs up in hot traffic', short: 'the habit test',
      would: 'a hot-afternoon drive', needs: ['kControl'],
      reask: 3, wasted: 3,
      ask: {
        first: 'Keep the revs up in hot traffic (free, no Flash)', title: 'Habit test: log your next hot-afternoon Drive',
        kind: 'drive', gauges: ['rpm', 'kc', 'iat'], when: 'after your next hot-afternoon Drive',
        proves: 'lugging under ' + LUG_OK + ' % of moving time and Knock Control not rising'
      },
      judge: function (s) {
        if (!s) return judged('wait', 'Too short: the habit shows on a drive of 10 minutes or more.', 'it was too short');
        var dead = deadOf(s, ['kControl']);
        if (dead) return judged('wait', dead + ' was dead in this log, so Knock Control could not be read.', 'the logger lost ' + dead);
        if (!isNum(s.kcPeak) || !isNum(s.kcStart)) return judged('wait', 'Knock Control was not in this log.', 'Knock Control was not logged');
        if (!s.hot) return judged('wait', 'Cool Drive (' + n0(s.iatMoving) + ' °C moving): the habit only shows on a hot afternoon.', 'it was a Cool Drive, and the habit needs heat');
        var rise = s.kcPeak - s.kcStart;
        if (isNum(s.lugShare) && s.lugShare < LUG_OK && rise <= LUG_RISE_OK) {
          return judged('done', 'Lugging ' + n1(s.lugShare) + ' % of moving time, Knock Control ' + n2(s.kcStart) + ' → ' + n2(s.kcPeak) + '.');
        }
        return judged('open', 'Lugging ' + n1(s.lugShare) + ' % of moving time, Knock Control rose ' + n2(rise) + '.',
          'it was still lugging ' + n1(s.lugShare) + ' % of moving time');
      }
    },
    channels: {
      key: 'channels', title: 'Log AFR Command and MAF Hz', short: 'the AFR Command / MAF Hz step',
      would: 'a log with AFR Command and MAF Hz in the list', needs: [],
      // Re-asked before the Baseline (it is free, two channels to add); on a Wasted
      // drive the Baseline comes first, because every later Drive is compared to it.
      reask: 4, wasted: 5,
      judge: function (s) {
        if (!s) return judged('wait', 'Too short: nothing could be read out of it.', 'it was too short');
        var missing = (s.missing || []).filter(function (k) { return k === 'afrCmd' || k === 'mafHz' || k === 'mafGs' || k === 'lamCmd'; });
        if (missing.length) {
          return judged('wait', 'Still not in the log (' + logChannelList(missing) + '). Mixture is judged against the map' +
            (isNum(s.mixTarget) ? "'s " + n1(s.mixTarget) : "'s own target") + ', not what the ECU asked.', 'they were not logged');
        }
        return judged('done', 'Both in the log now.');
      }
    },
    logger: {
      key: 'logger', title: 'Fix the logger: dead gauges', short: 'the logger fix',
      would: 'a drive with every gauge moving', needs: [],
      reask: 2, wasted: 2,
      ask: {
        title: 'Fix the logger: the dead gauges', kind: 'watch', gauges: ['live'],
        when: 'your next drive, any kind', proves: 'that every gauge moves again'
      },
      judge: function (s) {
        if (!s) return judged('wait', 'Too short: a Drive has to be read to see whether the gauges moved.', 'it was too short');
        if ((s.flat || []).length) return judged('fail', 'Still flat: ' + logChannelList(s.flat) + '.');
        return judged('done', 'Every gauge moves again.');
      }
    },
    install: {
      key: 'install', title: 'Check the install: clamps and flanges', short: 'the install check',
      would: 'a drive after checking the clamps and flanges', needs: ['stft', 'ltft'],
      reask: 6, wasted: 6,
      ask: {
        first: 'Check the install: clamps and flanges', title: 'Check the install: clamps and flanges',
        kind: 'watch', gauges: ['trims', 'afr'], when: 'after your next drive, any kind',
        proves: 'trims back within ±' + TRIM_OK + ' % and the mixture on target'
      },
      judge: function (s) {
        if (!s) return judged('wait', 'Too short: the check shows on a drive of 10 minutes or more.', 'it was too short');
        var dead = deadOf(s, ['stft', 'ltft']);
        if (dead) return judged('wait', 'The fuel trims were dead in this log (' + dead + '), so nothing could be read.', 'the logger lost ' + dead);
        var lean = isNum(s.mixLeanest) && isNum(s.mixTarget) && s.mixLeanest >= s.mixTarget + LEAN_WATCH;
        if (isNum(s.trimWorst) && Math.abs(s.trimWorst) <= TRIM_OK && !lean) {
          return judged('done', 'Trims ' + sg1(s.trimWorst) + ' %' +
            (isNum(s.mixLeanest) ? ' and full-throttle mixture ' + n1(s.mixLeanest) + ' against ' + n1(s.mixTarget) + ' asked' : '') +
            ': the install reads right.');
        }
        return judged('open', 'Trims ' + sg1(s.trimWorst) + ' %' +
          (lean ? ', mixture ' + n1(s.mixLeanest) + ' against ' + n1(s.mixTarget) + ' asked' : '') + ': not yet.',
          'the trims were still ' + sg1(s.trimWorst) + ' %');
      }
    },
    downpipe: {
      key: 'downpipe', title: 'Flash the downpipe trim, then two pulls', short: 'the downpipe trim',
      would: 'two pulls on a cool morning', needs: ['boost', 'boostTarget'],
      reask: 7, wasted: 7,
      ask: {
        first: 'Flash the downpipe trim, then two pulls', title: 'Flash the downpipe trim, then two pulls',
        kind: 'flash', gauges: ['boost', 'afr'], when: 'after two pulls on a cool morning',
        proves: 'overshoot under +' + KTA.LIMITS.overshoot.watch.toFixed(1) + ' psi on pulls with the mixture on target'
      },
      judge: function (s) {
        if (!s) return judged('wait', 'Too short: the trim shows on pulls, and this drive had none to read.', 'it was too short');
        var dead = deadOf(s, ['boost', 'boostTarget']);
        if (dead) return judged('wait', 'Boost was dead in this log (' + dead + '), so the overshoot could not be read.', 'the logger lost ' + dead);
        var pulls = s.hardPulls || 0;
        var lean = isNum(s.mixLeanest) && isNum(s.mixTarget) && s.mixLeanest >= s.mixTarget + LEAN_WATCH;
        if (pulls > 0 && isNum(s.overshoot) && s.overshoot <= KTA.LIMITS.overshoot.watch && !lean) {
          return judged('done', 'Overshoot +' + n1(s.overshoot) + ' psi on ' + pulls + ' pull' + (pulls === 1 ? '' : 's') + ': the trim holds.');
        }
        if (pulls > 0 && isNum(s.overshoot) && s.overshoot > KTA.LIMITS.overshoot.watch) {
          return judged('fail', 'Overshoot still +' + n1(s.overshoot) + ' psi on ' + pulls + ' pull' + (pulls === 1 ? '' : 's') + '.');
        }
        return judged('open', pulls ? 'Mixture ' + n1(s.mixLeanest) + ' against ' + n1(s.mixTarget) + ' asked: not yet.' : 'No pulls yet: the trim shows on pulls.',
          pulls ? 'the mixture was still ' + n1(s.mixLeanest) : 'it had no pulls');
      }
    }
  };
  function stepsRankedBy(field) {
    return Object.keys(STEP_JUDGES).sort(function (a, b) { return STEP_JUDGES[a][field] - STEP_JUDGES[b][field]; });
  }
  /** The steps that can be the one Next step, in the order they are re-asked. */
  var STEP_ORDER = stepsRankedBy('reask');
  KTA.STEP_KEYS = STEP_ORDER.slice();

  function stepOf(key) { return STEP_JUDGES[key]; }

  /** The Open steps as they are stored: one row per key, in the order asked. */
  KTA.carOpenSteps = function (list) {
    var out = [], seen = {};
    (Array.isArray(list) ? list : []).forEach(function (st) {
      if (!st || typeof st !== 'object' || !st.key || !STEP_JUDGES[st.key] || seen[st.key]) return;
      seen[st.key] = true;
      out.push({
        key: st.key,
        title: st.title || STEP_JUDGES[st.key].title,
        status: settledStatus(st.status) ? st.status : (st.status === 'wait' ? 'wait' : 'open'),
        why: st.why ? String(st.why) : '',
        id: st.id || null,
        // `askedOn` is the Drive that first asked it (Drives to proof counts from
        // here); `lastAskedOn` is the Drive that asked it most recently, which is
        // how a repeated step knows it is a repeat.
        askedOn: st.askedOn || null,
        askedAt: isNum(st.askedAt) ? st.askedAt : null,
        // Null until the step is the one Next step: a step opened beside it as a
        // free habit has not been asked for yet.
        lastAskedOn: st.lastAskedOn || null,
        settledBy: st.settledBy || null,
        settledAt: isNum(st.settledAt) ? st.settledAt : null
      });
    });
    out.sort(function (a, b) {
      return (isNum(a.askedAt) ? a.askedAt : 0) - (isNum(b.askedAt) ? b.askedAt : 0) ||
        STEP_ORDER.indexOf(a.key) - STEP_ORDER.indexOf(b.key);
    });
    return out;
  };
  function stepByKey(steps, key) {
    return steps.filter(function (s) { return s.key === key; })[0] || null;
  }
  function openOf(steps, key) {
    var st = stepByKey(steps, key);
    return st && !doneStatus(st.status) ? st : null;
  }

  /**
   * Judge every Open step against one Drive: Done / Not yet / Still off / Can't
   * tell yet, each with the numbers behind it, and say whether the Drive was a
   * Wasted drive. A Drive never settles the step it asked itself, a settled step
   * is never judged twice, and a Too-short Drive reads nothing at all — so it
   * settles nothing and says what would have.
   */
  KTA.carSettle = function (state, driveId, openSteps) {
    var s = normalize(state);
    var steps = KTA.carOpenSteps(openSteps);
    var sum = s.drives[driveId] || null;   // a Drive not in the Car history is a Too-short Drive
    var out = [], considered = [];

    // A Too-short Drive read nothing, so it settles nothing and no Open step loses
    // its status to "Can't tell yet". It is still a Wasted Drive, and it says what
    // would have counted.
    if (!sum) {
      return {
        state: s, settled: [], openSteps: steps,
        wasted: wastedFor(steps.filter(function (st) { return !doneStatus(st.status); }), null, [])
      };
    }

    steps.forEach(function (st) {
      if (settledStatus(st.status)) return;              // already answered
      if (st.askedOn === driveId) return;                // a Drive never settles its own ask
      considered.push(st);
      var ctx = { was: trimOfDrive(s, st.askedOn) };
      var v = stepOf(st.key).judge(sum, st, ctx);
      st.status = v.status;
      st.why = v.why;
      st.settledBy = driveId;
      st.settledAt = isNum(sum.start) ? sum.start : null;
      out.push({
        key: st.key, title: st.title, status: v.status, why: v.why,
        would: stepOf(st.key).would, proves: stepOf(st.key).short, because: v.because
      });
    });

    var settledAny = out.some(function (r) { return settledStatus(r.status); });
    return {
      state: s, settled: out, openSteps: steps,
      // A Stop Drive is never called a Wasted Drive: the owner has a fault to fix,
      // and a note about the Drive on top of a Stop only adds to the noise.
      wasted: (settledAny || sum.verdict === 'stop') ? NOT_WASTED : wastedFor(considered, sum, out)
    };
  };
  var NOT_WASTED = { wasted: false, reason: null, would: null, proves: null, key: null };
  /**
   * The Wasted drive line: why this Drive settled nothing, and the Drive that
   * would have settled the step it could not. The step named is the one the owner
   * is actually waiting on (an Undo before a habit before the Baseline), and a
   * Drive that lost gauges is told that first, because that is the reason nothing
   * on it could be trusted.
   */
  var WOULD_PRIORITY = stepsRankedBy('wasted');
  function wastedFor(considered, sum, settledRows) {
    if (!considered.length) return NOT_WASTED;
    var pick = null;
    WOULD_PRIORITY.forEach(function (k) {
      if (pick) return;
      if (considered.some(function (st) { return st.key === k; })) pick = k;
    });
    var j = stepOf(pick);
    var dead = sum && (sum.flat || []).length ? logChannelList(sum.flat) : '';
    var row = (settledRows || []).filter(function (r) { return r.key === pick; })[0];
    return {
      wasted: true, key: pick, proves: j.short,
      reason: !sum ? 'it was too short (under a minute moving)'
        : (dead ? 'the logger lost ' + dead : (row && row.because) || 'this Drive could not test ' + j.short),
      would: j.would, withGauges: !!dead
    };
  }
  function trimOfDrive(s, driveId) {
    var d = driveId ? s.drives[driveId] : null;
    return d && isNum(d.trimWorst) ? d.trimWorst : null;
  }

  /** The read Drive before this one: what "the same step as last time" is read against. */
  function previousReadId(s, driveId) {
    var here = s.drives[driveId] || null;
    var prev = null;
    orderedSummaries(s).forEach(function (d) {
      if (d.id === driveId) return;
      if (here && isNum(here.start) && isNum(d.start) && !(d.start < here.start)) return;
      if (!prev || (isNum(d.start) && isNum(prev.start) ? d.start > prev.start : true)) prev = d;
    });
    return prev ? prev.id : null;
  }

  /**
   * The cause seen today: the Fuel-quality score climbing on a hot Drive while
   * the CVT held it below 1,700 rpm. Diagnosed from this Drive's own numbers,
   * and free — no Flash, nothing to type in KTuner.
   */
  function habitCause(sum, baseline) {
    if (!sum || !sum.hot) return null;
    if (!isNum(sum.kcPeak) || !isNum(sum.kcStart)) return null;
    var rise = sum.kcPeak - sum.kcStart;
    if (rise < LUG_RISE_SEEN) return null;
    if (!isNum(sum.kcUpSteps) || !isNum(sum.lugUpSteps)) return null;
    if (!(sum.lugUpSteps > sum.kcUpSteps * LUG_STEPS_SHARE)) return null;
    var base = isNum(baseline) ? baseline : KTA.LIMITS.score.baseline;
    return {
      key: 'habit',
      kcStart: sum.kcStart, kcPeak: sum.kcPeak, iatMoving: sum.iatMoving,
      lugRpm: sum.lugRpm, upSteps: sum.kcUpSteps, lugUpSteps: sum.lugUpSteps, rise: rise,
      why: 'Knock Control went ' + n2(sum.kcStart) + ' → ' + n2(sum.kcPeak) + ': about ' +
        n1(KTA.LIMITS.score.tableDeg * Math.max(0, sum.kcPeak - base)) + '° of timing taken under boost. Not damage. ' +
        sum.lugUpSteps + ' of its ' + sum.kcUpSteps + ' step-ups came while the CVT held ' +
        KTA.fmt.num(sum.lugRpm, 0) + ' rpm with load in ' + n0(sum.iatMoving) + ' °C air.'
    };
  }

  /**
   * Diagnose before ranking (tuner-play-panel T7): read this Drive's symptom
   * pattern like a tuner — one cause, one step — instead of fixing the worst
   * check first. Runs before the Next step decision; the decision and the reply
   * sentence both read it.
   *
   * Returns null when nothing matches, or { id, cause, step, sentence } where
   * `cause` is the tuner's vocabulary (ticket 07's questions and 09's cards
   * reuse it) and `sentence` is the one plain-words owner sentence with its
   * evidence. `opts.installs` is the app's Install list
   * [{ part, installed_at }] — without it only Flashes, answers and the logs'
   * own jump count as "a change".
   *
   * | Pattern | Cause | Step |
   * | Trims beyond ±10 % in every band from the first minute, after a change | MAF Scaling / housing mismatch | undo |
   * | Trims ≥ +8 % at idle/low airflow only, after a change | Unmetered air | install |
   * | Leaner than target under boost, after a change | Exhaust leak ahead of the A/F sensor, or real lean | install |
   * | High retard with a flat score | Scheduled retard | never a finding (null) |
   * | Score rising mostly while lugging, hot | Lugging on hot E10 | habit |
   * | Boost overshoot above +2.5 psi held, after a change | Faster spool | downpipe |
   *
   * Row 1's second half ("then MAF Scaling for the housing") is ticket 07's
   * question, not a curve edit: on a Stop drive the step stays Undo and the
   * Flash plan stays kind undo with zero cells.
   */
  var DIAG_TRIM_ALL = 10;   // every load band beyond ±10 %: the air reading is off
  var DIAG_IDLE_LEAK = 8;   // +8 % at idle/low airflow with high airflow fine: unmetered air
  var DIAG_KR_HIGH = 5;     // scheduled retard under boost sits near 5° (fact-check §2)

  /** The change this Drive came right after, if the app can see one. */
  function diagChange(s, sum, opts) {
    var prev = null;
    orderedSummaries(s).forEach(function (d) {
      if (d.id === sum.id) return;
      if (d.start != null && sum.start != null && !(d.start < sum.start)) return;
      if (!prev || (isNum(d.start) && isNum(prev.start) ? d.start > prev.start : true)) prev = d;
    });
    function afterPrev(t) {
      return isNum(t) && isNum(sum.start) && t <= sum.start &&
        (!prev || !isNum(prev.start) || t > prev.start);
    }
    var inst = null, dp = null;
    ((opts && Array.isArray(opts.installs)) ? opts.installs : []).forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      var t = isNum(r.installed_at) ? r.installed_at
        : (isNum(r.installedAt) ? r.installedAt : (isNum(r.time) ? r.time : null));
      if (!afterPrev(t)) return;
      var part = r.part ? String(r.part) : 'a part';
      if (!inst) inst = { kind: 'install', part: part, downpipe: false };
      if (!dp && /downpipe/i.test(part)) dp = { kind: 'install', part: part, downpipe: true };
    });
    if (dp) return dp;
    if (inst) return inst;
    var fl = null;
    (s.flashes || []).forEach(function (f) { if (f && afterPrev(f.time)) fl = f; });
    if (fl) return { kind: 'flash', part: fl.map, downpipe: false };
    if (s.answers && s.answers[sum.id] === 'flashed') return { kind: 'answer', part: '', downpipe: false };
    // Nothing recorded — but the logs may show the change anyway: the trims
    // jumped more than 5 points against this car's own median, which is the
    // app's own Unexplained-change rule, not a guess.
    var baseline = KTA.carBaseline(s);
    var u = unexplainedFor(s, sum, baseline);
    if (u && u.reasons.indexOf('trim') >= 0) return { kind: 'jump', part: '', downpipe: false };
    return null;
  }
  /** ", right after a change" — or the downpipe by name when it is known. */
  function changeBit(ch) {
    if (ch.kind === 'install' && ch.downpipe) return ', after the downpipe went on';
    return ', right after a change';
  }

  KTA.carDiagnose = function (state, driveId, opts) {
    var s = normalize(state);
    var sum = s.drives[driveId] || null;
    if (!sum) return null;
    var baseline = KTA.carBaseline(s);
    var base = isNum(baseline.value) ? baseline.value : KTA.LIMITS.score.baseline;
    var ch = diagChange(s, sum, opts);
    var bands = Array.isArray(sum.trimBands) ? sum.trimBands : [];
    var withData = bands.filter(function (b) { return b && isNum(b.trim) && (b.seconds || 0) >= 20; });

    // 1. Every load band off by the same sign from the first minute, after a
    //    change: the sensor reads through the wrong curve or housing. Undo (or
    //    the right preset) — never a curve edit, never a knock fix.
    if (ch && withData.length >= 2 &&
        withData.every(function (b) { return Math.abs(b.trim) > DIAG_TRIM_ALL; }) &&
        (withData[0].trim < 0
          ? withData.every(function (b) { return b.trim < 0; })
          : withData.every(function (b) { return b.trim > 0; })) &&
        isNum(sum.trimFirstMin) && Math.abs(sum.trimFirstMin) > DIAG_TRIM_ALL) {
      return {
        id: 'maf-preset', cause: 'MAF Scaling / housing mismatch', step: 'undo', change: ch.kind,
        sentence: 'Trims pulled ' + sg1(sum.trimWorst) + ' % in every band from the first minute' +
          changeBit(ch) + ': the airflow reading is off, not the fuel.'
      };
    }

    // 2. Idle and low airflow rich with trims while high airflow reads fine,
    //    after a change: air getting in past the sensor. A spanner check.
    var low = withData.filter(function (b) { return b.from < 1; });
    var high = withData.filter(function (b) { return b.from >= 1; });
    var idleBad = isNum(sum.trimIdle) && sum.trimIdle >= DIAG_IDLE_LEAK;
    var lowBad = low.some(function (b) { return b.trim >= DIAG_IDLE_LEAK; });
    if (ch && (idleBad || lowBad) && high.length > 0 &&
        high.every(function (b) { return Math.abs(b.trim) <= TRIM_OK; })) {
      var leakTrim = idleBad ? sum.trimIdle
        : low.reduce(function (m, b) { return b.trim > m ? b.trim : m; }, -Infinity);
      return {
        id: 'unmetered-air', cause: 'Unmetered air (leak after the sensor)', step: 'install', change: ch.kind,
        sentence: 'Trims add +' + n1(leakTrim) + ' % at idle and low airflow but read fine higher up' +
          changeBit(ch) + ': air is getting in past the sensor, so no map change.'
      };
    }

    // 3. Leaner than the map asks under boost, after a change: a leak ahead of
    //    the A/F sensor reads lean, or the mixture really is lean. Flanges first.
    if (ch && (sum.hardPulls || 0) > 0 && isNum(sum.mixLeanest) && isNum(sum.mixTarget) &&
        sum.mixLeanest >= sum.mixTarget + LEAN_WATCH) {
      return {
        id: 'exhaust-lean', cause: 'Exhaust leak ahead of the A/F sensor, or real lean', step: 'install', change: ch.kind,
        sentence: 'Full-throttle mixture read ' + n1(sum.mixLeanest) + ' against ' + n1(sum.mixTarget) +
          ' asked' + changeBit(ch) + ': check the flanges first, then the mixture.'
      };
    }

    // 5. The score climbing mostly while lugging on a hot drive: the habit.
    //    (Row 4 sits after row 6: scheduled retard returns null, so it must not
    //    run before a real cause — on 20:38 the trims win over the retard.)
    var hab = habitCause(sum, base);
    if (hab) {
      return {
        id: 'lugging', cause: 'Lugging on hot E10', step: 'habit', change: ch ? ch.kind : null,
        habit: hab,
        sentence: 'Knock Control rose ' + n2(sum.kcStart) + ' → ' + n2(sum.kcPeak) +
          ' mostly while lugging in ' + n0(sum.iatMoving) + ' °C air: keep the revs up.'
      };
    }

    // 6. A held overshoot past +2.5 psi on pulls, after a change: the new pipe
    //    spools faster. The Flash plan carries the trim; this names the cause.
    if (ch && (sum.hardPulls || 0) > 0 && isNum(sum.overshoot) &&
        sum.overshoot > KTA.LIMITS.overshoot.watch) {
      return {
        id: 'spool', cause: 'Faster spool after the downpipe', step: 'downpipe', change: ch.kind,
        sentence: 'Boost held +' + n1(sum.overshoot) + ' psi over target on pulls' +
          changeBit(ch) + ': it spools faster now, so the plan asks for less boost where it spools early.'
      };
    }

    // 4. High retard with a flat score is scheduled retard (fact-check §2) —
    //    explicitly never a finding. It returns null like any unmatched drive,
    //    and this row exists so a future knock cause cannot sneak past it: the
    //    fixture pins high retard + flat score to null. It runs last so a real
    //    cause on the same drive (on 20:38, the trims) always wins over it.
    var krHigh = (isNum(sum.krPeak) && sum.krPeak >= DIAG_KR_HIGH) || !!sum.krScheduled;
    var krRise = (isNum(sum.kcPeak) && isNum(sum.kcStart)) ? sum.kcPeak - sum.kcStart : null;
    if (krHigh && krRise != null && krRise <= LUG_RISE_OK) return null;
    return null;
  };

  /**
   * Exactly one Next step, in the fixed order above, plus the Open steps as they
   * stand after it: the step it opens, and the one added beside it as a free
   * habit when a cause was seen today before the Baseline exists. Diagnose runs
   * first (`KTA.carDiagnose`): the cause seen today goes to the step its
   * pattern names, and the reply sentence reads it. `opts.installs` rides
   * through to Diagnose.
   */
  KTA.carNextStep = function (state, driveId, openSteps, opts) {
    var s = normalize(state);
    var steps = KTA.carOpenSteps(openSteps);
    var sum = s.drives[driveId] || null;   // a Drive not in the Car history is a Too-short Drive
    var prevRead = previousReadId(s, driveId);
    var dg = KTA.carDiagnose(s, driveId, opts);

    /** The step, the Open steps as they now stand, and the keys the app stores. */
    function answer(step, keys, alsoKeys) {
      var asked = keys || [];
      var opened = asked.concat(alsoKeys || []);
      if (asked.length) {
        // "Same step as last time" is read against the Drive before this one, and
        // never hides a step that brings news of its own (a cause seen today).
        var prev = stepByKey(steps, asked[0]);
        step.same = !!step.same && !step.also && !!prevRead && !!prev && prev.lastAskedOn === prevRead;
      }
      // Every step carries the diagnosis it was decided with (or null): the
      // reply sentence and the install step's body read it.
      step.diagnose = dg || null;
      opened.forEach(function (k) {
        var st = stepByKey(steps, k);
        if (st) {
          // Asked again: the same step, so it keeps its place and the Drive that
          // first asked it (Drives to proof counts from there); only this move.
          if (asked.indexOf(k) >= 0) st.lastAskedOn = driveId;
        } else {
          steps.push({
            key: k, title: stepOf(k).title, status: 'open', why: 'Asked on ' + driveStamp(driveId) + '.',
            id: null, askedOn: driveId, askedAt: sum && isNum(sum.start) ? sum.start : null,
            lastAskedOn: asked.indexOf(k) >= 0 ? driveId : null, settledBy: null, settledAt: null
          });
        }
      });
      return { state: s, step: step, openSteps: steps, opened: opened, diagnose: dg || null };
    }
    function base(key, kind, title, gauges, proves, settlesOn, opens, also) {
      return {
        key: key, kind: kind, title: title, opens: opens || null, also: also || null,
        gauges: gauges || [], proves: proves || null, settlesOn: settlesOn,
        // A step that opens something can be a repeat; one that opens nothing
        // (nothing to change) never is.
        same: !!opens, cause: null, previous: null, flat: sum ? (sum.flat || []).slice() : []
      };
    }
    function held(key) { return openOf(steps, key); }
    /** Two channels to add in TunerView: free, and worth asking for while we are there. */
    function missingChannels() {
      return !!sum && (sum.missing || []).some(function (k) {
        return k === 'afrCmd' || k === 'mafHz' || k === 'mafGs' || k === 'lamCmd';
      }) && !openOf(steps, 'channels');
    }
    /** A step as the Next step tells it, read from the step's own entry: the opening words unless `title` is given. */
    function asking(key, title, proves, opens, also) {
      var a = stepOf(key).ask;
      return base(key, a.kind, title || a.first, a.gauges.slice(), proves || a.proves, a.when, opens, also);
    }
    /** Undo: the only step a Stop drive gets, and the housing-mismatch route. */
    function undoStep() { return asking('undo', null, null, 'undo'); }
    /** A leak or a flange to check under the bonnet: no map change. */
    function installStep() { return asking('install', null, null, 'install'); }
    /** Faster spool after the downpipe: the Flash plan carries the trim. */
    function downpipeStep() { return asking('downpipe', null, null, 'downpipe'); }

    // 1. An open Stop: Undo is the only step, exactly as the Flash plan's P1.
    if (sum && sum.verdict === 'stop') {
      return answer(undoStep(), ['undo'],
        missingChannels() ? ['channels'] : []);
    }

    // 2. A Too-short Drive read nothing: the step the owner already has stands.
    if (!sum) {
      var stand = held('undo') || held('logger') || held('habit') || held('channels') || held('baseline');
      return answer({
        key: 'tooShort', kind: 'none', opens: null, also: null, gauges: [], proves: null,
        settlesOn: 'after a drive of 10 minutes or more', same: true, cause: null, flat: [],
        title: 'Nothing read: the drive was too short',
        previous: stand ? { key: stand.key, title: stand.title } : null
      }, []);
    }

    // 3. A logger fault: the log, not the car.
    if ((sum.flat || []).length) {
      return answer(asking('logger', 'Your logger recorded ' + (sum.flat.length) +
        ' dead ' + (sum.flat.length === 1 ? 'gauge' : 'gauges'), null, 'logger'), ['logger']);
    }

    // 4. No Baseline yet: one Cool Drive with 2 pulls, and a cause seen today is
    //    opened beside it as a free habit (the Baseline stays the step: the habit
    //    is scored against it).
    var baselineStep = stepByKey(steps, 'baseline');
    var cause = (dg && dg.id === 'lugging') ? dg.habit : null;
    // Opened beside the step, never instead of it: the free habit, and the two
    // channels to add in TunerView while the owner is there anyway.
    var beside = [];
    if (cause) beside.push('habit');
    if (missingChannels()) beside.push('channels');
    if (!baselineStep || !doneStatus(baselineStep.status)) {
      var cool = answer(asking('baseline', null, null, 'baseline', cause ? 'habit' : null),
        ['baseline'], beside);
      cool.step.cause = cause;
      return cool;
    }

    // 5. A cause seen today: its step. Diagnose ran before this decision, so
    //    each pattern goes to the step its row names: lugging to the habit
    //    (the loop's existing step, unchanged), unmetered air or a lean mixture
    //    to the install check, faster spool to the downpipe trim, and a housing
    //    mismatch to Undo.
    var lugging = (dg && dg.id === 'lugging') ? dg.habit : null;
    if (lugging) {
      var habit = answer(asking('habit', null,
        stepOf('habit').ask.proves + ' (today ' + n1(sum.lugShare) + ' %, +' + n2(lugging.rise) + ')', 'habit'), ['habit'],
        missingChannels() ? ['channels'] : []);
      habit.step.cause = lugging;
      return habit;
    }
    if (dg && dg.id === 'maf-preset') {
      return answer(undoStep(), ['undo'],
        missingChannels() ? ['channels'] : []);
    }
    if (dg && (dg.id === 'unmetered-air' || dg.id === 'exhaust-lean')) {
      return answer(installStep(), ['install'],
        missingChannels() ? ['channels'] : []);
    }
    if (dg && dg.id === 'spool') {
      return answer(downpipeStep(), ['downpipe'],
        missingChannels() ? ['channels'] : []);
    }

    // 6. An Open step still open: its step again, compact — "same step as last time".
    var again = held('undo') || held('logger') || held('downpipe') || held('install') || held('habit');
    if (again) {
      return answer(asking(again.key, stepOf(again.key).ask.title, null, again.key), [again.key]);
    }

    // 7. Nothing to ask: the app says what it is waiting to hear.
    return answer(base('none', 'none', 'Nothing to change. Drive it.', [],
      null, 'after any Flash, any part fitted, a new fuel brand, or Knock Control over ' +
      n2(UPLOAD_SCORE) + ' on the gauge', null), [], missingChannels() ? ['channels'] : []);
  };

  // ---------------------------------------------------------------------------
  // Owner questions: what only the owner knows, as tap-to-answer choices
  //
  // Generated by the engine, never the model. Given the state and one Drive,
  // emit zero or more questions, ordered by decision impact: what changed
  // (determines the Undo file), which housing (resolves the Flash plan's own
  // preset route), did you flash (explains the after-flash pattern).
  //
  //   KTA.carQuestions(state, driveId, opts)  [{id, kind, title, question, choices, askedOn}]
  //   KTA.mafOptionFor(housing)               {option, detail} for the KTuner box
  //
  // Questions attach to causes (ticket 06): what-changed fires on the
  // maf-preset cause, housing only when the Flash plan routes to the MAF
  // Scaling choice (route preset), did-flash on the after-flash pattern with
  // an open Stop. One question at a time, most decisive first; the chat shows
  // the first unanswered one and lists the rest as "Waiting for you".
  // ---------------------------------------------------------------------------
  var DID_FLASH_START = 0.56; // the after-flash pattern worth asking about starts here
  var QUESTION_ORDER = ['what-changed', 'housing', 'did-flash'];
  function questionId(kind, driveId) { return kind + ':' + driveId; }
  /** The MAF Scaling option for one housing, as the KTuner box shows it. */
  KTA.mafOptionFor = function (housing) {
    var FIT = {
      factory: { option: 'Factory', detail: 'Factory airbox, factory housing.' },
      hvi: { option: 'Factory', detail: 'PRL says the HVI gives proper trims with no tune. Not assumed: the next calm drive must show trims within ±5 %.' },
      race: { option: 'PRL Race', detail: 'The PRL Race housing is larger than factory; its curve is in your file.' },
      won: { option: '27Won Race', detail: 'The 27WON Race housing has its own curve in your file.' },
      unsure: { option: null, detail: 'Stay on the Undo file. Check the housing (receipt, or the label on it) before changing MAF Scaling.' }
    };
    return FIT[housing] || null;
  };
  KTA.QUESTION_ORDER = QUESTION_ORDER.slice();
  KTA.carQuestions = function (state, driveId, opts) {
    var s = normalize(state);
    var sum = s.drives[driveId] || null;
    if (!sum) return [];
    opts = opts || {};
    var plan = opts.plan || null;
    var steps = KTA.carOpenSteps(opts.openSteps);
    var dg = KTA.carDiagnose(s, driveId, opts);
    var out = [];
    // 1. What changed: the trims Stop after a change (the maf-preset cause).
    //    The answer determines the Undo file, so it decides first.
    if (dg && dg.id === 'maf-preset') {
      var prev = null;
      orderedSummaries(s).forEach(function (d) {
        if (d.id === sum.id) return;
        if (d.start != null && sum.start != null && !(d.start < sum.start)) return;
        if (!prev || (isNum(d.start) && isNum(prev.start) ? d.start > prev.start : true)) prev = d;
      });
      var between = prev ? ' between your ' + driveStamp(prev.id) + ' drive and this one' : '';
      out.push({
        id: questionId('what-changed', driveId),
        kind: 'what-changed',
        title: 'What changed',
        question: 'What changed' + between + '?',
        choices: [
          { id: 'maf', label: 'I flashed, changing MAF Scaling' },
          { id: 'other-flash', label: 'I flashed something else' },
          { id: 'part', label: 'I fitted a part, no flash' },
          { id: 'nothing', label: 'Nothing I know of' }
        ],
        askedOn: driveId
      });
    }
    // 2. Which housing: only when the Flash plan routes to the MAF Scaling
    //    choice. It resolves the plan's own route, shown inside the KTuner box.
    if (plan && plan.route === 'preset') {
      out.push({
        id: questionId('housing', driveId),
        kind: 'housing',
        title: 'Which intake housing is fitted',
        question: 'Which intake housing is fitted?',
        choices: [
          { id: 'factory', label: 'Factory airbox' },
          { id: 'hvi', label: 'PRL HVI' },
          { id: 'race', label: 'PRL Race housing' },
          { id: 'won', label: '27WON Race' },
          { id: 'unsure', label: 'Not sure' }
        ],
        askedOn: driveId
      });
    }
    // 3. Did you flash: the after-flash pattern (starts near 0.58, settles to
    //    the Baseline) with an open Stop. An unrecorded Undo flash would
    //    otherwise break the proof.
    var undoOpen = steps.some(function (st) { return st.key === 'undo' && !doneStatus(st.status); });
    if (isNum(sum.kcStart) && isNum(sum.kcEnd) && sum.kcStart >= DID_FLASH_START &&
        sum.kcEnd <= (KTA.carBaseline(s).value + SCORE_SHAKEDOWN) && undoOpen) {
      out.push({
        id: questionId('did-flash', driveId),
        kind: 'did-flash',
        title: 'Did you flash',
        question: 'Knock Control started at ' + n2(sum.kcStart) +
          ' and settled: that is what a fresh flash does. Did you flash after the Stop?',
        choices: [
          { id: 'undo', label: 'Yes, the old file back (Undo)' },
          { id: 'other', label: 'Yes, a different file' },
          { id: 'no', label: 'No' }
        ],
        askedOn: driveId
      });
    }
    out.sort(function (a, b) { return QUESTION_ORDER.indexOf(a.kind) - QUESTION_ORDER.indexOf(b.kind); });
    return out;
  };

  /**
   * Owner-facing words, decided here once (ADR 0004). The server reads this table
   * at startup and passes the words through; no other module spells them.
   */
  KTA.carWords = { channels: LOG_CHANNEL_NAMES, months: MONTHS, stepStatus: STEP_STATUS, driveStamp: driveStamp };

  return KTA;
}));

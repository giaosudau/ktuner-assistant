#!/usr/bin/env node
'use strict';
/*
 * The worker: the only process that touches the engine (ADR 0002).
 *
 * Protocol: newline-delimited JSON on stdin, one reply per request on stdout.
 *
 *   → {"id":"7","op":"ingestUpload","args":{"csv":"<text>","fileName":"TunerView_…csv","now":1756723200000}}
 *   ← {"id":"7","ok":true,"result":{ …engine facts, never raw rows… }}
 *   ← {"id":"7","ok":false,"error":{"message":"…","code":"…"}}
 *
 * Four rules keep it honest (ADR 0004 §"the worker protocol"):
 *
 *   1. Parsed logs are cached by Drive id. `ingestUpload` parses the CSV, runs
 *      `KTA.carIngest` and keeps the log under the returned Drive id. Later ops
 *      (`driveFacts`, `overview`, `insight`, …) read that cache; `loadLog`
 *      re-hydrates it after a restart, because the raw CSV lives in SQLite.
 *   2. Results are summaries. A Drive comes back as the numbers the reply shows.
 *      Never a row array. `engine/kta-ask.js`'s tool handlers are reused as they
 *      are, so the numbers match the in-browser assistant's.
 *   3. The Car history state is one JSON document that goes in and comes back
 *      unchanged — the engine's operations are pure, so this worker never owns
 *      state of its own beyond the log cache. Map versions travel in it as
 *      numbers, names and dates; their tables do not, because the whole KTuner
 *      map would ride out with every Drive. `mapVersion` fetches one version's
 *      tables when a change is checked against it (ADR 0003).
 *   4. Every number the reply can show is computed here, from the engine's own
 *      constants. Python never re-derives a threshold.
 *
 * stdout carries the protocol and nothing else; every log line goes to stderr.
 */

var path = require('path');

// ---------------------------------------------------------------------------
// The engine, and the interface text its ask tools read (app/i18n*.js are
// browser IIFEs that hang off window; nothing is modified, only loaded).
// ---------------------------------------------------------------------------
globalThis.window = globalThis.window || {};
require(path.join(__dirname, '..', '..', 'app', 'i18n.js'));
require(path.join(__dirname, '..', '..', 'app', 'i18n-drive.js'));
require(path.join(__dirname, '..', '..', 'app', 'i18n-map.js'));

var KTA = require(path.join(__dirname, '..', '..', 'engine', 'kta-car.js'));
require(path.join(__dirname, '..', '..', 'engine', 'kta-ask.js')); // adds KTA.ask
var PICTURE = require(path.join(__dirname, '..', '..', 'engine', 'kta-picture.js')); // chart data (ticket 15)
var MAP_DEFAULT = require(path.join(__dirname, '..', '..', 'data', 'ktuner-maps-digitized.json'));
var TEXTS = globalThis.window.KTA_I18N.en;

// Where a Map version's tables come from. `ktuner-basemap` is this app's own
// digitized KTuner basemap — Map version 1's tables. A version whose tables the
// app has not stored yet says so instead of borrowing another version's tables.
var TABLE_SOURCES = { 'ktuner-basemap': function () { return MAP_DEFAULT; } };

var isNum = function (v) { return typeof v === 'number' && isFinite(v); };
function rnd(v, d) { return isNum(v) ? Math.round(v * Math.pow(10, d)) / Math.pow(10, d) : null; }

// ---------------------------------------------------------------------------
// Errors: a code and a sentence, never a stack trace.
// ---------------------------------------------------------------------------
function OpError(code, message) { this.code = code; this.message = message; }
OpError.prototype = Object.create(Error.prototype);
OpError.prototype.name = 'OpError';

function fail(code, message) { throw new OpError(code, message); }
function bad(message) { fail('bad-request', message); }
function need(args, key, kind) {
  var v = args[key];
  if (v == null) bad('Missing argument: ' + key + '.');
  if (kind && typeof v !== kind) bad('Argument ' + key + ' must be a ' + kind + '.');
  return v;
}
function str(args, key) {
  var v = args[key];
  if (v == null) return '';
  if (typeof v !== 'string') bad('Argument ' + key + ' must be a string.');
  return v;
}

// ---------------------------------------------------------------------------
// The log cache (rule 1)
// ---------------------------------------------------------------------------
var CACHE = Object.create(null);
var CACHE_ORDER = [];
var CACHE_MAX = 24;

function cachePut(id, entry) {
  if (!id) return;
  if (!CACHE[id]) CACHE_ORDER.push(id);
  CACHE[id] = entry;
  while (CACHE_ORDER.length > CACHE_MAX) delete CACHE[CACHE_ORDER.shift()];
}
function cacheGet(id) {
  var e = CACHE[id];
  if (!e) fail('no-log', 'Drive ' + id + ' is not in the worker cache. Send loadLog with its raw CSV first.');
  return e;
}
function parsed(csv, fileName) {
  var log;
  try { log = KTA.readLog(csv); } catch (e) { fail('unreadable-csv', 'The CSV could not be read as a TunerView log: ' + (e && e.message)); }
  if (!log || !log.n) fail('unreadable-csv', 'The CSV has no log rows in it.');
  var id = KTA.carIdentity(log, fileName ? { fileName: fileName } : {}).id;
  return { log: log, id: id };
}

// ---------------------------------------------------------------------------
// The ask context (rule 2): the engine's texts, its formatter, and the check
// labels the app renders. Same functions app/app.js uses; nothing is invented.
// ---------------------------------------------------------------------------
function checkText(c) {
  var d = TEXTS.checks[c.id];
  var data = c.data || {};
  var F = KTA.fmt;
  if (data.flat) {
    var D = TEXTS.drive;
    return { label: d ? d.label : c.label, display: D.unavailableLine(data, F, TEXTS), fix: D.unavailableFix(data, F, TEXTS) };
  }
  if (!d) return { label: c.label, display: c.display, fix: c.fix };
  return {
    label: d.label,
    display: d.display(data, F),
    fix: c.status === 'good' || c.status === 'nodata' ? '' : d.fix(data, F)
  };
}
function askContext(entry) {
  var ctx = KTA.ask.context({ report: entry.report, log: entry.log, T: TEXTS.drive, checkText: checkText });
  ctx._m = null;
  return ctx;
}
function askRun(driveId, tool, input) {
  var entry = cacheGet(driveId);
  if (!entry.report) fail('no-report', 'Drive ' + driveId + ' has no drive report loaded.');
  var out = KTA.ask.runTool(askContext(entry), tool, input || {});
  if (out && out.error) fail('tool-error', out.error);
  return out.result;
}

// ---------------------------------------------------------------------------
// What a Drive looks like on the wire: the numbers the reply shows, and the
// limits they are read against, all from the engine's own constants.
// ---------------------------------------------------------------------------
var S = KTA.LIMITS.score;
function pick(src, keys) {
  var out = {};
  keys.forEach(function (k) { out[k] = src[k]; });
  return out;
}
// The limits the reply can show, grouped and named exactly as the engine does
// (LIMITS.trim.good ships as limits.LIMITS.trim.good). test/thresholds.test.js
// fails if a key here is not in the engine.
var LIMITS = {
  LIMITS: {
    trim: KTA.LIMITS.trim,
    overshoot: KTA.LIMITS.overshoot,
    score: pick(S, ['baseline', 'tableDeg', 'watch', 'noHard', 'stop']),
    mixture: pick(KTA.LIMITS.mixture, ['target', 'leanLimit'])
  },
  CAR_RULES: pick(KTA.CAR_RULES, ['minMoving', 'coolIat', 'shakedownCalm', 'lugOk', 'uploadScore']),
  DRIVE_LIMITS: pick(KTA.DRIVE_LIMITS, ['hotDrive', 'pullIatGood'])
};

/** The degrees of timing a Fuel-quality score costs under boost (fact-check.md §2). */
function timingCostDeg(score) {
  if (!isNum(score)) return null;
  return rnd(Math.max(0, S.tableDeg * (score - S.baseline)), 1);
}

/**
 * Map versions as the engine holds them, plus the tables a named version is held
 * with. A Map version never borrows another version's tables: `mapVersion` (what
 * a check reads) refuses a version whose Flashed change is not stored yet, and
 * says so. This is the seam the two map checks (ADR 0003) read a version from.
 */
function versionsOf(state) {
  var s = KTA.carEmpty();
  if (state && typeof state === 'object' && Array.isArray(state.mapVersions)) s.mapVersions = state.mapVersions;
  return KTA.carMapVersions(s);
}
/** The Map version on the car now: the newest, unless an Undo or Revert put an older one back. */
function activeOf(state) {
  var s = KTA.carEmpty();
  if (state && typeof state === 'object') {
    if (Array.isArray(state.mapVersions)) s.mapVersions = state.mapVersions;
    if (Array.isArray(state.mapRestores)) s.mapRestores = state.mapRestores;
  }
  return KTA.carActiveMapVersion(s);
}
function versionByNumber(state, ref) {
  var vs = versionsOf(state);
  if (isNum(ref)) {
    var byNumber = vs.filter(function (v) { return v.n === ref; })[0];
    if (!byNumber) fail('no-map-version', 'There is no Map version ' + ref + '. The app holds: ' + versionList(vs) + '.');
    return byNumber;
  }
  var byName = vs.filter(function (v) { return v.name === String(ref); })[0];
  if (!byName) fail('no-map-version', 'There is no Map version named "' + ref + '". The app holds: ' + versionList(vs) + '.');
  return byName;
}
function versionList(vs) { return vs.map(function (v) { return v.label; }).join(', ') || 'none'; }
function tablesFor(v) {
  var source = TABLE_SOURCES[v.tablesFrom];
  if (!source) fail('no-map-tables', 'The app holds the name of ' + v.label + ' but not its tables yet.');
  return source();
}
/** Which Map version a plan is written against: the one asked for, else the active one.
 *  A plan may be written on a version whose change is not stored yet (the app can
 *  still read the map); `mapVersion` is where a check refuses. */
function mapForVersion(state, ref) {
  if (ref != null) return tablesFor(versionByNumber(state, ref));
  var active = activeOf(state);
  return active ? tablesFor(active) : MAP_DEFAULT;
}
function tableCount(v) {
  if (!v.tablesFrom || !TABLE_SOURCES[v.tablesFrom]) return 0;
  return Object.keys(TABLE_SOURCES[v.tablesFrom]()).length;
}
/** The tables a check may be made against: a version's own, never an older map's. */
function tablesToCheck(v) {
  if (v.tablesPending) {
    fail('map-change-pending',
      'The change behind ' + v.label + ' is not stored yet, so its tables cannot be checked. ' +
      'Ask the owner what they flashed, or store the checked change first.');
  }
  return tablesFor(v);
}
/**
 * What crosses the process boundary, defined once (ADR 0004: summaries only).
 * Every op that returns an engine object returns it through summarize(kind, x):
 * a fixed set of named fields, never raw rows, a log, a CSV or a whole table.
 * `mapVersion` is the one deliberate exception: it hands the tables themselves
 * to a map check (ADR 0003), and says so in its own comment.
 */
var SUMMARIES = {
  shakedown: function (sh) {
    if (!sh) return null;
    return {
      role: sh.role, status: sh.status, passed: !!sh.passed,
      calmSec: sh.calmSec || 0, neededSec: sh.needed || KTA.CAR_RULES.shakedownCalm,
      calmMin: Math.round((sh.calmSec || 0) / 60)
    };
  },

  map: function (m) {
    if (!m || !m.recorded) return null;
    return {
      recorded: true,
      version: m.version,
      label: m.label || 'Map version ' + m.version,
      name: m.name,
      since: m.since == null ? null : m.since,
      kind: m.kind || null,
      flashId: m.flashId || null,
      changed: m.changed || null
    };
  },

  drive: function (report) {
    if (!report) return null;
    var out = {
      id: report.identity,
      tooShort: !!report.tooShort,
      replaced: !!report.replaced,
      firstDrive: !!report.firstDrive,
      verdict: report.verdict,
      verdictWord: KTA.STATUS_LABEL[report.verdict] || "Can't tell",
      baseline: report.baseline || null,
      // Which Map version this Drive ran on, in the owner's words: the version
      // active at its start, never guessed from the log, never "not recorded".
      map: summarize("map", report.map),
      isShakedown: !!report.isShakedown,
      shakedown: summarize("shakedown", report.shakedown),
      flashCause: report.flashCause || null,
      hardDrivingWatch: !!report.hardDrivingWatch,
      unexplained: report.unexplained || null,
      afterFlash: report.afterFlash || null,
      unexplainedWatch: !!report.unexplainedWatch,
      hotRestart: !!report.hotRestart,
      summary: null,
      numbers: null
    };
    var s = report.summary;
    if (s) {
      out.summary = {
        id: s.id, start: s.start, fileName: s.fileName || '',
        durationSec: s.duration, movingSec: s.moving,
        iatMoving: s.iatMoving, cool: !!s.cool, hot: !!s.hot, hotRestart: !!s.hotRestart,
        kcStart: s.kcStart, kcEnd: s.kcEnd, kcPeak: s.kcPeak,
        timingCostDeg: timingCostDeg(s.kcPeak),
        trimWorst: s.trimWorst,
        hardPulls: s.hardPulls,
        mixLeanest: s.mixLeanest, mixTarget: s.mixTarget,
        boostTarget: s.boostTarget, overshoot: s.overshoot, wgAtPeak: s.wgAtPeak,
        cvtPeak: s.cvtPeak, lugShare: s.lugShare,
        // Why the score moved while the car was lugging: the facts the habit cause
        // is diagnosed from (and the Diagnose node reads next).
        kcUpSteps: s.kcUpSteps == null ? null : s.kcUpSteps,
        lugUpSteps: s.lugUpSteps == null ? null : s.lugUpSteps,
        lugRpm: s.lugRpm == null ? null : s.lugRpm,
        accel5070: s.accel5070 ? rnd(s.accel5070.seconds, 2) : null,
        flat: (s.flat || []).slice(), missing: (s.missing || []).slice(),
        calmSec: s.calmSec, shakedown: s.shakedown
      };
      // The four numbers of the reply, named as CONTEXT.md names them.
      out.numbers = {
        iatMoving: s.iatMoving,
        kcStart: s.kcStart,
        kcPeak: s.kcPeak,
        timingCostDeg: timingCostDeg(s.kcPeak),
        trimWorst: s.trimWorst,
        hardPulls: s.hardPulls
      };
    }
    return out;
  },

  plan: function (plan) {
    if (!plan) return null;
    return {
      kind: plan.kind, changeId: plan.changeId || null, family: plan.family || null,
      headline: plan.headline, route: plan.route || null, basis: plan.basis || null,
      proof: plan.proof || null,
      saveAs: plan.saveAs || null, undoName: plan.undoName || null,
      undo: plan.undo || null,
      mapVersion: plan.mapVersion || null,
      ceilingPsi: plan.ceiling != null ? plan.ceiling : null,
      tables: (plan.tables || []).map(function (t) {
        return { id: t.id, kind: t.kind, cellCount: (t.cells || []).length, pasteRow: t.pasteRow || null };
      }),
      cellCount: (plan.cells || []).length,
      cells: (plan.cells || []).map(function (c) {
        return { table: c.table, rpm: c.rpm, rpmRow: c.rpmRow, col: c.col, of: c.of, before: c.before, after: c.after };
      }),
      afmPasteRow: plan.afmPasteRow || null,
      afmAfter: plan.afmAfter || null,
      flashChanged: plan.prefill ? plan.prefill.changed : null,
      evidence: plan.evidence || [],
      deferred: plan.deferred || [],
      levers: (plan.levers || []).map(function (l) { return { id: l.id, family: l.family, title: l.title, status: l.status, reason: l.reason, unlocks: l.unlocks }; }),
      openIssues: plan.openIssues || null
    };
  },

  version: function (v) {
    if (!v) return null;
    return {
      n: v.n, label: v.label, name: v.name, kind: v.kind, tablesFrom: v.tablesFrom || null,
      tablesPending: !!v.tablesPending,
      tablesHeld: !!(v.tablesFrom && (TABLE_SOURCES[v.tablesFrom] || v.tablesFrom === 'app-store') && !v.tablesPending),
      from: v.from == null ? null : v.from, flashId: v.flashId || null, changed: v.changed || null,
      note: v.note || '', updatedAt: v.updatedAt == null ? null : v.updatedAt,
      tableCount: tableCount(v)
    };
  }
};
function summarize(kind, x) { return SUMMARIES[kind](x); }

function stateOf(args) {
  var s = args.state;
  if (s == null) return KTA.carEmpty();
  if (typeof s !== 'object') bad('Argument state must be the Car history state object.');
  return s;
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------
var OPS = {

  /** Liveness and the engine's own thresholds, so no number is copied anywhere. */
  ping: function () {
    return {
      ok: true, engine: { carVersion: KTA.CAR_RULES.version, driveVersion: KTA.DRIVE_LIMITS.version || null },
      limits: LIMITS,
      cachedDrives: CACHE_ORDER.slice(),
      ktunerBasemap: KTA.CAR_RULES.ktunerBasemap,
      mapVersionSeed: {
        n: 1, label: 'Map version 1', name: KTA.CAR_RULES.ktunerBasemap,
        kind: 'ktuner-basemap', tablesFrom: 'ktuner-basemap',
        tableCount: Object.keys(MAP_DEFAULT).length
      }
    };
  },

  /** Every Map version the app holds, and which one the car is on now. */
  mapVersions: function (args) {
    var vs = versionsOf(stateOf(args));
    return {
      versions: vs.map(function (v) { return summarize("version", v); }),
      active: summarize("version", activeOf(stateOf(args)))
    };
  },

  /**
   * One Map version with its tables, as the map checks read it (ADR 0003). Only
   * asked for when a change is being checked against that version: the tables are
   * the whole KTuner map, so they never ride out with a Drive report. A version
   * whose change the app has not stored yet refuses rather than handing over the
   * tables of an older map.
   */
  mapVersion: function (args) {
    var state = stateOf(args);
    var ref = args.version == null ? null : args.version;
    var v = ref == null ? activeOf(state) : versionByNumber(state, ref);
    if (!v) fail('no-map-version', 'This car has no Map version yet.');
    return { version: summarize("version", v), tables: tablesToCheck(v) };
  },

  /** Map version 1: the KTuner basemap the owner gave the app. Idempotent. */
  recordBasemap: function (args) {
    var state = stateOf(args);
    var now = isNum(args.now) ? args.now : Date.now();
    var opts = args.basemap && typeof args.basemap === 'object' ? args.basemap : {};
    var out;
    try {
      out = KTA.carRecordBasemap(state, opts, { now: now });
    } catch (e) {
      fail('engine-error', 'The KTuner basemap could not be recorded: ' + (e && e.message));
    }
    return { state: out.state, version: summarize("version", out.version), created: !!out.created };
  },

  /** The raw CSV again: parse it and put the log back in the cache (after a restart). */
  loadLog: function (args) {
    var p = parsed(need(args, 'csv', 'string'), str(args, 'fileName'));
    var id = str(args, 'driveId') || p.id;
    cachePut(id, { log: p.log, report: null, id: id });
    return { driveId: id, rows: p.log.n };
  },

  /** Read the CSV, add the Drive to the Car history, keep the log for later ops. */
  ingestUpload: function (args) {
    var state = stateOf(args);
    var fileName = str(args, 'fileName');
    var now = isNum(args.now) ? args.now : Date.now();
    var p = parsed(need(args, 'csv', 'string'), fileName);
    var out;
    try {
      out = KTA.carIngest(state, p.log, { fileName: fileName, now: now });
    } catch (e) {
      fail('engine-error', 'The engine could not read this drive: ' + (e && e.message));
    }
    var report = out.report;
    cachePut(report.identity, { log: p.log, report: report.drive, id: report.identity, carReport: report });
    return { drive: summarize("drive", report), state: out.state, replaced: !!out.replaced };
  },

  /** The remembered Car history, as the Car history screen reads it. */
  carHistory: function (args) {
    var state = stateOf(args);
    var vs = versionsOf(state);
    return {
      rows: KTA.carTableRows(state),
      baseline: KTA.carBaseline(state),
      flashes: (state.flashes || []).slice(),
      // Installs live beside the Car history, not in it: the app passes its
      // own Install list in and reads it back out, so the harness step shows
      // the change the window starts after, next to the Drives it bounds.
      installs: Array.isArray(args.installs) ? args.installs : [],
      hidden: (state.hidden || []).slice(),
      answers: Object.assign({}, state.answers || {}),
      shakedown: state.shakedown || null,
      mapVersions: vs.map(function (v) { return summarize("version", v); }),
      activeMapVersion: summarize("version", activeOf(state)),
      driveCount: KTA.carTableRows(state).length
    };
  },

  carBaseline: function (args) { return KTA.carBaseline(stateOf(args)); },

  /**
   * Settle every Open step against one Drive: Done / Not yet / Still off /
   * Can't tell yet, each with the numbers behind it, plus whether the Drive was a
   * Wasted drive (it settled none of them) and what would have settled one. The
   * Open steps are passed in and come back settled — the app holds them.
   */
  settleOpenSteps: function (args) {
    var state = stateOf(args);
    var driveId = need(args, 'driveId', 'string');
    var out;
    try {
      out = KTA.carSettle(state, driveId, args.openSteps);
    } catch (e) {
      fail('engine-error', 'The Open steps could not be settled against ' + driveId + ': ' + (e && e.message));
    }
    return { settled: out.settled, openSteps: out.openSteps, wasted: out.wasted };
  },

  /**
   * Exactly one Next step, in the order the app always uses: an open Stop first,
   * then "this log cannot be read", the dead gauges, the Baseline, a cause seen
   * today (Diagnose runs before the decision: housing mismatch, unmetered air,
   * a lean mixture, lugging, faster spool), an Open step still open (compactly),
   * and otherwise nothing. The step names the Drive whose upload will settle it,
   * and `diagnose` carries the one cause and its reply sentence (or null).
   * `installs` is the app's Install list, so a symptom right after a fitted
   * part reads as one.
   */
  nextStep: function (args) {
    var state = stateOf(args);
    var driveId = need(args, 'driveId', 'string');
    var out;
    try {
      out = KTA.carNextStep(state, driveId, args.openSteps, { installs: args.installs });
    } catch (e) {
      fail('engine-error', 'The Next step could not be decided after ' + driveId + ': ' + (e && e.message));
    }
    return { step: out.step, openSteps: out.openSteps, opened: out.opened, diagnose: out.diagnose || null };
  },

  /**
   * Owner questions with tap-to-answer choices, generated by the engine, never
   * the model. Given the state and one Drive, emit zero or more questions in
   * decision-impact order. `installs` rides through to Diagnose like nextStep.
   */
  questions: function (args) {
    var state = stateOf(args);
    var driveId = need(args, 'driveId', 'string');
    var now = isNum(args.now) ? args.now : Date.now();
    var map = args.map || mapForVersion(state, args.mapVersion);
    var plan;
    try {
      plan = KTA.carFlashPlan(state, map, { now: now, history: [] });
    } catch (e) {
      fail('engine-error', 'The Flash plan could not be built: ' + (e && e.message));
    }
    var qs;
    try {
      qs = KTA.carQuestions(state, driveId, {
        openSteps: args.openSteps, installs: args.installs, plan: plan
      });
    } catch (e) {
      fail('engine-error', 'The owner questions could not be built for ' + driveId + ': ' + (e && e.message));
    }
    return { questions: qs, route: plan.route || null, planKind: plan.kind };
  },

  /** The MAF Scaling option for one housing, as the KTuner box shows it. */
  housingOption: function (args) {
    return KTA.mafOptionFor(str(args, 'housing'));
  },

  /**
   * The one Flash plan this Car history supports (the only place a table is named).
   * `mapVersion` names the Map version to write against — the active one by
   * default — so a proposed change can be checked against the map it was made on.
   */
  flashPlan: function (args) {
    var state = stateOf(args);
    var now = isNum(args.now) ? args.now : Date.now();
    var map = args.map || mapForVersion(state, args.mapVersion);
    var plan;
    try {
      plan = KTA.carFlashPlan(state, map, { now: now, history: Array.isArray(args.history) ? args.history : [] });
    } catch (e) {
      fail('engine-error', 'The Flash plan could not be built: ' + (e && e.message));
    }
    return summarize("plan", plan);
  },

  /** Record a Flash the owner says they wrote to the ECU. It becomes the next Map version. */
  recordFlash: function (args) {
    var state = stateOf(args);
    var f = need(args, 'flash', 'object');
    var now = isNum(args.now) ? args.now : Date.now();
    var out;
    try {
      out = KTA.carRecordFlash(state, f, { now: now });
    } catch (e) {
      fail('engine-error', 'The Flash could not be recorded: ' + (e && e.message));
    }
    return {
      state: out.state, flash: out.flash,
      version: out.version ? summarize("version", out.version) : null
    };
  },

  /**
   * ADR 0003, the engine's side: is this proposed change safe on top of these
   * tables? The change is `{ mapVersion, tables: { id: [{ row, col, before, after }] } }`
   * (0-based row and col). Pure: the tables come from the app's own store, so a
   * Map version flashed from an earlier change is checked against ITS cells.
   */
  checkMapChange: function (args) {
    var out = KTA.checkMapChange(need(args, 'change', 'object'), need(args, 'tables', 'object'));
    return { ok: !!out.ok, reason: out.reason, detail: out.detail || null };
  },

  /**
   * How KTuner names a table and what its numbers are: the label as KTuner draws
   * it (`Boost Target 1 Normal L`), the unit and decimals it is typed in, and what
   * the table does in one sentence — all the engine's and the app's own words.
   */
  tableMeta: function (args) {
    var ids = Array.isArray(args.ids) ? args.ids : bad('ids must be a list of table names.');
    var out = {};
    ids.forEach(function (id) {
      var meta = KTA.TABLES[id];
      if (!meta) fail('unknown-table', 'There is no table ' + id + ' in this map.');
      var fam = /^Boost_Target_\d_Normal_/.test(id) ? 'Boost_Target_Normal' : id.replace(/_(L|H)$/, '');
      var info = (TEXTS.tables || {})[fam] || {};
      var b = /^Boost_Target_(\d)_(Normal|ECO)_(L|H)$/.exec(id);
      var lh = /_(L|H)$/.exec(id);
      out[id] = {
        label: b ? 'Boost Target ' + b[1] + ' ' + b[2] + ' ' + b[3] : (info.name || id) + (lh ? ' ' + lh[1] : ''),
        unit: meta.unit || '', digits: isNum(meta.digits) ? meta.digits : 1, kind: meta.kind,
        what: String(info.what || '').split('. ')[0].replace(/\.$/, '') + (info.what ? '.' : '')
      };
    });
    return { tables: out };
  },

  /** Undo or Revert, confirmed: an earlier Map version is flashed back and becomes active again. */
  recordRestore: function (args) {
    var state = stateOf(args);
    var f = need(args, 'flash', 'object');
    var now = isNum(args.now) ? args.now : Date.now();
    var out;
    try {
      out = KTA.carRecordRestore(state, need(args, 'version', 'number'), f, { now: now });
    } catch (e) {
      fail('engine-error', 'The Flash could not be recorded: ' + (e && e.message));
    }
    return { state: out.state, flash: out.flash, version: summarize("version", out.version) };
  },

  /** The app now holds the tables this Map version was flashed with. */
  storeMapTables: function (args) {
    var out;
    try {
      out = KTA.carStoreMapTables(stateOf(args), need(args, 'version', 'number'), { now: isNum(args.now) ? args.now : Date.now() });
    } catch (e) {
      fail('engine-error', 'The Map version could not be marked: ' + (e && e.message));
    }
    return { state: out.state, version: summarize("version", out.version) };
  },

  /** Answer an Unexplained change for one Drive. */
  answerDrive: function (args) {
    var state = stateOf(args);
    var driveId = need(args, 'driveId', 'string');
    var answer = need(args, 'answer', 'string');
    var out;
    try {
      out = KTA.carAnswer(state, driveId, answer);
    } catch (e) {
      fail('engine-error', 'That answer was not accepted: ' + (e && e.message));
    }
    return { state: out, driveId: driveId, answer: answer, report: summarize("drive", KTA.carReport(out, driveId)) };
  },

  /** The History file: every Drive, Flash and answer, no raw CSV. */
  exportHistory: function (args) { return KTA.carExport(stateOf(args)); },

  importHistory: function (args) {
    var out;
    try {
      out = KTA.carImport(stateOf(args), need(args, 'doc', 'object'));
    } catch (e) {
      fail('engine-error', 'That History file could not be read: ' + (e && e.message));
    }
    if (out.error) fail('history-file', out.error);
    return { state: out.state, added: out.added };
  },

  /** Every number a tuner reads off this Drive, as flat key → value facts. */
  driveFacts: function (args) {
    var entry = cacheGet(need(args, 'driveId', 'string'));
    if (!entry.report) fail('no-report', 'Drive ' + args.driveId + ' has no drive report loaded.');
    return { driveId: args.driveId, facts: KTA.driveFacts(entry.report) };
  },

  /**
   * Flash readback (ticket 14): the Turbo Pressure Target this Drive logged at
   * each asked rpm (within `tol` rpm), as a tally of distinct targets to 0.1 psi.
   * A summary only: never the rows.
   */
  logTargets: function (args) {
    var entry = cacheGet(need(args, 'driveId', 'string'));
    var log = entry.log;
    var tol = isNum(args.tol) ? args.tol : 30;
    var rpms = Array.isArray(args.rpms) ? args.rpms : bad('rpms must be a list.');
    var out = rpms.map(function (rpm) {
      var tally = {}, samples = 0;
      if (log.rpm && log.boostTarget) {
        for (var i = 0; i < log.n; i++) {
          var r = log.rpm[i], t = log.boostTarget[i];
          if (isNum(r) && isNum(t) && Math.abs(r - rpm) <= tol) {
            samples++;
            var k = (Math.round(t * 10) / 10).toFixed(1);
            tally[k] = (tally[k] || 0) + 1;
          }
        }
      }
      return { rpm: rpm, samples: samples, targets: Object.keys(tally).map(function (k) { return { psi: parseFloat(k), n: tally[k] }; }) };
    });
    return { driveId: args.driveId, readable: !!(log.rpm && log.boostTarget), rows: out };
  },

  // ---- engine/kta-ask.js tool handlers, unchanged, over the same cache ------
  overview: function (args) { return askRun(need(args, 'driveId', 'string'), 'get_overview', {}); },
  insight: function (args) { return askRun(need(args, 'driveId', 'string'), 'get_insight', { topic: need(args, 'topic', 'string') }); },
  channelStats: function (args) {
    return askRun(need(args, 'driveId', 'string'), 'get_channel_stats', { channel: need(args, 'channel', 'string'), where: str(args, 'where') || 'all' });
  },
  timingCell: function (args) {
    if (!isNum(args.rpm) || !isNum(args.map_psi)) bad('rpm and map_psi must be numbers.');
    return askRun(need(args, 'driveId', 'string'), 'get_timing_cell', { rpm: args.rpm, map_psi: args.map_psi });
  },
  pull: function (args) {
    if (!isNum(args.index)) bad('index must be a number.');
    return askRun(need(args, 'driveId', 'string'), 'get_pull', { index: Math.round(args.index) });
  },

  /** Chart data for one picture kind (ticket 15): engine/kta-picture.js, never rows. */
  picture: function (args) {
    var kind = need(args, 'kind', 'string');
    if (kind === 'proof') {
      var drives = stateOf(args).drives || {};
      return PICTURE.proof(drives[args.beforeId] || null, drives[need(args, 'driveId', 'string')] || null, str(args, 'key'));
    }
    var entry = cacheGet(need(args, 'driveId', 'string'));
    if (!entry.report) fail('no-report', 'Drive ' + args.driveId + ' has no drive report loaded.');
    if (kind === 'trace') return PICTURE.trace(entry.report, entry.log, args.moment);
    if (kind === 'driven') return { rpm: PICTURE.drivenRpm(entry.report) };
    bad('Unknown picture kind: ' + kind);
  }
};

// ---------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------
function handle(msg) {
  if (!msg || typeof msg !== 'object') bad('Each line must be a JSON object.');
  var op = msg.op;
  if (!op) bad('Each request needs an op.');
  var fn = Object.prototype.hasOwnProperty.call(OPS, op) ? OPS[op] : null;
  if (!fn) fail('unknown-op', 'Unknown worker op: ' + op);
  return fn(msg.args || {});
}

function reply(id, payload) {
  process.stdout.write(JSON.stringify(Object.assign({ id: id }, payload)) + '\n');
}

function failReply(id, e) {
  var known = e instanceof OpError;
  if (!known) process.stderr.write('worker error: ' + ((e && e.stack) || e) + '\n');
  reply(id, {
    ok: false,
    error: {
      message: known ? e.message : 'The engine worker failed unexpectedly.',
      code: known ? e.code : 'internal'
    }
  });
}

var queue = Promise.resolve();
function enqueue(line) {
  queue = queue.then(function () {
    var id = null;
    try {
      var msg = JSON.parse(line);
      id = msg && msg.id != null ? String(msg.id) : null;
      var result = handle(msg);
      reply(id, { ok: true, result: result === undefined ? null : result });
    } catch (e) {
      failReply(id, e);
    }
  });
  return queue;
}

var buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  buf += chunk;
  var nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    var line = buf.slice(0, nl);
    buf = buf.slice(nl + 1);
    if (line.trim()) enqueue(line);
  }
});
process.stdin.on('end', function () {
  if (buf.trim()) enqueue(buf);
  return queue.then(function () { process.exit(0); });
});
process.stdin.resume();

// stdout must carry the protocol only; a stray console.log in the engine would
// corrupt the stream, so it is redirected to stderr.
console.log = function () { process.stderr.write(Array.prototype.join.call(arguments, ' ') + '\n'); };
console.info = console.log;
console.warn = console.log;
console.debug = console.log;
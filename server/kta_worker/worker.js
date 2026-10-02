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
 *      state of its own beyond the log cache.
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
var MAP_DEFAULT = require(path.join(__dirname, '..', '..', 'data', 'ktuner-maps-digitized.json'));
var TEXTS = globalThis.window.KTA_I18N.en;

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
var S = KTA.LIMITS.score, MIX = KTA.LIMITS.mixture;
var LIMITS = {
  scoreBaseline: S.baseline,
  tableDeg: S.tableDeg,
  scoreWatch: S.watch,
  scoreNoHard: S.noHard,
  scoreStop: S.stop,
  mapTargetAfr: MIX.target,
  leanLimitAfr: Math.round((MIX.target + MIX.stopLean) * 10) / 10,
  trimOk: KTA.LIMITS.trim.good,
  trimStop: KTA.LIMITS.trim.watch,
  minMoving: KTA.CAR_RULES.minMoving,
  coolIat: KTA.CAR_RULES.coolIat,
  overshootWatch: KTA.LIMITS.overshoot.watch
};

/** The degrees of timing a Fuel-quality score costs under boost (fact-check.md §2). */
function timingCostDeg(score) {
  if (!isNum(score)) return null;
  return rnd(Math.max(0, S.tableDeg * (score - S.baseline)), 1);
}

function shakedownOut(sh) {
  if (!sh) return null;
  return {
    role: sh.role, status: sh.status, passed: !!sh.passed,
    calmSec: sh.calmSec || 0, neededSec: sh.needed || KTA.CAR_RULES.shakedownCalm,
    calmMin: Math.round((sh.calmSec || 0) / 60)
  };
}

/** Compact: no rows, no timelines, no cells. This is what crosses the boundary. */
function driveOut(report) {
  if (!report) return null;
  var out = {
    id: report.identity,
    tooShort: !!report.tooShort,
    replaced: !!report.replaced,
    firstDrive: !!report.firstDrive,
    verdict: report.verdict,
    verdictWord: KTA.STATUS_LABEL[report.verdict] || "Can't tell",
    baseline: report.baseline || null,
    map: report.map || { recorded: false, name: null, since: null },
    isShakedown: !!report.isShakedown,
    shakedown: shakedownOut(report.shakedown),
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
}

function planOut(plan) {
  if (!plan) return null;
  return {
    kind: plan.kind, changeId: plan.changeId || null, family: plan.family || null,
    headline: plan.headline, route: plan.route || null, basis: plan.basis || null,
    proof: plan.proof || null,
    saveAs: plan.saveAs || null, undoName: plan.undoName || null,
    ceilingPsi: plan.ceiling != null ? plan.ceiling : null,
    tables: (plan.tables || []).map(function (t) {
      return { id: t.id, kind: t.kind, cellCount: (t.cells || []).length, pasteRow: t.pasteRow || null };
    }),
    cellCount: (plan.cells || []).length,
    cells: (plan.cells || []).map(function (c) {
      return { table: c.table, rpm: c.rpm, rpmRow: c.rpmRow, col: c.col, of: c.of, before: c.before, after: c.after };
    }),
    afmPasteRow: plan.afmPasteRow || null,
    evidence: plan.evidence || [],
    deferred: plan.deferred || [],
    levers: (plan.levers || []).map(function (l) { return { id: l.id, family: l.family, title: l.title, status: l.status, reason: l.reason, unlocks: l.unlocks }; }),
    openIssues: plan.openIssues || null
  };
}

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
      ktunerBasemap: 'Starter 21 Dual Tune 2'
    };
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
    return { drive: driveOut(report), state: out.state, replaced: !!out.replaced };
  },

  /** The remembered Car history, as the Car history screen reads it. */
  carHistory: function (args) {
    var state = stateOf(args);
    return {
      rows: KTA.carTableRows(state),
      baseline: KTA.carBaseline(state),
      flashes: (state.flashes || []).slice(),
      hidden: (state.hidden || []).slice(),
      answers: Object.assign({}, state.answers || {}),
      shakedown: state.shakedown || null,
      driveCount: KTA.carTableRows(state).length
    };
  },

  carBaseline: function (args) { return KTA.carBaseline(stateOf(args)); },

  /** The one Flash plan this Car history supports (the only place a table is named). */
  flashPlan: function (args) {
    var state = stateOf(args);
    var now = isNum(args.now) ? args.now : Date.now();
    var map = args.map || MAP_DEFAULT;
    var plan;
    try {
      plan = KTA.carFlashPlan(state, map, { now: now, history: Array.isArray(args.history) ? args.history : [] });
    } catch (e) {
      fail('engine-error', 'The Flash plan could not be built: ' + (e && e.message));
    }
    return planOut(plan);
  },

  /** Record a Flash the owner says they wrote to the ECU. */
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
    return { state: out.state, flash: out.flash };
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
    return { state: out, driveId: driveId, answer: answer, report: driveOut(KTA.carReport(out, driveId)) };
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
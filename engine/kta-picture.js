'use strict';
/*
 * Picture data (ticket 15): the numbers a chart is drawn from, made by the
 * engine's own reports so the chat only draws and the agent only picks a kind.
 * Node only (the worker loads it); nothing here draws and nothing is invented:
 * every value is a field of a Drive report, a log channel or a Car history summary.
 *
 *   keyMoments(report)           the Key moments of a Drive, at most five, clock-free
 *   trace(report, log, moment)   one channel (single axis) around a Key moment
 *   drivenRpm(report)            the rpm bands the Drive sat in under boost
 *   proof(sumBefore, sumAfter, key)   matched before/after bars, or why it cannot be told
 *
 * Every picture carries `numbers`: the values it prints. The reply text must say
 * each one (`server/kta_server/verify.py` checks it).
 */

function isNum(v) { return typeof v === 'number' && isFinite(v); }
function r(v, d) { var k = Math.pow(10, d); return Math.round(v * k) / k; }

/** Stop starts and hard pulls and lugging, in that order; the screen's own rule, kept in one place. */
function keyMoments(report) {
  var I = (report && report.ins) || {}, out = [];
  var rises = I.kc && I.kc.episodes ? I.kc.episodes.filter(function (e) { return e.kind === 'rise'; }) : [];
  rises.forEach(function (e) { out.push({ kind: 'watch', t: e.t0, label: 'Fuel-quality score ' + r(e.from, 2) + ' → ' + r(e.to, 2), numbers: [r(e.from, 2), r(e.to, 2)] }); });
  var hard = I.boost && I.boost.events ? I.boost.events.filter(function (e) { return e.hard; }) : [];
  hard.sort(function (a, b) { return (isNum(a.iat0) ? a.iat0 : 999) - (isNum(b.iat0) ? b.iat0 : 999); });
  hard.forEach(function (e) { out.push({ kind: 'pull', t: e.t0, label: 'Hard pull to ' + r(e.targetMax, 1) + ' psi', numbers: [r(e.targetMax, 1)] }); });
  var lug = rises.filter(function (e) { return e.cause === 'lugging'; }).sort(function (a, b) { return (b.t1 - b.t0) - (a.t1 - a.t0); })[0];
  if (lug && I.lug && isNum(I.lug.share)) out.push({ kind: 'lug', t: lug.t0, label: 'Lugging ' + r(I.lug.share, 1) + ' % of moving time', numbers: [r(I.lug.share, 1)] });
  var order = { watch: 0, pull: 1, lug: 2 };
  out.sort(function (a, b) { return order[a.kind] - order[b.kind]; });
  return out.slice(0, 5);
}

/** One channel, one axis: 60 s either side of the moment, at most 90 points. */
function trace(report, log, index) {
  var moms = keyMoments(report);
  var m = moms[Math.max(0, Math.min(moms.length - 1, Math.round(isNum(index) ? index : 0)))];
  if (!m) return { kind: 'cant-tell', why: 'This Drive has no Key moment to draw: nothing rose, pulled hard or lugged.' };
  var pull = m.kind === 'pull';
  var main = pull ? log.boost : log.kControl;
  if (!main) return { kind: 'cant-tell', why: 'The ' + (pull ? 'boost' : 'Fuel-quality score') + ' gauge was not in this log, so the moment cannot be drawn.' };
  var t0 = m.t - 60, t1 = m.t + 60, step = Math.max(1, Math.round((log.n || log.t.length) / 4000));
  var pts = [], tgt = [], i;
  for (i = 0; i < log.t.length; i += step) {
    if (log.t[i] < t0 || log.t[i] > t1 || !isNum(main[i])) continue;
    pts.push([r(log.t[i] - m.t, 0), r(main[i], 2)]);
    if (pull && log.boostTarget && isNum(log.boostTarget[i])) tgt.push([r(log.t[i] - m.t, 0), r(log.boostTarget[i], 1)]);
  }
  var every = Math.max(1, Math.ceil(pts.length / 90));
  pts = pts.filter(function (_, k) { return k % every === 0; });
  tgt = tgt.filter(function (_, k) { return k % every === 0; });
  if (pts.length < 3) return { kind: 'cant-tell', why: 'The log holds too little around that moment to draw it.' };
  var series = [{ name: pull ? 'Boost' : 'Fuel-quality score', points: pts }];
  if (tgt.length) series.push({ name: 'Boost target', points: tgt });
  return {
    kind: 'trace', title: m.label, unit: pull ? 'psi' : '', series: series,
    moment: { at: 0, label: m.label }, numbers: m.numbers, momentIndex: moms.indexOf(m), moments: moms.length
  };
}

/** rpm bands (from, to) where the Drive spent 2 s or more with boost up, from the engine's own load grid. */
function drivenRpm(report) {
  var g = report && report.ins && report.ins.grid;
  if (!g || !g.cells) return [];
  return g.cells.filter(function (c) { return g.load[c.c] >= 0 && c.seconds >= 2; })
    .map(function (c) { return { from: g.rpm[c.r], to: g.rpm[c.r + 1], seconds: c.seconds }; });
}

var MEASURES = {
  undo: { name: 'Worst fuel trim', unit: '%', field: 'trimWorst', d: 1 },
  install: { name: 'Worst fuel trim', unit: '%', field: 'trimWorst', d: 1 },
  downpipe: { name: 'Boost overshoot', unit: 'psi', field: 'overshoot', d: 1, needs: 'hardPulls', iat: 5 },
  habit: { name: 'Time lugging', unit: '%', field: 'lugShare', d: 1, needs: 'hot' }
};

/** Before and after for one settled step, only when the two Drives were run under matched conditions. */
function proof(before, after, key) {
  var m = MEASURES[key];
  if (!m) return { kind: 'cant-tell', why: 'This step is not a number to compare, so there is no chart for it.' };
  if (!before || !after) return { kind: 'cant-tell', why: 'One of the two Drives is not in the Car history, so there is nothing to put side by side.' };
  var b = before[m.field], a = after[m.field];
  if (!isNum(b) || !isNum(a)) return { kind: 'cant-tell', why: 'One of the two Drives has no ' + m.name.toLowerCase() + ' reading, so the bars would be a guess.' };
  if (m.needs === 'hardPulls' && !(before.hardPulls > 0 && after.hardPulls > 0)) return { kind: 'cant-tell', why: 'Both Drives need a hard pull to compare boost, and one had none.' };
  if (m.needs === 'hot' && !(before.hot && after.hot)) return { kind: 'cant-tell', why: 'The habit shows only on a hot afternoon, and one of the two Drives was not hot.' };
  if (m.iat && isNum(before.iatMoving) && isNum(after.iatMoving) && Math.abs(before.iatMoving - after.iatMoving) > m.iat) {
    return { kind: 'cant-tell', why: 'The intake air was ' + r(before.iatMoving, 0) + ' °C on one Drive and ' + r(after.iatMoving, 0) + ' °C on the other, too far apart to compare.' };
  }
  return {
    kind: 'proof', title: m.name + ', before and after', unit: m.unit,
    bars: [{ label: 'Before', value: r(b, m.d) }, { label: 'After', value: r(a, m.d) }],
    numbers: [r(b, m.d), r(a, m.d)]
  };
}

module.exports = { keyMoments: keyMoments, trace: trace, drivenRpm: drivenRpm, proof: proof };

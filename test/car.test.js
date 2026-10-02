'use strict';
// Car history, Flashes, Shakedown, Unexplained change, History file (engine/kta-car.js).
// Seam 1: real drives in through the public Car operation; assert what the owner
// would see (verdict, map, banner, table row). Never internals.
// Run with: node --test test/car.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('zlib');
const K = require('../engine/kta-car.js');

for (const id of ['aug30-1601', 'aug30-1529', 'sep01-0813', 'aug23-1959', 'aug23-2038', 'aug30-1509', 'aug22-0950', 'aug22-0903', 'sep05-0756']) {
  require('../data/example-' + id + '.js');
}
const csv = (id) => zlib.gunzipSync(Buffer.from(globalThis.KTA_EXAMPLES[id].gz, 'base64')).toString('utf8');
const logOf = (id) => K.readLog(csv(id));
// File names the owner actually has on disk.
const NAME = {
  'aug23-1959': 'TunerView_20260823_195901.csv',
  'aug23-2038': 'TunerView_20260823_203853.csv',
  'aug30-1509': 'TunerView_20260830_150925.csv',
  'aug30-1529': 'TunerView_20260830_152931.csv',
  'aug30-1601': 'TunerView_20260830_160151.csv',
  'aug22-0950': 'TunerView_20260822_095021.csv',
  'aug22-0903': 'TunerView_20260822_090322.csv',
  'sep01-0813': 'TunerView_20260901_081358.csv',
  'sep05-0756': 'TunerView_20260905_075634.csv',
};
const NOW = 1756723200000; // fixed clock so the same log + state gives the same state
function ingest(state, id, name) {
  return K.carIngest(state, logOf(id), { fileName: name || NAME[id], now: NOW });
}

// ---------------------------------------------------------------------------
// 03 — Car module and Car history
// ---------------------------------------------------------------------------

test('drive identity comes from the TunerView file name; unknown names fall back to time + hash', () => {
  const a = ingest(K.carEmpty(), 'sep01-0813');
  assert.equal(a.report.identity, '20260901-081358');
  const b = K.carIngest(K.carEmpty(), logOf('sep01-0813'), { fileName: 'my-drive.csv', startTime: 1756723200000, now: NOW });
  assert.match(b.report.identity, /^log-1756723200000-[0-9a-f]{6}$/);
  assert.notEqual(a.report.identity, b.report.identity);
});

test('too-short drive: no verdict, kept out of the Car history', () => {
  const r = ingest(K.carEmpty(), 'aug30-1509');
  assert.equal(r.report.tooShort, true);
  assert.equal(r.report.verdict, 'nodata');
  assert.equal(r.report.summary, null);
  assert.equal(K.carTableRows(r.state).length, 0);
  assert.equal(r.state.drives['20260830-150925'], undefined);
});

test('re-checking a drive replaces it; the count never grows', () => {
  let s = K.carEmpty();
  const r1 = ingest(s, 'aug23-1959'); s = r1.state;
  const r2 = ingest(s, 'aug23-2038'); s = r2.state;
  assert.equal(r2.replaced, false);
  assert.equal(K.carTableRows(s).length, 2);
  const r3 = ingest(s, 'aug23-1959'); s = r3.state;
  assert.equal(r3.replaced, true);
  assert.equal(K.carTableRows(s).length, 2);
  assert.equal(r3.report.summary.trimWorst, r1.report.summary.trimWorst);
});

test('baseline is 0.49 until three cool drives, then their median end score', () => {
  let s = K.carEmpty();
  assert.deepEqual(K.carBaseline(s), { value: 0.49, n: 0 });
  // Two cool drives only: still the default.
  for (const id of ['sep01-0813', 'sep05-0756']) s = ingest(s, id).state;
  assert.deepEqual(K.carBaseline(s), { value: 0.49, n: 2 });
  // A third cool drive under another name: the median of the three end scores.
  s = K.carIngest(s, logOf('sep01-0813'), { fileName: 'TunerView_20260902_081358.csv', now: NOW }).state;
  assert.deepEqual(K.carBaseline(s), { value: 0.49, n: 3 });
});

test('hiding a cool drive removes it from baseline and table; unhide restores both', () => {
  let s = K.carEmpty();
  for (const [id, nm] of [['sep01-0813', undefined], ['sep05-0756', undefined], ['aug22-0950', undefined]]) {
    s = ingest(s, id, nm).state;
  }
  s = K.carIngest(s, logOf('sep01-0813'), { fileName: 'TunerView_20260902_081358.csv', now: NOW }).state;
  assert.equal(K.carBaseline(s).n, 3);
  s = K.carHide(s, '20260901-081358');
  assert.equal(K.carBaseline(s).n, 2);
  assert.ok(!K.carTableRows(s).some((r) => r.id === '20260901-081358'));
  s = K.carUnhide(s, '20260901-081358');
  assert.equal(K.carBaseline(s).n, 3);
  assert.ok(K.carTableRows(s).some((r) => r.id === '20260901-081358'));
});

test('the same log and state always give the same result', () => {
  const s = ingest(K.carEmpty(), 'aug23-1959').state;
  const a = ingest(s, 'aug23-2038');
  const b = ingest(s, 'aug23-2038');
  assert.deepEqual(a, b);
});

test('first drive says the history starts here; rows read in time order', () => {
  const r = ingest(K.carEmpty(), 'aug23-1959');
  assert.equal(r.report.firstDrive, true);
  const r2 = ingest(r.state, 'aug23-2038');
  assert.equal(r2.report.firstDrive, false);
  const rows = K.carTableRows(r2.state);
  assert.deepEqual(rows.map((x) => x.id), ['20260823-195901', '20260823-203853']);
  const row = rows[1];
  assert.equal(row.verdict, 'stop');
  assert.ok(Math.abs(row.trimWorst - -21.4) < 0.05, 'worst trim ' + row.trimWorst);
});

// ---------------------------------------------------------------------------
// 05 — Flashes, Map on the drive card, Shakedown drive
// ---------------------------------------------------------------------------

test('map on the card: not recorded until a flash predates the drive', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  const r = ingest(s, 'aug23-2038'); s = r.state;
  assert.equal(r.report.map.recorded, false);
  assert.equal(r.report.map.name, null);
  const f = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21 AFM fix', changed: 'afm', note: '' }, { now: NOW });
  s = f.state;
  // The drive card for 20:38 now names the map; 19:59 stays not-recorded.
  assert.equal(K.carReport(s, '20260823-203853').map.name, 'Starter 21 AFM fix');
  assert.equal(K.carReport(s, '20260823-195901').map.recorded, false);
});

test('flash CRUD: edit fixes a typo, delete asks nothing here but removes once', () => {
  let s = K.carEmpty();
  const f = K.carRecordFlash(s, { time: 1000, map: 'Starter 21', changed: 'boost', note: '' }, { now: NOW });
  s = f.state;
  const id = f.flash.id;
  s = K.carEditFlash(s, id, { map: 'Starter 21 rev2' });
  assert.equal(K.carMapAt(s, 2000).map, 'Starter 21 rev2');
  s = K.carDeleteFlash(s, id);
  assert.equal(K.carMapAt(s, 2000), null);
});

test('Aug 23 with a flash at 20:00: 20:38 is a shakedown drive that fails and names the flash', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  // 20:00 Vietnam time = 13:00 UTC.
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21 PRL preset', changed: 'afm', note: '' }, { now: NOW }).state;
  const r = ingest(s, 'aug23-2038');
  assert.equal(r.report.isShakedown, true);
  assert.equal(r.report.shakedown.status, 'pending');
  assert.equal(r.report.shakedown.passed, false);
  assert.equal(r.report.verdict, 'stop');
  assert.equal(r.report.flashCause.map, 'Starter 21 PRL preset');
  assert.match(r.report.flashCause.advice, /previous map|preset/i);
});

test('shakedown carries over: a short healthy drive stays pending, the next calm drive passes', () => {
  let s = K.carEmpty();
  s = K.carRecordFlash(s, { time: 1000, map: 'Starter 21', changed: 'fuel', note: '' }, { now: NOW }).state;
  // 09:03 has 9 hard pulls but only ~7 calm minutes: hard-driving watch, still pending.
  const a = ingest(s, 'aug22-0903'); s = a.state;
  assert.equal(a.report.isShakedown, true);
  assert.equal(a.report.shakedown.passed, false);
  assert.equal(a.report.hardDrivingWatch, true);
  assert.ok(a.report.shakedown.calmSec > 0 && a.report.shakedown.calmSec < 600, 'calm banked: ' + a.report.shakedown.calmSec);
  assert.equal(s.shakedown.status, 'pending');
  // A later calm morning drive banks the rest and passes.
  const b = K.carIngest(s, logOf('sep01-0813'), { fileName: 'TunerView_20260902_081358.csv', now: NOW });
  assert.equal(b.report.isShakedown, true);
  assert.equal(b.report.shakedown.passed, true);
  assert.ok(b.report.shakedown.calmSec >= 600 + 400, 'carried minutes count: ' + b.report.shakedown.calmSec);
  assert.equal(b.state.shakedown.status, 'passed');
  // The drive after a pass is an ordinary drive again.
  const c = K.carIngest(b.state, logOf('sep05-0756'), { fileName: 'TunerView_20260905_075634.csv', now: NOW });
  assert.equal(c.report.isShakedown, false);
});

test('a healthy drive with ten calm minutes passes its shakedown at once', () => {
  let s = K.carEmpty();
  s = K.carRecordFlash(s, { time: 1000, map: 'Starter 21', changed: 'fuel', note: '' }, { now: NOW }).state;
  const r = ingest(s, 'sep01-0813');
  assert.equal(r.report.isShakedown, true);
  assert.equal(r.report.shakedown.passed, true);
  assert.ok(r.report.shakedown.calmSec >= 600, 'at least 10 calm minutes: ' + r.report.shakedown.calmSec);
});

test('hard driving before the shakedown passes is a watch, never a stop on its own', () => {
  let s = K.carEmpty();
  s = K.carRecordFlash(s, { time: 1000, map: 'Starter 21', changed: 'fuel', note: '' }, { now: NOW }).state;
  const r = ingest(s, 'aug22-0903');
  assert.equal(r.report.isShakedown, true);
  assert.equal(r.report.hardDrivingWatch, true);
  assert.notEqual(r.report.verdict, 'stop');
});

test('a shakedown that passes on the same drive raises no hard-driving watch', () => {
  let s = K.carEmpty();
  s = K.carRecordFlash(s, { time: 1000, map: 'Starter 21', changed: 'fuel', note: '' }, { now: NOW }).state;
  const r = ingest(s, 'aug30-1529');
  assert.equal(r.report.shakedown.passed, true);
  assert.equal(r.report.hardDrivingWatch, false);
});

test('proof across a flash cannot credit the habit: map changed in between', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21', changed: 'afm', note: '' }, { now: NOW }).state;
  s = ingest(s, 'aug23-2038').state;
  const p = K.carProofSpansFlash(s, '20260823-195901', '20260823-203853');
  assert.equal(p.spans, true);
  assert.match(p.message, /map changed/i);
  const q = K.carProofSpansFlash(s, '20260823-195901', '20260823-195901');
  assert.equal(q.spans, false);
});

// ---------------------------------------------------------------------------
// 06 — Unexplained change
// ---------------------------------------------------------------------------

test('Aug 23 with no flash recorded: the trim jump asks', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  const r = ingest(s, 'aug23-2038');
  assert.ok(r.report.unexplained, 'asks');
  assert.ok(r.report.unexplained.reasons.includes('trim'), JSON.stringify(r.report.unexplained));
});

test('Aug 23 with a flash recorded: no unexplained question, shakedown instead', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21', changed: 'afm', note: '' }, { now: NOW }).state;
  const r = ingest(s, 'aug23-2038');
  assert.equal(r.report.unexplained, null);
  assert.equal(r.report.isShakedown, true);
});

test('Aug 30 15:29 after a 0.49 drive: the starting score asks', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  const r = ingest(s, 'aug30-1529');
  assert.ok(r.report.unexplained, 'asks');
  assert.ok(r.report.unexplained.reasons.includes('score'), JSON.stringify(r.report.unexplained));
});

test('22 Aug to 30 Aug: the boost-target step asks', () => {
  let s = K.carEmpty();
  for (const id of ['aug22-0950', 'aug23-1959', 'aug23-2038']) s = ingest(s, id).state;
  const r = ingest(s, 'aug30-1529');
  assert.ok(r.report.unexplained, 'asks');
  assert.ok(r.report.unexplained.reasons.includes('boost'), JSON.stringify(r.report.unexplained) + ' median source check');
});

test('answers stick: neither keeps a watch line, and it survives reload', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = ingest(s, 'aug23-2038').state;
  s = K.carAnswer(s, '20260823-203853', 'neither');
  const r = K.carReport(s, '20260823-203853');
  assert.equal(r.unexplainedWatch, true);
  assert.equal(r.unexplained.state, 'answered-neither');
  // A JSON round trip (reload) keeps it.
  const s2 = JSON.parse(JSON.stringify(s));
  assert.equal(K.carReport(s2, '20260823-203853').unexplainedWatch, true);
});

test('i-flashed opens the path: a predated flash turns the drive into a shakedown', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  let r = ingest(s, 'aug23-2038'); s = r.state;
  assert.ok(r.report.unexplained);
  s = K.carAnswer(s, '20260823-203853', 'flashed');
  const start = r.report.summary.start;
  s = K.carRecordFlash(s, { time: start - 60000, map: 'Starter 21 PRL preset', changed: 'afm', note: '' }, { now: NOW }).state;
  r = ingest(s, 'aug23-2038'); s = r.state;
  assert.equal(r.report.isShakedown, true);
  assert.equal(r.report.unexplained.state, 'answered-flashed');
});

// ---------------------------------------------------------------------------
// 08 — History file
// ---------------------------------------------------------------------------

test('export then import into empty: history, flashes and baseline identical', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = ingest(s, 'aug23-2038').state;
  s = K.carRecordFlash(s, { time: 1000, map: 'Starter 21', changed: 'afm', note: 'preset' }, { now: NOW }).state;
  s = K.carHide(s, '20260823-195901');
  s = K.carAnswer(s, '20260823-203853', 'fuel');
  const doc = K.carExport(s);
  assert.equal(doc.version, 1);
  const back = K.carImport(K.carEmpty(), doc);
  assert.equal(back.error, undefined);
  assert.deepEqual(K.carTableRows(back.state).map((x) => x.id), K.carTableRows(s).map((x) => x.id));
  assert.deepEqual(back.state.flashes, s.flashes);
  assert.deepEqual(back.state.hidden, s.hidden);
  assert.deepEqual(back.state.answers, s.answers);
  assert.deepEqual(K.carBaseline(back.state), K.carBaseline(s));
});

test('importing an older file into a newer state loses nothing; flash edits win', () => {
  let old = K.carEmpty();
  old = ingest(old, 'aug23-1959').state;
  const f = K.carRecordFlash(old, { time: 1000, map: 'Starter 21', changed: 'afm', note: '' }, { now: NOW });
  old = f.state;
  let cur = K.carEmpty();
  cur = ingest(cur, 'aug23-1959').state;
  cur = ingest(cur, 'aug23-2038').state;
  cur = K.carRecordFlash(cur, { time: 1000, map: 'Starter 21', changed: 'afm', note: '' }, { now: NOW }).state;
  cur = K.carEditFlash(cur, f.flash.id, { note: 'preset fixed' }, { now: NOW + 1000 });
  const merged = K.carImport(cur, K.carExport(old));
  assert.equal(merged.error, undefined);
  assert.equal(K.carTableRows(merged.state).length, 2);
  assert.equal(merged.state.flashes.length, 1);
  assert.equal(merged.state.flashes[0].note, 'preset fixed');
});

test('a future version is refused with no half-import', () => {
  const s = ingest(K.carEmpty(), 'aug23-1959').state;
  const r = K.carImport(s, { version: 9999, drives: {}, flashes: [] });
  assert.match(r.error, /newer|future|version/i);
  assert.equal(K.carTableRows(r.state).length, 1);
});

// ---------------------------------------------------------------------------
// Gap locks for 03/05/06/08 (verified against the engine, fixed where missing)
// ---------------------------------------------------------------------------

test('a hidden drive leaves the charts too; unhide restores it', () => {
  let s = K.carEmpty();
  for (const id of ['aug23-1959', 'aug23-2038', 'sep01-0813']) s = ingest(s, id).state;
  const full = K.carChartSeries(s);
  assert.equal(full.series[0].points.length, 3);
  s = K.carHide(s, '20260823-203853');
  const hid = K.carChartSeries(s);
  assert.equal(hid.series[0].points.length, 2);
  assert.ok(hid.series.every((g) => g.points.every((p) => p.x !== '20260823-203853')));
  s = K.carUnhide(s, '20260823-203853');
  assert.equal(K.carChartSeries(s).series[0].points.length, 3);
});

test('shakedown carry-over survives a reload: banked minutes are not double-counted', () => {
  let s = K.carEmpty();
  s = K.carRecordFlash(s, { time: 1000, map: 'Starter 21', changed: 'fuel', note: '' }, { now: NOW }).state;
  const a = ingest(s, 'aug22-0903'); s = a.state;
  assert.ok(a.report.shakedown.calmSec > 0 && a.report.shakedown.calmSec < 600);
  // A browser reload: JSON round trip, then the same drive re-checked.
  const reloaded = JSON.parse(JSON.stringify(K.carExport(s)));
  const back = K.carImport(K.carEmpty(), reloaded).state;
  const again = K.carIngest(back, logOf('aug22-0903'), { fileName: NAME['aug22-0903'], now: NOW });
  assert.equal(again.report.shakedown.calmSec, a.report.shakedown.calmSec);
  assert.equal(again.state.shakedown.status, 'pending');
});

test('a stop on a shakedown names the previous map file, not just the bad flash', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 12, 30, 0), map: 'Starter 21 known-good', changed: 'other', note: '' }, { now: NOW }).state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21 PRL preset', changed: 'afm', note: '' }, { now: NOW }).state;
  const r = ingest(s, 'aug23-2038');
  assert.equal(r.report.verdict, 'stop');
  assert.equal(r.report.flashCause.map, 'Starter 21 PRL preset');
  assert.equal(r.report.flashCause.previousMap.map, 'Starter 21 known-good');
  assert.match(r.report.flashCause.advice, /previous map|preset/i);
  // Reopening the drive later still names the flash and the previous file.
  const later = K.carReport(r.state, '20260823-203853');
  assert.equal(later.flashCause.map, 'Starter 21 PRL preset');
  assert.equal(later.flashCause.previousMap.map, 'Starter 21 known-good');
});

test('import merges newer drive summaries and unions hidden drives and answers', () => {
  let a = K.carEmpty();
  a = ingest(a, 'aug23-1959').state;
  a = ingest(a, 'aug23-2038').state;
  a = K.carAnswer(a, '20260823-203853', 'fuel');
  a = K.carHide(a, '20260823-195901');
  // Same 19:59 drive re-checked later (newer summary wins); another hidden drive + answer elsewhere.
  let b = K.carEmpty();
  b = K.carIngest(b, logOf('aug23-1959'), { fileName: NAME['aug23-1959'], now: NOW + 9000 }).state;
  b = K.carHide(b, '20260823-195901');
  const merged = K.carImport(a, K.carExport(b));
  assert.equal(merged.error, undefined);
  assert.equal(merged.state.drives['20260823-195901'].updatedAt, NOW + 9000);
  // Older file into newer state: the newer summary is kept, nothing lost.
  const back = K.carImport(b, K.carExport(a));
  assert.equal(back.state.drives['20260823-195901'].updatedAt, NOW + 9000);
  assert.equal(back.state.answers['20260823-203853'], 'fuel');
  assert.deepEqual(back.state.hidden, ['20260823-195901']);
  assert.equal(K.carTableRows(back.state).length, 1);
});

test('unexplained change uses the median since the last flash once three drives exist', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug22-0903').state;
  s = ingest(s, 'aug23-1959').state;
  // A flash between the early drives and September: the reference is the drives since it.
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 25, 0, 0, 0), map: 'Starter 21', changed: 'other', note: '' }, { now: NOW }).state;
  s = ingest(s, 'sep01-0813').state; // first drive after the flash: shakedown, passes, never asks
  assert.equal(s.shakedown.status, 'passed');
  s = K.carIngest(s, logOf('sep05-0756'), { fileName: 'TunerView_20260905_075634.csv', now: NOW }).state;
  s = K.carIngest(s, logOf('sep01-0813'), { fileName: 'TunerView_20260902_081358.csv', now: NOW }).state;
  // Aug 22 09:50 re-checked as a September drive: trim -3.9 jumps vs the
  // since-flash median (+1.6) but not vs the last-5 median (-1.6).
  const r = K.carIngest(s, logOf('aug22-0950'), { fileName: 'TunerView_20260906_095021.csv', now: NOW });
  assert.ok(r.report.unexplained, 'asks against the since-flash median');
  assert.ok(r.report.unexplained.reasons.includes('trim'), JSON.stringify(r.report.unexplained));
});

test('an answered drive is never asked again, even when re-checked', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = ingest(s, 'aug23-2038').state;
  for (const answer of ['fuel', 'flashed', 'neither']) {
    const t = K.carAnswer(s, '20260823-203853', answer);
    const r = K.carIngest(t, logOf('aug23-2038'), { fileName: NAME['aug23-2038'], now: NOW });
    assert.equal(r.report.unexplained.state, 'answered-' + answer);
    assert.notEqual(r.report.unexplained.state, 'open');
  }
});

test('the drive card carries the highest boost target measured, even unmapped', () => {
  const r = ingest(K.carEmpty(), 'aug30-1529');
  assert.equal(r.report.map.recorded, false);
  assert.ok(Math.abs(r.report.summary.boostTarget - 19.2) < 0.15, 'highest target ' + r.report.summary.boostTarget);
  assert.equal(K.carTableRows(r.state)[0].boostTarget, r.report.summary.boostTarget);
});

// ---------------------------------------------------------------------------
// 10 — Flash plan (engine: KTA.carFlashPlan, pure data for the Next Flash card)
// ---------------------------------------------------------------------------
const fs = require('fs');
const MAP = require('../data/ktuner-maps-digitized.json');
const DESK = '/Users/bean/Library/Mobile Documents/com~apple~CloudDocs/Desktop';
function ownerState() {
  // The owner's folder when present (16 drives), else the bundled drives in time order.
  let s = K.carEmpty();
  try {
    const files = fs.readdirSync(DESK).filter((f) => /^TunerView_\d{8}_\d{6}\.csv$/.test(f)).sort();
    if (files.length >= 10) {
      const path = require('path');
      for (const f of files) s = K.carIngest(s, K.readLog(fs.readFileSync(path.join(DESK, f), 'utf8')), { fileName: f, now: NOW }).state;
      return { state: s, n: files.length };
    }
  } catch (e) { /* fall through to fixtures */ }
  for (const id of ['aug22-0903', 'aug22-0950', 'aug23-1959', 'aug23-2038', 'aug30-1529', 'aug30-1601', 'sep01-0813', 'sep05-0756']) {
    s = ingest(s, id).state;
  }
  return { state: s, n: 8 };
}
// A car state by hand: a real car state through the public operation.
function synth(drives, extra) {
  const s = K.carEmpty();
  drives.forEach((d, i) => {
    s.drives[d.id] = Object.assign({
      id: d.id, start: (i + 1) * 100000, fileName: '', duration: 1800, moving: 1500,
      cool: true, hot: false, hotRestart: false, tooShort: false, verdict: 'good',
      kcStart: 0.49, kcEnd: 0.49, kcPeak: 0.49, trimWorst: -1, iatMoving: 36,
      cvtPeak: 80, lugShare: 1, accel5070: null, boostTarget: 16,
      overshoot: 1, wgAtPeak: 2.5, mixLeanest: 10.5, mixTarget: 11,
      missing: [], flat: [], calmSec: 700, hardPulls: 2,
      shakedown: 'none', updatedAt: NOW,
    }, d);
  });
  return Object.assign(s, extra || {});
}
function trimState(trims, verdict) {
  return synth(trims.map((t, i) => ({ id: 'd' + (i + 1), trimWorst: t, verdict: verdict || 'watch' })));
}

test('flash plan on the owner drives: P9 no map change, all six levers with locks', () => {
  const { state: s, n } = ownerState();
  assert.ok(n >= 8, 'owner drives present: ' + n);
  const p = K.carFlashPlan(s, MAP, { now: NOW });
  assert.equal(p.kind, 'no-change');
  assert.match(p.headline, /no map change/i);
  assert.deepEqual(p.levers.map((l) => l.id), ['afm', 'mixture', 'boostPlus', 'boostLow', 'downpipe', 'hot']);
  const byId = Object.fromEntries(p.levers.map((l) => [l.id, l]));
  assert.match(byId.afm.reason, /±\d ?%/);
  assert.match(byId.mixture.reason, /provisional/i);
  assert.match(byId.boostPlus.reason, /headroom|wastegate/i);
  assert.match(byId.boostLow.reason, /revs|habit/i);
  assert.match(byId.downpipe.reason, /overshoot/i);
  assert.match(byId.hot.reason, /ECO.*18/i);
  assert.ok(p.levers.every((l) => l.reason && l.unlocks), 'every lever carries reason + unlock');
  assert.equal(p.tables.length, 0);
  assert.equal(p.cells.length, 0);
});

test('flash plan with the 20:38 stop open after a flash: Undo, never a curve edit', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 12, 30, 0), map: 'Starter 21 known-good', changed: 'other', note: '' }, { now: NOW }).state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21 PRL preset', changed: 'afm', note: '' }, { now: NOW }).state;
  s = ingest(s, 'aug23-2038').state;
  const p = K.carFlashPlan(s, MAP, { now: NOW });
  assert.equal(p.kind, 'undo');
  assert.match(p.headline, /previous map file/i);
  assert.match(p.undoName, /Starter 21 known-good/);
  assert.equal(p.tables.length, 0);
  assert.equal(p.cells.length, 0);
  assert.ok(!p.levers.some((l) => l.status === 'planned'), 'no curve edit offered');
  assert.match(p.prefill.map, /known-good/);
});

test('two boost candidates: the safety fix is planned, the other waits to be proven', () => {
  const s = trimState([]);
  const drives = [];
  for (let i = 0; i < 5; i++) {
    // Overshoot opens an overshoot question, the high starting score a score
    // question: both fixes are P2-eligible, so P4 picks one family member.
    drives.push({ id: 'd' + (i + 1), verdict: 'watch', trimWorst: -1, kcStart: 0.60, kcEnd: 0.49, overshoot: 3.0, lugShare: 8, boostTarget: 16 });
  }
  const t = synth(drives);
  const p = K.carFlashPlan(t, MAP, { now: NOW, history: [{ id: 'revs', verdict: 'keep' }] });
  assert.equal(p.kind, 'one-family');
  assert.equal(p.family, 'boost');
  assert.equal(p.changeId, 'downpipe');
  assert.equal(p.deferred.length, 1);
  assert.equal(p.deferred[0].id, 'boostLow');
  assert.match(p.deferred[0].note, /proven/i);
});

test('a boost plan carries all six Normal tables with identical cells, never shared', () => {
  const drives = [];
  for (let i = 0; i < 5; i++) drives.push({ id: 'd' + (i + 1), verdict: 'watch', overshoot: 3.0, kcEnd: 0.49 });
  const p = K.carFlashPlan(synth(drives), MAP, { now: NOW });
  assert.equal(p.kind, 'one-family');
  const ids = p.tables.map((t) => t.id).sort();
  assert.deepEqual(ids, ['Boost_Target_1_Normal_H', 'Boost_Target_1_Normal_L', 'Boost_Target_2_Normal_H', 'Boost_Target_2_Normal_L', 'Boost_Target_3_Normal_H', 'Boost_Target_3_Normal_L']);
  const sigs = p.tables.map((t) => JSON.stringify(t.cells.map((c) => [c.rpmRow, c.col, c.before, c.after])));
  assert.ok(sigs.every((x) => x === sigs[0]), 'pairs move together: 1=2=3, L=H');
  const keys = p.cells.map((c) => c.table + '@' + c.rpm + 'x' + c.col);
  assert.equal(new Set(keys).size, keys.length, 'no cell changed by two proposals');
  assert.ok(p.cells.length > 0 && p.cells.every((c) => c.before != null && c.after != null));
  assert.ok(p.cells.every((c) => c.col >= 1 && c.col <= c.of), 'columns counted N of M from the left');
});

test('locked levers name their pairs: WOT L+H, boost 1/2/3 x L/H', () => {
  const { state: s } = ownerState();
  const p = K.carFlashPlan(s, MAP, { now: NOW });
  const byId = Object.fromEntries(p.levers.map((l) => [l.id, l]));
  assert.deepEqual(byId.mixture.wouldTouch.sort(), ['WOT_Enrich_H', 'WOT_Enrich_L']);
  assert.deepEqual(byId.boostPlus.wouldTouch.sort(), ['Boost_Target_1_Normal_H', 'Boost_Target_1_Normal_L', 'Boost_Target_2_Normal_H', 'Boost_Target_2_Normal_L', 'Boost_Target_3_Normal_H', 'Boost_Target_3_Normal_L']);
  assert.match(byId.mixture.unlocks + ' ' + byId.boostPlus.unlocks, /./);
});

test('bounds hold: AFM within 10% and rising; no raise below 3000; ceiling; protected tables never appear', () => {
  const p = K.carFlashPlan(trimState([-7.1, -6.8, -7.3, -6.5, -7.0]), MAP, { now: NOW });
  assert.equal(p.kind, 'one-family');
  assert.equal(p.family, 'AFM Flow');
  assert.deepEqual(p.tables.map((t) => t.id), ['MAF_Scaling_Custom']);
  assert.ok(p.afmPasteRow && p.afmPasteRow.split('\t').length === 103, 'paste-ready row');
  const pct = p.afmPct;
  assert.ok(pct.every((x) => Math.abs(x) <= 10 + 1e-9), 'AFM within 10% per round');
  const after = p.afmAfter;
  assert.ok(after.every((v, k) => k === 0 || v > after[k - 1]), 'curve keeps rising');
  // Boost bounds on the overshoot plan: only lowers, under the ceiling.
  const drives = [];
  for (let i = 0; i < 5; i++) drives.push({ id: 'e' + (i + 1), verdict: 'watch', overshoot: 3.0, kcEnd: 0.49 });
  const q = K.carFlashPlan(synth(drives), MAP, { now: NOW });
  assert.ok(q.cells.every((c) => !(c.rpm < 3000 && c.after > c.before + 1e-9), 'no boost raised below 3000 rpm'));
  assert.ok(q.cells.every((c) => c.after <= q.ceiling + 1e-9, 'boost at or under the ceiling ' + q.ceiling));
  // No plan ever names ignition, knock or protection tables.
  const touched = {};
  p.tables.concat(q.tables).forEach((t) => { touched[t.id] = true; });
  Object.keys(touched).forEach((id) => {
    assert.equal(K.TABLES[id].role, 'edit', id + ' must be an editable table');
  });
  assert.ok(!touched.Ignition_Base_H && !touched['Knock_Sens_1+4_H'] && !touched.Boost_By_Gear_Limits && !touched.Final_Boost_Target_H);
});

test('a same-family change after a flash waits for its prove-it', () => {
  const drives = [];
  for (let i = 0; i < 5; i++) drives.push({ id: 'd' + (i + 1), start: (i + 1) * 100000, verdict: 'watch', overshoot: 3.0, kcEnd: 0.49 });
  let s = synth(drives);
  s = K.carRecordFlash(s, { time: 600000, map: 'Starter 21 r2', changed: 'boost', note: '' }, { now: NOW }).state;
  const held = K.carFlashPlan(s, MAP, { now: NOW });
  assert.equal(held.kind, 'no-change');
  const lever = held.levers.find((l) => l.id === 'downpipe');
  assert.match(lever.status, /held/);
  assert.match(lever.unlocks, /prov/i);
  // A later OK drive proves the flash: the same evidence now plans the change.
  // (d6's calm minutes also pass the Shakedown drive, as a real ingest would.)
  s.drives.d6 = Object.assign({}, s.drives.d1, { id: 'd6', start: 700000, verdict: 'good', trimWorst: -1, overshoot: 1 });
  s = K.carAnswer(Object.assign(s, {}), 'd6', 'fuel');
  s.shakedown = { status: 'passed', flashId: s.flashes[s.flashes.length - 1].id, calmSec: 700, driveIds: ['d6'], shares: {} };
  const free = K.carFlashPlan(s, MAP, { now: NOW });
  assert.equal(free.kind, 'one-family');
  assert.equal(free.changeId, 'downpipe');
});

test('record-prefill from the plan names the new file and starts the shakedown', () => {
  const p = K.carFlashPlan(trimState([-7.1, -6.8, -7.3, -6.5, -7.0]), MAP, { now: NOW });
  assert.equal(p.kind, 'one-family');
  assert.match(p.saveAs, /AFM Flow/);
  assert.match(p.undoName, /previous|not recorded/i);
  assert.equal(p.prefill.changed, 'afm');
  const r = K.carRecordFlash(K.carEmpty(), p.prefill, { now: NOW });
  assert.equal(r.state.shakedown.status, 'pending');
  const d = K.carIngest(r.state, logOf('sep01-0813'), { fileName: NAME['sep01-0813'], now: NOW });
  assert.equal(d.report.isShakedown, true);
});

test('P2: a trim fix appears for a trim watch, never on top of a heat watch', () => {
  const fix = K.carFlashPlan(trimState([-7.1, -6.8, -7.3, -6.5, -7.0]), MAP, { now: NOW });
  assert.equal(fix.kind, 'one-family');
  assert.equal(fix.changeId, 'afmCurve');
  // Same trim evidence, but the open watch is heat: no gain, no mismatched fix.
  const hot = synth([
    { id: 'd1', verdict: 'watch', trimWorst: -7.1 }, { id: 'd2', verdict: 'watch', trimWorst: -6.8 },
    { id: 'd3', verdict: 'watch', trimWorst: -7.3 }, { id: 'd4', verdict: 'watch', trimWorst: -6.5 },
    { id: 'd5', verdict: 'watch', trimWorst: -2, iatMoving: 64, hot: true },
  ]);
  const held = K.carFlashPlan(hot, MAP, { now: NOW });
  assert.equal(held.kind, 'no-change');
  const lever = held.levers.find((l) => l.id === 'afm');
  assert.match(lever.status, /deferred/);
});

test('P3: lower boost at low rpm waits for the keep-the-revs-up habit', () => {
  const drives = [];
  for (let i = 0; i < 5; i++) drives.push({ id: 'd' + (i + 1), verdict: 'good', lugShare: 8, overshoot: 1 });
  const locked = K.carFlashPlan(synth(drives), MAP, { now: NOW });
  const lever = locked.levers.find((l) => l.id === 'boostLow');
  assert.match(lever.status, /locked/);
  assert.match(lever.unlocks, /revs/i);
  const proven = K.carFlashPlan(synth(drives), MAP, { now: NOW, history: [{ id: 'revs', verdict: 'keep' }] });
  assert.equal(proven.kind, 'one-family');
  assert.equal(proven.changeId, 'boostLow');
});

test('the flash plan is deterministic for the same state and clock', () => {
  const { state: s } = ownerState();
  assert.deepEqual(K.carFlashPlan(s, MAP, { now: NOW }), K.carFlashPlan(s, MAP, { now: NOW }));
});

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
// Parse each real drive once per file; tests share the parsed log (engine reads it, never mutates).
const LOGS = {};
const logOf = (id) => (LOGS[id] = LOGS[id] || K.readLog(csv(id)));
// The digitized KTuner basemap: Map version 1's tables, and what every Flash
// plan is read against.
// carIngest re-analyses the whole drive (~130 ms); the suite repeats the same
// (state, drive, meta) hundreds of times. Memoize it and hand each caller a fresh clone.
const logIds = new WeakMap();
const INGESTS = new Map();
const rawIngest = K.carIngest;
K.carIngest = function (state, log, meta, opts) {
  if (!logIds.has(log)) logIds.set(log, logIds.size + 1);
  const key = JSON.stringify([state, logIds.get(log), meta, opts]);
  if (!INGESTS.has(key)) INGESTS.set(key, rawIngest(state, log, meta, opts));
  return structuredClone(INGESTS.get(key));
};
const MAP = require('../data/ktuner-maps-digitized.json');
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
// Map version 1: the KTuner basemap, active from the first Drive
// ---------------------------------------------------------------------------

test('a fresh car is on Map version 1, the KTuner basemap, before any Drive', () => {
  const s = K.carEmpty();
  assert.deepEqual(K.carMapVersions(s).map((v) => v.n), [1]);
  const active = K.carActiveMapVersion(s);
  assert.equal(active.n, 1);
  assert.equal(active.name, 'Starter 21 Dual Tune 2');
  assert.equal(active.label, 'Map version 1');
  assert.equal(active.kind, 'ktuner-basemap');
  // The tables are the app's own KTuner map data, named not inlined: the Car
  // history document must not grow by half a megabyte on every Drive.
  assert.equal(active.tablesFrom, 'ktuner-basemap');
  assert.equal(JSON.stringify(s).includes('values'), false, 'no table arrays in the state');
  // Nothing was flashed yet, so no Shakedown drive is waiting.
  assert.equal(s.shakedown.status, 'none');
});

test('Map version 1 starts no Shakedown drive: the first Drive is an ordinary Drive', () => {
  let s = K.carEmpty();
  const first = ingest(s, 'aug23-1959');
  s = first.state;
  assert.equal(first.report.isShakedown, false);
  assert.equal(first.report.shakedown.role, 'none');
  assert.equal(s.shakedown.status, 'none');
  assert.equal(first.report.map.version, 1);
  assert.equal(K.carTableRows(s)[0].mapVersion, 1);
  // The prototype's side effect: recording the starting map as a Flash made the
  // first Drive a Shakedown drive. Recording it as Map version 1 does not, even
  // when the owner gives it the date they flashed the car that day.
  const dated = K.carRecordBasemap(s, { from: Date.UTC(2026, 7, 23, 13, 0, 0) }, { now: NOW }).state;
  assert.equal(dated.shakedown.status, 'none');
  const after = ingest(dated, 'aug23-2038');
  assert.equal(after.report.isShakedown, false);
  assert.equal(after.report.map.version, 1);
  assert.equal(after.report.flashCause, null);
});

test('recording the KTuner basemap again never makes two Map version 1s', () => {
  // A fresh car already has Map version 1, so recording it creates nothing.
  const again = K.carRecordBasemap(K.carEmpty(), {}, { now: NOW });
  assert.equal(again.created, false);
  assert.deepEqual(K.carMapVersions(again.state).map((v) => v.n), [1]);
  // The owner can still say when they gave the app the map: it stays Map
  // version 1, with that date, and still starts no Shakedown drive.
  const dated = K.carRecordBasemap(K.carEmpty(), { from: Date.UTC(2026, 7, 22, 2, 0, 0) }, { now: NOW });
  assert.equal(dated.version.n, 1);
  assert.equal(dated.version.name, 'Starter 21 Dual Tune 2');
  assert.equal(dated.state.shakedown.status, 'none');
  assert.deepEqual(K.carMapVersions(dated.state).map((v) => v.n), [1]);
});

test('the Map a Drive ran on is the version active at its start, never the log', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  // 20:00 Vietnam time = 13:00 UTC, between the two Drives.
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21 PRL preset', changed: 'afm', note: '' }, { now: NOW }).state;
  // The Flash is Map version 2, and only Drives that start after it ran on it.
  assert.deepEqual(K.carMapVersions(s).map((v) => v.n), [1, 2]);
  assert.equal(K.carActiveMapVersion(s).n, 2);
  assert.equal(K.carMapAt(s, Date.UTC(2026, 7, 23, 12, 59, 1)).n, 1);
  assert.equal(K.carMapAt(s, Date.UTC(2026, 7, 23, 13, 38, 53)).n, 2);
  const r = ingest(s, 'aug23-2038');
  assert.equal(r.report.map.version, 2);
  assert.equal(r.report.map.name, 'Starter 21 PRL preset');
  // Re-checking the earlier Drive after the Flash does not move it: its Map is
  // the one active when it started, not the one active now.
  const rechecked = K.carIngest(r.state, logOf('aug23-1959'), { fileName: NAME['aug23-1959'], now: NOW });
  assert.equal(rechecked.report.map.version, 1);
  assert.equal(K.carReport(r.state, '20260823-195901').map.version, 1);
});

test('a Flash the owner confirms is the next Map version; Undo names the one before', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 12, 30, 0), map: 'Starter 21 known-good', changed: 'other', note: '' }, { now: NOW }).state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21 PRL preset', changed: 'afm', note: '' }, { now: NOW }).state;
  assert.deepEqual(K.carMapVersions(s).map((v) => v.n + ':' + v.name), [
    '1:Starter 21 Dual Tune 2', '2:Starter 21 known-good', '3:Starter 21 PRL preset'
  ]);
  assert.equal(K.carMapVersionBefore(s, 3).name, 'Starter 21 known-good');
  assert.equal(K.carMapVersionBefore(s, 1), null);
  // A Stop on the version-3 Shakedown drive names the version before it.
  const r = ingest(s, 'aug23-2038');
  assert.equal(r.report.map.version, 3);
  assert.equal(r.report.flashCause.version, 3);
  assert.equal(r.report.flashCause.previousMap.version, 2);
  assert.equal(r.report.flashCause.previousMap.map, 'Starter 21 known-good');
  const p = K.carFlashPlan(r.state, MAP, { now: NOW });
  assert.equal(p.undo.version, 2);
  assert.match(p.undo.label, /Map version 2 · Starter 21 known-good, flashed 20260823-1930/);
});

test('the Flash plan Undo names a Map version, and never invents one', () => {
  // Map version 1 is the only version the app holds, so there is no earlier one:
  // the plan says so and the owner is asked, rather than a name being made up.
  const r = ingest(K.carEmpty(), 'aug23-2038');
  assert.equal(r.report.map.version, 1);
  const p = K.carFlashPlan(r.state, MAP, { now: NOW });
  assert.equal(p.kind, 'undo');
  assert.equal(p.undo.known, false);
  assert.equal(p.undo.version, null);
  assert.equal(p.undo.name, null);
  assert.equal(p.undo.label, null);
  assert.match(p.undo.headline, /tell me which one/);
  assert.match(p.headline, /tell me which one it is/);
  // Once there is a version to go back to, Undo names it, with the KTuner name.
  const flashed = K.carRecordFlash(r.state, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21 PRL preset', changed: 'afm', note: '' }, { now: NOW }).state;
  const later = ingest(flashed, 'aug23-2038');
  const undo = K.carFlashPlan(later.state, MAP, { now: NOW }).undo;
  assert.equal(undo.known, true);
  assert.equal(undo.version, 1);
  assert.equal(undo.name, 'Starter 21 Dual Tune 2');
  assert.equal(undo.headline, 'Flash your previous map file (Map version 1 · Starter 21 Dual Tune 2)');
});

test('the History file carries Map versions and merges them by number', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = K.carRecordFlash(s, { time: 1000, map: 'Starter 21 r2', changed: 'afm', note: '' }, { now: NOW }).state;
  const doc = K.carExport(s);
  assert.deepEqual(doc.mapVersions.map((v) => v.n), [1, 2]);
  assert.equal(doc.mapVersions[1].name, 'Starter 21 r2');
  const back = K.carImport(K.carEmpty(), doc).state;
  assert.deepEqual(back.mapVersions.map((v) => v.n + ':' + v.name), ['1:Starter 21 Dual Tune 2', '2:Starter 21 r2']);
  // A History file from before Map versions existed still imports: the car had
  // Map version 1 all along, and its Flashes become the versions after it.
  const old = K.carImport(K.carEmpty(), { version: 1, drives: doc.drives, flashes: doc.flashes, hidden: [], answers: {} });
  assert.equal(old.error, undefined);
  assert.deepEqual(old.state.mapVersions.map((v) => v.n), [1, 2]);
});

// ---------------------------------------------------------------------------
// 05 — Flashes, Map on the drive card, Shakedown drive
// ---------------------------------------------------------------------------

test('the map on the card is the Map version active when the drive started', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  // No Flash recorded: the app still knows, because Map version 1 is the KTuner
  // basemap the owner gave it and is active from the first Drive.
  const r = ingest(s, 'aug23-2038'); s = r.state;
  assert.equal(r.report.map.recorded, true);
  assert.equal(r.report.map.name, 'Starter 21 Dual Tune 2');
  assert.equal(r.report.map.version, 1);
  assert.equal(r.report.map.label, 'Map version 1');
  const f = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21 AFM fix', changed: 'afm', note: '' }, { now: NOW });
  s = f.state;
  assert.equal(f.version.n, 2);
  // The drive card for 20:38 now names the version that Flash produced; 19:59
  // keeps Map version 1, because it started before it.
  assert.equal(K.carReport(s, '20260823-203853').map.name, 'Starter 21 AFM fix');
  assert.equal(K.carReport(s, '20260823-203853').map.version, 2);
  assert.equal(K.carReport(s, '20260823-195901').map.version, 1);
  assert.equal(K.carReport(s, '20260823-195901').map.name, 'Starter 21 Dual Tune 2');
});

test('flash CRUD: edit fixes a typo, delete asks nothing here but removes once', () => {
  let s = K.carEmpty();
  const f = K.carRecordFlash(s, { time: 1000, map: 'Starter 21', changed: 'boost', note: '' }, { now: NOW });
  s = f.state;
  const id = f.flash.id;
  s = K.carEditFlash(s, id, { map: 'Starter 21 rev2' });
  // The Flash's Map version keeps step with it, so Undo never names a file the
  // owner has just renamed.
  assert.equal(K.carMapAt(s, 2000).name, 'Starter 21 rev2');
  assert.equal(K.carMapAt(s, 2000).n, 2);
  s = K.carDeleteFlash(s, id);
  // Deleting the Flash takes its Map version with it; the car is back on
  // Map version 1, the map it started on, with no gap in the numbering.
  assert.equal(K.carMapAt(s, 2000).n, 1);
  assert.equal(K.carMapAt(s, 2000).name, 'Starter 21 Dual Tune 2');
  assert.deepEqual(K.carMapVersions(s).map((v) => v.n), [1]);
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

// ---------------------------------------------------------------------------
// 02 — the four false alarms (owner-voices.md §4), at the public Car operation
// ---------------------------------------------------------------------------

test('30 Aug 15:29 (0.58 → 0.49) is the normal after-flash pattern, not an Unexplained change', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  const r = ingest(s, 'aug30-1529');
  assert.equal(r.report.summary.kcStart, 0.58, 'the Drive starts high');
  assert.ok(r.report.summary.kcEnd <= r.report.baseline.value + K.CAR_RULES.scoreShakedown, 'and settles to the Baseline');
  assert.equal(r.report.unexplained, null, 'asks nothing: no Flash changed this car');
  // Said in the owner's words, not as a status name.
  assert.ok(r.report.afterFlash, 'the drive card carries the sentence');
  assert.match(r.report.afterFlash.text, /started at 0\.58 and settled to your Baseline/);
  assert.ok(!/exempt|after-flash|normal/i.test(r.report.afterFlash.text), r.report.afterFlash.text);
  // Reopening the remembered Drive says the same thing.
  const again = K.carReport(r.state, r.report.identity);
  assert.equal(again.unexplained, null);
  assert.equal(again.afterFlash.text, r.report.afterFlash.text);
});

test('a starting score above 0.60 still asks, even when it settles', () => {
  // 21 Aug 21:37 on this car started 0.61 and ended 0.55: a start above the
  // after-flash band is a real question, so it is not exempt (owner-voices.md §4).
  const state = synth([
    { id: 'd1', start: 1000, kcStart: 0.49, kcEnd: 0.49 },
    { id: 'd2', start: 2000, kcStart: 0.49, kcEnd: 0.49 },
    { id: 'd3', start: 3000, kcStart: 0.49, kcEnd: 0.49 },
    { id: 'd4', start: 4000, kcStart: 0.61, kcEnd: 0.55 },
  ]);
  const r = K.carReport(state, 'd4');
  assert.ok(r.unexplained, 'asks');
  assert.deepEqual(r.unexplained.reasons, ['score']);
  assert.equal(r.afterFlash, null, 'no after-flash sentence: the start was above 0.60');
});

test('a Drive with no pull never raises "Unexplained change: boost" against Drives that had one', () => {
  // The owner's own case: 22 Aug 09:50 peaked at 8.7 psi target with no hard pull,
  // while 22 Aug 09:03 (nine pulls) peaked at 16.3. Asking about that is noise:
  // the highest target per Drive depends on whether the owner pulled at all.
  let s = K.carEmpty();
  s = ingest(s, 'aug22-0903').state;
  assert.equal(K.carReport(s, '20260822-090322').summary.hardPulls, 9, 'nine hard pulls');
  const r = ingest(s, 'aug22-0950');
  assert.equal(r.report.summary.hardPulls, 0, 'no hard pull in this Drive');
  assert.ok(!r.report.unexplained || !r.report.unexplained.reasons.includes('boost'),
    JSON.stringify(r.report.unexplained));
});

test('a Drive with pulls is still compared against the pulls, and still asks when the target moved', () => {
  // Same rule, both sides pulled: a real target move is still an Unexplained change.
  const state = synth([
    { id: 'd1', start: 1000, boostTarget: 16, hardPulls: 3 },
    { id: 'd2', start: 2000, boostTarget: 16, hardPulls: 2 },
    { id: 'd3', start: 3000, boostTarget: 16, hardPulls: 4 },
    { id: 'd4', start: 4000, boostTarget: 22, hardPulls: 2 },
  ]);
  const r = K.carReport(state, 'd4');
  assert.ok(r.unexplained, 'asks');
  assert.deepEqual(r.unexplained.reasons, ['boost']);
  assert.equal(r.afterFlash, null);
});

test('one pull Drive is not this car\'s boost normal: the comparison waits for three', () => {
  // Below the floor there is no "normal" to jump from, so nothing is asked.
  const few = synth([
    { id: 'd1', start: 1000, boostTarget: 12, hardPulls: 2 },
    { id: 'd2', start: 2000, boostTarget: 22, hardPulls: 2 },
  ]);
  assert.equal(K.carReport(few, 'd2').unexplained, null);
  const enough = synth([
    { id: 'd1', start: 1000, boostTarget: 16, hardPulls: 2 },
    { id: 'd2', start: 2000, boostTarget: 16, hardPulls: 2 },
    { id: 'd3', start: 3000, boostTarget: 16, hardPulls: 2 },
    { id: 'd4', start: 4000, boostTarget: 22, hardPulls: 2 },
  ]);
  assert.deepEqual(K.carReport(enough, 'd4').unexplained.reasons, ['boost']);
});

test('the score threshold that makes the after-flash band is one number, in CAR_RULES', () => {
  assert.equal(K.CAR_RULES.afterFlashStart, 0.60);
  assert.ok(K.CAR_RULES.scoreJump > 0, 'the old starting-score jump is still there for a start above the band');
  // Exactly at the band counts as the pattern; a hair above does not.
  const at = synth([{ id: 'd1', start: 1000, kcStart: 0.60, kcEnd: 0.49 }, { id: 'd2', start: 2000, kcStart: 0.49, kcEnd: 0.49 }]);
  assert.ok(K.carReport(at, 'd1').afterFlash, '0.60 settling to the Baseline is the pattern');
  const over = synth([{ id: 'd1', start: 1000, kcStart: 0.61, kcEnd: 0.49 }, { id: 'd2', start: 2000, kcStart: 0.49, kcEnd: 0.49 }]);
  assert.equal(K.carReport(over, 'd1').afterFlash, null);
  // A start in the band that does NOT settle is still a question.
  const stuck = synth([{ id: 'd1', start: 1000, kcStart: 0.58, kcEnd: 0.60 }, { id: 'd2', start: 2000, kcStart: 0.49, kcEnd: 0.49 }]);
  assert.equal(K.carReport(stuck, 'd1').afterFlash, null);
});

test('30 Aug 15:29 against three pull Drives: the trim jump still asks, the boost one does not', () => {
  // The trim Stop on 23 Aug 20:38 is a real fault and must keep asking; the boost
  // reason next to it came only from the owner not pulling that day.
  let s = K.carEmpty();
  for (const id of ['aug22-0903', 'aug23-1959', 'aug23-2038']) s = ingest(s, id).state;
  const r = ingest(s, 'aug30-1529');
  assert.equal(r.report.summary.hardPulls, 8, 'eight hard pulls');
  assert.equal(r.report.unexplained, null, 'the reference Drives had no pulls to compare against');
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
  assert.equal(r.report.map.version, 1);
  assert.ok(Math.abs(r.report.summary.boostTarget - 19.2) < 0.15, 'highest target ' + r.report.summary.boostTarget);
  assert.equal(K.carTableRows(r.state)[0].boostTarget, r.report.summary.boostTarget);
  assert.equal(K.carTableRows(r.state)[0].mapVersion, 1);
});

// ---------------------------------------------------------------------------
// 10 — Flash plan (engine: KTA.carFlashPlan, pure data for the Next Flash card)
// ---------------------------------------------------------------------------
const fs = require('fs');
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
      trimBands: [], trimIdle: null, trimFirstMin: null, trimFirstSec: 0,
      krPeak: null, krScheduled: false,
      kcUpSteps: null, lugUpSteps: null, lugRpm: null,
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
    // Overshoot opens an overshoot question, and a starting score of 0.65 (above
    // the 0.60 after-flash band) a score question: both fixes are P2-eligible, so
    // P4 picks one family member.
    drives.push({ id: 'd' + (i + 1), verdict: 'watch', trimWorst: -1, kcStart: 0.65, kcEnd: 0.49, overshoot: 3.0, lugShare: 8, boostTarget: 16 });
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
  // The change is written on Map version 1, so Undo names Map version 1 — with
  // the KTuner name the owner gave it, not a shortened invention.
  assert.equal(p.mapVersion.n, 1);
  assert.match(p.undoName, /Flash your previous map file \(Map version 1 · Starter 21 Dual Tune 2\)/);
  assert.equal(p.prefill.changed, 'afm');
  assert.match(p.saveAs, /^Starter 21 Dual Tune 2 · /, 'the new file is named after the Map version it is written on');
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

test('next-flash card contract: 19:59, one Flash at 20:00, 20:38 Stop → Undo naming that Map version', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = K.carRecordFlash(s, { time: Date.UTC(2026, 7, 23, 13, 0, 0), map: 'Starter 21', changed: 'other', note: '' }, { now: NOW }).state;
  s = ingest(s, 'aug23-2038').state;
  const p = K.carFlashPlan(s, MAP, { now: NOW });
  assert.equal(p.kind, 'undo');
  assert.match(p.headline, /previous map file/i);
  assert.match(p.undoName, /Starter 21/);
  assert.equal(p.route, 'preset');
  assert.equal(p.tables.length, 0);
  assert.equal(p.cells.length, 0);
  // The Stop ran on Map version 2, so Undo names Map version 1 — the KTuner
  // basemap the owner gave the app — with its KTuner spelling.
  assert.equal(p.mapVersion.n, 2);
  assert.equal(p.undo.version, 1);
  assert.equal(p.undo.name, 'Starter 21 Dual Tune 2');
  assert.match(p.undoName, /Map version 1 · Starter 21 Dual Tune 2/);
  // "Record this Flash" from the card names the file and starts the Shakedown drive.
  assert.equal(p.prefill.map, 'Starter 21 Dual Tune 2');
  const r = K.carRecordFlash(K.carEmpty(), p.prefill, { now: NOW });
  assert.equal(r.state.shakedown.status, 'pending');
  assert.equal(r.version.n, 2);
});

test('next-flash card contract: no-change carries six levers and no file, table or prefill', () => {
  const { state: s } = ownerState();
  const p = K.carFlashPlan(s, MAP, { now: NOW });
  assert.equal(p.kind, 'no-change');
  assert.deepEqual(p.levers.map((l) => l.id), ['afm', 'mixture', 'boostPlus', 'boostLow', 'downpipe', 'hot']);
  assert.ok(p.levers.every((l) => l.reason && l.unlocks), 'every lever carries reason + unlock');
  assert.equal(p.saveAs, null);
  assert.equal(p.prefill, null);
  assert.equal(p.undoName, null);
  assert.equal(p.tables.length, 0);
  assert.equal(p.cells.length, 0);
});

// ---------------------------------------------------------------------------
// 04 — Open steps, settling them, and exactly one Next step
// ---------------------------------------------------------------------------

const OWNER_NINE = [
  'aug22-0903', 'aug22-0950', 'aug23-1959', 'aug23-2038', 'aug30-1509',
  'aug30-1529', 'aug30-1601', 'sep01-0813', 'sep05-0756'
];

/**
 * The owner's nine real Drives through the loop, in order: settle what was asked
 * against the new Drive, then decide one Next step — the two engine operations
 * the app calls for every upload, in that order.
 */
function loop(ids) {
  let s = K.carEmpty();
  let steps = [];
  return (ids || OWNER_NINE).map((id) => {
    const r = ingest(s, id);
    s = r.state;
    const settled = K.carSettle(s, r.report.identity, steps);
    steps = settled.openSteps;
    const decided = K.carNextStep(s, r.report.identity, steps);
    steps = decided.openSteps;
    return {
      id, driveId: r.report.identity, tooShort: r.report.tooShort, verdict: r.report.verdict,
      summary: r.report.summary, settled: settled.settled, wasted: settled.wasted,
      step: decided.step, open: steps
    };
  });
}
const byDrive = (rows, id) => rows.filter((r) => r.id === id)[0];

test('the loop over the owner\'s nine Drives: one Next step each, in the ticket\'s order', () => {
  const rows = loop();
  // Drive → which branch of the fixed decision order it took.
  assert.deepEqual(
    rows.map((r) => r.step.key + '/' + r.step.kind),
    [
      'baseline/drive',   // 22 Aug 09:03 no Baseline yet
      'baseline/drive',   // 22 Aug 09:50 too warm — the same step again
      'baseline/drive',   // 23 Aug 19:59 too warm — the same step again
      'undo/flash',       // 23 Aug 20:38 the open Stop: Undo is the only step
      'tooShort/none',    // 30 Aug 15:09 nothing read, the previous step stands
      'baseline/drive',   // 30 Aug 15:29 the Undo is Done, the Baseline is next
      'baseline/drive',   // 30 Aug 16:01 Baseline step + the habit opened beside it
      'habit/drive',      // 1 Sep 08:13 the Baseline is Done, the habit is scored
      'logger/watch'      // 5 Sep 07:56 four dead gauges: fix the logger
    ]
  );
  // Exactly one step per Drive, never a list.
  assert.ok(rows.every((r) => r.step && typeof r.step.title === 'string' && r.step.title));
  assert.ok(rows.every((r) => !Array.isArray(r.step)), 'one step, not a list');
});

test('30 Aug 16:01 gives the Baseline step with the lugging habit added as an Open step', () => {
  const row = byDrive(loop(), 'aug30-1601');
  // The Baseline is still the step: the habit waits to be scored against it.
  assert.equal(row.step.key, 'baseline');
  assert.equal(row.step.also, 'habit');
  assert.equal(row.step.same, false, 'a step that brings news of its own is never compact');
  assert.deepEqual(row.step.gauges, ['iat', 'kc', 'afr', 'boost']);
  // The cause is diagnosed from this Drive's own numbers and told as a free habit.
  assert.match(row.step.cause.why, /Knock Control went 0\.49 → 0\.65/);
  assert.match(row.step.cause.why, /1\.6° of timing taken under boost\. Not damage\./);
  assert.match(row.step.cause.why, /31 of its 41 step-ups came while the CVT held 1,509 rpm/);
  assert.equal(row.summary.lugUpSteps, 31);
  assert.equal(row.summary.kcUpSteps, 41);
  // And it is a real Open step, waiting for the Drive that settles it.
  const habit = row.open.filter((x) => x.key === 'habit')[0];
  assert.equal(habit.status, 'open');
  assert.equal(habit.askedOn, '20260830-160151');
  assert.equal(habit.lastAskedOn, null, 'opened beside the step, not asked for yet');
});

test('the Undo settles Done in 2 Drives on 30 Aug 15:29, with the trims and the calm minutes', () => {
  const rows = loop();
  const asked = byDrive(rows, 'aug23-2038').step;
  assert.equal(asked.key, 'undo', 'the open Stop makes Undo the only step');
  assert.equal(asked.proves, 'trims back within ±5 % over 10 calm minutes');
  assert.equal(asked.settlesOn, 'after the first calm drive on the old file');

  const undone = byDrive(rows, 'aug30-1529').settled.filter((x) => x.key === 'undo')[0];
  assert.equal(undone.status, 'done');
  assert.match(undone.why, /Trims −2\.3 % over 15 calm minutes/);
  assert.match(undone.why, /they were −21\.4 %/, 'the number the step was asked against');
  // Drives to proof: asked on 20:38, settled on 15:29 — two uploads, one of them
  // the Too-short Drive that settled nothing.
  const askedOn = byDrive(rows, 'aug23-2038').driveId;
  const settledBy = byDrive(rows, 'aug30-1529').driveId;
  const counting = rows.filter((r) => r.driveId > askedOn && r.driveId <= settledBy);
  assert.deepEqual(counting.map((r) => r.id), ['aug30-1509', 'aug30-1529']);
  assert.equal(counting.filter((r) => !r.tooShort).length, 1, 'one of them proved it');
});

test('a Drive that settles nothing is a Wasted drive, and it says what would have settled one', () => {
  const rows = loop();
  // Too short: nothing read, and the Undo was the step waiting.
  const short = byDrive(rows, 'aug30-1509');
  assert.deepEqual(short.settled, [], 'a Too-short Drive settles nothing at all');
  assert.equal(short.wasted.wasted, true);
  assert.equal(short.wasted.key, 'undo');
  assert.match(short.wasted.reason, /too short/);
  assert.equal(short.wasted.would, 'a drive of 10 calm minutes');
  assert.equal(short.wasted.proves, 'the Undo');
  // It also leaves the step the owner already has standing.
  assert.equal(short.step.previous.key, 'undo');
  assert.equal(short.step.same, true);

  // A logger fault: the reason is the logger, and what would count names the gauges.
  const dead = byDrive(rows, 'sep05-0756');
  assert.equal(dead.wasted.wasted, true);
  assert.match(dead.wasted.reason, /the logger lost DIFP, Transmission Temperature, Turbo Pressure and Turbo Pressure Target/);
  assert.equal(dead.wasted.withGauges, true, 'the Drive that would count needs every gauge moving');
  // A Drive that settled something is never called a Wasted drive.
  for (const id of ['aug30-1529', 'sep01-0813']) {
    assert.equal(byDrive(rows, id).wasted.wasted, false, id);
  }
});

test('a Stop Drive is never called a Wasted drive, whatever it could not settle', () => {
  const stop = byDrive(loop(), 'aug23-2038');
  assert.equal(stop.verdict, 'stop');
  assert.ok(stop.settled.length > 0, 'it did read and settle the steps it could');
  assert.equal(stop.wasted.wasted, false, 'the owner has a fault to fix, not a lesson');
});

test('every "Can\'t tell yet" carries a why, and never reads like a failure', () => {
  const rows = loop();
  const judged = rows.flatMap((r) => r.settled);
  assert.ok(judged.length > 10, 'the nine Drives judge a lot of steps: ' + judged.length);
  const waits = judged.filter((j) => j.status === 'wait');
  assert.ok(waits.length >= 6, 'several waits across the nine Drives');
  for (const j of judged) {
    assert.ok(j.why && j.why.length > 10, j.key + ': every judgement says why: ' + j.why);
    for (const banned of ['failed', 'failure', 'try again', 'not yet —', 'bad log', 'wrong']) {
      assert.ok(!j.why.toLowerCase().includes(banned), j.key + ': "' + j.why + '"');
    }
  }
  // The whys CONTEXT.md asks for, each on a real Drive where it applies.
  assert.ok(
    waits.some((j) => /Cool Drive \(37 °C moving\): the habit only shows on a hot afternoon/.test(j.why)),
    'cool when the habit needs heat'
  );
  assert.match(byDrive(rows, 'aug30-1509').wasted.reason, /it was too short \(under a minute moving\)/,
    'too short: the why is on the Wasted drive line, because a Too-short Drive settles nothing');
  assert.match(
    K.carSettle(synth([{ id: 'x', flat: ['kControl'], kcPeak: 0.6, kcStart: 0.5, hot: true, lugShare: 8 }]),
      'x', [{ key: 'habit', status: 'open', why: 'asked', askedOn: 'older', lastAskedOn: 'older' }]).settled[0].why,
    /Knock Control was dead in this log/
  );
});

test('the Baseline settles Done on 1 Sep 08:13 with the intake, the pulls and 50→70', () => {
  const rows = loop();
  assert.match(byDrive(rows, 'sep01-0813').settled.filter((x) => x.key === 'baseline')[0].why,
    /Intake 37 °C, 2 pulls, 50→70 km\/h in 1\.97 s\. Every later Drive is compared to this one\./);
  // And the habit, opened on 16:01, is asked for as the step from then on.
  const step = byDrive(rows, 'sep01-0813').step;
  assert.equal(step.key, 'habit');
  assert.equal(step.settlesOn, 'after your next hot-afternoon Drive');
});

test('every Next step names the Drive whose upload will settle it', () => {
  for (const r of loop()) {
    assert.ok(r.step.settlesOn && r.step.settlesOn.length > 5, r.id + ': ' + r.step.settlesOn);
    // "Upload when" is a Drive to log, or a moment to come back after — never blank.
    assert.match(r.step.settlesOn, /^(after|your next|something)/, r.id + ': ' + r.step.settlesOn);
    if (r.step.proves) assert.ok(r.step.proves.length > 5, r.id + ' names what it proves');
  }
});

test('a repeated step is one short line: same step as last time', () => {
  const rows = loop();
  for (const id of ['aug22-0950', 'aug23-1959']) {
    assert.equal(byDrive(rows, id).step.same, true, id + ' repeats the step as last time');
  }
  assert.equal(byDrive(rows, 'aug22-0903').step.same, false, 'the first Drive is not a repeat');
  assert.equal(byDrive(rows, 'aug30-1601').step.same, false, 'a cause seen today is never hidden');
  assert.equal(byDrive(rows, 'sep01-0813').step.same, false,
    'the habit was opened beside the Baseline, never asked for: not a repeat');
});

test('an Open step asked again keeps its place, and only its last ask moves', () => {
  const rows = loop();
  const after = byDrive(rows, 'aug23-1959').open.filter((x) => x.key === 'baseline')[0];
  assert.equal(after.askedOn, '20260822-090322', 'the Drive that first asked it: Drives to proof counts from here');
  assert.equal(after.lastAskedOn, '20260823-195901', 'and the Drive that asked it most recently');
  assert.equal(after.status, 'wait', 'the last judgement is kept, not reset');
  assert.equal(after.settledBy, '20260823-195901');
});

test('a Drive never settles the step it asked itself', () => {
  let s = ingest(K.carEmpty(), 'aug23-1959').state;
  const stop = ingest(s, 'aug23-2038');
  s = stop.state;
  const steps = K.carNextStep(s, stop.report.identity, []).openSteps;
  assert.equal(steps.filter((x) => x.key === 'undo')[0].askedOn, stop.report.identity);
  // Re-checking the same Drive must not judge the Undo against its own fault.
  const again = K.carSettle(s, stop.report.identity, steps);
  assert.equal(again.settled.filter((x) => x.key === 'undo').length, 0);
  assert.equal(again.openSteps.filter((x) => x.key === 'undo')[0].status, 'open');
});

test('the loop is deterministic: the same Car history and Open steps give the same reply', () => {
  assert.deepEqual(loop(), loop());
});

test('no step names a KTuner table; only the Flash plan does', () => {
  const rows = loop();
  const words = JSON.stringify(rows.map((r) => r.step));
  for (const id of Object.keys(K.TABLES)) {
    assert.ok(!words.includes(id), id + ' must never appear in a step');
  }
  // The Flash plan still names its tables: the only place that does.
  const plan = K.carFlashPlan(trimState([-7.1, -6.8, -7.3, -6.5, -7.0]), MAP, { now: NOW });
  assert.deepEqual(plan.tables.map((t) => t.id), ['MAF_Scaling_Custom']);
});

test('the Open steps read as the loop\'s own vocabulary: keys, statuses and reasons', () => {
  const open = loop(OWNER_NINE.slice(0, 1))[0].open;
  assert.deepEqual(open.map((x) => x.key), ['baseline', 'channels']);
  assert.deepEqual(open.map((x) => x.status), ['open', 'open']);
  for (const step of open) assert.match(step.title, /^(Undo|Baseline|Habit test|Log AFR|Fix the logger)/);
  // A hand-made step key is dropped rather than guessed at.
  assert.deepEqual(K.carOpenSteps([{ key: 'invented', status: 'open' }]), []);
});

// ---------------------------------------------------------------------------
// 06 — Diagnose: one cause per symptom pattern, before the Next step
// ---------------------------------------------------------------------------

/** One sentence, owner-tone: no second sentence hiding behind the first. */
function oneSentence(s) {
  assert.ok(s && s.length > 20, 'a sentence, not a fragment: ' + s);
  assert.ok(!/\.\s+[A-Z]/.test(s), 'one sentence, no second one: ' + s);
  assert.ok(/\.$/.test(s), 'it ends with a period: ' + s);
}
/** A Baseline already proven: the cause step is reachable past branch 4. */
function doneBaseline() {
  return [{ key: 'baseline', title: 'Baseline: one Cool drive with 2 pulls', status: 'done', why: 'Intake 37 °C, 2 pulls.', askedOn: 'before', askedAt: 1, lastAskedOn: 'before', settledBy: 'before', settledAt: 1 }];
}

test('diagnose reads 20:38 like a tuner: housing mismatch, Undo, one sentence', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = ingest(s, 'aug23-2038').state;
  const dg = K.carDiagnose(s, '20260823-203853');
  assert.equal(dg.id, 'maf-preset');
  assert.equal(dg.cause, 'MAF Scaling / housing mismatch');
  assert.equal(dg.step, 'undo');
  assert.match(dg.sentence, /every band/);
  assert.match(dg.sentence, /first minute/);
  assert.match(dg.sentence, /right after a change/);
  assert.match(dg.sentence, /airflow reading is off/);
  oneSentence(dg.sentence);
  // And the Next step is still Undo: diagnose explains the step, never moves it.
  const decided = K.carNextStep(s, '20260823-203853', []);
  assert.equal(decided.step.key, 'undo');
  assert.equal(decided.step.kind, 'flash');
  assert.deepEqual(decided.diagnose, dg);
});

test('20:38 flash plan is Undo with zero cells: never a knock fix or curve edit', () => {
  let s = K.carEmpty();
  s = ingest(s, 'aug23-1959').state;
  s = ingest(s, 'aug23-2038').state;
  const plan = K.carFlashPlan(s, MAP, { now: NOW });
  assert.equal(plan.kind, 'undo');
  assert.deepEqual(plan.tables, []);
  assert.deepEqual(plan.cells, []);
  assert.equal(plan.cells.length, 0);
  assert.equal(plan.afmPasteRow, null);
  const blob = JSON.stringify(plan.tables.concat(plan.cells)).toLowerCase();
  assert.ok(!blob.includes('knock') && !blob.includes('maf'), 'no knock fix, no curve edit: ' + blob);
  const afm = plan.levers.filter((l) => l.id === 'afm')[0];
  assert.equal(afm.status, 'locked');
  assert.match(afm.reason, /never a curve edit/);
});

test('unmetered air: idle and low airflow only, after a flash — check the install, no map change', () => {
  const low = [
    { from: -12, to: -8, seconds: 120, trim: 8.6 }, { from: -8, to: -5, seconds: 200, trim: 9.1 },
    { from: -5, to: -2, seconds: 180, trim: 8.8 }, { from: -2, to: 1, seconds: 150, trim: 8.2 },
  ];
  const high = [{ from: 1, to: 4, seconds: 90, trim: 1.1 }, { from: 4, to: 8, seconds: 60, trim: -0.8 }];
  let s = synth([
    { id: 'before', trimWorst: 0.8 },
    {
      id: 'leak', trimWorst: 9.1, trimBands: low.concat(high), trimIdle: 9.4,
      trimFirstMin: 9.0, trimFirstSec: 55, verdict: 'watch',
    },
  ]);
  s = K.carRecordFlash(s, { time: 150000, map: 'intake fitted', changed: 'other', note: '' }, { now: NOW }).state;
  const dg = K.carDiagnose(s, 'leak');
  assert.equal(dg.id, 'unmetered-air');
  assert.equal(dg.step, 'install');
  assert.match(dg.sentence, /idle and low airflow/);
  assert.match(dg.sentence, /no map change/);
  oneSentence(dg.sentence);
  const decided = K.carNextStep(s, 'leak', doneBaseline());
  assert.equal(decided.step.key, 'install');
  assert.equal(decided.step.kind, 'watch');
  assert.match(decided.step.title, /Check the install/);
  // A later drive with the trims back proves the check.
  const later = synth([
    { id: 'before', trimWorst: 0.8 },
    {
      id: 'leak', trimWorst: 9.1, trimBands: low.concat(high), trimIdle: 9.4,
      trimFirstMin: 9.0, trimFirstSec: 55, verdict: 'watch',
    },
    { id: 'fixed', trimWorst: 1.2, trimIdle: 0.9, mixLeanest: 10.6, mixTarget: 11, hardPulls: 2 },
  ]);
  const settled = K.carSettle(later, 'fixed', decided.openSteps);
  assert.equal(settled.settled.filter((x) => x.key === 'install')[0].status, 'done');
});

test('lean under boost after a downpipe install — check the flanges, then the mixture', () => {
  const s = synth(
    [{ id: 'before', trimWorst: 0.5 }, { id: 'dp', trimWorst: 1.0, mixLeanest: 12.3, mixTarget: 11, hardPulls: 2, verdict: 'watch' }],
  );
  const installs = [{ part: 'TSP catted downpipe', installed_at: 150000 }];
  const dg = K.carDiagnose(s, 'dp', { installs });
  assert.equal(dg.id, 'exhaust-lean');
  assert.equal(dg.step, 'install');
  assert.match(dg.sentence, /12\.3 against 11\.0 asked/);
  assert.match(dg.sentence, /after the downpipe went on/);
  assert.match(dg.sentence, /check the flanges first/);
  oneSentence(dg.sentence);
  assert.equal(K.carNextStep(s, 'dp', doneBaseline(), { installs }).step.key, 'install');
});

test('scheduled retard with a flat score is never a finding', () => {
  const s = synth([
    { id: 'before', trimWorst: 0.5 },
    {
      id: 'kr', trimWorst: 1.0, kcStart: 0.5, kcEnd: 0.5, kcPeak: 0.5,
      krPeak: 6.0, krScheduled: true, hardPulls: 2, verdict: 'watch',
    },
  ]);
  assert.equal(K.carDiagnose(s, 'kr'), null, 'high retard, flat score: scheduled, not a finding');
  // And 20:38 — 6° of retard on a flat score — still reads air first, not knock.
  let r = K.carEmpty();
  r = ingest(r, 'aug23-1959').state;
  r = ingest(r, 'aug23-2038').state;
  const dg = K.carDiagnose(r, '20260823-203853');
  assert.equal(dg.id, 'maf-preset', 'the trims win over the retard');
});

test('lugging on 16:01 — keep the revs up, the Baseline stays the step', () => {
  let s = K.carEmpty();
  for (const id of OWNER_NINE.slice(0, 7)) s = ingest(s, id).state;
  const dg = K.carDiagnose(s, '20260830-160151');
  assert.equal(dg.id, 'lugging');
  assert.equal(dg.step, 'habit');
  assert.match(dg.sentence, /0\.49 → 0\.65/);
  assert.match(dg.sentence, /keep the revs up/);
  oneSentence(dg.sentence);
});

test('held overshoot after a downpipe — faster spool, the downpipe boost trim', () => {
  const s = synth([
    { id: 'before', trimWorst: 0.5 },
    { id: 'spool', trimWorst: 1.0, overshoot: 3.0, hardPulls: 2, boostTarget: 16, verdict: 'watch' },
  ]);
  const installs = [{ part: '27WON catted downpipe', installed_at: 150000 }];
  const dg = K.carDiagnose(s, 'spool', { installs });
  assert.equal(dg.id, 'spool');
  assert.equal(dg.step, 'downpipe');
  assert.match(dg.sentence, /\+3\.0 psi over target/);
  assert.match(dg.sentence, /spools faster/);
  oneSentence(dg.sentence);
  const decided = K.carNextStep(s, 'spool', doneBaseline(), { installs });
  assert.equal(decided.step.key, 'downpipe');
  assert.equal(decided.step.kind, 'flash');
});

test('the nine drives keep their steps: only 20:38 and 16:01 carry a cause', () => {
  const rows = loop();
  assert.deepEqual(
    rows.map((r) => r.step.key + '/' + r.step.kind),
    [
      'baseline/drive', 'baseline/drive', 'baseline/drive', 'undo/flash', 'tooShort/none',
      'baseline/drive', 'baseline/drive', 'habit/drive', 'logger/watch',
    ],
    'diagnose explains the same steps better; it moves none of them',
  );
  let s = K.carEmpty();
  for (const id of OWNER_NINE) {
    const r = ingest(s, id);
    s = r.state;
  }
  const ids = {};
  for (const id of Object.keys(s.drives)) {
    const dg = K.carDiagnose(s, id);
    ids[id] = dg ? dg.id : null;
  }
  assert.deepEqual(ids, {
    '20260822-090322': null,
    '20260822-095021': null,
    '20260823-195901': null,
    '20260823-203853': 'maf-preset',
    '20260830-152931': null,
    '20260830-160151': 'lugging',
    '20260901-081358': null,
    '20260905-075634': null,
  });
});

// ---------------------------------------------------------------------------
// 07 — Owner questions: pause, answer, resume (engine: KTA.carQuestions)
// ---------------------------------------------------------------------------

function questionsLoop() {
  // The nine drives through ingest + open-steps, with the plan each drive saw,
  // so questions read what the reply would have shown.
  let s = K.carEmpty();
  let open = [];
  const rows = [];
  for (const id of OWNER_NINE) {
    const r = ingest(s, id);
    s = r.state;
    if (r.report.tooShort) {
      rows.push({ id, driveId: null, questions: [] });
      continue;
    }
    const driveId = r.report.identity;
    const plan = K.carFlashPlan(s, MAP, { now: NOW });
    const qs = K.carQuestions(s, driveId, { openSteps: open, plan });
    rows.push({ id, driveId, questions: qs, plan });
    const settled = K.carSettle(s, driveId, open);
    const decided = K.carNextStep(s, driveId, settled.openSteps, {});
    open = decided.openSteps;
  }
  return { state: s, rows };
}

test('07: 20:38 asks what changed and which housing, in that order', () => {
  const { rows } = questionsLoop();
  const fault = rows.filter((r) => r.id === 'aug23-2038')[0];
  assert.deepEqual(fault.questions.map((q) => q.kind), ['what-changed', 'housing']);
  const changed = fault.questions[0];
  assert.equal(changed.title, 'What changed');
  assert.match(changed.question, /What changed/);
  assert.deepEqual(changed.choices.map((c) => c.id), ['maf', 'other-flash', 'part', 'nothing']);
  assert.deepEqual(changed.choices.map((c) => c.label), [
    'I flashed, changing MAF Scaling',
    'I flashed something else',
    'I fitted a part, no flash',
    'Nothing I know of',
  ]);
  assert.equal(changed.askedOn, '20260823-203853');
  assert.match(changed.id, /what-changed:20260823-203853/);
  const housing = fault.questions[1];
  assert.equal(housing.kind, 'housing');
  assert.match(housing.question, /intake housing/);
  assert.deepEqual(housing.choices.map((c) => c.id), ['factory', 'hvi', 'race', 'won', 'unsure']);
  assert.deepEqual(housing.choices.map((c) => c.label), [
    'Factory airbox', 'PRL HVI', 'PRL Race housing', '27WON Race', 'Not sure',
  ]);
});

test('07: 15:29 asks did-you-flash when the after-flash pattern meets the open Stop', () => {
  // The did-flash question needs the Undo still open, as it is when 15:29
  // arrives: the pre-settle Open steps carry the Undo asked on 20:38.
  let s = K.carEmpty();
  let open = [];
  for (const id of ['aug22-0903', 'aug23-1959', 'aug23-2038']) {
    const r = ingest(s, id);
    s = r.state;
    const settled = K.carSettle(s, r.report.identity, open);
    open = K.carNextStep(s, r.report.identity, settled.openSteps, {}).openSteps;
  }
  const r = ingest(s, 'aug30-1529');
  s = r.state;
  const plan = K.carFlashPlan(s, MAP, { now: NOW });
  const qs = K.carQuestions(s, r.report.identity, { openSteps: open, plan });
  assert.deepEqual(qs.map((q) => q.kind), ['did-flash']);
  assert.match(qs[0].question, /Did you flash after the Stop/);
  assert.deepEqual(qs[0].choices.map((c) => c.id), ['undo', 'other', 'no']);
  assert.deepEqual(qs[0].choices.map((c) => c.label), [
    'Yes, the old file back (Undo)', 'Yes, a different file', 'No',
  ]);
});

test('07: drives with no pattern ask nothing', () => {
  const { rows } = questionsLoop();
  for (const row of rows) {
    if (row.id === 'aug23-2038' || row.id === 'aug30-1529') continue;
    assert.deepEqual(row.questions, [], row.id + ' asks nothing');
  }
});

test('07: housing routes to the MAF Scaling option, and not-sure stays on the Undo file', () => {
  assert.deepEqual(K.mafOptionFor('factory'), { option: 'Factory', detail: 'Factory airbox, factory housing.' });
  assert.equal(K.mafOptionFor('hvi').option, 'Factory');
  assert.match(K.mafOptionFor('hvi').detail, /calm drive must show/);
  assert.equal(K.mafOptionFor('race').option, 'PRL Race');
  assert.equal(K.mafOptionFor('won').option, '27Won Race');
  assert.equal(K.mafOptionFor('unsure').option, null);
  assert.match(K.mafOptionFor('unsure').detail, /Stay on the Undo file/);
  assert.equal(K.mafOptionFor('nope'), null);
});

test('07: questions never name a KTuner table except MAF Scaling in a choice', () => {
  const { rows } = questionsLoop();
  for (const row of rows) {
    for (const q of row.questions) {
      for (const table of ['MAF_Scaling_Custom', 'WOT_Enrich', 'Boost_Target', 'Final_Boost']) {
        assert.ok(!q.question.includes(table), q.kind + ' names ' + table);
        for (const c of q.choices) assert.ok(!c.label.includes(table), c.label);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// A1 — the Open-step lifecycle: every step reads the same way wherever it is read
// ---------------------------------------------------------------------------

// What the owner is told for one step, however the step was reached.
const asked = (d) => ({ key: d.step.key, kind: d.step.kind, title: d.step.title, gauges: d.step.gauges, proves: d.step.proves, settlesOn: d.step.settlesOn });
const openOne = (key) => [].concat(doneBaseline(), [{ key, title: 'x', status: 'open', why: 'asked', askedOn: 'a', lastAskedOn: 'a', askedAt: 1 }]);
const reask = (key) => asked(K.carNextStep(synth([{ id: 'a' }, { id: 'b' }]), 'b', openOne(key)));
const firstAsk = {
  undo: () => asked(K.carNextStep(synth([{ id: 'a' }, { id: 'b', verdict: 'stop' }]), 'b', [])),
  logger: () => asked(K.carNextStep(synth([{ id: 'a' }, { id: 'b', flat: ['kControl'] }]), 'b', [])),
  baseline: () => asked(K.carNextStep(synth([{ id: 'a' }, { id: 'b' }]), 'b', [])),
  habit: () => {
    let s = K.carEmpty();
    for (const id of OWNER_NINE.slice(0, 7)) s = ingest(s, id).state;
    return asked(K.carNextStep(s, '20260830-160151', doneBaseline()));
  },
  install: () => asked(K.carNextStep(synth([{ id: 'a', trimWorst: 0.8 }, { id: 'b', trimWorst: 9.1, trimIdle: 9.4, trimFirstMin: 9.0, trimFirstSec: 55, verdict: 'watch',
    trimBands: [{ from: -12, to: -8, seconds: 120, trim: 8.6 }, { from: -8, to: -5, seconds: 200, trim: 9.1 }, { from: -5, to: -2, seconds: 180, trim: 8.8 }, { from: -2, to: 1, seconds: 150, trim: 8.2 }, { from: 1, to: 4, seconds: 90, trim: 1.1 }, { from: 4, to: 8, seconds: 60, trim: -0.8 }] }]), 'b', doneBaseline())),
  downpipe: () => asked(K.carNextStep(synth([{ id: 'a', trimWorst: 0.5 }, { id: 'b', overshoot: 3.0, verdict: 'watch' }]), 'b', doneBaseline(), { installs: [{ part: '27WON catted downpipe', installed_at: 150000 }] })),
};
const ASKED = {
  undo: { kind: 'flash', gauges: ['trims', 'kc'], proves: 'trims back within ±5 % over 10 calm minutes', settlesOn: 'after the first calm drive on the old file' },
  logger: { kind: 'watch', gauges: ['live'], proves: 'that every gauge moves again', settlesOn: 'your next drive, any kind' },
  habit: { kind: 'drive', gauges: ['rpm', 'kc', 'iat'], proves: 'lugging under 4 % of moving time and Knock Control not rising', settlesOn: 'after your next hot-afternoon Drive' },
  baseline: { kind: 'drive', gauges: ['iat', 'kc', 'afr', 'boost'], proves: 'a Cool Drive with 2 pulls to measure every later Drive against', settlesOn: 'after that morning Drive' },
  install: { kind: 'watch', gauges: ['trims', 'afr'], proves: 'trims back within ±5 % and the mixture on target', settlesOn: 'after your next drive, any kind' },
  downpipe: { kind: 'flash', gauges: ['boost', 'afr'], proves: 'overshoot under +2.5 psi on pulls with the mixture on target', settlesOn: 'after two pulls on a cool morning' },
};
const FIRST_TITLE = {
  undo: 'Put the map from before back on the car', logger: 'Your logger recorded 1 dead gauge',
  habit: 'Keep the revs up in hot traffic (free, no Flash)', baseline: 'Log one Cool-morning drive with 2 pulls',
  install: 'Check the install: clamps and flanges', downpipe: 'Flash the downpipe trim, then two pulls',
};
const AGAIN_TITLE = {
  undo: 'Undo: put the map from before back on the car', logger: 'Fix the logger: the dead gauges',
  habit: 'Habit test: log your next hot-afternoon Drive', install: 'Check the install: clamps and flanges',
  downpipe: 'Flash the downpipe trim, then two pulls',
};
const STORED_TITLE = {
  undo: 'Undo: trims back within ±5 %', logger: 'Fix the logger: dead gauges', habit: 'Habit test: revs up in hot traffic',
  channels: 'Log AFR Command and MAF Hz', baseline: 'Baseline: one Cool drive with 2 pulls',
  install: 'Check the install: clamps and flanges', downpipe: 'Flash the downpipe trim, then two pulls',
};
const SETTLE_WORDS = {
  undo: ['the Undo', 'a drive of 10 calm minutes'], logger: ['the logger fix', 'a drive with every gauge moving'],
  habit: ['the habit test', 'a hot-afternoon drive'], channels: ['the AFR Command / MAF Hz step', 'a log with AFR Command and MAF Hz in the list'],
  baseline: ['the Baseline', 'a Cool Drive with 2 pulls'], install: ['the install check', 'a drive after checking the clamps and flanges'],
  downpipe: ['the downpipe trim', 'two pulls on a cool morning'],
};
const WASTED_ORDER = ['undo', 'logger', 'habit', 'baseline', 'channels', 'install', 'downpipe'];
const ALL_STEPS = ['undo', 'logger', 'habit', 'channels', 'baseline', 'install', 'downpipe'];

test('A1: every step is re-asked in the order undo, logger, habit, channels, baseline, install, downpipe', () => {
  assert.deepEqual(K.STEP_KEYS, ALL_STEPS);
  const stored = K.carOpenSteps(ALL_STEPS.slice().reverse().map((key) => ({ key })));
  assert.deepEqual(stored.map((s) => s.key), ALL_STEPS, 'steps asked at the same moment read back in that order');
  assert.deepEqual(stored.map((s) => s.title), ALL_STEPS.map((k) => STORED_TITLE[k]));
});

test('A1: the first ask tells the owner each step in the same words, whichever way it is reached', () => {
  for (const key of Object.keys(ASKED)) {
    const got = firstAsk[key]();
    assert.deepEqual(got, Object.assign({ key, title: FIRST_TITLE[key] }, ASKED[key],
      key === 'habit' ? { proves: ASKED.habit.proves + ' (today 6.9 %, +0.16)' } : {}), key);
  }
});

test('A1: an Open step still open is re-asked in its compact words', () => {
  for (const key of Object.keys(AGAIN_TITLE)) {
    assert.deepEqual(reask(key), Object.assign({ key, title: AGAIN_TITLE[key] }, ASKED[key]), key);
  }
});

test('A1: a Too-short Drive names the step the owner waits on, and the words that would settle it', () => {
  for (const key of ALL_STEPS) {
    const w = K.carSettle(K.carEmpty(), 'zz', [{ key, status: 'open', askedOn: 'a' }]).wasted;
    assert.deepEqual([w.key, w.proves, w.would], [key, SETTLE_WORDS[key][0], SETTLE_WORDS[key][1]], key);
  }
  for (const a of ALL_STEPS) for (const b of ALL_STEPS) {
    if (a === b) continue;
    const w = K.carSettle(K.carEmpty(), 'zz', [a, b].map((key) => ({ key, status: 'open', askedOn: 'a' }))).wasted;
    assert.equal(w.key, WASTED_ORDER.indexOf(a) < WASTED_ORDER.indexOf(b) ? a : b, a + ' with ' + b);
  }
});

test('A1: a judged step reports the same words as the Wasted drive line', () => {
  const s = synth([{ id: 'a' }, { id: 'b', hot: false, hardPulls: 0 }]);
  for (const key of ['channels', 'baseline', 'habit']) {
    const row = K.carSettle(s, 'b', [{ key, status: 'open', askedOn: 'a' }]).settled[0];
    assert.deepEqual([row.proves, row.would], SETTLE_WORDS[key], key);
  }
});

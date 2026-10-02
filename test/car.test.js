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

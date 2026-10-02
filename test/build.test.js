'use strict';
// Build path: every table named must exist in the owner's map file, and the map facts and locks match the real data.
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../engine/kta-build.js');
const MAP = { tables: require('../data/ktuner-maps-digitized.json') };
require('../data/example-aug30-1529.js');
const zlib = require('zlib');
const csv = zlib.gunzipSync(Buffer.from(globalThis.KTA_EXAMPLES['aug30-1529'].gz, 'base64')).toString('utf8');
const pulls = K.checkDrive(K.readLog(csv));

test('every table an item names exists in the digitized map', () => {
  K.build.ITEMS.forEach((it) => it.tables.forEach((t) => assert.ok(MAP.tables[t.id], it.id + ' names missing table ' + t.id)));
});

test('every source an item or claim cites is listed', () => {
  K.build.ITEMS.forEach((it) => it.sources.forEach((s) => assert.ok(K.build.SOURCES[s], it.id + ' cites ' + s)));
  K.build.CLAIMS.forEach((c) => c.src.forEach((s) => assert.ok(K.build.SOURCES[s], c.id + ' cites ' + s)));
});

test('map facts come from the file: 21 psi Normal, 18 psi ECO, Final 23.4, AFM ends at 10,000 Hz', () => {
  const F = K.build.mapFacts(MAP);
  assert.equal(F.normalPeak, 21);
  assert.equal(F.ecoPeak, 18);
  assert.equal(F.finalPeak, 23.4);
  assert.equal(F.diMax, 18000);
  assert.deepEqual(F.afm.factory, { hz: 10000, gs: 275 });
  assert.ok(F.afm.prl.gs > F.afm.factory.gs && F.afm.won.gs > F.afm.prl.gs);
  // 300 whp needs about 267 g/s: inside the factory curve, but within 3 % of its end
  assert.ok(K.build.airFor(300) > 0.95 * F.afm.factory.gs && K.build.airFor(300) < F.afm.factory.gs);
});

test('real hard-pull drive: free-flowing bolt-ons first, 24 psi locked by the turbo and the map, big turbo and catless ruled out', () => {
  const P = K.build.plan(pulls, MAP);
  assert.deepEqual(P.now.map((r) => r.item.id), ['ic', 'dpCat']);
  const m24 = P.later.find((r) => r.item.id === 'map24');
  assert.ok(m24.locks.includes('turbo') && m24.locks.includes('final'));
  assert.match(K.build.lockText('turbo', pulls.ins, P.facts), /wastegate 2\.7 % open at 19\.9 psi/);
  assert.deepEqual(P.no.map((r) => r.item.id).sort(), ['bigTurbo', 'catless']);
});

test('PRL Race preset on a street housing reads ~1.3-1.4x the air: trims would need -23 to -30 %, your real trims stay inside ±5 %', () => {
  const rows = K.build.afmCompare(MAP);
  assert.equal(rows.length, 4);
  rows.forEach((r) => { assert.ok(r.ratio >= 1.29 && r.ratio <= 1.43, r.hz + ' ratio ' + r.ratio); assert.ok(r.trim <= -20, r.hz + ' trim ' + r.trim); });
  assert.ok(Math.abs(pulls.ins.trims.worst) < 5);
});

test('items that need a how-to carry steps', () => {
  ['ic', 'dpCat'].forEach((id) => assert.ok(K.build.ITEMS.find((i) => i.id === id).steps.length >= 3, id));
});

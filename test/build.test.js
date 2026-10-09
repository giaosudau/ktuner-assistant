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

// Downpipe fix-spec, Wave 1 B: the build text matches the research (tickets 02, 03, 05, 06, 08).
const item = (id) => K.build.ITEMS.find((i) => i.id === id);
const claim = (id) => K.build.CLAIMS.find((c) => c.id === id);

test('dpCat: only the rear O2 sits in the pipe, B2 rows from the log in all three tunes, factory-ECU vendor gain', () => {
  const dp = item('dpCat');
  const all = [dp.change].concat(dp.steps).join(' ');
  assert.match(dp.steps[0], /rear O2/);
  assert.doesNotMatch(all, /A\/F sensor (now )?sits in/);
  const ids = dp.tables.map((t) => t.id);
  assert.ok(!ids.includes('Final_Boost_Target_H'), 'Final Boost Target is not a downpipe table');
  for (const n of [1, 2, 3]) for (const c of ['L', 'H']) assert.ok(ids.includes('Boost_Target_' + n + '_Normal_' + c), 'tune ' + n + ' ' + c);
  assert.doesNotMatch(JSON.stringify(dp), /2,500-3,250/, 'rows come from where overshoot was logged');
  assert.equal(dp.gain, '+12 whp / +13 lb-ft on the factory ECU (27WON vendor dyno; a first CVT test gave +7 / +11)');
});

test('vendor claims carry vendor confidence: dp12 partly/low, hondata vendor-true without "on the CVT"', () => {
  assert.equal(claim('dp12').verdict, 'partly');
  assert.equal(claim('dp12').conf, 'low');
  assert.match(claim('dp12').note, /vendor/i);
  assert.equal(claim('hondata').verdict, 'true');
  assert.match(claim('hondata').note, /vendor/i);
  assert.doesNotMatch(claim('hondata').claim, /CVT/);
  assert.match(claim('turbo21').note, /≤ 19\.9 psi/);
});

test('map24 is a vendor file: 191 whp is Map 3 only, limited for engine and transmission', () => {
  const m = item('map24');
  assert.equal(m.title, '24 psi vendor file (TSP Map 3 / Phearable L3)');
  assert.match(m.gain, /Map 3 only/);
  assert.match(m.gain, /output limited for engine and transmission/);
  assert.doesNotMatch(m.gain, /all maps|for the CVT/);
});

test('catless risks the tailpipe test and a fine, not a sure đăng kiểm fail', () => {
  const c = item('catless');
  assert.match(c.change, /risks the tailpipe test \+ 65–75 M VND fine/);
  assert.doesNotMatch(c.change, /fails/);
});

test('the headroom blocker says the turbo is near its limit, in both languages', () => {
  const fs = require('fs'), vm = require('vm');
  const window = {};
  vm.createContext(window); window.window = window;
  vm.runInContext(fs.readFileSync(__dirname + '/../engine/text/i18n.js', 'utf8'), window);
  vm.runInContext(fs.readFileSync(__dirname + '/../engine/text/i18n-drive.js', 'utf8'), window);
  const I = { boost: { peakBoost: 19.9, wgAtPeak: 2.7 } };
  const en = window.KTA_I18N.en.drive.blockers.headroom(I, K.fmt);
  const vi = window.KTA_I18N.vi.drive.blockers.headroom(I, K.fmt);
  assert.match(en, /the turbo is near its limit/);
  assert.doesNotMatch(en, /has headroom/);
  assert.match(vi, /gần giới hạn/);
  assert.doesNotMatch(vi, /còn dư/);
});

test('items that need a how-to carry steps', () => {
  ['ic', 'dpCat'].forEach((id) => assert.ok(K.build.ITEMS.find((i) => i.id === id).steps.length >= 3, id));
});

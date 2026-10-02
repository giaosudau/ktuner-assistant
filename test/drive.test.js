'use strict';
// The drive check on the owner's three real KTuner TunerView logs (data/example-*.js).
// Run with: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('zlib');
const K = require('../engine/kta-drive.js');

const IDS = ['aug30-1601', 'aug30-1529', 'sep01-0813', 'sep05-0756', 'aug30-1509', 'aug22-0950'];
IDS.forEach((id) => require('../data/example-' + id + '.js'));
const csv = (id) => zlib.gunzipSync(Buffer.from(globalThis.KTA_EXAMPLES[id].gz, 'base64')).toString('utf8');
const cache = {};
const drive = (id) => (cache[id] = cache[id] || (() => { const log = K.readLog(csv(id)); return { log, report: K.checkDrive(log) }; })());
const check = (an, id) => an.gates.flatMap((g) => g.checks).find((c) => c.id === id);
const hot = () => drive('aug30-1601');     // 16:01, 52 min of hot afternoon traffic
const pulls = () => drive('aug30-1529');   // 15:29, eight hard pulls to 19 psi
const cool = () => drive('sep01-0813');    // 08:13, cool morning

test('TunerView channels: boost ahead of the throttle, MAP, DIFP pair, throttle command; no pedal from the g-sensor', () => {
  const p = K.parseCSV(csv('aug30-1529'));
  const map = K.detectChannels(p.headers, p.columns);
  const name = (k) => p.headers[map[k]];
  assert.equal(name('boost'), 'Turbo Pressure (PSI)');
  assert.equal(name('boostTarget'), 'Turbo Pressure Target (PSI)');
  assert.equal(name('map'), 'MAP (PSI)');
  assert.equal(name('fp'), 'DIFP');
  assert.equal(name('fpTarget'), 'DIFP Target');
  assert.equal(name('tpsCmd'), 'TPS Command (%)');
  assert.equal(name('tps'), 'TPS (%)');
  assert.equal(name('afr'), 'O2 (AFR)');
  assert.equal(name('iat'), 'IAT (Celsius)');
  assert.equal(name('iat2'), 'IAT2 (Celsius)');
  assert.equal(name('cvt'), 'Transmission Temperature (Celsius)');
  assert.equal(name('kControl'), 'Knock Control (%)');
  assert.equal(name('wgPos'), 'EWG Position (%)');
  assert.equal(name('gear'), 'Gear');
  assert.equal(name('stft'), 'STFT B1 (%)');
  assert.deepEqual(map.knock.map((i) => p.headers[i]), ['Knock Retard (deg)']);
  assert.equal(map.pedal, undefined, 'the Acceleration channel is not the pedal');
});

test('glitch filter: impossible values are removed and counted, the O2 lean stop is set apart', () => {
  const { log } = hot();
  assert.ok(log.glitches.knock > 0, 'the 127.5 deg knock readings are counted');
  assert.ok(log.knock.every((v) => !(v > 30)), 'no knock retard over 30 deg is left');
  assert.ok(log.boost.every((v) => !(v > 45)), 'no 52 psi boost spikes are left');
  assert.ok(log.capped.afr > 1000, 'fuel-cut samples at the sensor lean stop are counted apart');
  assert.ok(log.lam.every((v) => !(v >= 1.9)));
  const { log: l2 } = pulls();
  assert.ok(l2.gear.every((v) => !(v > 9)), 'gear 136/137 glitches removed');
  assert.equal(l2.units.map, 'psi gauge converted to kPa absolute');
  assert.ok(Math.abs(K.util.median(l2.load) - K.util.median(Array.from(K.parseCSV(csv('aug30-1529')).columns[5]))) < 0.2, 'load is MAP in psi gauge');
});

test('analyze on real logs: no false Stops, Honda knock semantics, mixture judged against the map', () => {
  const an = hot().report.an;
  assert.equal(an.verdict, 'watch');
  assert.ok(an.events.length >= 2, 'pulls found from boost, not from a TPS that never passes 80 %');
  const knock = check(an, 'knock');
  assert.equal(knock.status, 'good');
  assert.equal(knock.data.scheduled, true, 'a steady ~5 deg under boost is scheduled retard');
  const kc = check(an, 'kControl');
  assert.equal(kc.status, 'watch');
  assert.ok(kc.data.rise >= 0.1 && kc.data.peak >= 0.62, 'Knock Control climbed in this drive');
  const wot = check(an, 'wotAfr');
  assert.equal(wot.data.noCmd, true);
  assert.equal(wot.status, 'good', 'richer than the map is the safe side');
  assert.ok(wot.data.measured > 9.8 && wot.data.measured < 10.8 && wot.data.target === 11);
  assert.ok(check(an, 'fuelPress').value >= 0.95, 'DI pressure holds its target');
  assert.equal(cool().report.an.verdict, 'good');
  const p = pulls().report.an;
  assert.notEqual(check(p, 'overshoot').status, 'stop', 'a part-throttle tip-in is not overshoot');
  assert.ok(!p.gates.some((g) => g.status === 'stop'));
});

test('insights: lugging raised Knock Control on the hot drive', () => {
  const I = hot().report.ins;
  assert.ok(I.lug.share > 5.5 && I.lug.share < 8.5, 'about 7 % of moving time lugging: ' + I.lug.share);
  const rises = I.kc.episodes.filter((e) => e.kind === 'rise' && e.cause === 'lugging');
  assert.ok(rises.length >= 1);
  assert.ok(rises[0].from <= 0.5 && rises[0].to >= 0.62, 'first rise 0.49 -> 0.65');
  assert.ok(rises[0].rpm < 1700, 'at lugging rpm');
  assert.ok(I.kc.lugUpSteps / I.kc.upSteps >= 0.6, 'most steps up happened while lugging');
  assert.equal(I.boost.headroom, 'small', 'the wastegate is nearly shut at peak boost');
  assert.ok(I.trims.ok, 'trims within 5 %: no AFM change needed');
  assert.ok(I.mix.richBy >= 0.5, 'full load runs richer than the map asks');
  // and the counter-evidence: on the pull drive Knock Control fell while revs were higher
  const fall = pulls().report.ins.kc.episodes.find((e) => e.kind === 'fall');
  assert.ok(fall && fall.cause === 'revs' && fall.rpm >= 1800);
});

test('insights: the feel, measured the same way every time', () => {
  const b = pulls().report.ins.accel.best['50-70'];
  assert.ok(b.full, 'foot down');
  assert.ok(b.seconds > 1.6 && b.seconds < 2.0, '50-70 km/h in about 1.8 s: ' + b.seconds);
  assert.ok(b.mapMax >= 18);
});

test('the queue: safety first, then the biggest effect for the least work; the same log gives the same list', () => {
  const P = hot().report.plan;
  assert.equal(P.now[0].id, 'revs', 'free habit with the biggest effect first');
  const next = P.next.map((a) => a.id);
  for (const id of ['cooldown', 'cvtHeat', 'data']) assert.ok(next.includes(id), id);
  assert.ok(next.indexOf('data') < next.indexOf('heatHw'), 'minutes before an hour');
  const later = Object.fromEntries(P.later.map((a) => [a.id, a.blockedBy]));
  assert.deepEqual(later.richWot, ['data'], 'the rich-WOT question waits for the AFR command channel');
  assert.deepEqual(later.lowBoost, ['revs'], 'the flash waits for the free fix');
  assert.ok(later.moreBoost.includes('headroom') && later.moreBoost.includes('kc'));
  assert.ok(P.fine.some((f) => f.id === 'afm'));
  assert.equal(cool().report.plan.now[0].id, 'data');
  assert.ok(cool().report.plan.next.some((a) => a.id === 'hotLog'), 'a cool drive asks for a hot one');
  assert.equal(pulls().report.plan.now[0].id, 'cooldown');
  const again = K.checkDrive(K.readLog(csv('aug30-1601')));
  assert.equal(JSON.stringify(again.plan), JSON.stringify(hot().report.plan), 'deterministic');
});

test('the queue: while anything says Stop, only safety work is open, worst first', () => {
  const r = K.checkDrive(K.readLog(K.sampleCsv('hot')));
  assert.equal(r.plan.now[0].id, 'fix:knock');
  assert.ok(r.plan.next.every((a) => a.tier === 'safety'));
  assert.ok(r.plan.later.filter((a) => !a.gain).every((a) => a.blockedBy.includes('safety')));
  const healthy = K.checkDrive(K.readLog(K.sampleCsv('after')));
  assert.ok(healthy.plan.next.some((a) => a.id === 'moreBoost'), 'gain levers open on a proven-healthy car');
});

test('the queue: the free fix unlocks the flash only after it was tried', () => {
  const P = K.planActions(hot().report, [{ id: 'revs', verdict: 'partial' }]);
  assert.ok(P.now.concat(P.next).some((a) => a.id === 'lowBoost'));
  const back = K.planActions(hot().report, [{ id: 'revs', verdict: 'keep' }]);
  assert.equal(back.now[0].id, 'revs', 'a kept habit that shows up again stays on the list');
  assert.equal(back.now[0].again, true);
});

test('proof: a cooler or a highway drive cannot prove a heat or knock fix', () => {
  const a = hot().report;
  const r1 = K.proveAction('revs', a, cool().report);
  assert.equal(r1.verdict, 'inconclusive');
  assert.deepEqual(r1.matched.reasons, ['cooler']);
  const r2 = K.proveAction('revs', a, pulls().report);
  assert.equal(r2.verdict, 'inconclusive');
  assert.ok(r2.matched.reasons.includes('lessTown'));
  assert.ok(K.proveAction('richWot', a, pulls().report).matched.reasons.includes('noData'));
  assert.equal(K.proveAction('data', a, a).verdict, 'retry');
  assert.equal(K.proveAction('cooldown', a, pulls().report).verdict, 'keep', 'pulls started cooler');
});

test('proof: a new Stop means undo a flash, or stop and fix for a habit', () => {
  const before = K.checkDrive(K.readLog(K.sampleCsv('after')));
  const after = K.checkDrive(K.readLog(K.sampleCsv('hot')));
  const flash = K.proveAction('afm', before, after), habit = K.proveAction('revs', before, after);
  assert.ok(flash.newStops.length > 0);
  assert.equal(flash.verdict, 'undo');
  assert.equal(habit.verdict, 'stop');
});

test('proof: the stored snapshot proves exactly like the full report', () => {
  const a = hot().report;
  const snap = JSON.parse(JSON.stringify(K.proofSnapshot(a)));
  assert.ok(JSON.stringify(snap).length < 4000, 'small enough for localStorage');
  for (const id of K.ACTION_IDS) {
    for (const b of [cool().report, pulls().report]) assert.equal(JSON.stringify(K.proveAction(id, snap, b)), JSON.stringify(K.proveAction(id, a, b)), id);
  }
});

test('reference check: taking boost out below 3,000 rpm is allowed, adding it is not', () => {
  const cut = K.REF.boost.normal.map((row, r) => row.map((v, c) => (K.REF.boost.rpm[r] >= 1250 && K.REF.boost.rpm[r] <= 2000 && c >= 10 ? v - 2 : v)));
  assert.equal(K.referenceChecks({ boostValues: cut }).find((c) => c.id === 'boostLow').status, 'good');
  const add = K.REF.boost.normal.map((row, r) => row.map((v) => (K.REF.boost.rpm[r] === 2000 ? v + 1 : v)));
  assert.equal(K.referenceChecks({ boostValues: add }).find((c) => c.id === 'boostLow').status, 'stop');
});

test('graph view models: finite geometry on every example', () => {
  for (const id of ['aug30-1601', 'aug30-1529', 'sep01-0813']) {
    const I = drive(id).report.ins;
    const views = [K.view.kcTimeline(I), K.view.timingMap(I), K.view.afrLoad(I), K.view.accelBars(I)];
    for (const v of views) {
      assert.ok(v.hasData, id);
      assert.ok(!/NaN|Infinity|undefined/.test(JSON.stringify(v)), id + ' ' + JSON.stringify(v).slice(0, 120));
    }
    assert.ok(K.view.timingMap(I).cells.length > 20);
  }
  // Gentle drives have no clean acceleration window, but every other view works.
  for (const id of ['sep05-0756', 'aug22-0950']) {
    const I = drive(id).report.ins;
    for (const v of [K.view.kcTimeline(I), K.view.timingMap(I), K.view.afrLoad(I), K.view.accelBars(I)]) {
      assert.ok(!/NaN|Infinity|undefined/.test(JSON.stringify(v)), id + ' ' + JSON.stringify(v).slice(0, 120));
    }
    assert.ok(K.view.kcTimeline(I).hasData && K.view.timingMap(I).hasData && K.view.afrLoad(I).hasData, id);
  }
  assert.ok(K.view.timingMap(hot().report.ins).lugBox, 'the lugging zone is outlined');
  // A 3-second log has no engineering view, but it must still render without NaNs.
  const tiny = drive('aug30-1509').report.ins;
  for (const v of [K.view.kcTimeline(tiny), K.view.timingMap(tiny), K.view.afrLoad(tiny), K.view.accelBars(tiny)]) {
    assert.ok(!/NaN|Infinity|undefined/.test(JSON.stringify(v)), 'too-short ' + JSON.stringify(v).slice(0, 120));
  }
});

// ---------------------------------------------------------------------------
// Issue 01 — log quality gate: flat and missing channels, Too-short drive.
// Every test goes through the public drive check, and asserts what the owner
// would see: the Verdict, the line verdicts, and the quality lists.
// ---------------------------------------------------------------------------

const flatSep = () => drive('sep05-0756');   // Sep 5 07:56, Turbo Pressure flat at -0.3 psi
const tinyAug = () => drive('aug30-1509');  // Aug 30 15:09, 3.6 s, never moves

function dropColumn(text, headerName) {
  const lines = text.split('\n');
  const head = lines[0].split(';');
  const at = head.findIndex((h) => h.trim() === headerName);
  assert.ok(at >= 0, 'column present: ' + headerName);
  return lines.map((l) => { const c = l.split(';'); c.splice(at, 1); return c.join(';'); }).join('\n');
}

test('issue 01: a flat Turbo Pressure turns only its own lines Can\'t tell', () => {
  const { report } = flatSep();
  assert.equal(report.verdict, 'good', 'overall Verdict OK');
  assert.equal(report.an.verdict, 'good');
  for (const id of ['overshoot', 'undershoot', 'lowBoost']) {
    assert.equal(check(report.an, id).status, 'nodata', id + ' is Can\'t tell');
  }
  assert.ok(report.ins.quality.flat.includes('boost'), 'Turbo Pressure listed as flat: ' + report.ins.quality.flat);
  assert.equal(report.ins.boost.peakBoost, null, 'no fake peak boost from a dead channel');
  assert.equal(report.ins.boost.peakTarget, null);
});

test('issue 01: a 3.6-second log is Can\'t tell, too short', () => {
  const { log, report } = tinyAug();
  assert.ok(report.ins.meta.movingSeconds < 60, 'under 60 s moving: ' + report.ins.meta.movingSeconds);
  assert.equal(report.verdict, 'nodata');
  assert.equal(report.an.verdict, 'nodata');
  assert.equal(report.an.cantTell && report.an.cantTell.reason, 'tooShort');
  assert.equal(report.plan.now.length, 0, 'no actions on a drive that cannot be judged');
});

test('issue 01: a missing Safety channel makes the drive Can\'t tell and names it', () => {
  const full = csv('aug30-1601');
  const cases = [['O2', 'mixture'], ['Knock Control', 'score'], ['DIFP', 'fuelPressure']];
  for (const [header, name] of cases) {
    const r = K.checkDrive(K.readLog(dropColumn(full, header)));
    assert.equal(r.verdict, 'nodata', header + ' removed');
    assert.equal(r.an.cantTell && r.an.cantTell.reason, 'safetyChannels');
    assert.ok(r.an.cantTell.channels.includes(name), name + ' named: ' + r.an.cantTell.channels);
  }
  const noTrims = K.checkDrive(K.readLog(dropColumn(dropColumn(full, 'STFT B1'), 'LTFT B1')));
  assert.equal(noTrims.verdict, 'nodata');
  assert.ok(noTrims.an.cantTell.channels.includes('trims'));
});

test('issue 01: the engine\'s internal status names never reach the screen', () => {
  const fs = require('fs');
  const window = {};
  const vm = require('vm');
  vm.createContext(window);
  window.window = window;
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n.js', 'utf8'), window);
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n-drive.js', 'utf8'), window);
  for (const lang of ['en', 'vi']) {
    const T = window.KTA_I18N[lang];
    assert.deepEqual([T.status.good, T.status.watch, T.status.stop, T.status.nodata], lang === 'en' ? ['OK', 'Watch', 'Stop', "Can't tell"] : ['Ổn', 'Theo dõi', 'Dừng', 'Không kết luận được']);
    assert.equal(T.verdict.good, lang === 'en' ? 'OK' : 'Ổn');
    assert.ok(T.verdict.nodata.indexOf(lang === 'en' ? "Can't tell" : 'Không kết luận được') === 0, lang + ' verdict nodata: ' + T.verdict.nodata);
    // Every safety line on every fixture renders a label, a number and a fix in both languages.
    for (const id of ['aug30-1601', 'sep05-0756', 'aug22-0950']) {
      const an = drive(id).report.an;
      for (const g of an.gates) for (const c of g.checks) {
        const d = T.checks[c.id];
        assert.ok(d, lang + ' text for check ' + c.id);
        const s = d.display(c.data || {}, K.fmt) + ' ' + (c.status === 'good' || c.status === 'nodata' ? '' : d.fix(c.data || {}, K.fmt));
        assert.ok(!/\bgood\b|\bnodata\b/.test(s), lang + ' ' + c.id + ' leaks an engine id: ' + s.slice(0, 80));
      }
    }
    // Block 7: every flat or missing channel gets a TunerView fix step in both languages.
    const q = flatSep().report.ins.quality;
    assert.ok(q.flat.length > 0, 'flat channels listed');
    const lines = T.drive.quality(flatSep().report.ins, K.fmt, T);
    const blob = lines.join(' ');
    assert.ok(/Turbo Pressure/.test(blob), lang + ' names the flat channel: ' + blob.slice(0, 120));
    assert.ok(/TunerView/.test(blob), lang + ' gives the TunerView fix');
    assert.ok(!/\bgood\b|\bnodata\b/.test(blob), lang + ' leaks an engine id: ' + blob.slice(0, 120));
  }
});

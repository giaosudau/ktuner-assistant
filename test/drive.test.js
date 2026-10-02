'use strict';
// The drive check on the owner's three real KTuner TunerView logs (data/example-*.js).
// Run with: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('zlib');
const K = require('../engine/kta-drive.js');

const IDS = ['aug30-1601', 'aug30-1529', 'sep01-0813', 'sep05-0756', 'aug30-1509', 'aug22-0950', 'aug22-0903', 'aug23-1959', 'aug23-2038'];
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
  assert.ok(kc.data.peak >= 0.62 && kc.data.peak - kc.data.start >= 0.1, 'Knock Control climbed in this drive');
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

// ---------------------------------------------------------------------------
// Issue 02 — evidence-based limits (fact-check.md wins on every number).
// ---------------------------------------------------------------------------

function cloneLog(log, fn) {
  const out = Object.assign({}, log, { has: Object.assign({}, log.has) });
  for (const k of Object.keys(log)) {
    if (log[k] instanceof Float64Array) out[k] = Float64Array.from(log[k]);
    else if (log[k] instanceof Uint8Array) out[k] = Uint8Array.from(log[k]);
  }
  fn(out);
  return out;
}
// A short, honest cruise: 20 s of reference driving, then lugging. Cool, calm,
// gentle — only the reference band is short, so lugging timing stays hidden.
function tinyCruiseCsv() {
  const head = 'Time,Engine Speed (rpm),Vehicle Speed (km/h),Throttle Position (%),MAP (kPa),O2 (AFR),ECT (C),IAT (C),Knock Control,STFT B1 (%),LTFT B1 (%),Ignition Timing (deg),DIFP,DIFP Target';
  const rows = [head];
  let t = 0;
  const push = (rpm, vss, tps, map, afr, ect, iat, kc, stft, ltft, ign, fp, fpT) => rows.push([t.toFixed(1), rpm, vss, tps, map, afr, ect, iat, kc, stft, ltft, ign, fp, fpT].join(','));
  for (let i = 0; t < 20; i++, t += 0.1) push(2400 + (i % 5) * 8, 60 + (i % 3), 22 + (i % 2), 100 + (i % 3) * 0.4, 14.6 + (i % 2) * 0.1, 88 + (i % 2), 36 + (i % 2), 0.49 + (i % 2) * 0.01, (i % 5) * 0.2, (i % 3) * 0.1, 30 + (i % 2), 3000 + (i % 5) * 40, 3050 + (i % 3) * 30);
  for (let i = 0; t < 140; i++, t += 0.1) push(1400 + (i % 7) * 6, 45 + (i % 2), 28 + (i % 2), 95 + (i % 3) * 0.4, 14.6 + (i % 2) * 0.1, 89 + (i % 2), 37 + (i % 2), 0.49 + (i % 2) * 0.01, (i % 5) * 0.2, (i % 3) * 0.1, 22 + (i % 2), 2900 + (i % 5) * 40, 2950 + (i % 3) * 30);
  return rows.join('\n');
}

test('issue 02: the score is judged by the timing it costs under boost', () => {
  const an = hot().report.an;
  const kc = check(an, 'kControl');
  assert.equal(kc.status, 'watch', 'Aug 30 16:01 ends 0.64: Watch');
  assert.equal(kc.data.noHard, false, 'not "no hard driving": the score moved through 0.62, never held it');
  assert.ok(Math.abs(kc.data.timingCost - 1.5) < 0.15, 'costs about 1.5°: ' + kc.data.timingCost);
  assert.ok(/costs about 1\.5/.test(kc.display), 'the line says what it costs: ' + kc.display);
});

test('issue 02: a cool morning shows OK with no timing-cost line', () => {
  const an = cool().report.an;
  assert.equal(an.verdict, 'good');
  const kc = check(an, 'kControl');
  assert.equal(kc.status, 'good');
  assert.ok(!/costs about/.test(kc.display), 'ends 0.49: nothing to show: ' + kc.display);
});

test('issue 02: hot intake alone is a Watch, never a Stop', () => {
  const an = drive('aug22-0950').report.an;
  assert.equal(check(an, 'iat').status, 'watch', 'intake 64 °C with a 0.50 score');
  assert.equal(an.verdict, 'watch');
});

test('issue 02: healthy drives carry no mixture Watch/Stop, no slip, no torque line', () => {
  for (const id of ['aug30-1601', 'aug30-1529', 'sep01-0813', 'sep05-0756', 'aug22-0950']) {
    const an = drive(id).report.an;
    assert.ok(['good', 'nodata'].includes(check(an, 'wotAfr').status), id + ' mixture: ' + check(an, 'wotAfr').status);
    const slip = check(an, 'slip');
    assert.ok(slip, id + ' has a slip line');
    assert.equal(slip.status, slip.status === 'nodata' ? 'nodata' : 'good', id + ' slip: ' + slip.status + ' ' + JSON.stringify(slip.data));
    assert.equal(check(an, 'torque'), undefined, id + ' has no torque line');
  }
});

test('issue 02: lean at full boost, held, is a Stop; lean part-load is nothing', () => {
  const { log } = pulls();
  const lean = cloneLog(log, (l) => {
    // Hold 12.0 AFR for a full second inside the biggest pull, at 12 psi and up.
    let best = null;
    for (let i = 0; i < l.n; i++) if (l.load[i] >= 15 && (!best || l.load[i] > l.load[best])) best = i;
    assert.ok(best != null, 'a pull to lean out');
    for (let i = best; i < Math.min(l.n, best + 12) && l.load[i] >= 12; i++) l.lam[i] = 12.0 / 14.7;
  });
  const stop = K.checkDrive(lean).an;
  const wot = check(stop, 'wotAfr');
  assert.equal(wot.status, 'stop', '12.0 held at 12 psi and up: ' + wot.display);
  assert.ok(/not arriving/.test(wot.fix), 'the Stop says the fuel is not arriving: ' + wot.fix);
  const part = cloneLog(log, (l) => {
    for (let i = 0; i < l.n; i++) if (l.load[i] >= 4 && l.load[i] < 8) l.lam[i] = 12.5 / 14.7;
  });
  assert.ok(['good', 'nodata'].includes(check(K.checkDrive(part).an, 'wotAfr').status), '12.5 AFR at 6 psi is outside the full-load rule');
});

test('issue 02: CVT slip is a Watch, never a Stop, and needs all four channels', () => {
  const { log } = pulls();
  const slipped = cloneLog(log, (l) => {
    let at = -1;
    for (let i = 0; i < l.n; i++) if (l.load[i] >= 10 && l.tpsCmd[i] >= 60 && l.vss[i] > 40) { at = i; break; }
    assert.ok(at > 0, 'boosted cruising to slip in');
    // A real slip is abrupt and held: revs jump and stay up while speed stands still.
    l.rpm[at + 1] = l.rpm[at] + 300; l.rpm[at + 2] = l.rpm[at] + 300;
    l.vss[at + 1] = l.vss[at]; l.vss[at + 2] = l.vss[at];
  });
  const an = K.checkDrive(slipped).an;
  assert.equal(check(an, 'slip').status, 'watch', 'revs jump 300 rpm with no speed under boost');
  assert.ok(!an.gates.some((g) => g.checks.some((c) => c.id === 'slip' && c.status === 'stop')), 'slip is Watch-only');
});

test('issue 02: "no hard driving" fires only when a high score holds from the start', () => {
  const { log } = cool();
  const stuck = cloneLog(log, (l) => {
    for (let i = 0; i < l.n && l.t[i] < 400; i++) l.kControl[i] = i % 10 < 7 ? 0.65 : 0.66;
  });
  const kc = check(K.checkDrive(stuck).an, 'kControl');
  assert.equal(kc.status, 'watch');
  assert.equal(kc.data.noHard, true, 'starts 0.65 and holds it');
  assert.ok(/No hard driving until it drops/.test(kc.display), kc.display);
});

test('issue 02: timing lost while lugging stays hidden when small or short', () => {
  const lug1601 = hot().report.ins.lug;
  assert.ok(lug1601.ignDeltaShown != null && lug1601.ignDeltaShown >= 1, 'Aug 30 16:01 shows a real loss: ' + lug1601.ignDeltaShown);
  const tiny = K.checkDrive(K.readLog(tinyCruiseCsv()));
  assert.equal(tiny.verdict, 'good', 'the short cruise is otherwise healthy: ' + tiny.verdict);
  assert.equal(tiny.ins.lug.ignDeltaShown, null, 'reference band under 30 s: no loss shown');
});

test('issue 02: every safety line states its basis in one line, EN+VI', () => {
  const fs = require('fs'), vm = require('vm');
  const window = {};
  vm.createContext(window); window.window = window;
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n.js', 'utf8'), window);
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n-drive.js', 'utf8'), window);
  const seen = new Set();
  for (const id of ['aug30-1601', 'sep01-0813']) {
    const an = drive(id).report.an;
    for (const g of an.gates) for (const c of g.checks) {
      assert.ok(c.basis && ['data', 'primary', 'physics', 'judgement', 'provisional'].includes(c.basis.t), c.id + ' carries a basis');
      seen.add(c.id + ':' + c.basis.t);
      for (const lang of ['en', 'vi']) {
        const line = window.KTA_I18N[lang].drive.basisLine(c.basis);
        assert.ok(line.length > 10, lang + ' ' + c.id);
        if (c.basis.t === 'provisional') assert.ok(/provisional|tạm thời|chưa từng/i.test(line), lang + ' provisional says so: ' + line);
      }
    }
  }
  assert.ok([...seen].some((s) => /provisional/.test(s)), 'a provisional limit is exercised: ' + [...seen].join(','));
});

test('issue 02: the app answers E10 and the 21 psi map with the car\'s own numbers', () => {
  const fs = require('fs');
  const en = fs.readFileSync(__dirname + '/../app/i18n.js', 'utf8');
  assert.ok(!/2-4 ?% positive|2–4 ?% positive/.test(en), 'the refuted +3% E10 trim offset is gone');
  assert.ok(/-0\.8 ?%/.test(en), 'cruise median trim −0.8% is quoted');
  assert.ok(/0\.69|0\.73/.test(en), 'under-boost lambda vs target is quoted');
  assert.ok(!/no knock margin/i.test(en), 'Starter 21 is no longer said to have no margin');
});

// ---------------------------------------------------------------------------
// Issue 07 — hot restart and high-start score.
// ---------------------------------------------------------------------------

function msOf(name) { return K.parseDriveStart(name).getTime(); }
const START_1529 = msOf('TunerView_20260830_152931.csv');
const START_1601 = msOf('TunerView_20260830_160151.csv');
const driveWithPrev = (id, prevEndMs, startMs) => {
  const log = K.readLog(csv(id));
  return K.checkDrive(log, { driveStartMs: startMs, prevEndMs });
};
const endMs = (id, startMs) => startMs + drive(id).log.duration * 1000;

test('issue 07: a hot restart is detected from the previous drive and the intake', () => {
  assert.ok(K.parseDriveStart('TunerView_20260830_160151.csv') instanceof Date);
  assert.equal(msOf('TunerView_20260830_160151.csv'), new Date(2026, 7, 30, 16, 1, 51).getTime());
  assert.equal(K.parseDriveStart('random.csv'), null);
  // Aug 30 15:29 ended 13 min before 16:01 started at intake 64 °C: hot restart.
  const r = driveWithPrev('aug30-1601', endMs('aug30-1529', START_1529), START_1601);
  assert.equal(r.ins.hotRestart.isRestart, true);
  assert.ok(r.ins.hotRestart.gapMin > 10 && r.ins.hotRestart.gapMin < 15, 'gap: ' + r.ins.hotRestart.gapMin);
  assert.equal(r.ins.hotRestart.advice, true, 'first hard pull at 82 s started at 60 °C');
  // With no previous drive, intake 64 °C alone is enough.
  assert.equal(K.checkDrive(K.readLog(csv('aug30-1601')), { driveStartMs: START_1601 }).ins.hotRestart.isRestart, true);
  // 15:29 is a hot restart too, but its first hard pull started 13 min in: gentle, fine.
  const gentle = driveWithPrev('aug30-1529', msOf('TunerView_20260830_150925.csv') + 4000, START_1529);
  assert.equal(gentle.ins.hotRestart.isRestart, true);
  assert.equal(gentle.ins.hotRestart.advice, false);
  assert.ok(gentle.plan.fine.some((f) => f.id === 'hotRestart'), 'gentle hot restarts list as fine');
  // A cool start is no hot restart.
  assert.equal(cool().report.ins.hotRestart.isRestart, false);
});

test('issue 07: the hot-restart advice is proven by a cool-starting next pull', () => {
  const before = driveWithPrev('aug30-1601', endMs('aug30-1529', START_1529), START_1601);
  assert.ok(before.plan.next.concat(before.plan.now).some((a) => a.id === 'hotRestart'), 'advice is an action');
  const cooled = cloneLog(before.log || K.readLog(csv('aug30-1601')), (l) => {
    for (let i = 0; i < l.n; i++) if (l.t[i] > 60 && l.t[i] < 140) l.iat[i] = 46 + (i % 2);
  });
  const after = K.checkDrive(cooled, { driveStartMs: START_1601 + 86400000, prevEndMs: START_1601 + 86400000 - 10 * 60000 });
  assert.equal(after.ins.hotRestart.isRestart, true);
  assert.ok(after.ins.hotRestart.firstPull && after.ins.hotRestart.firstPull.iat0 <= 48, 'next first pull starts cool: ' + JSON.stringify(after.ins.hotRestart.firstPull));
  assert.equal(K.proveAction('hotRestart', before, after).verdict, 'keep');
  const stillHot = K.checkDrive(K.readLog(csv('aug30-1601')), { driveStartMs: START_1601 + 86400000, prevEndMs: START_1601 + 86400000 - 10 * 60000 });
  assert.equal(K.proveAction('hotRestart', before, stillHot).verdict, 'retry');
  assert.equal(K.proveAction('hotRestart', before, cool().report).verdict, 'inconclusive', 'a non-hot-restart proves nothing');
});

test('issue 07: a score that starts high gets its sentence, in both languages', () => {
  const { log } = cool();
  const high = cloneLog(log, (l) => {
    for (let i = 0; i < l.n && l.t[i] < 500; i++) l.kControl[i] = i % 10 < 7 ? 0.61 : 0.62;
  });
  const kc = K.checkDrive(high).an.gates.flatMap((g) => g.checks).find((c) => c.id === 'kControl');
  assert.equal(kc.data.highStart, true, 'starts 0.61 above the 0.49 baseline');
  assert.ok(/Starts high after a Flash/.test(kc.display), kc.display);
  const fs = require('fs'), vm = require('vm');
  const window = {};
  vm.createContext(window); window.window = window;
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n.js', 'utf8'), window);
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n-drive.js', 'utf8'), window);
  assert.ok(/10–15 calm minutes/.test(window.KTA_I18N.en.checks.kControl.display(kc.data, K.fmt)));
  assert.ok(/10–15 phút/.test(window.KTA_I18N.vi.checks.kControl.display(kc.data, K.fmt)));
});

// ---------------------------------------------------------------------------
// Ticket 02 — the false alarms (owner-voices.md §4, tuner-play-panel.md T1).
// Every assertion is on what the owner would see: the line's Verdict word, its
// numbers, the ranked actions and the Flash plan. Never internals.
// ---------------------------------------------------------------------------

// A score raised above 5,200 rpm, on the owner's own 15:29 pull drive: the top
// of one pull is held past 5,200 rpm and the Fuel-quality score sits at 0.70
// there, which is what the non-Si ECU does on purpose (owner-voices.md §3).
// Only the score and the revs move; everything else is the real log.
function scoreAboveHighRpm(log, value, t0, t1) {
  return cloneLog(log, (l) => {
    for (let i = 0; i < l.n; i++) {
      if (l.t[i] < t0 || l.t[i] > t1) continue;
      l.rpm[i] = Math.max(l.rpm[i], K.DRIVE_LIMITS.kcHighRpm + 400);
      l.kControl[i] = value;
    }
  });
}
// 15:29 has a pull that reaches 5,095 rpm at 929 s: hold 5,600 rpm and a raised
// score across that stretch of the drive.
function highRpmPull(value) {
  return scoreAboveHighRpm(pulls().log, value, 925, 945);
}
// 16:01 lugs at about 1,300 rpm: hold the top end and a raised score there.
function highRpmHot(value) {
  return scoreAboveHighRpm(hot().log, value, 900, 940);
}

test('ticket 02: a rise above 5,200 rpm is shown but never counts toward a fuel or heat verdict', () => {
  const base = pulls().report;
  assert.equal(check(base.an, 'kControl').status, 'watch', '15:29 on its own is a Watch: ' + check(base.an, 'kControl').display);
  const raised = K.checkDrive(highRpmPull(0.70));
  const kc = check(raised.an, 'kControl');
  // The rise is in the data, in full: the peak, the episodes and the chart.
  assert.ok(kc.data.peak >= 0.69, 'the peak still shows what the ECU did: ' + kc.data.peak);
  const high = raised.ins.kc.episodes.filter((e) => e.kind === 'rise' && !e.counts);
  assert.ok(high.length >= 1, 'at least one rise is marked as not counting');
  assert.ok(high.every((e) => e.episodeRpm > K.DRIVE_LIMITS.kcHighRpm), JSON.stringify(high.map((e) => e.episodeRpm)));
  assert.equal(raised.ins.kc.excludedRises, high.length);
  assert.ok(K.view.kcTimeline(raised.ins).marks.some((m) => m.counts === false), 'the chart still draws it');
  assert.ok(raised.ins.kc.judgedPeak < raised.ins.kc.peak, 'the peak the verdicts read is the lower one');
  // And the owner is told why, in plain words, not as a status name.
  assert.match(kc.display, /5,200 rpm/, kc.display);
  assert.match(kc.display, /on purpose/, kc.display);
  assert.ok(!/exempt|ignore/i.test(kc.display), kc.display);
});

test('ticket 02: the same score at the same place, below 5,200 rpm, is a real Watch', () => {
  // Same drive, same 0.70, but the revs are the ones the owner actually pulled at:
  // now it is fuel or heat, and the fuel question is asked.
  const low = scoreAboveHighRpm(pulls().log, 0.70, 925, 945);
  const kept = cloneLog(low, (l) => {
    for (let i = 0; i < l.n; i++) if (l.t[i] >= 925 && l.t[i] <= 945 && l.rpm[i] > K.DRIVE_LIMITS.kcHighRpm) l.rpm[i] = 5100;
  });
  const r = K.checkDrive(kept);
  assert.equal(check(r.an, 'kControl').status, 'watch', '0.70 under 5,200 rpm is fuel or heat: ' + check(r.an, 'kControl').display);
  assert.ok(!/5,200 rpm/.test(check(r.an, 'kControl').display), 'and no excuse is offered');
  assert.ok(r.ins.kc.episodes.filter((e) => e.kind === 'rise').every((e) => e.counts));
  assert.ok(r.plan.all.some((a) => a.id === 'fuelCheck'), '"check the fuel" is asked: ' + r.plan.all.map((a) => a.id));
});

test('ticket 02: "no hard driving" is a Watch with that sentence, and the high-rpm rule cannot remove a Stop', () => {
  const held = cloneLog(cool().log, (l) => {
    for (let i = 0; i < l.n && l.t[i] < 400; i++) l.kControl[i] = i % 10 < 7 ? 0.65 : 0.66;
  });
  const kc = check(K.checkDrive(held).an, 'kControl');
  assert.equal(kc.status, 'watch', 'never a Stop of its own: ' + kc.display);
  assert.equal(kc.data.noHard, true);
  assert.match(kc.display, /No hard driving until it drops/, kc.display);
  // A score at the Stop line reached only above 5,200 rpm: still a Stop. Engine first.
  const stop = K.checkDrive(highRpmPull(K.LIMITS.score.stop + 0.02));
  assert.equal(check(stop.an, 'kControl').status, 'stop',
    'a Stop that protects the engine is never silenced: ' + check(stop.an, 'kControl').display);
  assert.equal(stop.verdict, 'stop');
});

test('ticket 02: the fuel question and the boost lever ignore a high-rpm rise', () => {
  const raised = K.checkDrive(highRpmPull(0.70));
  assert.ok(!raised.plan.all.some((a) => a.id === 'fuelCheck'),
    'no "check the fuel" from a rise the ECU raised on purpose: ' + raised.plan.all.map((a) => a.id).join(','));
  assert.ok(!raised.plan.all.some((a) => a.id === 'lowBoost'),
    'and no boost-at-low-rpm lever proposed off it');
  // The lugging rises on 16:01 are still a Watch, and the free habit still leads.
  const hotHigh = K.checkDrive(highRpmHot(0.70));
  const lug = hotHigh.ins.kc.episodes.filter((e) => e.cause === 'lugging');
  assert.ok(lug.length >= 1 && lug.every((e) => e.counts), 'lugging rises still count');
  assert.ok(hotHigh.plan.now.concat(hotHigh.plan.next).some((a) => a.id === 'revs'),
    'keep the revs up is still on the list: ' + hotHigh.plan.all.map((a) => a.id).join(','));
});

test('ticket 02: a proof reads the rise that counts, so a high-rpm raise is not the owner\'s fault', () => {
  const before = pulls().report;
  const after = K.checkDrive(highRpmPull(0.70));
  // The raw rise went up (the ECU did it) but the rise the proof reads did not.
  assert.ok(after.ins.kc.rise > before.ins.kc.rise, 'the raw numbers still show it: ' + before.ins.kc.rise + ' to ' + after.ins.kc.rise);
  assert.equal(after.ins.kc.judgedRise, before.ins.kc.judgedRise, 'the judged rise is unchanged');
  assert.equal(K.proveAction('lowBoost', before, after).verdict, 'keep',
    'the flash is not undone for a rise the ECU asked for');
  assert.equal(K.proveAction('fuelCheck', before, after).verdict, 'keep',
    'nor is "check the fuel" left open');
  // A proof of the free habit still shows both numbers to the owner.
  const proof = K.proveAction('revs', hot().report, K.checkDrive(highRpmHot(0.70)));
  assert.equal(proof.metric.name, 'lugShare');
  assert.ok(proof.metric.kcRiseBefore != null && proof.metric.kcRiseAfter != null,
    'the proof shows its numbers: ' + JSON.stringify(proof.metric));
  // The threshold lives in the limits with its source, not in a magic number here.
  assert.equal(K.DRIVE_LIMITS.kcHighRpm, 5200);
  assert.equal(K.LIMITS.score.highRpm, 5200, 'the check line reads the same one number');
});

// ---------------------------------------------------------------------------
// Ticket 02 — checks diagnose, only the Flash plan prescribes (T1)
// ---------------------------------------------------------------------------

// Every way a remedy can name a KTuner table: the table id from the map file,
// the family name the engine and the app use, or the words for editing one.
const TABLE_WORDS = /\b(AFM[ _]Flow|WOT[ _]Enrich|Boost[ _]Target|MAF[ _]Scaling|Nominal Lambda|Ignition[ _]Base|Knock[ _]Sens|Dual[ _]Boost|Rev[ _]Limit|Cylinder[ _]Fill|TVWC|VTS)\b|\b(correct|extend|change|edit|lower|raise|pull|trim)\b[^.]*\btable\b|\bmap cell|\bcell \d|\bpaste\b/i;

// Every Drive the app can be handed: the owner's real logs and the built-in
// samples, so a remedy can never be written that the fixtures never reach.
const ALL_LOGS = () => ['aug30-1601', 'aug30-1529', 'sep01-0813', 'sep05-0756', 'aug22-0950', 'aug22-0903', 'aug23-1959', 'aug23-2038']
  .map((id) => K.readLog(csv(id)));
const ALL_SAMPLES = () => ['hot', 'after'].map((name) => K.readLog(K.sampleCsv(name)));

test('ticket 02: no check names a KTuner table, on any Drive the app can be given', () => {
  const logs = ALL_LOGS().concat(ALL_SAMPLES());
  let fixes = 0;
  logs.forEach((log, i) => {
    const an = K.checkDrive(log).an;
    for (const g of an.gates) {
      for (const c of g.checks) {
        if (!c.fix) continue;
        fixes++;
        // the KTuner table ids themselves
        for (const id of Object.keys(K.TABLES || {})) {
          assert.ok(!new RegExp('\\b' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(c.fix),
            'check ' + c.id + ' names table ' + id + ': ' + c.fix);
        }
        assert.ok(!TABLE_WORDS.test(c.fix), 'check ' + c.id + ' remedy prescribes a table: ' + c.fix);
        assert.ok(c.fix.length > 20, 'check ' + c.id + ' still says something useful: ' + c.fix);
      }
    }
  });
  assert.ok(fixes >= 3, 'the fixtures really did exercise remedies: ' + fixes);
});

test('ticket 02: the Flash plan still names the tables, and is the only thing that does', () => {
  const CAR = require('../engine/kta-car.js');
  const MAP = require('../data/ktuner-maps-digitized.json');
  const NOW = 1756723200000;
  // A trim Watch plans the AFM Flow curve, by its KTuner table id and with cells.
  const trims = [];
  for (let i = 0; i < 5; i++) trims.push({ id: 'd' + (i + 1), start: (i + 1) * 1000, trimWorst: -7, verdict: 'watch', kcEnd: 0.49 });
  const afm = CAR.carFlashPlan(CAR.carEmpty() && Object.assign(CAR.carEmpty(), { drives: trims.reduce((a, d) => (a[d.id] = Object.assign({ hardPulls: 2, boostTarget: 16, overshoot: 1, lugShare: 1, shakedown: 'none', calmSec: 700, missing: [], flat: [], duration: 900, moving: 800, cool: true, hot: false, hotRestart: false, tooShort: false, kcStart: 0.49, kcPeak: 0.49, iatMoving: 36, cvtPeak: 80, mixLeanest: 10.5, mixTarget: 11, wgAtPeak: 2.5, accel5070: null, verdict: 'watch', updatedAt: NOW }, d), a), {}) }), MAP, { now: NOW });
  assert.equal(afm.kind, 'one-family');
  assert.deepEqual(afm.tables.map((t) => t.id), ['MAF_Scaling_Custom']);
  assert.ok(afm.cells.length === 0 && afm.afmPasteRow, 'the paste-ready row the owner types into KTuner');
  // An overshoot Watch plans the six boost targets, again by id and cell.
  const overs = [];
  for (let i = 0; i < 5; i++) overs.push({ id: 'e' + (i + 1), start: (i + 1) * 1000, trimWorst: -1, verdict: 'watch', kcEnd: 0.49, overshoot: 3, hardPulls: 2 });
  const boost = CAR.carFlashPlan(Object.assign(CAR.carEmpty(), { drives: overs.reduce((a, d) => (a[d.id] = Object.assign({ hardPulls: 2, boostTarget: 16, lugShare: 1, shakedown: 'none', calmSec: 700, missing: [], flat: [], duration: 900, moving: 800, cool: true, hot: false, hotRestart: false, tooShort: false, kcStart: 0.49, kcPeak: 0.49, iatMoving: 36, cvtPeak: 80, mixLeanest: 10.5, mixTarget: 11, wgAtPeak: 2.5, accel5070: null, updatedAt: NOW }, d), a), {}) }), MAP, { now: NOW });
  assert.equal(boost.kind, 'one-family');
  assert.ok(boost.tables.some((t) => t.id.startsWith('Boost_Target_')), 'named by id: ' + boost.tables.map((t) => t.id).join(','));
  assert.ok(boost.cells.length > 0 && boost.cells.every((c) => c.rpm && c.col && c.before != null && c.after != null));
});

test('ticket 02: the app\'s own copy of every remedy names no table either, in both languages', () => {
  const fs = require('fs'), vm = require('vm');
  const window = {};
  vm.createContext(window); window.window = window;
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n.js', 'utf8'), window);
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n-drive.js', 'utf8'), window);
  let fixes = 0;
  for (const lang of ['en', 'vi']) {
    ALL_LOGS().concat(ALL_SAMPLES()).forEach((log) => {
      const an = K.checkDrive(log).an;
      for (const g of an.gates) {
        for (const c of g.checks) {
          if (c.status === 'good' || c.status === 'nodata') continue;
          const d = window.KTA_I18N[lang].checks[c.id];
          assert.ok(d, lang + ' has text for ' + c.id);
          const fix = d.fix(c.data || {}, K.fmt);
          fixes++;
          assert.ok(!TABLE_WORDS.test(fix), lang + ' ' + c.id + ' remedy prescribes a table: ' + fix);
        }
      }
    });
  }
  assert.ok(fixes >= 6, 'both languages really did exercise remedies: ' + fixes);
});

test('ticket 02: the app shows the after-flash sentence and the 5,200 rpm note in the owner\'s words', () => {
  const fs = require('fs'), vm = require('vm');
  const window = {};
  vm.createContext(window); window.window = window;
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n.js', 'utf8'), window);
  vm.runInContext(fs.readFileSync(__dirname + '/../app/i18n-drive.js', 'utf8'), window);
  const T = window.KTA_I18N;
  // The after-flash pattern: a sentence, not a status name, in both languages.
  for (const lang of ['en', 'vi']) {
    const sentence = T[lang].car.afterFlash({ start: 0.58, end: 0.49, baseline: 0.5 });
    assert.match(sentence, /0\.58/, lang + ': ' + sentence);
    assert.match(sentence, /0\.50/, lang + ' names the Baseline: ' + sentence);
    assert.ok(!/exempt|after-flash|normal|Watch|OK\b/i.test(sentence), lang + ' leaks a status name: ' + sentence);
  }
  // The 5,200 rpm note: said plainly, with the number, in both languages.
  const c = K.checkDrive(highRpmPull(0.70)).an.gates.flatMap((g) => g.checks).find((x) => x.id === 'kControl');
  for (const lang of ['en', 'vi']) {
    const line = T[lang].checks.kControl.display(c.data, K.fmt);
    assert.match(line, /5,200/, lang + ': ' + line);
    assert.match(line, /0\.70/, lang + ' gives the number: ' + line);
  }
  assert.match(T.en.checks.kControl.display(c.data, K.fmt), /on purpose/);
  assert.match(T.vi.checks.kControl.display(c.data, K.fmt), /chủ động/);
  // And a drive with no high-rpm rise carries no excuse.
  const plain = check(pulls().report.an, 'kControl');
  assert.ok(!/5,200/.test(T.en.checks.kControl.display(plain.data, K.fmt)), plain.display);
});

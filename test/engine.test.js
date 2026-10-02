'use strict';
// Run with: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../engine/kta-engine.js');

const status = (an, gate, id) => an.gates.find((g) => g.id === gate).checks.find((c) => c.id === id).status;
const gateStatus = (an, gate) => an.gates.find((g) => g.id === gate).status;

test('reference data is complete', () => {
  assert.equal(K.REF.maf.hz.length, 103);
  for (const key of ['factory', 'custom', 'prl', 'won27']) {
    assert.equal(K.REF.maf[key].length, 103, key);
    for (let i = 1; i < 103; i++) assert.ok(K.REF.maf[key][i] > K.REF.maf[key][i - 1], `${key} rises at ${i}`);
  }
  assert.equal(K.REF.wot.values.length, 20);
  assert.equal(K.REF.wot.values[0].length, 10);
  assert.equal(K.REF.boost.normal.length, 20);
  assert.equal(K.REF.boost.normal[0].length, 16);
  assert.equal(Math.max(...K.REF.boost.normal.flat()), 21);
});

test('parseCSV: comma, BOM, metadata lines and a units row', () => {
  const text = '﻿KTuner datalog\nCar: Civic\nTime,RPM,STFT\ns,rpm,%\n0.0,800,1.5\n0.1,810,-0.5\n0.2,820,0.3\n';
  const p = K.parseCSV(text);
  assert.deepEqual(p.headers, ['Time (s)', 'RPM (rpm)', 'STFT (%)']);
  assert.equal(p.rows, 3);
  assert.equal(p.columns[1][2], 820);
  assert.equal(p.columns[2][1], -0.5);
});

test('parseCSV: semicolon with decimal commas, and tabs', () => {
  const semi = K.parseCSV('Time;RPM;AFR\n0,0;900;14,7\n0,1;910;14,6\n0,2;920;14,8\n');
  assert.equal(semi.delimiter, ';');
  assert.equal(semi.columns[2][1], 14.6);
  const tab = K.parseCSV('Time\tRPM\tAFR\n0\t900\t14.7\n0.1\t910\t14.6\n0.2\t920\t14.8\n');
  assert.equal(tab.delimiter, '\t');
  assert.equal(tab.columns[1][2], 920);
});

test('parseCSV: rejects files that are not logs', () => {
  assert.throws(() => K.parseCSV('hello'), /fewer than 3 lines/);
  assert.throws(() => K.parseCSV('a,b,c\nx,y,z\nq,r,s\n'), /header row/);
});

test('detectChannels: the sample export maps every channel the method needs', () => {
  const p = K.parseCSV(K.sampleCsv('after'));
  const map = K.detectChannels(p.headers, p.columns);
  for (const key of ['time', 'rpm', 'mafHz', 'mafGs', 'stft', 'ltft', 'afr', 'afrCmd', 'tps', 'boost', 'boostTarget', 'iat', 'ect', 'cvt', 'fp', 'fpTarget', 'kControl', 'ign', 'map', 'vss']) {
    assert.ok(map[key] != null, `missing ${key}`);
  }
  assert.equal(map.knock.length, 4);
  assert.equal(p.headers[map.afr], 'AFR');
  assert.equal(p.headers[map.afrCmd], 'AFR Command');
  assert.equal(p.headers[map.fp], 'Fuel Pressure (kPa)');
  assert.equal(p.headers[map.fpTarget], 'Fuel Pressure Target (kPa)');
});

test('detectChannels: Hondata-style names', () => {
  const headers = ['Time', 'RPM', 'VSS', 'MAP', 'Boost', 'Boost Target', 'TPS', 'AFM Hz', 'AFM g/s', 'S.TRIM', 'L.TRIM', 'AF', 'AF Cmd', 'IGN', 'K.Retard', 'K.Control', 'IAT', 'ECT', 'CVT Temp', 'Fuel Pressure', 'Fuel Pressure Target', 'CVT Ratio'];
  const map = K.detectChannels(headers);
  const name = (k) => headers[map[k]];
  assert.equal(name('stft'), 'S.TRIM');
  assert.equal(name('ltft'), 'L.TRIM');
  assert.equal(name('afr'), 'AF');
  assert.equal(name('afrCmd'), 'AF Cmd');
  assert.equal(name('mafHz'), 'AFM Hz');
  assert.equal(name('mafGs'), 'AFM g/s');
  assert.equal(name('cvt'), 'CVT Temp');
  assert.equal(name('kControl'), 'K.Control');
  assert.deepEqual(map.knock.map((i) => headers[i]), ['K.Retard']);
  assert.equal(name('vss'), 'VSS');
});

test('buildLog: lambda columns, Fahrenheit, absolute kPa boost and fractional trims', () => {
  const rows = ['Time,RPM,Lambda,Lambda Target,ECT (F),IAT (F),Boost (kPa),STFT,LTFT'];
  for (let i = 0; i < 50; i++) rows.push([i / 10, 2000 + i, 1.0 + (i % 3) * 0.01, 1.0, 194, 104, 150, 0.02 + (i % 5) * 0.001, 0.03].join(','));
  const log = K.readLog(rows.join('\n'));
  assert.equal(log.units.afr, 'lambda');
  assert.ok(Math.abs(log.lam[0] - 1.0) < 1e-9);
  assert.ok(Math.abs(log.ect[0] - 90) < 0.01, 'ECT 194 F is 90 C');
  assert.ok(Math.abs(log.iat[0] - 40) < 0.01, 'IAT 104 F is 40 C');
  assert.ok(Math.abs(log.boost[0] - (150 - 101.3) / 6.895) < 0.01, 'absolute kPa to psi gauge');
  assert.ok(Math.abs(log.stft[0] - 2) < 1e-9, 'fraction to %');
  assert.equal(log.units.stft, 'fraction converted to %');
});

test('buildLog: AFR on the gasoline scale becomes lambda', () => {
  const log = K.readLog('Time,RPM,AFR,AFR Target\n0,3000,11.76,11.0\n0.1,3100,11.9,11.0\n0.2,3200,12.0,11.0\n');
  assert.ok(Math.abs(log.lam[0] - 0.8) < 1e-9);
  assert.ok(Math.abs(log.lamCmd[0] - 11 / 14.7) < 1e-9);
});

test('analyze: sample A (after mods, before calibration) is flagged and explained', () => {
  const an = K.analyze(K.readLog(K.sampleCsv('before')));
  assert.equal(an.verdict, 'stop');
  assert.equal(an.events.length, 2);
  assert.ok(an.closedLoopSeconds > 300);
  assert.ok(an.numbers.trimWorst > 7, 'trims show the under-reading intake');
  assert.equal(status(an, 'fuel', 'wotAfr'), 'stop');
  assert.ok(an.wot.signedErrAfr > 0.6, 'WOT runs lean of command');
  assert.equal(gateStatus(an, 'spark'), 'good');
  assert.equal(gateStatus(an, 'heat'), 'good');
});

test('analyze: sample B (after the correction) passes every gate', () => {
  const an = K.analyze(K.readLog(K.sampleCsv('after')));
  assert.equal(an.verdict, 'good');
  for (const g of an.gates) assert.ok(g.status === 'good' || g.status === 'nodata', `${g.id} is ${g.status}`);
});

test('analyze: sample C (hot, heat-soaked) stops on spark, heat and CVT', () => {
  const an = K.analyze(K.readLog(K.sampleCsv('hot')));
  assert.equal(an.verdict, 'stop');
  assert.equal(gateStatus(an, 'spark'), 'stop');
  assert.equal(status(an, 'heat', 'iat'), 'stop');
  assert.equal(status(an, 'cvt', 'cvtTemp'), 'stop');
  assert.equal(status(an, 'fuel', 'fuelPress'), 'watch');
  assert.ok(an.readiness.some((r) => /Fuel pressure fell/.test(r)));
});

test('method converges: one correction round fixes trims and full-throttle mixture', () => {
  const before = K.analyze(K.readLog(K.sampleCsv('before')));
  const sug = K.suggestMaf(before, K.REF.maf.custom);
  assert.ok(sug.ok);
  assert.ok(sug.stats.maxUp <= 10.0001, 'respects the 10 % step limit');
  for (let i = 1; i < sug.after.length; i++) assert.ok(sug.after[i] > sug.after[i - 1], 'curve rises');
  const again = K.analyze(K.readLog(K.sampleCsv('before', { ecuTable: sug.after })));
  assert.ok(Math.abs(again.numbers.trimWorst) < 3, `trims after correction ${again.numbers.trimWorst}`);
  assert.equal(status(again, 'fuel', 'trims'), 'good');
  assert.equal(status(again, 'fuel', 'wotAfr'), 'good');
});

test('suggestMaf: never leans the full-throttle end from cruise data', () => {
  const an = K.analyze(K.readLog(K.sampleCsv('after')));
  const cl = an.maf.cl.map((b) => ({ ...b, mean: b.weight >= 8 ? -6 : NaN }));
  const fake = { maf: { axis: an.maf.axis, cl, wot: null } };
  const sug = K.suggestMaf(fake, K.REF.maf.custom);
  const lastLog = sug.source.lastIndexOf('log');
  assert.ok(lastLog > 0);
  assert.ok(sug.pct[lastLog] < -5);
  assert.ok(Math.abs(sug.pct[102]) < 0.01, 'tapers back to zero at the top');
  assert.ok(sug.source.slice(lastLog + 1).every((s) => s === 'taper' || s === 'none'));
});

test('suggestMaf: holds a richening correction above the data and clamps big steps', () => {
  const axis = K.REF.maf.hz;
  const cl = axis.map((hz, k) => ({ hz, weight: k >= 10 && k <= 30 ? 20 : 0, mean: k >= 10 && k <= 30 ? 25 : NaN }));
  const sug = K.suggestMaf({ maf: { axis, cl, wot: null } }, K.REF.maf.custom);
  assert.ok(Math.abs(sug.stats.maxUp - 10) < 0.05, 'clamped to +10 %');
  assert.ok(sug.pct[80] > 9.9, 'held above the data');
  assert.equal(sug.source[80], 'hold');
});

test('parseAfmPaste: one row, two rows, and helpful errors', () => {
  const row = K.REF.maf.custom.join('\t');
  assert.deepEqual(K.parseAfmPaste(row).values, K.REF.maf.custom);
  const two = K.parseAfmPaste(K.REF.maf.hz.join('\t') + '\n' + row);
  assert.ok(two.ok);
  assert.equal(two.axis.length, 103);
  assert.match(K.parseAfmPaste('1 2 3').reason, /Expected 103/);
  const broken = K.REF.maf.custom.slice(); broken[50] = 1;
  assert.match(K.parseAfmPaste(broken.join(' ')).reason, /must rise/);
});

test('gain lever 1: WOT lean-out touches only the full-load columns from 3,000 rpm', () => {
  const s = K.suggestWotLean();
  s.values.forEach((row, r) => row.forEach((v, c) => {
    const was = K.REF.wot.values[r][c];
    if (K.REF.wot.rpm[r] < 3000 || c < 7) assert.equal(v, was);
    else assert.equal(v, K.REF.wot.rpm[r] >= 5500 ? 11.3 : 11.5);
  }));
  const refs = K.referenceChecks({ wotValues: s.values });
  assert.equal(refs.find((c) => c.id === 'wotBand').status, 'good');
});

test('gain lever 2: boost step respects the ceiling and leaves low rpm alone', () => {
  const same = K.suggestBoostStep(21);
  assert.equal(same.atCeiling, true);
  assert.equal(same.mapPeak, 21);
  const up = K.suggestBoostStep(22);
  assert.equal(up.rows.length, 5);
  up.rows.forEach((r) => { assert.ok(r.rpm >= 3500 && r.rpm <= 5500); assert.equal(r.to, 22); });
  const refs = K.referenceChecks({ boostValues: up.values, ceilingPsi: 22 });
  assert.equal(refs.find((c) => c.id === 'boostLow').status, 'good');
  assert.equal(refs.find((c) => c.id === 'boostPeak').status, 'good');
  const over = K.referenceChecks({ boostValues: up.values, ceilingPsi: 21 });
  assert.equal(over.find((c) => c.id === 'boostPeak').status, 'stop');
});

test('review packet carries changes, evidence, reference checks and sign-off', () => {
  const an = K.analyze(K.readLog(K.sampleCsv('before')));
  const maf = K.suggestMaf(an);
  const md = K.reviewPacket({ maf, lastAnalysis: K.analyze(K.readLog(K.sampleCsv('after'))), mods: ['Intake', 'Downpipe'], reviewer: 'Anh T.', decision: 'Approve', date: '2026-09-28' });
  for (const part of ['# Civic FE Tune Assist', '## Changes', '## Evidence', '| Gate | Status | Numbers |', '## Reference checks', '## Reviewer', 'Anh T.', 'Approve']) assert.ok(md.includes(part), part);
});

test('view models produce finite geometry', () => {
  const log = K.readLog(K.sampleCsv('before'));
  const an = K.analyze(log);
  const sug = K.suggestMaf(an);
  const charts = [K.view.trimChart(an, sug), K.view.wotChart(an), K.view.pullChart(log, an, 0), K.view.afmCurves()];
  for (const c of charts) {
    const s = JSON.stringify(c);
    assert.ok(!/NaN|Infinity|null,"y"/.test(s), s.slice(0, 200));
  }
  assert.ok(charts[0].dots.length > 10);
  assert.ok(charts[1].hasData);
  assert.ok(charts[2].peak && charts[2].peak.label.startsWith('+'));
  const heat = K.view.heat(K.REF.wot.values, { invert: true, rowLabels: K.REF.wot.rpm });
  assert.equal(heat.rows.length, 20);
  assert.equal(heat.rows[0].cells.length, 10);
});

// ---------------------------------------------------------------------------
// The whole map: catalog, edit plan, shape checks, 3-D view
// ---------------------------------------------------------------------------
const MAP = require('../data/ktuner-maps-digitized.json');
const table = (name) => K.readTable(name, MAP[name]);

test('map catalog: every digitized table has a role, and only three kinds are edited', () => {
  const names = Object.keys(MAP);
  assert.equal(names.length, 39);
  for (const n of names) assert.ok(K.TABLES[n], `catalog has ${n}`);
  const edited = names.filter((n) => K.TABLES[n].role === 'edit');
  assert.deepEqual(new Set(edited.map((n) => K.TABLES[n].stage)), new Set(['A', 'B1', 'B2']));
  assert.ok(edited.every((n) => /^(MAF_Scaling_Custom|WOT_Enrich_[LH]|Boost_Target_[123]_Normal_[LH])$/.test(n)));
  for (const n of names.filter((x) => /^Knock_Sens/.test(x))) assert.equal(K.TABLES[n].role, 'never');
  assert.equal(K.pairOf('WOT_Enrich_L'), 'WOT_Enrich_H');
  assert.equal(K.pairOf('Boost_By_Gear_Limits'), '');
  const maf = table('MAF_Scaling_Custom');
  assert.ok(maf.curve);
  assert.equal(maf.values.length, 103);
});

test('edit plan: lever 1 and lever 2 name the exact cells, and keep the shape', () => {
  for (const n of ['WOT_Enrich_L', 'WOT_Enrich_H']) {
    const t = table(n), e = K.tableEdits(n, t.values, {});
    assert.equal(e.changed.length, 27, n);                     // 9 rows from 3,000 rpm x 3 full-load columns
    assert.ok(e.changed.every((x) => t.x[x.r] >= 3000 && x.c >= 7));
    assert.ok(e.changed.every((x) => x.to === (t.x[x.r] >= 5500 ? 11.3 : 11.5)));
    assert.ok(K.smoothness(e.before, e.after, { tol: t.meta.tol }).ok, n);
  }
  const b = table('Boost_Target_1_Normal_H');
  assert.equal(K.tableEdits(b.name, b.values, { ceiling: 21 }).changed.length, 0);  // at the map peak already
  const e = K.tableEdits(b.name, b.values, { ceiling: 22 });
  assert.equal(e.changed.length, 45);
  assert.ok(e.changed.every((x) => b.x[x.r] >= 3500 && b.x[x.r] <= 5500 && x.to === 22));
  assert.ok(K.smoothness(e.before, e.after, { tol: 1 }).ok);
  assert.equal(K.tableEdits('Ignition_Base_H', table('Ignition_Base_H').values, {}), null);
  const maf = table('MAF_Scaling_Custom');
  assert.equal(K.tableEdits(maf.name, maf.values, {}).pending, true);
});

test('smoothness: flags a new spike, ignores shapes already in the stock table', () => {
  const t = table('WOT_Enrich_L');
  const bad = t.values.map((r) => r.slice());
  bad[13][8] = 12.6;                                            // one lean cell at 4,000 rpm
  const s = K.smoothness(t.values, bad, { tol: 0.2 });
  assert.equal(s.ok, false);
  assert.equal(s.spikes[0].kind, 'spike');
  assert.equal(s.spikes[0].r, 13);
  const ign = table('Ignition_Base_H');
  assert.ok(K.smoothness(ign.values, ign.values.map((r) => r.slice()), { tol: 2 }).ok);
  // AFM Flow: a smooth correction passes, a single-point bump and a fall do not
  const m = table('MAF_Scaling_Custom').values;
  assert.ok(K.smoothness(m, m.map((v) => v * 1.04), { tol: 1.5 }).ok);
  const bump = m.slice(); bump[40] *= 1.06;
  assert.equal(K.smoothness(m, bump, { tol: 1.5 }).ok, false);
  const fall = m.slice(); fall[50] = fall[49];
  assert.ok(K.smoothness(m, fall, { tol: 1.5 }).spikes.some((x) => x.kind === 'fall'));
});

test('blind smoothing would add timing to the stock ignition map', () => {
  const p = K.smoothPreview(table('Ignition_Base_H').values);
  assert.ok(p.top[0].delta > 3, 'adds more than 3 degrees somewhere');
  assert.ok(p.raisedHighLoad > 0, 'adds timing in high-load cells');
  assert.equal(p.after.length, 20);
});

test('3-D surface and line views produce finite geometry, rotated any way', () => {
  const t = table('Boost_Target_1_Normal_H');
  for (const yaw of [-180, -38, 0, 90, 135]) {
    for (const pitch of [10, 58, 89]) {
      const s = K.view.surface(t.values, { x: t.x, yaw, pitch, mark: [{ r: 12, c: 7 }], unit: 'psi' });
      assert.equal(s.quads.length, 19 * 15);
      assert.ok(s.quads.every((q) => !/NaN|Infinity/.test(q.points) && /^#[0-9a-f]{6}$/.test(q.fill)), `yaw ${yaw} pitch ${pitch}`);
      assert.ok(s.marks.every((m) => Number.isFinite(m.cx) && Number.isFinite(m.cy)));
      assert.ok(s.labels.length > 3);
    }
  }
  const d = K.view.surface(t.values.map((r) => r.map(() => 0)), { diff: true });
  assert.ok(d.quads.every((q) => !/NaN/.test(q.points)));
  const e = K.tableEdits('WOT_Enrich_L', table('WOT_Enrich_L').values, {});
  const l = K.view.lines(e.after, { x: table('WOT_Enrich_L').x, before: e.before });
  assert.equal(l.series.filter((s) => s.changed).length, 3);
  assert.ok(l.series.every((s) => !/NaN/.test(s.d)));
  const c = K.view.lines(table('MAF_Scaling_Custom').values, { x: table('MAF_Scaling_Custom').x });
  assert.equal(c.series.length, 1);
});

test('knock control: RON95-level is fine, a high level is a Watch', () => {
  const base = K.readLog(K.sampleCsv('after'));
  const an = K.analyze(base, {});
  assert.equal(status(an, 'spark', 'kControl'), 'good');
  const lines = K.sampleCsv('after').split('\n');
  const col = lines[0].split(',').indexOf('Knock Control');
  // A real Knock Control channel steps in 0.01 moves; a frozen value is a dead
  // channel (issue 01), so the synthetic high level wobbles like the real one.
  const hi = K.readLog(lines.map((l, i) => { if (i === 0 || !l) return l; const f = l.split(','); f[col] = i % 7 < 2 ? '0.79' : '0.78'; return f.join(','); }).join('\n'));
  assert.ok(hi.has.kControl);
  const an2 = K.analyze(hi, {});
  assert.equal(status(an2, 'spark', 'kControl'), 'watch');
  assert.ok(an2.gates.find((g) => g.id === 'spark').checks.find((c) => c.id === 'kControl').data.high);
});

test('torque: judged against the base map when a baseline gives a reference', () => {
  const log = K.readLog(K.sampleCsv('after'));
  const n = log.n;
  log.torque = new Float64Array(n).fill(300);
  log.has.torque = true;
  const noRef = K.analyze(log, {});
  assert.equal(status(noRef, 'cvt', 'torque'), 'watch');          // over the 280 Nm guideline: never a Stop without a reference
  assert.equal(status(K.analyze(log, { torqueRef: 298 }), 'cvt', 'torque'), 'good');
  assert.equal(status(K.analyze(log, { torqueRef: 280 }), 'cvt', 'torque'), 'watch');
  assert.equal(status(K.analyze(log, { torqueRef: 260 }), 'cvt', 'torque'), 'stop');
});

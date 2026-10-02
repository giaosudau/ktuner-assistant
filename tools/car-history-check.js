#!/usr/bin/env node
/*
 * Local check (not in CI): run every TunerView CSV in a folder through the
 * Car module in time order and print the per-drive table — the same numbers
 * the app shows in the Car history.
 *
 *   node tools/car-history-check.js "/path/to/logs"
 *
 * Quote the folder: the owner's lives under Mobile Documents/com~apple~CloudDocs.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('../engine/kta-car.js');

const dir = process.argv[2];
if (!dir) { console.error('usage: node tools/car-history-check.js <folder of TunerView_*.csv>'); process.exit(1); }
const files = fs.readdirSync(dir).filter((f) => /^TunerView_\d{8}_\d{6}\.csv$/.test(f)).sort();
if (!files.length) { console.error('no TunerView_YYYYMMDD_HHMMSS.csv files in ' + dir); process.exit(1); }

let state = K.carEmpty();
const rows = [];
for (const f of files) {
  const log = K.readLog(fs.readFileSync(path.join(dir, f), 'utf8'));
  const out = K.carIngest(state, log, { fileName: f });
  state = out.state;
  const r = out.report;
  rows.push({
    drive: f.replace('TunerView_', '').replace('.csv', ''),
    verdict: r.tooShort ? 'too-short' : r.verdict,
    kc: r.summary ? r.summary.kcStart.toFixed(2) + '→' + r.summary.kcEnd.toFixed(2) + ' (pk ' + r.summary.kcPeak.toFixed(2) + ')' : '-',
    trim: r.summary && r.summary.trimWorst != null ? r.summary.trimWorst.toFixed(1) : '-',
    tgt: r.summary && r.summary.boostTarget != null ? r.summary.boostTarget.toFixed(1) : '-',
    iat: r.summary && r.summary.iatMoving != null ? String(Math.round(r.summary.iatMoving)) : '-',
    cvt: r.summary && r.summary.cvtPeak != null ? String(Math.round(r.summary.cvtPeak)) : '-',
    lug: r.summary && r.summary.lugShare != null ? r.summary.lugShare.toFixed(1) : '-',
    a50: r.summary && r.summary.accel5070 ? r.summary.accel5070.seconds.toFixed(2) : '-',
    cool: r.summary ? (r.summary.cool ? 'cool' : (r.summary.hot ? 'hot' : 'mild')) : '-',
    hotRestart: r.summary && r.summary.hotRestart ? 'yes' : '',
    shake: r.isShakedown ? (r.shakedown.passed ? 'passed' : 'pending ' + Math.floor(r.shakedown.calmSec / 60) + '/10min') : '',
    unexplained: r.unexplained && r.unexplained.state === 'open' ? r.unexplained.reasons.join('+') : '',
    map: r.map.recorded ? r.map.name : 'not recorded',
  });
}
const cols = ['drive', 'verdict', 'kc', 'trim', 'tgt', 'iat', 'cvt', 'lug', 'a50', 'cool', 'hotRestart', 'shake', 'unexplained', 'map'];
const width = {};
cols.forEach((c) => { width[c] = Math.max(c.length, ...rows.map((r) => String(r[c]).length)); });
const line = (r) => cols.map((c) => String(r[c]).padEnd(width[c])).join('  ');
console.log(line(Object.fromEntries(cols.map((c) => [c, c]))));
console.log(cols.map((c) => '-'.repeat(width[c])).join('  '));
rows.forEach((r) => console.log(line(r)));
const base = K.carBaseline(state);
console.log('\ndrives: ' + rows.filter((r) => r.verdict !== 'too-short').length + ' in history (' +
  rows.filter((r) => r.verdict === 'too-short').length + ' too short)' +
  ' · baseline ' + base.value.toFixed(2) + ' from ' + base.n + ' cool drives');
console.log('stops: ' + rows.filter((r) => r.verdict === 'stop').map((r) => r.drive).join(', '));
console.log('asks: ' + rows.filter((r) => r.unexplained).map((r) => r.drive + ':' + r.unexplained).join(', '));

#!/usr/bin/env node
/*
 * Builds data/example-<id>.js from the owner's KTuner TunerView CSV exports.
 *
 *   node tools/build-examples.js aug30-1601=path/to/TunerView_20260830_160151.csv [id=path ...]
 *
 * Each log is trimmed for the app: channels the analysis never reads are dropped and every
 * second sample is kept (about 7.5 per second). The CSV is gzipped and stored as base64, so the
 * page can open it from file:// (a <script> tag, then DecompressionStream in the browser;
 * zlib in Node). The drive check gives the same findings on the trimmed and the full logs.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DROP = ['CAM Command', 'CAM Actual', 'CAM EX Command', 'CAM EX Actual', 'ECT2', 'STFT B2', 'LTFT B2', 'Steering Angle', 'Acceleration', 'Brake Pressure', 'Ethanol', 'EWG Duty', 'Battery'];
const EVERY = 2;

function trim(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const head = lines[0].split(';');
  const keep = head.map((h, i) => (DROP.includes(h.trim()) ? -1 : i)).filter((i) => i >= 0);
  const pick = (line) => { const v = line.split(';'); return keep.map((i) => v[i]).join(';'); };
  const out = [pick(lines[0]), pick(lines[1])];
  for (let i = 2; i < lines.length; i++) if ((i - 2) % EVERY === 0) out.push(pick(lines[i]));
  return { csv: out.join('\n') + '\n', rows: out.length - 2, columns: keep.length };
}

const args = process.argv.slice(2);
if (!args.length) { console.error('usage: node tools/build-examples.js id=file.csv [id=file.csv ...]'); process.exit(1); }
for (const arg of args) {
  const eq = arg.indexOf('=');
  const id = arg.slice(0, eq), file = arg.slice(eq + 1);
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('bad id: ' + id);
  const t = trim(fs.readFileSync(file, 'utf8'));
  const gz = zlib.gzipSync(Buffer.from(t.csv, 'utf8'), { level: 9 }).toString('base64');
  const name = path.basename(file).replace(/^[0-9a-f]{8}-/, '');
  const body = '/* Built by tools/build-examples.js from the owner\'s KTuner log ' + name + ' (' + t.rows + ' rows, ' + t.columns + ' channels, every ' + EVERY + 'nd sample). Do not edit. */\n' +
    '(function (root) { (root.KTA_EXAMPLES = root.KTA_EXAMPLES || {})[' + JSON.stringify(id) + '] = { name: ' + JSON.stringify(name) + ', rows: ' + t.rows + ', gz: ' + JSON.stringify(gz) + ' }; })(typeof globalThis !== \'undefined\' ? globalThis : this);\n';
  const out = path.join(__dirname, '..', 'data', 'example-' + id + '.js');
  fs.writeFileSync(out, body);
  console.log(out, (body.length / 1024).toFixed(0) + ' KB', t.rows + ' rows');
}

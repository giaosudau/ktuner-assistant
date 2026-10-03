#!/usr/bin/env node
'use strict';
// Seam-2 bridge: runs the engine side of the two-sided map check on one JSON
// document and prints the verdict. The Python agreement test feeds this and
// server/kta_server/mapcheck.py the same generated changes.
//   node server/tests/seam2/run_engine_check.js case.json
// case.json: { "change": {...}, "tables": {...} }  ->  {"ok":bool,"reason":..}
const fs = require('fs');
const path = require('path');
const K = require(path.join(__dirname, '..', '..', '..', 'engine', 'kta-engine.js'));

const doc = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const verdict = K.checkMapChange(doc.change, doc.tables);
process.stdout.write(JSON.stringify({ ok: !!verdict.ok, reason: verdict.reason }) + '\n');

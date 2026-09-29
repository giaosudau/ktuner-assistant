#!/usr/bin/env node
// Prints the basic-stage edit plan for the owner's map as JSON, cell by cell, straight
// from the engine (so the annotated spreadsheet and the app can never disagree).
// Lever 2 is shown as it would be with a 22 psi ceiling; at the default 21 psi it changes nothing.
'use strict';
const path = require('path');
const K = require(path.join(__dirname, '..', 'engine', 'kta-engine.js'));
const maps = require(path.join(__dirname, '..', 'data', 'ktuner-maps-digitized.json'));

const out = { note: 'Lever 2 computed with a 22 psi ceiling; at 21 psi (the default) it changes nothing.', tables: {} };
Object.keys(maps).forEach((name) => {
  const t = K.readTable(name, maps[name]);
  const meta = K.TABLES[name] || {};
  const entry = { role: meta.role || 'info', stage: meta.stage || '', unit: meta.unit || '', rows: t.x, changed: [] };
  const e = K.tableEdits(name, t.values, { ceiling: 22 });
  if (e) entry.changed = e.changed;
  if (/^Ignition_(Base|Max)_/.test(name)) {
    const p = K.smoothPreview(t.values, { x: t.x });
    entry.blindSmoothing = { top: p.topHighLoad[0] || null, raisedHighLoad: p.raisedHighLoad };
  }
  out.tables[name] = entry;
});
process.stdout.write(JSON.stringify(out));

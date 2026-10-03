'use strict';
// Ticket 12: the thresholds file and the engine side of the two-sided map check.
// - every thresholds entry has value, unit, basis and source;
// - the engine's limits come from the file (LIMITS derived, TABLES roles match
//   the editable/forbidden lists, the plan's low-rpm floor matches);
// - checkMapChange accepts a valid change and rejects the textbook faults.
// Run with: node --test test/thresholds.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../engine/kta-engine.js');
const TH = require('../data/thresholds.json');

const entries = Object.keys(TH).filter((k) => k[0] !== '_');

test('every thresholds entry has value, unit, basis and source', () => {
  assert.ok(entries.length > 0, 'the file holds thresholds');
  for (const key of entries) {
    const e = TH[key];
    assert.ok('value' in e, key + ' has a value');
    assert.ok('unit' in e && typeof e.unit === 'string', key + ' has a unit');
    assert.ok(['measured', 'source', 'judgement'].includes(e.basis), key + ' basis is measured/source/judgement, got ' + e.basis);
    assert.ok(typeof e.source === 'string' && e.source.length > 0, key + ' names its source');
  }
});

test('the engine limits come from the thresholds file', () => {
  assert.equal(K.LIMITS.mafStepMax, TH.maf_step_max_pct.value / 100);
  assert.equal(K.LIMITS.boostCeilingPsi, TH.boost_ceiling_psi.value);
  assert.deepEqual(K.LIMITS.wotTargetAfr, { min: TH.wot_target_band.value.min, max: TH.wot_target_band.value.max });
});

test('the editable and forbidden lists match the engine table roles exactly', () => {
  const edit = Object.keys(K.TABLES).filter((id) => K.TABLES[id].role === 'edit').sort();
  assert.deepEqual(Object.keys(TH.editable_tables.value).sort(), edit);
  const rest = Object.keys(K.TABLES).filter((id) => K.TABLES[id].role !== 'edit').sort();
  assert.deepEqual(TH.forbidden_tables.value.slice().sort(), rest);
  assert.equal(edit.length + rest.length, Object.keys(K.TABLES).length);
  assert.equal(Object.keys(K.TABLES).length, 39);
});

test('checkMapChange accepts a valid one-family boost lowering', () => {
  const MAP = require('../data/ktuner-maps-digitized.json');
  const change = { mapVersion: 1, tables: {} };
  for (const id of TH.boost_pairs.value.members) {
    const before = MAP[id].values[9][6];
    change.tables[id] = [{ row: 9, col: 6, before: before, after: Math.round((before - 1) * 10) / 10 }];
  }
  assert.deepEqual(K.checkMapChange(change, MAP), { ok: true, reason: 'ok', detail: '6 cell(s) in 6 table(s) are within the thresholds.' });
});

test('checkMapChange rejects the textbook faults with the shared reasons', () => {
  const MAP = require('../data/ktuner-maps-digitized.json');
  const boostId = TH.boost_pairs.value.members[0];
  const before = MAP[boostId].values[9][6];
  const one = (cells) => K.checkMapChange({ mapVersion: 1, tables: { [boostId]: cells } }, MAP);
  // Pairs move together: one table alone is a broken pair.
  assert.equal(one([{ row: 9, col: 6, before: before, after: before - 1 }]).reason, 'pair-mismatch');
  assert.equal(one([{ row: 99, col: 6, before: before, after: before - 1 }]).reason, 'index-out-of-range');
  const full = {};
  for (const id of TH.boost_pairs.value.members) {
    const b = MAP[id].values[9][6];
    full[id] = [{ row: 9, col: 6, before: b, after: Math.round((b - 1) * 10) / 10 }];
  }
  const broken = JSON.parse(JSON.stringify(full));
  broken[boostId][0].after = broken[boostId][0].before;
  assert.equal(K.checkMapChange({ mapVersion: 1, tables: broken }, MAP).reason, 'pair-mismatch');
  const wrong = JSON.parse(JSON.stringify(full));
  wrong[boostId][0].before = wrong[boostId][0].before + 0.1;
  assert.equal(K.checkMapChange({ mapVersion: 1, tables: wrong }, MAP).reason, 'before-mismatch');
  const step = JSON.parse(JSON.stringify(full));
  for (const id of Object.keys(step)) step[id][0].after = step[id][0].before - 2;
  assert.equal(K.checkMapChange({ mapVersion: 1, tables: step }, MAP).reason, 'boost-step');
  assert.equal(K.checkMapChange({ mapVersion: 1, tables: { Ignition_Base_L: [{ row: 0, col: 0, before: MAP.Ignition_Base_L.values[0][0], after: 30 }] } }, MAP).reason, 'forbidden-table');
  assert.equal(K.checkMapChange({ mapVersion: 1, tables: {} }, MAP).reason, 'empty-change');
});

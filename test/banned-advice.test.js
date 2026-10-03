'use strict';
// Parity lock (ADR 0003): the banned-advice policy lives twice (engine/kta-ask.js here,
// server/kta_server/verify.py there). Both are tested against ONE case list.
// Python side: server/tests/test_verify.py. Boost/curve phrasing is policed differently by design.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
global.window = globalThis;
const K = require('../engine/kta-ask.js');
const { cases } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'tests', 'banned_advice_cases.json'), 'utf8'));
const ctx = { report: { plan: { now: [], next: [], later: [], all: [] } } };

test('the shared list covers every banned category in EN and VI, with allowed controls', () => {
  for (const cat of ['knock', 'timing', 'protect']) for (const lang of ['en', 'vi'])
    assert.ok(cases.some((c) => c.category === cat && c.lang === lang && c.expect === 'refused'), cat + '/' + lang);
  assert.ok(cases.filter((c) => c.expect === 'allowed').length >= 6);
});

for (const c of cases) {
  test('banned-advice parity: ' + c.id, () => {
    const facts = new K.ask.Facts();
    facts.add(c.text);   // numbers are not what this locks, only the advice judgement
    const v = K.ask.verify({ answer: c.text, action_ids: [] }, facts, ctx);
    assert.equal(v.ok, c.expect === 'allowed', JSON.stringify(v.issues));
  });
}

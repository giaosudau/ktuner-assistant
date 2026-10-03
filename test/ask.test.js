'use strict';
// "Ask about this drive": tools, the number check, and the API loop against a scripted fake API.
// No network and no key: fetch is replaced, so these run anywhere.
const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('zlib');
global.window = globalThis;
const K = require('../engine/kta-ask.js');
require('../app/i18n.js');
require('../app/i18n-drive.js');
require('../data/example-aug30-1601.js');

const T = window.KTA_I18N.en;
const log = K.readLog(zlib.gunzipSync(Buffer.from(globalThis.KTA_EXAMPLES['aug30-1601'].gz, 'base64')).toString('utf8'));
const report = K.checkDrive(log);
const checkText = (c) => { const d = T.checks[c.id]; return d ? { label: d.label, display: d.display(c.data || {}, K.fmt), fix: d.fix(c.data || {}, K.fmt) } : c; };
const ctx = K.ask.context({ report, log, T: T.drive, checkText });
const base = { report, log, T: T.drive, checkText, lang: 'en', apiKey: 'test-key', model: 'test-model' };

// A scripted Messages API: each call returns the next response; requests are recorded.
function fakeApi(responses) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : null });
    const next = responses.shift();
    const r = typeof next === 'function' ? next(calls[calls.length - 1]) : next;
    return { ok: (r.status || 200) < 400, status: r.status || 200, json: async () => r.json };
  };
  return { fetch, calls };
}
const toolUse = (id, name, input) => ({ type: 'tool_use', id, name, input });
const msg = (content, stop) => ({ json: { id: 'msg', type: 'message', role: 'assistant', content, stop_reason: stop || 'tool_use' } });

test('tools: strict schemas, every property required, no extra properties', () => {
  for (const t of K.ask.tools()) {
    assert.equal(t.strict, true, t.name);
    assert.equal(t.input_schema.additionalProperties, false, t.name);
    assert.deepEqual([...t.input_schema.required].sort(), Object.keys(t.input_schema.properties).sort(), t.name);
    assert.ok(t.description.length > 40, t.name + ' says when to call it');
  }
});

test('tool results are deterministic numbers from the drive, never NaN', () => {
  const calls = [['get_overview', {}], ['get_insight', { topic: 'knock' }], ['get_insight', { topic: 'mixture' }], ['get_action', { id: 'revs' }], ['get_action', { id: 'moreBoost' }], ['get_channel_stats', { channel: 'knock_control', where: 'lugging' }], ['get_timing_cell', { rpm: 1500, map_psi: -1 }], ['get_pull', { index: 0 }]];
  for (const [name, input] of calls) {
    const a = K.ask.runTool(ctx, name, input), b = K.ask.runTool(ctx, name, input);
    assert.ok(a.result, name);
    assert.equal(JSON.stringify(a), JSON.stringify(b), name + ' is deterministic');
    assert.ok(!/NaN|Infinity/.test(JSON.stringify(a)), name);
  }
  assert.equal(K.ask.runTool(ctx, 'get_action', { id: 'moreBoost' }).result.status, 'locked');
  assert.ok(K.ask.runTool(ctx, 'get_insight', { topic: 'nope' }).error);
  assert.ok(K.ask.runTool(ctx, 'get_pull', { index: 999 }).error);
  const raw = K.ask.runTool(ctx, 'get_overview', {}).result;
  assert.ok(JSON.stringify(raw).length < 8000, 'summaries, never the raw log');
});

test('the check: numbers must come from the tools, locked actions and unsafe advice are refused', () => {
  const facts = new K.ask.Facts();
  facts.add(K.ask.runTool(ctx, 'get_insight', { topic: 'knock' }).result);
  facts.add(K.ask.runTool(ctx, 'get_overview', {}).result);
  const kc = report.ins.kc;
  const good = 'Knock Control went from ' + kc.start.toFixed(2) + ' to ' + kc.peak.toFixed(2) + ' on this 1.5T with RON95 E10.';
  assert.deepEqual(K.ask.verify({ answer: good, action_ids: ['revs'] }, facts, ctx), { ok: true, issues: [] });
  assert.match(K.ask.verify({ answer: 'Knock Control peaked at 0.83.', action_ids: [] }, facts, ctx).issues[0], /0\.83/);
  assert.match(K.ask.verify({ answer: good, action_ids: ['moreBoost'] }, facts, ctx).issues[0], /locked/);
  assert.match(K.ask.verify({ answer: good, action_ids: ['afm'] }, facts, ctx).issues[0], /not on this drive/);
  assert.equal(K.ask.verify({ answer: 'Lower the knock sensitivity a little.', action_ids: [] }, facts, ctx).ok, false);
  assert.equal(K.ask.verify({ answer: 'Never lower the knock sensitivity.', action_ids: [] }, facts, ctx).ok, true);
  assert.equal(K.ask.verify({ answer: 'Add timing to the ignition table in the lugging zone.', action_ids: [] }, facts, ctx).ok, false);
  assert.equal(K.ask.verify({ answer: 'When Knock Control falls, the ECU gives more timing everywhere.', action_ids: [] }, facts, ctx).ok, true, 'an explanation is not an edit');
  assert.equal(K.ask.verify({ answer: 'Hãy giảm độ nhạy cảm biến kích nổ.', action_ids: [] }, facts, ctx).ok, false);
});

test('the loop: tools, then a checked answer', async () => {
  const kc = report.ins.kc;
  const api = fakeApi([
    msg([{ type: 'thinking', thinking: '', signature: 'sig-1' }, toolUse('t1', 'get_overview', {}), toolUse('t2', 'get_insight', { topic: 'knock' })]),
    msg([toolUse('t3', 'submit_answer', { answer: 'Knock Control climbed from ' + kc.start + ' to ' + kc.peak + ' while lugging. Keep the revs up first.', action_ids: ['revs'], confidence: 'high' })])
  ]);
  const res = await K.ask.run({ ...base, question: 'Why did Knock Control go up?', fetch: api.fetch });
  assert.equal(res.ok, true, JSON.stringify(res.issues || res.error));
  assert.equal(res.repaired, false);
  assert.deepEqual(res.actions, ['revs']);
  assert.equal(res.trace.filter((s) => s.kind === 'tool').length, 2);
  // request shape
  const first = api.calls[0];
  assert.equal(first.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(first.init.headers['x-api-key'], 'test-key');
  assert.equal(first.init.headers['anthropic-version'], '2023-06-01');
  assert.equal(first.init.headers['anthropic-dangerous-direct-browser-access'], 'true');
  assert.equal(first.init.headers['anthropic-beta'], 'server-side-fallback-2026-07-01');
  assert.equal(first.body.model, 'test-model');
  assert.deepEqual(first.body.tool_choice, { type: 'auto' });
  assert.equal(first.body.fallbacks, 'default');
  assert.equal(first.body.temperature, undefined, 'no sampling parameters');
  assert.ok(first.body.tools.every((t) => t.strict === true));
  // the assistant turn goes back unchanged (thinking block included), tool results in one user message
  const second = api.calls[1].body.messages;
  assert.equal(second[1].role, 'assistant');
  assert.equal(second[1].content[0].type, 'thinking');
  assert.equal(second[2].role, 'user');
  assert.deepEqual(second[2].content.map((b) => b.tool_use_id), ['t1', 't2']);
});

test('the loop: a wrong number gets one repair turn with the reasons', async () => {
  const kc = report.ins.kc;
  const api = fakeApi([
    msg([toolUse('t1', 'get_insight', { topic: 'knock' })]),
    msg([toolUse('t2', 'submit_answer', { answer: 'Knock Control peaked at 0.91.', action_ids: [], confidence: 'high' })]),
    msg([toolUse('t3', 'submit_answer', { answer: 'Knock Control peaked at ' + kc.peak + '.', action_ids: [], confidence: 'high' })])
  ]);
  const res = await K.ask.run({ ...base, question: 'How high did Knock Control go?', fetch: api.fetch });
  assert.equal(res.ok, true);
  assert.equal(res.repaired, true);
  const repair = api.calls[2].body.messages.at(-1).content.find((b) => b.tool_use_id === 't2');
  assert.equal(repair.is_error, true);
  assert.match(repair.content, /0\.91/);
});

test('the loop: still wrong after the repair falls back; a refusal falls back; no key never calls out', async () => {
  const bad = () => msg([toolUse('x' + Math.random(), 'submit_answer', { answer: 'Boost peaked at 31 psi.', action_ids: [], confidence: 'high' })]);
  const r1 = await K.ask.run({ ...base, question: 'q', fetch: fakeApi([bad(), bad()]).fetch });
  assert.equal(r1.ok, false);
  assert.equal(r1.reason, 'unverified');
  assert.ok(r1.issues.length);
  const refusal = { json: { content: [], stop_reason: 'refusal', stop_details: { category: 'cyber' } } };
  const r2 = await K.ask.run({ ...base, question: 'q', fetch: fakeApi([refusal]).fetch });
  assert.deepEqual([r2.ok, r2.reason, r2.category], [false, 'refusal', 'cyber']);
  const api = fakeApi([]);
  const r3 = await K.ask.run({ ...base, apiKey: '', question: 'q', fetch: api.fetch });
  assert.equal(r3.reason, 'nokey');
  assert.equal(api.calls.length, 0);
  const r4 = await K.ask.run({ ...base, question: 'q', fetch: async () => { throw new Error('offline'); } });
  assert.deepEqual([r4.ok, r4.reason, r4.error], [false, 'error', 'offline']);
});

test('the loop: an account that rejects an optional field is retried without it', async () => {
  const caps = {};
  const kc = report.ins.kc;
  const api = fakeApi([
    { status: 400, json: { type: 'error', error: { type: 'invalid_request_error', message: 'fallbacks: not supported for this model' } } },
    msg([toolUse('t1', 'get_insight', { topic: 'knock' })]),
    msg([toolUse('t2', 'submit_answer', { answer: 'It ended at ' + kc.end + '.', action_ids: [], confidence: 'medium' })])
  ]);
  const res = await K.ask.run({ ...base, question: 'Where did Knock Control end?', fetch: api.fetch, caps });
  assert.equal(res.ok, true);
  assert.equal(caps.noFallbacks, true, 'remembered for the next question');
  assert.equal(api.calls[1].body.fallbacks, undefined);
  assert.equal(api.calls[1].init.headers['anthropic-beta'], undefined);
});

test('the loop: a plain-text final answer is checked the same way', async () => {
  const kc = report.ins.kc;
  const api = fakeApi([
    msg([toolUse('t1', 'get_insight', { topic: 'knock' })]),
    msg([{ type: 'text', text: 'It started at ' + kc.start + ' and peaked at ' + kc.peak + '.' }], 'end_turn')
  ]);
  const res = await K.ask.run({ ...base, question: 'q', fetch: api.fetch });
  assert.equal(res.ok, true);
  assert.equal(res.plain, true);
});

test('built-in answers: intent from English or Vietnamese, numbers from the drive', () => {
  const cases = [['Why did Knock Control go up?', 'kc'], ['Vì sao kích nổ tăng?', 'kc'], ['Can I add boost?', 'boost'], ['Tôi có thể tăng boost không?', 'boost'], ['Is my AFR safe?', 'afr'], ['What should I do first?', 'first'], ['Nên làm gì trước?', 'first'], ['Giải thích bản đồ góc lửa', 'timing'], ['hello', 'unknown']];
  for (const [q, intent] of cases) assert.equal(K.ask.intent(q), intent, q);
  const a = K.ask.offline('Why did Knock Control go up?', ctx).answer;
  assert.ok(a.includes(report.ins.kc.end.toFixed(2)) && /lugging/.test(a));
  assert.match(K.ask.offline('Can I add boost?', ctx).answer, /^Not now/);
});

test('parity lock (ticket 16): the shared banned-advice cases refuse or pass here exactly as in server verify', () => {
  // The case list is shared with server/tests/test_scorecard.py: only the
  // three edits both sides phrase the same way are listed (knock sensitivity,
  // timing, protections). Boost-raise and curve-edit phrasing are policed
  // differently by design (here: locked actions) and stay out of the list.
  const fs = require('fs'), path = require('path');
  const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'tests', 'banned_advice_cases.json'), 'utf8')).cases;
  assert.ok(cases.length >= 10, 'a case list worth locking');
  for (const c of cases) {
    const facts = new K.ask.Facts();
    facts.add(c.text);   // numbers are not what this locks: only the advice judgement
    const v = K.ask.verify({ answer: c.text, action_ids: [] }, facts, ctx);
    assert.equal(v.ok, c.expect === 'allowed', c.id + ': ' + JSON.stringify(v.issues));
  }
});

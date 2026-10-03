/*!
 * KTA ask: "Ask about this drive", grounded.
 *
 * Built-in answers (no network) come from fixed templates over the drive's numbers.
 * With the owner's own Anthropic API key, a model explains in plain words, but:
 *   - it sees the drive only through fixed, deterministic tools (no raw log);
 *   - every number in its answer must match a number those tools returned;
 *   - it may only recommend actions from the app's own ranked list, and never a locked one;
 *   - advice the app never gives (less knock sensitivity, more timing or boost) is rejected;
 *   - a failed check gets one repair turn; after that the built-in answer is shown instead.
 * The same drive gives the same tool results every time; the checks make the rest safe.
 *
 * Raw HTTP (fetch) on purpose: the app is plain files opened from disk, with no build step
 * to bundle an SDK. Model ids are never hard-coded: the owner picks one from their account.
 */
(function (root, factory) {
  var K = typeof module === 'object' && module.exports ? require('./kta-drive.js') : root.KTA;
  var api = factory(K);
  if (typeof module === 'object' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (KTA) {
  'use strict';
  var U = KTA.util, isNum = U.isNum, round = U.round, quantile = U.quantile;
  var ASK = KTA.ask = {};
  var API = 'https://api.anthropic.com';

  var TOPICS = ['knock', 'lugging', 'heat', 'mixture', 'boost', 'trims', 'accel', 'quality'];
  var CHANNELS = {
    rpm: 'rpm', speed_kmh: 'vss', map_psi: 'load', boost_psi: 'boost', boost_target_psi: 'boostTarget', afr: 'lam', ignition_deg: 'ign',
    knock_retard_deg: 'knock', knock_control: 'kControl', iat_c: 'iat', iat2_c: 'iat2', ect_c: 'ect', cvt_c: 'cvt', throttle_cmd_pct: 'tpsCmd',
    stft_pct: 'stft', ltft_pct: 'ltft', wastegate_pos_pct: 'wgPos'
  };
  var WHERE = ['all', 'moving', 'under_boost', 'lugging', 'standstill'];
  var ACTION_ENUM = KTA.ACTION_IDS.concat(['fix']);
  ASK.TOPICS = TOPICS; ASK.CHANNELS = Object.keys(CHANNELS); ASK.WHERE = WHERE; ASK.ACTION_ENUM = ACTION_ENUM;

  // ---------------------------------------------------------------------------
  // Tools: fixed for the whole session (the tool list is part of the prompt prefix)
  // ---------------------------------------------------------------------------
  function obj(props, req) { return { type: 'object', properties: props, required: req, additionalProperties: false }; }
  ASK.tools = function () {
    return [
      { name: 'get_overview', strict: true, input_schema: obj({}, []),
        description: 'Call this first for every question. Returns the verdict, every safety check (status and value), the app\'s ranked action list (now, next, locked and why, fine) and basic facts about the drive.' },
      { name: 'get_insight', strict: true, input_schema: obj({ topic: { type: 'string', enum: TOPICS, description: 'knock: Knock Control, its rises and falls and the conditions at each step up; lugging: low-rpm load and timing there; heat: intake air, CVT, coolant; mixture: AFR by boost band against the map; boost: pulls, peak boost, wastegate headroom; trims: closed-loop fuel trims by load; accel: acceleration windows; quality: glitches and missing channels.' } }, ['topic']),
        description: 'Numbers for one topic of this drive. Call it for each topic the question touches.' },
      { name: 'get_action', strict: true, input_schema: obj({ id: { type: 'string', enum: ACTION_ENUM, description: 'An action id from get_overview. "fix" returns the safety fixes.' } }, ['id']),
        description: 'Everything about one action: title, why (with its numbers), the steps, how the next log proves it, undo, its place in the order, and what locks it. Call it before you recommend or explain an action.' },
      { name: 'get_channel_stats', strict: true, input_schema: obj({ channel: { type: 'string', enum: ASK.CHANNELS }, where: { type: 'string', enum: WHERE } }, ['channel', 'where']),
        description: 'Percentiles (p5, median, p95) and min/max of one logged channel over part of the drive. Use it only when the insights do not answer the question.' },
      { name: 'get_timing_cell', strict: true, input_schema: obj({ rpm: { type: 'number' }, map_psi: { type: 'number', description: 'Manifold pressure, psi gauge (negative is vacuum).' } }, ['rpm', 'map_psi']),
        description: 'Median ignition advance and knock retard in the timing-map cell that holds this rpm and manifold pressure.' },
      { name: 'get_pull', strict: true, input_schema: obj({ index: { type: 'integer', description: '0-based index into the pulls listed by get_insight boost.' } }, ['index']),
        description: 'One boost event (pull): rpm and speed range, peak boost and target, wastegate position, intake air, mixture, timing.' },
      { name: 'submit_answer', strict: true, input_schema: obj({
        answer: { type: 'string', description: 'Your final answer for the owner, in plain words, under 150 words.' },
        action_ids: { type: 'array', items: { type: 'string', enum: ACTION_ENUM }, description: 'Ids of the actions you recommend doing now or next. Never a locked one. Empty if none.' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
      }, ['answer', 'action_ids', 'confidence']),
        description: 'Call once, last, with your final answer. The app checks every number in the answer against the tool results and rejects answers that do not match.' }
    ];
  };

  var LANG = { en: 'English', vi: 'Vietnamese' };
  ASK.system = function (lang) {
    return [
      'You explain one car\'s datalog to its owner. The car: Honda Civic FE 1.5T CVT on Vietnam E10 RON95 fuel, KTuner map "Starter 21 Dual Tune 2", with intake, downpipe, exhaust, big intercooler and CVT cooler. The owner tunes on the street without a dyno and wants the car to feel better without hurting the engine or the CVT.',
      'You see the drive only through the tools. Rules:',
      '1. Take every number from the tools. Call get_overview first, then the tools the question needs. Quote numbers as the tools return them (rounding is fine). Do not compute new numbers: no differences, sums, averages or percentages of your own.',
      '2. Recommend only actions from the app\'s list, in the app\'s order; safety comes first. Never recommend a locked action as something to do now. You may explain what unlocks it.',
      '3. Never suggest lowering knock sensitivity, disabling a sensor or protection, adding ignition timing, or adding boost beyond the listed levers. If asked, say it is outside what this app can check safely, and why.',
      '4. If the tools cannot answer, say so and name the channel or log that would.',
      '5. Answer in ' + (LANG[lang] || 'English') + ', in plain words for a car owner, under 150 words, no tables. Mention the numbers you rely on.',
      '6. Finish by calling submit_answer once. The app checks every number in your answer against the tool results.'
    ].join('\n');
  };

  // ---------------------------------------------------------------------------
  // Tool handlers: pure functions of the drive report (and the log for channel stats)
  // ---------------------------------------------------------------------------
  function text(fn) { var args = Array.prototype.slice.call(arguments, 1); return typeof fn === 'function' ? fn.apply(null, args) : fn; }
  function findCheck(ctx, id) {
    var out = null;
    ctx.report.an.gates.forEach(function (g) { g.checks.forEach(function (c) { if (c.id === id) out = c; }); });
    return out;
  }
  function checkText(ctx, c) { return ctx.checkText ? ctx.checkText(c) : { label: c.label, display: c.display, fix: c.fix }; }
  function actionTitle(ctx, a) {
    var d = ctx.T.actions[a.id] || ctx.T.actions.fix;
    if (a.tier === 'safety') { var c = findCheck(ctx, a.check); return d.title(c ? checkText(ctx, c).label : a.check); }
    return text(d.title);
  }
  function blockerTexts(ctx, a) { return (a.blockedBy || []).map(function (b) { var fn = ctx.T.blockers[b]; return fn ? fn(ctx.report.ins, ctx.F) : b; }); }
  function slim(v) {
    if (Array.isArray(v)) return v.map(slim);
    if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { if (k.charAt(0) !== '_' && k !== 'timeline' && k !== 'cells') o[k] = slim(v[k]); }); return o; }
    return typeof v === 'number' && !isNum(v) ? null : v;
  }

  function overview(ctx) {
    var r = ctx.report, an = r.an, P = r.plan, I = r.ins;
    var place = function (list) { return list.map(function (a) { return { id: a.tier === 'safety' ? 'fix' : a.id, title: actionTitle(ctx, a), rank: a.rank, tier: a.tier, locked_until: a.blockedBy ? blockerTexts(ctx, a) : undefined }; }); };
    return {
      verdict: an.verdict, verdict_text: ctx.T.safe[an.verdict],
      checks: [].concat.apply([], an.gates.map(function (g) {
        return g.checks.map(function (c) { var tx = checkText(ctx, c); return { gate: g.id, id: c.id, label: tx.label, status: c.status, value: tx.display }; });
      })),
      actions: { now: place(P.now), next: place(P.next), locked: place(P.later), fine: P.fine.map(function (f) { return { id: f.id, why_fine: (ctx.T.fine[f.id] || function () { return ''; })(I, ctx.F) }; }) },
      drive: { minutes: round(I.meta.duration / 60, 1), moving_minutes: round(I.meta.movingSeconds / 60, 1), hard_pulls: I.boost ? I.boost.hard : 0, logger: I.meta.source, samples_per_second: I.meta.rateHz }
    };
  }
  function insight(ctx, topic) {
    var I = ctx.report.ins;
    switch (topic) {
      case 'knock': return I.kc ? slim({ knock_control: { start: I.kc.start, end: I.kc.end, peak: I.kc.peak, rise: I.kc.rise, peak_that_counts: I.kc.judgedPeak, rise_that_counts: I.kc.judgedRise, rises_counting: I.kc.countedRises, rises_skipped_above_rpm: I.kc.excludedRises, steps_up: I.kc.upSteps, steps_up_while_lugging: I.kc.lugUpSteps, median_rpm_at_steps: I.kc.upRpm, median_speed_at_steps: I.kc.upVss, median_map_psi_at_steps: I.kc.upLoad }, episodes: I.kc.episodes, knock_retard_is_scheduled: I.quality.knockScheduled, meaning: '0.5 is about RON95; higher means the ECU heard knock and uses safer timing everywhere; above 0.56 the app flags it. This non-Si ECU also raises it on purpose above about 5,200 rpm: those rises are shown with counts: false and are not counted toward the fuel or heat verdicts.' }) : { error: 'Knock Control is not in this log.' };
      case 'lugging': return I.lug ? slim({ lugging: I.lug, definition: '900-1,700 rpm with -3 psi or more manifold pressure, above 15 km/h, engine warm; compared with the same load at 2,000-3,000 rpm' }) : { error: 'No rpm or manifold pressure in this log.' };
      case 'heat': return slim({ heat: I.heat, pulls_started_at_iat_c: I.boost ? I.boost.pullIat : null, pull_iat_max_c: I.boost ? I.boost.pullIatMax : null, iat_drop_during_pull_c: I.boost ? I.boost.pullIatDrop : null });
      case 'mixture': return I.mix ? slim({ mixture: I.mix, note: 'AFR on the gasoline scale (lambda x 14.7). The map asks the full-load target; richer is safe, leaner than 12.0 is the limit.', has_afr_command: I.quality.hasAfrCmd }) : { error: 'No O2/AFR or manifold pressure in this log.' };
      case 'boost': return I.boost ? slim({ boost: I.boost, note: 'wgAtPeak is the wastegate position (% open) at peak boost; 5 % or less means the turbo is near its limit on this map' }) : { error: 'No boost channel in this log.' };
      case 'trims': return I.trims ? slim({ trims: I.trims, note: 'Combined short and long-term trim, closed loop, by manifold pressure. Within ±5 % means the AFM reads the intake right.' }) : { error: 'No fuel trims in this log.' };
      case 'accel': return I.accel ? slim({ best: I.accel.best, runs: I.accel.runs.slice(0, 20), note: 'Seconds through each speed window with the pedal held at 60 % or more; full = 85 % or more' }) : { error: 'No speed channel in this log.' };
      case 'quality': return slim({ quality: I.quality, logger: I.meta.source, samples_per_second: I.meta.rateHz });
      default: return { error: 'Unknown topic.' };
    }
  }
  function action(ctx, id) {
    var P = ctx.report.plan, all = P.all;
    if (id === 'fix') {
      var fixes = all.filter(function (a) { return a.tier === 'safety'; });
      if (!fixes.length) return { none: 'No safety fix needed: nothing in this drive is a Stop.' };
      return { fixes: fixes.map(function (a) { var c = findCheck(ctx, a.check), tx = c ? checkText(ctx, c) : {}; return { check: a.check, title: actionTitle(ctx, a), this_drive: tx.display || a.ev.display, fix: tx.fix || '' }; }) };
    }
    var a = all.filter(function (x) { return x.id === id; })[0], d = ctx.T.actions[id];
    if (!a) {
      var fine = P.fine.filter(function (f) { return f.id === id; })[0];
      return { id: id, title: text(d.title), status: fine ? 'fine' : 'not_needed', why_fine: fine ? (ctx.T.fine[id] || function () { return ''; })(ctx.report.ins, ctx.F) : '' };
    }
    var status = P.now.indexOf(a) >= 0 ? 'now' : (P.next.indexOf(a) >= 0 ? 'next' : 'locked');
    return slim({
      id: id, title: text(d.title), status: status, rank: a.rank, tier: a.tier, impact: a.impact, effort: a.effort, risk: a.risk, needs_flash: a.flash,
      why: d.why(a.ev, ctx.F), steps: d.steps, proof: d.proof(a.ev, ctx.F), undo: d.undo, note: d.note || '',
      locked_until: a.blockedBy ? blockerTexts(ctx, a) : [], evidence: a.ev
    });
  }
  function masks(ctx) {
    if (ctx._m) return ctx._m;
    var log = ctx.log, n = log.n, has = log.has, DL = KTA.DRIVE_LIMITS, load = has.load ? log.load : null;
    var m = { all: null, moving: new Uint8Array(n), under_boost: new Uint8Array(n), lugging: new Uint8Array(n), standstill: new Uint8Array(n) };
    for (var i = 0; i < n; i++) {
      var v = has.vss ? log.vss[i] : NaN;
      m.moving[i] = has.vss ? (v >= 3 ? 1 : 0) : 1;
      m.standstill[i] = has.vss && v < 1 ? 1 : 0;
      m.under_boost[i] = load && load[i] >= DL.pullLoad ? 1 : 0;
      m.lugging[i] = has.rpm && load && (!has.ect || log.ect[i] >= DL.warmEct) && log.rpm[i] >= DL.lug.rpmMin && log.rpm[i] < DL.lug.rpmMax && load[i] >= DL.lug.loadMin && (!has.vss || v >= DL.lug.vssMin) ? 1 : 0;
    }
    ctx._m = m;
    return m;
  }
  function channelStats(ctx, channel, where) {
    if (!ctx.log) return { error: 'The raw log is not loaded in this session.' };
    var key = CHANNELS[channel];
    if (!key) return { error: 'Unknown channel.' };
    var a = ctx.log[key];
    if (!ctx.log.has[key]) return { error: channel + ' is not in this log.' };
    var mk = where === 'all' ? null : masks(ctx)[where];
    var scale = key === 'lam' ? KTA.GAS_SCALE : 1, k = 0, s = 0;
    for (var i = 0; i < ctx.log.n; i++) if ((!mk || mk[i]) && isNum(a[i])) { k++; s += ctx.log.w[i]; }
    if (!k) return { channel: channel, where: where, samples: 0 };
    function qq(p) { return round(quantile(a, p, mk) * scale, 2); }
    return { channel: channel, where: where, seconds: round(s, 1), p5: qq(0.05), median: qq(0.5), p95: qq(0.95), min: qq(0), max: qq(1) };
  }
  function timingCell(ctx, rpm, psi) {
    var G = ctx.report.ins.grid;
    if (!G) return { error: 'No timing map: rpm, manifold pressure or ignition missing.' };
    var r = -1, c = -1;
    for (var x = 0; x < G.rpm.length - 1; x++) if (rpm >= G.rpm[x] && rpm < G.rpm[x + 1]) r = x;
    for (var y = 0; y < G.load.length - 1; y++) if (psi >= G.load[y] && psi < G.load[y + 1]) c = y;
    if (r < 0 || c < 0) return { error: 'Outside the map (' + G.rpm[0] + '-' + G.rpm[G.rpm.length - 1] + ' rpm, ' + G.load[0] + ' to ' + G.load[G.load.length - 1] + ' psi).' };
    var cell = G.cells.filter(function (e) { return e.r === r && e.c === c; })[0];
    var base = { rpm_from: G.rpm[r], rpm_to: G.rpm[r + 1], map_psi_from: G.load[c], map_psi_to: G.load[c + 1] };
    if (!cell) { base.samples = 'too few in this drive'; return base; }
    base.ignition_deg = cell.ign; base.knock_retard_deg = cell.kr; base.seconds = cell.seconds; base.in_lugging_zone = cell.lug;
    return base;
  }
  function pull(ctx, index) {
    var B = ctx.report.ins.boost;
    if (!B || !B.events.length) return { error: 'No pulls in this drive.' };
    if (!(index >= 0 && index < B.events.length)) return { error: 'Index must be 0 to ' + (B.events.length - 1) + '.' };
    return slim(B.events[index]);
  }
  ASK.runTool = function (ctx, name, input) {
    input = input || {};
    try {
      switch (name) {
        case 'get_overview': return { result: overview(ctx) };
        case 'get_insight': return TOPICS.indexOf(input.topic) < 0 ? { error: 'topic must be one of ' + TOPICS.join(', ') } : wrap(insight(ctx, input.topic));
        case 'get_action': return ACTION_ENUM.indexOf(input.id) < 0 ? { error: 'id must be one of ' + ACTION_ENUM.join(', ') } : wrap(action(ctx, input.id));
        case 'get_channel_stats': return WHERE.indexOf(input.where) < 0 ? { error: 'where must be one of ' + WHERE.join(', ') } : wrap(channelStats(ctx, input.channel, input.where));
        case 'get_timing_cell': return isNum(input.rpm) && isNum(input.map_psi) ? wrap(timingCell(ctx, input.rpm, input.map_psi)) : { error: 'rpm and map_psi must be numbers' };
        case 'get_pull': return isNum(input.index) ? wrap(pull(ctx, Math.round(input.index))) : { error: 'index must be an integer' };
        default: return { error: 'Unknown tool ' + name };
      }
    } catch (e) { return { error: 'Tool failed: ' + ((e && e.message) || e) }; }
    function wrap(r) { return r && r.error ? { error: r.error } : { result: r }; }
  };

  // ---------------------------------------------------------------------------
  // The check: numbers, actions, and advice the app never gives
  // ---------------------------------------------------------------------------
  // Numbers anyone may say: the car (1.5 litre, RON 95/92, E10, 14.7 stoich scale).
  var FREE = [1.5, 14.7, 95, 92, 10];
  function numbersIn(s) {
    var out = [], re = /(^|[^A-Za-z0-9_.])([-+]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|[-+]?\d+(?:\.\d+)?)(?![A-Za-z]*\d)/g, m;
    s = String(s).replace(/^\s*(\d+)[.)]\s/gm, ' ');   // list markers "1. " / "2) "
    while ((m = re.exec(s))) {
      var raw = m[2], v = parseFloat(raw.replace(/,/g, ''));
      if (isNum(v)) out.push({ raw: raw, v: v });
    }
    return out;
  }
  ASK.numbersIn = numbersIn;
  function Facts() { this.list = []; this.seen = {}; }
  Facts.prototype.addNum = function (v) { if (isNum(v)) { var k = String(v); if (!this.seen[k]) { this.seen[k] = 1; this.list.push(v); } } };
  Facts.prototype.add = function (v) {
    var self = this;
    if (v == null) return;
    if (typeof v === 'number') self.addNum(v);
    else if (typeof v === 'string') numbersIn(v).forEach(function (x) { self.addNum(x.v); });
    else if (Array.isArray(v)) v.forEach(function (x) { self.add(x); });
    else if (typeof v === 'object') Object.keys(v).forEach(function (k) { self.add(v[k]); });
  };
  function near(x, f) {
    if (Math.abs(x - f) < 1e-9) return true;
    var af = Math.abs(f), c = [Math.round(f), round(f, 1), round(f, 2)];
    if (af >= 100) c.push(Math.round(f / 10) * 10);
    if (af >= 1000) c.push(Math.round(f / 100) * 100);
    return c.some(function (y) { return Math.abs(y - x) < 1e-9; });
  }
  Facts.prototype.has = function (x) {
    for (var i = 0; i < this.list.length; i++) { var f = this.list[i]; if (near(x, f) || near(-x, f)) return true; }
    return FREE.indexOf(Math.abs(x)) >= 0;
  };
  ASK.Facts = Facts;

  // \w and \W are ASCII-only in JavaScript: Vietnamese words need Unicode letter classes.
  function uni(re, flags) { return new RegExp(re.source.replace(/\\w/g, '[\\p{L}\\p{N}_]').replace(/\\W/g, '[^\\p{L}\\p{N}_]'), flags); }
  var NEG = uni(/(don'?t|do not|never|not|no|avoid|without|isn'?t|không|đừng|chưa|tránh|chớ)\W+(\w+\W+){0,4}$/, 'iu');
  // Only edits the app never recommends, phrased as edits: explanations such as "a lower Knock
  // Control gives more timing" stay allowed. Boost is policed through action_ids (locked levers).
  var BANNED = [
    { id: 'knockSens', re: /(lower|reduce|decrease|desensiti[sz]e|turn down|disable|turn off|remove|unplug)\W+(\w+\W+){0,2}knock\W*(sensor|sensitivity|detection)|knock\W*(sensor\W*)?sensitivity\W+(\w+\W+){0,2}(down|lower|reduce)|(giảm|tắt|bỏ)\W+(độ nhạy\W+)(\w+\W+){0,2}kích nổ|(tắt|bỏ|rút)\W+cảm biến\W+kích nổ/i },
    { id: 'timing', re: /(advance|add|increase|raise)\W+(\w+\W+){0,3}(ignition|timing|spark)\W+(\w+\W+){0,2}(table|map|cells?)\b|(add|advance)\W+\d+(\.\d+)?\W*(°|deg|degrees?)\W+(of\W+)?(ignition|timing)|(tăng|thêm)\W+(\w+\W+){0,2}(góc\W+)?(đánh\W+)?lửa\W+(\w+\W+){0,2}(bảng|map)/i },
    { id: 'protections', re: /(disable|turn off|delete|remove|clear)\W+(\w+\W+){0,2}(check engine|cel\b|mil\b|catalyst|cat\b|o2 sensor|lambda sensor|limp mode|torque protection)|(tắt|xóa|bỏ)\W+(\w+\W+){0,1}(đèn check|cảm biến o2|bảo vệ mô-men)/i }
  ];
  BANNED.forEach(function (b) { b.re = uni(b.re, 'giu'); });

  /** Checks a draft answer. Returns { ok, issues: [codes and text] }. */
  ASK.verify = function (draft, facts, ctx) {
    var issues = [];
    var ans = String(draft.answer || '');
    if (!ans.trim()) issues.push('The answer is empty.');
    var bad = numbersIn(ans).filter(function (x) { return !facts.has(x.v); }).map(function (x) { return x.raw; });
    if (bad.length) issues.push('These numbers are not in any tool result: ' + bad.slice(0, 8).join(', ') + '. Quote tool numbers exactly (rounding is fine) and do not compute new ones.');
    var P = ctx.report.plan;
    var locked = {}, open = {};
    P.later.forEach(function (a) { locked[a.id] = a; });
    P.now.concat(P.next).forEach(function (a) { open[a.tier === 'safety' ? 'fix' : a.id] = true; });
    (draft.action_ids || []).forEach(function (id) {
      if (ACTION_ENUM.indexOf(id) < 0) issues.push('Unknown action id ' + id + '.');
      else if (locked[id]) issues.push('Action ' + id + ' is locked for this drive (' + blockerTexts(ctx, locked[id]).join('; ') + '). Do not recommend it now; you may explain what unlocks it.');
      else if (!open[id]) issues.push('Action ' + id + ' is not on this drive\'s list. Recommend only listed actions.');
    });
    BANNED.forEach(function (b) {
      if (b.unless && !locked[b.unless] && P.all.some(function (a) { return a.id === b.unless && !a.blockedBy; })) return;
      var re = new RegExp(b.re.source, 'giu'), m;
      while ((m = re.exec(ans))) {
        // Same sentence only: a verdict line ("costs timing, not damage.") must not launder advice after its full stop.
        var before = ans.slice(Math.max(0, m.index - 40), m.index).split(/[.!?\u2026\n]+/).pop();
        if (!NEG.test(before)) { issues.push('The answer suggests "' + m[0].trim() + '", which this app never recommends for this drive. Remove it or say why not to.'); break; }
      }
    });
    return { ok: !issues.length, issues: issues };
  };

  // ---------------------------------------------------------------------------
  // Built-in answers (no network, no key)
  // ---------------------------------------------------------------------------
  ASK.intent = function (q) {
    var s = String(q || '').toLowerCase();
    if (/(what|which).*(first|next|do)|priority|order|nên làm gì|làm gì trước|trước tiên|ưu tiên|số 1/.test(s)) return 'first';
    if (/boost|psi|more power|faster map|tăng (sức|công suất)|mạnh hơn/.test(s)) return 'boost';
    if (/afr|mixture|rich|lean|lambda|hòa khí|giàu|loãng/.test(s)) return 'afr';
    if (/knock|kích nổ|k\.? ?control|kcon/.test(s)) return 'kc';
    if (/timing|ignition|góc lửa|đánh lửa/.test(s)) return 'timing';
    if (/heat|hot|iat|temp|cvt|nhiệt|nóng|khí nạp|hộp số/.test(s)) return 'heat';
    if (/accel|quick|fast|0-100|50.?70|tăng tốc|nhanh/.test(s)) return 'accel';
    if (/safe|damage|engine ok|an toàn|hỏng|hại máy/.test(s)) return 'first';
    return 'unknown';
  };
  /** The context tools and checks read: { report, log, T (drive texts), checkText(c), F }. */
  ASK.context = function (opts) { return { report: opts.report, log: opts.log, T: opts.T, checkText: opts.checkText, F: opts.F || KTA.fmt }; };
  ASK.offline = function (question, ctx) {
    var O = ctx.T.offline, intent = ASK.intent(question), I = ctx.report.ins, F = ctx.F;
    var body = intent === 'unknown' ? O.unknown : O[intent](I, F, ctx.report.plan);
    if (intent === 'first' || intent === 'unknown') body = ctx.T.safe[ctx.report.an.verdict] + ' ' + body;
    return { intent: intent, answer: body };
  };

  // ---------------------------------------------------------------------------
  // The API loop
  // ---------------------------------------------------------------------------
  function headers(opts, beta) {
    var h = { 'content-type': 'application/json', 'x-api-key': opts.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
    if (beta) h['anthropic-beta'] = beta;
    return h;
  }
  /** Lists the models this key can use (newest first, as the API returns them). */
  ASK.listModels = function (opts) {
    var f = opts.fetch || (typeof fetch === 'function' ? fetch : null);
    return f(API + '/v1/models?limit=50', { method: 'GET', headers: headers(opts) }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
        return (j.data || []).map(function (m) { return { id: m.id, name: m.display_name || m.id }; });
      });
    });
  };

  /*
   * opts: { question, report, log, T (drive texts), checkText(c) -> { label, display, fix }, F, lang,
   *         apiKey, model, fetch, caps (object kept between questions), maxCalls, onStep(step) }
   * Resolves { ok, answer, actions, confidence, repaired, trace, calls } or { ok: false, reason, ... }.
   * Never rejects: network and API errors come back as { ok: false, reason: 'error' }.
   */
  ASK.run = function (opts) {
    var f = opts.fetch || (typeof fetch === 'function' ? fetch : null);
    var caps = opts.caps || {};
    var ctx = ASK.context(opts);
    var tools = ASK.tools(), system = ASK.system(opts.lang);
    var facts = new Facts();
    facts.add(opts.question);
    var messages = [{ role: 'user', content: 'Question from the owner: ' + opts.question }];
    var trace = [], calls = 0, repairs = 0, maxCalls = opts.maxCalls || 8;
    function step(s) { trace.push(s); if (opts.onStep) try { opts.onStep(s); } catch (e) { /* ui only */ } }

    function body() {
      var b = { model: opts.model, max_tokens: 8000, system: system, tools: tools.map(function (t) { var o = { name: t.name, description: t.description, input_schema: t.input_schema }; if (!caps.noStrict) o.strict = true; return o; }), tool_choice: { type: 'auto' }, messages: messages };
      if (!caps.noEffort) b.output_config = { effort: 'medium' };
      if (!caps.noFallbacks) b.fallbacks = 'default';
      return b;
    }
    function call(retry) {
      calls++;
      return f(API + '/v1/messages', { method: 'POST', headers: headers(opts, caps.noFallbacks ? null : 'server-side-fallback-2026-07-01'), body: JSON.stringify(body()) }).then(function (r) {
        return r.json().catch(function () { return null; }).then(function (j) {
          if (r.ok) return j;
          var msg = (j && j.error && j.error.message) || ('HTTP ' + r.status);
          // Older models or accounts reject some optional fields: drop the one named and retry once each.
          if (r.status === 400 && retry < 3) {
            if (/fallback/i.test(msg) && !caps.noFallbacks) { caps.noFallbacks = true; return call(retry + 1); }
            if (/effort|output_config/i.test(msg) && !caps.noEffort) { caps.noEffort = true; return call(retry + 1); }
            if (/strict/i.test(msg) && !caps.noStrict) { caps.noStrict = true; return call(retry + 1); }
          }
          var err = new Error(msg); err.status = r.status; throw err;
        });
      });
    }
    function fail(reason, extra) { var o = { ok: false, reason: reason, trace: trace, calls: calls }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
    function finish(draft, plain) {
      var v = ASK.verify(draft, facts, ctx);
      step({ kind: 'check', ok: v.ok, issues: v.issues });
      if (v.ok) return { done: { ok: true, answer: draft.answer, actions: draft.action_ids || [], confidence: draft.confidence || 'medium', repaired: repairs > 0, plain: !!plain, trace: trace, calls: calls } };
      if (repairs >= 1) return { done: fail('unverified', { issues: v.issues, draft: draft.answer }) };
      repairs++;
      return { issues: v.issues };
    }

    function turn() {
      if (calls >= maxCalls) return Promise.resolve(fail('turns'));
      return call(0).then(function (res) {
        if (!res || !Array.isArray(res.content)) return fail('error', { error: 'Empty response' });
        if (res.stop_reason === 'refusal') return fail('refusal', { category: res.stop_details && res.stop_details.category });
        if (res.stop_reason === 'max_tokens') return fail('max_tokens');
        messages.push({ role: 'assistant', content: res.content });   // unchanged, thinking blocks included
        var uses = res.content.filter(function (b) { return b.type === 'tool_use'; });
        if (uses.length) {
          var results = [], submitted = null;
          uses.forEach(function (u) {
            if (u.name === 'submit_answer') { submitted = u; return; }
            var out = ASK.runTool(ctx, u.name, u.input);
            step({ kind: 'tool', name: u.name, input: u.input, error: out.error || '' });
            if (out.error) results.push({ type: 'tool_result', tool_use_id: u.id, is_error: true, content: out.error });
            else { facts.add(out.result); results.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(out.result) }); }
          });
          if (submitted) {
            var fin = finish(submitted.input || {}, false);
            if (fin.done) return fin.done;
            results.push({ type: 'tool_result', tool_use_id: submitted.id, is_error: true, content: 'Rejected by the number check. Fix these, then call submit_answer again:\n- ' + fin.issues.join('\n- ') });
          }
          messages.push({ role: 'user', content: results });
          return turn();
        }
        var txt = res.content.filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n').trim();
        if (!txt) return fail('empty');
        var fin2 = finish({ answer: txt, action_ids: [], confidence: 'medium' }, true);
        if (fin2.done) return fin2.done;
        messages.push({ role: 'user', content: 'Your answer did not pass the number check:\n- ' + fin2.issues.join('\n- ') + '\nUse the tools, quote their numbers, and finish with submit_answer.' });
        return turn();
      });
    }
    if (!f) return Promise.resolve(fail('error', { error: 'fetch is not available' }));
    if (!opts.apiKey || !opts.model) return Promise.resolve(fail('nokey'));
    return turn().catch(function (e) { return fail('error', { error: (e && e.message) || String(e), status: e && e.status }); });
  };

  return KTA;
}));

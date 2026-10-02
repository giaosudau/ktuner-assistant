/* Guided demo: check a drive, do one thing, prove it.
 * Runs the real engine (engine/*.js) on the owner's real KTuner logs and reuses the English app text.
 * The one thing that is NOT real is the "next hot drive" in step 6: it is derived from the real
 * Aug 30 drive with lugging and Knock Control brought down, and it is labelled SIMULATED. */
(function () {
  'use strict';
  var K = window.KTA, T = window.KTA_I18N.en, D = T.drive, F = K.fmt;
  var ID = 'aug30-1601', COOL = 'sep01-0813', PULLS = 'aug30-1529', ACTION = 'revs';

  var S = { step: 0, busy: '', err: '' };
  var reports = {}, sim = null, proofReal = null, proofSim = null, afterPlan = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function n(v, d) { return isNum(v) ? F.num(v, d == null ? 1 : d) : '-'; }
  var root = document.getElementById('demo');

  // ---------------------------------------------------------------- data
  function loadScript(src) {
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Cannot load ' + src)); }; document.head.appendChild(s); });
  }
  function gunzip(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }
  function report(id) {
    if (reports[id]) return Promise.resolve(reports[id]);
    return (window.KTA_EXAMPLES && window.KTA_EXAMPLES[id] ? Promise.resolve() : loadScript('../data/example-' + id + '.js'))
      .then(function () { return gunzip(window.KTA_EXAMPLES[id].gz); })
      .then(function (text) {
        var parsed = K.parseCSV(text);
        var log = K.buildLog(parsed, K.detectChannels(parsed.headers, parsed.columns));
        return (reports[id] = K.checkDrive(log, {}));
      });
  }

  /** The next hot drive, SIMULATED: the real Aug 30 drive with lugging and the Knock Control climb brought down. */
  function simulate(base) {
    var r = JSON.parse(JSON.stringify(base)), I = r.ins;
    I.lug.share = 1.2; I.lug.seconds = Math.round(I.meta.movingSeconds * 0.012); I.lug.episodes = 6; I.lug.longest = 2.4;
    var start = I.kc.start;
    I.kc.timeline.forEach(function (p) { p.v = Math.round((start + (p.v - start) * 0.08) * 1000) / 1000; p.lug = (p.lug || 0) * 0.12; });
    I.kc.end = Math.round((start + 0.01) * 100) / 100; I.kc.peak = Math.round((start + 0.03) * 100) / 100; I.kc.rise = 0.01; I.kc.lugRises = 0;
    I.kc.episodes = []; I.kc.upSteps = 4; I.kc.lugUpSteps = 1;
    I.heat.iatMoving = I.heat.iatMoving - 1;
    r.plan = K.planActions(r, []);
    return r;
  }

  // ---------------------------------------------------------------- text helpers
  function actionText(a) {
    var d = D.actions[a.id] || D.actions.fix;
    return { title: d.title, why: d.why(a.ev, F), steps: d.steps, proof: d.proof(a.ev, F), undo: d.undo, note: d.note || '' };
  }
  function checkText(c) {
    var d = T.checks[c.id], data = c.data || {};
    return d ? { label: d.label, display: d.display(data, F) } : { label: c.label, display: c.display };
  }
  var ICON = {
    ok: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="currentColor" opacity=".18"/><path d="M4.5 8.3l2.2 2.2 4.8-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.6" fill="currentColor" opacity=".25"/><path d="M5.5 7V5.4a2.5 2.5 0 015 0V7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
  };
  function sIcon(st) { return '<span style="color:var(--s-ic)">' + ICON.ok + '</span>'; }
  function badges(a) {
    var B = D.badges, o = '<span class="badge is-tint">' + esc(B.tier[a.tier]) + '</span><span class="badge">' + esc(B.impact[a.impact]) + '</span><span class="badge">' + esc(B.effort[a.effort]) + '</span><span class="badge">' + esc(a.flash ? B.flash : B.noFlash) + '</span>';
    if (!a.flash && a.effort === 1) o += '<span class="badge">' + esc(B.free) + '</span>';
    return '<div class="badges">' + o + '</div>';
  }
  function list(items) { return '<ol class="steps">' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>'; }

  // ---------------------------------------------------------------- screens
  function loop3() {
    var s = S.step;
    var rows = [
      { done: s >= 1, active: s === 0, line: s >= 1 ? 'Aug 30, 16:01 · ' + T.verdict[reports[ID].verdict] : D.loop[0].empty },
      { done: s >= 4, active: s >= 1 && s < 4, line: s >= 4 ? 'Done: ' + D.actions[ACTION].title : s >= 3 ? D.loop[1].active + ': ' + D.actions[ACTION].title : (s >= 1 ? D.actions[ACTION].title : D.loop[1].empty) },
      { done: s >= 6, active: s >= 3 && s < 6, line: s >= 5 ? D.verdicts[proofSim.verdict] : (s === 4 ? D.verdicts[proofReal.verdict] : (s === 3 ? D.loop[2].ready : D.loop[2].empty)) }
    ];
    var h = '<ol class="loop3" aria-label="' + esc(D.title) + '">';
    rows.forEach(function (r, k) {
      h += '<li class="loop-step' + (r.done ? ' is-done' : '') + (r.active ? ' is-active' : '') + '"><span class="loop-n">' + (r.done ? '✓' : k + 1) + '</span><span><b>' + esc(D.loop[k].title) + '</b><small>' + esc(r.line) + '</small></span></li>';
    });
    return h + '</ol>';
  }

  function scrLoad() {
    var h = '<section class="card is-key"><h2 class="card-title">' + esc(D.loop[0].title) + '</h2>';
    h += '<div class="loader"><span class="file-btn" style="opacity:.6;cursor:default">' + esc(D.load) + '</span><span class="muted">&nbsp;or pick one of your own three drives:</span></div>';
    h += '<h3 class="sub-title">' + esc(D.examplesTitle) + '</h3><div class="ex-grid">';
    ['aug30-1601', 'aug30-1529', 'sep01-0813'].forEach(function (id) {
      var ex = D.examples[id], pick = id === ID;
      h += '<button type="button" class="ex-card' + (pick ? ' is-pick pulse' : ' is-off') + '" ' + (pick ? 'data-go="1"' : 'tabindex="-1" aria-disabled="true"') + '>' + (pick ? '<span class="tagline">This demo</span>' : '<span class="tagline" style="color:var(--ink-3)">Try in the full app</span>') + '<b>' + esc(ex.title) + '</b><small>' + esc(S.busy === id ? D.exampleLoading : ex.note) + '</small></button>';
    });
    return h + '</div><p class="small-note">' + esc(D.exampleNote) + '</p></section>';
  }

  function scrSafety(R) {
    var an = R.an, I = R.ins;
    var h = '<section class="card safe-card tinted st-' + an.verdict + '"><div class="safe-head"><div><div class="eyebrow">' + esc(D.safeTitle) + '</div><p class="safe-line">' + esc(D.safe[an.verdict]) + '</p></div></div><div class="gchips">';
    an.gates.forEach(function (g) {
      h += '<details class="gchip st-' + g.status + '"' + (g.status !== 'good' ? ' open' : '') + '><summary>' + sIcon(g.status) + '<b>' + esc(T.gates[g.id]) + '</b><span>' + esc(T.status[g.status]) + '</span></summary><div class="gchip-body">';
      g.checks.forEach(function (c) { var tx = checkText(c); h += '<div class="check-line st-' + c.status + '"><span class="dot"></span><span class="lbl">' + esc(tx.label) + '</span><span class="val">' + esc(tx.display) + '</span></div>'; });
      h += '</div></details>';
    });
    h += '</div></section>';
    h += '<div class="tiles">' +
      tile(n(I.meta.duration / 60, 0) + ' min', 'Drive length') +
      tile(I.boost ? String(I.boost.hard) : '-', 'Hard pulls · peak ' + n(I.boost && I.boost.peakBoost) + ' psi') +
      tile(n(I.lug.share) + ' %', 'Time lugging (900-1,700 rpm, load)', true) +
      tile(n(I.kc.start, 2) + ' → ' + n(I.kc.end, 2), 'Knock Control (peak ' + n(I.kc.peak, 2) + ')', true) +
      tile(n(I.heat.iatMoving, 0) + ' °C', 'Intake air while moving') +
      tile(n(I.mix.fullLoadAfr) + ' AFR', 'Full load (map asks 11.0): rich, safe') + '</div>';
    return h;
  }
  function tile(v, label, hot) { return '<div class="tile' + (hot ? ' is-hot' : '') + '"><b>' + esc(v) + '</b><span>' + esc(label) + '</span></div>'; }

  function kcChart(I, title, tag) {
    var f = K.view.kcTimeline(I);
    if (!f.hasData) return '';
    var s = '<svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(title) + '">';
    f.lug.forEach(function (b) { s += '<rect x="' + b.x + '" y="' + f.plotT + '" width="' + b.w + '" height="' + (f.plotB - f.plotT) + '" style="fill:var(--lug);opacity:' + b.o + '"/>'; });
    function tk(x1, y1, x2, y2) { return '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + y1 + '" y2="' + y2 + '" style="stroke:var(--grid);stroke-width:1"/>'; }
    f.yTicks.forEach(function (t) { s += tk(f.plotL, t.y, f.plotR, t.y) + '<text x="' + (f.plotL - 6) + '" y="' + (t.y + 4) + '" text-anchor="end">' + esc(t.label) + '</text>'; });
    f.iTicks.forEach(function (t) { s += '<text x="' + (f.plotR + 6) + '" y="' + (t.y + 4) + '" style="fill:var(--iat)">' + esc(t.label) + '</text>'; });
    f.xTicks.forEach(function (t, i) { s += '<text x="' + t.x + '" y="' + (f.plotB + 16) + '" text-anchor="' + (i === 0 ? 'start' : 'middle') + '">' + esc(t.label) + '</text>'; });
    s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + f.limitY + '" y2="' + f.limitY + '" style="stroke:var(--stop-ic);stroke-width:1.5;stroke-dasharray:5 4"/>';
    s += '<path d="' + f.iat + '" style="fill:none;stroke:var(--iat);stroke-width:1.4"/><path d="' + f.line + '" style="fill:none;stroke:var(--meas);stroke-width:2.4;stroke-linejoin:round"/>';
    f.marks.forEach(function (m) { s += '<circle cx="' + m.x + '" cy="' + m.y + '" r="5" style="fill:var(--sheet);stroke:' + (m.kind === 'rise' ? 'var(--stop-ic)' : 'var(--good-ic)') + ';stroke-width:2.2"/>'; });
    var G = D.graphs.kc;
    return '<div class="graph"><div class="card-row"><h3 class="sub-title" style="margin:0">' + esc(title) + '</h3>' + (tag || '') + '</div><div class="chart">' + s + '</svg></div><div class="legend">' + G.legend.map(function (l, k) { return '<span><i class="lg lg-kc-' + k + '"></i>' + esc(l) + '</span>'; }).join('') + '</div></div>';
  }

  function scrNow(R, started) {
    var a = R.plan.now[0], x = actionText(a);
    var h = '<section class="card is-key now-card"><div class="card-row"><h2 class="card-title">' + esc(D.nowTitle) + '</h2></div>';
    h += '<div class="act-head"><span class="rank">1</span><div><h3 class="act-title">' + esc(x.title) + '</h3>' + badges(a) + '</div></div>';
    h += '<p class="body-sm"><b>' + esc(D.why) + '.</b> ' + esc(x.why) + '</p>';
    h += '<div class="act-steps"><b>' + esc(D.steps) + '</b>' + list(x.steps) + '</div>';
    h += '<div class="pairs act-pairs"><b>' + esc(D.proof) + '</b><span>' + esc(x.proof) + '</span><b>' + esc(D.undo) + '</b><span>' + esc(x.undo) + '</span></div>';
    h += '<p class="small-note">' + esc(x.note) + '</p><div class="act-buttons">';
    if (started) h += '<span class="pill st-good">' + ICON.ok + esc(D.doing) + '</span>';
    else h += '<button type="button" class="btn pulse" data-go="1">' + esc(D.start) + '</button>';
    return h + '</div></section>';
  }

  function scrQueue(R) {
    var P = R.plan;
    var h = '<section class="card"><h2 class="card-title">' + esc(D.nextTitle) + '</h2>';
    P.next.forEach(function (a, k) {
      var x = actionText(a);
      h += '<details class="act-row"><summary><span class="rank">' + (k + 2) + '</span><span class="act-sum"><b>' + esc(x.title) + '</b>' + badges(a) + '</span></summary><div class="act-body"><p class="body-sm"><b>' + esc(D.why) + '.</b> ' + esc(x.why) + '</p>' + list(x.steps) + '</div></details>';
    });
    if (P.later.length) {
      h += '<h3 class="sub-title">' + esc(D.laterTitle) + '</h3>';
      P.later.forEach(function (a) {
        var x = actionText(a);
        h += '<div class="lock-row"><span class="lock">' + ICON.lock + '</span><div><b>' + esc(x.title) + '</b><small>' + esc(D.unlocksWhen) + ':</small><ul class="dots">' + (a.blockedBy || []).map(function (b) { var fn = D.blockers[b]; return '<li>' + esc(fn ? fn(R.ins, F) : b) + '</li>'; }).join('') + '</ul></div></div>';
      });
    }
    if (P.fine.length) {
      h += '<h3 class="sub-title">' + esc(D.fineTitle) + '</h3><div class="fine-list">';
      P.fine.forEach(function (f) { var fn = D.fine[f.id]; h += '<div class="fine"><span class="tick">' + ICON.ok + '</span><span><b>' + esc(D.actions[f.id].title) + '.</b> ' + esc(fn ? fn(R.ins, F) : '') + '</span></div>'; });
      h += '</div>';
    }
    return h + '</section>';
  }

  function scrLoadNext() {
    var h = '<section class="card is-key prove-card"><div class="card-row"><h2 class="card-title">' + esc(D.proveTitle) + '</h2><span class="muted">' + esc(D.actions[ACTION].title) + '</span></div>';
    h += '<div class="hint-card">You have kept the revs up for a few days. Now load the next drive. Pick one:</div><div class="ex-grid" style="grid-template-columns:1fr 1fr">';
    h += '<button type="button" class="ex-card" data-go="real"><span class="tagline">Real log</span><b>' + esc(D.examples[COOL].title) + '</b><small>' + esc(D.examples[COOL].note) + '. What does the engine say about a cool drive?</small></button>';
    h += '<button type="button" class="ex-card" data-go="sim"><span class="tagline" style="color:var(--watch-fg)">Simulated</span><b>Next hot afternoon, S mode in town</b><small>Same route as Aug 30, driven the way the action says. Built from the real drive for this demo.</small></button>';
    return h + '</div></section>';
  }

  function scrProve(P, title, tag, afterR) {
    var vs = { keep: 'good', partial: 'watch', retry: 'watch', inconclusive: 'nodata', undo: 'stop', stop: 'stop' }[P.verdict];
    var h = '<section class="card is-key prove-card"><div class="card-row"><h2 class="card-title">' + esc(D.proveTitle) + '</h2>' + tag + '</div>';
    h += '<div class="prove-verdict tinted st-' + vs + '">' + sIcon(vs) + '<div><b>' + esc(D.verdicts[P.verdict]) + '</b><small>' + esc(D.verdictHelp[P.verdict]) + '</small></div></div>';
    if (P.matched.reasons.length) h += '<ul class="dots">' + P.matched.reasons.map(function (r) { return '<li>' + esc(D.reasons[r] || r) + '</li>'; }).join('') + '</ul>';
    if (P.metric) {
      var fv = function (v) { return v == null ? '-' : n(v, Math.abs(v) < 10 ? 2 : 1); };
      h += '<div class="table ba"><div class="row head"><span></span><span>' + esc(D.before) + '</span><span>' + esc(D.after) + '</span></div><div class="row"><span>' + esc(D.metricNames[P.metric.name] || P.metric.name) + '</span><span class="mono">' + esc(fv(P.metric.before)) + '</span><span class="mono">' + esc(fv(P.metric.after)) + '</span></div>';
      if (P.metric.kcRiseBefore != null) h += '<div class="row"><span>' + esc(D.metricNames.kcRise) + '</span><span class="mono">' + esc(fv(P.metric.kcRiseBefore)) + '</span><span class="mono">' + esc(fv(P.metric.kcRiseAfter)) + '</span></div>';
      h += '</div>';
    }
    h += '<p class="small-note">' + esc('Aug 30, 16:01 → ' + title) + '</p></section>';
    return h;
  }

  function scrProveReal() { return scrProve(proofReal, D.examples[COOL].title, '<span class="real-tag">Real log</span>'); }
  function scrProveSim() {
    var h = scrProve(proofSim, 'Next hot afternoon (simulated)', '<span class="sim-tag">Simulated drive</span>');
    h += '<div class="two">' + kcChart(reports[ID].ins, 'Before: Aug 30, 16:01', '<span class="real-tag">Real log</span>') + kcChart(sim.ins, 'After: next hot afternoon', '<span class="sim-tag">Simulated</span>') + '</div>';
    return h;
  }

  function scrDone() {
    var R = afterPlan, a = R.plan.now[0], later = R.plan.later.filter(function (x) { return !(x.blockedBy || []).length; });
    var h = '<section class="card is-key"><h2 class="card-title">One loop done</h2><ul class="done-list">';
    h += '<li><b>Checked</b> a real hot-traffic drive: safe to continue, with one thing to watch.</li>';
    h += '<li><b>Did one thing</b>, free and with no flash: ' + esc(D.actions[ACTION].title.toLowerCase()) + '.</li>';
    h += '<li><b>Proved it</b> with the next like-for-like log: lugging ' + n(proofSim.metric.before) + ' % → ' + n(proofSim.metric.after) + ' %, Knock Control rise ' + n(proofSim.metric.kcRiseBefore, 2) + ' → ' + n(proofSim.metric.kcRiseAfter, 2) + '.</li>';
    h += '<li><b>And it was honest</b> when a cool drive could not prove it.</li></ul></section>';
    h += '<section class="card"><h2 class="card-title">What moved in the list</h2>';
    if (a) { var x = actionText(a); h += '<div class="act-head"><span class="rank">1</span><div><h3 class="act-title">' + esc(x.title) + '</h3>' + badges(a) + '</div></div><p class="body-sm">' + esc(x.why) + '</p>'; }
    else h += '<p class="body-sm"><b>' + esc(D.noActions) + '</b></p>';
    var low = R.plan.all.filter(function (x) { return x.id === 'lowBoost'; })[0];
    if (low) h += '<p class="small-note"><b>' + esc(D.actions.lowBoost.title) + '</b> ' + (low.blockedBy ? 'is still locked.' : 'is now unlocked, because the free fix was proven first.') + '</p>';
    h += '</section>';
    h += '<div class="hint-card">Next: the simple tune for this car, the mods ranked by your own log, and the claims behind them, fact-checked.</div>';
    h += '<section class="card is-soft"><h2 class="card-title">Go further</h2><div class="act-buttons"><a class="btn" href="../index.html">Open the real app</a><a class="btn-ghost" href="../docs/PRODUCT-REVIEW.md">Why it works this way</a></div><p class="small-note">The real app takes your own TunerView CSV, never uploads it, keeps one action at a time across reloads, and adds the Ask panel, the map explorer and the Full method.</p></section>';
    return h;
  }

  // ---------------------------------------------------------------- build path (mods), from engine/kta-build.js
  var BU = K.build, MAPF = window.KTA_MAP || { tables: {} };
  function src(ids) {
    return ids.map(function (s) { var x = BU.SOURCES[s]; return x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name) + '</a>' : esc(x.name); }).join(' · ');
  }
  function lvl(n) { return ['', 'low', 'medium', 'high'][n]; }
  function buildCard(row, rank, I, F) {
    var it = row.item, st = it.notForThisCar ? 'stop' : row.locks.length ? 'watch' : 'good';
    var h = '<section class="card build-card st-' + st + '"><div class="act-head"><span class="rank">' + rank + '</span><div><h3 class="act-title">' + esc(it.title) + '</h3>';
    h += '<div class="badges"><span class="badge">Effect ' + lvl(it.effect) + '</span><span class="badge">Effort ' + lvl(it.effort) + '</span><span class="badge">Risk ' + lvl(it.risk) + '</span></div></div></div>';
    h += '<div class="pairs act-pairs"><b>Claimed gain</b><span>' + esc(it.gain) + '</span><b>What it changes</b><span>' + esc(it.change) + '</span>' + (it.prove ? '<b>Proof</b><span>' + esc(it.prove) + '</span>' : '') + '</div>';
    if (it.tables.length) {
      h += '<h4 class="sub-title">In your KTuner map</h4><ul class="map-list">';
      it.tables.forEach(function (t) { var ok = !!MAPF.tables[t.id]; h += '<li class="' + (ok ? 'ok' : 'miss') + '"><code>' + esc(t.id) + '</code> ' + (ok ? '✓' : '✗ not in your file') + ' · ' + esc(t.what) + '</li>'; });
      h += '</ul>';
    }
    if (it.steps) h += '<h4 class="sub-title">How to tune it</h4>' + list(it.steps);
    if (it.features.length) h += '<h4 class="sub-title">KTuner settings outside the tables</h4><ul class="dots">' + it.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>';
    if (row.locks.length) h += '<div class="lock-why"><b>' + (it.notForThisCar ? 'Not for this car' : 'Locked') + ':</b><ul class="dots">' + row.locks.map(function (l) { return '<li>' + esc(BU.lockText(l, I, F)) + '</li>'; }).join('') + '</ul></div>';
    else if (it.notForThisCar) h += '<div class="lock-why"><b>Not for this car.</b></div>';
    return h + '<p class="small-note">Sources: ' + src(it.sources) + '</p></section>';
  }
  function scrSimple() {
    var R = reports[PULLS], I = R.ins, N = R.an.numbers, F = BU.mapFacts(MAPF), rows = BU.afmCompare(MAPF);
    var drives = [[PULLS, reports[PULLS]], [ID, reports[ID]], [COOL, reports[COOL]]];
    var worstTrim = Math.max.apply(null, drives.map(function (d) { return Math.abs(d[1].ins.trims.worst); }));
    var h = '<section class="card is-key"><h2 class="card-title">1 · Air first: the AFM curve must match the intake housing</h2>';
    h += '<p class="body-sm">Same sensor frequency, two curves from your map file. A street housing (PRL HVI) needs the <b>Factory</b> curve. With the <b>PRL Race</b> preset the ECU believes this much more air is coming in, fuels for it, and the trims would have to pull the right-hand column. They cannot go that far, so the check engine light comes on (a "too rich" or AFM range code).</p>';
    h += '<div class="table l4"><div class="row head"><span>AFM Hz</span><span>Factory g/s</span><span>PRL Race g/s</span><span>Reads</span><span>Trim needed</span></div>';
    rows.forEach(function (r) { h += '<div class="row"><span class="mono">' + r.hz.toLocaleString('en') + '</span><span class="mono">' + n(r.factory, 2) + '</span><span class="mono">' + n(r.prl, 2) + '</span><span class="mono">×' + n(r.ratio, 2) + '</span><span class="mono" style="color:var(--stop-fg)">' + n(r.trim) + ' %</span></div>'; });
    h += '</div>';
    h += '<div class="pairs act-pairs"><b>Your three drives</b><span>' + drives.map(function (d) { return D.examples[d[0]].title + ': worst cruise trim ' + n(d[1].ins.trims.worst) + ' %'; }).join(' · ') + '</span><b>Verdict</b><span>' + (worstTrim < 5 ? 'Inside ±5 %: your AFM curve matches your housing. No AFM change.' : 'Outside ±5 %: correct the AFM curve before anything else.') + '</span></div></section>';

    h += '<div class="two"><section class="card"><h2 class="card-title">2 · E10: keep the targets</h2><p class="body-sm">The ECU and the A/F sensor work in lambda, so 14.7 on screen is still λ 1.00 on E10. The trims cover the small extra fuel; do not move it into the AFM table.</p>';
    h += '<div class="pairs act-pairs"><b>Full load</b><span>Map asks ' + n(N.wotMapAfr) + ' AFR, measured ' + n(N.wotMeasuredAfr) + ': richer, so safe</span><b>Fuel</b><span>E10 RON95 ≈ US 91: the floor of most US maps</span></div></section>';
    h += '<section class="card"><h2 class="card-title">3 · Ignition and boost: leave them to the basemap</h2><div class="pairs act-pairs"><b>Ignition</b><span>Knock Control ' + n(reports[ID].ins.kc.start, 2) + ' → ' + n(reports[ID].ins.kc.end, 2) + ' on the hot drive. Fix heat and lugging; never add timing on the road.</span>';
    h += '<b>Boost</b><span>Map ' + n(F.normalPeak) + ' psi Normal / ' + n(F.ecoPeak) + ' psi ECO; real peak ' + n(I.boost.peakBoost) + ' psi with the wastegate ' + n(I.boost.wgAtPeak) + ' % open. ECO on hot days.</span></div></section></div>';

    h += '<div class="two"><section class="card"><h2 class="card-title">Do</h2>' + list(BU.SIMPLE.doList) + '</section><section class="card"><h2 class="card-title">Do not</h2>' + list(BU.SIMPLE.dontList) + '</section></div>';
    return h;
  }

  function scrBuild() {
    var R = reports[PULLS], I = R.ins, P = BU.plan(R, MAPF), F = P.facts, need = BU.airFor(300), k = 0;
    var h = '<div class="tiles">' +
      tile(n(F.normalPeak) + ' / ' + n(F.ecoPeak) + ' psi', 'Your map: Normal / ECO boost target') +
      tile(n(I.boost.peakBoost) + ' psi', 'Real peak boost (target ' + n(I.boost.peakTarget) + ')') +
      tile(n(I.boost.wgAtPeak) + ' %', 'Wastegate open at that peak: turbo near its limit', I.boost.headroom === 'small') +
      tile(n(I.boost.pullIat, 0) + ' °C', 'Intake air at the start of a pull', I.boost.pullIat > 45) +
      tile(F.afm.factory.gs + ' g/s', 'Factory AFM curve end (' + F.afm.factory.hz.toLocaleString('en') + ' Hz); 300 whp needs ≈ ' + need) + '</div>';
    h += '<div class="hint-card">Ranked the same way as the Drive check (3 × effect − 2 × effort − 2 × risk), then locked by what <b>this</b> log and <b>this</b> map say. Every table below is looked up in your map file.</div>';
    h += '<h2 class="card-title">Do now</h2>';
    P.now.forEach(function (r) { h += buildCard(r, ++k, I, F); });
    h += '<h2 class="card-title">Later, when the lock clears</h2>';
    P.later.forEach(function (r) { h += buildCard(r, ++k, I, F); });
    h += '<h2 class="card-title">Not for a CVT on E10 RON95</h2>';
    P.no.forEach(function (r) { h += buildCard(r, ++k, I, F); });
    return h;
  }
  var VERDICT = { 'true': ['good', 'True'], partly: ['watch', 'Partly'], unverified: ['nodata', 'Not verified'], wrongForYou: ['stop', 'Not on your car'] };
  function scrClaims() {
    var h = '<section class="card"><h2 class="card-title">What people say, checked</h2><div class="claims">';
    BU.CLAIMS.forEach(function (c) {
      var v = VERDICT[c.verdict];
      h += '<div class="claim"><span class="pill st-' + v[0] + '">' + esc(v[1]) + '</span><div><b>' + esc(c.claim) + '</b><p class="body-sm">' + esc(c.note) + '</p><small class="muted">Confidence ' + esc(c.conf) + ' · ' + src(c.src) + '</small></div></div>';
    });
    return h + '</div><p class="small-note">Confidence: high = the tuner\'s own page, two sources agreeing, or your log; medium = a vendor\'s own dyno; low = forum or social posts. Fetched 2026-10-01. CivicX, CivicXI, honda-tech, hondata.com and reddit block crawlers, so those are search snippets only.</p></section>';
  }

  // ---------------------------------------------------------------- tour
  var STEPS = [
    { nav: 'Open a drive', who: 'The owner', title: 'After a hot afternoon in traffic', say: 'The car feels flat. The owner opens the app and picks the drive they just logged. Nothing is uploaded: the log is read inside the browser tab.' },
    { nav: 'Is it safe?', who: 'Safety first', title: 'Five gates, then a verdict', say: 'Fuel, air, spark, heat and CVT are checked before anything else. This drive is a Watch, not a Stop: the mixture is never lean and fuel pressure holds. The two orange tiles are the story: lugging and a Knock Control that climbed.' },
    { nav: 'Your #1', who: 'One thing to do', title: 'Free habits before flashes', say: 'The app ranks everything and shows one action. It is free and needs no flash: keep the revs up in hot traffic. Look at the chart: the climb happens inside the orange lugging bands. More boost is locked, with exactly what unlocks it.' },
    { nav: 'Do it', who: 'The owner', title: 'Start it, then go drive', say: 'Pressing Start stores a small snapshot of this drive in the browser. It survives a reload. Only one action is open at a time, so the next log can prove it.' },
    { nav: 'Honest proof', who: 'The engine refuses to guess', title: 'A cooler drive cannot prove a heat fix', say: 'This is the real Sep 1 morning log. Lugging is lower, but intake air is much cooler, so the app says it cannot tell. It never credits the weather as a tune gain.' },
    { nav: 'It worked', who: 'Like for like', title: 'A hot drive, driven properly', say: 'The same route in the same heat, with revs kept up. This drive is simulated for the demo, built from the real one. The engine compares lugging and the Knock Control climb and says keep.' },
    { nav: 'What moved', who: 'The loop closes', title: 'Done, and the list moved up', say: 'The proven action is marked done. The list is recomputed from the history, so items that were waiting on it can unlock. Next time: check, one thing, prove it.' },
    { nav: 'Simple tune', who: 'Do less, get most', title: 'Air, then fuel, then leave the rest', say: 'What a tuner changes on this car without a dyno. First the AFM curve must match the intake housing: a PRL HVI with the PRL Race preset reads about 1.4 times the real air, which is why that combination turns the check engine light on. Your three drives keep trims inside ±5 %, so your curve is right. E10 needs no hand fueling, and ignition and boost stay with the basemap.' },
    { nav: 'Build path', who: 'What to buy next', title: 'Mods, ranked by your own log', say: 'The Aug 30 15:29 drive has eight hard pulls. At 19.9 psi the wastegate is almost shut, so the stock turbo is near its limit. That ranks cooler air and a freer exhaust first, locks the 24 psi maps, and rules out a big turbo on this CVT.' },
    { nav: 'Fact check', who: 'Claims vs sources', title: 'What tuners and forums say', say: 'Yes, TSP Map 3 asks for 24 psi on the non-Si CVT. Most 300 hp turbo results come from manual cars on 93 octane or ethanol. Each claim shows its source and how much to trust it.' }
  ];

  function stageFor(s) {
    var R = reports[ID];
    switch (s) {
      case 0: return scrLoad();
      case 1: return scrSafety(R);
      case 2: return scrNow(R, false) + '<section class="card">' + kcChart(R.ins, D.graphs.kc.title, '<span class="real-tag">Real log</span>') + '</section>' + scrQueue(R);
      case 3: return scrNow(R, true) + scrLoadNext();
      case 4: return scrProveReal() + '<div class="hint-card">Now try the hot drive that is driven the way the action says.</div><div class="act-buttons"><button type="button" class="btn pulse" data-go="sim">Load the simulated hot drive</button></div>';
      case 5: return scrProveSim();
      case 6: return scrDone();
      case 7: return scrSimple();
      case 8: return scrBuild();
      default: return scrClaims();
    }
  }

  function render() {
    var st = STEPS[S.step];
    var h = '<aside class="tour" aria-label="Demo guide"><div class="brand"><span class="brand-mark">K</span><span><b>Civic FE Tune Assist</b><small>Guided demo</small></span></div><span class="demo-tag">Real engine · real logs</span>';
    h += '<ol class="tour-steps">' + STEPS.map(function (x, k) { return '<li class="' + (k === S.step ? 'is-here' : (k < S.step ? 'is-past' : '')) + '"><button type="button" data-step="' + k + '"><span class="n">' + (k < S.step ? '✓' : k + 1) + '</span>' + esc(x.nav) + '</button></li>'; }).join('') + '</ol>';
    h += '<div class="say" aria-live="polite"><span class="who">' + esc(st.who) + '</span><h2>' + esc(st.title) + '</h2><p>' + esc(st.say) + '</p></div>';
    h += '<div class="tour-nav"><button type="button" class="btn-ghost" data-nav="-1"' + (S.step === 0 ? ' disabled' : '') + '>Back</button><button type="button" class="btn" data-nav="1"' + (S.step === STEPS.length - 1 ? ' disabled' : '') + '>Next</button></div><div class="kbd-hint">Use ← and → keys</div></aside>';
    var loop = S.step <= 6;
    h += '<main class="stage" id="main"><div class="stage-top"><h1>' + esc(loop ? D.title : 'Tune and build: what to change next') + '</h1>' + (loop ? '' : '<span class="real-tag">Your map · your logs · sourced</span>') + '</div>';
    if (S.err) h += '<div class="banner stop" role="alert">' + esc(S.err) + '</div>';
    if (loop) h += loop3();
    h += S.busy ? '<p class="busy" role="status">Reading the log…</p>' : stageFor(S.step);
    root.innerHTML = h + '</main>';
    var m = document.getElementById('main'); if (m) m.scrollIntoView({ block: 'start' });
  }

  function go(to) {
    to = Math.max(0, Math.min(STEPS.length - 1, to));
    var need = [];
    if (to >= 1) need.push(report(ID));
    if (to >= 4) need.push(report(COOL));
    if (to >= 7) need.push(report(PULLS));
    S.busy = to >= 1 && !reports[ID] ? ID : ''; if (S.busy) render();
    return Promise.all(need).then(function () {
      var before = reports[ID];
      if (to >= 4 && !proofReal) proofReal = K.proveAction(ACTION, K.proofSnapshot(before), reports[COOL]);
      if (to >= 5 && !proofSim) {
        sim = simulate(before);
        proofSim = K.proveAction(ACTION, K.proofSnapshot(before), sim);
        afterPlan = { plan: K.planActions(sim, [{ id: ACTION, verdict: proofSim.verdict === 'keep' ? 'keep' : proofSim.verdict }]) };
      }
      S.err = ''; S.busy = ''; S.step = to; render();
    }).catch(function (e) { S.busy = ''; S.err = 'Cannot read the example logs: ' + ((e && e.message) || e) + '. Open this page from the project folder; in some browsers file:// blocks reading them, so try a local server (python3 -m http.server).'; render(); });
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-step],[data-nav],[data-go]');
    if (!t) return;
    if (t.hasAttribute('data-step')) go(+t.getAttribute('data-step'));
    else if (t.hasAttribute('data-nav')) go(S.step + +t.getAttribute('data-nav'));
    else {
      var g = t.getAttribute('data-go');
      go(g === 'real' ? 4 : g === 'sim' ? 5 : S.step + 1);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') go(S.step + 1);
    else if (e.key === 'ArrowLeft') go(S.step - 1);
  });
  render();
})();

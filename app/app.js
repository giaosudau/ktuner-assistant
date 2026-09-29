/* Civic FE Tune Assist: the standalone app. Vanilla JS, no build step, works offline.
 * All tuning math lives in engine/kta-engine.js (window.KTA); all text in app/i18n.js. */
(function () {
  'use strict';
  var K = window.KTA;
  var I18N = window.KTA_I18N;
  var F = K.fmt;
  var STORE = 'kta-assist-v1';
  var PREP_KEYS = ['leak', 'exhaust', 'plugs', 'fuel', 'cvt', 'lights'];
  var MOD_KEYS = ['intake', 'downpipe', 'frontpipe', 'catback', 'ic', 'cvtCooler'];
  var HINT_DEFAULT = { 1: 'e10', 2: 'loop', 3: 'trims', 4: 'afr', 5: 'iat', 6: 'cvtbelt', 7: 'knock' };
  var GROUP_OF = { 1: 'Prepare', 2: 'Prepare', 3: 'Tune', 4: 'Tune', 5: 'Tune', 6: 'Gain', 7: 'Gain' };
  var STATUS = ['good', 'watch', 'stop', 'nodata'];

  var state = merge(defaults(), load());
  var slots = {};            // logs live only in this tab: { baseline, afm, wot, cool, hot, gain }
  var ui = { copied: '', error: '', yaw: -38, pitch: 58, topics: { 'topic-0': true } };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  function defaults() {
    return {
      lang: detectLang(), theme: '', step: 1, hint: '',
      mods: { intake: true, downpipe: true, frontpipe: true, catback: true, ic: true, cvtCooler: true },
      intakePreset: 'other', dpType: 'catted', fuel: 'e10-95', tool: 'ktuner',
      prep: {}, confirmSlot: 'cool', afmPaste: '', ceiling: 21,
      applied: { wot: false, boost: false },
      review: { name: '', uses: 'KTuner', decision: '', notes: '', logs: false, diff: false, untouched: false, mech: false },
      page: '', mapTable: 'WOT_Enrich_L', mapView: 'grid', mapShow: 'after',
      lastSlot: ''
    };
  }
  function merge(base, extra) {
    Object.keys(extra || {}).forEach(function (k) {
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && extra[k] && typeof extra[k] === 'object') base[k] = Object.assign({}, base[k], extra[k]);
      else if (k in base) base[k] = extra[k];
    });
    return base;
  }
  function detectLang() {
    try { return String(navigator.language || '').toLowerCase().indexOf('vi') === 0 ? 'vi' : 'en'; } catch (e) { return 'en'; }
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(STORE) || 'null'); if (s && typeof s === 'object') { delete s.lastSlot; return s; } } catch (e) { /* storage blocked */ }
    return {};
  }
  function save() {
    try { var copy = Object.assign({}, state); delete copy.lastSlot; localStorage.setItem(STORE, JSON.stringify(copy)); } catch (e) { /* storage blocked */ }
  }
  function T() { return I18N[state.lang] || I18N.en; }
  function setPath(path, value) {
    var parts = path.split('.'), obj = state;
    for (var i = 0; i < parts.length - 1; i++) obj = obj[parts[i]] = Object.assign({}, obj[parts[i]]);
    obj[parts[parts.length - 1]] = value;
  }
  function getPath(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, state);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function slotFor(step) {
    if (step === 5) return state.confirmSlot === 'hot' ? 'hot' : 'cool';
    return { 2: 'baseline', 3: 'afm', 4: 'wot', 6: 'gain' }[step] || '';
  }
  function latest(names) {
    for (var i = 0; i < names.length; i++) if (slots[names[i]]) return slots[names[i]];
    return null;
  }
  function recName(rec) { return rec.sample ? T().samples[rec.sample].title : rec.name; }
  function tableInUse() {
    if (!state.afmPaste || !state.afmPaste.trim()) return K.REF.maf.custom;
    var r = K.parseAfmPaste(state.afmPaste);
    return r.ok ? r.values : K.REF.maf.custom;
  }
  function checkStatus(an, gate, id) {
    if (!an) return 'nodata';
    var g = an.gates.filter(function (x) { return x.id === gate; })[0];
    var c = g && g.checks.filter(function (x) { return x.id === id; })[0];
    return c ? c.status : 'nodata';
  }
  function checkText(c) {
    var d = T().checks[c.id];
    if (!d) return { label: c.label, display: c.display, fix: c.fix };
    var data = c.data || {};
    return { label: d.label, display: d.display(data, F), fix: c.status === 'good' || c.status === 'nodata' ? '' : d.fix(data, F) };
  }
  function refText(c) {
    var fn = T().refs[c.id];
    return fn ? fn(c.data || {}, F, T()) : { label: c.label, detail: c.detail };
  }
  function toolName() { return state.tool === 'ktuner' ? 'KTuner' : 'Hondata FlashPro'; }
  function fuelLabel() { return state.fuel === 'e10-95' ? 'E10 RON95' : 'E5 RON92'; }
  function modNames() {
    var m = T().mods;
    return MOD_KEYS.filter(function (k) { return state.mods[k]; }).map(function (k) { return typeof m[k] === 'function' ? m[k](state.dpType) : m[k]; });
  }
  function currentSug() {
    var src = latest(['afm', 'baseline']);
    return src ? { src: src, sug: K.suggestMaf(src.an, tableInUse()) } : null;
  }
  function baseSug() {
    if (slots.baseline) return K.suggestMaf(slots.baseline.an, tableInUse());
    var c = currentSug();
    return c ? c.sug : null;
  }
  function doneMap() {
    var prepCount = PREP_KEYS.filter(function (k) { return state.prep[k]; }).length;
    var wotRec = latest(['wot', 'afm']);
    return {
      prepCount: prepCount,
      1: prepCount === PREP_KEYS.length,
      2: !!slots.baseline,
      3: !!slots.afm && checkStatus(slots.afm.an, 'fuel', 'trims') === 'good',
      4: !!wotRec && checkStatus(wotRec.an, 'fuel', 'wotAfr') === 'good' && checkStatus(wotRec.an, 'fuel', 'fuelPress') !== 'stop',
      5: !!slots.cool && !!slots.hot && slots.cool.an.verdict !== 'stop' && slots.hot.an.verdict !== 'stop',
      6: !!slots.gain && slots.gain.an.verdict !== 'stop',
      7: state.review.decision === 'approve'
    };
  }
  function refChecks() {
    var lean = K.suggestWotLean(), bs = K.suggestBoostStep(state.ceiling);
    var last = state.lastSlot ? slots[state.lastSlot] : null;
    return K.referenceChecks({
      maf: baseSug(),
      wotValues: state.applied.wot ? lean.values : K.REF.wot.values,
      boostValues: state.applied.boost ? bs.values : K.REF.boost.normal,
      ceilingPsi: state.ceiling,
      lastAnalysis: last ? last.an : null,
      hotLogDone: !!slots.hot && slots.hot.an.verdict !== 'stop',
      untouchedConfirmed: !!state.review.untouched
    });
  }

  // ---------------------------------------------------------------------------
  // Icons
  // ---------------------------------------------------------------------------
  function sIcon(status, size) {
    size = size || 22;
    var s = '<svg class="sicon" width="' + size + '" height="' + size + '" viewBox="0 0 22 22" aria-hidden="true">';
    if (status === 'good') s += '<circle cx="11" cy="11" r="10" style="fill:var(--good-ic)"/><path d="M6.5 11.5 L9.5 14.5 L15.5 8" style="fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"/>';
    else if (status === 'watch') s += '<path d="M11 2 L21 19.5 L1 19.5 Z" style="fill:var(--watch-ic)"/><path d="M11 8.5 L11 13.5" style="fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round"/><circle cx="11" cy="16.4" r="1.3" style="fill:#fff"/>';
    else if (status === 'stop') s += '<path d="M7 1.5 L15 1.5 L20.5 7 L20.5 15 L15 20.5 L7 20.5 L1.5 15 L1.5 7 Z" style="fill:var(--stop-ic)"/><path d="M7.5 7.5 L14.5 14.5 M14.5 7.5 L7.5 14.5" style="fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round"/>';
    else s += '<circle cx="11" cy="11" r="9.5" style="fill:var(--sheet);stroke:var(--none-ic);stroke-width:1.8"/><path d="M7 11 H15" style="fill:none;stroke:var(--none-ic);stroke-width:2;stroke-linecap:round"/>';
    return s + '</svg>';
  }
  var ICON = {
    logo: '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect x="0.5" y="0.5" width="33" height="33" rx="8" style="fill:#111B24"/><path d="M8.3 22 A10 10 0 1 1 25.7 22" style="fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round"/><path d="M17 17.5 L23.2 11.6" style="fill:none;stroke:#F2A13A;stroke-width:2.4;stroke-linecap:round"/><circle cx="17" cy="17.5" r="2.2" style="fill:#fff"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" style="fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"/></svg>',
    upload: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 11 V2.5 M4.5 6 L8 2.5 L11.5 6 M2.5 11 V13.5 H13.5 V11" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"/></svg>',
    moon: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 10.2 A6 6 0 1 1 5.8 2.5 A4.8 4.8 0 0 0 13.5 10.2 Z" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linejoin:round"/></svg>',
    sun: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" style="fill:none;stroke:currentColor;stroke-width:1.6"/><path d="M8 1.5 V3 M8 13 V14.5 M1.5 8 H3 M13 8 H14.5 M3.4 3.4 L4.5 4.5 M11.5 11.5 L12.6 12.6 M3.4 12.6 L4.5 11.5 M11.5 4.5 L12.6 3.4" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round"/></svg>',
    globe: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" style="fill:none;stroke:currentColor;stroke-width:1.5"/><path d="M1.8 8 H14.2 M8 1.7 C5.8 4 5.8 12 8 14.3 M8 1.7 C10.2 4 10.2 12 8 14.3" style="fill:none;stroke:currentColor;stroke-width:1.5"/></svg>',
    sun26: '<svg viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="5" style="fill:none;stroke:currentColor;stroke-width:1.8"/><path d="M13 2.5 V5.5 M13 20.5 V23.5 M2.5 13 H5.5 M20.5 13 H23.5 M5.6 5.6 L7.7 7.7 M18.3 18.3 L20.4 20.4 M5.6 20.4 L7.7 18.3 M18.3 7.7 L20.4 5.6" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round"/></svg>',
    car26: '<svg viewBox="0 0 26 26" aria-hidden="true"><rect x="3" y="9" width="20" height="9" rx="3" style="fill:none;stroke:currentColor;stroke-width:1.8"/><path d="M6 9 L8.5 4.5 H17.5 L20 9" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round"/><circle cx="8" cy="20.5" r="2" style="fill:currentColor"/><circle cx="18" cy="20.5" r="2" style="fill:currentColor"/></svg>',
    rain26: '<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M5 11 A8 6 0 0 1 21 11 Z" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round"/><path d="M13 11 V20 A2 2 0 0 1 9 20" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round"/><path d="M3 24 C6 22 8 22 11 24 C14 26 16 26 19 24 C21 22.7 22.5 22.7 24 23.5" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round"/></svg>',
    road26: '<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M9 3 L5 23 M17 3 L21 23" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round"/><path d="M13 5 V8 M13 11.5 V14.5 M13 18 V21" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round"/></svg>'
  };
  ICON.map = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1.5 9.5 L7 12.5 L12.5 9.5 M1.5 6.5 L7 9.5 L12.5 6.5 L7 3.5 Z" style="fill:none;stroke:currentColor;stroke-width:1.5;stroke-linejoin:round"/></svg>';
  ICON.book = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2.5 H6 A1 1 0 0 1 7 3.5 V12 A1 1 0 0 0 6 11 H2 Z M12 2.5 H8 A1 1 0 0 0 7 3.5 V12 A1 1 0 0 1 8 11 H12 Z" style="fill:none;stroke:currentColor;stroke-width:1.4;stroke-linejoin:round"/></svg>';
  var VN_ICON = { sun: ICON.sun26, car: ICON.car26, rain: ICON.rain26, road: ICON.road26 };

  function linkHint(key, text) { return '<button type="button" class="link-btn" data-act="hint" data-arg="' + key + '">' + esc(text) + '</button>'; }
  function hintBtn(key, label) { return '<button type="button" class="hint-btn" data-act="hint" data-arg="' + key + '" aria-label="' + esc(label) + '">?</button>'; }
  function fill(template, map) { return template.replace(/\{(\w+)\}/g, function (m, k) { return map[k] != null ? map[k] : m; }); }

  // ---------------------------------------------------------------------------
  // Charts (SVG strings built from the engine's view models)
  // ---------------------------------------------------------------------------
  function axes(f, fmtY) {
    var s = '';
    f.yTicks.forEach(function (t) { s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + t.y + '" y2="' + t.y + '" style="stroke:var(--grid);stroke-width:1"/>'; });
    s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + f.plotB + '" y2="' + f.plotB + '" style="stroke:var(--line-3);stroke-width:1"/>';
    f.yTicks.forEach(function (t) { s += '<text x="' + (f.plotL - 8) + '" y="' + (t.y + 4) + '" text-anchor="end">' + esc(fmtY ? fmtY(t.label) : t.label) + '</text>'; });
    f.xTicks.forEach(function (t, i) {
      var anchor = i === f.xTicks.length - 1 ? 'end' : (i === 0 ? 'start' : 'middle');
      s += '<text x="' + t.x + '" y="' + (f.plotB + 16) + '" text-anchor="' + anchor + '">' + esc(t.label) + '</text>';
    });
    s += '<text class="axis-title" x="' + f.xLabelX + '" y="' + f.xLabelY + '" text-anchor="middle">' + esc(f.xLabel) + '</text>';
    return s;
  }
  function trimSvg(an, sug, t) {
    var f = K.view.trimChart(an, sug);
    f.xLabel = t.s3.axis;
    var s = '<svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(t.s3.chartLabel) + '">';
    s += '<rect x="' + f.band.x + '" y="' + f.band.y + '" width="' + f.band.w + '" height="' + f.band.h + '" style="fill:var(--band)"/>';
    s += axes(f);
    s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + f.zeroY + '" y2="' + f.zeroY + '" style="stroke:var(--axis);stroke-width:1"/>';
    if (f.line) s += '<path d="' + f.line + '" style="fill:none;stroke:var(--cmd);stroke-width:2;stroke-linejoin:round"/>';
    f.rings.forEach(function (d) { s += '<circle cx="' + d.cx + '" cy="' + d.cy + '" r="4" style="fill:var(--sheet);stroke:var(--meas);stroke-width:2"/><circle cx="' + d.cx + '" cy="' + d.cy + '" r="9" style="fill:transparent" data-tip="' + esc(d.tip) + '"/>'; });
    f.dots.forEach(function (d) { s += '<circle cx="' + d.cx + '" cy="' + d.cy + '" r="4" style="fill:var(--meas);stroke:var(--sheet);stroke-width:1.5"/><circle cx="' + d.cx + '" cy="' + d.cy + '" r="9" style="fill:transparent" data-tip="' + esc(d.tip) + '"/>'; });
    return s + '</svg>';
  }
  function wotSvg(an, t) {
    var f = K.view.wotChart(an);
    f.xLabel = t.s4.axis;
    var s = '<svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(t.s4.chartLabel) + '">';
    s += axes(f);
    s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + f.limitY + '" y2="' + f.limitY + '" style="stroke:var(--stop-ic);stroke-width:1.5;stroke-dasharray:5 4"/>';
    s += '<text x="' + f.plotR + '" y="' + (f.limitY - 6) + '" text-anchor="end" style="fill:var(--stop-fg);font-family:var(--font-b)">' + esc(t.s4.limit) + '</text>';
    s += '<path d="' + f.cmd + '" style="fill:none;stroke:var(--cmd);stroke-width:2;stroke-dasharray:6 4"/>';
    s += '<path d="' + f.meas + '" style="fill:none;stroke:var(--meas);stroke-width:2;stroke-linejoin:round"/>';
    f.points.forEach(function (d) { s += '<circle cx="' + d.cx + '" cy="' + d.cy + '" r="4" style="fill:var(--meas);stroke:var(--sheet);stroke-width:1.5"/><circle cx="' + d.cx + '" cy="' + d.cy + '" r="10" style="fill:transparent" data-tip="' + esc(d.tip) + '"/>'; });
    return s + '</svg>';
  }
  function pullSvg(rec, t) {
    var f = K.view.pullChart(rec.log, rec.an, 0);
    if (!f.hasData) return '';
    f.xLabel = t.s4.pullAxis;
    var s = '<svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(t.s4.pullLabel) + '">';
    s += axes(f);
    if (f.target) s += '<path d="' + f.target + '" style="fill:none;stroke:var(--cmd);stroke-width:2;stroke-dasharray:6 4"/>';
    s += '<path d="' + f.actual + '" style="fill:none;stroke:var(--meas);stroke-width:2;stroke-linejoin:round"/>';
    if (f.peak) {
      s += '<circle cx="' + f.peak.cx + '" cy="' + f.peak.cy + '" r="5" style="fill:var(--sheet);stroke:var(--stop-ic);stroke-width:2"/>';
      s += '<text x="' + f.peak.lx + '" y="' + f.peak.ly + '" style="fill:var(--stop-fg);font-weight:600">' + esc(t.s4.overshoot + ' ' + f.peak.label) + '</text>';
    }
    return s + '</svg>';
  }

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------
  function view() {
    return '<a class="skip" href="#main">' + esc(T().app.skip) + '</a>' + viewTop() + viewRail() + viewMain() + viewAside();
  }

  function viewTop() {
    var t = T(), d = doneMap();
    var n = [1, 2, 3, 4, 5].filter(function (k) { return d[k]; }).length;
    var last = state.lastSlot ? slots[state.lastSlot] : null;
    var h = '<header class="top">';
    h += '<div class="brand">' + ICON.logo + '<div><div class="brand-name">' + esc(t.app.title) + '</div><div class="brand-sub">' + esc(t.app.subtitle) + '</div></div></div>';
    h += '<div class="chips"><span class="chip">' + esc(t.app.car) + '</span><span class="chip">' + esc(fuelLabel()) + '</span><span class="chip">' + esc(t.app.mods(modNames().length)) + '</span></div>';
    h += '<div class="top-right">';
    h += '<div class="progress"><div class="progress-row"><b>' + esc(t.app.stage) + '</b><span class="mono">' + esc(t.app.stepsOf(n)) + '</span></div><div class="bar"><span style="width:' + Math.round(n / 5 * 100) + '%"></span></div></div>';
    if (last) {
      var v = last.an.verdict;
      h += '<div class="lastlog tinted st-' + v + '">' + sIcon(v, 20) + '<div><b>' + esc(t.app.lastLog + ': ' + (v === 'good' ? t.verdict.good : t.status[v])) + '</b><small>' + esc(recName(last)) + '</small></div></div>';
    }
    var dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!state.theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    h += '<button type="button" class="icon-btn" data-act="theme" aria-label="' + esc(dark ? t.app.themeLight : t.app.themeDark) + '">' + (dark ? ICON.sun : ICON.moon) + '</button>';
    h += '<button type="button" class="icon-btn" data-act="lang" lang="' + (state.lang === 'vi' ? 'en' : 'vi') + '">' + ICON.globe + esc(t.app.langSwitch) + '</button>';
    h += '</div></header>';
    return h;
  }

  function viewRail() {
    var t = T(), d = doneMap();
    var h = '<nav class="rail" aria-label="' + esc(t.app.stepsNav) + '">';
    ['Prepare', 'Tune', 'Gain'].forEach(function (g) {
      h += '<div class="rail-group"><div class="rail-label">' + esc(t.groups[g]) + '</div>';
      [1, 2, 3, 4, 5, 6, 7].filter(function (n) { return GROUP_OF[n] === g; }).forEach(function (n) {
        var st = t.steps[n - 1], cur = !state.page && n === state.step, isDone = !!d[n];
        var hasLog = !!slots[slotFor(n)];
        var chip = isDone ? t.chips.done : (cur ? t.chips.here : (n === 6 ? (d[5] ? t.chips.optional : t.chips.after5) : (hasLog ? t.chips.progress : t.chips.todo)));
        h += '<button type="button" class="step-btn' + (isDone ? ' is-done' : '') + '" data-act="go" data-arg="' + n + '"' + (cur ? ' aria-current="step"' : '') + '>';
        h += '<span class="step-dot">' + (isDone ? ICON.check : n) + '</span>';
        h += '<span class="step-text"><span class="step-title">' + esc(st.title) + '</span><span class="step-sub">' + esc(st.sub) + '</span><span class="step-chip">' + esc(chip) + '</span></span></button>';
      });
      h += '</div>';
    });
    h += '<div class="rail-group"><div class="rail-label">' + esc(t.nav2.reference) + '</div>';
    [['map', ICON.map, t.nav2.map, t.nav2.mapSub], ['guide', ICON.book, t.nav2.guide, t.nav2.guideSub]].forEach(function (r) {
      var on = state.page === r[0];
      h += '<button type="button" class="step-btn ref-btn" data-act="page" data-arg="' + r[0] + '"' + (on ? ' aria-current="page"' : '') + '>';
      h += '<span class="step-dot">' + r[1] + '</span><span class="step-text"><span class="step-title">' + esc(r[2]) + '</span><span class="step-sub">' + esc(r[3]) + '</span></span></button>';
    });
    h += '</div>';
    h += '<div class="loop-card"><div class="eyebrow">' + esc(t.loop.title) + '</div>';
    h += '<div class="loop-flow">' + t.loop.flow.map(esc).join('<i>→</i>') + '</div>';
    h += '<div class="loop-note">' + esc(t.loop.note) + '</div>';
    h += '<div class="loop-stats"><div><b>2<small> +1</small></b><span>' + esc(t.loop.tables) + '</span></div><div><b>5</b><span>' + esc(t.loop.logs) + '</span></div></div></div>';
    return h + '</nav>';
  }

  function viewMain() {
    if (state.page === 'map') return viewMapPage();
    if (state.page === 'guide') return viewGuidePage();
    var t = T(), n = state.step, st = t.steps[n - 1], d = doneMap();
    var h = '<main class="main" id="main" tabindex="-1">';
    h += '<div class="step-head"><div class="eyebrow">' + esc(t.stepOf(n, t.groups[GROUP_OF[n]])) + '</div>';
    h += '<h1>' + esc(st.title) + '</h1><p class="goal">' + esc(st.goal) + '</p>';
    h += '<div class="done-when"><span class="tag' + (d[n] ? ' is-done' : '') + '">' + esc(d[n] ? t.doneTag : t.doneWhen) + '</span><b>' + esc(st.done) + '</b></div></div>';
    h += [null, viewS1, viewS2, viewS3, viewS4, viewS5, viewS6, viewS7][n](t, d);
    if (n >= 2 && n <= 6) h += viewCheck(t, n);
    h += '<div class="foot-nav">';
    h += n > 1 ? '<button type="button" class="back" data-act="go" data-arg="' + (n - 1) + '">← ' + esc(t.nav.back) + '</button>' : '<span></span>';
    if (n < 7) h += '<button type="button" class="next" data-act="go" data-arg="' + (n + 1) + '">' + esc(t.nav.next[n]) + ' →</button>';
    return h + '</div></main>';
  }

  function viewS1(t, d) {
    var s = t.s1, h = '';
    h += '<section class="card-plain" style="display:flex;flex-direction:column;gap:14px"><div class="card-row"><h2 class="card-title">' + esc(t.sections.build) + '</h2><span class="muted">' + esc(s.carLine) + '</span></div><div class="mods">';
    MOD_KEYS.forEach(function (k) {
      var m = s.mods[k], on = !!state.mods[k], noChange = m.badge === s.mods.frontpipe.badge;
      var badgeCls = !on ? '' : (k === 'intake' ? ' is-strong' : (noChange ? '' : ' is-tint'));
      h += '<div class="mod' + (on ? ' is-on' : '') + '"><div class="mod-head"><input type="checkbox" id="mod-' + k + '" data-bind="mods.' + k + '"' + (on ? ' checked' : '') + '><label for="mod-' + k + '">' + esc(m.name) + '</label><span class="badge' + badgeCls + '">' + esc(on ? m.badge : s.notFitted) + '</span></div><p>' + esc(m.effect) + '</p>';
      if (k === 'intake' && on) {
        h += '<div class="field-inline"><label for="intake-preset">' + esc(s.housing) + '</label><select id="intake-preset" data-bind="intakePreset">' +
          opt('other', s.presetOther, state.intakePreset) + opt('prl', s.presetPrl, state.intakePreset) + opt('won27', s.presetWon, state.intakePreset) + '</select></div>';
      }
      if (k === 'downpipe' && on) {
        h += '<div class="field-inline"><label for="dp-type">' + esc(s.catalyst) + '</label><select id="dp-type" data-bind="dpType">' + opt('catted', s.catted, state.dpType) + opt('catless', s.catless, state.dpType) + '</select></div>';
        if (state.dpType === 'catless') h += '<div class="banner warn" style="font-size:12.5px;padding:8px 10px">' + esc(s.catlessWarn) + '</div>';
      }
      h += '</div>';
    });
    h += '</div></section>';

    h += '<section class="grid-2"><div class="card"><h2 class="card-title">' + esc(t.sections.fuel) + '</h2><div class="seg" role="group" aria-label="' + esc(t.sections.fuel) + '">';
    h += '<button type="button" data-act="set" data-arg="fuel:e10-95" aria-pressed="' + (state.fuel === 'e10-95') + '">E10 RON95</button><button type="button" data-act="set" data-arg="fuel:e5-92" aria-pressed="' + (state.fuel !== 'e10-95') + '">E5 RON92</button></div>';
    h += state.fuel === 'e10-95' ? '<p class="muted" style="margin:0;color:var(--ink-2);line-height:1.5">' + esc(s.e10Note) + ' ' + linkHint('e10', s.why) + '</p>' : '<div class="banner stop" style="font-size:13px">' + esc(s.e5Warn) + '</div>';
    h += '</div><div class="card"><h2 class="card-title">' + esc(t.sections.tool) + '</h2><div class="seg" role="group" aria-label="' + esc(t.sections.tool) + '">';
    h += '<button type="button" data-act="set" data-arg="tool:ktuner" aria-pressed="' + (state.tool === 'ktuner') + '">KTuner</button><button type="button" data-act="set" data-arg="tool:hondata" aria-pressed="' + (state.tool !== 'ktuner') + '">Hondata FlashPro</button></div>';
    h += '<p class="muted" style="margin:0;color:var(--ink-2);line-height:1.5">' + esc(state.tool === 'ktuner' ? s.toolK : s.toolH) + '</p></div></section>';

    h += '<section class="card"><div class="card-row"><h2 class="card-title">' + esc(t.sections.prep) + '</h2><span class="mono muted">' + esc(s.prepCount(d.prepCount)) + '</span></div><div class="checklist">';
    PREP_KEYS.forEach(function (k) {
      var p = s.prep[k];
      h += '<div class="check-item"><input type="checkbox" id="prep-' + k + '" data-bind="prep.' + k + '"' + (state.prep[k] ? ' checked' : '') + '><label for="prep-' + k + '"><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></label></div>';
    });
    h += '</div></section>';

    h += '<section style="display:flex;flex-direction:column;gap:12px"><h2 class="card-title">' + esc(t.sections.vietnam) + '</h2><div class="vn-grid">';
    s.vn.forEach(function (v) { h += '<div class="vn">' + VN_ICON[v[0]] + '<div><b>' + esc(v[1]) + '</b><span>' + esc(v[2]) + '</span></div></div>'; });
    h += '</div></section>';
    return h;
  }
  function opt(value, label, current) { return '<option value="' + value + '"' + (current === value ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function list(items) { return '<ol class="steps">' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>'; }

  function viewS2(t) {
    var s = t.s2, rec = slots.baseline;
    var h = '<p class="lead">' + fill(esc(s.why), { loop: linkHint('loop', s.loopLink) }) + '</p>';
    h += '<section class="grid-2"><div class="card"><h2 class="card-title">' + esc(t.sections.doIn(toolName())) + '</h2>' + list(s.do) + '</div>';
    h += '<div class="card"><h2 class="card-title">' + esc(t.sections.drive) + '</h2>' + list(s.drive.map(esc)) + '</div></section>';
    h += '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="card-title">' + esc(t.sections.channels) + '</h2><div class="chan-list">';
    var found = {};
    if (rec) rec.an.meta.found.forEach(function (k) { found[k] = true; });
    K.REQUIRED.forEach(function (k) {
      var cls = rec ? (found[k] ? ' is-in' : ' is-out') : '';
      h += '<span class="chan' + cls + '">' + esc(t.channels[k]) + (rec ? '<small>' + esc(found[k] ? s.inLog : s.missing) + '</small>' : '') + '</span>';
    });
    return h + '</div></section>';
  }

  function viewS3(t) {
    var s = t.s3, cs = currentSug();
    var h = '<p class="lead">' + fill(esc(s.why), { trims: linkHint('trims', s.trimsLink), afm: linkHint('afm', s.afmLink) }) + '</p>';
    var pasted = state.afmPaste && state.afmPaste.trim() ? K.parseAfmPaste(state.afmPaste) : null;
    var msg = pasted ? (pasted.ok ? s.usingPasted(pasted.values.length) : pasted.reason) : s.usingDefault;
    h += '<section class="card"><h2 class="card-title">' + esc(t.sections.doIn(toolName())) + '</h2><ol class="steps">';
    h += '<li>' + s.do1(esc(s.intake[state.intakePreset])) + '</li>';
    h += '<li>' + s.do2 + '<div class="form" style="margin-top:8px"><label for="afm-paste">' + esc(s.pasteLabel(toolName())) + '</label><textarea id="afm-paste" rows="2" class="mono" data-input="afmPaste" placeholder="0.6452&#9;0.7926&#9;1.0927&#9;…">' + esc(state.afmPaste) + '</textarea><span class="muted" style="color:' + (pasted && !pasted.ok ? 'var(--stop-fg)' : 'var(--ink-3)') + '">' + esc(msg) + '</span></div></li>';
    h += '<li>' + s.do3 + '</li></ol>';
    h += '<button type="button" class="link-btn map-link" data-act="table" data-arg="MAF_Scaling_Custom">' + ICON.map + esc(t.nav2.showIn('MAF_Scaling_Custom')) + '</button></section>';

    h += '<section class="card is-key"><div class="card-row"><h2 class="card-title">' + esc(s.corrected) + '</h2>';
    if (cs && cs.sug.ok) h += '<span class="muted">' + esc(s.from + ': ' + recName(cs.src) + (cs.src.sample ? ' ' + s.simulated : '')) + '</span>';
    h += '</div>';
    if (!cs) h += '<p class="muted" style="margin:0;font-size:14px">' + esc(s.needBaseline) + '</p>';
    else if (!cs.sug.ok) h += '<p class="muted" style="margin:0;font-size:14px">' + esc(cs.sug.reason) + '</p>';
    else {
      var sug = cs.sug;
      var lo = Math.min.apply(null, sug.pct), hi = Math.max.apply(null, sug.pct);
      h += '<div class="legend"><span><i class="sw-dot"></i>' + esc(s.legend[0]) + '</span><span><i class="sw-ring"></i>' + esc(s.legend[1]) + '</span><span><i class="sw-line cmd"></i>' + esc(s.legend[2]) + '</span><span><i class="sw-band"></i>' + esc(s.legend[3]) + '</span></div>';
      h += '<div class="chart">' + trimSvg(cs.src.an, sug, t) + '</div>';
      h += '<div class="proofs"><div class="proof">' + sIcon(sug.stats.monotonicFixes ? 'watch' : 'good', 16) + '<span>' + esc(s.rising(sug.stats.monotonicFixes)) + '</span></div>';
      h += '<div class="proof">' + sIcon('good', 16) + '<span>' + esc(s.largest(Math.abs(hi) >= Math.abs(lo) ? hi : lo, F)) + '</span></div>';
      h += '<div class="proof">' + sIcon('good', 16) + '<span>' + esc(s.points(sug.stats.logPoints, sug.stats.wotPoints)) + '</span></div></div>';
      h += '<div class="table afm-bands"><div class="row head"><span>' + s.head.map(esc).join('</span><span>') + '</span></div>';
      sug.bands.forEach(function (b) {
        h += '<div class="row"><span class="mono">' + esc(F.num(b.from) + '–' + F.num(b.to) + ' Hz') + '</span><span class="mono" style="font-weight:600">' + esc(F.signed(b.meanPct, 1, ' %')) + '</span><span class="mono" style="color:var(--ink-2)">' + esc(F.signed(b.minPct, 1) + ' … ' + F.signed(b.maxPct, 1, ' %')) + '</span><span style="color:var(--ink-2)">' + esc(t.src[b.source] || b.source) + '</span></div>';
      });
      h += '</div><div class="row-out"><div class="card-row"><label for="afm-row" style="font-size:13px;font-weight:700">' + esc(s.rowLabel(toolName())) + '</label><span style="display:flex;gap:8px"><button type="button" class="btn-ghost" data-act="dlAfm">' + esc(s.download) + '</button><button type="button" class="btn" data-act="copyAfm">' + esc(ui.copied === 'afm' ? s.copied : (ui.copied === 'afm:manual' ? s.manual : s.copy)) + '</button></span></div>';
      h += '<textarea id="afm-row" rows="3" readonly>' + esc(K.toRow(sug.after)) + '</textarea></div>';
    }
    h += '<div class="rules">' + s.rules.map(function (r) { return '<div><b>' + esc(r[0]) + '</b> ' + esc(r[1]) + '</div>'; }).join('') + '</div></section>';
    h += '<section class="card is-soft"><h2 class="card-title">' + esc(t.sections.stuck) + '</h2><div class="pairs">' + s.stuck.map(function (p) { return '<b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span>'; }).join('') + '</div></section>';
    return h;
  }

  function viewS4(t) {
    var s = t.s4;
    var h = '<p class="lead">' + fill(esc(s.why), { loop: linkHint('loop', s.loopLink), afr: linkHint('afr', s.afrLink) }) + '</p>';
    h += '<div class="note"><span class="badge-dark">E10</span><p>' + esc(s.e10(toolName())) + ' ' + linkHint('e10', s.e10Link) + ' <button type="button" class="link-btn" data-act="page" data-arg="guide">' + esc(t.guide.e10.title) + '</button></p></div>';
    h += '<button type="button" class="link-btn map-link" data-act="table" data-arg="WOT_Enrich_L">' + ICON.map + esc(t.nav2.showIn('WOT_Enrich_L / WOT_Enrich_H')) + '</button>';
    h += '<section class="grid-2"><div class="card"><h2 class="card-title">' + esc(t.sections.doIn(toolName())) + '</h2>' + list(s.do) + '</div>';
    h += '<div class="card"><h2 class="card-title">' + esc(t.sections.drive) + '</h2>' + list(s.drive.map(esc)) + '</div></section>';
    return h;
  }

  function viewWot(t) {
    var s = t.s4, rec = slots.wot || slots.afm || slots.baseline;
    if (!rec) return '';
    var an = rec.an, w = an.wot;
    var h = '<div style="display:flex;flex-direction:column;gap:14px;padding-top:6px;border-top:1px solid var(--line-2)">';
    h += '<div class="card-row"><h3 style="margin:0;font-size:15px">' + esc(s.chart) + '</h3><span class="muted">' + esc(recName(rec) + (rec === slots.wot ? '' : ' ' + s.fromLatest)) + '</span></div>';
    if (w.byRpm.length < 2) h += '<p class="muted" style="margin:0">' + esc(s.noPull) + '</p>';
    else {
      h += '<div class="kpis"><div class="kpi"><span>' + esc(s.avgErr) + '</span><b>' + esc(isNum(w.absErrAfr) ? F.num(w.absErrAfr, 2) + ' AFR ' + (w.signedErrAfr > 0 ? s.lean : s.rich) : '-') + '</b></div>';
      h += '<div class="kpi"><span>' + esc(s.leanest) + '</span><b>' + esc(isNum(w.leanestLambda) ? F.afr(w.leanestLambda) + ' (λ ' + F.lambda(w.leanestLambda) + ')' : '-') + '</b></div>';
      h += '<div class="kpi"><span>' + esc(s.fp) + '</span><b>' + esc(isNum(w.fuelPressRatio) ? F.num(w.fuelPressRatio * 100, 0) + ' ' + s.ofTarget : s.notLogged) + '</b></div></div>';
      h += '<div class="legend"><span><i class="sw-line"></i>' + esc(s.legend[0]) + '</span><span><i class="sw-dash"></i>' + esc(s.legend[1]) + '</span><span><i class="sw-limit"></i>' + esc(s.legend[2]) + '</span></div>';
      h += '<div class="chart">' + wotSvg(an, t) + '</div>';
    }
    var pull = pullSvg(rec, t);
    if (pull) {
      h += '<h3 style="margin:0;font-size:15px">' + esc(s.pull) + '</h3><div class="legend"><span><i class="sw-line"></i>' + esc(s.pullLegend[0]) + '</span><span><i class="sw-dash"></i>' + esc(s.pullLegend[1]) + '</span></div><div class="chart">' + pull + '</div>';
    }
    return h + '</div>';
  }

  function viewS5(t, d) {
    var s = t.s5;
    var h = '<p class="lead">' + fill(esc(s.why), { cvt: linkHint('cvt', s.cvtLink) }) + '</p>';
    if (d[5]) h += '<div class="banner good"><b>' + esc(s.done) + '</b></div>';
    h += '<section class="grid-2">' + confirmCard(s.cool, s.coolBody, slots.cool, t) + confirmCard(s.hot, s.hotBody, slots.hot, t) + '</section>';
    h += '<div class="note"><span class="badge-dark">Boost</span><p>' + s.boostTip + ' ' + linkHint('boost', s.boostLink) + '</p></div>';
    return h;
  }
  function confirmCard(title, body, rec, t) {
    var status = rec ? rec.an.verdict : 'nodata';
    var label = rec ? (status === 'good' ? t.verdict.good : t.status[status]) + ': ' + recName(rec) : t.s5.notLoaded;
    return '<div class="card"><h2 class="card-title">' + esc(title) + '</h2><p style="margin:0;font-size:14px">' + esc(body) + '</p><span class="pill st-' + status + '" style="align-self:flex-start">' + esc(label) + '</span></div>';
  }

  function viewS6(t, d) {
    var s = t.s6, lean = K.suggestWotLean(), bs = K.suggestBoostStep(state.ceiling);
    var h = '';
    if (!d[5]) h += '<div class="banner warn">' + s.locked + '</div>';
    h += '<p class="lead">' + fill(esc(s.why(bs.mapPeak)), { why: linkHint('cvtbelt', s.whyLink) }) + '</p>';
    h += '<section class="card"><div class="lever-head"><h2>' + esc(s.l1) + '</h2><span class="badge is-tint">' + esc(s.first) + '</span></div><p style="margin:0;font-size:14px;color:var(--ink-2)">' + s.l1Body + '</p>';
    h += '<div class="table l1"><div class="row head"><span>' + s.l1Head.map(esc).join('</span><span>') + '</span></div>';
    lean.rows.forEach(function (r) {
      h += '<div class="row"><span class="mono" style="font-weight:600">' + esc(F.num(r.rpm)) + '</span>' + r.cells.map(function (c) { return '<span class="mono">' + esc(c.from.toFixed(1) + ' → ' + c.to.toFixed(1)) + '</span>'; }).join('') + '</div>';
    });
    h += '</div><div style="font-size:13px;color:var(--ink-2)">' + s.l1Pass + '</div>';
    h += '<button type="button" class="link-btn map-link" data-act="table" data-arg="WOT_Enrich_L">' + ICON.map + esc(t.nav2.showIn('WOT_Enrich_L / WOT_Enrich_H')) + '</button>';
    h += '<div class="check-item"><input type="checkbox" id="applied-wot" data-bind="applied.wot"' + (state.applied.wot ? ' checked' : '') + '><label for="applied-wot"><b>' + esc(state.lang === 'vi' ? 'Đã áp dụng vào map của tôi' : 'Applied in my map') + '</b></label></div></section>';

    h += '<section class="card"><div class="lever-head"><h2>' + esc(s.l2) + '</h2><span class="badge">' + esc(s.l2Tag) + '</span></div>';
    h += '<div class="field-inline" style="gap:12px;flex-wrap:wrap"><label for="ceiling" style="font-size:14px;font-weight:600;color:var(--ink)">' + esc(s.ceiling) + '</label><input id="ceiling" type="number" min="16" max="23" step="0.5" value="' + state.ceiling + '" data-bind="ceiling" class="mono" style="width:90px"><span class="muted">' + esc(s.peakToday(bs.mapPeak)) + '</span></div>';
    if (bs.atCeiling) h += '<p style="margin:0;font-size:14px;padding:10px 12px;border-radius:10px;background:var(--sheet-2)">' + esc(s.atCeiling) + '</p>';
    else {
      h += '<div class="table l2"><div class="row head"><span>' + s.l2Head.map(esc).join('</span><span>') + '</span></div>';
      bs.rows.forEach(function (r) { h += '<div class="row"><span class="mono" style="font-weight:600">' + esc(F.num(r.rpm)) + '</span><span class="mono">' + esc(r.from + ' → ' + r.to + ' psi') + '</span></div>'; });
      h += '</div><div class="check-item"><input type="checkbox" id="applied-boost" data-bind="applied.boost"' + (state.applied.boost ? ' checked' : '') + '><label for="applied-boost"><b>' + esc(state.lang === 'vi' ? 'Đã áp dụng vào map của tôi' : 'Applied in my map') + '</b></label></div>';
    }
    h += '<div style="font-size:13px;color:var(--ink-2)">' + s.l2Rules + '</div>';
    h += '<button type="button" class="link-btn map-link" data-act="table" data-arg="Boost_Target_1_Normal_L">' + ICON.map + esc(t.nav2.showIn('Boost_Target_1/2/3_Normal_L/H')) + '</button></section>';
    h += '<section class="card is-soft"><h2 class="card-title">' + esc(t.sections.leftAlone) + '</h2><div class="pairs">' + s.alone.map(function (p) { return '<b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span>'; }).join('') + '</div></section>';
    return h;
  }

  function viewS7(t) {
    var s = t.s7, rv = state.review;
    var h = '<p class="lead">' + esc(s.why) + '</p>';
    h += '<section class="card"><h2 class="card-title">' + esc(t.sections.refs) + '</h2><div class="refs">';
    refChecks().forEach(function (c) {
      var r = refText(c);
      h += '<div class="ref"><span class="pill st-' + c.status + '">' + sIcon(c.status, 14) + esc(t.status[c.status]) + '</span><span><b>' + esc(r.label) + '</b><span>' + esc(r.detail) + '</span></span></div>';
    });
    h += '</div></section><section class="grid-2"><div class="card"><h2 class="card-title">' + esc(t.sections.ticks) + '</h2><div class="ticks">';
    s.ticks.forEach(function (tk) {
      h += '<div class="check-item"><input type="checkbox" id="tick-' + tk[0] + '" data-bind="review.' + tk[0] + '"' + (rv[tk[0]] ? ' checked' : '') + '><label for="tick-' + tk[0] + '"><b style="font-weight:500">' + esc(tk[1]) + '</b></label></div>';
    });
    h += '</div></div><div class="card"><h2 class="card-title">' + esc(t.sections.signoff) + '</h2><div class="form">';
    h += '<label for="rev-name">' + esc(s.reviewer) + '</label><input id="rev-name" type="text" data-input="review.name" value="' + esc(rv.name) + '" placeholder="' + esc(s.reviewerPh) + '">';
    h += '<label for="rev-uses">' + esc(s.uses) + '</label><select id="rev-uses" data-bind="review.uses">' + opt('KTuner', 'KTuner', rv.uses) + opt('Hondata', 'Hondata', rv.uses) + opt('KTuner and Hondata', s.both, rv.uses) + '</select>';
    h += '<div class="decision" role="group" aria-label="' + esc(t.sections.signoff) + '"><button type="button" class="is-approve" data-act="set" data-arg="review.decision:approve" aria-pressed="' + (rv.decision === 'approve') + '">' + esc(s.approve) + '</button><button type="button" class="is-changes" data-act="set" data-arg="review.decision:changes" aria-pressed="' + (rv.decision === 'changes') + '">' + esc(s.changes) + '</button></div>';
    h += '<label for="rev-notes">' + esc(s.notes) + '</label><textarea id="rev-notes" rows="2" data-input="review.notes" placeholder="' + esc(s.notesPh) + '">' + esc(rv.notes) + '</textarea></div></div></section>';
    h += '<section class="card is-key"><div class="card-row"><label for="packet" class="card-title">' + esc(t.sections.packet) + '</label><span style="display:flex;gap:8px"><button type="button" class="btn-ghost" data-act="dlPacket">' + esc(s.download) + '</button><button type="button" class="btn" data-act="copyPacket">' + esc(ui.copied === 'packet' ? s.copied : (ui.copied === 'packet:manual' ? s.manual : s.copy)) + '</button></span></div>';
    h += '<p class="muted" style="margin:0;color:var(--ink-2)">' + esc(s.packetNote) + '</p><textarea id="packet" class="packet" rows="14" readonly>' + esc(buildPacket()) + '</textarea></section>';
    return h;
  }

  // ---------------------------------------------------------------------------
  // Your map: every table from the owner's file, 2D and 3D, with the cells to change
  // ---------------------------------------------------------------------------
  var MAP = window.KTA_MAP || { name: '', tables: {} };
  var MAP_NAMES = Object.keys(MAP.tables);
  var mapCache = {};
  var B2_TABLES = ['Boost_Target_1_Normal_L', 'Boost_Target_1_Normal_H', 'Boost_Target_2_Normal_L', 'Boost_Target_2_Normal_H', 'Boost_Target_3_Normal_L', 'Boost_Target_3_Normal_H'];
  function mapTable(name) {
    if (!MAP.tables[name]) return null;
    return mapCache[name] || (mapCache[name] = K.readTable(name, MAP.tables[name]));
  }
  function family(name) {
    if (/^Boost_Target_\d_Normal_/.test(name)) return 'Boost_Target_Normal';
    if (/^Boost_Target_\d_ECO_/.test(name)) return 'Boost_Target_ECO';
    if (/^Knock_Sens_/.test(name)) return 'Knock_Sens';
    if (/^DI_Fuel_Pressure_Target_/.test(name)) return 'DI_Fuel_Pressure_Target';
    return name.replace(/_(L|H)$/, '');
  }
  function tableInfo(name) { return (T().tables || {})[family(name)] || { name: name, what: '', edit: '' }; }
  function tableLabel(name) {
    var b = /^Boost_Target_(\d)_(Normal|ECO)_(L|H)$/.exec(name);
    if (b) return 'Boost Target ' + b[1] + ' ' + b[2] + ' ' + b[3];
    var k = /^Knock_Sens_([0-9+]+)_/.exec(name), d = /_(\d+)pct$/.exec(name), lh = /_(L|H)$/.exec(name);
    return tableInfo(name).name + (k ? ' ' + k[1] : '') + (d ? ' · ' + d[1] + ' % ethanol' : '') + (lh ? ' ' + lh[1] : '');
  }
  function termLabel(key) { var tm = T().terms.filter(function (x) { return x[0] === key; })[0]; return tm ? tm[1] : key; }
  /** The basic-stage change for a table (null when the stage leaves it alone). */
  function mapEdits(name) {
    var tb = mapTable(name);
    if (!tb || tb.meta.role !== 'edit') return null;
    if (tb.meta.stage === 'A') { var c = currentSug(); return K.tableEdits(name, tableInUse(), { maf: c ? c.sug : null }); }
    return K.tableEdits(name, tb.values, { ceiling: state.ceiling });
  }
  function deltaOf(a, b) { return Array.isArray(a[0]) ? a.map(function (row, r) { return row.map(function (v, c) { return v - b[r][c]; }); }) : a.map(function (v, k) { return v - b[k]; }); }
  function fmtCell(v, digits) { return isNum(v) ? v.toFixed(digits) : '-'; }

  function pageHead(eyebrow, title, goal) {
    return '<div class="step-head"><div class="eyebrow">' + esc(eyebrow) + '</div><h1>' + esc(title) + '</h1><p class="goal">' + esc(goal) + '</p></div>';
  }
  function pageFoot() {
    var t = T();
    return '<div class="foot-nav"><button type="button" class="back" data-act="go" data-arg="' + state.step + '">← ' + esc(t.stepOf(state.step, t.groups[GROUP_OF[state.step]])) + '</button><span></span></div>';
  }

  function viewMapPage() {
    var t = T(), m = t.map;
    var name = MAP.tables[state.mapTable] ? state.mapTable : 'WOT_Enrich_L';
    var h = '<main class="main" id="main" tabindex="-1">' + pageHead(m.eyebrow, m.title, m.goal);
    if (!MAP_NAMES.length) return h + '<div class="banner stop">data/ktuner-map.js did not load.</div></main>';
    h += viewBaseMap(m) + viewEditPlan(m);
    h += '<section class="map-browser">' + viewTableList(m, name) + viewTablePanel(m, name) + '</section>';
    h += '<p class="small-note">' + esc(m.digitized) + '</p>';
    return h + pageFoot() + '</main>';
  }

  function viewBaseMap(m) {
    var b = m.base;
    var h = '<section class="card is-key"><div class="card-row"><h2 class="card-title">' + esc(b.title) + '</h2><span class="badge">' + esc(b.tag) + '</span></div>';
    h += '<div class="base-facts">' + b.facts.map(function (f) { return '<div><span>' + esc(f[0]) + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>';
    h += '<p class="base-means">' + esc(b.means) + '</p>';
    h += '<div class="note"><span class="badge-dark">ECO</span><p>' + esc(b.eco) + ' ' + linkHint('kcontrol', termLabel('kcontrol')) + '</p></div></section>';
    return h;
  }

  function viewEditPlan(m) {
    var p = m.plan;
    var rows = [['A', ['MAF_Scaling_Custom']], ['B1', ['WOT_Enrich_L', 'WOT_Enrich_H']], ['B2', B2_TABLES]];
    var h = '<section class="card"><h2 class="card-title">' + esc(p.title) + '</h2><div class="table plan"><div class="row head"><span>' + p.head.map(esc).join('</span><span>') + '</span></div>';
    rows.forEach(function (r) {
      var lab = p[r[0]], e = mapEdits(r[1][0]), n = e ? e.changed.length : 0;
      var cells = r[0] === 'A' ? (e && !e.pending ? m.points(n) : p.pending) : (n ? p.cells(n) : p.none);
      h += '<div class="row"><span><b>' + esc(lab[0]) + '</b></span><span class="tbl-names">';
      h += r[1].map(function (x) { return '<button type="button" class="link-btn mono" data-act="table" data-arg="' + esc(x) + '">' + esc(x) + '</button>'; }).join('');
      h += '<small>' + esc(lab[1]) + '</small></span><span class="mono">' + esc(cells) + '</span><span>' + esc(lab[2]) + '</span></div>';
    });
    return h + '</div></section>';
  }

  function groupedNames() {
    var groups = {};
    MAP_NAMES.forEach(function (n) { var r = (K.TABLES[n] || {}).role || 'info'; (groups[r] = groups[r] || []).push(n); });
    return groups;
  }
  function viewTableList(m, cur) {
    var groups = groupedNames();
    var h = '<nav class="tlist" aria-label="' + esc(m.pick) + '">';
    K.ROLE_ORDER.forEach(function (r) {
      if (!groups[r]) return;
      h += '<div class="tgroup"><div class="rail-label">' + esc(m.roles[r]) + '</div>';
      groups[r].forEach(function (n) {
        h += '<button type="button" class="tbtn role-' + r + '" data-act="table" data-arg="' + esc(n) + '"' + (n === cur ? ' aria-current="true"' : '') + '><span>' + esc(tableLabel(n)) + '</span><small class="mono">' + esc(n) + '</small></button>';
      });
      h += '</div>';
    });
    return h + '</nav>';
  }
  function viewTablePicker(m, cur) {
    var groups = groupedNames();
    var h = '<label class="tpick"><span>' + esc(m.pick) + '</span><select data-bind="mapTable">';
    K.ROLE_ORDER.forEach(function (r) {
      if (!groups[r]) return;
      h += '<optgroup label="' + esc(m.roles[r]) + '">' + groups[r].map(function (n) { return '<option value="' + esc(n) + '"' + (n === cur ? ' selected' : '') + '>' + esc(tableLabel(n)) + '</option>'; }).join('') + '</optgroup>';
    });
    return h + '</select></label>';
  }

  /** What the panel draws for a table: the values, the base for dashed lines, and the marked cells. */
  function panelModel(name) {
    var tb = mapTable(name), meta = tb.meta, e = mapEdits(name);
    var spark = /^Ignition_(Base|Max)_/.test(name);
    var hasEdit = !!(e && e.changed.length);
    var allowed = hasEdit ? ['after', 'before', 'diff'] : (spark ? ['before', 'smooth'] : ['before']);
    var show = allowed.indexOf(state.mapShow) >= 0 ? state.mapShow : allowed[0];
    var view = tb.curve && state.mapView === 'surface' ? 'lines' : (['grid', 'lines', 'surface'].indexOf(state.mapView) >= 0 ? state.mapView : 'grid');
    var base = e ? e.before : tb.values, vals = base, dashed = null, marks = [], diff = false, sp = null;
    if (hasEdit) marks = e.changed.map(function (x) { return { r: x.r, c: x.c, from: x.from, to: x.to }; });
    if (show === 'after' && hasEdit) { vals = e.after; dashed = e.before; }
    if (show === 'diff') { vals = deltaOf(e.after, e.before); diff = true; }
    if (spark) {
      sp = K.smoothPreview(tb.values, { x: tb.x });
      if (show === 'smooth') {
        vals = deltaOf(sp.after, tb.values); diff = true;
        marks = sp.raisedCells.map(function (u) { return { r: u.r, c: u.c, from: u.from, to: u.to }; });
      }
    }
    return { tb: tb, meta: meta, e: e, hasEdit: hasEdit, allowed: allowed, show: show, view: view, vals: vals, dashed: dashed, marks: marks, diff: diff, spark: spark, sp: sp };
  }

  function viewTablePanel(m, name) {
    var t = T(), pm = panelModel(name), tb = pm.tb, meta = pm.meta, info = tableInfo(name), pair = K.pairOf(name);
    var h = '<div class="tpanel" id="tpanel"><div class="tpanel-head"><div class="tpanel-title"><div class="eyebrow">' + esc(m.roles[meta.role] + (meta.stage ? ' · ' + m.stage[meta.stage] : '')) + '</div>';
    h += '<h2 class="card-title">' + esc(tableLabel(name)) + '</h2><code>' + esc(name) + '</code></div>' + viewTablePicker(m, name) + '</div>';

    // toolbar: 2D grid, 2D lines, 3D; what to show
    h += '<div class="toolbar"><div class="seg" role="group" aria-label="' + esc(m.views.grid + ', ' + m.views.lines + ', ' + m.views.surface) + '">';
    ['grid', 'lines', 'surface'].forEach(function (v) {
      var off = v === 'surface' && tb.curve;
      h += '<button type="button" data-act="set" data-arg="mapView:' + v + '" aria-pressed="' + (pm.view === v) + '"' + (off ? ' disabled title="' + esc(m.noSurface) + '"' : '') + '>' + esc(m.views[v]) + '</button>';
    });
    h += '</div>';
    if (pm.allowed.length > 1) {
      h += '<div class="seg" role="group" aria-label="' + esc(m.show.label) + '">' + pm.allowed.map(function (v) { return '<button type="button" data-act="set" data-arg="mapShow:' + v + '" aria-pressed="' + (pm.show === v) + '">' + esc(m.show[v]) + '</button>'; }).join('') + '</div>';
    }
    if (pair) h += '<button type="button" class="btn-ghost" data-act="table" data-arg="' + esc(pair) + '">' + esc(tableLabel(pair)) + ' →</button>';
    h += '</div>';

    // the picture
    h += '<div class="viz">';
    if (pm.view === 'grid') h += gridHtml(pm, m);
    else if (pm.view === 'lines') h += linesHtml(pm, m);
    else h += surfaceHtml(pm, m, name);
    h += '</div>';

    // what changes, and whether the shape holds
    var facts = [];
    if (meta.role === 'edit') {
      var e = pm.e;
      if (meta.stage === 'A' && e.pending) facts.push(['nodata', m.pendingAfm]);
      else if (meta.stage === 'B2' && !e.changed.length) facts.push(['nodata', m.atCeiling]);
      else {
        facts.push(['good', tb.curve ? m.points(e.changed.length) : m.cells(e.changed.length)]);
        var sm = K.smoothness(e.before, e.after, { tol: meta.tol });
        facts.push(sm.ok ? ['good', m.shapeOk] : ['stop', m.shapeBad(sm.spikes.length)]);
        if (!tb.curve) facts.push(['good', m.step(F.num(sm.stepBefore, meta.digits), F.num(sm.stepAfter, meta.digits), meta.unit)]);
      }
      if (pair) facts.push(['watch', m.also(pair)]);
    } else if (pm.spark) facts.push(['stop', m.blind(pm.sp, name, F)]);
    else facts.push(['nodata', m.noEdit]);
    h += '<div class="proofs map-facts">' + facts.map(function (f) { return '<div class="proof">' + sIcon(f[0], 16) + '<span>' + esc(f[1]) + '</span></div>'; }).join('') + '</div>';

    // what the table is, and how to change it
    var pairs = [[m.info.what, info.what], [m.info.edit, info.edit]];
    if (info.verify) pairs.push([m.info.verify, info.verify]);
    if (info.shape) pairs.push([m.info.shape, info.shape]);
    h += '<div class="pairs">' + pairs.map(function (p) { return '<b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span>'; }).join('') + '</div>';
    if (meta.role === 'edit') h += '<div class="howto"><h3>' + esc(m.how) + '</h3>' + list(m.howSteps[meta.stage].map(esc)) + '</div>';
    if (pair) h += '<p class="small-note">' + esc(m.lh) + '</p>';
    return h + '</div>';
  }

  function gridHtml(pm, m) {
    var tb = pm.tb, meta = pm.meta, digits = pm.diff ? Math.max(1, meta.digits) : meta.digits;
    var mark = {};
    pm.marks.forEach(function (x) { mark[x.r + ',' + x.c] = x; });
    var h = '<div class="legend"><span><i class="sw-cell"></i>' + esc(m.legend.changed) + '</span><span class="mono">' + esc(meta.unit || '') + '</span></div>';
    h += '<div class="grid-scroll" tabindex="0" role="region" aria-label="' + esc(tableLabel(tb.name)) + '"><table class="hgrid">';
    if (tb.curve) {
      var vals = pm.vals, before = pm.e ? pm.e.before : null;
      var cell = function (v, k) {
        var x = mark['0,' + k], bg = pm.diff ? diffBg(v) : '';
        return '<td class="' + (x ? 'is-changed' : '') + '"' + (bg ? ' style="background:' + bg + '"' : '') + (x ? ' data-tip="' + esc(fmtCell(x.from, 3) + ' → ' + fmtCell(x.to, 3)) + '"' : '') + '>' + esc(fmtCell(v, pm.diff ? 3 : digits)) + '</td>';
      };
      h += '<tbody><tr><th class="rowh">' + esc(meta.x === 'rpm' ? m.axis.rpm : m.gridCurve.hz) + '</th>' + tb.x.map(function (x) { return '<th>' + esc(F.num(x)) + '</th>'; }).join('') + '</tr>';
      h += '<tr><th class="rowh">' + esc(pm.diff ? 'Δ ' + meta.unit : (meta.unit || m.gridCurve.value)) + '</th>' + vals.map(cell).join('') + '</tr>';
      if (before && pm.hasEdit && pm.show === 'after') h += '<tr><th class="rowh">' + esc(m.gridCurve.change) + '</th>' + vals.map(function (v, k) { return '<td class="pct">' + esc(before[k] ? F.signed((v / before[k] - 1) * 100, 1, '%') : '-') + '</td>'; }).join('') + '</tr>';
      return h + '</tbody></table></div>';
    }
    var heat = K.view.heat(pm.vals, { rowLabels: tb.x, digits: digits });
    h += '<thead><tr><th class="rowh">rpm \\ col</th>' + heat.cols.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>';
    heat.rows.forEach(function (row, r) {
      h += '<tr><th class="rowh">' + esc(row.label) + '</th>';
      row.cells.forEach(function (c, ci) {
        var x = mark[r + ',' + ci], bg = pm.diff ? diffBg(c.v) : c.bg, fg = pm.diff ? 'var(--ink)' : c.fg;
        var tip = x ? (fmtCell(x.from, meta.digits) + ' → ' + fmtCell(x.to, meta.digits) + (meta.unit ? ' ' + meta.unit : '')) : '';
        h += '<td class="' + (x ? 'is-changed' : '') + '" style="background:' + bg + ';color:' + fg + '"' + (tip ? ' data-tip="' + esc(F.num(tb.x[r]) + ' rpm, col ' + ci + ': ' + tip) + '"' : '') + '>' + esc(pm.diff && c.v > 0 ? '+' + c.text : c.text) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }
  function diffBg(v) { return !isNum(v) || Math.abs(v) < 1e-9 ? 'var(--sheet-2)' : (v > 0 ? 'rgba(235, 104, 52, ' + (0.18 + Math.min(0.5, Math.abs(v) * 0.12)) + ')' : 'rgba(42, 120, 214, ' + (0.18 + Math.min(0.5, Math.abs(v) * 0.12)) + ')'); }

  function linesHtml(pm, m) {
    var tb = pm.tb, meta = pm.meta;
    var f = K.view.lines(pm.vals, { x: tb.x, before: pm.dashed, unit: meta.unit, xLabel: meta.x === 'Hz' ? m.axis.hz : m.axis.rpm, yLabel: pm.diff ? 'Δ ' + meta.unit : meta.unit });
    var h = '<div class="legend">';
    if (pm.dashed) h += '<span><i class="sw-line cmd"></i>' + esc(m.legend.after) + '</span><span><i class="sw-dash"></i>' + esc(m.legend.before) + '</span>';
    if (!tb.curve) h += '<span class="muted">' + esc(m.axis.col) + ': col 0 → col ' + (Array.isArray(pm.vals[0]) ? pm.vals[0].length - 1 : 0) + '</span>';
    h += '</div><div class="chart"><svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(tableLabel(tb.name)) + '">' + axes(f);
    f.series.forEach(function (s) {
      if (s.before) h += '<path d="' + s.before + '" style="fill:none;stroke:var(--axis);stroke-width:1.6;stroke-dasharray:5 4"/>';
      h += '<path d="' + s.d + '" style="fill:none;stroke:' + s.color + ';stroke-width:' + s.width + ';stroke-linejoin:round"' + (s.label ? ' data-tip="' + esc(s.label) + '"' : '') + '/>';
    });
    return h + '</svg></div>';
  }

  function narrow() { return !!(window.matchMedia && window.matchMedia('(max-width: 759px)').matches); }
  function surfaceModel(pm) {
    var meta = pm.meta;
    return K.view.surface(pm.vals, {
      x: pm.tb.x, yaw: ui.yaw, pitch: ui.pitch, w: narrow() ? 540 : 760, h: narrow() ? 500 : 470, diff: pm.diff, unit: pm.diff ? 'Δ ' + meta.unit : meta.unit,
      digits: pm.diff ? Math.max(1, meta.digits) : meta.digits, rowUnit: 'rpm',
      mark: pm.marks.map(function (x) { return { r: x.r, c: x.c, tip: F.num(pm.tb.x[x.r]) + ' rpm, col ' + x.c + ': ' + fmtCell(x.from, meta.digits) + ' → ' + fmtCell(x.to, meta.digits) }; })
    });
  }
  function surfaceSvg(s, label, m) {
    var h = '<svg viewBox="' + s.viewBox + '" role="img" aria-label="' + esc(label) + '">';
    h += '<path class="s-floor" d="' + s.edge + '"/>';
    s.quads.forEach(function (q) { h += '<polygon points="' + q.points + '" fill="' + q.fill + '" data-tip="' + esc(q.tip) + '"/>'; });
    s.marks.forEach(function (k) { h += '<circle class="s-mark" cx="' + k.cx + '" cy="' + k.cy + '" r="3.6" data-tip="' + esc(k.tip) + '"/>'; });
    s.labels.forEach(function (l) { h += '<text x="' + l.x + '" y="' + l.y + '" text-anchor="' + l.anchor + '">' + esc(l.text) + '</text>'; });
    return h + '</svg>';
  }
  function surfaceHtml(pm, m, name) {
    ui.surface = { name: name };
    var h = '<div class="legend">';
    if (pm.marks.length) h += '<span><i class="sw-mark"></i>' + esc(pm.show === 'smooth' ? m.legend.add : m.legend.changed) + '</span>';
    if (pm.diff) h += '<span><i class="sw-sq" style="background:#e8710a"></i>+</span><span><i class="sw-sq" style="background:#2a78d6"></i>−</span>';
    var flat = [];
    pm.vals.forEach(function (row) { row.forEach(function (v) { if (isNum(v)) flat.push(v); }); });
    var dg = pm.diff ? Math.max(1, pm.meta.digits) : pm.meta.digits;
    var lo = Math.min.apply(null, flat), hi = Math.max.apply(null, flat);
    h += '<span class="muted">' + esc(m.axes3d(pm.meta.unit || '', pm.diff, pm.diff ? F.signed(lo, dg) : F.num(lo, dg), pm.diff ? F.signed(hi, dg) : F.num(hi, dg))) + '</span></div>';
    h += '<div class="surface" id="surface" tabindex="0" aria-label="' + esc(m.surfaceLabel(tableLabel(name))) + '">' + surfaceSvg(surfaceModel(pm), tableLabel(name), m) + '</div>';
    h += '<div class="rot"><button type="button" data-act="rot" data-arg="left" aria-label="' + esc(m.turnLeft) + '">↺</button><button type="button" data-act="rot" data-arg="right" aria-label="' + esc(m.turnRight) + '">↻</button>';
    h += '<button type="button" data-act="rot" data-arg="up" aria-label="' + esc(m.tiltUp) + '">↑</button><button type="button" data-act="rot" data-arg="down" aria-label="' + esc(m.tiltDown) + '">↓</button>';
    h += '<button type="button" data-act="rot" data-arg="reset">' + esc(m.reset) + '</button><span class="muted">' + esc(m.dragHint) + '</span></div>';
    return h;
  }
  var rafPending = false;
  function redrawSurface() {
    if (rafPending) return;
    rafPending = true;
    (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () {
      rafPending = false;
      var el = document.getElementById('surface');
      if (!el || state.page !== 'map') return;
      var name = MAP.tables[state.mapTable] ? state.mapTable : 'WOT_Enrich_L', pm = panelModel(name);
      el.innerHTML = surfaceSvg(surfaceModel(pm), tableLabel(name), T().map);
    });
  }

  // ---------------------------------------------------------------------------
  // Guide: basic road tune, E10 and boost answers, road pull, 3D fact check, panel
  // ---------------------------------------------------------------------------
  function viewGuidePage() {
    var t = T(), g = t.guide;
    var h = '<main class="main" id="main" tabindex="-1">' + pageHead(g.eyebrow, g.title, g.goal);

    h += '<section class="card"><h2 class="card-title">' + esc(g.basic.title) + '</h2><div class="table basic"><div class="row head"><span>' + g.basic.head.map(esc).join('</span><span>') + '</span></div>';
    g.basic.rows.forEach(function (r) {
      h += '<div class="row"><span><b>' + esc(r[0]) + '</b></span><span><span class="pill st-' + r[1] + '">' + esc(r[2]) + '</span></span><span>' + esc(r[3]) + '</span><span class="muted-2">' + esc(r[4]) + '</span></div>';
    });
    h += '</div></section>';

    h += '<section class="grid-2"><div class="card"><h2 class="card-title">' + esc(g.e10.title) + '</h2><p class="lead-sm"><b>' + esc(g.e10.lead) + '</b></p>' + list(g.e10.points.map(esc));
    h += '<p class="body-sm">' + esc(g.e10.us) + ' ' + linkHint('e10', termLabel('e10')) + '</p><div class="note"><span class="badge-dark">WOT</span><p>' + esc(g.e10.then) + '</p></div></div>';
    h += '<div class="card"><h2 class="card-title">' + esc(g.boost.title) + '</h2><ul class="dots">' + g.boost.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
    h += '<button type="button" class="link-btn" data-act="table" data-arg="Boost_Target_1_Normal_L">' + esc(t.nav2.showIn('Boost_Target_1_Normal_L')) + '</button></div></section>';

    h += '<section class="card"><div class="card-row"><h2 class="card-title">' + esc(g.pull.title) + '</h2><span class="muted">' + esc(g.pull.source) + '</span></div>' + list(g.pull.steps.map(esc)) + '</section>';

    var ign = mapTable('Ignition_Base_H'), sp = ign ? K.smoothPreview(ign.values, { x: ign.x }) : null;
    h += '<section class="card"><h2 class="card-title">' + esc(g.smooth.title) + '</h2><p class="lead-sm"><b>' + esc(g.smooth.verdict) + '</b></p><div class="pairs">';
    g.smooth.points.forEach(function (p) { h += '<b>' + esc(p[0]) + '</b><span>' + esc(p[1] || (sp ? t.map.blind(sp, 'Ignition_Base_H', F) : '')) + '</span>'; });
    h += '</div><p class="body-sm">' + esc(g.smooth.rule) + '</p><div><button type="button" class="btn-ghost" data-act="smoothDemo">' + esc(g.smooth.show) + '</button></div></section>';

    h += '<section class="card"><h2 class="card-title">' + esc(g.panel.title) + '</h2><p class="muted" style="margin:0">' + esc(g.panel.note) + '</p><div class="panel">';
    g.panel.topics.forEach(function (tp, i) {
      var id = 'topic-' + i;
      h += '<details class="topic" id="' + id + '"' + (ui.topics[id] ? ' open' : '') + '><summary>' + sIcon(tp.v[0], 18) + '<span>' + esc(tp.q) + '</span></summary><div class="voices">';
      ['kt', 'hd', 'ols', 'honda'].forEach(function (k) { h += '<div class="voice"><b>' + esc(g.panel.who[k]) + '</b><p>' + esc(tp[k]) + '</p></div>'; });
      h += '</div><div class="verdict st-' + tp.v[0] + '"><b>' + esc(g.panel.verdict) + '</b><p>' + esc(tp.v[1]) + '</p></div></details>';
    });
    h += '</div></section>';

    var tagSt = { kept: 'good', adapted: 'watch', left: 'nodata' };
    h += '<section class="card"><h2 class="card-title">' + esc(g.videos.title) + '</h2><div class="table vids"><div class="row head"><span>' + g.videos.head.map(esc).join('</span><span>') + '</span></div>';
    g.videos.rows.forEach(function (r) { h += '<div class="row"><span>' + esc(r[0]) + '</span><span><span class="pill st-' + tagSt[r[1]] + '">' + esc(g.videos.tags[r[1]]) + '</span></span><span class="muted-2">' + esc(r[2]) + '</span></div>'; });
    h += '</div></section>';

    h += '<section class="card is-soft"><h2 class="card-title">' + esc(g.sourcesTitle) + '</h2><div class="src-list">' + g.sources.map(function (s) { return '<a href="' + esc(s[0]) + '" target="_blank" rel="noopener">' + esc(s[1]) + '</a>'; }).join('') + '</div><p class="small-note">' + esc(g.videosNote) + '</p></section>';
    return h + pageFoot() + '</main>';
  }

  function viewCheck(t, n) {
    var c = t.check, slot = slotFor(n), rec = slots[slot];
    var h = '<section class="card" aria-labelledby="check-title"><div class="card-row"><h2 class="card-title" id="check-title">' + esc(t.sections.check) + '</h2>';
    if (n === 5) h += '<div class="tabs" role="group" aria-label="' + esc(t.s5.which) + '"><button type="button" data-act="set" data-arg="confirmSlot:cool" aria-pressed="' + (state.confirmSlot !== 'hot') + '">' + esc(t.s5.cool) + '</button><button type="button" data-act="set" data-arg="confirmSlot:hot" aria-pressed="' + (state.confirmSlot === 'hot') + '">' + esc(t.s5.hot) + '</button></div>';
    h += '</div><div class="loader" data-drop="1"><label class="file-btn">' + ICON.upload + esc(c.load) + '<input type="file" accept=".csv,.txt,text/csv" data-file="1" aria-label="' + esc(c.load) + '"></label>';
    h += '<span class="muted">' + esc(c.or) + '</span>';
    var rec5 = n === 5 ? (state.confirmSlot === 'hot' ? 'hot' : 'after') : ({ 2: 'before', 3: 'after', 4: 'after', 6: 'after' })[n];
    ['before', 'after', 'hot'].forEach(function (id) {
      var cls = 'btn-ghost' + (rec && rec.sample === id ? ' is-on' : (rec5 === id ? ' is-rec' : ''));
      h += '<button type="button" class="' + cls + '" data-act="sample" data-arg="' + id + '">' + esc(t.samples[id].short) + '</button>';
    });
    h += '</div>';
    if (ui.error) h += '<div class="banner stop" role="alert">' + esc(ui.error) + '</div>';
    if (!rec) {
      var key = n === 5 && state.confirmSlot === 'hot' ? '5hot' : n;
      h += '<p class="muted" style="margin:0;padding:14px 16px;border-radius:10px;background:var(--sheet-2);font-size:14px;color:var(--ink-2)">' + esc(c.empty[key]) + '</p>';
    } else h += viewResult(rec, t);
    if (n === 4) h += viewWot(t);
    return h + '</section>';
  }

  function viewResult(rec, t) {
    var an = rec.an, c = t.check;
    var h = '<div class="log-head"><div><b>' + esc(recName(rec)) + '</b><small>' + esc(c.facts(an, F)) + '</small></div><span class="pill st-' + an.verdict + '">' + sIcon(an.verdict, 16) + esc(t.verdict[an.verdict]) + '</span></div>';
    if (rec.sample) h += '<div class="sim-note">' + esc(t.samples[rec.sample].note + ' ' + t.samples.notYours) + ' <button type="button" class="link-btn" data-act="dlSample" data-arg="' + rec.sample + '">' + esc(c.sampleCsv) + '</button></div>';
    h += '<div class="gates">';
    var fixes = [];
    an.gates.forEach(function (g) {
      h += '<div class="gate-row st-' + g.status + '"><div class="gate-name">' + sIcon(g.status) + '<span><b>' + esc(t.gates[g.id]) + '</b><small>' + esc(t.status[g.status]) + '</small></span></div><div class="gate-checks">';
      g.checks.forEach(function (ck) {
        var tx = checkText(ck);
        if (tx.fix) fixes.push({ status: ck.status, label: tx.label, fix: tx.fix });
        h += '<div class="check-line st-' + ck.status + '"><span class="dot"></span><span class="lbl">' + esc(tx.label) + ' ' + hintBtn(ck.hint || 'trims', tx.label) + '</span><span class="val">' + esc(tx.display) + '</span><span class="tag">' + (ck.status === 'watch' || ck.status === 'stop' ? esc(t.status[ck.status]) : '') + '</span></div>';
      });
      h += '</div></div>';
    });
    h += '</div>';
    if (fixes.length) {
      fixes.sort(function (a, b) { return (a.status === 'stop' ? 0 : 1) - (b.status === 'stop' ? 0 : 1); });
      h += '<div class="fixes"><h3>' + esc(c.whatToDo) + '</h3>' + fixes.map(function (f) { return '<div class="fix"><span class="pill st-' + f.status + '">' + esc(t.status[f.status]) + '</span><span><b>' + esc(f.label) + '.</b> ' + esc(f.fix) + '</span></div>'; }).join('') + '</div>';
    }
    var codes = an.readinessCodes || [];
    if (codes.length) h += '<div class="readiness">' + codes.map(function (r) { var fn = t.readiness[r.code]; return '<span>' + esc(fn ? fn(r, t) : '') + '</span>'; }).join('') + '</div>';
    h += viewColumns(rec, t);
    return h;
  }

  function viewColumns(rec, t) {
    var c = t.check, headers = rec.parsed.headers;
    var h = '<details class="columns" id="columns"' + (ui.columnsOpen ? ' open' : '') + '><summary>' + esc(c.columns) + '</summary><p class="muted" style="margin:8px 0 0">' + esc(c.columnsNote) + '</p><div class="col-grid">';
    K.REQUIRED.forEach(function (key) {
      if (key === 'knock') {
        var ks = rec.mapping.knock || [];
        h += '<label>' + esc(t.channels.knock) + '<span class="mono" style="color:var(--ink);font-size:12.5px">' + esc(ks.length ? ks.map(function (i) { return headers[i]; }).join(', ') : c.none) + '</span></label>';
        return;
      }
      var cur = rec.mapping[key];
      h += '<label>' + esc(t.channels[key]) + '<select data-map="' + key + '"><option value="-1">' + esc(c.none) + '</option>';
      headers.forEach(function (hd, i) { h += '<option value="' + i + '"' + (cur === i ? ' selected' : '') + '>' + esc(hd) + '</option>'; });
      h += '</select></label>';
    });
    return h + '</div></details>';
  }

  function viewAside() {
    var t = T(), key = state.hint || (state.page === 'map' ? 'afm' : (state.page === 'guide' ? 'loop' : HINT_DEFAULT[state.step])), hint = t.hints[key];
    var h = '<aside class="aside" aria-label="' + esc(t.app.explain) + '"><div class="hint" id="hint"><div class="eyebrow">' + esc(t.explain) + '</div>';
    h += '<h3>' + esc(hint.title) + '</h3>';
    hint.paras.forEach(function (p) { h += '<p>' + esc(p) + '</p>'; });
    if (hint.facts) h += '<div class="facts">' + hint.facts.map(function (f) { return '<b>' + esc(f[0]) + '</b><span class="mono">' + esc(f[1]) + '</span>'; }).join('') + '</div>';
    if (hint.bands) h += '<div class="bands">' + hint.bands.map(function (b) { return '<span class="pill st-' + b[0] + '">' + esc(t.status[b[0]]) + '</span><span>' + esc(b[1]) + '</span>'; }).join('') + '</div>';
    if (hint.note) h += '<p class="small">' + esc(hint.note) + '</p>';
    h += '</div><div style="display:flex;flex-direction:column;gap:10px"><div class="eyebrow">' + esc(t.termsTitle) + '</div><div class="terms">';
    t.terms.forEach(function (tm) { h += '<button type="button" data-act="hint" data-arg="' + tm[0] + '" aria-pressed="' + (tm[0] === key) + '">' + esc(tm[1]) + '</button>'; });
    h += '</div></div><div class="sources"><div class="eyebrow">' + esc(t.sources.title) + '</div>';
    t.sources.items.forEach(function (s) { h += '<a href="' + esc(s[0]) + '" target="_blank" rel="noopener">' + esc(s[1]) + '</a>'; });
    h += '</div><p class="session-note">' + esc(t.app.sessionNote) + '</p></aside>';
    return h;
  }

  // ---------------------------------------------------------------------------
  // Review packet (Markdown, in the interface language)
  // ---------------------------------------------------------------------------
  function buildPacket() {
    var t = T(), P = t.packet, L = [];
    var base = baseSug();
    var last = state.lastSlot ? slots[state.lastSlot] : null;
    var lean = K.suggestWotLean(), bs = K.suggestBoostStep(state.ceiling);
    L.push('# ' + P.title, '');
    L.push('- ' + P.car + ': Honda Civic FE 1.5T CVT. ' + t.s1.carLine);
    L.push('- ' + P.fuel + ': ' + fuelLabel() + ' | ' + P.tool + ': ' + toolName());
    L.push('- ' + P.mods + ': ' + (modNames().join(', ') || P.none));
    L.push('- ' + P.stage + ': ' + P.stageA + ' | ' + P.date + ': ' + today());
    L.push('', '## ' + P.changes);
    if (base && base.ok) {
      L.push('- ' + P.afm(base, F));
      base.bands.forEach(function (b) {
        if (Math.abs(b.meanPct) >= 0.05) L.push('  - ' + F.num(b.from) + '-' + F.num(b.to) + ' Hz: ' + F.signed(b.minPct, 1, '%') + ' … ' + F.signed(b.maxPct, 1, '%') + ' (' + (t.src[b.source] || b.source) + ')');
      });
    } else L.push('- ' + P.afmNone);
    L.push('- ' + P.wot + ': ' + (state.applied.wot ? lean.rows.length + ' rpm rows: 11.0 → 11.5 (11.3 ≥ 5,500 rpm)' : P.unchanged));
    L.push('- ' + P.boost + ': ' + (state.applied.boost && bs.rows.length ? bs.rows.map(function (r) { return F.num(r.rpm) + ' rpm ' + r.from + '→' + r.to; }).join(', ') + ' psi' : P.unchanged));
    L.push('', '## ' + P.evidence + (last ? ' (' + recName(last) + ')' : ''));
    if (last) {
      var an = last.an;
      L.push('- ' + P.evidenceLine(an, F));
      L.push('- ' + P.verdict + ': ' + t.verdict[an.verdict], '');
      L.push('| ' + P.table.join(' | ') + ' |', '|---|---|---|');
      an.gates.forEach(function (g) {
        L.push('| ' + t.gates[g.id] + ' | ' + t.status[g.status] + ' | ' + g.checks.map(function (ck) { var x = checkText(ck); return x.label + ': ' + x.display; }).join('; ') + ' |');
      });
    } else L.push('- ' + P.noLog);
    L.push('', '## ' + P.refs);
    refChecks().forEach(function (c) { var r = refText(c); L.push('- [' + (c.status === 'good' ? 'x' : ' ') + '] ' + r.label + ': ' + r.detail); });
    L.push('', '## ' + P.reviewer);
    var rv = state.review;
    L.push('- ' + P.name + ': ' + (rv.name || '________') + ' | ' + P.uses + ': ' + rv.uses);
    L.push('- ' + P.decision + ': ' + (rv.decision === 'approve' ? t.s7.approve : (rv.decision === 'changes' ? t.s7.changes : P.decisionBlank)));
    if (rv.notes) L.push('- ' + P.notes + ': ' + rv.notes);
    return L.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Loading logs
  // ---------------------------------------------------------------------------
  function ingest(text, name, sample, slot) {
    try {
      var parsed = K.parseCSV(text);
      var rec = { name: name, sample: sample || '', slot: slot, parsed: parsed, mapping: K.detectChannels(parsed.headers, parsed.columns) };
      analyzeRec(rec);
      slots[slot] = rec;
      state.lastSlot = slot;
      // a new baseline is the torque reference for every later log
      if (slot === 'baseline') Object.keys(slots).forEach(function (k) { if (k !== 'baseline') { try { analyzeRec(slots[k]); } catch (err) { /* keep old */ } } });
      ui.error = '';
    } catch (e) {
      ui.error = (name ? name + ': ' : '') + ((e && e.message) || e);
    }
    render();
  }
  function analyzeRec(rec) {
    rec.log = K.buildLog(rec.parsed, rec.mapping);
    var base = slots.baseline;
    var ref = rec.slot !== 'baseline' && base && base !== rec && base.an ? base.an.numbers.torqueMax : NaN;
    rec.an = K.analyze(rec.log, { table: tableInUse(), torqueRef: ref });
  }
  function loadFile(file) {
    var slot = slotFor(state.step);
    if (!file || !slot) return;
    var reader = new FileReader();
    reader.onload = function () { ingest(String(reader.result), file.name, '', slot); };
    reader.onerror = function () { ui.error = T().errors.read(file.name); render(); };
    reader.readAsText(file);
  }

  // ---------------------------------------------------------------------------
  // Copy and download
  // ---------------------------------------------------------------------------
  function copyText(text, key, fieldId) {
    function manual() {
      var el = document.getElementById(fieldId);
      if (el) { el.focus(); el.select(); try { if (document.execCommand('copy')) { ui.copied = key; render(); return; } } catch (e) { /* ignore */ } }
      ui.copied = key + ':manual'; render();
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { ui.copied = key; render(); }, manual);
      else manual();
    } catch (e) { manual(); }
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // ---------------------------------------------------------------------------
  // Actions and events
  // ---------------------------------------------------------------------------
  var ACTIONS = {
    go: function (arg) {
      var n = parseInt(arg, 10);
      if (!(n >= 1 && n <= 7)) return;
      state.step = n; state.page = ''; state.hint = ''; ui.copied = ''; ui.error = '';
      save();
      try { history.replaceState(null, '', '#step-' + n); } catch (e) { /* file:// may refuse */ }
      render({ top: true });
    },
    hint: function (arg) {
      state.hint = arg; save(); render();
      if (state.page || (window.matchMedia && window.matchMedia('(max-width: 1199px)').matches)) {
        var el = document.getElementById('hint');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    set: function (arg) {
      var i = arg.indexOf(':');
      setPath(arg.slice(0, i), arg.slice(i + 1));
      ui.copied = '';
      save(); render();
    },
    sample: function (id) {
      var slot = slotFor(state.step);
      if (slot) ingest(K.sampleCsv(id), '', id, slot);
    },
    dlSample: function (id) { download('civic-fe-' + id + '-simulated.csv', K.sampleCsv(id), 'text/csv;charset=utf-8'); },
    copyAfm: function () { var c = currentSug(); if (c && c.sug.ok) copyText(K.toRow(c.sug.after), 'afm', 'afm-row'); },
    dlAfm: function () {
      var c = currentSug();
      if (c && c.sug.ok) download('afm-flow-corrected.csv', 'Hz,' + c.sug.axis.join(',') + '\ng/s,' + c.sug.after.join(',') + '\n', 'text/csv;charset=utf-8');
    },
    copyPacket: function () { copyText(buildPacket(), 'packet', 'packet'); },
    dlPacket: function () { download('review-packet-' + today() + '.md', buildPacket(), 'text/markdown;charset=utf-8'); },
    theme: function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!state.theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      state.theme = dark ? 'light' : 'dark';
      save(); render();
    },
    lang: function () { state.lang = state.lang === 'vi' ? 'en' : 'vi'; save(); render(); },
    page: function (arg) {
      if (arg !== 'map' && arg !== 'guide') return;
      state.page = arg; state.hint = ''; ui.copied = '';
      save();
      try { history.replaceState(null, '', '#' + arg + (arg === 'map' ? '/' + state.mapTable : '')); } catch (e) { /* file:// may refuse */ }
      render({ top: true });
    },
    table: function (name) {
      if (!MAP.tables[name]) return;
      var fresh = state.page !== 'map';
      state.page = 'map'; state.mapTable = name; state.hint = '';
      save();
      try { history.replaceState(null, '', '#map/' + name); } catch (e) { /* file:// may refuse */ }
      render({ top: fresh });
      if (!fresh) { var p = document.getElementById('tpanel'); if (p && p.getBoundingClientRect().top < 0) p.scrollIntoView({ block: 'start' }); }
    },
    smoothDemo: function () {
      state.page = 'map'; state.mapTable = 'Ignition_Base_H'; state.mapView = 'surface'; state.mapShow = 'smooth';
      save();
      try { history.replaceState(null, '', '#map/Ignition_Base_H'); } catch (e) { /* file:// may refuse */ }
      render({ top: true });
    },
    rot: function (arg) {
      if (arg === 'reset') { ui.yaw = -38; ui.pitch = 58; }
      else if (arg === 'left') ui.yaw -= 15;
      else if (arg === 'right') ui.yaw += 15;
      else if (arg === 'up') ui.pitch = Math.min(88, ui.pitch + 8);
      else if (arg === 'down') ui.pitch = Math.max(12, ui.pitch - 8);
      redrawSurface();
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el) return;
    var fn = ACTIONS[el.getAttribute('data-act')];
    if (fn) { e.preventDefault(); fn(el.getAttribute('data-arg'), el); }
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.hasAttribute('data-file')) { loadFile(el.files && el.files[0]); el.value = ''; return; }
    if (el.hasAttribute('data-map')) {
      var rec = slots[slotFor(state.step)];
      if (!rec) return;
      var v = parseInt(el.value, 10), key = el.getAttribute('data-map');
      rec.mapping = Object.assign({}, rec.mapping);
      if (v >= 0) rec.mapping[key] = v; else delete rec.mapping[key];
      try { analyzeRec(rec); ui.error = ''; } catch (err) { ui.error = String((err && err.message) || err); }
      render();
      return;
    }
    if (el.hasAttribute('data-bind')) {
      var path = el.getAttribute('data-bind'), value;
      if (el.type === 'checkbox') value = el.checked;
      else if (el.type === 'number') { value = parseFloat(el.value); if (!isNum(value)) return; value = Math.max(16, Math.min(23, value)); }
      else value = el.value;
      setPath(path, value);
      save(); render();
      return;
    }
    if (el.hasAttribute('data-input')) {
      if (el.getAttribute('data-input') === 'afmPaste') {
        Object.keys(slots).forEach(function (k) { try { analyzeRec(slots[k]); } catch (err) { /* keep old */ } });
      }
      render();
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.hasAttribute || !el.hasAttribute('data-input')) return;
    setPath(el.getAttribute('data-input'), el.value);
    save();
    var packet = document.getElementById('packet');
    if (packet) packet.value = buildPacket();
  });

  // keep the column-mapping panel open across re-renders
  document.addEventListener('toggle', function (e) {
    if (e.target && e.target.id === 'columns') ui.columnsOpen = e.target.open;
    if (e.target && e.target.classList && e.target.classList.contains('topic')) ui.topics[e.target.id] = e.target.open;
  }, true);

  // drag and drop a CSV anywhere on a step that takes a log
  document.addEventListener('dragover', function (e) {
    if (!slotFor(state.step)) return;
    if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) {
      e.preventDefault();
      var zone = document.querySelector('[data-drop]');
      if (zone) zone.classList.add('is-drag');
    }
  });
  document.addEventListener('dragleave', function (e) {
    if (e.target === document.documentElement || e.clientX <= 0 || e.clientY <= 0) {
      var zone = document.querySelector('[data-drop]');
      if (zone) zone.classList.remove('is-drag');
    }
  });
  document.addEventListener('drop', function (e) {
    if (!slotFor(state.step)) return;
    e.preventDefault();
    var zone = document.querySelector('[data-drop]');
    if (zone) zone.classList.remove('is-drag');
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  // 3D surface: drag with a mouse, finger or pen; arrow keys when focused
  var drag = null;
  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest ? e.target.closest('#surface') : null;
    if (!el || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { x: e.clientX, y: e.clientY, yaw: ui.yaw, pitch: ui.pitch };
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
    el.classList.add('is-drag');
    hideTip();
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    ui.yaw = drag.yaw + (e.clientX - drag.x) * 0.5;
    ui.pitch = Math.max(12, Math.min(88, drag.pitch - (e.clientY - drag.y) * 0.35));
    redrawSurface();
  });
  function endDrag() {
    if (!drag) return;
    drag = null;
    var el = document.getElementById('surface');
    if (el) el.classList.remove('is-drag');
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  document.addEventListener('keydown', function (e) {
    if (!e.target || e.target.id !== 'surface') return;
    var k = e.key;
    if (k === 'ArrowLeft') ui.yaw -= 10;
    else if (k === 'ArrowRight') ui.yaw += 10;
    else if (k === 'ArrowUp') ui.pitch = Math.min(88, ui.pitch + 6);
    else if (k === 'ArrowDown') ui.pitch = Math.max(12, ui.pitch - 6);
    else if (k === 'Home' || k === '0') { ui.yaw = -38; ui.pitch = 58; }
    else return;
    e.preventDefault();
    redrawSurface();
  });

  // chart tooltips
  var tip = null;
  function showTip(el, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'status'); document.body.appendChild(tip); }
    tip.textContent = el.getAttribute('data-tip');
    tip.style.display = 'block';
    var w = tip.offsetWidth;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 12)) + 'px';
    tip.style.top = Math.max(8, y - 36) + 'px';
  }
  function hideTip() { if (tip) tip.style.display = 'none'; }
  document.addEventListener('mouseover', function (e) { if (drag) return; var el = e.target.closest ? e.target.closest('[data-tip]') : null; if (el) showTip(el, e.clientX, e.clientY); else hideTip(); });
  document.addEventListener('mousemove', function (e) { if (tip && tip.style.display === 'block') { var el = e.target.closest ? e.target.closest('[data-tip]') : null; if (el) showTip(el, e.clientX, e.clientY); } });
  document.addEventListener('touchstart', function (e) { var el = e.target.closest ? e.target.closest('[data-tip]') : null; if (el) { var p = e.touches[0]; showTip(el, p.clientX, p.clientY); } else hideTip(); }, { passive: true });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  function applyTheme() {
    if (state.theme === 'dark' || state.theme === 'light') document.documentElement.setAttribute('data-theme', state.theme);
    else document.documentElement.removeAttribute('data-theme');
    document.documentElement.lang = state.lang;
  }
  function render(opts) {
    opts = opts || {};
    var root = document.getElementById('app');
    var active = document.activeElement, activeId = active && active.id, sel = null;
    try { if (active && typeof active.selectionStart === 'number') sel = [active.selectionStart, active.selectionEnd]; } catch (e) { /* not a text field */ }
    var q = function (s) { return root.querySelector(s); };
    var keep = { main: q('.main') ? q('.main').scrollTop : 0, aside: q('.aside') ? q('.aside').scrollTop : 0, rail: q('.rail') ? q('.rail').scrollTop : 0, win: window.scrollY };
    applyTheme();
    hideTip();
    root.classList.toggle('page-wide', state.page === 'map' || state.page === 'guide');
    root.innerHTML = view();
    if (opts.top) {
      if (q('.main')) q('.main').scrollTop = 0;
      if (window.matchMedia && window.matchMedia('(max-width: 1199px)').matches && q('.main')) q('.main').scrollIntoView({ block: 'start' });
    } else {
      if (q('.main')) q('.main').scrollTop = keep.main;
      window.scrollTo(0, keep.win);
    }
    if (q('.aside')) q('.aside').scrollTop = keep.aside;
    if (q('.rail')) q('.rail').scrollTop = keep.rail;
    if (activeId) {
      var el = document.getElementById(activeId);
      if (el && el.focus) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ignore */ } } }
    }
    if (opts.top && q('.main')) q('.main').focus({ preventScroll: true });
  }

  // start
  var m = /#step-(\d)/.exec(location.hash || '');
  if (m) { state.step = Math.max(1, Math.min(7, parseInt(m[1], 10))); state.page = ''; }
  var pm = /#(map|guide)(?:\/([^?#]+))?/.exec(location.hash || '');
  if (pm) {
    state.page = pm[1];
    var want = pm[2] ? decodeURIComponent(pm[2]) : '';
    if (want && window.KTA_MAP && window.KTA_MAP.tables[want]) state.mapTable = want;
  }
  if (/[?&]demo=1\b/.test(location.search)) {
    ['baseline'].forEach(function (slot) { var rec = { name: '', sample: 'before', slot: slot, parsed: K.parseCSV(K.sampleCsv('before')) }; rec.mapping = K.detectChannels(rec.parsed.headers, rec.parsed.columns); analyzeRec(rec); slots[slot] = rec; state.lastSlot = slot; });
  }
  window.addEventListener('hashchange', function () {
    var h = location.hash || '', sm = /#step-(\d)/.exec(h), pg = /#(map|guide)(?:\/([^?#]+))?/.exec(h);
    if (sm) { state.step = Math.max(1, Math.min(7, parseInt(sm[1], 10))); state.page = ''; }
    else if (pg) {
      state.page = pg[1];
      var want = pg[2] ? decodeURIComponent(pg[2]) : '';
      if (want && MAP.tables[want]) state.mapTable = want;
    } else return;
    save(); render({ top: true });
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function () { if (!state.theme) render(); };
    if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme);
  }
  render();
  window.KTA_APP = { state: state, slots: slots, render: render, buildPacket: buildPacket };
})();

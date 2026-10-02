/* Civic FE Tune Assist: the standalone app. Vanilla JS, no build step, works offline.
 * All tuning math lives in engine/ (window.KTA: kta-engine, kta-drive, kta-ask); all text in app/i18n*.js. */
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
  var ui = { copied: '', error: '', yaw: -38, pitch: 58, topics: { 'topic-0': true }, explain: {}, driveErr: '', driveBusy: '', aiOpen: false, carMsg: '', carErr: '', flashForm: null, flashErr: '', folderBusy: false };
  var drives = { current: null, next: null, proof: null };   // drive-check logs live only in this tab
  var ai = { key: '', models: [], caps: {}, busy: false, result: null, q: '', error: '' };
  try { if (state.ai && state.ai.remember) ai.key = localStorage.getItem(STORE + '-key') || ''; } catch (e) { /* storage blocked */ }

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
      plan: { active: null, history: [] }, ai: { model: '', remember: false }, seenDrive: false,
      car: null, lastSlot: ''
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
    var data = c.data || {};
    if (data.flat) {
      var D = T().drive;
      return { label: d ? d.label : c.label, display: D.unavailableLine(data, F, T()), fix: D.unavailableFix(data, F, T()) };
    }
    if (!d) return { label: c.label, display: c.display, fix: c.fix };
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
  ICON.pulse = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7.5 H3.8 L5.4 3 L8 11.5 L9.6 7.5 H13" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round"/></svg>';
  ICON.lock = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" style="fill:none;stroke:currentColor;stroke-width:1.6"/><path d="M5.5 7 V5 A2.5 2.5 0 0 1 10.5 5 V7" style="fill:none;stroke:currentColor;stroke-width:1.6"/></svg>';
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
    var dOn = state.page === 'drive';
    h += '<div class="rail-group"><div class="rail-label">' + esc(t.drive.startHere) + '</div><button type="button" class="step-btn ref-btn drive-btn" data-act="page" data-arg="drive"' + (dOn ? ' aria-current="page"' : '') + '>';
    h += '<span class="step-dot">' + ICON.pulse + '</span><span class="step-text"><span class="step-title">' + esc(t.drive.nav.title) + '</span><span class="step-sub">' + esc(t.drive.nav.sub) + '</span>' + (state.plan.active ? '<span class="step-chip">' + esc(t.drive.doing) + '</span>' : '') + '</span></button></div>';
    h += '<div class="rail-label rail-major">' + esc(t.drive.navFull) + '</div>';
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
    if (state.page === 'drive') return viewDrivePage();
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

  // ---------------------------------------------------------------------------
  // Drive check: check a drive, do one thing, prove it (engine/kta-drive.js, engine/kta-ask.js)
  // ---------------------------------------------------------------------------
  var EXAMPLE_IDS = ['aug30-1601', 'aug30-1529', 'sep01-0813'];
  function driveName(rec) { return rec.example ? T().drive.examples[rec.example].title : rec.name; }
  function actionText(a) {
    var D = T().drive, d = D.actions[a.id] || D.actions.fix;
    if (a.tier === 'safety') {
      var c = findCheck(drives.current ? drives.current.report.an : null, a.check) || { id: a.check, label: a.check, data: {} };
      var tx = checkText(c);
      return { title: d.title(tx.label), why: d.why(tx.display), steps: d.steps(tx.fix || ''), proof: d.proof(tx.label), undo: d.undo, note: '' };
    }
    return { title: d.title, why: d.why(a.ev, F), steps: d.steps, proof: d.proof(a.ev, F), undo: d.undo, note: d.note || '' };
  }
  function findCheck(an, id) {
    var out = null;
    if (an) an.gates.forEach(function (g) { g.checks.forEach(function (c) { if (c.id === id) out = c; }); });
    return out;
  }
  function activeTitle() {
    var A = state.plan.active;
    if (!A) return '';
    if (/^fix:/.test(A.id)) return T().drive.actions.fix.title(A.label || A.id.slice(4));
    var d = T().drive.actions[A.id];
    return d ? d.title : A.id;
  }
  function badgesHtml(a) {
    var B = T().drive.badges, out = '<span class="badge is-tint">' + esc(B.tier[a.tier]) + '</span>';
    out += '<span class="badge">' + esc(B.impact[a.impact]) + '</span><span class="badge">' + esc(B.effort[a.effort]) + '</span>';
    out += '<span class="badge">' + esc(a.flash ? B.flash : B.noFlash) + '</span>';
    if (!a.flash && a.effort === 1) out += '<span class="badge">' + esc(B.free) + '</span>';
    out += '<span class="badge">' + esc(B.risk[a.risk || 0]) + '</span>';
    return '<div class="badges">' + out + '</div>';
  }

  function viewDrivePage() {
    var t = T(), D = t.drive, C = t.car, cur = drives.current;
    var h = '<main class="main drive" id="main" tabindex="-1">' + pageHead(D.eyebrow, D.title, D.goal);
    h += viewLoop3(D, cur);
    if (cur && cur.car) h += viewCarBanner(C, D, cur);
    if (ui.driveErr) h += '<div class="banner stop" role="alert">' + esc(ui.driveErr) + '</div>';
    // an action in progress survives a reload: its proof card comes first, even before a drive is loaded
    if (!cur) return h + (state.plan.active ? viewProve(D) : '') + viewDriveStart(D) + '</main>';
    var R = cur.report, I = R.ins;
    h += viewCarDrive(C, D, cur);
    h += viewSafe(D, R);
    if (state.plan.active) h += viewProve(D);
    h += viewNow(D, R);
    h += viewQueue(D, R);
    h += viewCarHistory(C);
    h += '<section class="card"><div class="card-row"><h2 class="card-title">' + esc(D.feelTitle) + '</h2></div><p class="lead-sm"><b>' + esc(D.feel(I.accel && I.accel.headline, F)) + '</b></p>' + graphCard('accel', accelSvg(I), D) + '<p class="small-note">' + esc(D.feelNote) + '</p></section>';
    h += '<section class="card"><div class="card-row"><h2 class="card-title">' + esc(D.graphsTitle) + '</h2></div><p class="muted" style="margin:0">' + esc(D.graphsNote) + '</p>';
    h += graphCard('kc', kcSvg(I), D) + graphCard('timing', timingSvg(I), D) + graphCard('afr', afrSvg(I), D) + '</section>';
    h += viewAsk(D, cur);
    h += '<section class="card is-soft"><h2 class="card-title">' + esc(D.qualityTitle) + '</h2><ul class="dots">' + D.quality(I, F, t).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    h += '<p class="small-note">' + esc(driveName(cur) + ' · ' + t.drive.source[I.meta.source] + ' · ' + D.facts(I, F)) + '</p></section>';
    h += '<section class="card is-soft"><h2 class="card-title">' + esc(t.guide.sourcesTitle) + '</h2><div class="src-list">' + D.sources.map(function (s) { return '<a href="' + esc(s[0]) + '" target="_blank" rel="noopener">' + esc(s[1]) + '</a>'; }).join('') + '</div></section>';
    return h + '</main>';
  }

  function viewLoop3(D, cur) {
    var A = state.plan.active, P = drives.proof;
    var st = [
      { done: !!cur, line: cur ? driveName(cur) + ' · ' + T().verdict[cur.report.verdict] : D.loop[0].empty },
      { done: !!A, active: !A && !!cur, line: A ? D.loop[1].active + ': ' + activeTitle() : (cur && cur.report.plan.now[0] ? actionText(cur.report.plan.now[0]).title : D.loop[1].empty) },
      { done: !!P && P.verdict === 'keep', active: !!A && !P, line: P ? D.verdicts[P.verdict] : (A ? D.loop[2].ready : D.loop[2].empty) }
    ];
    var h = '<ol class="loop3" aria-label="' + esc(D.title) + '">';
    st.forEach(function (s, k) {
      h += '<li class="loop-step' + (s.done ? ' is-done' : '') + (s.active ? ' is-active' : '') + '"><span class="loop-n">' + (s.done ? ICON.check : k + 1) + '</span><span><b>' + esc(D.loop[k].title) + '</b><small>' + esc(s.line) + '</small></span></li>';
    });
    return h + '</ol>';
  }

  // ---------------------------------------------------------------------------
  // Car history views: banner (block 0), drive card (block 1), history (block 4)
  // ---------------------------------------------------------------------------
  function carVerdictPill(v) {
    var t = T();
    return '<span class="pill st-' + v + '">' + sIcon(v, 14) + esc(t.status[v] || v) + '</span>';
  }
  function viewCarBanner(C, D, cur) {
    var c = cur.car, h = '';
    if (!c || c.tooShort) return '';
    if (c.flashCause) {
      h += '<div class="banner stop" role="alert"><b>' + esc(C.flashCauseTitle) + '</b> ' + esc(C.flashCauseWhy) +
        '<br><span>' + esc(c.flashCause.map) + ' · ' + esc(c.flashCause.advice) + '</span></div>';
    }
    if (c.isShakedown && !c.shakedown.passed) {
      var done = Math.floor(c.shakedown.calmSec / 60), total = Math.round(c.shakedown.needed / 60);
      h += '<div class="banner warn" role="status"><b>' + esc(C.bannerShakedown(done, total)) + '</b>';
      if (c.hardDrivingWatch) h += '<br><span>' + esc(C.bannerHard) + '</span>';
      h += '</div>';
    } else if (c.isShakedown && c.shakedown.passed) {
      h += '<div class="banner good" role="status">' + esc(C.bannerPassed) + '</div>';
    }
    if (c.unexplained && c.unexplained.state === 'open') {
      var why = c.unexplained.reasons.map(function (r) { return C['why' + r.charAt(0).toUpperCase() + r.slice(1)] || r; });
      h += '<div class="banner warn" role="alert"><b>' + esc(C.bannerUnexplained) + '</b> ' + esc(why.join('; ') + '.') +
        '<div class="act-buttons">' +
        '<button type="button" class="btn" data-act="carAnswer" data-arg="flashed">' + esc(C.answerFlashed) + '</button>' +
        '<button type="button" class="btn-ghost" data-act="carAnswer" data-arg="fuel">' + esc(C.answerFuel) + '</button>' +
        '<button type="button" class="btn-ghost" data-act="carAnswer" data-arg="neither">' + esc(C.answerNeither) + '</button></div>' +
        '<p class="small-note">' + esc(C.modeHint) + '</p></div>';
    } else if (c.unexplainedWatch) {
      h += '<div class="banner warn" role="status">' + esc(C.unexplainedWatch) + '</div>';
    } else if (c.unexplained && c.unexplained.state === 'answered-fuel') {
      h += '<div class="banner warn" role="status">' + esc(C.fuelAdvice) + '</div>';
    }
    return h;
  }
  function viewCarDrive(C, D, cur) {
    var c = cur.car, R = cur.report, I = R.ins, t = T();
    var sum = c && !c.tooShort ? c.summary : null;
    var h = '<section class="card" id="drive-card"><div class="card-row"><h2 class="card-title">' + esc(C.driveTitle) + '</h2>' + carVerdictPill(R.an.verdict) + '</div>';
    var when = sum && isNum(sum.start) ? fmtCarDate(sum.start) : esc(cur.name || '');
    var mins = sum ? sum.duration : I.meta.duration;
    var heat = sum ? (sum.cool ? C.cool : (sum.hot ? C.hot : C.mild)) : (I.heat.cool ? C.cool : (I.heat.hot ? C.hot : C.mild));
    h += '<p class="body-sm">' + esc(when + ' · ' + F.num(mins / 60, 0) + ' min · ' + heat) + (sum && sum.hotRestart ? ' · ' + esc(C.hotRestart) : '') + '</p>';
    var mapLine = c && c.map.recorded ? esc(C.mapRecorded(c.map.name, fmtFlashDate(c.map.since))) : esc(C.mapMissing);
    h += '<p class="body-sm">' + mapLine + ' <button type="button" class="link-btn" data-act="flashNew">' + esc(C.addFlash) + '</button></p>';
    var tgt = sum ? sum.boostTarget : (I.boost ? I.boost.peakTarget : null);
    h += '<p class="small-note">' + esc(isNum(tgt) ? C.boostTarget(F.num(tgt, 1)) : C.boostTargetNone) + '</p>';
    var q = c && c.tooShort ? C.qualityShort : ((I.quality.missing && I.quality.missing.length) ? C.qualityMissing : (((sum && sum.flat.length) ? C.qualityFlat : C.qualityGood)));
    h += '<p class="small-note">' + esc(C.logQuality(q)) + '</p>';
    return h + '</section>';
  }
  function viewCarHistory(C) {
    var s = carState(), rows = K.carTableRows(s), base = K.carBaseline(s);
    var stops = rows.filter(function (r) { return r.verdict === 'stop'; }).length;
    var since = rows.length ? fmtCarDate(rows[0].start) : '';
    var mapName = rows.length ? (rows[rows.length - 1].map || null) : null;
    var h = '<section class="card" id="car-history"><div class="card-row"><h2 class="card-title">' + esc(C.historyTitle) + '</h2></div>';
    if (!rows.length) {
      h += '<p class="body-sm"><b>' + esc(C.historyEmpty) + '</b></p>';
    } else {
      h += '<p class="body-sm"><b>' + esc(C.historyLine(rows.length, since, C.stops(stops), mapName || C.mapMissing)) + '</b></p>';
      h += '<p class="small-note">Baseline ' + esc(F.num(base.value, 2)) + (base.n < 3 ? ' · 0.49 ' : '') + '</p>';
      h += '<div class="table car-table"><div class="row head"><span>' + C.tableHeaders.map(esc).join('</span><span>') + '</span><span></span></div>';
      rows.forEach(function (r) {
        h += '<div class="row"><span class="mono">' + esc(fmtCarDate(r.start)) + '</span>' +
          '<span>' + carVerdictPill(r.verdict) + '</span>' +
          '<span class="mono">' + esc(isNum(r.kcEnd) ? F.num(r.kcEnd, 2) : '-') + '</span>' +
          '<span class="mono">' + esc(isNum(r.trimWorst) ? F.signed(r.trimWorst, 1, ' %') : '-') + '</span>' +
          '<span class="mono">' + esc(isNum(r.iatMoving) ? F.num(r.iatMoving, 0) + ' °C' : '-') + '</span>' +
          '<span class="mono">' + esc(isNum(r.cvtPeak) ? F.num(r.cvtPeak, 0) + ' °C' : '-') + '</span>' +
          '<span>' + esc(r.map || '-') + '</span>' +
          '<span><button type="button" class="link-btn" data-act="carHide" data-arg="' + esc(r.id) + '">' + esc(C.hide) + '</button></span></div>';
      });
      h += '</div><p class="small-note">' + esc(C.hideNote) + '</p>';
    }
    var hidden = (s.hidden || []).filter(function (id) { return s.drives[id]; });
    if (hidden.length) {
      h += '<details><summary>' + esc(C.unhide + ' (' + hidden.length + ')') + '</summary><ul class="dots">';
      hidden.forEach(function (id) {
        h += '<li>' + esc(fmtCarDate(s.drives[id].start)) + ' <button type="button" class="link-btn" data-act="carUnhide" data-arg="' + esc(id) + '">' + esc(C.unhide) + '</button></li>';
      });
      h += '</ul></details>';
    }
    // Flashes
    h += '<h3 class="sub-title">' + esc(C.flashesTitle) + '</h3>';
    if (!s.flashes.length) h += '<p class="small-note">' + esc(C.flashesEmpty) + '</p>';
    else {
      h += '<ul class="dots">';
      s.flashes.forEach(function (f) {
        h += '<li><b>' + esc(f.map) + '</b> · ' + esc(fmtFlashDate(f.time)) + ' · ' + esc(C.changed[f.changed] || f.changed) +
          (f.note ? ' · ' + esc(f.note) : '') +
          ' <button type="button" class="link-btn" data-act="flashEdit" data-arg="' + esc(f.id) + '">' + esc(C.flashEdit) + '</button>' +
          ' <button type="button" class="link-btn" data-act="flashDelete" data-arg="' + esc(f.id) + '">' + esc(C.flashDelete) + '</button></li>';
      });
      h += '</ul>';
    }
    if (!ui.flashForm) h += '<div class="act-buttons"><button type="button" class="btn-ghost" data-act="flashNew">' + esc(C.flashNew) + '</button></div>';
    else h += viewFlashForm(C);
    // Folder, export, import
    h += '<h3 class="sub-title">' + esc(C.loadFolder) + '</h3>';
    h += '<div class="loader"><label class="file-btn">' + ICON.upload + esc(C.loadFolder) +
      '<input type="file" data-folder="1" webkitdirectory multiple aria-label="' + esc(C.loadFolder) + '"></label>';
    if (ui.folderBusy) h += '<span class="muted" role="status">' + esc(T().drive.reading) + '</span>';
    h += '</div><p class="small-note">' + esc(C.loadNote) + '</p><p class="small-note">' + esc(C.serveHint) + '</p>';
    h += '<div class="act-buttons"><button type="button" class="btn-ghost" data-act="carExport">' + esc(C.exportBtn) + '</button>' +
      '<label class="file-btn btn-ghost">' + esc(C.importBtn) + '<input type="file" data-import="1" accept=".json,application/json" aria-label="' + esc(C.importBtn) + '"></label></div>';
    if (!STORE_OK) h += '<p class="small-note">' + esc(C.storeBlocked) + '</p>';
    if (ui.carMsg) h += '<p class="body-sm">' + esc(ui.carMsg) + '</p>';
    if (ui.carErr) h += '<div class="banner stop" role="alert">' + esc(ui.carErr) + '</div>';
    return h + '</section>';
  }
  function viewFlashForm(C) {
    var f = ui.flashForm;
    var h = '<div class="form" id="flash-form"><label>' + esc(C.formTime) + '<input type="datetime-local" data-flash="time" value="' + esc(toLocalInput(f.time)) + '"></label>';
    h += '<label>' + esc(C.formMap) + '<input type="text" data-flash="map" value="' + esc(f.map || '') + '" placeholder="Starter 21"></label>';
    h += '<label>' + esc(C.formChanged) + '<select data-flash="changed">' + ['afm', 'boost', 'fuel', 'other'].map(function (k) {
      return '<option value="' + k + '"' + (f.changed === k ? ' selected' : '') + '>' + esc(C.changed[k]) + '</option>';
    }).join('') + '</select></label>';
    h += '<label>' + esc(C.formNote) + '<input type="text" data-flash="note" value="' + esc(f.note || '') + '"></label>';
    if (ui.flashErr) h += '<p class="small-note" role="alert" style="color:var(--stop-fg)">' + esc(ui.flashErr) + '</p>';
    h += '<div class="act-buttons"><button type="button" class="btn" data-act="flashSave">' + esc(C.formSave) + '</button>' +
      '<button type="button" class="btn-ghost" data-act="flashCancel">' + esc(C.formCancel) + '</button></div></div>';
    return h;
  }

  function loaderHtml(D, which, label) {
    var h = '<div class="loader" data-drop="1"><label class="file-btn">' + ICON.upload + esc(label) + '<input type="file" accept=".csv,.txt,text/csv" data-drive="' + which + '" aria-label="' + esc(label) + '"></label>';
    if (ui.driveBusy === 'file') h += '<span class="muted" role="status">' + esc(D.reading) + '</span>';
    return h + '</div>';
  }
  function examplesHtml(D, which) {
    var h = '<div class="ex-grid">';
    EXAMPLE_IDS.forEach(function (id) {
      var ex = D.examples[id], busy = ui.driveBusy === id;
      h += '<button type="button" class="ex-card" data-act="example" data-arg="' + id + ':' + which + '"' + (busy ? ' aria-busy="true"' : '') + '><b>' + esc(ex.title) + '</b><small>' + esc(busy ? D.exampleLoading : ex.note) + '</small></button>';
    });
    return h + '</div>';
  }
  function viewDriveStart(D) {
    var h = '<section class="card is-key"><h2 class="card-title">' + esc(D.loop[0].title) + '</h2>' + loaderHtml(D, 'current', D.load);
    h += '<h3 class="sub-title">' + esc(D.examplesTitle) + '</h3>' + examplesHtml(D, 'current') + '<p class="small-note">' + esc(D.exampleNote) + '</p></section>';
    return h;
  }

  function viewSafe(D, R) {
    var t = T(), an = R.an;
    var h = '<section class="card safe-card tinted st-' + an.verdict + '"><div class="safe-head">' + sIcon(an.verdict, 26) + '<div><div class="eyebrow">' + esc(D.safeTitle) + '</div><p class="safe-line">' + esc(D.safe[an.verdict]) + '</p></div>';
    h += '<button type="button" class="btn-ghost" data-act="driveReset">' + esc(D.another) + '</button></div><div class="gchips">';
    an.gates.forEach(function (g) {
      h += '<details class="gchip st-' + g.status + '"><summary>' + sIcon(g.status, 16) + '<b>' + esc(t.gates[g.id]) + '</b><span>' + esc(t.status[g.status]) + '</span></summary><div class="gchip-body">';
      g.checks.forEach(function (c) { var tx = checkText(c); h += '<div class="check-line st-' + c.status + '"><span class="dot"></span><span class="lbl">' + esc(tx.label) + '</span><span class="val">' + esc(tx.display) + '</span></div>'; });
      h += '</div></details>';
    });
    return h + '</div></section>';
  }

  function shakeOpen() {
    var cur = drives.current;
    return !!(cur && cur.car && !cur.car.tooShort && cur.car.isShakedown && !cur.car.shakedown.passed);
  }
  function viewNow(D, R) {
    var P = R.plan, A = state.plan.active;
    var h = '<section class="card is-key now-card"><div class="card-row"><h2 class="card-title">' + esc(D.nowTitle) + '</h2></div>';
    if (shakeOpen()) return h + '<p class="lead-sm"><b>' + esc(T().car.finishShakedown) + '</b></p></section>';
    var a = P.now[0];
    if (!a) return h + '<p class="lead-sm"><b>' + esc(D.noActions) + '</b></p></section>';
    var x = actionText(a), isActive = A && A.id === a.id;
    h += '<div class="act-head"><span class="rank">1</span><div><h3 class="act-title">' + esc(x.title) + '</h3>' + badgesHtml(a) + (a.again ? '<p class="small-note">' + esc(D.cameBack) + '</p>' : '') + '</div></div>';
    h += '<p class="body-sm"><b>' + esc(D.why) + '.</b> ' + esc(x.why) + '</p>';
    h += '<div class="act-steps"><b>' + esc(D.steps) + '</b>' + list(x.steps.map(esc)) + '</div>';
    h += '<div class="pairs act-pairs"><b>' + esc(D.proof) + '</b><span>' + esc(x.proof) + '</span>' + (x.undo ? '<b>' + esc(D.undo) + '</b><span>' + esc(x.undo) + '</span>' : '') + '</div>';
    if (x.note) h += '<p class="small-note">' + esc(x.note) + '</p>';
    h += '<div class="act-buttons">';
    if (isActive) h += '<span class="pill st-good">' + ICON.check + esc(D.doing) + '</span><button type="button" class="btn-ghost" data-act="stopAction">' + esc(D.stopDoing) + '</button>';
    else if (!A) h += '<button type="button" class="btn" data-act="startAction" data-arg="' + esc(a.id) + '">' + esc(D.start) + '</button>';
    if (a.id === 'revs' || a.id === 'fuelCheck' || a.id === 'lowBoost') h += '<button type="button" class="link-btn" data-act="toGraph" data-arg="kc">' + esc(T().drive.graphs.kc.title) + '</button>';
    if (a.id === 'richWot') h += '<button type="button" class="link-btn" data-act="toGraph" data-arg="afr">' + esc(T().drive.graphs.afr.title) + '</button>';
    return h + '</div></section>';
  }

  function viewQueue(D, R) {
    var P = R.plan, A = state.plan.active;
    var h = '<section class="card"><h2 class="card-title">' + esc(D.nextTitle) + '</h2>';
    if (shakeOpen()) return h + '<p class="muted" style="margin:0">' + esc(T().car.finishShakedown) + '</p></section>';
    if (!P.next.length) h += '<p class="muted" style="margin:0">-</p>';
    P.next.forEach(function (a, k) {
      var x = actionText(a), isActive = A && A.id === a.id;
      h += '<details class="act-row"><summary><span class="rank">' + (k + 2) + '</span><span class="act-sum"><b>' + esc(x.title) + '</b>' + badgesHtml(a) + '</span>' + (isActive ? '<span class="pill st-good">' + esc(D.doing) + '</span>' : '') + '</summary>';
      h += '<div class="act-body"><p class="body-sm"><b>' + esc(D.why) + '.</b> ' + esc(x.why) + '</p>' + list(x.steps.map(esc)) + '<div class="pairs act-pairs"><b>' + esc(D.proof) + '</b><span>' + esc(x.proof) + '</span>' + (x.undo ? '<b>' + esc(D.undo) + '</b><span>' + esc(x.undo) + '</span>' : '') + '</div>';
      if (!A) h += '<div class="act-buttons"><button type="button" class="btn-ghost" data-act="startAction" data-arg="' + esc(a.id) + '">' + esc(D.start) + '</button></div>';
      h += '</div></details>';
    });
    if (P.later.length) {
      h += '<h3 class="sub-title">' + esc(D.laterTitle) + '</h3>';
      P.later.forEach(function (a) {
        var x = actionText(a);
        h += '<div class="lock-row"><span class="lock">' + ICON.lock + '</span><div><b>' + esc(x.title) + '</b><small>' + esc(D.unlocksWhen) + ':</small><ul class="dots">' + (a.blockedBy || []).map(function (b) { var fn = D.blockers[b]; return '<li>' + esc(fn ? fn(R.ins, F) : b) + '</li>'; }).join('') + '</ul></div></div>';
      });
    }
    h += '<details class="rank-rules"><summary>' + esc(D.rankWhy) + '</summary><ol class="steps">' + D.rankRules.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol><a href="docs/PRODUCT-REVIEW.md" target="_blank" rel="noopener" class="small-note">' + esc(D.reviewLink) + '</a></details>';
    if (P.fine.length) {
      h += '<h3 class="sub-title">' + esc(D.fineTitle) + '</h3><div class="fine-list">';
      P.fine.forEach(function (f) { var fn = D.fine[f.id]; h += '<div class="fine"><span class="tick">' + ICON.check + '</span><span><b>' + esc(D.actions[f.id].title) + '.</b> ' + esc(fn ? fn(R.ins, F) : '') + '</span></div>'; });
      h += '</div>';
    }
    return h + '</section>';
  }

  function viewProve(D) {
    var A = state.plan.active, P = drives.proof, nx = drives.next;
    var h = '<section class="card is-key prove-card" id="prove"><div class="card-row"><h2 class="card-title">' + esc(D.proveTitle) + '</h2><span class="muted">' + esc(activeTitle() + ' · ' + D.startedOn(A.startedAt)) + '</span></div>';
    if (!P) {
      h += '<p class="body-sm">' + esc(D.loop[2].ready) + '</p>' + loaderHtml(D, 'next', D.loadNext);
      h += '<h3 class="sub-title">' + esc(D.asNext) + '</h3>' + examplesHtml(D, 'next');
      return h + '</section>';
    }
    if (A && A.beforeId && nx && nx.car && !nx.car.tooShort) {
      var spans = K.carProofSpansFlash(state.car, A.beforeId, nx.car.identity);
      if (spans.spans) h += '<div class="banner warn" role="status">' + esc(T().car.proofBlocked) + '</div>';
    }
    var vs = { keep: 'good', partial: 'watch', retry: 'watch', inconclusive: 'nodata', undo: 'stop', stop: 'stop' }[P.verdict];
    h += '<div class="prove-verdict tinted st-' + vs + '">' + sIcon(vs, 22) + '<div><b>' + esc(D.verdicts[P.verdict]) + '</b><small>' + esc(D.verdictHelp[P.verdict]) + '</small></div></div>';
    if (P.matched.reasons.length) h += '<ul class="dots">' + P.matched.reasons.map(function (r) { return '<li>' + esc(D.reasons[r] || r) + '</li>'; }).join('') + '</ul>';
    if (P.newStops.length) h += '<ul class="dots">' + P.newStops.map(function (id) { var c = findCheck(nx.report.an, id); return '<li>' + esc(c ? checkText(c).label + ': ' + checkText(c).display : id) + '</li>'; }).join('') + '</ul>';
    if (P.metric) {
      var name = D.metricNames[P.metric.name] || P.metric.name, fmtv = function (v) { return v == null ? '-' : (typeof v === 'number' ? F.num(v, Math.abs(v) < 10 ? 2 : 1) : String(v)); };
      h += '<div class="table ba"><div class="row head"><span></span><span>' + esc(D.before) + '</span><span>' + esc(D.after) + '</span></div><div class="row"><span>' + esc(name) + '</span><span class="mono">' + esc(fmtv(P.metric.before)) + '</span><span class="mono">' + esc(fmtv(P.metric.after)) + '</span></div>';
      if (P.metric.kcRiseBefore != null) h += '<div class="row"><span>' + esc(D.metricNames.kcRise) + '</span><span class="mono">' + esc(fmtv(P.metric.kcRiseBefore)) + '</span><span class="mono">' + esc(fmtv(P.metric.kcRiseAfter)) + '</span></div>';
      h += '</div>';
    }
    h += '<p class="small-note">' + esc((A.beforeName || '') + ' → ' + driveName(nx)) + '</p><div class="act-buttons">';
    if (P.verdict === 'keep' || P.verdict === 'partial') h += '<button type="button" class="btn" data-act="proofDone" data-arg="' + P.verdict + '">' + esc(D.keepNext) + '</button>';
    if (P.verdict === 'undo' || P.verdict === 'stop') h += '<button type="button" class="btn" data-act="proofDone" data-arg="undo">' + esc(D.undoIt) + '</button>';
    h += '<button type="button" class="btn-ghost" data-act="proofAgain">' + esc(D.tryAgain) + '</button>';
    return h + '</div></section>';
  }

  function graphCard(id, svg, D) {
    var G = D.graphs[id], open = !!ui.explain[id];
    var h = '<div class="graph" id="graph-' + id + '"><div class="card-row"><h3 class="sub-title" style="margin:0">' + esc(G.title) + '</h3><span class="graph-btns"><button type="button" class="link-btn" data-act="explain" data-arg="' + id + '" aria-expanded="' + open + '">' + esc(D.explain) + '</button> <button type="button" class="link-btn" data-act="askGraph" data-arg="' + id + '">' + esc(D.askThis) + '</button></span></div>';
    h += svg ? '<div class="chart">' + svg + '</div>' : '<p class="muted">-</p>';
    h += '<div class="legend">' + G.legend.map(function (l, k) { return '<span><i class="lg lg-' + id + '-' + k + '"></i>' + esc(l) + '</span>'; }).join('') + '</div>';
    if (open) h += '<p class="body-sm explain">' + esc(G.explain(drives.current.report.ins, F)) + '</p>';
    return h + '</div>';
  }
  function tick(x1, y1, x2, y2) { return '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + y1 + '" y2="' + y2 + '" style="stroke:var(--grid);stroke-width:1"/>'; }
  function kcSvg(I) {
    var f = K.view.kcTimeline(I);
    if (!f.hasData) return '';
    var s = '<svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(T().drive.graphs.kc.title) + '">';
    f.lug.forEach(function (b) { s += '<rect x="' + b.x + '" y="' + f.plotT + '" width="' + b.w + '" height="' + (f.plotB - f.plotT) + '" style="fill:var(--lug);opacity:' + b.o + '"/>'; });
    f.yTicks.forEach(function (tk) { s += tick(f.plotL, tk.y, f.plotR, tk.y) + '<text x="' + (f.plotL - 6) + '" y="' + (tk.y + 4) + '" text-anchor="end">' + esc(tk.label) + '</text>'; });
    f.iTicks.forEach(function (tk) { s += '<text x="' + (f.plotR + 6) + '" y="' + (tk.y + 4) + '" style="fill:var(--iat)">' + esc(tk.label) + '</text>'; });
    f.xTicks.forEach(function (tk, i) { s += '<text x="' + tk.x + '" y="' + (f.plotB + 16) + '" text-anchor="' + (i === 0 ? 'start' : 'middle') + '">' + esc(tk.label) + '</text>'; });
    s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + f.limitY + '" y2="' + f.limitY + '" style="stroke:var(--stop-ic);stroke-width:1.5;stroke-dasharray:5 4"/>';
    s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + f.ronY + '" y2="' + f.ronY + '" style="stroke:var(--axis);stroke-width:1;stroke-dasharray:2 4"/>';
    s += '<path d="' + f.iat + '" style="fill:none;stroke:var(--iat);stroke-width:1.4"/>';
    s += '<path d="' + f.line + '" style="fill:none;stroke:var(--meas);stroke-width:2.4;stroke-linejoin:round"/>';
    f.marks.forEach(function (m) {
      var tip = (m.kind === 'rise' ? '▲ ' : '▼ ') + m.from.toFixed(2) + ' → ' + m.to.toFixed(2) + ' · ' + Math.round(m.t0 / 60) + '-' + Math.round(m.t1 / 60) + ' min · ' + m.rpm + ' rpm · ' + m.iat + ' °C' + (m.cause === 'lugging' ? ' · lugging' : '');
      s += '<circle cx="' + m.x + '" cy="' + m.y + '" r="5" style="fill:var(--sheet);stroke:' + (m.kind === 'rise' ? 'var(--stop-ic)' : 'var(--good-ic)') + ';stroke-width:2.2"/><circle cx="' + m.x + '" cy="' + m.y + '" r="11" style="fill:transparent" data-tip="' + esc(tip) + '"/>';
    });
    return s + '</svg>';
  }
  function timingSvg(I) {
    var f = K.view.timingMap(I);
    if (!f.hasData) return '';
    var s = '<svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(T().drive.graphs.timing.title) + '">';
    f.cells.forEach(function (c) {
      s += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" rx="2" style="fill:' + c.fill + '" data-tip="' + esc(c.tip) + '"/>';
      s += '<text x="' + (c.x + c.w / 2) + '" y="' + (c.y + c.h / 2 + 4) + '" text-anchor="middle" style="fill:' + c.ink + ';font-size:10.5px;pointer-events:none">' + esc(c.text) + '</text>';
      if (c.krR) s += '<circle cx="' + (c.x + c.w - c.krR - 2) + '" cy="' + (c.y + c.krR + 2) + '" r="' + c.krR + '" style="fill:var(--cmd);opacity:0.85;pointer-events:none"/>';
    });
    if (f.lugBox) s += '<rect x="' + f.lugBox.x + '" y="' + f.lugBox.y + '" width="' + f.lugBox.w + '" height="' + f.lugBox.h + '" style="fill:none;stroke:var(--lug-line);stroke-width:2.5;stroke-dasharray:6 3;pointer-events:none"/>';
    f.xTicks.forEach(function (tk) { s += '<text x="' + tk.x + '" y="' + (f.plotB + 15) + '" text-anchor="middle">' + esc(tk.label) + '</text>'; });
    f.yTicks.forEach(function (tk) { s += '<text x="' + (f.plotL - 6) + '" y="' + (tk.y + 4) + '" text-anchor="end">' + esc(tk.label) + '</text>'; });
    s += '<text class="axis-title" x="' + ((f.plotL + f.plotR) / 2) + '" y="' + (f.h - 4) + '" text-anchor="middle">rpm</text>';
    s += '<text class="axis-title" x="12" y="' + (f.plotB / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + (f.plotB / 2) + ')">MAP (psi)</text>';
    return s + '</svg>';
  }
  function afrSvg(I) {
    var f = K.view.afrLoad(I);
    if (!f.hasData) return '';
    var s = '<svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(T().drive.graphs.afr.title) + '">';
    f.yTicks.forEach(function (tk) { s += tick(f.plotL, tk.y, f.plotR, tk.y) + '<text x="' + (f.plotL - 6) + '" y="' + (tk.y + 4) + '" text-anchor="end">' + esc(tk.label) + '</text>'; });
    f.xTicks.forEach(function (tk) { s += '<text x="' + tk.x + '" y="' + (f.plotB + 16) + '" text-anchor="middle">' + esc(tk.label) + '</text>'; });
    s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + f.leanY + '" y2="' + f.leanY + '" style="stroke:var(--stop-ic);stroke-width:1.5"/>';
    s += '<line x1="' + f.plotL + '" x2="' + f.plotR + '" y1="' + f.mapY + '" y2="' + f.mapY + '" style="stroke:var(--cmd);stroke-width:2;stroke-dasharray:6 4"/>';
    f.bars.forEach(function (b) {
      s += '<rect x="' + b.x + '" y="' + b.yLo + '" width="' + b.w + '" height="' + Math.max(2, b.yHi - b.yLo) + '" rx="4" style="fill:var(--band);stroke:var(--band-line)" data-tip="' + esc(b.tip) + '"/>';
      s += '<circle cx="' + b.cx + '" cy="' + b.y + '" r="5.5" style="fill:var(--meas);stroke:var(--sheet);stroke-width:1.5;pointer-events:none"/>';
      s += '<text x="' + (b.cx + 10) + '" y="' + (b.y + 4) + '" style="fill:var(--ink);font-weight:600">' + esc(b.afr.toFixed(1)) + '</text>';
    });
    return s + '</svg>';
  }
  function accelSvg(I) {
    var f = K.view.accelBars(I);
    if (!f.hasData) return '';
    var s = '<svg viewBox="' + f.viewBox + '" role="img" aria-label="' + esc(T().drive.graphs.accel.title) + '">';
    f.xTicks.forEach(function (tk) { s += tick(tk.x, 4, tk.x, f.plotB) + '<text x="' + tk.x + '" y="' + (f.plotB + 16) + '" text-anchor="middle">' + esc(tk.label) + '</text>'; });
    f.bars.forEach(function (b) {
      s += '<text x="' + (f.plotL - 8) + '" y="' + (b.y + b.h / 2 + 4) + '" text-anchor="end" style="fill:var(--ink-2)">' + esc(b.label) + '</text>';
      s += '<rect x="' + b.x + '" y="' + b.y + '" width="' + Math.max(2, b.w) + '" height="' + b.h + '" rx="4" style="fill:' + (b.full ? 'var(--meas)' : 'var(--band-line)') + '" data-tip="' + esc(b.tip) + '"/>';
      s += '<text x="' + (b.x + b.w + 6) + '" y="' + (b.y + b.h / 2 + 4) + '" style="fill:var(--ink);font-weight:600">' + esc(b.value) + '</text>';
    });
    return s + '</svg>';
  }

  function viewAsk(D, cur) {
    var A = D.ask, r = ai.result;
    var h = '<section class="card ask-card" id="ask"><div class="card-row"><h2 class="card-title">' + esc(A.title) + '</h2><span class="badge' + (ai.key && state.ai.model ? ' is-strong' : '') + '">' + esc(ai.key && state.ai.model ? A.ai : A.builtIn) + '</span></div>';
    h += '<p class="body-sm">' + esc(A.sub) + '</p><div class="ask-sugg">';
    A.suggestions.forEach(function (q) { h += '<button type="button" class="chip-btn" data-act="ask" data-arg="' + esc(q) + '">' + esc(q) + '</button>'; });
    h += '</div><form class="ask-form" data-askform="1"><input type="text" id="ask-q" value="' + esc(ai.q) + '" placeholder="' + esc(A.placeholder) + '" aria-label="' + esc(A.placeholder) + '"><button type="submit" class="btn"' + (ai.busy ? ' disabled' : '') + '>' + esc(A.send) + '</button></form>';
    if (ai.busy) h += '<p class="muted" role="status">' + esc(A.working) + '</p>';
    if (r) {
      var badge = r.mode === 'ai' ? (r.repaired ? A.repaired : A.verified) : (r.mode === 'builtin' ? A.builtIn : ({ unverified: A.unverified, refusal: A.refused }[r.reason] || A.failed));
      h += '<div class="answer ' + (r.mode === 'ai' ? 'is-ai' : '') + '" role="status"><div class="answer-head"><span class="pill ' + (r.mode === 'ai' ? 'st-good' : (r.mode === 'builtin' ? 'st-nodata' : 'st-watch')) + '">' + esc(badge) + '</span></div>';
      h += '<p>' + esc(r.answer).replace(/\n/g, '<br>') + '</p>';
      if (r.trace && r.trace.length) {
        h += '<details class="trace"><summary>' + esc(A.looked) + ' (' + r.trace.filter(function (s) { return s.kind === 'tool'; }).length + ')</summary><ul class="dots">';
        r.trace.forEach(function (s) { h += '<li class="mono">' + esc(s.kind === 'tool' ? s.name + ' ' + JSON.stringify(s.input) + (s.error ? ' ✗ ' + s.error : '') : (s.ok ? '✓ check' : '✗ ' + s.issues.join(' | '))) + '</li>'; });
        h += '</ul></details>';
      }
      if (r.issues && r.issues.length) h += '<details class="trace"><summary>' + esc(A.issues) + '</summary><ul class="dots">' + r.issues.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>';
      if (r.error) h += '<p class="small-note">' + esc(r.error) + '</p>';
      h += '</div>';
    }
    h += '<details class="ai-settings"' + (ui.aiOpen ? ' open' : '') + ' id="ai-settings"><summary>' + esc(A.settings) + '</summary><div class="form">';
    h += '<label>' + esc(A.key) + '<input type="password" id="ai-key" data-aikey="1" autocomplete="off" value="' + esc(ai.key) + '"></label>';
    h += '<label class="check-item"><input type="checkbox" data-bind="ai.remember"' + (state.ai.remember ? ' checked' : '') + '> ' + esc(A.remember) + '</label>';
    h += '<label>' + esc(A.model) + '<input type="text" id="ai-model" data-bind="ai.model" list="ai-models" value="' + esc(state.ai.model) + '" placeholder="' + esc(A.modelHint) + '"></label><datalist id="ai-models">' + ai.models.map(function (m) { return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>'; }).join('') + '</datalist>';
    h += '<div class="act-buttons"><button type="button" class="btn-ghost" data-act="loadModels">' + esc(A.loadModels) + '</button>' + (ai.models.length ? '<span class="muted">' + esc(A.modelsLoaded(ai.models.length)) + '</span>' : '') + '</div>';
    if (ai.error) h += '<p class="small-note" role="alert">' + esc(ai.error) + '</p>';
    h += '<p class="small-note">' + esc(A.keyNote) + ' ' + esc(A.privacy) + '</p>' + (ai.key ? '' : '<p class="small-note">' + esc(A.noKey) + '</p>') + '</div></details>';
    return h + '</section>';
  }

  // ---------------------------------------------------------------------------
  // Car history (engine/kta-car.js): every checked drive is remembered in the
  // browser. Pure math in the engine; here only storage, files and screens.
  // ---------------------------------------------------------------------------
  var STORE_OK = (function () { try { localStorage.setItem(STORE + '-t', '1'); localStorage.removeItem(STORE + '-t'); return true; } catch (e) { return false; } })();
  function carState() { if (!state.car) state.car = K.carEmpty(); return state.car; }
  function refreshCarRec(rec) {
    if (!rec || !rec.car || rec.car.tooShort) return;
    var fresh = K.carReport(state.car, rec.car.identity);
    if (fresh) rec.car = fresh;
  }
  function fmtCarDate(ms) {
    if (!isNum(ms)) return '-';
    try {
      var parts = new Intl.DateTimeFormat(state.lang === 'vi' ? 'vi' : 'en-GB', {
        weekday: 'short', day: 'numeric', month: state.lang === 'vi' ? 'numeric' : 'short',
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh'
      }).formatToParts(ms);
      var p = {};
      parts.forEach(function (x) { p[x.type] = x.value; });
      var hm = (p.hour || '00') + ':' + (p.minute || '00');
      if (state.lang === 'vi') return (p.weekday || '') + ' ' + (p.day || '') + '/' + (p.month || '') + ' · ' + hm;
      return (p.weekday || '') + ' ' + (p.day || '') + ' ' + (p.month || '') + ' · ' + hm;
    } catch (e) { return new Date(ms).toLocaleString(); }
  }
  function fmtFlashDate(ms) { return fmtCarDate(ms); }
  function toLocalInput(ms) {
    if (!isNum(ms)) return '';
    var d = new Date(ms), pad = function (v) { return String(v).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function fromLocalInput(str) {
    var t = new Date(String(str || '').replace('T', ' ')).getTime();
    return isNum(t) ? t : NaN;
  }

  // ---- loading drives
  function ingestDrive(text, name, example, which) {
    try {
      var parsed = K.parseCSV(text);
      var log = K.buildLog(parsed, K.detectChannels(parsed.headers, parsed.columns));
      var out = K.carIngest(carState(), log, { fileName: name || '' }, { history: state.plan.history });
      state.car = out.state; save();
      var rec = { name: name || '', example: example || '', log: log, report: out.report.drive, car: out.report };
      if (which === 'next' && state.plan.active) {
        drives.next = rec;
        drives.proof = K.proveAction(state.plan.active.id, state.plan.active.before, rec.report);
      } else { drives.current = rec; drives.next = null; drives.proof = null; }
      ai.result = null; ai.q = '';
      ui.driveErr = '';
    } catch (e) {
      ui.driveErr = (name ? name + ': ' : '') + ((e && e.message) || e);
    }
    ui.driveBusy = '';
    render();
    if (which === 'next') { var p = document.getElementById('prove'); if (p) p.scrollIntoView({ block: 'start' }); }
  }
  function loadDriveFile(file, which) {
    if (!file) return;
    var reader = new FileReader();
    ui.driveBusy = 'file'; ui.driveErr = ''; render();
    // let the busy state paint before a big log (7 MB, 50,000 rows) is parsed
    reader.onload = function () { setTimeout(function () { ingestDrive(String(reader.result), file.name, '', which); }, 30); };
    reader.onerror = function () { ui.driveBusy = ''; ui.driveErr = T().errors.read(file.name); render(); };
    reader.readAsText(file);
  }
  function silentIngest(text, name) {
    var parsed = K.parseCSV(text);
    var log = K.buildLog(parsed, K.detectChannels(parsed.headers, parsed.columns));
    var out = K.carIngest(carState(), log, { fileName: name }, { history: state.plan.history });
    state.car = out.state; save();
    return out.report;
  }
  function reingestCurrent() {
    var cur = drives.current;
    if (!cur || !cur.log || !cur.car || cur.car.tooShort || !cur.car.summary) return;
    var out = K.carIngest(state.car, cur.log, { fileName: cur.car.summary.fileName }, { history: state.plan.history });
    state.car = out.state; save();
    cur.report = out.report.drive;
    cur.car = out.report;
  }
  function loadFolder(list) {
    var files = Array.prototype.filter.call(list || [], function (f) { return /\.csv$/i.test(f.name); })
      .sort(function (a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });
    if (!files.length) { ui.carErr = T().drive.exampleError; render(); return; }
    ui.folderBusy = true; ui.carMsg = ''; ui.carErr = ''; render();
    var i = 0, n = 0;
    (function next() {
      if (i >= files.length) {
        ui.folderBusy = false;
        ui.carMsg = T().car.loaded(n);
        refreshCarRec(drives.current); refreshCarRec(drives.next);
        save(); render();
        return;
      }
      var file = files[i], reader = new FileReader();
      reader.onload = function () { try { silentIngest(String(reader.result), file.name); n++; } catch (e) { /* one bad log never stops the folder */ } i++; setTimeout(next, 0); };
      reader.onerror = function () { i++; setTimeout(next, 0); };
      reader.readAsText(file);
    })();
  }
  function importHistory(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var out = K.carImport(carState(), JSON.parse(String(reader.result)));
        state.car = out.state; save();
        if (out.error === 'future-version') { ui.carErr = T().car.importFuture(out.futureVersion); ui.carMsg = ''; }
        else if (out.error) { ui.carErr = T().car.importError; ui.carMsg = ''; }
        else { ui.carMsg = T().car.imported(out.added.drives, out.added.flashes); ui.carErr = ''; }
        refreshCarRec(drives.current); refreshCarRec(drives.next);
      } catch (e) { ui.carErr = T().car.importError; }
      render();
    };
    reader.onerror = function () { ui.carErr = T().errors.read(file.name); render(); };
    reader.readAsText(file);
  }
  function decodeExample(ex) {
    if (typeof DecompressionStream !== 'function' || typeof Response !== 'function') return Promise.reject(new Error('no gzip'));
    var bin = atob(ex.gz), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }
  function loadExample(id, which) {
    if (EXAMPLE_IDS.indexOf(id) < 0) return;
    function go() {
      decodeExample(window.KTA_EXAMPLES[id]).then(function (text) { ingestDrive(text, window.KTA_EXAMPLES[id].name, id, which); },
        function () { ui.driveBusy = ''; ui.driveErr = T().drive.exampleError; render(); });
    }
    ui.driveBusy = id; ui.driveErr = ''; render();
    if (window.KTA_EXAMPLES && window.KTA_EXAMPLES[id]) { go(); return; }
    var s = document.createElement('script');
    s.src = 'data/example-' + id + '.js';
    s.onload = function () { if (window.KTA_EXAMPLES && window.KTA_EXAMPLES[id]) go(); else s.onerror(); };
    s.onerror = function () { ui.driveBusy = ''; ui.driveErr = T().drive.exampleError; render(); };
    document.head.appendChild(s);
  }

  // ---- asking
  function askCtx() { var cur = drives.current; return { question: '', report: cur.report, log: cur.log, T: T().drive, checkText: checkText, F: F, lang: state.lang }; }
  function runAsk(q) {
    q = String(q || '').trim();
    if (!q || !drives.current || ai.busy) return;
    var o = askCtx(), offline = K.ask.offline(q, K.ask.context(o));
    ai.q = q; ai.result = null;
    if (!ai.key || !state.ai.model) { ai.result = { mode: 'builtin', answer: offline.answer }; render(); return; }
    ai.busy = true; render();
    o.question = q; o.apiKey = ai.key; o.model = state.ai.model; o.caps = ai.caps;
    K.ask.run(o).then(function (res) {
      ai.busy = false;
      if (res.ok) ai.result = { mode: 'ai', answer: res.answer, repaired: res.repaired, trace: res.trace };
      else ai.result = { mode: 'fallback', reason: res.reason, answer: offline.answer, issues: res.issues, error: res.error ? res.error + (res.status ? ' (' + res.status + ')' : '') : (res.category ? res.category : ''), trace: res.trace };
      render();
    });
  }
  function saveKey() {
    try { if (state.ai.remember && ai.key) localStorage.setItem(STORE + '-key', ai.key); else localStorage.removeItem(STORE + '-key'); } catch (e) { /* storage blocked */ }
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
    var t = T(), key = state.hint || (state.page === 'drive' ? 'lugging' : (state.page === 'map' ? 'afm' : (state.page === 'guide' ? 'loop' : HINT_DEFAULT[state.step]))), hint = t.hints[key];
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
      if (arg !== 'map' && arg !== 'guide' && arg !== 'drive') return;
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
    example: function (arg) { var p = String(arg).split(':'); loadExample(p[0], p[1] === 'next' ? 'next' : 'current'); },
    driveReset: function () { drives.current = null; drives.next = null; drives.proof = null; ai.result = null; ui.driveErr = ''; render({ top: true }); },
    carAnswer: function (arg) {
      var cur = drives.current, C = T().car;
      if (!cur || !cur.car || cur.car.tooShort || !cur.car.unexplained || cur.car.unexplained.state !== 'open') return;
      if (['flashed', 'fuel', 'neither'].indexOf(arg) < 0) return;
      state.car = K.carAnswer(state.car, cur.car.identity, arg);
      if (arg === 'flashed') {
        ui.flashForm = { id: null, timeStr: toLocalInput(cur.car.summary.start - 60000), map: '', changed: 'other', note: '' };
        ui.flashErr = '';
      }
      ui.carMsg = ''; ui.carErr = '';
      save(); refreshCarRec(cur); render();
      if (arg === 'flashed') { var f = document.getElementById('flash-form'); if (f) f.scrollIntoView({ block: 'start' }); }
    },
    carHide: function (id) { state.car = K.carHide(state.car, id); save(); refreshCarRec(drives.current); refreshCarRec(drives.next); render(); },
    carUnhide: function (id) { state.car = K.carUnhide(state.car, id); save(); refreshCarRec(drives.current); refreshCarRec(drives.next); render(); },
    carExport: function () { download('car-history-' + today() + '.json', JSON.stringify(K.carExport(carState()), null, 2), 'application/json;charset=utf-8'); },
    flashNew: function () {
      ui.flashForm = { id: null, timeStr: toLocalInput(Date.now()), map: '', changed: 'other', note: '' };
      ui.flashErr = ''; render();
      var f = document.getElementById('flash-form'); if (f) f.scrollIntoView({ block: 'start' });
    },
    flashEdit: function (id) {
      var f = carState().flashes.filter(function (x) { return x.id === id; })[0];
      if (!f) return;
      ui.flashForm = { id: f.id, timeStr: toLocalInput(f.time), map: f.map, changed: f.changed, note: f.note || '' };
      ui.flashErr = ''; render();
      var el = document.getElementById('flash-form'); if (el) el.scrollIntoView({ block: 'start' });
    },
    flashDelete: function (id) {
      var C = T().car, s = carState();
      var f = s.flashes.filter(function (x) { return x.id === id; })[0];
      if (!f) return;
      try {
        if (!window.confirm(C.flashDeleteAsk(f.map))) return;
      } catch (e) { return; }
      state.car = K.carDeleteFlash(s, id);
      ui.carMsg = ''; ui.carErr = '';
      save(); refreshCarRec(drives.current); refreshCarRec(drives.next); render();
    },
    flashCancel: function () { ui.flashForm = null; ui.flashErr = ''; render(); },
    flashSave: function () {
      var C = T().car, f = ui.flashForm;
      if (!f) return;
      var ms = fromLocalInput(f.timeStr);
      if (!isNum(ms)) { ui.flashErr = C.formNeedTime; render(); return; }
      if (!f.map || !String(f.map).trim()) { ui.flashErr = C.formNeedMap; render(); return; }
      try {
        if (f.id) state.car = K.carEditFlash(state.car, f.id, { time: ms, map: String(f.map).trim(), changed: f.changed, note: f.note || '' });
        else state.car = K.carRecordFlash(state.car, { time: ms, map: String(f.map).trim(), changed: f.changed, note: f.note || '' }).state;
      } catch (e) { ui.flashErr = String((e && e.message) || e); render(); return; }
      ui.flashForm = null; ui.flashErr = ''; ui.carMsg = ''; ui.carErr = '';
      reingestCurrent();
      save(); render();
    },
    startAction: function (id) {
      var cur = drives.current;
      if (!cur) return;
      var a = cur.report.plan.all.filter(function (x) { return x.id === id; })[0];
      if (!a) return;
      var c = a.tier === 'safety' ? findCheck(cur.report.an, a.check) : null;
      state.plan = { active: { id: id, label: c ? checkText(c).label : '', startedAt: today(), beforeName: driveName(cur), beforeId: cur.car && !cur.car.tooShort ? cur.car.identity : null, before: K.proofSnapshot(cur.report) }, history: state.plan.history || [] };
      drives.next = null; drives.proof = null;
      save(); render();
      var p = document.getElementById('prove');
      if (p) p.scrollIntoView({ block: 'start' });
    },
    stopAction: function () { state.plan = { active: null, history: state.plan.history || [] }; drives.next = null; drives.proof = null; save(); render(); },
    proofDone: function (verdict) {
      var A = state.plan.active;
      if (!A || !drives.next || !drives.proof) return;
      var hist = (state.plan.history || []).concat([{ id: A.id, verdict: verdict === 'undo' ? 'undo' : drives.proof.verdict, date: today() }]).slice(-30);
      state.plan = { active: null, history: hist };
      drives.current = drives.next; drives.next = null; drives.proof = null;
      drives.current.report.plan = K.planActions(drives.current.report, hist);
      ai.result = null;
      save(); render({ top: true });
    },
    proofAgain: function () { drives.next = null; drives.proof = null; render(); },
    explain: function (id) { ui.explain[id] = !ui.explain[id]; render(); },
    toGraph: function (id) {
      ui.explain[id] = true; render();
      var g = document.getElementById('graph-' + id);
      if (g) g.scrollIntoView({ block: 'start' });
    },
    askGraph: function (id) {
      var q = T().drive.ask.graphQ[id];
      runAsk(q);
      var a = document.getElementById('ask');
      if (a) a.scrollIntoView({ block: 'start' });
    },
    ask: function (q) { runAsk(q); },
    loadModels: function () {
      if (!ai.key) { ai.error = T().drive.ask.noKey; render(); return; }
      ai.error = ''; ui.aiOpen = true;
      K.ask.listModels({ apiKey: ai.key }).then(function (list) {
        ai.models = list;
        if (list.length && !state.ai.model) { setPath('ai.model', list[0].id); save(); }
        render();
      }, function (e) { ai.error = String((e && e.message) || e); render(); });
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
    if (el.hasAttribute('data-drive')) { loadDriveFile(el.files && el.files[0], el.getAttribute('data-drive') === 'next' ? 'next' : 'current'); el.value = ''; return; }
    if (el.hasAttribute('data-folder')) { loadFolder(el.files); el.value = ''; return; }
    if (el.hasAttribute('data-import')) { importHistory(el.files && el.files[0]); el.value = ''; return; }
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
      if (path === 'ai.remember') saveKey();
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
    if (el.hasAttribute && el.hasAttribute('data-aikey')) { ai.key = el.value.trim(); saveKey(); return; }
    if (el.hasAttribute && el.hasAttribute('data-flash')) { if (ui.flashForm) ui.flashForm[el.getAttribute('data-flash')] = el.value; return; }
    if (!el.hasAttribute || !el.hasAttribute('data-input')) return;
    setPath(el.getAttribute('data-input'), el.value);
    save();
    var packet = document.getElementById('packet');
    if (packet) packet.value = buildPacket();
  });

  document.addEventListener('submit', function (e) {
    if (!e.target || !e.target.hasAttribute('data-askform')) return;
    e.preventDefault();
    var q = document.getElementById('ask-q');
    runAsk(q ? q.value : '');
  });

  // keep the column-mapping panel open across re-renders
  document.addEventListener('toggle', function (e) {
    if (e.target && e.target.id === 'columns') ui.columnsOpen = e.target.open;
    if (e.target && e.target.id === 'ai-settings') ui.aiOpen = e.target.open;
    if (e.target && e.target.classList && e.target.classList.contains('topic')) ui.topics[e.target.id] = e.target.open;
  }, true);

  // drag and drop a CSV anywhere on a step that takes a log
  function dropTarget() { return state.page === 'drive' ? 'drive' : (!state.page && slotFor(state.step) ? 'step' : ''); }
  document.addEventListener('dragover', function (e) {
    if (!dropTarget()) return;
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
    var tgt = dropTarget();
    if (!tgt) return;
    e.preventDefault();
    var zone = document.querySelector('[data-drop]');
    if (zone) zone.classList.remove('is-drag');
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    if (tgt === 'drive') loadDriveFile(file, state.plan.active ? 'next' : 'current');
    else loadFile(file);
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
    // open/closed panels: read them now; the 'toggle' event arrives asynchronously and can be late
    if (q('#columns')) ui.columnsOpen = q('#columns').open;
    if (q('#ai-settings')) ui.aiOpen = q('#ai-settings').open;
    Array.prototype.forEach.call(root.querySelectorAll('details.topic'), function (d) { ui.topics[d.id] = d.open; });
    applyTheme();
    hideTip();
    root.classList.toggle('page-wide', state.page === 'map' || state.page === 'guide' || state.page === 'drive');
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
  var pm = /#(map|guide|drive)(?:\/([^?#]+))?/.exec(location.hash || '');
  // first visit: the drive check is home
  if (!m && !pm && !state.seenDrive) state.page = 'drive';
  state.seenDrive = true;
  save();
  if (pm) {
    state.page = pm[1];
    var want = pm[2] ? decodeURIComponent(pm[2]) : '';
    if (want && window.KTA_MAP && window.KTA_MAP.tables[want]) state.mapTable = want;
  }
  var dq = /[?&]drive=([a-z0-9-]+)/.exec(location.search);
  if (dq) { state.page = 'drive'; setTimeout(function () { loadExample(dq[1], 'current'); }, 0); }
  if (/[?&]demo=1\b/.test(location.search)) {
    ['baseline'].forEach(function (slot) { var rec = { name: '', sample: 'before', slot: slot, parsed: K.parseCSV(K.sampleCsv('before')) }; rec.mapping = K.detectChannels(rec.parsed.headers, rec.parsed.columns); analyzeRec(rec); slots[slot] = rec; state.lastSlot = slot; });
  }
  window.addEventListener('hashchange', function () {
    var h = location.hash || '', sm = /#step-(\d)/.exec(h), pg = /#(map|guide|drive)(?:\/([^?#]+))?/.exec(h);
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
  window.KTA_APP = { state: state, slots: slots, drives: drives, ai: ai, render: render, buildPacket: buildPacket };
})();

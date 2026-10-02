/*!
 * KTA drive check: what one real drive says, and the one thing to do next.
 *
 * Built on kta-engine.js (window.KTA / require). Pure functions, no DOM.
 *   KTA.driveInsights(log, an)  numbers a tuner reads off a TunerView log
 *   KTA.planActions(report, history)  a fixed, ranked list of actions (safety first)
 *   KTA.proveAction(id, before, after)  keep / partial / retry / undo / inconclusive
 *   KTA.checkDrive(log, opts)  all of the above in one report
 * Every rule is a threshold in DRIVE_LIMITS or a line of code here: the same log always
 * gives the same queue, and the app shows the numbers behind every line.
 */
(function (root, factory) {
  var K = typeof module === 'object' && module.exports ? require('./kta-engine.js') : root.KTA;
  var api = factory(K);
  if (typeof module === 'object' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (KTA) {
  'use strict';
  var U = KTA.util, isNum = U.isNum, round = U.round, median = U.median, quantile = U.quantile;
  var GAS = KTA.GAS_SCALE;

  var DL = KTA.DRIVE_LIMITS = {
    warmEct: 70,                     // deg C: below this the ECU runs warm-up corrections
    lug: { rpmMin: 900, rpmMax: 1700, loadMin: -3, loadMax: 30, vssMin: 15 },  // low rpm with real load
    lugRef: { rpmMin: 2000, rpmMax: 3000, loadMin: -3, loadMax: 5 },           // the same load, healthy rpm
    lugShare: 0.05,                  // share of moving time that counts as a habit
    kcStep: 0.04,                    // a Knock Control move this big is an episode
    kcFuel: 0.65,                    // above this the ECU rates the fuel below RON95: check the fuel
    kcLugSteps: 0.5,                 // share of an episode's step-ups made while lugging to blame lugging
    kcWindow: 30,                    // s of driving before an episode that are searched for its cause
    pullLoad: 4,                     // psi (MAP gauge): under boost
    hardPull: 12,                    // psi: a pull that tests fuel, spark and heat
    fullPedal: 85,                   // % throttle command: foot down
    accelPedal: 60,                  // % throttle command held for an acceleration window
    pullIatGood: 48,                 // deg C at the start of a pull
    hotDrive: 45,                    // deg C IAT while moving: a hot-afternoon drive
    coolDrive: 42,                   // deg C IAT while moving: a cool drive (morning, rain)
    richBy: 0.5,                     // AFR points richer than the map at full load that deserve a look
    headroom: { small: 5, some: 15 },// % wastegate open at the boost peak
    kcSteady: 0.55,                  // Knock Control to call the fuel and heat margin healthy
    matchIat: 8,                     // deg C: two drives are comparable within this, or the second is hotter
    minMoving: 600                   // s of moving time for a before/after on habits
  };

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  function mask(n, fn) { var m = new Uint8Array(n); for (var i = 0; i < n; i++) m[i] = fn(i) ? 1 : 0; return m; }
  function secs(log, m) { var s = 0; for (var i = 0; i < log.n; i++) if (m[i]) s += log.w[i]; return s; }
  function and(a, b) { var m = new Uint8Array(a.length); for (var i = 0; i < a.length; i++) m[i] = a[i] && b[i] ? 1 : 0; return m; }
  function cnt(m) { var k = 0; for (var i = 0; i < m.length; i++) if (m[i]) k++; return k; }
  function q(a, p, m) { return a ? quantile(a, p, m) : NaN; }
  function r1(v) { return isNum(v) ? round(v, 1) : null; }
  function r2(v) { return isNum(v) ? round(v, 2) : null; }
  function r0(v) { return isNum(v) ? Math.round(v) : null; }
  function stat(a, m) {
    if (!a) return null;
    var k = 0; for (var i = 0; i < a.length; i++) if ((!m || m[i]) && isNum(a[i])) k++;
    if (!k) return null;
    return { n: k, p05: r2(q(a, 0.05, m)), p50: r2(q(a, 0.5, m)), p95: r2(q(a, 0.95, m)), max: r2(q(a, 1, m)), min: r2(q(a, 0, m)) };
  }
  // Contiguous runs of a mask, gaps up to gapS bridged, at least minS long.
  function runs(log, m, gapS, minS) {
    var out = [], cur = null, t = log.t;
    for (var i = 0; i < log.n; i++) {
      if (!m[i]) continue;
      if (cur && t[i] - t[cur.i1] <= gapS) cur.i1 = i;
      else { if (cur) out.push(cur); cur = { i0: i, i1: i }; }
    }
    if (cur) out.push(cur);
    return out.filter(function (r) { r.t0 = t[r.i0]; r.t1 = t[r.i1]; r.dur = r.t1 - r.t0; return r.dur >= minS; });
  }
  // First sample at or after `time` (log.n when none).
  function indexAt(log, time) {
    var lo = 0, hi = log.n;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (log.t[mid] < time) lo = mid + 1; else hi = mid; }
    return lo;
  }
  function vals(a, i0, i1, keep) { var o = []; if (!a) return o; for (var i = i0; i < i1; i++) if ((!keep || keep[i]) && isNum(a[i])) o.push(a[i]); return o; }
  function qa(o, p) { return o.length ? quantile(o, p) : NaN; }
  function rangeSecs(log, m, i0, i1) { var s = 0; for (var i = i0; i < i1; i++) if (!m || m[i]) s += log.w[i]; return s; }
  // Crossing time of a rising channel through level v between samples i-1 and i.
  function crossT(log, a, i, v) {
    var a0 = a[i - 1], a1 = a[i];
    if (!(a1 > a0)) return log.t[i];
    return log.t[i - 1] + (v - a0) / (a1 - a0) * (log.t[i] - log.t[i - 1]);
  }

  // ---------------------------------------------------------------------------
  // Insights: the numbers behind the queue
  // ---------------------------------------------------------------------------
  KTA.driveInsights = function (log, an) {
    an = an || KTA.analyze(log);
    var n = log.n, has = log.has, dt = log.dt || 0.1;
    var load = has.load ? log.load : null;
    var pedal = has.tpsCmd ? log.tpsCmd : (has.pedal ? log.pedal : (has.tps ? log.tps : null));
    var warm = mask(n, function (i) { return !has.ect || log.ect[i] >= DL.warmEct; });
    var moving = mask(n, function (i) { return has.vss ? log.vss[i] >= 3 : (!has.rpm || log.rpm[i] >= 900); });
    var still = has.vss ? mask(n, function (i) { return log.vss[i] < 1; }) : null;
    var movingS = secs(log, moving);
    var I = { meta: {}, lug: null, kc: null, heat: {}, mix: null, boost: null, trims: null, accel: null, grid: null, quality: {} };

    // ---- meta and data quality
    I.meta = {
      duration: r0(log.duration), movingSeconds: r0(movingS), rateHz: r1(1 / dt), rows: n, source: log.source || 'other',
      townSeconds: has.vss ? r0(secs(log, mask(n, function (i) { return warm[i] && log.vss[i] >= 15 && log.vss[i] <= 60; }))) : null,
      pedalChannel: has.tpsCmd ? 'tpsCmd' : (has.pedal ? 'pedal' : (has.tps ? 'tps' : ''))
    };
    I.quality = {
      glitches: log.glitches || {}, glitchTotal: log.glitchTotal || 0, fuelCutSamples: (log.capped && log.capped.afr) || 0,
      hasAfrCmd: !!has.lamCmd, hasAfm: !!(has.mafHz || has.mafGs), hasKnockControl: !!has.kControl, hasLoad: !!load,
      knockScheduled: !!an.knockScheduled,
      missing: ['afrCmd', 'mafHz'].filter(function (k) { return k === 'afrCmd' ? !has.lamCmd : !(has.mafHz || has.mafGs); }),
      flat: (an.flatChannels || []).slice(),
      cantTell: an.cantTell || null, movingSeconds: isNum(an.movingSeconds) ? an.movingSeconds : null
    };

    // ---- lugging: low rpm with real load. The CVT in D holds 1,300-1,700 rpm when you press gently.
    if (has.rpm && load) {
      var L = DL.lug, R = DL.lugRef;
      var lug = mask(n, function (i) {
        return warm[i] && log.rpm[i] >= L.rpmMin && log.rpm[i] < L.rpmMax && load[i] >= L.loadMin && load[i] <= L.loadMax && (!has.vss || log.vss[i] >= L.vssMin);
      });
      var ref = mask(n, function (i) {
        return warm[i] && log.rpm[i] >= R.rpmMin && log.rpm[i] <= R.rpmMax && load[i] >= R.loadMin && load[i] <= R.loadMax && (!has.vss || log.vss[i] >= L.vssMin);
      });
      var lugBand = mask(n, function (i) { return lug[i] && load[i] <= R.loadMax; });
      var lugS = secs(log, lug), eps = runs(log, lug, 1.0, 2.0);
      I.lug = {
        seconds: r0(lugS), share: movingS ? r2(lugS / movingS * 100) : null,   // % of moving time
        episodes: eps.length, longest: r1(eps.reduce(function (m, e) { return Math.max(m, e.dur); }, 0)),
        ign: r1(q(log.ign, 0.5, lugBand)), ignRef: r1(q(log.ign, 0.5, ref)),
        kr: r1(q(log.knock, 0.5, lug)), krP90: r1(q(log.knock, 0.9, lug)), krRef: r1(q(log.knock, 0.5, ref)),
        iat: r0(q(log.iat, 0.5, lug)), rpm: r0(q(log.rpm, 0.5, lug)), load: r1(q(load, 0.5, lug)), refSeconds: r0(secs(log, ref))
      };
      I.lug.ignDelta = isNum(I.lug.ign) && isNum(I.lug.ignRef) ? r1(I.lug.ignRef - I.lug.ign) : null;
      // "Timing lost while lugging" is shown only for a real loss: at least the
      // ignition channel's 1° logged step, on 30 s or more of reference driving.
      I.lug.ignDeltaShown = isNum(I.lug.ignDelta) && I.lug.ignDelta >= 1 && isNum(I.lug.refSeconds) && I.lug.refSeconds >= 30 ? I.lug.ignDelta : null;
      I._lugMask = lug;
    }

    // ---- Knock Control: the ECU's running verdict on your fuel and heat, and what moved it
    if (has.kControl) {
      var kcS = U.rollingMedian(log.kControl, Math.max(2, Math.round(2.5 / dt)));
      var step = 5, pts = [], lugM = I._lugMask;
      for (var tt = 0; tt <= log.duration; tt += step) {
        var i0 = indexAt(log, tt), i1 = indexAt(log, tt + step);
        var v = qa(vals(kcS, i0, i1), 0.5);
        if (!isNum(v)) continue;
        var b0 = indexAt(log, tt - 60), mvB = 0, lgB = 0;
        for (var j = b0; j < i1; j++) if (moving[j]) { mvB += log.w[j]; if (lugM && lugM[j]) lgB += log.w[j]; }
        pts.push({
          t: tt, v: r2(v), lug: mvB > 5 ? r2(lgB / mvB) : 0,
          iat: r0(qa(vals(log.iat, i0, i1), 0.5)), rpm: r0(qa(vals(log.rpm, i0, i1), 0.5)), vss: r0(qa(vals(log.vss, i0, i1), 0.5)), load: r1(qa(vals(load, i0, i1), 0.9))
        });
      }
      // zig-zag with hysteresis: rises and falls of at least kcStep
      var piv = [], dir = 0, hi = pts[0], lo = pts[0], ext = null;
      for (var k = 1; k < pts.length; k++) {
        var p = pts[k];
        if (dir === 0) {
          if (p.v >= hi.v) hi = p;
          if (p.v <= lo.v) lo = p;
          if (hi.v - lo.v >= DL.kcStep - 1e-9) { if (hi.t > lo.t) { piv = [lo]; dir = 1; ext = hi; } else { piv = [hi]; dir = -1; ext = lo; } }
          continue;
        }
        if (dir > 0) { if (p.v > ext.v) ext = p; else if (ext.v - p.v >= DL.kcStep - 1e-9) { piv.push(ext); dir = -1; ext = p; } }
        else { if (p.v <= ext.v) ext = p; else if (p.v - ext.v >= DL.kcStep - 1e-9) { piv.push(ext); dir = 1; ext = p; } }
      }
      if (dir !== 0) piv.push(ext);
      // Every step up of the smoothed Knock Control, with what the engine did in the 3 s before it
      // (the knock that moved it). Hysteresis: +0.01 to count a step, -0.02 to reset the level.
      var ups = [], level = NaN;
      for (var si = 0; si < n; si++) {
        var kv = kcS[si];
        if (!isNum(kv)) continue;
        if (!isNum(level)) { level = kv; continue; }
        if (kv >= level + 0.01 - 1e-9) {
          var c0 = indexAt(log, log.t[si] - 3);
          var rpmC = qa(vals(log.rpm, c0, si + 1), 0.5), vssC = qa(vals(log.vss, c0, si + 1), 0.5), loadC = qa(vals(load, c0, si + 1), 1);
          var inLug = rpmC >= DL.lug.rpmMin && rpmC < DL.lug.rpmMax && loadC >= DL.lug.loadMin && (!has.vss || vssC >= DL.lug.vssMin);
          ups.push({ t: r1(log.t[si]), from: r2(level), to: r2(kv), rpm: r0(rpmC), load: r1(loadC), vss: r0(vssC), iat: r0(qa(vals(log.iat, c0, si + 1), 0.5)), lug: inLug });
          level = kv;
        } else if (kv <= level - 0.02 + 1e-9) level = kv;
      }
      var episodes = [];
      for (k = 1; k < piv.length; k++) {
        var a = piv[k - 1], b = piv[k], d = b.v - a.v;
        if (Math.abs(d) < DL.kcStep - 1e-9) continue;
        var wm = mask(n, function (ii) { return log.t[ii] >= a.t - DL.kcWindow && log.t[ii] <= b.t + step; });
        var wMove = secs(log, and(wm, moving)), wLug = lugM ? secs(log, and(wm, lugM)) : 0;
        var wBoost = load ? secs(log, and(wm, mask(n, function (ii) { return load[ii] >= DL.pullLoad; }))) : 0;
        var eu = ups.filter(function (u) { return u.t >= a.t && u.t <= b.t + step; });
        var e = {
          kind: d > 0 ? 'rise' : 'fall', from: a.v, to: b.v, t0: a.t, t1: b.t + step,
          steps: eu.length, lugSteps: eu.filter(function (u) { return u.lug; }).length,
          lugShare: wMove ? r2(wLug / wMove) : 0, boostSeconds: r1(wBoost),
          rpm: r0(q(log.rpm, 0.5, and(wm, moving))), rpmP90: r0(q(log.rpm, 0.9, and(wm, moving))),
          iat: r0(q(log.iat, 0.5, wm)), vss: r0(q(log.vss, 0.5, and(wm, moving))), load: r1(q(load, 0.9, wm))
        };
        e.cause = e.kind === 'rise'
          ? (e.steps && e.lugSteps / e.steps >= DL.kcLugSteps ? 'lugging' : (e.boostSeconds >= 3 ? 'boost' : (e.iat >= 55 ? 'heat' : 'unclear')))
          : (e.lugShare < 0.1 && e.rpm >= 1800 ? 'revs' : 'other');
        episodes.push(e);
      }
      var an2 = an.numbers;
      var kcRiseHere = isNum(an2.kControlPeak) && isNum(an2.kControlStart) ? Math.max(0, an2.kControlPeak - an2.kControlStart) : NaN;
      I.kc = {
        start: r2(an2.kControlStart), end: r2(an2.kControlEnd), peak: r2(an2.kControlPeak), rise: r2(kcRiseHere),
        min: r2(quantile(kcS, 0)), timeline: pts, episodes: episodes, ups: ups,
        upSteps: ups.length, lugUpSteps: ups.filter(function (u) { return u.lug; }).length,
        upRpm: r0(median(ups.map(function (u) { return u.rpm; }).filter(isNum))), upVss: r0(median(ups.map(function (u) { return u.vss; }).filter(isNum))), upLoad: r1(median(ups.map(function (u) { return u.load; }).filter(isNum))),
        rises: episodes.filter(function (x) { return x.kind === 'rise'; }).length,
        lugRises: episodes.filter(function (x) { return x.kind === 'rise' && x.cause === 'lugging'; }).length
      };
    }

    // ---- boost events: the pulls, with what the turbo, fuel and heat did in each
    if (load) {
      var inBoost = mask(n, function (i) { return load[i] >= DL.pullLoad && (!pedal || pedal[i] >= 40); });
      var evs = runs(log, inBoost, 0.4, 1.0).map(function (r) {
        var m = mask(n, function (i) { return i >= r.i0 && i <= r.i1; });
        var mapMax = q(load, 1, m), peak = mask(n, function (i) { return m[i] && load[i] >= mapMax - 1; });
        var rich = mask(n, function (i) { return m[i] && load[i] >= 8; });
        var ev = {
          t0: r1(r.t0), t1: r1(r.t1), dur: r1(r.dur), rpm0: r0(log.rpm ? log.rpm[r.i0] : NaN), rpm1: r0(q(log.rpm, 1, m)),
          vss0: r0(has.vss ? log.vss[r.i0] : NaN), vss1: r0(q(log.vss, 1, m)), mapMax: r1(mapMax),
          boostMax: r1(q(log.boost, 1, m)), targetMax: r1(q(log.boostTarget, 1, m)), wgAtPeak: r1(q(log.wgPos, 0.5, peak)),
          iat0: r0(has.iat ? log.iat[r.i0] : NaN), iatEnd: r0(has.iat ? log.iat[r.i1] : NaN), cvt0: r0(has.cvt ? log.cvt[r.i0] : NaN),
          afr: r1(q(log.lam, 0.5, rich) * GAS), afrMax: r1(q(log.lam, 0.95, rich) * GAS), ign: r1(q(log.ign, 0.5, peak)), kr: r1(q(log.knock, 0.5, peak)),
          pedalMax: r0(q(pedal, 1, m)), kc: r2(has.kControl ? log.kControl[r.i0] : NaN)
        };
        ev.hard = ev.mapMax >= DL.hardPull;
        return ev;
      });
      var hard = evs.filter(function (e) { return e.hard; });
      var wgs = hard.map(function (e) { return e.wgAtPeak; }).filter(isNum);
      var wg = wgs.length ? median(wgs) : NaN;
      I.boost = {
        events: evs, count: evs.length, hard: hard.length,
        peakMap: r1(evs.reduce(function (m, e) { return Math.max(m, e.mapMax); }, -Infinity)),
        peakBoost: r1(evs.reduce(function (m, e) { return isNum(e.boostMax) ? Math.max(m, e.boostMax) : m; }, -Infinity)),
        peakTarget: r1(evs.reduce(function (m, e) { return isNum(e.targetMax) ? Math.max(m, e.targetMax) : m; }, -Infinity)),
        wgAtPeak: r1(wg), headroom: !isNum(wg) ? 'unknown' : (wg <= DL.headroom.small ? 'small' : (wg <= DL.headroom.some ? 'some' : 'large')),
        pullIat: r0(median(hard.map(function (e) { return e.iat0; }).filter(isNum))),
        pullIatMax: r0(hard.reduce(function (m, e) { return isNum(e.iat0) ? Math.max(m, e.iat0) : m; }, -Infinity)),
        pullIatDrop: r1(median(hard.map(function (e) { return e.iat0 - e.iatEnd; }).filter(isNum))),
        hotCvtPulls: hard.filter(function (e) { return e.cvt0 >= KTA.LIMITS.cvt.good; }).length,
        overshoot: r1(an.numbers.overshoot)
      };
      ['peakMap', 'peakBoost', 'peakTarget'].forEach(function (key) { if (!isNum(I.boost[key])) I.boost[key] = null; });
      // A flat Turbo Pressure channel reads as a fake peak (Sep 5: -0.3 psi): never show it.
      var flatHere = an.flatChannels || [];
      if (flatHere.indexOf('boost') >= 0) I.boost.peakBoost = null;
      if (flatHere.indexOf('boostTarget') >= 0) I.boost.peakTarget = null;
      if (!isNum(I.boost.pullIatMax)) I.boost.pullIatMax = null;
      I._boostMask = inBoost;
    }

    // ---- mixture under load, by manifold pressure (the AFR table is load-based)
    if (load && has.lam) {
      var bands = [[4, 8], [8, 12], [12, 16], [16, 30]];
      var rows = bands.map(function (bd) {
        var m = mask(n, function (i) { return warm[i] && load[i] >= bd[0] && load[i] < bd[1] && (!pedal || pedal[i] >= 50) && isNum(log.lam[i]); });
        var s = secs(log, m);
        return {
          from: bd[0], to: bd[1], seconds: r1(s), n: cnt(m),
          afr: r2(q(log.lam, 0.5, m) * GAS), afrLo: r2(q(log.lam, 0.05, m) * GAS), afrHi: r2(q(log.lam, 0.95, m) * GAS),
          ign: r1(q(log.ign, 0.5, m)), kr: r1(q(log.knock, 0.5, m)), iat: r0(q(log.iat, 0.5, m)),
          rpmLo: r0(q(log.rpm, 0.05, m)), rpmHi: r0(q(log.rpm, 0.95, m)),
          cmd: has.lamCmd ? r2(q(log.lamCmd, 0.5, m) * GAS) : null
        };
      }).filter(function (r) { return r.n >= 8; });
      var full = mask(n, function (i) { return warm[i] && load[i] >= DL.hardPull && (!pedal || pedal[i] >= 50); });
      var fullAfr = q(log.lam, 0.5, full) * GAS;
      I.mix = {
        bands: rows, fullLoadAfr: r2(fullAfr), fullLoadSeconds: r1(secs(log, full)), mapAfr: an.numbers.wotMapAfr,
        richBy: isNum(fullAfr) ? r2(an.numbers.wotMapAfr - fullAfr) : null,
        leanest: r2(an.wot.leanestLambda * GAS), cmd: has.lamCmd ? r2(q(log.lamCmd, 0.5, full) * GAS) : null
      };
      if (!isNum(I.mix.leanest)) I.mix.leanest = null;
    }

    // ---- closed-loop fuel trims by load: does the AFM still read the new intake right?
    if (load && (has.stft || has.ltft)) {
      var trim = new Float64Array(n);
      for (var ti = 0; ti < n; ti++) {
        var s1 = has.stft ? log.stft[ti] : 0, l1 = has.ltft ? log.ltft[ti] : 0;
        trim[ti] = isNum(s1) && isNum(l1) ? ((1 + s1 / 100) * (1 + l1 / 100) - 1) * 100 : NaN;
      }
      var inB = I._boostMask;
      var cl = mask(n, function (i) { return warm[i] && (!has.lam || (isNum(log.lam[i]) && log.lam[i] >= 0.925 && log.lam[i] <= 1.06)) && !(inB && inB[i]); });
      var tb = [[-12, -8], [-8, -5], [-5, -2], [-2, 1], [1, 4], [4, 8]].map(function (bd) {
        var m = mask(n, function (i) { return cl[i] && moving[i] && load[i] >= bd[0] && load[i] < bd[1]; });
        return { from: bd[0], to: bd[1], seconds: r0(secs(log, m)), trim: r1(q(trim, 0.5, m)), lo: r1(q(trim, 0.1, m)), hi: r1(q(trim, 0.9, m)) };
      }).filter(function (r) { return r.seconds >= 20 && isNum(r.trim); });
      var idle = still ? mask(n, function (i) { return cl[i] && still[i] && log.rpm[i] < 1000; }) : null;
      var worstT = tb.reduce(function (m, r) { return Math.abs(r.trim) > Math.abs(m) ? r.trim : m; }, 0);
      I.trims = { bands: tb, idle: idle ? r1(q(trim, 0.5, idle)) : null, worst: r1(worstT), ok: Math.abs(worstT) <= KTA.LIMITS.trim.good };
    }

    // ---- heat: pull-start air, soak at a standstill, air while moving, CVT
    I.heat = {
      iatMoving: r0(q(log.iat, 0.5, has.vss ? mask(n, function (i) { return log.vss[i] >= 40; }) : moving)),
      iatStill: still ? r0(q(log.iat, 0.95, still)) : null,
      iatLoad: load ? r0(q(log.iat, 0.5, mask(n, function (i) { return load[i] >= DL.pullLoad; }))) : null,
      iat2: r0(q(log.iat2, 0.5)), cvtMed: r0(q(log.cvt, 0.5, moving)), cvtMax: r0(an.numbers.cvtMax), ectMax: r0(an.numbers.ectMax),
      pullIat: I.boost ? I.boost.pullIat : null
    };
    if (isNum(I.heat.iatStill) && isNum(I.heat.iatMoving)) I.heat.soak = I.heat.iatStill - I.heat.iatMoving;
    I.heat.hot = isNum(I.heat.iatMoving) && I.heat.iatMoving >= DL.hotDrive;
    I.heat.cool = isNum(I.heat.iatMoving) && I.heat.iatMoving < DL.coolDrive;

    // ---- acceleration windows: the feel, measured the same way every time
    if (has.vss) {
      var wins = [[40, 60], [50, 70], [60, 80], [70, 90], [80, 100]], found = [];
      for (var ai = 1; ai < n; ai++) {
        for (var wi = 0; wi < wins.length; wi++) {
          var A = wins[wi][0], B = wins[wi][1];
          if (!(log.vss[ai - 1] < A && log.vss[ai] >= A)) continue;
          var tA = crossT(log, log.vss, ai, A), jj = ai, ok = true, pmin = Infinity, mmax = -Infinity;
          while (jj < n && log.vss[jj] < B && log.t[jj] - tA < 12) {
            if (pedal && !(pedal[jj] >= DL.accelPedal)) { ok = false; break; }
            if (pedal) pmin = Math.min(pmin, pedal[jj]);
            if (load && isNum(load[jj])) mmax = Math.max(mmax, load[jj]);
            jj++;
          }
          if (!ok || jj >= n || !(log.vss[jj] >= B)) continue;
          var tB = crossT(log, log.vss, jj, B);
          found.push({ from: A, to: B, seconds: r2(tB - tA), t: r1(tA), pedalMin: isFinite(pmin) ? r0(pmin) : null, mapMax: isFinite(mmax) ? r1(mmax) : null, iat: r0(has.iat ? log.iat[ai] : NaN), full: isFinite(pmin) && pmin >= DL.fullPedal });
        }
      }
      var best = {};
      found.forEach(function (f) { var key = f.from + '-' + f.to; if (!best[key] || f.seconds < best[key].seconds) best[key] = f; });
      var head = best['50-70'] || best['40-60'] || best['60-80'] || null;
      I.accel = { runs: found, best: best, headline: head };
    }

    // ---- timing map: median ignition and knock retard by rpm and load (the engineering view)
    if (has.rpm && load && has.ign) {
      var rE = [750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6800];
      var lE = [-12, -8, -5, -2, 1, 4, 8, 12, 16, 20, 26];
      var cells = [];
      var buckets = {};
      for (var gi = 0; gi < n; gi++) {
        if (!warm[gi] || !moving[gi] || (pedal && !(pedal[gi] >= 5)) || !isNum(log.rpm[gi]) || !isNum(load[gi]) || !isNum(log.ign[gi])) continue;
        var rr = -1, ll = -1;
        for (var x = 0; x < rE.length - 1; x++) if (log.rpm[gi] >= rE[x] && log.rpm[gi] < rE[x + 1]) { rr = x; break; }
        for (var y = 0; y < lE.length - 1; y++) if (load[gi] >= lE[y] && load[gi] < lE[y + 1]) { ll = y; break; }
        if (rr < 0 || ll < 0) continue;
        var key2 = rr + ':' + ll, bkt = buckets[key2] || (buckets[key2] = { r: rr, c: ll, ign: [], kr: [], s: 0 });
        bkt.ign.push(log.ign[gi]); if (isNum(log.knock && log.knock[gi])) bkt.kr.push(log.knock[gi]); bkt.s += log.w[gi];
      }
      // grid cells that sit inside the lugging definition (900-1,700 rpm, -3 psi and up) on these edges
      var lugR0 = rE.filter(function (e) { return e >= DL.lug.rpmMin; })[0], lugR1 = rE.filter(function (e) { return e >= DL.lug.rpmMax; })[0], lugC0 = lE.filter(function (e) { return e >= DL.lug.loadMin; })[0];
      Object.keys(buckets).forEach(function (key3) {
        var bk = buckets[key3];
        if (bk.ign.length < 8) return;
        cells.push({ r: bk.r, c: bk.c, ign: r1(median(bk.ign)), kr: bk.kr.length ? r1(median(bk.kr)) : null, seconds: r1(bk.s), lug: rE[bk.r] >= lugR0 && rE[bk.r + 1] <= lugR1 && lE[bk.c] >= lugC0 });
      });
      cells.sort(function (p1, p2) { return p1.r - p2.r || p1.c - p2.c; });
      I.grid = { rpm: rE, load: lE, cells: cells, lugRpm: [lugR0, lugR1], lugLoad: lugC0 };
    }

    delete I._lugMask; delete I._boostMask;
    return I;
  };

  // ---------------------------------------------------------------------------
  // The action catalog. Order of work: safety, then value for effort.
  // Text for each id lives in the app (EN / VI); the engine owns the rules.
  //   impact 1-3 (3 = the car feels or is protected most), effort 1-3 (1 = minutes,
  //   no tools; 3 = a flash and logs), risk 0-2, flash: needs a reflash.
  // ---------------------------------------------------------------------------
  var TIERS = { safety: 0, drive: 1, data: 2, hardware: 3, tune: 4, gain: 5 };
  KTA.TIERS = TIERS;
  // When several checks say Stop, fix the one that can break the engine first: knock and a lean
  // mixture, then what feeds them (fuel pressure, boost, heat), then the drivetrain.
  var SAFETY_ORDER = ['knock', 'wotAfr', 'fuelPress', 'kControl', 'overshoot', 'iat', 'ect', 'undershoot', 'mafHz', 'cvtTemp', 'lowBoost', 'trims'];
  KTA.SAFETY_ORDER = SAFETY_ORDER;

  function gateCheck(an, id) {
    var out = null;
    an.gates.forEach(function (g) { g.checks.forEach(function (c) { if (c.id === id) out = c; }); });
    return out;
  }
  function hasStop(an) { return an.gates.some(function (g) { return g.status === 'stop'; }); }

  var CATALOG = [
    {
      id: 'revs', tier: 'drive', impact: 3, effort: 1, risk: 0, flash: false,
      when: function (I) {
        if (!I.lug) return null;
        var rise = I.kc ? I.kc.episodes.filter(function (e) { return e.kind === 'rise' && e.cause === 'lugging'; }) : [];
        var hotLug = I.heat.hot && I.lug.share >= DL.lugShare * 100 && I.lug.krP90 >= 3;
        if (!rise.length && !hotLug) return null;
        var top = rise.sort(function (a, b) { return (b.to - b.from) - (a.to - a.from); })[0] || null;
        return {
          strength: rise.length ? 1 : 0.5,
          ev: { lugSeconds: I.lug.seconds, lugShare: I.lug.share, lugRpm: I.lug.rpm, ign: I.lug.ign, ignRef: I.lug.ignRef, ignDelta: I.lug.ignDelta, kr: I.lug.kr, krRef: I.lug.krRef, iat: I.lug.iat,
            kcFrom: top ? top.from : null, kcTo: top ? top.to : null, riseAt: top ? top.t0 : null, riseLug: top ? top.lugShare : null, riseRpm: top ? top.rpm : null, rises: rise.length,
            fallRpm: I.kc ? (I.kc.episodes.filter(function (e) { return e.kind === 'fall' && e.cause === 'revs'; })[0] || {}).rpm || null : null }
        };
      },
      proof: { metric: 'lugShare', dir: 'down' }
    },
    {
      id: 'cooldown', tier: 'drive', impact: 2, effort: 1, risk: 0, flash: false,
      when: function (I, an) {
        if (!I.boost || !I.boost.hard) return null;
        var iatC = gateCheck(an, 'iat');
        if (!(I.boost.pullIat >= DL.pullIatGood || (iatC && iatC.status !== 'good'))) return null;
        return { strength: I.boost.pullIatMax >= KTA.LIMITS.iat.watch ? 1 : 0.6, ev: { pullIat: I.boost.pullIat, pullIatMax: I.boost.pullIatMax, pulls: I.boost.hard, drop: I.boost.pullIatDrop, soak: I.heat.iatStill, moving: I.heat.iatMoving } };
      },
      proof: { metric: 'pullIat', dir: 'down' }
    },
    {
      id: 'cvtHeat', tier: 'drive', impact: 2, effort: 1, risk: 0, flash: false,
      when: function (I) {
        if (!isNum(I.heat.cvtMax) || I.heat.cvtMax < KTA.LIMITS.cvt.good) return null;
        return { strength: I.heat.cvtMax >= 95 ? 1 : 0.5, ev: { cvtMax: I.heat.cvtMax, cvtMed: I.heat.cvtMed, hotPulls: I.boost ? I.boost.hotCvtPulls : 0 } };
      },
      proof: { metric: 'cvtMax', dir: 'down' }
    },
    {
      id: 'fuelCheck', tier: 'drive', impact: 3, effort: 1, risk: 0, flash: false,
      when: function (I) {
        if (!I.kc || !(I.kc.end > DL.fuelKc)) return null;
        return { strength: 1, ev: { kcEnd: I.kc.end, kcStart: I.kc.start, lugRises: I.kc.lugRises } };
      },
      proof: { metric: 'kcEnd', dir: 'down' }
    },
    {
      id: 'data', tier: 'data', impact: 2, effort: 1, risk: 0, flash: false,
      when: function (I) {
        if (!I.quality.missing.length) return null;
        return { strength: 0.5, ev: { missing: I.quality.missing.slice(), knockScheduled: I.quality.knockScheduled } };
      },
      proof: { metric: 'channels', dir: 'present' }
    },
    {
      id: 'hotLog', tier: 'drive', impact: 1, effort: 1, risk: 0, flash: false,
      when: function (I) { return I.heat.cool ? { strength: 0.3, ev: { iatMoving: I.heat.iatMoving } } : null; },
      proof: { metric: 'iatMoving', dir: 'up' }
    },
    {
      id: 'heatHw', tier: 'hardware', impact: 2, effort: 2, risk: 0, flash: false,
      when: function (I) {
        if (!I.boost || !I.boost.hard || !(I.heat.iatMoving >= DL.hotDrive + 3) || !(I.heat.iatLoad >= 50)) return null;
        return { strength: 0.5, ev: { iatMoving: I.heat.iatMoving, iatLoad: I.heat.iatLoad, iat2: I.heat.iat2, soak: I.heat.iatStill } };
      },
      proof: { metric: 'iatMoving', dir: 'down' }
    },
    {
      id: 'afm', tier: 'tune', impact: 3, effort: 3, risk: 1, flash: true,
      when: function (I) { return I.trims && !I.trims.ok ? { strength: 1, ev: { worst: I.trims.worst } } : null; },
      needs: function (I) { return I.quality.hasAfm ? null : ['data']; },
      proof: { metric: 'trimWorst', dir: 'toward0' }
    },
    {
      id: 'richWot', tier: 'tune', impact: 2, effort: 3, risk: 1, flash: true,
      when: function (I) {
        if (!I.mix || !(I.mix.richBy >= DL.richBy) || !(I.mix.fullLoadSeconds >= 2)) return null;
        if (I.quality.hasAfrCmd && isNum(I.mix.cmd) && Math.abs(I.mix.cmd - I.mix.fullLoadAfr) <= 0.3) return null;  // the ECU asks for it
        return { strength: 0.6, ev: { measured: I.mix.fullLoadAfr, map: I.mix.mapAfr, richBy: I.mix.richBy, cmd: I.mix.cmd, seconds: I.mix.fullLoadSeconds } };
      },
      needs: function (I) { return I.quality.hasAfrCmd ? null : ['data']; },
      proof: { metric: 'wotAfr', dir: 'toward-cmd' }
    },
    {
      id: 'lowBoost', tier: 'tune', impact: 1, effort: 3, risk: 1, flash: true,
      when: function (I) {
        if (!I.kc || !I.kc.lugRises) return null;
        return { strength: 0.5, ev: { lugRises: I.kc.lugRises, kcTo: I.kc.peak } };
      },
      needs: function (I, hist) { return tried(hist, 'revs') ? null : ['revs']; },
      proof: { metric: 'kcRise', dir: 'down' }
    },
    {
      id: 'wotLean', tier: 'gain', impact: 2, effort: 3, risk: 2, flash: true, gain: true,
      when: function () { return { strength: 0, ev: {} }; },
      needs: function (I, hist, an) { return gainBlockers(I, an, 'wotLean'); },
      proof: { metric: 'accel', dir: 'down' }
    },
    {
      id: 'moreBoost', tier: 'gain', impact: 2, effort: 3, risk: 2, flash: true, gain: true,
      when: function () { return { strength: 0, ev: {} }; },
      needs: function (I, hist, an) { return gainBlockers(I, an, 'moreBoost'); },
      proof: { metric: 'accel', dir: 'down' }
    }
  ];
  KTA.ACTION_IDS = CATALOG.map(function (a) { return a.id; });

  function tried(hist, id) {
    return (hist || []).some(function (h) { return h.id === id && (h.verdict === 'keep' || h.verdict === 'partial'); });
  }
  // What still stands between this car and a gain lever. Empty means the lever may be tried.
  function gainBlockers(I, an, which) {
    var out = [];
    if (hasStop(an) || an.verdict === 'watch') out.push('gates');
    if (I.kc && (I.kc.end > DL.kcSteady || I.kc.rise > DL.kcStep)) out.push('kc');
    if (I.boost && I.boost.pullIat >= DL.pullIatGood) out.push('pullIat');
    if (isNum(I.heat.cvtMax) && I.heat.cvtMax > KTA.LIMITS.cvt.good) out.push('cvt');
    if (!I.quality.hasAfrCmd) out.push('data');
    if (which === 'moreBoost') {
      if (I.boost && I.boost.headroom === 'small') out.push('headroom');
      if (!I.boost || !I.boost.hard) out.push('pulls');
    }
    return out.length ? out : null;
  }

  function scoreOf(a, strength) {
    return a.impact * 3 - a.effort * 2 - a.risk * 2 - (a.flash ? 1 : 0) + 2 * (strength || 0);
  }

  /**
   * Ranked actions for a drive report { an, ins }. history: [{ id, verdict }] from earlier
   * proofs. Returns { now: [], next: [], later: [], fine: [] }: `now` is one item (a safety
   * fix when anything says Stop), `next` the rest to do in order, `later` blocked items with
   * what unlocks them, `fine` the things this log checked and cleared.
   */
  KTA.planActions = function (report, history) {
    var an = report.an, I = report.ins, hist = history || [], items = [], fine = [];
    // A drive that cannot be judged gets no actions: Block 7 says how to fix the log.
    if (an.cantTell) return { now: [], next: [], later: [], fine: [], all: items, cantTell: an.cantTell };
    // safety: every Stop check becomes an action of its own, first in line
    an.gates.forEach(function (g) {
      g.checks.forEach(function (c) {
        var order = SAFETY_ORDER.indexOf(c.id);
        if (c.status === 'stop') items.push({ id: 'fix:' + c.id, check: c.id, gate: g.id, tier: 'safety', impact: 3, effort: 1, risk: 0, flash: false, score: 100 - (order < 0 ? SAFETY_ORDER.length : order), strength: 1, ev: { data: c.data || {}, display: c.display }, blockedBy: null });
      });
    });
    // A kept action that this drive triggers again stays in the list, marked: the evidence wins.
    var done = {};
    hist.forEach(function (h) { if (h.verdict === 'keep') done[h.id] = true; });
    CATALOG.forEach(function (a) {
      var hit = a.when(I, an, hist);
      if (!hit) { if (!a.gain) fine.push({ id: a.id, tier: a.tier }); return; }
      var blocked = a.needs ? a.needs(I, hist, an) : null;
      items.push({ id: a.id, tier: a.tier, impact: a.impact, effort: a.effort, risk: a.risk, flash: a.flash, gain: !!a.gain, strength: hit.strength, ev: hit.ev, score: scoreOf(a, hit.strength), blockedBy: blocked, proof: a.proof, again: !!done[a.id] && !a.gain });
    });
    items.sort(function (a, b) {
      var sa = a.tier === 'safety' ? 0 : 1, sb = b.tier === 'safety' ? 0 : 1;
      if (sa !== sb) return sa - sb;
      var ba = a.blockedBy ? 1 : 0, bb = b.blockedBy ? 1 : 0;
      if (ba !== bb) return ba - bb;
      if (b.score !== a.score) return b.score - a.score;
      if (TIERS[a.tier] !== TIERS[b.tier]) return TIERS[a.tier] - TIERS[b.tier];
      return a.id < b.id ? -1 : 1;
    });
    var safety = items.filter(function (x) { return x.tier === 'safety'; });
    var open = items.filter(function (x) { return !x.blockedBy; });
    var later = items.filter(function (x) { return !!x.blockedBy; });
    // while anything says Stop, only safety work is open
    if (safety.length) {
      open.filter(function (x) { return x.tier !== 'safety'; }).forEach(function (x) { x.blockedBy = ['safety']; later.unshift(x); });
      open = safety;
    }
    later.sort(function (a, b) { return (a.gain ? 1 : 0) - (b.gain ? 1 : 0) || b.score - a.score || (a.id < b.id ? -1 : 1); });
    items.forEach(function (x, k) { x.rank = k + 1; });
    return { now: open.slice(0, 1), next: open.slice(1), later: later, fine: fine, all: items };
  };

  // ---------------------------------------------------------------------------
  // One call: log -> report
  // ---------------------------------------------------------------------------
  KTA.checkDrive = function (log, opts) {
    opts = opts || {};
    var an = KTA.analyze(log, opts);
    var ins = KTA.driveInsights(log, an);
    var report = { an: an, ins: ins };
    report.plan = KTA.planActions(report, opts.history);
    report.verdict = an.verdict;
    return report;
  };

  // ---------------------------------------------------------------------------
  // Proof: did the one thing work? Safety first, then conditions, then the metric.
  // ---------------------------------------------------------------------------
  function stopIds(an) {
    var out = [];
    an.gates.forEach(function (g) { g.checks.forEach(function (c) { if (c.status === 'stop') out.push(c.id); }); });
    return out;
  }
  function metricOf(rep, name) {
    var I = rep.ins, an = rep.an;
    switch (name) {
      case 'lugShare': return I.lug ? I.lug.share : NaN;
      case 'kcRise': return I.kc ? I.kc.rise : NaN;
      case 'kcEnd': return I.kc ? I.kc.end : NaN;
      case 'pullIat': return I.boost ? I.boost.pullIat : NaN;
      case 'cvtMax': return I.heat.cvtMax;
      case 'iatMoving': return I.heat.iatMoving;
      case 'trimWorst': return I.trims ? I.trims.worst : NaN;
      case 'accel': return I.accel && I.accel.headline ? I.accel.headline.seconds : NaN;
      case 'wotAfr': return I.mix ? I.mix.fullLoadAfr : NaN;
      case 'channels': return I.quality.missing.length;
      default: return an.numbers ? an.numbers[name] : NaN;
    }
  }
  KTA.metricOf = metricOf;

  /**
   * id: an action id (or 'fix:<check>'); before/after: reports from checkDrive.
   * Returns { verdict, metric: { name, before, after }, matched: { ok, reasons }, newStops, notes }
   *   keep          worked: mark it done, move to the next item
   *   partial       better, not enough (e.g. less lugging, Knock Control still rises)
   *   retry         no change: do it again (habits) or look again
   *   undo          made something worse (a new Stop, or a flash that did not help)
   *   inconclusive  the two drives cannot be compared (weather, no pulls, too short)
   */
  KTA.proveAction = function (id, before, after) {
    var out = { id: id, verdict: 'inconclusive', metric: null, matched: { ok: true, reasons: [] }, newStops: [], notes: [] };
    var bStops = stopIds(before.an), aStops = stopIds(after.an);
    out.newStops = aStops.filter(function (s) { return bStops.indexOf(s) < 0; });
    var def = null;
    CATALOG.forEach(function (a) { if (a.id === id) def = a; });
    var flash = def ? def.flash : false;
    if (out.newStops.length) { out.verdict = flash ? 'undo' : 'stop'; return out; }
    var B = before.ins, A = after.ins, reasons = out.matched.reasons;

    if (/^fix:/.test(id)) {
      var cid = id.slice(4), was = gateCheck(before.an, cid), now = gateCheck(after.an, cid);
      out.metric = { name: cid, before: was ? was.status : 'nodata', after: now ? now.status : 'nodata' };
      if (!now || now.status === 'nodata') { reasons.push('noData'); out.matched.ok = false; return out; }
      out.verdict = now.status === 'stop' ? 'retry' : 'keep';
      return out;
    }
    if (!def) return out;
    var m = def.proof.metric, bv = metricOf(before, m), av = metricOf(after, m);
    out.metric = { name: m, before: isNum(bv) ? bv : null, after: isNum(av) ? av : null };

    // Comparable drives? A cooler second drive can not prove a heat or knock fix.
    var heatSensitive = ['revs', 'cooldown', 'cvtHeat', 'fuelCheck', 'heatHw', 'lowBoost', 'moreBoost', 'wotLean'].indexOf(id) >= 0;
    if (heatSensitive && isNum(B.heat.iatMoving) && isNum(A.heat.iatMoving) && A.heat.iatMoving < B.heat.iatMoving - DL.matchIat) reasons.push('cooler');
    if ((id === 'revs' || id === 'lowBoost') && !(A.meta.movingSeconds >= DL.minMoving)) reasons.push('short');
    if ((id === 'cooldown' || id === 'wotLean' || id === 'moreBoost' || id === 'richWot') && !(A.boost && A.boost.hard)) reasons.push('noPulls');
    if ((id === 'revs' || id === 'lowBoost' || id === 'fuelCheck') && !A.kc) reasons.push('noKc');
    // lugging and its knock only show in town: a highway drive proves nothing about them
    if ((id === 'revs' || id === 'lowBoost') && isNum(B.meta.townSeconds) && !(A.meta.townSeconds >= 0.5 * B.meta.townSeconds)) reasons.push('lessTown');
    if (id === 'richWot' && !(A.mix && isNum(A.mix.cmd))) reasons.push('noData');
    if (reasons.length) { out.matched.ok = false; out.verdict = 'inconclusive'; return out; }

    switch (id) {
      case 'revs': {
        var lugOk = isNum(av) && (av <= 2 || av <= bv * 0.6);
        var kcOk = A.kc && A.kc.rise <= 0.05 && !(A.kc.lugRises > 0);
        out.metric.kcRiseBefore = B.kc ? B.kc.rise : null; out.metric.kcRiseAfter = A.kc.rise;
        out.verdict = lugOk && kcOk ? 'keep' : (lugOk || (kcOk && av < bv) ? 'partial' : 'retry');
        break;
      }
      case 'cooldown': out.verdict = av <= DL.pullIatGood || av <= bv - 5 ? 'keep' : (av < bv ? 'partial' : 'retry'); break;
      case 'cvtHeat': out.verdict = av <= KTA.LIMITS.cvt.good ? 'keep' : (av < bv ? 'partial' : 'retry'); break;
      case 'fuelCheck': out.verdict = av <= DL.fuelKc ? 'keep' : (av < bv - 0.03 ? 'partial' : 'retry'); break;
      case 'data': {
        var miss = A.quality.missing;
        out.metric = { name: 'channels', before: B.quality.missing.length, after: miss.length, missing: miss.slice() };
        out.verdict = !miss.length ? 'keep' : (miss.length < B.quality.missing.length ? 'partial' : 'retry');
        break;
      }
      case 'hotLog': out.verdict = A.heat.hot ? 'keep' : 'retry'; break;
      case 'heatHw': out.verdict = av <= bv - 4 ? 'keep' : (av < bv ? 'partial' : 'retry'); break;
      case 'afm': out.verdict = Math.abs(av) <= KTA.LIMITS.trim.good ? 'keep' : (Math.abs(av) < Math.abs(bv) ? 'partial' : 'undo'); break;
      case 'richWot': {
        var cmd = A.mix ? A.mix.cmd : null;
        out.metric.cmd = cmd;
        out.verdict = isNum(cmd) && Math.abs(av - cmd) <= 0.3 ? 'keep' : 'undo';
        break;
      }
      case 'lowBoost': out.verdict = A.kc.rise <= 0.05 && !A.kc.lugRises ? 'keep' : 'undo'; break;
      case 'wotLean': case 'moreBoost': {
        // same speed window, foot down in both, similar intake air; and nothing new to watch
        var ha = A.accel && A.accel.headline, hb = B.accel && B.accel.headline;
        var same = ha && hb && ha.from === hb.from && ha.to === hb.to && ha.full && hb.full && Math.abs(ha.iat - hb.iat) <= DL.matchIat;
        if (!same) { out.matched.ok = false; reasons.push('accelNotMatched'); out.verdict = 'inconclusive'; break; }
        var worse = [];
        after.an.gates.forEach(function (g, gi) { g.checks.forEach(function (c, ci) { var was = before.an.gates[gi] && before.an.gates[gi].checks[ci]; if (c.status === 'watch' && was && was.status === 'good') worse.push(c.id); }); });
        out.newWatch = worse;
        out.verdict = !worse.length && av < bv - 0.05 ? 'keep' : 'undo';
        break;
      }
      default: out.verdict = 'inconclusive';
    }
    return out;
  };

  /**
   * The part of a report that proveAction reads, small enough to keep in localStorage while the
   * owner drives: the "before" of the action in progress survives a reload.
   */
  KTA.proofSnapshot = function (report) {
    var I = report.ins, an = report.an;
    function pick(o, keys) { if (!o) return null; var r = {}; keys.forEach(function (k) { r[k] = o[k]; }); return r; }
    return {
      v: 1,
      an: { verdict: an.verdict, gates: an.gates.map(function (g) { return { id: g.id, status: g.status, checks: g.checks.map(function (c) { return { id: c.id, status: c.status }; }) }; }) },
      ins: {
        meta: pick(I.meta, ['duration', 'movingSeconds', 'townSeconds', 'source']),
        heat: pick(I.heat, ['iatMoving', 'iatStill', 'iatLoad', 'cvtMax', 'cvtMed', 'hot', 'cool']),
        lug: pick(I.lug, ['seconds', 'share', 'ign', 'ignRef']),
        kc: I.kc ? { start: I.kc.start, end: I.kc.end, peak: I.kc.peak, rise: I.kc.rise, lugRises: I.kc.lugRises } : null,
        boost: pick(I.boost, ['hard', 'pullIat', 'peakMap']),
        mix: pick(I.mix, ['fullLoadAfr', 'cmd']),
        trims: pick(I.trims, ['worst']),
        accel: I.accel ? { headline: I.accel.headline } : null,
        quality: { missing: I.quality.missing.slice() }
      }
    };
  };

  // ---------------------------------------------------------------------------
  // Facts: every number the app shows, flattened with a stable path. The AI helper may only
  // quote numbers found here (or in tool results built from here).
  // ---------------------------------------------------------------------------
  KTA.driveFacts = function (report) {
    var out = {};
    function walk(v, path) {
      if (v == null) return;
      if (typeof v === 'number') { if (isNum(v)) out[path] = v; return; }
      if (typeof v === 'boolean' || typeof v === 'string') { out[path] = v; return; }
      if (Array.isArray(v)) { v.forEach(function (x, k) { walk(x, path + '[' + k + ']'); }); return; }
      if (typeof v === 'object') Object.keys(v).forEach(function (k) { if (k.charAt(0) !== '_') walk(v[k], path ? path + '.' + k : k); });
    }
    var I = report.ins;
    walk({ lug: I.lug, kc: I.kc ? { start: I.kc.start, end: I.kc.end, peak: I.kc.peak, rise: I.kc.rise, episodes: I.kc.episodes } : null, heat: I.heat, mix: I.mix, boost: I.boost ? { count: I.boost.count, hard: I.boost.hard, peakMap: I.boost.peakMap, peakBoost: I.boost.peakBoost, peakTarget: I.boost.peakTarget, wgAtPeak: I.boost.wgAtPeak, headroom: I.boost.headroom, pullIat: I.boost.pullIat, pullIatMax: I.boost.pullIatMax, overshoot: I.boost.overshoot } : null, trims: I.trims, accel: I.accel ? { best: I.accel.best } : null, meta: I.meta }, '');
    report.an.gates.forEach(function (g) { g.checks.forEach(function (c) { out['check.' + c.id + '.status'] = c.status; if (isNum(c.value)) out['check.' + c.id + '.value'] = c.value; }); });
    return out;
  };

  // ---------------------------------------------------------------------------
  // View models for the engineering graphs (plain SVG geometry)
  // ---------------------------------------------------------------------------
  function scale(d0, d1, r0v, r1v) { return function (v) { return r0v + ((v - d0) / (d1 - d0)) * (r1v - r0v); }; }
  function pathOf(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); }
  function ticks(lo, hi, stepV) { var o = []; for (var v = Math.ceil(lo / stepV) * stepV; v <= hi + 1e-9; v += stepV) o.push(round(v, 6)); return o; }
  var BLUES = ['#e6f0fc', '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281'];

  /** Knock Control over the drive, with the lugging share behind it and IAT on a second scale. */
  KTA.view.kcTimeline = function (I, box) {
    box = box || { w: 680, h: 250, l: 46, r: 46, t: 16, b: 36 };
    var f = { w: box.w, h: box.h, viewBox: '0 0 ' + box.w + ' ' + box.h, hasData: false };
    if (!I.kc || I.kc.timeline.length < 3) return f;
    var pts = I.kc.timeline, t1 = Math.max(60, pts[pts.length - 1].t + 5);
    var vals = pts.map(function (p) { return p.v; });
    var y0 = Math.min(0.4, Math.floor((Math.min.apply(null, vals) - 0.02) * 20) / 20), y1 = Math.max(0.75, Math.ceil((Math.max.apply(null, vals) + 0.02) * 20) / 20);
    var sx = scale(0, t1, box.l, box.w - box.r), sy = scale(y1, y0, box.t, box.h - box.b);
    var iats = pts.map(function (p) { return p.iat; }).filter(isNum);
    var i0 = iats.length ? Math.floor(Math.min.apply(null, iats) / 5) * 5 - 5 : 20, i1 = iats.length ? Math.ceil(Math.max.apply(null, iats) / 5) * 5 + 5 : 70;
    var si = scale(i1, i0, box.t, box.h - box.b);
    var stepMin = t1 > 2400 ? 10 : 5;
    f.plotL = box.l; f.plotR = box.w - box.r; f.plotT = box.t; f.plotB = box.h - box.b;
    f.xTicks = ticks(0, t1 / 60, stepMin).map(function (mnt) { return { x: round(sx(mnt * 60), 1), label: mnt + ' min' }; });
    f.yTicks = ticks(y0, y1, 0.05).map(function (v) { return { y: round(sy(v), 1), label: v.toFixed(2) }; });
    f.iTicks = ticks(i0, i1, 10).map(function (v) { return { y: round(si(v), 1), label: v + ' °C' }; });
    f.line = pathOf(pts.map(function (p) { return [sx(p.t), sy(p.v)]; }));
    f.iat = pathOf(pts.filter(function (p) { return isNum(p.iat); }).map(function (p) { return [sx(p.t), si(p.iat)]; }));
    var bw = Math.max(1, sx(5) - sx(0));
    f.lug = pts.filter(function (p) { return p.lug >= 0.2; }).map(function (p) { return { x: round(sx(p.t), 1), w: round(bw, 1), o: round(Math.min(0.55, 0.15 + p.lug * 0.5), 2) }; });
    f.limitY = round(sy(KTA.LIMITS.kControl.good), 1);
    f.ronY = round(sy(0.5), 1);
    f.marks = I.kc.episodes.map(function (e) {
      return { kind: e.kind, cause: e.cause, x: round(sx(e.t1 - 5), 1), y: round(sy(e.to), 1), from: e.from, to: e.to, t0: e.t0, t1: e.t1, lug: e.lugShare, rpm: e.rpm, iat: e.iat };
    });
    f.hasData = true;
    return f;
  };

  /** Median ignition by rpm x load, knock retard as a dot, the lugging zone outlined. */
  KTA.view.timingMap = function (I, box) {
    box = box || { w: 680, h: 300, l: 58, r: 12, t: 12, b: 40 };
    var f = { w: box.w, h: box.h, viewBox: '0 0 ' + box.w + ' ' + box.h, hasData: false, cells: [] };
    if (!I.grid || !I.grid.cells.length) return f;
    var G = I.grid, cs = G.cells;
    // only the rpm and load range this drive used, so the cells stay readable
    var r0 = Math.min.apply(null, cs.map(function (c) { return c.r; })), r1c = Math.max.apply(null, cs.map(function (c) { return c.r; }));
    var c0 = Math.min.apply(null, cs.map(function (c) { return c.c; })), c1 = Math.max.apply(null, cs.map(function (c) { return c.c; }));
    var nr = r1c - r0 + 1, nc = c1 - c0 + 1;
    var cw = (box.w - box.l - box.r) / nr, ch = (box.h - box.t - box.b) / nc;
    var igns = cs.map(function (c) { return c.ign; }), lo = Math.min.apply(null, igns), hi = Math.max.apply(null, igns);
    function X(r) { return box.l + (r - r0) * cw; }
    function Y(c) { return box.h - box.b - (c - c0) * ch; }
    f.cells = cs.map(function (c) {
      var tv = hi === lo ? 0.5 : (c.ign - lo) / (hi - lo), k = Math.round(tv * (BLUES.length - 1));
      return {
        x: round(X(c.r), 1), y: round(Y(c.c + 1), 1), w: round(cw - 1, 1), h: round(ch - 1, 1),
        fill: BLUES[k], ink: k >= 7 ? '#ffffff' : '#0b1b2e', text: c.ign.toFixed(0), kr: c.kr, krR: c.kr > 0.4 ? round(Math.min(ch / 2 - 2, cw / 4, 2 + c.kr * 0.9), 1) : 0,
        lug: c.lug, tip: G.rpm[c.r] + '-' + G.rpm[c.r + 1] + ' rpm, ' + G.load[c.c] + ' to ' + G.load[c.c + 1] + ' psi: ignition ' + c.ign + '°' + (isNum(c.kr) ? ', knock retard ' + c.kr + '°' : '') + ' (' + c.seconds + ' s)'
      };
    });
    function lab(r) { return r >= 1000 ? String(round(r / 1000, 2)) + 'k' : String(r); }
    f.xTicks = [];
    for (var r = r0; r <= r1c + 1; r++) f.xTicks.push({ x: round(X(r), 1), label: lab(G.rpm[r]) });
    f.yTicks = [];
    for (var c = c0; c <= c1 + 1; c++) f.yTicks.push({ y: round(Y(c), 1), label: (G.load[c] > 0 ? '+' : '') + G.load[c] });
    var lugCells = cs.filter(function (x) { return x.lug; });
    if (lugCells.length) {
      var la = G.rpm.indexOf(G.lugRpm[0]), lb = G.rpm.indexOf(G.lugRpm[1]), lc = G.load.indexOf(G.lugLoad);
      var top = Math.max.apply(null, lugCells.map(function (x) { return x.c; })) + 1;
      la = Math.max(la, r0); lb = Math.min(lb, r1c + 1); lc = Math.max(lc, c0);
      if (lb > la && top > lc) f.lugBox = { x: round(X(la), 1), y: round(Y(top), 1), w: round((lb - la) * cw - 1, 1), h: round((top - lc) * ch - 1, 1) };
    }
    f.range = { lo: lo, hi: hi };
    f.plotL = box.l; f.plotB = box.h - box.b; f.plotR = box.w - box.r;
    f.hasData = true;
    return f;
  };

  /** Measured AFR by manifold pressure under load, against the map's full-load target and the lean limit. */
  KTA.view.afrLoad = function (I, box) {
    box = box || { w: 680, h: 240, l: 50, r: 16, t: 14, b: 38 };
    var f = { w: box.w, h: box.h, viewBox: '0 0 ' + box.w + ' ' + box.h, hasData: false };
    if (!I.mix || !I.mix.bands.length) return f;
    var peak = I.boost && isNum(I.boost.peakMap) ? I.boost.peakMap : 16;
    var y0 = 9.5, y1 = 15, x0 = 4, x1 = Math.max(16, Math.ceil(peak / 4) * 4);
    var sx = scale(x0, x1, box.l, box.w - box.r), sy = scale(y1, y0, box.t, box.h - box.b);
    f.plotL = box.l; f.plotR = box.w - box.r; f.plotT = box.t; f.plotB = box.h - box.b;
    f.xTicks = ticks(x0, x1, 4).map(function (v) { return { x: round(sx(v), 1), label: '+' + v + ' psi' }; });
    f.yTicks = [10, 11, 12, 13, 14, 15].map(function (v) { return { y: round(sy(v), 1), label: v.toFixed(0) }; });
    f.bars = I.mix.bands.map(function (b) {
      var xa = sx(b.from), xb = sx(Math.min(b.to, x1)), cx = (xa + xb) / 2;
      return { x: round(xa + 6, 1), w: round(xb - xa - 12, 1), cx: round(cx, 1), yLo: round(sy(Math.max(y0, Math.min(y1, b.afrHi))), 1), yHi: round(sy(Math.max(y0, Math.min(y1, b.afrLo))), 1), y: round(sy(Math.max(y0, Math.min(y1, b.afr))), 1), afr: b.afr, seconds: b.seconds, cmdY: isNum(b.cmd) ? round(sy(b.cmd), 1) : null, tip: '+' + b.from + ' to +' + b.to + ' psi: ' + b.afr + ' AFR median (' + b.afrLo + '-' + b.afrHi + '), ' + b.seconds + ' s, ignition ' + b.ign + '°' };
    });
    f.mapY = round(sy(I.mix.mapAfr), 1);
    f.leanY = round(sy(KTA.LIMITS.wotTargetAfr.max), 1);
    f.stoichY = round(sy(14.7), 1);
    f.hasData = true;
    return f;
  };

  /** Best time for each speed window, foot down. */
  KTA.view.accelBars = function (I, box) {
    box = box || { w: 680, h: 200, l: 86, r: 70, t: 10, b: 28 };
    var f = { w: box.w, h: box.h, viewBox: '0 0 ' + box.w + ' ' + box.h, hasData: false, bars: [] };
    if (!I.accel) return f;
    var keys = ['40-60', '50-70', '60-80', '70-90', '80-100'].filter(function (k) { return I.accel.best[k]; });
    if (!keys.length) return f;
    var mx = Math.max(3, Math.ceil(Math.max.apply(null, keys.map(function (k) { return I.accel.best[k].seconds; })) + 0.5));
    var sx = scale(0, mx, box.l, box.w - box.r), bh = Math.min(26, (box.h - box.t - box.b) / keys.length - 8);
    f.bars = keys.map(function (k, i) {
      var b = I.accel.best[k], y = box.t + i * (bh + 8);
      return { label: k.replace('-', '→') + ' km/h', y: round(y, 1), h: round(bh, 1), x: box.l, w: round(sx(b.seconds) - box.l, 1), value: b.seconds.toFixed(2) + ' s', full: b.full, note: (isNum(b.mapMax) ? '+' + b.mapMax + ' psi' : '') + (isNum(b.iat) ? ' · ' + b.iat + ' °C' : ''), tip: k + ' km/h in ' + b.seconds + ' s at ' + Math.round(b.t) + ' s into the log, pedal ≥ ' + b.pedalMin + ' %, boost up to ' + b.mapMax + ' psi, IAT ' + b.iat + ' °C' };
    });
    f.xTicks = ticks(0, mx, 1).map(function (v) { return { x: round(sx(v), 1), label: v + ' s' }; });
    f.plotB = box.h - box.b; f.plotL = box.l; f.plotR = box.w - box.r;
    f.hasData = true;
    return f;
  };

  return KTA;
}));

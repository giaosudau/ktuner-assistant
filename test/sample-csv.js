'use strict';
// Simulated, deterministic TunerView CSVs for the engine tests (no car needed): 'before', 'after' and 'hot'.
// Moved out of the engine because nothing in production calls it.
const K = require('../engine/kta-engine.js');
const { isNum, clamp, interp1, invert, locate } = K.util;
const REF = K.REF, GAS = K.GAS_SCALE, refBoostAt = K.refBoostAt;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussFrom(rnd) {
  return function (s) { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * s; };
}
// How far the factory AFM curve under-reads with a larger intake housing (simulation only).
function intakeError(hz) { return interp1([2000, 3000, 4500, 6000, 8000, 10000], [0.035, 0.085, 0.095, 0.075, 0.06, 0.05], hz); }


/**
 * Builds a simulated KTuner-style CSV. opts.ecuTable overrides the AFM table
 * the simulated ECU uses (lets tests check that a correction converges).
 */
function sampleCsv (id, opts) {
  opts = opts || {};
  var sc = { before: { seed: 11, corrected: false, ovs: 2.1, hot: false }, after: { seed: 23, corrected: true, ovs: 1.1, hot: false }, hot: { seed: 37, corrected: true, ovs: 1.3, hot: true } }[id];
  if (!sc) throw new Error('Unknown sample: ' + id);
  var rnd = mulberry32(sc.seed), g = gaussFrom(rnd);
  var hzAx = REF.maf.hz, fac = REF.maf.factory;
  var trueTab = fac.map(function (v, k) { return v * (1 + intakeError(hzAx[k])); });
  var ecuTab = opts.ecuTable || (sc.corrected
    ? fac.map(function (v, k) { return v * (1 + intakeError(hzAx[k]) + 0.011 * Math.sin(hzAx[k] / 700)); })
    : fac.slice());
  var diRpm = REF.di.rpm, di = REF.di.values;
  function diTarget(rpm, col) { var r = locate(diRpm, rpm); return di[Math.min(r.i + (r.f > 0.5 ? 1 : 0), di.length - 1)][col]; }
  var segs = [['idle', 45], ['city', 170], ['highway', 100], ['decel', 7], ['wot', 7.5], ['cruise', 70], ['wot', 7.5], ['decel', 7], ['city', 60], ['idle', 25]];
  var dt = 0.1, t = 0;
  var amb = sc.hot ? 36 : 31;
  var st = { ltft: 0, lam: 1, iat: amb + (sc.hot ? 20 : 9), ect: sc.hot ? 98 : 88, cvt: sc.hot ? 95 : 72, kc: sc.hot ? 0.52 : 0.46, boost: -8, kr: [0, 0, 0, 0], lamQ: [], tReach: -1, pull: 0 };
  var head = ['Time (s)', 'Engine Speed (rpm)', 'Vehicle Speed (km/h)', 'Throttle Position (%)', 'MAP (kPa)', 'Boost (psi)', 'Boost Target (psi)',
    'MAF (Hz)', 'MAF (g/s)', 'AFR', 'AFR Command', 'STFT (%)', 'LTFT (%)', 'Ignition Timing (deg)',
    'Knock Retard Cyl1 (deg)', 'Knock Retard Cyl2 (deg)', 'Knock Retard Cyl3 (deg)', 'Knock Retard Cyl4 (deg)', 'Knock Control',
    'IAT (C)', 'ECT (C)', 'CVT Temp (C)', 'Fuel Pressure (kPa)', 'Fuel Pressure Target (kPa)'];
  var out = [head.join(',')];
  segs.forEach(function (seg) {
    var kind = seg[0], dur = seg[1], steps = Math.round(dur / dt);
    if (kind === 'wot') { st.pull++; st.tReach = -1; }
    for (var s = 0; s < steps; s++) {
      var u = s * dt, rpm, tps, vss, mapK, target;
      if (kind === 'idle') { rpm = 720 + g(10); tps = 0; vss = 0; mapK = 33 + g(0.5); }
      else if (kind === 'city') {
        rpm = 1650 + 420 * Math.sin(u / 3.7) + 260 * Math.sin(u / 1.9 + 1) + g(12);
        tps = clamp(14 + 7 * Math.sin(u / 3.1) + 5 * Math.sin(u / 1.3 + 0.5) + g(0.3), 3, 32);
        vss = clamp(rpm * 0.024, 5, 70); mapK = 30 + tps * 1.9 + g(0.7);
      } else if (kind === 'highway' || kind === 'cruise') {
        var base = kind === 'highway' ? 2350 : 2100;
        rpm = base + 170 * Math.sin(u / 9) + 90 * Math.sin(u / 2.3) + g(9);
        tps = clamp((kind === 'highway' ? 20 : 16) + 5 * Math.sin(u / 6) + 3 * Math.sin(u / 1.7) + g(0.25), 8, 34);
        vss = rpm * 0.033; mapK = 36 + tps * 1.75 + g(0.7);
      } else if (kind === 'decel') { rpm = 2600 - 1300 * (u / dur); tps = 0; vss = rpm * 0.03; mapK = 22 + g(0.4); }
      else {
        var x = u / dur;
        rpm = 2400 + 3800 * Math.pow(x, 1.15) + g(6);
        tps = u < 0.25 ? 20 + (u / 0.25) * 80 : 100;
        vss = rpm * 0.0175;
        target = refBoostAt(rpm) - (rpm >= 2500 && rpm <= 3250 && sc.corrected ? 0.5 : 0);
        var spool = interp1([2000, 2400, 2800, 3200, 3600, 5500, 6200, 6600], [6, 12, 18.5, 22.5, 23.5, 23.5, 22.2, 21.4], rpm);
        st.boost += (Math.min(target, spool) - st.boost) * Math.min(1, dt / 0.3);
        if (st.tReach < 0 && st.boost >= target - 0.3) st.tReach = u;
        var spike = st.tReach >= 0 ? sc.ovs * Math.exp(-(u - st.tReach) / 0.45) : 0;
        mapK = 101.3 + (st.boost + spike) * 6.895 + g(0.6);
      }
      if (kind !== 'wot') { st.boost = (mapK - 101.3) / 6.895; target = st.boost + 0.3 + g(0.1); }
      var boost = (mapK - 101.3) / 6.895;
      var isWot = kind === 'wot' && tps > 60;

      // airflow: what the engine really breathes, what the sensor reports, what the ECU believes
      var air = 0.01132 * rpm * (mapK / 101.3) * (0.93 + 0.05 * Math.sin(rpm / 1400));
      var hz = clamp(invert(hzAx, trueTab, air) + g(6), hzAx[0], hzAx[hzAx.length - 1]);
      var ecuAir = interp1(hzAx, ecuTab, hz);
      var ratio = air / ecuAir;

      var fpCol = isWot ? 9 : (kind === 'idle' ? 3 : 5);
      var fpT = diTarget(rpm, fpCol);
      var fpR = isWot ? (sc.hot ? 0.97 - 0.12 * clamp((rpm - 4200) / 1800, 0, 1) : 0.978) + g(0.004) : 0.99 + g(0.004);

      var lamCmd = 1, stft = 0, lamTarget = 1;
      if (isWot) {
        lamCmd = (u < 0.55 ? 11.5 : 11.0) / GAS;
        lamTarget = lamCmd * ratio / Math.sqrt(fpR);
      } else if (kind === 'decel') { lamTarget = 2.4; }
      else {
        var need = (ratio - 1) * 100;
        st.ltft += (need - st.ltft) * dt / 45;
        var trans = (kind === 'city' && Math.abs(Math.sin(u / 1.3)) > 0.97) ? g(2.5) : 0;
        stft = ((1 + need / 100) / (1 + st.ltft / 100) - 1) * 100 + g(1.1) + trans;
        lamTarget = 1 + g(0.006);
      }
      st.lamQ.push(lamTarget);
      var delayed = st.lamQ.length > 2 ? st.lamQ[st.lamQ.length - 3] : lamTarget;
      st.lam += (delayed - st.lam) * Math.min(1, dt / 0.15);

      // knock
      for (var c = 0; c < 4; c++) st.kr[c] = Math.max(0, st.kr[c] - 1.0 * dt);
      if (isWot) {
        if (sc.hot && rpm > 3300 && rpm < 5000) {
          var base2 = [2.4, 4.1, 3.6, 1.7];
          for (c = 0; c < 4; c++) st.kr[c] = Math.max(st.kr[c], base2[c] + g(0.3));
          st.kc = Math.min(0.82, st.kc + 0.004);
        } else if (rnd() < 0.015) { st.kr[Math.floor(rnd() * 4)] = 0.6 + rnd() * 0.3; }
      }
      var krMax = Math.max.apply(null, st.kr);
      var ign = isWot ? 3 + ((rpm - 2400) / 3800) * 9 - krMax + g(0.2) : (kind === 'decel' ? 5 : 31 - tps * 0.3 + g(0.4));

      // heat
      var iatGoal = amb + (kind === 'idle' ? 15 : (kind === 'city' ? 9 : 6)) + (sc.hot ? 18 : 0);
      if (isWot) st.iat += 0.6 * dt; else st.iat += (iatGoal - st.iat) * dt / 40;
      var ectGoal = (sc.hot ? 100 : 89) + (isWot ? 3 : 0) + 1.5 * Math.sin(t / 60);
      st.ect += (ectGoal - st.ect) * dt / 25;
      var cvtGoal = (sc.hot ? 101.5 : 86) + (isWot ? 4 : 0);
      st.cvt += (cvtGoal - st.cvt) * dt / 90;

      out.push([
        t.toFixed(1), Math.round(rpm), Math.round(vss), tps.toFixed(1), mapK.toFixed(1), boost.toFixed(1), (isNum(target) ? target : boost).toFixed(1),
        Math.round(hz), ecuAir.toFixed(2), (st.lam * GAS).toFixed(2), (lamCmd * GAS).toFixed(2), stft.toFixed(1), st.ltft.toFixed(1), ign.toFixed(1),
        st.kr[0].toFixed(1), st.kr[1].toFixed(1), st.kr[2].toFixed(1), st.kr[3].toFixed(1),
        // A real Knock Control channel steps in 0.01 moves even on a happy drive; a frozen
        // value for minutes is a dead channel, and the quality gate reads it as one.
        (st.kc + (Math.floor(t * 10) % 41 < 6 ? 0.01 : 0)).toFixed(2),
        Math.round(st.iat), Math.round(st.ect), Math.round(st.cvt), Math.round(fpT * fpR), Math.round(fpT)
      ].join(','));
      t += dt;
    }
  });
  return out.join('\n');
}

module.exports = { sampleCsv };

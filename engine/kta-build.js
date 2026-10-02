/*!
 * KTA build path: which mods to do on THIS car, in what order, and what each one changes in KTuner.
 *
 * Built on kta-drive.js (window.KTA / require). Pure functions, no DOM.
 *   KTA.build.mapFacts(map)        numbers read straight off the owner's digitized KTuner map
 *   KTA.build.plan(report, map)    ranked mods: do now / later (locked, with the reason) / not for this car
 *   KTA.build.afmCompare(map)      what the PRL Race AFM preset does on a street housing (the CEL story)
 *   KTA.build.SIMPLE               the do / do-not list of a simple, no-dyno tune
 *   KTA.build.ITEMS, CLAIMS, SOURCES   the researched data behind it (fetched 2026-10-01)
 *
 * Every table an item names must exist in the map file (test/build.test.js checks it).
 * KTuner features that are not tables in the file (sensor disables, 4-bar MAP support) are listed apart.
 * Gains are the vendors' own dyno claims unless the source says otherwise; confidence says how far to trust them.
 */
(function (root, factory) {
  var K = typeof module === 'object' && module.exports ? require('./kta-drive.js') : root.KTA;
  var api = factory(K);
  if (typeof module === 'object' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (KTA) {
  'use strict';
  var isNum = KTA.util.isNum;
  var B = KTA.build = {};

  // Sources, fetched with crawl4ai on 2026-10-01 unless noted. civicx / civicxi forums, honda-tech,
  // hondata.com and reddit block crawlers (Cloudflare): those are search snippets only, marked as such.
  B.SOURCES = {
    tsp: { name: 'TSP Stage 1 tune, 2022+ Civic 1.5T non-Si', kind: 'tuner', url: 'https://www.twostepperformance.com/products/tsp-stage-1-tune-for-2022-honda-civic-1-5t-non-si' },
    ktuner: { name: 'KTuner 22+ Civic 1.5T basemaps', kind: 'tuner', url: 'https://ktuner.com/22civicturbo/' },
    phearable: { name: 'Phearable Stage 1.5, 11th gen non-Si', kind: 'tuner', url: 'https://www.phearable.net/tuning-software/11th-gen-civic/11th-gen-civic-non-si/stage1-5-nonsi-11thgen.html' },
    hondata: { name: 'Hondata FlashPro Civic 1.5T 2022+ (search snippet; site blocks crawlers)', kind: 'tuner', url: 'https://www.hondata.com/flashpro-civic-2022' },
    won27dp: { name: '27WON 80 mm catted downpipe, 11th gen', kind: 'vendor', url: 'https://store.27won.com/2022-civic-turbo-performance-downpipe-11th-gen.html' },
    tspdp: { name: 'TSP high-efficiency catted downpipe', kind: 'vendor', url: 'https://www.twostepperformance.com/products/high-efficiency-downpipe-upgrade-for-2022-honda-civic-1-5t-2023-acura-integra-1-5t-2018-honda-accord-1-5t' },
    won300: { name: '27WON: 300 whp on the 2022+ L15', kind: 'vendor', url: 'https://www.27won.com/blog/how-to-safely-and-cost-effectively-hit-300whp-on-your-2022-civic-or-integra-with-the-l15-engine' },
    gin: { name: '27WON GIN drop-in turbo', kind: 'vendor', url: 'https://store.27won.com/2022-civic-integra-1-5t-turbocharger-upgrade.html' },
    map4: { name: '27WON 4-bar MAP sensor', kind: 'vendor', url: 'https://store.27won.com/4-bar-map-sensor.html' },
    prlTurbo: { name: 'PRL 4847RS drop-in turbo dyno blog', kind: 'vendor', url: 'https://prlmotorsports.com/blogs/news/prl-1-5t-turbo-blog' },
    rv6: { name: 'TSP: R365 vs GIN overview (RV6 R365 RED results)', kind: 'vendor', url: 'https://www.twostepperformance.com/blogs/tsp-product-info/r365-vs-gin-an-overview' },
    rv6page: { name: 'RV6 R365 RED, 2022+ Civic 1.5T (discontinued)', kind: 'vendor', url: 'https://rv6-p.com/products/rv6-r365-red-ball-bearing-turbo-for-1-5t-civicxi' },
    phearGuide: { name: 'Phearable 11th gen 1.5T modification guide', kind: 'tuner', url: 'https://www.phearable.net/information/tech-area/11th-gen-civic-modification-guide.html' },
    cvtForum: { name: 'CivicX/CivicXI CVT threads (search snippets; forums block crawlers)', kind: 'forum', url: 'https://www.civicxi.com/forum/threads/w1-turbo-on-cvt-car-dyno-test-results-database.37567/' },
    thai: { name: 'Thai FE build clip, Flash Racing (TikTok; search snippet)', kind: 'social', url: 'https://www.tiktok.com/@thanakitsukbaiyen/video/7553119789711969553' },
    e10: { name: 'Vietnam E10 from 1 June 2026 (Circular 50/2025/TT-BCT)', kind: 'official', url: 'https://b-company.jp/from-ron95-to-e10-vietnams-biofuel-shift-and-its-impact-on-fuel-retail-and-mobility/' },
    log: { name: 'Your own TunerView logs (this app\'s engine)', kind: 'log', url: '' },
    file: { name: 'Your digitized KTuner map (data/ktuner-maps-digitized.json)', kind: 'log', url: '' }
  };

  /** Numbers read off the map file, so every claim about "your map" is checked, not typed. */
  B.mapFacts = function (map) {
    var T = (map && map.tables) || {};
    function max(id) { var t = T[id]; return t ? Math.max.apply(null, [].concat.apply([], t.values)) : null; }
    function afmEnd(id) { var t = T[id]; return t ? { hz: t.rpm_axis[t.rpm_axis.length - 1], gs: t.values[0][t.values[0].length - 1] } : null; }
    return {
      normalPeak: max('Boost_Target_1_Normal_H'), ecoPeak: max('Boost_Target_1_ECO_H'), finalPeak: max('Final_Boost_Target_H'),
      gearLimit: max('Boost_By_Gear_Limits'), diMax: max('DI_Fuel_Pressure_Target_0pct'),
      afm: { factory: afmEnd('MAF_Scaling_Factory'), prl: afmEnd('MAF_Scaling_PRL_Race'), won: afmEnd('MAF_Scaling_27Won_Race') }
    };
  };

  /**
   * What a wrong AFM preset does: the same sensor Hz read through a Race curve instead of the factory one.
   * ratio = Race g/s ÷ factory g/s. The ECU fuels for that phantom air, so trims must pull 1/ratio − 1 to compensate:
   * far past the trim limit, hence the "too rich" / AFM range codes on a street housing (PRL HVI) with the PRL Race preset.
   */
  B.afmCompare = function (map, hzs) {
    var T = (map && map.tables) || {}, f = T.MAF_Scaling_Factory, p = T.MAF_Scaling_PRL_Race;
    if (!f || !p) return [];
    return (hzs || [2500, 4375, 6718.75, 10000]).map(function (hz) {
      var i = f.rpm_axis.indexOf(hz), fg = f.values[0][i], pg = p.values[0][i], ratio = pg / fg;
      return { hz: hz, factory: fg, prl: pg, ratio: Math.round(ratio * 100) / 100, trim: Math.round((1 / ratio - 1) * 1000) / 10 };
    });
  };

  /** Rule of thumb, petrol: crank hp ≈ 1.32 × g/s (10 hp per lb/min of air). CVT and wheels take about 15 %. */
  B.airFor = function (whp) { return Math.round(whp / 0.85 / 1.32); };

  // effect, effort, risk: 1 low … 3 high. Same scoring idea as the Drive check: 3·effect − 2·effort − 2·risk.
  // tables: sheets in YOUR file this item changes or must be checked. features: KTuner settings that are not tables in the file.
  B.ITEMS = [
    {
      id: 'ic', title: 'Front-mount intercooler (and charge pipe)', effect: 2, effort: 2, risk: 1,
      gain: '+15 whp claimed by 27WON; in heat, the bigger win is holding power pull after pull', sources: ['won300', 'phearGuide'],
      tables: [{ id: 'WOT_Enrich_H', what: 'Check only: full-load mixture stays on target' }],
      features: [], change: 'No table change. Cooler intake air means knock control pulls less timing.',
      prove: 'Same hot route: intake air in pulls drops, Knock Control rise shrinks.',
      steps: ['Fit it, then pressure-test the charge pipes: a boost leak reads as a lean, weak car.', 'Keep your map. Log the same hot route as before (after traffic, 5 min cruise first).', 'Compare intake air at the start of each pull and the Knock Control rise.']
    },
    {
      id: 'dpCat', title: 'High-flow catted downpipe + front pipe', effect: 2, effort: 2, risk: 1,
      gain: '+12 whp / +13 lb-ft on the stock map (27WON dyno, no tune)', sources: ['won27dp', 'tspdp'],
      tables: [
        { id: 'Boost_Target_1_Normal_L', what: 'Only if boost overshoots > +2.5 psi: −1 psi at 2,500-3,250 rpm' },
        { id: 'Boost_Target_1_Normal_H', what: 'Same cells, high cam' },
        { id: 'Final_Boost_Target_H', what: 'Leave stock' }
      ],
      features: ['Catalyst / rear O2 monitor: some catted pipes still set a code; KTuner can turn the monitor off (TSP\'s 400-cell pipe claims no code)'],
      change: 'Turbo spools sooner on the same map. The front A/F sensor now sits in the new pipe: no leaks upstream.',
      prove: 'Boost overshoot stays under +2.5 psi; full-load mixture still on target.',
      steps: [
        'New gaskets at both flanges: the factory A/F sensor sits in the downpipe, so any leak ahead of it reads lean.',
        'Keep your map. Log two pulls on a cool morning.',
        'Boost overshoot over +2.5 psi: lower Boost Target Normal (L and H) by 1 psi at 2,500-3,250 rpm only, flash, log again.',
        'Full-load AFR still at or richer than 12.0 and cruise trims inside ±5 %: done. Nothing else changes.',
        'Catalyst code (P0420): pick a high-cell catted pipe first; turning the monitor off in KTuner is the last resort.'
      ]
    },
    {
      id: 'map24', title: '24 psi map (TSP Map 3, Phearable Level 3)', effect: 2, effort: 1, risk: 3,
      gain: 'TSP: 154 → 191 whp on a stock CVT car (all maps, output limited for the CVT)', sources: ['tsp', 'phearable'],
      tables: [
        { id: 'Boost_Target_1_Normal_H', what: '+3 psi over your 21 psi peak' },
        { id: 'Final_Boost_Target_H', what: 'Tops out lower than 24 in your file: must rise too (custom work)' },
        { id: 'Cylinder_Fill_Limitation_H', what: 'Load ceiling: likely must rise' }
      ],
      features: ['Stock MAP sensors read to about 26-28 psi: 24 psi is still inside them'],
      change: 'Asks the stock turbo for 3 psi more than your map does.',
      prove: 'Only after the turbo shows headroom and a hot log stays OK.',
      lock: function (I, F) {
        var out = [];
        if (I.boost && I.boost.headroom === 'small') out.push('turbo');
        if (F && isNum(F.finalPeak) && F.finalPeak < 24) out.push('final');
        out.push('octane');
        return out;
      }
    },
    {
      id: 'bigTurbo', title: 'Drop-in big turbo for 300 hp (PRL 4847RS, 27WON GIN)', effect: 3, effort: 3, risk: 3,
      gain: 'PRL: 308 whp / 304 lb-ft at 26.4 psi on 93 octane, a MANUAL car with a Type R clutch. RV6 R365 RED: 281 whp on 93 (discontinued)', sources: ['prlTurbo', 'gin', 'rv6', 'rv6page', 'won300'],
      tables: [
        { id: 'MAF_Scaling_PRL_Race', what: 'Race housing curve: the factory curve ends near the airflow 300 whp needs' },
        { id: 'Boost_Target_1_Normal_H', what: 'Rebuilt by a tuner (26-30 psi)' },
        { id: 'Final_Boost_Target_H', what: 'Rebuilt' },
        { id: 'Cylinder_Fill_Limitation_H', what: 'Raised' },
        { id: 'DI_Fuel_Pressure_Target_0pct', what: 'Already at the 18,000 kPa top: fuel is the next wall' }
      ],
      features: ['4-bar MAP sensors (2) above about 26-28 psi; KTuner supports them on the 22+ non-Si', 'Custom tune, not a basemap, once the intake is a Race / big-bore housing', '5W-30 oil (RV6 requires 0W-30 or 5W-30)'],
      change: 'A different turbo: every boost, load and airflow table is rebuilt by a tuner.',
      prove: 'Dyno or a tuner\'s log review; not a road job.',
      lock: function () { return ['cvt', 'octane', 'custom']; },
      notForThisCar: true
    },
    {
      id: 'catless', title: 'Catless downpipe', effect: 2, effort: 2, risk: 3,
      gain: 'A few hp over a high-flow catted pipe', sources: ['won27dp'],
      tables: [], features: ['Catalyst monitor and rear O2 disabled in KTuner'],
      change: 'Sets P0420 unless the monitor is turned off, and fails the đăng kiểm emissions test.',
      prove: '', notForThisCar: true
    }
  ];

  // Claims people repeat, checked. verdict: true | partly | unverified | wrongForYou. conf: high | medium | low.
  B.CLAIMS = [
    { id: 'tsp24', claim: 'TSP Stage 1 for the non-Si CVT has a 24 psi map', verdict: 'true', conf: 'high', src: ['tsp'],
      note: 'Map 3: 24 psi in Normal/Sport, 16.5 psi in ECO. Map 2: 16.5 psi. Premium 91/93 required, no E85.' },
    { id: 'ktuner', claim: 'KTuner basemaps: Starter 16.5, 18 and 21 psi', verdict: 'true', conf: 'high', src: ['ktuner'],
      note: 'Starter 18 (Stage 1): up to +30 whp. Starter 21 (Stage 2): up to +55 whp. "Running 91+ will give the best results." Your file is Starter 21 Dual Tune 2.' },
    { id: 'phear', claim: 'Phearable Stage 1.5 runs about 16.4 / 18 / 23-24 psi', verdict: 'true', conf: 'high', src: ['phearable'],
      note: '194 hp / 237 lb-ft on a stock 2022 non-Si CVT. 93 recommended, 91 the absolute minimum.' },
    { id: 'hondata', claim: 'Hondata basemap: +34 hp / +50 lb-ft on the CVT', verdict: 'unverified', conf: 'low', src: ['hondata'],
      note: 'Search snippet only; hondata.com blocks crawlers.' },
    { id: 'ron', claim: 'Vietnam E10 RON95 is "premium" like US 91/93', verdict: 'partly', conf: 'medium', src: ['e10'],
      note: 'E10RON95 is still RON 95. US pumps show (RON+MON)/2, so RON 95 is about US 91: the floor of those maps, not 93.' },
    { id: 'turbo21', claim: 'The stock turbo can run the 21-24 psi maps', verdict: 'wrongForYou', conf: 'high', src: ['log'],
      note: 'In your hard-pull drive the wastegate is about 3 % open at the boost peak: the stock turbo is near its limit before your 21 psi target.' },
    { id: 'dp12', claim: 'A catted downpipe adds about 12 whp with no tune', verdict: 'true', conf: 'medium', src: ['won27dp'],
      note: 'Vendor dyno (+12 whp / +13 lb-ft). 27WON says a code (CEL) will come on; TSP says theirs will not.' },
    { id: 'map28', claim: 'Stock MAP sensors stop reading at about 26-28 psi', verdict: 'true', conf: 'high', src: ['won300', 'rv6', 'map4'],
      note: 'Two vendors agree. 4-bar sensors read to about 45 psi and must be enabled in KTuner (supported on the 22+ non-Si).' },
    { id: 'p300', claim: 'A drop-in turbo makes 300 whp on this engine', verdict: 'partly', conf: 'medium', src: ['prlTurbo', 'rv6', 'won300'],
      note: 'PRL 308 whp and RV6 281 whp on 93 octane; 335-341 whp on E26-E30. All shown on manual cars. 27WON: "With 91 octane, sometimes you just can\'t reach 300WHP."' },
    { id: 'cvt300', claim: 'The CVT survives 300 whp', verdict: 'unverified', conf: 'low', src: ['cvtForum', 'prlTurbo'],
      note: 'Community figure: about 250-260 lb-ft at the wheels. PRL\'s 300 whp car made 304 lb-ft on a manual; buyers asked them to test a CVT and no result is published.' },
    { id: 'thai', claim: 'Thai FE: stock turbo + intercooler + downpipe + E20 remap = 237 hp / 350 Nm', verdict: 'unverified', conf: 'low', src: ['thai'],
      note: 'One shop clip, no dyno sheet. E20 is not sold in Vietnam.' }
  ];

  var LOCKS = {
    turbo: function (I) { return 'Your turbo is near its limit: wastegate ' + I.boost.wgAtPeak + ' % open at ' + I.boost.peakBoost + ' psi.'; },
    final: function (I, F) { return 'Final Boost Target in your file tops out at ' + F.finalPeak + ' psi.'; },
    octane: function () { return 'E10 RON95 ≈ US 91: the minimum for these maps, in tropical heat.'; },
    cvt: function () { return 'No published CVT result at this power; the CVT figure is about 250-260 lb-ft at the wheels.'; },
    custom: function () { return 'Needs 4-bar MAP sensors and a custom tune from a tuner.'; }
  };
  B.lockText = function (id, I, F) { return LOCKS[id] ? LOCKS[id](I, F) : id; };

  // "Simple tune": what a pro changes on this car without a dyno, and what stays with the basemap.
  B.SIMPLE = {
    doList: [
      'Flash a basemap made for your fuel: E10 RON95 ≈ US 91, so 16.5-18 psi maps (KTuner Starter 16.5/18, TSP Map 2). ECO keeps a lower boost for hot days.',
      'Pick the AFM curve that matches the housing: PRL HVI and other street housings = Factory. A Race preset only with a Race housing.',
      'Use KTuner Quick Adjustments for throttle and turbo response: the feel without touching tables.',
      'Log once after every change: trims, full-load AFR, Knock Control, boost vs target, intake air.'
    ],
    dontList: [
      'Hand-edit ignition: best timing needs a dyno; on the road, only take timing away where the log shows knock.',
      'Change AFR targets to fix a trim error: fix the airflow (AFM) first.',
      'Correct E10\'s small extra fuel in the AFM table: the ECU works in lambda and the trims cover it.',
      'Touch DI fuel pressure, cylinder fill, boost-by-gear or knock sensitivity: those are the ECU\'s guards for the engine and the CVT.'
    ]
  };

  function score(it) { return 3 * it.effect - 2 * it.effort - 2 * it.risk; }

  /** Rank the items for one drive report and the map: now (do), later (locked, with reasons), no (not for this car). */
  B.plan = function (report, map) {
    var I = (report && report.ins) || {}, F = B.mapFacts(map), out = { now: [], later: [], no: [], facts: F };
    B.ITEMS.slice().sort(function (a, b) { return score(b) - score(a); }).forEach(function (it) {
      var row = { item: it, score: score(it), locks: it.lock ? it.lock(I, F) : [] };
      (it.notForThisCar ? out.no : row.locks.length ? out.later : out.now).push(row);
    });
    return out;
  };

  return KTA;
}));

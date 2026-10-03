'use strict';
/* Scratch: the owner's 9 Drives through settle → next step, the engine only. */
const zlib = require('zlib');
const K = require('../../engine/kta-car.js');
const IDS = ['aug22-0903', 'aug22-0950', 'aug23-1959', 'aug23-2038', 'aug30-1509', 'aug30-1529', 'aug30-1601', 'sep01-0813', 'sep05-0756'];
for (const id of IDS) require('../../data/example-' + id + '.js');
const csv = (id) => zlib.gunzipSync(Buffer.from(globalThis.KTA_EXAMPLES[id].gz, 'base64')).toString('utf8');
const NAME = {
  'aug22-0903': 'TunerView_20260822_090322.csv', 'aug22-0950': 'TunerView_20260822_095021.csv',
  'aug23-1959': 'TunerView_20260823_195901.csv', 'aug23-2038': 'TunerView_20260823_203853.csv',
  'aug30-1509': 'TunerView_20260830_150925.csv', 'aug30-1529': 'TunerView_20260830_152931.csv',
  'aug30-1601': 'TunerView_20260830_160151.csv', 'sep01-0813': 'TunerView_20260901_081358.csv',
  'sep05-0756': 'TunerView_20260905_075634.csv'
};
const NOW = 1756723200000;

let state = K.carEmpty();
let steps = [];
const rows = [];
for (const id of IDS) {
  const out = K.carIngest(state, K.readLog(csv(id)), { fileName: NAME[id], now: NOW });
  state = out.state;
  const driveId = out.report.identity;
  const settled = K.carSettle(state, driveId, steps);
  steps = settled.openSteps;
  const decided = K.carNextStep(state, driveId, steps);
  steps = decided.openSteps;
  const w = settled.wasted;
  rows.push({
    drive: id,
    settled: settled.settled.map((r) => `${r.key}:${r.status} ${r.why}`),
    wasted: w.wasted ? `${w.reason} → ${w.would} would have settled ${w.proves}` : '',
    step: `${decided.step.key}/${decided.step.kind}${decided.step.same ? ' (same)' : ''} — ${decided.step.title}`,
    also: decided.step.also,
    cause: decided.step.cause ? decided.step.cause.why : '',
    gauges: decided.step.gauges.join(','),
    proves: decided.step.proves,
    upload: decided.step.settlesOn,
    open: steps.map((s) => `${s.key}:${s.status}`).join(' ')
  });
}
for (const r of rows) {
  console.log('='.repeat(78));
  console.log(r.drive);
  r.settled.forEach((x) => console.log('   settled  ' + x));
  if (r.wasted) console.log('   WASTED   ' + r.wasted);
  console.log('   step     ' + r.step + (r.also ? '  [also ' + r.also + ']' : ''));
  if (r.cause) console.log('   cause    ' + r.cause);
  console.log('   gauges   ' + r.gauges);
  console.log('   proves   ' + r.proves);
  console.log('   upload   ' + r.upload);
  console.log('   open     ' + r.open);
}

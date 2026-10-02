'use strict';
// End-to-end check of the standalone app in Chromium.
// Run: npm run e2e   (needs Playwright: npm i -D playwright, or a global install via NODE_PATH)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('playwright');
const K = require('../engine/kta-engine.js');

const APP = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function run() {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errors = [];
  const results = [];
  const step = async (name, fn) => {
    try { await fn(); results.push('ok   ' + name); } catch (e) { results.push('FAIL ' + name + '\n     ' + e.message); process.exitCode = 1; }
  };

  // ---------------------------------------------------------------- Drive check
  const dp = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  dp.on('pageerror', (e) => errors.push('drive: ' + e.message));
  await dp.goto(APP);
  await dp.evaluate(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
  await dp.reload();
  await dp.waitForSelector('.step-head h1');
  const noOverflow = async (pg) => assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);

  await step('first visit opens the Drive check', async () => {
    assert.equal(await dp.textContent('.step-head h1'), 'Drive, check, do one thing, prove it');
    assert.equal(await dp.locator('.ex-card').count(), 3);
  });

  await step('Drive check: the hot drive ranks "keep the revs up" first, safety says Watch', async () => {
    await dp.click('[data-act="example"][data-arg="aug30-1601:current"]');
    await dp.waitForSelector('.now-card', { timeout: 30000 });
    assert.equal(await dp.textContent('.act-title'), 'Keep the revs up in hot traffic');
    assert.match(await dp.textContent('.safe-card'), /Spark\s*Watch/);
    const queue = await dp.textContent('main');
    for (const part of ['Cool the intake before a pull', 'Protect the CVT when it is hot', 'Log the channels that are missing', 'Gain lever 2', 'Correct the AFM Flow table']) assert.ok(queue.includes(part), part);
    assert.ok(await dp.locator('.lock-row').count() >= 3);
  });

  await step('Drive check: engineering graphs draw with finite geometry, and explain themselves', async () => {
    await dp.click('#block-eng > summary');
    for (const id of ['kc', 'timing', 'afr', 'accel']) {
      const svg = await dp.innerHTML('#graph-' + id + ' svg');
      assert.ok(svg.length > 500 && !/NaN|Infinity|undefined/.test(svg), id);
    }
    await dp.click('#graph-kc [data-act="explain"]');
    assert.match(await dp.textContent('#graph-kc .explain'), /steps up happened while lugging/);
  });

  await step('Drive check: start the #1, prove it with a cooler drive: cannot tell', async () => {
    await dp.click('.now-card [data-act="startAction"]');
    await dp.waitForSelector('#prove');
    await dp.click('#prove [data-act="example"][data-arg="sep01-0813:next"]');
    await dp.waitForSelector('.prove-verdict', { timeout: 30000 });
    assert.match(await dp.textContent('.prove-verdict'), /Cannot tell from these two drives/);
    assert.match(await dp.textContent('#prove'), /much cooler/);
    await dp.click('[data-act="proofAgain"]');
    assert.equal(await dp.locator('.prove-verdict').count(), 0);
  });

  await step('Drive check: the action in progress survives a reload', async () => {
    await dp.reload();
    await dp.waitForSelector('#prove');
    assert.match(await dp.textContent('.loop3'), /Doing now: Keep the revs up/);
    await dp.click('[data-act="stopAction"]').catch(() => {});
  });

  await step('Drive check: a real TunerView CSV uploads (your 15:29 drive)', async () => {
    const ex = {};
    new Function('root', fs.readFileSync(path.join(__dirname, '..', 'data', 'example-aug30-1529.js'), 'utf8').replace('typeof globalThis !== \'undefined\' ? globalThis : this', 'root'))(ex);
    const file = path.join(os.tmpdir(), 'TunerView_20260830_152931.csv');
    fs.writeFileSync(file, zlib.gunzipSync(Buffer.from(ex.KTA_EXAMPLES['aug30-1529'].gz, 'base64')));
    if (await dp.locator('input[data-drive="current"]').count() === 0) await dp.click('[data-act="driveReset"]');
    await dp.setInputFiles('input[data-drive="current"]', file);
    await dp.waitForSelector('.now-card', { timeout: 30000 });
    assert.equal(await dp.textContent('.act-title'), 'Cool the intake before a pull');
    assert.match(await dp.textContent('main'), /Best 50→70 km\/h: 1\.\d\d s with your foot down/);
  });

  await step('Ask: a built-in answer without a key', async () => {
    await dp.click('.ask-sugg .chip-btn >> nth=2');
    await dp.waitForSelector('.answer');
    assert.match(await dp.textContent('.answer'), /Built-in answer/);
    assert.match(await dp.textContent('.answer p'), /^Not now\. More boost is locked until/);
  });

  await step('Ask: an AI answer goes through the tools and the number check (mocked API)', async () => {
    const seen = [];
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    await dp.route('https://api.anthropic.com/**', async (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      if (req.url().includes('/v1/models')) return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'mock-model', display_name: 'Mock model' }] }) });
      const body = JSON.parse(req.postData());
      seen.push({ headers: req.headers(), body });
      const kc = await dp.evaluate(() => window.KTA_APP.drives.current.report.ins.kc);
      const content = body.messages.length === 1
        ? [{ type: 'tool_use', id: 'tu1', name: 'get_insight', input: { topic: 'knock' } }]
        : [{ type: 'tool_use', id: 'tu2', name: 'submit_answer', input: { answer: 'Knock Control went from ' + kc.start + ' to ' + kc.end + ' in this drive.', action_ids: [], confidence: 'high' } }];
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ id: 'm', type: 'message', role: 'assistant', content, stop_reason: 'tool_use' }) });
    });
    await dp.click('#ai-settings summary');
    await dp.fill('#ai-key', 'sk-test-not-real');
    await dp.click('[data-act="loadModels"]');
    await dp.waitForFunction(() => window.KTA_APP.state.ai.model === 'mock-model');
    await dp.fill('#ask-q', 'Why did Knock Control move?');
    await dp.click('.ask-form button[type="submit"]');
    await dp.waitForSelector('.answer.is-ai', { timeout: 15000 });
    assert.match(await dp.textContent('.answer'), /Every number checked against this drive/);
    assert.equal(seen.length, 2);
    assert.equal(seen[0].headers['x-api-key'], 'sk-test-not-real');
    assert.equal(seen[0].headers['anthropic-dangerous-direct-browser-access'], 'true');
    assert.equal(seen[0].body.model, 'mock-model');
    assert.ok(!JSON.stringify(seen[1].body).includes('"lam"'), 'no raw log channels are sent');
    await dp.unroute('https://api.anthropic.com/**');
    await dp.fill('#ai-key', '');
  });

  await step('Drive check in Vietnamese', async () => {
    await dp.click('[data-act="lang"]');
    assert.equal(await dp.textContent('.step-head h1'), 'Chạy, kiểm tra, làm một việc, chứng minh');
    assert.equal(await dp.textContent('.act-title'), 'Làm mát khí nạp trước khi kéo ga');
    await dp.click('[data-act="lang"]');
  });

  await step('phone width: the Drive check has no sideways scrolling', async () => {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    phone.on('pageerror', (e) => errors.push('phone drive: ' + e.message));
    await phone.goto(APP + '?drive=aug30-1601#drive');
    await phone.waitForSelector('.now-card', { timeout: 30000 });
    await noOverflow(phone);
    await phone.close();
  });

  // ---------------------------------------------------------------- Car history story (blocks 0-8) and charts
  const car = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  car.on('pageerror', (e) => errors.push('car: ' + e.message));
  await car.goto(APP);
  await car.evaluate(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
  await car.reload();
  await car.waitForSelector('.step-head h1');
  const carExample = async (id) => {
    await car.click('[data-act="driveReset"]').catch(() => {});
    await car.click('[data-act="example"][data-arg="' + id + ':current"]');
    await car.waitForSelector('.now-card', { timeout: 30000 });
  };
  const carUpload = async (id, name, stop) => {
    const ex = {};
    new Function('root', fs.readFileSync(path.join(__dirname, '..', 'data', 'example-' + id + '.js'), 'utf8').replace('typeof globalThis !== \'undefined\' ? globalThis : this', 'root'))(ex);
    const file = path.join(os.tmpdir(), name);
    fs.writeFileSync(file, zlib.gunzipSync(Buffer.from(ex.KTA_EXAMPLES[id].gz, 'base64')));
    await car.click('[data-act="driveReset"]').catch(() => {});
    await car.setInputFiles('input[data-drive="current"]', file);
    await car.waitForSelector(stop ? '#block-paused' : '.now-card', { timeout: 30000 });
  };
  const blockOrder = () => car.evaluate(() => Array.from(document.querySelectorAll('main [data-block]')).map((e) => e.getAttribute('data-block')));

  await step('Car story: blocks arrive in contract order with answering first lines (Aug 30 16:01)', async () => {
    await carExample('aug30-1601');
    assert.deepEqual(await blockOrder(), ['1', '2', '3', '4', '5', '6', '7', '8']);
    assert.match(await car.textContent('#drive-card .drive-date'), /30 Aug · 16:01 · 5\d min · Hot · Traffic/);
    assert.match(await car.textContent('#block-safety .safe-line'), /Yes, with things to watch/);
    assert.equal(await car.textContent('.act-title'), 'Keep the revs up in hot traffic');
    assert.match(await car.textContent('#car-history .body-sm b'), /1 drive since .* · 0 Stops · Map not recorded before today/);
    assert.match(await car.textContent('#block-perf .lead-sm b'), /Best 50→70 km\/h \d+\.\d\d s/);
    assert.match(await car.textContent('[data-block="6"] .lead-sm b'), /up next · .* locked · .* fine/);
    assert.match(await car.textContent('#block-canttell .body-sm b'), /AFR command|Nothing missing/);
    assert.match(await car.textContent('#block-eng > summary'), /Engineering view/);
    assert.match(await car.textContent('.safety-line >> nth=2'), /costs about 1\.5° of timing/);
  });

  await step('Car story: at most 5 key moments with clock times, each opens its Why', async () => {
    const moms = await car.locator('.moment').count();
    assert.ok(moms >= 1 && moms <= 5, 'moments: ' + moms);
    const texts = await car.evaluate(() => Array.from(document.querySelectorAll('.moment')).map((e) => e.textContent));
    for (const m of texts) assert.match(m, /· \d/);
    assert.ok(texts.some((m) => /Hard pull/.test(m)), 'hard pulls first-ish: ' + texts.join(' | '));
    await car.click('.moment >> nth=0');
    await car.waitForSelector('#why');
    assert.match(await car.textContent('#why'), /Basis:/);
    assert.equal(await car.locator('#why .chart svg').count(), 2);
    await car.click('.moment >> nth=0');
  });

  await step('Car story: every verdict is icon + word, never colour alone', async () => {
    const pills = await car.evaluate(() => Array.from(document.querySelectorAll('#drive-card .pill, .safety-line .pill, #car-history .pill')).map((e) => ({
      svg: !!e.querySelector('svg.sicon'), text: e.textContent.trim(),
    })));
    assert.ok(pills.length > 5, 'pills: ' + pills.length);
    for (const p of pills) {
      assert.ok(p.svg, 'icon missing: ' + p.text);
      assert.match(p.text, /OK|Watch|Stop|Can't tell/);
    }
  });

  await step('Car charts: cool filled, hot hollow, dashed baseline, solid limits, stop ring', async () => {
    await carUpload('aug23-2038', 'TunerView_20260823_203853.csv', true);
    await car.click('[data-act="driveReset"]').catch(() => {});
    await carUpload('sep01-0813', 'TunerView_20260901_081358.csv');
    const enc = await car.evaluate(() => {
      const q = (sel) => Array.from(document.querySelectorAll(sel));
      const styleHas = (el, s) => (el.getAttribute('style') || '').includes(s);
      return {
        filled: q('[data-chart="kcPeak"] circle').filter((e) => styleHas(e, 'fill:var(--meas)')).length,
        hollow: q('.car-chart circle').filter((e) => styleHas(e, 'fill:var(--sheet);stroke:var(--meas)')).length,
        baseline: q('[data-chart="kcPeak"] line').filter((e) => styleHas(e, 'stroke:var(--axis)')).length,
        limits: q('.car-chart line').filter((e) => styleHas(e, 'stroke:var(--line-3)')).length,
        stopRing: q('[data-chart="trimWorst"] circle').filter((e) => styleHas(e, 'stroke:var(--stop-ic)')).length,
        stopCross: q('[data-chart="trimWorst"] path[style*="--stop-ic"]').length,
        grid: q('[data-chart="kcPeak"] line').filter((e) => styleHas(e, 'stroke:var(--grid)')).length,
        normal: document.body.textContent.includes('your normal 0.49'),
      };
    });
    assert.ok(enc.filled >= 1, 'cool filled dot: ' + JSON.stringify(enc));
    assert.ok(enc.hollow >= 1, 'hot hollow dot');
    assert.ok(enc.baseline >= 1, 'dashed baseline');
    assert.ok(enc.limits >= 4, 'solid limits');
    assert.ok(enc.stopRing >= 1 && enc.stopCross >= 1, 'stop ring + cross');
    assert.ok(enc.grid <= 3, 'at most 3 gridlines: ' + enc.grid);
    assert.ok(enc.normal, 'baseline labelled your normal');
    const tip = await car.evaluate(() => document.querySelector('[data-chart="trimWorst"] g[data-act="carOpen"] circle[data-tip]').getAttribute('data-tip'));
    assert.match(tip, /20:38|2038/);
    assert.match(tip, /Stop: trims/);
  });

  await step('Car charts: a flash draws one labelled line on all six charts', async () => {
    await car.click('#car-history [data-act="flashNew"]');
    await car.fill('#flash-form [data-flash="map"]', 'Starter 21');
    await car.fill('#flash-form [data-flash="time"]', '2026-08-23T12:00');
    await car.click('[data-act="flashSave"]');
    await car.waitForSelector('#car-history');
    const per = await car.evaluate(() => Array.from(document.querySelectorAll('.car-chart')).map((f) => ({
      c: f.getAttribute('data-chart'),
      n: Array.from(f.querySelectorAll('line')).filter((e) => (e.getAttribute('style') || '').includes('--ink-3')).length,
      label: Array.from(f.querySelectorAll('text')).some((t) => t.textContent.includes('Starter')),
    })));
    for (const p of per) assert.ok(p.n === 1 && p.label, p.c + ': ' + JSON.stringify(p));
  });

  await step('Car charts: tap a dot opens that drive; the table agrees', async () => {
    await car.locator('[data-chart="kcPeak"] g[data-act="carOpen"]').first().click();
    await car.waitForSelector('#car-focus');
    assert.match(await car.textContent('#car-focus'), /Aug/);
    const tip = await car.evaluate(() => document.querySelector('[data-chart="trimWorst"] g[data-act="carOpen"] circle[data-tip]').getAttribute('data-tip'));
    await car.click('[data-act="carView"][data-arg="table"]');
    const rows = await car.locator('.car-table .row:not(.head)').count();
    assert.ok(rows >= 3, 'table lists every drive: ' + rows);
    const trimCell = (await car.textContent('.car-table .row:not(.head) >> nth=0')).match(/[+-]\d+\.\d %/);
    assert.ok(trimCell && tip.includes(trimCell[0]), 'table/chart agree: ' + trimCell + ' vs ' + tip);
    await car.click('[data-act="carView"][data-arg="charts"]');
  });

  await step('Car story: a stop collapses blocks 3-5, keeps safety and moments', async () => {
    await carUpload('aug23-2038', 'TunerView_20260823_203853.csv', true);
    assert.match(await car.textContent('#block-paused'), /Paused until the Stop is fixed/);
    assert.equal(await car.locator('.now-card').count(), 0);
    assert.equal(await car.locator('#car-history').count(), 0);
    assert.equal(await car.locator('#block-perf').count(), 0);
    assert.ok(await car.locator('.moment').count() >= 1, 'key moments still show');
    assert.equal(await car.locator('.safety-line').count(), 5);
  });

  await step('Car story: too-short, flat and hot drives read honestly', async () => {
    await carUpload('aug30-1509', 'TunerView_20260830_150925.csv');
    assert.match(await car.textContent('#drive-card'), /Can't tell: too short/);
    assert.equal(await car.locator('#block-perf').count(), 0);
    await carUpload('aug30-1529', 'TunerView_20260830_152931.csv');
    const pulls = await car.evaluate(() => Array.from(document.querySelectorAll('.moment')).map((e) => e.textContent));
    assert.ok(pulls.length <= 5, 'at most 5 moments: ' + pulls.length);
    assert.ok(pulls.length === 5 && pulls.every((m) => /Hard pull/.test(m)), 'hard pulls first: ' + pulls.join(' | '));
    await car.click('.moment >> nth=0');
    await car.waitForSelector('#why');
    await car.click('.moment >> nth=0');
    await carUpload('sep05-0756', 'TunerView_20260905_075634.csv');
    assert.match(await car.textContent('#block-canttell'), /Turbo Pressure/);
    assert.match(await car.textContent('#block-safety'), /Can't tell/);
    await carUpload('aug22-0950', 'TunerView_20260822_095021.csv');
    assert.match(await car.textContent('#drive-card .pill'), /Watch/);
    assert.match(await car.textContent('.safety-line >> nth=3'), /Heat · Watch/);
  });

  await step('Car history: hide/unhide and export/import round-trip', async () => {
    await car.click('[data-act="carView"][data-arg="table"]');
    const before = await car.locator('.car-table .row:not(.head)').count();
    await car.click('.car-table [data-act="carHide"]');
    assert.equal(await car.locator('.car-table .row:not(.head)').count(), before - 1);
    await car.click('#car-history details summary');
    await car.click('[data-act="carUnhide"]');
    assert.equal(await car.locator('.car-table .row:not(.head)').count(), before);
    const [dl] = await Promise.all([car.waitForEvent('download'), car.click('[data-act="carExport"]')]);
    const tmp = path.join(os.tmpdir(), 'kta-car-history-e2e.json');
    await dl.saveAs(tmp);
    const doc = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    assert.ok(Object.keys(doc.drives).length >= 3 && doc.flashes.length >= 1, 'history file holds drives and flashes');
    await car.evaluate(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
    await car.reload();
    await car.waitForSelector('.step-head h1');
    await car.setInputFiles('input[data-import="1"]', tmp);
    await car.waitForFunction(() => document.body.textContent.includes('Merged'));
    assert.match(await car.textContent('main'), /Nothing was deleted/);
  });

  await step('Car story in Vietnamese and dark mode', async () => {
    await carExample('aug30-1601');
    await car.click('[data-act="lang"]');
    assert.match(await car.textContent('#car-history .story'), /Xe của bạn theo thời gian/);
    assert.match(await car.textContent('#block-paused, #drive-card'), /Chuyến này|Tạm dừng/);
    await car.click('[data-act="lang"]');
    await car.click('[data-act="theme"]');
    assert.equal(await car.locator('.car-chart').count(), 6);
    assert.equal(await car.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
    await car.click('[data-act="theme"]');
  });

  await step('car width: 375 px stacks the charts, laptop shows the 2x3 grid, no sideways scroll', async () => {
    const phone = await browser.newPage({ viewport: { width: 375, height: 844 } });
    phone.on('pageerror', (e) => errors.push('phone car: ' + e.message));
    await phone.goto(APP);
    await phone.evaluate(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
    await phone.goto(APP + '?drive=aug30-1601#drive');
    await phone.waitForSelector('.now-card', { timeout: 30000 });
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    const cols = await phone.evaluate(() => getComputedStyle(document.querySelector('.car-charts')).gridTemplateColumns.split(' ').filter(Boolean).length);
    assert.equal(cols, 1);
    const order = await phone.evaluate(() => Array.from(document.querySelectorAll('main [data-block]')).map((e) => e.getAttribute('data-block')).filter((b) => b !== '0'));
    assert.deepEqual(order.slice(0, 3), ['1', '2', '3']);
    const tops = await phone.evaluate(() => ['1', '2', '3'].map((b) => document.querySelector('[data-block="' + b + '"]').getBoundingClientRect().top));
    assert.ok(tops[0] < 844, 'block 1 starts on the first screen: ' + JSON.stringify(tops));
    await phone.close();
    const wide = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    wide.on('pageerror', (e) => errors.push('wide car: ' + e.message));
    await wide.goto(APP);
    await wide.evaluate(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
    await wide.goto(APP + '?drive=aug30-1601#drive');
    await wide.waitForSelector('.now-card', { timeout: 30000 });
    assert.equal(await wide.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    assert.equal(await wide.evaluate(() => getComputedStyle(document.querySelector('.car-charts')).gridTemplateColumns.split(' ').filter(Boolean).length), 2);
    await wide.close();
  });
  await car.close();
  await dp.close();

  // ---------------------------------------------------------------- Full method (steps 1-7)
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(APP);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
  await page.goto(APP + '#step-1');
  await page.reload();
  await page.waitForSelector('.step-head h1');

  await step('opens on Step 1 with the six mods pre-ticked', async () => {
    assert.equal(await page.textContent('.step-head h1'), 'Your car and mods');
    assert.equal(await page.locator('.mod input:checked').count(), 6);
  });

  await step('pre-checks count up and complete Step 1', async () => {
    for (const k of ['leak', 'exhaust', 'plugs', 'fuel', 'cvt', 'lights']) await page.check('#prep-' + k);
    assert.match(await page.textContent('.step-btn[aria-current="step"] .step-chip'), /Done/);
  });

  await step('Step 2: Sample A is graded Stop with lean trims', async () => {
    await page.click('[data-act="go"][data-arg="2"]');
    await page.click('[data-act="sample"][data-arg="before"]');
    assert.match(await page.textContent('.log-head .pill'), /Fix this before you continue/);
    const fuel = await page.textContent('.gate-row:first-child');
    assert.match(fuel, /Fuel trims \(cruise\)\s*\?\s*\+9\.\d %/);
  });

  await step('Step 3: correction table, rising curve and a 103-value row', async () => {
    await page.click('[data-act="go"][data-arg="3"]');
    assert.equal(await page.locator('.table.afm-bands .row:not(.head)').count(), 8);
    const row = await page.inputValue('#afm-row');
    assert.equal(row.split('\t').length, 103);
    assert.match(await page.textContent('.proofs'), /Curve rises at every point/);
  });

  await step('Step 3: a pasted AFM row that does not rise is rejected with a reason', async () => {
    const bad = K.REF.maf.custom.slice(); bad[40] = 1;
    await page.fill('#afm-paste', bad.join('\t'));
    await page.locator('#afm-paste').blur();
    assert.match(await page.textContent('main'), /Values must rise from left to right/);
    await page.fill('#afm-paste', '');
    await page.locator('#afm-paste').blur();
  });

  await step('Step 3: a real CSV file uploads and passes (Sample B written to disk)', async () => {
    const file = path.join(os.tmpdir(), 'kta-e2e-sample-b.csv');
    fs.writeFileSync(file, K.sampleCsv('after'));
    await page.setInputFiles('input[data-file]', file);
    await page.waitForSelector('.log-head');
    assert.match(await page.textContent('.log-head'), /kta-e2e-sample-b\.csv/);
    assert.match(await page.textContent('.log-head .pill'), /Pass/);
  });

  await step('column mapping: removing the AFR column re-grades the log', async () => {
    await page.click('details.columns summary');
    await page.selectOption('select[data-map="afr"]', '-1');
    assert.match(await page.textContent('.gates'), /No full-throttle pull found|No data/);
    await page.selectOption('select[data-map="afr"]', { label: 'AFR' });
    assert.match(await page.textContent('.log-head .pill'), /Pass/);
  });

  await step('Step 4: mixture and pull charts render with finite geometry', async () => {
    await page.click('[data-act="go"][data-arg="4"]');
    assert.equal(await page.locator('.chart svg').count(), 2);
    const d = await page.getAttribute('.chart svg path[style*="--meas"]', 'd');
    assert.ok(d && !/NaN/.test(d));
  });

  await step('Step 5: hot sample stops on spark, heat and CVT', async () => {
    await page.click('[data-act="go"][data-arg="5"]');
    await page.click('[data-act="sample"][data-arg="after"]');
    await page.click('[data-act="set"][data-arg="confirmSlot:hot"]');
    await page.click('[data-act="sample"][data-arg="hot"]');
    const text = await page.textContent('.gates');
    assert.match(text, /Knock retard at WOT/);
    assert.equal(await page.locator('.gate-row.st-stop').count(), 3);
  });

  await step('Step 6: at the 21 psi ceiling there is no boost change; 22 psi proposes 5 rows', async () => {
    await page.click('[data-act="go"][data-arg="6"]');
    assert.match(await page.textContent('main'), /No boost change/);
    await page.fill('#ceiling', '22');
    await page.locator('#ceiling').blur();
    assert.equal(await page.locator('.table.l2 .row:not(.head)').count(), 5);
    await page.fill('#ceiling', '21');
    await page.locator('#ceiling').blur();
  });

  await step('Step 7: review packet carries the evidence and the sign-off', async () => {
    await page.click('[data-act="go"][data-arg="7"]');
    await page.fill('#rev-name', 'Anh T. (KTuner)');
    await page.click('[data-act="set"][data-arg="review.decision:approve"]');
    const packet = await page.inputValue('#packet');
    for (const part of ['# Civic FE Tune Assist: review packet', '## Changes', '## Evidence', '| Gate | Status | Numbers |', '## Reference checks', 'Anh T. (KTuner)', 'Decision: Approve']) assert.ok(packet.includes(part), 'missing: ' + part);
  });

  await step('Map: the Reference link opens all 39 tables, the base map and the edit plan', async () => {
    await page.click('[data-act="page"][data-arg="map"]');
    assert.equal(await page.textContent('.step-head h1'), 'Your KTuner map');
    assert.equal(await page.locator('.tlist .tbtn').count(), 39);
    assert.match(await page.textContent('.card.is-key'), /Starter 21 Dual Tune 2/);
    const plan = await page.textContent('.table.plan');
    for (const name of ['MAF_Scaling_Custom', 'WOT_Enrich_L', 'WOT_Enrich_H', 'Boost_Target_3_Normal_H']) assert.ok(plan.includes(name), 'plan names ' + name);
    assert.match(plan, /\d+ points change/);                      // a log is loaded, so the AFM row is computed
  });

  await step('Map: WOT Enrichment marks 27 cells in 2D and 3D and passes the shape check', async () => {
    await page.click('.tlist [data-act="table"][data-arg="WOT_Enrich_L"]');
    await page.click('[data-act="set"][data-arg="mapView:grid"]');
    assert.equal(await page.locator('.hgrid td.is-changed').count(), 27);
    assert.match(await page.textContent('.map-facts'), /no new spikes or dips/);
    await page.click('[data-act="set"][data-arg="mapView:surface"]');
    assert.equal(await page.locator('#surface polygon').count(), 19 * 9);
    assert.equal(await page.locator('#surface circle.s-mark').count(), 27);
    const before = await page.getAttribute('#surface polygon >> nth=0', 'points');
    await page.focus('#surface');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction((b) => document.querySelector('#surface polygon').getAttribute('points') !== b, before);
    const pts = await page.getAttribute('#surface polygon >> nth=0', 'points');
    assert.ok(!/NaN/.test(pts));
    await page.click('[data-act="set"][data-arg="mapShow:diff"]');
    assert.ok(await page.locator('#surface polygon').count() > 0);
    await page.click('[data-act="set"][data-arg="mapView:lines"]');
    assert.ok(await page.locator('.viz svg path').count() >= 10);
    await page.click('[data-act="set"][data-arg="mapShow:after"]');
  });

  await step('Map: AFM Flow shows the computed row; a curve has no 3D view', async () => {
    await page.click('.tlist [data-act="table"][data-arg="MAF_Scaling_Custom"]');
    assert.equal(await page.locator('[data-arg="mapView:surface"]').isDisabled(), true);
    await page.click('[data-act="set"][data-arg="mapView:grid"]');
    assert.ok(await page.locator('.hgrid td.is-changed').count() > 20);
    assert.match(await page.textContent('.map-facts'), /no new spikes or dips/);
  });

  await step('Map: stock ignition carries the blind-smoothing warning', async () => {
    await page.click('.tlist [data-act="table"][data-arg="Ignition_Base_H"]');
    assert.match(await page.textContent('.map-facts'), /Blind smoothing test on Ignition_Base_H: a 3×3 smooth would add \+1\.3° at 2,000 rpm/);
    await page.click('[data-act="set"][data-arg="mapView:surface"]');
    await page.click('[data-act="set"][data-arg="mapShow:smooth"]');
    assert.equal(await page.locator('#surface circle.s-mark').count(), 7);
  });

  await step('Guide: basic road tune, E10 answer, tuner panel and video verdicts', async () => {
    await page.click('[data-act="page"][data-arg="guide"]');
    assert.equal(await page.textContent('.step-head h1'), 'Road tune guide and tuner panel');
    assert.equal(await page.locator('.table.basic .row:not(.head)').count(), 9);
    assert.equal(await page.locator('details.topic').count(), 7);
    assert.equal(await page.locator('.table.vids .row:not(.head)').count(), 20);
    const text = await page.textContent('main');
    for (const part of ['Does E10 need more fuel?', 'A safe road pull, no dyno', 'Smooth what you change, not what Honda made']) assert.ok(text.includes(part), 'guide has: ' + part);
    await page.click('details.topic >> nth=1 >> summary');
    assert.equal(await page.locator('details.topic[open]').count(), 2);
    await page.click('[data-act="smoothDemo"]');
    assert.equal(await page.textContent('.tpanel h2'), 'Ignition base H');
    assert.equal(await page.getAttribute('[data-act="set"][data-arg="mapShow:smooth"]', 'aria-pressed'), 'true');
    await page.click('[data-act="go"][data-arg="7"]');
    assert.equal(await page.textContent('.step-head h1'), 'Review and sign-off');
  });

  await step('Vietnamese: the whole flow switches language', async () => {
    await page.click('[data-act="lang"]');
    assert.equal(await page.textContent('.step-head h1'), 'Duyệt và ký xác nhận');
    assert.match(await page.inputValue('#packet'), /gói duyệt/);
    await page.click('[data-act="go"][data-arg="2"]');
    assert.match(await page.textContent('.gates'), /Fuel trim \(chạy đều\)/);
  });

  await step('settings survive a reload (language, pre-checks, step)', async () => {
    await page.reload();
    await page.waitForSelector('.step-head h1');
    assert.equal(await page.textContent('.step-head h1'), 'Log gốc');
  });

  await step('phone width: no sideways scrolling', async () => {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    phone.on('pageerror', (e) => errors.push('phone: ' + e.message));
    await phone.goto(APP + '#step-3');
    await phone.waitForSelector('.step-head h1');
    await phone.click('[data-act="sample"][data-arg="before"]');
    const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.equal(overflow, 0);
    await phone.click('[data-act="page"][data-arg="map"]');
    await phone.selectOption('.tpick select', 'Boost_Target_1_Normal_H');
    await phone.click('[data-act="set"][data-arg="mapView:surface"]');
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    await phone.click('[data-act="page"][data-arg="guide"]');
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    await phone.close();
  });

  await step('no script errors', async () => { assert.deepEqual(errors, []); });

  await browser.close();
  console.log(results.join('\n'));
  if (process.exitCode) console.log('\nE2E FAILED'); else console.log('\nE2E passed: ' + results.length + ' checks');
}

run().catch((e) => { console.error(e); process.exit(1); });

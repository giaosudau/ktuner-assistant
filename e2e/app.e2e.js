'use strict';
// End-to-end check of the standalone app in Chromium.
// Run: npm run e2e   (needs Playwright: npm i -D playwright, or a global install via NODE_PATH)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
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
    await phone.close();
  });

  await step('no script errors', async () => { assert.deepEqual(errors, []); });

  await browser.close();
  console.log(results.join('\n'));
  if (process.exitCode) console.log('\nE2E FAILED'); else console.log('\nE2E passed: ' + results.length + ' checks');
}

run().catch((e) => { console.error(e); process.exit(1); });

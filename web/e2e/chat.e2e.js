'use strict';
/*
 * Browser smoke test: upload a Drive in the chat, see the reply card, expand the
 * steps (ADR 0004 §"Where each seam's tests live" — the browser smoke seam).
 *
 *   npm run e2e            (needs the server and the chat already running)
 *   KTA_CHAT=http://127.0.0.1:3000 KTA_SERVER=http://127.0.0.1:8000 npm run e2e
 *
 * The Drive is the owner's own log, read out of the engine's own fixture — the
 * browser never gets a synthetic one.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('playwright');

const CHAT = process.env.KTA_CHAT || 'http://127.0.0.1:3000';
const SERVER = process.env.KTA_SERVER || 'http://127.0.0.1:8000';
const EXAMPLE = process.env.KTA_EXAMPLE || 'sep01-0813';
const REPO = path.resolve(__dirname, '..', '..');

/** The owner's real CSV, decompressed the way the engine's tests read it. */
function ownerCsv(id) {
  const source = fs.readFileSync(path.join(REPO, 'data', `example-${id}.js`), 'utf8');
  const gz = /gz:\s*"([A-Za-z0-9+/=]+)"/.exec(source);
  if (!gz) throw new Error(`no gzipped CSV in data/example-${id}.js`);
  return zlib.gunzipSync(Buffer.from(gz[1], 'base64')).toString('utf8');
}
function ownerFileName(id) {
  const source = fs.readFileSync(path.join(REPO, 'data', `example-${id}.js`), 'utf8');
  const name = /name:\s*"([^"]+)"/.exec(source);
  return name ? name[1] : `TunerView_${id.replace(/-/g, '_')}.csv`;
}

/**
 * Tap the owner's own upload button and pick the file, the way a person does.
 * Retried while the page finishes hydrating: a tap before hydration does
 * nothing, and a person would simply tap again.
 */
async function pickFile(page, button, file) {
  let lastError;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        page.click(button),
      ]);
      await chooser.setFiles(file);
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(750);
    }
  }
  throw lastError;
}

async function run() {
  const health = await fetch(`${SERVER}/healthz`).catch(() => null);
  if (!health || !health.ok) {
    console.error(`The server is not answering on ${SERVER}. Start it first:\n  cd server && python3 -m uvicorn kta_server.app:app`);
    process.exitCode = 1;
    return;
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kta-e2e-'));
  const csv = path.join(dir, ownerFileName(EXAMPLE));
  fs.writeFileSync(csv, ownerCsv(EXAMPLE));

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const results = [];
  const step = async (name, fn) => {
    try {
      await fn();
      results.push('ok   ' + name);
    } catch (e) {
      results.push('FAIL ' + name + '\n     ' + (e && e.message));
      process.exitCode = 1;
    }
  };

  // A phone in a car park: 390 px, no sideways scrolling.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e && e.message)));
  const noOverflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  try {
    await step('the chat opens on a phone and offers one big upload button', async () => {
      await page.goto(CHAT, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="upload"]', { timeout: 30000 });
      const box = await page.locator('[data-testid="upload"]').boundingBox();
      assert.ok(box.height >= 44, 'the upload target is ' + box.height + ' px tall');
      assert.equal(await noOverflow(), 0, 'no sideways scrolling at 390 px');
    });

    await step('uploading a real CSV streams the reply card with the Verdict sentence and the four numbers', async () => {
      await pickFile(page, '[data-testid="upload"]', csv);
      await page.waitForSelector('[data-testid="say"]', { timeout: 120000 });
      const say = await page.textContent('[data-testid="say"]');
      assert.match(say, /^(Engine healthy|Nothing broken|Stop driving hard|Can't tell|Nothing read)/, say);

      await page.waitForSelector('[data-testid="verdict"]', { timeout: 30000 });
      const verdict = await page.getAttribute('[data-testid="verdict"]', 'data-verdict');
      assert.ok(['OK', 'Watch', 'Stop', "Can't tell"].includes(verdict), verdict);

      const tiles = await page.locator('[data-testid="numbers"] .tile > span').allTextContents();
      assert.deepEqual(
        tiles,
        ['intake air, moving', 'Knock Control, start → peak', 'worst fuel trim', 'hard pulls'],
        JSON.stringify(tiles),
      );
      assert.match(await page.textContent('[data-testid="flash-plan"]'), /no map change|flash|MAF Flow|Boost/i);
      assert.equal(await noOverflow(), 0, 'the reply card fits 390 px');
    });

    await step('the harness is one collapsed line that expands to each step with its inputs and output', async () => {
      await page.waitForSelector('[data-testid="harness-line"]', { timeout: 30000 });
      // The server's own count and seconds arrive with the last step; wait for
      // them rather than for the row that exists while the steps are still in.
      await page.waitForFunction(
        () => /^Checked \d+ things · \d+(\.\d+)? s$/.test(
          document.querySelector('[data-testid="harness-line"]')?.textContent ?? '',
        ),
        undefined,
        { timeout: 30000 },
      );
      const line = await page.textContent('[data-testid="harness-line"]');
      assert.match(line, /^Checked \d+ things · \d+(\.\d+)? s$/, line);
      assert.equal(await page.locator('[data-testid="harness"]').getAttribute('open'), null);

      await page.click('[data-testid="harness-line"]');
      await page.waitForSelector('[data-step="flashPlan"]', { timeout: 10000 });
      const steps = await page.locator('.step-row').count();
      assert.ok(steps >= 4, 'six steps: ' + steps);

      await page.click('[data-step="flashPlan"] summary');
      await page.waitForSelector('[data-step="flashPlan"] details[open] pre[data-io="output"]', { timeout: 10000 });
      const inputs = await page.textContent('[data-step="flashPlan"] pre[data-io="inputs"]');
      const output = await page.textContent('[data-step="flashPlan"] pre[data-io="output"]');
      assert.match(inputs, /20260901-081358/, 'the step shows what it was given');
      assert.match(output, /headline/, 'the Flash plan output shows its headline');
      assert.equal(await noOverflow(), 0, 'the expanded steps still fit 390 px');
    });

    await step('there is exactly one Next step, and it names the drive to upload', async () => {
      assert.equal(await page.locator('[data-testid="next-step"]').count(), 1);
      const stepCard = page.locator('[data-testid="next-step"]');
      assert.match(await stepCard.locator('h3').textContent(), /\S/);
      assert.match(await stepCard.textContent(), /Upload:/);
    });

    await step('the reply holds no raw log and the page raised no errors', async () => {
      const text = await page.textContent('body');
      assert.ok(!text.includes('Timestamp;'), 'no CSV header on the page');
      assert.deepEqual(errors, []);
    });
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }

  console.log(results.join('\n'));
  console.log(results.some((r) => r.startsWith('FAIL')) ? '\nbrowser smoke: FAIL' : '\nbrowser smoke: ok');
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

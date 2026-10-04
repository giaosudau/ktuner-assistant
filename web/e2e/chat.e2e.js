'use strict';
/*
 * Browser smoke test: use the chat the way the owner does (chat CA-10).
 * Describe the car, attach a real TunerView log with +, read the reply, open the
 * work row, ask a question, open the sidebar — all on a 390 px phone.
 *
 *   npm run e2e            (needs the server and the chat already running;
 *                           a fresh KTA_DB also runs the car-setup steps)
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

async function run() {
  const health = await fetch(`${SERVER}/healthz`).catch(() => null);
  if (!health || !health.ok) {
    console.error(`The server is not answering on ${SERVER}. Start it first: make run`);
    process.exitCode = 1;
    return;
  }
  const fresh = !(await (await fetch(`${SERVER}/api/state`)).json()).carProfile;

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
  const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const lastAi = () => page.locator('[data-testid="assistant-message"]').last();
  const idle = () => page.waitForFunction(() => !document.querySelector('.spinner'), undefined, { timeout: 120000 });

  try {
    await step('the chat opens on a phone as one composer with + and send, nothing else to fill in', async () => {
      await page.goto(CHAT, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="empty"] [data-testid="composer"]', { timeout: 30000 });
      for (const sel of ['attach', 'send']) {
        const box = await page.locator(`[data-testid="${sel}"]`).boundingBox();
        assert.ok(box.height >= 44, `${sel} is ${box.height} px tall`);
      }
      assert.equal(await page.locator('select, input[type="date"]').count(), 0, 'no form on the first screen');
      assert.equal(await noOverflow(), 0, 'no sideways scrolling at 390 px');
    });

    if (fresh) {
      await step('describing the car in words gives a car card in the thread; saving it asks for the first log', async () => {
        await page.click('[data-testid="use-example"]');
        await page.click('[data-testid="send"]');
        await page.waitForSelector('[data-testid="user-message"]', { timeout: 10000 });
        await page.waitForSelector('[data-testid="setup-confirm"]', { timeout: 30000 });
        assert.equal(await page.inputValue('[data-testid="setup-field-transmission"]'), 'CVT');
        await page.click('[data-testid="setup-confirm"]');
        await page.waitForSelector('[data-testid="log-guide"]', { timeout: 30000 });
        assert.match(await page.textContent('[data-testid="log-guide"]'), /2 pulls/);
        await page.waitForFunction(() => document.querySelector('[data-testid="journey"]')?.dataset.phase === 'baseline');
      });
    }

    await step('attaching a real CSV with + sends it as my message and streams the reply below it', async () => {
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-testid="attach"]')]);
      await chooser.setFiles(csv);
      await page.waitForSelector('[data-testid="attachment"]');
      await page.click('[data-testid="send"]');
      await page.waitForSelector(`[data-testid="user-message"] >> text=${path.basename(csv)}`, { timeout: 10000 });
      await idle();
      const say = await lastAi().locator('[data-testid="say"]').textContent();
      assert.match(say, /^(Engine healthy|Nothing broken|Stop driving hard|Can't tell|Nothing read)/, say);
      const verdict = await lastAi().locator('[data-testid="verdict"]').getAttribute('data-verdict');
      assert.ok(['OK', 'Watch', 'Stop', "Can't tell"].includes(verdict), verdict);
      const labels = await lastAi().locator('[data-testid="numbers"] .stat > span').allTextContents();
      assert.deepEqual(labels, ['intake air, moving', 'Knock Control, start → peak', 'worst fuel trim', 'hard pulls']);
      assert.equal(await noOverflow(), 0, 'the reply fits 390 px');
    });

    await step('the prose comes first, then the report, then exactly one Next step that names the drive to upload', async () => {
      const order = await lastAi().evaluate((el) => {
        const top = (sel) => el.querySelector(sel)?.getBoundingClientRect().top ?? -1;
        return { say: top('[data-testid="say"]'), report: top('[data-testid="reply-card"]'), next: top('[data-testid="next-step"]') };
      });
      assert.ok(order.say < order.report && order.report < order.next, JSON.stringify(order));
      assert.equal(await lastAi().locator('[data-testid="next-step"]').count(), 1);
      assert.match(await lastAi().locator('[data-testid="next-step"]').textContent(), /Upload when:/);
    });

    await step('the work row is collapsed and opens to each tool with its input and output', async () => {
      const line = lastAi().locator('[data-testid="harness-line"]');
      assert.match(await line.textContent(), /^Worked for .+ · Checked \d+ things?/);
      assert.equal(await lastAi().locator('[data-testid="harness"]').getAttribute('open'), null);
      await line.click();
      const tool = lastAi().locator('[data-step="flashPlan"]').first(); // the agent may read the plan again
      await tool.locator('summary').click();
      assert.match(await tool.locator('pre[data-io="inputs"]').textContent(), /\S/);
      assert.match(await tool.locator('pre[data-io="output"]').textContent(), /headline/);
      assert.ok((await lastAi().locator('.work-list > li').count()) >= 4);
      assert.equal(await noOverflow(), 0, 'the open steps still fit 390 px');
    });

    await step('a typed question is answered in the same thread', async () => {
      const before = await page.locator('[data-testid="assistant-message"]').count();
      await page.fill('[data-testid="composer-text"]', 'Why is my car slower in the heat?');
      await page.keyboard.press('Enter');
      await page.waitForFunction((n) => document.querySelectorAll('[data-testid="assistant-message"]').length > n, before);
      await idle();
      assert.match(await lastAi().locator('[data-testid="ask-answer"]').textContent(), /\S/);
    });

    await step('the sidebar opens as a drawer with the car, the journey and the open steps', async () => {
      await page.click('[data-testid="open-sidebar"]');
      await page.waitForSelector('[data-testid="journey"] li[aria-current="step"]');
      assert.match(await page.textContent('[data-testid="car-summary"]'), /Map version \d/);
      assert.equal(await noOverflow(), 0);
    });

    await step('the thread survives a reload', async () => {
      const count = await page.locator('[data-testid="assistant-message"]').count();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="thread"] [data-testid="assistant-message"]');
      assert.equal(await page.locator('[data-testid="assistant-message"]').count(), count);
    });

    await step('the page holds no raw log and raised no errors', async () => {
      assert.ok(!(await page.textContent('body')).includes('Timestamp;'), 'no CSV header on the page');
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

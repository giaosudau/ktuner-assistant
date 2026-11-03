'use strict';
// The owner's whole journey: car setup, then the nine real drives in the order they were driven,
// acting as the owner did (flash back when asked to Undo). Per drive it records what the owner
// sees (verdict, Next step, what settled, the sidebar's stage) and screenshots the reply.
// Needs a fresh server DB (launch "server-e2e") and the chat on :3000.
// Usage: KTA_SHOTS=<folder> node journey.js [width] [height]
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('/Users/bean/codespace/ktuner-assistant/web/node_modules/playwright');

const [W, H] = [Number(process.argv[2] || 390), Number(process.argv[3] || 844)];
const REPO = '/Users/bean/codespace/ktuner-assistant';
const OUT = process.env.KTA_SHOTS || path.join(__dirname, 'shots');
const DRIVES = ['aug22-0903', 'aug22-0950', 'aug23-1959', 'aug23-2038', 'aug30-1509', 'aug30-1529', 'aug30-1601', 'sep01-0813', 'sep05-0756'];
fs.mkdirSync(OUT, { recursive: true });

function csvFile(id) {
  const src = fs.readFileSync(path.join(REPO, 'data', `example-${id}.js`), 'utf8');
  const gz = /gz:\s*"([A-Za-z0-9+/=]+)"/.exec(src);
  const name = (/name:\s*"([^"]+)"/.exec(src) || [])[1] || `TunerView_${id}.csv`;
  const p = path.join(OUT, name);
  fs.writeFileSync(p, zlib.gunzipSync(Buffer.from(gz[1], 'base64')).toString('utf8'));
  return p;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  const records = [];
  const busy = async () => /Working/.test((await page.locator('.composer-hint').first().textContent().catch(() => '')) || '');
  const settle = async (maxMs = 180000) => {
    const t0 = Date.now();
    for (let i = 0; i < 40 && !(await busy()); i += 1) await page.waitForTimeout(250);
    while ((await busy()) && Date.now() - t0 < maxMs) await page.waitForTimeout(1000);
    await page.waitForTimeout(800);
    return Math.round((Date.now() - t0) / 1000);
  };
  const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
  // What the owner reads, from the last assistant reply and the sidebar.
  const read = () =>
    page.evaluate(() => {
      const ai = [...document.querySelectorAll('[data-testid="assistant-message"]')].pop();
      const t = (sel, root = ai) => root?.querySelector(sel)?.textContent?.trim() ?? null;
      const all = (sel, root = ai) => [...(root?.querySelectorAll(sel) ?? [])].map((e) => e.textContent.trim());
      return {
        verdict: ai?.querySelector('[data-testid="verdict"]')?.getAttribute('data-verdict') ?? null,
        say: (t('[data-testid="say"]') || '').slice(0, 300),
        next: t('[data-testid="next-step"] h3'),
        nextKind: ai?.querySelector('[data-testid="next-step"]')?.getAttribute('data-kind') ?? null,
        upload: (t('[data-testid="next-step"] .proves') || '').slice(0, 200),
        settled: all('[data-testid="settled"] .r'),
        wasted: t('[data-testid="wasted"]'),
        questions: all('.ask-card .card-h'),
        undo: !!ai?.querySelector('[data-testid="undo-card"]'),
        ktuner: !!ai?.querySelector('[data-testid="ktuner-card"]'),
        checkpoints: t('[data-testid="checkpoints"] .small-count'),
        stage: t('[data-testid="journey"] .round-h', document),
        need: t('[data-testid="need"] span', document),
        openSteps: all('[data-testid="open-steps"] .st-title', document),
        cards: [...(ai?.querySelectorAll('[data-testid]') ?? [])].map((e) => e.dataset.testid).filter((x) => /^(say|reply-card|checkpoints|health|calibration|picture|settled|flash-plan|next-step|undo-card|ktuner-card|fuel-test)$/.test(x) || /^question-/.test(x)),
        height: ai?.getBoundingClientRect().height ?? 0,
      };
    });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="use-example"]');
  await page.click('[data-testid="use-example"]');
  await page.keyboard.press('Enter');
  await settle();
  await page.click('[data-testid="setup-confirm"]');
  await settle();
  records.push({ step: 'car saved', ...(await read()) });
  await shot('j00-car-saved');

  for (const [i, id] of DRIVES.entries()) {
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-testid="attach"]')]);
    await chooser.setFiles(csvFile(id));
    await page.waitForSelector('[data-testid="attachment"]');
    const slot = await page.inputValue('[data-testid="tag-slot"]');
    await page.click('[data-testid="send"]');
    const secs = await settle();
    const rec = { step: id, secs, slot, ...(await read()) };
    // Top of the reply: what the owner sees first.
    await page.evaluate(() => [...document.querySelectorAll('[data-testid="user-message"]')].pop()?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(300);
    await shot(`j${String(i + 1).padStart(2, '0')}-${id}-top`);
    await page.evaluate(() => [...document.querySelectorAll('[data-testid="next-step"]')].pop()?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(300);
    await shot(`j${String(i + 1).padStart(2, '0')}-${id}-next`);
    // The owner flashed back when the shop asked for an Undo.
    const back = page.locator('[data-testid="assistant-message"]').last().locator('[data-testid="undo-card"] [data-testid="flashed-it"]');
    if (await back.count()) {
      await back.click();
      await settle();
      rec.afterUndo = await read();
      rec.afterUndo.say = (await page.locator('[data-testid="flash-outcome"]').last().textContent().catch(() => '')).slice(0, 300);
      await shot(`j${String(i + 1).padStart(2, '0')}-${id}-flashed-back`);
    }
    records.push(rec);
    fs.writeFileSync(path.join(OUT, 'journey.json'), JSON.stringify(records, null, 2));
    console.log(JSON.stringify({ step: id, secs, verdict: rec.verdict, next: rec.next, stage: rec.stage }));
  }

  // A returning owner: a new chat on the same car.
  await page.reload({ waitUntil: 'domcontentloaded' });
  if (await page.locator('[data-testid="open-sidebar"]').isVisible()) await page.click('[data-testid="open-sidebar"]');
  await page.locator('[data-testid="new-chat"]').evaluate((b) => b.click());
  await page.waitForTimeout(1500);
  records.push({ step: 'returning owner', ...(await read()), welcome: await page.locator('[data-testid="empty"]').textContent().catch(() => null) });
  await shot('j10-returning');

  fs.writeFileSync(path.join(OUT, 'journey.json'), JSON.stringify(records, null, 2));
  await browser.close();
})();

'use strict';
// UX audit walk: owner journey at one width. Usage: node walk.js 390 844 m
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('/Users/bean/codespace/ktuner-assistant/web/node_modules/playwright');

const [W, H, TAG] = [Number(process.argv[2] || 390), Number(process.argv[3] || 844), process.argv[4] || 'm'];
const REPO = '/Users/bean/codespace/ktuner-assistant';
const OUT = process.env.KTA_SHOTS || path.join(__dirname, 'shots');
const CHAT = 'http://localhost:3000';
fs.mkdirSync(OUT, { recursive: true });

function csvFile(id) {
  const src = fs.readFileSync(path.join(REPO, 'data', `example-${id}.js`), 'utf8');
  const gz = /gz:\s*"([A-Za-z0-9+/=]+)"/.exec(src);
  const name = (/name:\s*"([^"]+)"/.exec(src) || [])[1] || `TunerView_${id}.csv`;
  const p = path.join(__dirname, name);
  fs.writeFileSync(p, zlib.gunzipSync(Buffer.from(gz[1], 'base64')).toString('utf8'));
  return p;
}

const log = [];
const note = (s) => { log.push(s); console.log(s); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  let n = 0;
  // Viewport shot + the scroll container paged, so long threads are readable.
  const shot = async (label, pages = 1) => {
    n += 1;
    const base = `${TAG}${String(n).padStart(2, '0')}-${label}`;
    await page.screenshot({ path: path.join(OUT, `${base}.png`) });
    const hasScroll = await page.locator('.scroll').count();
    if (pages > 1 && hasScroll) {
      const total = await page.evaluate(() => { const s = document.querySelector('.scroll'); return s.scrollHeight; });
      const vh = await page.evaluate(() => document.querySelector('.scroll').clientHeight);
      const k = Math.min(pages, Math.ceil(total / vh));
      // full-length capture: grow the viewport to the content height once
      await page.setViewportSize({ width: W, height: Math.min(total + (H - vh), 16000) });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, `${base}-full.png`) });
      await page.setViewportSize({ width: W, height: H });
      await page.waitForTimeout(300);
      for (let i = 0; i < k; i += 1) {
        await page.evaluate((y) => { document.querySelector('.scroll').scrollTop = y; }, i * (vh - 60));
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUT, `${base}-p${i + 1}.png`) });
      }
      await page.evaluate(() => { const s = document.querySelector('.scroll'); s.scrollTop = s.scrollHeight; });
    }
    note(`shot ${base} (pages ${pages})`);
  };
  const hint = () => page.locator('.composer-hint').first().textContent().catch(() => '');
  const waitReply = async (label) => {
    const t0 = Date.now();
    // wait for busy to start, then shoot the waiting state, then wait for it to end
    for (let i = 0; i < 40 && !/Working/.test(await hint()); i += 1) await page.waitForTimeout(250);
    await page.waitForTimeout(1500);
    await shot(`${label}-waiting-early`);
    let mid = false;
    while (/Working/.test(await hint()) && Date.now() - t0 < 120000) {
      await page.waitForTimeout(1000);
      if (!mid && Date.now() - t0 > 12000) { mid = true; await shot(`${label}-waiting-12s`); }
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    note(`${label}: reply took ${secs}s (still busy: ${/Working/.test(await hint())})`);
    await page.waitForTimeout(800);
  };
  const metrics = async (label) => {
    const m = await page.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const small = [...document.querySelectorAll('button, a, summary, [role=button], input, select, textarea')]
        .filter(vis)
        .map((el) => { const r = el.getBoundingClientRect(); return { t: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), cls: el.className && String(el.className).slice(0, 30) }; })
        .filter((x) => x.h < 44 || x.w < 44);
      return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, small };
    });
    fs.writeFileSync(path.join(OUT, `${TAG}-metrics-${label}.json`), JSON.stringify(m, null, 1));
    note(`${label}: overflow=${m.overflow}px, small targets=${m.small.length}`);
  };
  const text = async (label) => {
    const t = await page.locator('main, body').first().innerText();
    fs.writeFileSync(path.join(OUT, `${TAG}-text-${label}.txt`), t);
  };
  const attach = async (file) => {
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-testid="attach"]')]);
    await chooser.setFiles(file);
    await page.waitForSelector('[data-testid="attachment"]', { timeout: 10000 });
  };
  const lastAi = () => page.locator('[data-testid="assistant-message"]').last();
  const sidebarOpen = async () => { if (await page.locator('[data-testid="open-sidebar"]').isVisible().catch(() => false)) await page.click('[data-testid="open-sidebar"]'); };
  const tryStep = async (name, fn) => { try { await fn(); } catch (e) { note(`STEP FAIL ${name}: ${e.message.split('\n')[0]}`); } };

  await page.goto(CHAT, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="empty"]', { timeout: 30000 });
  await shot('landing');
  await metrics('landing');
  await text('landing');

  await tryStep('setup', async () => {
    if (!(await page.locator('[data-testid="use-example"]').count())) { note('no use-example chip (profile already saved)'); return; }
    await page.click('[data-testid="use-example"]');
    await page.waitForTimeout(400);
    await shot('example-filled');
    await page.click('[data-testid="send"]');
    await page.waitForSelector('[data-testid="setup-confirm"]', { timeout: 60000 });
    await page.waitForTimeout(800);
    await shot('car-card', 6);
    await text('car-card');
    await metrics('car-card');
    await page.click('[data-testid="setup-confirm"]');
    await page.waitForSelector('[data-testid="log-guide"]', { timeout: 60000 });
    await page.waitForTimeout(800);
    await shot('saved-log-guide', 6);
    await text('saved-log-guide');
  });

  const d1 = csvFile('sep01-0813');
  await tryStep('drive1', async () => {
    await attach(d1);
    await shot('drive1-attached');
    await page.click('[data-testid="send"]');
    await waitReply('drive1');
    await shot('drive1-reply', 12);
    await text('drive1-reply');
    await metrics('drive1-reply');
  });

  await tryStep('table-viewer', async () => {
    const btn = page.locator('[data-testid="review-table"], [data-testid^="tour-view-"]').first();
    if (!(await btn.count())) { note('no table viewer button'); return; }
    note('table button: ' + (await btn.textContent()));
    // Map-tour families with no change this round are folded: open the one holding the button.
    await btn.evaluate((el) => { const d = el.closest('details'); if (d) d.open = true; });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForSelector('[data-testid="table-viewer"]', { timeout: 15000 });
    await page.waitForTimeout(1200);
    await shot('table-viewer');
    await text('table-viewer');
    await metrics('table-viewer');
    for (const v of ['tv-2d', 'tv-3d']) {
      if (await page.locator(`[data-testid="${v}"]`).count()) { await page.click(`[data-testid="${v}"]`); await page.waitForTimeout(1200); await shot(`table-${v}`); }
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    if (await page.locator('[data-testid="table-viewer"]').isVisible().catch(() => false)) note('Escape did not close the table viewer');
  });

  await tryStep('work-row', async () => {
    const line = lastAi().locator('[data-testid="harness-line"]');
    if (await line.count()) { await line.click(); await page.waitForTimeout(400); await shot('work-row-open'); await line.click(); }
  });

  await tryStep('chip', async () => {
    const chips = lastAi().locator('[data-testid="suggestions"] .chip');
    const labels = await chips.allTextContents();
    note('reply chips: ' + JSON.stringify(labels));
    if (!labels.length) return;
    const before = await page.locator('[data-testid="assistant-message"]').count();
    await chips.first().click();
    await page.waitForFunction((k) => document.querySelectorAll('[data-testid="assistant-message"]').length > k, before, { timeout: 15000 }).catch(() => note('chip gave no new message'));
    await waitReply('chip1');
    await shot('chip1-reply', 6);
    await text('chip1-reply');
  });

  const d2 = csvFile('sep05-0756');
  await tryStep('drive2', async () => {
    await attach(d2);
    await page.click('[data-testid="send"]');
    await waitReply('drive2');
    await shot('drive2-reply', 12);
    await text('drive2-reply');
    await metrics('drive2-reply');
  });

  await tryStep('sidebar', async () => {
    await sidebarOpen();
    await page.waitForTimeout(600);
    await shot('sidebar');
    await text('sidebar');
  });

  await tryStep('new-chat-capabilities', async () => {
    await page.click('[data-testid="new-chat"]');
    await page.waitForSelector('[data-testid="empty"]', { timeout: 15000 });
    await page.waitForTimeout(600);
    await shot('new-chat');
    const labels = await page.locator('[data-testid="welcome-chips"] .chip').allTextContents();
    note('welcome chips: ' + JSON.stringify(labels));
    const cap = page.locator('[data-testid="welcome-chips"] .chip', { hasText: /what can you do/i });
    if (!(await cap.count())) { note('no What can you do chip; typing it'); await page.fill('[data-testid="composer-text"]', 'What can you do?'); await page.keyboard.press('Enter'); }
    else await cap.first().click();
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 });
    await waitReply('capabilities');
    await shot('capabilities', 6);
    await text('capabilities');
  });

  // wrong file type: what happens if the owner attaches a non-CSV
  await tryStep('wrong-file', async () => {
    const bad = path.join(__dirname, 'notes.txt');
    fs.writeFileSync(bad, 'my car feels slow\n');
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-testid="attach"]')]);
    await chooser.setFiles(bad).catch((e) => note('setFiles txt: ' + e.message));
    await page.waitForTimeout(800);
    await shot('wrong-file-attached');
    if (await page.locator('[data-testid="attachment"]').count()) {
      await page.click('[data-testid="send"]');
      await waitReply('wrong-file');
      await shot('wrong-file-reply', 4);
      await text('wrong-file-reply');
    } else note('txt file was not accepted as an attachment');
  });

  fs.writeFileSync(path.join(OUT, `${TAG}-log.txt`), log.join('\n') + '\nerrors:\n' + errors.join('\n'));
  console.log('errors:', errors.length);
  await browser.close();
})().catch((e) => { console.error(e); process.exitCode = 1; });

'use strict';
/* Scratch: screenshot the chat at 390 px and at 1280 px after the owner's Drives. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('playwright');

const CHAT = 'http://127.0.0.1:3000';
const REPO = path.resolve(__dirname, '..', '..');
const OUT = '/private/var/folders/v8/gr87lmq931b37mjfl_88bbnh0000gn/T/opencode';

function ownerCsv(id) {
  const source = fs.readFileSync(path.join(REPO, 'data', `example-${id}.js`), 'utf8');
  return zlib.gunzipSync(Buffer.from(/gz:\s*"([A-Za-z0-9+/=]+)"/.exec(source)[1], 'base64')).toString('utf8');
}
function ownerName(id) {
  const source = fs.readFileSync(path.join(REPO, 'data', `example-${id}.js`), 'utf8');
  return /name:\s*"([^"]+)"/.exec(source)[1];
}

async function pick(page, file) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-testid="upload"]')]);
  await chooser.setFiles(file);
  await page.waitForTimeout(1200);
}

async function run() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kta-shot-'));
  const drives = process.argv.slice(2).length ? process.argv.slice(2) : ['sep01-0813'];
  for (const id of drives) fs.writeFileSync(path.join(dir, ownerName(id)), ownerCsv(id));
  const browser = await chromium.launch({});
  for (const [label, viewport] of [['phone', { width: 390, height: 1600 }], ['desktop', { width: 1280, height: 1400 }]]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    await page.goto(CHAT, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="upload"]');
    for (const id of drives) {
      await pick(page, path.join(dir, ownerName(id)));
      await page.waitForTimeout(4000);
    }
    console.log(label, 'panel:', JSON.stringify(await page.locator('[data-testid="open-steps"]').innerText()));
    await page.screenshot({ path: path.join(OUT, `kta-${label}.png`), fullPage: true });
    console.log('wrote', path.join(OUT, `kta-${label}.png`));
    await page.close();
  }
  await browser.close();
  fs.rmSync(dir, { recursive: true, force: true });
}
run().catch((e) => { console.error(e); process.exitCode = 1; });

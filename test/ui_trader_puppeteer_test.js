import express from 'express';
import path from 'path';
import puppeteer from 'puppeteer';

const PORT = process.env.UI_TEST_PORT || 8080;
const STATIC_DIR = path.resolve(process.cwd(), '../Dev Environment/websites/cc.com/src');

function timeout(ms) { return new Promise(r => setTimeout(r, ms)); }

async function serve() {
  const app = express();
  app.use(express.static(STATIC_DIR));
  return new Promise((resolve, reject) => {
    const srv = app.listen(PORT, () => resolve(srv));
    srv.on('error', reject);
  });
}

async function run() {
  console.log('Serving trader UI from', STATIC_DIR, 'on port', PORT);
  const srv = await serve();
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => { try { console.log('[page]', msg.text()); } catch (e) {} });
    page.on('pageerror', err => { try { console.error('[page error]', err && err.message ? err.message : err); } catch (e) {} });
    const url = `http://localhost:${PORT}/trader/index.html`;
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // wait for the live-price element to exist
    await page.waitForSelector('#live-price', { timeout: 5000 });

    const initial = await page.$eval('#live-price', el => el.textContent.trim());
    console.log('Initial live-price:', initial);

    // wait up to 20s for the price to change to a $numeric value
    const start = Date.now();
    let observed = null;
    while ((Date.now() - start) < 20000) {
      const txt = await page.$eval('#live-price', el => el.textContent.trim());
      if (txt && txt !== initial && /\$?\d/.test(txt)) { observed = txt; break; }
      await timeout(500);
    }

    if (observed) {
      console.log('TEST OK: Trader UI received live price:', observed);
      process.exit(0);
    } else {
      console.error('TEST FAIL: Trader UI did not update live price within timeout');
      process.exit(2);
    }
  } catch (e) {
    console.error('test error', e && e.stack ? e.stack : e);
    process.exit(3);
  } finally {
    try { if (browser) await browser.close(); } catch (e) {}
    try { srv.close(); } catch (e) {}
  }
}

run();

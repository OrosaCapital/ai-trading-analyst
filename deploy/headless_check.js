const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const out = { console: [], errors: [], snapshotStatus: null, wsDetected: false, wsEvents: [] };

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Inject a small wrapper to capture WebSocket creation before app scripts run
  await page.evaluateOnNewDocument(() => {
    (function () {
      const RealWS = window.WebSocket;
      window.__wsEvents = [];
      window.__wsConnected = false;
      function Wrapped(url, protocols) {
        const ws = protocols ? new RealWS(url, protocols) : new RealWS(url);
        try {
          const proto = ws.protocol;
        } catch (e) {}
        window.__wsEvents.push({ type: 'created', url });
        const openCb = ws.onopen;
        ws.addEventListener('open', () => {
          window.__wsConnected = true;
          window.__wsEvents.push({ type: 'open', url });
        });
        ws.addEventListener('close', () => {
          window.__wsEvents.push({ type: 'close', url });
        });
        ws.addEventListener('message', (ev) => {
          try { window.__wsEvents.push({ type: 'message', data: typeof ev.data === 'string' && ev.data.length < 2000 ? ev.data : '[binary/large]' }); } catch (e) {}
        });
        return ws;
      }
      Wrapped.prototype = RealWS.prototype;
      Wrapped.CONNECTING = RealWS.CONNECTING;
      Wrapped.OPEN = RealWS.OPEN;
      Wrapped.CLOSING = RealWS.CLOSING;
      Wrapped.CLOSED = RealWS.CLOSED;
      window.WebSocket = Wrapped;
    })();
  });

  page.on('console', msg => {
    try {
      out.console.push({ type: msg.type(), text: msg.text() });
    } catch (e) {}
  });
  page.on('pageerror', err => out.errors.push(String(err)));

  try {
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle2', timeout: 15000 });
    // wait a moment for app JS to connect
    await page.waitForTimeout(2000);

    out.snapshotStatus = await page.evaluate(() => {
      return document.getElementById('snapshot-status')?.textContent || null;
    });

    const wsInfo = await page.evaluate(() => {
      return { connected: !!window.__wsConnected, events: window.__wsEvents || [] };
    });
    out.wsDetected = wsInfo.connected;
    out.wsEvents = wsInfo.events.slice(-50);

  } catch (err) {
    out.errors.push(String(err));
  }

  await browser.close();

  const dest = '/tmp/headless_check_result.json';
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log('Wrote', dest);
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
})();

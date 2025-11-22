import { spawn } from 'child_process';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

const REPO_ROOT = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const RELAY_SCRIPT = path.join(REPO_ROOT, 'server', 'relay.js');

function waitForRelay(base = 'http://localhost:4000', timeout = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function ping() {
      fetch(`${base}/normalize/kraken?symbol=XRP`).then(r => r.json()).then(j => resolve(true)).catch(err => {
        if (Date.now() - start > timeout) return reject(new Error('relay did not start in time'));
        setTimeout(ping, 300);
      });
    })();
  });
}

async function run() {
  console.log('Starting relay...');
  const child = spawn('node', [RELAY_SCRIPT], { stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, { NODE_ENV: 'test' }) });
  child.stdout.on('data', (d) => process.stdout.write(`[relay] ${d.toString()}`));
  child.stderr.on('data', (d) => process.stderr.write(`[relay.err] ${d.toString()}`));

  try {
    await waitForRelay();
    console.log('Relay is up, running compute endpoint tests...');
    // call compute with simple candles
    const url = 'http://localhost:4000/compute/indicators';
    const payload = {
      candles: [
        { time: 1, open: 100, high: 101, low: 99, close: 100, volume: 10 },
        { time: 2, open: 100, high: 102, low: 99, close: 101, volume: 11 },
        { time: 3, open: 101, high: 103, low: 100, close: 102, volume: 12 }
      ],
      indicators: ['ema9','rsi14']
    };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json();
    console.log('compute response:', j);
    if (!j || !j.ok) throw new Error('compute endpoint returned error');
    if (!j.indicators || !j.indicators.ema9) throw new Error('missing ema9 in response');

    // test symbol fetch path
    const r2 = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: 'XBT/USD', interval: 1, count: 50, indicators: ['ema9'] }) });
    const j2 = await r2.json();
    console.log('symbol compute response:', j2);
    if (!j2 || !j2.ok) throw new Error('symbol compute returned error');

    console.log('Integration tests passed');
  } catch (err) {
    console.error('Integration test failed', err);
    process.exitCode = 2;
  } finally {
    console.log('Stopping relay...');
    child.kill('SIGTERM');
  }
}

run();

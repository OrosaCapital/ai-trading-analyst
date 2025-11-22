// Simple integration test: connect to relay WS, subscribe to XRP/USD, wait for normalized event
import WebSocket from 'ws';

const RELAY_WS = process.env.RELAY_WS || 'ws://localhost:4000/relay';

function timeout(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  console.log('Connecting to', RELAY_WS);
  const ws = new WebSocket(RELAY_WS);

  let received = false;
  let done = false;

  ws.on('open', () => {
    console.log('ws open');
    // subscribe to canonical XRP/USD
    ws.send(JSON.stringify({ action: 'subscribe', pair: 'XRP/USD' }));
  });

  ws.on('message', (msg) => {
    try {
      const j = JSON.parse(msg.toString());
      if (j && j.event === 'normalized') {
        console.log('received normalized event:', JSON.stringify(j.payload).slice(0, 300));
        received = true;
        done = true;
        ws.close();
      }
    } catch (e) {
      // ignore
    }
  });

  ws.on('error', (err) => { console.error('ws error', err && err.message); done = true; });
  ws.on('close', () => { if (!done) done = true; });

  const start = Date.now();
  const timeoutMs = 15000;
  while (!done && (Date.now() - start) < timeoutMs) {
    // poll
    await timeout(250);
  }

  if (received) {
    console.log('TEST OK: received normalized event');
    process.exit(0);
  } else {
    console.error('TEST FAIL: no normalized event received within timeout');
    process.exit(2);
  }
}

run().catch((e) => { console.error('test error', e && e.stack ? e.stack : e); process.exit(3); });

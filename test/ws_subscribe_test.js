// Simple test client to connect to the local relay WS and subscribe to a Kraken pair
// Run: node test/ws_subscribe_test.js
import WebSocket from 'ws';

const RELAY = process.env.RELAY || 'ws://localhost:4000/relay';
console.log('Connecting to', RELAY);

const ws = new WebSocket(RELAY);

ws.on('open', () => {
  console.log('WS open, sending subscribe for XBTUSD');
  ws.send(JSON.stringify({ action: 'subscribe', pair: 'XBTUSD', interval: 1 }));
});

ws.on('message', (data) => {
  try {
    const d = JSON.parse(data.toString());
    console.log('MSG:', JSON.stringify(d).slice(0, 1000));
  } catch (err) {
    console.log('RAW:', data.toString().slice(0, 1000));
  }
});

ws.on('error', (err) => console.error('WS error', err));

// After 10s unsubscribe and exit
setTimeout(() => {
  console.log('Unsubscribing and closing');
  try { ws.send(JSON.stringify({ action: 'unsubscribe', pair: 'XBTUSD' })); } catch (e) {}
  ws.close();
  setTimeout(() => process.exit(0), 500);
}, 10000);

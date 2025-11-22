import { testSMA, testBollinger, testATR, testADX_basic, testMACD_and_EMA_RSI_presence } from './test_indicators_basic.js';

function run() {
  const tests = [
    {name: 'SMA', fn: testSMA},
    {name: 'Bollinger', fn: testBollinger},
    {name: 'ATR', fn: testATR},
    {name: 'ADX', fn: testADX_basic},
    {name: 'MACD/EMA/RSI presence', fn: testMACD_and_EMA_RSI_presence}
  ];

  let failed = 0;
  for (const t of tests) {
    try {
      t.fn();
      console.log('PASS', t.name);
    } catch (err) {
      failed++;
      console.error('FAIL', t.name, err && err.message);
    }
  }

  if (failed > 0) {
    console.error(failed, 'tests failed');
    process.exit(1);
  } else {
    console.log('All tests passed');
    process.exit(0);
  }
}

run();

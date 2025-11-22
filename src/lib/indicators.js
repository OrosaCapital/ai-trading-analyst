// Simple indicator implementations (UI/demo friendly)
// Functions operate on arrays and return arrays aligned to input length
// Candle object shape expected: { time, open, high, low, close, volume }

function sma(values, period) {
  const out = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function ema(values, period) {
  const out = new Array(values.length).fill(null);
  if (period <= 0) return out;
  const k = 2 / (period + 1);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null) { out[i] = null; continue; }
    if (prev == null) {
      // find first non-null and initialize with SMA of first period if possible
      if (i >= period - 1) {
        let s = 0;
        for (let j = i - (period - 1); j <= i; j++) s += values[j];
        prev = s / period;
        out[i] = prev;
      } else {
        out[i] = null;
      }
    } else {
      prev = (v - prev) * k + prev;
      out[i] = prev;
    }
  }
  return out;
}

function rsi(values, period = 14) {
  const out = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    const gain = Math.max(delta, 0);
    const loss = Math.max(-delta, 0);
    if (i <= period) {
      gains += gain; losses += loss;
      if (i === period) {
        let avgGain = gains / period;
        let avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        out[i] = 100 - (100 / (1 + rs));
      }
    } else {
      // Wilder's smoothing
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      const rs = losses === 0 ? 100 : gains / losses;
      out[i] = 100 - (100 / (1 + rs));
    }
  }
  return out;
}

function macd(values, fast = 12, slow = 26, signal = 9) {
  const fastE = ema(values, fast);
  const slowE = ema(values, slow);
  const macdLine = values.map((_, i) => {
    const a = fastE[i];
    const b = slowE[i];
    return (a == null || b == null) ? null : a - b;
  });
  const signalLine = ema(macdLine.map(v => v == null ? 0 : v), signal);
  const histogram = macdLine.map((v, i) => (v == null || signalLine[i] == null) ? null : v - signalLine[i]);
  return { macd: macdLine, signal: signalLine, hist: histogram };
}

function vwap(candles) {
  const out = new Array(candles.length).fill(null);
  let cumulativePV = 0, cumulativeV = 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typical = (c.high + c.low + c.close) / 3;
    cumulativePV += typical * c.volume;
    cumulativeV += c.volume;
    out[i] = cumulativeV === 0 ? null : cumulativePV / cumulativeV;
  }
  return out;
}

function atr(candles, period = 14) {
  const out = new Array(candles.length).fill(null);
  if (candles.length === 0) return out;
  const trs = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (i === 0) {
      trs.push(c.high - c.low);
    } else {
      const prev = candles[i - 1];
      const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
      trs.push(tr);
    }
  }
  // ATR uses Wilder smoothing: first ATR is SMA(trs, period)
  let sum = 0;
  for (let i = 0; i < trs.length; i++) {
    sum += trs[i];
    if (i === period - 1) {
      const firstAtr = sum / period;
      out[i] = firstAtr;
      var prevAtr = firstAtr;
    } else if (i >= period) {
      prevAtr = (prevAtr * (period - 1) + trs[i]) / period;
      out[i] = prevAtr;
    }
  }
  return out;
}

export { sma, ema, rsi, macd, vwap, atr };

// Additional indicators

// Bollinger Bands (returns {middle, upper, lower}) - uses SMA and stddev
function bollinger(values, period = 20, stdDevMult = 2) {
  const middle = sma(values, period);
  const upper = new Array(values.length).fill(null);
  const lower = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    const mean = sum / period;
    let sd = 0;
    for (let j = i - period + 1; j <= i; j++) sd += Math.pow(values[j] - mean, 2);
    sd = Math.sqrt(sd / period);
    upper[i] = mean + stdDevMult * sd;
    lower[i] = mean - stdDevMult * sd;
  }
  return { middle, upper, lower };
}

// Stochastic %K and %D (fast %K, slow %D)
function stochastic(candles, kPeriod = 14, dPeriod = 3) {
  const k = new Array(candles.length).fill(null);
  const d = new Array(candles.length).fill(null);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let highest = -Infinity, lowest = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      highest = Math.max(highest, candles[j].high);
      lowest = Math.min(lowest, candles[j].low);
    }
    const close = candles[i].close;
    k[i] = highest === lowest ? 50 : ((close - lowest) / (highest - lowest)) * 100;
    // compute d as SMA of k over dPeriod
    if (i >= kPeriod - 1 + dPeriod - 1) {
      let sum = 0;
      for (let j = i - dPeriod + 1; j <= i; j++) sum += k[j];
      d[i] = sum / dPeriod;
    }
  }
  return { k, d };
}

// CCI (Commodity Channel Index)
function cci(candles, period = 20) {
  const out = new Array(candles.length).fill(null);
  const typical = candles.map(c => (c.high + c.low + c.close) / 3);
  const smaTypical = sma(typical, period);
  for (let i = period - 1; i < candles.length; i++) {
    let mean = smaTypical[i];
    let md = 0;
    for (let j = i - period + 1; j <= i; j++) md += Math.abs(typical[j] - mean);
    md /= period;
    out[i] = md === 0 ? 0 : (typical[i] - mean) / (0.015 * md);
  }
  return out;
}

// ROC (Rate of Change) - percentage change
function roc(values, period = 12) {
  const out = new Array(values.length).fill(null);
  for (let i = period; i < values.length; i++) {
    const prev = values[i - period];
    out[i] = prev === 0 ? null : ((values[i] - prev) / prev) * 100;
  }
  return out;
}

// OBV (On-Balance Volume)
function obv(candles) {
  const out = new Array(candles.length).fill(null);
  let total = 0;
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { out[i] = 0; continue; }
    if (candles[i].close > candles[i - 1].close) total += candles[i].volume;
    else if (candles[i].close < candles[i - 1].close) total -= candles[i].volume;
    out[i] = total;
  }
  return out;
}

// Chaikin Money Flow (CMF)
function cmf(candles, period = 21) {
  const out = new Array(candles.length).fill(null);
  let sumPV = 0, sumV = 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const m = (c.close - c.low) - (c.high - c.close);
    const mfv = (c.high === c.low) ? 0 : ((c.close - c.low) - (c.high - c.close)) / (c.high - c.low) * c.volume;
    sumPV += mfv;
    sumV += c.volume;
    if (i >= period - 1) {
      // windowed sum
      let wSumPV = 0, wSumV = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const cc = candles[j];
        const wmfv = (cc.high === cc.low) ? 0 : ((cc.close - cc.low) - (cc.high - cc.close)) / (cc.high - cc.low) * cc.volume;
        wSumPV += wmfv;
        wSumV += cc.volume;
      }
      out[i] = wSumV === 0 ? null : wSumPV / wSumV;
    }
  }
  return out;
}

// ADX (uses True Range and directional movement)
function adx(candles, period = 14) {
  const n = candles.length;
  const out = new Array(n).fill(null);
  if (n <= period) return out;

  const tr = new Array(n).fill(0);
  const plusDM = new Array(n).fill(0);
  const minusDM = new Array(n).fill(0);

  for (let i = 1; i < n; i++) {
    const c = candles[i]; const p = candles[i - 1];
    tr[i] = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
    const upMove = c.high - p.high;
    const downMove = p.low - c.low;
    plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
    minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;
  }

  // Wilder smoothing of TR, +DM, -DM
  const smTR = new Array(n).fill(null);
  const smPlus = new Array(n).fill(null);
  const smMinus = new Array(n).fill(null);

  // initial sums for i = 1..period
  let sumTR = 0, sumPlus = 0, sumMinus = 0;
  for (let i = 1; i <= period; i++) {
    sumTR += tr[i] || 0;
    sumPlus += plusDM[i] || 0;
    sumMinus += minusDM[i] || 0;
  }
  smTR[period] = sumTR;
  smPlus[period] = sumPlus;
  smMinus[period] = sumMinus;

  for (let i = period + 1; i < n; i++) {
    smTR[i] = (smTR[i - 1] - (smTR[i - 1] / period)) + tr[i];
    smPlus[i] = (smPlus[i - 1] - (smPlus[i - 1] / period)) + plusDM[i];
    smMinus[i] = (smMinus[i - 1] - (smMinus[i - 1] / period)) + minusDM[i];
  }

  const plusDI = new Array(n).fill(null);
  const minusDI = new Array(n).fill(null);
  const dx = new Array(n).fill(null);

  for (let i = period; i < n; i++) {
    if (!smTR[i] || smTR[i] === 0) { plusDI[i] = 0; minusDI[i] = 0; dx[i] = 0; continue; }
    plusDI[i] = 100 * (smPlus[i] / smTR[i]);
    minusDI[i] = 100 * (smMinus[i] / smTR[i]);
    const denom = plusDI[i] + minusDI[i];
    dx[i] = denom === 0 ? 0 : (100 * Math.abs(plusDI[i] - minusDI[i]) / denom);
  }

  // ADX: first value is SMA of DX over period range starting at 'period'
  const adxArr = new Array(n).fill(null);
  let dxSum = 0; let dxCount = 0;
  for (let i = period; i < n; i++) {
    if (dx[i] == null) continue;
    dxSum += dx[i]; dxCount++;
    if (i === period + period - 1 || i === n - 1) {
      // compute first ADX at index i
      const firstAdx = dxSum / dxCount;
      adxArr[i] = firstAdx;
      // Wilder smoothing for subsequent values
      for (let j = i + 1; j < n; j++) {
        adxArr[j] = ((adxArr[j - 1] * (period - 1)) + dx[j]) / period;
      }
      break;
    }
  }

  // Align ADX output to candles array (copy values)
  for (let i = 0; i < n; i++) out[i] = adxArr[i] == null ? null : adxArr[i];
  return out;
}

// Parabolic SAR (basic implementation)
function parabolicSAR(candles, step = 0.02, maxStep = 0.2) {
  const out = new Array(candles.length).fill(null);
  if (candles.length === 0) return out;
  let af = step; let ep = candles[0].high; let sar = candles[0].low; let up = true;
  out[0] = sar;
  for (let i = 1; i < candles.length; i++) {
    sar = sar + af * (ep - sar);
    const c = candles[i];
    if (up) {
      if (c.low < sar) {
        up = false; sar = ep; ep = c.low; af = step; out[i] = sar;
      } else {
        if (c.high > ep) { ep = c.high; af = Math.min(maxStep, af + step); }
        out[i] = sar;
      }
    } else {
      if (c.high > sar) {
        up = true; sar = ep; ep = c.high; af = step; out[i] = sar;
      } else {
        if (c.low < ep) { ep = c.low; af = Math.min(maxStep, af + step); }
        out[i] = sar;
      }
    }
  }
  return out;
}

// TRIX (triple EMA) - return trix line and signal (EMA of TRIX)
function trix(values, period = 15, signal = 9) {
  const first = ema(values, period);
  const second = ema(first.map(v => v == null ? null : v), period);
  const third = ema(second.map(v => v == null ? null : v), period);
  // trix is percent rate of change of third
  const trixLine = new Array(values.length).fill(null);
  for (let i = 1; i < values.length; i++) {
    if (third[i] == null || third[i - 1] == null) trixLine[i] = null;
    else trixLine[i] = ((third[i] - third[i - 1]) / third[i - 1]) * 100;
  }
  const signalLine = ema(trixLine.map(v => v == null ? 0 : v), signal);
  return { trix: trixLine, signal: signalLine };
}

// Keltner Channels (EMA centerline + ATR multiplier)
function keltner(candles, emaPeriod = 20, atrPeriod = 10, mult = 1.5) {
  const closes = candles.map(c => c.close);
  const center = ema(closes, emaPeriod);
  const atrVals = atr(candles, atrPeriod);
  const upper = new Array(candles.length).fill(null);
  const lower = new Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (center[i] == null || atrVals[i] == null) continue;
    upper[i] = center[i] + mult * atrVals[i];
    lower[i] = center[i] - mult * atrVals[i];
  }
  return { center, upper, lower };
}

export { bollinger, stochastic, cci, roc, obv, cmf, adx, parabolicSAR, trix, keltner };


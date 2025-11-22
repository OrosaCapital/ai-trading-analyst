const TIMEFRAME_MAP = { '1m': 1, '5m': 5, '15m': 15, '1h': 60 };
const POLL_INTERVAL_MS = 20000;
const INDICATOR_KEYS = ['ema9', 'ema21', 'rsi14', 'macd', 'vwap', 'atr14'];

document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupNavLinks();
  const controller = new TraderDashboardController();
  controller.init();
});

function setupThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle');
  if (!themeBtn) return;
  themeBtn.addEventListener('click', () => {
    const body = document.body;
    if (body.classList.contains('light')) {
      body.classList.remove('light');
      themeBtn.textContent = 'Dark';
    } else {
      body.classList.add('light');
      themeBtn.textContent = 'Light';
    }
  });
}

function setupNavLinks() {
  document.querySelectorAll('.top-nav a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.sidebar-stack li').forEach(li => li.classList.remove('active'));
      document.querySelector('.sidebar-stack li')?.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function updateIndicatorSummary() {
  const indicators = document.querySelectorAll('.indicator-list .indicator');
  const live = Array.from(indicators).filter(el => el.dataset.connected === 'true').length;
  const total = indicators.length;
  if (!total) return;
  const pct = Math.round((live / total) * 100);
  const pctEl = document.getElementById('indicator-live-percentage');
  const liveEl = document.getElementById('indicator-live-count');
  const totalEl = document.getElementById('indicator-total-count');
  const noteEl = document.getElementById('indicator-live-note');
  const statusEl = document.querySelector('.indicator-summary .metric-status');
  if (liveEl) liveEl.textContent = live;
  if (totalEl) totalEl.textContent = total;
  if (pctEl) {
    pctEl.textContent = `${pct}%`;
    pctEl.classList.remove('up', 'down', 'neutral');
    pctEl.classList.add(pct === 100 ? 'up' : pct >= 50 ? 'neutral' : 'down');
  }

  async fetchCanonicalSymbol(symbol) {
    if (!symbol || !this.relayHttp) return null;
    try {
      const url = `${this.relayHttp}/normalize/kraken?symbol=${encodeURIComponent(symbol)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.canonicalSymbol) {
        if (this.canonicalEl) this.canonicalEl.textContent = `Canonical: ${data.canonicalSymbol}`;
        return data.canonicalSymbol;
      }
    } catch (e) { /* ignore */ }
    return null;
  }
  if (noteEl) {
    noteEl.textContent = pct === 100 ? 'All feeds healthy' : pct >= 50 ? 'Partial coverage' : 'Awaiting feeds';
  }
  if (statusEl) statusEl.setAttribute('data-connected', pct === 100 ? 'true' : 'false');
}

const formatNumber = (value, digits = 2) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const abs = Math.abs(value);
  const fixed = abs >= 100 ? 2 : abs >= 1 ? Math.min(4, digits + 2) : Math.min(6, digits + 4);
  return Number(value).toFixed(fixed);
};

const pickSeriesLast = (series) => {
  if (!Array.isArray(series)) return null;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] != null) return series[i];
  }
  return null;
};

class TraderDashboardController {
  constructor() {
    const body = document.body || {};
    this.relayHttp = (body.dataset?.relayHttp || 'http://localhost:4000').replace(/\/$/, '');
    const params = new URLSearchParams(window.location.search);
    this.defaultSymbol = (params.get('symbol') || body.dataset?.defaultSymbol || 'XRP/USD').toUpperCase();
    this.symbolInput = document.getElementById('symbol-input');
    this.timeframeSelect = document.getElementById('timeframe-select');
    this.refreshBtn = document.getElementById('market-refresh');
    this.statusEl = document.getElementById('snapshot-status');
    this.canonicalEl = document.getElementById('canonical-pair');
    this.liveSymbolEl = document.getElementById('live-symbol');
    this.livePriceEl = document.getElementById('live-price');
    this.liveDeltaEl = document.getElementById('live-price-delta');
    this.chart = null;
    this.candleSeries = null;
    this.ema9Series = null;
    this.ema21Series = null;
    this.pollTimer = null;
    this.fetchController = null;
    this.previousClose = null;
    this.currentInterval = TIMEFRAME_MAP[params.get('tf') || '1m'] || 1;
    // relay listener state
    this.relayListener = null;
    this.relayRetry = 0;
    this.RELAY_WS_URL = (() => {
      try {
        const base = (this.relayHttp || 'http://localhost:4000').replace(/\/$/, '');
        const proto = base.startsWith('https') ? 'wss:' : 'ws:';
        return `${proto}//${base.replace(/^https?:\/\//, '')}/relay`;
      } catch (e) { return 'ws://localhost:4000/relay'; }
    })();
  }

  init() {
    if (this.symbolInput) this.symbolInput.value = this.defaultSymbol;
    if (this.timeframeSelect) this.timeframeSelect.value = this.lookupIntervalLabel(this.currentInterval);
    if (this.liveSymbolEl) this.liveSymbolEl.textContent = this.defaultSymbol.toUpperCase();
    updateIndicatorSummary();
    this.initChart();
    this.attachEvents();
    this.loadSnapshot();
    this.startPolling();
    // start a background listener to receive normalized events from relay
    try { this.startRelayListener(); } catch (e) { /* ignore */ }
    // heartbeat to mark indicator connectivity based on live ticks
    this.lastTickAt = null;
    this.feedHeartbeatInterval = null;
    this.startFeedHeartbeatChecker();
  }

  startFeedHeartbeatChecker() {
    const THRESHOLD_MS = 30 * 1000; // 30s
    if (this.feedHeartbeatInterval) clearInterval(this.feedHeartbeatInterval);
    this.feedHeartbeatInterval = setInterval(() => {
      try {
        if (!this.lastTickAt) {
          // no ticks received yet
          return;
        }
        const age = Date.now() - this.lastTickAt;
        const healthy = age < THRESHOLD_MS;
        // set indicator elements accordingly
        document.querySelectorAll('.indicator-list .indicator').forEach(el => {
          el.dataset.connected = healthy ? 'true' : 'false';
        });
        updateIndicatorSummary();
        // also update overall snapshot status
        this.setStatus(healthy ? 'Live' : 'Stale', healthy ? 'good' : 'bad');
      } catch (e) {}
    }, 5000);
  }

  attachEvents() {
    this.refreshBtn?.addEventListener('click', () => this.loadSnapshot());
    this.timeframeSelect?.addEventListener('change', () => this.loadSnapshot());
    this.symbolInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.loadSnapshot();
      }
    });
    // on blur or manual change, resolve canonical symbol and refresh snapshot
    this.symbolInput?.addEventListener('blur', async () => {
      const sym = this.getSymbolInputValue();
      await this.fetchCanonicalSymbol(sym);
      this.loadSnapshot();
    });
    this.symbolInput?.addEventListener('change', async () => {
      const sym = this.getSymbolInputValue();
      await this.fetchCanonicalSymbol(sym);
      this.loadSnapshot();
    });
  }

  lookupIntervalLabel(interval) {
    const entry = Object.entries(TIMEFRAME_MAP).find(([label, value]) => value === interval);
    return entry ? entry[0] : '1m';
  }

  getSelectedInterval() {
    const label = (this.timeframeSelect?.value || '1m').toLowerCase();
    return TIMEFRAME_MAP[label] || 1;
  }

  getSymbolInputValue() {
    const val = this.symbolInput?.value || this.defaultSymbol;
    return val.trim().toUpperCase();
  }

  initChart() {
    const chartsLib = window.LightweightCharts || window.lightweightCharts || {};
    const createChartFn = typeof chartsLib.createChart === 'function' ? chartsLib.createChart : null;
    if (!createChartFn) {
      console.warn('[TraderDashboard] LightweightCharts not available, skipping chart init');
      return;
    }
    const container = document.getElementById('tv-chart');
    if (!container) return;
    this.chart = createChartFn(container, {
      width: container.clientWidth,
      height: container.clientHeight || 480,
      layout: {
        background: { type: 'solid', color: '#04102a' },
        textColor: '#aebdde'
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' }
      },
      crosshair: { mode: window.LightweightCharts.CrosshairMode.Normal },
      rightPriceScale: { visible: true },
      timeScale: { visible: true }
    });
    if (typeof this.chart.addCandlestickSeries === 'function') {
      this.candleSeries = this.chart.addCandlestickSeries({
        upColor: '#00d0ff',
        downColor: '#ff7b39',
        borderVisible: false,
        wickUpColor: '#00d0ff',
        wickDownColor: '#ff7b39'
      });
    } else {
      console.warn('[TraderDashboard] Chart instance missing addCandlestickSeries');
    }
    if (typeof this.chart.addLineSeries === 'function') {
      this.ema9Series = this.chart.addLineSeries({ color: '#ffd966', lineWidth: 2 });
      this.ema21Series = this.chart.addLineSeries({ color: '#1cffb4', lineWidth: 1 });
    }
    window.addEventListener('resize', () => {
      if (this.chart) this.chart.applyOptions({ width: container.clientWidth });
    });
  }

  startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = window.setInterval(() => this.loadSnapshot({ silent: true }), POLL_INTERVAL_MS);
  }

  async loadSnapshot(options = {}) {
    const symbol = this.getSymbolInputValue();
    const interval = this.getSelectedInterval();
    this.currentInterval = interval;
    if (this.liveSymbolEl) this.liveSymbolEl.textContent = symbol;

    if (this.fetchController) this.fetchController.abort();
    const controller = new AbortController();
    this.fetchController = controller;

    if (!options.silent) this.setStatus('Fetching…', 'pending');

    try {
      const res = await fetch(`${this.relayHttp}/compute/indicators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, interval, count: 360, indicators: INDICATOR_KEYS, source: 'ui' }),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'compute failed');
      this.applySnapshot(data, { symbol, interval });
      this.setStatus('Live', 'good');
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[TraderDashboard] snapshot error', err);
      this.setStatus('Error', 'bad');
      this.flagAllIndicatorsDown();
    } finally {
      if (this.fetchController === controller) this.fetchController = null;
      updateIndicatorSummary();
    }
  }

  applySnapshot(snapshot, meta) {
    const candles = snapshot.candles || [];
    const indicators = snapshot.indicators || {};
    const last = snapshot.last || {};

    if (this.canonicalEl) {
      this.canonicalEl.textContent = snapshot.canonicalSymbol ? `Canonical: ${snapshot.canonicalSymbol}` : 'Canonical: —';
    }

    this.updateLivePrice(last.close ?? (candles[candles.length - 1]?.close));
    this.updateIndicators(last, indicators);
    this.updateChart(candles, indicators);
  }

  updateChart(candles, indicators) {
    if (!this.chart || !this.candleSeries) this.initChart();
    if (!this.chart || !this.candleSeries) return;

    const seriesData = candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }));
    this.candleSeries.setData(seriesData);

    const ema9 = this.projectSeries(candles, indicators.ema9);
    const ema21 = this.projectSeries(candles, indicators.ema21);
    if (ema9 && this.ema9Series) this.ema9Series.setData(ema9);
    if (ema21 && this.ema21Series) this.ema21Series.setData(ema21);
    this.chart.timeScale().fitContent();
  }

  projectSeries(candles, values) {
    if (!Array.isArray(values) || !candles.length) return null;
    const out = [];
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const candle = candles[i];
      if (value == null || !candle) continue;
      out.push({ time: candle.time, value });
    }
    return out;
  }

  updateIndicators(last, indicators) {
    const ema9 = last.ema9 ?? pickSeriesLast(indicators.ema9);
    const ema21 = last.ema21 ?? pickSeriesLast(indicators.ema21);
    const rsi14 = last.rsi14 ?? pickSeriesLast(indicators.rsi14);
    const macdObj = last.macd || {};
    const macdVal = macdObj.macd ?? null;
    const macdSignal = macdObj.signal ?? null;
    const vwapVal = last.vwap ?? pickSeriesLast(indicators.vwap);
    const atrVal = last.atr14 ?? pickSeriesLast(indicators.atr14);

    this.setIndicatorBlock('ema', [
      { id: 'ema9-val', value: ema9 },
      { id: 'ema21-val', value: ema21 }
    ]);
    this.setIndicatorBlock('rsi', [{ id: 'rsi14-val', value: rsi14 }]);
    this.setIndicatorBlock('macd', [{ id: 'macd-val', value: macdVal }], macdSignal);
    this.setIndicatorBlock('vwap', [{ id: 'vwap-val', value: vwapVal }]);
    this.setIndicatorBlock('atr', [{ id: 'atr14-val', value: atrVal }]);
  }

  setIndicatorBlock(key, fields, extraSignal) {
    const block = document.querySelector(`.indicator[data-indicator="${key}"]`);
    if (!block) return;
    let connected = true;
    fields.forEach(({ id, value }) => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatNumber(value);
      if (value == null || Number.isNaN(Number(value))) connected = false;
    });
    if (key === 'macd') {
      const signalEl = document.getElementById('macd-signal-val');
      if (signalEl) signalEl.textContent = extraSignal != null ? `(sig: ${formatNumber(extraSignal, 4)})` : '(sig: —)';
      if (extraSignal == null) connected = false;
    }
    this.setIndicatorStatus(block, connected);
  }

  setIndicatorStatus(block, connected) {
    block.dataset.connected = connected ? 'true' : 'false';
    const statusDot = block.querySelector('.indicator-status');
    if (statusDot) statusDot.setAttribute('aria-label', connected ? 'Data connected' : 'Data disconnected');
  }

  flagAllIndicatorsDown() {
    document.querySelectorAll('.indicator-list .indicator').forEach(el => {
      el.dataset.connected = 'false';
      const dot = el.querySelector('.indicator-status');
      if (dot) dot.setAttribute('aria-label', 'Data disconnected');
    });
  }

  updateLivePrice(close) {
    if (!this.livePriceEl || !this.liveDeltaEl) return;
    const price = close != null ? Number(close) : null;
    if (price == null || Number.isNaN(price)) {
      this.livePriceEl.textContent = '—';
      this.liveDeltaEl.textContent = '0.00%';
      this.liveDeltaEl.style.color = '#7a8b9a';
      return;
    }
    const prev = this.previousClose;
    const diff = prev != null ? price - prev : 0;
    const pct = prev ? (diff / prev) * 100 : 0;
    this.livePriceEl.textContent = `$${formatNumber(price, 2)}`;
    this.liveDeltaEl.textContent = `${diff >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    this.liveDeltaEl.style.color = diff >= 0 ? '#1cffb4' : '#ff4d6d';
    this.previousClose = price;
  }

  setStatus(text, state) {
    if (!this.statusEl) return;
    this.statusEl.textContent = text;
    this.statusEl.classList.remove('good', 'bad', 'pending');
    if (state) this.statusEl.classList.add(state);
  }

  // --- Relay WS listener for normalized events ---
  setRelayStatus(text, healthy = true) {
    try {
      if (!this.statusEl) return;
      this.statusEl.textContent = text;
      this.statusEl.style.opacity = healthy ? '1' : '0.7';
    } catch (e) {}
  }

  startRelayListener() {
    if (this.relayListener && this.relayListener.readyState === WebSocket.OPEN) return;
    try {
      this.relayListener = new WebSocket(this.RELAY_WS_URL);
    } catch (e) {
      this.relayListener = null;
      this.scheduleRelayRetry();
      return;
    }

    this.relayListener.addEventListener('open', () => {
      this.relayRetry = 0;
      this.setRelayStatus('Relay: connected');
    });

    this.relayListener.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg && msg.event === 'normalized' && msg.payload) {
          const p = msg.payload;
          // OHLC
          if (p.type === 'ohlc' && p.data) {
            const pd = p.data;
            const candle = { time: Number(pd.time), open: +pd.open, high: +pd.high, low: +pd.low, close: +pd.close, volume: +pd.volume };
            // merge into current chart candles
            const existing = this.candleSeries && this.candleSeries._data ? this.candleSeries._data : null;
            // best-effort: update series by using setData for now (we assume snapshot will refresh)
            // fetch currently displayed candles by reusing loadSnapshot on interval if needed
            // For now, update via chart update if possible
            try {
              // try to use update if last candle matches
              const last = this._lastCandle || null;
              if (last && last.time === candle.time) {
                this.candleSeries.update({ time: candle.time, open: candle.open, high: candle.high, low: candle.low, close: candle.close });
                this._lastCandle = candle;
              } else {
                // append by setting new data slice (cheap approach)
                // pull current data via chart.timeScale().getVisibleRange or rely on snapshot reload
                // fallback: setStatus to indicate live tick received
                this.setRelayStatus('Relay: ohlc tick');
                this._lastCandle = candle;
              }
            } catch (e) { /* ignore */ }
            try {
              const selected = this.getSymbolInputValue();
              const canonicalFromPage = (this.canonicalEl && this.canonicalEl.textContent) ? this.canonicalEl.textContent.replace(/^Canonical:\s*/i, '').trim() : null;
              const matchesSymbol = (p.symbol && p.symbol.toUpperCase() === selected.toUpperCase()) || (p.canonicalSymbol && p.canonicalSymbol.toUpperCase() === selected.toUpperCase()) || (canonicalFromPage && canonicalFromPage.toUpperCase() === (p.canonicalSymbol || '').toUpperCase());
              if (matchesSymbol) {
                this.updateLivePrice(candle.close);
                // mark tick received for heartbeat and mark indicators as connected
                try {
                  this.lastTickAt = Date.now();
                  document.querySelectorAll('.indicator-list .indicator').forEach(el => { el.dataset.connected = 'true'; });
                  updateIndicatorSummary();
                } catch (e) {}
              }
            } catch (e) { /* ignore */ }
          }

          // Quote (market cap)
          if (p.type === 'quote' && p.data) {
            try {
              let mc = null;
              const json = p.data;
              if (json && json.data) {
                const key = Object.keys(json.data)[0];
                mc = json.data[key] && json.data[key].quote && json.data[key].quote.USD && json.data[key].quote.USD.market_cap;
              }
              if (!mc && json && json.market_cap) mc = json.market_cap;
              const el = document.getElementById('market-cap');
              if (el) el.textContent = mc ? `$${Math.round(mc).toLocaleString()}` : el.textContent || '—';
              if (mc) this.setIndicatorBlock('vwap', [{ id: 'vwap-val', value: mc }]);
            } catch (e) {}
          }

          // Funding / open interest
          if ((p.type === 'funding' || p.type === 'fundingRate') && p.data) {
            try {
              const data = p.data || {};
              const fr = data.fundingRate || data.funding_rate || data.rate || data.value || null;
              const oi = data.openInterest || data.open_interest || data.oi || null;
              const fundingEl = document.getElementById('funding-rate');
              const oiEl = document.getElementById('open-interest');
              if (fr != null && fundingEl) fundingEl.textContent = String(fr);
              if (oi != null && oiEl) oiEl.textContent = String(oi);
            } catch (e) {}
          }
        }
      } catch (e) { /* ignore malformed */ }
    });

    this.relayListener.addEventListener('close', () => {
      this.setRelayStatus('Relay: disconnected', false);
      this.scheduleRelayRetry();
    });
    this.relayListener.addEventListener('error', () => {
      this.setRelayStatus('Relay: error', false);
      try { this.relayListener.close(); } catch (e) {}
      this.scheduleRelayRetry();
    });
  }

  scheduleRelayRetry() {
    this.relayRetry = Math.min(12, this.relayRetry + 1);
    const backoff = Math.min(30000, 500 * Math.pow(2, this.relayRetry));
    setTimeout(() => { try { this.startRelayListener(); } catch (e) {} }, backoff);
  }
}

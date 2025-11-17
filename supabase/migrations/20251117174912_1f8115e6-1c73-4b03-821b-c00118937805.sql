-- AI-Powered Day Trading System Database Schema

-- 1. Price Logging Table (Tatum 1m, 5m, 10m, 15m intervals)
CREATE TABLE tatum_price_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  price numeric NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  interval text NOT NULL CHECK (interval IN ('1m', '5m', '10m', '15m')),
  volume numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_price_logs_symbol_time ON tatum_price_logs(symbol, timestamp DESC);
CREATE INDEX idx_price_logs_interval ON tatum_price_logs(symbol, interval, timestamp DESC);

-- 2. AI Trading Signals Table
CREATE TABLE ai_trading_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('LONG', 'SHORT', 'NO TRADE')),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  reasoning jsonb NOT NULL,
  trend_explanation text,
  volume_explanation text,
  liquidity_explanation text,
  coinglass_explanation text,
  entry_trigger_explanation text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_signals_symbol_time ON ai_trading_signals(symbol, timestamp DESC);

-- 3. CoinGlass Metrics Cache Table (4hr refresh)
CREATE TABLE coinglass_metrics_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('funding', 'openinterest', 'liquidations', 'longshort', 'takervolume')),
  data jsonb NOT NULL,
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX idx_metrics_cache_symbol ON coinglass_metrics_cache(symbol, metric_type, expires_at DESC);

-- Enable RLS for all tables (public access for now, can be restricted later)
ALTER TABLE tatum_price_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coinglass_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for trading app)
CREATE POLICY "Public can read price logs" ON tatum_price_logs FOR SELECT USING (true);
CREATE POLICY "Public can insert price logs" ON tatum_price_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read signals" ON ai_trading_signals FOR SELECT USING (true);
CREATE POLICY "Public can insert signals" ON ai_trading_signals FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read metrics cache" ON coinglass_metrics_cache FOR SELECT USING (true);
CREATE POLICY "Public can insert metrics cache" ON coinglass_metrics_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete expired metrics" ON coinglass_metrics_cache FOR DELETE USING (true);
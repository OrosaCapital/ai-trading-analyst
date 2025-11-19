-- Create market_candles table for storing OHLCV data
CREATE TABLE IF NOT EXISTS public.market_candles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL, -- 1m, 5m, 15m, 1h, 4h, 1d
  timestamp BIGINT NOT NULL, -- Unix timestamp in seconds
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_market_candles_symbol_timeframe ON public.market_candles(symbol, timeframe, timestamp DESC);

-- Create market_funding_rates table
CREATE TABLE IF NOT EXISTS public.market_funding_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(symbol, exchange, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_market_funding_rates_symbol ON public.market_funding_rates(symbol, exchange, timestamp DESC);

-- Create market_snapshots table for latest prices
CREATE TABLE IF NOT EXISTS public.market_snapshots (
  symbol TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  volume_24h NUMERIC DEFAULT 0,
  change_24h NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'tatum'
);

-- Enable RLS
ALTER TABLE public.market_candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_funding_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read market candles" ON public.market_candles FOR SELECT USING (true);
CREATE POLICY "Public can read funding rates" ON public.market_funding_rates FOR SELECT USING (true);
CREATE POLICY "Public can read market snapshots" ON public.market_snapshots FOR SELECT USING (true);

-- Service role can write
CREATE POLICY "Service can insert candles" ON public.market_candles FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update candles" ON public.market_candles FOR UPDATE USING (true);
CREATE POLICY "Service can insert funding" ON public.market_funding_rates FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can upsert snapshots" ON public.market_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update snapshots" ON public.market_snapshots FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_market_candles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_market_candles_timestamp
BEFORE UPDATE ON public.market_candles
FOR EACH ROW
EXECUTE FUNCTION update_market_candles_updated_at();
-- Create table for raw market ticks (real-time)
CREATE TABLE IF NOT EXISTS public.market_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  ts BIGINT NOT NULL,
  price NUMERIC NOT NULL,
  size NUMERIC,
  side TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_ticks_symbol_ts ON public.market_ticks(symbol, ts DESC);

-- Row level security
ALTER TABLE public.market_ticks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read market_ticks" ON public.market_ticks
  FOR SELECT USING (true);

CREATE POLICY "Service can insert market_ticks" ON public.market_ticks
  FOR INSERT WITH CHECK (true);

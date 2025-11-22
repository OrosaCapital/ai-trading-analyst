-- Create table for canonical trade signals (if missing)
CREATE TABLE IF NOT EXISTS public.trade_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  signal_type TEXT NOT NULL,
  score NUMERIC,
  payload JSONB,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_signals_symbol_ts ON public.trade_signals(symbol, ts DESC);

ALTER TABLE public.trade_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read trade_signals" ON public.trade_signals
  FOR SELECT USING (true);

CREATE POLICY "Service can insert trade_signals" ON public.trade_signals
  FOR INSERT WITH CHECK (true);

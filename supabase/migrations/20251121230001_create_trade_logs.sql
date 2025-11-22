-- Create table for executed trade logs
CREATE TABLE IF NOT EXISTS public.trade_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT,
  symbol TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  side TEXT,
  qty NUMERIC,
  price NUMERIC,
  status TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_logs_order_id ON public.trade_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_trade_logs_symbol_ts ON public.trade_logs(symbol, ts DESC);

ALTER TABLE public.trade_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can insert trade_logs" ON public.trade_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can read trade_logs" ON public.trade_logs
  FOR SELECT TO authenticated USING (true);

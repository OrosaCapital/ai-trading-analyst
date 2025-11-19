-- Create tracked_symbols table for global symbol tracking
CREATE TABLE IF NOT EXISTS public.tracked_symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  added_by UUID REFERENCES auth.users(id),
  active BOOLEAN DEFAULT true,
  CONSTRAINT symbol_format CHECK (symbol ~ '^[A-Z]+USDT$')
);

-- Enable RLS
ALTER TABLE public.tracked_symbols ENABLE ROW LEVEL SECURITY;

-- Public can view tracked symbols
CREATE POLICY "Anyone can view tracked symbols"
ON public.tracked_symbols
FOR SELECT
USING (true);

-- Authenticated users can add symbols
CREATE POLICY "Authenticated users can add symbols"
ON public.tracked_symbols
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = added_by);

-- Authenticated users can update symbols they added
CREATE POLICY "Users can update their own symbols"
ON public.tracked_symbols
FOR UPDATE
TO authenticated
USING (auth.uid() = added_by);

-- Create index for faster lookups
CREATE INDEX idx_tracked_symbols_active ON public.tracked_symbols(symbol) WHERE active = true;

-- Insert default symbols
INSERT INTO public.tracked_symbols (symbol, active)
VALUES 
  ('BTCUSDT', true),
  ('ETHUSDT', true),
  ('XRPUSDT', true),
  ('SOLUSDT', true),
  ('BNBUSDT', true)
ON CONFLICT (symbol) DO NOTHING;
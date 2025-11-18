-- Create table for storing AI analysis history
CREATE TABLE IF NOT EXISTS public.ai_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  price_at_analysis NUMERIC NOT NULL,
  trend_analysis TEXT,
  volume_analysis TEXT,
  liquidity_analysis TEXT,
  coinglass_analysis TEXT,
  entry_trigger_analysis TEXT,
  full_reasoning JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Public can read analysis history"
  ON public.ai_analysis_history
  FOR SELECT
  USING (true);

-- Allow public insert
CREATE POLICY "Public can insert analysis history"
  ON public.ai_analysis_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster symbol queries
CREATE INDEX idx_analysis_history_symbol_timestamp 
  ON public.ai_analysis_history(symbol, timestamp DESC);

-- Create index for recent queries
CREATE INDEX idx_analysis_history_created_at 
  ON public.ai_analysis_history(created_at DESC);
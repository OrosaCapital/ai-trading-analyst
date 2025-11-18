-- Create table for Tatum price caching
CREATE TABLE IF NOT EXISTS public.tatum_price_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  price_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tatum_price_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read (for edge functions)
CREATE POLICY "Public can read price cache"
  ON public.tatum_price_cache
  FOR SELECT
  USING (true);

-- Allow public insert (for edge functions to cache data)
CREATE POLICY "Public can insert price cache"
  ON public.tatum_price_cache
  FOR INSERT
  WITH CHECK (true);

-- Allow public update (to refresh cache)
CREATE POLICY "Public can update price cache"
  ON public.tatum_price_cache
  FOR UPDATE
  USING (true);

-- Allow public delete expired cache
CREATE POLICY "Public can delete expired cache"
  ON public.tatum_price_cache
  FOR DELETE
  USING (true);

-- Create index for efficient expiration queries
CREATE INDEX idx_tatum_cache_expires_at 
  ON public.tatum_price_cache(expires_at);

-- Create index for symbol lookups
CREATE INDEX idx_tatum_cache_symbol 
  ON public.tatum_price_cache(symbol);
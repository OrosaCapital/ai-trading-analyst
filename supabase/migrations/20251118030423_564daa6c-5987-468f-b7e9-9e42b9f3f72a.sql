-- Create API Ninjas usage tracking table
CREATE TABLE IF NOT EXISTS public.api_ninjas_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  interval text NOT NULL,
  records_fetched integer NOT NULL,
  api_calls_used integer NOT NULL DEFAULT 1,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_ninjas_usage ENABLE ROW LEVEL SECURITY;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_ninjas_usage_fetched_at ON public.api_ninjas_usage(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_ninjas_usage_symbol ON public.api_ninjas_usage(symbol);

-- Policy to allow public read (for usage stats)
CREATE POLICY "Public can read API usage stats" 
ON public.api_ninjas_usage 
FOR SELECT 
USING (true);

-- Policy to allow public insert (for logging API calls)
CREATE POLICY "Public can insert API usage logs" 
ON public.api_ninjas_usage 
FOR INSERT 
WITH CHECK (true);
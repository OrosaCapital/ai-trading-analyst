-- Drop the old constraint
ALTER TABLE public.tatum_price_logs 
DROP CONSTRAINT tatum_price_logs_interval_check;

-- Add updated constraint that includes 1h
ALTER TABLE public.tatum_price_logs 
ADD CONSTRAINT tatum_price_logs_interval_check 
CHECK (interval = ANY(ARRAY['1m', '5m', '10m', '15m', '1h']));
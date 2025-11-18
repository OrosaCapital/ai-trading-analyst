-- Add unique constraint to tatum_price_logs to support upsert operations
ALTER TABLE public.tatum_price_logs 
ADD CONSTRAINT tatum_price_logs_symbol_timestamp_interval_key 
UNIQUE (symbol, timestamp, interval);
-- Market data cache table for Coinglass API data
CREATE TABLE IF NOT EXISTS market_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL CHECK (data_type IN ('funding_rate', 'open_interest', 'liquidations', 'overview')),
  symbol text NOT NULL,
  interval text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '15 minutes')
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_market_data_type_symbol ON market_data_cache(data_type, symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_expires ON market_data_cache(expires_at);

-- Enable RLS
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (market data is public information)
CREATE POLICY "Allow public read on market_data_cache" ON market_data_cache
  FOR SELECT USING (true);

-- Public insert for caching
CREATE POLICY "Allow public insert on market_data_cache" ON market_data_cache
  FOR INSERT WITH CHECK (true);

-- Allow cleanup of expired data
CREATE POLICY "Allow cleanup on market_data_cache" ON market_data_cache
  FOR DELETE USING (expires_at < now());
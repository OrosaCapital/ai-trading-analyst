-- Create CoinGlass API endpoints lookup table
CREATE TABLE coinglass_api_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_key text UNIQUE NOT NULL,
  endpoint_path text NOT NULL,
  base_url text NOT NULL DEFAULT 'https://open-api-v4.coinglass.com',
  description text,
  required_params jsonb,
  optional_params jsonb,
  min_interval text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coinglass_api_endpoints ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active endpoints
CREATE POLICY "Public can read active endpoints"
ON coinglass_api_endpoints FOR SELECT
USING (is_active = true);

-- Seed with current v4 endpoints
INSERT INTO coinglass_api_endpoints (endpoint_key, endpoint_path, description, required_params, min_interval) VALUES
  ('price_history', '/api/futures/price/history', 'OHLC candlestick data', 
   '["exchange", "symbol", "interval", "limit"]'::jsonb, '4h'),
  
  ('funding_rate', '/api/futures/funding-rate/history', 'Funding rate history', 
   '["exchange", "symbol", "interval", "limit"]'::jsonb, '4h'),
  
  ('liquidations', '/api/futures/liquidation/history', 'Liquidation history', 
   '["exchange", "symbol", "interval", "limit"]'::jsonb, '4h'),
  
  ('long_short_ratio', '/api/futures/global-long-short-account-ratio/history', 'Long/short account ratio', 
   '["exchange", "symbol", "interval", "limit"]'::jsonb, '4h'),
  
  ('open_interest_ohlc', '/api/futures/open-interest-ohlc/history', 'Open interest OHLC', 
   '["exchange", "symbol", "interval", "limit"]'::jsonb, '1h'),
  
  ('open_interest_list', '/api/futures/open-interest/list', 'Open interest by exchange', 
   '["symbol"]'::jsonb, NULL),
  
  ('taker_volume', '/api/futures/taker-buy-sell-volume/history', 'Taker buy/sell volume (CVD)', 
   '["exchange", "symbol", "interval", "limit"]'::jsonb, '4h');
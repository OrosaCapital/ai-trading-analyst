-- Add Fear & Greed Index endpoint to Coinglass API endpoints
INSERT INTO coinglass_api_endpoints (
  endpoint_key,
  endpoint_path,
  base_url,
  description,
  required_params,
  is_active
) VALUES (
  'fear_greed_index',
  '/api/indicator/fear-greed-index',
  'https://open-api-v4.coinglass.com',
  'Get the current Fear & Greed Index for crypto market sentiment',
  '[]'::json,
  true
) ON CONFLICT (endpoint_key) DO UPDATE SET
  endpoint_path = EXCLUDED.endpoint_path,
  base_url = EXCLUDED.base_url,
  description = EXCLUDED.description,
  updated_at = now();
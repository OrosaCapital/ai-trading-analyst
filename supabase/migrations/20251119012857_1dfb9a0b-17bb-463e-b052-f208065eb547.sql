-- Remove obsolete tables related to deleted external APIs

-- Drop Coinglass-related tables
DROP TABLE IF EXISTS public.coinglass_api_endpoints CASCADE;
DROP TABLE IF EXISTS public.coinglass_metrics_cache CASCADE;

-- Drop API Ninjas usage tracking
DROP TABLE IF EXISTS public.api_ninjas_usage CASCADE;

-- Drop general analysis cache (not used in Simple Mode)
DROP TABLE IF EXISTS public.analysis_cache CASCADE;

-- Drop AI analysis tables (not used in Simple Mode - local indicators only)
DROP TABLE IF EXISTS public.ai_analysis_history CASCADE;
DROP TABLE IF EXISTS public.ai_trading_signals CASCADE;

-- Drop watchlist analysis schedule (not used in Simple Mode)
DROP TABLE IF EXISTS public.watchlist_analysis_schedule CASCADE;

-- Drop market data cache (not used in Simple Mode)
DROP TABLE IF EXISTS public.market_data_cache CASCADE;

-- Keep only essential tables:
-- - profiles (user data)
-- - user_watchlists (user preferences)
-- - tatum_price_cache (Tatum API caching)
-- - tatum_price_logs (price history)
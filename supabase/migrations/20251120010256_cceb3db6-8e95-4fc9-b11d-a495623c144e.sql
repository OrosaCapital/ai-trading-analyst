-- Clean up duplicate hourly candles, keeping only one per hour with properly rounded timestamps
-- This fixes the issue where multiple candles were created per hour due to timing inconsistencies

-- Step 1: Create a temp table with properly rounded timestamps and deduplicated data
CREATE TEMP TABLE cleaned_candles AS
WITH RankedCandles AS (
  SELECT 
    id,
    symbol,
    timeframe,
    timestamp,
    FLOOR(timestamp / 3600.0) * 3600 as rounded_timestamp,
    open,
    high,
    low,
    close,
    volume,
    created_at,
    updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY symbol, timeframe, FLOOR(timestamp / 3600.0) * 3600
      ORDER BY created_at DESC
    ) as rn
  FROM market_candles
  WHERE timeframe = '1h'
)
SELECT 
  symbol,
  timeframe,
  rounded_timestamp as timestamp,
  open,
  high,
  low,
  close,
  volume,
  created_at,
  updated_at
FROM RankedCandles 
WHERE rn = 1;

-- Step 2: Delete all existing 1h candles
DELETE FROM market_candles WHERE timeframe = '1h';

-- Step 3: Re-insert cleaned data with rounded timestamps
INSERT INTO market_candles (symbol, timeframe, timestamp, open, high, low, close, volume, created_at, updated_at)
SELECT 
  symbol,
  timeframe,
  timestamp,
  open,
  high,
  low,
  close,
  volume,
  created_at,
  updated_at
FROM cleaned_candles;

-- This should reduce ~7,400 candles to ~240 candles per symbol (10 days × 24 hours)
/**
 * CoinGlass Chart Data Service
 * Handles chart data fetching with Hobbyist plan interval restrictions
 */

import { log } from '../monitoring/logger.ts';
import { trackMetric } from '../monitoring/metrics.ts';

// Hobbyist plan allowed intervals
const ALLOWED_INTERVALS = ['4h', '1d'] as const;
type AllowedInterval = typeof ALLOWED_INTERVALS[number];

interface IntervalConfig {
  requested: string;
  allowed: AllowedInterval;
  minutesRequested: number;
  minutesUsed: number;
  planRestricted: boolean;
}

/**
 * Map interval minutes to CoinGlass format
 */
function mapIntervalMinutesToFormat(minutes: number): string {
  const intervalMap: Record<number, string> = {
    1: '1m',
    5: '5m',
    15: '15m',
    60: '1h',
    240: '4h',
    1440: '1d',
  };
  return intervalMap[minutes] || '4h';
}

/**
 * Get valid interval for Hobbyist plan
 * Always returns 4h or 1d
 */
export function getValidChartInterval(requestedMinutes: number): IntervalConfig {
  const requestedFormat = mapIntervalMinutesToFormat(requestedMinutes);
  
  // Hobbyist plan: minimum 4h (240 minutes)
  if (requestedMinutes < 240) {
    log('warn', 'Interval too short for Hobbyist plan', {
      requested: requestedFormat,
      requestedMinutes,
      fallback: '4h',
    });
    
    trackMetric('coinglass_interval_fallback', 1, {
      from: requestedFormat,
      to: '4h',
    });

    return {
      requested: requestedFormat,
      allowed: '4h',
      minutesRequested: requestedMinutes,
      minutesUsed: 240,
      planRestricted: true,
    };
  }

  // Use 1d for anything >= 1440 minutes
  if (requestedMinutes >= 1440) {
    return {
      requested: requestedFormat,
      allowed: '1d',
      minutesRequested: requestedMinutes,
      minutesUsed: 1440,
      planRestricted: false,
    };
  }

  // Default to 4h for everything else
  return {
    requested: requestedFormat,
    allowed: '4h',
    minutesRequested: requestedMinutes,
    minutesUsed: 240,
    planRestricted: requestedMinutes < 240,
  };
}

/**
 * Fetch chart data with automatic retry and fallback
 */
export async function fetchChartDataWithFallback(
  symbol: string,
  intervalMinutes: number,
  days: number,
  apiKey: string
): Promise<any> {
  const intervalConfig = getValidChartInterval(intervalMinutes);
  const { fetchFromCoinglassV2 } = await import('../coinglassClient.ts');
  const { formatForCoinglass } = await import('../symbolFormatter.ts');

  const cleanSymbol = formatForCoinglass(symbol);

  log('info', 'Fetching chart data', {
    symbol: cleanSymbol,
    intervalRequested: intervalConfig.requested,
    intervalUsed: intervalConfig.allowed,
    planRestricted: intervalConfig.planRestricted,
    days,
  });

  // Try primary interval (4h or 1d)
  try {
    const data = await fetchFromCoinglassV2(
      'price_history',
      {
        exchange: 'Binance',
        symbol: cleanSymbol,
        interval: intervalConfig.allowed,
        limit: '1000',
      },
      apiKey
    );

    if (data.code === '0' && data.data && data.data.length > 0) {
      log('info', 'Chart data fetched successfully', {
        symbol: cleanSymbol,
        interval: intervalConfig.allowed,
        candleCount: data.data.length,
      });

      trackMetric('coinglass_chart_success', 1, {
        symbol: cleanSymbol,
        interval: intervalConfig.allowed,
      });

      return {
        success: true,
        data: data.data,
        interval: intervalConfig.allowed,
        intervalConfig,
      };
    }

    // API returned error code
    log('warn', 'CoinGlass returned error', {
      symbol: cleanSymbol,
      interval: intervalConfig.allowed,
      code: data.code,
      message: data.msg,
    });

    // If 4h failed, try 1d as ultimate fallback
    if (intervalConfig.allowed === '4h') {
      log('info', 'Falling back to 1d interval', {
        symbol: cleanSymbol,
      });

      const fallbackData = await fetchFromCoinglassV2(
        'price_history',
        {
          exchange: 'Binance',
          symbol: cleanSymbol,
          interval: '1d',
          limit: '1000',
        },
        apiKey
      );

      if (fallbackData.code === '0' && fallbackData.data && fallbackData.data.length > 0) {
        trackMetric('coinglass_chart_fallback_success', 1, {
          symbol: cleanSymbol,
          from: '4h',
          to: '1d',
        });

        return {
          success: true,
          data: fallbackData.data,
          interval: '1d',
          intervalConfig: { ...intervalConfig, allowed: '1d', minutesUsed: 1440 },
          usedFallback: true,
        };
      }
    }

    throw new Error(`CoinGlass error: ${data.msg || 'Unknown error'}`);
  } catch (error) {
    log('error', 'Chart data fetch failed', {
      symbol: cleanSymbol,
      interval: intervalConfig.allowed,
      error: error instanceof Error ? error.message : 'Unknown',
    });

    trackMetric('coinglass_chart_failure', 1, {
      symbol: cleanSymbol,
      interval: intervalConfig.allowed,
    });

    throw error;
  }
}

/**
 * Create user-friendly error response
 */
export function createChartErrorResponse(
  symbol: string,
  intervalConfig: IntervalConfig,
  error: Error
): any {
  return {
    success: false,
    symbol,
    intervalRequested: intervalConfig.requested,
    intervalAttempted: intervalConfig.allowed,
    planRestricted: intervalConfig.planRestricted,
    error: error.message,
    message: intervalConfig.planRestricted
      ? `Chart data limited by CoinGlass Hobbyist plan. Only 4h and 1d intervals are supported. Your requested ${intervalConfig.requested} interval was automatically adjusted to ${intervalConfig.allowed}.`
      : `Failed to fetch chart data for ${symbol}. ${error.message}`,
    recommendation: 'Upgrade CoinGlass plan for shorter intervals (1m, 5m, 15m, 1h).',
  };
}

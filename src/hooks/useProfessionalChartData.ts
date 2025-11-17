import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimePriceStream } from './useRealtimePriceStream';
import {
  Candle,
  calculateEMA,
  calculateRSI,
  calculateVolumeSMA,
  detectSwingPoints,
  detectLiquiditySweeps,
  detectSupportResistance,
  aggregateCandles,
  buildCandleFromPriceUpdates,
  generateSampleCandles,
} from '@/lib/indicators';

export interface TimeframeIndicators {
  ema50: number[];
  rsi: number[];
  volumeSMA: number[];
}

export interface ChartData {
  candles1h: Candle[];
  candles15m: Candle[];
  candles5m: Candle[];
  candles1m: Candle[];
  
  indicators: {
    '1h': TimeframeIndicators;
    '15m': TimeframeIndicators;
  };
  
  coinglass: {
    fundingRate: number;
    fundingSentiment: 'bullish' | 'bearish' | 'neutral';
    openInterest: number;
    oiChange: number;
    liquidations: { longs: number; shorts: number };
    longShortRatio: number;
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
  };
  
  levels: {
    support: number[];
    resistance: number[];
  };
  
  liquiditySweeps: Array<{
    time: number;
    price: number;
    type: 'high' | 'low';
  }>;
  
  candleCount: number;
  dataSource: 'realtime' | 'historical' | 'sample';
}

export function useProfessionalChartData(symbol: string | null) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Store candles in ref to persist across renders
  const candles1mRef = useRef<Candle[]>([]);
  const hasInitializedRef = useRef(false);
  const lastPriceRef = useRef<number | null>(null);
  const [tatumPrice, setTatumPrice] = useState<number | null>(null);
  
  const { priceData, isConnected } = useRealtimePriceStream(symbol, !!symbol);
  
  // Initialize with sample data immediately when symbol is set
  useEffect(() => {
    if (!symbol) return;
    
    setIsLoading(true);
    
    // For now, we don't fetch data in this hook since we're using CoinGlass data
    // This hook is only used as fallback when existingChartData is not provided
    setIsLoading(false);
  }, [symbol]);
  
  // Update candles with real-time price data OR Tatum price
  useEffect(() => {
    if (!symbol) return;
    
    // Use WebSocket price if available, otherwise Tatum price
    const currentPrice = (priceData?.price && isConnected) ? priceData.price : tatumPrice;
    if (!currentPrice || currentPrice <= 0) return;
    
    console.log('📊 Price update:', currentPrice, 'from', priceData?.price ? 'WebSocket' : 'Tatum');
    
    const now = Date.now() / 1000;
    
    // If first initialization and no candles, generate sample data immediately
    if (!hasInitializedRef.current && candles1mRef.current.length === 0) {
      console.log('🎲 Generating sample candles from price:', currentPrice);
      candles1mRef.current = generateSampleCandles(currentPrice, 100);
      hasInitializedRef.current = true;
      setIsLoading(false);
    }
    
    // Build/update candles from price updates
    if (currentPrice !== lastPriceRef.current) {
      candles1mRef.current = buildCandleFromPriceUpdates(
        candles1mRef.current,
        currentPrice,
        priceData?.volume || Math.random() * 1000000,
        now
      );
      
      lastPriceRef.current = currentPrice;
      console.log('🕯️ Total candles:', candles1mRef.current.length);
    }
    
    // Recalculate everything with new data
    updateChartData();
  }, [priceData, tatumPrice, isConnected, symbol]);
  
  // Fetch Coinglass data periodically
  useEffect(() => {
    if (!symbol) return;
    
    const fetchCoinglass = async () => {
      try {
        const { data: coinglassData } = await supabase.functions.invoke(
          'fetch-market-overview',
          { body: { symbol: symbol.replace('/', '').toUpperCase() } }
        );
        
        if (coinglassData) {
          // Update coinglass data in current chart data
          if (chartData) {
            setChartData({
              ...chartData,
              coinglass: parseCoinglassData(coinglassData),
            });
          }
        }
      } catch (err) {
        console.error('Error fetching coinglass:', err);
      }
    };
    
    fetchCoinglass();
    const interval = setInterval(fetchCoinglass, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  const updateChartData = () => {
    if (candles1mRef.current.length === 0) {
      console.log('⚠️ No candles to update chart with');
      return;
    }
    
    console.log('✅ Updating chart with', candles1mRef.current.length, 'candles');
    
    const candles1m = candles1mRef.current;
    const candles5m = aggregateCandles(candles1m, 5);
    const candles15m = aggregateCandles(candles1m, 15);
    const candles1h = aggregateCandles(candles1m, 60);
    
    // Calculate indicators for 1H
    const prices1h = candles1h.map(c => c.close);
    const volumes1h = candles1h.map(c => c.volume);
    const ema501h = calculateEMA(prices1h, 50);
    const rsi1h = calculateRSI(prices1h, 14);
    const volumeSMA1h = calculateVolumeSMA(volumes1h, 6);
    
    // Calculate indicators for 15M
    const prices15m = candles15m.map(c => c.close);
    const volumes15m = candles15m.map(c => c.volume);
    const ema5015m = calculateEMA(prices15m, 50);
    const rsi15m = calculateRSI(prices15m, 14);
    const volumeSMA15m = calculateVolumeSMA(volumes15m, 6);
    
    // Detect support/resistance on 1H (only if we have enough data)
    const levels = candles1h.length > 20 
      ? detectSupportResistance(candles1h)
      : { support: [], resistance: [] };
    
    // Detect liquidity sweeps
    const swingPoints = candles1h.length > 10 ? detectSwingPoints(candles1h) : [];
    const liquiditySweeps = swingPoints.length > 0 ? detectLiquiditySweeps(candles1h, swingPoints) : [];
    
    setChartData({
      candles1m,
      candles5m,
      candles15m,
      candles1h,
      indicators: {
        '1h': {
          ema50: ema501h,
          rsi: rsi1h,
          volumeSMA: volumeSMA1h,
        },
        '15m': {
          ema50: ema5015m,
          rsi: rsi15m,
          volumeSMA: volumeSMA15m,
        },
      },
      coinglass: {
        fundingRate: 0,
        fundingSentiment: 'neutral',
        openInterest: 0,
        oiChange: 0,
        liquidations: { longs: 0, shorts: 0 },
        longShortRatio: 1,
        overallSentiment: 'neutral',
      },
      levels,
      liquiditySweeps,
      candleCount: candles1m.length,
      dataSource: hasInitializedRef.current ? 'realtime' : 'sample',
    });
  };
  
  // Reset when symbol changes
  useEffect(() => {
    if (symbol) {
      candles1mRef.current = [];
      hasInitializedRef.current = false;
      lastPriceRef.current = null;
      setChartData(null);
      setIsLoading(true);
    }
  }, [symbol]);
  
  return { chartData, isLoading, error };
}

function parseCoinglassData(coinglassData: any) {
  const data = coinglassData.data || coinglassData;
  
  const fundingRate = parseFloat(data.fundingRate || data.funding_rate || '0');
  const openInterest = parseFloat(data.openInterest || data.open_interest || '0');
  const oiChange = parseFloat(data.openInterestChange || data.oi_change_24h || data.oiChange24h || '0');
  const longRatio = parseFloat(data.longAccountRatio || data.long_ratio || '50');
  const shortRatio = 100 - longRatio;
  const liquidationsData = data.liquidations || {};
  
  return {
    fundingRate,
    fundingSentiment: fundingRate > 0 ? 'bullish' as const : fundingRate < 0 ? 'bearish' as const : 'neutral' as const,
    openInterest: openInterest / 1e9,
    oiChange,
    liquidations: {
      longs: parseFloat(liquidationsData.longLiquidation || liquidationsData.longs || '0') / 1e6,
      shorts: parseFloat(liquidationsData.shortLiquidation || liquidationsData.shorts || '0') / 1e6,
    },
    longShortRatio: longRatio / (shortRatio || 1),
    overallSentiment: (fundingRate > 0.01 && oiChange > 0) ? 'bullish' as const : 
                     (fundingRate < -0.01 && oiChange < 0) ? 'bearish' as const : 'neutral' as const,
  };
}

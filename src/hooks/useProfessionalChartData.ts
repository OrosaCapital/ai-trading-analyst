import { useState, useEffect } from 'react';
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
    fundingSentiment: 'bullish' | 'bearish';
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
}

export function useProfessionalChartData(symbol: string | null) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { priceData, isConnected } = useRealtimePriceStream(symbol, !!symbol);
  
  useEffect(() => {
    if (!symbol) {
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch historical 1-minute price data
        const { data: priceLogsData, error: priceError } = await supabase
          .from('tatum_price_logs')
          .select('*')
          .eq('symbol', symbol)
          .eq('interval', '1m')
          .order('timestamp', { ascending: true })
          .limit(500);
        
        if (priceError) throw priceError;
        
        // Convert to candles
        const candles1m: Candle[] = (priceLogsData || []).map(log => ({
          time: new Date(log.timestamp).getTime() / 1000,
          open: log.price,
          high: log.price * 1.001,
          low: log.price * 0.999,
          close: log.price,
          volume: log.volume || 0,
        }));
        
        // Aggregate into higher timeframes
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
        
        // Detect support/resistance on 1H
        const levels = detectSupportResistance(candles1h);
        
        // Detect liquidity sweeps
        const swingPoints = detectSwingPoints(candles1h);
        const liquiditySweeps = detectLiquiditySweeps(candles1h, swingPoints);
        
        // Fetch Coinglass 4-hour data
        const { data: coinglassData, error: coinglassError } = await supabase.functions.invoke(
          'fetch-market-overview',
          { body: { symbol: symbol.replace('/', '').toUpperCase() } }
        );
        
        let coinglassSentiment: ChartData['coinglass'] = {
          fundingRate: 0,
          fundingSentiment: 'bearish',
          openInterest: 0,
          oiChange: 0,
          liquidations: { longs: 0, shorts: 0 },
          longShortRatio: 1,
          overallSentiment: 'neutral',
        };
        
        if (!coinglassError && coinglassData?.metrics) {
          const metrics = coinglassData.metrics;
          const fundingRate = parseFloat(metrics.fundingRate?.current || '0');
          const oiChange = parseFloat(metrics.openInterest?.change24h?.replace('%', '') || '0');
          
          coinglassSentiment = {
            fundingRate,
            fundingSentiment: fundingRate > 0 ? 'bullish' : 'bearish',
            openInterest: parseFloat(metrics.openInterest?.total?.replace('B', '') || '0'),
            oiChange,
            liquidations: {
              longs: parseFloat(metrics.liquidations24h?.total?.split('/')[0]?.replace('M', '') || '0'),
              shorts: parseFloat(metrics.liquidations24h?.total?.split('/')[1]?.replace('M', '') || '0'),
            },
            longShortRatio: parseFloat(metrics.liquidations24h?.longShortRatio || '1'),
            overallSentiment: (fundingRate > 0 && oiChange > 0) ? 'bullish' : 
                             (fundingRate < 0 && oiChange < 0) ? 'bearish' : 'neutral',
          };
        }
        
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
          coinglass: coinglassSentiment,
          levels,
          liquiditySweeps,
        });
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  // Update latest candle with real-time price
  useEffect(() => {
    if (!chartData || !priceData || !isConnected) return;
    
    const now = Date.now() / 1000;
    const latestCandle1m = chartData.candles1m[chartData.candles1m.length - 1];
    
    if (latestCandle1m && now - latestCandle1m.time < 60) {
      // Update existing candle
      const updatedCandles1m = [...chartData.candles1m];
      updatedCandles1m[updatedCandles1m.length - 1] = {
        ...latestCandle1m,
        high: Math.max(latestCandle1m.high, priceData.price),
        low: Math.min(latestCandle1m.low, priceData.price),
        close: priceData.price,
        volume: latestCandle1m.volume + priceData.volume,
      };
      
      setChartData({
        ...chartData,
        candles1m: updatedCandles1m,
      });
    }
  }, [priceData, isConnected, chartData]);
  
  return { chartData, isLoading, error };
}

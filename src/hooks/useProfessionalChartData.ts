import { useState, useEffect, useRef, useCallback } from "react";
import { useRealtimePriceStream } from "./useRealtimePriceStream";
import { supabase } from "@/integrations/supabase/client";
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
} from "@/lib/indicators";

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
    "1h": TimeframeIndicators;
    "15m": TimeframeIndicators;
  };
  levels: {
    support: number[];
    resistance: number[];
  };
  liquiditySweeps: Array<{
    time: number;
    price: number;
    type: "high" | "low";
  }>;
  candleCount: number;
  dataSource: "realtime" | "historical" | "sample";
}

export function useProfessionalChartData(
  symbol: string | null,
  dateRange?: { from: Date; to: Date } | null,
  timeframe: "15m" | "1h" | "4h" | "1d" | "1w" = "1h",
  filters?: { minVolume: number; maxVolume: number; showOnlySignals: boolean }
) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  const candles1hRef = useRef<Candle[]>([]);
  const hasInitializedRef = useRef(false);
  const lastPriceRef = useRef<number | null>(null);

  const { priceData, isConnected } = useRealtimePriceStream(symbol, !!symbol);

  const updateChartData = useCallback(() => {
    if (candles1hRef.current.length === 0) return;

    const candles1h = candles1hRef.current;
    
    // Generate 15m candles by interpolating 1h candles (4x15m = 1h)
    const candles15m: Candle[] = [];
    candles1h.forEach((candle1h) => {
      const intervalSec = 15 * 60; // 900 seconds
      for (let i = 0; i < 4; i++) {
        candles15m.push({
          time: candle1h.time + (i * intervalSec),
          open: candle1h.open + (candle1h.close - candle1h.open) * (i / 4),
          high: candle1h.high,
          low: candle1h.low,
          close: candle1h.open + (candle1h.close - candle1h.open) * ((i + 1) / 4),
          volume: candle1h.volume / 4
        });
      }
    });

    // Generate 5m and 1m candles similarly
    const candles5m: Candle[] = [];
    candles15m.forEach((candle15m) => {
      const intervalSec = 5 * 60; // 300 seconds
      for (let i = 0; i < 3; i++) {
        candles5m.push({
          time: candle15m.time + (i * intervalSec),
          open: candle15m.open + (candle15m.close - candle15m.open) * (i / 3),
          high: candle15m.high,
          low: candle15m.low,
          close: candle15m.open + (candle15m.close - candle15m.open) * ((i + 1) / 3),
          volume: candle15m.volume / 3
        });
      }
    });

    const candles1m: Candle[] = [];
    candles5m.forEach((candle5m) => {
      const intervalSec = 60; // 60 seconds
      for (let i = 0; i < 5; i++) {
        candles1m.push({
          time: candle5m.time + (i * intervalSec),
          open: candle5m.open + (candle5m.close - candle5m.open) * (i / 5),
          high: candle5m.high,
          low: candle5m.low,
          close: candle5m.open + (candle5m.close - candle5m.open) * ((i + 1) / 5),
          volume: candle5m.volume / 5
        });
      }
    });

    const prices1h = candles1h.map((c) => c.close);
    const volumes1h = candles1h.map((c) => c.volume);
    const ema501h = calculateEMA(prices1h, 50);
    const rsi1h = calculateRSI(prices1h, 14);
    const volumeSMA1h = calculateVolumeSMA(volumes1h, 6);

    const prices15m = candles15m.map((c) => c.close);
    const volumes15m = candles15m.map((c) => c.volume);
    const ema5015m = calculateEMA(prices15m, 50);
    const rsi15m = calculateRSI(prices15m, 14);
    const volumeSMA15m = calculateVolumeSMA(volumes15m, 6);

    const levels = candles1h.length > 20 ? detectSupportResistance(candles1h) : { support: [], resistance: [] };

    const swingPoints = candles1h.length > 10 ? detectSwingPoints(candles1h) : [];
    const liquiditySweeps = swingPoints.length > 0 ? detectLiquiditySweeps(candles1h, swingPoints) : [];

    console.log("updateChartData: Setting chart data", {
      candles1hLength: candles1h.length,
      candles15mLength: candles15m.length,
      dataSource: hasInitializedRef.current ? "historical" : "sample"
    });

    setChartData({
      candles1m,
      candles5m,
      candles15m,
      candles1h,
      indicators: {
        "1h": {
          ema50: ema501h,
          rsi: rsi1h,
          volumeSMA: volumeSMA1h,
        },
        "15m": {
          ema50: ema5015m,
          rsi: rsi15m,
          volumeSMA: volumeSMA15m,
        },
      },
      levels,
      liquiditySweeps,
      candleCount: candles1h.length,
      dataSource: hasInitializedRef.current ? "historical" : "sample",
    });
  }, []);

  useEffect(() => {
    if (!symbol) return;

    const loadHistoricalData = async () => {
      setIsLoading(true);
      try {
        // Build query
        let query = supabase
          .from('market_candles')
          .select('*')
          .eq('symbol', symbol)
          .eq('timeframe', timeframe); // Use selected timeframe

        // Apply date range filter if provided
        if (dateRange?.from && dateRange?.to) {
          const fromTimestamp = Math.floor(dateRange.from.getTime() / 1000);
          const toTimestamp = Math.floor(dateRange.to.getTime() / 1000);
          console.log(`[useProfessionalChartData] Applying date range filter:`, {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
            fromTimestamp,
            toTimestamp
          });
          query = query
            .gte('timestamp', fromTimestamp)
            .lte('timestamp', toTimestamp);
        }

        const { data: dbCandles, error } = await query
          .order('timestamp', { ascending: false })
          .limit(dateRange ? 10000 : 500); // Higher limit when date range is set

        if (error) throw error;

        if (dbCandles && dbCandles.length > 0) {
          console.log(`✅ Loaded ${dbCandles.length} 1h candles for ${symbol} from database`);
          
          // Check if we have enough recent data (at least 24 hours)
          const newestTimestamp = dbCandles[0].timestamp;
          const now = Math.floor(Date.now() / 1000);
          const ageInHours = (now - newestTimestamp) / 3600;
          
          if (ageInHours > 24) {
            console.warn(`⚠️ Most recent candle for ${symbol} is ${ageInHours.toFixed(1)} hours old, data may be stale`);
          }
          
          // Reverse to chronological order for chart (newest candles loaded first, then reversed)
          let processedCandles = dbCandles
            .reverse()
            .map(c => ({
              time: c.timestamp,
              timestamp: c.timestamp,
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
              volume: Number(c.volume || 0)
            }));

          // Apply volume filters
          if (filters) {
            processedCandles = processedCandles.filter(candle => 
              candle.volume >= filters.minVolume && 
              candle.volume <= filters.maxVolume
            );

            // Apply signal filter (show only candles with significant price movement)
            if (filters.showOnlySignals) {
              const avgVolume = processedCandles.reduce((sum, c) => sum + c.volume, 0) / processedCandles.length;
              processedCandles = processedCandles.filter(candle => {
                const priceChange = Math.abs((candle.close - candle.open) / candle.open) * 100;
                const isHighVolume = candle.volume > avgVolume * 1.5;
                const isSignificantMove = priceChange > 2; // >2% price change
                return isHighVolume || isSignificantMove;
              });
            }
          }

          candles1hRef.current = processedCandles;
          hasInitializedRef.current = true;
          updateChartData();
        } else {
          console.warn(`No 1h candles found for ${symbol}, using sample data`);
          const samplePrice = 50000;
          candles1hRef.current = generateSampleCandles(samplePrice, 100);
          hasInitializedRef.current = false;
          updateChartData();
        }
      } catch (err) {
        console.error("Failed to load candles from DB:", err);
        const samplePrice = 50000;
        candles1hRef.current = generateSampleCandles(samplePrice, 100);
        hasInitializedRef.current = false;
        updateChartData();
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalData();
  }, [symbol, dateRange, timeframe, filters, updateChartData]);

  useEffect(() => {
    if (!symbol) return;

    const currentPrice = priceData?.price && isConnected ? priceData.price : null;
    if (!currentPrice || currentPrice <= 0) return;

    const now = Date.now() / 1000;

    if (!hasInitializedRef.current && candles1hRef.current.length === 0) {
      candles1hRef.current = generateSampleCandles(currentPrice, 100);
      hasInitializedRef.current = false;
      setIsLoading(false);
    }

    if (currentPrice !== lastPriceRef.current) {
      candles1hRef.current = buildCandleFromPriceUpdates(
        candles1hRef.current,
        currentPrice,
        priceData?.volume || 0,
        now,
      );

      lastPriceRef.current = currentPrice;
    }

    updateChartData();
  }, [priceData, isConnected, symbol, updateChartData]);

  // SIMPLE DATA MODE: No external API calls

  useEffect(() => {
    if (symbol) {
      candles1hRef.current = [];
      hasInitializedRef.current = false;
      lastPriceRef.current = null;
      setChartData(null);
      setIsLoading(true);
    }
  }, [symbol]);

  return { chartData, isLoading, error };
}

// SIMPLE DATA MODE: Removed parseCoinglassData - all market data is now local placeholders


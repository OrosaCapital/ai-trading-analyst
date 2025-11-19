import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimePriceStream } from "./useRealtimePriceStream";
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
  coinglass: {
    fundingRate: number;
    fundingSentiment: "bullish" | "bearish" | "neutral";
    openInterest: number;
    oiChange: number;
    liquidations: { longs: number; shorts: number };
    longShortRatio: number;
    overallSentiment: "bullish" | "bearish" | "neutral";
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

export function useProfessionalChartData(symbol: string | null) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  const candles1mRef = useRef<Candle[]>([]);
  const hasInitializedRef = useRef(false);
  const lastPriceRef = useRef<number | null>(null);

  const { priceData, isConnected } = useRealtimePriceStream(symbol, !!symbol);

  useEffect(() => {
    if (!symbol) return;

    setIsLoading(true);

    const samplePrice = 50000;
    candles1mRef.current = generateSampleCandles(samplePrice, 100);
    hasInitializedRef.current = true;

    updateChartData();
    setIsLoading(false);
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;

    const currentPrice = priceData?.price && isConnected ? priceData.price : null;
    if (!currentPrice || currentPrice <= 0) return;

    const now = Date.now() / 1000;

    if (!hasInitializedRef.current && candles1mRef.current.length === 0) {
      candles1mRef.current = generateSampleCandles(currentPrice, 100);
      hasInitializedRef.current = true;
      setIsLoading(false);
    }

    if (currentPrice !== lastPriceRef.current) {
      candles1mRef.current = buildCandleFromPriceUpdates(
        candles1mRef.current,
        currentPrice,
        priceData?.volume || 0,
        now,
      );

      lastPriceRef.current = currentPrice;
    }

    updateChartData();
  }, [priceData, isConnected, symbol]);

  // SIMPLE DATA MODE: No external API calls

  const updateChartData = () => {
    if (candles1mRef.current.length === 0) return;

    const candles1m = candles1mRef.current;
    const candles5m = aggregateCandles(candles1m, 5);
    const candles15m = aggregateCandles(candles1m, 15);
    const candles1h = aggregateCandles(candles1m, 60);

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
      coinglass: {
        fundingRate: 0,
        fundingSentiment: "neutral" as const,
        openInterest: 0,
        oiChange: 0,
        liquidations: { longs: 0, shorts: 0 },
        longShortRatio: 1,
        overallSentiment: "neutral" as const,
      },
      levels,
      liquiditySweeps,
      candleCount: candles1m.length,
      dataSource: hasInitializedRef.current ? "realtime" : "sample",
    });
  };

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

// SIMPLE DATA MODE: Removed parseCoinglassData - all market data is now local placeholders


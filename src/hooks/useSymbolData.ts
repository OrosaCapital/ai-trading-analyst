import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimePriceStream } from "./useRealtimePriceStream";
import { normalizeSymbol } from "@/lib/symbolUtils";

interface SymbolData {
  currentPrice: number | null;
  priceChange24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  circulatingSupply: number | null;
  rank: number | null;
  fundingRate: number | null;
  fundingRateTrend: string | null;
  openInterest: number | null;
  openInterestChange: number | null;
  longShortRatio: number | null;
  liquidations24h: number | null;
  takerBuyVolume: number | null;
  takerSellVolume: number | null;
  fearGreedIndex: number | null;
  fearGreedLabel: string | null;
  rsi: number | null;
  ema50: number | null;
  ema200: number | null;
  aiDecision: string | null;
  aiConfidence: number | null;
  aiReasoning: any | null;
}

export function useSymbolData(symbol: string) {
  const [data, setData] = useState<SymbolData>({
    currentPrice: null,
    priceChange24h: null,
    volume24h: null,
    marketCap: null,
    circulatingSupply: null,
    rank: null,
    fundingRate: null,
    fundingRateTrend: null,
    openInterest: null,
    openInterestChange: null,
    longShortRatio: null,
    liquidations24h: null,
    takerBuyVolume: null,
    takerSellVolume: null,
    fearGreedIndex: null,
    fearGreedLabel: null,
    rsi: null,
    ema50: null,
    ema200: null,
    aiDecision: null,
    aiConfidence: null,
    aiReasoning: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { priceData } = useRealtimePriceStream(symbol);

  const lastSymbolRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!symbol) return;

    // prevent flooding when the same symbol is used
    if (lastSymbolRef.current === symbol) return;
    lastSymbolRef.current = symbol;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      const fetchAll = async () => {
        setIsLoading(true);
        setError(null);

        const baseSymbol = normalizeSymbol(symbol);

        try {
          const results = await Promise.allSettled([
            supabase.functions.invoke("fetch-cmc-quotes", { body: { symbol: baseSymbol } }),
            supabase.functions.invoke("fetch-funding-rate", { body: { symbol } }),
            supabase.functions.invoke("fetch-open-interest", { body: { symbol } }),
            supabase.functions.invoke("fetch-long-short-ratio", { body: { symbol } }),
            supabase.functions.invoke("fetch-liquidations", { body: { symbol } }),
            supabase.functions.invoke("fetch-taker-volume", { body: { symbol } }),
            supabase.functions.invoke("fetch-fear-greed-index"),
            supabase.functions.invoke("fetch-rsi", { body: { symbol } }),
            supabase.functions.invoke("fetch-trading-data", { body: { symbol } }),
          ]);

          const [
            cmcQuotes,
            fundingRate,
            openInterest,
            longShortRatio,
            liquidations,
            takerVolume,
            fearGreed,
            rsiData,
            aiSignal,
          ] = results;

          if (cmcQuotes.status === "fulfilled" && cmcQuotes.value.data) {
            const s = cmcQuotes.value.data;
            if (!s.error) {
              setData((prev) => ({
                ...prev,
                currentPrice: s.price,
                priceChange24h: s.percentChange24h,
                volume24h: s.volume24h,
                marketCap: s.marketCap,
                circulatingSupply: s.circulatingSupply || null,
                rank: s.rank || null,
              }));
            }
          }

          if (fundingRate.status === "fulfilled" && fundingRate.value.data) {
            const fr = fundingRate.value.data;
            setData((prev) => ({
              ...prev,
              fundingRate: fr.rate || fr.fundingRate,
              fundingRateTrend: fr.trend,
            }));
          }

          if (openInterest.status === "fulfilled" && openInterest.value.data) {
            const oi = openInterest.value.data;
            setData((prev) => ({
              ...prev,
              openInterest: oi.openInterest,
              openInterestChange: oi.change24h,
            }));
          }

          if (longShortRatio.status === "fulfilled" && longShortRatio.value.data) {
            const ls = longShortRatio.value.data;
            setData((prev) => ({
              ...prev,
              longShortRatio: ls.ratio || ls.longShortRatio,
            }));
          }

          if (liquidations.status === "fulfilled" && liquidations.value.data) {
            const liq = liquidations.value.data;
            setData((prev) => ({
              ...prev,
              liquidations24h: liq.total24h || liq.liquidations24h,
            }));
          }

          if (takerVolume.status === "fulfilled" && takerVolume.value.data) {
            const tv = takerVolume.value.data;
            setData((prev) => ({
              ...prev,
              takerBuyVolume: tv.buyVolume,
              takerSellVolume: tv.sellVolume,
            }));
          }

          if (fearGreed.status === "fulfilled" && fearGreed.value.data) {
            const fg = fearGreed.value.data;
            setData((prev) => ({
              ...prev,
              fearGreedIndex: fg.value,
              fearGreedLabel: fg.valueClassification,
            }));
          }

          if (rsiData.status === "fulfilled" && rsiData.value.data) {
            const rsi = rsiData.value.data;
            setData((prev) => ({
              ...prev,
              rsi: rsi.rsi || rsi.value,
            }));
          }

          if (aiSignal.status === "fulfilled" && aiSignal.value.data) {
            const ai = aiSignal.value.data;
            setData((prev) => ({
              ...prev,
              aiDecision: ai.decision,
              aiConfidence: ai.confidence,
              aiReasoning: ai.reasoning,
            }));
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
          setIsLoading(false);
        }
      };

      fetchAll();
    }, 300);
  }, [symbol]);

  useEffect(() => {
    if (priceData?.price) {
      setData((prev) => ({
        ...prev,
        currentPrice: priceData.price,
      }));
    }
  }, [priceData]);

  return { data, isLoading, error };
}

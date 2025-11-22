import { useEffect, useState } from "react";

export interface KrakenCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function useKrakenOHLC(symbol: string, interval: number = 60) {
  const [candles, setCandles] = useState<KrakenCandle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKrakenOHLC() {
      setIsLoading(true);
      setError(null);
      try {
        // Kraken API expects pairs like "XBTUSDT" => "XXBTZUSD"
        const krakenPair = symbol === "BTCUSDT" ? "XXBTZUSD" : symbol;
        const url = `https://api.kraken.com/0/public/OHLC?pair=${krakenPair}&interval=${interval}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.result || !data.result[krakenPair]) throw new Error("No OHLC data returned");
        const rawCandles = data.result[krakenPair];
        const parsed: KrakenCandle[] = rawCandles.map((c: any) => ({
          time: c[0],
          open: parseFloat(c[1]),
          high: parseFloat(c[2]),
          low: parseFloat(c[3]),
          close: parseFloat(c[4]),
          volume: parseFloat(c[6]),
        }));
        setCandles(parsed);
      } catch (err: any) {
        setError(err.message || "Unknown error");
        setCandles([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchKrakenOHLC();
  }, [symbol, interval]);

  return { candles, isLoading, error };
}

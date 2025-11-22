// src/hooks/use24hStats.ts
import { useState, useEffect } from 'react';

interface KrakenTickerResponse {
  error: string[];
  result: {
    [pair: string]: {
      h: [string, string]; // h = high array [today, last 24 hours]
      l: [string, string]; // l = low array [today, last 24 hours]
      v: [string, string]; // v = volume array [today, last 24 hours]
    };
  };
}

interface Stats24h {
  high: number | null;
  low: number | null;
  volume: number | null;
}

export function use24hStats(symbol: string | null) {
  const [stats, setStats] = useState<Stats24h>({ high: null, low: null, volume: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setStats({ high: null, low: null, volume: null });
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Handle Kraken's BTC representation
        const apiSymbol = symbol.toUpperCase() === 'BTCUSDT' ? 'XBTUSDT' : symbol;
        const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${apiSymbol}`);
        if (!response.ok) {
          throw new Error(`Kraken API request failed: ${response.status}`);
        }

        const data: KrakenTickerResponse = await response.json();

        if (data.error && data.error.length > 0) {
          throw new Error(data.error.join(', '));
        }

        const pairData = data.result[apiSymbol];
        if (pairData) {
          setStats({
            high: parseFloat(pairData.h[1]), // Index 1 is the last 24 hours
            low: parseFloat(pairData.l[1]),
            volume: parseFloat(pairData.v[1]),
          });
        } else {
          throw new Error(`No data returned for symbol: ${apiSymbol}`);
        }

      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch 24h stats from Kraken:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refetch every 60 seconds

    return () => clearInterval(interval);
  }, [symbol]);

  return { ...stats, isLoading, error };
}

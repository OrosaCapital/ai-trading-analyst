import { LiveCandle } from "@/hooks/useStreamingCandleData";

export async function fetchHistoricalCandles(symbol: string, interval: number): Promise<LiveCandle[]> {
  // Calculate a 'since' timestamp for approximately the last 24 hours of data
  // Kraken's 'since' is in seconds, so we divide by 1000
  const since = Math.floor(Date.now() / 1000) - (86400); // 86400 seconds in a day

  const apiSymbol = symbol.toUpperCase() === 'BTCUSDT' ? 'XBTUSDT' : symbol;
  const url = `https://api.kraken.com/0/public/OHLC?pair=${apiSymbol}&interval=${interval}&since=${since}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Kraken API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API Error: ${data.error.join(', ')}`);
    }

    // The actual pair name in the response might be different (e.g., XBTUSDT becomes XXBTZUSD)
    // So, we get the first key from the result object.
    const resultPair = Object.keys(data.result)[0];
    if (!resultPair) {
      throw new Error("No data returned in the expected format from Kraken.");
    }
    
    const pairData = data.result[resultPair];

    // Map the Kraken OHLC array to the LiveCandle structure
    return pairData.map((c: any) => ({
      time: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[6]), // Volume is at index 6 for Kraken OHLC
    }));

  } catch (error) {
    console.error("Failed to fetch historical candles:", error);
    return []; // Return an empty array on error to prevent chart crashes
  }
}

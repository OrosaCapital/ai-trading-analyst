// CoinMarketCap data types

export interface CMCQuote {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply: number | null;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  marketCapDominance: number;
  rank: number;
  lastUpdated: string;
}

export interface CMCGlobalMetrics {
  totalMarketCap: number;
  total24hVolume: number;
  btcDominance: number;
  ethDominance: number;
  activeExchanges: number;
  activeCryptocurrencies: number;
  totalExchanges: number;
  lastUpdated: string;
}

export interface CMCTrendingCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  price: number;
  percentChange24h: number;
  marketCap: number;
  volume24h: number;
}

export interface CMCHistoricalQuote {
  timestamp: string;
  price: number;
  volume24h: number;
  marketCap: number;
}

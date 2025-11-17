export interface MockMetrics {
  price: {
    current: number;
    change24h: number;
    changePercent24h: number;
  };
  volume: {
    volume24h: number;
    volumeChange: number;
  };
  fundingRate: {
    current: number;
    predicted: number;
    trend: 'up' | 'down' | 'neutral';
  };
  openInterest: {
    total: number;
    change24h: number;
    trend: 'up' | 'down';
  };
  longShortRatio: {
    long: number;
    short: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  };
  liquidations: {
    long24h: number;
    short24h: number;
    total24h: number;
  };
}

export const mockMetrics: MockMetrics = {
  price: {
    current: 69700,
    change24h: 1680,
    changePercent24h: 2.47
  },
  volume: {
    volume24h: 42800000000,
    volumeChange: 12.3
  },
  fundingRate: {
    current: 0.0082,
    predicted: 0.0095,
    trend: 'up'
  },
  openInterest: {
    total: 8200000000,
    change24h: 4.8,
    trend: 'up'
  },
  longShortRatio: {
    long: 52,
    short: 48,
    sentiment: 'bullish'
  },
  liquidations: {
    long24h: 23400000,
    short24h: 18900000,
    total24h: 42300000
  }
};

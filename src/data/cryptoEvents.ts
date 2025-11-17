import { ChartAnnotation } from '@/types/annotations';

export const cryptoEvents: Record<string, ChartAnnotation[]> = {
  BTCUSDT: [
    {
      id: 'btc-halving-2020',
      date: '2020-05-11',
      price: 8800,
      title: 'Bitcoin Halving',
      description: 'Third Bitcoin halving - block reward reduced from 12.5 to 6.25 BTC',
      type: 'milestone',
      yOffset: -80,
      xOffset: -60,
    },
    {
      id: 'btc-tesla-buy',
      date: '2021-02-08',
      price: 44200,
      title: 'Tesla Buys $1.5B BTC',
      description: 'Tesla announces $1.5 billion Bitcoin purchase',
      type: 'news',
      yOffset: 60,
      xOffset: 20,
    },
    {
      id: 'btc-ath-2021',
      date: '2021-11-10',
      price: 68789,
      title: 'All-Time High',
      description: 'Bitcoin reaches all-time high of $68,789',
      type: 'milestone',
      yOffset: -100,
      xOffset: -40,
    },
    {
      id: 'btc-luna-crash',
      date: '2022-05-09',
      price: 31000,
      title: 'Terra/LUNA Collapse',
      description: 'Terra ecosystem collapse triggers crypto market crash',
      type: 'event',
      yOffset: 80,
      xOffset: 30,
    },
    {
      id: 'btc-ftx-collapse',
      date: '2022-11-08',
      price: 17500,
      title: 'FTX Collapse',
      description: 'FTX exchange files for bankruptcy, market panic',
      type: 'event',
      yOffset: -70,
      xOffset: -50,
    },
    {
      id: 'btc-etf-approval',
      date: '2024-01-10',
      price: 46500,
      title: 'Spot ETF Approval',
      description: 'SEC approves spot Bitcoin ETFs in the United States',
      type: 'news',
      yOffset: 90,
      xOffset: -70,
    },
    {
      id: 'btc-halving-2024',
      date: '2024-04-20',
      price: 64000,
      title: 'Bitcoin Halving',
      description: 'Fourth Bitcoin halving - block reward reduced from 6.25 to 3.125 BTC',
      type: 'milestone',
      yOffset: -90,
      xOffset: 40,
    },
  ],
  ETHUSDT: [
    {
      id: 'eth-london-fork',
      date: '2021-08-05',
      price: 2800,
      title: 'London Hard Fork',
      description: 'EIP-1559 implemented, introducing fee burning mechanism',
      type: 'milestone',
      yOffset: -70,
      xOffset: -50,
    },
    {
      id: 'eth-merge',
      date: '2022-09-15',
      price: 1590,
      title: 'The Merge',
      description: 'Ethereum transitions from Proof of Work to Proof of Stake',
      type: 'milestone',
      yOffset: 80,
      xOffset: 30,
    },
    {
      id: 'eth-shanghai',
      date: '2023-04-12',
      price: 1900,
      title: 'Shanghai Upgrade',
      description: 'Staking withdrawals enabled on Ethereum',
      type: 'milestone',
      yOffset: -60,
      xOffset: -40,
    },
    {
      id: 'eth-etf-approval',
      date: '2024-05-23',
      price: 3800,
      title: 'ETH ETF Approval',
      description: 'SEC approves spot Ethereum ETFs',
      type: 'news',
      yOffset: 70,
      xOffset: 20,
    },
  ],
  SOLUSDT: [
    {
      id: 'sol-ftx-exposure',
      date: '2022-11-09',
      price: 15,
      title: 'FTX Exposure',
      description: 'Solana heavily impacted by FTX collapse and Alameda holdings',
      type: 'event',
      yOffset: -80,
      xOffset: -60,
    },
    {
      id: 'sol-outage-2023',
      date: '2023-02-25',
      price: 22,
      title: 'Network Outage',
      description: 'Solana network experiences 20-hour outage',
      type: 'event',
      yOffset: 60,
      xOffset: 30,
    },
    {
      id: 'sol-firedancer',
      date: '2024-03-15',
      price: 140,
      title: 'Firedancer Announced',
      description: 'Jump Crypto announces Firedancer validator client',
      type: 'news',
      yOffset: -70,
      xOffset: -40,
    },
  ],
};

export function getEventsForSymbol(symbol: string): ChartAnnotation[] {
  // Normalize symbol (BTCUSD -> BTCUSDT)
  const normalizedSymbol = symbol.replace('USD', 'USDT');
  return cryptoEvents[normalizedSymbol] || [];
}

export function filterEventsByDateRange(
  events: ChartAnnotation[],
  startDate: Date,
  endDate: Date
): ChartAnnotation[] {
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startDate && eventDate <= endDate;
  });
}

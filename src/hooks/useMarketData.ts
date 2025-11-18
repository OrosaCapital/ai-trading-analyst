import { useEffect } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { toast } from 'sonner';

export const useMarketData = (symbol: string | null) => {
  const store = useMarketStore();

  useEffect(() => {
    if (!symbol) return;

    // Set symbol and load initial data
    if (symbol !== store.symbol) {
      store.setSymbol(symbol);
    }

    // Start price logging
    store.startPriceLogging();

    // Load trading data initially
    store.loadTradingData();

    // Poll trading data based on status
    const interval = setInterval(() => {
      store.loadTradingData();
    }, store.tradingData?.status === 'accumulating' ? 60000 : 600000);

    return () => clearInterval(interval);
  }, [symbol, store.tradingData?.status]);

  // Show toast when analysis is ready
  useEffect(() => {
    if (store.tradingData?.status === 'ready' && store.tradingData.aiSignal) {
      toast.success('AI analysis complete!');
    }
  }, [store.tradingData?.status]);

  return {
    data: store.tradingData,
    isLoading: store.loading.trading,
    error: store.tradingData?.status === 'ready' && !store.tradingData.aiSignal 
      ? 'Failed to load trading data' 
      : null,
  };
};

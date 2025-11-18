import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SymbolSummaryPanel } from '@/components/panels/SymbolSummaryPanel';
import { MainChart } from '@/components/charts/MainChart';
import { AIAnalysisPanel } from '@/components/dashboard/AIAnalysisPanel';
import { CoinglassPanel } from '@/components/dashboard/CoinglassPanel';
import { useMarketStore } from '@/store/useMarketStore';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const { symbol, setSymbol, loadMarketData } = useMarketStore();

  // Update symbol from URL params
  useEffect(() => {
    const urlSymbol = searchParams.get('symbol');
    if (urlSymbol && urlSymbol !== symbol) {
      setSymbol(urlSymbol);
    }
  }, [searchParams]);

  // Load market data on mount and periodically
  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 120000); // Every 2 minutes
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <AppShell>
      {/* Live Price Header */}
      <SymbolSummaryPanel symbol={symbol} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column - Chart */}
        <div className="lg:col-span-2 space-y-6">
          <MainChart />
        </div>

        {/* Right Column - Analysis Panels */}
        <div className="space-y-6">
          <AIAnalysisPanel symbol={symbol} />
          <CoinglassPanel symbol={symbol} />
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
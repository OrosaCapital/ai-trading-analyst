import { useState } from 'react';
import { LivePriceHeader } from '@/components/dashboard/LivePriceHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const Dashboard = () => {
  const [symbol, setSymbol] = useState('BTC');
  const [inputValue, setInputValue] = useState('BTC');

  const handleSymbolChange = () => {
    const cleanSymbol = inputValue.trim().toUpperCase();
    if (cleanSymbol) {
      setSymbol(cleanSymbol);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSymbolChange();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-accent">OCAPX</h1>
            <span className="text-sm text-muted-foreground">Trading Dashboard</span>
          </div>

          {/* Symbol Search */}
          <div className="flex items-center gap-2 max-w-xs">
            <Input
              placeholder="Enter symbol (BTC, ETH, SOL...)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="font-mono"
            />
            <Button onClick={handleSymbolChange} size="icon" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Section 1: Live Price Header */}
        <section>
          <LivePriceHeader symbol={symbol} />
        </section>

        {/* Section 2: Market Metrics - Coming Soon */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Market Cap</div>
            <div className="text-2xl font-bold">Coming Soon</div>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">24h Volume</div>
            <div className="text-2xl font-bold">Coming Soon</div>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">24h Change</div>
            <div className="text-2xl font-bold">Coming Soon</div>
          </div>
        </section>

        {/* Section 3: Chart - Coming Soon */}
        <section className="p-12 bg-card border border-border rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-muted-foreground mb-2">📊</div>
            <div className="text-xl font-semibold text-muted-foreground">Chart Coming Soon</div>
            <div className="text-sm text-muted-foreground mt-2">
              Custom lightweight-charts integration in progress
            </div>
          </div>
        </section>

        {/* Section 4: AI Analysis - Coming Soon */}
        <section className="p-12 bg-card border border-border rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-muted-foreground mb-2">🤖</div>
            <div className="text-xl font-semibold text-muted-foreground">AI Analysis Coming Soon</div>
            <div className="text-sm text-muted-foreground mt-2">
              Lovable AI-powered market insights in progress
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

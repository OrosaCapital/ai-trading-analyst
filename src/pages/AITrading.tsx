import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AISignalCard } from '@/components/AISignalCard';
import { PriceLogsSidebar } from '@/components/PriceLogsSidebar';
import { DataAccumulationProgress } from '@/components/DataAccumulationProgress';
import { SimplifiedChart } from '@/components/SimplifiedChart';
import { PremiumMarketMetrics } from '@/components/PremiumMarketMetrics';
import { useAITradingData } from '@/hooks/useAITradingData';
import { normalizeSymbol } from '@/lib/symbolUtils';
import { Zap } from 'lucide-react';

const popularSymbols = ['BTC', 'ETH', 'SOL', 'XRP'];

export default function AITrading() {
  const [input, setInput] = useState('');
  const [symbol, setSymbol] = useState<string | null>(null);
  
  const { data, isLoading } = useAITradingData(symbol);

  const handleAnalyze = (sym?: string) => {
    const targetSymbol = sym || input.toUpperCase();
    setSymbol(normalizeSymbol(targetSymbol));
  };

  return (
    <div className="min-h-screen">
      <header className="glass-strong border-b border-primary/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-accent glow-accent">OCAPX</div>
            <span className="text-sm font-medium text-muted-foreground">AI Trading Terminal</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="glass rounded-2xl p-8 space-y-6">
          <h1 className="text-4xl font-bold text-center">
            AI-Powered <span className="text-gradient">Day Trading</span>
          </h1>
          
          <div className="max-w-2xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Enter symbol (BTC, ETH, SOL...)"
              className="flex-1 h-14 glass-strong text-lg"
            />
            <Button onClick={() => handleAnalyze()} className="h-14 px-8">
              <Zap className="w-5 h-5 mr-2" />
              Analyze
            </Button>
          </div>

          <div className="flex gap-2 justify-center">
            {popularSymbols.map(sym => (
              <Button key={sym} variant="outline" onClick={() => handleAnalyze(sym)}>
                {sym}
              </Button>
            ))}
          </div>
        </div>

        {data?.status === 'accumulating' && (
          <DataAccumulationProgress 
            message={data.message || 'Collecting data...'} 
            progress={data.progress || 0} 
          />
        )}

        {data?.status === 'ready' && data.aiSignal && (
          <>
            <AISignalCard {...data.aiSignal} />
            
            <SimplifiedChart 
              symbol={symbol} 
              priceData={data.priceData} 
              emas={data.emas}
            />

            <PremiumMarketMetrics symbol={symbol} />
          </>
        )}
      </div>
    </div>
  );
}

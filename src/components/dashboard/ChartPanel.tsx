import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { StaticTradingChart } from "@/components/StaticTradingChart";
import { mockCandles } from "@/data/mockCandles";
import { mockSignals } from "@/data/mockSignals";

const timeframes = ['1M', '5M', '15M', '1H'];

export const ChartPanel = () => {
  const [activeTimeframe, setActiveTimeframe] = useState('1H');

  return (
    <Card className="p-6 glass h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">BTC/USD Chart</h3>
        <div className="flex gap-2">
          {timeframes.map(tf => (
            <Button
              key={tf}
              variant={activeTimeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTimeframe(tf)}
              className="min-w-[60px]"
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[400px] relative">
        <StaticTradingChart candles={mockCandles} signals={mockSignals} />
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-green" />
          <span>Buy Signal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-red" />
          <span>Sell Signal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary" />
          <span>EMA 50</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-accent" />
          <span>EMA 200</span>
        </div>
      </div>
    </Card>
  );
};

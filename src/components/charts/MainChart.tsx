import type { MarketSnapshot } from "../../types/market";
import { Card } from "../ui/card";

interface MainChartProps {
  snapshot?: MarketSnapshot;
}

export function MainChart({ snapshot }: MainChartProps) {
  return (
    <Card title="Price Action" className="h-72">
      {/* Placeholder – connect to real charting later */}
      <div className="flex h-full items-center justify-center text-xs text-gray-500">
        {snapshot ? `Candles loaded: ${snapshot.candles.length}` : "No data yet. Select a symbol/timeframe."}
      </div>
    </Card>
  );
}

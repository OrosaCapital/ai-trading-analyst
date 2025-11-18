import type { MarketSnapshot } from "../../types/market";
import { Card } from "../ui/Card";

interface SymbolSummaryPanelProps {
  snapshot?: MarketSnapshot;
}

export function SymbolSummaryPanel({ snapshot }: SymbolSummaryPanelProps) {
  const last = snapshot?.candles.at(-1);

  return (
    <Card title="Symbol Summary">
      {snapshot && last ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-500">Last Price</div>
            <div className="text-sm font-semibold">{last.close.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500">Volume</div>
            <div className="text-sm font-semibold">{last.volume.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500">EMA Fast</div>
            <div>{snapshot.indicators?.emaFast?.toFixed(2) ?? "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">RSI</div>
            <div>{snapshot.indicators?.rsi?.toFixed(1) ?? "—"}</div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">Data will appear here after the first load.</div>
      )}
    </Card>
  );
}

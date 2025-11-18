import type { DataValidationSummary } from "../../types/market";
import { Card } from "../ui/Card";

interface DataValidationPanelProps {
  validation?: DataValidationSummary;
}

export function DataValidationPanel({ validation }: DataValidationPanelProps) {
  return (
    <Card title="Data Validation">
      {!validation ? (
        <div className="text-xs text-gray-500">No validation results yet.</div>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-md bg-gray-900 px-2 py-1">
            <span>
              {validation.symbol} · {validation.timeframe.toUpperCase()}
            </span>
            <span className={validation.isReadyForDecision ? "text-emerald-400" : "text-yellow-400"}>
              {validation.isReadyForDecision ? "Ready" : "Check data"}
            </span>
          </div>

          <ul className="space-y-1">
            {validation.items.map((item) => (
              <li key={item.key} className="flex items-center justify-between rounded-md bg-gray-950 px-2 py-1">
                <div>
                  <div className="font-mono text-[11px] text-gray-300">{item.key}</div>
                  <div className="text-[11px] text-gray-500">{item.notes}</div>
                </div>
                <div
                  className={
                    item.valid ? "text-[11px] font-semibold text-emerald-400" : "text-[11px] font-semibold text-red-400"
                  }
                >
                  {item.valid ? "OK" : "ERROR"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

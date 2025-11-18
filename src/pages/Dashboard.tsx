import { MainChart } from "../components/charts/MainChart";
import { SymbolSummaryPanel } from "../components/panels/SymbolSummaryPanel";
import { DataValidationPanel } from "../components/panels/DataValidationPanel";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { useMarketData } from "../hooks/useMarketData";

export function Dashboard() {
  const { snapshot, validation, isLoading, error } = useMarketData();

  return (
    <div className="flex h-full flex-col gap-4">
      {isLoading && <LoadingSpinner />}
      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MainChart snapshot={snapshot} />
        </div>
        <div className="space-y-4">
          <SymbolSummaryPanel snapshot={snapshot} />
          <DataValidationPanel validation={validation} />
        </div>
      </div>
    </div>
  );
}

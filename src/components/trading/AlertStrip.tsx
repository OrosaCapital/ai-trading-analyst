type Severity = "info" | "warn" | "danger";

interface AlertBadge {
  id: string;
  label: string;
  severity: Severity;
}

interface AlertStripProps {
  alerts: AlertBadge[];
  isLoading: boolean;
}

export function AlertStrip({ alerts, isLoading }: AlertStripProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-2 items-center text-xs">
      {isLoading && (
        <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/30 font-semibold flex items-center gap-2 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          Synchronizing live data
        </span>
      )}
      {alerts.length === 0 && !isLoading && (
        <span className="px-3 py-1.5 rounded-full bg-chart-green/10 text-chart-green border border-chart-green/30 font-semibold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-chart-green" />
          Market neutral • No alerts
        </span>
      )}
      {alerts.map((a) => {
        const isAI = a.id === "ai-signal";
        return (
          <span
            key={a.id}
            className={`px-3 py-1.5 rounded-full border font-semibold flex items-center gap-2 transition-all hover:scale-105 ${
              isAI
                ? "bg-primary/10 text-primary border-primary/30"
                : a.severity === "danger"
                  ? "bg-chart-red/10 text-chart-red border-chart-red/30"
                  : a.severity === "warn"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-sky-500/10 text-sky-400 border-sky-500/30"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${
              isAI
                ? "bg-primary animate-pulse"
                : a.severity === "danger"
                  ? "bg-chart-red animate-pulse"
                  : a.severity === "warn"
                    ? "bg-amber-400"
                    : "bg-sky-400"
            }`} />
            {a.label}
          </span>
        );
      })}
    </div>
  );
}

export type { AlertBadge, Severity };

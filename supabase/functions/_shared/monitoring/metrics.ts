// Legacy export
export const recordMetric = async (name: string, value: number): Promise<void> => {
  trackMetric(name, value);
};

// In-memory metrics store
const metricsStore: Map<string, number> = new Map();

export function trackMetric(
  metricName: string,
  value: number,
  context?: Record<string, string>
): void {
  const key = context ? `${metricName}:${JSON.stringify(context)}` : metricName;
  const current = metricsStore.get(key) || 0;
  metricsStore.set(key, current + value);

  console.log(JSON.stringify({
    type: 'metric',
    name: metricName,
    value,
    context,
    timestamp: new Date().toISOString(),
  }));
}

export function getMetric(metricName: string, context?: Record<string, string>): number {
  const key = context ? `${metricName}:${JSON.stringify(context)}` : metricName;
  return metricsStore.get(key) || 0;
}

export function resetMetrics(): void {
  metricsStore.clear();
}

export function getAllMetrics(): Record<string, number> {
  const metrics: Record<string, number> = {};
  metricsStore.forEach((value, key) => {
    metrics[key] = value;
  });
  return metrics;
}

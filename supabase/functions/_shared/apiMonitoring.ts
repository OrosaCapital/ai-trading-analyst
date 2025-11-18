/**
 * API Monitoring & Health Tracking
 * Tracks API call success rates, response times, and errors
 */

export interface APICallMetrics {
  endpoint: string;
  symbol: string;
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: number;
}

export interface APIHealthStats {
  endpoint: string;
  totalCalls: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  successRate: number;
  lastError?: string;
  lastErrorTime?: number;
}

// In-memory store for recent API calls (last 100 per endpoint)
const metricsStore = new Map<string, APICallMetrics[]>();
const MAX_METRICS_PER_ENDPOINT = 100;

// Track an API call
export function trackAPICall(metrics: APICallMetrics): void {
  const key = metrics.endpoint;
  
  if (!metricsStore.has(key)) {
    metricsStore.set(key, []);
  }
  
  const endpointMetrics = metricsStore.get(key)!;
  endpointMetrics.push(metrics);
  
  // Keep only recent metrics
  if (endpointMetrics.length > MAX_METRICS_PER_ENDPOINT) {
    endpointMetrics.shift();
  }
  
  // Log significant events
  if (!metrics.success) {
    console.error(`🔴 API call failed [${metrics.endpoint}] ${metrics.symbol}: ${metrics.error}`);
  } else if (metrics.responseTime > 5000) {
    console.warn(`🐌 Slow API response [${metrics.endpoint}] ${metrics.symbol}: ${metrics.responseTime}ms`);
  }
}

// Get health stats for an endpoint
export function getEndpointHealth(endpoint: string): APIHealthStats | null {
  const metrics = metricsStore.get(endpoint);
  
  if (!metrics || metrics.length === 0) {
    return null;
  }
  
  const totalCalls = metrics.length;
  const successCount = metrics.filter(m => m.success).length;
  const errorCount = metrics.filter(m => !m.success).length;
  const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalCalls;
  const successRate = (successCount / totalCalls) * 100;
  
  const lastErrorMetric = metrics
    .slice()
    .reverse()
    .find(m => !m.success);
  
  return {
    endpoint,
    totalCalls,
    successCount,
    errorCount,
    averageResponseTime: Math.round(avgResponseTime),
    successRate: Math.round(successRate * 100) / 100,
    lastError: lastErrorMetric?.error,
    lastErrorTime: lastErrorMetric?.timestamp,
  };
}

// Get health summary for all endpoints
export function getAllEndpointsHealth(): Map<string, APIHealthStats> {
  const summary = new Map<string, APIHealthStats>();
  
  for (const [endpoint] of metricsStore) {
    const health = getEndpointHealth(endpoint);
    if (health) {
      summary.set(endpoint, health);
    }
  }
  
  return summary;
}

// Check if an endpoint is healthy
export function isEndpointHealthy(endpoint: string, minSuccessRate = 70): boolean {
  const health = getEndpointHealth(endpoint);
  
  if (!health) {
    return true; // No data yet, assume healthy
  }
  
  return health.successRate >= minSuccessRate;
}

// Create a wrapper function to track API calls automatically
export async function monitoredAPICall<T> (
  endpoint: string,
  symbol: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await apiCall();
    const responseTime = Date.now() - startTime;
    
    trackAPICall({
      endpoint,
      symbol,
      success: true,
      responseTime,
      timestamp: Date.now(),
    });
    
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    trackAPICall({
      endpoint,
      symbol,
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    });
    
    throw error;
  }
}

// Generate health report for logging
export function generateHealthReport(): string {
  const allHealth = getAllEndpointsHealth();
  
  if (allHealth.size === 0) {
    return 'No API health data available';
  }
  
  const lines = ['=== API Health Report ==='];
  
  for (const [endpoint, health] of allHealth) {
    const status = health.successRate >= 90 ? '✅' : health.successRate >= 70 ? '⚠️' : '❌';
    lines.push(
      `${status} ${endpoint}: ${health.successRate}% success (${health.successCount}/${health.totalCalls}) ` +
      `avg: ${health.averageResponseTime}ms`
    );
    
    if (health.lastError) {
      const errorAge = Math.round((Date.now() - (health.lastErrorTime || 0)) / 1000);
      lines.push(`   Last error (${errorAge}s ago): ${health.lastError}`);
    }
  }
  
  lines.push('========================');
  
  return lines.join('\n');
}

// Periodic health report (call from a scheduled function)
export function scheduleHealthReports(intervalMs = 300000): void {
  setInterval(() => {
    const report = generateHealthReport();
    console.log(report);
  }, intervalMs);
}

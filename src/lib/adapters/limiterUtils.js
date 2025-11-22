import Bottleneck from 'bottleneck';
import pRetry from 'p-retry';

const DEFAULT_RETRY = {
  retries: 3,
  factor: 2,
  minTimeout: 400,
  maxTimeout: 4000
};

export function createLimiter(options = {}) {
  if (!Bottleneck) return null;
  return new Bottleneck({
    id: options.id || 'adapter-http-limiter',
    minTime: options.minTime ?? 250,
    maxConcurrent: options.maxConcurrent ?? 1,
    reservoir: options.reservoir ?? null,
    reservoirRefreshAmount: options.reservoirRefreshAmount ?? null,
    reservoirRefreshInterval: options.reservoirRefreshInterval ?? null
  });
}

export function withLimiterAndRetry(limiter, fn, retryOverrides = {}) {
  const exec = () => (limiter ? limiter.schedule(fn) : fn());
  return pRetry(exec, { ...DEFAULT_RETRY, ...retryOverrides });
}

export function withRetry(fn, retryOverrides = {}) {
  return pRetry(fn, { ...DEFAULT_RETRY, ...retryOverrides });
}

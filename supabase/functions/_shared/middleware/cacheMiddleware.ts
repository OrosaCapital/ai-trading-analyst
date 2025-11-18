export const withCache = (fn: Function, ttl: number) => async (...args: any[]) => fn(...args);

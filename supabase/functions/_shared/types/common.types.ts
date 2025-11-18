export interface CacheEntry { key: string; value: any; expiresAt: number; }
export interface ValidationResult { valid: boolean; errors?: string[]; }
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

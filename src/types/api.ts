// Basic API response wrappers

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

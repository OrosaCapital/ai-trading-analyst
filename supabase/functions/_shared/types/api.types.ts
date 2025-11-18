export interface ApiResponse<T> { data?: T; error?: ApiError; }
export interface ApiError { message: string; code?: string; }
export interface PaginatedResponse<T> { data: T[]; page: number; total: number; }

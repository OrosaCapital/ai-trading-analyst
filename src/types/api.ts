export interface EdgeFunctionRequest {
  symbol?: string;
  [key: string]: any;
}

export interface EdgeFunctionResponse<T = any> {
  data: T | null;
  error: Error | null;
}

export interface PriceData {
  price: number;
  timestamp: number;
  unavailable?: boolean;
}

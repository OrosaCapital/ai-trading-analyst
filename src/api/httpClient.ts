import type { ApiResult } from "../types/api";

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: {
          message: text || res.statusText,
          status: res.status,
        },
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error: any) {
    return {
      ok: false,
      error: {
        message: error?.message ?? "Network error",
      },
    };
  }
}

export const httpClient = {
  get: <T,>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: "GET" }),
  post: <T,>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
};

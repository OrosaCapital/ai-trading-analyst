// Central place for environment variables used by the app.
// IMPORTANT: Only non-sensitive, frontend-safe variables should be here.
// API keys must NEVER be exposed to frontend - use edge functions instead.

export const env = {
  backendBaseUrl: (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ?? "",
};

// No environment assertion needed - all API calls go through edge functions

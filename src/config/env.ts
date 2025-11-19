// Central place for all environment variables used by the app.

export const env = {
  coinglassApiKey: import.meta.env.VITE_COINGLASS_API_KEY as string | undefined,
  cmcApiKey: import.meta.env.VITE_COINMARKETCAP_API_KEY as string | undefined,
  apiNinjasKey: import.meta.env.VITE_API_NINJAS_KEY as string | undefined,
  backendBaseUrl: (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ?? "",
};

export function assertEnv() {
  const missing: string[] = [];

  if (!env.coinglassApiKey) missing.push("VITE_COINGLASS_API_KEY");
  if (!env.cmcApiKey) missing.push("VITE_COINMARKETCAP_API_KEY");
  if (!env.apiNinjasKey) missing.push("VITE_API_NINJAS_KEY");

  if (missing.length) {
    // This will only show in dev console, it won't break prod.
    console.warn("[ENV] Missing environment variables:", missing.join(", "));
  }
}

// SIMPLE DATA MODE: Removed - no external API dependencies
// All market data now comes from local calculations in useProfessionalChartData

export function useMarketData() {
  return {
    symbol: null,
    timeframe: "1h",
    snapshot: null,
    validation: null,
    isLoading: false,
    error: null,
  };
}

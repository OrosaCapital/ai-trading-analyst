// SIMPLE DATA MODE: Removed - no external API dependencies
// Trading decisions now calculated locally using signal engine

export const useAITradingData = (symbol: string | null) => {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};

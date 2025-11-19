import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CoinglassCoinsResponse {
  success: boolean;
  coins: string[];
  count: number;
  error?: string;
}

export const useCoinglassCoins = () => {
  return useQuery({
    queryKey: ["coinglass-coins"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<CoinglassCoinsResponse>(
        "fetch-coinglass-coins"
      );

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch coins");

      return data.coins;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 2,
  });
};

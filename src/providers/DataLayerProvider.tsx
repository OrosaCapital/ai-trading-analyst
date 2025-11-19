import React, { createContext, useContext, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface DataLayerContextType {
  queryKeys: {
    candles: (symbol: string) => string[];
    funding: (symbol: string) => string[];
    metrics: (symbol: string) => string[];
    aiAnalysis: (symbol: string) => string[];
    priceStream: (symbol: string) => string[];
  };
}

const DataContext = createContext<DataLayerContextType | undefined>(undefined);

export function DataLayerProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Centralized cache key structure
  const queryKeys = {
    candles: (symbol: string) => ["candles", symbol],
    funding: (symbol: string) => ["funding", symbol],
    metrics: (symbol: string) => ["metrics", symbol],
    aiAnalysis: (symbol: string) => ["aiAnalysis", symbol],
    priceStream: (symbol: string) => ["priceStream", symbol],
  };

  useEffect(() => {
    // Subscribe to funding rate changes
    const fundingChannel = supabase
      .channel("funding-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "market_funding_rates",
        },
        (payload) => {
          console.log("Funding rate updated:", payload);
          // Invalidate funding queries for the affected symbol
          if (payload.new && "symbol" in payload.new) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.funding(payload.new.symbol as string),
            });
          }
        }
      )
      .subscribe();

    // Subscribe to market snapshot changes
    const snapshotChannel = supabase
      .channel("snapshot-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "market_snapshots",
        },
        (payload) => {
          console.log("Market snapshot updated:", payload);
          if (payload.new && "symbol" in payload.new) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.metrics(payload.new.symbol as string),
            });
          }
        }
      )
      .subscribe();

    channelsRef.current = [fundingChannel, snapshotChannel];

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [queryClient]);

  return (
    <DataContext.Provider value={{ queryKeys }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataLayer() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataLayer must be used within DataLayerProvider");
  }
  return context;
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useTrackedSymbol(symbol: string) {
  const [isTracked, setIsTracked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if symbol is tracked
  useEffect(() => {
    async function checkTrackedStatus() {
      try {
        const { data, error } = await supabase
          .from("tracked_symbols")
          .select("active")
          .eq("symbol", symbol)
          .maybeSingle();

        if (error) throw error;
        setIsTracked(data?.active ?? false);
      } catch (error) {
        console.error("Error checking tracked status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (symbol) {
      checkTrackedStatus();
    }
  }, [symbol]);

  const toggleTracking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to track symbols.",
          variant: "destructive",
        });
        return;
      }

      if (isTracked) {
        // Deactivate tracking
        const { error } = await supabase
          .from("tracked_symbols")
          .update({ active: false })
          .eq("symbol", symbol);

        if (error) throw error;
        setIsTracked(false);
        
        toast({
          title: "Symbol Untracked",
          description: `${symbol} removed from auto-refresh list.`,
        });
      } else {
        // Add or reactivate tracking
        const { error } = await supabase
          .from("tracked_symbols")
          .upsert({ 
            symbol, 
            active: true, 
            added_by: user.id 
          }, {
            onConflict: "symbol"
          });

        if (error) throw error;
        setIsTracked(true);
        
        toast({
          title: "Symbol Tracked",
          description: `${symbol} added to auto-refresh list. Data will update every 5 minutes.`,
        });
      }
    } catch (error) {
      console.error("Error toggling tracking:", error);
      toast({
        title: "Error",
        description: "Failed to update tracking status.",
        variant: "destructive",
      });
    }
  };

  return { isTracked, isLoading, toggleTracking };
}

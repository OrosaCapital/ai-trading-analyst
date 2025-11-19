import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSystemAlertsStore } from "@/store/useSystemAlertsStore";

interface SystemMetrics {
  edgeFunctions: {
    total: number;
    healthy: number;
    errors: number;
  };
  database: {
    status: 'healthy' | 'degraded' | 'down';
    connections: number;
  };
  apis: {
    coinglassStatus: 'operational' | 'degraded' | 'down';
    tatumStatus: 'operational' | 'degraded' | 'down';
  };
  errors: {
    last24h: number;
    criticalCount: number;
  };
}

interface SystemHealthResponse {
  success: boolean;
  metrics: SystemMetrics;
  analysis: string;
  timestamp: number;
}

export const useSystemHealth = () => {
  const [data, setData] = useState<SystemHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alerts = useSystemAlertsStore((state) => state.alerts);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get recent alerts (last 10 only - reduced to save tokens)
        const recentAlerts = alerts.slice(0, 10).map(alert => ({
          type: alert.type,
          title: alert.title,
          message: alert.message.substring(0, 100), // Truncate long messages
          source: alert.source,
        }));

        const { data: result, error: invocationError } = await supabase.functions.invoke<SystemHealthResponse>(
          "system-health-ai",
          {
            body: { alerts: recentAlerts }
          }
        );

        if (invocationError) throw invocationError;
        
        if (result?.success) {
          setData(result);
        } else {
          throw new Error('Failed to fetch system health');
        }
      } catch (err) {
        console.error("Failed to fetch system health:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemHealth();
    
    // Reduced to every 15 minutes to save AI tokens
    const interval = setInterval(fetchSystemHealth, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []); // Removed alerts dependency - only refresh on mount and interval

  return { data, isLoading, error };
};

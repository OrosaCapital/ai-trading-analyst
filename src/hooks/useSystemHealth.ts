import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const fetchSystemHealth = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: result, error: invocationError } = await supabase.functions.invoke<SystemHealthResponse>(
          "system-health-ai"
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
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchSystemHealth, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardVersion = () => {
  const [version, setVersion] = useState<string>("1.0");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const { data, error } = await supabase
          .from("dashboard_versions")
          .select("version")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        if (data) setVersion(data.version);
      } catch (err) {
        console.error("Failed to fetch dashboard version:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return { version, isLoading };
};

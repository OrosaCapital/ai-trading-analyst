import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timeRangeMinutes = 60 } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const timeThreshold = new Date(Date.now() - timeRangeMinutes * 60 * 1000).toISOString();

    // Fetch edge function logs from analytics
    const edgeFunctionLogsQuery = `
      select 
        id, 
        timestamp, 
        event_message, 
        level,
        function_id
      from edge_logs
      where timestamp > extract(epoch from timestamp '${timeThreshold}') * 1000000
        and level in ('error', 'warn')
      order by timestamp desc
      limit 50
    `;

    const { data: edgeLogs, error: edgeError } = await supabase.rpc(
      'analytics_query' as any,
      { query: edgeFunctionLogsQuery }
    );

    // Fetch database logs
    const dbLogsQuery = `
      select 
        id,
        timestamp,
        event_message,
        error_severity,
        identifier
      from postgres_logs
      where timestamp > extract(epoch from timestamp '${timeThreshold}') * 1000000
        and error_severity in ('ERROR', 'WARNING')
      order by timestamp desc
      limit 50
    `;

    const { data: dbLogs, error: dbError } = await supabase.rpc(
      'analytics_query' as any,
      { query: dbLogsQuery }
    );

    if (edgeError || dbError) {
      console.error("Error fetching logs:", { edgeError, dbError });
    }

    // Process and categorize logs
    const edgeFunctionLogs = (edgeLogs || []).map((log: any) => ({
      timestamp: new Date(log.timestamp / 1000).toISOString(),
      level: log.level,
      message: log.event_message,
      functionId: log.function_id,
    }));

    const databaseLogs = (dbLogs || []).map((log: any) => ({
      timestamp: new Date(log.timestamp / 1000).toISOString(),
      severity: log.error_severity,
      message: log.event_message,
      identifier: log.identifier,
    }));

    // Generate summary
    const errorCount = edgeFunctionLogs.filter((l: any) => l.level === "error").length;
    const warningCount = edgeFunctionLogs.filter((l: any) => l.level === "warn").length;
    
    const apiFailures = new Set<string>();
    edgeFunctionLogs.forEach((log: any) => {
      if (log.message.toLowerCase().includes("api") || 
          log.message.toLowerCase().includes("rate limit") ||
          log.message.toLowerCase().includes("timeout")) {
        apiFailures.add(log.message.substring(0, 100));
      }
    });

    const summary = {
      errorCount,
      warningCount,
      dbErrorCount: databaseLogs.filter((l: any) => l.severity === "ERROR").length,
      apiFailures: Array.from(apiFailures).slice(0, 5),
      timeRange: `Last ${timeRangeMinutes} minutes`,
    };

    return new Response(
      JSON.stringify({
        edgeFunctionLogs: edgeFunctionLogs.slice(0, 20),
        databaseLogs: databaseLogs.slice(0, 10),
        summary,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Fetch system logs error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        edgeFunctionLogs: [],
        databaseLogs: [],
        summary: { errorCount: 0, warningCount: 0, dbErrorCount: 0, apiFailures: [] },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

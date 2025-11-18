import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiNinjasKey = Deno.env.get("API_NINJAS_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { symbol, lookback_hours = 24 } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({ success: false, error: "Symbol is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { data: usageData } = await supabase
      .from("api_ninjas_usage")
      .select("api_calls_used")
      .gte("fetched_at", startOfMonth.toISOString());

    const totalCalls = usageData?.reduce((sum, row) => sum + row.api_calls_used, 0) || 0;

    if (totalCalls >= 3000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "API_LIMIT_EXCEEDED",
          message: "Monthly API limit exceeded. Using stored data only.",
          usage: { current: totalCalls, limit: 3000 },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 },
      );
    }

    const now = new Date();
    const lookbackTime = new Date(now.getTime() - lookback_hours * 60 * 60 * 1000);

    const { data: existingLogs } = await supabase
      .from("tatum_price_logs")
      .select("interval")
      .eq("symbol", symbol)
      .gte("timestamp", lookbackTime.toISOString())
      .limit(1);

    if (existingLogs && existingLogs.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Historical data already available",
          records_added: 0,
          api_calls_used: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const intervals = [
      { interval: "1m", lookback: 2 },
      { interval: "5m", lookback: 24 },
    ];

    let totalRecords = 0;
    let apiCallsUsed = 0;

    for (const { interval } of intervals) {
      const apiUrl = `https://api.api-ninjas.com/v1/cryptoprice?symbol=${symbol}&interval=${interval}`;

      const response = await fetch(apiUrl, {
        headers: { "X-Api-Key": apiNinjasKey },
      });

      if (!response.ok) {
        await supabase.from("api_ninjas_usage").insert({
          symbol,
          interval,
          records_fetched: 0,
          api_calls_used: 1,
        });
        continue;
      }

      apiCallsUsed++;

      const data: HistoricalDataPoint[] = await response.json();

      if (!data || data.length === 0) continue;

      const logsToInsert = data.map((point) => ({
        symbol,
        interval,
        price: point.price,
        volume: point.volume || 0,
        timestamp: new Date(point.timestamp * 1000).toISOString(),
      }));

      await supabase.from("tatum_price_logs").insert(logsToInsert);

      totalRecords += logsToInsert.length;

      await supabase.from("api_ninjas_usage").insert({
        symbol,
        interval,
        records_fetched: logsToInsert.length,
        api_calls_used: 1,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Historical data backfilled successfully`,
        records_added: totalRecords,
        api_calls_used: apiCallsUsed,
        usage: { current: totalCalls + apiCallsUsed, limit: 3000 },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch historical data",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});

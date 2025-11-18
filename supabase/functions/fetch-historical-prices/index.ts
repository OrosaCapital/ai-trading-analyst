import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiNinjasKey = Deno.env.get('API_NINJAS_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { symbol, lookback_hours = 24 } = await req.json();

    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`[Historical Fetch] Starting backfill for ${symbol}, lookback: ${lookback_hours}h`);

    // Check API usage limit (3000 calls/month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageData, error: usageError } = await supabase
      .from('api_ninjas_usage')
      .select('api_calls_used')
      .gte('fetched_at', startOfMonth.toISOString());

    if (usageError) {
      console.error('[Historical Fetch] Error checking usage:', usageError);
    }

    const totalCalls = usageData?.reduce((sum, row) => sum + row.api_calls_used, 0) || 0;
    console.log(`[Historical Fetch] API usage this month: ${totalCalls} / 3000`);

    if (totalCalls >= 3000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API_LIMIT_EXCEEDED',
          message: 'Monthly API limit (3000 calls) exceeded. Will use accumulation method.',
          usage: { current: totalCalls, limit: 3000 }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        }
      );
    }

    // Check if we already have sufficient data
    const now = new Date();
    const lookbackTime = new Date(now.getTime() - lookback_hours * 60 * 60 * 1000);

    const { data: existingLogs, error: checkError } = await supabase
      .from('tatum_price_logs')
      .select('interval')
      .eq('symbol', symbol)
      .gte('timestamp', lookbackTime.toISOString())
      .limit(1);

    if (checkError) {
      console.error('[Historical Fetch] Error checking existing data:', checkError);
    }

    if (existingLogs && existingLogs.length > 0) {
      console.log(`[Historical Fetch] Sufficient data already exists for ${symbol}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Historical data already available',
          records_added: 0,
          api_calls_used: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hybrid approach: Fetch 1m data (2 hours) and 5m data (24 hours)
    const intervals = [
      { interval: '1m', lookback: 2 },
      { interval: '5m', lookback: 24 }
    ];

    let totalRecords = 0;
    let apiCallsUsed = 0;

    for (const { interval, lookback } of intervals) {
      console.log(`[Historical Fetch] Fetching ${interval} data for ${symbol} (${lookback}h)...`);

      // API Ninjas endpoint
      const apiUrl = `https://api.api-ninjas.com/v1/cryptoprice?symbol=${symbol}&interval=${interval}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'X-Api-Key': apiNinjasKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Historical Fetch] API Ninjas error (${interval}):`, response.status, errorText);
        
        // Log failed API call
        await supabase.from('api_ninjas_usage').insert({
          symbol,
          interval,
          records_fetched: 0,
          api_calls_used: 1
        });
        
        continue; // Try next interval
      }

      apiCallsUsed++;

      const data: HistoricalDataPoint[] = await response.json();
      console.log(`[Historical Fetch] Received ${data.length} ${interval} records for ${symbol}`);

      if (!data || data.length === 0) {
        console.warn(`[Historical Fetch] No data returned for ${symbol} ${interval}`);
        continue;
      }

      // Prepare logs for insertion
      const logsToInsert = data.map(point => ({
        symbol,
        interval,
        price: point.price,
        volume: point.volume || 0,
        timestamp: new Date(point.timestamp * 1000).toISOString()
      }));

      // Batch insert
      const { error: insertError } = await supabase
        .from('tatum_price_logs')
        .insert(logsToInsert);

      if (insertError) {
        console.error(`[Historical Fetch] Error inserting ${interval} logs:`, insertError);
      } else {
        console.log(`[Historical Fetch] Successfully inserted ${logsToInsert.length} ${interval} logs`);
        totalRecords += logsToInsert.length;
      }

      // Log successful API call
      await supabase.from('api_ninjas_usage').insert({
        symbol,
        interval,
        records_fetched: logsToInsert.length,
        api_calls_used: 1
      });
    }

    console.log(`[Historical Fetch] Backfill complete: ${totalRecords} records, ${apiCallsUsed} API calls`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Historical data backfilled successfully`,
        records_added: totalRecords,
        api_calls_used: apiCallsUsed,
        usage: { current: totalCalls + apiCallsUsed, limit: 3000 }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Historical Fetch] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch historical data'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

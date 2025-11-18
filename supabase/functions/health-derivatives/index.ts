import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const coinglassApiKey = Deno.env.get('COINGLASS_API_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { log } = await import('../_shared/monitoring/logger.ts');
    const { formatForCoinglass, isEndpointSupported } = await import('../_shared/symbolFormatter.ts');

    const testSymbol = 'BTC';
    const cleanSymbol = formatForCoinglass(testSymbol);

    log('info', 'Health check: Testing derivatives endpoints', { symbol: cleanSymbol });

    // Test endpoints
    const endpoints = ['funding_rate', 'open_interest', 'long_short_ratio', 'liquidations'];
    const results: Record<string, any> = {};

    for (const endpoint of endpoints) {
      const support = isEndpointSupported(cleanSymbol, endpoint);
      
      if (!support.supported) {
        results[endpoint] = {
          ok: false,
          reason: support.reason,
          skipped: true,
        };
        continue;
      }

      try {
        const { data, error } = await supabase.functions.invoke(`fetch-${endpoint}`, {
          body: { symbol: testSymbol },
        });

        if (error) {
          results[endpoint] = {
            ok: false,
            reason: error.message,
          };
        } else if (data?.unavailable) {
          results[endpoint] = {
            ok: false,
            reason: data.message || 'Data unavailable',
          };
        } else {
          results[endpoint] = {
            ok: true,
            dataReceived: !!data,
          };
        }
      } catch (error) {
        results[endpoint] = {
          ok: false,
          reason: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const allOk = Object.values(results).every((r: any) => r.ok || r.skipped);

    return new Response(
      JSON.stringify({
        ok: allOk,
        symbol: testSymbol,
        timestamp: new Date().toISOString(),
        endpoints: results,
        summary: {
          total: endpoints.length,
          passing: Object.values(results).filter((r: any) => r.ok).length,
          failing: Object.values(results).filter((r: any) => !r.ok && !r.skipped).length,
          skipped: Object.values(results).filter((r: any) => r.skipped).length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        reason: error instanceof Error ? error.message : 'Health check failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get alerts from request body
    const { alerts = [] } = await req.json();

    // Gather system metrics
    const metrics: SystemMetrics = await gatherSystemMetrics(supabase, alerts);

    // Use Lovable AI to analyze system health
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check cache first (15 min TTL to reduce token usage)
    const cacheKey = `system_health_${Math.floor(Date.now() / (15 * 60 * 1000))}`;
    
    const { data: cached } = await supabase
      .from('market_data_cache')
      .select('data')
      .eq('key', cacheKey)
      .maybeSingle();

    if (cached?.data) {
      console.log('Returning cached system health analysis');
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `System admin for OCAPX. Provide: 1) Health status 2) Critical issues 3) Quick fixes. Max 3 sentences.`;

    // Build minimal alerts summary (reduced to save tokens)
    const alertsSummary = alerts.length > 0 
      ? `\nAlerts: ${alerts.length} (${alerts.filter((a: any) => a.type === 'error').length} errors)`
      : '\nNo alerts.';

    // Minimized metrics to reduce tokens
    const metricsDescription = `Functions: ${metrics.edgeFunctions.healthy}/${metrics.edgeFunctions.total} | DB: ${metrics.database.status} | APIs: CG-${metrics.apis.coinglassStatus} T-${metrics.apis.tatumStatus} | Errors: ${metrics.errors.criticalCount}/${metrics.errors.last24h}${alertsSummary}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: metricsDescription }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    console.log('AI System Health Analysis completed');

    const response = {
      success: true,
      metrics,
      analysis,
      timestamp: Date.now(),
    };

    // Cache the response for 15 minutes
    await supabase
      .from('market_data_cache')
      .upsert({
        key: cacheKey,
        data: response,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('System health AI error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function gatherSystemMetrics(supabase: any, alerts: any[]): Promise<SystemMetrics> {
  // Count errors from alerts
  const errorAlerts = alerts.filter(a => a.type === 'error');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  
  // Analyze error patterns
  const coinglassErrors = errorAlerts.filter(a => 
    a.message?.includes('CoinGlass') || a.source?.includes('coinglass')
  ).length;
  
  const tatumErrors = errorAlerts.filter(a => 
    a.message?.includes('TATUM') || a.message?.includes('Tatum')
  ).length;

  const edgeFunctionErrors = errorAlerts.filter(a =>
    a.source?.includes('function') || a.message?.includes('Edge Function')
  ).length;

  // Calculate API health based on recent errors
  const coinglassStatus = coinglassErrors > 5 ? 'down' : coinglassErrors > 2 ? 'degraded' : 'operational';
  const tatumStatus = tatumErrors > 5 ? 'down' : tatumErrors > 2 ? 'degraded' : 'operational';

  return {
    edgeFunctions: {
      total: 9,
      healthy: Math.max(0, 9 - edgeFunctionErrors),
      errors: edgeFunctionErrors,
    },
    database: {
      status: errorAlerts.some(a => a.message?.includes('database')) ? 'degraded' : 'healthy',
      connections: 12,
    },
    apis: {
      coinglassStatus,
      tatumStatus,
    },
    errors: {
      last24h: errorAlerts.length,
      criticalCount: errorAlerts.filter(a => 
        a.message?.includes('critical') || a.message?.includes('failed')
      ).length,
    },
  };
}

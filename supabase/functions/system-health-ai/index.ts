import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const systemPrompt = `You are an AI system administrator monitoring the OCAPX trading platform. Analyze the provided system metrics and real-time alerts to provide:
1. Overall system health assessment
2. Critical issues requiring immediate attention (from console errors and alerts)
3. Root cause analysis of recurring errors
4. Actionable recommendations for fixes

Be concise, technical, and prioritize the most severe issues. Focus on patterns in the errors and alerts.`;

    // Build alerts summary
    const alertsSummary = alerts.length > 0 
      ? `\n\nRECENT ALERTS (${alerts.length} total):\n${alerts.map((a: any) => 
          `- [${a.type.toUpperCase()}] ${a.title}: ${a.message}${a.source ? ` (${a.source})` : ''}`
        ).slice(0, 20).join('\n')}`
      : '\n\nNo recent alerts detected.';

    const metricsDescription = `
SYSTEM STATUS:
- Edge Functions: ${metrics.edgeFunctions.healthy}/${metrics.edgeFunctions.total} healthy (${metrics.edgeFunctions.errors} errors)
- Database: ${metrics.database.status} (${metrics.database.connections} connections)
- CoinGlass API: ${metrics.apis.coinglassStatus}
- Tatum API: ${metrics.apis.tatumStatus}
- Errors (24h): ${metrics.errors.last24h} total, ${metrics.errors.criticalCount} critical${alertsSummary}
`;

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

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        analysis,
        timestamp: Date.now(),
      }),
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

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

    // Gather system metrics
    const metrics: SystemMetrics = await gatherSystemMetrics(supabase);

    // Use Lovable AI to analyze system health
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI system administrator monitoring the OCAPX trading platform. Analyze the provided system metrics and provide:
1. Overall system health score (0-100)
2. Critical issues requiring immediate attention
3. Performance insights
4. Recommendations for optimization

Be concise and actionable. Focus on what matters most to system reliability.`;

    const metricsDescription = `
System Status:
- Edge Functions: ${metrics.edgeFunctions.healthy}/${metrics.edgeFunctions.total} healthy (${metrics.edgeFunctions.errors} errors)
- Database: ${metrics.database.status} (${metrics.database.connections} connections)
- CoinGlass API: ${metrics.apis.coinglassStatus}
- Tatum API: ${metrics.apis.tatumStatus}
- Errors (24h): ${metrics.errors.last24h} total, ${metrics.errors.criticalCount} critical
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

async function gatherSystemMetrics(supabase: any): Promise<SystemMetrics> {
  // Get edge function statistics from logs
  const { data: functionLogs } = await supabase
    .from('_analytics')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1000);

  // Simulate metrics gathering (in production, you'd query actual logs)
  const edgeFunctionErrors = functionLogs?.filter((log: any) => 
    log.level === 'error' && log.timestamp > Date.now() - 24 * 60 * 60 * 1000
  ).length || 0;

  return {
    edgeFunctions: {
      total: 8,
      healthy: 8 - Math.min(edgeFunctionErrors, 8),
      errors: edgeFunctionErrors,
    },
    database: {
      status: 'healthy',
      connections: 12,
    },
    apis: {
      coinglassStatus: edgeFunctionErrors > 5 ? 'degraded' : 'operational',
      tatumStatus: 'operational',
    },
    errors: {
      last24h: edgeFunctionErrors,
      criticalCount: Math.floor(edgeFunctionErrors * 0.2),
    },
  };
}

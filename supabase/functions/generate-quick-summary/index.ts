import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

function getCacheKey(query: string, symbol: string): string {
  const normalized = `quick-${query.trim().toLowerCase()}-${symbol.toUpperCase()}`;
  return btoa(normalized);
}

function generateQuickFallback(query: string, symbol: string) {
  const queryLower = query.toLowerCase();
  let signal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
  let sentiment = 'NEUTRAL';
  
  if (queryLower.includes('bull') || queryLower.includes('buy') || queryLower.includes('long')) {
    signal = 'LONG';
    sentiment = 'MILD GREED';
  } else if (queryLower.includes('bear') || queryLower.includes('sell') || queryLower.includes('short')) {
    signal = 'SHORT';
    sentiment = 'MILD FEAR';
  }
  
  return {
    summary: `Quick analysis for ${symbol} indicates a ${signal.toLowerCase()} market bias with ${sentiment.toLowerCase()} sentiment. Detailed Pine Script is being generated.`,
    signal,
    sentiment,
    confidence: '70%'
  };
}

async function generateQuickSummary(query: string, symbol: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const systemPrompt = `You are a rapid trading analyst for OCAPX. Provide ONLY quick analysis without Pine Script code.

Provide:
1. Brief 1-2 sentence market summary
2. Signal: LONG, SHORT, or NEUTRAL
3. Sentiment: one of [EXTREME FEAR, HIGH FEAR, FEAR, MILD FEAR, NEUTRAL, MILD GREED, GREED, HIGH GREED, EXTREME GREED, EUPHORIA, MAX EUPHORIA]
4. Confidence: percentage (e.g., 85%)

Be fast and concise.`;

  const userPrompt = `Quick analysis for ${symbol}: ${query}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "quick_analysis",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                signal: { type: "string", enum: ["LONG", "SHORT", "NEUTRAL"] },
                sentiment: { type: "string", enum: ["EXTREME FEAR", "HIGH FEAR", "FEAR", "MILD FEAR", "NEUTRAL", "MILD GREED", "GREED", "HIGH GREED", "EXTREME GREED", "EUPHORIA", "MAX EUPHORIA"] },
                confidence: { type: "string", pattern: "^[0-9]{1,3}%$" }
              },
              required: ["summary", "signal", "sentiment", "confidence"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "quick_analysis" } }
      }),
    });

    if (!response.ok) {
      console.error('AI error:', response.status);
      throw new Error('AI_ERROR');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
    
    return result;
  } catch (error) {
    console.log('Quick summary fallback activated');
    return generateQuickFallback(query, symbol);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { query, symbol } = await req.json();
    
    if (!query || !symbol) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const cacheKey = getCacheKey(query, symbol);
    
    const { data: cached } = await supabase
      .from('analysis_cache')
      .select('result')
      .eq('query_hash', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
      
    if (cached) {
      console.log('✅ Quick summary cache hit');
      return new Response(JSON.stringify(cached.result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating quick summary for:', symbol);
    const result = await generateQuickSummary(query, symbol);
    
    await supabase.from('analysis_cache').insert({
      query_hash: cacheKey,
      symbol: symbol,
      result: result,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quick-summary:', error);
    const { query, symbol } = await req.json();
    const fallback = generateQuickFallback(query, symbol);
    
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

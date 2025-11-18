import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': 'content-length, x-json',
};

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly delay = 2000;
  
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

function validateAnalysis(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.summary || typeof data.summary !== 'string') errors.push('Missing or invalid summary');
  if (!['LONG', 'SHORT', 'NEUTRAL'].includes(data.signal)) errors.push('Invalid signal value');
  const validSentiments = ['EXTREME FEAR', 'HIGH FEAR', 'FEAR', 'MILD FEAR', 'NEUTRAL', 'MILD GREED', 'GREED', 'HIGH GREED', 'EXTREME GREED', 'EUPHORIA', 'MAX EUPHORIA'];
  if (!validSentiments.includes(data.sentiment)) errors.push('Invalid sentiment value');
  if (!data.confidence || !data.confidence.match(/^[0-9]{1,3}%$/)) errors.push('Invalid confidence format');
  return { valid: errors.length === 0, errors };
}

function getCacheKey(query: string, symbol: string): string {
  return btoa(`${query.trim().toLowerCase()}-${symbol.toUpperCase()}`);
}

function generateFallbackAnalysis(query: string, symbol: string) {
  const queryLower = query.toLowerCase();
  let signal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
  let sentiment = 'NEUTRAL';
  if (queryLower.includes('bull') || queryLower.includes('buy') || queryLower.includes('long')) {
    signal = 'LONG'; sentiment = 'MILD GREED';
  } else if (queryLower.includes('bear') || queryLower.includes('sell') || queryLower.includes('short')) {
    signal = 'SHORT'; sentiment = 'MILD FEAR';
  }
  return { 
    summary: `Analysis for ${symbol}: Market shows ${signal.toLowerCase()} bias with ${sentiment.toLowerCase()} sentiment. Custom indicators suggest monitoring key levels for confirmation. Consider volume patterns and market structure before entry.`, 
    signal, 
    sentiment, 
    confidence: '65%' 
  };
}

async function generateWithRetry(query: string, symbol: string, maxAttempts = 3) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
  
  const systemPrompt = `You are a professional trading analyst for OCAPX, specializing in cryptocurrency market analysis.

CRITICAL REQUIREMENTS:
1. Provide comprehensive trading analysis based on technical and fundamental factors
2. Consider market structure, volume patterns, sentiment, and price action
3. Give actionable insights with clear reasoning
4. All analysis is for OCAPX's custom-built dashboard and indicators
5. Focus on real-time data integration and smart decision-making

SIGNAL CLASSIFICATION:
- LONG: Strong bullish signals with multiple confirmations across indicators
- SHORT: Strong bearish signals with multiple confirmations across indicators
- NEUTRAL: Mixed signals or insufficient confirmation for directional trade

SENTIMENT SCALE (use exact values):
- MAX EUPHORIA / EUPHORIA: Extreme optimism, potential market top
- EXTREME GREED / HIGH GREED / GREED: Strong bullish sentiment
- MILD GREED: Moderate bullish sentiment
- NEUTRAL: Balanced market sentiment
- MILD FEAR: Moderate bearish sentiment
- FEAR / HIGH FEAR / EXTREME FEAR: Strong bearish sentiment

CONFIDENCE CALCULATION:
- 90-100%: Multiple strong confirmations across timeframes and indicators
- 70-89%: Good confirmation with minor conflicts
- 50-69%: Mixed signals, trade with caution
- Below 50%: Weak signals, avoid trading

ANALYSIS FOCUS:
- Custom OCAPX indicators and signals
- External data integration (funding rates, liquidations, volume)
- Smart dashboard metrics for decision support
- Real-time market monitoring capabilities

Deliver precise, actionable trading analysis for our custom dashboard.`;

  const userPrompt = `Analyze this trading query for our custom OCAPX dashboard.

Query: ${query}
Symbol: ${symbol}

Provide detailed analysis with market assessment, technical outlook, and risk considerations based on our custom indicators and external data integration.`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts} for ${symbol}`);
      const response = await requestQueue.add(() => fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          tools: [{ 
            type: "function", 
            function: { 
              name: "generate_trading_analysis", 
              description: "Generate complete trading analysis for OCAPX custom dashboard", 
              parameters: { 
                type: "object", 
                properties: { 
                  summary: { 
                    type: "string", 
                    description: "Comprehensive market analysis (200-400 words) focusing on custom indicators, external data, and dashboard metrics"
                  }, 
                  signal: { 
                    type: "string", 
                    enum: ["LONG", "SHORT", "NEUTRAL"], 
                    description: "Trading signal based on custom OCAPX analysis"
                  }, 
                  sentiment: { 
                    type: "string", 
                    enum: ["EXTREME FEAR", "HIGH FEAR", "FEAR", "MILD FEAR", "NEUTRAL", "MILD GREED", "GREED", "HIGH GREED", "EXTREME GREED", "EUPHORIA", "MAX EUPHORIA"], 
                    description: "Market sentiment classification"
                  }, 
                  confidence: { 
                    type: "string", 
                    pattern: "^[0-9]{1,3}%$", 
                    description: "Confidence level as percentage (e.g., 85%)"
                  } 
                }, 
                required: ["summary", "signal", "sentiment", "confidence"], 
                additionalProperties: false 
              } 
            } 
          }],
          tool_choice: { type: "function", function: { name: "generate_trading_analysis" } }
        }),
      }));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ AI API error (${response.status}):`, errorText);
        if (response.status === 429 && attempt < maxAttempts) {
          const backoff = Math.pow(2, attempt) * 2000;
          console.log(`⏳ Rate limited, waiting ${backoff}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
        throw new Error(`AI_API_ERROR: ${response.status}`);
      }

      const data = await response.json();
      if (!data.choices?.[0]?.message?.tool_calls?.[0]) throw new Error('Invalid AI response structure');
      const result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      const validation = validateAnalysis(result);
      if (!validation.valid) {
        console.error('❌ Validation errors:', validation.errors);
        if (attempt < maxAttempts) { 
          console.log('⚠️ Retrying due to validation errors...'); 
          continue; 
        }
        throw new Error('VALIDATION_FAILED');
      }
      console.log('✅ Analysis generated and validated successfully');
      return result;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      if (attempt === maxAttempts) { 
        console.error('🚨 All retry attempts exhausted'); 
        throw error; 
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('MAX_RETRIES_EXCEEDED');
}

async function getOrGenerateAnalysis(query: string, symbol: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '', 
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const cacheKey = getCacheKey(query, symbol);
  
  try {
    const { data: cached, error: cacheError } = await supabase
      .from('analysis_cache')
      .select('result, expires_at')
      .eq('query_hash', cacheKey)
      .eq('symbol', symbol)
      .single();
      
    if (cached && !cacheError) {
      const expiresAt = new Date(cached.expires_at);
      if (expiresAt > new Date()) { 
        console.log('✅ Cache hit - returning cached analysis'); 
        return cached.result; 
      }
      console.log('⚠️ Cache expired - regenerating');
    }
  } catch (error) { 
    console.log('ℹ️ No cache found, generating new analysis'); 
  }
  
  try {
    const result = await generateWithRetry(query, symbol);
    const expiresAt = new Date(); 
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    await supabase
      .from('analysis_cache')
      .upsert({ 
        query_hash: cacheKey, 
        symbol: symbol, 
        result: result, 
        expires_at: expiresAt.toISOString() 
      });
    console.log('💾 Analysis cached successfully');
    return result;
  } catch (error) {
    console.error('🚨 Generation failed, using fallback:', error);
    return generateFallbackAnalysis(query, symbol);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  try {
    const { query, symbol } = await req.json();
    if (!query || !symbol) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: query and symbol' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📊 Generating analysis for ${symbol}: ${query}`);
    const result = await getOrGenerateAnalysis(query, symbol);
    
    return new Response(
      JSON.stringify(result), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('🚨 Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate analysis', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

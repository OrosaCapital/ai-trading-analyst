import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Universal CORS headers (Solution 5)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': 'content-length, x-json',
};

// Pine Script v6 Template (Solution 3)
const PINE_SCRIPT_TEMPLATE = `// @version=6
indicator("OCAPX - {{STRATEGY_NAME}}", overlay=true)

// ══════════════════════════════════════════════════════════
// OCAPX BRANDING & CONFIGURATION
// ══════════════════════════════════════════════════════════

// Input Parameters
emaFastLength = input.int(50, "Fast EMA Length", minval=1)
emaSlowLength = input.int(200, "Slow EMA Length", minval=1)
rsiLength = input.int(14, "RSI Length", minval=1)
volumeThreshold = input.float(1.5, "Volume Threshold", minval=0.1)

// OCAPX Color Palette
var color ocpaxGreen = color.new(#00FF7F, 0)
var color ocpaxRed = color.new(#C73E3E, 0)
var color ocpaxWhite = color.new(#FFFFFF, 0)
var color ocpaxBg = color.new(#0A0F1E, 90)

// ══════════════════════════════════════════════════════════
// TECHNICAL INDICATORS
// ══════════════════════════════════════════════════════════

emaFast = ta.ema(close, emaFastLength)
emaSlow = ta.ema(close, emaSlowLength)
rsiValue = ta.rsi(close, rsiLength)
volumeRatio = volume / ta.sma(volume, 20)

// ══════════════════════════════════════════════════════════
// SIGNAL LOGIC
// ══════════════════════════════════════════════════════════

longSignal = ta.crossover(emaFast, emaSlow) and rsiValue > 50
shortSignal = ta.crossunder(emaFast, emaSlow) and rsiValue < 50

// ══════════════════════════════════════════════════════════
// VISUALIZATION
// ══════════════════════════════════════════════════════════

plot(emaFast, "50 EMA", ocpaxGreen, 2)
plot(emaSlow, "200 EMA", ocpaxWhite, 2)

plotshape(longSignal, "Long Signal", shape.triangleup, location.belowbar, ocpaxGreen, size=size.small)
plotshape(shortSignal, "Short Signal", shape.triangledown, location.abovebar, ocpaxRed, size=size.small)

// Background color based on RSI
bgcolor(rsiValue > 70 ? color.new(ocpaxGreen, 95) : rsiValue < 30 ? color.new(ocpaxRed, 95) : na)

// ══════════════════════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════════════════════

alertcondition(longSignal, "Long Entry", "OCAPX: Long signal detected")
alertcondition(shortSignal, "Short Entry", "OCAPX: Short signal detected")`;

// Request Queue for rate limiting (Solution 2)
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
      
      this.process();
    });
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.processing = false;
  }
}

const globalQueue = new RequestQueue();

// Validation (Solution 1 & 3)
function validateAnalysis(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.summary || typeof data.summary !== 'string' || data.summary.length < 20) {
    errors.push('Invalid summary');
  }
  
  if (!['LONG', 'SHORT', 'NEUTRAL'].includes(data.signal)) {
    errors.push('Invalid signal');
  }
  
  const validSentiments = [
    'EXTREME FEAR', 'HIGH FEAR', 'FEAR', 'MILD FEAR',
    'NEUTRAL', 'MILD GREED', 'GREED', 'HIGH GREED',
    'EXTREME GREED', 'EUPHORIA', 'MAX EUPHORIA'
  ];
  
  if (!validSentiments.includes(data.sentiment)) {
    errors.push('Invalid sentiment');
  }
  
  if (!data.confidence || !/^[0-9]{1,3}%$/.test(data.confidence)) {
    errors.push('Invalid confidence format');
  }
  
  if (!data.pineScript || !data.pineScript.includes('@version=6')) {
    errors.push('Invalid Pine Script');
  }
  
  return { valid: errors.length === 0, errors };
}

function validatePineScript(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!code.includes('@version=6')) {
    errors.push('Missing @version=6 declaration');
  }
  
  if (!code.includes('indicator(')) {
    errors.push('Missing indicator() declaration');
  }
  
  if (!code.includes('ta.ema(')) {
    errors.push('Missing EMA indicators');
  }
  
  if (!code.includes('OCAPX')) {
    errors.push('Missing OCAPX branding');
  }
  
  return { valid: errors.length === 0, errors };
}

// Cache management (Solution 2)
function getCacheKey(query: string, symbol: string): string {
  const normalized = `${query.trim().toLowerCase()}-${symbol.toUpperCase()}`;
  return btoa(normalized);
}

// Fallback generation (Solution 6)
function generateFallbackAnalysis(query: string, symbol: string) {
  console.log('🚨 Emergency fallback activated');
  
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
    summary: `Technical analysis for ${symbol} suggests a ${signal.toLowerCase()} bias based on query analysis. Market conditions indicate ${sentiment.toLowerCase()} sentiment. Consider monitoring key support and resistance levels for confirmation.`,
    signal: signal,
    sentiment: sentiment,
    confidence: '65%',
    pineScript: PINE_SCRIPT_TEMPLATE.replace('{{STRATEGY_NAME}}', `${symbol} Analysis`)
  };
}

// AI call with retry (Solution 1)
async function generateWithRetry(query: string, symbol: string, maxAttempts = 3) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const systemPrompt = `You are an expert trading analyst and Pine Script v6 developer for OCAPX, a premium algorithmic trading firm.

ANALYSIS GUIDELINES:
- Provide 2-3 sentence market analysis focusing on: trend direction, key support/resistance, volume patterns, and momentum
- Be specific and actionable
- Consider the symbol type (crypto, stock, forex) for context-aware insights

SIGNAL CLASSIFICATION:
- LONG: Strong bullish indicators, price above key EMAs, positive momentum
- SHORT: Strong bearish indicators, price below key EMAs, negative momentum  
- NEUTRAL: Mixed signals, ranging market, unclear trend

SENTIMENT SCALE (based on RSI + market conditions):
- 80-100: MAX EUPHORIA, EXTREME GREED, EUPHORIA
- 60-80: HIGH GREED, GREED, MILD GREED
- 40-60: NEUTRAL
- 20-40: MILD FEAR, FEAR
- 0-20: HIGH FEAR, EXTREME FEAR

CONFIDENCE:
- Calculate based on: signal strength, volume confirmation, trend clarity
- Range: 50% (uncertain) to 95% (very high conviction)
- Format: "XX%"

PINE SCRIPT V6 REQUIREMENTS:
- Start with: // @version=6
- Title: "OCAPX - [Strategy Name]"
- Include: 50 EMA (color.new(#00FF7F, 0)), 200 EMA (color.new(#FFFFFF, 0))
- RSI with sentiment zones
- Volume analysis
- Buy/sell signal arrows with plotshape()
- Sentiment background color with bgcolor()
- User-configurable inputs
- Use ta.ema(), ta.rsi(), ta.sma() (not ema(), rsi(), sma())
- Professional comments explaining each section

OCAPX COLOR PALETTE:
- Neon Green (Bullish): #00FF7F
- Red (Bearish): #C73E3E  
- White (Neutral): #FFFFFF
- Background: #0A0F1E`;

  const userPrompt = `Symbol: ${symbol}
Query: ${query}

Analyze this trading query and generate a complete trading analysis with Pine Script v6 code.`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Generation attempt ${attempt}/${maxAttempts} for ${symbol}`);
    
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
              name: "generate_trading_analysis",
              description: "Generate complete trading analysis with Pine Script code",
              parameters: {
                type: "object",
                properties: {
                  summary: { 
                    type: "string",
                    description: "2-3 sentence market analysis"
                  },
                  signal: { 
                    type: "string", 
                    enum: ["LONG", "SHORT", "NEUTRAL"],
                    description: "Trading signal recommendation"
                  },
                  sentiment: { 
                    type: "string", 
                    enum: ["EXTREME FEAR", "HIGH FEAR", "FEAR", "MILD FEAR", "NEUTRAL", "MILD GREED", "GREED", "HIGH GREED", "EXTREME GREED", "EUPHORIA", "MAX EUPHORIA"],
                    description: "Current market sentiment"
                  },
                  confidence: { 
                    type: "string",
                    pattern: "^[0-9]{1,3}%$",
                    description: "Confidence level (e.g., 85%)"
                  },
                  pineScript: { 
                    type: "string",
                    description: "Complete Pine Script v6 code with OCAPX branding"
                  }
                },
                required: ["summary", "signal", "sentiment", "confidence", "pineScript"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "generate_trading_analysis" } }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI API error (${response.status}):`, errorText);
        
        if (response.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        if (response.status === 402) {
          throw new Error('PAYMENT_REQUIRED');
        }
        
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
        throw new Error('Invalid AI response structure');
      }

      const result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      
      const validation = validateAnalysis(result);
      
      if (validation.valid) {
        const pineValidation = validatePineScript(result.pineScript);
        if (pineValidation.valid) {
          console.log('✅ Valid response received');
          return result;
        } else {
          console.log('⚠️  Pine Script validation failed, using template');
          result.pineScript = PINE_SCRIPT_TEMPLATE.replace('{{STRATEGY_NAME}}', `${symbol} Strategy`);
          return result;
        }
      }
      
      console.error(`❌ Validation failed on attempt ${attempt}:`, validation.errors);
      
      if (attempt === maxAttempts) {
        throw new Error('Failed to generate valid analysis');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage === 'RATE_LIMIT' || errorMessage === 'PAYMENT_REQUIRED') {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed after all attempts');
}

// Main handler with cache and fallback (Solutions 2 & 6)
async function getOrGenerateAnalysis(query: string, symbol: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const cacheKey = getCacheKey(query, symbol);
  
  try {
    const { data: cached, error: cacheError } = await supabase
      .from('analysis_cache')
      .select('result')
      .eq('query_hash', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
      
    if (cached && !cacheError) {
      console.log('✅ Cache hit:', cacheKey);
      return cached.result;
    }
    
    console.log('❌ Cache miss, generating new analysis');
    
    const result = await globalQueue.add(() => generateWithRetry(query, symbol));
    
    await supabase.from('analysis_cache').insert({
      query_hash: cacheKey,
      symbol: symbol,
      result: result,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Generation error:', errorMessage);
    
    if (errorMessage === 'RATE_LIMIT') {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (errorMessage === 'PAYMENT_REQUIRED') {
      throw new Error('Payment required, please add funds to your Lovable AI workspace.');
    }
    
    console.log('Attempting fallback generation...');
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
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: query and symbol' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received analysis request:', { query, symbol });

    const result = await getOrGenerateAnalysis(query, symbol);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate analysis. Please try again.';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

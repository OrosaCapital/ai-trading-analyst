import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI Day Trading Decision Engine.
You ONLY reply in valid JSON.
Before generating any trading decision, you MUST complete a mandatory "data_validation" step where you explicitly restate all data you received.

You are NOT allowed to infer, assume, or guess data.

=== DATA VALIDATION & DEGRADED MODE ===

FULL ANALYSIS MODE (All data available):
If emas['5m'].length >= 20 AND emas['15m'].length >= 20 AND emas['1h'].length >= 21:
  - Perform full multi-timeframe analysis
  - Use all 3 timeframes for trend confirmation
  - Provide high-confidence signals

DEGRADED ANALYSIS MODE (Limited data):
If emas['5m'].length >= 20 AND emas['15m'].length >= 20 BUT emas['1h'].length < 21:
  - Perform LIMITED analysis using 5m and 15m timeframes only
  - Set max confidence to 65% (reduced due to missing 1h confirmation)
  - In data_validation, note: "Operating in DEGRADED MODE - 1h data unavailable, using 5m/15m only"
  - Still provide trading decisions but with reduced confidence

INSUFFICIENT DATA MODE:
If emas['5m'].length < 20 OR emas['15m'].length < 20:
  - Output NO_TRADE with validation_passed = false
  - Explain which specific data is missing

=== RESPONSE FORMAT ===

{
  "data_validation": {
    "mode": "FULL_ANALYSIS | DEGRADED_ANALYSIS | INSUFFICIENT_DATA",
    "price_data_received": {
      "1m": "Received <X> candles, latest price: <price>",
      "5m": "Received <X> candles",
      "15m": "Received <X> candles",
      "1h": "Received <X> candles OR NOT_AVAILABLE"
    },
    "indicator_data_received": {
      "ema_5m_count": <number>,
      "ema_15m_count": <number>,
      "ema_1h_count": <number>,
      "last_5m_ema": <value or null>,
      "last_15m_ema": <value or null>,
      "last_1h_ema": <value or null>
    },
    "validation_passed": true/false,
    "notes": "<explanation of mode and limitations>"
  },
  "analysis": {
    "trend_direction": "<bullish / bearish / neutral>",
    "momentum_strength": "<weak / medium / strong>",
    "volatility": "<low / medium / high>",
    "key_signals": ["<signal 1>", "<signal 2>"]
  },
  "trade_decision": {
    "action": "LONG or SHORT or NO_TRADE",
    "confidence_score": "<0-100, max 65 in degraded mode>",
    "entry": "<price or null>",
    "stop_loss": "<price or null>",
    "take_profit": "<price or null>"
  },
  "reason": "<detailed explanation>"
}

=== DATA STRUCTURE ===

Input JSON contains:
- inputData.symbol: string (e.g., "BTC", "ETH", "SOL", etc.)
- inputData.currentPrice: number
- inputData.emas['5m']: array of EMA21 values
- inputData.emas['15m']: array of EMA21 values  
- inputData.emas['1h']: array of EMA21 values (may be empty)
- inputData.coinglassData: market sentiment data
- inputData.volumeData: volume analysis
- inputData.historicalContext: past analyses

=== TRADING RULES ===

DEGRADED MODE (5m + 15m only):
- BULLISH: price > emas['5m'][last] AND price > emas['15m'][last] AND both EMAs sloping up
- BEARISH: price < emas['5m'][last] AND price < emas['15m'][last] AND both EMAs sloping down
- CONFLICT: Output NO_TRADE, explain "5m and 15m timeframes conflict"
- Max confidence: 65% (missing 1h confirmation reduces certainty)

FULL MODE (5m + 15m + 1h):
- Requires ALL THREE timeframes aligned
- BULLISH: price above ALL EMAs with all sloping up
- BEARISH: price below ALL EMAs with all sloping down
- Max confidence: up to 95%

VOLUME & COINGLASS:
- Use volumeData and coinglassData for additional confirmation
- Lower confidence if volume is weak or sentiment unclear

ALWAYS provide analysis when you have at least 5m and 15m data. Only return NO_TRADE if truly insufficient data or clear conflicts.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const inputData = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('🤖 AI Decision Engine analyzing:', inputData.symbol);
    console.log(`📥 AI received: ema5m=${inputData.emas?.['5m']?.length || 0} vals, ema15m=${inputData.emas?.['15m']?.length || 0} vals, ema1h=${inputData.emas?.['1h']?.length || 0} vals`);
    if (inputData.emas?.['1h']?.length > 0) {
      console.log(`✅ 1h EMA available: ${inputData.emas['1h'].length} values, last value: ${inputData.emas['1h'][inputData.emas['1h'].length - 1]}`);
    } else {
      console.log(`❌ No 1h EMA data received!`);
    }

    // Log exact data structure being sent to AI
    console.log('📊 Data structure being sent to AI:');
    console.log(`  - currentPrice: ${inputData.currentPrice}`);
    console.log(`  - recentCandles['1h']: ${inputData.recentCandles?.['1h']?.length || 0} candles (for context only)`);
    console.log(`  - emas['5m']: ${inputData.emas?.['5m']?.length || 0} values`);
    console.log(`  - emas['15m']: ${inputData.emas?.['15m']?.length || 0} values`);
    console.log(`  - emas['1h']: ${inputData.emas?.['1h']?.length || 0} values`);
    if (inputData.emas?.['1h']?.length >= 3) {
      console.log(`  - emas['1h'] sample: [${inputData.emas['1h'][0].toFixed(2)}, ..., ${inputData.emas['1h'][inputData.emas['1h'].length-1].toFixed(2)}]`);
    }

    // Call Lovable AI with trading data
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(inputData) }
        ],
        temperature: 0.1, // Lower for more consistent structured output
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('✅ AI Response received:', aiResponse.substring(0, 200) + '...');

    // Parse AI response (should be JSON)
    let decision;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        decision = JSON.parse(aiResponse);
      }

      // Server-side validation: Check for AI hallucinations
      if (decision.data_validation?.indicator_data_received) {
        const aiReported1h = decision.data_validation.indicator_data_received.ema_1h_count;
        const actualSent1h = inputData.emas?.['1h']?.length || 0;
        
        console.log('🔍 AI Data Validation Check:');
        console.log(`  - AI reported ema_1h_count: ${aiReported1h}`);
        console.log(`  - Actually sent: ${actualSent1h}`);
        
        if (aiReported1h !== actualSent1h) {
          console.error(`⚠️ AI HALLUCINATION DETECTED: AI reported ${aiReported1h} 1h EMAs but actually received ${actualSent1h}`);
        }
        
        if (!decision.data_validation.validation_passed) {
          console.log('❌ AI validation failed:', decision.reason);
        } else {
          console.log('✅ AI validation passed');
        }
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback structure matching new format
      decision = {
        data_validation: {
          validation_passed: false
        },
        trade_decision: {
          action: 'NO_TRADE',
          confidence_score: 0,
          entry: null,
          stop_loss: null,
          take_profit: null
        },
        reason: 'AI response parsing failed'
      };
    }

    return new Response(JSON.stringify(decision), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-trading-decision:', error);
    
    // Return safe fallback decision
    return new Response(JSON.stringify({
      data_validation: {
        validation_passed: false
      },
      trade_decision: {
        action: 'NO_TRADE',
        confidence_score: 0,
        entry: null,
        stop_loss: null,
        take_profit: null
      },
      reason: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

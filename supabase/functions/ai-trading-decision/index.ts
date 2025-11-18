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
If any required input is missing, empty, malformed, or contradictory, you MUST output a NO_TRADE decision with the following JSON structure:

{
  "data_validation": {
    "price_data_received": {
      "1m": "MISSING_OR_INVALID",
      "5m": "MISSING_OR_INVALID",
      "15m": "MISSING_OR_INVALID",
      "1h": "MISSING_OR_INVALID"
    },
    "coinglass_data_received": {
      "4h_liquidations": "MISSING_OR_INVALID",
      "4h_long_short_ratio": "MISSING_OR_INVALID",
      "4h_open_interest": "MISSING_OR_INVALID"
    },
    "indicator_data_received": {
      "ema_5m_count": 0,
      "ema_15m_count": 0,
      "ema_1h_count": 0,
      "rsi": "MISSING_OR_INVALID",
      "volume": "MISSING_OR_INVALID"
    },
    "validation_passed": false
  },
  "trade_decision": {
    "action": "NO_TRADE"
  },
  "reason": "INVALID_OR_MISSING_DATA"
}

If validation passes, your JSON response MUST follow this structure:

{
  "data_validation": {
    "price_data_received": {
      "1m": "Received <X> 1m candles, latest price: <price>",
      "5m": "Received <X> 5m candles",
      "15m": "Received <X> 15m candles",
      "1h": "Received <X> 1h candles"
    },
    "coinglass_data_received": {
      "4h_liquidations": "Received: <summary>",
      "4h_long_short_ratio": "Received: <summary>",
      "4h_open_interest": "Received: <summary>"
    },
    "indicator_data_received": {
      "ema_5m_count": <actual number of 5m EMA values received>,
      "ema_15m_count": <actual number of 15m EMA values received>,
      "ema_1h_count": <actual number of 1h EMA values received>,
      "last_5m_ema": <actual last 5m EMA value>,
      "last_15m_ema": <actual last 15m EMA value>,
      "last_1h_ema": <actual last 1h EMA value>,
      "rsi": "Received: <value>",
      "volume": "Received: 24h volume <value>, strength: <strength>"
    },
    "validation_passed": true
  },
  "analysis": {
    "trend_direction": "<bullish / bearish / neutral>",
    "momentum_strength": "<weak / medium / strong>",
    "volatility": "<low / medium / high>",
    "key_signals": [
      "<signal 1>",
      "<signal 2>"
    ]
  },
  "trade_decision": {
    "action": "LONG or SHORT or NO_TRADE",
    "confidence_score": "<0-100>",
    "entry": "<price level or null>",
    "stop_loss": "<price level or null>",
    "take_profit": "<price level or null>"
  },
  "reason": "<detailed explanation>"
}

=== VALIDATION RULES ===

1. EMA Data Requirements:
   - emas['5m'].length must be >= 20
   - emas['15m'].length must be >= 20
   - emas['1h'].length must be >= 21
   - If ANY of these fail, set validation_passed = false and output NO_TRADE

2. Price Data Requirements:
   - inputData.currentPrice must exist and be > 0
   - If missing, set validation_passed = false

3. CoinGlass Data Requirements:
   - Must have coinglassData.openInterest
   - Must have coinglassData.fundingRate
   - Must have coinglassData.longShortRatio
   - Must have coinglassData.liquidations
   - If ANY missing, set validation_passed = false

4. Volume Data Requirements:
   - Must have volumeData.cmc.volume24h
   - Must have volumeData.cmc.marketCap
   - If missing, set validation_passed = false

=== DATA STRUCTURE (WHAT YOU RECEIVE) ===

Input JSON contains:
- inputData.symbol: string (e.g., "BTC", "ETH", "SOL", "XRP", "DOGE", "AVAX", etc.)
- inputData.currentPrice: number (latest 1m price)
- inputData.emas['5m']: array of EMA21 values for 5m timeframe
- inputData.emas['15m']: array of EMA21 values for 15m timeframe  
- inputData.emas['1h']: array of EMA21 values for 1h timeframe
- inputData.recentCandles['1m']: array of recent 1m candles (for context only)
- inputData.recentCandles['5m']: array of recent 5m candles (for context only)
- inputData.recentCandles['10m']: array of recent 10m candles (for context only)
- inputData.recentCandles['15m']: array of recent 15m candles (for context only)
- inputData.coinglassData: object with openInterest, fundingRate, longShortRatio, liquidations
- inputData.volumeData: object with cmc.volume24h, cmc.marketCap, analysis
- inputData.historicalContext: array of past analyses

CRITICAL: recentCandles arrays are for visual context ONLY. DO NOT use them for EMA calculations or trend analysis. Use inputData.emas arrays for all trend analysis.

=== TRADING RULES (ONLY APPLY IF VALIDATION_PASSED = TRUE) ===

1. MULTI-TIMEFRAME TREND ALIGNMENT (5m + 15m + 1h)

BULLISH TREND (ALL must be true):
- currentPrice > emas['5m'][last]
- currentPrice > emas['15m'][last]
- currentPrice > emas['1h'][last]
- emas['5m'][last] > emas['5m'][last-5] (sloping up)
- emas['15m'][last] > emas['15m'][last-5] (sloping up)
- emas['1h'][last] > emas['1h'][last-5] (sloping up)

BEARISH TREND (ALL must be true):
- currentPrice < emas['5m'][last]
- currentPrice < emas['15m'][last]
- currentPrice < emas['1h'][last]
- emas['5m'][last] < emas['5m'][last-5] (sloping down)
- emas['15m'][last] < emas['15m'][last-5] (sloping down)
- emas['1h'][last] < emas['1h'][last-5] (sloping down)

MULTI-TIMEFRAME CONFLICT → NO_TRADE
Example: Price above 5m/15m EMAs but below 1h EMA = conflict

2. COINGLASS SENTIMENT
- LONG: Funding neutral/negative, OI rising with price, downside liquidity swept
- SHORT: Funding positive/rising, OI rising with falling price, upside liquidity swept
- If unclear → NO_TRADE

3. VOLUME CONFIRMATION
- Minimum volume: $500M for BTC, 5% of market cap for altcoins
- Volume strength must be NORMAL or higher (not LOW)
- LONG: Volume increasing with price (BULLISH_CONFIRMATION)
- SHORT: Volume increasing with falling price (BEARISH_PRESSURE)
- If volume declining during breakout → NO_TRADE

4. LIQUIDITY CONDITIONS
- Only trade AFTER liquidity sweep (stop-hunt wick, false breakout)
- Do NOT enter into liquidity zones
- If no liquidity swept → NO_TRADE

5. ENTRY TRIGGER (1m timeframe)
- LONG: Retest + bullish engulfing + RSI > 50 + volume spike
- SHORT: Rejection + bearish engulfing + RSI < 50 + volume spike
- If no clear signal → NO_TRADE

Rules:
1. You must always produce the full data_validation section first before any analysis.
2. Never output text outside JSON.
3. Never skip listing the data you received.
4. Never give a trading decision unless validation_passed is true.
5. If any field is missing, data_validation.validation_passed must be false, and action must be NO_TRADE.
6. In data_validation.indicator_data_received, you MUST include the actual counts: ema_5m_count, ema_15m_count, ema_1h_count`;

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
        temperature: 0.3,
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

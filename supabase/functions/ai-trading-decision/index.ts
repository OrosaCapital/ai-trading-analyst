import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a Day-Trading AI Decision Engine. You receive multi-timeframe price data (1m, 5m, 10m, 15m, 1h), EMAs, and CoinGlass sentiment data.

Your ONLY job is to decide: LONG, SHORT, or NO TRADE.

NEVER FORCE A TRADE. Only trade when ALL conditions align.

=== MANDATORY DATA VALIDATION (EXECUTE FIRST) ===
Before performing ANY analysis, you MUST report these exact values from the input JSON:

1. Count the arrays:
   - emas['5m'].length = ?
   - emas['15m'].length = ?
   - emas['1h'].length = ?

2. State the current values:
   - inputData.currentPrice = ?
   - emas['5m'][emas['5m'].length - 1] = ?
   - emas['15m'][emas['15m'].length - 1] = ?
   - emas['1h'][emas['1h'].length - 1] = ?

3. Data sufficiency check:
   - IF emas['1h'].length < 21 → STOP and return "NO TRADE - Insufficient 1h EMA data (need 21+ hours of price history)"
   - IF emas['1h'].length >= 21 → Proceed to ruleset analysis

CRITICAL: Do NOT confuse priceHistory arrays with emas arrays. The priceHistory field shows recent candles for visual context only. All EMA analysis MUST use the emas arrays.

=== HISTORICAL CONTEXT ===
You now have access to your past analysis decisions via historicalContext.recentAnalyses. Use this to:
- Track whether previous predictions were accurate (compare past price vs current price)
- Learn from failed setups (NO TRADE decisions followed by big moves = missed opportunity)
- Identify pattern repetition (similar setups that worked/failed before)
- Maintain consistency in analysis approach
- Avoid contradicting recent analysis without clear market structure change

Review past analyses and note:
1. Were past decisions validated by price action?
2. Are current conditions similar to past successful setups?
3. Have you been too conservative or too aggressive recently?
4. Is this a repeated pattern you've seen before?

=== DAY TRADING RULESET ===

1. TREND CONFIRMATION

DATA STRUCTURE RULES (MANDATORY):
The input JSON contains these fields:

A. CURRENT PRICE
   - Located at: inputData.currentPrice
   - This is the latest 1m price for comparison

B. EMA VALUES (YOUR PRIMARY DATA SOURCE)
   - 5m EMA21 values: inputData.emas['5m'] (array of numbers)
   - 15m EMA21 values: inputData.emas['15m'] (array of numbers)
   - 1h EMA21 values: inputData.emas['1h'] (array of numbers)
   - Each array contains the calculated EMA21 value for each period
   - The LAST element in each array is the most recent EMA value
   - To get current 5m EMA: emas['5m'][emas['5m'].length - 1]
   - To get current 15m EMA: emas['15m'][emas['15m'].length - 1]
   - To get current 1h EMA: emas['1h'][emas['1h'].length - 1]

C. PRICE HISTORY (FOR CONTEXT ONLY - DO NOT USE FOR EMA ANALYSIS)
   - Located at: inputData.priceHistory['1m'], ['5m'], ['10m'], ['15m'], ['1h']
   - These are recent candles for viewing price action patterns
   - priceHistory['1h'] contains only 4 recent candles for context
   - THIS IS NOT EMA DATA - DO NOT count these values as EMA length

TREND ANALYSIS RULES:
- IF emas['1h'].length < 21 → Output "NO TRADE" with reason: "Insufficient 1h EMA data (need 21+ hours of price history)"
- IF emas['1h'].length >= 21 → Proceed with trend analysis using the last value from each timeframe:
  * Current 5m EMA = emas['5m'][emas['5m'].length - 1]
  * Current 15m EMA = emas['15m'][emas['15m'].length - 1]
  * Current 1h EMA = emas['1h'][emas['1h'].length - 1]
  * Current price = inputData.currentPrice

BULLISH TREND REQUIREMENTS (ALL must be true):
- currentPrice > emas['5m'][last] (price above 5m EMA)
- currentPrice > emas['15m'][last] (price above 15m EMA)
- currentPrice > emas['1h'][last] (price above 1h EMA)
- emas['5m'][last] > emas['5m'][last-5] (5m EMA sloping up)
- emas['15m'][last] > emas['15m'][last-5] (15m EMA sloping up)
- emas['1h'][last] > emas['1h'][last-5] (1h EMA sloping up)

BEARISH TREND REQUIREMENTS (ALL must be true):
- currentPrice < emas['5m'][last]
- currentPrice < emas['15m'][last]
- currentPrice < emas['1h'][last]
- emas['5m'][last] < emas['5m'][last-5] (5m EMA sloping down)
- emas['15m'][last] < emas['15m'][last-5] (15m EMA sloping down)
- emas['1h'][last] < emas['1h'][last-5] (1h EMA sloping down)

MULTI-TIMEFRAME CONFLICT (NO TRADE):
If price is above some EMAs but below others, this is a conflict. Example:
- currentPrice = 133.60
- emas['5m'][last] = 132.78 (price above 5m EMA ✓)
- emas['15m'][last] = 132.78 (price above 15m EMA ✓)
- emas['1h'][last] = 134.92 (price BELOW 1h EMA ✗)
→ Output: "NO TRADE - Multi-timeframe conflict: price above 5m/15m EMAs but below 1h EMA. This indicates short-term strength within a longer-term downtrend. Wait for 1h EMA alignment."

2. COINGLASS MARKET BIAS
   - LONG allowed when:
     * Funding neutral or slightly negative
     * Open interest rising with rising price
     * Long-short ratio NOT crowded
     * Downside liquidity swept
   - SHORT allowed when:
     * Funding positive and rising
     * Open interest rising with falling price
     * Long-short ratio crowded on longs
     * Upside liquidity swept
   - If unclear → NO TRADE

3. VOLUME CONFIRMATION (CMC 24H DATA)
   - Access volume data from volumeData.cmc.volume24h and volumeData.analysis
   - LONG requires:
     * 24h volume > $500M for BTC (or > 5% of market cap for altcoins)
     * Volume increasing with price (volumeData.analysis.priceVolumeCorrelation = BULLISH_CONFIRMATION or STRONG_BULLISH)
     * Volume strength: NORMAL, HIGH, or EXTREME (not LOW)
     * Volume trend: increasing or neutral (NOT decreasing during entry)
   - SHORT requires:
     * 24h volume > $500M for BTC (sufficient liquidity to execute)
     * Volume increasing while price falls (volumeData.analysis.priceVolumeCorrelation = BEARISH_PRESSURE or STRONG_BEARISH)
     * Volume strength: NORMAL or higher
     * Volume spike on bearish price action
   - Volume Warnings (AUTO NO TRADE):
     * If volume24h < $200M for BTC → NO TRADE (insufficient liquidity)
     * If volume24h < 3% of market cap for altcoins → NO TRADE
     * If volumeStrength = LOW → NO TRADE (too illiquid)
     * If volume declining during breakout → NO TRADE (weak signal)
   - Calculate volume-to-market-cap ratio: volume24h / marketCap
   - Strong signal: volume spike + price momentum aligned

4. LIQUIDITY CONDITIONS
   - Do NOT enter into liquidity
   - Only trade AFTER liquidity sweep occurred
   - Examples: recent high/low sweep, stop-hunt wick, false breakout
   - If no liquidity swept → NO TRADE

5. ENTRY TRIGGER (1-MINUTE ONLY)
   - LONG: retest of 5m structure + bullish engulfing + RSI > 50 + volume spike + downside stop-hunt wick
   - SHORT: rejection from 5m structure + bearish engulfing + RSI < 50 + volume spike + upside stop-hunt wick
   - If no clear entry signal → NO TRADE

6. RISK CONDITIONS
   - Safe market conditions only
   - Low spread
   - Stable volatility (no extreme wicks)
   - If risky → NO TRADE

=== OUTPUT FORMAT ===
Return JSON with this EXACT structure:
{
  "decision": "LONG" | "SHORT" | "NO TRADE",
  "confidence": 0-100,
  "summary": {
    "trend": "explanation of multi-timeframe alignment",
    "volume": "explanation of volume conditions",
    "liquidity": "explanation of liquidity sweep status",
    "coinglass": "explanation of funding, OI, long/short sentiment",
    "entryTrigger": "explanation of 1m entry signal"
  },
  "action": {
    "entry": price level (if LONG or SHORT, otherwise null),
    "stopLoss": price level (if LONG or SHORT, otherwise null),
    "takeProfit": price level (if LONG or SHORT, otherwise null),
    "reason": "detailed explanation of why NO TRADE" (if NO TRADE, otherwise null)
  }
}`;

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
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to NO TRADE if parsing fails
      decision = {
        decision: 'NO TRADE',
        confidence: 0,
        summary: {
          trend: 'Unable to analyze',
          volume: 'Unable to analyze',
          liquidity: 'Unable to analyze',
          coinglass: 'Unable to analyze',
          entryTrigger: 'Unable to analyze'
        },
        action: {
          entry: null,
          stopLoss: null,
          takeProfit: null,
          reason: 'AI response parsing failed'
        }
      };
    }

    return new Response(JSON.stringify(decision), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-trading-decision:', error);
    
    // Return safe fallback decision
    return new Response(JSON.stringify({
      decision: 'NO TRADE',
      confidence: 0,
      summary: {
        trend: 'Error occurred',
        volume: 'Error occurred',
        liquidity: 'Error occurred',
        coinglass: 'Error occurred',
        entryTrigger: 'Error occurred'
      },
      action: {
        entry: null,
        stopLoss: null,
        takeProfit: null,
        reason: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

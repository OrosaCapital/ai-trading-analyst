import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, symbolData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from symbol data
    const symbolContext = `
Current Symbol Analysis Context:
- Symbol: ${symbolData.symbol || 'Unknown'}
- Current Price: $${symbolData.currentPrice?.toFixed(2) || 'N/A'}
- 24h Change: ${symbolData.priceChange24h?.toFixed(2) || 'N/A'}%
- Market Cap: $${symbolData.marketCap ? (symbolData.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
- CMC Rank: #${symbolData.rank || 'N/A'}
- Volume 24h: $${symbolData.volume24h ? (symbolData.volume24h / 1e9).toFixed(2) + 'B' : 'N/A'}
- Circulating Supply: ${symbolData.circulatingSupply ? (symbolData.circulatingSupply / 1e6).toFixed(2) + 'M' : 'N/A'}

Derivatives Metrics:
- Funding Rate: ${symbolData.fundingRate ?? 'N/A'} (Trend: ${symbolData.fundingRateTrend || 'N/A'})
- Open Interest: ${symbolData.openInterest ?? 'N/A'} (Change: ${symbolData.openInterestChange ?? 'N/A'})
- Long/Short Ratio: ${symbolData.longShortRatio ?? 'N/A'}
- 24h Liquidations: ${symbolData.liquidations24h ?? 'N/A'}

Technical Indicators:
- RSI: ${symbolData.rsi ?? 'N/A'}
- Taker Buy Volume: ${symbolData.takerBuyVolume ?? 'N/A'}%
- Taker Sell Volume: ${symbolData.takerSellVolume ?? 'N/A'}%

Market Sentiment:
- Fear & Greed Index: ${symbolData.fearGreedIndex ?? 'N/A'} (${symbolData.fearGreedLabel || 'Unknown'})

AI Trading Analysis:
- Decision: ${symbolData.aiDecision || 'Analyzing...'}
- Confidence: ${symbolData.aiConfidence ?? '--'}%
`;

    const systemPrompt = `You are a Dashboard and Data Technical Assistant for a cryptocurrency trading platform. Your mission is to help maintain 99.9% uptime by providing expert troubleshooting and operational support.

SYSTEM ARCHITECTURE YOU SUPPORT:
- Frontend: React + TypeScript + Vite
- Backend: 30+ Supabase Edge Functions (Deno runtime)
- Database: PostgreSQL 15.x with real-time subscriptions
- APIs: CoinMarketCap, Coinglass, Tatum, API Ninjas
- WebSocket: Real-time price streaming for live data
- Authentication: Supabase Auth with email/OAuth

CURRENT SYSTEM STATUS:
${symbolContext}

YOUR CAPABILITIES:
1. **Incident Diagnosis**: Analyze error reports, API failures, rate limit issues, memory problems
2. **Troubleshooting**: Provide step-by-step solutions for edge function errors, database issues, API connectivity problems
3. **Performance Optimization**: Suggest caching strategies, query optimization, API call reduction
4. **Proactive Monitoring**: Identify patterns that could lead to downtime
5. **Technical Guidance**: Explain system behavior, debug WebSocket issues, trace data flow

CRITICAL AREAS TO MONITOR:
- API Rate Limits: CoinMarketCap (monthly credits), Coinglass (requests/min), Tatum (daily calls)
- Edge Functions: Check logs for errors, timeout issues, deployment problems
- Database: Query performance, RLS policies, connection pooling
- WebSocket: Connection stability, reconnection logic, message handling
- Memory: Application usage, caching efficiency, resource leaks

RESPONSE FORMAT:
- Start with diagnosis (what's wrong and why)
- Provide immediate fix (if available)
- Suggest long-term solution (if needed)
- Include specific file paths, function names, or config changes when relevant
- Be concise but thorough (aim for 150-250 words unless complex issue requires more)

WHEN RECEIVING ALERTS:
- Error alerts → Diagnose root cause + provide fix
- Warning alerts → Assess severity + suggest preventive action
- Info alerts → Acknowledge + explain significance
- Performance reports → Analyze metrics + recommend optimizations

You have deep knowledge of:
- Supabase edge function debugging
- API integration troubleshooting
- PostgreSQL query optimization
- React error boundary patterns
- WebSocket connection management
- Rate limiting and caching strategies

Your goal is to be the first line of defense for technical issues, providing "Super Support" that keeps the platform running smoothly.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Symbol AI chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

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

    const systemPrompt = `You are a professional cryptocurrency market analyst specializing in technical analysis, derivatives metrics, and market sentiment. You help users understand cryptocurrency markets by providing clear, actionable insights based on real-time data.

${symbolContext}

Guidelines for responses:
- Be concise and direct, focusing on the most relevant information
- Use the provided market data to support your analysis
- Explain technical terms when they might be unclear
- Provide actionable insights when appropriate
- If data is unavailable (N/A), acknowledge it and work with available information
- Keep responses under 200 words unless more detail is specifically requested
- Use bullet points for clarity when listing multiple points

Your goal is to help users make informed decisions about cryptocurrency trading and investment by interpreting the data provided.`;

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

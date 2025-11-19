import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, symbol } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch market data if symbol is provided
    let marketContext = "";
    if (symbol) {
      console.log(`Fetching market data for symbol: ${symbol}`);
      
      // Get latest price snapshot
      const { data: snapshot } = await supabase
        .from('market_snapshots')
        .select('*')
        .eq('symbol', symbol)
        .single();

      // Get recent candles (last 100)
      const { data: candles } = await supabase
        .from('market_candles')
        .select('*')
        .eq('symbol', symbol)
        .eq('timeframe', '1h')
        .order('timestamp', { ascending: false })
        .limit(100);

      // Get recent funding rates
      const { data: fundingRates } = await supabase
        .from('market_funding_rates')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(20);

      // Get recent price logs
      const { data: priceLogs } = await supabase
        .from('tatum_price_logs')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(50);

      // Build context string
      marketContext = `\n\n=== MARKET DATA FOR ${symbol} ===\n`;
      
      if (snapshot) {
        marketContext += `\nCurrent Snapshot:\n- Price: $${snapshot.price}\n- 24h Change: ${snapshot.change_24h}%\n- 24h Volume: $${snapshot.volume_24h}\n- Last Updated: ${snapshot.last_updated}\n`;
      }

      if (candles && candles.length > 0) {
        const latest = candles[0];
        const oldest = candles[candles.length - 1];
        const priceChange = ((latest.close - oldest.open) / oldest.open * 100).toFixed(2);
        marketContext += `\nRecent Candles (1h, last ${candles.length}):\n- Latest Close: $${latest.close}\n- High: $${Math.max(...candles.map(c => c.high))}\n- Low: $${Math.min(...candles.map(c => c.low))}\n- Price Change: ${priceChange}%\n- Avg Volume: $${(candles.reduce((sum, c) => sum + (c.volume || 0), 0) / candles.length).toFixed(2)}\n`;
      }

      if (fundingRates && fundingRates.length > 0) {
        const avgRate = (fundingRates.reduce((sum, r) => sum + Number(r.rate), 0) / fundingRates.length).toFixed(6);
        const latestRate = fundingRates[0].rate;
        marketContext += `\nFunding Rates:\n- Latest: ${latestRate}%\n- Average (last ${fundingRates.length}): ${avgRate}%\n- Exchanges: ${[...new Set(fundingRates.map(r => r.exchange))].join(', ')}\n`;
      }

      if (priceLogs && priceLogs.length > 0) {
        marketContext += `\nPrice History (${priceLogs.length} data points available)\n`;
      }

      console.log('Market context built:', marketContext.substring(0, 200) + '...');
    }

    const systemPrompt = `You are an elite cryptocurrency trading AI assistant specializing in market analysis, technical indicators, and trading strategies. 

You have access to REAL market data from the OCAPX trading platform database. When analyzing symbols, use the provided market data to give accurate, data-driven insights.

Your analysis should include:
- Price action and trend analysis
- Volume patterns and anomalies  
- Support/resistance levels based on actual price data
- Funding rate analysis (sentiment indicator)
- Risk assessment and entry/exit suggestions

Be concise but comprehensive. Always reference the actual data when making recommendations.${marketContext}`;

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
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

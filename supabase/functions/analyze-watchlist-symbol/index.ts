import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { symbol, watchlist_id } = await req.json();

    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`[Watchlist Analysis] Starting analysis for ${symbol} (user: ${user.id})`);

    // Verify watchlist ownership
    if (watchlist_id) {
      const { data: watchlistItem, error: watchlistError } = await supabase
        .from('user_watchlists')
        .select('id')
        .eq('id', watchlist_id)
        .eq('user_id', user.id)
        .single();

      if (watchlistError || !watchlistItem) {
        throw new Error('Watchlist item not found or unauthorized');
      }
    }

    // Step 1: Log the latest price
    console.log(`[Watchlist Analysis] Logging price for ${symbol}...`);
    const logResponse = await supabase.functions.invoke('tatum-price-logger', {
      body: { symbol }
    });

    if (logResponse.error) {
      console.error('[Watchlist Analysis] Price logging failed:', logResponse.error);
      throw new Error(`Failed to log price: ${logResponse.error.message}`);
    }

    console.log(`[Watchlist Analysis] Price logged successfully. Waiting for database write...`);
    
    // Step 2: Wait for logs to be written
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Trigger full trading analysis
    console.log(`[Watchlist Analysis] Fetching trading data and running AI analysis...`);
    const analysisResponse = await supabase.functions.invoke('fetch-trading-data', {
      body: { symbol }
    });

    if (analysisResponse.error) {
      console.error('[Watchlist Analysis] Analysis failed:', analysisResponse.error);
      throw new Error(`Analysis failed: ${analysisResponse.error.message}`);
    }

    const analysisData = analysisResponse.data;

    // Check if we have sufficient data
    if (analysisData.status === 'accumulating') {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'insufficient_data',
          message: analysisData.message || 'Need more price history. Try again in a few minutes.',
          progress: analysisData.progress
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Extract AI signal
    const aiSignal = analysisData.aiSignal;

    if (!aiSignal) {
      throw new Error('No AI signal returned from analysis');
    }

    console.log(`[Watchlist Analysis] Analysis complete for ${symbol}: ${aiSignal.decision} (${aiSignal.confidence}%)`);

    // Return the analysis result
    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        decision: aiSignal.decision,
        confidence: aiSignal.confidence,
        summary: aiSignal.summary,
        action: aiSignal.action,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Watchlist Analysis] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Analysis failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

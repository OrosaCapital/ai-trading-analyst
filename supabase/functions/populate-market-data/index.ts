import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const TATUM_API_KEY = Deno.env.get('TATUM_API_KEY');
    const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');

    // Symbols to populate
    const symbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BNBUSDT'];
    const timeframe = '1h';
    const limit = 200;

    console.log(`Populating market data for ${symbols.length} symbols...`);

    for (const symbol of symbols) {
      try {
        // Fetch from Tatum (real-time price)
        const cleanSymbol = symbol.replace('USDT', '');
        const tatumUrl = `https://api.tatum.io/v4/data/rate/symbol?symbol=${cleanSymbol}&basePair=USD`;
        
        console.log(`Fetching price for ${symbol} from Tatum...`);
        const tatumRes = await fetch(tatumUrl, {
          headers: { 
            'accept': 'application/json',
            'x-api-key': TATUM_API_KEY || '' 
          }
        });

        let currentPrice = 50000;
        if (tatumRes.ok) {
          const data = await tatumRes.json();
          currentPrice = parseFloat(data.value || '50000');
          console.log(`✓ ${symbol} current price: $${currentPrice.toFixed(4)}`);
          
          // Update snapshot
          const { error: snapshotError } = await supabaseClient
            .from('market_snapshots')
            .upsert({
              symbol,
              price: currentPrice,
              volume_24h: Math.random() * 1000000000,
              change_24h: (Math.random() - 0.5) * 10,
              last_updated: new Date().toISOString(),
              source: 'tatum'
            });
          
          if (snapshotError) {
            console.error(`Snapshot error for ${symbol}:`, snapshotError);
          }
        } else {
          const errorText = await tatumRes.text();
          console.error(`Tatum API failed for ${symbol} [${tatumRes.status}]:`, errorText);
          console.log(`Using default price $${currentPrice} for ${symbol}`);
        }

        // Generate simulated candles based on current price
        const now = Math.floor(Date.now() / 1000);
        const candles: Candle[] = [];
        
        for (let i = limit - 1; i >= 0; i--) {
          const timestamp = now - (i * 3600); // 1 hour intervals
          const variance = 0.02;
          const open = currentPrice * (1 + (Math.random() - 0.5) * variance);
          const close = currentPrice * (1 + (Math.random() - 0.5) * variance);
          const high = Math.max(open, close) * (1 + Math.random() * variance);
          const low = Math.min(open, close) * (1 - Math.random() * variance);
          const volume = Math.random() * 100000;

          candles.push({ timestamp, open, high, low, close, volume });
        }

        // Insert candles into database
        const candleRecords = candles.map(c => ({
          symbol,
          timeframe,
          timestamp: c.timestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume
        }));

        const { error: candleError } = await supabaseClient
          .from('market_candles')
          .upsert(candleRecords, { onConflict: 'symbol,timeframe,timestamp' });

        if (candleError) {
          console.error(`Error inserting candles for ${symbol}:`, candleError);
        } else {
          console.log(`✓ Populated ${candles.length} candles for ${symbol}`);
        }

        // Fetch and store funding rate
        if (COINGLASS_API_KEY) {
          try {
            const fundingUrl = `https://open-api.coinglass.com/public/v2/funding?symbol=${cleanSymbol}&ex=Binance`;
            const fundingRes = await fetch(fundingUrl, {
              headers: { 'CG-API-KEY': COINGLASS_API_KEY }
            });

            if (fundingRes.ok) {
              const fundingData = await fundingRes.json();
              if (fundingData.success && fundingData.data) {
                const rate = parseFloat(fundingData.data.uMarginList?.[0]?.rate || '0');
                
                await supabaseClient
                  .from('market_funding_rates')
                  .upsert({
                    symbol,
                    exchange: 'Binance',
                    rate,
                    timestamp: now
                  }, { onConflict: 'symbol,exchange,timestamp' });

                console.log(`✓ Stored funding rate for ${symbol}: ${rate}%`);
              }
            }
          } catch (err) {
            console.log(`Funding rate fetch failed for ${symbol}:`, err);
          }
        }

      } catch (symbolError) {
        console.error(`Error processing ${symbol}:`, symbolError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Populated data for ${symbols.length} symbols`,
        symbols
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Population error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

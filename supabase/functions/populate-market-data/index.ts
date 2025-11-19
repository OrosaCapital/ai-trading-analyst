import { createClient } from 'jsr:@supabase/supabase-js@2';

// 🚨 CRITICAL: CoinMarketCap API Rate Limits
// - Monthly Limit: 10,000 credits
// - This function costs ~5-10 credits per run (1 credit per symbol)
// - DO NOT call more than 2x per hour
// - ALWAYS check cache before calling CMC API
// - Cache TTL: 5 minutes minimum

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
    const CMC_API_KEY = Deno.env.get('COINMARKETCAP_API_KEY');

    // Accept symbol parameter from request, or use default list
    const body = await req.json().catch(() => ({}));
    const requestedSymbol = body.symbol?.toUpperCase().trim();
    
    // If specific symbol requested, use it; otherwise use default list
    const symbols = requestedSymbol 
      ? [requestedSymbol.endsWith('USDT') ? requestedSymbol : `${requestedSymbol}USDT`]
      : ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BNBUSDT'];
    
    const timeframe = '1h';
    const limit = 200;

    console.log(`⚠️ CMC API Rate Limit: Check cache before calling!`);
    console.log(`Populating market data for ${symbols.length} symbol(s): ${symbols.join(', ')}...`);

    for (const symbol of symbols) {
      try {
        const cleanSymbol = symbol.replace('USDT', '');
        let currentPrice = 50000;
        let priceSource = 'fallback';

        // 🔍 Check cache first (5-minute TTL to conserve API credits)
        const { data: cachedSnapshot } = await supabaseClient
          .from('market_snapshots')
          .select('price, last_updated')
          .eq('symbol', symbol)
          .single();

        const cacheAge = cachedSnapshot 
          ? (Date.now() - new Date(cachedSnapshot.last_updated).getTime()) / 1000 
          : Infinity;

        // Use cache if less than 5 minutes old (300 seconds)
        if (cachedSnapshot && cacheAge < 300) {
          currentPrice = cachedSnapshot.price;
          priceSource = 'cache';
          console.log(`💾 ${symbol} using cached price: $${currentPrice.toFixed(4)} (age: ${Math.floor(cacheAge)}s)`);
        } else {
          // Try CoinMarketCap only if cache is stale
          if (CMC_API_KEY) {
            console.log(`🌐 Fetching fresh price for ${symbol} from CoinMarketCap...`);
            const cmcUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${cleanSymbol}&convert=USD`;
          
            try {
              const cmcRes = await fetch(cmcUrl, {
                headers: { 
                  'X-CMC_PRO_API_KEY': CMC_API_KEY,
                  'Accept': 'application/json'
                }
              });

              console.log(`CMC Response Status: ${cmcRes.status}`);
              
              if (cmcRes.ok) {
                const cmcData = await cmcRes.json();
                console.log(`CMC Response for ${symbol}:`, JSON.stringify(cmcData, null, 2));
                
                if (cmcData.data && cmcData.data[cleanSymbol] && cmcData.data[cleanSymbol][0]) {
                  currentPrice = cmcData.data[cleanSymbol][0].quote.USD.price;
                  priceSource = 'coinmarketcap';
                  console.log(`✅ ${symbol} price from CoinMarketCap: $${currentPrice.toFixed(4)}`);
                }
              } else {
                const errorText = await cmcRes.text();
                console.error(`❌ CoinMarketCap API failed for ${symbol} [${cmcRes.status}]:`, errorText);
              }
            } catch (cmcError) {
              console.error(`❌ CoinMarketCap error for ${symbol}:`, cmcError);
            }
          }
        }

        // Fallback to Tatum if CMC didn't work
        if (priceSource === 'fallback' && TATUM_API_KEY) {
          console.log(`Trying Tatum API for ${symbol}...`);
          const tatumUrl = `https://api.tatum.io/v4/data/rate/symbol?symbol=${cleanSymbol}&basePair=USD`;
          
          const tatumRes = await fetch(tatumUrl, {
            headers: { 
              'accept': 'application/json',
              'x-api-key': TATUM_API_KEY
            }
          });

          if (tatumRes.ok) {
            const data = await tatumRes.json();
            currentPrice = parseFloat(data.value || '50000');
            priceSource = 'tatum';
            console.log(`✓ ${symbol} price from Tatum: $${currentPrice.toFixed(4)}`);
          } else {
            const errorText = await tatumRes.text();
            console.error(`Tatum API failed for ${symbol} [${tatumRes.status}]:`, errorText);
          }
        }

        if (priceSource === 'fallback') {
          console.log(`⚠️ Using fallback price $${currentPrice} for ${symbol}`);
        }

        // Update snapshot
        const { error: snapshotError } = await supabaseClient
          .from('market_snapshots')
          .upsert({
            symbol,
            price: currentPrice,
            volume_24h: Math.random() * 1000000000,
            change_24h: (Math.random() - 0.5) * 10,
            last_updated: new Date().toISOString(),
            source: priceSource
          });
        
        if (snapshotError) {
          console.error(`Snapshot error for ${symbol}:`, snapshotError);
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

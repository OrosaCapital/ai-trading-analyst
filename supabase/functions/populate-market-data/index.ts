import { createClient } from '@supabase/supabase-js';

// Using Kraken public API (free, no rate limits)

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

    const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');
    
    // Import Kraken utilities
    const { translateToKraken } = await import('../_shared/krakenSymbols.ts');
    const { loadKrakenPairs } = await import('../_shared/krakenPairDiscovery.ts');

    // Accept symbol parameter from request, or fetch tracked symbols from database
    const body = await req.json().catch(() => ({}));
    const requestedSymbol = body.symbol?.toUpperCase().trim();
    
    let symbols: string[];
    
    if (requestedSymbol) {
      // If specific symbol requested, use it
      symbols = [requestedSymbol.endsWith('USDT') ? requestedSymbol : `${requestedSymbol}USDT`];
    } else {
      // Fetch active tracked symbols from database
      const { data: trackedSymbols, error: trackedError } = await supabaseClient
        .from('tracked_symbols')
        .select('symbol')
        .eq('active', true);
      
      if (trackedError) {
        console.error('❌ Error fetching tracked symbols:', trackedError);
        // Fallback to default list if database query fails
        symbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BNBUSDT'];
      } else if (!trackedSymbols || trackedSymbols.length === 0) {
        console.log('⚠️ No tracked symbols found, using defaults');
        symbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BNBUSDT'];
      } else {
        symbols = trackedSymbols.map(t => t.symbol);
        console.log(`✅ Loaded ${symbols.length} tracked symbols from database`);
      }
    }
    
    const timeframe = '1h';
    const limit = 200;

    console.log(`📊 Populating market data for ${symbols.length} symbol(s): ${symbols.join(', ')}...`);
    
    // Load supported Kraken pairs once
    const supportedPairs = await loadKrakenPairs();

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
          // Fetch from Kraken
          const krakenSymbol = translateToKraken(symbol);
          
          // Check if pair is supported
          if (!supportedPairs.includes(krakenSymbol)) {
            console.log(`⚠️ ${symbol} (${krakenSymbol}) not supported by Kraken, skipping...`);
            continue;
          }
          
          console.log(`🌐 Fetching fresh price for ${symbol} from Kraken (${krakenSymbol})...`);
          
          try {
            const krakenUrl = `https://api.kraken.com/0/public/Ticker?pair=${krakenSymbol}`;
            const krakenRes = await fetch(krakenUrl);
            
            if (krakenRes.ok) {
              const krakenData = await krakenRes.json();
              
              if (krakenData.error && krakenData.error.length > 0) {
                console.error(`❌ Kraken API error for ${symbol}:`, krakenData.error);
              } else {
                const pairData = krakenData.result[krakenSymbol] || krakenData.result[Object.keys(krakenData.result)[0]];
                
                if (pairData && pairData.c) {
                  currentPrice = parseFloat(pairData.c[0]);
                  priceSource = 'kraken';
                  console.log(`✅ ${symbol} price from Kraken: $${currentPrice.toFixed(4)}`);
                }
              }
            } else {
              console.error(`❌ Kraken API failed for ${symbol} [${krakenRes.status}]`);
            }
          } catch (krakenError) {
            console.error(`❌ Kraken fetch error for ${symbol}:`, krakenError);
          }
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
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

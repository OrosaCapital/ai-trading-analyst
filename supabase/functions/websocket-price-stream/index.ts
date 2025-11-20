const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscribeMessage {
  action: 'subscribe' | 'unsubscribe';
  symbol: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let coinglassWS: WebSocket | null = null;
  let currentSymbol: string | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  let pingInterval: number | null = null;

  const connectToKraken = async (symbol: string) => {
    if (coinglassWS && coinglassWS.readyState === WebSocket.OPEN) {
      coinglassWS.close();
    }

    console.log(`📡 Connecting to Kraken WebSocket for ${symbol}...`);
    
    const { translateToKraken, toKrakenWSFormat } = await import('../_shared/krakenSymbols.ts');
    const krakenSymbol = translateToKraken(symbol);
    const wsSymbol = toKrakenWSFormat(krakenSymbol);
    
    console.log(`🔗 Kraken pair: ${krakenSymbol} -> WS format: ${wsSymbol} (original: ${symbol})`);
    
    // Use Kraken v1 API (not v2)
    coinglassWS = new WebSocket('wss://ws.kraken.com/');
    
    coinglassWS.onopen = () => {
      console.log(`✅ Kraken WebSocket connected for ${wsSymbol}`);
      reconnectAttempts = 0;
      
      // v1 API subscription format with SLASH
      const subscribeMsg = {
        event: 'subscribe',
        pair: [wsSymbol],  // Must be "XBT/USD" format with slash!
        subscription: { name: 'ticker' }
      };
      
      console.log('📤 Sending subscription:', JSON.stringify(subscribeMsg));
      coinglassWS?.send(JSON.stringify(subscribeMsg));
      
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (coinglassWS?.readyState === WebSocket.OPEN) {
          coinglassWS.send(JSON.stringify({ event: 'ping' }));
        }
      }, 30000);
      
      // Send connection success to client
      socket.send(JSON.stringify({
        type: "connection",
        status: "connected",
        symbol: symbol
      }));
    };

    coinglassWS.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // v1 API returns array format: [channelID, tickerData, channelName, pair]
        if (Array.isArray(data) && data[1] && data[1].c) {
          const price = parseFloat(data[1].c[0]); // Last trade price
          const volume = parseFloat(data[1].v[1] || 0); // 24h volume
          
          console.log('💰 Price update:', { symbol, price, volume });
          
          socket.send(JSON.stringify({
            type: "price_update",
            symbol: symbol,
            price: price,
            volume: volume,
            timestamp: Date.now()
          }));
        } else if (data.event === 'pong') {
          // Ignore pong responses
          return;
        } else if (data.event) {
          // Log other events (subscribed, error, etc.)
          console.log('📥 Kraken event:', data.event, data.status || '');
        }
      } catch (error) {
        console.error('❌ Error processing Kraken message:', error);
      }
    };

    coinglassWS.onerror = (error) => {
      console.error('CoinGlass WebSocket error:', error);
      socket.send(JSON.stringify({
        type: "error",
        message: "Connection error to price feed"
      }));
    };

    coinglassWS.onclose = () => {
      console.log('CoinGlass WebSocket closed');
      
      // Clear ping interval
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      
      // Attempt reconnection
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && currentSymbol) {
        reconnectAttempts++;
        console.log(`Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        setTimeout(() => {
          if (currentSymbol) {
            connectToKraken(currentSymbol);
          }
        }, 2000 * reconnectAttempts);
      } else {
        socket.send(JSON.stringify({
          type: "connection",
          status: "disconnected"
        }));
      }
    };
  };

  socket.onopen = () => {
    console.log("Client WebSocket opened");
    socket.send(JSON.stringify({
      type: "connection",
      status: "ready",
      message: "Send subscribe message with symbol"
    }));
  };

  socket.onmessage = (event) => {
    try {
      const message: SubscribeMessage = JSON.parse(event.data);
      console.log('Client message:', message);
      
      if (message.action === 'subscribe' && message.symbol) {
        currentSymbol = message.symbol;
        connectToKraken(message.symbol);
      } else if (message.action === 'unsubscribe') {
        currentSymbol = null;
        if (coinglassWS) {
          coinglassWS.close();
          coinglassWS = null;
        }
      }
    } catch (error) {
      console.error('Error parsing client message:', error);
      socket.send(JSON.stringify({
        type: "error",
        message: "Invalid message format"
      }));
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket closed");
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (coinglassWS) {
      coinglassWS.close();
      coinglassWS = null;
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
  };

  return response;
});

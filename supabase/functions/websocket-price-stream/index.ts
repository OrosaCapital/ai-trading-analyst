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
    
    const { translateToKraken } = await import('../_shared/krakenSymbols.ts');
    const krakenSymbol = translateToKraken(symbol);
    
    console.log(`🔗 Kraken pair: ${krakenSymbol} (original: ${symbol})`);
    
    coinglassWS = new WebSocket('wss://ws.kraken.com/v2');
    
    coinglassWS.onopen = () => {
      console.log(`✅ Kraken WebSocket connected for ${krakenSymbol}`);
      reconnectAttempts = 0;
      
      const subscribeMsg = {
        method: 'subscribe',
        params: {
          channel: 'ticker',
          symbol: [krakenSymbol]
        }
      };
      
      coinglassWS?.send(JSON.stringify(subscribeMsg));
      
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (coinglassWS?.readyState === WebSocket.OPEN) {
          coinglassWS.send(JSON.stringify({ method: 'ping' }));
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
        
        // Log ALL messages from Kraken for debugging
        console.log('📥 Kraken message:', JSON.stringify(data).substring(0, 200));
        
        if (data.method === 'pong') return;
        
        if (data.channel === 'ticker' && data.data && data.data[0]) {
          const ticker = data.data[0];
          console.log('💰 Sending price update:', {
            symbol,
            price: parseFloat(ticker.last || 0),
            volume: parseFloat(ticker.volume || 0)
          });
          
          socket.send(JSON.stringify({
            type: "price_update",
            symbol: symbol,
            price: parseFloat(ticker.last || 0),
            volume: parseFloat(ticker.volume || 0),
            timestamp: Date.now()
          }));
        } else {
          console.log('⚠️ Ticker data not in expected format:', { 
            hasChannel: !!data.channel, 
            hasData: !!data.data,
            channel: data.channel 
          });
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

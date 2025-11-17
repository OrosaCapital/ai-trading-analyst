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

  const connectToCoinGlass = (symbol: string) => {
    if (coinglassWS && coinglassWS.readyState === WebSocket.OPEN) {
      coinglassWS.close();
    }

    console.log(`Connecting to CoinGlass WebSocket for ${symbol}...`);
    
    // CoinGlass WebSocket endpoint with API key
    const apiKey = Deno.env.get('COINGLASS_API_KEY') || '';
    coinglassWS = new WebSocket(`wss://open-ws.coinglass.com/ws-api?cg-api-key=${apiKey}`);
    
    coinglassWS.onopen = () => {
      console.log(`CoinGlass WebSocket connected for ${symbol}`);
      reconnectAttempts = 0;
      
      // Subscribe to ticker updates
      const subscribeMsg = {
        type: "subscribe",
        channel: "ticker",
        symbol: symbol.toUpperCase(),
        interval: "1m"
      };
      
      coinglassWS?.send(JSON.stringify(subscribeMsg));
      
      // Set up ping interval to keep connection alive (every 20 seconds)
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (coinglassWS?.readyState === WebSocket.OPEN) {
          coinglassWS.send('ping');
        }
      }, 20000);
      
      // Send connection success to client
      socket.send(JSON.stringify({
        type: "connection",
        status: "connected",
        symbol: symbol
      }));
    };

    coinglassWS.onmessage = (event) => {
      try {
        // Ignore pong responses (keepalive messages)
        if (event.data === 'pong') {
          return;
        }
        
        const data = JSON.parse(event.data);
        console.log('CoinGlass message:', data);
        
        // Transform CoinGlass data format to our format
        if (data.type === 'ticker' || data.channel === 'ticker') {
          const transformed = {
            type: "price_update",
            symbol: symbol,
            price: parseFloat(data.price || data.close || data.last),
            volume: parseFloat(data.volume || data.vol24h || 0),
            change24h: parseFloat(data.change24h || data.priceChangePercent || 0),
            high24h: parseFloat(data.high24h || data.high || 0),
            low24h: parseFloat(data.low24h || data.low || 0),
            timestamp: Date.now()
          };
          
          socket.send(JSON.stringify(transformed));
        } else {
          // Forward raw data if format is different
          socket.send(event.data);
        }
      } catch (error) {
        console.error('Error processing CoinGlass message:', error);
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
            connectToCoinGlass(currentSymbol);
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
        connectToCoinGlass(message.symbol);
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

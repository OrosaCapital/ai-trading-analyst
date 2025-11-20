import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logWarningToSystem } from "@/store/useSystemAlertsStore";

interface PriceUpdate {
  type: "price_update";
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface ConnectionStatus {
  type: "connection";
  status: "ready" | "connected" | "disconnected" | "error";
  symbol?: string;
  message?: string;
}

type WebSocketMessage = PriceUpdate | ConnectionStatus | { type: "error"; message: string };

export const useRealtimePriceStream = (symbol: string | null, enabled: boolean = true) => {
  const [priceData, setPriceData] = useState<PriceUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "disconnected",
  );
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const currentSymbolRef = useRef<string | null>(null);

  const connect = useCallback(async () => {
    console.log('🚀 connect() called with:', { enabled, symbol });
    
    if (!enabled || !symbol) {
      console.log('⚠️ Aborting connect: enabled=' + enabled + ' symbol=' + symbol);
      return;
    }

    if (wsRef.current) {
      console.log('🔄 Closing existing WebSocket');
      wsRef.current.close();
    }

    currentSymbolRef.current = symbol;
    setConnectionStatus("connecting");
    console.log('📡 Set status to connecting');

    // Get Supabase auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    
    // Get anon key from env
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    // Include auth as query param for WebSocket connection
    const wsUrl = new URL("wss://alzxeplijnbpuqkfnpjk.supabase.co/functions/v1/websocket-price-stream");
    wsUrl.searchParams.set('apikey', anonKey);
    if (token) {
      wsUrl.searchParams.set('authorization', `Bearer ${token}`);
    }
    
    console.log(`🔌 Connecting WebSocket for ${symbol}...`);
    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
      ws.send(JSON.stringify({ action: "subscribe", symbol }));

      if (heartbeatRef.current) clearInterval(heartbeatRef.current);

      heartbeatRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 20000);
    };

    ws.onmessage = async (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        if (data.type === "connection") {
          setConnectionStatus(
            data.status === "connected" ? "connected" : data.status === "error" ? "error" : "disconnected",
          );
        }

        if (data.type === "price_update") {
          // Log price updates for debugging
          console.log(`🔴 WebSocket Price Update - ${data.symbol}:`, {
            price: data.price,
            change24h: data.change24h,
            volume: data.volume,
            timestamp: new Date(data.timestamp).toISOString()
          });
          
          setPriceData(data);
          setLastUpdateTime(Date.now());
        }

        if (data.type === "error") {
          setConnectionStatus("error");
        }
      } catch (e) {
        logWarningToSystem("WebSocket Parse Error", e instanceof Error ? e.message : "Failed to parse", "WebSocket");
      }
    };

    ws.onerror = () => {
      setConnectionStatus("error");
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };
  }, [symbol, enabled]);

  useEffect(() => {
    console.log('🔍 useRealtimePriceStream effect:', { enabled, symbol, hasConnect: !!connect });
    
    if (enabled && symbol) {
      console.log('✅ Conditions met, calling connect()');
      connect();
    } else {
      console.log('❌ Conditions not met:', { enabled, hasSymbol: !!symbol });
    }

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
      currentSymbolRef.current = null;
    };
  }, [symbol, enabled, connect]);

  return {
    priceData,
    connectionStatus,
    isConnected: connectionStatus === "connected",
    reconnect: connect,
    lastUpdateTime,
    isPolling: false,
  };
};

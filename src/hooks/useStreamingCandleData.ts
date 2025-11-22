import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logWarningToSystem } from "@/store/useSystemAlertsStore";
import type { Candle } from "@/lib/indicators";

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

// Matches the structure of a lightweight-charts candle
export interface LiveCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Maps our app's timeframe to Kraken's interval values
const timeframeToKrakenInterval = {
  '1M': 1,
  '5M': 5,
  '15M': 15,
  '1H': 60,
};

export type Timeframe = '1M' | '5M' | '15M' | '1H';

export const useStreamingCandleData = (
  symbol: string | null,
  timeframe: Timeframe,
  enabled: boolean = true
) => {
  const [streamingCandle, setStreamingCandle] = useState<Candle | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "disconnected",
  );
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const currentSymbolRef = useRef<string | null>(null);
  const currentTimeframeRef = useRef<string>(timeframe);
  const currentCandleRef = useRef<Candle | null>(null);

  // Get timeframe duration in milliseconds
  const getTimeframeMs = (tf: string): number => {
    switch (tf) {
      case "15m": return 15 * 60 * 1000;
      case "1h": return 60 * 60 * 1000;
      case "4h": return 4 * 60 * 60 * 1000;
      case "1d": return 24 * 60 * 60 * 1000;
      case "1w": return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  // Create a new candle from price data
  const createCandleFromPrice = useCallback((priceData: PriceUpdate, tf: string): Candle => {
    const timeframeMs = getTimeframeMs(tf);
    const now = Date.now();
    const candleStart = Math.floor(now / timeframeMs) * timeframeMs;

    return {
      timestamp: candleStart,
      open: priceData.price,
      high: priceData.price,
      low: priceData.price,
      close: priceData.price,
      volume: priceData.volume || 0,
    };
  }, []);

  // Update existing candle with new price data
  const updateCandleWithPrice = useCallback((existingCandle: Candle, priceData: PriceUpdate): Candle => {
    return {
      ...existingCandle,
      close: priceData.price,
      high: Math.max(existingCandle.high, priceData.price),
      low: Math.min(existingCandle.low, priceData.price),
      volume: existingCandle.volume + (priceData.volume || 0),
    };
  }, []);

  const connect = useCallback(async () => {
    console.log('🚀 useStreamingCandleData connect() called with:', { enabled, symbol, timeframe });

    if (!enabled || !symbol) {
      console.log('⚠️ Aborting connect: enabled=' + enabled + ' symbol=' + symbol);
      return;
    }

    if (wsRef.current) {
      console.log('🔄 Closing existing WebSocket');
      wsRef.current.close();
    }

    currentSymbolRef.current = symbol;
    currentTimeframeRef.current = timeframe;
    setConnectionStatus("connecting");

    try {
      // Get WebSocket URL from Supabase
      const { data: wsData, error: wsError } = await supabase.functions.invoke('get-websocket-url', {
        body: { symbol }
      });

      if (wsError) throw wsError;

      const wsUrl = wsData?.url;
      if (!wsUrl) throw new Error('No WebSocket URL received');

      console.log('🔌 Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected for streaming candle data');
        setConnectionStatus("connected");

        // Send subscription message
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            symbol: symbol,
            timeframe: timeframe
          }));
        }

        // Start heartbeat
        heartbeatRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Streaming candle WebSocket message:', message);

          if (message.type === 'price_update' && message.symbol === symbol) {
            const priceData = message as PriceUpdate;
            setLastUpdateTime(Date.now());

            // Create or update candle based on timeframe
            const now = Date.now();
            const timeframeMs = getTimeframeMs(timeframe);
            const currentCandleStart = Math.floor(now / timeframeMs) * timeframeMs;

            if (!currentCandleRef.current || currentCandleRef.current.timestamp !== currentCandleStart) {
              // Create new candle
              const newCandle = createCandleFromPrice(priceData, timeframe);
              currentCandleRef.current = newCandle;
              setStreamingCandle(newCandle);
            } else {
              // Update existing candle
              const updatedCandle = updateCandleWithPrice(currentCandleRef.current, priceData);
              currentCandleRef.current = updatedCandle;
              setStreamingCandle(updatedCandle);
            }
          } else if (message.type === 'connection') {
            const statusMsg = message as ConnectionStatus;
            console.log('🔗 Connection status:', statusMsg.status);
            setConnectionStatus(statusMsg.status === 'connected' ? 'connected' : 'disconnected');
          } else if (message.type === 'error') {
            console.error('❌ WebSocket error:', message.message);
            setConnectionStatus("error");
            logWarningToSystem(`WebSocket error for ${symbol}: ${message.message}`);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setConnectionStatus("disconnected");

        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // Auto-reconnect after 5 seconds unless it was a clean close
        if (event.code !== 1000 && enabled && symbol) {
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 5000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus("error");
        logWarningToSystem(`WebSocket connection error for ${symbol}`);
      };

    } catch (error) {
      console.error('❌ Failed to establish WebSocket connection:', error);
      setConnectionStatus("error");
      logWarningToSystem(`Failed to connect WebSocket for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [symbol, timeframe, enabled, createCandleFromPrice, updateCandleWithPrice]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket for streaming candle data');
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setConnectionStatus("disconnected");
    currentCandleRef.current = null;
  }, []);

  // Connect when symbol or timeframe changes
  useEffect(() => {
    if (enabled && symbol) {
      console.log('🔄 Symbol or timeframe changed, reconnecting...');
      disconnect();
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [symbol, timeframe, enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    streamingCandle,
    connectionStatus,
    lastUpdateTime,
    connect,
    disconnect,
  };
};
import { useState, useEffect, useCallback, useRef } from 'react';

interface PriceUpdate {
  type: 'price_update';
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface ConnectionStatus {
  type: 'connection';
  status: 'ready' | 'connected' | 'disconnected' | 'error';
  symbol?: string;
  message?: string;
}

type WebSocketMessage = PriceUpdate | ConnectionStatus | { type: 'error'; message: string };

interface UseRealtimePriceStreamReturn {
  priceData: PriceUpdate | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean;
  reconnect: () => void;
}

export const useRealtimePriceStream = (
  symbol: string | null,
  enabled: boolean = true
): UseRealtimePriceStreamReturn => {
  const [priceData, setPriceData] = useState<PriceUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const currentSymbolRef = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !symbol) {
      return;
    }

    // Don't reconnect if already connecting or connected to the same symbol
    if (
      wsRef.current && 
      (wsRef.current.readyState === WebSocket.CONNECTING || 
       wsRef.current.readyState === WebSocket.OPEN) &&
      currentSymbolRef.current === symbol
    ) {
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus('connecting');
    currentSymbolRef.current = symbol;

    const wsUrl = `wss://alzxeplijnbpuqkfnpjk.supabase.co/functions/v1/websocket-price-stream`;
    console.log(`Connecting to WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected, subscribing to', symbol);
      // Subscribe to symbol
      ws.send(JSON.stringify({
        action: 'subscribe',
        symbol: symbol
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message:', data);

        if (data.type === 'connection') {
          if (data.status === 'connected') {
            setConnectionStatus('connected');
          } else if (data.status === 'disconnected') {
            setConnectionStatus('disconnected');
          } else if (data.status === 'error') {
            setConnectionStatus('error');
          }
        } else if (data.type === 'price_update') {
          setPriceData(data);
          if (connectionStatus !== 'connected') {
            setConnectionStatus('connected');
          }
        } else if (data.type === 'error') {
          console.error('WebSocket error message:', data.message);
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setConnectionStatus('disconnected');
      
      // Auto-reconnect after 3 seconds if still enabled
      if (enabled && symbol) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('Auto-reconnecting...');
          connect();
        }, 3000);
      }
    };

    return ws;
  }, [symbol, enabled, connectionStatus]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  useEffect(() => {
    if (enabled && symbol) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        currentSymbolRef.current = null;
        wsRef.current.close();
      }
    };
  }, [symbol, enabled, connect]);

  return {
    priceData,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    reconnect,
  };
};

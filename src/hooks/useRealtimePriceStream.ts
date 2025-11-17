import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  lastUpdateTime: number | null;
  isPolling: boolean;
}

export const useRealtimePriceStream = (
  symbol: string | null,
  enabled: boolean = true
): UseRealtimePriceStreamReturn => {
  const [priceData, setPriceData] = useState<PriceUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const currentSymbolRef = useRef<string | null>(null);
  const statusDebounceRef = useRef<number | null>(null);
  const stableConnectionRef = useRef<boolean>(false);

  const setStableConnectionStatus = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    // Clear any pending status updates
    if (statusDebounceRef.current) {
      clearTimeout(statusDebounceRef.current);
    }

    // Debounce status changes to prevent flashing (300ms delay)
    statusDebounceRef.current = window.setTimeout(() => {
      setConnectionStatus(status);
      if (status === 'connected') {
        stableConnectionRef.current = true;
      } else if (status === 'disconnected' || status === 'error') {
        stableConnectionRef.current = false;
      }
    }, 300);
  }, []);

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

    // Only show connecting if not already connected
    if (!stableConnectionRef.current) {
      setStableConnectionStatus('connecting');
    }
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
            setStableConnectionStatus('connected');
          } else if (data.status === 'disconnected') {
            setStableConnectionStatus('disconnected');
          } else if (data.status === 'error') {
            setStableConnectionStatus('error');
          }
        } else if (data.type === 'price_update') {
          setPriceData(data);
          setLastUpdateTime(Date.now());
          // Only stop polling and update status once
          setIsPolling((prev) => {
            if (prev) {
              // Only set connected status when transitioning from polling
              setStableConnectionStatus('connected');
              return false;
            }
            return prev;
          });
        } else if (data.type === 'error') {
          console.error('WebSocket error message:', data.message);
          setStableConnectionStatus('error');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStableConnectionStatus('error');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setStableConnectionStatus('disconnected');
      
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

  // Polling fallback when WebSocket is disconnected
  const startPolling = useCallback(async () => {
    if (!symbol || !enabled) return;

    setIsPolling(true);
    console.log('Starting polling fallback for', symbol);

    const poll = async () => {
      try {
        // Try CoinGlass chart data first
        const { data, error } = await supabase.functions.invoke('fetch-chart-data', {
          body: { symbol, days: 1 }
        });

        if (!error && data?.timeframes?.['1m']?.candles?.length > 0) {
          const latestCandle = data.timeframes['1m'].candles[data.timeframes['1m'].candles.length - 1];
          const mockPriceUpdate: PriceUpdate = {
            type: 'price_update',
            symbol,
            price: latestCandle.close,
            volume: latestCandle.volume,
            change24h: 0,
            high24h: latestCandle.high,
            low24h: latestCandle.low,
            timestamp: Date.now()
          };
          setPriceData(mockPriceUpdate);
          setLastUpdateTime(Date.now());
          return; // Success - exit early
        }

        // Fallback to Tatum if CoinGlass fails
        console.log('CoinGlass polling failed, trying Tatum API...');
        const tatumResponse = await supabase.functions.invoke('fetch-tatum-price', {
          body: { symbol }
        });

        if (!tatumResponse.error && tatumResponse.data?.price && !tatumResponse.data.unavailable) {
          const tatumPriceUpdate: PriceUpdate = {
            type: 'price_update',
            symbol,
            price: tatumResponse.data.price,
            volume: tatumResponse.data.volume || 0,
            change24h: tatumResponse.data.change24h || 0,
            high24h: tatumResponse.data.high24h || 0,
            low24h: tatumResponse.data.low24h || 0,
            timestamp: Date.now()
          };
          setPriceData(tatumPriceUpdate);
          setLastUpdateTime(Date.now());
          console.log('✅ Using Tatum price:', tatumResponse.data.price);
        } else {
          console.error('Both CoinGlass and Tatum polling failed');
        }

      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Poll immediately, then every 60 seconds
    poll();
    pollingIntervalRef.current = window.setInterval(poll, 60000);
  }, [symbol, enabled]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
      console.log('Stopped polling fallback');
    }
  }, []);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    stopPolling();
    connect();
  }, [connect, stopPolling]);

  // Start polling fallback when disconnected or error
  useEffect(() => {
    if ((connectionStatus === 'disconnected' || connectionStatus === 'error') && enabled && symbol) {
      const timeout = setTimeout(() => {
        startPolling();
      }, 3000); // Wait 3s before starting polling
      return () => clearTimeout(timeout);
    } else if (connectionStatus === 'connected') {
      stopPolling();
    }
  }, [connectionStatus, enabled, symbol, startPolling, stopPolling]);

  useEffect(() => {
    if (enabled && symbol) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
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
    lastUpdateTime,
    isPolling,
  };
};

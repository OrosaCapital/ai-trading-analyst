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
  const heartbeatIntervalRef = useRef<number | null>(null);

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
      
      // ✅ OCAPX Rule 2: Client-side heartbeat (check every 20s)
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      heartbeatIntervalRef.current = window.setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn('⚠️ WebSocket not OPEN, triggering reconnect...');
          reconnect();
        } else {
          // Send ping to keep connection alive
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 20000);
    };

    ws.onmessage = async (event) => {
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
          // ✅ OCAPX Rule 2: Reject stale messages (>15s old)
          if (data.timestamp < Date.now() - 15000) {
            console.warn(`⚠️ Stale price rejected: ${symbol} price from ${new Date(data.timestamp).toISOString()}`);
            return;
          }
          
          // ✅ OCAPX Rule 3: Anomaly detection (>10% price jump)
          const oldPrice = priceData?.price || null;
          const newPrice = data.price;
          
          if (oldPrice && Math.abs((newPrice - oldPrice) / oldPrice) > 0.10) {
            console.warn(`🚨 Price anomaly detected: ${symbol} jumped ${((newPrice - oldPrice) / oldPrice * 100).toFixed(2)}%`);
            console.warn(`   Old: $${oldPrice.toFixed(4)} → New: $${newPrice.toFixed(4)}`);
            
            // Verify with Tatum API
            try {
              const { data: tatumData, error } = await supabase.functions.invoke('fetch-tatum-price', {
                body: { symbol }
              });
              
              if (!error && tatumData?.price) {
                const tatumPrice = parseFloat(tatumData.price);
                const deviation = Math.abs((tatumPrice - newPrice) / tatumPrice);
                
                if (deviation < 0.05) {
                  console.log(`✅ Tatum confirms price: ${tatumPrice} (${(deviation * 100).toFixed(2)}% deviation)`);
                  data.price = tatumPrice;
                } else {
                  console.warn(`⚠️ Tatum price differs: ${tatumPrice} vs ${newPrice} (${(deviation * 100).toFixed(2)}% deviation)`);
                  data.price = tatumPrice; // Use Tatum as more reliable
                }
              } else {
                console.error('❌ Tatum verification failed, rejecting suspicious price');
                return;
              }
            } catch (error) {
              console.error('Tatum verification error:', error);
              return;
            }
          }
          
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
      
      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
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
    console.log(`🔄 Starting Tatum polling fallback for ${symbol}`);

    const poll = async () => {
      try {
        // ✅ OCAPX Rule 7: Use Tatum as reliable fallback
        const { data: tatumData, error } = await supabase.functions.invoke('fetch-tatum-price', {
          body: { symbol }
        });

        if (!error && tatumData?.price) {
          const price = parseFloat(tatumData.price);
          console.log(`✅ Tatum polling: ${symbol} = $${price}`);

          const mockPriceUpdate: PriceUpdate = {
            type: 'price_update',
            symbol,
            price: price,
            volume: 0,
            change24h: 0,
            high24h: price,
            low24h: price,
            timestamp: Date.now()
          };
          setPriceData(mockPriceUpdate);
          setLastUpdateTime(Date.now());
          return;
        }

        // If Tatum fails, try CoinGlass chart data
        const { data: chartData, error: chartError } = await supabase.functions.invoke('fetch-chart-data', {
          body: { symbol, days: 1 }
        });

        if (!chartError && chartData?.timeframes?.['1m']?.candles?.length > 0) {
          const latestCandle = chartData.timeframes['1m'].candles[chartData.timeframes['1m'].candles.length - 1];
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
          return;
        }

        console.log('Both Tatum and CoinGlass polling failed, using last known price');

      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Poll immediately, then every 10 seconds
    poll();
    pollingIntervalRef.current = window.setInterval(poll, 10000);
  }, [symbol, enabled, priceData]);

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
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
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

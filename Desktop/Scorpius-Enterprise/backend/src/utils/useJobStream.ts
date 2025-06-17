import { useEffect, useRef, useState, useCallback } from 'react';

interface JobStreamOptions {
  onComplete?: (data: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (data: any) => void;
  maxReconnectAttempts?: number;
}

export function useJobStream(jobId: string | null, module: string, options: JobStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.maxReconnectAttempts || 3;

  const connect = useCallback(() => {
    if (!jobId) return;

    const wsUrl = `ws://localhost:8000/ws/${module}/${jobId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents(prev => [...prev, data]);
        
        if (data.type === 'progress' && options.onProgress) {
          options.onProgress(data);
        } else if (data.type === 'completed' && options.onComplete) {
          options.onComplete(data);
        } else if (data.type === 'error' && options.onError) {
          options.onError(new Error(data.message));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        setTimeout(connect, 1000 * reconnectAttemptsRef.current);
      } else {
        setError(new Error('WebSocket connection failed after maximum retry attempts'));
      }
    };

    ws.onerror = () => {
      setError(new Error('WebSocket connection error'));
    };
  }, [jobId, module, options, maxReconnectAttempts]);

  useEffect(() => {
    if (jobId) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, jobId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    events,
    error,
    disconnect
  };
}

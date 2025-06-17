import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import type { MempoolSession } from '@/types/api';

export function useStartMempoolSession() {
  const [isPending, setIsPending] = useState(false);
  
  const mutateAsync = useCallback(async (): Promise<MempoolSession> => {
    setIsPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/mempool/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to start mempool session');
      return response.json();
    } finally {
      setIsPending(false);
    }
  }, []);
  
  return { mutateAsync, isPending };
}

export function useMempoolSessionStatus(sessionId: string | null) {
  const [data, setData] = useState<MempoolSession | null>(null);
  
  const fetchStatus = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/mempool/session/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session status');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch session status:', error);
    }
  }, [sessionId]);
  
  return { data, refetch: fetchStatus };
}

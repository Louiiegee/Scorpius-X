import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import type { ReplayJob } from '@/types/api';

export function useStartReplay() {
  const [isPending, setIsPending] = useState(false);
  
  const mutateAsync = useCallback(async (target: string): Promise<ReplayJob> => {
    setIsPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/time-machine/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      if (!response.ok) throw new Error('Failed to start replay');
      return response.json();
    } finally {
      setIsPending(false);
    }
  }, []);
  
  return { mutateAsync, isPending };
}

export function useReplayStatus(replayId: string | null) {
  const [data, setData] = useState<ReplayJob | null>(null);
  
  const fetchStatus = useCallback(async () => {
    if (!replayId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/time-machine/replay/${replayId}`);
      if (!response.ok) throw new Error('Failed to fetch replay status');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch replay status:', error);
    }
  }, [replayId]);
  
  return { data, refetch: fetchStatus };
}

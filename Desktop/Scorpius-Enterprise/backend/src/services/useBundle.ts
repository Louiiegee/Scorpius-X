import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import type { MevBundle } from '@/types/api';

export function useExecuteBundle() {
  const [isPending, setIsPending] = useState(false);
  
  const mutateAsync = useCallback(async (bundleData: any): Promise<MevBundle> => {
    setIsPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/mevbot/bundle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundleData)
      });
      if (!response.ok) throw new Error('Failed to execute bundle');
      return response.json();
    } finally {
      setIsPending(false);
    }
  }, []);
  
  return { mutateAsync, isPending };
}

export function useBundleStatus(bundleId: string | null) {
  const [data, setData] = useState<MevBundle | null>(null);
  
  const fetchStatus = useCallback(async () => {
    if (!bundleId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/mevbot/bundle/${bundleId}`);
      if (!response.ok) throw new Error('Failed to fetch bundle status');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch bundle status:', error);
    }
  }, [bundleId]);
  
  return { data, refetch: fetchStatus };
}

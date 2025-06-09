import { useState, useEffect, useCallback } from "react";
import { useRealtimeData } from "@/services/websocket";

// Generic hook for API data with loading states
export const useAPIData = <T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  realTimeChannel?: string,
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time updates if channel provided
  useEffect(() => {
    if (realTimeChannel) {
      const unsubscribe = useRealtimeData[
        realTimeChannel as keyof typeof useRealtimeData
      ]?.((newData: T) => {
        setData(newData);
      });
      return unsubscribe;
    }
  }, [realTimeChannel]);

  return { data, loading, error, refetch: fetchData };
};

// Specific hooks for different data types
export const useDashboardStats = () => {
  return useAPIData(
    async () => {
      const response = await fetch("/api/dashboard/stats");
      return response.json();
    },
    [],
    "dashboardStats",
  );
};

export const useMEVStrategies = () => {
  return useAPIData(
    async () => {
      const response = await fetch("/api/mev/strategies");
      return response.json();
    },
    [],
    "mevOpportunities",
  );
};

export const useMempoolData = () => {
  return useAPIData(
    async () => {
      const response = await fetch("/api/mempool/live");
      return response.json();
    },
    [],
    "mempoolData",
  );
};

export const useSecurityAlerts = () => {
  return useAPIData(
    async () => {
      const response = await fetch("/api/mempool/alerts");
      return response.json();
    },
    [],
    "securityAlerts",
  );
};

export const useSystemHealth = () => {
  return useAPIData(
    async () => {
      const response = await fetch("/api/system/health");
      return response.json();
    },
    [],
    "systemHealth",
  );
};

export const useContractScan = (contractAddress: string | null) => {
  return useAPIData(
    async () => {
      if (!contractAddress) return null;
      const response = await fetch("/api/scanner/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_address: contractAddress }),
      });
      return response.json();
    },
    [contractAddress],
    "scanResults",
  );
};

// Hook for mutations (POST, PUT, DELETE operations)
export const useAPIMutation = <T, P>(mutationFn: (params: P) => Promise<T>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (params: P): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await mutationFn(params);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Mutation failed";
        setError(errorMessage);
        console.error("Mutation Error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn],
  );

  return { mutate, loading, error };
};

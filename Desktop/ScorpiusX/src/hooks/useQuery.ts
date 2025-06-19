/**
 * Custom hooks for data fetching with React Query
 * Provides consistent patterns for API interactions
 */

import {
  useQuery as useReactQuery,
  useMutation as useReactMutation,
  useQueryClient,
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { httpClient } from "@/services/httpClient";
import { logger } from "@/config/env";
import type { ApiResponse } from "@/types/generated";

// Query key factory for consistent cache management
export const queryKeys = {
  // Auth queries
  auth: {
    user: () => ["auth", "user"] as const,
  },
  // Dashboard queries
  dashboard: {
    all: () => ["dashboard"] as const,
    stats: () => ["dashboard", "stats"] as const,
    alerts: (filters?: Record<string, any>) =>
      ["dashboard", "alerts", filters] as const,
    charts: () => ["dashboard", "charts"] as const,
  },
  // Scanner queries
  scanner: {
    all: () => ["scanner"] as const,
    results: (filters?: Record<string, any>) =>
      ["scanner", "results", filters] as const,
    result: (id: string) => ["scanner", "result", id] as const,
  },
  // MEV queries
  mev: {
    all: () => ["mev"] as const,
    strategies: (filters?: Record<string, any>) =>
      ["mev", "strategies", filters] as const,
    strategy: (id: string) => ["mev", "strategy", id] as const,
    performance: () => ["mev", "performance"] as const,
  },
  // Mempool queries
  mempool: {
    all: () => ["mempool"] as const,
    transactions: (filters?: Record<string, any>) =>
      ["mempool", "transactions", filters] as const,
    alerts: (filters?: Record<string, any>) =>
      ["mempool", "alerts", filters] as const,
    live: () => ["mempool", "live"] as const,
  },
  // System queries
  system: {
    all: () => ["system"] as const,
    health: () => ["system", "health"] as const,
  },
  // Scheduler queries
  scheduler: {
    all: () => ["scheduler"] as const,
    jobs: (filters?: Record<string, any>) =>
      ["scheduler", "jobs", filters] as const,
    job: (id: string) => ["scheduler", "job", id] as const,
  },
} as const;

// Custom useQuery hook with consistent error handling
export function useQuery<T = any>(
  key: QueryKey,
  endpoint: string,
  options: Omit<UseQueryOptions<ApiResponse<T>>, "queryKey" | "queryFn"> = {},
) {
  return useReactQuery({
    queryKey: key,
    queryFn: async () => {
      logger.debug("Fetching data for query:", key);
      return httpClient.get<T>(endpoint);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if ((error as any)?.response?.status === 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    ...options,
  });
}

// Custom useMutation hook with consistent patterns
export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: UseMutationOptions<ApiResponse<TData>, Error, TVariables> & {
    onSuccessInvalidate?: QueryKey[];
  } = {},
) {
  const queryClient = useQueryClient();
  const { onSuccessInvalidate, ...mutationOptions } = options;

  return useReactMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate specified query keys
      if (onSuccessInvalidate) {
        onSuccessInvalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Call user-provided onSuccess
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      logger.error("Mutation failed:", error);
      options.onError?.(error, variables, context);
    },
    ...mutationOptions,
  });
}

// Prefetch utility
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchQuery: <T = any>(key: QueryKey, endpoint: string) => {
      return queryClient.prefetchQuery({
        queryKey: key,
        queryFn: () => httpClient.get<T>(endpoint),
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}

// Optimistic update utilities
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  return {
    updateQueryData: <T>(key: QueryKey, updater: (old: T | undefined) => T) => {
      queryClient.setQueryData(key, updater);
    },

    rollbackQueryData: <T>(key: QueryKey, previousData: T) => {
      queryClient.setQueryData(key, previousData);
    },
  };
}

// Infinite query hook for pagination
export function useInfiniteQuery<T = any>(
  key: QueryKey,
  endpoint: string,
  options: {
    limit?: number;
    getNextPageParam?: (
      lastPage: ApiResponse<T>,
      pages: ApiResponse<T>[],
    ) => any;
  } = {},
) {
  const { limit = 20, getNextPageParam, ...queryOptions } = options;

  return useReactQuery({
    queryKey: key,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
      });

      return httpClient.get<T>(`${endpoint}?${params}`);
    },
    getNextPageParam:
      getNextPageParam ||
      ((lastPage: any) => {
        const pagination = lastPage.data?.pagination;
        return pagination?.hasNext ? pagination.page + 1 : undefined;
      }),
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Real-time data hook with polling
export function useRealTimeQuery<T = any>(
  key: QueryKey,
  endpoint: string,
  options: {
    interval?: number;
    enabled?: boolean;
  } = {},
) {
  const { interval = 30000, enabled = true } = options;

  return useQuery<T>(key, endpoint, {
    refetchInterval: enabled ? interval : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled,
  });
}

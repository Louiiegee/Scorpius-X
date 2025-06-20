/**
 * React Query Provider Setup
 * Configures React Query with consistent defaults
 */

import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { config, logger, isDevelopment } from "@/config/env";

// Error handling for queries and mutations
const handleError = (error: Error, type: "query" | "mutation") => {
  logger.error(`${type} error:`, error);

  // Handle specific error types
  if ((error as any)?.apiError) {
    const apiError = (error as any).apiError;

    // Emit custom events for global error handling
    window.dispatchEvent(
      new CustomEvent("api:error", {
        detail: { error: apiError, type },
      }),
    );

    // Handle auth errors
    if (apiError.code === "401" || apiError.code === "UNAUTHORIZED") {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
  }

  // Emit generic error event
  window.dispatchEvent(
    new CustomEvent("app:error", {
      detail: { error, type },
    }),
  );
};

// Create Query Client with optimized defaults
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes

        // Cache time - how long data stays in cache after component unmounts
        gcTime: 10 * 60 * 1000, // 10 minutes

        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on auth errors or client errors (4xx)
          const status = (error as any)?.response?.status;
          if (
            status === 401 ||
            status === 403 ||
            (status >= 400 && status < 500)
          ) {
            return false;
          }

          // Retry up to 3 times for server errors
          return failureCount < 3;
        },

        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Network mode
        networkMode: "online",

        // Refetch behavior
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Error handling
        throwOnError: false,
      },
      mutations: {
        // Retry mutations only on network errors
        retry: (failureCount, error) => {
          const isNetworkError =
            error instanceof TypeError && error.message === "Failed to fetch";
          return isNetworkError && failureCount < 2;
        },

        // Network mode
        networkMode: "online",

        // Error handling
        throwOnError: false,
      },
    },

    // Global query cache configuration
    queryCache: new QueryCache({
      onError: (error) => handleError(error as Error, "query"),
      onSuccess: (data, query) => {
        logger.debug(`Query success: ${query.queryKey.join("/")}`);
      },
    }),

    // Global mutation cache configuration
    mutationCache: new MutationCache({
      onError: (error) => handleError(error as Error, "mutation"),
      onSuccess: (data, variables, context, mutation) => {
        logger.debug(
          `Mutation success: ${(mutation as any).options?.mutationKey || "unknown"}`,
        );
      },
    }),
  });
};

interface QueryProviderProps {
  children: React.ReactNode;
  client?: QueryClient;
}

export function QueryProvider({ children, client }: QueryProviderProps) {
  // Use provided client or create a new one
  const queryClient = React.useMemo(
    () => client || createQueryClient(),
    [client],
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDevelopment() && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

// Hook to access query client
export function useQueryClient() {
  const client = React.useContext(QueryClientProvider as any);
  if (!client) {
    throw new Error("useQueryClient must be used within a QueryProvider");
  }
  return client;
}

// Pre-configured query client for use outside React components
export const globalQueryClient = createQueryClient();

// Utility functions
export const queryUtils = {
  // Invalidate all queries
  invalidateAll: () => {
    globalQueryClient.invalidateQueries();
  },

  // Clear all cached data
  clearAll: () => {
    globalQueryClient.clear();
  },

  // Reset all queries to initial state
  resetAll: () => {
    globalQueryClient.resetQueries();
  },

  // Prefetch data for better UX
  prefetch: async (queryKey: string[], queryFn: () => Promise<any>) => {
    return globalQueryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000,
    });
  },

  // Get cached data
  getQueryData: (queryKey: string[]) => {
    return globalQueryClient.getQueryData(queryKey);
  },

  // Set cached data
  setQueryData: (queryKey: string[], data: any) => {
    globalQueryClient.setQueryData(queryKey, data);
  },
};

// Error boundary for Query errors
export class QueryErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Query error boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

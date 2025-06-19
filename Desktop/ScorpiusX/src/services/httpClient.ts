/**
 * Global HTTP Client with interceptors
 * Handles auth headers, token refresh, and error formatting
 */

import { config, logger } from "@/config/env";
import { authService } from "./auth";
import type { ApiResponse, ApiError } from "@/types/generated";

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  baseURL?: string;
}

export interface InterceptorConfig {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onResponse?: (response: Response) => Response | Promise<Response>;
  onError?: (error: Error) => Error | Promise<Error>;
}

class HttpClient {
  private interceptors: InterceptorConfig[] = [];
  private defaultConfig: RequestConfig = {
    timeout: config.api.timeout,
    retries: 3,
    headers: {
      "Content-Type": "application/json",
    },
  };

  constructor() {
    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors() {
    // Auth interceptor
    this.addInterceptor({
      onRequest: async (config) => {
        const token = await authService.ensureValidToken();
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return config;
      },
    });

    // Error formatting interceptor
    this.addInterceptor({
      onError: async (error) => {
        return this.formatError(error);
      },
    });

    // Response interceptor
    this.addInterceptor({
      onResponse: async (response) => {
        if (response.status === 401) {
          logger.warn("Received 401, clearing auth tokens");
          await authService.logout();
          // Emit auth change event
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return response;
      },
    });
  }

  addInterceptor(interceptor: InterceptorConfig) {
    this.interceptors.push(interceptor);
  }

  private async applyRequestInterceptors(
    config: RequestConfig,
  ): Promise<RequestConfig> {
    let result = config;
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        result = await interceptor.onRequest(result);
      }
    }
    return result;
  }

  private async applyResponseInterceptors(
    response: Response,
  ): Promise<Response> {
    let result = response;
    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        result = await interceptor.onResponse(result);
      }
    }
    return result;
  }

  private async applyErrorInterceptors(error: Error): Promise<Error> {
    let result = error;
    for (const interceptor of this.interceptors) {
      if (interceptor.onError) {
        result = await interceptor.onError(result);
      }
    }
    return result;
  }

  private formatError(error: any): Error {
    // Network error
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return new Error("Network error: Unable to connect to server");
    }

    // API error with structured response
    if (error.response) {
      const apiError: ApiError = {
        code: error.response.status?.toString() || "UNKNOWN",
        message: error.message || "An error occurred",
        timestamp: new Date().toISOString(),
        details: error.response.data,
      };

      const formattedError = new Error(apiError.message);
      (formattedError as any).apiError = apiError;
      return formattedError;
    }

    return error;
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig,
    timeout: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private async fetchWithRetries(
    url: string,
    config: RequestConfig,
    retries: number,
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          config,
          config.timeout || this.defaultConfig.timeout!,
        );

        // Don't retry on successful responses or client errors (4xx)
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        // Server error - continue retrying
        throw new Error(`Server error: ${response.status}`);
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.debug(
            `Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private buildUrl(endpoint: string, baseURL?: string): string {
    const base = baseURL || config.api.baseUrl;
    return endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    try {
      // Merge with default config
      const config = {
        ...this.defaultConfig,
        ...options,
        headers: {
          ...this.defaultConfig.headers,
          ...options.headers,
        },
      };

      // Apply request interceptors
      const finalConfig = await this.applyRequestInterceptors(config);

      // Build URL
      const url = this.buildUrl(endpoint, finalConfig.baseURL);

      logger.debug(`Making ${finalConfig.method || "GET"} request to:`, url);

      // Make request with retries
      const response = await this.fetchWithRetries(
        url,
        finalConfig,
        finalConfig.retries || 0,
      );

      // Apply response interceptors
      const finalResponse = await this.applyResponseInterceptors(response);

      // Handle non-ok responses
      if (!finalResponse.ok) {
        const errorData = await finalResponse.text();
        let errorMessage = `HTTP ${finalResponse.status}: ${finalResponse.statusText}`;

        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // Not JSON, use status text
        }

        const error = new Error(errorMessage);
        (error as any).response = {
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          data: errorData,
        };
        throw error;
      }

      // Parse response
      const data = await finalResponse.json();

      logger.debug("Request successful:", url);

      return data;
    } catch (error) {
      const formattedError = await this.applyErrorInterceptors(error as Error);
      logger.error("Request failed:", endpoint, formattedError);
      throw formattedError;
    }
  }

  // Convenience methods
  get<T = any>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  post<T = any>(endpoint: string, data?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T = any>(endpoint: string, data?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T = any>(endpoint: string, data?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T = any>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  // File upload helper
  async upload<T = any>(
    endpoint: string,
    file: File,
    fieldName: string = "file",
    additionalData?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
      });
    }

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }
}

// Export singleton instance
export const httpClient = new HttpClient();

// Export class for testing
export { HttpClient };

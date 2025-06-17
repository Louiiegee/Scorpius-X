import authService, { UserTier, JWTClaims } from "@/hooks/useAuth";
import featureFlagService from "@/hooks/useFeatureFlags";

export interface APIRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  feature?: string;
  rateLimitKey?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  headers?: Record<string, string>;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: number;
  };
}

export interface RateLimitInfo {
  windowMs: number;
  maxRequests: number;
  currentRequests: number;
  resetTime: number;
}

class APIMiddleware {  private readonly API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  private rateLimitCache = new Map<string, RateLimitInfo>();

  // Tier-based rate limits (requests per hour)
  private readonly TIER_RATE_LIMITS: Record<UserTier, number> = {
    community: 100,
    starter: 1000,
    pro: 5000,
    enterprise: 25000,
  };

  // Feature-specific rate limits
  private readonly FEATURE_RATE_LIMITS: Record<
    string,
    Record<UserTier, number>
  > = {
    scanner: {
      community: 10,
      starter: 50,
      pro: 200,
      enterprise: 1000,
    },
    mev_analysis: {
      community: 0,
      starter: 20,
      pro: 100,
      enterprise: 500,
    },
    export_pdf: {
      community: 0,
      starter: 10,
      pro: 50,
      enterprise: 200,
    },
    simulation: {
      community: 0,
      starter: 0,
      pro: 10,
      enterprise: 50,
    },
  };

  // Extract JWT claims from token
  private extractClaims(token: string): JWTClaims | null {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  // Check if token is valid and not expired
  private isTokenValid(claims: JWTClaims): boolean {
    const now = Date.now() / 1000;
    return claims.exp > now;
  }

  // Get rate limit for user tier and feature
  private getRateLimit(tier: UserTier, feature?: string): number {
    if (feature && this.FEATURE_RATE_LIMITS[feature]) {
      return this.FEATURE_RATE_LIMITS[feature][tier];
    }
    return this.TIER_RATE_LIMITS[tier];
  }

  // Check rate limit
  private checkRateLimit(
    key: string,
    limit: number,
  ): { allowed: boolean; info: RateLimitInfo } {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour window

    let rateLimitInfo = this.rateLimitCache.get(key);

    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      // Reset or create new rate limit window
      rateLimitInfo = {
        windowMs,
        maxRequests: limit,
        currentRequests: 0,
        resetTime: now + windowMs,
      };
    }

    const allowed = rateLimitInfo.currentRequests < rateLimitInfo.maxRequests;

    if (allowed) {
      rateLimitInfo.currentRequests++;
      this.rateLimitCache.set(key, rateLimitInfo);
    }

    return { allowed, info: rateLimitInfo };
  }

  // Validate request against tier and feature flags
  private async validateRequest(request: APIRequest): Promise<{
    valid: boolean;
    error?: string;
    statusCode?: number;
    claims?: JWTClaims;
  }> {
    const authHeader = request.headers?.Authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return {
        valid: false,
        error: "Missing or invalid authorization header",
        statusCode: 401,
      };
    }

    const token = authHeader.substring(7);
    const claims = this.extractClaims(token);

    if (!claims) {
      return {
        valid: false,
        error: "Invalid token format",
        statusCode: 401,
      };
    }

    if (!this.isTokenValid(claims)) {
      return {
        valid: false,
        error: "Token expired",
        statusCode: 401,
      };
    }

    // Check feature access if specified
    if (request.feature) {
      const hasFeature = featureFlagService.isFeatureEnabled(
        request.feature,
        claims.tier,
        claims.permissions,
      );

      if (!hasFeature) {
        return {
          valid: false,
          error: `Feature '${request.feature}' not available for ${claims.tier} tier`,
          statusCode: 403,
        };
      }

      // Check feature limits
      const limitCheck = featureFlagService.checkFeatureLimits(
        request.feature,
        claims.tier,
        claims.permissions,
      );

      if (!limitCheck.allowed) {
        return {
          valid: false,
          error: limitCheck.reason,
          statusCode: limitCheck.upgradeRequired ? 402 : 429,
        };
      }
    }

    // Check rate limits
    const rateLimitKey =
      request.rateLimitKey || `${claims.sub}:${request.feature || "general"}`;
    const rateLimit = this.getRateLimit(claims.tier, request.feature);
    const { allowed, info } = this.checkRateLimit(rateLimitKey, rateLimit);

    if (!allowed) {
      return {
        valid: false,
        error: `Rate limit exceeded. Limit: ${info.maxRequests} requests per hour`,
        statusCode: 429,
      };
    }

    return { valid: true, claims };
  }

  // Make API request with middleware validation
  async request<T = any>(request: APIRequest): Promise<APIResponse<T>> {
    // Add authentication header if not present
    if (!request.headers?.Authorization) {
      const authHeader = authService.getAuthHeader();
      if (authHeader) {
        request.headers = { ...request.headers, Authorization: authHeader };
      }
    }

    // Validate request
    const validation = await this.validateRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        statusCode: validation.statusCode!,
      };
    }

    try {
      const url = request.url.startsWith("http")
        ? request.url
        : `${this.API_BASE}${request.url}`;

      const fetchOptions: RequestInit = {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          ...request.headers,
        },
      };

      if (request.body && request.method !== "GET") {
        fetchOptions.body =
          typeof request.body === "string"
            ? request.body
            : JSON.stringify(request.body);
      }

      const response = await fetch(url, fetchOptions);

      // Extract rate limit info from response headers
      const rateLimitInfo = {
        limit: parseInt(response.headers.get("X-RateLimit-Limit") || "0"),
        remaining: parseInt(
          response.headers.get("X-RateLimit-Remaining") || "0",
        ),
        resetTime: parseInt(response.headers.get("X-RateLimit-Reset") || "0"),
      };

      let data: T | undefined;
      let error: string | undefined;

      const contentType = response.headers.get("Content-Type") || "";

      if (contentType.includes("application/json")) {
        const jsonResponse = await response.json();
        if (response.ok) {
          data = jsonResponse;
        } else {
          error =
            jsonResponse.message || jsonResponse.error || "API request failed";
        }
      } else if (response.ok) {
        data = (await response.text()) as T;
      } else {
        error = `HTTP ${response.status}: ${response.statusText}`;
      }

      // Record feature usage if successful
      if (response.ok && request.feature && validation.claims) {
        featureFlagService.recordFeatureUsage(
          request.feature,
          request.headers!.Authorization!.substring(7),
        );
      }

      return {
        success: response.ok,
        data,
        error,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        rateLimitInfo: rateLimitInfo.limit > 0 ? rateLimitInfo : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
      };
    }
  }

  // Convenience methods for different HTTP verbs
  async get<T = any>(
    url: string,
    options?: Partial<APIRequest>,
  ): Promise<APIResponse<T>> {
    return this.request<T>({ ...options, url, method: "GET" });
  }

  async post<T = any>(
    url: string,
    body?: any,
    options?: Partial<APIRequest>,
  ): Promise<APIResponse<T>> {
    return this.request<T>({ ...options, url, method: "POST", body });
  }

  async put<T = any>(
    url: string,
    body?: any,
    options?: Partial<APIRequest>,
  ): Promise<APIResponse<T>> {
    return this.request<T>({ ...options, url, method: "PUT", body });
  }

  async delete<T = any>(
    url: string,
    options?: Partial<APIRequest>,
  ): Promise<APIResponse<T>> {
    return this.request<T>({ ...options, url, method: "DELETE" });
  }

  // Upload file with tier-based limits
  async uploadFile(
    url: string,
    file: File,
    options?: Partial<APIRequest>,
  ): Promise<APIResponse> {
    // Check file size limits based on tier
    const authHeader = authService.getAuthHeader();
    if (!authHeader) {
      return {
        success: false,
        error: "Authentication required for file upload",
        statusCode: 401,
      };
    }

    const token = authHeader.substring(7);
    const claims = this.extractClaims(token);

    if (!claims) {
      return {
        success: false,
        error: "Invalid authentication token",
        statusCode: 401,
      };
    }

    // Tier-based file size limits (in MB)
    const fileSizeLimits = {
      community: 5,
      starter: 25,
      pro: 100,
      enterprise: 500,
    };

    const maxSize = fileSizeLimits[claims.tier] * 1024 * 1024; // Convert to bytes

    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size exceeds limit for ${claims.tier} tier (${fileSizeLimits[claims.tier]}MB)`,
        statusCode: 413,
      };
    }

    const formData = new FormData();
    formData.append("file", file);

    return this.request({
      ...options,
      url,
      method: "POST",
      headers: {
        ...options?.headers,
        // Don't set Content-Type for FormData, let browser set it
        Authorization: authHeader,
      },
      body: formData as any,
    });
  }

  // Get current rate limit status
  getRateLimitStatus(
    tier: UserTier,
    feature?: string,
  ): {
    limit: number;
    used: number;
    remaining: number;
    resetTime: number;
  } {
    const limit = this.getRateLimit(tier, feature);
    const key = `${authService.getUser()?.id}:${feature || "general"}`;
    const info = this.rateLimitCache.get(key);

    if (!info) {
      return {
        limit,
        used: 0,
        remaining: limit,
        resetTime: Date.now() + 60 * 60 * 1000,
      };
    }

    return {
      limit: info.maxRequests,
      used: info.currentRequests,
      remaining: Math.max(0, info.maxRequests - info.currentRequests),
      resetTime: info.resetTime,
    };
  }

  // Clear rate limit cache
  clearRateLimitCache(): void {
    this.rateLimitCache.clear();
  }
}

export const apiMiddleware = new APIMiddleware();
export default apiMiddleware;

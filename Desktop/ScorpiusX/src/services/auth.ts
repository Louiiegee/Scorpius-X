/**
 * Central Authentication Handler
 * Supports JWT, OAuth2, and future auth providers
 */

import { config, logger } from "@/config/env";
import type {
  User,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  ApiError,
} from "@/types/generated";

export interface AuthProvider {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<LoginResponse>;
  getCurrentUser(): Promise<User>;
}

// JWT Auth Provider
class JWTAuthProvider implements AuthProvider {
  private readonly baseUrl = config.api.baseUrl;

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    logger.debug("Attempting login for user:", credentials.username);

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const result: LoginResponse = await response.json();

      // Store tokens securely
      this.storeTokens(result.accessToken, result.refreshToken);

      logger.info("Login successful for user:", result.user.username);
      return result;
    } catch (error) {
      logger.error("Login failed:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    logger.debug("Logging out user");

    try {
      const token = this.getAccessToken();
      if (token) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      logger.warn("Logout request failed:", error);
    } finally {
      this.clearTokens();
      logger.info("User logged out");
    }
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    logger.debug("Refreshing access token");

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || "Token refresh failed");
      }

      const result: LoginResponse = await response.json();
      this.storeTokens(result.accessToken, result.refreshToken);

      logger.debug("Token refreshed successfully");
      return result;
    } catch (error) {
      logger.error("Token refresh failed:", error);
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("No access token available");
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            const newTokens = await this.refreshToken(refreshToken);
            // Retry with new token
            return this.getCurrentUser();
          }
        }
        throw new Error("Failed to get current user");
      }

      return await response.json();
    } catch (error) {
      logger.error("Failed to get current user:", error);
      throw error;
    }
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(config.auth.tokenKey, accessToken);
    localStorage.setItem(config.auth.refreshTokenKey, refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.refreshTokenKey);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(config.auth.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(config.auth.refreshTokenKey);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  shouldRefreshToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = (payload.exp - currentTime) * 1000;
      return timeUntilExpiry < config.auth.refreshThreshold;
    } catch {
      return true;
    }
  }
}

// Mock Auth Provider for development
class MockAuthProvider implements AuthProvider {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    logger.debug("Mock login for:", credentials.username);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: "1",
      username: credentials.username,
      email: `${credentials.username}@scorpius.io`,
      role: "admin",
      permissions: ["*"],
      preferences: {
        theme: "dark",
        notifications: {
          email: true,
          push: true,
          slack: false,
          telegram: false,
          criticalThreats: true,
          mevOpportunities: true,
          systemAlerts: true,
        },
        dashboard: {
          refreshInterval: 30000,
          defaultCharts: ["threats", "performance"],
          layout: "expanded",
        },
      },
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockResponse: LoginResponse = {
      user: mockUser,
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600,
    };

    // Store mock tokens
    localStorage.setItem(config.auth.tokenKey, mockResponse.accessToken);
    localStorage.setItem(
      config.auth.refreshTokenKey,
      mockResponse.refreshToken,
    );

    return mockResponse;
  }

  async logout(): Promise<void> {
    logger.debug("Mock logout");
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.refreshTokenKey);
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    logger.debug("Mock token refresh");
    return this.login({ username: "mock-user", password: "mock-password" });
  }

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (!token) {
      throw new Error("No access token available");
    }

    return {
      id: "1",
      username: "mock-user",
      email: "mock-user@scorpius.io",
      role: "admin",
      permissions: ["*"],
      preferences: {
        theme: "dark",
        notifications: {
          email: true,
          push: true,
          slack: false,
          telegram: false,
          criticalThreats: true,
          mevOpportunities: true,
          systemAlerts: true,
        },
        dashboard: {
          refreshInterval: 30000,
          defaultCharts: ["threats", "performance"],
          layout: "expanded",
        },
      },
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

// Export singleton auth service
class AuthService {
  private provider: AuthProvider;

  constructor() {
    this.provider = config.features.mockMode
      ? new MockAuthProvider()
      : new JWTAuthProvider();
  }

  // Public API
  login = (credentials: LoginRequest) => this.provider.login(credentials);
  logout = () => this.provider.logout();
  getCurrentUser = () => this.provider.getCurrentUser();

  getToken(): string | null {
    return localStorage.getItem(config.auth.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    if (this.provider instanceof JWTAuthProvider) {
      return !this.provider.isTokenExpired(token);
    }

    return true; // Mock mode
  }

  async ensureValidToken(): Promise<string | null> {
    const token = this.getToken();
    if (!token) return null;

    if (this.provider instanceof JWTAuthProvider) {
      if (this.provider.shouldRefreshToken(token)) {
        const refreshToken = this.provider.getRefreshToken();
        if (refreshToken) {
          try {
            await this.provider.refreshToken(refreshToken);
            return this.getToken();
          } catch (error) {
            logger.error("Auto token refresh failed:", error);
            await this.logout();
            return null;
          }
        }
      }
    }

    return token;
  }
}

export const authService = new AuthService();

// Export provider classes for testing
export { JWTAuthProvider, MockAuthProvider };

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

export type UserTier = "community" | "starter" | "pro" | "enterprise";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  tier: UserTier;
  licenseKey?: string;
  organization?: string;
  limits: {
    maxConcurrentScans: number;
    exportLevel: "basic" | "standard" | "advanced" | "enterprise";
    accessWasm: boolean;
    apiCallsPerHour: number;
    customIntegrations: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
  };
  permissions: string[];
  subscription: {
    status: "active" | "expired" | "suspended" | "trial";
    expiresAt?: string;
    trialEndsAt?: string;
  };
  security: {
    mfaEnabled: boolean;
    fidoEnabled: boolean;
    lastLogin?: string;
    ipWhitelist?: string[];
  };
}

export interface JWTClaims {
  sub: string; // user id
  email: string;
  tier: UserTier;
  org?: string; // organization id
  permissions: string[];
  limits: UserProfile["limits"];
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
}

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  user?: UserProfile;
  token?: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  licenseKey?: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  licenseKey: string;
  name?: string;
  organization?: string;
}

class AuthService {  private readonly API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  private readonly TOKEN_KEY = "scorpius_token";
  private readonly REFRESH_TOKEN_KEY = "scorpius_refresh_token";
  private readonly USER_KEY = "scorpius_user";
  private readonly DEV_MODE = import.meta.env.DEV; // Add dev mode check

  private token: string | null = null;
  private refreshToken: string | null = null;
  private user: UserProfile | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
    this.setupTokenRefresh();
  }

  private loadFromStorage() {
    try {
      this.token = localStorage.getItem(this.TOKEN_KEY);
      this.refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const userData = localStorage.getItem(this.USER_KEY);
      this.user = userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to load auth data from storage:", error);
      this.clearAuth();
    }
  }

  private saveToStorage() {
    try {
      if (this.token) {
        localStorage.setItem(this.TOKEN_KEY, this.token);
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
      }

      if (this.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, this.refreshToken);
      } else {
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      }

      if (this.user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(this.user));
      } else {
        localStorage.removeItem(this.USER_KEY);
      }
    } catch (error) {
      console.error("Failed to save auth data to storage:", error);
    }
  }

  private clearAuth() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }  private setupTokenRefresh() {
    if (!this.token) return;

    console.log('🔧 Setting up token refresh for token:', this.token.substring(0, 20) + '...');

    try {
      // For simple tokens, set up refresh based on token age
      if (this.token.includes(':')) {
        console.log('📅 Processing simple token format');
        const [email, timestamp] = this.token.split(':');
        const tokenTime = parseInt(timestamp) * 1000;
        const currentTime = Date.now();
        const tokenAge = currentTime - tokenTime;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const refreshTime = maxAge - (5 * 60 * 1000); // Refresh 5 minutes before expiry
        const timeUntilRefresh = refreshTime - tokenAge;

        console.log('⏱️ Token refresh timing:', {
          tokenAge: Math.round(tokenAge / 1000) + 's',
          timeUntilRefresh: Math.round(timeUntilRefresh / 1000) + 's'
        });

        if (timeUntilRefresh > 0) {
          this.refreshTimeout = setTimeout(() => {
            this.refreshTokens();
          }, timeUntilRefresh);
        } else {
          // Token is already expired or close to expiry
          this.refreshTokens();
        }
        return;
      }

      // JWT token refresh logic (legacy) - only try if token has JWT format
      if (this.token.includes('.')) {
        console.log('🔐 Processing JWT token format');
        const payload = JSON.parse(atob(this.token.split(".")[1])) as JWTClaims;
        const now = Date.now() / 1000;
        const timeUntilRefresh = (payload.exp - now - 300) * 1000; // Refresh 5 minutes before expiry

        if (timeUntilRefresh > 0) {
          this.refreshTimeout = setTimeout(() => {
            this.refreshTokens();
          }, timeUntilRefresh);
        } else {
          // Token is already expired or close to expiry
          this.refreshTokens();
        }
        return;
      }

      console.log('⚠️ Unknown token format, skipping refresh setup');
    } catch (error) {
      console.error("❌ Token refresh setup failed:", error);
      // Don't clear auth here, just log the error
      // this.clearAuth();
    }
  }

  private async refreshTokens(): Promise<boolean> {
    if (!this.refreshToken) {
      this.clearAuth();
      return false;
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      this.token = data.token;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      this.saveToStorage();
      this.setupTokenRefresh();

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearAuth();
      return false;
    }
  }
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log('🔐 Attempting login with:', { 
        email: credentials.email, 
        hasPassword: !!credentials.password,
        apiBase: this.API_BASE 
      });
      
      const response = await fetch(`${this.API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      console.log('🌐 Login response status:', response.status);
      
      const data = await response.json();
      console.log('📝 Login response data:', data);

      if (!response.ok) {
        console.error('❌ Login failed with status:', response.status, 'Data:', data);
        return {
          success: false,
          error: data.message || data.detail || "Login failed",
        };
      }

      console.log('✅ Login successful, storing tokens...');
      this.token = data.token;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      this.saveToStorage();
      this.setupTokenRefresh();

      return {
        success: true,
        user: this.user!,
        token: this.token,
        refreshToken: this.refreshToken,
      };
    } catch (error) {
      console.error('🔥 Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Registration failed",
        };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async loginWithFIDO2(): Promise<AuthResult> {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // Request authentication challenge
      const challengeResponse = await fetch(
        `${this.API_BASE}/api/auth/fido2/challenge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!challengeResponse.ok) {
        throw new Error("Failed to get authentication challenge");
      }

      const challengeData = await challengeResponse.json();

      // Perform WebAuthn authentication
      const credential = (await navigator.credentials.get({
        publicKey: challengeData.options,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Authentication was cancelled");
      }

      // Send credential response to server
      const authResponse = await fetch(
        `${this.API_BASE}/api/auth/fido2/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              authenticatorData: Array.from(
                new Uint8Array(
                  (
                    credential.response as AuthenticatorAssertionResponse
                  ).authenticatorData,
                ),
              ),
              clientDataJSON: Array.from(
                new Uint8Array(credential.response.clientDataJSON),
              ),
              signature: Array.from(
                new Uint8Array(
                  (
                    credential.response as AuthenticatorAssertionResponse
                  ).signature,
                ),
              ),
              userHandle: (
                credential.response as AuthenticatorAssertionResponse
              ).userHandle
                ? Array.from(
                    new Uint8Array(
                      (
                        credential.response as AuthenticatorAssertionResponse
                      ).userHandle!,
                    ),
                  )
                : null,
            },
            type: credential.type,
          }),
        },
      );

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        return {
          success: false,
          error: authData.message || "FIDO2 authentication failed",
        };
      }

      this.token = authData.token;
      this.refreshToken = authData.refreshToken;
      this.user = authData.user;

      this.saveToStorage();
      this.setupTokenRefresh();

      return {
        success: true,
        user: this.user!,
        token: this.token,
        refreshToken: this.refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "FIDO2 authentication failed",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${this.API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      this.clearAuth();
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> {
    try {
      const response = await fetch(
        `${this.API_BASE}/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Password change failed",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async forgotPassword(email: string): Promise<AuthResult> {
    try {
      const response = await fetch(
        `${this.API_BASE}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Failed to send reset email",
        };
      }

      return { 
        success: true,
        message: data.message 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      const response = await fetch(
        `${this.API_BASE}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, newPassword }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Password reset failed",
        };
      }

      return { 
        success: true,
        message: data.message 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  getAuthHeader(): string | null {
    return this.token ? `Bearer ${this.token}` : null;
  }  isAuthenticated(): boolean {
    // Development bypass - remove this in production!
    // Temporarily disabled for testing
    /*
    if (this.DEV_MODE && localStorage.getItem('scorpius_dev_bypass') === 'true') {
      console.log('🔓 Development authentication bypass active');
      return true;
    }
    */

    console.log('🔍 Checking authentication status:', {
      hasToken: !!this.token,
      hasUser: !!this.user,
      token: this.token?.substring(0, 20) + '...' || 'null'
    });

    if (!this.token || !this.user) {
      console.log('❌ Authentication failed: missing token or user');
      return false;
    }

    try {
      // For simple tokens, we'll just check if they exist and are not expired
      // Simple token format: "email:timestamp"
      if (this.token.includes(':')) {
        const [email, timestamp] = this.token.split(':');
        const tokenTime = parseInt(timestamp) * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const tokenAge = currentTime - tokenTime;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        const isValid = tokenAge < maxAge;
        console.log('✅ Token validation result:', {
          email,
          tokenAge: Math.round(tokenAge / 1000) + 's',
          maxAge: Math.round(maxAge / 1000) + 's',
          isValid
        });
          return isValid; // Token is valid if less than 24 hours old
      }
      
      // Try JWT validation (legacy) - only for JWT format tokens
      if (this.token.includes('.')) {
        console.log('🔐 Validating JWT token format');
        const payload = JSON.parse(atob(this.token.split(".")[1])) as JWTClaims;
        return payload.exp > Date.now() / 1000;
      }
      
      // Unknown token format
      console.warn('⚠️ Unknown token format:', this.token.substring(0, 20) + '...');
      return false;
    } catch (error) {
      console.error('💥 Token validation error:', error);
      return false;
    }
  }getUser(): UserProfile | null {
    // Development bypass - return mock user data
    // Temporarily disabled for testing
    /*
    if (this.DEV_MODE && localStorage.getItem('scorpius_dev_bypass') === 'true') {
      return {
        id: 'dev-user-123',
        email: 'dev@scorpius.test',
        name: 'Development User',
        tier: 'enterprise',
        licenseKey: 'DEV-LICENSE-KEY',
        organization: 'Scorpius Development',
        limits: {
          maxConcurrentScans: 999,
          exportLevel: 'enterprise',
          accessWasm: true,
          apiCallsPerHour: 10000,
          customIntegrations: true,
          prioritySupport: true,
          whiteLabel: true,
        },
        permissions: [
          'admin_access',
          'manage_users',
          'manage_scans',
          'export_reports',
          'configure_settings',
          'view_analytics',
        ],
        subscription: {
          status: 'active',
          expiresAt: '2030-12-31T23:59:59Z',
        },
        security: {
          mfaEnabled: false,
          fidoEnabled: false,
          lastLogin: new Date().toISOString(),
        },
      };
    }
    */

    return this.user;
  }

  hasPermission(permission: string): boolean {
    return this.user?.permissions.includes(permission) || false;
  }

  hasFeature(feature: string): boolean {
    if (!this.user) return false;

    const tierFeatures = {
      community: ["basic_scanning", "public_reports"],
      starter: [
        "basic_scanning",
        "public_reports",
        "advanced_scanning",
        "pdf_exports",
        "basic_integrations",
      ],
      pro: [
        "basic_scanning",
        "public_reports",
        "advanced_scanning",
        "pdf_exports",
        "basic_integrations",
        "mev_analysis",
        "advanced_exports",
        "custom_integrations",
      ],
      enterprise: [
        "basic_scanning",
        "public_reports",
        "advanced_scanning",
        "pdf_exports",
        "basic_integrations",
        "mev_analysis",
        "advanced_exports",
        "custom_integrations",
        "white_label",
        "dedicated_support",
        "custom_deployment",
      ],
    };

    return tierFeatures[this.user.tier]?.includes(feature) || false;
  }

  canPerformAction(action: string, current: number = 0): boolean {
    if (!this.user) return false;

    switch (action) {
      case "start_scan":
        return current < this.user.limits.maxConcurrentScans;
      case "export_advanced":
        return ["advanced", "enterprise"].includes(
          this.user.limits.exportLevel,
        );
      case "access_wasm":
        return this.user.limits.accessWasm;
      case "custom_integrations":
        return this.user.limits.customIntegrations;
      default:
        return true;
    }
  }
}

const authService = new AuthService();

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated(),
  );

  console.log('🎯 useAuth hook state:', { 
    hasUser: !!user, 
    isAuthenticated,
    userEmail: user?.email 
  });

  // Update state when auth changes
  useEffect(() => {
    const checkAuth = () => {
      const newUser = authService.getUser();
      const newAuthStatus = authService.isAuthenticated();
      
      console.log('🔄 Auth check result:', {
        newUser: !!newUser,
        newAuthStatus,
        changed: newUser !== user || newAuthStatus !== isAuthenticated
      });
      
      setUser(newUser);
      setIsAuthenticated(newAuthStatus);
    };

    checkAuth();

    // Set up polling to check auth status
    const interval = setInterval(checkAuth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, isAuthenticated]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log('🚀 Login function called with:', { email: credentials.email });
    const result = await authService.login(credentials);
    console.log('📋 Login result received:', result);
    
    if (result.success) {
      console.log('✅ Setting auth state - User:', !!result.user, 'Token:', !!result.token);
      setUser(result.user!);
      setIsAuthenticated(true);
    } else {
      console.log('❌ Login failed, clearing auth state');
      setUser(null);
      setIsAuthenticated(false);
    }
    return result;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    return authService.register(credentials);
  }, []);

  const loginWithFIDO2 = useCallback(async () => {
    const result = await authService.loginWithFIDO2();
    if (result.success) {
      setUser(result.user!);
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      return authService.changePassword(currentPassword, newPassword);
    },
    [],
  );

  const forgotPassword = useCallback(
    async (email: string) => {
      return authService.forgotPassword(email);
    },
    [],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      return authService.resetPassword(token, newPassword);
    },
    [],
  );

  return {
    user,
    isAuthenticated,
    login,
    register,
    loginWithFIDO2,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    getAuthHeader: authService.getAuthHeader.bind(authService),
    hasPermission: authService.hasPermission.bind(authService),
    hasFeature: authService.hasFeature.bind(authService),
    canPerformAction: authService.canPerformAction.bind(authService),
  };
};

export default authService;

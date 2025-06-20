/**
 * Environment-driven configuration
 * All environment variables are validated and typed here
 */

interface AppConfig {
  // API Configuration
  api: {
    baseUrl: string;
    scannerUrl: string;
    mempoolUrl: string;
    mevUrl: string;
    timeout: number;
  };

  // Auth Configuration
  auth: {
    domain: string;
    refreshThreshold: number;
    tokenKey: string;
    refreshTokenKey: string;
  };

  // WebSocket Configuration
  websocket: {
    baseUrl: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
  };

  // Feature Flags
  features: {
    mockMode: boolean;
    websockets: boolean;
    analytics: boolean;
    debugMode: boolean;
  };

  // App Configuration
  app: {
    name: string;
    version: string;
    environment: "development" | "staging" | "production";
    logLevel: "debug" | "info" | "warn" | "error";
  };
}

// Validate required environment variables
const requiredEnvVars = [
  "VITE_API_BASE",
  "VITE_SCANNER_API_BASE",
  "VITE_MEMPOOL_API_BASE",
  "VITE_MEV_API_BASE",
] as const;

// Check for missing required environment variables
const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName],
);
if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}\n` +
      "Please check your .env file and ensure all required variables are set.",
  );
}

// Default values
const defaults = {
  API_TIMEOUT: 30000,
  AUTH_REFRESH_THRESHOLD: 300000, // 5 minutes
  WS_RECONNECT_INTERVAL: 5000,
  WS_MAX_RECONNECT_ATTEMPTS: 10,
};

// Create type-safe configuration object
export const config: AppConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE,
    scannerUrl: import.meta.env.VITE_SCANNER_API_BASE,
    mempoolUrl: import.meta.env.VITE_MEMPOOL_API_BASE,
    mevUrl: import.meta.env.VITE_MEV_API_BASE,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || defaults.API_TIMEOUT,
  },

  auth: {
    domain: import.meta.env.VITE_AUTH_DOMAIN || "auth.scorpius.io",
    refreshThreshold:
      Number(import.meta.env.VITE_AUTH_REFRESH_THRESHOLD) ||
      defaults.AUTH_REFRESH_THRESHOLD,
    tokenKey: "scorpius_token",
    refreshTokenKey: "scorpius_refresh_token",
  },

  websocket: {
    baseUrl: import.meta.env.VITE_WS_BASE || "ws://localhost:8000/ws",
    reconnectInterval: defaults.WS_RECONNECT_INTERVAL,
    maxReconnectAttempts: defaults.WS_MAX_RECONNECT_ATTEMPTS,
  },

  features: {
    mockMode: import.meta.env.VITE_ENABLE_MOCK_MODE === "true",
    websockets: import.meta.env.VITE_ENABLE_WEBSOCKETS !== "false",
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === "true",
  },

  app: {
    name: import.meta.env.VITE_APP_NAME || "Scorpius Cybersecurity Dashboard",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    environment:
      (import.meta.env.VITE_APP_ENV as AppConfig["app"]["environment"]) ||
      "development",
    logLevel:
      (import.meta.env.VITE_LOG_LEVEL as AppConfig["app"]["logLevel"]) ||
      "info",
  },
};

// Utility functions
export const isDevelopment = () => config.app.environment === "development";
export const isProduction = () => config.app.environment === "production";
export const isMockMode = () => config.features.mockMode;
export const isDebugMode = () => config.features.debugMode;

// API URL builders
export const getApiUrl = (path: string) => `${config.api.baseUrl}${path}`;
export const getScannerUrl = (path: string) =>
  `${config.api.scannerUrl}${path}`;
export const getMempoolUrl = (path: string) =>
  `${config.api.mempoolUrl}${path}`;
export const getMevUrl = (path: string) => `${config.api.mevUrl}${path}`;

// Logger utility
export const logger = {
  debug: (...args: any[]) => {
    if (config.app.logLevel === "debug" || config.features.debugMode) {
      console.log("[DEBUG]", ...args);
    }
  },
  info: (...args: any[]) => {
    if (["debug", "info"].includes(config.app.logLevel)) {
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args: any[]) => {
    if (["debug", "info", "warn"].includes(config.app.logLevel)) {
      console.warn("[WARN]", ...args);
    }
  },
  error: (...args: any[]) => {
    console.error("[ERROR]", ...args);
  },
};

// Export configuration for external use
export default config;

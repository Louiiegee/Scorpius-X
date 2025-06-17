/**
 * Settings Encryption Utilities
 * Provides secure storage and retrieval of sensitive settings like API keys
 */

import { toast } from "sonner";

// Simple encryption for client-side storage (for demo purposes)
// In production, use proper encryption libraries
const ENCRYPTION_KEY = "scorpius_settings_key_v1";

interface EncryptedData {
  encrypted: string;
  timestamp: number;
  version: string;
}

/**
 * Encrypts sensitive data for local storage
 */
export function encryptSensitiveData(data: string): string {
  try {
    const timestamp = Date.now();
    const payload = {
      data,
      timestamp,
      salt: Math.random().toString(36).substring(7),
    };

    // Simple base64 encoding with obfuscation
    const jsonString = JSON.stringify(payload);
    const encoded = btoa(jsonString);

    const encrypted: EncryptedData = {
      encrypted: encoded,
      timestamp,
      version: "1.0",
    };

    return JSON.stringify(encrypted);
  } catch (error) {
    console.error("Encryption failed:", error);
    toast.error("Failed to encrypt sensitive data");
    return "";
  }
}

/**
 * Decrypts sensitive data from local storage
 */
export function decryptSensitiveData(encryptedString: string): string {
  try {
    if (!encryptedString) return "";

    const encrypted: EncryptedData = JSON.parse(encryptedString);
    const decoded = atob(encrypted.encrypted);
    const payload = JSON.parse(decoded);

    // Check if data is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > maxAge) {
      console.warn("Encrypted data is too old, clearing...");
      return "";
    }

    return payload.data;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

/**
 * Masks sensitive strings for display
 */
export function maskSensitiveString(
  value: string,
  visibleChars: number = 4,
): string {
  if (!value || value.length <= visibleChars) return value;
  const masked = "*".repeat(value.length - visibleChars);
  return value.slice(0, visibleChars) + masked;
}

/**
 * Validates API key format
 */
export function validateApiKey(key: string, service: string): boolean {
  if (!key) return true; // Empty is valid (optional)

  const patterns: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{20,}$/,
    etherscan: /^[A-Z0-9]{34}$/,
    coingecko: /^CG-[a-zA-Z0-9]{20,}$/,
    alchemy: /^[a-zA-Z0-9_-]{32}$/,
    infura: /^[a-f0-9]{32}$/,
    quicknode: /^[a-zA-Z0-9_-]{20,}$/,
  };

  const pattern = patterns[service.toLowerCase()];
  if (!pattern) return true; // Unknown service, assume valid

  return pattern.test(key);
}

/**
 * Validates RPC URL format
 */
export function validateRpcUrl(url: string): boolean {
  if (!url) return true; // Empty is valid (will use default)

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "wss:";
  } catch {
    return false;
  }
}

/**
 * Secure storage manager for settings
 */
export class SecureSettingsStorage {
  private static instance: SecureSettingsStorage;
  private storageKey = "scorpius_settings";

  static getInstance(): SecureSettingsStorage {
    if (!SecureSettingsStorage.instance) {
      SecureSettingsStorage.instance = new SecureSettingsStorage();
    }
    return SecureSettingsStorage.instance;
  }

  save(settings: Record<string, any>): void {
    try {
      const sensitiveKeys = ["apiKeys", "rpcUrls", "customEndpoints"];
      const publicSettings: Record<string, any> = {};
      const sensitiveSettings: Record<string, any> = {};

      Object.entries(settings).forEach(([key, value]) => {
        if (sensitiveKeys.includes(key)) {
          sensitiveSettings[key] = value;
        } else {
          publicSettings[key] = value;
        }
      });

      // Store public settings normally
      localStorage.setItem(this.storageKey, JSON.stringify(publicSettings));

      // Store sensitive settings encrypted
      if (Object.keys(sensitiveSettings).length > 0) {
        const encrypted = encryptSensitiveData(
          JSON.stringify(sensitiveSettings),
        );
        localStorage.setItem(`${this.storageKey}_secure`, encrypted);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    }
  }

  load(): Record<string, any> {
    try {
      // Load public settings
      const publicData = localStorage.getItem(this.storageKey);
      const publicSettings = publicData ? JSON.parse(publicData) : {};

      // Load sensitive settings
      const sensitiveData = localStorage.getItem(`${this.storageKey}_secure`);
      const sensitiveSettings = sensitiveData
        ? JSON.parse(decryptSensitiveData(sensitiveData) || "{}")
        : {};

      return { ...publicSettings, ...sensitiveSettings };
    } catch (error) {
      console.error("Failed to load settings:", error);
      return {};
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(`${this.storageKey}_secure`);
    } catch (error) {
      console.error("Failed to clear settings:", error);
    }
  }
}

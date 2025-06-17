import { useState, useCallback } from "react";
import { UserTier } from "./useAuth";

export interface LicenseInfo {
  valid: boolean;
  tier: UserTier;
  licenseKey: string;
  organization?: string;
  expiresAt?: string;
  features: string[];
  limits: {
    maxConcurrentScans: number;
    exportLevel: string;
    accessWasm: boolean;
    apiCallsPerHour: number;
    customIntegrations: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
  };
  metadata?: {
    issuedAt: string;
    issuedTo: string;
    region?: string;
    environment: "production" | "staging" | "development";
  };
}

export interface LicenseValidationResult {
  valid: boolean;
  error?: string;
  info?: LicenseInfo;
  warnings?: string[];
}

class LicenseService {  private readonly API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  private licenseCache = new Map<
    string,
    { info: LicenseInfo; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // License key format validation
  private validateLicenseFormat(licenseKey: string): boolean {
    // Format: PREFIX-XXXX-XXXX-XXXX-CHECKSUM
    const licenseRegex =
      /^(COM|STR|PRO|ENT)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return licenseRegex.test(licenseKey.toUpperCase());
  }

  // Extract tier from license key prefix
  private getTierFromPrefix(licenseKey: string): UserTier {
    const prefix = licenseKey.substring(0, 3).toUpperCase();
    switch (prefix) {
      case "COM":
        return "community";
      case "STR":
        return "starter";
      case "PRO":
        return "pro";
      case "ENT":
        return "enterprise";
      default:
        return "community";
    }
  }

  // Generate license limits based on tier
  private getLimitsForTier(tier: UserTier) {
    const limits = {
      community: {
        maxConcurrentScans: 1,
        exportLevel: "basic",
        accessWasm: false,
        apiCallsPerHour: 100,
        customIntegrations: false,
        prioritySupport: false,
        whiteLabel: false,
      },
      starter: {
        maxConcurrentScans: 3,
        exportLevel: "standard",
        accessWasm: true,
        apiCallsPerHour: 1000,
        customIntegrations: false,
        prioritySupport: false,
        whiteLabel: false,
      },
      pro: {
        maxConcurrentScans: 10,
        exportLevel: "advanced",
        accessWasm: true,
        apiCallsPerHour: 5000,
        customIntegrations: true,
        prioritySupport: true,
        whiteLabel: false,
      },
      enterprise: {
        maxConcurrentScans: 50,
        exportLevel: "enterprise",
        accessWasm: true,
        apiCallsPerHour: 25000,
        customIntegrations: true,
        prioritySupport: true,
        whiteLabel: true,
      },
    };

    return limits[tier];
  }

  // Get features available for tier
  private getFeaturesForTier(tier: UserTier): string[] {
    const features = {
      community: ["basic_scanning", "public_reports", "community_support"],
      starter: [
        "basic_scanning",
        "public_reports",
        "community_support",
        "advanced_scanning",
        "pdf_exports",
        "email_support",
        "basic_integrations",
        "wasm_access",
      ],
      pro: [
        "basic_scanning",
        "public_reports",
        "community_support",
        "advanced_scanning",
        "pdf_exports",
        "email_support",
        "basic_integrations",
        "wasm_access",
        "mev_analysis",
        "advanced_exports",
        "priority_support",
        "custom_integrations",
        "api_access",
      ],
      enterprise: [
        "basic_scanning",
        "public_reports",
        "community_support",
        "advanced_scanning",
        "pdf_exports",
        "email_support",
        "basic_integrations",
        "wasm_access",
        "mev_analysis",
        "advanced_exports",
        "priority_support",
        "custom_integrations",
        "api_access",
        "white_label",
        "dedicated_support",
        "custom_deployment",
        "sla_guarantees",
        "on_premise",
      ],
    };

    return features[tier];
  }

  // Validate license with server
  async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    // Check cache first
    const cached = this.licenseCache.get(licenseKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        valid: true,
        info: cached.info,
      };
    }

    // Handle community tier (no license key)
    if (!licenseKey || licenseKey.trim() === "") {
      const communityInfo: LicenseInfo = {
        valid: true,
        tier: "community",
        licenseKey: "COMMUNITY",
        features: this.getFeaturesForTier("community"),
        limits: this.getLimitsForTier("community"),
        metadata: {
          issuedAt: new Date().toISOString(),
          issuedTo: "Community User",
          environment: "production",
        },
      };

      return {
        valid: true,
        info: communityInfo,
      };
    }

    // Validate license key format
    if (!this.validateLicenseFormat(licenseKey)) {
      return {
        valid: false,
        error:
          "Invalid license key format. Expected format: PREFIX-XXXX-XXXX-XXXX-XXXX",
      };
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/license/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ licenseKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          valid: false,
          error: data.message || "License validation failed",
        };
      }

      const licenseInfo: LicenseInfo = {
        valid: data.valid,
        tier: data.tier,
        licenseKey: licenseKey,
        organization: data.organization,
        expiresAt: data.expiresAt,
        features: this.getFeaturesForTier(data.tier),
        limits: this.getLimitsForTier(data.tier),
        metadata: data.metadata,
      };

      // Cache the result
      this.licenseCache.set(licenseKey, {
        info: licenseInfo,
        timestamp: Date.now(),
      });

      return {
        valid: true,
        info: licenseInfo,
        warnings: data.warnings,
      };
    } catch (error) {
      // Fallback to offline validation for certain cases
      const tier = this.getTierFromPrefix(licenseKey);

      return {
        valid: false,
        error: `Unable to validate license online. ${error instanceof Error ? error.message : "Network error"}`,
      };
    }
  }

  // Get license information (from cache or validation)
  async getLicenseInfo(licenseKey: string): Promise<LicenseInfo | null> {
    const result = await this.validateLicense(licenseKey);
    return result.valid ? result.info! : null;
  }

  // Check if license allows specific feature
  async checkFeatureAccess(
    licenseKey: string,
    feature: string,
  ): Promise<boolean> {
    const info = await this.getLicenseInfo(licenseKey);
    return info?.features.includes(feature) || false;
  }

  // Get usage limits for license
  async getLicenseLimits(licenseKey: string) {
    const info = await this.getLicenseInfo(licenseKey);
    return info?.limits || this.getLimitsForTier("community");
  }

  // Generate demo license for testing
  generateDemoLicense(tier: UserTier, organization?: string): string {
    const prefixes = {
      community: "COM",
      starter: "STR",
      pro: "PRO",
      enterprise: "ENT",
    };

    const prefix = prefixes[tier];
    const segments = Array.from({ length: 4 }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase(),
    );

    return `${prefix}-${segments.join("-")}`;
  }

  // Clear license cache
  clearCache() {
    this.licenseCache.clear();
  }

  // Check license expiration
  async checkLicenseExpiration(licenseKey: string): Promise<{
    isExpired: boolean;
    expiresAt?: string;
    daysUntilExpiry?: number;
  }> {
    const info = await this.getLicenseInfo(licenseKey);

    if (!info?.expiresAt) {
      return { isExpired: false };
    }

    const expiryDate = new Date(info.expiresAt);
    const now = new Date();
    const isExpired = expiryDate < now;
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      isExpired,
      expiresAt: info.expiresAt,
      daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
    };
  }
}

const licenseService = new LicenseService();

export const useLicense = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] =
    useState<LicenseValidationResult | null>(null);

  const validateLicense = useCallback(
    async (licenseKey: string): Promise<LicenseValidationResult> => {
      setIsValidating(true);
      try {
        const result = await licenseService.validateLicense(licenseKey);
        setLastValidation(result);
        return result;
      } finally {
        setIsValidating(false);
      }
    },
    [],
  );

  const getLicenseInfo = useCallback(
    async (licenseKey: string): Promise<LicenseInfo | null> => {
      return licenseService.getLicenseInfo(licenseKey);
    },
    [],
  );

  const checkFeatureAccess = useCallback(
    async (licenseKey: string, feature: string): Promise<boolean> => {
      return licenseService.checkFeatureAccess(licenseKey, feature);
    },
    [],
  );

  const getLicenseLimits = useCallback(async (licenseKey: string) => {
    return licenseService.getLicenseLimits(licenseKey);
  }, []);

  const generateDemoLicense = useCallback(
    (tier: UserTier, organization?: string): string => {
      return licenseService.generateDemoLicense(tier, organization);
    },
    [],
  );

  const checkLicenseExpiration = useCallback(async (licenseKey: string) => {
    return licenseService.checkLicenseExpiration(licenseKey);
  }, []);

  const clearCache = useCallback(() => {
    licenseService.clearCache();
  }, []);

  return {
    isValidating,
    lastValidation,
    validateLicense,
    getLicenseInfo,
    checkFeatureAccess,
    getLicenseLimits,
    generateDemoLicense,
    checkLicenseExpiration,
    clearCache,
  };
};

export default licenseService;

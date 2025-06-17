import { useState, useEffect, useCallback } from "react";
import { useAuth, UserTier } from "./useAuth";

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  tierRequired: UserTier | "any";
  permissions?: string[];
  limits?: {
    dailyUsage?: number;
    concurrentSessions?: number;
    apiCalls?: number;
  };
  metadata?: {
    description: string;
    rolloutPercentage?: number;
    environment?: string[];
  };
}

export interface UsageMetrics {
  feature: string;
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
  lastUsed?: string;
  remainingQuota: number;
}

export interface FeatureLimitResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  upgradeRequired?: boolean;
}

class FeatureFlagService {  private readonly API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  private flags: Map<string, FeatureFlag> = new Map();
  private usage: Map<string, UsageMetrics> = new Map();
  private tierHierarchy: UserTier[] = [
    "community",
    "starter",
    "pro",
    "enterprise",
  ];

  // Default feature flags configuration
  private readonly DEFAULT_FLAGS: FeatureFlag[] = [
    {
      name: "basic_scanning",
      enabled: true,
      tierRequired: "community",
      metadata: { description: "Basic contract scanning capabilities" },
    },
    {
      name: "advanced_scanning",
      enabled: true,
      tierRequired: "starter",
      metadata: { description: "Advanced vulnerability detection" },
    },
    {
      name: "mev_analysis",
      enabled: true,
      tierRequired: "pro",
      limits: { dailyUsage: 100, concurrentSessions: 5 },
      metadata: { description: "MEV opportunity analysis" },
    },
    {
      name: "wasm_modules",
      enabled: true,
      tierRequired: "starter",
      metadata: { description: "WebAssembly analysis modules" },
    },
    {
      name: "custom_integrations",
      enabled: true,
      tierRequired: "pro",
      metadata: { description: "Custom API integrations" },
    },
    {
      name: "white_label",
      enabled: true,
      tierRequired: "enterprise",
      metadata: { description: "White-label dashboard customization" },
    },
    {
      name: "priority_support",
      enabled: true,
      tierRequired: "pro",
      metadata: { description: "Priority customer support" },
    },
    {
      name: "export_pdf",
      enabled: true,
      tierRequired: "starter",
      limits: { dailyUsage: 50 },
      metadata: { description: "PDF report generation" },
    },
    {
      name: "export_advanced",
      enabled: true,
      tierRequired: "pro",
      limits: { dailyUsage: 20 },
      metadata: { description: "Advanced export formats" },
    },
    {
      name: "api_access",
      enabled: true,
      tierRequired: "pro",
      metadata: { description: "Full API access" },
    },
    {
      name: "real_time_monitoring",
      enabled: true,
      tierRequired: "starter",
      limits: { concurrentSessions: 3 },
      metadata: { description: "Real-time blockchain monitoring" },
    },
    {
      name: "honeypot_detection",
      enabled: true,
      tierRequired: "pro",
      metadata: { description: "Advanced honeypot detection" },
    },
    {
      name: "simulation_engine",
      enabled: true,
      tierRequired: "pro",
      limits: { dailyUsage: 10 },
      metadata: { description: "Contract simulation capabilities" },
    },
    {
      name: "time_machine",
      enabled: true,
      tierRequired: "pro",
      metadata: { description: "Historical blockchain analysis" },
    },
    {
      name: "enterprise_sso",
      enabled: true,
      tierRequired: "enterprise",
      metadata: { description: "Single Sign-On integration" },
    },
  ];

  constructor() {
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags() {
    this.DEFAULT_FLAGS.forEach((flag) => {
      this.flags.set(flag.name, flag);
    });
  }

  private getTierLevel(tier: UserTier): number {
    return this.tierHierarchy.indexOf(tier);
  }

  private hasRequiredTier(
    userTier: UserTier,
    requiredTier: UserTier | "any",
  ): boolean {
    if (requiredTier === "any") return true;
    return this.getTierLevel(userTier) >= this.getTierLevel(requiredTier);
  }

  async loadFeatureFlags(authToken?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`${this.API_BASE}/api/features/flags`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        data.flags.forEach((flag: FeatureFlag) => {
          this.flags.set(flag.name, flag);
        });
      }
    } catch (error) {
      console.warn(
        "Failed to load feature flags from server, using defaults:",
        error,
      );
    }
  }

  async loadUsageMetrics(authToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/api/features/usage`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        data.usage.forEach((metric: UsageMetrics) => {
          this.usage.set(metric.feature, metric);
        });
      }
    } catch (error) {
      console.warn("Failed to load usage metrics:", error);
    }
  }

  isFeatureEnabled(
    featureName: string,
    userTier: UserTier,
    userPermissions: string[] = [],
  ): boolean {
    const flag = this.flags.get(featureName);
    if (!flag || !flag.enabled) return false;

    // Check tier requirement
    if (!this.hasRequiredTier(userTier, flag.tierRequired)) return false;

    // Check permissions if specified
    if (flag.permissions && flag.permissions.length > 0) {
      const hasPermission = flag.permissions.some((perm) =>
        userPermissions.includes(perm),
      );
      if (!hasPermission) return false;
    }

    return true;
  }

  checkFeatureLimits(
    featureName: string,
    userTier: UserTier,
    userPermissions: string[] = [],
  ): FeatureLimitResult {
    const flag = this.flags.get(featureName);
    if (!flag) {
      return {
        allowed: false,
        reason: "Feature not found",
      };
    }

    // Check if feature is enabled for user's tier
    if (!this.isFeatureEnabled(featureName, userTier, userPermissions)) {
      const requiredTierIndex = this.getTierLevel(
        flag.tierRequired as UserTier,
      );
      const userTierIndex = this.getTierLevel(userTier);

      return {
        allowed: false,
        reason: `Feature requires ${flag.tierRequired} tier or higher`,
        upgradeRequired: requiredTierIndex > userTierIndex,
      };
    }

    // Check usage limits
    const usage = this.usage.get(featureName);
    if (flag.limits && usage) {
      if (
        flag.limits.dailyUsage &&
        usage.dailyUsage >= flag.limits.dailyUsage
      ) {
        return {
          allowed: false,
          reason: "Daily usage limit exceeded",
          currentUsage: usage.dailyUsage,
          limit: flag.limits.dailyUsage,
        };
      }

      if (flag.limits.concurrentSessions && usage.remainingQuota <= 0) {
        return {
          allowed: false,
          reason: "Concurrent session limit exceeded",
          limit: flag.limits.concurrentSessions,
        };
      }
    }

    return { allowed: true };
  }

  async recordFeatureUsage(
    featureName: string,
    authToken: string,
  ): Promise<void> {
    try {
      await fetch(`${this.API_BASE}/api/features/usage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature: featureName,
          timestamp: new Date().toISOString(),
        }),
      });

      // Update local usage cache
      const currentUsage = this.usage.get(featureName);
      if (currentUsage) {
        this.usage.set(featureName, {
          ...currentUsage,
          dailyUsage: currentUsage.dailyUsage + 1,
          lastUsed: new Date().toISOString(),
          remainingQuota: Math.max(0, currentUsage.remainingQuota - 1),
        });
      }
    } catch (error) {
      console.error("Failed to record feature usage:", error);
    }
  }

  getFeatureFlag(name: string): FeatureFlag | undefined {
    return this.flags.get(name);
  }

  getAllFeatures(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFeaturesForTier(tier: UserTier): FeatureFlag[] {
    return this.getAllFeatures().filter((flag) =>
      this.hasRequiredTier(tier, flag.tierRequired),
    );
  }

  getUsageMetrics(featureName: string): UsageMetrics | undefined {
    return this.usage.get(featureName);
  }
}

const featureFlagService = new FeatureFlagService();

export const useFeatureFlags = () => {
  const { user, getAuthHeader } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);

  useEffect(() => {
    const loadFlags = async () => {
      setIsLoading(true);
      const authToken = getAuthHeader()?.replace("Bearer ", "");

      await featureFlagService.loadFeatureFlags(authToken);

      if (authToken) {
        await featureFlagService.loadUsageMetrics(authToken);
      }

      setFeatures(featureFlagService.getAllFeatures());
      setIsLoading(false);
    };

    loadFlags();
  }, [getAuthHeader]);

  const isFeatureEnabled = useCallback(
    (featureName: string): boolean => {
      if (!user) return false;

      return featureFlagService.isFeatureEnabled(
        featureName,
        user.tier,
        user.permissions,
      );
    },
    [user],
  );

  const checkFeatureLimits = useCallback(
    (featureName: string): FeatureLimitResult => {
      if (!user) {
        return {
          allowed: false,
          reason: "Authentication required",
        };
      }

      return featureFlagService.checkFeatureLimits(
        featureName,
        user.tier,
        user.permissions,
      );
    },
    [user],
  );

  const recordFeatureUsage = useCallback(
    async (featureName: string): Promise<void> => {
      const authToken = getAuthHeader()?.replace("Bearer ", "");
      if (!authToken) return;

      await featureFlagService.recordFeatureUsage(featureName, authToken);
    },
    [getAuthHeader],
  );

  const getFeatureFlag = useCallback(
    (name: string): FeatureFlag | undefined => {
      return featureFlagService.getFeatureFlag(name);
    },
    [],
  );

  const getFeaturesForCurrentTier = useCallback((): FeatureFlag[] => {
    if (!user) return [];
    return featureFlagService.getFeaturesForTier(user.tier);
  }, [user]);

  const getUsageMetrics = useCallback(
    (featureName: string): UsageMetrics | undefined => {
      return featureFlagService.getUsageMetrics(featureName);
    },
    [],
  );

  const canUseFeature = useCallback(
    (featureName: string): boolean => {
      const enabled = isFeatureEnabled(featureName);
      if (!enabled) return false;

      const limits = checkFeatureLimits(featureName);
      return limits.allowed;
    },
    [isFeatureEnabled, checkFeatureLimits],
  );

  return {
    isLoading,
    features,
    isFeatureEnabled,
    checkFeatureLimits,
    recordFeatureUsage,
    getFeatureFlag,
    getFeaturesForCurrentTier,
    getUsageMetrics,
    canUseFeature,
  };
};

export default featureFlagService;

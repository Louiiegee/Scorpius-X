/**
 * Feature flag system
 * Supports environment variables and remote feature toggles
 */

import { config, logger } from "./env";

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: FeatureFlagCondition[];
}

export interface FeatureFlagCondition {
  type: "user_role" | "user_id" | "random" | "date_range";
  operator: "equals" | "in" | "gte" | "lte" | "between";
  value: any;
}

class FeatureFlagService {
  private flags = new Map<string, FeatureFlag>();
  private userContext: any = null;

  constructor() {
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        key: "mock_mode",
        name: "Mock Mode",
        description: "Enable mock API responses for development",
        enabled: config.features.mockMode,
      },
      {
        key: "websockets",
        name: "WebSocket Support",
        description: "Enable real-time WebSocket connections",
        enabled: config.features.websockets,
      },
      {
        key: "analytics",
        name: "Analytics Tracking",
        description: "Enable user analytics and tracking",
        enabled: config.features.analytics,
      },
      {
        key: "debug_mode",
        name: "Debug Mode",
        description: "Enable debug logging and tools",
        enabled: config.features.debugMode,
      },
      {
        key: "advanced_scanner",
        name: "Advanced Scanner Features",
        description: "Enable experimental scanner capabilities",
        enabled: true,
      },
      {
        key: "mev_auto_execute",
        name: "MEV Auto Execution",
        description: "Enable automatic MEV strategy execution",
        enabled: false,
        conditions: [
          {
            type: "user_role",
            operator: "in",
            value: ["admin", "trader"],
          },
        ],
      },
      {
        key: "real_time_charts",
        name: "Real-time Charts",
        description: "Enable live updating dashboard charts",
        enabled: true,
      },
      {
        key: "threat_notifications",
        name: "Threat Notifications",
        description: "Enable real-time threat notifications",
        enabled: true,
      },
      {
        key: "honeypot_detection",
        name: "Honeypot Detection",
        description: "Enable advanced honeypot detection algorithms",
        enabled: true,
        rolloutPercentage: 80,
      },
      {
        key: "bytecode_similarity",
        name: "Bytecode Similarity Analysis",
        description: "Enable bytecode similarity matching",
        enabled: true,
      },
      {
        key: "gas_optimization",
        name: "Gas Optimization Suggestions",
        description: "Provide gas optimization recommendations",
        enabled: false,
      },
      {
        key: "custom_rules",
        name: "Custom Scanning Rules",
        description: "Allow users to define custom security rules",
        enabled: false,
        conditions: [
          {
            type: "user_role",
            operator: "equals",
            value: "admin",
          },
        ],
      },
      {
        key: "ai_analysis",
        name: "AI-Powered Analysis",
        description: "Enable AI-powered threat analysis",
        enabled: true,
        rolloutPercentage: 50,
      },
      {
        key: "bulk_operations",
        name: "Bulk Operations",
        description: "Enable bulk scanning and operations",
        enabled: false,
      },
      {
        key: "api_rate_limiting",
        name: "API Rate Limiting",
        description: "Enable API rate limiting protections",
        enabled: true,
      },
    ];

    defaultFlags.forEach((flag) => {
      this.flags.set(flag.key, flag);
    });

    logger.debug("Initialized feature flags:", Array.from(this.flags.keys()));
  }

  setUserContext(context: any): void {
    this.userContext = context;
    logger.debug("Updated user context for feature flags");
  }

  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      logger.warn(`Feature flag not found: ${flagKey}`);
      return false;
    }

    // Check base enabled state
    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const userId = this.userContext?.id || "anonymous";
      const hash = this.hashString(userId + flagKey);
      const percentage = (hash % 100) + 1;

      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions && flag.conditions.length > 0) {
      return this.evaluateConditions(flag.conditions);
    }

    return true;
  }

  private evaluateConditions(conditions: FeatureFlagCondition[]): boolean {
    return conditions.every((condition) => this.evaluateCondition(condition));
  }

  private evaluateCondition(condition: FeatureFlagCondition): boolean {
    let contextValue: any;

    switch (condition.type) {
      case "user_role":
        contextValue = this.userContext?.role;
        break;
      case "user_id":
        contextValue = this.userContext?.id;
        break;
      case "random":
        contextValue = Math.random() * 100;
        break;
      case "date_range":
        contextValue = new Date();
        break;
      default:
        logger.warn(`Unknown condition type: ${condition.type}`);
        return false;
    }

    if (contextValue === undefined || contextValue === null) {
      return false;
    }

    switch (condition.operator) {
      case "equals":
        return contextValue === condition.value;
      case "in":
        return (
          Array.isArray(condition.value) &&
          condition.value.includes(contextValue)
        );
      case "gte":
        return contextValue >= condition.value;
      case "lte":
        return contextValue <= condition.value;
      case "between":
        return (
          Array.isArray(condition.value) &&
          contextValue >= condition.value[0] &&
          contextValue <= condition.value[1]
        );
      default:
        logger.warn(`Unknown condition operator: ${condition.operator}`);
        return false;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getEnabledFlags(): FeatureFlag[] {
    return this.getAllFlags().filter((flag) => this.isEnabled(flag.key));
  }

  // Admin functions
  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
    logger.info(`Feature flag updated: ${flag.key} = ${flag.enabled}`);
  }

  toggleFlag(flagKey: string): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      logger.warn(`Cannot toggle unknown flag: ${flagKey}`);
      return false;
    }

    flag.enabled = !flag.enabled;
    this.flags.set(flagKey, flag);
    logger.info(`Feature flag toggled: ${flagKey} = ${flag.enabled}`);
    return flag.enabled;
  }

  // Batch operations
  enableFlags(flagKeys: string[]): void {
    flagKeys.forEach((key) => {
      const flag = this.flags.get(key);
      if (flag) {
        flag.enabled = true;
        this.flags.set(key, flag);
      }
    });
    logger.info(`Enabled flags: ${flagKeys.join(", ")}`);
  }

  disableFlags(flagKeys: string[]): void {
    flagKeys.forEach((key) => {
      const flag = this.flags.get(key);
      if (flag) {
        flag.enabled = false;
        this.flags.set(key, flag);
      }
    });
    logger.info(`Disabled flags: ${flagKeys.join(", ")}`);
  }

  // Load remote flags (placeholder for future implementation)
  async loadRemoteFlags(): Promise<void> {
    try {
      // This would integrate with a feature flag service like LaunchDarkly
      logger.debug("Loading remote feature flags...");

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 100));

      logger.debug("Remote feature flags loaded");
    } catch (error) {
      logger.error("Failed to load remote feature flags:", error);
    }
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagService();

// React hook for feature flags
export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = React.useState(() =>
    featureFlags.isEnabled(flagKey),
  );

  React.useEffect(() => {
    // In a real implementation, this would listen for flag updates
    const checkFlag = () => {
      const isEnabled = featureFlags.isEnabled(flagKey);
      setEnabled(isEnabled);
    };

    // Check periodically (in production, this would be event-driven)
    const interval = setInterval(checkFlag, 30000);

    return () => clearInterval(interval);
  }, [flagKey]);

  return enabled;
}

// React hook for multiple feature flags
export function useFeatureFlags(flagKeys: string[]): Record<string, boolean> {
  const [flags, setFlags] = React.useState(() => {
    const result: Record<string, boolean> = {};
    flagKeys.forEach((key) => {
      result[key] = featureFlags.isEnabled(key);
    });
    return result;
  });

  React.useEffect(() => {
    const checkFlags = () => {
      const result: Record<string, boolean> = {};
      flagKeys.forEach((key) => {
        result[key] = featureFlags.isEnabled(key);
      });
      setFlags(result);
    };

    const interval = setInterval(checkFlags, 30000);
    return () => clearInterval(interval);
  }, [flagKeys]);

  return flags;
}

// Export service class for testing
export { FeatureFlagService };

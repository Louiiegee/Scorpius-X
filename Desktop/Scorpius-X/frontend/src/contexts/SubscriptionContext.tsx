import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

// Subscription tiers
export enum SubscriptionTier {
  BASIC = "basic",
  PREMIUM = "premium",
  HUNTERS_EDITION = "hunters_edition",
  ENTERPRISE = "enterprise",
}

// Feature definitions by tier
export const TIER_FEATURES = {
  [SubscriptionTier.BASIC]: [
    "smart_contract_scanner",
    "audit_report_generator_payper", // Pay-per-report
    "trapgrid_basic", // Rebranded as BuzzKill
    "profile_page",
    "login_memory",
    "env_setup_page",
    "desktop_app",
    "local_installer",
    "scan_history_storage",
    "logout_system",
  ],
  [SubscriptionTier.PREMIUM]: [
    // All BASIC features plus:
    "exploit_simulator",
    "honeypot_detector",
    "bytecode_similarity_matcher",
    "time_machine_replay",
    "websocket_visualizations",
    "pulse_grid_basic", // No mempool live mode
    "auto_pdf_json_reports", // No per-report charge
    "advanced_analytics",
  ],
  [SubscriptionTier.HUNTERS_EDITION]: [
    // All PREMIUM features plus:
    "mempool_monitor_live",
    "mev_bot_framework",
    "buzzkill_full_mode", // Trap disarm logic
    "custom_script_integration",
    "mev_share_flashbots",
    "auto_scam_detection",
    "wallet_watchlist_persistent",
    "target_tracker",
    "high_risk_token_detector",
    "price_oracle_monitoring",
    "mint_triggers",
  ],
  [SubscriptionTier.ENTERPRISE]: [
    // All HUNTER'S features plus:
    "webchat_support",
    "training_platform",
    "scheduler_advanced",
    "audit_sla",
    "white_label_branding",
    "multi_user_teams",
    "custom_modules",
    "ci_plugin_webhooks",
    "license_verification_api",
    "soc2_iso_compliance",
    "dedicated_support",
  ],
};

// Subscription pricing
export const TIER_PRICING = {
  [SubscriptionTier.BASIC]: {
    monthly: 49,
    annually: 49 * 12 * 0.85, // 15% discount
    features: "Smart Contract Scanner + Basic Reports",
    description: "Perfect for developers who need basic security scanning",
    popular: false,
  },
  [SubscriptionTier.PREMIUM]: {
    monthly: 249,
    annually: 249 * 12 * 0.85,
    features: "Advanced Analysis + Exploit Simulation",
    description: "For security researchers and advanced developers",
    popular: true,
  },
  [SubscriptionTier.HUNTERS_EDITION]: {
    monthly: 499,
    annually: 997, // Lifetime option
    features: "MEV Framework + Live Monitoring",
    description: "Power users, MEV searchers, and security experts",
    popular: false,
  },
  [SubscriptionTier.ENTERPRISE]: {
    monthly: "Custom",
    annually: "Custom",
    features: "White-label + Multi-user + Custom Modules",
    description: "Enterprise audit firms and large organizations",
    popular: false,
  },
};

interface SubscriptionData {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  isLifetime: boolean;
  features: string[];
  paymentStatus: "active" | "pending" | "failed" | "cancelled";
  billingCycle: "monthly" | "annually" | "lifetime";
  nextBillingDate: string | null;
  reportsRemaining?: number; // For Basic tier pay-per-report
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  hasFeature: (feature: string) => boolean;
  canUseFeature: (feature: string) => { allowed: boolean; reason?: string };
  upgradeToTier: (tier: SubscriptionTier) => Promise<boolean>;
  purchaseReport: () => Promise<boolean>; // For Basic tier
  getFeatureList: () => string[];
  getTierInfo: (
    tier: SubscriptionTier,
  ) => (typeof TIER_PRICING)[SubscriptionTier];
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize subscription data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubscriptionData();
    } else {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);

      // Get subscription from localStorage (in production, this would be from API)
      const storedSubscription = localStorage.getItem("scorpius_subscription");

      if (storedSubscription) {
        const subData = JSON.parse(storedSubscription);

        // Validate subscription is still active
        if (subData.expiresAt && !subData.isLifetime) {
          const now = new Date();
          const expires = new Date(subData.expiresAt);

          if (now > expires) {
            // Subscription expired, downgrade to basic
            const expiredSub = createBasicSubscription();
            expiredSub.paymentStatus = "failed";
            setSubscription(expiredSub);
            localStorage.setItem(
              "scorpius_subscription",
              JSON.stringify(expiredSub),
            );
            return;
          }
        }

        setSubscription(subData);
      } else {
        // New user - create basic subscription
        const basicSub = createBasicSubscription();
        setSubscription(basicSub);
        localStorage.setItem("scorpius_subscription", JSON.stringify(basicSub));
      }
    } catch (error) {
      console.error("Failed to load subscription data:", error);
      // Fallback to basic subscription
      const basicSub = createBasicSubscription();
      setSubscription(basicSub);
    } finally {
      setIsLoading(false);
    }
  };

  const createBasicSubscription = (): SubscriptionData => {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    return {
      tier: SubscriptionTier.BASIC,
      isActive: true,
      expiresAt: oneMonthFromNow.toISOString(),
      isLifetime: false,
      features: getAllFeaturesForTier(SubscriptionTier.BASIC),
      paymentStatus: "active",
      billingCycle: "monthly",
      nextBillingDate: oneMonthFromNow.toISOString(),
      reportsRemaining: 0, // Basic starts with 0 reports
    };
  };

  const getAllFeaturesForTier = (tier: SubscriptionTier): string[] => {
    const allFeatures: string[] = [];

    // Add features from all lower tiers
    switch (tier) {
      case SubscriptionTier.ENTERPRISE:
        allFeatures.push(...TIER_FEATURES[SubscriptionTier.ENTERPRISE]);
      case SubscriptionTier.HUNTERS_EDITION:
        allFeatures.push(...TIER_FEATURES[SubscriptionTier.HUNTERS_EDITION]);
      case SubscriptionTier.PREMIUM:
        allFeatures.push(...TIER_FEATURES[SubscriptionTier.PREMIUM]);
      case SubscriptionTier.BASIC:
        allFeatures.push(...TIER_FEATURES[SubscriptionTier.BASIC]);
        break;
    }

    return [...new Set(allFeatures)]; // Remove duplicates
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;
    return subscription.features.includes(feature);
  };

  const canUseFeature = (
    feature: string,
  ): { allowed: boolean; reason?: string } => {
    if (!subscription) {
      return { allowed: false, reason: "No active subscription" };
    }

    if (!subscription.isActive) {
      return { allowed: false, reason: "Subscription inactive" };
    }

    if (!hasFeature(feature)) {
      return { allowed: false, reason: "Feature not included in your plan" };
    }

    // Special checks for pay-per-report features
    if (
      feature === "audit_report_generator_payper" &&
      subscription.tier === SubscriptionTier.BASIC
    ) {
      if ((subscription.reportsRemaining || 0) <= 0) {
        return {
          allowed: false,
          reason:
            "No reports remaining. Purchase additional reports or upgrade.",
        };
      }
    }

    return { allowed: true };
  };

  const upgradeToTier = async (tier: SubscriptionTier): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Simulate API call for subscription upgrade
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newSubscription: SubscriptionData = {
        tier,
        isActive: true,
        expiresAt:
          tier === SubscriptionTier.HUNTERS_EDITION
            ? null // Lifetime option
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        isLifetime: tier === SubscriptionTier.HUNTERS_EDITION,
        features: getAllFeaturesForTier(tier),
        paymentStatus: "active",
        billingCycle:
          tier === SubscriptionTier.HUNTERS_EDITION ? "lifetime" : "monthly",
        nextBillingDate:
          tier === SubscriptionTier.HUNTERS_EDITION
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        reportsRemaining: tier === SubscriptionTier.BASIC ? 0 : undefined,
      };

      setSubscription(newSubscription);
      localStorage.setItem(
        "scorpius_subscription",
        JSON.stringify(newSubscription),
      );

      return true;
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseReport = async (): Promise<boolean> => {
    try {
      if (!subscription || subscription.tier !== SubscriptionTier.BASIC) {
        return false;
      }

      setIsLoading(true);

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const updatedSubscription = {
        ...subscription,
        reportsRemaining: (subscription.reportsRemaining || 0) + 1,
      };

      setSubscription(updatedSubscription);
      localStorage.setItem(
        "scorpius_subscription",
        JSON.stringify(updatedSubscription),
      );

      return true;
    } catch (error) {
      console.error("Failed to purchase report:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureList = (): string[] => {
    return subscription?.features || [];
  };

  const getTierInfo = (tier: SubscriptionTier) => {
    return TIER_PRICING[tier];
  };

  const refreshSubscription = async (): Promise<void> => {
    await loadSubscriptionData();
  };

  const contextValue: SubscriptionContextType = {
    subscription,
    isLoading,
    hasFeature,
    canUseFeature,
    upgradeToTier,
    purchaseReport,
    getFeatureList,
    getTierInfo,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};

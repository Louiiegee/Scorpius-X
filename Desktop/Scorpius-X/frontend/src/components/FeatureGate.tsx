import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  useSubscription,
  SubscriptionTier,
} from "@/contexts/SubscriptionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lock,
  Crown,
  Zap,
  Building,
  ArrowRight,
  Star,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  customMessage?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgrade = true,
  customMessage,
}) => {
  const { canUseFeature, subscription, upgradeToTier } = useSubscription();
  const featureCheck = canUseFeature(feature);

  if (featureCheck.allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <FeatureUpgradePrompt
      feature={feature}
      reason={featureCheck.reason}
      currentTier={subscription?.tier}
      customMessage={customMessage}
    />
  );
};

interface FeatureUpgradePromptProps {
  feature: string;
  reason?: string;
  currentTier?: SubscriptionTier;
  customMessage?: string;
}

const FeatureUpgradePrompt: React.FC<FeatureUpgradePromptProps> = ({
  feature,
  reason,
  currentTier,
  customMessage,
}) => {
  const { upgradeToTier, purchaseReport } = useSubscription();

  const getRequiredTier = (feature: string): SubscriptionTier => {
    // Define which features require which tiers
    const featureTierMap: Record<string, SubscriptionTier> = {
      exploit_simulator: SubscriptionTier.PREMIUM,
      honeypot_detector: SubscriptionTier.PREMIUM,
      bytecode_similarity_matcher: SubscriptionTier.PREMIUM,
      time_machine_replay: SubscriptionTier.PREMIUM,
      websocket_visualizations: SubscriptionTier.PREMIUM,
      auto_pdf_json_reports: SubscriptionTier.PREMIUM,

      mempool_monitor_live: SubscriptionTier.HUNTERS_EDITION,
      mev_bot_framework: SubscriptionTier.HUNTERS_EDITION,
      buzzkill_full_mode: SubscriptionTier.HUNTERS_EDITION,
      custom_script_integration: SubscriptionTier.HUNTERS_EDITION,
      wallet_watchlist_persistent: SubscriptionTier.HUNTERS_EDITION,

      webchat_support: SubscriptionTier.ENTERPRISE,
      training_platform: SubscriptionTier.ENTERPRISE,
      multi_user_teams: SubscriptionTier.ENTERPRISE,
      white_label_branding: SubscriptionTier.ENTERPRISE,
      custom_modules: SubscriptionTier.ENTERPRISE,
    };

    return featureTierMap[feature] || SubscriptionTier.PREMIUM;
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.BASIC:
        return <ShieldCheck className="h-5 w-5" />;
      case SubscriptionTier.PREMIUM:
        return <Star className="h-5 w-5" />;
      case SubscriptionTier.HUNTERS_EDITION:
        return <Zap className="h-5 w-5" />;
      case SubscriptionTier.ENTERPRISE:
        return <Building className="h-5 w-5" />;
      default:
        return <Lock className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.BASIC:
        return "border-blue-500/30 bg-blue-500/10";
      case SubscriptionTier.PREMIUM:
        return "border-purple-500/30 bg-purple-500/10";
      case SubscriptionTier.HUNTERS_EDITION:
        return "border-red-500/30 bg-red-500/10";
      case SubscriptionTier.ENTERPRISE:
        return "border-gold-500/30 bg-yellow-500/10";
      default:
        return "border-gray-500/30 bg-gray-500/10";
    }
  };

  const requiredTier = getRequiredTier(feature);
  const tierInfo = {
    [SubscriptionTier.BASIC]: { name: "Basic", price: "$49/mo" },
    [SubscriptionTier.PREMIUM]: { name: "Premium", price: "$249/mo" },
    [SubscriptionTier.HUNTERS_EDITION]: {
      name: "Hunter's Edition",
      price: "$499/mo",
    },
    [SubscriptionTier.ENTERPRISE]: { name: "Enterprise", price: "Custom" },
  };

  const handleUpgrade = async () => {
    if (
      feature === "audit_report_generator_payper" &&
      currentTier === SubscriptionTier.BASIC
    ) {
      await purchaseReport();
    } else {
      await upgradeToTier(requiredTier);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center min-h-[400px] p-8"
    >
      <Card
        className={`max-w-md w-full ${getTierColor(requiredTier)} border-2`}
      >
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-black/50 w-fit">
            {getTierIcon(requiredTier)}
          </div>
          <CardTitle className="text-xl font-mono text-white mb-2">
            Premium Feature Locked
          </CardTitle>
          <Badge
            variant="outline"
            className="mx-auto border-current text-current"
          >
            Requires {tierInfo[requiredTier].name}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-yellow-500/30 bg-yellow-500/10">
            <Lock className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              {customMessage ||
                reason ||
                "This feature requires a higher subscription tier."}
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-3">
            <p className="text-gray-300 text-sm">
              Upgrade to{" "}
              <strong className="text-white">
                {tierInfo[requiredTier].name}
              </strong>{" "}
              to unlock:
            </p>

            <ul className="text-left text-sm text-gray-400 space-y-1">
              {getFeatureDescriptions(requiredTier).map((desc, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                  {desc}
                </li>
              ))}
            </ul>

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-red-600 to-cyan-600 hover:from-red-700 hover:to-cyan-700 text-white font-mono"
              >
                {feature === "audit_report_generator_payper" &&
                currentTier === SubscriptionTier.BASIC
                  ? "Purchase Report - $49"
                  : `Upgrade to ${tierInfo[requiredTier].name} - ${tierInfo[requiredTier].price}`}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-gray-500">
                Instant access • Cancel anytime • 30-day money back guarantee
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const getFeatureDescriptions = (tier: SubscriptionTier): string[] => {
  switch (tier) {
    case SubscriptionTier.PREMIUM:
      return [
        "Advanced exploit simulation",
        "Honeypot detection algorithms",
        "Bytecode similarity matching",
        "Time machine block replay",
        "Unlimited report generation",
      ];
    case SubscriptionTier.HUNTERS_EDITION:
      return [
        "Live mempool monitoring",
        "MEV bot framework",
        "BuzzKill full trap disarm",
        "Custom script integration",
        "Persistent wallet watchlist",
      ];
    case SubscriptionTier.ENTERPRISE:
      return [
        "Multi-user team accounts",
        "White-label branding",
        "Custom module development",
        "Dedicated support channel",
        "SOC2/ISO compliance tools",
      ];
    default:
      return [
        "Enhanced security features",
        "Priority support",
        "Advanced analytics",
      ];
  }
};

// Convenience components for specific features
export const PremiumFeature: React.FC<{
  children: ReactNode;
  feature?: string;
}> = ({ children, feature = "premium_feature" }) => (
  <FeatureGate feature={feature}>{children}</FeatureGate>
);

export const HuntersFeature: React.FC<{
  children: ReactNode;
  feature?: string;
}> = ({ children, feature = "hunters_feature" }) => (
  <FeatureGate feature={feature}>{children}</FeatureGate>
);

export const EnterpriseFeature: React.FC<{
  children: ReactNode;
  feature?: string;
}> = ({ children, feature = "enterprise_feature" }) => (
  <FeatureGate feature={feature}>{children}</FeatureGate>
);

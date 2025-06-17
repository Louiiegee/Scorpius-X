import React, { useEffect, useState } from "react";
import { useAuth, UserTier } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { LoginPage } from "@/pages/Login";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  AlertTriangle,
  Crown,
  Zap,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier?: UserTier;
  requiredFeature?: string;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

interface TierUpgradeProps {
  currentTier: UserTier;
  requiredTier: UserTier;
  feature?: string;
}

const TIER_COLORS = {
  community: "rgb(107, 114, 128)",
  starter: "rgb(59, 130, 246)",
  pro: "rgb(16, 185, 129)",
  enterprise: "rgb(245, 158, 11)",
};

const TIER_ICONS = {
  community: Shield,
  starter: Zap,
  pro: Crown,
  enterprise: CheckCircle,
};

function TierUpgradeModal({
  currentTier,
  requiredTier,
  feature,
}: TierUpgradeProps) {
  const CurrentIcon = TIER_ICONS[currentTier];
  const RequiredIcon = TIER_ICONS[requiredTier];

  const tierFeatures = {
    starter: [
      "Advanced scanning with AI detection",
      "PDF report generation",
      "WebAssembly analysis modules",
      "Real-time monitoring",
      "Email support",
    ],
    pro: [
      "All Starter features",
      "MEV opportunity analysis",
      "Advanced export formats",
      "Custom API integrations",
      "Honeypot detection",
      "Simulation engine",
      "Priority support",
    ],
    enterprise: [
      "All Pro features",
      "White-label dashboard",
      "Dedicated support engineer",
      "Custom deployment options",
      "SLA guarantees",
      "Enterprise SSO",
      "Unlimited usage",
    ],
  };

  const tierPricing = {
    starter: { monthly: 49, yearly: 490 },
    pro: { monthly: 149, yearly: 1490 },
    enterprise: { monthly: 499, yearly: 4990 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CurrentIcon
                  className="h-8 w-8"
                  style={{ color: TIER_COLORS[currentTier] }}
                />
                <span
                  className="font-semibold text-lg capitalize"
                  style={{ color: TIER_COLORS[currentTier] }}
                >
                  {currentTier}
                </span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2">
                <RequiredIcon
                  className="h-8 w-8"
                  style={{ color: TIER_COLORS[requiredTier] }}
                />
                <span
                  className="font-semibold text-lg capitalize"
                  style={{ color: TIER_COLORS[requiredTier] }}
                >
                  {requiredTier}
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upgrade Required
            </h2>
            {feature && (
              <p className="text-gray-600">
                The feature <strong>{feature}</strong> requires{" "}
                <span
                  className="font-semibold capitalize"
                  style={{ color: TIER_COLORS[requiredTier] }}
                >
                  {requiredTier}
                </span>{" "}
                tier or higher.
              </p>
            )}
          </div>

          {/* Tier Comparison */}
          <div className="space-y-4 mb-6">
            <Card
              className="border-2"
              style={{ borderColor: TIER_COLORS[requiredTier] }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <RequiredIcon
                    className="h-5 w-5"
                    style={{ color: TIER_COLORS[requiredTier] }}
                  />
                  <span
                    className="capitalize"
                    style={{ color: TIER_COLORS[requiredTier] }}
                  >
                    {requiredTier} Plan
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    Recommended
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      $
                      {
                        tierPricing[requiredTier as keyof typeof tierPricing]
                          ?.monthly
                      }
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Save 20% with yearly billing
                  </p>
                </div>

                <ul className="space-y-2">
                  {tierFeatures[requiredTier as keyof typeof tierFeatures]?.map(
                    (feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ),
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              style={{
                backgroundColor: TIER_COLORS[requiredTier],
                borderColor: TIER_COLORS[requiredTier],
              }}
              onClick={() => {
                // Handle upgrade
                window.open("/billing/upgrade", "_blank");
              }}
            >
              Upgrade to {requiredTier}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Go back to previous page
                window.history.back();
              }}
            >
              Go Back
            </Button>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/contact"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Need help choosing a plan? Contact sales
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PermissionDenied({ permissions }: { permissions: string[] }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Permission Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You don't have the required permissions to access this feature.
          </p>

          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Required permissions:
            </p>
            <div className="space-y-1">
              {permissions.map((permission, index) => (
                <Badge key={index} variant="secondary" className="mr-1">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureDisabled({ feature }: { feature: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Feature Unavailable</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            The feature <strong>{feature}</strong> is currently disabled or not
            available in your region.
          </p>

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go Back
            </Button>
            <Button
              variant="link"
              onClick={() => window.open("/support", "_blank")}
              className="w-full text-sm"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtectedRoute({
  children,
  requiredTier,
  requiredFeature,
  requiredPermissions = [],
  fallback,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const { isFeatureEnabled, checkFeatureLimits } = useFeatureFlags();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Check authentication
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Check tier requirement
  if (requiredTier) {
    const tierHierarchy: UserTier[] = [
      "community",
      "starter",
      "pro",
      "enterprise",
    ];
    const userTierIndex = tierHierarchy.indexOf(user.tier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    if (userTierIndex < requiredTierIndex) {
      return (
        <TierUpgradeModal
          currentTier={user.tier}
          requiredTier={requiredTier}
          feature={requiredFeature}
        />
      );
    }
  }

  // Check feature requirement
  if (requiredFeature) {
    if (!isFeatureEnabled(requiredFeature)) {
      return <FeatureDisabled feature={requiredFeature} />;
    }

    // Check feature limits
    const limitCheck = checkFeatureLimits(requiredFeature);
    if (!limitCheck.allowed) {
      if (limitCheck.upgradeRequired) {
        // Determine required tier for the feature
        const featureTierMap: Record<string, UserTier> = {
          advanced_scanning: "starter",
          mev_analysis: "pro",
          white_label: "enterprise",
          custom_integrations: "pro",
          // Add more mappings as needed
        };

        const requiredUpgradeTier = featureTierMap[requiredFeature] || "pro";

        return (
          <TierUpgradeModal
            currentTier={user.tier}
            requiredTier={requiredUpgradeTier}
            feature={requiredFeature}
          />
        );
      } else {
        return <FeatureDisabled feature={requiredFeature} />;
      }
    }
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      return <PermissionDenied permissions={requiredPermissions} />;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Higher-order component for easy route protection
export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  protectionOptions: Omit<ProtectedRouteProps, "children">,
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...protectionOptions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for checking access within components
export function useAccess() {
  const { user } = useAuth();
  const { isFeatureEnabled, checkFeatureLimits } = useFeatureFlags();

  const hasAccess = (requirements: {
    tier?: UserTier;
    feature?: string;
    permissions?: string[];
  }) => {
    if (!user) return false;

    // Check tier
    if (requirements.tier) {
      const tierHierarchy: UserTier[] = [
        "community",
        "starter",
        "pro",
        "enterprise",
      ];
      const userTierIndex = tierHierarchy.indexOf(user.tier);
      const requiredTierIndex = tierHierarchy.indexOf(requirements.tier);

      if (userTierIndex < requiredTierIndex) return false;
    }

    // Check feature
    if (requirements.feature) {
      if (!isFeatureEnabled(requirements.feature)) return false;

      const limitCheck = checkFeatureLimits(requirements.feature);
      if (!limitCheck.allowed) return false;
    }

    // Check permissions
    if (requirements.permissions) {
      const hasAllPermissions = requirements.permissions.every((permission) =>
        user.permissions.includes(permission),
      );
      if (!hasAllPermissions) return false;
    }

    return true;
  };

  return { hasAccess, user };
}

export default ProtectedRoute;

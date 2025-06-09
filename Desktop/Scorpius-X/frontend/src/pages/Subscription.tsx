import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  useSubscription,
  SubscriptionTier,
  TIER_PRICING,
} from "@/contexts/SubscriptionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Crown,
  Zap,
  Building,
  ShieldCheck,
  Check,
  X,
  Star,
  Sparkles,
  CreditCard,
  Calendar,
  Users,
  FileText,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export const Subscription: React.FC = () => {
  const { subscription, upgradeToTier, purchaseReport, isLoading } =
    useSubscription();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
    null,
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">(
    "monthly",
  );

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.BASIC:
        return <ShieldCheck className="h-6 w-6" />;
      case SubscriptionTier.PREMIUM:
        return <Star className="h-6 w-6" />;
      case SubscriptionTier.HUNTERS_EDITION:
        return <Zap className="h-6 w-6" />;
      case SubscriptionTier.ENTERPRISE:
        return <Building className="h-6 w-6" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.BASIC:
        return "from-blue-600 to-blue-400";
      case SubscriptionTier.PREMIUM:
        return "from-purple-600 to-purple-400";
      case SubscriptionTier.HUNTERS_EDITION:
        return "from-red-600 to-red-400";
      case SubscriptionTier.ENTERPRISE:
        return "from-yellow-600 to-yellow-400";
    }
  };

  const getTierFeatures = (tier: SubscriptionTier): string[] => {
    const features = {
      [SubscriptionTier.BASIC]: [
        "Smart Contract Scanner",
        "Audit Report Generator (pay-per-report: $49)",
        "BuzzKill Basic Mode",
        "Profile & Login Memory",
        "Environment Setup",
        "Desktop Application",
        "Scan History Storage",
      ],
      [SubscriptionTier.PREMIUM]: [
        "Everything in Basic, plus:",
        "Exploit Simulator",
        "Honeypot Detector",
        "Bytecode Similarity Matcher",
        "Time Machine (replay blocks)",
        "WebSocket Visualizations",
        "Pulse Grid (no mempool live)",
        "Unlimited PDF/JSON Reports",
      ],
      [SubscriptionTier.HUNTERS_EDITION]: [
        "Everything in Premium, plus:",
        "Live Mempool Monitor",
        "MEV Bot Framework",
        "BuzzKill Full Mode (trap disarm)",
        "Custom Script Integration",
        "MEV-Share & Flashbots Routes",
        "Auto Scam Detection",
        "Persistent Wallet Watchlist",
        "High-risk Token Detector",
      ],
      [SubscriptionTier.ENTERPRISE]: [
        "Everything in Hunter's Edition, plus:",
        "WebChat Support",
        "Training Platform",
        "Advanced Scheduler",
        "White-label Branding",
        "Multi-user Team Accounts",
        "Custom Module Development",
        "CI Plugin & Webhook Access",
        "SOC2/ISO Compliance Toolkit",
      ],
    };
    return features[tier];
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setSelectedTier(tier);

    try {
      const success = await upgradeToTier(tier);
      if (success) {
        toast({
          title: "Subscription Updated!",
          description: `Successfully upgraded to ${tier.replace("_", " ").toUpperCase()}`,
        });
      } else {
        toast({
          title: "Upgrade Failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSelectedTier(null);
    }
  };

  const handlePurchaseReport = async () => {
    try {
      const success = await purchaseReport();
      if (success) {
        toast({
          title: "Report Purchased!",
          description: "You now have 1 additional report credit.",
        });
      } else {
        toast({
          title: "Purchase Failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase report.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (tier: SubscriptionTier) => {
    const pricing = TIER_PRICING[tier];
    if (billingCycle === "annually" && typeof pricing.annually === "number") {
      const monthly = Math.round(pricing.annually / 12);
      return `$${monthly}/mo`;
    }
    return typeof pricing.monthly === "number"
      ? `$${pricing.monthly}/mo`
      : pricing.monthly;
  };

  const getDiscountText = (tier: SubscriptionTier) => {
    const pricing = TIER_PRICING[tier];
    if (
      billingCycle === "annually" &&
      typeof pricing.annually === "number" &&
      typeof pricing.monthly === "number"
    ) {
      const savings = Math.round(
        ((pricing.monthly * 12 - pricing.annually) / (pricing.monthly * 12)) *
          100,
      );
      return `Save ${savings}%`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-cyan-400">
            🔥 SCORPIUS SUBSCRIPTION TIERS 🔥
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Choose the perfect plan for your cybersecurity needs. From basic
            scanning to enterprise-grade security operations.
          </p>
        </motion.div>

        {/* Current Subscription Status */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-black/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getTierIcon(subscription.tier)}
                      <span className="text-xl font-semibold text-white">
                        {subscription.tier.replace("_", " ").toUpperCase()}
                      </span>
                      <Badge
                        variant={
                          subscription.isActive ? "default" : "destructive"
                        }
                        className="ml-2"
                      >
                        {subscription.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-gray-400">
                      {TIER_PRICING[subscription.tier].description}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">Billing</p>
                    <p className="text-white font-mono">
                      {subscription.billingCycle === "lifetime"
                        ? "Lifetime Access"
                        : subscription.billingCycle === "monthly"
                          ? "Monthly"
                          : "Annual"}
                    </p>
                    {subscription.nextBillingDate && (
                      <p className="text-xs text-gray-500">
                        Next:{" "}
                        {new Date(
                          subscription.nextBillingDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div>
                    {subscription.tier === SubscriptionTier.BASIC &&
                      subscription.reportsRemaining !== undefined && (
                        <>
                          <p className="text-sm text-gray-400 mb-1">
                            Reports Remaining
                          </p>
                          <p className="text-white font-mono text-lg">
                            {subscription.reportsRemaining}
                          </p>
                          <Button
                            onClick={handlePurchaseReport}
                            size="sm"
                            className="mt-2 bg-blue-600 hover:bg-blue-700"
                          >
                            Buy Report - $49
                          </Button>
                        </>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Billing Cycle Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="bg-gray-900 rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md font-mono text-sm transition-colors ${
                billingCycle === "monthly"
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annually")}
              className={`px-4 py-2 rounded-md font-mono text-sm transition-colors ${
                billingCycle === "annually"
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Annual{" "}
              <Badge variant="secondary" className="ml-2">
                Save 15%
              </Badge>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {Object.values(SubscriptionTier).map((tier, index) => {
            const isCurrentTier = subscription?.tier === tier;
            const pricing = TIER_PRICING[tier];

            return (
              <Card
                key={tier}
                className={`relative border-2 ${
                  isCurrentTier
                    ? "border-green-500 bg-green-500/10"
                    : pricing.popular
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-gray-600 bg-gray-900/50"
                } hover:border-red-500/50 transition-colors`}
              >
                {pricing.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-600 text-white px-2 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div
                    className={`mx-auto p-3 rounded-full bg-gradient-to-r ${getTierColor(tier)} w-fit mb-4`}
                  >
                    {getTierIcon(tier)}
                  </div>
                  <CardTitle className="text-xl font-mono text-white">
                    {tier.replace("_", " ").toUpperCase()}
                  </CardTitle>
                  <div className="text-3xl font-bold text-white">
                    {formatPrice(tier)}
                    {tier !== SubscriptionTier.ENTERPRISE && (
                      <span className="text-sm text-gray-400 font-normal">
                        {billingCycle === "annually"
                          ? "/mo billed annually"
                          : "/month"}
                      </span>
                    )}
                  </div>
                  {getDiscountText(tier) && (
                    <Badge variant="secondary" className="mx-auto">
                      {getDiscountText(tier)}
                    </Badge>
                  )}
                  <p className="text-gray-400 text-sm">{pricing.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {getTierFeatures(tier)
                      .slice(0, 6)
                      .map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span
                            className={
                              feature.startsWith("Everything")
                                ? "font-semibold text-cyan-400"
                                : "text-gray-300"
                            }
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    {getTierFeatures(tier).length > 6 && (
                      <p className="text-xs text-gray-500">
                        + {getTierFeatures(tier).length - 6} more features
                      </p>
                    )}
                  </div>

                  <Separator className="bg-gray-700" />

                  <Button
                    onClick={() => handleUpgrade(tier)}
                    disabled={
                      isCurrentTier || isLoading || selectedTier === tier
                    }
                    className={`w-full font-mono ${
                      isCurrentTier
                        ? "bg-gray-600 cursor-not-allowed"
                        : `bg-gradient-to-r ${getTierColor(tier)} hover:opacity-90`
                    }`}
                  >
                    {isCurrentTier ? (
                      "Current Plan"
                    ) : selectedTier === tier ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : tier === SubscriptionTier.ENTERPRISE ? (
                      "Contact Sales"
                    ) : (
                      `Upgrade to ${tier.replace("_", " ")}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-black/50 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 font-mono text-center">
                Complete Feature Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">
                        Feature
                      </th>
                      <th className="text-center py-3 px-4 text-blue-400">
                        Basic
                      </th>
                      <th className="text-center py-3 px-4 text-purple-400">
                        Premium
                      </th>
                      <th className="text-center py-3 px-4 text-red-400">
                        Hunter's
                      </th>
                      <th className="text-center py-3 px-4 text-yellow-400">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {[
                      {
                        name: "Smart Contract Scanner",
                        basic: true,
                        premium: true,
                        hunters: true,
                        enterprise: true,
                      },
                      {
                        name: "BuzzKill (TrapGrid)",
                        basic: "Basic",
                        premium: "Basic",
                        hunters: "Full Mode",
                        enterprise: "Full Mode",
                      },
                      {
                        name: "Report Generation",
                        basic: "Pay per ($49)",
                        premium: "Unlimited",
                        hunters: "Unlimited",
                        enterprise: "Unlimited",
                      },
                      {
                        name: "Exploit Simulator",
                        basic: false,
                        premium: true,
                        hunters: true,
                        enterprise: true,
                      },
                      {
                        name: "Honeypot Detector",
                        basic: false,
                        premium: true,
                        hunters: true,
                        enterprise: true,
                      },
                      {
                        name: "MEV Bot Framework",
                        basic: false,
                        premium: false,
                        hunters: true,
                        enterprise: true,
                      },
                      {
                        name: "Live Mempool Monitor",
                        basic: false,
                        premium: false,
                        hunters: true,
                        enterprise: true,
                      },
                      {
                        name: "Multi-user Teams",
                        basic: false,
                        premium: false,
                        hunters: false,
                        enterprise: true,
                      },
                      {
                        name: "White-label Branding",
                        basic: false,
                        premium: false,
                        hunters: false,
                        enterprise: true,
                      },
                      {
                        name: "Custom Modules",
                        basic: false,
                        premium: false,
                        hunters: false,
                        enterprise: true,
                      },
                    ].map((feature, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        <td className="py-3 px-4 font-medium">
                          {feature.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.basic === "boolean" ? (
                            feature.basic ? (
                              <Check className="h-4 w-4 text-green-400 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-400 mx-auto" />
                            )
                          ) : (
                            feature.basic
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.premium === "boolean" ? (
                            feature.premium ? (
                              <Check className="h-4 w-4 text-green-400 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-400 mx-auto" />
                            )
                          ) : (
                            feature.premium
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.hunters === "boolean" ? (
                            feature.hunters ? (
                              <Check className="h-4 w-4 text-green-400 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-400 mx-auto" />
                            )
                          ) : (
                            feature.hunters
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.enterprise === "boolean" ? (
                            feature.enterprise ? (
                              <Check className="h-4 w-4 text-green-400 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-400 mx-auto" />
                            )
                          ) : (
                            feature.enterprise
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-black/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 font-mono text-center">
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Can I change plans anytime?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Yes, you can upgrade or downgrade at any time. Changes take
                    effect immediately.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    What's the Hunter's Edition lifetime option?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Pay $997 once and get lifetime access to Hunter's Edition
                    features with all future updates.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Do you offer refunds?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Yes, we offer a 30-day money-back guarantee for all
                    subscription plans.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    What payment methods do you accept?
                  </h4>
                  <p className="text-gray-400 text-sm">
                    We accept all major credit cards, PayPal, and cryptocurrency
                    payments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

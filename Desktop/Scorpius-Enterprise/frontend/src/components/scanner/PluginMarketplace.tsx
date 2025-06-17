import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  Star,
  Shield,
  Zap,
  Crown,
  Users,
  Calendar,
  Code,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Lock,
  TrendingUp,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth, UserTier } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import apiMiddleware from "@/lib/apiMiddleware";

interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
    organization?: string;
  };
  category:
    | "security"
    | "performance"
    | "compliance"
    | "defi"
    | "nft"
    | "governance";
  tier: UserTier;
  price: {
    type: "free" | "paid" | "subscription";
    amount?: number;
    currency?: string;
    period?: "monthly" | "yearly";
  };
  rating: {
    average: number;
    count: number;
  };
  downloads: number;
  lastUpdated: string;
  features: string[];
  screenshots: string[];
  documentation: string;
  repository?: string;
  website?: string;
  installed: boolean;
  installing?: boolean;
  compatible: boolean;
  tags: string[];
  size: number; // in MB
  permissions: string[];
  changelog: {
    version: string;
    date: string;
    changes: string[];
  }[];
  reviews: PluginReview[];
}

interface PluginReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
}

interface PluginMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onPluginInstalled: (plugin: MarketplacePlugin) => void;
}

const SAMPLE_PLUGINS: MarketplacePlugin[] = [
  {
    id: "advanced-reentrancy-detector",
    name: "Advanced Reentrancy Detector",
    description:
      "Next-generation reentrancy detection with ML-powered analysis and cross-contract vulnerability detection",
    version: "3.2.1",
    author: {
      name: "ConsenSys Diligence",
      avatar: "/avatars/consensys.png",
      verified: true,
      organization: "ConsenSys",
    },
    category: "security",
    tier: "pro",
    price: { type: "paid", amount: 99, currency: "USD", period: "monthly" },
    rating: { average: 4.8, count: 342 },
    downloads: 15420,
    lastUpdated: "2024-01-15T10:00:00Z",
    features: [
      "Cross-contract reentrancy detection",
      "ML-powered vulnerability analysis",
      "Real-time monitoring",
      "Custom rule engine",
    ],
    screenshots: ["/screenshots/plugin1-1.png", "/screenshots/plugin1-2.png"],
    documentation: "https://docs.consensys.net/reentrancy-detector",
    repository: "https://github.com/consensys/reentrancy-detector",
    installed: false,
    compatible: true,
    tags: ["reentrancy", "security", "ml", "cross-contract"],
    size: 12.5,
    permissions: ["read_contracts", "analyze_bytecode", "network_access"],
    changelog: [
      {
        version: "3.2.1",
        date: "2024-01-15",
        changes: [
          "Fixed false positives in proxy contracts",
          "Improved performance by 30%",
        ],
      },
    ],
    reviews: [
      {
        id: "1",
        author: "security_expert",
        rating: 5,
        title: "Excellent detection capabilities",
        content: "This plugin caught vulnerabilities our other tools missed.",
        date: "2024-01-10",
        verified: true,
      },
    ],
  },
  {
    id: "defi-flashloan-analyzer",
    name: "DeFi Flash Loan Analyzer",
    description:
      "Specialized analysis for flash loan vulnerabilities and MEV opportunities in DeFi protocols",
    version: "2.1.0",
    author: {
      name: "DeFi Security Labs",
      verified: true,
      organization: "DeFi Security Labs",
    },
    category: "defi",
    tier: "pro",
    price: {
      type: "subscription",
      amount: 149,
      currency: "USD",
      period: "monthly",
    },
    rating: { average: 4.6, count: 128 },
    downloads: 8920,
    lastUpdated: "2024-01-12T14:30:00Z",
    features: [
      "Flash loan vulnerability detection",
      "MEV opportunity analysis",
      "Protocol-specific checks",
      "Liquidity pool analysis",
    ],
    screenshots: [],
    documentation: "https://docs.defisec.io/flashloan-analyzer",
    installed: false,
    compatible: true,
    tags: ["defi", "flashloan", "mev", "liquidity"],
    size: 8.2,
    permissions: ["read_contracts", "analyze_transactions", "price_feeds"],
    changelog: [],
    reviews: [],
  },
  {
    id: "ai-smart-contract-auditor",
    name: "AI Smart Contract Auditor",
    description:
      "GPT-4 powered comprehensive smart contract auditing with natural language explanations",
    version: "1.5.2",
    author: {
      name: "OpenZeppelin",
      verified: true,
      organization: "OpenZeppelin",
    },
    category: "security",
    tier: "enterprise",
    price: {
      type: "subscription",
      amount: 299,
      currency: "USD",
      period: "monthly",
    },
    rating: { average: 4.9, count: 89 },
    downloads: 3420,
    lastUpdated: "2024-01-16T11:45:00Z",
    features: [
      "AI-powered code analysis",
      "Natural language explanations",
      "Custom vulnerability patterns",
      "Integration with OpenAI GPT-4",
    ],
    screenshots: [],
    documentation: "https://docs.openzeppelin.com/ai-auditor",
    installed: false,
    compatible: true,
    tags: ["ai", "gpt-4", "audit", "nlp"],
    size: 25.8,
    permissions: ["read_contracts", "analyze_bytecode", "ai_api_access"],
    changelog: [],
    reviews: [],
  },
  {
    id: "gas-optimization-analyzer",
    name: "Gas Optimization Analyzer",
    description:
      "Free tool for identifying gas optimization opportunities in smart contracts",
    version: "1.8.0",
    author: {
      name: "Ethereum Foundation",
      verified: true,
      organization: "Ethereum Foundation",
    },
    category: "performance",
    tier: "community",
    price: { type: "free" },
    rating: { average: 4.3, count: 1250 },
    downloads: 45200,
    lastUpdated: "2024-01-08T09:20:00Z",
    features: [
      "Gas usage analysis",
      "Optimization suggestions",
      "Before/after comparisons",
      "Best practices recommendations",
    ],
    screenshots: [],
    documentation: "https://ethereum.org/gas-analyzer",
    installed: true,
    compatible: true,
    tags: ["gas", "optimization", "performance", "ethereum"],
    size: 5.1,
    permissions: ["read_contracts", "analyze_bytecode"],
    changelog: [],
    reviews: [],
  },
];

export function PluginMarketplace({
  isOpen,
  onClose,
  onPluginInstalled,
}: PluginMarketplaceProps) {
  const { user } = useAuth();
  const { canUseFeature } = useFeatureFlags();

  const [plugins, setPlugins] = useState<MarketplacePlugin[]>(SAMPLE_PLUGINS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [selectedPlugin, setSelectedPlugin] =
    useState<MarketplacePlugin | null>(null);
  const [showPluginDetails, setShowPluginDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMarketplacePlugins();
    }
  }, [isOpen]);

  const loadMarketplacePlugins = async () => {
    try {
      const response = await apiMiddleware.get("/api/marketplace/plugins", {
        feature: "basic_scanning",
      });

      if (response.success && response.data) {
        setPlugins(response.data.plugins || SAMPLE_PLUGINS);
      }
    } catch (error) {
      console.error("Failed to load marketplace plugins:", error);
      setPlugins(SAMPLE_PLUGINS);
    }
  };

  const installPlugin = async (plugin: MarketplacePlugin) => {
    if (!canAccessPlugin(plugin)) return;

    setPlugins((prev) =>
      prev.map((p) => (p.id === plugin.id ? { ...p, installing: true } : p)),
    );

    try {
      const response = await apiMiddleware.post(
        `/api/marketplace/plugins/${plugin.id}/install`,
        {},
        { feature: "basic_scanning" },
      );

      if (response.success) {
        setPlugins((prev) =>
          prev.map((p) =>
            p.id === plugin.id
              ? { ...p, installed: true, installing: false }
              : p,
          ),
        );

        onPluginInstalled(plugin);
      }
    } catch (error) {
      console.error("Failed to install plugin:", error);
      setPlugins((prev) =>
        prev.map((p) => (p.id === plugin.id ? { ...p, installing: false } : p)),
      );
    }
  };

  const canAccessPlugin = (plugin: MarketplacePlugin): boolean => {
    if (!user) return false;

    const tierHierarchy: UserTier[] = [
      "community",
      "starter",
      "pro",
      "enterprise",
    ];
    const userTierIndex = tierHierarchy.indexOf(user.tier);
    const pluginTierIndex = tierHierarchy.indexOf(plugin.tier);

    return userTierIndex >= pluginTierIndex;
  };

  const filteredPlugins = plugins
    .filter((plugin) => {
      const matchesSearch =
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesCategory =
        categoryFilter === "all" || plugin.category === categoryFilter;

      const matchesTier = tierFilter === "all" || plugin.tier === tierFilter;

      return matchesSearch && matchesCategory && matchesTier;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.downloads - a.downloads;
        case "rating":
          return b.rating.average - a.rating.average;
        case "newest":
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case "community":
        return Shield;
      case "starter":
        return Zap;
      case "pro":
        return Crown;
      case "enterprise":
        return Crown;
      default:
        return Shield;
    }
  };

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case "community":
        return "text-gray-500";
      case "starter":
        return "text-blue-500";
      case "pro":
        return "text-green-500";
      case "enterprise":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Plugin Marketplace
            </DialogTitle>
            <DialogDescription>
              Discover and install plugins to enhance your security analysis
              capabilities
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col h-[70vh]">
            {/* Search and Filters */}
            <div className="space-y-4 pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search plugins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                    <SelectItem value="nft">NFT</SelectItem>
                    <SelectItem value="governance">Governance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Plugin Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <AnimatePresence>
                  {filteredPlugins.map((plugin) => {
                    const TierIcon = getTierIcon(plugin.tier);
                    const canAccess = canAccessPlugin(plugin);

                    return (
                      <motion.div
                        key={plugin.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`group cursor-pointer ${!canAccess ? "opacity-50" : ""}`}
                        onClick={() => {
                          setSelectedPlugin(plugin);
                          setShowPluginDetails(true);
                        }}
                      >
                        <Card className="h-full hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-base font-semibold text-black">
                                    {plugin.name}
                                  </CardTitle>
                                  {plugin.author.verified && (
                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                  )}
                                  {!canAccess && (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getTierColor(plugin.tier)}`}
                                  >
                                    <TierIcon className="h-3 w-3 mr-1" />
                                    {plugin.tier}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {plugin.category}
                                  </Badge>
                                  {plugin.price.type === "free" ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-green-600"
                                    >
                                      Free
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      ${plugin.price.amount}/
                                      {plugin.price.period}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={plugin.author.avatar} />
                                <AvatarFallback>
                                  {plugin.author.name
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {plugin.description}
                            </p>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1">
                                {renderStars(plugin.rating.average)}
                                <span className="text-gray-600 ml-1">
                                  {plugin.rating.average} ({plugin.rating.count}
                                  )
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                <Users className="h-3 w-3" />
                                <span>{plugin.downloads.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                v{plugin.version} • {plugin.size}MB
                              </div>
                              {plugin.installed ? (
                                <Badge
                                  variant="outline"
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Installed
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={!canAccess || plugin.installing}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    installPlugin(plugin);
                                  }}
                                  className="text-xs"
                                >
                                  {plugin.installing ? (
                                    <>
                                      <Download className="h-3 w-3 mr-1 animate-pulse" />
                                      Installing...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-3 w-3 mr-1" />
                                      Install
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {filteredPlugins.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No plugins found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plugin Details Dialog */}
      {selectedPlugin && (
        <Dialog open={showPluginDetails} onOpenChange={setShowPluginDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedPlugin.name}
                    {selectedPlugin.author.verified && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    by {selectedPlugin.author.name} •{" "}
                    {selectedPlugin.author.organization}
                  </DialogDescription>
                </div>
                {selectedPlugin.installed ? (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Installed
                  </Badge>
                ) : (
                  <Button
                    disabled={
                      !canAccessPlugin(selectedPlugin) ||
                      selectedPlugin.installing
                    }
                    onClick={() => installPlugin(selectedPlugin)}
                  >
                    {selectedPlugin.installing ? (
                      <>
                        <Download className="h-4 w-4 mr-2 animate-pulse" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Install Plugin
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Plugin Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-4">
                  <p className="text-gray-600">{selectedPlugin.description}</p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {renderStars(selectedPlugin.rating.average)}
                      <span className="text-sm text-gray-600 ml-1">
                        {selectedPlugin.rating.average} (
                        {selectedPlugin.rating.count} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {selectedPlugin.downloads.toLocaleString()} downloads
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Version</Label>
                    <p className="font-mono">{selectedPlugin.version}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Size</Label>
                    <p>{selectedPlugin.size}MB</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Updated</Label>
                    <p>
                      {new Date(
                        selectedPlugin.lastUpdated,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div>
                <h3 className="font-semibold mb-3">Features</h3>
                <ul className="space-y-1">
                  {selectedPlugin.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="font-semibold mb-3">Permissions Required</h3>
                <div className="space-y-2">
                  {selectedPlugin.permissions.map((permission, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Shield className="h-4 w-4 text-yellow-500" />
                      <span>{permission.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              {selectedPlugin.reviews.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Reviews</h3>
                  <div className="space-y-3">
                    {selectedPlugin.reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.author}</span>
                            {review.verified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <h4 className="font-medium text-sm mb-1">
                          {review.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {review.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              <div className="flex items-center gap-4">
                {selectedPlugin.documentation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(selectedPlugin.documentation, "_blank")
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Documentation
                  </Button>
                )}
                {selectedPlugin.repository && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(selectedPlugin.repository, "_blank")
                    }
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Repository
                  </Button>
                )}
                {selectedPlugin.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(selectedPlugin.website, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Website
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

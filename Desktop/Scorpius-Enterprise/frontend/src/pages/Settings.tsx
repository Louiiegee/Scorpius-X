/**
 * Settings Page
 * Comprehensive settings management with tabbed interface
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Network,
  Key,
  Monitor,
  Shield,
  Zap,
  FileText,
  HelpCircle,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings } from "@/context/SettingsContext";
import { NetworkSettings } from "@/components/settings/NetworkSettings";
import { APIKeysSettings } from "@/components/settings/APIKeysSettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { toast } from "sonner";
import { useLicense } from "@/hooks/useLicense";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface SettingsTabInfo {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
  component: React.ComponentType;
}

export function SettingsPage() {
  const { settings, saveSettings, isLoading } = useSettings();
  const { tier } = useLicense();
  const { hasFeature } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState("general");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const settingsTabs: SettingsTabInfo[] = [
    {
      id: "general",
      label: "General",
      icon: Monitor,
      description: "Theme, notifications, and basic preferences",
      component: GeneralSettings,
    },
    {
      id: "network",
      label: "Networks",
      icon: Network,
      description: "RPC endpoints and blockchain connections",
      component: NetworkSettings,
    },
    {
      id: "api-keys",
      label: "API Keys",
      icon: Key,
      description: "Third-party service API keys and integrations",
      badge: "Secure",
      component: APIKeysSettings,
    },
  ];

  const handleSaveAll = () => {
    saveSettings();
    setHasUnsavedChanges(false);
  };

  const getTabIcon = (IconComponent: React.ElementType, isActive: boolean) => (
    <IconComponent className={`h-4 w-4 ${isActive ? "text-blue-600" : ""}`} />
  );

  const getConfigurationStatus = () => {
    const rpcConfigured = Object.values(settings.rpcUrls).filter(
      Boolean,
    ).length;
    const apiKeysConfigured = Object.values(settings.apiKeys).filter(
      Boolean,
    ).length;
    const totalRpcs = Object.keys(settings.rpcUrls).length;
    const totalApiKeys = Object.keys(settings.apiKeys).length;

    return {
      rpc: `${rpcConfigured}/${totalRpcs}`,
      apiKeys: `${apiKeysConfigured}/${totalApiKeys}`,
      overall: Math.round(
        ((rpcConfigured + apiKeysConfigured) / (totalRpcs + totalApiKeys)) *
          100,
      ),
    };
  };

  const status = getConfigurationStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-blue-400 text-lg">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <SettingsIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent">
                    Scorpius Settings
                  </h1>
                  <p className="text-gray-600">
                    Configure your blockchain analysis platform
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                {tier.toUpperCase()} Plan
              </Badge>
              <Button onClick={handleSaveAll} disabled={!hasUnsavedChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
            </div>
          </div>

          {/* Configuration Status */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Configuration Status:
                    </span>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <Network className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{status.rpc}</span>
                        <span className="text-muted-foreground">RPCs</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Key className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{status.apiKeys}</span>
                        <span className="text-muted-foreground">API Keys</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-muted-foreground">Overall:</div>
                  <Badge
                    variant={
                      status.overall >= 80
                        ? "default"
                        : status.overall >= 50
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {status.overall >= 80 ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {status.overall}% Complete
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TooltipProvider>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              {/* Tabs Navigation */}
              <Card>
                <CardContent className="pt-6">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-3">
                    {settingsTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center space-x-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                      >
                        {getTabIcon(tab.icon, activeTab === tab.id)}
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.badge && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            {tab.badge}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Tab Description */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {
                        settingsTabs.find((tab) => tab.id === activeTab)
                          ?.description
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {settingsTabs.map((tab) => (
                  <TabsContent
                    key={tab.id}
                    value={tab.id}
                    className="space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <tab.icon className="h-5 w-5 text-blue-600" />
                            <span>{tab.label} Settings</span>
                            {tab.badge && (
                              <Badge variant="outline" className="text-xs">
                                {tab.badge}
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                            <tab.component />
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                ))}
              </AnimatePresence>
            </Tabs>
          </TooltipProvider>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span>
                    Last updated:{" "}
                    {new Date(settings.lastUpdated).toLocaleString()}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Version: 1.0.0</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Plan: {tier.toUpperCase()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Settings are automatically saved and encrypted locally
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <span>Settings secured with encryption</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default SettingsPage;

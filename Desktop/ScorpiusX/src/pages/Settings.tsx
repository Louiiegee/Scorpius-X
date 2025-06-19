import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Monitor,
  Key,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Smartphone,
  Zap,
  Globe,
  Database,
  Clock,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  HardDrive,
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle,
  Link,
  Server,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStorage, useUserData } from "@/hooks/useStorage";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Settings = () => {
  const { userData, updateProfile, updatePreferences } = useUserData();
  const { clearAllData, getStorageStats } = useStorage();

  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Initialize storage stats when component mounts
  React.useEffect(() => {
    setStorageStats(getStorageStats());
  }, [getStorageStats]);

  // Initialize default user data if not provided
  const currentUserData = userData || {
    profile: {
      username: "alice",
      email: "alice@scorpius.com",
      role: "admin",
      preferences: {
        theme: "cyberpunk",
        notifications: true,
        autoScan: false,
        soundEffects: true,
      },
    },
    lastLogin: new Date().toISOString(),
    sessionCount: 1,
  };

  // Only show loading if still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-red-400">Loading Settings...</p>
        </div>
      </div>
    );
  }

  // RPC Configuration
  const [rpcConfig, setRpcConfig] = useState({
    ethereum: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
    bsc: "https://bsc-dataseed.binance.org/",
    polygon: "https://polygon-rpc.com/",
    arbitrum: "https://arb1.arbitrum.io/rpc",
    avalanche: "https://api.avax.network/ext/bc/C/rpc",
    fantom: "https://rpc.ftm.tools/",
  });

  // API Configuration
  const [apiConfig, setApiConfig] = useState({
    etherscan: "",
    bscscan: "",
    polygonscan: "",
    arbiscan: "",
    snowtrace: "",
    ftmscan: "",
    coingecko: "",
    dexscreener: "",
    moralis: "",
    alchemy: "",
  });

  // Notification Configuration
  const [notificationConfig, setNotificationConfig] = useState({
    telegram: {
      enabled: false,
      botToken: "",
      chatId: "",
    },
    slack: {
      enabled: false,
      webhookUrl: "",
      channel: "",
    },
    discord: {
      enabled: false,
      webhookUrl: "",
    },
    email: {
      enabled: false,
      smtp: "",
      username: "",
      password: "",
      to: "",
    },
    webhook: {
      enabled: false,
      url: "",
      secret: "",
    },
  });

  useEffect(() => {
    setStorageStats(getStorageStats());

    // Initialize user profile if it's empty
    if (currentUserData?.profile && !currentUserData.profile.username) {
      updateProfile({
        username: "alice",
        email: "alice@scorpius.com",
        role: "admin",
      });
    }
  }, [getStorageStats, updateProfile]);

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Save to localStorage for frontend
      localStorage.setItem("scorpius_rpc_config", JSON.stringify(rpcConfig));
      localStorage.setItem("scorpius_api_config", JSON.stringify(apiConfig));
      localStorage.setItem(
        "scorpius_notification_config",
        JSON.stringify(notificationConfig),
      );

      // Send configuration to backend to update .env file
      const configPayload = {
        rpc: rpcConfig,
        api: apiConfig,
        notifications: notificationConfig,
      };

      const response = await fetch("/api/config/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to update backend configuration");
      }

      const result = await response.json();

      // Update user profile
      await updateProfile({
        username: userData?.profile?.username || "User",
        email: userData?.profile?.email || "user@scorpius.net",
        role: userData?.profile?.role || "Security Analyst",
      });

      // Update preferences
      await updatePreferences(userData?.profile?.preferences || {});

      toast({
        title: "Settings Saved",
        description: `Configuration updated successfully. Backend modules will use new settings: ${result.updated_sections.join(", ")}`,
      });
    } catch (error) {
      console.error("Settings save error:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (type, config) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/config/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_type: type,
          config_data: config,
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        toast({
          title: "Connection Test",
          description: `${type} connection successful!`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description:
            result.message ||
            `Failed to connect to ${type}. Check your configuration.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to test ${type} connection. Check your configuration.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    setIsLoading(true);

    try {
      await clearAllData();
      setShowClearDataDialog(false);
      setStorageStats(getStorageStats());

      toast({
        title: "Data Cleared",
        description: "All application data has been cleared.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              className="p-3 rounded-xl bg-red-500/20 border border-red-500/30"
              whileHover={{ scale: 1.05 }}
            >
              <SettingsIcon className="h-8 w-8 text-red-400" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-red-400">
                SYSTEM CONFIGURATION
              </h1>
              <p className="text-gray-400">
                Configure RPC endpoints, API keys, and notifications
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-black/50 border border-red-500/30">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-red-500/20 text-red-400"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="rpc"
              className="data-[state=active]:bg-red-500/20 text-red-400"
            >
              <Globe className="h-4 w-4 mr-2" />
              RPC Config
            </TabsTrigger>
            <TabsTrigger
              value="api"
              className="data-[state=active]:bg-red-500/20 text-red-400"
            >
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-red-500/20 text-red-400"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-red-500/20 text-red-400"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="data-[state=active]:bg-red-500/20 text-red-400"
            >
              <Database className="h-4 w-4 mr-2" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-red-400">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={currentUserData?.profile?.username || ""}
                      onChange={(e) => {
                        updateProfile({ username: e.target.value });
                      }}
                      className="bg-black/50 border-red-500/30 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-red-400">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={currentUserData?.profile?.email || ""}
                      onChange={(e) => {
                        updateProfile({ email: e.target.value });
                      }}
                      className="bg-black/50 border-red-500/30 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RPC Configuration */}
          <TabsContent value="rpc" className="space-y-6">
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  RPC Endpoints Configuration
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Configure blockchain RPC endpoints for real-time data access
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(rpcConfig).map(([network, url]) => (
                  <div key={network} className="space-y-2">
                    <Label className="text-red-400 capitalize">
                      {network} RPC URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={url}
                        onChange={(e) =>
                          setRpcConfig((prev) => ({
                            ...prev,
                            [network]: e.target.value,
                          }))
                        }
                        className="bg-black/50 border-red-500/30 text-white"
                        placeholder={`Enter ${network} RPC URL...`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          testConnection(network.toUpperCase(), url)
                        }
                        className="border-red-500/30 text-red-400"
                        disabled={isLoading}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Configuration */}
          <TabsContent value="api" className="space-y-6">
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys Configuration
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Configure API keys for enhanced data access and features
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(apiConfig).map(([service, key]) => (
                  <div key={service} className="space-y-2">
                    <Label className="text-red-400 capitalize">
                      {service} API Key
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showPasswords[service] ? "text" : "password"}
                          value={key}
                          onChange={(e) =>
                            setApiConfig((prev) => ({
                              ...prev,
                              [service]: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-red-500/30 text-white pr-10"
                          placeholder={`Enter ${service} API key...`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400"
                          onClick={() => togglePasswordVisibility(service)}
                        >
                          {showPasswords[service] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          testConnection(service.toUpperCase(), key)
                        }
                        className="border-red-500/30 text-red-400"
                        disabled={isLoading || !key}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Configuration */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Telegram */}
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Telegram Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-red-400">Enable Telegram</Label>
                  <Switch
                    checked={notificationConfig.telegram.enabled}
                    onCheckedChange={(checked) =>
                      setNotificationConfig((prev) => ({
                        ...prev,
                        telegram: { ...prev.telegram, enabled: checked },
                      }))
                    }
                  />
                </div>
                {notificationConfig.telegram.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-red-400">Bot Token</Label>
                      <Input
                        type="password"
                        value={notificationConfig.telegram.botToken}
                        onChange={(e) =>
                          setNotificationConfig((prev) => ({
                            ...prev,
                            telegram: {
                              ...prev.telegram,
                              botToken: e.target.value,
                            },
                          }))
                        }
                        className="bg-black/50 border-red-500/30 text-white"
                        placeholder="Enter Telegram bot token..."
                      />
                    </div>
                    <div>
                      <Label className="text-red-400">Chat ID</Label>
                      <Input
                        value={notificationConfig.telegram.chatId}
                        onChange={(e) =>
                          setNotificationConfig((prev) => ({
                            ...prev,
                            telegram: {
                              ...prev.telegram,
                              chatId: e.target.value,
                            },
                          }))
                        }
                        className="bg-black/50 border-red-500/30 text-white"
                        placeholder="Enter chat ID..."
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        testConnection("Telegram", notificationConfig.telegram)
                      }
                      className="border-red-500/30 text-red-400"
                      disabled={isLoading}
                    >
                      Test Telegram
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Slack */}
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Slack Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-red-400">Enable Slack</Label>
                  <Switch
                    checked={notificationConfig.slack.enabled}
                    onCheckedChange={(checked) =>
                      setNotificationConfig((prev) => ({
                        ...prev,
                        slack: { ...prev.slack, enabled: checked },
                      }))
                    }
                  />
                </div>
                {notificationConfig.slack.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-red-400">Webhook URL</Label>
                      <Input
                        type="password"
                        value={notificationConfig.slack.webhookUrl}
                        onChange={(e) =>
                          setNotificationConfig((prev) => ({
                            ...prev,
                            slack: {
                              ...prev.slack,
                              webhookUrl: e.target.value,
                            },
                          }))
                        }
                        className="bg-black/50 border-red-500/30 text-white"
                        placeholder="Enter Slack webhook URL..."
                      />
                    </div>
                    <div>
                      <Label className="text-red-400">Channel</Label>
                      <Input
                        value={notificationConfig.slack.channel}
                        onChange={(e) =>
                          setNotificationConfig((prev) => ({
                            ...prev,
                            slack: { ...prev.slack, channel: e.target.value },
                          }))
                        }
                        className="bg-black/50 border-red-500/30 text-white"
                        placeholder="Enter channel name..."
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        testConnection("Slack", notificationConfig.slack)
                      }
                      className="border-red-500/30 text-red-400"
                      disabled={isLoading}
                    >
                      Test Slack
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discord */}
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Discord Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-red-400">Enable Discord</Label>
                  <Switch
                    checked={notificationConfig.discord.enabled}
                    onCheckedChange={(checked) =>
                      setNotificationConfig((prev) => ({
                        ...prev,
                        discord: { ...prev.discord, enabled: checked },
                      }))
                    }
                  />
                </div>
                {notificationConfig.discord.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-red-400">Webhook URL</Label>
                      <Input
                        type="password"
                        value={notificationConfig.discord.webhookUrl}
                        onChange={(e) =>
                          setNotificationConfig((prev) => ({
                            ...prev,
                            discord: {
                              ...prev.discord,
                              webhookUrl: e.target.value,
                            },
                          }))
                        }
                        className="bg-black/50 border-red-500/30 text-white"
                        placeholder="Enter Discord webhook URL..."
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        testConnection("Discord", notificationConfig.discord)
                      }
                      className="border-red-500/30 text-red-400"
                      disabled={isLoading}
                    >
                      Test Discord
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-500/30 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">
                    All sensitive data is encrypted and stored securely.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-red-500/30 rounded-lg">
                    <HardDrive className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">
                      {storageStats?.totalSize || "0 KB"}
                    </p>
                    <p className="text-gray-400 text-sm">Total Storage</p>
                  </div>
                  <div className="text-center p-4 border border-red-500/30 rounded-lg">
                    <FileText className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">
                      {storageStats?.totalItems || "0"}
                    </p>
                    <p className="text-gray-400 text-sm">Total Items</p>
                  </div>
                  <div className="text-center p-4 border border-red-500/30 rounded-lg">
                    <Clock className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">
                      {storageStats?.lastUpdated || "Never"}
                    </p>
                    <p className="text-gray-400 text-sm">Last Updated</p>
                  </div>
                </div>

                <Separator className="bg-red-500/30" />

                <div className="space-y-4">
                  <h3 className="text-red-400 font-semibold">Danger Zone</h3>
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-400">
                      This action cannot be undone. All your data will be
                      permanently deleted.
                    </AlertDescription>
                  </Alert>
                  <AlertDialog
                    open={showClearDataDialog}
                    onOpenChange={setShowClearDataDialog}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-black border-red-500/30">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-400">
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          This action cannot be undone. This will permanently
                          delete all your data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-red-500/30 text-red-400">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearAllData}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isLoading}
                        >
                          {isLoading ? "Clearing..." : "Clear All Data"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-end"
        >
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Saving..." : "Save All Settings"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

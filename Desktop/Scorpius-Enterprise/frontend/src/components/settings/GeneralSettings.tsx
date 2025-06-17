/**
 * General Settings Component
 * Manages general application preferences and configurations
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
import {
  Monitor,
  Moon,
  Sun,
  Bell,
  Volume2,
  VolumeX,
  Lock,
  Zap,
  Database,
  Download,
  Upload,
  RotateCcw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Clock,
  Activity,
  FileText,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useLicense } from "@/hooks/useLicense";

export function GeneralSettings() {
  const {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
  } = useSettings();
  const { hasFeature } = useFeatureFlags();
  const { tier } = useLicense();
  const [importData, setImportData] = useState("");

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updateSetting("theme", theme);
    toast.success(`Theme changed to ${theme}`);
  };

  const handleRefreshIntervalChange = (value: number[]) => {
    updateSetting("refreshInterval", value[0]);
  };

  const handleAutoLockTimeoutChange = (value: number[]) => {
    updateSetting("autoLockTimeout", value[0]);
  };

  const handleMaxConcurrentScansChange = (value: number[]) => {
    updateSetting("maxConcurrentScans", value[0]);
  };

  const handleBatchSizeChange = (value: number[]) => {
    updateSetting("batchSize", value[0]);
  };

  const handleExportSettings = () => {
    const data = exportSettings();
    if (data) {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scorpius-settings-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Settings exported successfully");
    }
  };

  const handleImportSettings = () => {
    if (importData.trim()) {
      const success = importSettings(importData);
      if (success) {
        setImportData("");
      }
    } else {
      toast.error("Please paste settings data to import");
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure general application preferences and behavior
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            <Select
              value={settings.theme}
              onValueChange={(value: "light" | "dark" | "system") =>
                handleThemeChange(value)
              }
            >
              <SelectTrigger className="w-32">
                <div className="flex items-center">
                  {getThemeIcon(settings.theme)}
                  <SelectValue className="ml-2" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center">
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center">
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center">
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Refresh & Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Refresh & Updates
          </CardTitle>
          <CardDescription>
            Configure automatic refresh and update behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Refresh</Label>
              <p className="text-sm text-muted-foreground">
                Automatically refresh dashboard data
              </p>
            </div>
            <Switch
              checked={settings.autoRefresh}
              onCheckedChange={(checked) =>
                updateSetting("autoRefresh", checked)
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Refresh Interval</Label>
              <Badge variant="secondary">
                {formatTime(settings.refreshInterval)}
              </Badge>
            </div>
            <Slider
              value={[settings.refreshInterval]}
              onValueChange={handleRefreshIntervalChange}
              max={300}
              min={10}
              step={10}
              disabled={!settings.autoRefresh}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How often to refresh dashboard data (10s - 5m)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage notification preferences and sound settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show desktop notifications for important events
              </p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) =>
                updateSetting("enableNotifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sound Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Play sound for alerts and notifications
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  updateSetting("soundEnabled", checked)
                }
                disabled={!settings.enableNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security
          </CardTitle>
          <CardDescription>
            Configure security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Auth for Settings</Label>
              <p className="text-sm text-muted-foreground">
                Require authentication to modify settings
              </p>
            </div>
            <Switch
              checked={settings.requireAuthForSettings}
              onCheckedChange={(checked) =>
                updateSetting("requireAuthForSettings", checked)
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Auto Lock Timeout</Label>
              <Badge variant="secondary">
                {settings.autoLockTimeout === 0
                  ? "Never"
                  : formatMinutes(settings.autoLockTimeout)}
              </Badge>
            </div>
            <Slider
              value={[settings.autoLockTimeout]}
              onValueChange={handleAutoLockTimeoutChange}
              max={120}
              min={0}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Automatically lock the application after inactivity (0 = never)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Log Level</Label>
              <p className="text-sm text-muted-foreground">
                Set the verbosity of application logs
              </p>
            </div>
            <Select
              value={settings.logLevel}
              onValueChange={(value: "error" | "warn" | "info" | "debug") =>
                updateSetting("logLevel", value)
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warn</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Performance
          </CardTitle>
          <CardDescription>
            Optimize application performance and resource usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Caching</Label>
              <p className="text-sm text-muted-foreground">
                Cache data to improve performance
              </p>
            </div>
            <Switch
              checked={settings.cacheEnabled}
              onCheckedChange={(checked) =>
                updateSetting("cacheEnabled", checked)
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Concurrent Scans</Label>
              <Badge variant="secondary">{settings.maxConcurrentScans}</Badge>
            </div>
            <Slider
              value={[settings.maxConcurrentScans]}
              onValueChange={handleMaxConcurrentScansChange}
              max={tier === "enterprise" ? 50 : tier === "pro" ? 20 : 10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of simultaneous vulnerability scans (tier limited)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Batch Size</Label>
              <Badge variant="secondary">{settings.batchSize}</Badge>
            </div>
            <Slider
              value={[settings.batchSize]}
              onValueChange={handleBatchSizeChange}
              max={1000}
              min={10}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Number of items to process in each batch operation
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Export/Import
          </CardTitle>
          <CardDescription>
            Manage settings backup and restore operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Default Export Format</Label>
              <p className="text-sm text-muted-foreground">
                Default format for exporting data
              </p>
            </div>
            <Select
              value={settings.defaultExportFormat}
              onValueChange={(value: "json" | "csv" | "pdf") =>
                updateSetting("defaultExportFormat", value)
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Include Metadata</Label>
              <p className="text-sm text-muted-foreground">
                Include metadata in exported data
              </p>
            </div>
            <Switch
              checked={settings.includeMetadata}
              onCheckedChange={(checked) =>
                updateSetting("includeMetadata", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportSettings}>
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            <div className="flex-1">
              <Input
                placeholder="Paste settings JSON here to import..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="text-xs"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleImportSettings}
              disabled={!importData.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {hasFeature("advanced_settings") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <SettingsIcon className="h-5 w-5 mr-2" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Experimental features and developer options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Experimental Features</Label>
                <p className="text-sm text-muted-foreground">
                  Enable beta features (may be unstable)
                </p>
              </div>
              <Switch
                checked={settings.experimentalFeatures}
                onCheckedChange={(checked) =>
                  updateSetting("experimentalFeatures", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Beta Access</Label>
                <p className="text-sm text-muted-foreground">
                  Participate in beta testing programs
                </p>
              </div>
              <Switch
                checked={settings.betaAccess}
                onCheckedChange={(checked) =>
                  updateSetting("betaAccess", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Developer Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable developer tools and debugging
                </p>
              </div>
              <Switch
                checked={settings.developerMode}
                onCheckedChange={(checked) =>
                  updateSetting("developerMode", checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Settings */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-700 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Reset Settings
          </CardTitle>
          <CardDescription>
            Reset all settings to their default values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Settings</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will reset all settings to their default values,
                  including API keys, RPC URLs, and preferences. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetSettings}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reset Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Settings Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-medium text-blue-900">
                Settings Information
              </h5>
              <p className="text-sm text-blue-700">
                Settings are automatically saved and encrypted locally. Last
                updated: {new Date(settings.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

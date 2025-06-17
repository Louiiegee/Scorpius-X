/**
 * API Keys Settings Component
 * Manages API keys for various third-party services
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key,
  Plus,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Edit,
  Copy,
  Shield,
  Star,
  Crown,
  Zap,
} from "lucide-react";
import {
  useSettings,
  API_SERVICES,
  ApiServiceKey,
} from "@/context/SettingsContext";
import { validateApiKey, maskSensitiveString } from "@/lib/settingsEncryption";
import { toast } from "sonner";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useLicense } from "@/hooks/useLicense";

interface ApiKeyCardProps {
  serviceKey: ApiServiceKey;
  service: (typeof API_SERVICES)[ApiServiceKey];
  currentKey: string;
  onUpdate: (key: string) => void;
  onTest: (service: string, key: string) => Promise<boolean>;
}

function ApiKeyCard({
  serviceKey,
  service,
  currentKey,
  onUpdate,
  onTest,
}: ApiKeyCardProps) {
  const [key, setKey] = useState(currentKey);
  const [isEditing, setIsEditing] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [isValid, setIsValid] = useState(true);
  const { tier } = useLicense();

  const handleSave = () => {
    if (validateApiKey(key, serviceKey)) {
      onUpdate(key);
      setIsEditing(false);
      setTestResult(null);
      toast.success(`${service.name} API key updated`);
    } else {
      setIsValid(false);
      toast.error("Invalid API key format");
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await onTest(serviceKey, key || currentKey);
      setTestResult(result);
      toast[result ? "success" : "error"](
        `${service.name} API ${result ? "key validated" : "key invalid"}`,
      );
    } catch (error) {
      setTestResult(false);
      toast.error(`Failed to test ${service.name} API key`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    setKey("");
    setIsValid(true);
    setTestResult(null);
  };

  const hasKey = Boolean(key || currentKey);
  const hasChanges = key !== currentKey;
  const isAccessible =
    !service.tier ||
    tier === service.tier ||
    (tier === "pro" && service.tier === "starter") ||
    tier === "enterprise";

  const getTierIcon = (tierRequired: string) => {
    switch (tierRequired) {
      case "community":
        return <Star className="h-3 w-3" />;
      case "starter":
        return <Zap className="h-3 w-3" />;
      case "pro":
        return <Crown className="h-3 w-3" />;
      case "enterprise":
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTierColor = (tierRequired: string) => {
    switch (tierRequired) {
      case "community":
        return "bg-gray-100 text-gray-700";
      case "starter":
        return "bg-blue-100 text-blue-700";
      case "pro":
        return "bg-purple-100 text-purple-700";
      case "enterprise":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card className={`relative ${!isAccessible ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{service.name}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {service.tier && (
              <Badge
                variant="secondary"
                className={`text-xs ${getTierColor(service.tier)}`}
              >
                {getTierIcon(service.tier)}
                <span className="ml-1 capitalize">{service.tier}</span>
              </Badge>
            )}
            {service.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            {testResult !== null && (
              <Badge
                variant={testResult ? "default" : "destructive"}
                className="text-xs"
              >
                {testResult ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {testResult ? "Valid" : "Invalid"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`api-${serviceKey}`}>API Key</Label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Input
                id={`api-${serviceKey}`}
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setIsValid(true);
                  setTestResult(null);
                }}
                placeholder={service.keyPlaceholder}
                disabled={!isEditing || !isAccessible}
                className={`pr-10 ${!isValid ? "border-red-500" : ""}`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                disabled={!hasKey}
                className="absolute right-0 top-0 h-full px-3"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(key || currentKey)}
              disabled={!hasKey}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {!isValid && (
            <p className="text-sm text-red-500">
              Invalid API key format for {service.name}
            </p>
          )}
          {hasKey && !showKey && (
            <p className="text-sm text-muted-foreground">
              Current: {maskSensitiveString(currentKey, 6)}
            </p>
          )}
        </div>

        {!isAccessible && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              This API key requires {service.tier} tier or higher.
              <Button
                variant="link"
                className="p-0 h-auto ml-1 text-yellow-800"
              >
                Upgrade your plan
              </Button>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting || !hasKey || !isAccessible}
            >
              {isTesting ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Validate
            </Button>

            {hasKey && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setKey(currentKey);
                    setIsValid(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!isValid || !hasChanges || !isAccessible}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={!isAccessible}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomApiKeyDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const { addCustomApiKey } = useSettings();

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the custom API key");
      return;
    }

    if (!key.trim()) {
      toast.error("Please enter the API key");
      return;
    }

    addCustomApiKey(name.trim(), key);
    setName("");
    setKey("");
    setDescription("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom API Key</DialogTitle>
          <DialogDescription>
            Add an API key for a service not listed in the standard options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-api-name">Service Name</Label>
            <Input
              id="custom-api-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Custom RPC Provider, Analytics Service"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-api-description">
              Description (Optional)
            </Label>
            <Input
              id="custom-api-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the service"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-api-key">API Key</Label>
            <Input
              id="custom-api-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter the API key"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim() || !key.trim()}>
            Add API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function APIKeysSettings() {
  const { settings, updateApiKey, removeCustomApiKey } = useSettings();
  const { hasFeature } = useFeatureFlags();
  const { tier } = useLicense();
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  // Mock API key testing function
  const testApiKey = async (service: string, key: string): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simple validation for demo
      if (!key || !validateApiKey(key, service)) return false;

      // Mock success rate - 85% chance of success for valid keys
      return Math.random() > 0.15;
    } catch {
      return false;
    }
  };

  const handleBulkValidate = async () => {
    const services = Object.keys(API_SERVICES) as ApiServiceKey[];
    const keysToTest = services.filter(
      (service) =>
        settings.apiKeys[service] && settings.apiKeys[service].length > 0,
    );

    if (keysToTest.length === 0) {
      toast.info("No API keys configured to validate");
      return;
    }

    let successCount = 0;
    toast.info(`Validating ${keysToTest.length} API keys...`);

    for (const service of keysToTest) {
      try {
        const success = await testApiKey(service, settings.apiKeys[service]);
        if (success) successCount++;
      } catch {
        // Continue testing other keys
      }
    }

    toast.success(
      `Bulk validation completed: ${successCount}/${keysToTest.length} keys valid`,
    );
  };

  const getConfiguredKeysCount = () => {
    return (
      Object.values(settings.apiKeys).filter(Boolean).length +
      Object.keys(settings.customApiKeys).length
    );
  };

  const getRequiredKeysCount = () => {
    return Object.values(API_SERVICES).filter((service) => service.required)
      .length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys for third-party services and integrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CustomApiKeyDialog />
          <Button variant="outline" size="sm" onClick={handleBulkValidate}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Validate All
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Keys Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Configured:</span>
              <span className="ml-2 font-medium">
                {getConfiguredKeysCount()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Required:</span>
              <span className="ml-2 font-medium">{getRequiredKeysCount()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current Tier:</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                <span className="capitalize">{tier}</span>
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Custom Keys:</span>
              <span className="ml-2 font-medium">
                {Object.keys(settings.customApiKeys).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Cards */}
      <div className="grid gap-4">
        {Object.entries(API_SERVICES).map(([serviceKey, service]) => (
          <ApiKeyCard
            key={serviceKey}
            serviceKey={serviceKey as ApiServiceKey}
            service={service}
            currentKey={settings.apiKeys[serviceKey as ApiServiceKey]}
            onUpdate={(key) => updateApiKey(serviceKey as ApiServiceKey, key)}
            onTest={testApiKey}
          />
        ))}
      </div>

      {/* Custom API Keys */}
      {Object.keys(settings.customApiKeys).length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-base font-semibold mb-3">Custom API Keys</h4>
            <div className="grid gap-3">
              {Object.entries(settings.customApiKeys).map(([name, key]) => (
                <Card key={name}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{name}</h5>
                        <p className="text-sm text-muted-foreground">
                          {maskSensitiveString(key, 6)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Custom API Key
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove the API key for
                                "{name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeCustomApiKey(name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-medium text-blue-900">Security Notice</h5>
              <p className="text-sm text-blue-700">
                API keys are encrypted and stored locally on your device. Never
                share your API keys with others. Some features may require
                specific API keys to function properly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

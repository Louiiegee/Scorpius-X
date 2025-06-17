/**
 * Network Settings Component
 * Manages RPC URLs for all supported blockchain networks
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
  Globe,
  Plus,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Edit,
  Copy,
  Shield,
} from "lucide-react";
import {
  useSettings,
  SUPPORTED_NETWORKS,
  NetworkKey,
} from "@/context/SettingsContext";
import { validateRpcUrl } from "@/lib/settingsEncryption";
import { toast } from "sonner";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface NetworkCardProps {
  networkKey: NetworkKey;
  network: (typeof SUPPORTED_NETWORKS)[NetworkKey];
  currentUrl: string;
  onUpdate: (url: string) => void;
  onTest: (url: string) => Promise<boolean>;
}

function NetworkCard({
  networkKey,
  network,
  currentUrl,
  onUpdate,
  onTest,
}: NetworkCardProps) {
  const [url, setUrl] = useState(currentUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [isValid, setIsValid] = useState(true);

  const handleSave = () => {
    if (validateRpcUrl(url)) {
      onUpdate(url);
      setIsEditing(false);
      setTestResult(null);
      toast.success(`${network.name} RPC URL updated`);
    } else {
      setIsValid(false);
      toast.error("Invalid RPC URL format");
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await onTest(url || network.defaultRpc);
      setTestResult(result);
      toast[result ? "success" : "error"](
        `${network.name} RPC ${result ? "connection successful" : "connection failed"}`,
      );
    } catch (error) {
      setTestResult(false);
      toast.error(`Failed to test ${network.name} RPC`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = () => {
    setUrl(network.defaultRpc);
    setIsValid(true);
    setTestResult(null);
  };

  const isUsingDefault = url === network.defaultRpc;
  const hasChanges = url !== currentUrl;

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: network.color }}
            />
            <div>
              <CardTitle className="text-base">{network.name}</CardTitle>
              <CardDescription>
                Chain ID: {network.chainId} • {network.symbol}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
                {testResult ? "Connected" : "Failed"}
              </Badge>
            )}
            {isUsingDefault && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`rpc-${networkKey}`}>RPC URL</Label>
          <div className="flex items-center space-x-2">
            <Input
              id={`rpc-${networkKey}`}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setIsValid(true);
                setTestResult(null);
              }}
              placeholder={network.defaultRpc}
              disabled={!isEditing}
              className={`flex-1 ${!isValid ? "border-red-500" : ""}`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(url)}
              disabled={!url}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {!isValid && (
            <p className="text-sm text-red-500">
              Invalid RPC URL format. Use https:// or wss://
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting || !url}
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>

            {!isUsingDefault && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
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
                    setUrl(currentUrl);
                    setIsValid(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!url || !isValid || !hasChanges}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
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

function CustomRpcDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(true);
  const { addCustomRpc } = useSettings();

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the custom RPC");
      return;
    }

    if (!validateRpcUrl(url)) {
      setIsValid(false);
      return;
    }

    addCustomRpc(name.trim(), url);
    setName("");
    setUrl("");
    setIsValid(true);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom RPC
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom RPC Endpoint</DialogTitle>
          <DialogDescription>
            Add a custom RPC endpoint for additional blockchain networks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-rpc-name">Network Name</Label>
            <Input
              id="custom-rpc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Avalanche, Fantom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-rpc-url">RPC URL</Label>
            <Input
              id="custom-rpc-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setIsValid(true);
              }}
              placeholder="https://api.avax.network/ext/bc/C/rpc"
              className={!isValid ? "border-red-500" : ""}
            />
            {!isValid && (
              <p className="text-sm text-red-500">
                Invalid RPC URL format. Use https:// or wss://
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim() || !url}>
            Add RPC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NetworkSettings() {
  const { settings, updateRpcUrl, removeCustomRpc } = useSettings();
  const { hasFeature } = useFeatureFlags();
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  // Mock RPC testing function
  const testRpcConnection = async (url: string): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simple validation for demo - in real app, make actual RPC call
      if (!url || !validateRpcUrl(url)) return false;

      // Mock success rate - 80% chance of success for valid URLs
      return Math.random() > 0.2;
    } catch {
      return false;
    }
  };

  const handleBulkTest = async () => {
    const networks = Object.keys(SUPPORTED_NETWORKS) as NetworkKey[];
    let successCount = 0;

    toast.info("Testing all RPC connections...");

    for (const networkKey of networks) {
      const url = settings.rpcUrls[networkKey];
      try {
        const success = await testRpcConnection(url);
        if (success) successCount++;
      } catch {
        // Continue testing other networks
      }
    }

    toast.success(
      `Bulk test completed: ${successCount}/${networks.length} connections successful`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Network Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure RPC endpoints for blockchain networks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CustomRpcDialog />
          <Button variant="outline" size="sm" onClick={handleBulkTest}>
            <Globe className="h-4 w-4 mr-2" />
            Test All
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Network Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-detect Network</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect and connect to the best available RPC
              </p>
            </div>
            <Switch
              checked={autoDetectEnabled}
              onCheckedChange={setAutoDetectEnabled}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Networks:</span>
              <span className="ml-2 font-medium">
                {Object.keys(SUPPORTED_NETWORKS).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Custom RPCs:</span>
              <span className="ml-2 font-medium">
                {Object.keys(settings.customRpcUrls).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Cards */}
      <div className="grid gap-4">
        {Object.entries(SUPPORTED_NETWORKS).map(([networkKey, network]) => (
          <NetworkCard
            key={networkKey}
            networkKey={networkKey as NetworkKey}
            network={network}
            currentUrl={settings.rpcUrls[networkKey as NetworkKey]}
            onUpdate={(url) => updateRpcUrl(networkKey as NetworkKey, url)}
            onTest={testRpcConnection}
          />
        ))}
      </div>

      {/* Custom RPCs */}
      {Object.keys(settings.customRpcUrls).length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-base font-semibold mb-3">
              Custom RPC Endpoints
            </h4>
            <div className="grid gap-3">
              {Object.entries(settings.customRpcUrls).map(([name, url]) => (
                <Card key={name}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{name}</h5>
                        <p className="text-sm text-muted-foreground truncate">
                          {url}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(url)}
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
                                Remove Custom RPC
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{name}"? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeCustomRpc(name)}
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
                RPC endpoints can see your IP address and transaction data. Only
                use trusted providers. Custom RPCs are stored securely and
                encrypted locally.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

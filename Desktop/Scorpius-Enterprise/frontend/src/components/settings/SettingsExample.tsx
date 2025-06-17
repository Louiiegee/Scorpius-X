/**
 * Settings Example Component
 * Demonstrates how to use settings throughout the application
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useSettings,
  useNetworkRpc,
  useApiKey,
  SUPPORTED_NETWORKS,
  API_SERVICES,
} from "@/context/SettingsContext";
import { Network, Key, Globe, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Example component showing how to use network RPC settings
 */
export function NetworkExample() {
  const ethereumRpc = useNetworkRpc("ethereum");
  const arbitrumRpc = useNetworkRpc("arbitrum");

  const testConnection = async (network: string, rpc: string) => {
    toast.info(`Testing ${network} connection...`);
    // In real implementation, this would test the RPC connection
    setTimeout(() => {
      toast.success(`${network} connection successful!`);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Network className="h-5 w-5 mr-2" />
          Network RPC Usage Example
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Ethereum</span>
              <Badge variant="outline">
                {SUPPORTED_NETWORKS.ethereum.chainId}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground break-all">
              {ethereumRpc}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testConnection("Ethereum", ethereumRpc)}
            >
              <Globe className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Arbitrum</span>
              <Badge variant="outline">
                {SUPPORTED_NETWORKS.arbitrum.chainId}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground break-all">
              {arbitrumRpc}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testConnection("Arbitrum", arbitrumRpc)}
            >
              <Globe className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example component showing how to use API key settings
 */
export function APIKeyExample() {
  const etherscanKey = useApiKey("etherscan");
  const openaiKey = useApiKey("openai");

  const testApiKey = async (service: string, key: string) => {
    if (!key) {
      toast.error(`No ${service} API key configured`);
      return;
    }

    toast.info(`Testing ${service} API key...`);
    // In real implementation, this would test the API key
    setTimeout(() => {
      toast.success(`${service} API key is valid!`);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />
          API Key Usage Example
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Etherscan</span>
              <div className="flex items-center space-x-1">
                {etherscanKey ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={etherscanKey ? "default" : "destructive"}>
                  {etherscanKey ? "Configured" : "Missing"}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {etherscanKey
                ? "API key configured"
                : "Required for blockchain data"}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={!etherscanKey}
              onClick={() => testApiKey("Etherscan", etherscanKey)}
            >
              Test API Key
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">OpenAI</span>
              <div className="flex items-center space-x-1">
                {openaiKey ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={openaiKey ? "default" : "secondary"}>
                  {openaiKey ? "Configured" : "Optional"}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {openaiKey ? "API key configured" : "Optional for AI analysis"}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={!openaiKey}
              onClick={() => testApiKey("OpenAI", openaiKey)}
            >
              Test API Key
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example component showing how to use general settings
 */
export function GeneralSettingsExample() {
  const { settings, updateSetting } = useSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings Usage Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Theme:</span>
            <Badge variant="outline" className="ml-2">
              {settings.theme}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Auto Refresh:</span>
            <Badge
              variant={settings.autoRefresh ? "default" : "secondary"}
              className="ml-2"
            >
              {settings.autoRefresh ? "On" : "Off"}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Refresh Interval:</span>
            <Badge variant="outline" className="ml-2">
              {settings.refreshInterval}s
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Notifications:</span>
            <Badge
              variant={settings.enableNotifications ? "default" : "secondary"}
              className="ml-2"
            >
              {settings.enableNotifications ? "On" : "Off"}
            </Badge>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateSetting("autoRefresh", !settings.autoRefresh)}
          >
            Toggle Auto Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              updateSetting(
                "enableNotifications",
                !settings.enableNotifications,
              )
            }
          >
            Toggle Notifications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main example component combining all examples
 */
export function SettingsUsageExample() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Settings Integration Examples
        </h3>
        <p className="text-muted-foreground">
          Examples showing how to use settings throughout your application
          components.
        </p>
      </div>

      <NetworkExample />
      <APIKeyExample />
      <GeneralSettingsExample />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Save, SettingsIcon, Wifi, KeyRound, Palette } from 'lucide-react';

interface NetworkSetting {
  id: string;
  name: string;
  rpcUrl: string;
}

interface ApiKeySetting {
  id: string;
  name: string;
  key: string;
  placeholder: string;
}

const initialGeneralSettings = {
  theme: 'system' as 'light' | 'dark' | 'system',
  desktopNotifications: true,
  autoRefreshInterval: 30, // seconds
};

const initialNetworkSettings: NetworkSetting[] = [
  { id: 'ethereum', name: 'Ethereum Mainnet', rpcUrl: '' },
  { id: 'polygon', name: 'Polygon Mainnet', rpcUrl: '' },
  { id: 'bsc', name: 'BNB Smart Chain', rpcUrl: '' },
  { id: 'arbitrum', name: 'Arbitrum One', rpcUrl: '' },
];

const initialApiKeySettings: ApiKeySetting[] = [
  { id: 'etherscan', name: 'Etherscan API Key', key: '', placeholder: 'YOUR_ETHERSCAN_API_KEY' },
  { id: 'openai', name: 'OpenAI API Key', key: '', placeholder: 'sk-...' },
  { id: 'alchemy', name: 'Alchemy API Key', key: '', placeholder: 'Your Alchemy Key' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [generalSettings, setGeneralSettings] = useState(initialGeneralSettings);
  const [networkSettings, setNetworkSettings] = useState<NetworkSetting[]>(initialNetworkSettings);
  const [apiKeySettings, setApiKeySettings] = useState<ApiKeySetting[]>(initialApiKeySettings);

  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingNetwork, setIsSavingNetwork] = useState(false);
  const [isSavingApiKeys, setIsSavingApiKeys] = useState(false);

  // Initialize general settings theme from global theme provider
  useEffect(() => {
    setGeneralSettings(prev => ({ ...prev, theme: theme }));
  }, [theme]);

  const handleGeneralSettingsChange = (field: keyof typeof initialGeneralSettings, value: any) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNetworkSettingChange = (id: string, value: string) => {
    setNetworkSettings(prev => prev.map(net => net.id === id ? { ...net, rpcUrl: value } : net));
  };

  const handleApiKeySettingChange = (id: string, value: string) => {
    setApiKeySettings(prev => prev.map(api => api.id === id ? { ...api, key: value } : api));
  };

  const simulateSave = async (setter: React.Dispatch<React.SetStateAction<boolean>>, settingsName: string) => {
    setter(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    // In a real app, you would send data to the backend here.
    // For theme, we also need to call setTheme from useTheme
    if (settingsName === "General") {
        setTheme(generalSettings.theme);
    }
    toast.success(`${settingsName} settings saved successfully!`);
    setter(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground flex items-center">
          <SettingsIcon className="mr-2 h-6 w-6" /> Settings
        </h2>
      </div>
      <p className="text-muted-foreground">
        Configure application settings, API keys, network providers, and user preferences.
      </p>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general"><Palette className="mr-2 h-4 w-4 sm:hidden" />General</TabsTrigger>
          <TabsTrigger value="network"><Wifi className="mr-2 h-4 w-4 sm:hidden" />Network</TabsTrigger>
          <TabsTrigger value="apikeys"><KeyRound className="mr-2 h-4 w-4 sm:hidden" />API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Customize the application's appearance and behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <RadioGroup
                  id="theme"
                  value={generalSettings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => handleGeneralSettingsChange('theme', value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark">Dark</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="theme-system" />
                    <Label htmlFor="theme-system">System</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="desktopNotifications" className="text-base">Desktop Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications on your desktop.</p>
                </div>
                <Switch
                  id="desktopNotifications"
                  checked={generalSettings.desktopNotifications}
                  onCheckedChange={(checked) => handleGeneralSettingsChange('desktopNotifications', checked)}
                  aria-label="Toggle desktop notifications"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoRefreshInterval">Auto-Refresh Interval (seconds)</Label>
                <Input
                  id="autoRefreshInterval"
                  type="number"
                  value={generalSettings.autoRefreshInterval}
                  onChange={(e) => handleGeneralSettingsChange('autoRefreshInterval', parseInt(e.target.value, 10))}
                  className="max-w-xs"
                  min="5"
                />
                 <p className="text-sm text-muted-foreground">Set how often data should refresh automatically.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => simulateSave(setIsSavingGeneral, "General")} disabled={isSavingGeneral} aria-live="polite">
                {isSavingGeneral ? (<><Save className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : (<><Save className="mr-2 h-4 w-4" /> Save General Settings</>)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Settings</CardTitle>
              <CardDescription>Configure RPC endpoints for blockchain networks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {networkSettings.map(network => (
                <div key={network.id} className="space-y-2">
                  <Label htmlFor={`rpc-${network.id}`}>{network.name} RPC URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id={`rpc-${network.id}`}
                      type="url"
                      placeholder={`Enter ${network.name} RPC URL`}
                      value={network.rpcUrl}
                      onChange={(e) => handleNetworkSettingChange(network.id, e.target.value)}
                    />
                    <Button variant="outline" size="sm" onClick={() => toast.info(`Connection test for ${network.name} simulated.`)}>Test</Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button onClick={() => simulateSave(setIsSavingNetwork, "Network")} disabled={isSavingNetwork} aria-live="polite">
                 {isSavingNetwork ? (<><Save className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : (<><Save className="mr-2 h-4 w-4" /> Save Network Settings</>)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Manage API keys for integrated third-party services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeySettings.map(apiKey => (
                <div key={apiKey.id} className="space-y-2">
                  <Label htmlFor={`apikey-${apiKey.id}`}>{apiKey.name}</Label>
                  <Input
                    id={`apikey-${apiKey.id}`}
                    type="password"
                    placeholder={apiKey.placeholder}
                    value={apiKey.key}
                    onChange={(e) => handleApiKeySettingChange(apiKey.id, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button onClick={() => simulateSave(setIsSavingApiKeys, "API Key")} disabled={isSavingApiKeys} aria-live="polite">
                {isSavingApiKeys ? (<><Save className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : (<><Save className="mr-2 h-4 w-4" /> Save API Keys</>)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
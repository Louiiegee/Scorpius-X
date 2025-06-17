/**
 * Global Settings Context
 * Manages application-wide settings including API keys, RPC URLs, and configuration
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { SecureSettingsStorage } from "@/lib/settingsEncryption";

// Supported blockchain networks
export const SUPPORTED_NETWORKS = {
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    symbol: "ETH",
    defaultRpc: "https://eth-mainnet.alchemyapi.io/v2/demo",
    color: "#627EEA",
  },
  arbitrum: {
    name: "Arbitrum One",
    chainId: 42161,
    symbol: "ETH",
    defaultRpc: "https://arb-mainnet.g.alchemy.com/v2/demo",
    color: "#28A0F0",
  },
  optimism: {
    name: "Optimism",
    chainId: 10,
    symbol: "ETH",
    defaultRpc: "https://opt-mainnet.g.alchemy.com/v2/demo",
    color: "#FF0420",
  },
  base: {
    name: "Base",
    chainId: 8453,
    symbol: "ETH",
    defaultRpc: "https://base-mainnet.g.alchemy.com/v2/demo",
    color: "#0052FF",
  },
  polygon: {
    name: "Polygon",
    chainId: 137,
    symbol: "MATIC",
    defaultRpc: "https://polygon-mainnet.g.alchemy.com/v2/demo",
    color: "#8247E5",
  },
  bsc: {
    name: "BNB Smart Chain",
    chainId: 56,
    symbol: "BNB",
    defaultRpc: "https://bsc-dataseed1.binance.org",
    color: "#F3BA2F",
  },
} as const;

export type NetworkKey = keyof typeof SUPPORTED_NETWORKS;

// API Service configurations
export const API_SERVICES = {
  openai: {
    name: "OpenAI",
    description: "GPT-based AI analysis and code review",
    keyPlaceholder: "sk-...",
    required: false,
    tier: "starter",
  },
  anthropic: {
    name: "Anthropic Claude",
    description: "Advanced AI analysis and vulnerability detection",
    keyPlaceholder: "sk-ant-...",
    required: false,
    tier: "pro",
  },
  etherscan: {
    name: "Etherscan",
    description: "Ethereum blockchain data and verification",
    keyPlaceholder: "YourApiKeyToken",
    required: true,
    tier: "community",
  },
  coingecko: {
    name: "CoinGecko",
    description: "Cryptocurrency market data and pricing",
    keyPlaceholder: "CG-...",
    required: false,
    tier: "starter",
  },
  alchemy: {
    name: "Alchemy",
    description: "Enhanced blockchain data and analytics",
    keyPlaceholder: "demo (your key)",
    required: false,
    tier: "starter",
  },
  infura: {
    name: "Infura",
    description: "Reliable Ethereum infrastructure",
    keyPlaceholder: "your-project-id",
    required: false,
    tier: "community",
  },
  quicknode: {
    name: "QuickNode",
    description: "High-performance blockchain endpoints",
    keyPlaceholder: "your-endpoint-id",
    required: false,
    tier: "pro",
  },
  moralis: {
    name: "Moralis",
    description: "Web3 development platform and APIs",
    keyPlaceholder: "your-api-key",
    required: false,
    tier: "starter",
  },
} as const;

export type ApiServiceKey = keyof typeof API_SERVICES;

// Settings interface
export interface Settings {
  // Network Configuration
  rpcUrls: Record<NetworkKey, string>;
  customRpcUrls: Record<string, string>;

  // API Keys
  apiKeys: Record<ApiServiceKey, string>;
  customApiKeys: Record<string, string>;

  // General Settings
  theme: "light" | "dark" | "system";
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  enableNotifications: boolean;
  soundEnabled: boolean;

  // Security Settings
  autoLockTimeout: number; // minutes
  requireAuthForSettings: boolean;
  logLevel: "error" | "warn" | "info" | "debug";

  // Performance Settings
  maxConcurrentScans: number;
  cacheEnabled: boolean;
  batchSize: number;

  // Export/Import Settings
  defaultExportFormat: "json" | "csv" | "pdf";
  includeMetadata: boolean;

  // Advanced Settings
  experimentalFeatures: boolean;
  betaAccess: boolean;
  developerMode: boolean;

  // Last updated timestamp
  lastUpdated: number;
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  rpcUrls: Object.fromEntries(
    Object.entries(SUPPORTED_NETWORKS).map(([key, network]) => [
      key,
      network.defaultRpc,
    ]),
  ) as Record<NetworkKey, string>,
  customRpcUrls: {},
  apiKeys: Object.fromEntries(
    Object.keys(API_SERVICES).map((key) => [key, ""]),
  ) as Record<ApiServiceKey, string>,
  customApiKeys: {},
  theme: "dark",
  autoRefresh: true,
  refreshInterval: 30,
  enableNotifications: true,
  soundEnabled: false,
  autoLockTimeout: 30,
  requireAuthForSettings: true,
  logLevel: "info",
  maxConcurrentScans: 5,
  cacheEnabled: true,
  batchSize: 100,
  defaultExportFormat: "json",
  includeMetadata: true,
  experimentalFeatures: false,
  betaAccess: false,
  developerMode: false,
  lastUpdated: Date.now(),
};

// Action types
type SettingsAction =
  | { type: "LOAD_SETTINGS"; payload: Partial<Settings> }
  | { type: "UPDATE_SETTING"; payload: { key: keyof Settings; value: any } }
  | { type: "UPDATE_RPC_URL"; payload: { network: NetworkKey; url: string } }
  | { type: "UPDATE_API_KEY"; payload: { service: ApiServiceKey; key: string } }
  | { type: "ADD_CUSTOM_RPC"; payload: { name: string; url: string } }
  | { type: "REMOVE_CUSTOM_RPC"; payload: { name: string } }
  | { type: "ADD_CUSTOM_API_KEY"; payload: { name: string; key: string } }
  | { type: "REMOVE_CUSTOM_API_KEY"; payload: { name: string } }
  | { type: "RESET_SETTINGS" }
  | { type: "IMPORT_SETTINGS"; payload: Partial<Settings> };

// Settings reducer
function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case "LOAD_SETTINGS":
      return {
        ...DEFAULT_SETTINGS,
        ...action.payload,
        lastUpdated: Date.now(),
      };

    case "UPDATE_SETTING":
      return {
        ...state,
        [action.payload.key]: action.payload.value,
        lastUpdated: Date.now(),
      };

    case "UPDATE_RPC_URL":
      return {
        ...state,
        rpcUrls: {
          ...state.rpcUrls,
          [action.payload.network]: action.payload.url,
        },
        lastUpdated: Date.now(),
      };

    case "UPDATE_API_KEY":
      return {
        ...state,
        apiKeys: {
          ...state.apiKeys,
          [action.payload.service]: action.payload.key,
        },
        lastUpdated: Date.now(),
      };

    case "ADD_CUSTOM_RPC":
      return {
        ...state,
        customRpcUrls: {
          ...state.customRpcUrls,
          [action.payload.name]: action.payload.url,
        },
        lastUpdated: Date.now(),
      };

    case "REMOVE_CUSTOM_RPC":
      const { [action.payload.name]: removedRpc, ...restRpcs } =
        state.customRpcUrls;
      return {
        ...state,
        customRpcUrls: restRpcs,
        lastUpdated: Date.now(),
      };

    case "ADD_CUSTOM_API_KEY":
      return {
        ...state,
        customApiKeys: {
          ...state.customApiKeys,
          [action.payload.name]: action.payload.key,
        },
        lastUpdated: Date.now(),
      };

    case "REMOVE_CUSTOM_API_KEY":
      const { [action.payload.name]: removedKey, ...restKeys } =
        state.customApiKeys;
      return {
        ...state,
        customApiKeys: restKeys,
        lastUpdated: Date.now(),
      };

    case "RESET_SETTINGS":
      return {
        ...DEFAULT_SETTINGS,
        lastUpdated: Date.now(),
      };

    case "IMPORT_SETTINGS":
      return {
        ...state,
        ...action.payload,
        lastUpdated: Date.now(),
      };

    default:
      return state;
  }
}

// Context interface
interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
  updateRpcUrl: (network: NetworkKey, url: string) => void;
  updateApiKey: (service: ApiServiceKey, key: string) => void;
  addCustomRpc: (name: string, url: string) => void;
  removeCustomRpc: (name: string) => void;
  addCustomApiKey: (name: string, key: string) => void;
  removeCustomApiKey: (name: string) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => boolean;
  isLoading: boolean;
  saveSettings: () => void;
}

// Create context
const SettingsContext = createContext<SettingsContextType | null>(null);

// Settings provider component
interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(true);
  const storage = SecureSettingsStorage.getInstance();

  // Load settings on mount
  useEffect(() => {
    try {
      const savedSettings = storage.load();
      if (Object.keys(savedSettings).length > 0) {
        dispatch({ type: "LOAD_SETTINGS", payload: savedSettings });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings, using defaults");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        storage.save(settings);
      }, 1000); // Debounce saves

      return () => clearTimeout(timeoutId);
    }
  }, [settings, isLoading]);

  // Context methods
  const updateSetting = (key: keyof Settings, value: any) => {
    dispatch({ type: "UPDATE_SETTING", payload: { key, value } });
  };

  const updateRpcUrl = (network: NetworkKey, url: string) => {
    dispatch({ type: "UPDATE_RPC_URL", payload: { network, url } });
  };

  const updateApiKey = (service: ApiServiceKey, key: string) => {
    dispatch({ type: "UPDATE_API_KEY", payload: { service, key } });
  };

  const addCustomRpc = (name: string, url: string) => {
    dispatch({ type: "ADD_CUSTOM_RPC", payload: { name, url } });
    toast.success(`Custom RPC "${name}" added`);
  };

  const removeCustomRpc = (name: string) => {
    dispatch({ type: "REMOVE_CUSTOM_RPC", payload: { name } });
    toast.success(`Custom RPC "${name}" removed`);
  };

  const addCustomApiKey = (name: string, key: string) => {
    dispatch({ type: "ADD_CUSTOM_API_KEY", payload: { name, key } });
    toast.success(`Custom API key "${name}" added`);
  };

  const removeCustomApiKey = (name: string) => {
    dispatch({ type: "REMOVE_CUSTOM_API_KEY", payload: { name } });
    toast.success(`Custom API key "${name}" removed`);
  };

  const resetSettings = () => {
    dispatch({ type: "RESET_SETTINGS" });
    storage.clear();
    toast.success("Settings reset to defaults");
  };

  const exportSettings = (): string => {
    try {
      const exportData = {
        ...settings,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      toast.error("Failed to export settings");
      return "";
    }
  };

  const importSettings = (data: string): boolean => {
    try {
      const imported = JSON.parse(data);
      if (imported && typeof imported === "object") {
        dispatch({ type: "IMPORT_SETTINGS", payload: imported });
        toast.success("Settings imported successfully");
        return true;
      }
      throw new Error("Invalid settings data");
    } catch (error) {
      toast.error("Failed to import settings: Invalid format");
      return false;
    }
  };

  const saveSettings = () => {
    storage.save(settings);
    toast.success("Settings saved successfully");
  };

  const value: SettingsContextType = {
    settings,
    updateSetting,
    updateRpcUrl,
    updateApiKey,
    addCustomRpc,
    removeCustomRpc,
    addCustomApiKey,
    removeCustomApiKey,
    resetSettings,
    exportSettings,
    importSettings,
    isLoading,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use settings
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Utility hook to get specific network RPC URL
export function useNetworkRpc(network: NetworkKey): string {
  const { settings } = useSettings();
  return settings.rpcUrls[network] || SUPPORTED_NETWORKS[network].defaultRpc;
}

// Utility hook to get specific API key
export function useApiKey(service: ApiServiceKey): string {
  const { settings } = useSettings();
  return settings.apiKeys[service] || "";
}

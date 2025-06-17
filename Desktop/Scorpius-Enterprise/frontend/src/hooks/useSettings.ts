/**
 * useSettings Hook
 * Re-export of settings context for easier importing
 */

export {
  useSettings,
  useNetworkRpc,
  useApiKey,
} from "@/context/SettingsContext";
export type {
  Settings,
  NetworkKey,
  ApiServiceKey,
} from "@/context/SettingsContext";
export { SUPPORTED_NETWORKS, API_SERVICES } from "@/context/SettingsContext";

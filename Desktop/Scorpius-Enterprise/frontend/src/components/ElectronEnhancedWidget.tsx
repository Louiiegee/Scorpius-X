import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Minimize2,
  Maximize2,
  X,
  Bell,
  Info,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
}

interface PerformanceData {
  cpuUsage: {
    user: number;
    system: number;
  };
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  systemMemory: {
    total: number;
    free: number;
    used: number;
  };
  uptime: number;
  loadAverage: number[];
  fps?: number;
  timestamp?: number;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      getSystemInfo: () => Promise<SystemInfo>;
      getPerformanceData: () => Promise<PerformanceData>;
      showNotification: (
        title: string,
        options?: NotificationOptions,
      ) => Notification | undefined;
      requestNotificationPermission: () => Promise<NotificationPermission>;
      isDev: boolean;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
    };
    electronPerformance?: {
      startPerformanceMonitoring: (
        callback: (data: PerformanceData) => void,
      ) => void;
    };
  }
}

const ElectronEnhancedWidget: React.FC = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    const electronAvailable = window.electronAPI?.isElectron;
    setIsElectron(!!electronAvailable);

    if (electronAvailable) {
      // Load system information
      loadSystemInfo();

      // Check maximized state
      checkMaximizedState();

      // Start performance monitoring
      startPerformanceMonitoring();
    }
  }, []);

  const loadSystemInfo = async () => {
    try {
      if (window.electronAPI) {
        const info = await window.electronAPI.getSystemInfo();
        setSystemInfo(info);
      }
    } catch (error) {
      console.error("Failed to load system info:", error);
    }
  };

  const checkMaximizedState = async () => {
    try {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    } catch (error) {
      console.error("Failed to check maximized state:", error);
    }
  };

  const startPerformanceMonitoring = () => {
    if (window.electronPerformance && !isMonitoring) {
      setIsMonitoring(true);
      window.electronPerformance.startPerformanceMonitoring((data) => {
        setPerformanceData(data);
      });
    }
  };

  const handleMinimize = async () => {
    try {
      await window.electronAPI?.minimizeWindow();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      await window.electronAPI?.maximizeWindow();
      await checkMaximizedState();
    } catch (error) {
      console.error("Failed to maximize window:", error);
    }
  };

  const handleClose = async () => {
    try {
      await window.electronAPI?.closeWindow();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  const showTestNotification = async () => {
    try {
      if (window.electronAPI) {
        // Request permission first
        const permission =
          await window.electronAPI.requestNotificationPermission();

        if (permission === "granted") {
          window.electronAPI.showNotification("Scorpius Security Alert", {
            body: "Desktop notifications are now active! You will receive real-time security alerts.",
            icon: "/icon.png",
            tag: "scorpius-test",
          });
        }
      }
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getMemoryUsagePercentage = (): number => {
    if (!performanceData?.systemMemory) return 0;
    return (
      (performanceData.systemMemory.used / performanceData.systemMemory.total) *
      100
    );
  };

  const getCpuUsagePercentage = (): number => {
    if (!performanceData?.loadAverage) return 0;
    // Approximate CPU usage from load average
    return Math.min(performanceData.loadAverage[0] * 20, 100);
  };

  // Don't render if not in Electron
  if (!isElectron) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-4 right-4 z-50"
    >
      <Card className="bg-black/90 border-red-500/30 backdrop-blur-lg shadow-2xl w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-red-400 text-sm font-mono flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-500" />
              ELECTRON ENHANCED
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaximize}
                className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* System Information */}
          {systemInfo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Monitor className="h-3 w-3 text-red-500" />
                <span className="text-red-300">
                  {systemInfo.platform} {systemInfo.arch}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Badge
                    variant="outline"
                    className="border-red-500/30 text-red-400"
                  >
                    Electron {systemInfo.electronVersion}
                  </Badge>
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className="border-red-500/30 text-red-400"
                  >
                    {systemInfo.cpus} CPUs
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Performance Monitoring */}
          {performanceData && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3 w-3 text-red-500" />
                    <span className="text-red-300">CPU Usage</span>
                  </div>
                  <span className="text-red-400 font-mono">
                    {getCpuUsagePercentage().toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={getCpuUsagePercentage()}
                  className="h-1 bg-gray-800"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3 w-3 text-red-500" />
                    <span className="text-red-300">Memory Usage</span>
                  </div>
                  <span className="text-red-400 font-mono">
                    {getMemoryUsagePercentage().toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={getMemoryUsagePercentage()}
                  className="h-1 bg-gray-800"
                />
                <div className="text-xs text-gray-400">
                  {formatBytes(performanceData.systemMemory.used)} /{" "}
                  {formatBytes(performanceData.systemMemory.total)}
                </div>
              </div>

              {performanceData.fps && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 text-red-500" />
                    <span className="text-red-300">Frame Rate</span>
                  </div>
                  <span className="text-red-400 font-mono">
                    {performanceData.fps} FPS
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={showTestNotification}
              size="sm"
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Bell className="h-3 w-3 mr-2" />
              Test Desktop Notification
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Info className="h-3 w-3" />
              <span>Desktop app features active</span>
            </div>
          </div>

          {/* Development Info */}
          {window.electronAPI?.isDev && (
            <div className="border-t border-red-500/20 pt-2">
              <div className="text-xs text-gray-500 text-center">
                Development Mode Active
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ElectronEnhancedWidget;

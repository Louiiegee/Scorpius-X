import { useEffect, useState, useCallback } from "react";

interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  showSaveDialog: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  showMessageBox: (options: any) => Promise<any>;
  onMenuNewScan: (callback: () => void) => void;
  onMenuOpenFile: (callback: (event: any, filePath: string) => void) => void;
  onMenuExportReport: (callback: () => void) => void;
  onMenuNavigate: (callback: (event: any, module: string) => void) => void;
  onMenuStartMonitoring: (callback: () => void) => void;
  onMenuStopScans: (callback: () => void) => void;
  onMenuResetSettings: (callback: () => void) => void;
  onAppBeforeQuit: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  openExternal: (url: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    const checkElectron = async () => {
      if (window.electronAPI) {
        setIsElectron(true);
        try {
          const version = await window.electronAPI.getAppVersion();
          const platformInfo = await window.electronAPI.getPlatform();
          setAppVersion(version);
          setPlatform(platformInfo);
        } catch (error) {
          console.error("Error getting Electron info:", error);
        }
      }
    };

    checkElectron();
  }, []);

  const showSaveDialog = useCallback(async (options: any) => {
    if (!window.electronAPI) return null;
    try {
      return await window.electronAPI.showSaveDialog(options);
    } catch (error) {
      console.error("Error showing save dialog:", error);
      return null;
    }
  }, []);

  const showOpenDialog = useCallback(async (options: any) => {
    if (!window.electronAPI) return null;
    try {
      return await window.electronAPI.showOpenDialog(options);
    } catch (error) {
      console.error("Error showing open dialog:", error);
      return null;
    }
  }, []);

  const showMessageBox = useCallback(async (options: any) => {
    if (!window.electronAPI) return null;
    try {
      return await window.electronAPI.showMessageBox(options);
    } catch (error) {
      console.error("Error showing message box:", error);
      return null;
    }
  }, []);

  const openExternal = useCallback((url: string) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  }, []);

  const setupMenuHandlers = useCallback(
    (handlers: {
      onNewScan?: () => void;
      onOpenFile?: (filePath: string) => void;
      onExportReport?: () => void;
      onNavigate?: (module: string) => void;
      onStartMonitoring?: () => void;
      onStopScans?: () => void;
      onResetSettings?: () => void;
      onAppBeforeQuit?: () => void;
    }) => {
      if (!window.electronAPI) return;

      // Setup menu event handlers
      if (handlers.onNewScan) {
        window.electronAPI.onMenuNewScan(handlers.onNewScan);
      }

      if (handlers.onOpenFile) {
        window.electronAPI.onMenuOpenFile((event, filePath) => {
          handlers.onOpenFile!(filePath);
        });
      }

      if (handlers.onExportReport) {
        window.electronAPI.onMenuExportReport(handlers.onExportReport);
      }

      if (handlers.onNavigate) {
        window.electronAPI.onMenuNavigate((event, module) => {
          handlers.onNavigate!(module);
        });
      }

      if (handlers.onStartMonitoring) {
        window.electronAPI.onMenuStartMonitoring(handlers.onStartMonitoring);
      }

      if (handlers.onStopScans) {
        window.electronAPI.onMenuStopScans(handlers.onStopScans);
      }

      if (handlers.onResetSettings) {
        window.electronAPI.onMenuResetSettings(handlers.onResetSettings);
      }

      if (handlers.onAppBeforeQuit) {
        window.electronAPI.onAppBeforeQuit(handlers.onAppBeforeQuit);
      }

      // Cleanup function
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners("menu-new-scan");
          window.electronAPI.removeAllListeners("menu-open-file");
          window.electronAPI.removeAllListeners("menu-export-report");
          window.electronAPI.removeAllListeners("menu-navigate");
          window.electronAPI.removeAllListeners("menu-start-monitoring");
          window.electronAPI.removeAllListeners("menu-stop-scans");
          window.electronAPI.removeAllListeners("menu-reset-settings");
          window.electronAPI.removeAllListeners("app-before-quit");
        }
      };
    },
    [],
  );

  return {
    isElectron,
    appVersion,
    platform,
    showSaveDialog,
    showOpenDialog,
    showMessageBox,
    openExternal,
    setupMenuHandlers,
  };
};

// Utility hook for file operations
export const useElectronFile = () => {
  const { showOpenDialog, showSaveDialog } = useElectron();

  const openContractFile = useCallback(async () => {
    return await showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Solidity Files", extensions: ["sol"] },
        { name: "Bytecode Files", extensions: ["bin", "hex"] },
        { name: "ABI Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
  }, [showOpenDialog]);

  const saveReport = useCallback(
    async (defaultName: string = "report") => {
      return await showSaveDialog({
        defaultPath: `${defaultName}.pdf`,
        filters: [
          { name: "PDF Files", extensions: ["pdf"] },
          { name: "JSON Files", extensions: ["json"] },
          { name: "CSV Files", extensions: ["csv"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
    },
    [showSaveDialog],
  );

  const saveConfig = useCallback(async () => {
    return await showSaveDialog({
      defaultPath: "scorpius-config.json",
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
  }, [showSaveDialog]);

  const openConfig = useCallback(async () => {
    return await showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "Configuration Files", extensions: ["config", "conf"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
  }, [showOpenDialog]);

  return {
    openContractFile,
    saveReport,
    saveConfig,
    openConfig,
  };
};

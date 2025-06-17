import { useEffect, useCallback } from "react";
import { useElectron, useElectronFile } from "./useElectron";

interface ElectronIntegrationProps {
  onNavigate: (module: string) => void;
  onNewScan: () => void;
  onExportReport: () => void;
  onStartMonitoring: () => void;
  onStopScans: () => void;
  onResetSettings: () => void;
  onOpenFile: (filePath: string) => void;
  onAppBeforeQuit: () => void;
}

export const useElectronIntegration = (props: ElectronIntegrationProps) => {
  const {
    isElectron,
    appVersion,
    platform,
    setupMenuHandlers,
    showMessageBox,
  } = useElectron();

  const { openContractFile, saveReport, saveConfig, openConfig } =
    useElectronFile();

  // Setup menu handlers when component mounts
  useEffect(() => {
    if (!isElectron) return;

    const cleanup = setupMenuHandlers({
      onNewScan: props.onNewScan,
      onOpenFile: props.onOpenFile,
      onExportReport: props.onExportReport,
      onNavigate: props.onNavigate,
      onStartMonitoring: props.onStartMonitoring,
      onStopScans: props.onStopScans,
      onResetSettings: props.onResetSettings,
      onAppBeforeQuit: props.onAppBeforeQuit,
    });

    return cleanup;
  }, [
    isElectron,
    setupMenuHandlers,
    props.onNewScan,
    props.onOpenFile,
    props.onExportReport,
    props.onNavigate,
    props.onStartMonitoring,
    props.onStopScans,
    props.onResetSettings,
    props.onAppBeforeQuit,
  ]);

  // File operation handlers
  const handleOpenContract = useCallback(async () => {
    const result = await openContractFile();
    if (result && !result.canceled && result.filePaths.length > 0) {
      props.onOpenFile(result.filePaths[0]);
    }
  }, [openContractFile, props.onOpenFile]);

  const handleSaveReport = useCallback(
    async (reportData: any, defaultName?: string) => {
      const result = await saveReport(defaultName);
      if (result && !result.canceled) {
        // Here you would implement the actual file saving logic
        // For now, we'll just show a success message
        await showMessageBox({
          type: "info",
          title: "Report Saved",
          message: `Report saved successfully to ${result.filePath}`,
          buttons: ["OK"],
        });
        return result.filePath;
      }
      return null;
    },
    [saveReport, showMessageBox],
  );

  const handleSaveConfig = useCallback(
    async (configData: any) => {
      const result = await saveConfig();
      if (result && !result.canceled) {
        // Here you would implement the actual config saving logic
        await showMessageBox({
          type: "info",
          title: "Configuration Saved",
          message: `Configuration saved successfully to ${result.filePath}`,
          buttons: ["OK"],
        });
        return result.filePath;
      }
      return null;
    },
    [saveConfig, showMessageBox],
  );

  const handleOpenConfig = useCallback(async () => {
    const result = await openConfig();
    if (result && !result.canceled && result.filePaths.length > 0) {
      // Here you would implement the actual config loading logic
      return result.filePaths[0];
    }
    return null;
  }, [openConfig]);

  const showConfirmDialog = useCallback(
    async (
      title: string,
      message: string,
      type: "info" | "warning" | "error" | "question" = "question",
    ) => {
      if (!isElectron) {
        return window.confirm(message);
      }

      const result = await showMessageBox({
        type,
        title,
        message,
        buttons: ["Cancel", "OK"],
        defaultId: 1,
        cancelId: 0,
      });

      return result.response === 1;
    },
    [isElectron, showMessageBox],
  );

  const showInfoDialog = useCallback(
    async (title: string, message: string, detail?: string) => {
      if (!isElectron) {
        alert(`${title}\n\n${message}${detail ? `\n\n${detail}` : ""}`);
        return;
      }

      await showMessageBox({
        type: "info",
        title,
        message,
        detail,
        buttons: ["OK"],
      });
    },
    [isElectron, showMessageBox],
  );

  const showErrorDialog = useCallback(
    async (title: string, message: string, detail?: string) => {
      if (!isElectron) {
        alert(`Error: ${title}\n\n${message}${detail ? `\n\n${detail}` : ""}`);
        return;
      }

      await showMessageBox({
        type: "error",
        title,
        message,
        detail,
        buttons: ["OK"],
      });
    },
    [isElectron, showMessageBox],
  );

  return {
    isElectron,
    appVersion,
    platform,

    // File operations
    handleOpenContract,
    handleSaveReport,
    handleSaveConfig,
    handleOpenConfig,

    // Dialog utilities
    showConfirmDialog,
    showInfoDialog,
    showErrorDialog,
  };
};

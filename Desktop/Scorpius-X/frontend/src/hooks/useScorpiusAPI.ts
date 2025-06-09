// UNIVERSAL REACT HOOK FOR ALL SCORPIUS MODULES

import { useState, useEffect, useCallback } from "react";
import { handleButtonClick } from "@/services/apiIntegration";
import { wsManager } from "@/services/websocketManager";

// Universal hook for any Scorpius module
export const useScorpiusAPI = (moduleName: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState<any>({});

  // Initialize WebSocket subscriptions for the module
  useEffect(() => {
    const unsubscribe = wsManager.subscribeToModule(moduleName, {
      // Generic handlers that update realTimeData
      onStatsUpdate: (data: any) =>
        setRealTimeData((prev) => ({ ...prev, stats: data })),
      onAlertsUpdate: (data: any) =>
        setRealTimeData((prev) => ({ ...prev, alerts: data })),
      onMetricsUpdate: (data: any) =>
        setRealTimeData((prev) => ({ ...prev, metrics: data })),
      onProgressUpdate: (data: any) =>
        setRealTimeData((prev) => ({ ...prev, progress: data })),
      onResultsUpdate: (data: any) =>
        setRealTimeData((prev) => ({ ...prev, results: data })),
    });

    return unsubscribe;
  }, [moduleName]);

  // Generic API call function
  const callAPI = useCallback(async (action: string, actionData?: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await handleButtonClick(action, actionData);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "API call failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    realTimeData,
    callAPI,
    setData,
    setError,
  };
};

// Specific hooks for each module
export const useDashboard = () => {
  const api = useScorpiusAPI("dashboard");

  return {
    ...api,
    // Dashboard-specific actions
    configureSystem: () => api.callAPI("configure-system"),
    startLiveMonitor: () => api.callAPI("live-monitor"),
    startSecurityScan: () => api.callAPI("start-security-scan"),
    openMEVOperations: () => api.callAPI("mev-operations"),
    refreshDashboard: () => api.callAPI("refresh-dashboard"),
  };
};

export const useScanner = () => {
  const api = useScorpiusAPI("scanner");

  return {
    ...api,
    // Scanner-specific actions
    uploadContract: (file: File) => api.callAPI("upload-contract", file),
    quickScan: (address: string) => api.callAPI("quick-scan", address),
    deepScan: (address: string) => api.callAPI("deep-scan", address),
    viewHistory: () => api.callAPI("view-scan-history"),
    configure: () => api.callAPI("configure-scanner"),
  };
};

export const useMEV = () => {
  const api = useScorpiusAPI("mev");

  return {
    ...api,
    // MEV-specific actions
    deployArbitrage: () => api.callAPI("deploy-arbitrage"),
    deployLiquidation: () => api.callAPI("deploy-liquidation"),
    deploySandwich: () => api.callAPI("deploy-sandwich"),
    pauseStrategy: (id: string) => api.callAPI("pause-strategy", id),
    stopStrategy: (id: string) => api.callAPI("stop-strategy", id),
    viewPerformance: () => api.callAPI("view-mev-performance"),
  };
};

export const useMempool = () => {
  const api = useScorpiusAPI("mempool");

  return {
    ...api,
    // Mempool-specific actions
    startMonitoring: () => api.callAPI("start-mempool-monitoring"),
    addWatch: (address: string) => api.callAPI("add-mempool-watch", address),
    exportData: () => api.callAPI("export-mempool-data"),
    filterAlerts: (severity: string) =>
      api.callAPI("filter-mempool-alerts", severity),
  };
};

export const useScheduler = () => {
  const api = useScorpiusAPI("scheduler");

  return {
    ...api,
    // Scheduler-specific actions
    createScanJob: () => api.callAPI("create-scan-job"),
    createReportJob: () => api.callAPI("create-report-job"),
    pauseJob: (id: string) => api.callAPI("pause-job", id),
    resumeJob: (id: string) => api.callAPI("resume-job", id),
    deleteJob: (id: string) => api.callAPI("delete-job", id),
  };
};

export const useTraining = () => {
  const api = useScorpiusAPI("training");

  return {
    ...api,
    // Training-specific actions
    enrollCourse: (courseId: string) => api.callAPI("enroll-course", courseId),
    startSimulation: (simId: string) => api.callAPI("start-simulation", simId),
    viewProgress: () => api.callAPI("view-training-progress"),
    exportProgress: () => api.callAPI("export-training-progress"),
  };
};

export const useMonitoring = () => {
  const api = useScorpiusAPI("monitoring");

  return {
    ...api,
    // Monitoring-specific actions
    refreshMetrics: () => api.callAPI("refresh-metrics"),
    systemCheck: () => api.callAPI("system-check"),
    viewAlerts: () => api.callAPI("view-system-alerts"),
    exportMetrics: () => api.callAPI("export-metrics"),
  };
};

export const useReports = () => {
  const api = useScorpiusAPI("reports");

  return {
    ...api,
    // Reports-specific actions
    generateSecurityReport: () => api.callAPI("generate-security-report"),
    generateMEVReport: () => api.callAPI("generate-mev-report"),
    generateSystemReport: () => api.callAPI("generate-system-report"),
    downloadReport: (id: string) => api.callAPI("download-report", id),
    viewHistory: () => api.callAPI("view-reports-history"),
  };
};

export const useBounty = () => {
  const api = useScorpiusAPI("bounty");

  return {
    ...api,
    // Bounty-specific actions
    approveSubmission: (id: string) => api.callAPI("approve-bounty", id),
    rejectSubmission: (id: string) => api.callAPI("reject-bounty", id),
    viewSubmission: (id: string) => api.callAPI("view-bounty-submission", id),
    newBounty: () => api.callAPI("create-new-bounty"),
    exportReports: () => api.callAPI("export-bounty-reports"),
  };
};

export const useSettings = () => {
  const api = useScorpiusAPI("settings");

  return {
    ...api,
    // Settings-specific actions
    saveSettings: (settings: any) => api.callAPI("save-settings", settings),
    resetSettings: () => api.callAPI("reset-settings"),
    exportConfig: () => api.callAPI("export-config"),
    importConfig: (config: any) => api.callAPI("import-config", config),
  };
};

// Universal button click handler with loading states
export const useButtonHandler = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  const handleClick = useCallback(
    async (buttonId: string, action: string, data?: any) => {
      try {
        setLoadingStates((prev) => ({ ...prev, [buttonId]: true }));
        const result = await handleButtonClick(action, data);
        console.log(`✅ Button ${buttonId} action completed:`, result);
        return result;
      } catch (error) {
        console.error(`❌ Button ${buttonId} action failed:`, error);
        throw error;
      } finally {
        setLoadingStates((prev) => ({ ...prev, [buttonId]: false }));
      }
    },
    [],
  );

  return {
    handleClick,
    loadingStates,
    isLoading: (buttonId: string) => loadingStates[buttonId] || false,
  };
};

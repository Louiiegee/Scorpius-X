/**
 * React Hook for SCORPIUS Scanner Operations
 *
 * Provides state management and API operations for the scanner functionality.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  scorpiusAPI,
  ContractAnalysisResult,
  EnhancedScanRequest,
  EnhancedScanStatus,
  EnhancedScanResult,
  ScanStatistics,
  ScorpiusAPIError,
} from "@/services/scorpiusApi";
import {
  demoAnalysisResult,
  demoRecentScans,
  demoStatistics,
} from "@/services/demoData";

export interface ScannerState {
  // Basic analysis state
  isAnalyzing: boolean;
  analysisResult: ContractAnalysisResult | null;
  analysisError: string | null;

  // Enhanced scan state
  isScanning: boolean;
  activeScanId: string | null;
  scanStatus: EnhancedScanStatus | null;
  scanResult: EnhancedScanResult | null;
  scanError: string | null;

  // Recent scans
  recentScans: EnhancedScanStatus[];
  statistics: ScanStatistics | null;

  // UI state
  scanProgress: number;
}

export interface ScannerActions {
  // Basic analysis
  analyzeContract: (
    address: string,
    options?: { rpcUrl?: string; chainId?: number; explorerApiKey?: string },
  ) => Promise<void>;
  clearAnalysis: () => void;

  // Enhanced scanning
  startEnhancedScan: (request: EnhancedScanRequest) => Promise<string | null>;
  pollScanStatus: (scanId: string) => Promise<void>;
  getScanResult: (scanId: string) => Promise<void>;
  cancelScan: (scanId: string) => Promise<void>;
  clearScan: () => void;

  // Data management
  loadRecentScans: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useScanner = (): ScannerState & ScannerActions => {
  // State
  const [state, setState] = useState<ScannerState>({
    isAnalyzing: false,
    analysisResult: null,
    analysisError: null,
    isScanning: false,
    activeScanId: null,
    scanStatus: null,
    scanResult: null,
    scanError: null,
    recentScans: [],
    statistics: null,
    scanProgress: 0,
  });

  // Refs for managing polling
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Basic contract analysis
  const analyzeContract = useCallback(
    async (
      address: string,
      options?: { rpcUrl?: string; chainId?: number; explorerApiKey?: string },
    ) => {
      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        analysisError: null,
        analysisResult: null,
      }));

      try {
        const result = await scorpiusAPI.analyzeContract(
          address,
          options || {},
        );
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          analysisResult: result,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof ScorpiusAPIError
            ? error.message
            : "An unexpected error occurred during analysis";

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          analysisError: errorMessage,
        }));
      }
    },
    [],
  );

  const clearAnalysis = useCallback(() => {
    setState((prev) => ({
      ...prev,
      analysisResult: null,
      analysisError: null,
    }));
  }, []);

  // Enhanced scanning
  const startEnhancedScan = useCallback(
    async (request: EnhancedScanRequest): Promise<string | null> => {
      setState((prev) => ({
        ...prev,
        isScanning: true,
        scanError: null,
        scanResult: null,
        scanProgress: 0,
      }));

      try {
        const response = await scorpiusAPI.startEnhancedScan(request);
        const scanId = response.scan_id;

        setState((prev) => ({
          ...prev,
          activeScanId: scanId,
        }));

        // Start polling for status
        pollScanStatus(scanId);

        // Start progress simulation
        startProgressSimulation();

        return scanId;
      } catch (error) {
        const errorMessage =
          error instanceof ScorpiusAPIError
            ? error.message
            : "Failed to start enhanced scan";

        setState((prev) => ({
          ...prev,
          isScanning: false,
          scanError: errorMessage,
        }));

        return null;
      }
    },
    [],
  );

  const pollScanStatus = useCallback(async (scanId: string) => {
    try {
      const status = await scorpiusAPI.getScanStatus(scanId);

      setState((prev) => ({
        ...prev,
        scanStatus: status,
        scanProgress: status.progress || prev.scanProgress,
      }));

      // If scan is complete, get the result
      if (status.status === "completed") {
        await getScanResult(scanId);
        setState((prev) => ({ ...prev, isScanning: false }));

        // Stop polling
        if (statusPollingRef.current) {
          clearInterval(statusPollingRef.current);
          statusPollingRef.current = null;
        }

        // Stop progress simulation
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } else if (status.status === "failed" || status.status === "cancelled") {
        setState((prev) => ({
          ...prev,
          isScanning: false,
          scanError: status.error_message || `Scan ${status.status}`,
        }));

        // Stop polling
        if (statusPollingRef.current) {
          clearInterval(statusPollingRef.current);
          statusPollingRef.current = null;
        }
      } else {
        // Continue polling for running/queued status
        if (!statusPollingRef.current) {
          statusPollingRef.current = setInterval(() => {
            pollScanStatus(scanId);
          }, 2000); // Poll every 2 seconds
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof ScorpiusAPIError
          ? error.message
          : "Failed to get scan status";

      setState((prev) => ({
        ...prev,
        scanError: errorMessage,
      }));
    }
  }, []);

  const getScanResult = useCallback(async (scanId: string) => {
    try {
      const result = await scorpiusAPI.getScanResult(scanId);
      setState((prev) => ({
        ...prev,
        scanResult: result,
        scanProgress: 100,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof ScorpiusAPIError
          ? error.message
          : "Failed to get scan result";

      setState((prev) => ({
        ...prev,
        scanError: errorMessage,
      }));
    }
  }, []);

  const cancelScan = useCallback(async (scanId: string) => {
    try {
      await scorpiusAPI.cancelScan(scanId);
      setState((prev) => ({
        ...prev,
        isScanning: false,
        activeScanId: null,
      }));

      // Stop polling
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
      }

      // Stop progress simulation
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof ScorpiusAPIError
          ? error.message
          : "Failed to cancel scan";

      setState((prev) => ({
        ...prev,
        scanError: errorMessage,
      }));
    }
  }, []);

  const clearScan = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeScanId: null,
      scanStatus: null,
      scanResult: null,
      scanError: null,
      scanProgress: 0,
    }));

    // Stop any active polling
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Data management
  const loadRecentScans = useCallback(async () => {
    try {
      const scans = await scorpiusAPI.getRecentScans(10);
      setState((prev) => ({
        ...prev,
        recentScans: scans,
      }));
    } catch (error) {
      // Silently handle backend connection errors - don't spam console
      if (
        error instanceof ScorpiusAPIError &&
        error.message.includes("Network error")
      ) {
        console.warn("Backend not available - using demo mode");
        // Set demo data for recent scans
        setState((prev) => ({
          ...prev,
          recentScans: [],
        }));
      } else {
        console.error("Failed to load recent scans:", error);
      }
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const stats = await scorpiusAPI.getScanStatistics();
      setState((prev) => ({
        ...prev,
        statistics: stats,
      }));
    } catch (error) {
      // Silently handle backend connection errors - don't spam console
      if (
        error instanceof ScorpiusAPIError &&
        error.message.includes("Network error")
      ) {
        console.warn("Backend not available - using demo mode");
        // Set demo statistics
        setState((prev) => ({
          ...prev,
          statistics: {
            total_scans: 0,
            completed_scans: 0,
            failed_scans: 0,
            average_scan_time: 0,
            vulnerabilities_found: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
            },
          },
        }));
      } else {
        console.error("Failed to load scan statistics:", error);
      }
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadRecentScans(), loadStatistics()]);
  }, [loadRecentScans, loadStatistics]);

  // Progress simulation for better UX
  const startProgressSimulation = useCallback(() => {
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 95) {
        progress = 95; // Don't go to 100% until scan is actually complete
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }

      setState((prev) => ({
        ...prev,
        scanProgress: Math.min(progress, 95),
      }));
    }, 1000);
  }, []);

  // Load initial data on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    ...state,
    analyzeContract,
    clearAnalysis,
    startEnhancedScan,
    pollScanStatus,
    getScanResult,
    cancelScan,
    clearScan,
    loadRecentScans,
    loadStatistics,
    refreshAll,
  };
};

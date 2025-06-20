/**
 * Standardized API Service Layer
 * One thin wrapper per endpoint using the new HTTP client and types
 */

import { httpClient } from "./httpClient";
import { config, getScannerUrl, getMempoolUrl, getMevUrl } from "@/config/env";
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  LoginRequest,
  LoginResponse,
  DashboardStats,
  ThreatAlert,
  ChartData,
  ContractScanRequest,
  ContractScanResult,
  MevStrategy,
  MempoolTransaction,
  MempoolAlert,
  SystemHealth,
  ScheduledJob,
} from "@/types/generated";

// ====================================
// Authentication API
// ====================================

export const authAPI = {
  login: (credentials: LoginRequest) =>
    httpClient.post<LoginResponse>("/auth/login", credentials),

  logout: () => httpClient.post("/auth/logout"),

  getCurrentUser: () => httpClient.get<User>("/auth/me"),

  refreshToken: (refreshToken: string) =>
    httpClient.post<LoginResponse>("/auth/refresh", { refreshToken }),
};

// ====================================
// Dashboard API
// ====================================

export const dashboardAPI = {
  getStats: () => httpClient.get<DashboardStats>("/dashboard/stats"),

  getAlerts: (params?: { page?: number; limit?: number; severity?: string }) =>
    httpClient.get<PaginatedResponse<ThreatAlert>>("/dashboard/alerts", {
      params: new URLSearchParams(params as any),
    }),

  getChartData: () => httpClient.get<ChartData>("/dashboard/charts"),

  dismissAlert: (alertId: string) =>
    httpClient.post(`/dashboard/alerts/${alertId}/dismiss`),

  resolveAlert: (alertId: string, resolution: string) =>
    httpClient.post(`/dashboard/alerts/${alertId}/resolve`, { resolution }),
};

// ====================================
// Scanner API
// ====================================

export const scannerAPI = {
  analyzeContract: (request: ContractScanRequest) =>
    httpClient.post<ContractScanResult>("/scanner/analyze", request, {
      baseURL: config.api.scannerUrl,
    }),

  uploadContract: (file: File, options?: { scanType?: string }) =>
    httpClient.upload("/scanner/upload", file, "file", options, {
      baseURL: config.api.scannerUrl,
    }),

  getScanResults: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    httpClient.get<PaginatedResponse<ContractScanResult>>("/scanner/results", {
      baseURL: config.api.scannerUrl,
      params: new URLSearchParams(params as any),
    }),

  getScanResult: (scanId: string) =>
    httpClient.get<ContractScanResult>(`/scanner/results/${scanId}`, {
      baseURL: config.api.scannerUrl,
    }),

  cancelScan: (scanId: string) =>
    httpClient.post(`/scanner/scans/${scanId}/cancel`, undefined, {
      baseURL: config.api.scannerUrl,
    }),

  retryScan: (scanId: string) =>
    httpClient.post(`/scanner/scans/${scanId}/retry`, undefined, {
      baseURL: config.api.scannerUrl,
    }),

  downloadReport: (scanId: string, format: "json" | "pdf" | "html" = "json") =>
    httpClient.get(`/scanner/results/${scanId}/export?format=${format}`, {
      baseURL: config.api.scannerUrl,
    }),
};

// ====================================
// MEV API
// ====================================

export const mevAPI = {
  getStrategies: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    httpClient.get<PaginatedResponse<MevStrategy>>("/mev/strategies", {
      baseURL: config.api.mevUrl,
      params: new URLSearchParams(params as any),
    }),

  getStrategy: (strategyId: string) =>
    httpClient.get<MevStrategy>(`/mev/strategies/${strategyId}`, {
      baseURL: config.api.mevUrl,
    }),

  deployStrategy: (strategyData: {
    name: string;
    type: string;
    parameters: any;
  }) =>
    httpClient.post<MevStrategy>("/mev/deploy-strategy", strategyData, {
      baseURL: config.api.mevUrl,
    }),

  pauseStrategy: (strategyId: string) =>
    httpClient.post(`/mev/strategies/${strategyId}/pause`, undefined, {
      baseURL: config.api.mevUrl,
    }),

  resumeStrategy: (strategyId: string) =>
    httpClient.post(`/mev/strategies/${strategyId}/resume`, undefined, {
      baseURL: config.api.mevUrl,
    }),

  stopStrategy: (strategyId: string) =>
    httpClient.post(`/mev/strategies/${strategyId}/stop`, undefined, {
      baseURL: config.api.mevUrl,
    }),

  updateStrategy: (strategyId: string, updates: Partial<MevStrategy>) =>
    httpClient.patch<MevStrategy>(`/mev/strategies/${strategyId}`, updates, {
      baseURL: config.api.mevUrl,
    }),

  getPerformanceMetrics: (strategyId?: string) =>
    httpClient.get(
      `/mev/performance${strategyId ? `?strategy=${strategyId}` : ""}`,
      {
        baseURL: config.api.mevUrl,
      },
    ),

  getOpportunities: (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) =>
    httpClient.get("/mev/opportunities", {
      baseURL: config.api.mevUrl,
      params: new URLSearchParams(params as any),
    }),
};

// ====================================
// Mempool API
// ====================================

export const mempoolAPI = {
  getTransactions: (params?: {
    page?: number;
    limit?: number;
    riskLevel?: string;
    timeRange?: string;
  }) =>
    httpClient.get<PaginatedResponse<MempoolTransaction>>(
      "/mempool/transactions",
      {
        baseURL: config.api.mempoolUrl,
        params: new URLSearchParams(params as any),
      },
    ),

  getTransaction: (txHash: string) =>
    httpClient.get<MempoolTransaction>(`/mempool/transactions/${txHash}`, {
      baseURL: config.api.mempoolUrl,
    }),

  getAlerts: (params?: { page?: number; limit?: number; type?: string }) =>
    httpClient.get<PaginatedResponse<MempoolAlert>>("/mempool/alerts", {
      baseURL: config.api.mempoolUrl,
      params: new URLSearchParams(params as any),
    }),

  getLiveData: () =>
    httpClient.get("/mempool/live", {
      baseURL: config.api.mempoolUrl,
    }),

  getStats: (timeRange?: string) =>
    httpClient.get(`/mempool/stats${timeRange ? `?range=${timeRange}` : ""}`, {
      baseURL: config.api.mempoolUrl,
    }),

  subscribeToUpdates: (filters?: any) =>
    httpClient.post("/mempool/subscribe", filters, {
      baseURL: config.api.mempoolUrl,
    }),
};

// ====================================
// System API
// ====================================

export const systemAPI = {
  getHealth: () => httpClient.get<SystemHealth>("/system/health"),

  getMetrics: () => httpClient.get("/system/metrics"),

  getLogs: (params?: { level?: string; limit?: number; service?: string }) =>
    httpClient.get("/system/logs", {
      params: new URLSearchParams(params as any),
    }),

  runDiagnostics: () => httpClient.post("/system/diagnostics"),
};

// ====================================
// Scheduler API
// ====================================

export const schedulerAPI = {
  getJobs: (params?: { page?: number; limit?: number; status?: string }) =>
    httpClient.get<PaginatedResponse<ScheduledJob>>("/scheduler/jobs", {
      params: new URLSearchParams(params as any),
    }),

  getJob: (jobId: string) =>
    httpClient.get<ScheduledJob>(`/scheduler/jobs/${jobId}`),

  createJob: (jobData: {
    name: string;
    type: string;
    schedule: string;
    parameters?: any;
  }) => httpClient.post<ScheduledJob>("/scheduler/jobs", jobData),

  updateJob: (jobId: string, updates: Partial<ScheduledJob>) =>
    httpClient.patch<ScheduledJob>(`/scheduler/jobs/${jobId}`, updates),

  deleteJob: (jobId: string) => httpClient.delete(`/scheduler/jobs/${jobId}`),

  pauseJob: (jobId: string) =>
    httpClient.post(`/scheduler/jobs/${jobId}/pause`),

  resumeJob: (jobId: string) =>
    httpClient.post(`/scheduler/jobs/${jobId}/resume`),

  runJob: (jobId: string) => httpClient.post(`/scheduler/jobs/${jobId}/run`),

  getJobRuns: (jobId: string, params?: { page?: number; limit?: number }) =>
    httpClient.get(`/scheduler/jobs/${jobId}/runs`, {
      params: new URLSearchParams(params as any),
    }),
};

// ====================================
// Settings API
// ====================================

export const settingsAPI = {
  getSettings: () => httpClient.get("/settings"),

  updateSettings: (settings: any) => httpClient.put("/settings", settings),

  getNotificationSettings: () => httpClient.get("/settings/notifications"),

  updateNotificationSettings: (settings: any) =>
    httpClient.put("/settings/notifications", settings),

  testIntegration: (type: string, config: any) =>
    httpClient.post(`/settings/integrations/${type}/test`, config),

  getApiKeys: () => httpClient.get("/settings/api-keys"),

  createApiKey: (name: string, permissions: string[]) =>
    httpClient.post("/settings/api-keys", { name, permissions }),

  revokeApiKey: (keyId: string) =>
    httpClient.delete(`/settings/api-keys/${keyId}`),
};

// ====================================
// Reports API
// ====================================

export const reportsAPI = {
  getReports: (params?: { page?: number; limit?: number; type?: string }) =>
    httpClient.get("/reports", {
      params: new URLSearchParams(params as any),
    }),

  generateReport: (type: string, parameters: any) =>
    httpClient.post("/reports/generate", { type, parameters }),

  downloadReport: (reportId: string, format: string = "pdf") =>
    httpClient.get(`/reports/${reportId}/download?format=${format}`),

  scheduleReport: (reportConfig: any) =>
    httpClient.post("/reports/schedule", reportConfig),
};

// ====================================
// Export all APIs
// ====================================

export const api = {
  auth: authAPI,
  dashboard: dashboardAPI,
  scanner: scannerAPI,
  mev: mevAPI,
  mempool: mempoolAPI,
  system: systemAPI,
  scheduler: schedulerAPI,
  settings: settingsAPI,
  reports: reportsAPI,
};

export default api;

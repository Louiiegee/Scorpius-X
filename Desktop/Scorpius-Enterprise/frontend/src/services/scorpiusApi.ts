/**
 * SCORPIUS API Integration Service
 *
 * Provides TypeScript interfaces and API methods for connecting
 * to the SCORPIUS Enterprise backend API server.
 */

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// TypeScript Interfaces for API Responses
export interface VulnerabilitySummary {
  total_count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface Vulnerability {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location?: string;
  recommendation?: string;
  confidence?: number;
}

export interface AnalysisStatus {
  static_analysis_success: boolean;
  bytecode_analysis_success: boolean;
  source_code_available: boolean;
  abi_available: boolean;
}

export interface ContractAnalysisResult {
  success: boolean;
  contract_address: string;
  chain_id: number;
  analysis_timestamp: string;
  risk_score: number;
  vulnerability_summary: VulnerabilitySummary;
  vulnerabilities: {
    critical: Vulnerability[];
    high: Vulnerability[];
    medium: Vulnerability[];
    low: Vulnerability[];
  };
  analysis_status: AnalysisStatus;
  function_selectors: string[];
  identified_patterns: string[];
  recommendations: string[];
  errors: string[];
}

export interface BatchAnalysisResult {
  success: boolean;
  batch_size: number;
  completed_analyses: number;
  failed_analyses: number;
  results: Record<
    string,
    {
      success: boolean;
      risk_score?: number;
      vulnerability_count?: number;
      critical_count?: number;
      high_count?: number;
      recommendations?: string[];
      error?: string;
    }
  >;
}

export interface EnhancedScanRequest {
  contract_address?: string;
  contract_source: string;
  scan_type?: "standard" | "advanced" | "comprehensive";
  enable_ai_analysis?: boolean;
  enable_multi_agent?: boolean;
}

export interface EnhancedScanStatus {
  scan_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface EnhancedScanResult {
  scan_id: string;
  contract_address?: string;
  vulnerabilities: Vulnerability[];
  risk_assessment: {
    overall_risk: "low" | "medium" | "high" | "critical";
    risk_score: number;
    confidence: number;
  };
  ai_analysis?: {
    summary: string;
    key_findings: string[];
    recommendations: string[];
  };
  multi_agent_consensus?: {
    agreement_score: number;
    conflicting_opinions: string[];
  };
  detailed_report: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  uptime_seconds: number;
  request_count: number;
  analyzer_initialized: boolean;
  timestamp: string;
  analyzer_status?: any;
}

export interface ScanStatistics {
  total_scans: number;
  completed_scans: number;
  failed_scans: number;
  average_scan_time: number;
  vulnerabilities_found: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// API Error Class
export class ScorpiusAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any,
  ) {
    super(message);
    this.name = "ScorpiusAPIError";
  }
}

// API Service Class
export class ScorpiusAPIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ScorpiusAPIError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ScorpiusAPIError) {
        throw error;
      }
      throw new ScorpiusAPIError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Health and Status
  async getHealth(): Promise<HealthStatus> {
    return this.makeRequest<HealthStatus>("/api/health");
  }

  async getStatus(): Promise<any> {
    return this.makeRequest<any>("/api/status");
  }

  // Contract Analysis
  async analyzeContract(
    contractAddress: string,
    options: {
      rpcUrl?: string;
      chainId?: number;
      explorerApiKey?: string;
    } = {},
  ): Promise<ContractAnalysisResult> {
    return this.makeRequest<ContractAnalysisResult>("/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        contract_address: contractAddress,
        rpc_url: options.rpcUrl,
        chain_id: options.chainId,
        explorer_api_key: options.explorerApiKey,
      }),
    });
  }

  async analyzeBatch(
    contractAddresses: string[],
    options: {
      rpcUrl?: string;
      chainId?: number;
      explorerApiKey?: string;
    } = {},
  ): Promise<BatchAnalysisResult> {
    return this.makeRequest<BatchAnalysisResult>("/api/analyze/batch", {
      method: "POST",
      body: JSON.stringify({
        contract_addresses: contractAddresses,
        rpc_url: options.rpcUrl,
        chain_id: options.chainId,
        explorer_api_key: options.explorerApiKey,
      }),
    });
  }

  // Enhanced Scanner
  async startEnhancedScan(
    request: EnhancedScanRequest,
  ): Promise<{ scan_id: string; message: string }> {
    return this.makeRequest<{ scan_id: string; message: string }>(
      "/api/enhanced-scanner/scan",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  async getScanStatus(scanId: string): Promise<EnhancedScanStatus> {
    const response = await this.makeRequest<{
      scan_status: EnhancedScanStatus;
    }>(`/api/enhanced-scanner/status/${scanId}`);
    return response.scan_status;
  }

  async getScanResult(scanId: string): Promise<EnhancedScanResult> {
    const response = await this.makeRequest<{
      scan_result: EnhancedScanResult;
    }>(`/api/enhanced-scanner/result/${scanId}`);
    return response.scan_result;
  }

  async getRecentScans(limit: number = 20): Promise<EnhancedScanStatus[]> {
    const response = await this.makeRequest<{
      recent_scans: EnhancedScanStatus[];
    }>(`/api/enhanced-scanner/recent?limit=${limit}`);
    return response.recent_scans;
  }

  async getScanStatistics(): Promise<ScanStatistics> {
    const response = await this.makeRequest<{ statistics: ScanStatistics }>(
      "/api/enhanced-scanner/statistics",
    );
    return response.statistics;
  }

  async cancelScan(scanId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(
      `/api/enhanced-scanner/cancel/${scanId}`,
      {
        method: "POST",
      },
    );
  }

  // Mempool Operations
  async startMempoolMonitoring(
    websocketUrl?: string,
  ): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>("/api/mempool/start", {
      method: "POST",
      body: JSON.stringify({
        websocket_url: websocketUrl,
      }),
    });
  }

  async getMempoolAnalytics(): Promise<any> {
    return this.makeRequest<any>("/api/mempool/analytics");
  }

  // Analytics
  async getComprehensiveAnalytics(
    options: {
      predictions?: boolean;
      defi?: boolean;
    } = {},
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options.predictions !== undefined)
      params.set("predictions", options.predictions.toString());
    if (options.defi !== undefined) params.set("defi", options.defi.toString());

    return this.makeRequest<any>(
      `/api/analytics/comprehensive?${params.toString()}`,
    );
  }

  async getAnalyticsSummary(): Promise<any> {
    return this.makeRequest<any>("/api/analytics/summary");
  }

  // Audit Reports
  async generateAuditReport(
    scanResults: any,
    projectInfo: any,
    outputPath?: string,
  ): Promise<{ report_path: string; message: string }> {
    return this.makeRequest<{ report_path: string; message: string }>(
      "/api/audit/generate",
      {
        method: "POST",
        body: JSON.stringify({
          scan_results: scanResults,
          project_info: projectInfo,
          output_path: outputPath,
        }),
      },
    );
  }

  // Bug Bounty
  async analyzeBugBounty(programId: string): Promise<any> {
    return this.makeRequest<any>("/api/bugbounty/analyze", {
      method: "POST",
      body: JSON.stringify({
        program_id: programId,
      }),
    });
  }
}

// Create default instance
export const scorpiusAPI = new ScorpiusAPIService();

// Utility functions
export const getRiskColor = (riskScore: number): string => {
  if (riskScore >= 80) return "#ff4444"; // Critical - Red
  if (riskScore >= 60) return "#ff6b35"; // High - Orange-Red
  if (riskScore >= 40) return "#ffaa00"; // Medium - Orange
  if (riskScore >= 20) return "#ffd700"; // Low-Medium - Yellow
  return "#00ff88"; // Low - Green
};

export const getRiskLabel = (riskScore: number): string => {
  if (riskScore >= 80) return "Critical";
  if (riskScore >= 60) return "High";
  if (riskScore >= 40) return "Medium";
  if (riskScore >= 20) return "Low";
  return "Minimal";
};

export const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "#ff4444";
    case "high":
      return "#ff6b35";
    case "medium":
      return "#ffaa00";
    case "low":
      return "#ffd700";
    default:
      return "#00ff88";
  }
};

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

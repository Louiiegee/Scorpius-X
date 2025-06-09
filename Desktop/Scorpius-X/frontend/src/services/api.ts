// Scorpius API Service Layer
const API_BASE_URL = "http://localhost:8000/api";

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("scorpius_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request helper with graceful error handling
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("scorpius_token");
        console.warn("Authentication failed - redirecting to login");
        // Don't redirect immediately, let components handle gracefully
        throw new Error("Authentication failed");
      }
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // More specific error handling
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.warn(
        `🔌 Backend server not available for ${endpoint}. Using fallback data.`,
      );
      throw new Error(`Backend not available: ${endpoint}`);
    }
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  getCurrentUser: async () => {
    return apiRequest("/auth/me");
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    return apiRequest("/dashboard/stats");
  },
};

// Smart Contract Scanner API
export const scannerAPI = {
  analyzeContract: async (
    contractAddress: string,
    scanType: string = "full",
  ) => {
    return apiRequest("/scanner/analyze", {
      method: "POST",
      body: JSON.stringify({
        contract_address: contractAddress,
        scan_type: scanType,
      }),
    });
  },

  uploadContract: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("scorpius_token");
    const response = await fetch(`${API_BASE_URL}/scanner/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return await response.json();
  },
};

// MEV Operations API
export const mevAPI = {
  getStrategies: async () => {
    return apiRequest("/mev/strategies");
  },

  deployStrategy: async (strategyType: string, parameters: any) => {
    return apiRequest("/mev/deploy-strategy", {
      method: "POST",
      body: JSON.stringify({ strategy_type: strategyType, parameters }),
    });
  },

  pauseStrategy: async (strategyId: string) => {
    return apiRequest(`/mev/strategies/${strategyId}/pause`, {
      method: "POST",
    });
  },

  stopStrategy: async (strategyId: string) => {
    return apiRequest(`/mev/strategies/${strategyId}/stop`, {
      method: "POST",
    });
  },

  getPerformanceMetrics: async () => {
    return apiRequest("/mev/performance");
  },
};

// Mempool Monitor API
export const mempoolAPI = {
  getAlerts: async () => {
    return apiRequest("/mempool/alerts");
  },

  getLiveData: async () => {
    return apiRequest("/mempool/live");
  },
};

// Security Auditor API
export const securityAPI = {
  performAudit: async (contractAddress: string) => {
    return apiRequest("/security/audit", {
      method: "POST",
      body: JSON.stringify({ contract_address: contractAddress }),
    });
  },

  getAuditHistory: async () => {
    return apiRequest("/security/audits");
  },
};

// Threat Detection API
export const threatAPI = {
  getZeroDayThreats: async () => {
    return apiRequest("/threats/zero-day");
  },

  getActiveThreats: async () => {
    return apiRequest("/threats/active");
  },
};

// System Health API
export const systemAPI = {
  getHealth: async () => {
    return apiRequest("/system/health");
  },
};

// Scheduler API
export const schedulerAPI = {
  getJobs: async () => {
    return apiRequest("/scheduler/jobs");
  },

  createJob: async (jobData: any) => {
    return apiRequest("/scheduler/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });
  },

  pauseJob: async (jobId: string) => {
    return apiRequest(`/scheduler/jobs/${jobId}/pause`, {
      method: "POST",
    });
  },

  resumeJob: async (jobId: string) => {
    return apiRequest(`/scheduler/jobs/${jobId}/resume`, {
      method: "POST",
    });
  },
};

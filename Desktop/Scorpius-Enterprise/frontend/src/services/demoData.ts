/**
 * Demo Data for SCORPIUS Dashboard
 *
 * Provides fallback data when backend is not available
 */

import {
  ContractAnalysisResult,
  EnhancedScanStatus,
  ScanStatistics,
} from "./scorpiusApi";

export const demoAnalysisResult: ContractAnalysisResult = {
  success: true,
  contract_address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  chain_id: 1,
  analysis_timestamp: new Date().toISOString(),
  risk_score: 45,
  vulnerability_summary: {
    total_count: 8,
    critical: 1,
    high: 2,
    medium: 3,
    low: 2,
  },
  vulnerabilities: {
    critical: [
      {
        type: "Reentrancy",
        severity: "critical",
        description: "Potential reentrancy vulnerability in withdraw function",
        location: "line 142",
        recommendation: "Use ReentrancyGuard modifier",
        confidence: 95,
      },
    ],
    high: [
      {
        type: "Integer Overflow",
        severity: "high",
        description: "Unchecked arithmetic operations detected",
        location: "line 89",
        recommendation: "Use SafeMath library or Solidity 0.8.x",
        confidence: 88,
      },
      {
        type: "Access Control",
        severity: "high",
        description: "Missing access control on critical function",
        location: "line 156",
        recommendation: "Add onlyOwner modifier",
        confidence: 92,
      },
    ],
    medium: [
      {
        type: "Gas Limit",
        severity: "medium",
        description: "Function may run out of gas with large arrays",
        location: "line 203",
        recommendation: "Implement pagination or batching",
        confidence: 75,
      },
      {
        type: "Timestamp Dependence",
        severity: "medium",
        description: "Contract relies on block.timestamp",
        location: "line 67",
        recommendation: "Consider using block numbers instead",
        confidence: 70,
      },
      {
        type: "Uninitialized Storage",
        severity: "medium",
        description: "Storage variable not properly initialized",
        location: "line 45",
        recommendation: "Add initialization in constructor",
        confidence: 82,
      },
    ],
    low: [
      {
        type: "Style Guide",
        severity: "low",
        description: "Function naming doesn't follow convention",
        location: "line 78",
        recommendation: "Use camelCase for function names",
        confidence: 60,
      },
      {
        type: "Gas Optimization",
        severity: "low",
        description: "Unnecessary storage reads in loop",
        location: "line 123",
        recommendation: "Cache storage variables",
        confidence: 65,
      },
    ],
  },
  analysis_status: {
    static_analysis_success: true,
    bytecode_analysis_success: true,
    source_code_available: true,
    abi_available: true,
  },
  function_selectors: [
    "0xa9059cbb", // transfer
    "0x23b872dd", // transferFrom
    "0x095ea7b3", // approve
    "0x70a08231", // balanceOf
  ],
  identified_patterns: [
    "ERC20 Token",
    "Ownable Pattern",
    "Pausable Pattern",
    "AccessControl Pattern",
  ],
  recommendations: [
    "Implement ReentrancyGuard for all external functions",
    "Use OpenZeppelin's SafeMath or upgrade to Solidity 0.8.x",
    "Add comprehensive access control checks",
    "Consider implementing emergency pause functionality",
    "Add events for all state changes",
    "Implement proper error handling with custom errors",
  ],
  errors: [],
};

export const demoRecentScans: EnhancedScanStatus[] = [
  {
    scan_id: "scan_001_demo",
    status: "completed",
    progress: 100,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    scan_id: "scan_002_demo",
    status: "completed",
    progress: 100,
    started_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 6600000).toISOString(),
  },
  {
    scan_id: "scan_003_demo",
    status: "running",
    progress: 67,
    started_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    scan_id: "scan_004_demo",
    status: "queued",
    progress: 0,
    started_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    scan_id: "scan_005_demo",
    status: "failed",
    progress: 25,
    started_at: new Date(Date.now() - 5400000).toISOString(),
    error_message: "Source code compilation failed",
  },
];

export const demoStatistics: ScanStatistics = {
  total_scans: 1247,
  completed_scans: 1156,
  failed_scans: 91,
  average_scan_time: 127, // seconds
  vulnerabilities_found: {
    critical: 89,
    high: 234,
    medium: 456,
    low: 712,
  },
};

export const demoDashboardData = {
  systemStatus: {
    online: true,
    activeScans: 5,
    threatsDetected: 12,
    systemLoad: 34,
    lastUpdate: new Date().toISOString(),
  },
  realtimeMetrics: {
    gasPrice: 45.2,
    blockNumber: 18567234,
    pendingTransactions: 156789,
    mevOpportunities: 23,
    networkHealth: 98.5,
  },
  recentAlerts: [
    {
      id: "alert_001",
      type: "critical",
      title: "Suspicious MEV Activity Detected",
      description: "Unusual sandwich attack patterns on DEX",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      severity: "critical",
    },
    {
      id: "alert_002",
      type: "warning",
      title: "High Gas Price Spike",
      description: "Gas prices increased 300% in last 10 minutes",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      severity: "high",
    },
    {
      id: "alert_003",
      type: "info",
      title: "New Vulnerability Pattern Found",
      description: "Novel reentrancy variant detected in flash loan contracts",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      severity: "medium",
    },
  ],
};

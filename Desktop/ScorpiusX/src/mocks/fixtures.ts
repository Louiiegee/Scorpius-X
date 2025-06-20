/**
 * Comprehensive mock JSON fixtures for all API endpoints
 * This data mimics real API responses and enables end-to-end UI development
 */

import type {
  User,
  DashboardStats,
  ThreatAlert,
  ContractScanResult,
  MevStrategy,
  MempoolTransaction,
  MempoolAlert,
  SystemHealth,
  ScheduledJob,
  ChartData,
  NetworkActivityData,
  PerformanceData,
  SecurityMetric,
} from "@/types/generated";

// ====================================
// User & Auth Fixtures
// ====================================

export const mockUser: User = {
  id: "1",
  username: "agent_scorpius",
  email: "agent@scorpius.io",
  role: "admin",
  permissions: ["scan:execute", "mev:manage", "system:admin", "reports:view"],
  preferences: {
    theme: "dark",
    notifications: {
      email: true,
      push: true,
      slack: false,
      telegram: true,
      criticalThreats: true,
      mevOpportunities: true,
      systemAlerts: true,
    },
    dashboard: {
      refreshInterval: 30000,
      defaultCharts: ["threats", "performance", "network"],
      layout: "expanded",
    },
  },
  lastLoginAt: "2024-01-15T10:30:00.000Z",
  createdAt: "2023-12-01T00:00:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z",
};

// ====================================
// Dashboard Fixtures
// ====================================

export const mockDashboardStats: DashboardStats = {
  threatsDetected: 47,
  activeScans: 12,
  activeBots: 8,
  systemUptime: 2592000, // 30 days in seconds
  lastScanTime: "2024-01-15T10:25:00.000Z",
  totalTransactions: 1847293,
  mevOpportunities: 234,
  securityScore: 94.7,
};

export const mockThreatAlerts: ThreatAlert[] = [
  {
    id: "1",
    type: "critical",
    title: "Honeypot Contract Detected",
    description: "Sophisticated honeypot contract with anti-MEV mechanisms",
    contractAddress: "0x742d35Cc6634C0532925a3b8D5c0532925a3b8D",
    severity: 9.2,
    status: "active",
    detectedAt: "2024-01-15T10:15:00.000Z",
    metadata: {
      confidence: 0.96,
      honeypotType: "ownership_trap",
      estimatedLoss: "$50,000",
    },
  },
  {
    id: "2",
    type: "high",
    title: "Flash Loan Attack Vector",
    description: "Potential flash loan arbitrage opportunity with high risk",
    transactionHash:
      "0x8e23c1b5a0f15c4e92a4b1c5a0f15c4e92a4b1c5a0f15c4e92a4b1c5a0f15c4e",
    severity: 7.8,
    status: "investigating",
    detectedAt: "2024-01-15T09:45:00.000Z",
    metadata: {
      estimatedProfit: "$12,500",
      gasRequirement: "850,000",
      protocols: ["Uniswap V3", "Aave V3"],
    },
  },
  {
    id: "3",
    type: "medium",
    title: "Unusual MEV Activity",
    description: "Increased sandwich attack patterns detected",
    severity: 5.4,
    status: "resolved",
    detectedAt: "2024-01-15T08:30:00.000Z",
    resolvedAt: "2024-01-15T09:00:00.000Z",
    metadata: {
      attackCount: 23,
      affectedTxs: 89,
      totalVolume: "$2.3M",
    },
  },
];

export const mockChartData: ChartData = {
  threatDetection: Array.from({ length: 20 }, (_, i) => ({
    timestamp: new Date(Date.now() - (19 - i) * 60000).toISOString(),
    value: Math.floor(Math.random() * 50) + 10,
  })),
  networkActivity: [
    {
      network: "ethereum",
      percentage: 45,
      transactionsPerSecond: 15.2,
      color: "#627EEA",
    },
    {
      network: "polygon",
      percentage: 25,
      transactionsPerSecond: 12.8,
      color: "#8247E5",
    },
    {
      network: "bsc",
      percentage: 15,
      transactionsPerSecond: 8.3,
      color: "#F3BA2F",
    },
    {
      network: "arbitrum",
      percentage: 10,
      transactionsPerSecond: 5.1,
      color: "#28A0F0",
    },
    {
      network: "avalanche",
      percentage: 5,
      transactionsPerSecond: 2.4,
      color: "#E84142",
    },
  ],
  performanceMetrics: [
    { metric: "Response Time", value: 87, unit: "ms" },
    { metric: "Throughput", value: 94, unit: "%" },
    { metric: "Error Rate", value: 98, unit: "%" },
    { metric: "Uptime", value: 99.9, unit: "%" },
  ],
  securityPosture: [
    { category: "firewall", score: 95, maxScore: 100 },
    { category: "encryption", score: 98, maxScore: 100 },
    { category: "monitoring", score: 89, maxScore: 100 },
    { category: "compliance", score: 92, maxScore: 100 },
    { category: "vulnerability", score: 87, maxScore: 100 },
    { category: "authentication", score: 96, maxScore: 100 },
  ],
};

// ====================================
// Scanner Fixtures
// ====================================

export const mockScanResults: ContractScanResult[] = [
  {
    id: "scan_1",
    contractAddress: "0x742d35Cc6634C0532925a3b8D5c0532925a3b8D",
    scanType: "full",
    status: "completed",
    startedAt: "2024-01-15T10:00:00.000Z",
    completedAt: "2024-01-15T10:05:00.000Z",
    results: {
      securityScore: 32.5,
      vulnerabilities: [
        {
          id: "vuln_1",
          severity: "critical",
          category: "Ownership",
          title: "Ownership Renounced After Deployment",
          description:
            "Contract ownership was renounced, preventing legitimate operations",
          recommendation: "Verify contract logic before interacting",
          evidence: [
            "ownershipRenounced() returns true",
            "onlyOwner functions are inaccessible",
          ],
          cvssScore: 9.1,
        },
        {
          id: "vuln_2",
          severity: "high",
          category: "Logic",
          title: "Hidden Transfer Restrictions",
          description:
            "Transfer function contains hidden conditions that may trap funds",
          recommendation: "Analyze transfer logic thoroughly before trading",
          evidence: [
            "Conditional transfer failures",
            "Whitelist-based restrictions",
          ],
          cvssScore: 7.8,
        },
      ],
      honeypotAnalysis: {
        isHoneypot: true,
        confidence: 0.96,
        honeypotType: "ownership_trap",
        indicators: [
          "Ownership renounced",
          "Hidden transfer restrictions",
          "High gas consumption",
        ],
        riskLevel: "critical",
      },
      bytecodeSimilarity: [
        {
          contractAddress: "0x8B5c1A5c8B5c1A5c8B5c1A5c8B5c1A5c8B5c1A5c",
          similarity: 0.87,
          matchedFunctions: ["transfer", "balanceOf", "_beforeTokenTransfer"],
          riskAssessment: "Known honeypot pattern",
        },
      ],
      gasOptimization: [
        {
          function: "transfer",
          currentGas: 85000,
          optimizedGas: 21000,
          savings: 64000,
          suggestion: "Remove unnecessary checks for legitimate transfers",
        },
      ],
      complianceChecks: [
        {
          standard: "ERC-20",
          compliant: false,
          details: "Transfer function behavior is non-standard",
          requirements: [
            "Standard transfer behavior",
            "Proper event emissions",
          ],
        },
      ],
    },
    metadata: {
      compiler: "Solidity 0.8.19",
      optimization: true,
      sourceCode: "Not verified",
    },
  },
];

// ====================================
// MEV Fixtures
// ====================================

export const mockMevStrategies: MevStrategy[] = [
  {
    id: "mev_1",
    name: "Arbitrage Hunter",
    type: "arbitrage",
    status: "active",
    profitability: 127.5,
    successRate: 89.3,
    totalProfit: 45.7,
    lastExecuted: "2024-01-15T10:20:00.000Z",
    parameters: {
      minProfitThreshold: 50,
      maxGasPrice: 30,
      slippageTolerance: 0.5,
      targetTokens: ["USDC", "USDT", "DAI", "WETH"],
      exchanges: ["Uniswap V3", "SushiSwap", "1inch"],
    },
    metrics: {
      totalExecutions: 847,
      successfulExecutions: 756,
      failedExecutions: 91,
      totalGasUsed: 12500000,
      averageProfit: 0.054,
      maxProfit: 2.3,
      recentPerformance: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (9 - i) * 3600000).toISOString(),
        value: Math.random() * 2 + 0.01,
      })),
    },
  },
  {
    id: "mev_2",
    name: "Flash Liquidator",
    type: "liquidation",
    status: "paused",
    profitability: 89.2,
    successRate: 76.8,
    totalProfit: 23.4,
    lastExecuted: "2024-01-15T08:45:00.000Z",
    parameters: {
      minProfitThreshold: 100,
      maxGasPrice: 50,
      slippageTolerance: 1.0,
      targetTokens: ["WETH", "WBTC", "USDC"],
      exchanges: ["Aave V3", "Compound V3"],
    },
    metrics: {
      totalExecutions: 234,
      successfulExecutions: 180,
      failedExecutions: 54,
      totalGasUsed: 8700000,
      averageProfit: 0.1,
      maxProfit: 5.7,
      recentPerformance: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (9 - i) * 3600000).toISOString(),
        value: Math.random() * 3 + 0.05,
      })),
    },
  },
];

// ====================================
// Mempool Fixtures
// ====================================

export const mockMempoolTransactions: MempoolTransaction[] = [
  {
    hash: "0x8e23c1b5a0f15c4e92a4b1c5a0f15c4e92a4b1c5a0f15c4e92a4b1c5a0f15c4e",
    from: "0x742d35Cc6634C0532925a3b8D5c0532925a3b8D",
    to: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    value: "1000000000000000000",
    gasPrice: "25000000000",
    gasLimit: "100000",
    nonce: 42,
    data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d5c0532925a3b8d",
    timestamp: "2024-01-15T10:25:00.000Z",
    riskScore: 8.7,
    flags: ["high_value", "unusual_pattern"],
  },
  {
    hash: "0x7d12b2c4a9e14d3f82b3c4a9e14d3f82b3c4a9e14d3f82b3c4a9e14d3f82b3c4",
    from: "0x8B5c1A5c8B5c1A5c8B5c1A5c8B5c1A5c8B5c1A5c",
    to: "0xA0b86a33E6441b8c3b8b1e2E0b8c3b8b1e2E0b8c",
    value: "500000000000000000",
    gasPrice: "30000000000",
    gasLimit: "200000",
    nonce: 15,
    data: "0x",
    timestamp: "2024-01-15T10:24:00.000Z",
    riskScore: 3.2,
    flags: ["normal"],
  },
];

export const mockMempoolAlerts: MempoolAlert[] = [
  {
    id: "mempool_1",
    type: "mev_opportunity",
    severity: "high",
    description: "Large arbitrage opportunity detected across DEXs",
    transactionHash:
      "0x8e23c1b5a0f15c4e92a4b1c5a0f15c4e92a4b1c5a0f15c4e92a4b1c5a0f15c4e",
    detectedAt: "2024-01-15T10:25:00.000Z",
    metadata: {
      estimatedProfit: 1.2,
      requiredGas: 250000,
      timeWindow: 12,
      protocols: ["Uniswap V3", "SushiSwap"],
    },
  },
  {
    id: "mempool_2",
    type: "suspicious_pattern",
    severity: "medium",
    description:
      "Multiple transactions from same address with increasing gas prices",
    transactionHash:
      "0x7d12b2c4a9e14d3f82b3c4a9e14d3f82b3c4a9e14d3f82b3c4a9e14d3f82b3c4",
    detectedAt: "2024-01-15T10:23:00.000Z",
    metadata: {
      transactionCount: 5,
      gasPriceIncrease: "25%",
      suspicionLevel: 6.8,
    },
  },
];

// ====================================
// System Fixtures
// ====================================

export const mockSystemHealth: SystemHealth = {
  status: "healthy",
  uptime: 2592000,
  services: [
    {
      name: "Scanner API",
      status: "online",
      responseTime: 45,
      errorRate: 0.02,
      lastChecked: "2024-01-15T10:25:00.000Z",
    },
    {
      name: "MEV Engine",
      status: "online",
      responseTime: 78,
      errorRate: 0.001,
      lastChecked: "2024-01-15T10:25:00.000Z",
    },
    {
      name: "Mempool Monitor",
      status: "degraded",
      responseTime: 234,
      errorRate: 0.05,
      lastChecked: "2024-01-15T10:25:00.000Z",
    },
    {
      name: "Database",
      status: "online",
      responseTime: 12,
      errorRate: 0,
      lastChecked: "2024-01-15T10:25:00.000Z",
    },
  ],
  metrics: {
    cpuUsage: 67.3,
    memoryUsage: 78.9,
    diskUsage: 45.2,
    networkLatency: 23,
    queueDepth: 12,
  },
  lastChecked: "2024-01-15T10:25:00.000Z",
};

// ====================================
// Scheduler Fixtures
// ====================================

export const mockScheduledJobs: ScheduledJob[] = [
  {
    id: "job_1",
    name: "Daily Security Scan",
    type: "scan",
    schedule: "0 2 * * *",
    status: "active",
    lastRun: "2024-01-15T02:00:00.000Z",
    nextRun: "2024-01-16T02:00:00.000Z",
    parameters: {
      scanType: "full",
      targets: ["top_contracts", "new_contracts"],
      notifications: true,
    },
    metrics: {
      totalRuns: 365,
      successfulRuns: 358,
      failedRuns: 7,
      averageDuration: 1847,
      lastDuration: 1923,
      recentRuns: [
        {
          id: "run_1",
          startedAt: "2024-01-15T02:00:00.000Z",
          completedAt: "2024-01-15T02:32:03.000Z",
          status: "completed",
          duration: 1923,
          logs: [
            "Scan started",
            "Processing 1,247 contracts",
            "Found 3 issues",
            "Scan completed",
          ],
        },
      ],
    },
  },
];

// ====================================
// Export all fixtures
// ====================================

export const mockData = {
  user: mockUser,
  dashboardStats: mockDashboardStats,
  threatAlerts: mockThreatAlerts,
  chartData: mockChartData,
  scanResults: mockScanResults,
  mevStrategies: mockMevStrategies,
  mempoolTransactions: mockMempoolTransactions,
  mempoolAlerts: mockMempoolAlerts,
  systemHealth: mockSystemHealth,
  scheduledJobs: mockScheduledJobs,
};

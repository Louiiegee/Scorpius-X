// FALLBACK DATA SERVICE - PROVIDES MOCK DATA WHEN BACKEND IS NOT AVAILABLE

export const fallbackData = {
  // Dashboard stats
  dashboardStats: {
    total_scans: 1247,
    vulnerabilities_found: 23,
    mev_profit: 42600,
    contracts_analyzed: 1247,
    security_score: 98.5,
    active_alerts: 3,
    system_load: 34,
    timestamp: new Date().toISOString(),
  },

  // System health
  systemHealth: {
    status: "online",
    cpu_usage: Math.floor(Math.random() * 40) + 20,
    memory_usage: Math.floor(Math.random() * 50) + 40,
    network_usage: Math.floor(Math.random() * 30) + 10,
    storage_usage: Math.floor(Math.random() * 40) + 30,
    active_scans: Math.floor(Math.random() * 100) + 100,
    uptime: "72h 15m",
    timestamp: new Date().toISOString(),
  },

  // Security alerts/threats
  securityThreats: [
    {
      id: "THR-001",
      type: "Flash Loan Attack",
      title: "Flash Loan Attack Detected",
      target: "0x1234...abcd",
      severity: "Critical",
      status: "Active",
      first_seen: new Date(Date.now() - 15 * 60000).toISOString(),
      time: "15m ago",
      contract: "0x1234...abcd",
      estimated_loss: 250000,
      confidence: 0.95,
    },
    {
      id: "THR-002",
      type: "Unusual MEV Activity",
      title: "Price Manipulation",
      target: "USDT/WETH Pool",
      severity: "Warning",
      status: "Investigating",
      first_seen: new Date(Date.now() - 60 * 60000).toISOString(),
      time: "1h ago",
      contract: "0x5678...efgh",
      estimated_loss: 50000,
      confidence: 0.78,
    },
    {
      id: "THR-003",
      type: "New Contract Deployment",
      title: "High Gas Price Alert",
      target: "0x9012...ijkl",
      severity: "Info",
      status: "Monitoring",
      first_seen: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      time: "2h ago",
      contract: "0xabcd...1234",
      estimated_loss: 0,
      confidence: 0.65,
    },
    {
      id: "THR-004",
      type: "Reentrancy Vulnerability",
      title: "Potential Reentrancy Found",
      target: "0xef12...5678",
      severity: "Critical",
      status: "Patched",
      first_seen: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
      time: "3h ago",
      contract: "0xef12...5678",
      estimated_loss: 0,
      confidence: 0.88,
    },
  ],

  // MEV strategies
  mevStrategies: [
    {
      id: "ARB-001",
      name: "Cross-DEX Arbitrage",
      type: "arbitrage",
      status: "active",
      profit: 12847.23,
      profit_change: "+23.4%",
      trades: 342,
      success_rate: 94.2,
      gas_used: 2.3,
      last_trade: "2m ago",
      confidence: 98,
    },
    {
      id: "LIQ-002",
      name: "Liquidation Hunter",
      type: "liquidation",
      status: "active",
      profit: 8234.56,
      profit_change: "+18.7%",
      trades: 156,
      success_rate: 100.0,
      gas_used: 1.8,
      last_trade: "5m ago",
      confidence: 96,
    },
    {
      id: "SAN-003",
      name: "Sandwich Attacks",
      type: "sandwich",
      status: "paused",
      profit: 5987.45,
      profit_change: "-2.1%",
      trades: 89,
      success_rate: 87.3,
      gas_used: 1.2,
      last_trade: "1h ago",
      confidence: 78,
    },
  ],

  // Network nodes for 3D visualization
  networkNodes: [
    {
      id: "1",
      label: "Uniswap V3",
      type: "defi" as const,
      status: "safe" as const,
      connections: ["2", "3"],
      value: 150000,
      risk: 15,
    },
    {
      id: "2",
      label: "USDC Contract",
      type: "contract" as const,
      status: "safe" as const,
      connections: ["1", "4"],
      value: 850000,
      risk: 8,
    },
    {
      id: "3",
      label: "Suspicious Wallet",
      type: "wallet" as const,
      status: "warning" as const,
      connections: ["1", "5"],
      value: 45000,
      risk: 75,
    },
    {
      id: "4",
      label: "WETH Contract",
      type: "contract" as const,
      status: "safe" as const,
      connections: ["2"],
      value: 1200000,
      risk: 12,
    },
    {
      id: "5",
      label: "MEV Bot",
      type: "wallet" as const,
      status: "danger" as const,
      connections: ["3"],
      value: 25000,
      risk: 95,
    },
  ],

  // Chart data for 3D visualizations
  chartData: Array.from({ length: 12 }, (_, i) => ({
    name: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][i],
    value: Math.floor(Math.random() * 80) + 20,
  })),
};

// Helper function to check if backend is available
export const checkBackendAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch("http://localhost:8000/api/system/health", {
      method: "GET",
      timeout: 3000,
    } as RequestInit);
    return response.ok;
  } catch {
    return false;
  }
};

// Fallback API wrapper
export const getFallbackData = (dataType: keyof typeof fallbackData) => {
  console.log(`📦 Using fallback data for: ${dataType}`);
  return fallbackData[dataType];
};

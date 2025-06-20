import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Zap,
  Clock,
  DollarSign,
  Eye,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Play,
  Pause,
  Hash,
  ArrowUpRight,
  ArrowDownLeft,
  Monitor,
  Plus,
  X,
  Target,
  Shield,
  Radar,
  FileText,
  Database,
  Network,
  Bell,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";

interface TrackedContract {
  id: string;
  address: string;
  name?: string;
  addedAt: Date;
  transactionCount: number;
  threatLevel: "low" | "medium" | "high" | "critical";
  lastActivity: Date;
}

interface ThreatDetection {
  id: string;
  contractAddress: string;
  threatType:
    | "reentrancy"
    | "front_run"
    | "sandwich"
    | "honeypot"
    | "suspicious_volume"
    | "gas_manipulation";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  txHash: string;
  timestamp: Date;
  confidence: number;
}

interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: number;
  method: string;
  timestamp: Date;
  priority: "low" | "medium" | "high";
  status: "pending" | "confirmed" | "failed";
  isTracked?: boolean;
  contractAddress?: string;
}

const MempoolMonitor = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trackedContracts, setTrackedContracts] = useState<TrackedContract[]>(
    [],
  );
  const [threatDetections, setThreatDetections] = useState<ThreatDetection[]>(
    [],
  );
  const [newContractAddress, setNewContractAddress] = useState("");
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [filters, setFilters] = useState({
    minValue: "",
    maxGasPrice: "",
    method: "",
    address: "",
    showTrackedOnly: false,
  });
  const [mempoolStats, setMempoolStats] = useState({
    pendingTxs: 47532,
    avgGasPrice: 23.7,
    avgBlockTime: 12.3,
    totalValue: 2847.5,
    trackedContracts: 0,
    threatsDetected: 0,
  });
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Mock contract names for better UX
  const contractNames: { [key: string]: string } = {
    "0x742d35Cc6431C8BF3240C39B6969E3C77e1345eF": "UniswapV3Pool",
    "0x9F8b2C4D5E6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C": "SushiSwapRouter",
    "0x7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F": "CompoundProtocol",
    "0x1234567890ABCDEF1234567890ABCDEF12345678": "AaveV3Pool",
    "0xABCDEF1234567890ABCDEF1234567890ABCDEF12": "CurveFinance",
  };

  // Generate mock transaction data
  const generateMockTransaction = useCallback((): Transaction => {
    const isTrackedTx = Math.random() > 0.7 && trackedContracts.length > 0;
    const trackedContract = isTrackedTx
      ? trackedContracts[Math.floor(Math.random() * trackedContracts.length)]
      : null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: `0x${Math.random().toString(16).substr(2, 40)}`,
      to: trackedContract
        ? trackedContract.address
        : `0x${Math.random().toString(16).substr(2, 40)}`,
      value: (Math.random() * 100).toFixed(4),
      gasPrice: (Math.random() * 200 + 20).toFixed(0),
      gasLimit: Math.floor(Math.random() * 200000 + 21000),
      method: [
        "transfer",
        "swap",
        "approve",
        "withdraw",
        "deposit",
        "mint",
        "burn",
      ][Math.floor(Math.random() * 7)],
      timestamp: new Date(),
      priority:
        Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
      status: "pending",
      isTracked: isTrackedTx,
      contractAddress: trackedContract?.address,
    };
  }, [trackedContracts]);

  // Generate threat detection
  const generateThreatDetection = useCallback(
    (contractAddress: string, txHash: string): ThreatDetection => {
      const threatTypes: ThreatDetection["threatType"][] = [
        "reentrancy",
        "front_run",
        "sandwich",
        "honeypot",
        "suspicious_volume",
        "gas_manipulation",
      ];
      const threatType =
        threatTypes[Math.floor(Math.random() * threatTypes.length)];
      const severities: ThreatDetection["severity"][] = [
        "low",
        "medium",
        "high",
        "critical",
      ];
      const severity =
        severities[Math.floor(Math.random() * severities.length)];

      const descriptions = {
        reentrancy:
          "Potential reentrancy attack detected in contract execution",
        front_run:
          "Front-running attempt detected based on gas price and timing",
        sandwich: "Sandwich attack pattern identified in transaction sequence",
        honeypot:
          "Honeypot behavior detected - contract may prevent withdrawals",
        suspicious_volume: "Unusually large transaction volume detected",
        gas_manipulation:
          "Gas price manipulation detected for transaction ordering",
      };

      return {
        id: Math.random().toString(36).substr(2, 9),
        contractAddress,
        threatType,
        severity,
        description: descriptions[threatType],
        txHash,
        timestamp: new Date(),
        confidence: Math.floor(Math.random() * 30) + 70, // 70-99% confidence
      };
    },
    [],
  );

  // Initialize with mock data
  useEffect(() => {
    const mockTxs = Array.from({ length: 15 }, () => generateMockTransaction());
    setTransactions(mockTxs);
  }, [generateMockTransaction]);

  // Simulate real-time transaction monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(
      () => {
        const newTx = generateMockTransaction();
        setTransactions((prev) => [newTx, ...prev.slice(0, 49)]);

        // Generate threat detection for tracked contracts
        if (newTx.isTracked && Math.random() > 0.8) {
          const threat = generateThreatDetection(
            newTx.contractAddress!,
            newTx.hash,
          );
          setThreatDetections((prev) => [threat, ...prev.slice(0, 19)]);

          setMempoolStats((prev) => ({
            ...prev,
            threatsDetected: prev.threatsDetected + 1,
          }));
        }

        // Update contract transaction counts
        if (newTx.isTracked) {
          setTrackedContracts((prev) =>
            prev.map((contract) =>
              contract.address === newTx.contractAddress
                ? {
                    ...contract,
                    transactionCount: contract.transactionCount + 1,
                    lastActivity: new Date(),
                  }
                : contract,
            ),
          );
        }

        // Update stats
        setMempoolStats((prev) => ({
          ...prev,
          pendingTxs: prev.pendingTxs + Math.floor(Math.random() * 10) - 5,
          avgGasPrice: prev.avgGasPrice + (Math.random() - 0.5) * 2,
          totalValue: prev.totalValue + (Math.random() - 0.5) * 100,
        }));
      },
      2000 + Math.random() * 3000,
    );

    return () => clearInterval(interval);
  }, [isMonitoring, generateMockTransaction, generateThreatDetection]);

  // Update tracked contracts count in stats
  useEffect(() => {
    setMempoolStats((prev) => ({
      ...prev,
      trackedContracts: trackedContracts.length,
    }));
  }, [trackedContracts]);

  const addContractToTrack = () => {
    if (!newContractAddress.trim()) return;

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(newContractAddress.trim())) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    // Check if already tracking
    if (
      trackedContracts.some(
        (c) => c.address.toLowerCase() === newContractAddress.toLowerCase(),
      )
    ) {
      alert("Contract is already being tracked");
      return;
    }

    const newContract: TrackedContract = {
      id: Math.random().toString(36).substr(2, 9),
      address: newContractAddress.trim(),
      name: contractNames[newContractAddress.trim()],
      addedAt: new Date(),
      transactionCount: 0,
      threatLevel: "low",
      lastActivity: new Date(),
    };

    setTrackedContracts((prev) => [...prev, newContract]);
    setNewContractAddress("");
  };

  const removeTrackedContract = (contractId: string) => {
    setTrackedContracts((prev) => prev.filter((c) => c.id !== contractId));
    // Remove related threat detections
    setThreatDetections((prev) =>
      prev.filter((t) => {
        const contract = trackedContracts.find((c) => c.id === contractId);
        return contract ? t.contractAddress !== contract.address : true;
      }),
    );
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filters.minValue && parseFloat(tx.value) < parseFloat(filters.minValue))
      return false;
    if (
      filters.maxGasPrice &&
      parseFloat(tx.gasPrice) > parseFloat(filters.maxGasPrice)
    )
      return false;
    if (
      filters.method &&
      !tx.method.toLowerCase().includes(filters.method.toLowerCase())
    )
      return false;
    if (
      filters.address &&
      !tx.from.toLowerCase().includes(filters.address.toLowerCase()) &&
      !tx.to.toLowerCase().includes(filters.address.toLowerCase())
    )
      return false;
    if (filters.showTrackedOnly && !tx.isTracked) return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ff4444";
      case "medium":
        return "#ffaa00";
      case "low":
        return "#00ff88";
      default:
        return "#999999";
    }
  };

  const getThreatColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#ff0040";
      case "high":
        return "#ff4444";
      case "medium":
        return "#ffaa00";
      case "low":
        return "#00ffff";
      default:
        return "#999999";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

          .mempool-monitor {
            font-family: 'JetBrains Mono', 'Space Mono', monospace;
          }

          .pulse-dot {
            animation: pulse-glow 2s ease-in-out infinite alternate;
          }

          @keyframes pulse-glow {
            from {
              box-shadow: 0 0 5px currentColor;
              opacity: 0.8;
            }
            to {
              box-shadow: 0 0 20px currentColor;
              opacity: 1;
            }
          }

          .data-scroll::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .data-scroll::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
          }
          .data-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #00ff88, #00ffff);
            border-radius: 4px;
          }

          @keyframes threat-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }

          .threat-alert {
            animation: threat-pulse 2s ease-in-out infinite;
          }
        `}
      </style>

      <motion.div
        className="mempool-monitor"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        style={{
          minHeight: "100vh",
          backgroundColor: "#000000",
          color: "#e5e5e5",
          padding: "24px",
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(0, 255, 136, 0.03) 0%, transparent 50%)
          `,
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: "32px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <motion.div
                animate={{
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                className="p-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600"
                style={{
                  boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
                }}
              >
                <Monitor size={24} />
              </motion.div>
              <div>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#00ffff",
                    margin: "0",
                    letterSpacing: "2px",
                    textShadow: "0 0 20px rgba(0, 255, 255, 0.6)",
                  }}
                >
                  MEMPOOL MONITORING SYSTEM
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#999999",
                    margin: "0",
                    letterSpacing: "1px",
                  }}
                >
                  Real-time Transaction Monitoring & Threat Detection
                </p>
              </div>
            </div>

            {/* Live Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <motion.div
                className="pulse-dot"
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: isMonitoring ? "#00ffff" : "#666666",
                  color: isMonitoring ? "#00ffff" : "#666666",
                }}
              />
              <Switch
                checked={isMonitoring}
                onCheckedChange={setIsMonitoring}
                style={{ accentColor: "#00ffff" }}
              />
              <Label style={{ color: "#cccccc", fontWeight: "500" }}>
                {isMonitoring ? "LIVE" : "PAUSED"}
              </Label>
            </div>
          </div>
        </motion.div>

        {/* Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              label: "Pending Txs",
              value: mempoolStats.pendingTxs,
              icon: Activity,
              color: "#00ffff",
            },
            {
              label: "Avg Gas Price",
              value: mempoolStats.avgGasPrice,
              icon: Zap,
              color: "#ffaa00",
              suffix: " gwei",
            },
            {
              label: "Tracked Contracts",
              value: mempoolStats.trackedContracts,
              icon: Target,
              color: "#00ff88",
            },
            {
              label: "Threats Detected",
              value: mempoolStats.threatsDetected,
              icon: Shield,
              color: "#ff4444",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${stat.color}30`,
                borderRadius: "16px",
                padding: "20px",
                boxShadow: `0 0 20px ${stat.color}20`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  background: `linear-gradient(135deg, ${stat.color}05, transparent)`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: `${stat.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${stat.color}60`,
                  }}
                >
                  <stat.icon size={18} color={stat.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: stat.color,
                      lineHeight: 1,
                    }}
                  >
                    <LiveCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      decimals={stat.suffix ? 1 : 0}
                      duration={2000}
                    />
                  </motion.div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999999",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginTop: "4px",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Contract Tracking Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
            boxShadow: "0 0 20px rgba(0, 255, 136, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#00ff88",
              margin: "0 0 20px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Target size={20} />
            Contract Tracking
          </h2>

          {/* Add Contract Form */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Enter contract address (0x...)"
              value={newContractAddress}
              onChange={(e) => setNewContractAddress(e.target.value)}
              style={{
                flex: 1,
                minWidth: "300px",
                padding: "12px 16px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                border: "1px solid rgba(0, 255, 136, 0.3)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                fontFamily: "monospace",
                outline: "none",
              }}
              onKeyPress={(e) => e.key === "Enter" && addContractToTrack()}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addContractToTrack}
              style={{
                padding: "12px 24px",
                backgroundColor: "rgba(0, 255, 136, 0.2)",
                border: "1px solid rgba(0, 255, 136, 0.5)",
                borderRadius: "8px",
                color: "#00ff88",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={16} />
              Track Contract
            </motion.button>
          </div>

          {/* Tracked Contracts List */}
          {trackedContracts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "16px",
              }}
            >
              {trackedContracts.map((contract, index) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(0, 255, 136, 0.3)",
                    borderRadius: "12px",
                    padding: "16px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "start",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#ffffff",
                          fontWeight: "600",
                          marginBottom: "4px",
                          fontFamily: "monospace",
                        }}
                      >
                        {contract.name || formatAddress(contract.address)}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999999",
                          fontFamily: "monospace",
                          marginBottom: "8px",
                        }}
                      >
                        {contract.address}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#00ffff" }}>
                          Txs: {contract.transactionCount}
                        </span>
                        <span style={{ color: "#ffaa00" }}>
                          Last: {formatTime(contract.lastActivity)}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, color: "#ff4444" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeTrackedContract(contract.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#999999",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      <X size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#666666",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              No contracts being tracked. Add contract addresses above to
              monitor their transactions and detect threats.
            </div>
          )}
        </motion.div>

        {/* Threat Detection Panel */}
        {threatDetections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 68, 68, 0.3)",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "32px",
              boxShadow: "0 0 20px rgba(255, 68, 68, 0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#ff4444",
                margin: "0 0 20px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle size={20} />
              Threat Detection ({threatDetections.length})
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {threatDetections.slice(0, 5).map((threat, index) => (
                <motion.div
                  key={threat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className={
                    threat.severity === "critical" ? "threat-alert" : ""
                  }
                  style={{
                    padding: "16px",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    borderRadius: "12px",
                    border: `1px solid ${getThreatColor(threat.severity)}30`,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: getThreatColor(threat.severity),
                      boxShadow: `0 0 10px ${getThreatColor(threat.severity)}`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: "600",
                          backgroundColor: `${getThreatColor(threat.severity)}20`,
                          color: getThreatColor(threat.severity),
                          textTransform: "uppercase",
                        }}
                      >
                        {threat.severity}
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#ffffff",
                          fontWeight: "600",
                        }}
                      >
                        {threat.threatType.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#cccccc",
                        marginBottom: "4px",
                      }}
                    >
                      {threat.description}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "12px",
                        color: "#999999",
                      }}
                    >
                      <span>
                        Contract: {formatAddress(threat.contractAddress)}
                      </span>
                      <span>Confidence: {threat.confidence}%</span>
                      <span>{formatTime(threat.timestamp)}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(0, 255, 255, 0.2)",
                      border: "1px solid rgba(0, 255, 255, 0.4)",
                      color: "#00ffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ExternalLink size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transaction Monitoring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0, 255, 255, 0.3)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#00ffff",
                margin: "0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Database size={20} />
              Live Transaction Feed
            </h2>

            {/* Filters */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.showTrackedOnly}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      showTrackedOnly: e.target.checked,
                    })
                  }
                  style={{ accentColor: "#00ffff" }}
                />
                Tracked Only
              </label>
              <input
                type="text"
                placeholder="Filter by method..."
                value={filters.method}
                onChange={(e) =>
                  setFilters({ ...filters, method: e.target.value })
                }
                style={{
                  padding: "6px 12px",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "12px",
                  width: "120px",
                }}
              />
            </div>
          </div>

          {/* Transaction Table */}
          <div style={{ overflowX: "auto" }} className="data-scroll">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: "1px solid rgba(0, 255, 255, 0.3)" }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Hash
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Method
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    From/To
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Value (ETH)
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Gas Price
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Priority
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 20).map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    whileHover={{ backgroundColor: "rgba(0, 255, 255, 0.05)" }}
                    style={{
                      borderBottom: "1px solid rgba(0, 255, 255, 0.1)",
                      backgroundColor: tx.isTracked
                        ? "rgba(0, 255, 136, 0.05)"
                        : "transparent",
                    }}
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td style={{ padding: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {tx.isTracked && (
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: "#00ff88",
                              boxShadow: "0 0 8px #00ff88",
                            }}
                          />
                        )}
                        <span
                          style={{
                            color: "#ffffff",
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        >
                          {formatAddress(tx.hash)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "600",
                          backgroundColor: "rgba(0, 255, 255, 0.2)",
                          color: "#00ffff",
                          textTransform: "uppercase",
                        }}
                      >
                        {tx.method}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: "11px" }}>
                      <div
                        style={{ color: "#cccccc", fontFamily: "monospace" }}
                      >
                        <div>{formatAddress(tx.from)}</div>
                        <div style={{ color: "#999999" }}>
                          → {formatAddress(tx.to)}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: "#00ff88",
                        fontWeight: "600",
                        fontFamily: "monospace",
                      }}
                    >
                      {tx.value}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: "#ffaa00",
                        fontFamily: "monospace",
                      }}
                    >
                      {tx.gasPrice}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: getPriorityColor(tx.priority),
                          margin: "0 auto",
                          boxShadow: `0 0 8px ${getPriorityColor(tx.priority)}`,
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: "#999999",
                        fontSize: "11px",
                      }}
                    >
                      {formatTime(tx.timestamp)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#666666",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              No transactions match your current filters.
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
};

export default MempoolMonitor;

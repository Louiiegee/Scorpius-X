import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Settings,
  Zap,
  Target,
  Clock,
  Eye,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Circle,
  Wifi,
  WifiOff,
  Network,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";

interface DeployedBot {
  id: string;
  name: string;
  strategy: string;
  status: "active" | "idle" | "processing" | "error";
  position: { x: number; y: number };
  profit: number;
  trades: number;
  gasUsed: number;
  color: string;
}

interface SimulatedTransaction {
  id: string;
  fromBot: string;
  toBot?: string;
  type: "frontrun" | "backrun" | "arbitrage" | "liquidation" | "jit" | "oracle";
  amount: number;
  gas: number;
  success: boolean;
  timestamp: Date;
  path: { x: number; y: number }[];
}

const MEVOperations = () => {
  const navigate = useNavigate();

  // Deployed bots state
  const [deployedBots, setDeployedBots] = useState<DeployedBot[]>([
    {
      id: "bot1",
      name: "ARB-Alpha",
      strategy: "arbitrage",
      status: "active",
      position: { x: 15, y: 20 },
      profit: 12.7,
      trades: 156,
      gasUsed: 2.1,
      color: "#00ff88",
    },
    {
      id: "bot2",
      name: "SW-Delta",
      strategy: "sandwich",
      status: "processing",
      position: { x: 35, y: 60 },
      profit: 8.4,
      trades: 89,
      gasUsed: 3.8,
      color: "#ff4444",
    },
    {
      id: "bot3",
      name: "LIQ-Beta",
      strategy: "liquidation",
      status: "active",
      position: { x: 65, y: 30 },
      profit: 15.2,
      trades: 34,
      gasUsed: 1.9,
      color: "#00ffff",
    },
    {
      id: "bot4",
      name: "FL-Gamma",
      strategy: "flashloan",
      status: "idle",
      position: { x: 80, y: 70 },
      profit: 22.1,
      trades: 67,
      gasUsed: 4.2,
      color: "#ffaa00",
    },
    {
      id: "bot5",
      name: "JIT-Theta",
      strategy: "jit",
      status: "active",
      position: { x: 25, y: 80 },
      profit: 18.6,
      trades: 112,
      gasUsed: 2.8,
      color: "#ff88ff",
    },
    {
      id: "bot6",
      name: "ORC-Sigma",
      strategy: "oracle",
      status: "processing",
      position: { x: 70, y: 15 },
      profit: 9.3,
      trades: 43,
      gasUsed: 1.5,
      color: "#88ff88",
    },
  ]);

  // Simulated transactions state
  const [transactions, setTransactions] = useState<SimulatedTransaction[]>([]);

  const [strategies, setStrategies] = useState([
    {
      id: "arbitrage",
      name: "Cross-DEX Arbitrage",
      description: "Exploit price differences between DEXs",
      profit24h: 12.7,
      trades24h: 156,
      successRate: 94.2,
      gasUsed: 2.1,
      status: "active",
      riskLevel: "Medium",
    },
    {
      id: "sandwich",
      name: "Sandwich Attack",
      description: "Front/back-run large transactions",
      profit24h: 8.4,
      trades24h: 89,
      successRate: 87.6,
      gasUsed: 3.8,
      status: "paused",
      riskLevel: "High",
    },
    {
      id: "liquidation",
      name: "Liquidation Bot",
      description: "Monitor and execute liquidations",
      profit24h: 15.2,
      trades24h: 34,
      successRate: 98.1,
      gasUsed: 1.9,
      status: "active",
      riskLevel: "Low",
    },
    {
      id: "flashloan",
      name: "Flash Loan Arbitrage",
      description: "Zero-capital arbitrage opportunities",
      profit24h: 22.1,
      trades24h: 67,
      successRate: 91.3,
      gasUsed: 4.2,
      status: "active",
      riskLevel: "High",
    },
    {
      id: "jit",
      name: "Just-In-Time (JIT) Liquidity",
      description: "Provide liquidity right before large swaps",
      profit24h: 18.6,
      trades24h: 112,
      successRate: 89.7,
      gasUsed: 2.8,
      status: "active",
      riskLevel: "Medium",
    },
    {
      id: "oracle",
      name: "Oracle MEV",
      description: "Extract value from oracle price updates",
      profit24h: 9.3,
      trades24h: 43,
      successRate: 92.4,
      gasUsed: 1.5,
      status: "active",
      riskLevel: "Low",
    },
  ]);

  const [activeStrategies, setActiveStrategies] = useState<Set<string>>(
    new Set(["arbitrage", "liquidation", "flashloan", "jit", "oracle"]),
  );
  const [mevStats, setMevStats] = useState({
    totalProfit: 86.3,
    totalTrades: 501,
    avgSuccessRate: 92.8,
    gasEfficiency: 2.5,
  });
  const [recentTrades, setRecentTrades] = useState([
    {
      id: 1,
      strategy: "arbitrage",
      token: "WETH/USDC",
      profit: 2.34,
      gas: 0.012,
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      success: true,
    },
    {
      id: 2,
      strategy: "liquidation",
      token: "AAVE/ETH",
      profit: 5.67,
      gas: 0.008,
      timestamp: new Date(Date.now() - 1000 * 60 * 12),
      success: true,
    },
    {
      id: 3,
      strategy: "flashloan",
      token: "UNI/WETH",
      profit: 1.89,
      gas: 0.021,
      timestamp: new Date(Date.now() - 1000 * 60 * 18),
      success: false,
    },
    {
      id: 4,
      strategy: "jit",
      token: "CRV/WETH",
      profit: 3.12,
      gas: 0.015,
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      success: true,
    },
    {
      id: 5,
      strategy: "oracle",
      token: "LINK/USD",
      profit: 1.45,
      gas: 0.009,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      success: true,
    },
  ]);
  const [isLive, setIsLive] = useState(true);
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: "success" | "error" | "info" }[]
  >([]);

  // Generate simulated transactions
  const generateTransaction = useCallback(() => {
    const activeBots = deployedBots.filter(
      (bot) => bot.status === "active" || bot.status === "processing",
    );
    if (activeBots.length === 0) return;

    const fromBot = activeBots[Math.floor(Math.random() * activeBots.length)];
    const types: SimulatedTransaction["type"][] = [
      "frontrun",
      "backrun",
      "arbitrage",
      "liquidation",
      "jit",
      "oracle",
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    // Sometimes add a target bot for arbitrage transactions
    const toBot =
      Math.random() > 0.7
        ? activeBots[Math.floor(Math.random() * activeBots.length)]
        : undefined;

    const transaction: SimulatedTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromBot: fromBot.id,
      toBot: toBot?.id,
      type,
      amount: Math.random() * 10,
      gas: Math.random() * 0.05,
      success: Math.random() > 0.1,
      timestamp: new Date(),
      path: toBot ? [fromBot.position, toBot.position] : [fromBot.position],
    };

    setTransactions((prev) => [...prev.slice(-20), transaction]);
  }, [deployedBots]);

  // Update bot statuses
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setDeployedBots((prev) =>
        prev.map((bot) => {
          const shouldUpdate = Math.random() > 0.7;
          if (!shouldUpdate) return bot;

          const statuses: DeployedBot["status"][] = [
            "active",
            "idle",
            "processing",
          ];
          const newStatus =
            statuses[Math.floor(Math.random() * statuses.length)];

          return {
            ...bot,
            status: newStatus,
            profit: bot.profit + Math.random() * 2,
            trades: bot.trades + Math.floor(Math.random() * 3),
          };
        }),
      );

      // Generate transactions
      if (Math.random() > 0.4) {
        generateTransaction();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, generateTransaction]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMevStats((prev) => ({
        ...prev,
        totalProfit: prev.totalProfit + Math.random() * 2,
        totalTrades: prev.totalTrades + Math.floor(Math.random() * 3),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const toggleStrategy = (strategyId: string) => {
    setActiveStrategies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(strategyId)) {
        newSet.delete(strategyId);
      } else {
        newSet.add(strategyId);
      }
      return newSet;
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Low":
        return "#00ff88";
      case "Medium":
        return "#ffaa00";
      case "High":
        return "#ff4444";
      default:
        return "#999999";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#00ff88";
      case "processing":
        return "#ffaa00";
      case "idle":
        return "#00ffff";
      case "paused":
        return "#999999";
      case "stopped":
        return "#ff4444";
      case "error":
        return "#ff4444";
      default:
        return "#999999";
    }
  };

  const getBotStatusIcon = (status: DeployedBot["status"]) => {
    switch (status) {
      case "active":
        return <Wifi size={12} />;
      case "processing":
        return <Loader2 size={12} className="animate-spin" />;
      case "idle":
        return <Circle size={12} />;
      case "error":
        return <WifiOff size={12} />;
      default:
        return <Circle size={12} />;
    }
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

          .mev-operations {
            font-family: 'JetBrains Mono', 'Space Mono', monospace;
          }

          .neon-glow {
            text-shadow: 0 0 10px currentColor;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
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

          @keyframes transaction-flow {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.5); }
          }

          .transaction-path {
            animation: transaction-flow 3s ease-in-out;
          }

          @keyframes bot-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          .bot-active {
            animation: bot-pulse 2s ease-in-out infinite;
          }
        `}
      </style>

      <motion.div
        className="mev-operations"
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
            radial-gradient(circle at 30% 30%, rgba(0, 255, 136, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(255, 170, 0, 0.03) 0%, transparent 50%)
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
                className="p-3 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600"
                style={{
                  boxShadow: "0 0 30px rgba(255, 170, 0, 0.5)",
                }}
              >
                <Bot size={24} />
              </motion.div>
              <div>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#ffaa00",
                    margin: "0",
                    letterSpacing: "2px",
                    textShadow: "0 0 20px rgba(255, 170, 0, 0.6)",
                  }}
                >
                  MEVBOT OPERATIONS
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#999999",
                    margin: "0",
                    letterSpacing: "1px",
                  }}
                >
                  MEV Strategy Management & Execution Engine
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
                  backgroundColor: isLive ? "#ffaa00" : "#666666",
                  color: isLive ? "#ffaa00" : "#666666",
                }}
              />
              <Switch
                checked={isLive}
                onCheckedChange={setIsLive}
                style={{ accentColor: "#ffaa00" }}
              />
              <Label
                style={{
                  color: "#cccccc",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {isLive ? "LIVE" : "PAUSED"}
              </Label>
            </div>
          </div>
        </motion.div>

        {/* Bot Visualization Chart */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 170, 0, 0.3)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
            boxShadow: "0 0 20px rgba(255, 170, 0, 0.1)",
            position: "relative",
            height: "400px",
            overflow: "hidden",
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
                color: "#ffaa00",
                margin: "0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Network size={20} />
              Deployed Bot Network
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "14px",
                color: "#cccccc",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#00ff88",
                  }}
                />
                Active (
                {deployedBots.filter((b) => b.status === "active").length})
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#ffaa00",
                  }}
                />
                Processing (
                {deployedBots.filter((b) => b.status === "processing").length})
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#00ffff",
                  }}
                />
                Idle ({deployedBots.filter((b) => b.status === "idle").length})
              </span>
            </div>
          </div>

          {/* Network Grid Background */}
          <div
            style={{
              position: "absolute",
              top: "60px",
              left: "24px",
              right: "24px",
              bottom: "24px",
              backgroundImage: `
                linear-gradient(rgba(0, 255, 170, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 170, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              opacity: 0.3,
            }}
          />

          {/* Deployed Bots */}
          <div
            style={{
              position: "relative",
              height: "300px",
              width: "100%",
            }}
          >
            {deployedBots.map((bot) => (
              <motion.div
                key={bot.id}
                className={bot.status === "active" ? "bot-active" : ""}
                style={{
                  position: "absolute",
                  left: `${bot.position.x}%`,
                  top: `${bot.position.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: "60px",
                  height: "60px",
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: `2px solid ${getStatusColor(bot.status)}`,
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: `0 0 20px ${getStatusColor(bot.status)}30`,
                  backdropFilter: "blur(10px)",
                }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                animate={{
                  boxShadow: `0 0 ${bot.status === "active" ? "30px" : "15px"} ${getStatusColor(bot.status)}30`,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "2px",
                  }}
                >
                  <Bot size={16} color={getStatusColor(bot.status)} />
                  {getBotStatusIcon(bot.status)}
                </div>
                <div
                  style={{
                    fontSize: "8px",
                    color: "#ffffff",
                    fontWeight: "600",
                    textAlign: "center",
                    lineHeight: "1",
                  }}
                >
                  {bot.name}
                </div>
                <div
                  style={{
                    fontSize: "6px",
                    color: getStatusColor(bot.status),
                    textTransform: "uppercase",
                    marginTop: "1px",
                  }}
                >
                  {bot.status}
                </div>

                {/* Bot hover info */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  style={{
                    position: "absolute",
                    top: "70px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px",
                    minWidth: "120px",
                    zIndex: 20,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#ffffff",
                      marginBottom: "4px",
                      fontWeight: "600",
                    }}
                  >
                    {bot.strategy.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "9px", color: "#00ff88" }}>
                    Profit: ${bot.profit.toFixed(2)} ETH
                  </div>
                  <div style={{ fontSize: "9px", color: "#00ffff" }}>
                    Trades: {bot.trades}
                  </div>
                  <div style={{ fontSize: "9px", color: "#ffaa00" }}>
                    Gas: {bot.gasUsed.toFixed(2)} ETH
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {/* Transaction Flow Lines */}
            <AnimatePresence>
              {transactions.slice(-5).map((tx) => {
                const fromBot = deployedBots.find((b) => b.id === tx.fromBot);
                const toBot = tx.toBot
                  ? deployedBots.find((b) => b.id === tx.toBot)
                  : null;

                if (!fromBot) return null;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3 }}
                    style={{
                      position: "absolute",
                      pointerEvents: "none",
                    }}
                  >
                    {toBot ? (
                      // Line between bots
                      <svg
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: "none",
                        }}
                      >
                        <motion.line
                          x1={`${fromBot.position.x}%`}
                          y1={`${fromBot.position.y}%`}
                          x2={`${toBot.position.x}%`}
                          y2={`${toBot.position.y}%`}
                          stroke={tx.success ? "#00ff88" : "#ff4444"}
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          opacity={0.7}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: [0, 1, 0] }}
                          transition={{ duration: 2 }}
                        />
                      </svg>
                    ) : (
                      // Pulse from single bot
                      <motion.div
                        style={{
                          position: "absolute",
                          left: `${fromBot.position.x}%`,
                          top: `${fromBot.position.y}%`,
                          transform: "translate(-50%, -50%)",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: tx.success ? "#00ff88" : "#ff4444",
                          opacity: 0.6,
                        }}
                        animate={{ scale: [0, 3, 0], opacity: [0.6, 0, 0] }}
                        transition={{ duration: 2 }}
                      />
                    )}

                    {/* Transaction details */}
                    <motion.div
                      style={{
                        position: "absolute",
                        left: toBot
                          ? `${(fromBot.position.x + toBot.position.x) / 2}%`
                          : `${fromBot.position.x + 5}%`,
                        top: toBot
                          ? `${(fromBot.position.y + toBot.position.y) / 2}%`
                          : `${fromBot.position.y - 5}%`,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "6px",
                        padding: "4px 6px",
                        fontSize: "8px",
                        color: "#ffffff",
                        whiteSpace: "nowrap",
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1, 1, 0] }}
                      transition={{ duration: 3, times: [0, 0.2, 0.8, 1] }}
                    >
                      <div
                        style={{
                          color: tx.success ? "#00ff88" : "#ff4444",
                          fontWeight: "600",
                        }}
                      >
                        {tx.type.toUpperCase()}
                      </div>
                      <div>${tx.amount.toFixed(2)} ETH</div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Live Statistics */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              display: "flex",
              gap: "16px",
              fontSize: "12px",
            }}
          >
            <div style={{ color: "#00ff88" }}>
              Active Transactions:{" "}
              {
                transactions.filter(
                  (tx) => Date.now() - tx.timestamp.getTime() < 5000,
                ).length
              }
            </div>
            <div style={{ color: "#ffaa00" }}>
              Success Rate:{" "}
              {(
                (transactions.filter((tx) => tx.success).length /
                  Math.max(transactions.length, 1)) *
                100
              ).toFixed(1)}
              %
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
              label: "Total Profit",
              value: `$${mevStats.totalProfit.toFixed(2)}`,
              icon: DollarSign,
              color: "#00ff88",
              suffix: "ETH",
            },
            {
              label: "Total Trades",
              value: mevStats.totalTrades,
              icon: Activity,
              color: "#00ffff",
            },
            {
              label: "Success Rate",
              value: mevStats.avgSuccessRate,
              icon: TrendingUp,
              color: "#ffaa00",
              suffix: "%",
            },
            {
              label: "Gas Efficiency",
              value: mevStats.gasEfficiency,
              icon: Zap,
              color: "#ff6666",
              suffix: "ETH",
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
                      value={
                        typeof stat.value === "string"
                          ? parseFloat(stat.value.replace("$", ""))
                          : stat.value
                      }
                      prefix={
                        typeof stat.value === "string" &&
                        stat.value.startsWith("$")
                          ? "$"
                          : ""
                      }
                      suffix={stat.suffix}
                      decimals={
                        stat.suffix === "%" || stat.suffix === "ETH" ? 1 : 0
                      }
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

        {/* Strategy Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 170, 0, 0.3)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
            boxShadow: "0 0 20px rgba(255, 170, 0, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#ffaa00",
              margin: "0 0 20px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Settings size={20} />
            Strategy Management
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {strategies.map((strategy, index) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -5 }}
                style={{
                  backgroundColor: activeStrategies.has(strategy.id)
                    ? "rgba(255, 170, 0, 0.1)"
                    : "rgba(0, 0, 0, 0.4)",
                  border: `1px solid ${
                    activeStrategies.has(strategy.id)
                      ? "rgba(255, 170, 0, 0.5)"
                      : "rgba(255, 255, 255, 0.1)"
                  }`,
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
                onClick={() => toggleStrategy(strategy.id)}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    background: activeStrategies.has(strategy.id)
                      ? "linear-gradient(135deg, rgba(255, 170, 0, 0.05), transparent)"
                      : "transparent",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "start",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    position: "relative",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "16px",
                        color: "#ffffff",
                        margin: "0 0 4px 0",
                        fontWeight: "600",
                      }}
                    >
                      {strategy.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        margin: "0",
                        lineHeight: "1.4",
                      }}
                    >
                      {strategy.description}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: "600",
                        backgroundColor: `${getRiskColor(strategy.riskLevel)}20`,
                        color: getRiskColor(strategy.riskLevel),
                        border: `1px solid ${getRiskColor(strategy.riskLevel)}40`,
                      }}
                    >
                      {strategy.riskLevel} Risk
                    </span>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: getStatusColor(strategy.status),
                        boxShadow: `0 0 10px ${getStatusColor(strategy.status)}`,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                    marginBottom: "16px",
                    position: "relative",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#00ff88",
                        lineHeight: 1,
                      }}
                    >
                      ${strategy.profit24h.toFixed(1)}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#999999",
                        textTransform: "uppercase",
                      }}
                    >
                      24h Profit (ETH)
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#00ffff",
                        lineHeight: 1,
                      }}
                    >
                      {strategy.trades24h}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#999999",
                        textTransform: "uppercase",
                      }}
                    >
                      24h Trades
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    position: "relative",
                  }}
                >
                  <span style={{ color: "#999999" }}>
                    Success Rate:{" "}
                    <span style={{ color: "#ffaa00", fontWeight: "600" }}>
                      {strategy.successRate}%
                    </span>
                  </span>
                  <span style={{ color: "#999999" }}>
                    Gas:{" "}
                    <span style={{ color: "#ff6666", fontWeight: "600" }}>
                      {strategy.gasUsed} ETH
                    </span>
                  </span>
                </div>

                {/* Active indicator */}
                {activeStrategies.has(strategy.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#00ff88",
                      boxShadow: "0 0 10px #00ff88",
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0, 255, 255, 0.3)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#00ffff",
              margin: "0 0 20px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Clock size={20} />
            Recent Trades
          </h2>

          <div style={{ overflowX: "auto" }} className="data-scroll">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(0, 255, 255, 0.3)",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Strategy
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Token Pair
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Profit
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Gas Used
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#00ffff",
                      fontWeight: "600",
                    }}
                  >
                    Status
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
                {recentTrades.map((trade, index) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    whileHover={{ backgroundColor: "rgba(0, 255, 255, 0.05)" }}
                    style={{
                      borderBottom: "1px solid rgba(0, 255, 255, 0.1)",
                    }}
                  >
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: "rgba(255, 170, 0, 0.2)",
                          color: "#ffaa00",
                          textTransform: "uppercase",
                        }}
                      >
                        {trade.strategy}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        color: "#ffffff",
                        fontFamily: "monospace",
                      }}
                    >
                      {trade.token}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: trade.profit > 0 ? "#00ff88" : "#ff4444",
                        fontWeight: "600",
                      }}
                    >
                      {trade.profit > 0 ? "+" : ""}${trade.profit.toFixed(3)}{" "}
                      ETH
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: "#ff6666",
                      }}
                    >
                      {trade.gas.toFixed(4)} ETH
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {trade.success ? (
                        <CheckCircle size={16} color="#00ff88" />
                      ) : (
                        <XCircle size={16} color="#ff4444" />
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: "#999999",
                        fontSize: "12px",
                      }}
                    >
                      {Math.floor(
                        (Date.now() - trade.timestamp.getTime()) / 60000,
                      )}
                      m ago
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default MEVOperations;

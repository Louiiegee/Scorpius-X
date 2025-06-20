import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Clock,
  Calendar,
  Search,
  Download,
  Play,
  Pause,
  FastForward,
  Rewind,
  SkipBack,
  SkipForward,
  Activity,
  BarChart3,
  TrendingUp,
  Eye,
  Filter,
  RefreshCw,
  Database,
  History,
  Zap,
  Target,
  Settings,
  Terminal,
  AlertTriangle,
  Shield,
  Hash,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LiveCounter } from "@/components/ui/live-counter";
import { SkeletonTable, SkeletonCard } from "@/components/ui/skeleton";
import { ScrollReveal, StaggeredReveal } from "@/components/ui/scroll-reveal";
import { useToastActions } from "@/components/ui/enhanced-toast";

interface AttackStep {
  id: string;
  timestamp: Date;
  step: number;
  action: string;
  command: string;
  output: string;
  status: "success" | "warning" | "error" | "info";
  transactionHash?: string;
  gasUsed?: number;
  blockNumber?: number;
}

interface AttackVisualization {
  id: string;
  name: string;
  type: "reentrancy" | "flash_loan" | "sandwich" | "front_run" | "governance";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  steps: AttackStep[];
  totalValue: number;
  isPlaying: boolean;
  currentStep: number;
}

const TimeMachine = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date());
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filters, setFilters] = useState({
    eventType: "",
    severity: "",
    contract: "",
    minValue: "",
  });
  const [stats, setStats] = useState({
    totalEvents: 94750,
    criticalIncidents: 147,
    blocksAnalyzed: 2847950,
    timeSpanDays: 365,
  });

  // Attack visualization state
  const [selectedAttack, setSelectedAttack] =
    useState<AttackVisualization | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [isTerminalPlaying, setIsTerminalPlaying] = useState(false);

  const toast = useToastActions();

  // Motion values for time control
  const progressValue = useMotionValue(0);
  const springProgress = useSpring(progressValue, {
    stiffness: 100,
    damping: 30,
  });

  // Mock attack visualizations
  const mockAttacks: AttackVisualization[] = [
    {
      id: "attack_1",
      name: "Flash Loan Reentrancy Attack",
      type: "reentrancy",
      severity: "critical",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      totalValue: 47.5,
      isPlaying: false,
      currentStep: 0,
      steps: [
        {
          id: "step_1",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          step: 1,
          action: "Initialize Flash Loan",
          command: "flashLoan.borrow(USDC, 1000000)",
          output: "✓ Borrowed 1,000,000 USDC from Aave",
          status: "success",
          transactionHash: "0x1a2b3c4d5e6f...",
          gasUsed: 150000,
          blockNumber: 18945672,
        },
        {
          id: "step_2",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 12000),
          step: 2,
          action: "Call Vulnerable Contract",
          command: "vulnerableContract.deposit(1000000)",
          output: "⚠ Deposit successful, balance updated",
          status: "warning",
          transactionHash: "0x2b3c4d5e6f7a...",
          gasUsed: 200000,
          blockNumber: 18945672,
        },
        {
          id: "step_3",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 24000),
          step: 3,
          action: "Trigger Reentrancy",
          command: "vulnerableContract.withdraw(1000000)",
          output:
            "🚨 Reentrancy detected! State not updated before external call",
          status: "error",
          transactionHash: "0x3c4d5e6f7a8b...",
          gasUsed: 350000,
          blockNumber: 18945672,
        },
        {
          id: "step_4",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 36000),
          step: 4,
          action: "Drain Contract",
          command: "recursiveWithdraw() x 15",
          output: "💰 Drained 15,000,000 USDC from contract",
          status: "error",
          transactionHash: "0x4d5e6f7a8b9c...",
          gasUsed: 850000,
          blockNumber: 18945672,
        },
        {
          id: "step_5",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 48000),
          step: 5,
          action: "Repay Flash Loan",
          command: "flashLoan.repay(1000000 + fee)",
          output: "✓ Flash loan repaid successfully",
          status: "success",
          transactionHash: "0x5e6f7a8b9c0d...",
          gasUsed: 120000,
          blockNumber: 18945672,
        },
        {
          id: "step_6",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 60000),
          step: 6,
          action: "Transfer Profits",
          command: "transfer(attackerWallet, 14000000)",
          output: "💸 Net profit: 14,000,000 USDC transferred",
          status: "success",
          transactionHash: "0x6f7a8b9c0d1e...",
          gasUsed: 45000,
          blockNumber: 18945672,
        },
      ],
    },
    {
      id: "attack_2",
      name: "Sandwich Attack on DEX",
      type: "sandwich",
      severity: "high",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      totalValue: 12.3,
      isPlaying: false,
      currentStep: 0,
      steps: [
        {
          id: "step_1",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
          step: 1,
          action: "Detect Large Trade",
          command: "mempool.monitor(minValue: 100000)",
          output: "🎯 Large trade detected: 500 ETH → USDC",
          status: "info",
          transactionHash: "0xa1b2c3d4e5f6...",
          gasUsed: 25000,
          blockNumber: 18945450,
        },
        {
          id: "step_2",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6 + 3000),
          step: 2,
          action: "Front-run Trade",
          command: "dex.swap(ETH, USDC, amount: 100, gasPrice: +50%)",
          output: "⚡ Front-run successful, price moved +2.3%",
          status: "warning",
          transactionHash: "0xb2c3d4e5f6a7...",
          gasUsed: 180000,
          blockNumber: 18945450,
        },
        {
          id: "step_3",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6 + 15000),
          step: 3,
          action: "Victim Trade Executes",
          command: "victimTrade.execute()",
          output: "😞 Victim received poor price due to slippage",
          status: "error",
          transactionHash: "0xc3d4e5f6a7b8...",
          gasUsed: 250000,
          blockNumber: 18945451,
        },
        {
          id: "step_4",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6 + 18000),
          step: 4,
          action: "Back-run Trade",
          command: "dex.swap(USDC, ETH, amount: all, gasPrice: market)",
          output: "💰 Back-run profitable, extracted 12.3 ETH",
          status: "success",
          transactionHash: "0xd4e5f6a7b8c9...",
          gasUsed: 190000,
          blockNumber: 18945451,
        },
      ],
    },
  ];

  // Mock historical data
  const mockEvents = [
    {
      id: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: "vulnerability",
      severity: "critical",
      title: "Reentrancy Attack Detected",
      contract: "0x742d35Cc6431C8BF3240C39B6969E3C77e1345eF",
      value: 47.5,
      blockNumber: 18945672,
      txHash:
        "0x8a9b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234",
      impact: "High",
      description:
        "Critical reentrancy vulnerability exploited resulting in significant fund loss",
      attackId: "attack_1",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      type: "mev",
      severity: "high",
      title: "Sandwich Attack Sequence",
      contract: "0x9F8b2C4D5E6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C",
      value: 12.3,
      blockNumber: 18945450,
      txHash:
        "0x7c8b9a0d1e2f3456789012345678901234567890123456789012345678901234",
      impact: "Medium",
      description: "Sophisticated sandwich attack targeting large DEX trades",
      attackId: "attack_2",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
      type: "governance",
      severity: "medium",
      title: "Governance Vote Manipulation",
      contract: "0x1234567890ABCDEF1234567890ABCDEF12345678",
      value: 8.7,
      blockNumber: 18945200,
      txHash:
        "0x6b7a8c9d0e1f2345678901234567890123456789012345678901234567890123",
      impact: "Medium",
      description: "Flash loan used to manipulate governance voting outcome",
    },
  ];

  // Initialize with mock data
  useEffect(() => {
    setHistoricalData(mockEvents);
  }, []);

  // Play attack visualization
  const playAttackVisualization = (attack: AttackVisualization) => {
    setSelectedAttack(attack);
    setTerminalLines([]);
    setIsTerminalPlaying(true);

    let stepIndex = 0;
    const playStep = () => {
      if (stepIndex < attack.steps.length) {
        const step = attack.steps[stepIndex];

        // Add command to terminal
        setTerminalLines((prev) => [
          ...prev,
          `[${step.timestamp.toLocaleTimeString()}] $ ${step.command}`,
          `[Step ${step.step}] ${step.action}`,
          step.output,
          `Block: ${step.blockNumber} | Gas: ${step.gasUsed?.toLocaleString()} | Tx: ${step.transactionHash}`,
          "",
        ]);

        stepIndex++;
        setTimeout(playStep, 2000); // 2 second delay between steps
      } else {
        setIsTerminalPlaying(false);
        setTerminalLines((prev) => [
          ...prev,
          "=".repeat(80),
          `🏁 Attack visualization complete`,
          `💰 Total value extracted: ${attack.totalValue} ETH`,
          `⚠️ Severity: ${attack.severity.toUpperCase()}`,
          `🕒 Duration: ${Math.round((attack.steps[attack.steps.length - 1].timestamp.getTime() - attack.steps[0].timestamp.getTime()) / 1000)}s`,
          "=".repeat(80),
        ]);
      }
    };

    // Start with header
    setTerminalLines([
      "=".repeat(80),
      `🎬 ATTACK VISUALIZATION: ${attack.name}`,
      `🎯 Type: ${attack.type.toUpperCase()}`,
      `⚡ Severity: ${attack.severity.toUpperCase()}`,
      `🕒 Timestamp: ${attack.timestamp.toLocaleString()}`,
      "=".repeat(80),
      "",
    ]);

    setTimeout(playStep, 1000);
  };

  const getSeverityColor = (severity: string) => {
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

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "#00ff88";
      case "warning":
        return "#ffaa00";
      case "error":
        return "#ff4444";
      case "info":
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
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h ${diffMins}m ago`;
    return `${diffMins}m ago`;
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

          .time-machine {
            font-family: 'JetBrains Mono', 'Space Mono', monospace;
          }

          .glow-text {
            text-shadow: 0 0 10px currentColor;
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
            background: linear-gradient(45deg, #9966ff, #ff6699);
            border-radius: 4px;
          }

          .terminal {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 8px;
            font-family: 'JetBrains Mono', monospace;
            color: #c9d1d9;
            overflow: hidden;
          }

          .terminal-header {
            background: #161b22;
            border-bottom: 1px solid #30363d;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .terminal-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }

          .terminal-content {
            padding: 16px;
            height: 400px;
            overflow-y: auto;
            background: #0d1117;
          }

          .terminal-line {
            margin-bottom: 4px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-all;
          }

          .terminal-command {
            color: #58a6ff;
          }

          .terminal-output {
            color: #c9d1d9;
          }

          .terminal-cursor {
            animation: blink 1s infinite;
          }

          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }

          @keyframes attack-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 68, 68, 0.3); }
            50% { box-shadow: 0 0 40px rgba(255, 68, 68, 0.6); }
          }

          .attack-card {
            animation: attack-glow 3s ease-in-out infinite;
          }
        `}
      </style>

      <motion.div
        className="time-machine"
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
            radial-gradient(circle at 25% 25%, rgba(153, 102, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 102, 153, 0.03) 0%, transparent 50%)
          `,
        }}
      >
        {/* Header */}
        <ScrollReveal>
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <motion.div
                  animate={{
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600"
                  style={{
                    boxShadow: "0 0 30px rgba(153, 102, 255, 0.5)",
                  }}
                >
                  <History size={24} />
                </motion.div>
                <div>
                  <h1
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      color: "#e8e6e3",
                      margin: "0",
                      letterSpacing: "2px",
                      textShadow: "0 0 20px rgba(153, 102, 255, 0.6)",
                    }}
                  >
                    TIME MACHINE
                  </h1>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#999999",
                      margin: "0",
                      letterSpacing: "1px",
                    }}
                  >
                    Historical Analysis & Attack Visualization Engine
                  </p>
                </div>
              </div>

              {/* Current Time Display */}
              <div
                style={{
                  padding: "12px 20px",
                  backgroundColor: "rgba(153, 102, 255, 0.1)",
                  border: "1px solid rgba(153, 102, 255, 0.3)",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999999",
                    marginBottom: "4px",
                  }}
                >
                  Current Time
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#9966ff",
                    fontWeight: "600",
                    fontFamily: "monospace",
                  }}
                >
                  {currentTimestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats Dashboard */}
        <ScrollReveal delay={0.1}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {[
              {
                label: "Total Events",
                value: stats.totalEvents,
                icon: Activity,
                color: "#9966ff",
              },
              {
                label: "Critical Incidents",
                value: stats.criticalIncidents,
                icon: AlertTriangle,
                color: "#ff4444",
              },
              {
                label: "Blocks Analyzed",
                value: stats.blocksAnalyzed,
                icon: Database,
                color: "#00ffff",
              },
              {
                label: "Time Span",
                value: stats.timeSpanDays,
                icon: Clock,
                color: "#00ff88",
                suffix: " days",
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
          </div>
        </ScrollReveal>

        {/* Attack Visualizations */}
        <ScrollReveal delay={0.2}>
          <div
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
              <Terminal size={20} />
              Attack Visualizations
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              {mockAttacks.map((attack, index) => (
                <motion.div
                  key={attack.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  className={
                    attack.severity === "critical" ? "attack-card" : ""
                  }
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: `1px solid ${getSeverityColor(attack.severity)}30`,
                    borderRadius: "12px",
                    padding: "20px",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onClick={() => playAttackVisualization(attack)}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      background: `linear-gradient(135deg, ${getSeverityColor(attack.severity)}05, transparent)`,
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
                        {attack.name}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: "600",
                            backgroundColor: `${getSeverityColor(attack.severity)}20`,
                            color: getSeverityColor(attack.severity),
                            textTransform: "uppercase",
                          }}
                        >
                          {attack.severity}
                        </span>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: "600",
                            backgroundColor: "rgba(153, 102, 255, 0.2)",
                            color: "#9966ff",
                            textTransform: "uppercase",
                          }}
                        >
                          {attack.type.replace("_", " ")}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999999",
                        }}
                      >
                        {formatTime(attack.timestamp)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#ff4444",
                          marginBottom: "4px",
                        }}
                      >
                        {attack.totalValue} ETH
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999999",
                        }}
                      >
                        {attack.steps.length} steps
                      </div>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor: "rgba(255, 68, 68, 0.2)",
                      border: "1px solid rgba(255, 68, 68, 0.4)",
                      borderRadius: "8px",
                      color: "#ff4444",
                      fontSize: "12px",
                      fontWeight: "600",
                      position: "relative",
                    }}
                  >
                    <Play size={14} />
                    VISUALIZE ATTACK
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Terminal Visualization */}
            {selectedAttack && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: "24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      color: "#ffffff",
                      margin: "0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Terminal size={18} />
                    Attack Terminal: {selectedAttack.name}
                  </h3>
                  {isTerminalPlaying && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#00ff88",
                        fontSize: "14px",
                      }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(0, 255, 136, 0.3)",
                          borderTop: "2px solid #00ff88",
                          borderRadius: "50%",
                        }}
                      />
                      Playing...
                    </div>
                  )}
                </div>

                <div className="terminal">
                  <div className="terminal-header">
                    <div
                      className="terminal-dot"
                      style={{ backgroundColor: "#ff5f56" }}
                    />
                    <div
                      className="terminal-dot"
                      style={{ backgroundColor: "#ffbd2e" }}
                    />
                    <div
                      className="terminal-dot"
                      style={{ backgroundColor: "#27ca3f" }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#c9d1d9",
                        marginLeft: "8px",
                      }}
                    >
                      attack_analyzer.sh - {selectedAttack.name}
                    </span>
                  </div>
                  <div className="terminal-content">
                    {terminalLines.map((line, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="terminal-line"
                        style={{
                          color: line.startsWith("$")
                            ? "#58a6ff"
                            : line.includes("✓")
                              ? "#56d364"
                              : line.includes("⚠")
                                ? "#f85149"
                                : line.includes("🚨")
                                  ? "#ff6b6b"
                                  : line.includes("💰") || line.includes("💸")
                                    ? "#f1c40f"
                                    : line.includes("🎯") || line.includes("⚡")
                                      ? "#58a6ff"
                                      : line.includes("=")
                                        ? "#9966ff"
                                        : "#c9d1d9",
                        }}
                      >
                        {line}
                      </motion.div>
                    ))}
                    {isTerminalPlaying && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ color: "#58a6ff" }}
                      >
                        █
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollReveal>

        {/* Historical Events */}
        <ScrollReveal delay={0.4}>
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(153, 102, 255, 0.3)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 0 20px rgba(153, 102, 255, 0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#9966ff",
                margin: "0 0 20px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Database size={20} />
              Historical Security Events
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {historicalData.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    padding: "20px",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    borderRadius: "12px",
                    border: `1px solid ${getSeverityColor(event.severity)}30`,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onClick={() => {
                    if (event.attackId) {
                      const attack = mockAttacks.find(
                        (a) => a.id === event.attackId,
                      );
                      if (attack) playAttackVisualization(attack);
                    }
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "0",
                      bottom: "0",
                      width: "4px",
                      backgroundColor: getSeverityColor(event.severity),
                    }}
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "16px",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: `${getSeverityColor(event.severity)}20`,
                            color: getSeverityColor(event.severity),
                            border: `1px solid ${getSeverityColor(event.severity)}40`,
                          }}
                        >
                          {event.severity}
                        </span>
                        <h3
                          style={{
                            fontSize: "16px",
                            color: "#ffffff",
                            margin: "0",
                            fontWeight: "600",
                          }}
                        >
                          {event.title}
                        </h3>
                        {event.attackId && (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "600",
                              backgroundColor: "rgba(0, 255, 136, 0.2)",
                              color: "#00ff88",
                            }}
                          >
                            VISUALIZABLE
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#cccccc",
                          margin: "0 0 12px 0",
                          lineHeight: "1.5",
                        }}
                      >
                        {event.description}
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "12px",
                          fontSize: "12px",
                        }}
                      >
                        <div>
                          <span style={{ color: "#999999" }}>Contract: </span>
                          <span
                            style={{
                              color: "#00ffff",
                              fontFamily: "monospace",
                            }}
                          >
                            {formatAddress(event.contract)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "#999999" }}>Block: </span>
                          <span style={{ color: "#ffaa00" }}>
                            {event.blockNumber.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "#999999" }}>Value: </span>
                          <span style={{ color: "#00ff88" }}>
                            {event.value} ETH
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "#999999" }}>Time: </span>
                          <span style={{ color: "#9966ff" }}>
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {event.attackId && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: "rgba(0, 255, 136, 0.2)",
                          border: "1px solid rgba(0, 255, 136, 0.4)",
                          color: "#00ff88",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Play size={16} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </motion.div>
    </>
  );
};

export default TimeMachine;

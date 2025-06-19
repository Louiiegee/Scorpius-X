import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Activity,
  Filter,
  AlertTriangle,
  Eye,
  Download,
  BarChart3,
  Clock,
  Zap,
  TrendingUp,
  Settings,
  Maximize2,
  RefreshCw,
  Hash,
  FileJson,
  Shield,
  Bug,
  Crosshair,
  Radar,
  Cpu,
  Network,
  Database,
  Timer,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";

interface ThreatEvent {
  id: string;
  attackerAddress: string;
  contractTriggered: string;
  gasUsed: number;
  timestamp: Date;
  threatScore: number;
  txHash: string;
  calldataSize: number;
  value: number;
  status: "detected" | "analyzing" | "confirmed" | "neutralized";
  attackType: string;
  severity: "low" | "medium" | "high" | "critical";
}

const HiveAlert = () => {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ThreatEvent | null>(null);
  const [filters, setFilters] = useState({
    contract: "",
    gasThreshold: 100000,
    minScore: 0,
    severity: "all",
  });
  const [stats, setStats] = useState({
    totalDetections: 1247,
    activeThreats: 23,
    successRate: 97.3,
    avgResponseTime: 2.1,
    contractsMonitored: 156,
    dailyBlocks: 28947,
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  };

  // Initialize mock data
  useEffect(() => {
    const generateMockEvent = (): ThreatEvent => {
      const attackTypes = [
        "Reentrancy",
        "Flash Loan",
        "Oracle Manipulation",
        "MEV Bot",
        "Sandwich Attack",
      ];
      const severities: ("low" | "medium" | "high" | "critical")[] = [
        "low",
        "medium",
        "high",
        "critical",
      ];
      const statuses: (
        | "detected"
        | "analyzing"
        | "confirmed"
        | "neutralized"
      )[] = ["detected", "analyzing", "confirmed", "neutralized"];

      return {
        id: `HV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        attackerAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        contractTriggered: `0x${Math.random().toString(16).substr(2, 40)}`,
        gasUsed: Math.floor(Math.random() * 500000) + 100000,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        threatScore: Math.floor(Math.random() * 100),
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        calldataSize: Math.floor(Math.random() * 10000),
        value: Math.random() * 100,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
      };
    };

    const initialEvents = Array.from({ length: 15 }, generateMockEvent);
    setEvents(initialEvents);

    // Live event generation
    if (isLive) {
      const interval = setInterval(
        () => {
          const newEvent = generateMockEvent();
          setEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
        },
        5000 + Math.random() * 10000,
      );

      return () => clearInterval(interval);
    }
  }, [isLive]);

  // Live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        totalDetections: prev.totalDetections + Math.floor(Math.random() * 3),
        activeThreats: Math.max(
          0,
          prev.activeThreats + (Math.random() > 0.6 ? 1 : -1),
        ),
        successRate: Math.max(
          95,
          Math.min(99, prev.successRate + (Math.random() - 0.5) * 0.5),
        ),
        avgResponseTime: Math.max(
          1,
          Math.min(5, prev.avgResponseTime + (Math.random() - 0.5) * 0.2),
        ),
        dailyBlocks: prev.dailyBlocks + Math.floor(Math.random() * 50),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#ff4444";
      case "high":
        return "#ffaa00";
      case "medium":
        return "#00ffff";
      case "low":
        return "#00ff88";
      default:
        return "#666666";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "detected":
        return "#ffaa00";
      case "analyzing":
        return "#00ffff";
      case "confirmed":
        return "#ff4444";
      case "neutralized":
        return "#00ff88";
      default:
        return "#666666";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background: "#000000",
        fontFamily: "JetBrains Mono, Space Mono, monospace",
      }}
    >
      <motion.div
        className="max-w-7xl mx-auto p-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={cardVariants}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                className="p-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600"
                style={{
                  boxShadow: "0 0 30px rgba(255, 68, 68, 0.5)",
                }}
              >
                <Radar size={24} />
              </motion.div>
              <div>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#ff4444",
                    margin: "0",
                    letterSpacing: "2px",
                    textShadow: "0 0 20px rgba(255, 68, 68, 0.6)",
                  }}
                >
                  HONEY POT DETECTOR
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#999999",
                    margin: "0",
                    letterSpacing: "1px",
                  }}
                >
                  Hive Alert - Advanced Threat Detection & Response Grid
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isLive}
                  onCheckedChange={setIsLive}
                  className="data-[state=checked]:bg-green-500"
                />
                <Label className="text-white font-mono">
                  Live Monitoring{" "}
                  {isLive && <span className="text-green-400">●</span>}
                </Label>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold flex items-center gap-2"
                style={{
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
                }}
              >
                <Settings className="w-5 h-5" />
                Configure Alerts
              </motion.button>
            </div>
          </div>

          {/* System Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Total Detections",
                value: stats.totalDetections,
                icon: Target,
                color: "#00ffff",
              },
              {
                label: "Active Threats",
                value: stats.activeThreats,
                icon: AlertTriangle,
                color: "#ff4444",
              },
              {
                label: "Success Rate",
                value: `${stats.successRate.toFixed(1)}%`,
                icon: TrendingUp,
                color: "#00ff88",
              },
              {
                label: "Avg Response",
                value: `${stats.avgResponseTime.toFixed(1)}s`,
                icon: Timer,
                color: "#ffaa00",
              },
              {
                label: "Contracts Monitored",
                value: stats.contractsMonitored,
                icon: Shield,
                color: "#ff6666",
              },
              {
                label: "Daily Blocks",
                value: stats.dailyBlocks,
                icon: Database,
                color: "#00ffcc",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                className="p-4 rounded-2xl border border-gray-700 bg-black/40"
                style={{
                  boxShadow: `0 0 20px ${stat.color}20`,
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon
                    className="w-4 h-4"
                    style={{ color: stat.color }}
                  />
                  <span className="text-xs text-gray-400 font-mono">
                    {stat.label}
                  </span>
                </div>
                <LiveCounter
                  target={
                    typeof stat.value === "string" ? stat.value : stat.value
                  }
                  className="text-lg font-bold"
                  style={{ color: stat.color }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="mb-6 p-6 rounded-2xl border border-gray-700 bg-black/40"
          style={{
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
          }}
          variants={cardVariants}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-mono text-gray-300">Filters:</span>
            </div>

            <select
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
              value={filters.severity}
              onChange={(e) =>
                setFilters({ ...filters, severity: e.target.value })
              }
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <input
              type="text"
              placeholder="Contract Address"
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
              value={filters.contract}
              onChange={(e) =>
                setFilters({ ...filters, contract: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Min Threat Score"
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
              value={filters.minScore}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minScore: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </motion.div>

        {/* Threat Events */}
        <motion.div className="space-y-4" variants={cardVariants}>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <Activity className="w-6 h-6 text-cyan-400" />
            Live Threat Feed
          </h2>

          <div className="space-y-3">
            <AnimatePresence>
              {events.slice(0, 10).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl border border-gray-700 bg-black/60 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                  style={{
                    boxShadow: `0 0 15px ${getSeverityColor(event.severity)}20`,
                    backdropFilter: "blur(10px)",
                  }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Status Indicator */}
                      <motion.div
                        animate={{
                          scale: event.status === "analyzing" ? [1, 1.2, 1] : 1,
                          rotate: event.status === "analyzing" ? [0, 360] : 0,
                        }}
                        transition={{
                          scale: { duration: 1, repeat: Infinity },
                          rotate: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getStatusColor(event.status),
                        }}
                      />

                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-sm text-gray-400">
                            {event.id}
                          </span>
                          <span
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{
                              backgroundColor: `${getSeverityColor(event.severity)}20`,
                              color: getSeverityColor(event.severity),
                              border: `1px solid ${getSeverityColor(event.severity)}40`,
                            }}
                          >
                            {event.severity.toUpperCase()}
                          </span>
                          <span className="text-white font-bold">
                            {event.attackType}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-300">
                          <span>
                            Attacker: {formatAddress(event.attackerAddress)}
                          </span>
                          <span>
                            Contract: {formatAddress(event.contractTriggered)}
                          </span>
                          <span>Score: {event.threatScore}</span>
                          <span>{formatTimeAgo(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <p className="text-gray-400">Gas Used</p>
                        <p className="text-white font-mono">
                          {event.gasUsed.toLocaleString()}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-cyan-400" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HiveAlert;
export { HiveAlert as TrapGrid };

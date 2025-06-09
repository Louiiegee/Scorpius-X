import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Hash,
  Activity,
  GitBranch,
  Layers,
  Cpu,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FlashbotsSim {
  id: string;
  simHash: string;
  sender: string;
  targetContract: string;
  simOnly: boolean;
  gasUsed: number;
  simScore: number;
  timestamp: Date;
  bundleSize: number;
  blockNumber: number;
  profit: number;
  status: "pending" | "simulated" | "included" | "failed";
}

interface BlockActivity {
  blockNumber: number;
  simCount: number;
  successRate: number;
  timestamp: Date;
}

const SimSniper = () => {
  const [simulations, setSimulations] = useState<FlashbotsSim[]>([]);
  const [selectedSim, setSelectedSim] = useState<FlashbotsSim | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [filters, setFilters] = useState({
    simOnly: false,
    minGas: 100000,
    minScore: 0,
    sender: "",
  });
  const [blockHeatmap, setBlockHeatmap] = useState<BlockActivity[]>([]);
  const [stats, setStats] = useState({
    totalSims: 3847,
    successRate: 67.3,
    avgProfit: 1.47,
    activeBundles: 23,
  });

  // Mock simulation data
  const mockSimulations: FlashbotsSim[] = [
    {
      id: "1",
      simHash:
        "0x8a9b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234",
      sender: "0x742d35Cc6431C8BF3240C39B6969E3C77e1345eF",
      targetContract: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
      simOnly: true,
      gasUsed: 384250,
      simScore: 89,
      timestamp: new Date(Date.now() - 1000 * 60 * 1),
      bundleSize: 3,
      blockNumber: 18945672,
      profit: 2.34,
      status: "simulated",
    },
    {
      id: "2",
      simHash:
        "0x9b8a7c6d5e4f3210987654321098765432109876543210987654321098765432",
      sender: "0x9F8b2C4D5E6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C",
      targetContract: "0x2a4b6d8f1e3c5a7b9d0f2e4c6a8b0d2e4f6a8c0e",
      simOnly: false,
      gasUsed: 156780,
      simScore: 94,
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
      bundleSize: 1,
      blockNumber: 18945671,
      profit: 0.87,
      status: "included",
    },
    {
      id: "3",
      simHash:
        "0x7c8b9a0d1e2f3456789012345678901234567890123456789012345678901234",
      sender: "0x7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F",
      targetContract: "0x3b5c7e9f2d4a6c8e0f1a3c5e7f9a1c3e5f7a9c1e",
      simOnly: true,
      gasUsed: 512340,
      simScore: 76,
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      bundleSize: 2,
      blockNumber: 18945670,
      profit: 1.92,
      status: "pending",
    },
  ];

  // Mock block heatmap data
  const mockBlockData: BlockActivity[] = Array.from({ length: 20 }, (_, i) => ({
    blockNumber: 18945680 - i,
    simCount: Math.floor(Math.random() * 50) + 10,
    successRate: Math.random() * 40 + 60,
    timestamp: new Date(Date.now() - i * 12000),
  }));

  // Initialize data
  useEffect(() => {
    setSimulations(mockSimulations);
    setBlockHeatmap(mockBlockData);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(
      () => {
        const newSim: FlashbotsSim = {
          id: Date.now().toString(),
          simHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          sender: `0x${Math.random().toString(16).substr(2, 40)}`,
          targetContract: `0x${Math.random().toString(16).substr(2, 40)}`,
          simOnly: Math.random() > 0.4,
          gasUsed: Math.floor(Math.random() * 500000) + 100000,
          simScore: Math.floor(Math.random() * 40) + 60,
          timestamp: new Date(),
          bundleSize: Math.floor(Math.random() * 5) + 1,
          blockNumber: 18945680 + Math.floor(Date.now() / 12000),
          profit: Math.random() * 3,
          status: ["pending", "simulated", "included", "failed"][
            Math.floor(Math.random() * 4)
          ] as any,
        };

        setSimulations((prev) => [newSim, ...prev.slice(0, 19)]);
        setStats((prev) => ({
          ...prev,
          totalSims: prev.totalSims + 1,
          activeBundles: Math.floor(Math.random() * 10) + 20,
        }));
      },
      4000 + Math.random() * 3000,
    );

    return () => clearInterval(interval);
  }, [isLive]);

  const filteredSimulations = simulations.filter((sim) => {
    if (filters.simOnly && !sim.simOnly) return false;
    if (sim.gasUsed < filters.minGas) return false;
    if (sim.simScore < filters.minScore) return false;
    if (
      filters.sender &&
      !sim.sender.toLowerCase().includes(filters.sender.toLowerCase())
    )
      return false;
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#00ffff";
    if (score >= 75) return "#00ff88";
    if (score >= 60) return "#ffaa00";
    return "#ff6666";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "included":
        return "#00ff88";
      case "simulated":
        return "#00ffff";
      case "pending":
        return "#ffaa00";
      case "failed":
        return "#ff4444";
      default:
        return "#999999";
    }
  };

  const getHeatmapColor = (simCount: number) => {
    const intensity = Math.min(simCount / 50, 1);
    return `rgba(0, 255, 136, ${0.2 + intensity * 0.6})`;
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
          
          .flashbots-grid {
            font-family: 'JetBrains Mono', 'Space Mono', monospace;
          }
          
          .neon-glow {
            text-shadow: 0 0 10px currentColor;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          
          .block-cell {
            transition: all 0.3s ease;
          }
          
          .block-cell:hover {
            transform: scale(1.1);
            z-index: 10;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
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
            background: linear-gradient(45deg, #00ffff, #00ff88);
            border-radius: 4px;
          }
        `}
      </style>

      <motion.div
        className="flashbots-grid"
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
            radial-gradient(circle at 20% 20%, rgba(0, 255, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 255, 136, 0.03) 0%, transparent 50%)
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
              gap: "16px",
              marginBottom: "8px",
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, repeatType: "reverse" },
              }}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(45deg, #00ffff, #0099ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 0 30px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)",
              }}
            >
              <Zap size={24} color="#000000" />
            </motion.div>
            <div>
              <h1
                className="neon-glow"
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#00ffff",
                  margin: "0",
                  letterSpacing: "2px",
                }}
              >
                🔥 SIMSNIPER
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#999999",
                  margin: "0",
                  letterSpacing: "1px",
                }}
              >
                Flashbots Bundle Tracker & Simulation Engine
              </p>
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
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Total Sims",
              value: stats.totalSims.toLocaleString(),
              icon: Activity,
              color: "#00ffff",
            },
            {
              label: "Success Rate",
              value: `${stats.successRate.toFixed(1)}%`,
              icon: TrendingUp,
              color: "#00ff88",
            },
            {
              label: "Avg Profit",
              value: `${stats.avgProfit} ETH`,
              icon: Target,
              color: "#ffaa00",
            },
            {
              label: "Active Bundles",
              value: stats.activeBundles.toString(),
              icon: Layers,
              color: "#ff6666",
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
                <div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: stat.color,
                      fontFamily: "'JetBrains Mono', monospace",
                      textShadow: `0 0 10px ${stat.color}60`,
                    }}
                  >
                    {stat.value}
                  </motion.div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999999",
                      fontWeight: "500",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Block Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 255, 255, 0.3)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
            boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#00ffff",
                margin: "0",
                letterSpacing: "1px",
              }}
            >
              ⚡ BLOCK ACTIVITY HEATMAP
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#999999",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "rgba(0, 255, 136, 0.3)",
                  borderRadius: "2px",
                }}
              />
              <span>Low</span>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "rgba(0, 255, 136, 0.8)",
                  borderRadius: "2px",
                }}
              />
              <span>High</span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
              gap: "8px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {blockHeatmap.map((block, index) => (
              <motion.div
                key={block.blockNumber}
                className="block-cell"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                whileHover={{ scale: 1.1 }}
                style={{
                  backgroundColor: getHeatmapColor(block.simCount),
                  border: "1px solid rgba(0, 255, 136, 0.4)",
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#ffffff",
                    marginBottom: "4px",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  #{block.blockNumber.toString().slice(-4)}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#cccccc",
                    marginBottom: "2px",
                  }}
                >
                  {block.simCount} sims
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: block.successRate > 70 ? "#00ff88" : "#ffaa00",
                    fontWeight: "500",
                  }}
                >
                  {block.successRate.toFixed(0)}% ✓
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
            boxShadow: "0 0 30px rgba(0, 255, 136, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            {/* Live Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <motion.div
                animate={{
                  scale: isLive ? [1, 1.2, 1] : 1,
                  opacity: isLive ? [1, 0.6, 1] : 0.5,
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: isLive ? "#00ffff" : "#666666",
                  boxShadow: isLive
                    ? "0 0 15px rgba(0, 255, 255, 0.6)"
                    : "none",
                }}
              />
              <Switch
                checked={isLive}
                onCheckedChange={setIsLive}
                className="data-[state=checked]:bg-blue-500"
              />
              <Label style={{ color: "#cccccc", fontWeight: "500" }}>
                Live Tracking
              </Label>
            </div>

            {/* Sim-Only Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Switch
                checked={filters.simOnly}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({ ...prev, simOnly: checked }))
                }
                className="data-[state=checked]:bg-purple-500"
              />
              <Label style={{ color: "#cccccc", fontWeight: "500" }}>
                Sim-Only
              </Label>
            </div>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <Label
                  style={{
                    color: "#999999",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  Sender Filter
                </Label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={filters.sender}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sender: e.target.value }))
                  }
                  style={{
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontFamily: "'JetBrains Mono', monospace",
                    width: "160px",
                  }}
                />
              </div>

              <div>
                <Label
                  style={{
                    color: "#999999",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  Min Gas: {filters.minGas.toLocaleString()}
                </Label>
                <input
                  type="range"
                  min="50000"
                  max="1000000"
                  step="10000"
                  value={filters.minGas}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minGas: Number(e.target.value),
                    }))
                  }
                  style={{
                    width: "120px",
                    accentColor: "#00ffff",
                  }}
                />
              </div>

              <div>
                <Label
                  style={{
                    color: "#999999",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  Min Score: {filters.minScore}%
                </Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minScore: Number(e.target.value),
                    }))
                  }
                  style={{
                    width: "100px",
                    accentColor: "#00ff88",
                  }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              style={{
                background: "transparent",
                border: "1px solid rgba(0, 255, 255, 0.5)",
                color: "#00ffff",
              }}
            >
              <Download size={14} style={{ marginRight: "8px" }} />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Simulations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 255, 255, 0.3)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(0, 255, 255, 0.2)",
              backgroundColor: "rgba(0, 255, 255, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#00ffff",
                margin: "0",
                letterSpacing: "1px",
              }}
            >
              ⚡ FLASHBOTS SIMULATIONS ({filteredSimulations.length})
            </h3>
          </div>

          <div
            className="data-scroll"
            style={{
              maxHeight: "600px",
              overflowY: "auto",
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredSimulations.map((sim, index) => (
                <motion.div
                  key={sim.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                  }}
                  whileHover={{ backgroundColor: "rgba(0, 255, 255, 0.05)" }}
                  onClick={() => setSelectedSim(sim)}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "180px 180px 180px 100px 120px 100px 120px 1fr",
                    gap: "16px",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Sim Hash */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "2px",
                      }}
                    >
                      Sim Hash
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#00ffff",
                        textShadow: "0 0 5px rgba(0, 255, 255, 0.5)",
                      }}
                    >
                      {sim.simHash.slice(0, 12)}...{sim.simHash.slice(-8)}
                    </div>
                  </div>

                  {/* Sender */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "2px",
                      }}
                    >
                      Sender
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#ffaa00",
                      }}
                    >
                      {sim.sender.slice(0, 10)}...{sim.sender.slice(-8)}
                    </div>
                  </div>

                  {/* Target Contract */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "2px",
                      }}
                    >
                      Target Contract
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#00ff88",
                      }}
                    >
                      {sim.targetContract.slice(0, 10)}...
                      {sim.targetContract.slice(-8)}
                    </div>
                  </div>

                  {/* Sim Only */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "2px",
                      }}
                    >
                      Sim-Only
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: sim.simOnly ? "#00ffff" : "#666666",
                      }}
                    >
                      {sim.simOnly ? "YES" : "NO"}
                    </div>
                  </div>

                  {/* Gas Used */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "2px",
                      }}
                    >
                      Gas Used
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#ffffff",
                      }}
                    >
                      {sim.gasUsed.toLocaleString()}
                    </div>
                  </div>

                  {/* Sim Score */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "2px",
                      }}
                    >
                      Score
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: `${sim.simScore}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          style={{
                            height: "100%",
                            backgroundColor: getScoreColor(sim.simScore),
                            boxShadow: `0 0 10px ${getScoreColor(sim.simScore)}`,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: getScoreColor(sim.simScore),
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {sim.simScore}%
                      </span>
                    </div>
                  </div>

                  {/* Profit */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "2px",
                      }}
                    >
                      Profit (ETH)
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: sim.profit > 1 ? "#00ff88" : "#ffaa00",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {sim.profit.toFixed(3)}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        backgroundColor: `${getStatusColor(sim.status)}20`,
                        color: getStatusColor(sim.status),
                        border: `1px solid ${getStatusColor(sim.status)}40`,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {sim.status}
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(0, 255, 255, 0.2)",
                          border: "1px solid rgba(0, 255, 255, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Play size={12} color="#00ffff" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(0, 255, 136, 0.2)",
                          border: "1px solid rgba(0, 255, 136, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={12} color="#00ff88" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Selected Simulation Details Modal */}
        <AnimatePresence>
          {selectedSim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                backdropFilter: "blur(10px)",
              }}
              onClick={() => setSelectedSim(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: "#000000",
                  border: "2px solid rgba(0, 255, 255, 0.5)",
                  borderRadius: "20px",
                  padding: "32px",
                  maxWidth: "900px",
                  width: "90%",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  boxShadow: "0 0 50px rgba(0, 255, 255, 0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#00ffff",
                      margin: "0",
                      letterSpacing: "1px",
                    }}
                  >
                    ⚡ SIMULATION DETAILS
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedSim(null)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255, 68, 68, 0.2)",
                      border: "1px solid rgba(255, 68, 68, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#ff4444",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    ×
                  </motion.button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "32px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        color: "#00ffff",
                        marginBottom: "16px",
                        fontSize: "14px",
                        letterSpacing: "1px",
                      }}
                    >
                      BUNDLE INFORMATION
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {[
                        {
                          label: "Simulation Hash",
                          value: selectedSim.simHash,
                        },
                        { label: "Sender Address", value: selectedSim.sender },
                        {
                          label: "Target Contract",
                          value: selectedSim.targetContract,
                        },
                        {
                          label: "Bundle Size",
                          value: `${selectedSim.bundleSize} transactions`,
                        },
                        {
                          label: "Block Number",
                          value: selectedSim.blockNumber.toLocaleString(),
                        },
                        {
                          label: "Gas Used",
                          value: selectedSim.gasUsed.toLocaleString(),
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#999999",
                              marginBottom: "4px",
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#ffffff",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              padding: "8px",
                              borderRadius: "6px",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              wordBreak: "break-all",
                            }}
                          >
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4
                      style={{
                        color: "#00ff88",
                        marginBottom: "16px",
                        fontSize: "14px",
                        letterSpacing: "1px",
                      }}
                    >
                      SIMULATION RESULTS
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#999999",
                            marginBottom: "8px",
                          }}
                        >
                          Simulation Score
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "120px",
                              height: "12px",
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              borderRadius: "6px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${selectedSim.simScore}%`,
                                height: "100%",
                                backgroundColor: getScoreColor(
                                  selectedSim.simScore,
                                ),
                                boxShadow: `0 0 15px ${getScoreColor(selectedSim.simScore)}`,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "18px",
                              fontWeight: "700",
                              color: getScoreColor(selectedSim.simScore),
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {selectedSim.simScore}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#999999",
                            marginBottom: "8px",
                          }}
                        >
                          Execution Status
                        </div>
                        <div
                          style={{
                            display: "inline-block",
                            padding: "8px 16px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            backgroundColor: `${getStatusColor(selectedSim.status)}20`,
                            color: getStatusColor(selectedSim.status),
                            border: `2px solid ${getStatusColor(selectedSim.status)}40`,
                            letterSpacing: "1px",
                          }}
                        >
                          {selectedSim.status}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#999999",
                            marginBottom: "8px",
                          }}
                        >
                          Estimated Profit
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color:
                              selectedSim.profit > 1 ? "#00ff88" : "#ffaa00",
                            fontFamily: "'JetBrains Mono', monospace",
                            textShadow: `0 0 10px ${selectedSim.profit > 1 ? "#00ff88" : "#ffaa00"}`,
                          }}
                        >
                          {selectedSim.profit.toFixed(6)} ETH
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#999999",
                            marginBottom: "8px",
                          }}
                        >
                          Configuration
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{ fontSize: "12px", color: "#cccccc" }}
                            >
                              Simulation Only
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "600",
                                padding: "2px 8px",
                                borderRadius: "8px",
                                backgroundColor: selectedSim.simOnly
                                  ? "rgba(0, 255, 255, 0.2)"
                                  : "rgba(255, 170, 0, 0.2)",
                                color: selectedSim.simOnly
                                  ? "#00ffff"
                                  : "#ffaa00",
                                border: `1px solid ${selectedSim.simOnly ? "#00ffff" : "#ffaa00"}40`,
                              }}
                            >
                              {selectedSim.simOnly ? "YES" : "NO"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "24px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px" }}>
                    <Button
                      style={{
                        background: "linear-gradient(45deg, #00ffff, #0099ff)",
                        color: "#000000",
                        fontWeight: "600",
                      }}
                    >
                      <Play size={16} style={{ marginRight: "8px" }} />
                      Replay Simulation
                    </Button>
                    <Button
                      variant="outline"
                      style={{
                        border: "1px solid rgba(0, 255, 136, 0.5)",
                        color: "#00ff88",
                      }}
                    >
                      <Hash size={16} style={{ marginRight: "8px" }} />
                      View on Explorer
                    </Button>
                    <Button
                      variant="outline"
                      style={{
                        border: "1px solid rgba(255, 170, 0, 0.5)",
                        color: "#ffaa00",
                      }}
                    >
                      <GitBranch size={16} style={{ marginRight: "8px" }} />
                      Fork & Test
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default SimSniper;
export { SimSniper };

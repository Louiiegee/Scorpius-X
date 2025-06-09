import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Binary,
  Upload,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  FileCode,
  Cpu,
  Target,
  GitCompare,
  Flag,
  Shield,
  Activity,
  Hash,
  Layers,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ThreatMatch {
  id: string;
  contractName: string;
  similarity: number;
  threatLevel: "low" | "medium" | "high" | "critical";
  contractAddress: string;
  matchedFunctions: string[];
  opcodeFamily: string[];
  description: string;
  firstSeen: Date;
  lastSeen: Date;
  reportCount: number;
}

interface BytecodeAnalysis {
  contractAddress: string;
  bytecodeSize: number;
  uniqueOpcodes: number;
  functionCount: number;
  complexity: number;
  gasOptimization: number;
  securityScore: number;
  decompiled: boolean;
}

const CodeMatcher = () => {
  const [contractInput, setContractInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BytecodeAnalysis | null>(null);
  const [threatMatches, setThreatMatches] = useState<ThreatMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<ThreatMatch | null>(null);
  const [uploadedCode, setUploadedCode] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 15247,
    threatsDetected: 892,
    falsePositives: 43,
    avgSimilarity: 23.7,
  });

  // Mock threat database
  const mockThreats: ThreatMatch[] = [
    {
      id: "1",
      contractName: "HoneyPot_V3",
      similarity: 94.8,
      threatLevel: "critical",
      contractAddress: "0x742d35Cc6431C8BF3240C39B6969E3C77e1345eF",
      matchedFunctions: ["withdraw", "balanceOf", "_transfer"],
      opcodeFamily: ["SELFDESTRUCT", "DELEGATECALL", "CALL"],
      description:
        "Advanced honeypot with reentrancy trap and balance manipulation",
      firstSeen: new Date("2023-10-15"),
      lastSeen: new Date("2024-01-20"),
      reportCount: 47,
    },
    {
      id: "2",
      contractName: "FakeToken_Clone",
      similarity: 87.3,
      threatLevel: "high",
      contractAddress: "0x9F8b2C4D5E6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C",
      matchedFunctions: ["transfer", "approve", "mint"],
      opcodeFamily: ["SSTORE", "SLOAD", "MSTORE"],
      description: "Malicious token contract with hidden ownership backdoor",
      firstSeen: new Date("2023-11-22"),
      lastSeen: new Date("2024-01-18"),
      reportCount: 23,
    },
    {
      id: "3",
      contractName: "RugPull_Pattern",
      similarity: 76.2,
      threatLevel: "high",
      contractAddress: "0x7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F",
      matchedFunctions: ["removeLiquidity", "emergencyWithdraw"],
      opcodeFamily: ["CALL", "STATICCALL", "RETURN"],
      description:
        "Contract pattern associated with liquidity removal exploits",
      firstSeen: new Date("2023-12-01"),
      lastSeen: new Date("2024-01-15"),
      reportCount: 31,
    },
    {
      id: "4",
      contractName: "Phishing_Proxy",
      similarity: 68.9,
      threatLevel: "medium",
      contractAddress: "0x3B2C1A9E8F7D6C5B4A3E2D1C9B8A7F6E5D4C3B2A",
      matchedFunctions: ["fallback", "receive"],
      opcodeFamily: ["DELEGATECALL", "CALLDATALOAD"],
      description: "Proxy contract with suspicious delegation patterns",
      firstSeen: new Date("2023-09-30"),
      lastSeen: new Date("2024-01-10"),
      reportCount: 12,
    },
  ];

  const analyzeContract = async () => {
    if (!contractInput.trim()) return;

    setIsAnalyzing(true);
    setThreatMatches([]);
    setAnalysis(null);

    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock analysis results
    const mockAnalysis: BytecodeAnalysis = {
      contractAddress: contractInput,
      bytecodeSize: Math.floor(Math.random() * 50000) + 10000,
      uniqueOpcodes: Math.floor(Math.random() * 50) + 30,
      functionCount: Math.floor(Math.random() * 20) + 5,
      complexity: Math.floor(Math.random() * 40) + 60,
      gasOptimization: Math.floor(Math.random() * 30) + 70,
      securityScore: Math.floor(Math.random() * 30) + 70,
      decompiled: Math.random() > 0.3,
    };

    setAnalysis(mockAnalysis);
    setThreatMatches(mockThreats);
    setIsAnalyzing(false);

    setStats((prev) => ({
      ...prev,
      totalScans: prev.totalScans + 1,
    }));
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case "critical":
        return "#ff0040";
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

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "#ff0040";
    if (similarity >= 75) return "#ff4444";
    if (similarity >= 50) return "#ffaa00";
    if (similarity >= 25) return "#00ffff";
    return "#00ff88";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#00ff88";
    if (score >= 60) return "#ffaa00";
    return "#ff4444";
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

          .code-matcher {
            font-family: 'JetBrains Mono', 'Space Mono', monospace;
          }

          .code-editor {
            font-family: 'JetBrains Mono', monospace;
            background: #0a0a0a;
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 8px;
            padding: 16px;
            color: #ffffff;
            resize: vertical;
            min-height: 200px;
          }

          .diff-view {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            line-height: 1.6;
          }

          .added-line {
            background-color: rgba(0, 255, 136, 0.2);
            border-left: 3px solid #00ff88;
          }

          .removed-line {
            background-color: rgba(255, 68, 68, 0.2);
            border-left: 3px solid #ff4444;
          }

          .matched-line {
            background-color: rgba(0, 255, 255, 0.1);
            border-left: 3px solid #00ffff;
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
        `}
      </style>

      <motion.div
        className="code-matcher"
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
            radial-gradient(circle at 70% 70%, rgba(0, 255, 255, 0.03) 0%, transparent 50%)
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
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(45deg, #00ff88, #00ffff, #0099ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 0 30px rgba(0, 255, 136, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)",
              }}
            >
              <Binary size={24} color="#000000" />
            </motion.div>
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#00ff88",
                  margin: "0",
                  letterSpacing: "2px",
                  textShadow: "0 0 20px rgba(0, 255, 136, 0.6)",
                }}
              >
                BYTECODE SIMILARITY SEARCH
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#999999",
                  margin: "0",
                  letterSpacing: "1px",
                }}
              >
                CodeMatcher - Bytecode Similarity Analysis & Threat Detection
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
              label: "Total Scans",
              value: stats.totalScans.toLocaleString(),
              icon: Search,
              color: "#00ff88",
            },
            {
              label: "Threats Found",
              value: stats.threatsDetected.toString(),
              icon: AlertTriangle,
              color: "#ff4444",
            },
            {
              label: "False Positives",
              value: stats.falsePositives.toString(),
              icon: CheckCircle,
              color: "#00ffff",
            },
            {
              label: "Avg Similarity",
              value: `${stats.avgSimilarity}%`,
              icon: TrendingUp,
              color: "#ffaa00",
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

        {/* Analysis Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 0 30px rgba(0, 255, 136, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#00ff88",
              marginBottom: "16px",
              letterSpacing: "1px",
            }}
          >
            🔍 BYTECODE ANALYSIS
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            {/* Contract Input */}
            <div>
              <Label
                style={{
                  color: "#cccccc",
                  fontSize: "14px",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Contract Address or Bytecode
              </Label>
              <input
                type="text"
                value={contractInput}
                onChange={(e) => setContractInput(e.target.value)}
                placeholder="0x... or paste bytecode"
                style={{
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid rgba(0, 255, 136, 0.4)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: "16px",
                }}
              />

              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  onClick={analyzeContract}
                  disabled={isAnalyzing || !contractInput.trim()}
                  style={{
                    background: "linear-gradient(45deg, #00ff88, #00ffff)",
                    color: "#000000",
                    fontWeight: "600",
                    opacity: isAnalyzing ? 0.7 : 1,
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Cpu size={16} style={{ marginRight: "8px" }} />
                      </motion.div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search size={16} style={{ marginRight: "8px" }} />
                      Analyze Contract
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  style={{
                    border: "1px solid rgba(0, 255, 255, 0.5)",
                    color: "#00ffff",
                  }}
                >
                  <Upload size={16} style={{ marginRight: "8px" }} />
                  Upload File
                </Button>
              </div>
            </div>

            {/* Code Upload */}
            <div>
              <Label
                style={{
                  color: "#cccccc",
                  fontSize: "14px",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Or Upload Source Code
              </Label>
              <textarea
                className="code-editor"
                value={uploadedCode}
                onChange={(e) => setUploadedCode(e.target.value)}
                placeholder="// Paste your Solidity code here..."
                style={{ width: "100%", minHeight: "120px" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "24px",
                marginBottom: "24px",
              }}
            >
              {/* Contract Analysis */}
              <div
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#00ffff",
                    marginBottom: "16px",
                    letterSpacing: "1px",
                  }}
                >
                  📊 CONTRACT METRICS
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      label: "Bytecode Size",
                      value: `${analysis.bytecodeSize.toLocaleString()} bytes`,
                      icon: FileCode,
                    },
                    {
                      label: "Unique Opcodes",
                      value: analysis.uniqueOpcodes.toString(),
                      icon: Hash,
                    },
                    {
                      label: "Functions",
                      value: analysis.functionCount.toString(),
                      icon: Layers,
                    },
                    {
                      label: "Decompiled",
                      value: analysis.decompiled ? "Yes" : "No",
                      icon: Eye,
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(0, 255, 255, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(0, 255, 255, 0.4)",
                        }}
                      >
                        <metric.icon size={16} color="#00ffff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", color: "#999999" }}>
                          {metric.label}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#ffffff",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {metric.value}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Score Bars */}
                  {[
                    {
                      label: "Complexity",
                      value: analysis.complexity,
                      color: "#ffaa00",
                    },
                    {
                      label: "Gas Optimization",
                      value: analysis.gasOptimization,
                      color: "#00ff88",
                    },
                    {
                      label: "Security Score",
                      value: analysis.securityScore,
                      color: getScoreColor(analysis.securityScore),
                    },
                  ].map((score) => (
                    <div key={score.label} style={{ marginTop: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                          fontSize: "12px",
                          color: "#999999",
                        }}
                      >
                        <span>{score.label}</span>
                        <span>{score.value}%</span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: `${score.value}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          style={{
                            height: "100%",
                            backgroundColor: score.color,
                            boxShadow: `0 0 10px ${score.color}`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threat Matches */}
              <div
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 68, 68, 0.3)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 0 30px rgba(255, 68, 68, 0.2)",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(255, 68, 68, 0.2)",
                    backgroundColor: "rgba(255, 68, 68, 0.1)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#ff4444",
                      margin: "0",
                      letterSpacing: "1px",
                    }}
                  >
                    🚨 THREAT MATCHES ({threatMatches.length})
                  </h3>
                </div>

                <div
                  className="data-scroll"
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  {threatMatches.map((threat, index) => (
                    <motion.div
                      key={threat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{
                        backgroundColor: "rgba(255, 68, 68, 0.05)",
                      }}
                      onClick={() => setSelectedMatch(threat)}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#ffffff",
                              marginBottom: "4px",
                            }}
                          >
                            {threat.contractName}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#cccccc",
                              marginBottom: "4px",
                            }}
                          >
                            {threat.description}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            {threat.matchedFunctions.slice(0, 3).map((func) => (
                              <span
                                key={func}
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "8px",
                                  backgroundColor: "rgba(0, 255, 255, 0.2)",
                                  color: "#00ffff",
                                  border: "1px solid rgba(0, 255, 255, 0.4)",
                                }}
                              >
                                {func}()
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "10px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              backgroundColor: `${getThreatColor(threat.threatLevel)}20`,
                              color: getThreatColor(threat.threatLevel),
                              border: `1px solid ${getThreatColor(threat.threatLevel)}40`,
                              marginBottom: "4px",
                            }}
                          >
                            {threat.threatLevel}
                          </div>
                        </div>
                      </div>

                      {/* Similarity Bar */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "4px",
                            fontSize: "12px",
                            color: "#999999",
                          }}
                        >
                          <span>Similarity</span>
                          <span>{threat.similarity.toFixed(1)}%</span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "6px",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}
                        >
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: `${threat.similarity}%` }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            style={{
                              height: "100%",
                              backgroundColor: getSimilarityColor(
                                threat.similarity,
                              ),
                              boxShadow: `0 0 8px ${getSimilarityColor(threat.similarity)}`,
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Threat Details Modal */}
        <AnimatePresence>
          {selectedMatch && (
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
              onClick={() => setSelectedMatch(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: "#000000",
                  border: "2px solid rgba(255, 68, 68, 0.5)",
                  borderRadius: "20px",
                  padding: "32px",
                  maxWidth: "1000px",
                  width: "90%",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  boxShadow: "0 0 50px rgba(255, 68, 68, 0.3)",
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
                      color: "#ff4444",
                      margin: "0",
                      letterSpacing: "1px",
                    }}
                  >
                    🚨 THREAT ANALYSIS: {selectedMatch.contractName}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedMatch(null)}
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
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        color: "#ff4444",
                        marginBottom: "16px",
                        fontSize: "14px",
                        letterSpacing: "1px",
                      }}
                    >
                      THREAT DETAILS
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
                          label: "Contract Name",
                          value: selectedMatch.contractName,
                        },
                        {
                          label: "Contract Address",
                          value: selectedMatch.contractAddress,
                        },
                        {
                          label: "Threat Level",
                          value: selectedMatch.threatLevel.toUpperCase(),
                        },
                        {
                          label: "Similarity Score",
                          value: `${selectedMatch.similarity.toFixed(2)}%`,
                        },
                        {
                          label: "Report Count",
                          value: selectedMatch.reportCount.toString(),
                        },
                        {
                          label: "First Seen",
                          value: selectedMatch.firstSeen.toLocaleDateString(),
                        },
                        {
                          label: "Last Seen",
                          value: selectedMatch.lastSeen.toLocaleDateString(),
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
                        color: "#00ffff",
                        marginBottom: "16px",
                        fontSize: "14px",
                        letterSpacing: "1px",
                      }}
                    >
                      TECHNICAL ANALYSIS
                    </h4>

                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999999",
                          marginBottom: "8px",
                        }}
                      >
                        Matched Functions
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {selectedMatch.matchedFunctions.map((func) => (
                          <span
                            key={func}
                            style={{
                              fontSize: "11px",
                              padding: "4px 8px",
                              borderRadius: "12px",
                              backgroundColor: "rgba(0, 255, 255, 0.2)",
                              color: "#00ffff",
                              border: "1px solid rgba(0, 255, 255, 0.4)",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {func}()
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999999",
                          marginBottom: "8px",
                        }}
                      >
                        Opcode Families
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {selectedMatch.opcodeFamily.map((opcode) => (
                          <span
                            key={opcode}
                            style={{
                              fontSize: "11px",
                              padding: "4px 8px",
                              borderRadius: "12px",
                              backgroundColor: "rgba(255, 170, 0, 0.2)",
                              color: "#ffaa00",
                              border: "1px solid rgba(255, 170, 0, 0.4)",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {opcode}
                          </span>
                        ))}
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
                        Similarity Breakdown
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "20px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: `${selectedMatch.similarity}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${getSimilarityColor(selectedMatch.similarity)}, ${getSimilarityColor(selectedMatch.similarity)}80)`,
                            boxShadow: `0 0 15px ${getSimilarityColor(selectedMatch.similarity)}`,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#000000",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {selectedMatch.similarity.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "rgba(255, 68, 68, 0.1)",
                      border: "1px solid rgba(255, 68, 68, 0.3)",
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <AlertTriangle size={16} color="#ff4444" />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#ff4444",
                        }}
                      >
                        THREAT DESCRIPTION
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#cccccc",
                        margin: "0",
                        lineHeight: "1.6",
                      }}
                    >
                      {selectedMatch.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <Button
                    style={{
                      background: "linear-gradient(45deg, #ff4444, #ff6666)",
                      color: "#ffffff",
                      fontWeight: "600",
                    }}
                  >
                    <Flag size={16} style={{ marginRight: "8px" }} />
                    Flag as Threat
                  </Button>
                  <Button
                    variant="outline"
                    style={{
                      border: "1px solid rgba(0, 255, 136, 0.5)",
                      color: "#00ff88",
                    }}
                  >
                    <CheckCircle size={16} style={{ marginRight: "8px" }} />
                    Report False Positive
                  </Button>
                  <Button
                    variant="outline"
                    style={{
                      border: "1px solid rgba(0, 255, 255, 0.5)",
                      color: "#00ffff",
                    }}
                  >
                    <GitCompare size={16} style={{ marginRight: "8px" }} />
                    View Diff
                  </Button>
                  <Button
                    variant="outline"
                    style={{
                      border: "1px solid rgba(255, 170, 0, 0.5)",
                      color: "#ffaa00",
                    }}
                  >
                    <Download size={16} style={{ marginRight: "8px" }} />
                    Export Report
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default CodeMatcher;
export { CodeMatcher };

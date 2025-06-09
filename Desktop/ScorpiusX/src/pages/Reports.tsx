import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";
import {
  FileText,
  BarChart3,
  Download,
  Calendar,
  Filter,
  Settings,
  Eye,
  Share,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  DollarSign,
  Users,
  Activity,
  Clock,
  Target,
  Database,
  Zap,
  Search,
  Bell,
  RefreshCw,
  PieChart,
  LineChart,
  Plus,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";
import { EnhancedToast } from "@/components/ui/enhanced-toast";

const IntelReports = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState({
    reportsGenerated: 247,
    totalDownloads: 1456,
    activeTemplates: 18,
    avgGenerationTime: 2.3,
    threatsAnalyzed: 1829,
    dataPoints: 45672,
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

  // Mock data
  const [reportTemplates] = useState([
    {
      id: "RPT-001",
      name: "Security Assessment Report",
      description:
        "Comprehensive security analysis with vulnerability breakdown",
      category: "Security",
      lastUsed: "2 hours ago",
      usageCount: 156,
      estimatedTime: "3-5 minutes",
      sections: [
        "Executive Summary",
        "Vulnerability Analysis",
        "Risk Assessment",
        "Recommendations",
      ],
      format: "PDF",
    },
    {
      id: "RPT-002",
      name: "MEV Analysis Dashboard",
      description: "MEV opportunities and bot performance metrics",
      category: "MEV",
      lastUsed: "1 day ago",
      usageCount: 89,
      estimatedTime: "2-3 minutes",
      sections: [
        "MEV Overview",
        "Bot Performance",
        "Profit Analysis",
        "Market Impact",
      ],
      format: "Interactive",
    },
    {
      id: "RPT-003",
      name: "Threat Intelligence Brief",
      description: "Latest threat patterns and attack vectors",
      category: "Intelligence",
      lastUsed: "3 hours ago",
      usageCount: 203,
      estimatedTime: "1-2 minutes",
      sections: [
        "Threat Landscape",
        "Attack Patterns",
        "IOCs",
        "Mitigation Strategies",
      ],
      format: "PDF",
    },
    {
      id: "RPT-004",
      name: "DeFi Protocol Health Check",
      description: "Protocol security posture and risk assessment",
      category: "DeFi",
      lastUsed: "30 minutes ago",
      usageCount: 74,
      estimatedTime: "4-6 minutes",
      sections: [
        "Protocol Overview",
        "Security Metrics",
        "Liquidity Analysis",
        "Risk Factors",
      ],
      format: "Dashboard",
    },
  ]);

  const [recentReports] = useState([
    {
      id: "GEN-001",
      template: "Security Assessment Report",
      target: "Uniswap V4",
      status: "completed",
      createdAt: new Date(Date.now() - 3600000),
      downloadCount: 23,
      fileSize: "2.4 MB",
    },
    {
      id: "GEN-002",
      template: "MEV Analysis Dashboard",
      target: "Arbitrage Bot #247",
      status: "generating",
      createdAt: new Date(Date.now() - 1800000),
      progress: 67,
    },
    {
      id: "GEN-003",
      template: "Threat Intelligence Brief",
      target: "Weekly Summary",
      status: "completed",
      createdAt: new Date(Date.now() - 7200000),
      downloadCount: 156,
      fileSize: "1.8 MB",
    },
  ]);

  // Live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        ...prev,
        reportsGenerated: prev.reportsGenerated + Math.floor(Math.random() * 2),
        totalDownloads: prev.totalDownloads + Math.floor(Math.random() * 5),
        avgGenerationTime: Math.max(
          1,
          Math.min(5, prev.avgGenerationTime + (Math.random() - 0.5) * 0.3),
        ),
        threatsAnalyzed: prev.threatsAnalyzed + Math.floor(Math.random() * 10),
        dataPoints: prev.dataPoints + Math.floor(Math.random() * 100),
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Security":
        return "#ff4444";
      case "MEV":
        return "#ffaa00";
      case "Intelligence":
        return "#00ffff";
      case "DeFi":
        return "#00ff88";
      default:
        return "#666666";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#00ff88";
      case "generating":
        return "#ffaa00";
      case "failed":
        return "#ff4444";
      default:
        return "#666666";
    }
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
      {/* Animated data visualization background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Chart lines */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{
              left: `${i * 15}%`,
              top: `${20 + i * 10}%`,
              width: "300px",
              transform: `rotate(${i * 20}deg)`,
            }}
            animate={{
              opacity: [0, 0.4, 0],
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}

        {/* Data points */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              left: `${15 + (i % 5) * 18}%`,
              top: `${25 + Math.floor(i / 5) * 15}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Graph bars */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`bar-${i}`}
            className="absolute bg-gradient-to-t from-green-400/20 to-green-400/60"
            style={{
              left: `${70 + i * 4}%`,
              bottom: "20%",
              width: "20px",
              height: `${50 + Math.random() * 100}px`,
            }}
            animate={{
              height: [
                `${50 + Math.random() * 100}px`,
                `${50 + Math.random() * 100}px`,
              ],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

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
                className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-green-600"
                style={{
                  boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
                }}
              >
                <BarChart3 size={24} />
              </motion.div>
              <div>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#3b82f6",
                    margin: "0",
                    letterSpacing: "2px",
                    textShadow: "0 0 20px rgba(59, 130, 246, 0.6)",
                  }}
                >
                  INTEL REPORTS
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#999999",
                    margin: "0",
                    letterSpacing: "1px",
                  }}
                >
                  Advanced Analytics & Intelligence Reporting
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl font-bold flex items-center gap-2"
              style={{
                boxShadow: "0 0 20px rgba(0, 255, 136, 0.4)",
              }}
            >
              <Plus className="w-5 h-5" />
              Generate Report
            </motion.button>
          </div>

          {/* Live Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Reports Generated",
                value: liveStats.reportsGenerated,
                icon: FileText,
                color: "#00ffff",
              },
              {
                label: "Total Downloads",
                value: liveStats.totalDownloads,
                icon: Download,
                color: "#00ff88",
              },
              {
                label: "Active Templates",
                value: liveStats.activeTemplates,
                icon: Database,
                color: "#ffaa00",
              },
              {
                label: "Avg Gen Time",
                value: `${liveStats.avgGenerationTime.toFixed(1)}m`,
                icon: Clock,
                color: "#ff4444",
              },
              {
                label: "Threats Analyzed",
                value: liveStats.threatsAnalyzed,
                icon: Shield,
                color: "#ff6666",
              },
              {
                label: "Data Points",
                value: liveStats.dataPoints,
                icon: Target,
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

        {/* Tab Navigation */}
        <motion.div className="mb-6" variants={cardVariants}>
          <div className="flex items-center gap-4 p-2 bg-black/60 rounded-2xl border border-gray-700">
            {[
              { id: "templates", label: "Report Templates", icon: FileText },
              { id: "recent", label: "Recent Reports", icon: Clock },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "scheduled", label: "Scheduled", icon: Calendar },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-green-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow:
                    activeTab === tab.id
                      ? "0 0 20px rgba(59, 130, 246, 0.3)"
                      : "none",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Report Templates Tab */}
        {activeTab === "templates" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {reportTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  variants={cardVariants}
                  className="p-6 rounded-2xl border border-gray-700 bg-black/40 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 30px rgba(59, 130, 246, 0.2)",
                  }}
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          duration: 15,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="p-3 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${getCategoryColor(template.category)}20, ${getCategoryColor(template.category)}40)`,
                          border: `2px solid ${getCategoryColor(template.category)}60`,
                        }}
                      >
                        {template.category === "Security" ? (
                          <Shield
                            className="w-5 h-5"
                            style={{
                              color: getCategoryColor(template.category),
                            }}
                          />
                        ) : template.category === "MEV" ? (
                          <Zap
                            className="w-5 h-5"
                            style={{
                              color: getCategoryColor(template.category),
                            }}
                          />
                        ) : template.category === "Intelligence" ? (
                          <Activity
                            className="w-5 h-5"
                            style={{
                              color: getCategoryColor(template.category),
                            }}
                          />
                        ) : (
                          <PieChart
                            className="w-5 h-5"
                            style={{
                              color: getCategoryColor(template.category),
                            }}
                          />
                        )}
                      </motion.div>
                      <div>
                        <span className="text-xs font-mono text-gray-400">
                          {template.id}
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          {template.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: `${getCategoryColor(template.category)}20`,
                        color: getCategoryColor(template.category),
                        border: `1px solid ${getCategoryColor(template.category)}40`,
                      }}
                    >
                      {template.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Template Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-sm">
                        {template.estimatedTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">
                        {template.usageCount} uses
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm">
                        {template.lastUsed}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 text-sm">
                        {template.format}
                      </span>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="mb-4">
                    <span className="text-xs text-gray-400 font-mono mb-2 block">
                      Report Sections:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {template.sections.map((section) => (
                        <span
                          key={section}
                          className="px-2 py-1 rounded text-xs font-mono bg-gray-800 text-gray-300 border border-gray-600"
                        >
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl font-bold text-white"
                      style={{
                        boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      Generate Report
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Reports Tab */}
        {activeTab === "recent" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <motion.div
              className="p-6 rounded-2xl border border-gray-700 bg-black/40"
              style={{
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
              }}
              variants={cardVariants}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-cyan-400" />
                Recent Report Generation
              </h2>

              <div className="space-y-4">
                {recentReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-blue-400/50 transition-all duration-300"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={
                          report.status === "generating" ? { rotate: 360 } : {}
                        }
                        transition={{
                          duration: 2,
                          repeat: report.status === "generating" ? Infinity : 0,
                          ease: "linear",
                        }}
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getStatusColor(report.status),
                        }}
                      />

                      <div>
                        <h3 className="font-bold text-white">
                          {report.template}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{report.id}</span>
                          <span>•</span>
                          <span>Target: {report.target}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(report.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {report.status === "generating" && report.progress && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <motion.div
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${report.progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <span className="text-sm text-blue-400">
                            {report.progress}%
                          </span>
                        </div>
                      )}

                      {report.status === "completed" && (
                        <div className="text-right text-sm">
                          <p className="text-gray-400">
                            {report.downloadCount} downloads
                          </p>
                          <p className="text-white font-mono">
                            {report.fileSize}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                          disabled={report.status !== "completed"}
                        >
                          <Download className="w-4 h-4 text-white" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default IntelReports;
export { IntelReports as Reports };

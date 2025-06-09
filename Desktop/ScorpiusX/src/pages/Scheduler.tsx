import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";
import {
  Clock,
  Play,
  Pause,
  Calendar,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Zap,
  Database,
  FileText,
  Eye,
  Filter,
  Plus,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Network,
  Terminal,
  Code,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Bot,
  Brain,
  Timer,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";
import { EnhancedToast } from "@/components/ui/enhanced-toast";

const CommandMatrix = () => {
  const [activeTab, setActiveTab] = useState("jobs");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState({
    activeJobs: 23,
    successRate: 96.8,
    avgRuntime: 8.4,
    queueDepth: 7,
    nodesOnline: 12,
    totalJobs: 1847,
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

  // Initialize data
  useEffect(() => {
    const mockJobs = [
      {
        id: "JOB-001",
        name: "Contract Security Scan",
        type: "Security Analysis",
        status: "Running",
        progress: 67,
        startTime: "2024-01-15 14:30:00",
        estimatedDuration: "15 min",
        priority: "High",
        cluster: "Security-Cluster-A",
        resources: {
          cpu: 85,
          memory: 72,
          network: 45,
        },
        schedule: "0 */2 * * *",
        lastRun: "2 hours ago",
        nextRun: "in 1 hour",
      },
      {
        id: "JOB-002",
        name: "MEV Bot Monitor",
        type: "Monitoring",
        status: "Queued",
        progress: 0,
        startTime: "-",
        estimatedDuration: "5 min",
        priority: "Medium",
        cluster: "Monitor-Cluster-B",
        resources: {
          cpu: 0,
          memory: 0,
          network: 0,
        },
        schedule: "*/10 * * * *",
        lastRun: "5 minutes ago",
        nextRun: "in 5 minutes",
      },
      {
        id: "JOB-003",
        name: "Oracle Price Validation",
        type: "Validation",
        status: "Completed",
        progress: 100,
        startTime: "2024-01-15 14:15:00",
        estimatedDuration: "3 min",
        priority: "Critical",
        cluster: "Validation-Cluster-C",
        resources: {
          cpu: 0,
          memory: 0,
          network: 0,
        },
        schedule: "*/5 * * * *",
        lastRun: "2 minutes ago",
        nextRun: "in 3 minutes",
      },
    ];

    setScheduledJobs(mockJobs);
  }, []);

  // Live metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics((prev) => ({
        ...prev,
        activeJobs: Math.max(
          0,
          prev.activeJobs + (Math.random() > 0.5 ? 1 : -1),
        ),
        successRate: Math.max(
          90,
          Math.min(99, prev.successRate + (Math.random() - 0.5) * 2),
        ),
        avgRuntime: Math.max(
          1,
          Math.min(20, prev.avgRuntime + (Math.random() - 0.5) * 2),
        ),
        queueDepth: Math.max(
          0,
          prev.queueDepth + (Math.random() > 0.7 ? 1 : -1),
        ),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Running":
        return "#00ffff";
      case "Completed":
        return "#00ff88";
      case "Failed":
        return "#ff4444";
      case "Queued":
        return "#ffaa00";
      default:
        return "#666666";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "#ff4444";
      case "High":
        return "#ffaa00";
      case "Medium":
        return "#00ffff";
      default:
        return "#00ff88";
    }
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background: "#000000",
        fontFamily: "JetBrains Mono, Space Mono, monospace",
      }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "grid-move 20s linear infinite",
          }}
        />

        {/* Floating data points */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes grid-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `}
      </style>

      <motion.div
        className="max-w-7xl mx-auto p-8"
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
                className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600"
                style={{
                  boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
                }}
              >
                <Layers size={24} />
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
                  TASKS & SCHEDULE
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#999999",
                    margin: "0",
                    letterSpacing: "1px",
                  }}
                >
                  Automated Task Orchestration Center
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
              Schedule Job
            </motion.button>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Active Jobs",
                value: systemMetrics.activeJobs,
                icon: Activity,
                color: "#00ffff",
              },
              {
                label: "Success Rate",
                value: `${systemMetrics.successRate.toFixed(1)}%`,
                icon: TrendingUp,
                color: "#00ff88",
              },
              {
                label: "Avg Runtime",
                value: `${systemMetrics.avgRuntime.toFixed(1)}m`,
                icon: Timer,
                color: "#ffaa00",
              },
              {
                label: "Queue Depth",
                value: systemMetrics.queueDepth,
                icon: Layers,
                color: "#ff4444",
              },
              {
                label: "Nodes Online",
                value: systemMetrics.nodesOnline,
                icon: Server,
                color: "#ff6666",
              },
              {
                label: "Total Jobs",
                value: systemMetrics.totalJobs,
                icon: Database,
                color: "#00ffcc",
              },
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                variants={cardVariants}
                className="p-4 rounded-2xl border border-gray-700 bg-black/40"
                style={{
                  boxShadow: `0 0 20px ${metric.color}20`,
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <metric.icon
                    className="w-4 h-4"
                    style={{ color: metric.color }}
                  />
                  <span className="text-xs text-gray-400 font-mono">
                    {metric.label}
                  </span>
                </div>
                <LiveCounter
                  target={
                    typeof metric.value === "string"
                      ? metric.value
                      : metric.value
                  }
                  className="text-lg font-bold"
                  style={{ color: metric.color }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div className="mb-6" variants={cardVariants}>
          <div className="flex items-center gap-4 p-2 bg-black/60 rounded-2xl border border-gray-700">
            {[
              { id: "jobs", label: "Active Jobs", icon: Activity },
              { id: "schedule", label: "Schedule", icon: Calendar },
              { id: "history", label: "History", icon: Clock },
              { id: "clusters", label: "Clusters", icon: Server },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow:
                    activeTab === tab.id
                      ? "0 0 20px rgba(0, 255, 255, 0.3)"
                      : "none",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Job Cards */}
            <div className="space-y-4">
              {scheduledJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl border border-gray-700 bg-black/40 hover:border-cyan-500/50 transition-all duration-300"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Job Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <motion.div
                          animate={{
                            rotate: job.status === "Running" ? 360 : 0,
                          }}
                          transition={{
                            duration: 2,
                            repeat: job.status === "Running" ? Infinity : 0,
                            ease: "linear",
                          }}
                          className="p-3 rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${getStatusColor(job.status)}20, ${getStatusColor(job.status)}40)`,
                            border: `2px solid ${getStatusColor(job.status)}60`,
                          }}
                        >
                          {job.status === "Running" ? (
                            <Play
                              className="w-5 h-5"
                              style={{ color: getStatusColor(job.status) }}
                            />
                          ) : job.status === "Completed" ? (
                            <CheckCircle
                              className="w-5 h-5"
                              style={{ color: getStatusColor(job.status) }}
                            />
                          ) : job.status === "Failed" ? (
                            <AlertTriangle
                              className="w-5 h-5"
                              style={{ color: getStatusColor(job.status) }}
                            />
                          ) : (
                            <Pause
                              className="w-5 h-5"
                              style={{ color: getStatusColor(job.status) }}
                            />
                          )}
                        </motion.div>

                        {job.status === "Running" && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border-2"
                            style={{ borderColor: getStatusColor(job.status) }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {job.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{job.id}</span>
                          <span>•</span>
                          <span>{job.type}</span>
                          <span>•</span>
                          <span>{job.cluster}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: `${getPriorityColor(job.priority)}20`,
                          color: getPriorityColor(job.priority),
                          border: `1px solid ${getPriorityColor(job.priority)}40`,
                        }}
                      >
                        {job.priority}
                      </span>
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: `${getStatusColor(job.status)}20`,
                          color: getStatusColor(job.status),
                          border: `1px solid ${getStatusColor(job.status)}40`,
                        }}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {job.status === "Running" && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Progress</span>
                        <span className="text-sm font-bold text-cyan-400">
                          {job.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{
                            boxShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="text-sm font-bold text-white">
                          {job.estimatedDuration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-400">Schedule</p>
                        <p className="text-sm font-mono text-white">
                          {job.schedule}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Last Run</p>
                        <p className="text-sm text-white">{job.lastRun}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-orange-400" />
                      <div>
                        <p className="text-xs text-gray-400">Next Run</p>
                        <p className="text-sm text-white">{job.nextRun}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resource Usage */}
                  {job.status === "Running" && (
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        {
                          label: "CPU",
                          value: job.resources.cpu,
                          icon: Cpu,
                          color: "#00ffff",
                        },
                        {
                          label: "Memory",
                          value: job.resources.memory,
                          icon: HardDrive,
                          color: "#00ff88",
                        },
                        {
                          label: "Network",
                          value: job.resources.network,
                          icon: Network,
                          color: "#ffaa00",
                        },
                      ].map((resource) => (
                        <div key={resource.label} className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <resource.icon
                              className="w-3 h-3"
                              style={{ color: resource.color }}
                            />
                            <span className="text-xs text-gray-400">
                              {resource.label}
                            </span>
                          </div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: resource.color }}
                          >
                            {resource.value}%
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1 mt-1">
                            <motion.div
                              className="h-1 rounded-full"
                              style={{
                                backgroundColor: resource.color,
                                boxShadow: `0 0 5px ${resource.color}`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${resource.value}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CommandMatrix;
export { CommandMatrix as Scheduler };

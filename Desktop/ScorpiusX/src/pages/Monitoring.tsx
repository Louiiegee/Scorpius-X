import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Shield,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Bell,
  BarChart3,
  Users,
  Wifi,
  Gauge,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";
import { EnhancedToast } from "@/components/ui/enhanced-toast";

const Monitoring = () => {
  const [activeTab, setActiveTab] = useState("services");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);

  // Real-time data states
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: 99.97,
    responseTime: 234,
    errorRate: 0.03,
    throughput: 12400,
  });

  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Motion values for animated counters
  const uptimeValue = useMotionValue(0);
  const responseTimeValue = useMotionValue(0);
  const errorRateValue = useMotionValue(0);
  const throughputValue = useMotionValue(0);

  // Generate real-time performance data
  const generatePerformanceData = () => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => {
      const timestamp = now - (19 - i) * 30000;
      const time = new Date(timestamp);
      return {
        time: time.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        uptime: 99.85 + Math.random() * 0.15,
        responseTime: 150 + Math.random() * 100,
        throughput: 10000 + Math.random() * 5000,
        errorRate: 0.01 + Math.random() * 0.05,
        cpuUsage: 20 + Math.random() * 60,
        memoryUsage: 30 + Math.random() * 50,
        networkLoad: 10 + Math.random() * 40,
      };
    });
  };

  const services = [
    {
      name: "Smart Contract Scanner",
      status: "Online",
      uptime: "99.99%",
      lastCheck: "30s ago",
      responseTime: "156ms",
      instances: 3,
      version: "v2.1.4",
      cpu: 23,
      memory: 45,
      requests: "1.2K/min",
      location: "US-East",
      priority: "critical",
      health: "excellent",
    },
    {
      name: "MEV Bot Orchestrator",
      status: "Online",
      uptime: "99.95%",
      lastCheck: "15s ago",
      responseTime: "89ms",
      instances: 5,
      version: "v1.8.2",
      cpu: 67,
      memory: 78,
      requests: "3.4K/min",
      location: "EU-West",
      priority: "critical",
      health: "good",
    },
    {
      name: "Mempool Monitor",
      status: "Warning",
      uptime: "98.76%",
      lastCheck: "45s ago",
      responseTime: "445ms",
      instances: 2,
      version: "v3.0.1",
      cpu: 89,
      memory: 92,
      requests: "8.7K/min",
      location: "Asia-Pacific",
      priority: "high",
      health: "degraded",
    },
    {
      name: "Time Machine Service",
      status: "Online",
      uptime: "99.87%",
      lastCheck: "12s ago",
      responseTime: "234ms",
      instances: 2,
      version: "v1.5.0",
      cpu: 34,
      memory: 56,
      requests: "456/min",
      location: "US-West",
      priority: "medium",
      health: "good",
    },
    {
      name: "Security Analyzer",
      status: "Maintenance",
      uptime: "97.23%",
      lastCheck: "2m ago",
      responseTime: "1.2s",
      instances: 1,
      version: "v2.3.1",
      cpu: 12,
      memory: 28,
      requests: "89/min",
      location: "EU-Central",
      priority: "medium",
      health: "maintenance",
    },
    {
      name: "Bug Bounty API",
      status: "Online",
      uptime: "99.99%",
      lastCheck: "5s ago",
      responseTime: "67ms",
      instances: 4,
      version: "v1.9.0",
      cpu: 18,
      memory: 32,
      requests: "234/min",
      location: "Multi-Region",
      priority: "high",
      health: "excellent",
    },
  ];

  const alerts = [
    {
      id: "ALERT-001",
      severity: "Critical",
      service: "Mempool Monitor",
      message: "High CPU usage detected (89%)",
      timestamp: "2m ago",
      status: "Active",
      type: "Performance",
      affected: "Asia-Pacific Region",
      details: "CPU utilization exceeded 85% threshold for 5+ minutes",
    },
    {
      id: "ALERT-002",
      severity: "Warning",
      service: "Security Analyzer",
      message: "Service in maintenance mode",
      timestamp: "15m ago",
      status: "Acknowledged",
      type: "Maintenance",
      affected: "EU-Central Region",
      details: "Scheduled maintenance window - expected completion: 3h",
    },
    {
      id: "ALERT-003",
      severity: "Info",
      service: "MEV Bot Orchestrator",
      message: "New version deployed successfully",
      timestamp: "1h ago",
      status: "Resolved",
      type: "Deployment",
      affected: "All Regions",
      details: "Version v1.8.2 deployed with performance improvements",
    },
    {
      id: "ALERT-004",
      severity: "Warning",
      service: "Smart Contract Scanner",
      message: "Queue backlog detected",
      timestamp: "3h ago",
      status: "Resolved",
      type: "Performance",
      affected: "US-East Region",
      details: "Scan queue backlog resolved - processing normalized",
    },
  ];

  const infrastructure = [
    {
      component: "Load Balancer",
      status: "Healthy",
      connections: "2,456",
      throughput: "45.2 Mbps",
      regions: ["US-East", "EU-West", "Asia-Pacific"],
      cpu: 15,
      memory: 32,
      latency: "12ms",
    },
    {
      component: "Database Cluster",
      status: "Healthy",
      connections: "89/100",
      throughput: "1.2K ops/s",
      regions: ["Primary", "Replica-1", "Replica-2"],
      cpu: 45,
      memory: 67,
      latency: "8ms",
    },
    {
      component: "Cache Layer",
      status: "Warning",
      connections: "456/500",
      throughput: "12.4K ops/s",
      regions: ["Redis-1", "Redis-2", "Redis-3"],
      cpu: 78,
      memory: 84,
      latency: "3ms",
    },
    {
      component: "Message Queue",
      status: "Healthy",
      connections: "234",
      throughput: "567 msg/s",
      regions: ["Queue-1", "Queue-2", "DLQ"],
      cpu: 22,
      memory: 28,
      latency: "5ms",
    },
  ];

  // Initialize data
  useEffect(() => {
    setPerformanceData(generatePerformanceData());

    // Set initial motion values
    uptimeValue.set(systemMetrics.uptime);
    responseTimeValue.set(systemMetrics.responseTime);
    errorRateValue.set(systemMetrics.errorRate);
    throughputValue.set(systemMetrics.throughput);
  }, []);

  // Real-time data updates
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      // Update performance data
      setPerformanceData((prev) => {
        const newData = [...prev.slice(1)];
        const lastTime = new Date(Date.now());
        newData.push({
          time: lastTime.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          uptime: 99.85 + Math.random() * 0.15,
          responseTime: 150 + Math.random() * 100,
          throughput: 10000 + Math.random() * 5000,
          errorRate: 0.01 + Math.random() * 0.05,
          cpuUsage: 20 + Math.random() * 60,
          memoryUsage: 30 + Math.random() * 50,
          networkLoad: 10 + Math.random() * 40,
        });
        return newData;
      });

      // Update system metrics
      setSystemMetrics((prev) => ({
        ...prev,
        responseTime: 200 + Math.random() * 100,
        throughput: 10000 + Math.random() * 5000,
        errorRate: 0.01 + Math.random() * 0.05,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
      case "healthy":
        return "#00ff88";
      case "warning":
        return "#ffaa00";
      case "maintenance":
      case "degraded":
        return "#00ffff";
      case "offline":
      case "error":
        return "#ff4444";
      default:
        return "#666666";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "#00ff88";
      case "good":
        return "#00ffff";
      case "degraded":
        return "#ffaa00";
      case "critical":
        return "#ff4444";
      case "maintenance":
        return "#ff6666";
      default:
        return "#666666";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "#ff4444";
      case "warning":
        return "#ffaa00";
      case "info":
        return "#00ffff";
      default:
        return "#666666";
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return "#ff4444";
    if (usage >= 70) return "#ffaa00";
    if (usage >= 50) return "#00ffff";
    return "#00ff88";
  };

  const addNotification = (
    message: string,
    type: "success" | "error" | "info",
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
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

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: { duration: 2, repeat: Infinity },
    },
  };

  return (
    <>
      {/* Enhanced Toast Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <EnhancedToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() =>
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id),
              )
            }
          />
        ))}
      </AnimatePresence>

      <motion.div
        className="min-h-screen bg-bg text-white p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{
          fontFamily: "JetBrains Mono, Space Mono, monospace",
          background: "#000000",
        }}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex justify-between items-center mb-4">
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
                className="p-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-green-600"
                style={{
                  boxShadow: "0 0 30px rgba(0, 255, 136, 0.5)",
                }}
              >
                <Activity size={24} />
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
                  HEALTH & MONITOR
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#999999",
                    margin: "0",
                    letterSpacing: "1px",
                  }}
                >
                  PulseGrid - Real-time System Health & Performance Monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="border-2 border-[#ffaa00] bg-transparent text-[#ffaa00] hover:bg-[#ffaa00] hover:text-black transition-all duration-300"
                style={{
                  boxShadow: "0 0 15px rgba(255, 170, 0, 0.3)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  addNotification("Alert settings updated", "info")
                }
              >
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
              <Button
                variant="outline"
                className="border-2 border-[#00ffff] bg-transparent text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-300"
                style={{
                  boxShadow: "0 0 15px rgba(0, 255, 255, 0.3)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90 font-mono font-bold transition-all duration-300"
                style={{
                  boxShadow: "0 0 20px rgba(0, 255, 136, 0.4)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsLiveMode(!isLiveMode);
                  addNotification(
                    isLiveMode ? "Live mode disabled" : "Live mode enabled",
                    "info",
                  );
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isLiveMode ? "Live" : "Refresh"}
              </Button>
            </div>
          </div>

          <motion.div
            className="text-gray-400 text-lg font-mono"
            variants={itemVariants}
          >
            Real-time system health and performance monitoring • Grid Control
          </motion.div>
        </motion.div>

        {/* System Metrics Dashboard */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
        >
          {[
            {
              title: "System Uptime",
              value: systemMetrics.uptime,
              suffix: "%",
              change: "+0.02%",
              trend: "up",
              icon: CheckCircle,
              color: "#00ff88",
              motionValue: uptimeValue,
            },
            {
              title: "Response Time",
              value: systemMetrics.responseTime,
              suffix: "ms",
              change: "-15ms",
              trend: "down",
              icon: Clock,
              color: "#00ffff",
              motionValue: responseTimeValue,
            },
            {
              title: "Error Rate",
              value: systemMetrics.errorRate,
              suffix: "%",
              change: "+0.01%",
              trend: "up",
              icon: AlertTriangle,
              color: "#ffaa00",
              motionValue: errorRateValue,
              decimals: 2,
            },
            {
              title: "Throughput",
              value: Math.floor(systemMetrics.throughput / 1000),
              suffix: "K/s",
              change: "+2.1K",
              trend: "up",
              icon: Activity,
              color: "#00ffff",
              motionValue: throughputValue,
            },
          ].map((metric, index) => (
            <motion.div
              key={metric.title}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                y: -5,
                transition: { type: "spring", stiffness: 400 },
              }}
              className="bg-surface border-2 border-[#333] rounded-2xl p-6 text-center hover:border-[#00ffff] transition-all duration-300 group"
              style={{
                background:
                  "linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%)",
                backdropFilter: "blur(10px)",
                boxShadow:
                  "0 8px 32px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
              }}
            >
              <motion.div
                className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${metric.color}20, ${metric.color}40)`,
                  border: `2px solid ${metric.color}60`,
                  boxShadow: `0 0 20px ${metric.color}30`,
                }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <metric.icon
                  className="w-7 h-7"
                  style={{ color: metric.color }}
                />
              </motion.div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div
                  className="text-2xl font-bold font-mono"
                  style={{ color: metric.color }}
                >
                  <LiveCounter
                    value={metric.value}
                    suffix={metric.suffix}
                    decimals={metric.decimals}
                    duration={1500}
                  />
                </motion.div>
                <motion.div
                  className={`text-sm flex items-center gap-1 font-mono ${
                    metric.trend === "up" ? "text-[#00ff88]" : "text-[#00ff88]"
                  }`}
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(0, 255, 136, 0.6))",
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {metric.change}
                </motion.div>
              </div>
              <div className="text-gray-400 text-sm font-mono uppercase tracking-wider">
                {metric.title}
              </div>

              {/* Real-time mini chart */}
              <div className="mt-4 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-full h-full" viewBox="0 0 200 48">
                  <defs>
                    <linearGradient
                      id={`gradient-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor={`${metric.color}30`} />
                      <stop offset="50%" stopColor={`${metric.color}80`} />
                      <stop offset="100%" stopColor={`${metric.color}30`} />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke={`url(#gradient-${index})`}
                    strokeWidth="2"
                    points={performanceData
                      .slice(-10)
                      .map((point, i) => {
                        const x = (i / 9) * 180 + 10;
                        const y = 40 - Math.random() * 30;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    style={{
                      filter: `drop-shadow(0 0 4px ${metric.color}60)`,
                    }}
                  />
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="bg-surface border-2 border-[#333] rounded-3xl p-6"
          variants={itemVariants}
          style={{
            background:
              "linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow:
              "0 8px 32px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6">
            {[
              { id: "services", label: "Services", icon: Server },
              { id: "infrastructure", label: "Infrastructure", icon: Database },
              { id: "alerts", label: "Alerts", icon: AlertTriangle },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-2xl font-mono font-bold transition-all duration-300 flex items-center gap-3 ${
                  activeTab === tab.id
                    ? "bg-[#00ffff] text-black"
                    : "bg-[#2a2a2a] text-[#00ffff] hover:bg-[#00ffff20]"
                }`}
                style={{
                  boxShadow:
                    activeTab === tab.id
                      ? "0 0 20px rgba(0, 255, 255, 0.6)"
                      : "0 0 10px rgba(0, 255, 255, 0.2)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  variants={containerVariants}
                >
                  {services.map((service, index) => (
                    <motion.div
                      key={service.name}
                      variants={itemVariants}
                      whileHover={{
                        scale: 1.02,
                        y: -5,
                        transition: { type: "spring", stiffness: 400 },
                      }}
                      className="relative p-6 rounded-2xl group cursor-pointer"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%)",
                        border: `2px solid ${getStatusColor(service.status)}40`,
                        borderLeft: `6px solid ${getStatusColor(service.status)}`,
                        backdropFilter: "blur(10px)",
                        boxShadow: `0 8px 32px rgba(${getStatusColor(service.status)}, 0.1)`,
                      }}
                      onClick={() => setSelectedService(service)}
                    >
                      {/* Status Indicators */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <motion.div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getStatusColor(service.status),
                            boxShadow: `0 0 10px ${getStatusColor(service.status)}`,
                          }}
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getHealthColor(service.health),
                            boxShadow: `0 0 8px ${getHealthColor(service.health)}`,
                          }}
                        />
                      </div>

                      {/* Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${getStatusColor(service.status)}20, ${getStatusColor(service.status)}40)`,
                            border: `2px solid ${getStatusColor(service.status)}60`,
                            boxShadow: `0 0 15px ${getStatusColor(service.status)}30`,
                          }}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Server
                            className="w-6 h-6"
                            style={{ color: getStatusColor(service.status) }}
                          />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white font-mono">
                            {service.name}
                          </h3>
                          <div className="text-sm text-gray-400 font-mono">
                            {service.version} • {service.instances} instances •{" "}
                            {service.location}
                          </div>
                        </div>
                      </div>

                      {/* Status Tags */}
                      <div className="flex gap-2 mb-4">
                        <motion.span
                          className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                          style={{
                            backgroundColor: `${getStatusColor(service.status)}20`,
                            color: getStatusColor(service.status),
                            border: `1px solid ${getStatusColor(service.status)}60`,
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {service.status}
                        </motion.span>
                        <motion.span
                          className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                          style={{
                            backgroundColor: `${getHealthColor(service.health)}20`,
                            color: getHealthColor(service.health),
                            border: `1px solid ${getHealthColor(service.health)}60`,
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {service.health}
                        </motion.span>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm font-mono">
                        <div>
                          <span className="text-gray-400">Uptime:</span>
                          <div className="text-white font-bold">
                            {service.uptime}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Response:</span>
                          <div className="text-white font-bold">
                            {service.responseTime}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Requests:</span>
                          <div className="text-white font-bold">
                            {service.requests}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Check:</span>
                          <div className="text-white font-bold">
                            {service.lastCheck}
                          </div>
                        </div>
                      </div>

                      {/* Resource Usage */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400 font-mono">
                              CPU Usage
                            </span>
                            <span
                              className={`font-mono font-bold ${getUsageColor(service.cpu)}`}
                            >
                              {service.cpu}%
                            </span>
                          </div>
                          <div
                            className="w-full bg-[#1a1a1a] rounded-full h-2 border border-[#333]"
                            style={{
                              boxShadow: "inset 0 0 8px rgba(0, 0, 0, 0.5)",
                            }}
                          >
                            <motion.div
                              className="h-2 rounded-full transition-all duration-1000"
                              style={{
                                width: `${service.cpu}%`,
                                background:
                                  service.cpu >= 90
                                    ? "linear-gradient(90deg, #ff4444, #ff6666)"
                                    : service.cpu >= 70
                                      ? "linear-gradient(90deg, #ffaa00, #ffcc44)"
                                      : "linear-gradient(90deg, #00ff88, #00ffcc)",
                                boxShadow:
                                  service.cpu >= 90
                                    ? "0 0 8px rgba(255, 68, 68, 0.6)"
                                    : service.cpu >= 70
                                      ? "0 0 8px rgba(255, 170, 0, 0.6)"
                                      : "0 0 12px rgba(0, 255, 136, 0.6)",
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${service.cpu}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400 font-mono">
                              Memory Usage
                            </span>
                            <span
                              className={`font-mono font-bold ${getUsageColor(service.memory)}`}
                            >
                              {service.memory}%
                            </span>
                          </div>
                          <div
                            className="w-full bg-[#1a1a1a] rounded-full h-2 border border-[#333]"
                            style={{
                              boxShadow: "inset 0 0 8px rgba(0, 0, 0, 0.5)",
                            }}
                          >
                            <motion.div
                              className="h-2 rounded-full transition-all duration-1000"
                              style={{
                                width: `${service.memory}%`,
                                background:
                                  service.memory >= 90
                                    ? "linear-gradient(90deg, #ff4444, #ff6666)"
                                    : service.memory >= 70
                                      ? "linear-gradient(90deg, #ffaa00, #ffcc44)"
                                      : "linear-gradient(90deg, #00ffff, #66ddff)",
                                boxShadow:
                                  service.memory >= 90
                                    ? "0 0 8px rgba(255, 68, 68, 0.6)"
                                    : service.memory >= 70
                                      ? "0 0 8px rgba(255, 170, 0, 0.6)"
                                      : "0 0 12px rgba(0, 255, 255, 0.6)",
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${service.memory}%` }}
                              transition={{
                                duration: 1,
                                delay: index * 0.1 + 0.2,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[#333]">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-2 border-[#00ffff] bg-transparent text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-300"
                          style={{
                            boxShadow: "0 0 8px rgba(0, 255, 255, 0.2)",
                          }}
                        >
                          <Eye className="w-3 h-3 mr-2" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 border-[#00ffff] bg-transparent text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-300"
                          style={{
                            boxShadow: "0 0 8px rgba(0, 255, 255, 0.2)",
                          }}
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 border-[#00ffff] bg-transparent text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-300"
                          style={{
                            boxShadow: "0 0 8px rgba(0, 255, 255, 0.2)",
                          }}
                        >
                          <BarChart3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeTab === "infrastructure" && (
              <motion.div
                key="infrastructure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <motion.div
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  variants={containerVariants}
                >
                  {infrastructure.map((component, index) => (
                    <motion.div
                      key={component.component}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="p-6 rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%)",
                        border: `2px solid ${getStatusColor(component.status)}40`,
                        borderLeft: `6px solid ${getStatusColor(component.status)}`,
                        backdropFilter: "blur(10px)",
                        boxShadow: `0 8px 32px rgba(${getStatusColor(component.status)}, 0.1)`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${getStatusColor(component.status)}20, ${getStatusColor(component.status)}40)`,
                              border: `2px solid ${getStatusColor(component.status)}60`,
                            }}
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                          >
                            {component.component.includes("Database") ? (
                              <Database
                                className="w-5 h-5"
                                style={{
                                  color: getStatusColor(component.status),
                                }}
                              />
                            ) : component.component.includes("Load") ? (
                              <Network
                                className="w-5 h-5"
                                style={{
                                  color: getStatusColor(component.status),
                                }}
                              />
                            ) : component.component.includes("Cache") ? (
                              <Zap
                                className="w-5 h-5"
                                style={{
                                  color: getStatusColor(component.status),
                                }}
                              />
                            ) : (
                              <Activity
                                className="w-5 h-5"
                                style={{
                                  color: getStatusColor(component.status),
                                }}
                              />
                            )}
                          </motion.div>
                          <div>
                            <h3 className="font-semibold text-white font-mono">
                              {component.component}
                            </h3>
                          </div>
                        </div>
                        <motion.span
                          className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                          style={{
                            backgroundColor: `${getStatusColor(component.status)}20`,
                            color: getStatusColor(component.status),
                            border: `1px solid ${getStatusColor(component.status)}60`,
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {component.status}
                        </motion.span>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm font-mono">
                        <div>
                          <span className="text-gray-400">Connections:</span>
                          <div className="text-white font-bold">
                            {component.connections}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Throughput:</span>
                          <div className="text-white font-bold">
                            {component.throughput}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">CPU:</span>
                          <div
                            className={`font-bold ${getUsageColor(component.cpu)}`}
                          >
                            {component.cpu}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Latency:</span>
                          <div className="text-white font-bold">
                            {component.latency}
                          </div>
                        </div>
                      </div>

                      {/* Resource Usage Bars */}
                      <div className="space-y-2 mb-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">CPU</span>
                            <span className={getUsageColor(component.cpu)}>
                              {component.cpu}%
                            </span>
                          </div>
                          <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                            <motion.div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${component.cpu}%`,
                                background: `linear-gradient(90deg, ${getUsageColor(component.cpu)}, ${getUsageColor(component.cpu)}aa)`,
                                boxShadow: `0 0 6px ${getUsageColor(component.cpu)}60`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${component.cpu}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Memory</span>
                            <span className={getUsageColor(component.memory)}>
                              {component.memory}%
                            </span>
                          </div>
                          <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                            <motion.div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${component.memory}%`,
                                background: `linear-gradient(90deg, ${getUsageColor(component.memory)}, ${getUsageColor(component.memory)}aa)`,
                                boxShadow: `0 0 6px ${getUsageColor(component.memory)}60`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${component.memory}%` }}
                              transition={{
                                duration: 1,
                                delay: index * 0.1 + 0.2,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Regions */}
                      <div className="pt-2 border-t border-[#333]">
                        <span className="text-gray-400 font-mono text-sm">
                          Regions:
                        </span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {component.regions.map((region, regionIndex) => (
                            <motion.span
                              key={regionIndex}
                              className="px-2 py-1 text-xs bg-[#00ffff]/20 text-[#00ffff] rounded-lg font-mono border border-[#00ffff]/40"
                              whileHover={{ scale: 1.1 }}
                            >
                              {region}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeTab === "alerts" && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white font-mono">
                    System Alerts
                  </h3>
                  <div className="flex gap-2">
                    <motion.span
                      className="px-3 py-1 rounded-full text-xs font-bold bg-[#ff4444]/20 text-[#ff4444] border border-[#ff4444]/60 font-mono"
                      whileHover={{ scale: 1.1 }}
                    >
                      1 Critical
                    </motion.span>
                    <motion.span
                      className="px-3 py-1 rounded-full text-xs font-bold bg-[#ffaa00]/20 text-[#ffaa00] border border-[#ffaa00]/60 font-mono"
                      whileHover={{ scale: 1.1 }}
                    >
                      2 Warnings
                    </motion.span>
                  </div>
                </div>

                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, x: 10 }}
                    className="p-6 rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%)",
                      border: `2px solid ${getSeverityColor(alert.severity)}40`,
                      borderLeft: `6px solid ${getSeverityColor(alert.severity)}`,
                      backdropFilter: "blur(10px)",
                      boxShadow: `0 8px 32px rgba(${getSeverityColor(alert.severity)}, 0.1)`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <motion.div
                          className="mt-1"
                          animate={
                            alert.severity === "Critical"
                              ? { scale: [1, 1.2, 1] }
                              : {}
                          }
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <AlertTriangle
                            className="w-5 h-5"
                            style={{ color: getSeverityColor(alert.severity) }}
                          />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-white font-mono">
                              {alert.message}
                            </h4>
                            <motion.span
                              className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                              style={{
                                backgroundColor: `${getSeverityColor(alert.severity)}20`,
                                color: getSeverityColor(alert.severity),
                                border: `1px solid ${getSeverityColor(alert.severity)}60`,
                              }}
                              whileHover={{ scale: 1.1 }}
                            >
                              {alert.severity}
                            </motion.span>
                          </div>
                          <div className="text-sm text-gray-400 font-mono mb-2">
                            {alert.id} • {alert.service} • {alert.type} •{" "}
                            {alert.timestamp}
                          </div>
                          <div className="text-sm text-gray-300 font-mono mb-2">
                            <span className="text-gray-400">Affected:</span>{" "}
                            {alert.affected}
                          </div>
                          <div className="text-sm text-gray-300 font-mono">
                            {alert.details}
                          </div>
                        </div>
                      </div>
                      <motion.span
                        className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                        style={{
                          backgroundColor:
                            alert.status === "Active"
                              ? "#ff444420"
                              : alert.status === "Acknowledged"
                                ? "#ffaa0020"
                                : "#00ff8820",
                          color:
                            alert.status === "Active"
                              ? "#ff4444"
                              : alert.status === "Acknowledged"
                                ? "#ffaa00"
                                : "#00ff88",
                          border:
                            alert.status === "Active"
                              ? "1px solid #ff444460"
                              : alert.status === "Acknowledged"
                                ? "1px solid #ffaa0060"
                                : "1px solid #00ff8860",
                        }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {alert.status}
                      </motion.span>
                    </div>

                    {alert.status === "Active" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 border-[#ffaa00] bg-transparent text-[#ffaa00] hover:bg-[#ffaa00] hover:text-black transition-all duration-300"
                          style={{
                            boxShadow: "0 0 8px rgba(255, 170, 0, 0.3)",
                          }}
                          onClick={() =>
                            addNotification("Alert acknowledged", "info")
                          }
                        >
                          <CheckCircle className="w-3 h-3 mr-2" />
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 border-[#00ff88] bg-transparent text-[#00ff88] hover:bg-[#00ff88] hover:text-black transition-all duration-300"
                          style={{
                            boxShadow: "0 0 8px rgba(0, 255, 136, 0.3)",
                          }}
                          onClick={() =>
                            addNotification("Alert resolved", "success")
                          }
                        >
                          <XCircle className="w-3 h-3 mr-2" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Monitoring;

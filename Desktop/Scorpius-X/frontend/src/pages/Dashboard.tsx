import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Shield,
  Bot,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Zap,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  RefreshCw,
  Download,
  Bell,
  BellOff,
  Target,
  Binary,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  MapPin,
  Video,
  MessageSquare,
  UserPlus,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";
import { MetricCard } from "@/components/ui/metric-card";
import { ScrollReveal, StaggeredReveal } from "@/components/ui/scroll-reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDashboardData } from "@/hooks/useStorage";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    data: dashboardData,
    update,
    addAlert,
    addActivity,
    markAlertRead,
    removeAlert,
    removeActivity,
  } = useDashboardData();

  const [isLive, setIsLive] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const hasInitialized = useRef(false);

  // Initialize stats if empty (first time user) - run only once
  useEffect(() => {
    if (hasInitialized.current) return;

    const isUninitialized =
      dashboardData.stats.threatsDetected === 0 &&
      dashboardData.stats.systemUptime === 0 &&
      !dashboardData.stats.lastScanTime;

    if (isUninitialized) {
      update({
        stats: {
          threatsDetected: 0,
          activeScans: 0,
          activeBots: 0,
          lastScanTime: new Date().toISOString(),
          systemUptime: 0,
        },
      });
    }

    hasInitialized.current = true;
  }, []); // Empty dependency array to run only once

  // Simulate real-time updates when live monitoring is enabled
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const currentStats = dashboardData.stats;

      // Small incremental updates to simulate real activity
      const newStats = {
        ...currentStats,
        systemUptime: currentStats.systemUptime + 5, // 5 seconds per update
        // Only occasionally increment other stats to keep things realistic
        threatsDetected:
          Math.random() < 0.1
            ? currentStats.threatsDetected + 1
            : currentStats.threatsDetected,
        activeScans: Math.max(
          0,
          currentStats.activeScans +
          (Math.random() < 0.2 ? (Math.random() < 0.5 ? 1 : -1) : 0),
        ),
        activeBots: Math.max(
          0,
          currentStats.activeBots +
          (Math.random() < 0.15 ? (Math.random() < 0.6 ? 1 : -1) : 0),
        ),
      };

      update({ stats: newStats });

      // Occasionally add new activity or alerts
      if (Math.random() < 0.05) {
        // 5% chance every 5 seconds
        const activities = [
          {
            action: "Smart Contract Scan",
            target: `Contract 0x${Math.random().toString(16).substr(2, 8)}`,
            result: "Completed",
          },
          {
            action: "MEV Opportunity",
            target: `Pool ${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            result: "Detected",
          },
          {
            action: "Threat Detection",
            target: `Address 0x${Math.random().toString(16).substr(2, 8)}`,
            result: "Flagged",
          },
          {
            action: "System Health Check",
            target: "All Services",
            result: "Healthy",
          },
          {
            action: "Network Scan",
            target: "Ethereum Mainnet",
            result: "Monitoring",
          },
        ];
        const activity =
          activities[Math.floor(Math.random() * activities.length)];
        addActivity(activity);
      }

      if (Math.random() < 0.03) {
        // 3% chance for alerts
        const alertTypes = [
          {
            type: "warning" as const,
            title: "High Gas Prices Detected",
            message: "Gas prices above 100 gwei",
          },
          {
            type: "info" as const,
            title: "New MEV Opportunity",
            message: "Arbitrage opportunity detected",
          },
          {
            type: "critical" as const,
            title: "Suspicious Transaction",
            message: "Potential front-running attack",
          },
          {
            type: "info" as const,
            title: "System Update",
            message: "Database optimization completed",
          },
        ];
        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        addAlert(alert);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLive, dashboardData.stats, update, addActivity, addAlert]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatTime = (timeString: string): string => {
    return new Date(timeString).toLocaleTimeString();
  };

  const getAlertColor = (type: string): string => {
    switch (type) {
      case "critical":
        return "text-red-400 border-red-500/30";
      case "warning":
        return "text-yellow-400 border-yellow-500/30";
      case "info":
        return "text-blue-400 border-blue-500/30";
      default:
        return "text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
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
            >
              <LayoutDashboard size={24} className="text-red-500" />
            </motion.div>
            <h1
              className="text-white font-mono"
              style={{
                fontSize: "32px",
                fontWeight: "700",
                letterSpacing: "2px",
                textShadow: "0 0 20px rgba(255, 68, 68, 0.6)",
              }}
            >
              THREAT INTELLIGENCE
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={`border-red-500/30 ${isLive ? "text-red-400" : "text-gray-400"}`}
            >
              {isLive ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isLive ? "Live" : "Paused"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="border-red-500/30 text-red-400"
            >
              {showNotifications ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <StaggeredReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="THREATS DETECTED"
              value={dashboardData.stats.threatsDetected}
              icon={<Shield className="w-5 h-5" />}
              color="red"
              trend={dashboardData.stats.threatsDetected > 0 ? "up" : "neutral"}
            />
            <MetricCard
              title="ACTIVE SCANS"
              value={dashboardData.stats.activeScans}
              icon={<Activity className="w-5 h-5" />}
              color="blue"
              trend={dashboardData.stats.activeScans > 0 ? "up" : "neutral"}
            />
            <MetricCard
              title="MEV BOTS"
              value={dashboardData.stats.activeBots}
              icon={<Bot className="w-5 h-5" />}
              color="green"
              trend={dashboardData.stats.activeBots > 0 ? "up" : "neutral"}
            />
            <MetricCard
              title="SYSTEM UPTIME"
              value={formatUptime(dashboardData.stats.systemUptime)}
              icon={<Clock className="w-5 h-5" />}
              color="purple"
              trend="up"
              isText
            />
          </div>
        </StaggeredReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <ScrollReveal>
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  RECENT ACTIVITY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activity recorded yet</p>
                      <p className="text-sm">
                        Activity will appear here when you start using the
                        platform
                      </p>
                    </div>
                  ) : (
                    dashboardData.recentActivity.slice(0, 5).map((activity) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded border-l-2 border-blue-500/50"
                      >
                        <div>
                          <div className="text-white font-medium">
                            {activity.action}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {activity.target}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className="text-green-400 border-green-500/30"
                          >
                            {activity.result}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime(activity.timestamp)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Security Alerts */}
          <ScrollReveal>
            <Card className="bg-black/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  SECURITY ALERTS
                  {dashboardData.alerts.filter((a) => !a.read).length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {dashboardData.alerts.filter((a) => !a.read).length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No security alerts</p>
                      <p className="text-sm">Your system is secure</p>
                    </div>
                  ) : (
                    dashboardData.alerts.slice(0, 5).map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 bg-gray-900/50 rounded border-l-2 ${getAlertColor(alert.type)} ${alert.read ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{alert.title}</div>
                            <div className="text-sm text-gray-400">
                              {alert.message}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(alert.timestamp)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!alert.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAlertRead(alert.id)}
                                className="text-green-400 hover:bg-green-500/10"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAlert(alert.id)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        {/* Quick Actions */}
        <ScrollReveal>
          <Card className="bg-black/50 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 font-mono">
                QUICK ACTIONS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => navigate("/scanner")}
                  className="h-20 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 flex-col gap-2"
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-sm">Smart Contract Scanner</span>
                </Button>
                <Button
                  onClick={() => navigate("/mev")}
                  className="h-20 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 flex-col gap-2"
                >
                  <Bot className="h-6 w-6" />
                  <span className="text-sm">MEV Operations</span>
                </Button>
                <Button
                  onClick={() => navigate("/mempool")}
                  className="h-20 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 flex-col gap-2"
                >
                  <Activity className="h-6 w-6" />
                  <span className="text-sm">Mempool Monitor</span>
                </Button>
                <Button
                  onClick={() => navigate("/trapgrid")}
                  className="h-20 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 flex-col gap-2"
                >
                  <Target className="h-6 w-6" />
                  <span className="text-sm">TrapGrid</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* System Status */}
        <ScrollReveal>
          <Card className="bg-black/50 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 font-mono">
                SYSTEM STATUS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Scanner Service</span>
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-500/30"
                    >
                      Online
                    </Badge>
                  </div>
                  <Progress value={95} className="h-2" />
                  <div className="text-xs text-gray-500">95% efficiency</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">MEV Monitoring</span>
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-500/30"
                    >
                      Active
                    </Badge>
                  </div>
                  <Progress value={87} className="h-2" />
                  <div className="text-xs text-gray-500">87% coverage</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Threat Detection</span>
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-500/30"
                    >
                      Monitoring
                    </Badge>
                  </div>
                  <Progress value={92} className="h-2" />
                  <div className="text-xs text-gray-500">92% real-time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
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
  BarChart3,
  LineChart,
  PieChart,
  Radar,
  Network,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";
import { MetricCard } from "@/components/ui/metric-card";
import { ScrollReveal, StaggeredReveal } from "@/components/ui/scroll-reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDashboardData } from "@/hooks/useStorage";
import { useWebSocket } from "@/hooks/useWebSocket";
import WebChat from "@/components/WebChat";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    data: dashboardData,
    updateStats,
    addAlert,
    addActivity,
    markAlertRead,
    removeAlert,
    removeActivity,
  } = useDashboardData();
  const { liveMetrics, isConnected, websocket, sendCustomMessage } =
    useWebSocket();

  const [isLive, setIsLive] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);

  // Chart data states
  const [threatData, setThreatData] = useState<number[]>([]);
  const [networkData, setNetworkData] = useState<number[]>([]);
  const [performanceData, setPerformanceData] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState({
    firewall: 98,
    encryption: 95,
    monitoring: 92,
    compliance: 89,
    vulnerability: 94,
    authentication: 96,
  });
  const [networkActivity, setNetworkActivity] = useState([
    { name: "Ethereum", value: 45, color: "#00ff88" },
    { name: "Polygon", value: 25, color: "#8b5cf6" },
    { name: "BSC", value: 15, color: "#f59e0b" },
    { name: "Arbitrum", value: 10, color: "#06b6d4" },
    { name: "Avalanche", value: 5, color: "#ef4444" },
  ]);

  // Initialize chart data
  useEffect(() => {
    const now = new Date();
    const initialTimeLabels = Array.from({ length: 20 }, (_, i) => {
      const time = new Date(now.getTime() - (19 - i) * 60000);
      return time.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    const initialThreatData = Array.from(
      { length: 20 },
      () => Math.floor(Math.random() * 50) + 10,
    );
    const initialNetworkData = Array.from(
      { length: 20 },
      () => Math.floor(Math.random() * 100) + 20,
    );
    const initialPerformanceData = Array.from(
      { length: 20 },
      () => Math.floor(Math.random() * 30) + 70,
    );

    setTimeLabels(initialTimeLabels);
    setThreatData(initialThreatData);
    setNetworkData(initialNetworkData);
    setPerformanceData(initialPerformanceData);
  }, []);

  // Auto-update stats and charts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateStats((currentStats) => ({
        ...currentStats,
        systemUptime: currentStats.systemUptime + 60,
      }));

      // Update chart data
      const now = new Date();
      const newTimeLabel = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      setTimeLabels((prev) => [...prev.slice(1), newTimeLabel]);
      setThreatData((prev) => [
        ...prev.slice(1),
        Math.floor(Math.random() * 50) + 10,
      ]);
      setNetworkData((prev) => [
        ...prev.slice(1),
        Math.floor(Math.random() * 100) + 20,
      ]);
      setPerformanceData((prev) => [
        ...prev.slice(1),
        Math.floor(Math.random() * 30) + 70,
      ]);

      // Update security metrics randomly
      setSecurityMetrics((prev) => ({
        firewall: Math.max(
          85,
          Math.min(100, prev.firewall + (Math.random() - 0.5) * 4),
        ),
        encryption: Math.max(
          85,
          Math.min(100, prev.encryption + (Math.random() - 0.5) * 4),
        ),
        monitoring: Math.max(
          85,
          Math.min(100, prev.monitoring + (Math.random() - 0.5) * 4),
        ),
        compliance: Math.max(
          85,
          Math.min(100, prev.compliance + (Math.random() - 0.5) * 4),
        ),
        vulnerability: Math.max(
          85,
          Math.min(100, prev.vulnerability + (Math.random() - 0.5) * 4),
        ),
        authentication: Math.max(
          85,
          Math.min(100, prev.authentication + (Math.random() - 0.5) * 4),
        ),
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [updateStats]);

  // WebSocket connection for live data
  useEffect(() => {
    if (websocket && isConnected) {
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "stats") {
          updateStats(data.stats);
        } else if (data.type === "alert") {
          addAlert(data.alert);
        } else if (data.type === "activity") {
          addActivity(data.activity);
        }
      };
    }
  }, [websocket, isConnected, updateStats, addAlert, addActivity]);

  // Simulate real-time updates when live monitoring is enabled
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      if (isConnected && sendCustomMessage) {
        sendCustomMessage("request_stats", {});
      } else {
        // Fallback to mock data if WebSocket not available
        updateStats((currentStats) => ({
          ...currentStats,
          systemUptime: currentStats.systemUptime + 5,
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
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive, isConnected, sendCustomMessage, updateStats]); // Removed dashboardData.stats to prevent infinite loop

  // Initialize stats if empty (first time user) - run only once
  useEffect(() => {
    if (
      dashboardData.stats.threatsDetected === 0 &&
      dashboardData.stats.systemUptime === 0
    ) {
      updateStats({
        threatsDetected: 0,
        activeScans: 0,
        activeBots: 0,
        lastScanTime: new Date().toISOString(),
        systemUptime: 0,
      });
    }
  }, []); // Empty dependency array to run only once on mount

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
    <div className="min-h-screen bg-black text-white font-mono overflow-x-hidden ios-vh-fix">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 mobile-scroll">
        {/* Mobile-Responsive Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-2 sm:gap-4"
        >
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <motion.div
              animate={{
                rotateY: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              className="flex-shrink-0"
            >
              <LayoutDashboard
                size={20}
                className="text-red-500 sm:w-6 sm:h-6"
              />
            </motion.div>
            <h1
              className="text-white font-mono text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-wide sm:tracking-wider truncate"
              style={{
                textShadow: "0 0 20px rgba(255, 68, 68, 0.6)",
              }}
            >
              <span className="hidden sm:inline">THREAT INTELLIGENCE</span>
              <span className="sm:hidden">THREATS</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={`border-red-500/30 ${isLive ? "text-red-400" : "text-gray-400"} text-xs sm:text-sm min-h-[40px] touch-manipulation`}
            >
              {isLive ? (
                <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              ) : (
                <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden xs:inline">
                {isLive ? "Live" : "Paused"}
              </span>
              <span className="xs:hidden">{isLive ? "●" : "▶"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="border-red-500/30 text-red-400 min-h-[40px] min-w-[40px] touch-manipulation"
            >
              {showNotifications ? (
                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <BellOff className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Mobile-Responsive Stats Grid */}
        <StaggeredReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-900/50 rounded border-l-2 border-blue-500/50 space-y-2 sm:space-y-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm sm:text-base truncate">
                            {activity.action}
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm truncate">
                            {activity.target}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:text-right sm:justify-start flex-shrink-0">
                          <Badge
                            variant="outline"
                            className="text-green-400 border-green-500/30 text-xs"
                          >
                            {activity.result}
                          </Badge>
                          <div className="text-xs text-gray-500 sm:mt-1">
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

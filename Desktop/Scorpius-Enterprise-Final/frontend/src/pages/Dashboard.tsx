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

// Dashboard component with MAIN DASHBOARD header and all current features
const Dashboard = () => {
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);

  // Mock dashboard stats
  const [dashboardData, setDashboardData] = useState({
    stats: {
      threatsDetected: 47,
      activeScans: 12,
      activeBots: 8,
      systemUptime: 2592000,
      lastScanTime: new Date().toISOString(),
    },
  });

  // Update stats periodically when live
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setDashboardData((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          threatsDetected:
            prev.stats.threatsDetected + Math.floor(Math.random() * 2),
          lastScanTime: new Date().toISOString(),
        },
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
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
              <span className="hidden sm:inline">
                <p>MAIN DASHBOARD</p>
              </span>
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
              ) : null}
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
              title="ACTIVE BOTS"
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

        {/* Enhanced Visual Analytics Section */}
        <StaggeredReveal>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            {/* Real-time Threat Detection Chart */}
            <Card className="bg-black/50 border-red-500/30 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  REAL-TIME THREAT DETECTION
                  {isLive && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent" />
                  <svg width="100%" height="100%" className="overflow-visible">
                    {/* Simple threat detection visualization */}
                    <defs>
                      <linearGradient
                        id="threatGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ff4444"
                          stopOpacity="0.8"
                        />
                        <stop
                          offset="100%"
                          stopColor="#ff4444"
                          stopOpacity="0.1"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10,200 Q 80,150 150,180 T 290,160 T 430,140"
                      stroke="#ff4444"
                      strokeWidth="3"
                      fill="none"
                      filter="drop-shadow(0 0 8px #ff4444)"
                    />
                  </svg>
                  <div className="absolute bottom-4 left-4 text-red-400 font-mono text-sm">
                    Live: {dashboardData.stats.threatsDetected} threats/min
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Activity Distribution */}
            <Card className="bg-black/50 border-cyan-500/30 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  NETWORK ACTIVITY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">
                      1,847,293
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                      Total Transactions
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-blue-400">Ethereum</span>
                        <span className="text-white">45%</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-purple-400">Polygon</span>
                        <span className="text-white">25%</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-yellow-400">BSC</span>
                        <span className="text-white">30%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </StaggeredReveal>

        {/* Quick Actions Section */}
        <StaggeredReveal>
          <Card className="bg-black/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 font-mono">
                QUICK ACTIONS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button
                  onClick={() => navigate("/scanner")}
                  className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 h-16 flex flex-col items-center justify-center"
                >
                  <Shield className="h-5 w-5 mb-1" />
                  <span className="text-xs">Scan Contract</span>
                </Button>
                <Button
                  onClick={() => navigate("/time-machine")}
                  className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 h-16 flex flex-col items-center justify-center"
                >
                  <Clock className="h-5 w-5 mb-1" />
                  <span className="text-xs">Time Machine</span>
                </Button>
                <Button className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 h-16 flex flex-col items-center justify-center">
                  <Bot className="h-5 w-5 mb-1" />
                  <span className="text-xs">MEV Ops</span>
                </Button>
                <Button
                  onClick={() => navigate("/settings")}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 h-16 flex flex-col items-center justify-center"
                >
                  <Settings className="h-5 w-5 mb-1" />
                  <span className="text-xs">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </StaggeredReveal>

        {/* Recent Alerts */}
        {showNotifications && (
          <StaggeredReveal>
            <Card className="bg-black/50 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-400 font-mono flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  RECENT ALERTS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-red-400 font-mono text-sm font-semibold">
                        Honeypot Contract Detected
                      </p>
                      <p className="text-gray-400 text-xs font-mono truncate">
                        0x742d35Cc6634C0532925a3b8D5c0532925a3b8D
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      2m ago
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <DollarSign className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-yellow-400 font-mono text-sm font-semibold">
                        MEV Opportunity Found
                      </p>
                      <p className="text-gray-400 text-xs font-mono truncate">
                        Arbitrage: $12,500 potential profit
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      5m ago
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggeredReveal>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Shield,
  Activity,
  Code,
  Clock,
  Zap,
  FileText,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Play,
  Pause,
  RefreshCw,
  Settings,
  ChevronDown,
  TrendingUp,
  Database,
  Cpu,
  Network,
  BarChart3,
  Calendar,
  Users,
  GitBranch,
  Terminal,
  Layers,
  Scan,
  Brain,
  Timer,
  FileCode,
  Bug,
  AlertCircle,
  Info,
  Download,
  ExternalLink,
  MoreHorizontal,
  Coins, // For MEV Operations
  FlaskConical, // For Honeypot Detector
  User,
  LogIn,
  Key,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { TextEffect } from "@/components/ui/text-effect";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";
import { useElectronIntegration } from "@/hooks/useElectronIntegration";

// Chart Components
import { NetworkTopology } from "@/components/charts/NetworkTopology";
import { MempoolFlow } from "@/components/charts/MempoolFlow";
import { BytecodeFlow } from "@/components/charts/BytecodeFlow";
import { TimelineChart } from "@/components/charts/TimelineChart";
import { SimulationViewer } from "@/components/charts/SimulationViewer";
import { ReportsCharts } from "@/components/charts/ReportsCharts";
import { MEVChart } from "@/components/charts/MEVChart";
import { RiskRadar } from "@/components/charts/RiskRadar";
import { SystemMetrics } from "@/components/charts/SystemMetrics";

// Scanner Components
import { VulnerabilityScanner } from "@/components/scanner/VulnerabilityScanner";

// AI and Chat Components
import { AIAssistant } from "@/components/ai/AIAssistant";
import { TeamChat } from "@/components/chat/TeamChat";

interface ScanResult {
  id: string;
  contract: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  plugin: string;
  title: string;
  description: string;
  timestamp: string;
  status: "Active" | "Resolved" | "Investigating";
}

interface ModuleData {
  name: string;
  icon: React.ElementType;
  status: "active" | "inactive" | "scanning";
  progress: number;
  findings: number;
  lastUpdate: string;
  description: string;
  tab: string;
}

const mockScanResults: ScanResult[] = [
  {
    id: "1",
    contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    severity: "Critical",
    plugin: "reentrancy-detector",
    title: "Reentrancy Vulnerability Detected",
    description: "Potential reentrancy attack vector in withdraw function",
    timestamp: "2024-01-15T10:30:00Z",
    status: "Active",
  },
  {
    id: "2",
    contract: "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe",
    severity: "High",
    plugin: "slither-static",
    title: "Unchecked External Call",
    description: "External call without proper error handling",
    timestamp: "2024-01-15T09:45:00Z",
    status: "Investigating",
  },
  {
    id: "3",
    contract: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    severity: "Medium",
    plugin: "bytecode-analysis",
    title: "Gas Optimization Opportunity",
    description: "Loop optimization could reduce gas costs by 15%",
    timestamp: "2024-01-15T08:20:00Z",
    status: "Resolved",
  },
];

const moduleData: ModuleData[] = [
  {
    name: "Scanner",
    icon: Scan,
    status: "active",
    progress: 85,
    findings: 12,
    lastUpdate: "2 min ago",
    description: "Static analysis and vulnerability detection",
    tab: "scanner",
  },
  {
    name: "Mempool Monitor",
    icon: Activity,
    status: "active",
    progress: 92,
    findings: 8,
    lastUpdate: "30 sec ago",
    description: "Real-time transaction monitoring",
    tab: "mempool",
  },
  {
    name: "Bytecode Analysis",
    icon: Code,
    status: "scanning",
    progress: 45,
    findings: 3,
    lastUpdate: "1 min ago",
    description: "Deep bytecode inspection and analysis",
    tab: "bytecode",
  },
  {
    name: "Time Machine",
    icon: Clock,
    status: "active",
    progress: 100,
    findings: 15,
    lastUpdate: "5 min ago",
    description: "Historical state analysis and replay",
    tab: "time-machine",
  },
  {
    name: "Simulation Engine",
    icon: Brain,
    status: "active",
    progress: 78,
    findings: 6,
    lastUpdate: "3 min ago",
    description: "AI-powered contract simulation",
    tab: "simulation",
  },
  {
    name: "Reports",
    icon: FileText,
    status: "inactive",
    progress: 0,
    findings: 0,
    lastUpdate: "1 hour ago",
    description: "Comprehensive security reports",
    tab: "reports",
  },
  {
    name: "MEV Operations",
    icon: Coins,
    status: "active",
    progress: 95,
    findings: 2,
    lastUpdate: "10 sec ago",
    description: "Maximum Extractable Value detection and execution",
    tab: "mev-operations",
  },
  {
    name: "Honeypot Detector",
    icon: FlaskConical,
    status: "active",
    progress: 88,
    findings: 1,
    lastUpdate: "1 min ago",
    description: "Identifies and warns about potential honeypot contracts",
    tab: "honeypot-detector",
  },
  {
    name: "Settings",
    icon: Settings,
    status: "active",
    progress: 100,
    findings: 0,
    lastUpdate: "Just now",
    description: "Configure system parameters and preferences",
    tab: "settings",
  },
];

const plugins = [
  "reentrancy-detector",
  "slither-static",
  "bytecode-analysis",
  "gas-optimizer",
  "access-control",
  "overflow-detector",
  "timestamp-dependency",
  "front-running-guard",
];

function FadeInOnScroll({
  children,
  className = "",
  delay = 0,
  preset = "blur-slide",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  preset?:
    | "fade"
    | "slide"
    | "scale"
    | "blur"
    | "blur-slide"
    | "zoom"
    | "bounce";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants = {
    hidden: {
      opacity: 0,
      y: 30,
      filter: "blur(6px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        delay,
        ease: [0.25, 0.25, 0, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ModuleCard({
  module,
  onSelectTab,
}: {
  module: ModuleData;
  onSelectTab: (tab: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = module.icon;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]";
      case "scanning":
        return "text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]";
      case "inactive":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-50 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]";
      case "scanning":
        return "bg-cyan-50 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]";
      case "inactive":
        return "bg-gray-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <motion.div layout className="group">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className="h-full transition-all duration-300 hover:shadow-2xl hover:shadow-blue-400/30 hover:border-blue-400 hover:bg-gray-100 border-gray-300 bg-gray-50 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-2 shadow-lg shadow-gray-300/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getStatusBg(module.status)} border border-gray-200`}
                      >
                        <Icon
                          className={`h-5 w-5 ${getStatusColor(module.status)}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate text-black">
                          {module.name}
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-black">
                        {module.progress}%
                      </span>
                    </div>

                    <Progress value={module.progress} className="h-1.5" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Findings</span>
                      <Badge
                        variant={
                          module.findings > 10
                            ? "destructive"
                            : module.findings > 5
                              ? "default"
                              : "secondary"
                        }
                      >
                        {module.findings}
                      </Badge>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-2 border-t border-gray-200"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Last Update</span>
                            <span className="text-black">
                              {module.lastUpdate}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Status</span>
                            <Badge
                              variant="outline"
                              className={getStatusColor(module.status)}
                            >
                              {module.status}
                            </Badge>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-gray-400 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-200"
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Configure
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1"
                            >
                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border border-blue-400 hover:border-blue-300 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                                onClick={() => onSelectTab(module.tab)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </motion.div>
            </Card>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-white border-blue-300 shadow-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <p className="text-blue-600 font-medium drop-shadow-[0_0_4px_rgba(59,130,246,0.4)]">
              {module.name}
            </p>
            <p className="text-gray-700 text-xs">{module.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

function ScanResultCard({ result }: { result: ScanResult }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-50";
      case "High":
        return "text-orange-600 bg-orange-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      case "Low":
        return "text-blue-600 bg-blue-50";
      case "Info":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <AlertTriangle className="h-4 w-4" />;
      case "Resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "Investigating":
        return <Eye className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="hover:shadow-xl hover:shadow-blue-400/30 hover:border-blue-400 hover:bg-gray-100 transition-all duration-300 border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getSeverityColor(result.severity)}>
                  {result.severity}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-gray-400 text-gray-600"
                >
                  {result.plugin}
                </Badge>
              </div>

              <h3 className="font-medium text-sm mb-1 line-clamp-1 text-black">
                {result.title}
              </h3>

              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {result.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Contract: {result.contract.slice(0, 10)}...
                  {result.contract.slice(-8)}
                </span>
                <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-gray-400 text-gray-600"
              >
                {getStatusIcon(result.status)}
                {result.status}
              </Badge>

              <Button size="sm" variant="ghost">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FilterControls({
  selectedPlugins,
  setSelectedPlugins,
  timeFilter,
  setTimeFilter,
  severityFilter,
  setSeverityFilter,
  criticalOnly,
  setCriticalOnly,
}: {
  selectedPlugins: string[];
  setSelectedPlugins: (plugins: string[]) => void;
  timeFilter: string;
  setTimeFilter: (filter: string) => void;
  severityFilter: string;
  setSeverityFilter: (filter: string) => void;
  criticalOnly: boolean;
  setCriticalOnly: (critical: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
            <span className="text-sm font-medium text-black">Filters</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform text-gray-500 ${isExpanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high+">High+</SelectItem>
              <SelectItem value="medium+">Medium+</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch checked={criticalOnly} onCheckedChange={setCriticalOnly} />
            <span className="text-sm text-black">Critical Only</span>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <div>
                <h4 className="text-sm font-medium mb-2 text-black">
                  Plugin Filters
                </h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedPlugins(
                        selectedPlugins.length === plugins.length
                          ? []
                          : [...plugins],
                      )
                    }
                  >
                    Select All
                  </Button>
                  {plugins.map((plugin) => (
                    <Badge
                      key={plugin}
                      variant={
                        selectedPlugins.includes(plugin) ? "default" : "outline"
                      }
                      className="cursor-pointer mr-1 mb-1"
                      onClick={() => {
                        if (selectedPlugins.includes(plugin)) {
                          setSelectedPlugins(
                            selectedPlugins.filter((p) => p !== plugin),
                          );
                        } else {
                          setSelectedPlugins([...selectedPlugins, plugin]);
                        }
                      }}
                    >
                      {plugin}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function RealTimeIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      Live Updates
      <Activity className="h-3 w-3" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card
          key={i}
          className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MempoolMonitorTab() {
  const [status, setStatus] = useState<"idle" | "monitoring" | "stopped">(
    "idle",
  );
  const [opportunities, setOpportunities] = useState(0);
  const [profit, setProfit] = useState("0.00 ETH");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "monitoring") {
      interval = setInterval(() => {
        setOpportunities((prev) => prev + Math.floor(Math.random() * 3));
        setProfit(
          (prev) =>
            (parseFloat(prev) + Math.random() * 0.01).toFixed(4) + " ETH",
        );
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            Elite Mempool System
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A comprehensive MEV (Maximum Extractable Value) detection and
            execution system for Ethereum and other EVM-compatible blockchains.
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <MempoolFlow className="mb-6" />
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600">
                  System Status
                </h3>
                <Badge
                  variant={status === "monitoring" ? "default" : "secondary"}
                  className={
                    status === "monitoring"
                      ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                      : ""
                  }
                >
                  {status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="sm"
                    onClick={() => setStatus("monitoring")}
                    disabled={status === "monitoring"}
                    border-blue-300
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    <Play className="h-3 w-3 mr-1" /> Start
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus("stopped")}
                    disabled={status !== "monitoring"}
                    className="border-gray-400 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pause className="h-3 w-3 mr-1" /> Stop
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Detected Opportunities
              </h3>
              <p className="text-2xl font-bold text-black">{opportunities}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Total Profit (Simulated)
              </h3>
              <p className="text-2xl font-bold text-red-600">{profit}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Last Update
              </h3>
              <p className="text-sm text-black">
                {new Date().toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.2}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Badge
                variant="outline"
                className="border-blue-300 text-blue-600"
              >
                Real-time Monitoring
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Advanced MEV Detection
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Multi-Path Execution
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Comprehensive Analytics
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Secure Configuration
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                REST API
              </Badge>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.3}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">MEV Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium text-black">Sandwich Attacks</h4>
                <p className="text-sm text-gray-600">
                  Detects and executes optimal front/back-runs.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">
                  Arbitrage Opportunities
                </h4>
                <p className="text-sm text-gray-600">
                  Monitors price differences across DEX platforms.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">Liquidation Hunting</h4>
                <p className="text-sm text-gray-600">
                  Tracks and executes liquidations for profit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.4}>
        <div className="flex justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border border-blue-400 hover:border-blue-300 transition-all duration-200 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <ExternalLink className="h-4 w-4 mr-2" /> View Documentation
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function MEVOperationsTab() {
  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            MEV Operations
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage and monitor your Maximum Extractable Value (MEV) strategies.
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <MEVChart />
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="flex justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white">
              <Coins className="h-4 w-4 mr-2" /> Configure MEV Strategies
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function HoneypotDetectorTab() {
  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            Honeypot Detector
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Advanced honeypot detection for both verified and obfuscated
            contracts using behavioral analysis
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <RiskRadar className="mb-6" />
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Contracts Analyzed
              </h3>
              <p className="text-2xl font-bold text-black">5,432</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Honeypots Detected
              </h3>
              <p className="text-2xl font-bold text-red-600">89</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                False Positive Rate
              </h3>
              <p className="text-2xl font-bold text-green-600">0.8%</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Detection Accuracy
              </h3>
              <p className="text-2xl font-bold text-green-600">98.7%</p>
            </CardContent>
          </Card>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.2}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Detection Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Badge variant="outline" className="border-red-300 text-red-600">
                Transfer Blocklists
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Custom Logic Traps
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Fake Approvals
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Bytecode Analysis
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Behavioral Patterns
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Transaction Simulation
              </Badge>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.3}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Honeypot Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium text-black">
                  Transfer Restrictions
                </h4>
                <p className="text-sm text-gray-600">
                  Contracts that prevent token transfers after purchase.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">
                  Balance Modifications
                </h4>
                <p className="text-sm text-gray-600">
                  Hidden functions that modify balances arbitrarily.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">High Tax Schemes</h4>
                <p className="text-sm text-gray-600">
                  Excessive fees that drain user funds on transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.4}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Recent Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                <div>
                  <p className="font-medium text-sm text-black">
                    0x1234...5678
                  </p>
                  <p className="text-xs text-gray-600">
                    Transfer blocklist detected
                  </p>
                </div>
                <Badge variant="destructive">High Risk</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                <div>
                  <p className="font-medium text-sm text-black">
                    0xabcd...efgh
                  </p>
                  <p className="text-xs text-gray-600">
                    Hidden tax function found
                  </p>
                </div>
                <Badge variant="destructive">Critical</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.5}>
        <div className="flex justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-gray-400 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white">
              <Scan className="h-4 w-4 mr-2" /> Scan for Honeypots
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function TimeMachineTab() {
  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            Time Machine
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dynamic forked simulation engine for replaying historical blockchain
            states and analyzing past exploits
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <TimelineChart className="mb-6" />
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Historical Blocks Indexed
              </h3>
              <p className="text-2xl font-bold text-black">18.2M</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Simulations Executed
              </h3>
              <p className="text-2xl font-bold text-black">3,847</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Exploits Reproduced
              </h3>
              <p className="text-2xl font-bold text-orange-600">156</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Success Rate
              </h3>
              <p className="text-2xl font-bold text-green-600">94.8%</p>
            </CardContent>
          </Card>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.2}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">
              Simulation Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Badge variant="outline" className="border-red-300 text-red-600">
                Mainnet Forking
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Historical Replay
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Event Tracking
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Balance Changes
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Foundry/Anvil
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                State Snapshots
              </Badge>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.3}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Analysis Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium text-black">Exploit Reproduction</h4>
                <p className="text-sm text-gray-600">
                  Replay known exploits to understand attack vectors.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">State Analysis</h4>
                <p className="text-sm text-gray-600">
                  Deep dive into contract state at any block height.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">Attack Simulation</h4>
                <p className="text-sm text-gray-600">
                  Test potential attacks in historical contexts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.4}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Recent Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                <div>
                  <p className="font-medium text-sm text-black">
                    Euler Finance Exploit
                  </p>
                  <p className="text-xs text-gray-600">
                    Block 16817996 - March 13, 2023
                  </p>
                </div>
                <Badge variant="default" className="bg-red-500 text-white">
                  Reproduced
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                <div>
                  <p className="font-medium text-sm text-black">
                    BNB Chain Bridge Hack
                  </p>
                  <p className="text-xs text-gray-600">
                    Block 21967000 - October 6, 2022
                  </p>
                </div>
                <Badge variant="secondary">Analyzed</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                <div>
                  <p className="font-medium text-sm text-black">
                    Custom Simulation
                  </p>
                  <p className="text-xs text-gray-600">
                    Block 18500000 - November 15, 2023
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-yellow-400 text-yellow-600"
                >
                  Running
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.5}>
        <div className="flex justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg transition-all duration-200"
            >
              <Clock className="h-4 w-4 mr-2" /> Select Block Range
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white">
              <Play className="h-4 w-4 mr-2" /> Start Simulation
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function SettingsTab() {
  const navigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            System Settings
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Configure API keys, network settings, and system preferences.
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-blue-600 flex items-center">
                <Network className="h-5 w-5 mr-2" />
                Network Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Configure RPC endpoints for blockchain networks
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={() => navigate("/settings")}
              >
                Configure Networks →
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Manage API keys for third-party services
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => navigate("/settings")}
              >
                Manage API Keys →
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-purple-600 flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Theme, notifications, and preferences
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
                onClick={() => navigate("/settings")}
              >
                General Settings →
              </Button>
            </CardContent>
          </Card>
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.1}>
        <SystemMetrics />
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="flex justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 mr-2" /> Open Settings Panel
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function SignInDialog() {
  const id = React.useId();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg transition-all duration-200"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-red-500" />
          </div>
          <DialogTitle>
            Welcome to Scorpius
            <DialogDescription>
              Enter your credentials to access the threat detection suite.
            </DialogDescription>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`${id}-email`} className="text-sm font-medium">
              Email
            </label>
            <Input
              id={`${id}-email`}
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={`${id}-password`} className="text-sm font-medium">
              Password
            </label>
            <Input
              id={`${id}-password`}
              type="password"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch id="remember" />
            <label htmlFor="remember" className="text-sm">
              Remember me
            </label>
          </div>

          <Button variant="link" size="sm">
            Forgot password?
          </Button>
        </div>

        <Button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white">
          Sign in
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          Login with SSO
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AIAssistantDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg transition-all duration-200"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scorpius AI Assistant</DialogTitle>
          <DialogDescription>
            Get help with threat analysis, vulnerability explanations, and
            security recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[400px] flex items-center justify-center">
          {/* AI Chat Interface would go here */}
          <div className="text-center space-y-4">
            <Brain className="h-12 w-12 mx-auto text-gray-500" />
            <div>
              <h3 className="font-medium">
                AI Assistant interface would be integrated here
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Ask questions about vulnerabilities, get code analysis, or
                request security recommendations
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScannerTab() {
  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            Scanner Module
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Advanced static analysis and vulnerability detection engine with
            AI-powered analysis
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <SimulationViewer className="mb-6" />
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Active Plugins
              </h3>
              <p className="text-2xl font-bold text-black">8</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Vulnerabilities Found
              </h3>
              <p className="text-2xl font-bold text-red-600">23</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Contracts Scanned
              </h3>
              <p className="text-2xl font-bold text-black">156</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Success Rate
              </h3>
              <p className="text-2xl font-bold text-green-600">94.2%</p>
            </CardContent>
          </Card>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.2}>
        <NetworkTopology className="mb-6" />
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.3}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Detection Engines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Badge variant="outline" className="border-red-300 text-red-600">
                Slither Integration
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                AI Analysis (GPT-4o)
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Mythril Engine
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Custom Heuristics
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Echidna Fuzzing
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Vyper Support
              </Badge>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.4}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">
              Vulnerability Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium text-black">Reentrancy</h4>
                <p className="text-sm text-gray-600">
                  Cross-function and cross-contract reentrancy detection.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">Access Control</h4>
                <p className="text-sm text-gray-600">
                  Missing modifiers and privilege escalation.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">Integer Overflow</h4>
                <p className="text-sm text-gray-600">
                  Arithmetic vulnerabilities and SafeMath issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.5}>
        <div className="flex justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg transition-all duration-200"
            >
              <Settings className="h-4 w-4 mr-2" /> Configure Plugins
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white">
              <Scan className="h-4 w-4 mr-2" /> Start Scan
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function BytecodeTab() {
  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            Bytecode Deep Analysis
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Advanced bytecode inspection, decompilation, and pattern analysis
            for verified and unverified contracts
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Contracts Analyzed
              </h3>
              <p className="text-2xl font-bold text-black">1,247</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Proxy Patterns Detected
              </h3>
              <p className="text-2xl font-bold text-yellow-600">89</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Decompilation Success
              </h3>
              <p className="text-2xl font-bold text-green-600">97.3%</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Hidden Functions Found
              </h3>
              <p className="text-2xl font-bold text-red-600">34</p>
            </CardContent>
          </Card>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.2}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Analysis Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Badge variant="outline" className="border-red-300 text-red-600">
                Proxy Detection
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Delegatecall Analysis
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Opcode Inspection
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Auto-Decompilation
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Chain-Specific Opcodes
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Upgradable Logic
              </Badge>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.3}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Pattern Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium text-black">Proxy Patterns</h4>
                <p className="text-sm text-gray-600">
                  EIP-1967, EIP-1822, and custom proxy implementations.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">Hidden Functions</h4>
                <p className="text-sm text-gray-600">
                  Backdoors and undocumented functionality detection.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">Obfuscation</h4>
                <p className="text-sm text-gray-600">
                  Code obfuscation and anti-analysis techniques.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.4}>
        <div className="flex justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" /> Export Bytecode
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white">
              <Code className="h-4 w-4 mr-2" /> Analyze Contract
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function SimulationTab() {
  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            AI Simulation Engine
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Advanced contract simulation, fuzzing, and exploit generation using
            mainnet-forked environments
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Simulations Run
              </h3>
              <p className="text-2xl font-bold text-black">2,847</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Exploits Generated
              </h3>
              <p className="text-2xl font-bold text-orange-600">127</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Success Rate
              </h3>
              <p className="text-2xl font-bold text-green-600">89.4%</p>
            </CardContent>
          </Card>

          <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Avg. Execution Time
              </h3>
              <p className="text-2xl font-bold text-black">2.3s</p>
            </CardContent>
          </Card>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.2}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Simulation Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Badge variant="outline" className="border-red-300 text-red-600">
                Mainnet Forking
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Flashloan Attacks
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                AI-Powered Fuzzing
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Balance Tracking
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Event Monitoring
              </Badge>
              <Badge variant="outline" className="border-red-300 text-red-600">
                Foundry/Anvil
              </Badge>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.3}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
          <CardHeader>
            <CardTitle className="text-black">Attack Vectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium text-black">Reentrancy Exploits</h4>
                <p className="text-sm text-gray-600">
                  Automated reentrancy attack generation and testing.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">Price Manipulation</h4>
                <p className="text-sm text-gray-600">
                  Oracle attacks and DEX price manipulation.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-black">Governance Attacks</h4>
                <p className="text-sm text-gray-600">
                  Flash loan governance and voting manipulation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.4}>
        <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40 border-red-300">
          <CardHeader>
            <CardTitle className="text-blue-600 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
              Blue Team Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch checked />
                <span className="text-sm font-medium text-blue-600 drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]">
                  Analysis Engine Active
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Uses symbolic execution and known vulnerability patterns to
                generate custom attack payloads and PoCs.
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.5}>
        <div className="flex justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg transition-all duration-200"
            >
              <Settings className="h-4 w-4 mr-2" /> Configure Environment
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white">
              <Play className="h-4 w-4 mr-2" /> Run Simulation
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            Reports
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive security reports and analytics
          </p>
        </div>
      </FadeInOnScroll>

      <Separator className="bg-gray-300" />

      <FadeInOnScroll delay={0.1}>
        <ReportsCharts />
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="flex justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 transition-all duration-200 text-white">
              <FileText className="h-4 w-4 mr-2" /> Generate Report
            </Button>
          </motion.div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function MEVGuardiansTab() {
  return (
    <div className="space-y-6">
      <FadeInOnScroll>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            MEV Guardians
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Coming soon...</p>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function ScorpiusDashboard() {
  const [selectedPlugins, setSelectedPlugins] = useState([...plugins]);
  const [timeFilter, setTimeFilter] = useState("24h");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isScrolled, setIsScrolled] = useState(false);

  // Electron integration
  const electronIntegration = useElectronIntegration({
    onNavigate: (module: string) => {
      setActiveTab(module);
    },
    onNewScan: () => {
      setActiveTab("scanner");
      // Additional logic for starting a new scan
    },
    onExportReport: async () => {
      // Logic for exporting current report
      if (electronIntegration.isElectron) {
        const filePath = await electronIntegration.handleSaveReport(
          {
            /* report data */
          },
          `scorpius-report-${new Date().toISOString().split("T")[0]}`,
        );
        if (filePath) {
          await electronIntegration.showInfoDialog(
            "Report Exported",
            `Report successfully exported to ${filePath}`,
          );
        }
      }
    },
    onStartMonitoring: () => {
      setActiveTab("mempool");
      // Additional logic for starting monitoring
    },
    onStopScans: async () => {
      // Logic for stopping all active scans
      const confirmed = await electronIntegration.showConfirmDialog(
        "Stop All Scans",
        "Are you sure you want to stop all active scans?",
      );
      if (confirmed) {
        console.log("Stopping all scans...");
      }
    },
    onResetSettings: async () => {
      const confirmed = await electronIntegration.showConfirmDialog(
        "Reset Settings",
        "This will reset all settings to their default values. Are you sure?",
      );
      if (confirmed) {
        setActiveTab("settings");
        // Additional logic for resetting settings
      }
    },
    onOpenFile: (filePath: string) => {
      // Logic for opening a file
      console.log("Opening file:", filePath);
      setActiveTab("scanner");
    },
    onAppBeforeQuit: () => {
      // Cleanup logic before app quits
      console.log("App closing, performing cleanup...");
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredResults = mockScanResults.filter((result) => {
    const matchesPlugin = selectedPlugins.includes(result.plugin);
    const matchesSeverity = criticalOnly
      ? result.severity === "Critical"
      : true;
    const matchesSearch =
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlugin && matchesSeverity && matchesSearch;
  });

  const dockItems = [
    { title: "Overview", icon: BarChart3, tab: "overview" },
    { title: "Scanner", icon: Scan, tab: "scanner" },
    { title: "Mempool", icon: Activity, tab: "mempool" },
    { title: "Bytecode", icon: Code, tab: "bytecode" },
    { title: "Simulation", icon: Brain, tab: "simulation" },
    { title: "Reports", icon: FileText, tab: "reports" },
    { title: "MEV Ops", icon: Coins, tab: "mev-operations" },
    { title: "Honeypot", icon: FlaskConical, tab: "honeypot-detector" },
    { title: "Time Machine", icon: Clock, tab: "time-machine" },
    { title: "MEV Guardians", icon: Shield, tab: "mev-guardians" },
    { title: "Settings", icon: Settings, tab: "settings" },
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <FlickeringGrid
        color="rgb(59, 130, 246)"
        maxOpacity={0.05}
        flickerChance={0.2}
        squareSize={4}
        gridGap={6}
      />
      {/* Header */}
      <motion.div
        className={`relative z-10 border-b border-gray-300 backdrop-blur-md transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 shadow-lg shadow-blue-400/20 shadow-[0_4px_20px_rgba(59,130,246,0.2)]"
            : "bg-white/70"
        }`}
        animate={{
          y: isScrolled ? 0 : 0,
          background: isScrolled
            ? "rgba(255, 255, 255, 0.95)"
            : "rgba(255, 255, 255, 0.8)",
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Shield className="h-8 w-8 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                </div>
                <div>
                  <TextEffect
                    per="char"
                    preset="blur"
                    className="text-xl font-bold text-black"
                  >
                    Scorpius
                  </TextEffect>
                  <TextEffect
                    per="word"
                    preset="slide"
                    delay={0.5}
                    className="text-xs text-gray-600"
                  >
                    Analyze. Simulate. Exploit.
                  </TextEffect>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RealTimeIndicator />
              <SignInDialog />
              <AIAssistantDialog />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 text-white"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  New Scan
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 py-6 space-y-6">
        {/* Search and Filters */}
        <FadeInOnScroll>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search vulnerabilities, contracts, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-300"
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="default"
                className="border-gray-400 text-gray-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg transition-all duration-200"
                onClick={() => setIsLoading(!isLoading)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </motion.div>
          </div>
        </FadeInOnScroll>

        {/* Main Dashboard Content based on activeTab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Module Grid */}
            <FadeInOnScroll>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleData.map((module, index) => (
                  <FadeInOnScroll key={module.name} delay={index * 0.1}>
                    <ModuleCard module={module} onSelectTab={setActiveTab} />
                  </FadeInOnScroll>
                ))}
              </div>
            </FadeInOnScroll>

            <Separator className="bg-gray-300" />

            {/* Recent Findings */}
            <FadeInOnScroll delay={0.3}>
              <Card className="border-gray-300 bg-gray-50 shadow-lg shadow-gray-300/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-black">
                      Recent Findings
                    </CardTitle>
                    <Badge variant="secondary">
                      {filteredResults.length} results
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <FilterControls
                    selectedPlugins={selectedPlugins}
                    setSelectedPlugins={setSelectedPlugins}
                    timeFilter={timeFilter}
                    setTimeFilter={setTimeFilter}
                    severityFilter={severityFilter}
                    setSeverityFilter={setSeverityFilter}
                    criticalOnly={criticalOnly}
                    setCriticalOnly={setCriticalOnly}
                  />

                  <div className="mt-6 space-y-4">
                    {isLoading ? (
                      <LoadingSkeleton />
                    ) : filteredResults.length > 0 ? (
                      filteredResults.map((result, index) => (
                        <FadeInOnScroll key={result.id} delay={index * 0.1}>
                          <ScanResultCard result={result} />
                        </FadeInOnScroll>
                      ))
                    ) : (
                      <Card className="border-dashed border-gray-400 bg-gray-50 shadow-inner">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                          <h3 className="text-lg font-medium mb-2 text-black">
                            No Issues Found
                          </h3>
                          <p className="text-sm text-gray-600 text-center max-w-sm">
                            All scanned contracts appear to be secure with
                            current filters.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </FadeInOnScroll>
          </div>
        )}

        {activeTab === "scanner" && <ScannerTab />}
        {activeTab === "mempool" && <MempoolMonitorTab />}
        {activeTab === "bytecode" && <BytecodeTab />}
        {activeTab === "simulation" && <SimulationTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "mev-operations" && <MEVOperationsTab />}
        {activeTab === "honeypot-detector" && <HoneypotDetectorTab />}
        {activeTab === "time-machine" && <TimeMachineTab />}
        {activeTab === "mev-guardians" && <MEVGuardiansTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>

      {/* Floating Dock Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Dock>
          {dockItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <DockItem
                key={idx}
                className="group relative"
                onClick={() => setActiveTab(item.tab)}
              >
                <DockLabel>{item.title}</DockLabel>
                <Icon className="h-4 w-4" />
              </DockItem>
            );
          })}
        </Dock>
      </div>

      {/* AI Assistant - Always available */}
      <AIAssistant />

      {/* Team Chat - Enterprise only */}
      <TeamChat />
    </div>
  );
}

export default function Index() {
  return (
    <TooltipProvider>
      <ScorpiusDashboard />
    </TooltipProvider>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Server,
    Database,
    Wifi,
    Cpu,
    HardDrive,
    Activity,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Clock,
    Gauge,
    MemoryStick,
    Network,
    Shield,
    Zap,
    Globe,
    Monitor,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import { monitoring } from "@/utils/monitoring";

interface ServiceStatus {
    name: string;
    status: "healthy" | "warning" | "critical" | "offline";
    uptime: number;
    responseTime: number;
    lastCheck: Date;
    url?: string;
    description: string;
    icon: React.ElementType;
}

interface SystemMetric {
    name: string;
    value: number;
    unit: string;
    threshold: number;
    status: "good" | "warning" | "critical";
    icon: React.ElementType;
    description: string;
}

const SystemHealth: React.FC = () => {
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedTimeRange, setSelectedTimeRange] = useState("1h");

    // Mock system services
    const [services, setServices] = useState<ServiceStatus[]>([
        {
            name: "Frontend Application",
            status: "healthy",
            uptime: 99.9,
            responseTime: 145,
            lastCheck: new Date(),
            url: "https://app.scorpius.dev",
            description: "Main web application",
            icon: Monitor,
        },
        {
            name: "Backend API",
            status: "healthy",
            uptime: 99.8,
            responseTime: 89,
            lastCheck: new Date(),
            url: "https://api.scorpius.dev",
            description: "Core API services",
            icon: Server,
        },
        {
            name: "Database",
            status: "healthy",
            uptime: 99.9,
            responseTime: 23,
            lastCheck: new Date(),
            description: "PostgreSQL database",
            icon: Database,
        },
        {
            name: "Redis Cache",
            status: "warning",
            uptime: 98.5,
            responseTime: 156,
            lastCheck: new Date(),
            description: "Session and cache storage",
            icon: MemoryStick,
        },
        {
            name: "WebSocket Service",
            status: "healthy",
            uptime: 99.7,
            responseTime: 67,
            lastCheck: new Date(),
            description: "Real-time communication",
            icon: Wifi,
        },
        {
            name: "Notification Service",
            status: "healthy",
            uptime: 99.6,
            responseTime: 234,
            lastCheck: new Date(),
            description: "Alert and notification system",
            icon: Shield,
        },
        {
            name: "External APIs",
            status: "warning",
            uptime: 97.2,
            responseTime: 1250,
            lastCheck: new Date(),
            description: "Third-party integrations",
            icon: Globe,
        },
        {
            name: "Monitoring",
            status: "healthy",
            uptime: 99.9,
            responseTime: 45,
            lastCheck: new Date(),
            description: "Prometheus & Grafana",
            icon: Activity,
        },
    ]);

    // Mock system metrics
    const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
        {
            name: "CPU Usage",
            value: 23.5,
            unit: "%",
            threshold: 80,
            status: "good",
            icon: Cpu,
            description: "Current CPU utilization",
        },
        {
            name: "Memory Usage",
            value: 67.2,
            unit: "%",
            threshold: 85,
            status: "good",
            icon: MemoryStick,
            description: "RAM utilization",
        },
        {
            name: "Disk Usage",
            value: 45.8,
            unit: "%",
            threshold: 90,
            status: "good",
            icon: HardDrive,
            description: "Storage utilization",
        },
        {
            name: "Network I/O",
            value: 1.2,
            unit: "MB/s",
            threshold: 100,
            status: "good",
            icon: Network,
            description: "Network throughput",
        },
        {
            name: "Active Connections",
            value: 1456,
            unit: "",
            threshold: 5000,
            status: "good",
            icon: Wifi,
            description: "Current active connections",
        },
        {
            name: "Response Time",
            value: 145,
            unit: "ms",
            threshold: 1000,
            status: "good",
            icon: Gauge,
            description: "Average API response time",
        },
    ]);

    // Mock performance history data
    const performanceHistory = [
        { time: "00:00", cpu: 15, memory: 45, network: 0.8, responseTime: 120 },
        { time: "00:15", cpu: 18, memory: 47, network: 1.1, responseTime: 135 },
        { time: "00:30", cpu: 22, memory: 52, network: 1.5, responseTime: 142 },
        { time: "00:45", cpu: 25, memory: 58, network: 1.8, responseTime: 156 },
        { time: "01:00", cpu: 23, memory: 67, network: 1.2, responseTime: 145 },
    ];

    const refreshHealthCheck = async () => {
        setIsRefreshing(true);
        try {
            // Simulate health check calls
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Update last check times
            setServices((prev) =>
                prev.map((service) => ({
                    ...service,
                    lastCheck: new Date(),
                    responseTime: Math.random() * 200 + 50, // Random response time
                    status: Math.random() > 0.9 ? "warning" : service.status,
                })),
            );

            setLastUpdate(new Date());
            monitoring.trackUserAction("health_check_refresh");
        } finally {
            setIsRefreshing(false);
        }
    };

    const getStatusColor = (status: ServiceStatus["status"]) => {
        switch (status) {
            case "healthy":
                return "text-green-400 bg-green-400/10 border-green-400/20";
            case "warning":
                return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
            case "critical":
                return "text-red-400 bg-red-400/10 border-red-400/20";
            case "offline":
                return "text-gray-400 bg-gray-400/10 border-gray-400/20";
            default:
                return "text-gray-400 bg-gray-400/10 border-gray-400/20";
        }
    };

    const getStatusIcon = (status: ServiceStatus["status"]) => {
        switch (status) {
            case "healthy":
                return <CheckCircle className="w-4 h-4" />;
            case "warning":
                return <AlertTriangle className="w-4 h-4" />;
            case "critical":
            case "offline":
                return <XCircle className="w-4 h-4" />;
            default:
                return <XCircle className="w-4 h-4" />;
        }
    };

    const getMetricStatus = (metric: SystemMetric) => {
        const percentage = (metric.value / metric.threshold) * 100;
        if (percentage >= 90) return "critical";
        if (percentage >= 70) return "warning";
        return "good";
    };

    const overallHealth =
        (services.filter((s) => s.status === "healthy").length / services.length) *
        100;

    useEffect(() => {
        monitoring.trackPageView("/system-health");

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            refreshHealthCheck();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="min-h-screen bg-black text-white p-6"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-cyan-400 mb-2">
                            🏥 System Health Monitor
                        </h1>
                        <p className="text-gray-400">
                            Real-time system status and performance metrics
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            Last updated: {lastUpdate.toLocaleTimeString()}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshHealthCheck}
                            disabled={isRefreshing}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Overall Health Status */}
            <div className="mb-8">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Overall System Health
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl font-bold">
                                        <span
                                            className={
                                                overallHealth >= 90
                                                    ? "text-green-400"
                                                    : overallHealth >= 70
                                                        ? "text-yellow-400"
                                                        : "text-red-400"
                                            }
                                        >
                                            {overallHealth.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">
                                            {services.filter((s) => s.status === "healthy").length} of{" "}
                                            {services.length} services healthy
                                        </div>
                                        <Progress value={overallHealth} className="w-48 h-2 mt-1" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(overallHealth >= 90 ? "healthy" : overallHealth >= 70 ? "warning" : "critical")}`}
                                >
                                    {getStatusIcon(
                                        overallHealth >= 90
                                            ? "healthy"
                                            : overallHealth >= 70
                                                ? "warning"
                                                : "critical",
                                    )}
                                    <span className="text-sm font-medium">
                                        {overallHealth >= 90
                                            ? "All Systems Operational"
                                            : overallHealth >= 70
                                                ? "Some Issues Detected"
                                                : "Critical Issues"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="services" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                    <TabsTrigger value="services">Services Status</TabsTrigger>
                    <TabsTrigger value="metrics">System Metrics</TabsTrigger>
                    <TabsTrigger value="performance">Performance History</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {services.map((service, index) => (
                            <motion.div
                                key={service.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <service.icon className="w-5 h-5 text-gray-400" />
                                                <div
                                                    className={`w-3 h-3 rounded-full ${service.status === "healthy" ? "bg-green-400" : service.status === "warning" ? "bg-yellow-400" : "bg-red-400"}`}
                                                />
                                            </div>
                                            <Badge className={getStatusColor(service.status)}>
                                                {service.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <h4 className="font-semibold text-white mb-1">
                                            {service.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 mb-3">
                                            {service.description}
                                        </p>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">Uptime</span>
                                                <span className="text-white">{service.uptime}%</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">Response</span>
                                                <span className="text-white">
                                                    {service.responseTime}ms
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">Last Check</span>
                                                <span className="text-white">
                                                    {service.lastCheck.toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>

                                        {service.url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-3 text-xs"
                                                onClick={() => window.open(service.url, "_blank")}
                                            >
                                                Open Service
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {systemMetrics.map((metric, index) => (
                            <motion.div
                                key={metric.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-gray-900/50 border-gray-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <metric.icon className="w-5 h-5 text-cyan-400" />
                                                <h4 className="font-semibold text-white">
                                                    {metric.name}
                                                </h4>
                                            </div>
                                            <Badge
                                                className={
                                                    getMetricStatus(metric) === "good"
                                                        ? "bg-green-400/20 text-green-400"
                                                        : getMetricStatus(metric) === "warning"
                                                            ? "bg-yellow-400/20 text-yellow-400"
                                                            : "bg-red-400/20 text-red-400"
                                                }
                                            >
                                                {getMetricStatus(metric).toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="text-2xl font-bold text-white mb-2">
                                            {metric.value.toFixed(1)}
                                            {metric.unit}
                                        </div>

                                        <Progress
                                            value={(metric.value / metric.threshold) * 100}
                                            className="mb-2"
                                        />

                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>0{metric.unit}</span>
                                            <span>
                                                {metric.threshold}
                                                {metric.unit}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-400 mt-2">
                                            {metric.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardHeader>
                                <CardTitle>System Resource Usage</CardTitle>
                                <CardDescription>
                                    CPU and Memory utilization over time
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={performanceHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="time" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                                border: "1px solid #374151",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="cpu"
                                            stackId="1"
                                            stroke="#ef4444"
                                            fill="#ef4444"
                                            fillOpacity={0.6}
                                            name="CPU %"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="memory"
                                            stackId="2"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.6}
                                            name="Memory %"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900/50 border-gray-800">
                            <CardHeader>
                                <CardTitle>Network & Response Time</CardTitle>
                                <CardDescription>
                                    Network throughput and API response times
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={performanceHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="time" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                                border: "1px solid #374151",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="network"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                                            name="Network MB/s"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="responseTime"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                                            name="Response Time (ms)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SystemHealth;

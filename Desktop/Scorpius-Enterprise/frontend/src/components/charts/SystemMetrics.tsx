import React, { useState, useEffect } from "react";
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
  BarChart,
  Bar,
} from "recharts";

interface SystemData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeScans: number;
  responseTime: number;
}

interface SystemMetricsProps {
  className?: string;
}

export function SystemMetrics({ className = "" }: SystemMetricsProps) {
  const [metrics, setMetrics] = useState<SystemData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<
    "performance" | "usage" | "network" | "scans"
  >("performance");
  const [isLive, setIsLive] = useState(true);

  // Generate system metrics
  useEffect(() => {
    const generateMetric = (): SystemData => ({
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      cpu: Math.random() * 30 + 40, // 40-70%
      memory: Math.random() * 25 + 50, // 50-75%
      disk: Math.random() * 10 + 20, // 20-30%
      network: Math.random() * 40 + 30, // 30-70 Mbps
      activeScans: Math.floor(Math.random() * 50) + 20, // 20-70 scans
      responseTime: Math.random() * 100 + 50, // 50-150ms
    });

    // Initial data
    const initialData = Array.from({ length: 30 }, generateMetric);
    setMetrics(initialData);

    // Live updates
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setMetrics((prev) => [...prev.slice(1), generateMetric()]);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-black">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toFixed(1)}${getUnit(entry.dataKey)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getUnit = (dataKey: string) => {
    switch (dataKey) {
      case "cpu":
      case "memory":
      case "disk":
        return "%";
      case "network":
        return " Mbps";
      case "responseTime":
        return "ms";
      case "activeScans":
        return " scans";
      default:
        return "";
    }
  };

  const renderChart = () => {
    switch (selectedMetric) {
      case "performance":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#cpuGradient)"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#memoryGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "usage":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cpu" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="memory" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="disk" fill="#06b6d4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "network":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="network"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 2 }}
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "scans":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="scansGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="activeScans"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#scansGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getMetricStatus = (value: number, thresholds: number[]) => {
    if (value < thresholds[0]) return { color: "#10b981", status: "Good" };
    if (value < thresholds[1]) return { color: "#f59e0b", status: "Warning" };
    return { color: "#ef4444", status: "Critical" };
  };

  const currentMetrics = metrics[metrics.length - 1] || {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    activeScans: 0,
    responseTime: 0,
  };

  const statusIndicators = [
    {
      label: "CPU Usage",
      value: currentMetrics.cpu,
      unit: "%",
      thresholds: [70, 85],
    },
    {
      label: "Memory Usage",
      value: currentMetrics.memory,
      unit: "%",
      thresholds: [75, 90],
    },
    {
      label: "Disk Usage",
      value: currentMetrics.disk,
      unit: "%",
      thresholds: [80, 95],
    },
    {
      label: "Response Time",
      value: currentMetrics.responseTime,
      unit: "ms",
      thresholds: [100, 200],
    },
  ];

  return (
    <div
      className={`w-full bg-gray-50 rounded-lg border border-gray-300 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
            System Health Metrics
          </h3>
          <div
            className={`w-2 h-2 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
          ></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
            {(["performance", "usage", "network", "scans"] as const).map(
              (metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedMetric === metric
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ),
            )}
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              isLive
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-green-100 text-green-600 hover:bg-green-200"
            }`}
          >
            {isLive ? "Pause" : "Start"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 bg-white rounded border border-gray-200 p-3 mb-4">
        {renderChart()}
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {statusIndicators.map((indicator, index) => {
          const status = getMetricStatus(indicator.value, indicator.thresholds);
          return (
            <div
              key={index}
              className="bg-white rounded border border-gray-200 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">{indicator.label}</span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                ></div>
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: status.color }}
              >
                {indicator.value.toFixed(1)}
                {indicator.unit}
              </div>
              <div className="text-xs text-gray-500">{status.status}</div>
            </div>
          );
        })}
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded border border-gray-200 p-3">
          <h4 className="text-sm font-medium text-black mb-3">
            Current Activity
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Scans</span>
              <span className="text-blue-600 font-medium">
                {currentMetrics.activeScans}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Network Throughput</span>
              <span className="text-cyan-600 font-medium">
                {currentMetrics.network.toFixed(1)} Mbps
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="text-purple-600 font-medium">
                {currentMetrics.responseTime.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">System Uptime</span>
              <span className="text-green-600 font-medium">99.8%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-3">
          <h4 className="text-sm font-medium text-black mb-3">
            Performance Alerts
          </h4>
          <div className="space-y-2 text-xs">
            {statusIndicators
              .filter(
                (indicator) =>
                  getMetricStatus(indicator.value, indicator.thresholds)
                    .status !== "Good",
              )
              .map((alert, index) => {
                const status = getMetricStatus(alert.value, alert.thresholds);
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 rounded"
                    style={{
                      backgroundColor: `${status.color}15`,
                      borderLeft: `3px solid ${status.color}`,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-gray-700">
                      {alert.label}: {alert.value.toFixed(1)}
                      {alert.unit} ({status.status})
                    </span>
                  </div>
                );
              })}
            {statusIndicators.every(
              (indicator) =>
                getMetricStatus(indicator.value, indicator.thresholds)
                  .status === "Good",
            ) && (
              <div className="text-center text-gray-500 py-4">
                All systems operating normally
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

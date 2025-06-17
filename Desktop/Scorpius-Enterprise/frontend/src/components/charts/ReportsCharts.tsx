import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface ReportsChartsProps {
  className?: string;
}

const securityTrends = [
  { month: "Jan", vulnerabilities: 45, resolved: 42, critical: 3 },
  { month: "Feb", vulnerabilities: 52, resolved: 48, critical: 4 },
  { month: "Mar", vulnerabilities: 38, resolved: 35, critical: 2 },
  { month: "Apr", vulnerabilities: 61, resolved: 55, critical: 6 },
  { month: "May", vulnerabilities: 43, resolved: 41, critical: 2 },
  { month: "Jun", vulnerabilities: 67, resolved: 60, critical: 7 },
];

const threatDistribution = [
  { name: "MEV Attacks", value: 35, color: "#ef4444" },
  { name: "Reentrancy", value: 25, color: "#f59e0b" },
  { name: "Flash Loans", value: 20, color: "#eab308" },
  { name: "Oracle Manipulation", value: 12, color: "#06b6d4" },
  { name: "Access Control", value: 8, color: "#6b7280" },
];

const dailyActivity = [
  { day: "Mon", scans: 234, alerts: 12, blocks: 1280 },
  { day: "Tue", scans: 289, alerts: 18, blocks: 1456 },
  { day: "Wed", scans: 321, alerts: 15, blocks: 1389 },
  { day: "Thu", scans: 276, alerts: 22, blocks: 1512 },
  { day: "Fri", scans: 398, alerts: 19, blocks: 1634 },
  { day: "Sat", scans: 201, alerts: 8, blocks: 1124 },
  { day: "Sun", scans: 167, alerts: 6, blocks: 987 },
];

const performanceMetrics = [
  { time: "00:00", cpu: 45, memory: 62, network: 34 },
  { time: "04:00", cpu: 52, memory: 58, network: 28 },
  { time: "08:00", cpu: 78, memory: 74, network: 65 },
  { time: "12:00", cpu: 85, memory: 82, network: 72 },
  { time: "16:00", cpu: 92, memory: 88, network: 89 },
  { time: "20:00", cpu: 68, memory: 71, network: 45 },
];

export function ReportsCharts({ className = "" }: ReportsChartsProps) {
  const [selectedChart, setSelectedChart] = useState<
    "security" | "threats" | "activity" | "performance"
  >("security");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-black">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey.includes("cpu") || entry.dataKey.includes("memory") || entry.dataKey.includes("network") ? "%" : ""}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (selectedChart) {
      case "security":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={securityTrends}>
              <defs>
                <linearGradient
                  id="vulnerabilitiesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="resolvedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="vulnerabilities"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#vulnerabilitiesGradient)"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#resolvedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "threats":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={threatDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {threatDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "activity":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="alerts" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "performance":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="network"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getChartLegend = () => {
    switch (selectedChart) {
      case "security":
        return (
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-gray-600">Vulnerabilities</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-gray-600">Resolved</span>
            </div>
          </div>
        );

      case "threats":
        return (
          <div className="grid grid-cols-2 gap-1 text-xs">
            {threatDistribution.map((threat, index) => (
              <div key={index} className="flex items-center space-x-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: threat.color }}
                ></div>
                <span className="text-gray-600 truncate">{threat.name}</span>
              </div>
            ))}
          </div>
        );

      case "activity":
        return (
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-gray-600">Scans</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-gray-600">Alerts</span>
            </div>
          </div>
        );

      case "performance":
        return (
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-gray-600">CPU</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span className="text-gray-600">Memory</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span className="text-gray-600">Network</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full bg-gray-50 rounded-lg border border-gray-300 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
          Security Reports Dashboard
        </h3>
        <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
          {(["security", "threats", "activity", "performance"] as const).map(
            (chart) => (
              <button
                key={chart}
                onClick={() => setSelectedChart(chart)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedChart === chart
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {chart.charAt(0).toUpperCase() + chart.slice(1)}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 bg-white rounded border border-gray-200 p-3 mb-4">
        {renderChart()}
      </div>

      {/* Legend and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded border border-gray-200 p-3">
          <h4 className="text-sm font-medium text-black mb-3">Legend</h4>
          {getChartLegend()}
        </div>

        <div className="bg-white rounded border border-gray-200 p-3">
          <h4 className="text-sm font-medium text-black mb-3">Quick Stats</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Scans</span>
              <span className="text-blue-600 font-medium">2,186</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Threats</span>
              <span className="text-red-600 font-medium">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resolution Rate</span>
              <span className="text-green-600 font-medium">94.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">System Health</span>
              <span className="text-cyan-600 font-medium">98.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

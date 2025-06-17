import React, { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface RiskMetric {
  category: string;
  current: number;
  threshold: number;
  historical: number[];
}

interface RiskRadarProps {
  className?: string;
}

const riskMetrics: RiskMetric[] = [
  {
    category: "Contract Complexity",
    current: 75,
    threshold: 80,
    historical: [65, 70, 72, 75, 78, 75],
  },
  {
    category: "Liquidity Risk",
    current: 45,
    threshold: 70,
    historical: [40, 42, 48, 45, 50, 45],
  },
  {
    category: "Owner Privileges",
    current: 90,
    threshold: 60,
    historical: [85, 88, 92, 90, 91, 90],
  },
  {
    category: "Code Verification",
    current: 30,
    threshold: 50,
    historical: [35, 32, 28, 30, 31, 30],
  },
  {
    category: "Trading Patterns",
    current: 65,
    threshold: 75,
    historical: [60, 62, 68, 65, 67, 65],
  },
  {
    category: "External Calls",
    current: 55,
    threshold: 70,
    historical: [50, 52, 58, 55, 57, 55],
  },
];

const riskLevels = {
  low: { color: "#10b981", label: "Low Risk", range: [0, 33] },
  medium: { color: "#f59e0b", label: "Medium Risk", range: [34, 66] },
  high: { color: "#ef4444", label: "High Risk", range: [67, 100] },
};

export function RiskRadar({ className = "" }: RiskRadarProps) {
  const [selectedMetric, setSelectedMetric] = useState<RiskMetric | null>(null);
  const [viewMode, setViewMode] = useState<"radar" | "trend">("radar");

  const radarData = riskMetrics.map((metric) => ({
    category: metric.category.split(" ")[0], // Shortened labels
    current: metric.current,
    threshold: metric.threshold,
    fullName: metric.category,
  }));

  const getRiskLevel = (value: number) => {
    if (value <= 33) return riskLevels.low;
    if (value <= 66) return riskLevels.medium;
    return riskLevels.high;
  };

  const overallRisk =
    riskMetrics.reduce((sum, metric) => sum + metric.current, 0) /
    riskMetrics.length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-black">{data.fullName}</p>
          <p className="text-sm text-blue-600">Current: {data.current}%</p>
          <p className="text-sm text-red-600">Threshold: {data.threshold}%</p>
        </div>
      );
    }
    return null;
  };

  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-black">Day {label}</p>
          <p className="text-sm text-blue-600">Risk: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  const trendData = selectedMetric
    ? selectedMetric.historical.map((value, index) => ({
        day: index + 1,
        risk: value,
      }))
    : [];

  return (
    <div
      className={`w-full bg-gray-50 rounded-lg border border-gray-300 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
          Honeypot Risk Assessment
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
            {(["radar", "trend"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === mode
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <div className="h-64 bg-white rounded border border-gray-200 p-3">
            {viewMode === "radar" ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 8, fill: "#6b7280" }}
                  />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Threshold"
                    dataKey="threshold"
                    stroke="#ef4444"
                    fill="none"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full">
                {selectedMetric ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="day"
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
                      <Tooltip content={<TrendTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="risk"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#3b82f6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a metric to view its trend
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Risk Metrics List */}
        <div className="space-y-4">
          {/* Overall Risk Score */}
          <div className="bg-white rounded border border-gray-200 p-3">
            <h4 className="text-sm font-medium text-black mb-3">
              Overall Risk Score
            </h4>
            <div className="text-center">
              <div
                className="text-2xl font-bold mb-2"
                style={{ color: getRiskLevel(overallRisk).color }}
              >
                {overallRisk.toFixed(0)}%
              </div>
              <div
                className="text-sm"
                style={{ color: getRiskLevel(overallRisk).color }}
              >
                {getRiskLevel(overallRisk).label}
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${overallRisk}%`,
                    backgroundColor: getRiskLevel(overallRisk).color,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Individual Metrics */}
          <div className="bg-white rounded border border-gray-200 p-3">
            <h4 className="text-sm font-medium text-black mb-3">
              Risk Factors
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {riskMetrics.map((metric, index) => (
                <div
                  key={index}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedMetric === metric
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedMetric(metric)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 truncate">
                      {metric.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getRiskLevel(metric.current).color,
                        }}
                      ></div>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: getRiskLevel(metric.current).color,
                        }}
                      >
                        {metric.current}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${metric.current}%`,
                        backgroundColor: getRiskLevel(metric.current).color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Level Legend */}
          <div className="bg-white rounded border border-gray-200 p-3">
            <h4 className="text-sm font-medium text-black mb-3">Risk Levels</h4>
            <div className="space-y-2">
              {Object.values(riskLevels).map((level, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: level.color }}
                  ></div>
                  <span className="text-xs text-gray-600">{level.label}</span>
                  <span className="text-xs text-gray-500">
                    ({level.range[0]}-{level.range[1]}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

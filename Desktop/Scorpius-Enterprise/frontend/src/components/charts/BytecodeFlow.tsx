import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface FunctionData {
  name: string;
  complexity: number;
  gasUsage: number;
  vulnerabilities: number;
  calls: number;
}

interface BytecodeFlowProps {
  className?: string;
}

const mockFunctions: FunctionData[] = [
  {
    name: "transfer",
    complexity: 15,
    gasUsage: 21000,
    vulnerabilities: 0,
    calls: 1250,
  },
  {
    name: "approve",
    complexity: 8,
    gasUsage: 46000,
    vulnerabilities: 1,
    calls: 890,
  },
  {
    name: "balanceOf",
    complexity: 3,
    gasUsage: 1400,
    vulnerabilities: 0,
    calls: 2100,
  },
  {
    name: "transferFrom",
    complexity: 22,
    gasUsage: 51000,
    vulnerabilities: 2,
    calls: 650,
  },
  {
    name: "mint",
    complexity: 18,
    gasUsage: 75000,
    vulnerabilities: 1,
    calls: 320,
  },
  {
    name: "burn",
    complexity: 12,
    gasUsage: 42000,
    vulnerabilities: 0,
    calls: 180,
  },
  {
    name: "allowance",
    complexity: 5,
    gasUsage: 800,
    vulnerabilities: 0,
    calls: 450,
  },
  {
    name: "pause",
    complexity: 25,
    gasUsage: 28000,
    vulnerabilities: 3,
    calls: 45,
  },
];

const vulnerabilityTypes = [
  { name: "Reentrancy", value: 35, color: "#ef4444" },
  { name: "Integer Overflow", value: 25, color: "#f59e0b" },
  { name: "Access Control", value: 20, color: "#eab308" },
  { name: "DoS", value: 15, color: "#06b6d4" },
  { name: "Other", value: 5, color: "#6b7280" },
];

export function BytecodeFlow({ className = "" }: BytecodeFlowProps) {
  const [selectedView, setSelectedView] = useState<
    "complexity" | "gas" | "vulnerabilities"
  >("complexity");

  const getBarColor = (dataKey: string) => {
    switch (dataKey) {
      case "complexity":
        return "#3b82f6";
      case "gasUsage":
        return "#06b6d4";
      case "vulnerabilities":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-black">{`Function: ${label}`}</p>
          <p className="text-sm text-blue-600">{`Complexity: ${data.complexity}`}</p>
          <p className="text-sm text-cyan-600">{`Gas Usage: ${data.gasUsage.toLocaleString()}`}</p>
          <p className="text-sm text-red-600">{`Vulnerabilities: ${data.vulnerabilities}`}</p>
          <p className="text-sm text-gray-600">{`Calls: ${data.calls.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`w-full bg-gray-50 rounded-lg border border-gray-300 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
          Bytecode Analysis
        </h3>
        <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
          {(["complexity", "gas", "vulnerabilities"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedView === view
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <div className="h-64 bg-white rounded border border-gray-200 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockFunctions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={selectedView === "gas" ? "gasUsage" : selectedView}
                  fill={getBarColor(selectedView)}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vulnerability Breakdown */}
        <div className="space-y-4">
          <div className="bg-white rounded border border-gray-200 p-3">
            <h4 className="text-sm font-medium text-black mb-3">
              Vulnerability Types
            </h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vulnerabilityTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {vulnerabilityTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {vulnerabilityTypes.map((type, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: type.color }}
                    ></div>
                    <span className="text-gray-600">{type.name}</span>
                  </div>
                  <span className="text-gray-800">{type.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white rounded border border-gray-200 p-3 space-y-3">
            <h4 className="text-sm font-medium text-black">Summary</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Functions</span>
                <span className="text-black font-medium">
                  {mockFunctions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">High Complexity</span>
                <span className="text-red-600 font-medium">
                  {mockFunctions.filter((f) => f.complexity > 20).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Vulnerabilities</span>
                <span className="text-red-600 font-medium">
                  {mockFunctions.reduce((sum, f) => sum + f.vulnerabilities, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Gas Usage</span>
                <span className="text-cyan-600 font-medium">
                  {Math.round(
                    mockFunctions.reduce((sum, f) => sum + f.gasUsage, 0) /
                      mockFunctions.length,
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from "recharts";

interface MEVOpportunity {
  timestamp: string;
  type: "arbitrage" | "sandwich" | "liquidation" | "frontrun";
  profit: number;
  volume: number;
  gasUsed: number;
  success: boolean;
}

interface MEVChartProps {
  className?: string;
}

const mevTypes = {
  arbitrage: { color: "#3b82f6", label: "Arbitrage" },
  sandwich: { color: "#ef4444", label: "Sandwich" },
  liquidation: { color: "#10b981", label: "Liquidation" },
  frontrun: { color: "#f59e0b", label: "Front-running" },
};

export function MEVChart({ className = "" }: MEVChartProps) {
  const [opportunities, setOpportunities] = useState<MEVOpportunity[]>([]);
  const [chartType, setChartType] = useState<"timeline" | "profit" | "scatter">(
    "timeline",
  );
  const [isLive, setIsLive] = useState(true);

  // Generate mock MEV opportunities
  useEffect(() => {
    const generateOpportunity = (): MEVOpportunity => {
      const types = Object.keys(mevTypes) as Array<keyof typeof mevTypes>;
      const type = types[Math.floor(Math.random() * types.length)];

      return {
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        type,
        profit: Math.random() * 1000 + 50,
        volume: Math.random() * 50000 + 1000,
        gasUsed: Math.random() * 200000 + 21000,
        success: Math.random() > 0.3,
      };
    };

    // Initial data
    const initialData = Array.from({ length: 20 }, generateOpportunity);
    setOpportunities(initialData);

    // Live updates
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setOpportunities((prev) => [...prev.slice(-19), generateOpportunity()]);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const getChartData = () => {
    switch (chartType) {
      case "timeline":
        return opportunities.map((opp, index) => ({
          ...opp,
          index,
          profitUSD: opp.profit,
        }));

      case "profit":
        const profitByType = Object.keys(mevTypes).map((type) => {
          const typeOpps = opportunities.filter((opp) => opp.type === type);
          return {
            type: mevTypes[type as keyof typeof mevTypes].label,
            profit: typeOpps.reduce((sum, opp) => sum + opp.profit, 0),
            count: typeOpps.length,
            successRate:
              typeOpps.length > 0
                ? (typeOpps.filter((opp) => opp.success).length /
                    typeOpps.length) *
                  100
                : 0,
          };
        });
        return profitByType;

      case "scatter":
        return opportunities.map((opp) => ({
          ...opp,
          x: opp.volume,
          y: opp.profit,
          z: opp.gasUsed / 1000,
        }));

      default:
        return [];
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      if (chartType === "scatter") {
        return (
          <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-black">
              {mevTypes[data.type as keyof typeof mevTypes].label}
            </p>
            <p className="text-xs text-gray-600">
              Volume: ${data.volume.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">
              Profit: ${data.profit.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600">
              Gas: {data.gasUsed.toLocaleString()}
            </p>
            <p
              className={`text-xs ${data.success ? "text-green-600" : "text-red-600"}`}
            >
              {data.success ? "Successful" : "Failed"}
            </p>
          </div>
        );
      }

      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-black">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const data = getChartData();

    switch (chartType) {
      case "timeline":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
                dataKey="profitUSD"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "profit":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="type"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="x"
                name="Volume"
                stroke="#6b7280"
                fontSize={10}
                label={{
                  value: "Volume ($)",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Profit"
                stroke="#6b7280"
                fontSize={10}
                label={{
                  value: "Profit ($)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {Object.entries(mevTypes).map(([type, config]) => (
                <Scatter
                  key={type}
                  data={data.filter((d) => d.type === type)}
                  fill={config.color}
                  name={config.label}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const stats = {
    totalProfit: opportunities.reduce((sum, opp) => sum + opp.profit, 0),
    totalOpportunities: opportunities.length,
    successRate:
      opportunities.length > 0
        ? (opportunities.filter((opp) => opp.success).length /
            opportunities.length) *
          100
        : 0,
    avgGasUsed:
      opportunities.length > 0
        ? opportunities.reduce((sum, opp) => sum + opp.gasUsed, 0) /
          opportunities.length
        : 0,
  };

  return (
    <div
      className={`w-full bg-gray-50 rounded-lg border border-gray-300 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
            MEV Opportunities
          </h3>
          <div
            className={`w-2 h-2 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
          ></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
            {(["timeline", "profit", "scatter"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  chartType === type
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
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

      {/* Stats and Legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            ${stats.totalProfit.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600">Total Profit</div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {stats.totalOpportunities}
          </div>
          <div className="text-xs text-gray-600">Opportunities</div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-cyan-600">
            {stats.successRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">Success Rate</div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-orange-600">
            {Math.round(stats.avgGasUsed).toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Avg Gas</div>
        </div>
      </div>

      {/* MEV Type Legend */}
      <div className="bg-white rounded border border-gray-200 p-3">
        <h4 className="text-sm font-medium text-black mb-3">MEV Types</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          {Object.entries(mevTypes).map(([type, config]) => (
            <div key={type} className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
              ></div>
              <span className="text-gray-600">{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

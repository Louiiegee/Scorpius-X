import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

interface TimelineEvent {
  timestamp: string;
  date: Date;
  event: string;
  severity: "low" | "medium" | "high" | "critical";
  value: number;
  description: string;
}

interface TimelineChartProps {
  className?: string;
}

const mockEvents: TimelineEvent[] = [
  {
    timestamp: "2024-01-15T10:30:00Z",
    date: new Date("2024-01-15T10:30:00Z"),
    event: "Contract Deployment",
    severity: "low",
    value: 1,
    description: "Smart contract deployed successfully",
  },
  {
    timestamp: "2024-01-16T14:22:00Z",
    date: new Date("2024-01-16T14:22:00Z"),
    event: "First Transaction",
    severity: "low",
    value: 2,
    description: "Initial transaction executed",
  },
  {
    timestamp: "2024-01-20T09:15:00Z",
    date: new Date("2024-01-20T09:15:00Z"),
    event: "Vulnerability Detected",
    severity: "medium",
    value: 5,
    description: "Potential reentrancy vulnerability found",
  },
  {
    timestamp: "2024-01-25T16:45:00Z",
    date: new Date("2024-01-25T16:45:00Z"),
    event: "High Gas Usage",
    severity: "medium",
    value: 4,
    description: "Unusual gas consumption pattern detected",
  },
  {
    timestamp: "2024-02-02T11:30:00Z",
    date: new Date("2024-02-02T11:30:00Z"),
    event: "Access Control Issue",
    severity: "high",
    value: 7,
    description: "Unauthorized access attempt detected",
  },
  {
    timestamp: "2024-02-10T13:20:00Z",
    date: new Date("2024-02-10T13:20:00Z"),
    event: "MEV Attack",
    severity: "critical",
    value: 10,
    description: "MEV sandwich attack detected",
  },
  {
    timestamp: "2024-02-15T08:45:00Z",
    date: new Date("2024-02-15T08:45:00Z"),
    event: "Flash Loan",
    severity: "high",
    value: 8,
    description: "Large flash loan transaction",
  },
  {
    timestamp: "2024-02-20T19:10:00Z",
    date: new Date("2024-02-20T19:10:00Z"),
    event: "Price Manipulation",
    severity: "critical",
    value: 9,
    description: "Oracle price manipulation detected",
  },
  {
    timestamp: "2024-02-25T12:35:00Z",
    date: new Date("2024-02-25T12:35:00Z"),
    event: "Honeypot Activity",
    severity: "high",
    value: 6,
    description: "Honeypot contract interaction",
  },
  {
    timestamp: "2024-03-01T15:50:00Z",
    date: new Date("2024-03-01T15:50:00Z"),
    event: "Security Patch",
    severity: "low",
    value: 2,
    description: "Security update applied",
  },
];

const timeRanges = [
  { label: "24H", value: 24 },
  { label: "7D", value: 168 },
  { label: "30D", value: 720 },
  { label: "All", value: 0 },
];

export function TimelineChart({ className = "" }: TimelineChartProps) {
  const [selectedRange, setSelectedRange] = useState(720); // 30 days default
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f59e0b";
      case "medium":
        return "#eab308";
      case "low":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const filteredEvents =
    selectedRange === 0
      ? mockEvents
      : mockEvents.filter((event) => {
          const hoursAgo =
            (new Date().getTime() - event.date.getTime()) / (1000 * 60 * 60);
          return hoursAgo <= selectedRange;
        });

  const chartData = filteredEvents.map((event) => ({
    ...event,
    x: event.date.getTime(),
    y: event.value,
    fill: getSeverityColor(event.severity),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-medium text-black">{data.event}</p>
          <p className="text-xs text-gray-600 mt-1">{data.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(data.timestamp).toLocaleString()}
          </p>
          <div className="flex items-center mt-2">
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: getSeverityColor(data.severity) }}
            ></div>
            <span
              className="text-xs capitalize"
              style={{ color: getSeverityColor(data.severity) }}
            >
              {data.severity} severity
            </span>
          </div>
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
          Security Timeline
        </h3>
        <div className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedRange(range.value)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedRange === range.value
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="h-64 bg-white rounded border border-gray-200 p-3 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="x"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(timestamp) =>
                new Date(timestamp).toLocaleDateString()
              }
              stroke="#6b7280"
              fontSize={10}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 10]}
              stroke="#6b7280"
              fontSize={10}
              label={{ value: "Severity", angle: -90, position: "insideLeft" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter dataKey="y" fill="#3b82f6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Event List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded border border-gray-200 p-3">
          <h4 className="text-sm font-medium text-black mb-3">Recent Events</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filteredEvents.slice(0, 6).map((event, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getSeverityColor(event.severity) }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-black truncate">{event.event}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-3">
          <h4 className="text-sm font-medium text-black mb-3">
            Severity Distribution
          </h4>
          <div className="space-y-2">
            {["critical", "high", "medium", "low"].map((severity) => {
              const count = filteredEvents.filter(
                (e) => e.severity === severity,
              ).length;
              const percentage =
                filteredEvents.length > 0
                  ? (count / filteredEvents.length) * 100
                  : 0;

              return (
                <div
                  key={severity}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getSeverityColor(severity) }}
                    ></div>
                    <span className="text-sm capitalize text-gray-600">
                      {severity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: getSeverityColor(severity),
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

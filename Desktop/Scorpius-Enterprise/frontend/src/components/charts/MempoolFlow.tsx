import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface TransactionData {
  time: string;
  transactions: number;
  gasPrice: number;
  volume: number;
}

interface MempoolFlowProps {
  className?: string;
}

export function MempoolFlow({ className = "" }: MempoolFlowProps) {
  const [data, setData] = useState<TransactionData[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Simulate real-time data
  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const newData: TransactionData[] = [];

      for (let i = 29; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 2000);
        newData.push({
          time: time.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          transactions: Math.floor(Math.random() * 500) + 100,
          gasPrice: Math.floor(Math.random() * 50) + 20,
          volume: Math.floor(Math.random() * 1000) + 200,
        });
      }

      return newData;
    };

    // Initial data
    setData(generateData());

    // Update data every 2 seconds if live
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setData((prevData) => {
          const newPoint = {
            time: new Date().toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            transactions: Math.floor(Math.random() * 500) + 100,
            gasPrice: Math.floor(Math.random() * 50) + 20,
            volume: Math.floor(Math.random() * 1000) + 200,
          };

          return [...prevData.slice(1), newPoint];
        });
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
          <p className="text-sm font-medium text-black">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey === "gasPrice" ? " gwei" : ""}`}
            </p>
          ))}
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
          Live Mempool Activity
        </h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
          ></div>
          <button
            onClick={() => setIsLive(!isLive)}
            className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
          >
            {isLive ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="transactionGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
            />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="transactions"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#transactionGradient)"
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#volumeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-white rounded border border-gray-200">
          <div className="text-lg font-bold text-blue-600">
            {data.length > 0 ? data[data.length - 1].transactions : 0}
          </div>
          <div className="text-xs text-gray-600">Transactions/min</div>
        </div>
        <div className="p-3 bg-white rounded border border-gray-200">
          <div className="text-lg font-bold text-cyan-600">
            {data.length > 0 ? data[data.length - 1].gasPrice : 0} gwei
          </div>
          <div className="text-xs text-gray-600">Avg Gas Price</div>
        </div>
        <div className="p-3 bg-white rounded border border-gray-200">
          <div className="text-lg font-bold text-blue-600">
            {data.length > 0 ? data[data.length - 1].volume : 0} ETH
          </div>
          <div className="text-xs text-gray-600">Volume</div>
        </div>
      </div>
    </div>
  );
}

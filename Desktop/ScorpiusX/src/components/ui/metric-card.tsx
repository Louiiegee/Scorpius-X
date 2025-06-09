import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiveCounter } from "./live-counter";

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  isText?: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend = "neutral",
  className,
  isText = false,
  prefix = "",
  suffix = "",
  decimals = 0,
}) => {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-gray-400",
  };

  const trendIcons = {
    up: "↗",
    down: "↘",
    neutral: "→",
  };

  return (
    <motion.div
      className={cn(
        "p-6 rounded-xl border border-gray-800 bg-black/40 backdrop-blur-sm",
        "hover:bg-black/60 transition-colors duration-300",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 8px 32px rgba(0, 255, 136, 0.1)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {icon && (
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="text-gray-500"
          >
            {icon}
          </motion.div>
        )}
      </div>

      <div className="flex items-end justify-between">
        {isText ? (
          <div className="text-2xl font-bold text-white">
            {prefix}
            {value}
            {suffix}
          </div>
        ) : (
          <LiveCounter
            value={value as number}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            className="text-2xl font-bold text-white"
          />
        )}

        {change !== undefined && (
          <motion.div
            className={cn("flex items-center text-sm", trendColors[trend])}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <span className="mr-1">{trendIcons[trend]}</span>
            <span>{Math.abs(change)}%</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

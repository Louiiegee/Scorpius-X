import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface LiveCounterProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  delay?: number;
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  formatNumber?: (value: number) => string;
  onComplete?: () => void;
}

const LiveCounter = ({
  value,
  duration = 2,
  className,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ",",
  delay = 0,
  springConfig = { stiffness: 100, damping: 30, mass: 1 },
  formatNumber,
  onComplete,
}: LiveCounterProps) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, springConfig);
  const previousValue = useRef(0);

  // Transform the spring value to formatted text
  const displayValue = useTransform(springValue, (latest) => {
    if (formatNumber) {
      return `${prefix}${formatNumber(latest)}${suffix}`;
    }

    const rounded = parseFloat(latest.toFixed(decimals));
    const formatted = rounded.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${prefix}${formatted.replace(/,/g, separator)}${suffix}`;
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: "easeOut",
      onComplete,
    });

    previousValue.current = value;
    return controls.stop;
  }, [value, duration, delay, motionValue, onComplete]);

  return (
    <motion.span
      className={cn("font-mono tabular-nums", className)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: delay * 0.5,
      }}
    >
      <motion.span>{displayValue}</motion.span>
    </motion.span>
  );
};

// Specialized counter for financial values
const CurrencyCounter = ({
  value,
  currency = "USD",
  locale = "en-US",
  ...props
}: Omit<LiveCounterProps, "formatNumber"> & {
  currency?: string;
  locale?: string;
}) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: props.decimals || 2,
      maximumFractionDigits: props.decimals || 2,
    }).format(val);

  return (
    <LiveCounter
      {...props}
      value={value}
      formatNumber={formatCurrency}
      prefix=""
      suffix=""
    />
  );
};

// Percentage counter with color changes
const PercentageCounter = ({
  value,
  showSign = true,
  colorThresholds,
  ...props
}: Omit<LiveCounterProps, "suffix"> & {
  showSign?: boolean;
  colorThresholds?: {
    positive: string;
    negative: string;
    neutral: string;
  };
}) => {
  const getColor = () => {
    if (!colorThresholds) return undefined;
    if (value > 0) return colorThresholds.positive;
    if (value < 0) return colorThresholds.negative;
    return colorThresholds.neutral;
  };

  const formatPercentage = (val: number) => {
    const sign = showSign && val > 0 ? "+" : "";
    return `${sign}${val.toFixed(props.decimals || 2)}`;
  };

  return (
    <motion.div animate={{ color: getColor() }} transition={{ duration: 0.3 }}>
      <LiveCounter
        {...props}
        value={value}
        formatNumber={formatPercentage}
        suffix="%"
      />
    </motion.div>
  );
};

// Compact inline counter for tables and lists
const InlineCounter = ({
  value,
  previousValue,
  className,
  ...props
}: LiveCounterProps & {
  previousValue?: number;
}) => {
  const hasIncreased = previousValue !== undefined && value > previousValue;
  const hasDecreased = previousValue !== undefined && value < previousValue;

  return (
    <motion.div
      className={cn("inline-flex items-center", className)}
      animate={{
        scale: hasIncreased || hasDecreased ? [1, 1.1, 1] : 1,
        color: hasIncreased ? "#10B981" : hasDecreased ? "#EF4444" : "#E5E7EB",
      }}
      transition={{
        scale: { duration: 0.3, ease: "easeOut" },
        color: { duration: 0.5, ease: "easeOut" },
      }}
    >
      <LiveCounter value={value} className="font-semibold" {...props} />
      {hasIncreased && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="ml-1 text-green-400"
        >
          ↑
        </motion.span>
      )}
      {hasDecreased && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="ml-1 text-red-400"
        >
          ↓
        </motion.span>
      )}
    </motion.div>
  );
};

export { LiveCounter, CurrencyCounter, PercentageCounter, InlineCounter };

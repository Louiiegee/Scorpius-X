import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Activity, Zap } from "lucide-react";

interface DataPoint {
  label: string;
  value: number;
  color: string;
  trend?: number;
}

interface Chart3DProps {
  title: string;
  data: DataPoint[];
  type: "bar" | "line" | "area" | "cylinder";
  className?: string;
  animated?: boolean;
}

export const Chart3D = ({
  title,
  data,
  type = "bar",
  className = "",
  animated = true,
}: Chart3DProps) => {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimationProgress(1);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [animated]);

  const maxValue = Math.max(...data.map((d) => d.value));

  const renderBar3D = (item: DataPoint, index: number) => {
    const height = (item.value / maxValue) * 200 * animationProgress;
    const width = 40;
    const depth = 30;

    return (
      <div
        key={index}
        className="relative flex flex-col items-center"
        style={{
          transform: `perspective(400px) rotateX(15deg) rotateY(-10deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* 3D Bar */}
        <div className="relative" style={{ marginBottom: "10px" }}>
          {/* Front face */}
          <div
            className="absolute rounded-t-lg transition-all duration-1000 ease-out"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              background: `linear-gradient(135deg, ${item.color}, ${item.color}90)`,
              boxShadow: `0 0 20px ${item.color}40, inset 0 0 20px ${item.color}20`,
              border: `1px solid ${item.color}`,
              transform: `translateZ(${depth / 2}px)`,
              transitionDelay: `${index * 100}ms`,
            }}
          />

          {/* Right face */}
          <div
            className="absolute rounded-tr-lg transition-all duration-1000 ease-out"
            style={{
              width: `${depth}px`,
              height: `${height}px`,
              background: `linear-gradient(135deg, ${item.color}80, ${item.color}60)`,
              transform: `rotateY(90deg) translateZ(${width / 2}px)`,
              transformOrigin: "left",
              transitionDelay: `${index * 100}ms`,
            }}
          />

          {/* Top face */}
          <div
            className="absolute rounded-lg transition-all duration-1000 ease-out"
            style={{
              width: `${width}px`,
              height: `${depth}px`,
              background: `linear-gradient(135deg, ${item.color}90, ${item.color}70)`,
              transform: `rotateX(90deg) translateZ(${height}px)`,
              transformOrigin: "bottom",
              transitionDelay: `${index * 100}ms`,
            }}
          />
        </div>

        {/* Value label */}
        <div
          className="text-white font-mono text-sm font-bold mb-2"
          style={{
            textShadow: `0 0 10px ${item.color}`,
            opacity: animationProgress,
            transition: "opacity 1s ease-out",
            transitionDelay: `${index * 150 + 500}ms`,
          }}
        >
          {item.value}
        </div>

        {/* Label */}
        <div className="text-gray-300 text-xs font-body text-center max-w-[60px] leading-tight">
          {item.label}
        </div>

        {/* Trend indicator */}
        {item.trend && (
          <div
            className={`flex items-center mt-1 text-xs ${
              item.trend > 0 ? "text-success" : "text-error"
            }`}
            style={{
              opacity: animationProgress,
              transition: "opacity 1s ease-out",
              transitionDelay: `${index * 150 + 800}ms`,
            }}
          >
            <TrendingUp
              className={`w-3 h-3 mr-1 ${item.trend < 0 ? "rotate-180" : ""}`}
            />
            {Math.abs(item.trend)}%
          </div>
        )}
      </div>
    );
  };

  const renderCylinder3D = (item: DataPoint, index: number) => {
    const height = (item.value / maxValue) * 200 * animationProgress;
    const radius = 25;

    return (
      <div
        key={index}
        className="relative flex flex-col items-center"
        style={{
          transform: `perspective(500px) rotateX(20deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* 3D Cylinder */}
        <div className="relative" style={{ marginBottom: "10px" }}>
          {/* Cylinder body */}
          <div
            className="relative rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${radius * 2}px`,
              height: `${height}px`,
              background: `linear-gradient(135deg, ${item.color}, ${item.color}70)`,
              boxShadow: `
                0 0 30px ${item.color}40,
                inset -10px 0 20px ${item.color}30,
                inset 10px 0 20px ${item.color}60
              `,
              border: `1px solid ${item.color}`,
              transitionDelay: `${index * 100}ms`,
            }}
          />

          {/* Top ellipse */}
          <div
            className="absolute rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${radius * 2}px`,
              height: `${radius}px`,
              background: `radial-gradient(ellipse, ${item.color}90, ${item.color}60)`,
              top: `-${radius / 2}px`,
              left: "0",
              border: `1px solid ${item.color}`,
              boxShadow: `0 0 15px ${item.color}50`,
              transitionDelay: `${index * 100 + 200}ms`,
            }}
          />

          {/* Bottom ellipse */}
          <div
            className="absolute rounded-full"
            style={{
              width: `${radius * 2}px`,
              height: `${radius}px`,
              background: `radial-gradient(ellipse, ${item.color}60, ${item.color}40)`,
              bottom: `-${radius / 2}px`,
              left: "0",
              border: `1px solid ${item.color}80`,
            }}
          />
        </div>

        {/* Floating value */}
        <div
          className="text-white font-mono text-sm font-bold mb-2 relative"
          style={{
            textShadow: `0 0 10px ${item.color}`,
            opacity: animationProgress,
            transition: "opacity 1s ease-out",
            transitionDelay: `${index * 150 + 500}ms`,
            transform: "translateZ(20px)",
          }}
        >
          {item.value}
        </div>

        <div className="text-gray-300 text-xs font-body text-center max-w-[60px] leading-tight">
          {item.label}
        </div>
      </div>
    );
  };

  const renderAreaChart = () => {
    const svgHeight = 150;
    const svgWidth = 300;
    const pathData = data
      .map((item, index) => {
        const x = (index / (data.length - 1)) * svgWidth;
        const y =
          svgHeight - (item.value / maxValue) * svgHeight * animationProgress;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    const areaData = `${pathData} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

    return (
      <div className="relative">
        <svg width={svgWidth} height={svgHeight} className="overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Area fill */}
          <path
            d={areaData}
            fill="url(#areaGradient)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#00ffff"
            strokeWidth="3"
            filter="url(#glow)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * svgWidth;
            const y =
              svgHeight -
              (item.value / maxValue) * svgHeight * animationProgress;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={item.color}
                stroke="#fff"
                strokeWidth="2"
                filter="url(#glow)"
                className="transition-all duration-1000 ease-out"
                style={{ transitionDelay: `${index * 100}ms` }}
              />
            );
          })}
        </svg>

        {/* Labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-bg border-2 border-primary/40 rounded-3xl p-6 ${className}`}
      style={{
        boxShadow:
          "0 0 25px rgba(0, 255, 255, 0.2), inset 0 0 25px rgba(0, 255, 255, 0.05)",
        background:
          "linear-gradient(135deg, rgba(0, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.97) 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center"
          style={{ boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)" }}
        >
          {type === "cylinder" ? (
            <Zap className="w-4 h-4 text-primary" />
          ) : type === "area" ? (
            <Activity className="w-4 h-4 text-primary" />
          ) : (
            <BarChart3 className="w-4 h-4 text-primary" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-white font-header tracking-wide">
          {title}
        </h3>
      </div>

      {/* Chart Content */}
      <div className="flex items-end justify-center gap-6 min-h-[250px]">
        {type === "area"
          ? renderAreaChart()
          : type === "cylinder"
            ? data.map((item, index) => renderCylinder3D(item, index))
            : data.map((item, index) => renderBar3D(item, index))}
      </div>
    </div>
  );
};

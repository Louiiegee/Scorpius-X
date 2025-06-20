import { useState, useEffect } from "react";
import { TrendingUp, Activity, Zap, DollarSign } from "lucide-react";

interface HeatmapData {
  x: number;
  y: number;
  value: number;
  label: string;
  intensity: number; // 0-1
}

interface Heatmap3DProps {
  title: string;
  data: HeatmapData[];
  width?: number;
  height?: number;
  className?: string;
}

export const Heatmap3D = ({
  title,
  data,
  width = 12,
  height = 8,
  className = "",
}: Heatmap3DProps) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getIntensityColor = (intensity: number) => {
    if (intensity > 0.8) return "#ff4444"; // High intensity - red
    if (intensity > 0.6) return "#ff8844"; // Medium-high - orange
    if (intensity > 0.4) return "#ffaa00"; // Medium - yellow
    if (intensity > 0.2) return "#00e5ff"; // Medium-low - light blue
    return "#00ffff"; // Low intensity - cyan
  };

  const getIntensityHeight = (intensity: number) => {
    return 5 + intensity * 25; // 5px to 30px height
  };

  const generateGrid = () => {
    const grid = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dataPoint = data.find((d) => d.x === x && d.y === y);
        const intensity = dataPoint?.intensity || Math.random() * 0.3; // Random low intensity for empty cells
        const value = dataPoint?.value || 0;
        const label = dataPoint?.label || `Cell ${x},${y}`;

        grid.push({
          x,
          y,
          intensity,
          value,
          label,
          color: getIntensityColor(intensity),
          height: getIntensityHeight(intensity),
        });
      }
    }

    return grid;
  };

  const gridData = generateGrid();

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
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-white font-header tracking-wide">
          {title}
        </h3>
      </div>

      {/* 3D Heatmap Grid */}
      <div
        className="relative w-full h-96 flex items-center justify-center overflow-hidden"
        style={{
          perspective: "1000px",
          background:
            "radial-gradient(circle at center, rgba(0, 255, 255, 0.05) 0%, transparent 70%)",
        }}
      >
        {/* Grid container */}
        <div
          className="relative"
          style={{
            transform: "rotateX(60deg) rotateY(-15deg)",
            transformStyle: "preserve-3d",
            width: `${width * 30}px`,
            height: `${height * 30}px`,
          }}
        >
          {/* Base grid */}
          <div
            className="absolute inset-0 grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${width}, 1fr)`,
              gridTemplateRows: `repeat(${height}, 1fr)`,
              transform: "translateZ(-5px)",
            }}
          >
            {gridData.map((cell, index) => (
              <div
                key={index}
                className="border border-primary/20 bg-surface/20"
                style={{
                  borderRadius: "2px",
                }}
              />
            ))}
          </div>

          {/* 3D Cells */}
          <div
            className="absolute inset-0 grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${width}, 1fr)`,
              gridTemplateRows: `repeat(${height}, 1fr)`,
            }}
          >
            {gridData.map((cell, index) => (
              <div
                key={index}
                className="relative cursor-pointer transition-all duration-300"
                onMouseEnter={() =>
                  setHoveredCell(
                    data.find((d) => d.x === cell.x && d.y === cell.y) || null,
                  )
                }
                onMouseLeave={() => setHoveredCell(null)}
                style={{
                  transform: `translateZ(${cell.height * animationProgress}px)`,
                  transformStyle: "preserve-3d",
                  transitionDelay: `${(cell.x + cell.y) * 50}ms`,
                }}
              >
                {/* Cell glow base */}
                <div
                  className="absolute inset-0 rounded blur-sm"
                  style={{
                    backgroundColor: cell.color,
                    opacity: cell.intensity * 0.6,
                    transform: "translateZ(-2px) scale(1.2)",
                  }}
                />

                {/* Main cell */}
                <div
                  className="w-full h-full rounded border transition-all duration-300"
                  style={{
                    backgroundColor: `${cell.color}${Math.floor(
                      cell.intensity * 255,
                    )
                      .toString(16)
                      .padStart(2, "0")}`,
                    borderColor: cell.color,
                    boxShadow: `0 0 10px ${cell.color}60, inset 0 0 5px ${cell.color}40`,
                    borderWidth:
                      hoveredCell &&
                      hoveredCell.x === cell.x &&
                      hoveredCell.y === cell.y
                        ? "2px"
                        : "1px",
                  }}
                />

                {/* Top face for 3D effect */}
                <div
                  className="absolute inset-0 rounded transition-all duration-300"
                  style={{
                    backgroundColor: `${cell.color}80`,
                    transform: `rotateX(90deg) translateZ(${cell.height / 2}px)`,
                    transformOrigin: "bottom",
                    opacity: cell.intensity,
                  }}
                />

                {/* Side face for 3D effect */}
                <div
                  className="absolute right-0 top-0 rounded-r transition-all duration-300"
                  style={{
                    width: `${cell.height}px`,
                    height: "100%",
                    backgroundColor: `${cell.color}60`,
                    transform: `rotateY(90deg) translateZ(100%)`,
                    transformOrigin: "left",
                    opacity: cell.intensity * 0.8,
                  }}
                />

                {/* Value label for high-intensity cells */}
                {cell.intensity > 0.6 && cell.value > 0 && (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono"
                    style={{
                      color: cell.intensity > 0.8 ? "#fff" : "#000",
                      textShadow:
                        cell.intensity > 0.8 ? "0 0 4px #000" : "0 0 4px #fff",
                      transform: `translateZ(${cell.height + 2}px)`,
                    }}
                  >
                    {cell.value > 1000
                      ? `${(cell.value / 1000).toFixed(1)}K`
                      : cell.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {hoveredCell && (
          <div
            className="absolute top-4 right-4 bg-bg border-2 border-primary/40 rounded-xl p-4 min-w-48 z-10"
            style={{
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
            }}
          >
            <div className="text-white font-semibold font-body mb-2">
              {hoveredCell.label}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400 font-body">Position:</span>
                <span className="text-white font-mono">
                  ({hoveredCell.x}, {hoveredCell.y})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-body">Value:</span>
                <span className="text-primary font-mono">
                  ${hoveredCell.value.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-body">Intensity:</span>
                <span
                  className={`font-mono ${
                    hoveredCell.intensity > 0.8
                      ? "text-error"
                      : hoveredCell.intensity > 0.6
                        ? "text-warning"
                        : hoveredCell.intensity > 0.4
                          ? "text-info"
                          : "text-success"
                  }`}
                >
                  {Math.round(hoveredCell.intensity * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cyan-400"></div>
            <span className="text-gray-400 font-body">Low Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-400"></div>
            <span className="text-gray-400 font-body">Medium Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-400"></div>
            <span className="text-gray-400 font-body">High Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-400"></div>
            <span className="text-gray-400 font-body">Critical Activity</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 font-body">
          <Activity className="w-3 h-3" />
          <span>Real-time MEV Activity Heatmap</span>
        </div>
      </div>
    </div>
  );
};

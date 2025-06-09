import { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  Globe,
} from "lucide-react";

interface NetworkNode {
  id: string;
  label: string;
  type: "contract" | "transaction" | "wallet" | "exchange" | "defi";
  status: "safe" | "warning" | "danger" | "unknown";
  connections: string[];
  value?: number;
  risk?: number;
}

interface NetworkConnection {
  id: string;
  startPos: { x: number; y: number; z: number };
  endPos: { x: number; y: number; z: number };
  isAnimated: boolean;
}

interface NetworkModel3DProps {
  title: string;
  nodes: NetworkNode[];
  className?: string;
  animated?: boolean;
}

export const NetworkModel3D = ({
  title,
  nodes,
  className = "",
  animated = true,
}: NetworkModel3DProps) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      setAnimationFrame((prev) => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [animated]);

  const getNodeColor = (type: string, status: string) => {
    if (status === "danger") return "#ff4444";
    if (status === "warning") return "#ffaa00";
    if (status === "safe") return "#00ff88";

    switch (type) {
      case "contract":
        return "#00ffff";
      case "transaction":
        return "#00e5ff";
      case "wallet":
        return "#00b7ff";
      case "exchange":
        return "#0099cc";
      case "defi":
        return "#ff6b9d";
      default:
        return "#666666";
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "contract":
        return Shield;
      case "transaction":
        return Zap;
      case "wallet":
        return CheckCircle;
      case "exchange":
        return Globe;
      case "defi":
        return Activity;
      default:
        return AlertTriangle;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "danger":
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  // Calculate node positions in 3D space
  const calculateNodePosition = (index: number, total: number) => {
    const radius = 120;
    const angle =
      (index / total) * Math.PI * 2 + (animationFrame * Math.PI) / 180;
    const heightOffset = Math.sin(angle * 2) * 20;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: heightOffset,
    };
  };

  // Generate connection lines
  const generateConnections = (): NetworkConnection[] => {
    const connections: NetworkConnection[] = [];

    nodes.forEach((node, nodeIndex) => {
      node.connections.forEach((connectionId) => {
        const connectedNodeIndex = nodes.findIndex(
          (n) => n.id === connectionId,
        );
        if (connectedNodeIndex !== -1 && connectedNodeIndex > nodeIndex) {
          const startPos = calculateNodePosition(nodeIndex, nodes.length);
          const endPos = calculateNodePosition(
            connectedNodeIndex,
            nodes.length,
          );

          connections.push({
            id: `${node.id}-${connectionId}`,
            startPos,
            endPos,
            isAnimated: animated,
          });
        }
      });
    });

    return connections;
  };

  const connections = generateConnections();

  return (
    <div
      className={`bg-bg border-2 border-primary/40 rounded-3xl p-6 ${className}`}
      style={{
        boxShadow:
          "0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.05)",
        background:
          "linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.95) 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center"
          style={{ boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)" }}
        >
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-white font-header tracking-wide">
          {title}
        </h3>
      </div>

      {/* 3D Network Visualization */}
      <div
        className="relative w-full h-80 flex items-center justify-center overflow-hidden"
        style={{
          perspective: "800px",
          background:
            "radial-gradient(circle at center, rgba(0, 255, 255, 0.1) 0%, transparent 70%)",
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
            transform: `rotateX(60deg) translateZ(-50px)`,
          }}
        />

        {/* Connection lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `rotateX(15deg) rotateY(${animationFrame * 0.5}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {connections.map((connection) => (
            <line
              key={connection.id}
              x1={connection.startPos.x + 200}
              y1={connection.startPos.y + 160}
              x2={connection.endPos.x + 200}
              y2={connection.endPos.y + 160}
              stroke="rgba(0, 255, 255, 0.4)"
              strokeWidth="1"
              strokeDasharray="4,4"
              style={{
                filter: "drop-shadow(0 0 4px rgba(0, 255, 255, 0.6))",
                animation: connection.isAnimated
                  ? "dash 2s linear infinite"
                  : "none",
              }}
            />
          ))}
        </svg>

        {/* Network nodes */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            transform: `rotateX(15deg) rotateY(${animationFrame * 0.5}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {nodes.map((node, index) => {
            const position = calculateNodePosition(index, nodes.length);
            const NodeIcon = getNodeIcon(node.type);
            const StatusIcon = getStatusIcon(node.status);
            const nodeColor = getNodeColor(node.type, node.status);
            const isHovered = hoveredNode === node.id;

            return (
              <div
                key={node.id}
                className="absolute cursor-pointer transition-all duration-300"
                style={{
                  transform: `translate3d(${position.x}px, ${position.y}px, ${position.z}px) ${
                    isHovered ? "scale(1.2)" : "scale(1)"
                  }`,
                  transformStyle: "preserve-3d",
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node glow effect */}
                <div
                  className="absolute inset-0 rounded-full blur-md"
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: nodeColor,
                    opacity: isHovered ? 0.6 : 0.3,
                    transform: "translateZ(-5px)",
                  }}
                />

                {/* Main node */}
                <div
                  className="relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: `${nodeColor}20`,
                    borderColor: nodeColor,
                    boxShadow: `0 0 20px ${nodeColor}60`,
                    transform: isHovered ? "translateZ(10px)" : "translateZ(0)",
                  }}
                >
                  <NodeIcon className="w-4 h-4" style={{ color: nodeColor }} />
                </div>

                {/* Status indicator */}
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full border flex items-center justify-center"
                  style={{
                    backgroundColor: nodeColor,
                    borderColor: "#000",
                    transform: "translateZ(5px)",
                  }}
                >
                  <StatusIcon className="w-2 h-2 text-black" />
                </div>

                {/* Node label */}
                {isHovered && (
                  <div
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-bg border border-primary/40 rounded-lg px-3 py-1 min-w-max z-10"
                    style={{
                      boxShadow: "0 0 15px rgba(0, 255, 255, 0.3)",
                      transform: "translateX(-50%) translateZ(15px)",
                    }}
                  >
                    <div className="text-white text-xs font-semibold font-body">
                      {node.label}
                    </div>
                    <div className="text-gray-400 text-xs font-body">
                      {node.type} • {node.status}
                    </div>
                    {node.value && (
                      <div className="text-primary text-xs font-mono">
                        ${node.value.toLocaleString()}
                      </div>
                    )}
                    {node.risk && (
                      <div
                        className={`text-xs font-mono ${
                          node.risk > 70
                            ? "text-error"
                            : node.risk > 30
                              ? "text-warning"
                              : "text-success"
                        }`}
                      >
                        Risk: {node.risk}%
                      </div>
                    )}
                  </div>
                )}

                {/* Pulse animation for active nodes */}
                {node.status === "warning" || node.status === "danger" ? (
                  <div
                    className="absolute inset-0 rounded-full border-2 animate-ping"
                    style={{
                      borderColor: nodeColor,
                      width: "40px",
                      height: "40px",
                      transform: "translate(-25%, -25%)",
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Central hub */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `rotateX(15deg) rotateY(${animationFrame * 0.5}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="w-16 h-16 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center"
            style={{
              boxShadow:
                "0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)",
              transform: "translateZ(0px)",
            }}
          >
            <Globe className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success"></div>
          <span className="text-gray-400 font-body">Safe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning"></div>
          <span className="text-gray-400 font-body">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <span className="text-gray-400 font-body">Danger</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-gray-400 font-body">Contract</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent"></div>
          <span className="text-gray-400 font-body">Transaction</span>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -8;
          }
        }
      `}</style>
    </div>
  );
};

import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Node {
  id: string;
  position: [number, number, number];
  type: "normal" | "vulnerable" | "critical";
  connections: string[];
}

interface NetworkTopologyProps {
  nodes?: Node[];
  className?: string;
}

function NetworkNode({ node, nodes }: { node: Node; nodes: Node[] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y +=
        Math.sin(state.clock.elapsedTime + node.position[0]) * 0.1;
    }
  });

  const getNodeColor = () => {
    switch (node.type) {
      case "critical":
        return "#ef4444"; // red
      case "vulnerable":
        return "#f59e0b"; // orange
      default:
        return "#3b82f6"; // blue
    }
  };

  return (
    <group>
      {/* Node */}
      <mesh ref={meshRef} position={node.position}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={getNodeColor()}
          emissive={getNodeColor()}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Connections */}
      {node.connections.map((connectionId) => {
        const targetNode = nodes.find((n) => n.id === connectionId);
        if (!targetNode) return null;

        return (
          <line key={`${node.id}-${connectionId}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={
                  new Float32Array([...node.position, ...targetNode.position])
                }
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#60a5fa" opacity={0.6} transparent />
          </line>
        );
      })}
    </group>
  );
}

function Scene({ nodes }: { nodes: Node[] }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} color="#3b82f6" intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#06b6d4" intensity={0.5} />

      {nodes.map((node) => (
        <NetworkNode key={node.id} node={node} nodes={nodes} />
      ))}
    </>
  );
}

const defaultNodes: Node[] = [
  {
    id: "node1",
    position: [0, 0, 0],
    type: "normal",
    connections: ["node2", "node3"],
  },
  {
    id: "node2",
    position: [3, 2, 1],
    type: "vulnerable",
    connections: ["node1", "node4"],
  },
  {
    id: "node3",
    position: [-2, 1, 3],
    type: "critical",
    connections: ["node1", "node4"],
  },
  {
    id: "node4",
    position: [1, -2, -2],
    type: "normal",
    connections: ["node2", "node3"],
  },
  {
    id: "node5",
    position: [-3, 0, -1],
    type: "vulnerable",
    connections: ["node3"],
  },
];

export function NetworkTopology({
  nodes = defaultNodes,
  className = "",
}: NetworkTopologyProps) {
  return (
    <div
      className={`w-full h-64 bg-black/5 rounded-lg border border-gray-300 ${className}`}
    >
      <Canvas
        camera={{ position: [8, 8, 8], fov: 60 }}
        style={{ background: "transparent" }}
      >
        <Scene nodes={nodes} />
      </Canvas>

      {/* Legend */}
      <div className="p-3 border-t border-gray-300">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-gray-600">Normal</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span className="text-gray-600">Vulnerable</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-gray-600">Critical</span>
            </div>
          </div>
          <span className="text-gray-500">{nodes.length} nodes detected</span>
        </div>
      </div>
    </div>
  );
}

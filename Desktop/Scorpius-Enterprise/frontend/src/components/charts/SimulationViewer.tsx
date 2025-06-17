import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Transaction {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  value: number;
  status: "pending" | "success" | "failed" | "simulated";
  progress: number;
}

interface SimulationViewerProps {
  className?: string;
}

function TransactionLine({ transaction }: { transaction: Transaction }) {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (particleRef.current) {
      // Animate particle along the line
      const t = transaction.progress / 100;
      const position = new THREE.Vector3().lerpVectors(
        new THREE.Vector3(...transaction.from),
        new THREE.Vector3(...transaction.to),
        t,
      );
      particleRef.current.position.copy(position);

      // Add some floating motion
      particleRef.current.position.y +=
        Math.sin(state.clock.elapsedTime * 2 + transaction.id.length) * 0.1;
    }
  });

  const getStatusColor = () => {
    switch (transaction.status) {
      case "success":
        return "#10b981";
      case "failed":
        return "#ef4444";
      case "simulated":
        return "#3b82f6";
      default:
        return "#f59e0b";
    }
  };

  return (
    <group>
      {/* Transaction line */}
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([...transaction.from, ...transaction.to])}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={getStatusColor()} opacity={0.6} transparent />
      </line>

      {/* Moving particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial
          color={getStatusColor()}
          emissive={getStatusColor()}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

function BlockNode({
  position,
  blockNumber,
  transactions,
}: {
  position: [number, number, number];
  blockNumber: number;
  transactions: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#1e40af"
          emissiveIntensity={0.2}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

function Scene({
  transactions,
  blocks,
}: {
  transactions: Transaction[];
  blocks: any[];
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} color="#3b82f6" intensity={0.8} />
      <pointLight position={[-10, -10, -10]} color="#06b6d4" intensity={0.4} />

      {/* Render blocks */}
      {blocks.map((block, index) => (
        <BlockNode
          key={index}
          position={[index * 3 - 6, 0, 0]}
          blockNumber={block.number}
          transactions={block.transactions}
        />
      ))}

      {/* Render transactions */}
      {transactions.map((transaction) => (
        <TransactionLine key={transaction.id} transaction={transaction} />
      ))}
    </>
  );
}

export function SimulationViewer({ className = "" }: SimulationViewerProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [blocks] = useState([
    { number: 1234567, transactions: 156 },
    { number: 1234568, transactions: 203 },
    { number: 1234569, transactions: 178 },
    { number: 1234570, transactions: 234 },
    { number: 1234571, transactions: 189 },
  ]);

  // Simulate transactions
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Add new transaction
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}_${Math.random()}`,
        from: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 8,
        ],
        to: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 8,
        ],
        value: Math.random() * 100,
        status:
          Math.random() > 0.8
            ? "failed"
            : Math.random() > 0.7
              ? "simulated"
              : "success",
        progress: 0,
      };

      setTransactions((prev) => [...prev.slice(-9), newTransaction]);
    }, 2000 / simulationSpeed);

    // Update transaction progress
    const progressInterval = setInterval(() => {
      setTransactions((prev) =>
        prev
          .map((tx) => ({
            ...tx,
            progress: Math.min(tx.progress + 10 * simulationSpeed, 100),
          }))
          .filter((tx) => tx.progress < 100),
      );
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isRunning, simulationSpeed]);

  const stats = {
    totalTx: transactions.length,
    successRate:
      transactions.length > 0
        ? (
            (transactions.filter((tx) => tx.status === "success").length /
              transactions.length) *
            100
          ).toFixed(1)
        : "0",
    simulated: transactions.filter((tx) => tx.status === "simulated").length,
    failed: transactions.filter((tx) => tx.status === "failed").length,
  };

  return (
    <div
      className={`w-full bg-gray-50 rounded-lg border border-gray-300 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
          Transaction Simulation Engine
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
              className="w-16"
            />
            <span className="text-xs text-gray-600">{simulationSpeed}x</span>
          </div>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isRunning
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-green-100 text-green-600 hover:bg-green-200"
            }`}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
        </div>
      </div>

      {/* 3D Simulation View */}
      <div className="h-64 bg-black/5 rounded-lg border border-gray-300 mb-4">
        <Canvas
          camera={{ position: [12, 8, 12], fov: 60 }}
          style={{ background: "transparent" }}
        >
          <Scene transactions={transactions} blocks={blocks} />
        </Canvas>
      </div>

      {/* Controls and Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-blue-600">{stats.totalTx}</div>
          <div className="text-xs text-gray-600">Active Transactions</div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {stats.successRate}%
          </div>
          <div className="text-xs text-gray-600">Success Rate</div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {stats.simulated}
          </div>
          <div className="text-xs text-gray-600">Simulated</div>
        </div>

        <div className="bg-white rounded border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-red-600">{stats.failed}</div>
          <div className="text-xs text-gray-600">Failed</div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-gray-600">Success</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          <span className="text-gray-600">Simulated</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <span className="text-gray-600">Failed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
          <span className="text-gray-600">Pending</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Target,
  Radar,
  Cpu,
  Database,
  Globe,
  Lock,
  Eye,
  Crosshair,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface WarRoomLoaderProps {
  onComplete: () => void;
}

interface LoadingStep {
  id: number;
  message: string;
  icon: React.ElementType;
  duration: number;
  color: string;
  action?: () => Promise<void>;
}

export const WarRoomLoader: React.FC<WarRoomLoaderProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const addTerminalOutput = (message: string) => {
    setTerminalOutput((prev) => [...prev.slice(-10), message]); // Keep last 10 lines
  };

  const loadingSteps: LoadingStep[] = [
    {
      id: 1,
      message: "INITIALIZING WAR ROOM PROTOCOLS...",
      icon: Shield,
      duration: 2000,
      color: "#ff4444",
      action: async () => {
        addTerminalOutput("[SYS] War Room initialization started");
        addTerminalOutput("[SYS] Loading security protocols...");
      },
    },
    {
      id: 2,
      message: "LOADING WEAPON SYSTEMS...",
      icon: Crosshair,
      duration: 1800,
      color: "#ffaa00",
      action: async () => {
        addTerminalOutput("[WPN] Activating smart contract scanner");
        addTerminalOutput("[WPN] Loading MEV detection systems");
        addTerminalOutput("[WPN] Initializing threat analysis engines");
      },
    },
    {
      id: 3,
      message: "ESTABLISHING NEURAL NETWORKS...",
      icon: Cpu,
      duration: 2200,
      color: "#00ffff",
      action: async () => {
        addTerminalOutput("[NET] Connecting to blockchain networks");
        addTerminalOutput("[NET] Establishing RPC connections");
        addTerminalOutput("[NET] Neural pathways activated");
      },
    },
    {
      id: 4,
      message: "DEPLOYING SURVEILLANCE DRONES...",
      icon: Eye,
      duration: 1600,
      color: "#00ff88",
      action: async () => {
        addTerminalOutput("[SUR] Mempool monitors deployed");
        addTerminalOutput("[SUR] Transaction analysis active");
        addTerminalOutput("[SUR] Honeypot detection online");
      },
    },
    {
      id: 5,
      message: "ACTIVATING THREAT DETECTION GRID...",
      icon: Radar,
      duration: 2000,
      color: "#ff6666",
      action: async () => {
        addTerminalOutput("[TDG] TrapGrid systems online");
        addTerminalOutput("[TDG] Anomaly detection active");
        addTerminalOutput("[TDG] Threat intelligence synchronized");
      },
    },
    {
      id: 6,
      message: "SYNCHRONIZING GLOBAL DEFENSE MATRIX...",
      icon: Globe,
      duration: 1900,
      color: "#88aaff",
      action: async () => {
        addTerminalOutput("[GDM] Global threat feeds connected");
        addTerminalOutput("[GDM] Defense protocols synchronized");
        addTerminalOutput("[GDM] Communication channels secure");
      },
    },
    {
      id: 7,
      message: "INSTALLING PYTHON DEPENDENCIES...",
      icon: Database,
      duration: 4000,
      color: "#ffff00",
      action: async () => {
        addTerminalOutput("[DEP] Checking Python environment...");
        addTerminalOutput("[DEP] Installing FastAPI framework...");
        addTerminalOutput("[DEP] Installing Web3 libraries...");
        addTerminalOutput("[DEP] Installing ML packages...");
        addTerminalOutput("[DEP] Installing cryptography tools...");
        addTerminalOutput("[DEP] Installing notification services...");

        // Simulate actual dependency installation
        try {
          const response = await fetch("/api/config/install-dependencies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            addTerminalOutput(
              "[DEP] ✅ All dependencies installed successfully",
            );
          } else {
            addTerminalOutput(
              "[DEP] ⚠️ Some dependencies may need manual installation",
            );
          }
        } catch (error) {
          addTerminalOutput("[DEP] ⚠️ Backend dependency check skipped");
        }
      },
    },
    {
      id: 8,
      message: "CALIBRATING QUANTUM ENCRYPTION...",
      icon: Lock,
      duration: 1700,
      color: "#ff88ff",
      action: async () => {
        addTerminalOutput("[QEC] Quantum encryption protocols loaded");
        addTerminalOutput("[QEC] Cryptographic keys generated");
        addTerminalOutput("[QEC] Secure communication channels active");
      },
    },
    {
      id: 9,
      message: "POWERING UP MAIN DEFENSE SYSTEMS...",
      icon: Zap,
      duration: 1500,
      color: "#00ffaa",
      action: async () => {
        addTerminalOutput("[DEF] Main systems power up complete");
        addTerminalOutput("[DEF] All modules operational");
        addTerminalOutput("[DEF] War Room status: READY");
      },
    },
    {
      id: 10,
      message: "WAR ROOM READY FOR COMBAT!",
      icon: Target,
      duration: 1000,
      color: "#00ff00",
      action: async () => {
        addTerminalOutput("[COM] 🎯 SCORPIUS WAR ROOM OPERATIONAL");
        addTerminalOutput(
          "[COM] 🔥 ALL SYSTEMS GREEN - READY FOR CYBER WARFARE!",
        );
      },
    },
  ];

  useEffect(() => {
    setShowTerminal(true);

    const totalDuration = loadingSteps.reduce(
      (sum, step) => sum + step.duration,
      0,
    );
    let elapsed = 0;

    const processSteps = async () => {
      for (let i = 0; i < loadingSteps.length; i++) {
        setCurrentStep(i);

        const step = loadingSteps[i];
        const stepStart = elapsed;

        // Execute step action if it exists
        if (step.action) {
          await step.action();
        }

        // Animate progress during this step
        const progressInterval = setInterval(() => {
          elapsed += 50;
          const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
          setProgress(newProgress);
        }, 50);

        await new Promise((resolve) => setTimeout(resolve, step.duration));
        clearInterval(progressInterval);

        elapsed = stepStart + step.duration;
      }

      // Complete loading
      setProgress(100);
      setTimeout(() => {
        onComplete();
      }, 500);
    };

    processSteps();
  }, [onComplete]);

  const currentStepData = loadingSteps[currentStep];

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Animated Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 68, 68, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 68, 68, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "grid-move 20s linear infinite",
          }}
        />

        {/* Scanning Lines */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%)",
            width: "200%",
          }}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="max-w-6xl w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              className="w-32 h-32 mx-auto mb-6 relative"
              animate={{
                rotateY: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <div
                className="w-full h-full rounded-2xl flex items-center justify-center relative"
                style={{
                  background: "#000000",
                  border: "3px solid #ff4444",
                  boxShadow:
                    "0 0 50px rgba(255, 68, 68, 0.6), inset 0 0 30px rgba(255, 68, 68, 0.1)",
                }}
              >
                <Shield className="w-16 h-16 text-red-400" />

                {/* Pulsing rings */}
                {[0, 1, 2].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute inset-0 rounded-2xl border-2"
                    style={{
                      borderColor: ["#ff4444", "#ffaa00", "#00ffff"][ring],
                    }}
                    animate={{
                      opacity: [0, 0.8, 0],
                      scale: [1, 1.3 + ring * 0.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: ring * 0.7,
                    }}
                  />
                ))}
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl font-bold mb-3"
              style={{
                background: "linear-gradient(45deg, #ff4444, #ffaa00, #00ffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 30px rgba(255, 68, 68, 0.5)",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              SCORPIUS WAR ROOM
            </motion.h1>

            <motion.p
              className="text-lg text-red-400 font-mono"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              PREPARING FOR CYBER WARFARE
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Terminal Window */}
            <AnimatePresence>
              {showTerminal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black/90 border-2 border-red-500/50 rounded-xl p-4"
                  style={{
                    boxShadow:
                      "0 0 30px rgba(255, 68, 68, 0.3), inset 0 0 30px rgba(255, 68, 68, 0.05)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {/* Terminal Header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-500/30">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-red-400 text-sm">
                      SCORPIUS-TERMINAL v4.0.0
                    </span>
                  </div>

                  {/* Current Step Display */}
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <motion.div
                      className="p-2 rounded-lg border-2"
                      style={{
                        borderColor: currentStepData?.color || "#ff4444",
                        backgroundColor: `${currentStepData?.color || "#ff4444"}20`,
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      {currentStepData && (
                        <currentStepData.icon
                          className="w-5 h-5"
                          style={{ color: currentStepData.color }}
                        />
                      )}
                    </motion.div>

                    <motion.p
                      className="text-sm font-mono"
                      style={{ color: currentStepData?.color || "#ff4444" }}
                      animate={{
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    >
                      {currentStepData?.message || "INITIALIZING..."}
                    </motion.p>
                  </motion.div>

                  {/* Terminal Output */}
                  <div className="h-48 overflow-y-auto bg-black/50 rounded p-3 font-mono text-xs">
                    {terminalOutput.map((line, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-green-400 mb-1"
                      >
                        {line}
                      </motion.div>
                    ))}

                    {/* Blinking cursor */}
                    <motion.span
                      className="text-green-400"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ▋
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Progress Bar */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-red-400">INITIALIZATION PROGRESS</span>
                  <span className="text-red-400">{Math.round(progress)}%</span>
                </div>

                <div className="w-full h-4 bg-black/50 border-2 border-red-500/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{
                      width: `${progress}%`,
                      boxShadow: "0 0 20px rgba(255, 68, 68, 0.8)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Step Counter */}
                <div className="flex justify-center">
                  <span className="text-sm text-gray-400 font-mono">
                    STEP {currentStep + 1} OF {loadingSteps.length}
                  </span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="grid grid-cols-2 gap-3">
                {loadingSteps.slice(0, 6).map((step, index) => (
                  <motion.div
                    key={step.id}
                    className={`p-3 rounded-lg border ${
                      index <= currentStep
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-gray-500/30 bg-gray-500/10"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <step.icon
                        className={`w-4 h-4 ${
                          index <= currentStep
                            ? "text-green-400"
                            : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`text-xs font-mono ${
                          index <= currentStep
                            ? "text-green-400"
                            : "text-gray-500"
                        }`}
                      >
                        {step.message.split(" ")[0]}
                      </span>
                      {index <= currentStep && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-400 text-xs"
                        >
                          ✅
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Warning Messages */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>CLASSIFIED OPERATIONS IN PROGRESS</span>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CSS for grid animation */}
      <style jsx>{`
        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
      `}</style>
    </div>
  );
};

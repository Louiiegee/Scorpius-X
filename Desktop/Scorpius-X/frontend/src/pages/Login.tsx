import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Shield,
  Zap,
  AlertTriangle,
  Lock,
  Activity,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError("Invalid credentials. Access denied.");
      }
    } catch (err) {
      setError("System error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-hide welcome screen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Import Audiowide font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Audiowide:wght@400&display=swap');

          .scorpion-logo {
            filter: drop-shadow(0 0 20px #00ffff)
                    drop-shadow(0 0 30px #00ff88)
                    brightness(1.3)
                    contrast(1.2);
          }

          .scorpion-logo:hover {
            filter: drop-shadow(0 0 25px #00ffff)
                    drop-shadow(0 0 35px #00ff88)
                    drop-shadow(0 0 15px #ffaa00)
                    brightness(1.4)
                    contrast(1.3);
          }
        `}
      </style>

      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          background: "#000000",
          fontFamily: "JetBrains Mono, Space Mono, monospace",
        }}
      >
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                backdropFilter: "blur(20px)",
              }}
            >
              <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="text-center"
              >
                {/* Cyberpunk Scorpion Logo */}
                <motion.div
                  className="w-48 h-48 mx-auto mb-8 relative"
                  animate={{
                    rotateY: [0, 360],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                >
                  <div
                    className="w-full h-full rounded-3xl flex items-center justify-center relative"
                    style={{
                      background: "rgba(0, 0, 0, 0.8)",
                      border: "4px solid #00ffff",
                      boxShadow:
                        "0 0 60px rgba(0, 255, 255, 0.7), inset 0 0 40px rgba(0, 255, 255, 0.1)",
                    }}
                  >
                    {/* Scorpius Logo */}
                    <img
                      src="/scorpius-logo.svg"
                      alt="Scorpius Cyberpunk Logo"
                      className="w-36 h-36 scorpion-logo"
                    />

                    {/* Multiple pulsing border effects */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl border-3 border-[#00ff88]"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-3xl border-2 border-[#ffaa00]"
                      animate={{
                        opacity: [0, 0.7, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: 0.5,
                      }}
                    />
                  </div>
                </motion.div>

                <motion.h1
                  className="text-7xl font-bold mb-4"
                  style={{
                    fontFamily: "'Audiowide', cursive",
                    background:
                      "linear-gradient(45deg, #00ffff, #00ff88, #ffaa00, #ff4444)",
                    backgroundSize: "300% 300%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 0 40px rgba(0, 255, 255, 0.6)",
                    letterSpacing: "6px",
                  }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  SCORPIUS
                </motion.h1>

                <motion.div
                  className="text-xl text-[#00ffff] font-mono mb-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  NEURAL INTERFACE INITIALIZING
                </motion.div>

                {/* Enhanced loading bar */}
                <div className="w-80 h-2 mx-auto bg-[#1a1a1a] rounded-full overflow-hidden border border-[#333]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00ffff] via-[#00ff88] to-[#ffaa00]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    style={{
                      boxShadow: "0 0 20px rgba(0, 255, 255, 0.8)",
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main login container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{
            opacity: showWelcome ? 0 : 1,
            scale: showWelcome ? 0.9 : 1,
            y: showWelcome ? 50 : 0,
          }}
          transition={{
            delay: 3.2,
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="relative z-10 w-full max-w-md p-8"
          style={{
            background: "rgba(0, 0, 0, 0.95)",
            border: "2px solid rgba(0, 255, 255, 0.4)",
            borderRadius: "32px",
            boxShadow:
              "0 0 50px rgba(0, 255, 255, 0.3), inset 0 0 50px rgba(0, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header with Logo */}
          <div className="text-center mb-8">
            {/* Empty Logo Area */}
            <div className="w-28 h-28 mx-auto mb-6 relative">
              {/* Empty space where logo was */}
            </div>

            <motion.h1
              className="text-5xl font-bold mb-2"
              style={{
                fontFamily: "'Audiowide', cursive",
                background:
                  "linear-gradient(135deg, #00ffff, #00ff88, #ffaa00)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "4px",
              }}
              animate={{
                textShadow: [
                  "0 0 20px rgba(0, 255, 255, 0.5)",
                  "0 0 30px rgba(0, 255, 136, 0.8)",
                  "0 0 25px rgba(255, 170, 0, 0.6)",
                  "0 0 20px rgba(0, 255, 255, 0.5)",
                ],
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              SCORPIUS
            </motion.h1>

            <p className="text-gray-400 font-mono text-sm mb-2">
              Cybersecurity Operations Center
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-[#00ffff]">
              <Activity className="w-3 h-3" />
              <span className="font-mono">v4.0.0 | Neural Interface</span>
              <motion.div
                className="w-2 h-2 bg-[#00ff88] rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  boxShadow: "0 0 8px rgba(0, 255, 136, 0.8)",
                }}
              />
            </div>
          </div>

          {/* System Status */}
          <motion.div
            className="mb-6 p-3 rounded-xl border border-[#00ffff40] bg-[#00ffff10]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.5 }}
          >
            <div className="flex items-center gap-2 text-xs font-mono">
              <Wifi className="w-3 h-3 text-[#00ff88]" />
              <span className="text-[#00ff88]">NEURAL LINK:</span>
              <span className="text-white">ACTIVE</span>
              <div className="flex-1" />
              <Lock className="w-3 h-3 text-[#ffaa00]" />
              <span className="text-[#ffaa00]">ENCRYPTED</span>
            </div>
          </motion.div>

          {/* Error alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="mb-6 p-4 rounded-2xl border-2 border-red-500/40 bg-red-500/10 flex items-center gap-3"
                style={{ boxShadow: "0 0 20px rgba(255, 68, 68, 0.2)" }}
              >
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-400 text-sm font-mono">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 3.6 }}
            >
              <label className="text-sm font-semibold text-white font-mono">
                AGENT ID
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter neural interface ID..."
                  required
                  className="w-full bg-black/60 border-2 border-[#00ffff]/40 rounded-2xl px-4 py-3 text-white placeholder-gray-500 font-mono text-sm focus:border-[#00ffff] transition-all duration-300"
                  style={{
                    boxShadow: "inset 0 0 20px rgba(0, 255, 255, 0.1)",
                  }}
                />
                <motion.div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-[#00ffff] rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ boxShadow: "0 0 10px rgba(0, 255, 255, 0.8)" }}
                />
              </div>
            </motion.div>

            {/* Password field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 3.7 }}
            >
              <label className="text-sm font-semibold text-white font-mono">
                NEURAL KEY
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter quantum encryption key..."
                  required
                  className="w-full bg-black/60 border-2 border-[#00ffff]/40 rounded-2xl px-4 py-3 pr-12 text-white placeholder-gray-500 font-mono text-sm focus:border-[#00ffff] transition-all duration-300"
                  style={{
                    boxShadow: "inset 0 0 20px rgba(0, 255, 255, 0.1)",
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#00ffff] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Login button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.8 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl font-mono font-bold transition-all duration-300"
                style={{
                  background: isLoading
                    ? "linear-gradient(135deg, #666666, #888888)"
                    : "linear-gradient(135deg, #00ffff, #00ff88)",
                  color: isLoading ? "#ccc" : "#000",
                  boxShadow: isLoading
                    ? "0 0 20px rgba(102, 102, 102, 0.4)"
                    : "0 0 30px rgba(0, 255, 255, 0.5)",
                  border: "2px solid rgba(0, 255, 255, 0.6)",
                }}
                whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span>ACCESSING NEURAL NETWORK...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Zap className="w-4 h-4" />
                    <span>INITIALIZE CONNECTION</span>
                  </div>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
          >
            <div className="text-xs text-gray-500 font-mono mb-2">
              Secure Neural Interface Protocol v4.0.0
            </div>
            <div className="text-xs text-[#00ffff] bg-[#00ffff20] rounded-lg p-2 border border-[#00ffff40]">
              <div className="font-mono">DEFAULT ACCESS:</div>
              <div className="font-mono">
                ID: <span className="text-[#00ff88]">alice</span> | KEY:{" "}
                <span className="text-[#00ff88]">admin123</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

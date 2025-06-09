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
                className="w-32 h-32 mx-auto mb-8 relative"
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <div
                  className="w-full h-full rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: "#000000",
                    border: "3px solid #00ffff",
                    boxShadow:
                      "0 0 50px rgba(0, 255, 255, 0.6), inset 0 0 30px rgba(0, 255, 255, 0.1)",
                  }}
                >
                  {/* Scorpius Logo */}
                  <img
                    src="/scorpius-logo.svg"
                    alt="Scorpius Logo"
                    className="w-20 h-20"
                    style={{
                      filter:
                        "drop-shadow(0 0 15px #00ffff) drop-shadow(0 0 25px #00ff88)",
                    }}
                  />

                  {/* Pulsing border effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-[#00ff88]"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              <motion.h1
                className="text-5xl font-bold mb-4"
                style={{
                  background:
                    "linear-gradient(45deg, #00ffff, #00ff88, #ffaa00)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                SCORPIUS
              </motion.h1>

              <motion.div
                className="text-xl text-[#00ffff] font-mono mb-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                NEURAL INTERFACE INITIALIZING
              </motion.div>

              {/* Loading bar */}
              <div className="w-64 h-1 mx-auto bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00ffff] to-[#00ff88]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                  style={{
                    boxShadow: "0 0 15px rgba(0, 255, 255, 0.8)",
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
        transition={{ delay: 3.2, type: "spring", stiffness: 300, damping: 25 }}
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
          {/* Scorpion Logo */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 relative"
            whileHover={{ scale: 1.1, rotateY: 180 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div
              className="w-full h-full rounded-2xl flex items-center justify-center relative"
              style={{
                background: "#000000",
                border: "3px solid rgba(0, 255, 255, 0.7)",
                boxShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
              }}
            >
              {/* Empty logo area */}
              <div className="w-full h-full flex items-center justify-center">
                {/* Logo area - currently empty */}
              </div>

              {/* Animated glow rings */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-[#00ff88]"
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          <motion.h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #00ffff, #00ff88)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "Space Mono, monospace",
            }}
            animate={{
              textShadow: [
                "0 0 20px rgba(0, 255, 255, 0.5)",
                "0 0 30px rgba(0, 255, 136, 0.8)",
                "0 0 20px rgba(0, 255, 255, 0.5)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            SCORPIUS
          </motion.h1>

          <p className="text-gray-400 font-mono text-sm mb-2">
            Security Operations Center
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
  );
};

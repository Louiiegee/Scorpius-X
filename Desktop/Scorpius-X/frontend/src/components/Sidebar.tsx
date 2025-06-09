import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Shield,
  Bot,
  Activity,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  GraduationCap,
  Monitor,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Binary,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UserLogo } from "./UserLogo";

const navigationItems = [
  {
    name: "Mission Control",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview",
    emoji: "🚀",
  },
  {
    name: "Simulate & Strike",
    href: "/scanner",
    icon: Shield,
    description: "Security Analysis",
    emoji: "🛡️",
  },
  {
    name: "TrapGrid",
    href: "/trapgrid",
    icon: Target,
    description: "Honeypot Monitor",
    emoji: "🧪",
  },
  {
    name: "SimSniper",
    href: "/simsniper",
    icon: Zap,
    description: "Flashbots Tracker",
    emoji: "🔥",
  },
  {
    name: "CodeMatcher",
    href: "/codematcher",
    icon: Binary,
    description: "Bytecode Analysis",
    emoji: "🧬",
  },
  {
    name: "Flashbot Commander",
    href: "/mev",
    icon: Bot,
    description: "MEV Monitoring",
    emoji: "🤖",
  },
  {
    name: "TX Watchtower",
    href: "/mempool",
    icon: Activity,
    description: "Transaction Feed",
    emoji: "📡",
  },
  {
    name: "FlashBack Ops",
    href: "/time-machine",
    icon: Clock,
    description: "Historical Data",
    emoji: "⏰",
  },
  {
    name: "Control Center",
    href: "/monitoring",
    icon: Monitor,
    description: "System Health",
    emoji: "🧰",
  },
  {
    name: "Logs & Reports",
    href: "/reports",
    icon: FileText,
    description: "Analytics",
    emoji: "📜",
  },
  {
    name: "Threatboard",
    href: "/bounty",
    icon: DollarSign,
    description: "Rewards",
    emoji: "💰",
  },
  {
    name: "Tasks & Schedule",
    href: "/scheduler",
    icon: Calendar,
    description: "Automation",
    emoji: "📅",
  },
  {
    name: "Cyber Academy",
    href: "/training",
    icon: GraduationCap,
    description: "Education",
    emoji: "🎓",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Configuration",
    emoji: "⚙️",
  },
  {
    name: "Zero Day Alert",
    href: "/zero-day",
    icon: AlertTriangle,
    description: "Critical Threats",
    emoji: "🚨",
  },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Enhanced scrollbar styles for cyberpunk theme */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

          .sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-nav::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
          }
          .sidebar-nav::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #00ff88, #00ffff);
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 136, 0.4);
          }
          .sidebar-nav::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #00ffff, #00ff88);
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.8);
          }

          .glow-text {
            text-shadow: 0 0 10px currentColor;
          }

          .scorpion-glow {
            filter: drop-shadow(0 0 8px #00ff88);
            animation: scorpion-pulse 2s ease-in-out infinite alternate;
          }

          @keyframes scorpion-pulse {
            from { filter: drop-shadow(0 0 8px #00ff88); }
            to { filter: drop-shadow(0 0 16px #00ffff); }
          }
        `}
      </style>

      <motion.div
        animate={{
          width: isCollapsed && !isHovered ? "80px" : "320px",
        }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "2px solid rgba(0, 255, 136, 0.3)",
          boxShadow:
            "4px 0 40px rgba(0, 255, 136, 0.2), inset -1px 0 0 rgba(0, 255, 136, 0.1)",
          display: "flex",
          flexDirection: "column",
          fontFamily: '"JetBrains Mono", "Space Mono", monospace',
          borderTopRightRadius: "24px",
          borderBottomRightRadius: "24px",
          position: "relative",
          overflow: "hidden",
          zIndex: 1000,
        }}
      >
        {/* Animated background effects */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background: `
              radial-gradient(circle at 20% 20%, rgba(0, 255, 136, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
              linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)
            `,
            pointerEvents: "none",
          }}
        />

        {/* Collapse Toggle Button */}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: "absolute",
            top: "20px",
            right: "-12px",
            width: "24px",
            height: "24px",
            backgroundColor: "#000000",
            border: "2px solid #00ff88",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            boxShadow: "0 0 15px rgba(0, 255, 136, 0.6)",
          }}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft size={12} color="#00ff88" />
          </motion.div>
        </motion.button>

        {/* Logo Section */}
        <div
          style={{
            padding: isCollapsed && !isHovered ? "24px 16px" : "32px 24px",
            borderBottom: "2px solid rgba(0, 255, 136, 0.3)",
            boxShadow: "0 2px 20px rgba(0, 255, 136, 0.2)",
            borderTopRightRadius: "24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isCollapsed && !isHovered ? "0" : "16px",
              marginBottom: isCollapsed && !isHovered ? "0" : "12px",
              justifyContent:
                isCollapsed && !isHovered ? "center" : "flex-start",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              style={{
                width: isCollapsed && !isHovered ? "40px" : "56px",
                height: isCollapsed && !isHovered ? "40px" : "56px",
                backgroundColor: "#000000",
                borderRadius: "50%",
                border: "2px solid #00ff88",
                boxShadow:
                  "0 0 25px rgba(0, 255, 136, 0.4), inset 0 0 15px rgba(0, 255, 136, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div className="scorpion-glow">
                <UserLogo
                  size={isCollapsed && !isHovered ? 20 : 28}
                  color="#00ff88"
                />
              </div>
              {/* Animated ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                  borderTop: "1px solid #00ffff",
                  borderRadius: "50%",
                }}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {(!isCollapsed || isHovered) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1
                    className="glow-text"
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: "#00ff88",
                      margin: "0",
                      letterSpacing: "2px",
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    SCORPIUS
                  </h1>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#66ff99",
                      margin: "0",
                      fontWeight: "400",
                      letterSpacing: "1px",
                      opacity: 0.8,
                    }}
                  >
                    Security Operations Center
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {(!isCollapsed || isHovered) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                style={{
                  fontSize: "10px",
                  color: "#00ffff",
                  fontWeight: "500",
                  fontFamily: '"JetBrains Mono", monospace',
                  padding: "6px 12px",
                  backgroundColor: "rgba(0, 255, 136, 0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(0, 255, 136, 0.3)",
                  boxShadow: "0 0 10px rgba(0, 255, 136, 0.2)",
                  letterSpacing: "0.5px",
                  textAlign: "center",
                }}
              >
                <span className="glow-text">v3.2.0</span>{" "}
                <span style={{ color: "#999999" }}>ENTERPRISE</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav
          className="sidebar-nav"
          style={{
            flex: "1",
            padding: isCollapsed && !isHovered ? "16px 8px" : "20px 16px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <motion.div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
            variants={{
              open: {
                transition: { staggerChildren: 0.07, delayChildren: 0.2 },
              },
              collapsed: {
                transition: { staggerChildren: 0.05, staggerDirection: -1 },
              },
            }}
            initial="collapsed"
            animate={isCollapsed && !isHovered ? "collapsed" : "open"}
          >
            {navigationItems.map((item, index) => {
              const isZeroDayAlert = item.name === "Zero Day Alert";
              const isCritical = [
                "TrapGrid",
                "SimSniper",
                "CodeMatcher",
              ].includes(item.name);

              return (
                <motion.div
                  key={item.name}
                  variants={{
                    open: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        y: { stiffness: 1000, velocity: -100 },
                      },
                    },
                    collapsed: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        y: { stiffness: 1000 },
                      },
                    },
                  }}
                >
                  <NavLink
                    to={item.href}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: isCollapsed && !isHovered ? "0" : "12px",
                      padding:
                        isCollapsed && !isHovered ? "12px 8px" : "14px 16px",
                      borderRadius: isCollapsed && !isHovered ? "12px" : "16px",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      backgroundColor: isActive
                        ? "rgba(0, 255, 136, 0.15)"
                        : "transparent",
                      border: isActive
                        ? isZeroDayAlert
                          ? "1px solid rgba(255, 68, 68, 0.6)"
                          : isCritical
                            ? "1px solid rgba(0, 255, 255, 0.6)"
                            : "1px solid rgba(0, 255, 136, 0.6)"
                        : "1px solid transparent",
                      boxShadow: isActive
                        ? isZeroDayAlert
                          ? "0 0 20px rgba(255, 68, 68, 0.3), inset 0 0 10px rgba(255, 68, 68, 0.1)"
                          : isCritical
                            ? "0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(0, 255, 255, 0.1)"
                            : "0 0 20px rgba(0, 255, 136, 0.3), inset 0 0 10px rgba(0, 255, 136, 0.1)"
                        : "none",
                      color: isActive ? "#ffffff" : "#cccccc",
                      justifyContent:
                        isCollapsed && !isHovered ? "center" : "flex-start",
                      position: "relative",
                      overflow: "hidden",
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Hover effect background */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: isZeroDayAlert
                              ? "linear-gradient(90deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))"
                              : isCritical
                                ? "linear-gradient(90deg, rgba(0, 255, 255, 0.1), rgba(0, 255, 136, 0.05))"
                                : "linear-gradient(90deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))",
                            borderRadius: isCollapsed ? "12px" : "16px",
                          }}
                        />

                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            width: isCollapsed && !isHovered ? "32px" : "36px",
                            height: isCollapsed && !isHovered ? "32px" : "36px",
                            borderRadius: "10px",
                            backgroundColor: isActive
                              ? isZeroDayAlert
                                ? "#ff4444"
                                : isCritical
                                  ? "#00ffff"
                                  : "#00ff88"
                              : "rgba(42, 42, 42, 0.8)",
                            border: isActive
                              ? "none"
                              : isZeroDayAlert
                                ? "1px solid rgba(255, 68, 68, 0.5)"
                                : isCritical
                                  ? "1px solid rgba(0, 255, 255, 0.5)"
                                  : "1px solid rgba(0, 255, 136, 0.3)",
                            boxShadow: isActive
                              ? isZeroDayAlert
                                ? "0 0 20px rgba(255, 68, 68, 0.6)"
                                : isCritical
                                  ? "0 0 20px rgba(0, 255, 255, 0.6)"
                                  : "0 0 20px rgba(0, 255, 136, 0.6)"
                              : "0 0 8px rgba(255, 255, 255, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.3s ease",
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <item.icon
                            size={isCollapsed && !isHovered ? 16 : 18}
                            style={{
                              color: isActive
                                ? "#000000"
                                : isZeroDayAlert
                                  ? "#ff4444"
                                  : isCritical
                                    ? "#00ffff"
                                    : "#00ff88",
                              filter:
                                !isActive && (isZeroDayAlert || isCritical)
                                  ? "drop-shadow(0 0 4px currentColor)"
                                  : "none",
                            }}
                          />
                        </motion.div>

                        <AnimatePresence mode="wait">
                          {!isCollapsed && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                              style={{
                                flex: "1",
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: isActive ? "#ffffff" : "#e5e5e5",
                                  marginBottom: "2px",
                                  fontFamily: '"JetBrains Mono", monospace',
                                  letterSpacing: "0.5px",
                                }}
                              >
                                <span style={{ marginRight: "8px" }}>
                                  {item.emoji}
                                </span>
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: isActive ? "#cccccc" : "#999999",
                                  fontWeight: "400",
                                  fontFamily: '"JetBrains Mono", monospace',
                                  letterSpacing: "0.3px",
                                }}
                              >
                                {item.description}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {isActive && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                              width: isCollapsed ? "6px" : "8px",
                              height: isCollapsed ? "6px" : "8px",
                              backgroundColor: isZeroDayAlert
                                ? "#ff4444"
                                : isCritical
                                  ? "#00ffff"
                                  : "#00ff88",
                              borderRadius: "50%",
                              boxShadow: `0 0 15px ${isZeroDayAlert ? "rgba(255, 68, 68, 0.8)" : isCritical ? "rgba(0, 255, 255, 0.8)" : "rgba(0, 255, 136, 0.8)"}`,
                              position: "relative",
                              zIndex: 1,
                            }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              );
            })}
          </motion.div>
        </nav>

        {/* Footer Status */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: "16px 20px",
                borderTop: "1px solid rgba(0, 255, 136, 0.2)",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  color: "#00ff88",
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: "0.5px",
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "mirror",
                  }}
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#00ff88",
                    borderRadius: "50%",
                    boxShadow: "0 0 10px rgba(0, 255, 136, 0.6)",
                  }}
                />
                <span className="glow-text">SYSTEM ONLINE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

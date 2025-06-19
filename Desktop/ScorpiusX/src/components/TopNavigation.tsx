import { useState, useRef, useEffect } from "react";
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
  Target,
  Binary,
  User,
  Edit,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  {
    name: "Mission Control",
    href: "/",
    icon: LayoutDashboard,
    description: "Central command center and system overview",
    emoji: "🚀",
    category: "core",
  },
  {
    name: "Simulate & Strike",
    href: "/scanner",
    icon: Shield,
    description: "Advanced smart contract security analysis",
    emoji: "🛡️",
    category: "security",
  },
  {
    name: "Hive Alert",
    href: "/trapgrid",
    icon: Target,
    description: "Advanced threat detection and monitoring system",
    emoji: "🐝",
    category: "security",
  },
  {
    name: "CodeMatcher",
    href: "/codematcher",
    icon: Binary,
    description: "Bytecode analysis and pattern matching",
    emoji: "🧬",
    category: "analysis",
  },
  {
    name: "Flashbot Commander",
    href: "/mev",
    icon: Bot,
    description: "MEV operations and bot management",
    emoji: "🤖",
    category: "mev",
  },
  {
    name: "TX Watchtower",
    href: "/mempool",
    icon: Activity,
    description: "Real-time mempool monitoring and analysis",
    emoji: "📡",
    category: "monitoring",
  },
  {
    name: "FlashBack Ops",
    href: "/time-machine",
    icon: Clock,
    description: "Historical blockchain analysis and simulation",
    emoji: "⏰",
    category: "analysis",
  },
  {
    name: "ThreatBounty Hub",
    href: "/bounty",
    icon: DollarSign,
    description: "Bug bounty management and submissions",
    emoji: "💰",
    category: "bounty",
  },
  {
    name: "Command Matrix",
    href: "/scheduler",
    icon: Calendar,
    description: "Task automation and scheduling system",
    emoji: "📅",
    category: "automation",
  },
  {
    name: "Cyber Academy",
    href: "/training",
    icon: GraduationCap,
    description: "Security training and skill development",
    emoji: "🎓",
    category: "education",
  },
  {
    name: "PulseGrid",
    href: "/monitoring",
    icon: Monitor,
    description: "Real-time system monitoring and alerts",
    emoji: "📊",
    category: "monitoring",
  },
  {
    name: "Intel Reports",
    href: "/reports",
    icon: FileText,
    description: "Security reports and threat intelligence",
    emoji: "📄",
    category: "reports",
  },
  {
    name: "Control Panel",
    href: "/settings",
    icon: Settings,
    description: "System configuration and preferences",
    emoji: "⚙️",
    category: "core",
  },
  {
    name: "Notifications",
    href: "/settings?section=alerts",
    icon: Bell,
    description: "Alert settings and notifications",
    emoji: "🔔",
    category: "core",
  },
  {
    name: "Zero Day Alert",
    href: "/zero-day",
    icon: AlertTriangle,
    description: "Critical threat detection and response",
    emoji: "🚨",
    category: "security",
  },
];

const Tooltip = ({ item, isVisible, specialStyle, iconRef }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const tooltipWidth = 280; // Approximate tooltip width

      let x = rect.left + rect.width / 2 - tooltipWidth / 2;
      let y = rect.bottom + 12;

      // Keep tooltip within viewport
      if (x < 10) x = 10;
      if (x + tooltipWidth > window.innerWidth - 10) {
        x = window.innerWidth - tooltipWidth - 10;
      }

      setPosition({ x, y });
    }
  }, [isVisible, iconRef]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className="fixed pointer-events-none"
      style={{
        zIndex: 999999,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className="p-4 rounded-2xl max-w-xs text-center"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          border: `2px solid ${specialStyle.borderColor}`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.9), 0 4px 16px ${specialStyle.glowColor}`,
          backdropFilter: "blur(20px)",
          width: "280px",
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg">{item.emoji}</span>
          <h3
            className="font-mono font-bold text-sm"
            style={{
              color: "#ffffff",
              textShadow: `0 2px 4px rgba(0,0,0,1), 0 0 8px ${specialStyle.iconColor}`,
            }}
          >
            {item.name}
          </h3>
        </div>
        <p
          className="font-mono text-xs leading-relaxed"
          style={{
            color: "#ffffff",
            textShadow: "0 2px 4px rgba(0,0,0,1)",
          }}
        >
          {item.description}
        </p>

        {/* Category badge */}
        <div
          className="inline-block mt-2 px-2 py-1 rounded-lg text-xs font-mono font-bold"
          style={{
            background: `${specialStyle.iconColor}20`,
            border: `1px solid ${specialStyle.iconColor}60`,
            color: specialStyle.iconColor,
          }}
        >
          {item.category.toUpperCase()}
        </div>

        {/* Arrow pointer */}
        <div
          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45"
          style={{
            background: "rgba(0, 0, 0, 0.95)",
            borderTop: `1px solid ${specialStyle.borderColor}`,
            borderLeft: `1px solid ${specialStyle.borderColor}`,
            borderBottom: "none",
            borderRight: "none",
          }}
        />
      </div>
    </motion.div>
  );
};

const ProfileDropdown = ({ isOpen, onClose, iconRef }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const dropdownWidth = 200;

      let x = rect.left + rect.width / 2 - dropdownWidth / 2;
      let y = rect.bottom + 12;

      // Keep dropdown within viewport
      if (x < 10) x = 10;
      if (x + dropdownWidth > window.innerWidth - 10) {
        x = window.innerWidth - dropdownWidth - 10;
      }

      setPosition({ x, y });
    }
  }, [isOpen, iconRef]);

  const handleEditProfile = () => {
    navigate("/profile");
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className="fixed"
      style={{
        zIndex: 999999,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className="p-3 rounded-2xl min-w-[200px]"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          border: "2px solid rgba(0, 255, 255, 0.6)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.9), 0 4px 16px rgba(0, 255, 255, 0.6)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* User info */}
        <div className="pb-3 mb-3 border-b border-gray-700">
          <p className="font-mono text-sm text-white font-bold">
            {user?.username || "Agent"}
          </p>
          <p className="font-mono text-xs text-gray-400">
            {user?.role || "Security Analyst"}
          </p>
        </div>

        {/* Menu items */}
        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEditProfile}
            className="w-full flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-cyan-500/20 text-white font-mono text-sm transition-all duration-200"
          >
            <Edit className="w-4 h-4 text-cyan-400" />
            Edit Profile
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-red-500/20 text-white font-mono text-sm transition-all duration-200"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            Logout
          </motion.button>
        </div>

        {/* Arrow pointer */}
        <div
          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45"
          style={{
            background: "rgba(0, 0, 0, 0.95)",
            borderTop: "1px solid rgba(0, 255, 255, 0.6)",
            borderLeft: "1px solid rgba(0, 255, 255, 0.6)",
            borderBottom: "none",
            borderRight: "none",
          }}
        />
      </div>
    </motion.div>
  );
};

const TopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const iconRefs = useRef({});
  const profileIconRef = useRef(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "core":
        return "#00ffff";
      case "security":
        return "#ff4444";
      case "mev":
        return "#ffaa00";
      case "analysis":
        return "#00ff88";
      case "monitoring":
        return "#ff6666";
      case "reports":
        return "#00ffcc";
      case "bounty":
        return "#ffcc00";
      case "automation":
        return "#cc00ff";
      case "education":
        return "#66ff66";
      default:
        return "#00ffff";
    }
  };

  const getSpecialStyle = (item: any) => {
    const isZeroDayAlert = item.name === "Zero Day Alert";
    const isCritical = ["Hive Alert", "CodeMatcher"].includes(item.name);

    if (isZeroDayAlert) {
      return {
        borderColor: "rgba(255, 68, 68, 0.6)",
        glowColor: "rgba(255, 68, 68, 0.6)",
        iconColor: "#ff4444",
      };
    } else if (isCritical) {
      return {
        borderColor: "rgba(0, 255, 255, 0.6)",
        glowColor: "rgba(0, 255, 255, 0.6)",
        iconColor: "#00ffff",
      };
    }

    return {
      borderColor: getCategoryColor(item.category) + "60",
      glowColor: getCategoryColor(item.category) + "60",
      iconColor: getCategoryColor(item.category),
    };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileIconRef.current &&
        !profileIconRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProfileDropdown]);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

          .scorpion-pulse {
            animation: scorpion-pulse 2s ease-in-out infinite alternate;
          }

          @keyframes scorpion-pulse {
            from { filter: drop-shadow(0 0 8px #00ff88); }
            to { filter: drop-shadow(0 0 16px #00ffff); }
          }

          .cyberspace-header {
            background: linear-gradient(180deg,
              rgba(0, 0, 0, 0.95) 0%,
              rgba(10, 10, 10, 0.90) 20%,
              rgba(20, 20, 20, 0.85) 40%,
              rgba(30, 5, 5, 0.75) 60%,
              rgba(40, 10, 10, 0.60) 80%,
              rgba(0, 0, 0, 0.0) 100%
            );
            backdrop-filter: blur(20px);
            animation: cyberspace-shift 8s ease-in-out infinite;
          }

          .cyberspace-flow {
            background: linear-gradient(45deg,
              transparent 0%,
              rgba(30, 30, 30, 0.03) 20%,
              rgba(50, 50, 50, 0.05) 40%,
              rgba(70, 20, 20, 0.04) 60%,
              rgba(90, 30, 30, 0.03) 80%,
              transparent 100%
            );
            animation: flow-diagonal 6s linear infinite;
          }

          .cyberspace-grid {
            background-image:
              linear-gradient(rgba(255, 0, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 0, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: grid-flow 12s linear infinite;
            opacity: 0.3;
          }

          .cyberspace-particles {
            background-image:
              radial-gradient(circle at 20% 50%, rgba(80, 80, 80, 0.2) 1px, transparent 1px),
              radial-gradient(circle at 80% 50%, rgba(120, 60, 60, 0.3) 1px, transparent 1px),
              radial-gradient(circle at 40% 70%, rgba(150, 80, 80, 0.2) 1px, transparent 1px);
            background-size: 200px 100px, 300px 150px, 250px 120px;
            animation: particles-drift 15s ease-in-out infinite;
          }

          @keyframes cyberspace-shift {
            0%, 100% {
              background-position: 0% 0%;
              filter: hue-rotate(0deg);
            }
            50% {
              background-position: 100% 100%;
              filter: hue-rotate(30deg);
            }
          }

          @keyframes flow-diagonal {
            0% { transform: translate(-100%, -100%); }
            100% { transform: translate(100%, 100%); }
          }

          @keyframes grid-flow {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }

          @keyframes particles-drift {
            0%, 100% { transform: translate(0, 0); }
            33% { transform: translate(-50px, 20px); }
            66% { transform: translate(30px, -15px); }
          }
        `}
      </style>

      {/* Main Header */}
      <header
        className="cyberspace-header"
        style={{
          width: "100%",
          padding: "20px 32px",
          position: "relative",
          zIndex: 1000,
          fontFamily: "JetBrains Mono, Space Mono, monospace",
          overflow: "hidden",
        }}
      >
        {/* Flowing cyberspace background */}
        <div className="cyberspace-flow absolute inset-0" />
        <div className="cyberspace-grid absolute inset-0" />
        <div className="cyberspace-particles absolute inset-0" />

        {/* Content wrapper */}
        <div className="relative z-10">
          {/* Centered SCORPIUS Title */}
          <div className="flex flex-col items-center mb-6">
            <h1
              className="text-6xl mb-2"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontWeight: "700",
                letterSpacing: "8px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: "20px 30px",
                borderRadius: "8px",
                border: "2px solid #333333",
              }}
            >
              SCORPIUS
            </h1>

            {/* SCAN. SIMULATE. STRIKE. with scanning effect */}
            <div className="relative overflow-hidden">
              <div
                className="text-lg font-mono text-[#00ffff] tracking-widest"
                style={{
                  fontFamily: "JetBrains Mono, Space Mono, monospace",
                  letterSpacing: "4px",
                }}
              >
                SIMULATE. EXPLOIT. CONTROL.
              </div>

              {/* Scanning line effect */}
              <motion.div
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.8) 50%, transparent 100%)",
                  width: "30%",
                }}
                animate={{
                  x: ["-100%", "350%"],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 4,
                }}
              />

              {/* Additional scanning bars */}
              <motion.div
                className="absolute top-0 left-0 w-0.5 h-full bg-[#00ff88]"
                animate={{
                  x: [0, 300],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 6,
                }}
              />
            </div>
          </div>

          {/* Navigation Icons - Smaller and spread evenly across full width */}
          <div className="flex items-center justify-between w-full relative mt-4 px-4">
            {navigationItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const isHovered = hoveredItem === item.name;
              const specialStyle = getSpecialStyle(item);

              return (
                <div key={item.name} className="relative">
                  <NavLink
                    to={item.href}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="block"
                  >
                    <motion.div
                      ref={(el) => (iconRefs.current[item.name] = el)}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center relative transition-all duration-300"
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${specialStyle.iconColor}20, ${specialStyle.iconColor}40)`
                          : "rgba(26, 26, 26, 0.8)",
                        border: isActive
                          ? `2px solid ${specialStyle.borderColor}`
                          : `1px solid ${specialStyle.iconColor}40`,
                        boxShadow: isActive
                          ? `0 0 25px ${specialStyle.glowColor}, inset 0 0 10px ${specialStyle.iconColor}20`
                          : isHovered
                            ? `0 0 20px ${specialStyle.glowColor}`
                            : "0 0 8px rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <item.icon
                        className="w-4 h-4"
                        style={{
                          color: isActive ? specialStyle.iconColor : "#cccccc",
                          filter: isActive
                            ? `drop-shadow(0 0 4px ${specialStyle.iconColor})`
                            : "none",
                        }}
                      />

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -bottom-2 w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: specialStyle.iconColor,
                            boxShadow: `0 0 12px ${specialStyle.glowColor}`,
                          }}
                        />
                      )}

                      {/* Special effects for Zero Day Alert */}
                      {item.name === "Zero Day Alert" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-[#ff4444]"
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [1, 1.05, 1],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}

                      {/* Notification indicator for Notifications icon */}
                      {item.name === "Notifications" && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff4444] rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{
                            boxShadow: "0 0 8px rgba(255, 68, 68, 0.8)",
                          }}
                        />
                      )}
                    </motion.div>
                  </NavLink>
                </div>
              );
            })}

            {/* Profile Icon with Dropdown */}
            <div className="relative" ref={profileIconRef}>
              <motion.div
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-8 h-8 rounded-xl flex items-center justify-center relative transition-all duration-300 cursor-pointer"
                style={{
                  background: showProfileDropdown
                    ? "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.4))"
                    : "rgba(26, 26, 26, 0.8)",
                  border: showProfileDropdown
                    ? "2px solid rgba(0, 255, 255, 0.6)"
                    : "1px solid rgba(0, 255, 255, 0.4)",
                  boxShadow: showProfileDropdown
                    ? "0 0 25px rgba(0, 255, 255, 0.6), inset 0 0 10px rgba(0, 255, 255, 0.2)"
                    : "0 0 8px rgba(255, 255, 255, 0.1)",
                }}
              >
                <User
                  className="w-4 h-4"
                  style={{
                    color: showProfileDropdown ? "#00ffff" : "#cccccc",
                    filter: showProfileDropdown
                      ? "drop-shadow(0 0 4px #00ffff)"
                      : "none",
                  }}
                />

                {/* Active indicator */}
                {showProfileDropdown && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-2 w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: "#00ffff",
                      boxShadow: "0 0 12px rgba(0, 255, 255, 0.6)",
                    }}
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Tooltip Portal */}
      <AnimatePresence>
        {hoveredItem && (
          <Tooltip
            item={navigationItems.find((item) => item.name === hoveredItem)}
            isVisible={!!hoveredItem}
            specialStyle={getSpecialStyle(
              navigationItems.find((item) => item.name === hoveredItem),
            )}
            iconRef={
              iconRefs.current[hoveredItem]
                ? { current: iconRefs.current[hoveredItem] }
                : { current: null }
            }
          />
        )}
      </AnimatePresence>

      {/* Profile Dropdown Portal */}
      <AnimatePresence>
        {showProfileDropdown && (
          <ProfileDropdown
            isOpen={showProfileDropdown}
            onClose={() => setShowProfileDropdown(false)}
            iconRef={profileIconRef}
          />
        )}
      </AnimatePresence>
    </>
  );
};

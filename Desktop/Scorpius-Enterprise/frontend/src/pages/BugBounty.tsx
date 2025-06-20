import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";
import {
  DollarSign,
  Shield,
  Star,
  Clock,
  Eye,
  User,
  TrendingUp,
  Award,
  Target,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Calendar,
  Users,
  Zap,
  Activity,
  Bell,
  Settings,
  Code,
  Bug,
  Flame,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";
import { EnhancedToast } from "@/components/ui/enhanced-toast";

const ThreatBounty = () => {
  const navigate = useNavigate();
  const [bounties, setBounties] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedBounty, setSelectedBounty] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    difficulty: "",
    minReward: "",
    category: "",
    status: "all",
  });
  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Live stats with motion values
  const [liveStats, setLiveStats] = useState({
    totalBounties: 342,
    totalRewards: 2847500,
    activeBounties: 89,
    topReward: 50000,
    participants: 1247,
    successRate: 73.2,
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  };

  // Initialize data
  useEffect(() => {
    const mockBounties = [
      {
        id: "THB-001",
        title: "Critical Smart Contract Vulnerability",
        description:
          "Find critical vulnerabilities in DeFi protocol smart contracts",
        reward: 50000,
        difficulty: "Expert",
        category: "Smart Contracts",
        status: "Active",
        submissions: 23,
        timeLeft: "6 days",
        company: "DeFi Protocol Inc.",
        participants: 156,
        severity: "Critical",
      },
      {
        id: "THB-002",
        title: "MEV Extraction Vulnerability",
        description: "Identify MEV vulnerabilities in automated market makers",
        reward: 25000,
        difficulty: "Advanced",
        category: "MEV",
        status: "Active",
        submissions: 15,
        timeLeft: "12 days",
        company: "AMM Labs",
        participants: 89,
        severity: "High",
      },
      {
        id: "THB-003",
        title: "Oracle Manipulation Attack",
        description: "Find oracle manipulation vectors in price feed systems",
        reward: 30000,
        difficulty: "Expert",
        category: "Oracles",
        status: "Active",
        submissions: 31,
        timeLeft: "4 days",
        company: "Oracle Network",
        participants: 203,
        severity: "Critical",
      },
    ];

    const mockLeaderboard = [
      {
        rank: 1,
        username: "CryptoHunter",
        points: 15420,
        rewards: 125000,
        avatar: "🦂",
      },
      {
        rank: 2,
        username: "VulnFinder",
        points: 12890,
        rewards: 98500,
        avatar: "🛡️",
      },
      {
        rank: 3,
        username: "SecurityPro",
        points: 11250,
        rewards: 87300,
        avatar: "⚡",
      },
      {
        rank: 4,
        username: "ByteBreaker",
        points: 9870,
        rewards: 76200,
        avatar: "🔥",
      },
      {
        rank: 5,
        username: "CodeCracker",
        points: 8540,
        rewards: 65800,
        avatar: "💎",
      },
    ];

    setBounties(mockBounties);
    setLeaderboard(mockLeaderboard);
    setUserStats({
      rank: 23,
      points: 3420,
      totalRewards: 15750,
      activeBounties: 4,
      successRate: 68,
    });
  }, []);

  // Live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        ...prev,
        totalRewards: prev.totalRewards + Math.floor(Math.random() * 500),
        participants: prev.participants + Math.floor(Math.random() * 3),
        successRate: Math.max(
          70,
          Math.min(80, prev.successRate + (Math.random() - 0.5) * 2),
        ),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "#ff4444";
      case "High":
        return "#ffaa00";
      case "Medium":
        return "#00ffff";
      default:
        return "#00ff88";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Expert":
        return "#ff4444";
      case "Advanced":
        return "#ffaa00";
      case "Intermediate":
        return "#00ffff";
      default:
        return "#00ff88";
    }
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background: "#000000",
        fontFamily: "JetBrains Mono, Space Mono, monospace",
      }}
    >
      <motion.div
        className="max-w-7xl mx-auto p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={cardVariants}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                className="p-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600"
                style={{
                  boxShadow: "0 0 30px rgba(255, 68, 68, 0.5)",
                }}
              >
                <DollarSign size={24} />
              </motion.div>
              <div>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#ff4444",
                    margin: "0",
                    letterSpacing: "2px",
                    textShadow: "0 0 20px rgba(255, 68, 68, 0.6)",
                  }}
                >
                  BUG BOUNTIES
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#999999",
                    margin: "0",
                    letterSpacing: "1px",
                  }}
                >
                  Elite Security Bounty Programs & Threat Reporting
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl font-bold flex items-center gap-2"
              style={{
                boxShadow: "0 0 20px rgba(0, 255, 136, 0.4)",
              }}
            >
              <Plus className="w-5 h-5" />
              Submit Finding
            </motion.button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Total Bounties",
                value: liveStats.totalBounties,
                icon: Target,
                color: "#00ffff",
              },
              {
                label: "Total Rewards",
                value: `$${liveStats.totalRewards.toLocaleString()}`,
                icon: DollarSign,
                color: "#00ff88",
              },
              {
                label: "Active Bounties",
                value: liveStats.activeBounties,
                icon: Activity,
                color: "#ffaa00",
              },
              {
                label: "Top Reward",
                value: `$${liveStats.topReward.toLocaleString()}`,
                icon: Award,
                color: "#ff4444",
              },
              {
                label: "Participants",
                value: liveStats.participants,
                icon: Users,
                color: "#ff6666",
              },
              {
                label: "Success Rate",
                value: `${liveStats.successRate.toFixed(1)}%`,
                icon: TrendingUp,
                color: "#00ffcc",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                className="p-4 rounded-2xl border border-gray-700 bg-black/40"
                style={{
                  boxShadow: `0 0 20px ${stat.color}20`,
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon
                    className="w-4 h-4"
                    style={{ color: stat.color }}
                  />
                  <span className="text-xs text-gray-400 font-mono">
                    {stat.label}
                  </span>
                </div>
                <LiveCounter
                  target={
                    typeof stat.value === "string" ? stat.value : stat.value
                  }
                  className="text-lg font-bold"
                  style={{ color: stat.color }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div className="mb-6" variants={cardVariants}>
          <div className="flex items-center gap-4 p-2 bg-black/60 rounded-2xl border border-gray-700">
            {[
              { id: "active", label: "Active Bounties", icon: Activity },
              { id: "leaderboard", label: "Leaderboard", icon: Award },
              { id: "submissions", label: "My Submissions", icon: FileText },
              { id: "profile", label: "Profile", icon: User },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow:
                    activeTab === tab.id
                      ? "0 0 20px rgba(0, 255, 255, 0.3)"
                      : "none",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Active Bounties Tab */}
        {activeTab === "active" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
            <motion.div
              className="p-6 rounded-2xl border border-gray-700 bg-black/40"
              style={{
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
              }}
              variants={cardVariants}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-mono text-gray-300">
                    Filters:
                  </span>
                </div>

                <select
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
                  value={filters.difficulty}
                  onChange={(e) =>
                    setFilters({ ...filters, difficulty: e.target.value })
                  }
                >
                  <option value="">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>

                <select
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                >
                  <option value="">All Categories</option>
                  <option value="Smart Contracts">Smart Contracts</option>
                  <option value="MEV">MEV</option>
                  <option value="Oracles">Oracles</option>
                  <option value="DeFi">DeFi</option>
                </select>

                <input
                  type="number"
                  placeholder="Min Reward ($)"
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
                  value={filters.minReward}
                  onChange={(e) =>
                    setFilters({ ...filters, minReward: e.target.value })
                  }
                />
              </div>
            </motion.div>

            {/* Bounty Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bounties.map((bounty, index) => (
                <motion.div
                  key={bounty.id}
                  variants={cardVariants}
                  className="p-6 rounded-2xl border border-gray-700 bg-black/40 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
                  }}
                  onClick={() => setSelectedBounty(bounty)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {bounty.title}
                      </h3>
                      <p className="text-sm text-gray-400 font-mono">
                        {bounty.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: `${getSeverityColor(bounty.severity)}20`,
                          color: getSeverityColor(bounty.severity),
                          border: `1px solid ${getSeverityColor(bounty.severity)}40`,
                        }}
                      >
                        {bounty.severity}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    {bounty.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-bold">
                        ${bounty.reward.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 text-sm">
                        {bounty.timeLeft}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-sm">
                        {bounty.participants}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm">
                        {bounty.submissions}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="px-2 py-1 rounded-lg text-xs font-mono"
                      style={{
                        backgroundColor: `${getDifficultyColor(bounty.difficulty)}20`,
                        color: getDifficultyColor(bounty.difficulty),
                        border: `1px solid ${getDifficultyColor(bounty.difficulty)}40`,
                      }}
                    >
                      {bounty.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded-lg text-xs font-mono bg-gray-800 text-gray-300 border border-gray-600">
                      {bounty.category}
                    </span>
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white"
                    style={{
                      boxShadow: "0 0 15px rgba(0, 255, 255, 0.3)",
                    }}
                  >
                    View Details
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <motion.div
              className="p-6 rounded-2xl border border-gray-700 bg-black/40"
              style={{
                boxShadow: "0 0 20px rgba(255, 215, 0, 0.1)",
                backdropFilter: "blur(10px)",
              }}
              variants={cardVariants}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-yellow-400" />
                Elite Hunters Leaderboard
              </h2>

              <div className="space-y-4">
                {leaderboard.map((hunter, index) => (
                  <motion.div
                    key={hunter.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-yellow-400/50 transition-all duration-300"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          hunter.rank <= 3
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {hunter.rank}
                      </div>
                      <div className="text-2xl">{hunter.avatar}</div>
                      <div>
                        <h3 className="font-bold text-white">
                          {hunter.username}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {hunter.points.toLocaleString()} points
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">
                        ${hunter.rewards.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">Total Rewards</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ThreatBounty;
export { ThreatBounty as BugBounty };

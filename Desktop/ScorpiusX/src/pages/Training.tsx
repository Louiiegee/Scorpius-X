import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
} from "framer-motion";
import {
  GraduationCap,
  Play,
  BookOpen,
  Award,
  Clock,
  Star,
  CheckCircle,
  Lock,
  Trophy,
  Target,
  Zap,
  Loader2,
  Brain,
  Code,
  Shield,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Settings,
  Eye,
  ChevronRight,
  Flame,
  Activity,
  Layers,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/ui/live-counter";
import { EnhancedToast } from "@/components/ui/enhanced-toast";

const CyberAcademy = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: "success" | "error" | "info" }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("courses");

  // Live stats
  const [liveStats, setLiveStats] = useState({
    activeStudents: 2847,
    coursesCompleted: 15,
    knowledgePoints: 8540,
    skillLevel: 67,
    currentStreak: 12,
    nextCertification: "Security Specialist",
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
    const mockCourses = [
      {
        id: "SEC-101",
        title: "Smart Contract Security Fundamentals",
        description:
          "Learn the basics of smart contract vulnerabilities and security best practices",
        instructor: "Dr. Alice Chen",
        difficulty: "Beginner",
        duration: "4 hours",
        modules: 12,
        progress: 75,
        rating: 4.8,
        students: 1247,
        category: "Security",
        skillPoints: 150,
        certification: true,
        tags: ["Solidity", "Security", "Basics"],
        nextLesson: "Reentrancy Attacks",
        estimatedCompletion: "1 week",
      },
      {
        id: "MEV-201",
        title: "Advanced MEV Strategies",
        description:
          "Master MEV extraction techniques and arbitrage opportunities",
        instructor: "Prof. Bob Rodriguez",
        difficulty: "Advanced",
        duration: "8 hours",
        modules: 20,
        progress: 30,
        rating: 4.9,
        students: 856,
        category: "MEV",
        skillPoints: 300,
        certification: true,
        tags: ["MEV", "DeFi", "Advanced"],
        nextLesson: "Flashloan Arbitrage",
        estimatedCompletion: "3 weeks",
      },
      {
        id: "DEFI-301",
        title: "DeFi Protocol Analysis",
        description:
          "Deep dive into DeFi protocol mechanics and security analysis",
        instructor: "Dr. Charlie Kim",
        difficulty: "Expert",
        duration: "12 hours",
        modules: 25,
        progress: 0,
        rating: 4.7,
        students: 423,
        category: "DeFi",
        skillPoints: 500,
        certification: true,
        tags: ["DeFi", "Analysis", "Expert"],
        nextLesson: "Protocol Overview",
        estimatedCompletion: "6 weeks",
      },
    ];

    const mockAchievements = [
      {
        name: "First Steps",
        description: "Complete your first course",
        unlocked: true,
        rarity: "common",
      },
      {
        name: "Security Expert",
        description: "Complete 5 security courses",
        unlocked: true,
        rarity: "rare",
      },
      {
        name: "MEV Master",
        description: "Complete advanced MEV course",
        unlocked: false,
        rarity: "epic",
      },
      {
        name: "DeFi Guru",
        description: "Master all DeFi courses",
        unlocked: false,
        rarity: "legendary",
      },
    ];

    setCourses(mockCourses);
    setUserProgress({
      level: 23,
      xp: 8540,
      xpToNext: 1460,
      achievements: mockAchievements,
      totalHours: 156,
      streak: 12,
      certificates: 3,
    });
  }, []);

  // Live stats animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        ...prev,
        activeStudents: prev.activeStudents + Math.floor(Math.random() * 5),
        knowledgePoints: prev.knowledgePoints + Math.floor(Math.random() * 10),
        skillLevel: Math.min(
          100,
          prev.skillLevel + (Math.random() > 0.9 ? 1 : 0),
        ),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "#00ff88";
      case "Intermediate":
        return "#00ffff";
      case "Advanced":
        return "#ffaa00";
      case "Expert":
        return "#ff4444";
      default:
        return "#666666";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Security":
        return "#ff4444";
      case "MEV":
        return "#ffaa00";
      case "DeFi":
        return "#00ffff";
      case "Analysis":
        return "#00ff88";
      default:
        return "#666666";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "#00ff88";
      case "rare":
        return "#00ffff";
      case "epic":
        return "#ffaa00";
      case "legendary":
        return "#ff4444";
      default:
        return "#666666";
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
      {/* Animated neural network background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Neural nodes */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${(i % 5) * 20 + 10}%`,
              top: `${Math.floor(i / 5) * 20 + 10}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 2, 1],
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Connecting lines */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{
              left: `${i * 12}%`,
              top: `${30 + i * 8}%`,
              width: "200px",
              transform: `rotate(${i * 45}deg)`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

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
                className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600"
                style={{
                  boxShadow: "0 0 30px rgba(168, 85, 247, 0.5)",
                }}
              >
                <Brain size={24} />
              </motion.div>
              <div>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#a855f7",
                    margin: "0",
                    letterSpacing: "2px",
                    textShadow: "0 0 20px rgba(168, 85, 247, 0.6)",
                  }}
                >
                  CYBER ACADEMY
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#999999",
                    margin: "0",
                    letterSpacing: "1px",
                  }}
                >
                  Advanced Security Training & Certification
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
              <Play className="w-5 h-5" />
              Continue Learning
            </motion.button>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Active Students",
                value: liveStats.activeStudents,
                icon: Users,
                color: "#00ffff",
              },
              {
                label: "Courses Completed",
                value: liveStats.coursesCompleted,
                icon: CheckCircle,
                color: "#00ff88",
              },
              {
                label: "Knowledge Points",
                value: liveStats.knowledgePoints,
                icon: Brain,
                color: "#ffaa00",
              },
              {
                label: "Skill Level",
                value: liveStats.skillLevel,
                icon: TrendingUp,
                color: "#ff4444",
              },
              {
                label: "Current Streak",
                value: `${liveStats.currentStreak} days`,
                icon: Flame,
                color: "#ff6666",
              },
              {
                label: "Next Cert",
                value: liveStats.nextCertification,
                icon: Award,
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
              { id: "courses", label: "Courses", icon: BookOpen },
              { id: "progress", label: "Progress", icon: TrendingUp },
              { id: "achievements", label: "Achievements", icon: Award },
              { id: "certifications", label: "Certifications", icon: Trophy },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow:
                    activeTab === tab.id
                      ? "0 0 20px rgba(168, 85, 247, 0.3)"
                      : "none",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Course Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  variants={cardVariants}
                  className="p-6 rounded-2xl border border-gray-700 bg-black/40 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 30px rgba(168, 85, 247, 0.2)",
                  }}
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="p-2 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${getCategoryColor(course.category)}20, ${getCategoryColor(course.category)}40)`,
                          border: `2px solid ${getCategoryColor(course.category)}60`,
                        }}
                      >
                        {course.category === "Security" ? (
                          <Shield
                            className="w-5 h-5"
                            style={{ color: getCategoryColor(course.category) }}
                          />
                        ) : course.category === "MEV" ? (
                          <Zap
                            className="w-5 h-5"
                            style={{ color: getCategoryColor(course.category) }}
                          />
                        ) : course.category === "DeFi" ? (
                          <Activity
                            className="w-5 h-5"
                            style={{ color: getCategoryColor(course.category) }}
                          />
                        ) : (
                          <Code
                            className="w-5 h-5"
                            style={{ color: getCategoryColor(course.category) }}
                          />
                        )}
                      </motion.div>
                      <div>
                        <span className="text-xs font-mono text-gray-400">
                          {course.id}
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    {course.certification && (
                      <Award className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Progress Bar */}
                  {course.progress > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs font-bold text-purple-400">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{
                            boxShadow: "0 0 10px rgba(168, 85, 247, 0.5)",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Course Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-sm">
                        {course.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">
                        {course.modules} modules
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm">
                        {course.students}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        {course.rating}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span
                      className="px-2 py-1 rounded-lg text-xs font-mono"
                      style={{
                        backgroundColor: `${getDifficultyColor(course.difficulty)}20`,
                        color: getDifficultyColor(course.difficulty),
                        border: `1px solid ${getDifficultyColor(course.difficulty)}40`,
                      }}
                    >
                      {course.difficulty}
                    </span>
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-lg text-xs font-mono bg-gray-800 text-gray-300 border border-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                    style={{
                      boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)",
                    }}
                  >
                    {course.progress > 0 ? (
                      <>
                        <Play className="w-4 h-4" />
                        Continue
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        Start Course
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && userProgress && (
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
                <Trophy className="w-6 h-6 text-yellow-400" />
                Achievements & Badges
              </h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {userProgress.achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      achievement.unlocked
                        ? "border-yellow-400/50 bg-yellow-400/10"
                        : "border-gray-700 bg-gray-800/30"
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <motion.div
                        animate={
                          achievement.unlocked ? { rotate: [0, 360] } : {}
                        }
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className={`p-2 rounded-lg ${
                          achievement.unlocked
                            ? "bg-yellow-400/20"
                            : "bg-gray-700"
                        }`}
                      >
                        <Award
                          className="w-5 h-5"
                          style={{
                            color: achievement.unlocked
                              ? getRarityColor(achievement.rarity)
                              : "#666666",
                          }}
                        />
                      </motion.div>
                      <div>
                        <h3
                          className={`font-bold ${achievement.unlocked ? "text-white" : "text-gray-500"}`}
                        >
                          {achievement.name}
                        </h3>
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: `${getRarityColor(achievement.rarity)}20`,
                            color: getRarityColor(achievement.rarity),
                          }}
                        >
                          {achievement.rarity}
                        </span>
                      </div>
                    </div>
                    <p
                      className={`text-sm ${achievement.unlocked ? "text-gray-300" : "text-gray-500"}`}
                    >
                      {achievement.description}
                    </p>
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

export default CyberAcademy;
export { CyberAcademy as Training };

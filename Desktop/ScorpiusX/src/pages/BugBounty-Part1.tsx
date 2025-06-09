import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import "../styles/builder-override.css";

const BugBountyPart1 = () => {
  const navigate = useNavigate();
  const [bounties, setBounties] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedBounty, setSelectedBounty] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    difficulty: "",
    minReward: "",
    status: "",
    category: "",
  });
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: "success" | "error" | "info" }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  // Mock data for bounties
  const mockBounties = [
    {
      id: 1,
      title: "Smart Contract Reentrancy Detection",
      description:
        "Find and report reentrancy vulnerabilities in DeFi protocols",
      reward: 5000,
      difficulty: "Hard",
      category: "Smart Contracts",
      status: "Active",
      submissions: 23,
      timeLeft: "14 days",
      company: "DeFiSecure",
    },
    {
      id: 2,
      title: "Cross-Chain Bridge Security Audit",
      description: "Identify security flaws in multi-chain bridge protocols",
      reward: 8000,
      difficulty: "Expert",
      category: "Infrastructure",
      status: "Active",
      submissions: 7,
      timeLeft: "21 days",
      company: "BridgeProtocol",
    },
    {
      id: 3,
      title: "MEV Bot Exploitation Research",
      description: "Research and document MEV extraction vulnerabilities",
      reward: 3000,
      difficulty: "Medium",
      category: "MEV",
      status: "Active",
      submissions: 45,
      timeLeft: "7 days",
      company: "MEVGuard",
    },
    {
      id: 4,
      title: "Flash Loan Attack Vectors",
      description: "Discover new flash loan attack patterns in DeFi",
      reward: 4500,
      difficulty: "Hard",
      category: "DeFi",
      status: "Completed",
      submissions: 89,
      timeLeft: "Ended",
      company: "FlashDefender",
    },
  ];

  // Mock user submissions
  const mockSubmissions = [
    {
      id: 1,
      bountyId: 1,
      bountyTitle: "Smart Contract Reentrancy Detection",
      status: "Under Review",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      feedback: null,
      reward: 5000,
      verdict: null,
    },
    {
      id: 2,
      bountyId: 3,
      bountyTitle: "MEV Bot Exploitation Research",
      status: "Approved",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      feedback: "Excellent research on sandwich attack optimization.",
      reward: 3000,
      verdict: "Accepted",
    },
    {
      id: 3,
      bountyId: 4,
      bountyTitle: "Flash Loan Attack Vectors",
      status: "Rejected",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      feedback: "Attack vector already known. Need novel approaches.",
      reward: 0,
      verdict: "Duplicate",
    },
  ];

  // Mock leaderboard
  const mockLeaderboard = [
    {
      rank: 1,
      username: "SecurityNinja",
      totalEarned: 45000,
      bounties: 12,
      successRate: 92,
      specialties: ["Smart Contracts", "DeFi"],
      avatar: "🥷",
    },
    {
      rank: 2,
      username: "ChainBreaker",
      totalEarned: 38500,
      bounties: 15,
      successRate: 87,
      specialties: ["Infrastructure", "Cross-Chain"],
      avatar: "⛓️",
    },
    {
      rank: 3,
      username: "MEVHunter",
      totalEarned: 32000,
      bounties: 8,
      successRate: 95,
      specialties: ["MEV", "Arbitrage"],
      avatar: "🎯",
    },
  ];

  // Initialize data
  useEffect(() => {
    setBounties(mockBounties);
    setSubmissions(mockSubmissions);
    setLeaderboard(mockLeaderboard);

    setUserStats({
      totalEarned: 8000,
      activeBounties: 2,
      completedBounties: 3,
      successRate: 85,
      rank: 42,
      reputation: 4.7,
    });
  }, []);

  // Notification system
  const addNotification = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      const id = Date.now().toString();
      setNotifications((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    },
    [],
  );

  // Helper functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "#00ff88";
      case "Medium":
        return "#ffaa00";
      case "Hard":
        return "#ff6666";
      case "Expert":
        return "#ff4444";
      default:
        return "#999999";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "#00ff88";
      case "Under Review":
        return "#ffaa00";
      case "Completed":
        return "#00ffff";
      case "Approved":
        return "#00ff88";
      case "Rejected":
        return "#ff4444";
      default:
        return "#999999";
    }
  };

  const submitToBounty = async (bountyId: number) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addNotification("Submission uploaded successfully", "success");

      // Add to submissions
      const bounty = bounties.find((b) => b.id === bountyId);
      const newSubmission = {
        id: Date.now(),
        bountyId,
        bountyTitle: bounty?.title || "",
        status: "Under Review",
        submittedAt: new Date(),
        feedback: null,
        reward: bounty?.reward || 0,
        verdict: null,
      };

      setSubmissions((prev) => [newSubmission, ...prev]);
    } catch (error) {
      addNotification("Failed to submit", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Notification System */}
      {notifications.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                backgroundColor:
                  notification.type === "success"
                    ? "#00ff88"
                    : notification.type === "error"
                      ? "#ff4444"
                      : "#00ffff",
                color: "#000000",
                padding: "12px 16px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                fontSize: "14px",
                fontWeight: "500",
                maxWidth: "300px",
                fontFamily: '"Roboto", system-ui, -apple-system, sans-serif',
              }}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      <div
        className="bounty-container cyberpunk-theme"
        style={{
          fontFamily: '"Roboto", system-ui, -apple-system, sans-serif',
          fontSize: "14px",
          fontWeight: "400",
          lineHeight: "1.5",
          color: "#e5e5e5",
          backgroundColor: "#000000",
          minHeight: "100vh",
          padding: "16px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                letterSpacing: "3px",
                textShadow: "0 0 15px rgba(0, 255, 255, 0.6)",
                textTransform: "uppercase",
                fontSize: "clamp(20px, 4vw, 28px)",
                fontFamily: '"Audiowide", display',
                fontWeight: "400",
              }}
            >
              Threatboard
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#999999",
                  textAlign: "right",
                }}
              >
                <div style={{ color: "#00ff88", fontWeight: "600" }}>
                  ${userStats?.totalEarned.toLocaleString()}
                </div>
                <div>Total Earned</div>
              </div>

              <button
                onClick={() => addNotification("Profile updated", "success")}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #333333",
                  borderRadius: "8px",
                  color: "#e5e5e5",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <User size={14} />
                Profile
              </button>
            </div>
          </div>
          <div style={{ color: "#999999", fontSize: "16px" }}>
            Security Bug Bounty Platform
          </div>
        </div>

        {/* User Stats Overview */}
        {userStats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {[
              {
                title: "Earned",
                value: `$${userStats.totalEarned.toLocaleString()}`,
                icon: DollarSign,
                color: "#00ff88",
              },
              {
                title: "Active",
                value: userStats.activeBounties.toString(),
                icon: Target,
                color: "#ffaa00",
              },
              {
                title: "Completed",
                value: userStats.completedBounties.toString(),
                icon: CheckCircle,
                color: "#00ffff",
              },
              {
                title: "Success Rate",
                value: `${userStats.successRate}%`,
                icon: TrendingUp,
                color: "#00ff88",
              },
              {
                title: "Rank",
                value: `#${userStats.rank}`,
                icon: Award,
                color: "#ffaa00",
              },
              {
                title: "Reputation",
                value: userStats.reputation.toFixed(1),
                icon: Star,
                color: "#ff6666",
              },
            ].map((stat, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333333",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <stat.icon
                  size={20}
                  style={{
                    color: stat.color,
                    marginBottom: "8px",
                  }}
                />
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#ffffff",
                    marginBottom: "4px",
                    fontFamily: '"Audiowide", cursive',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: "11px", color: "#999999" }}>
                  {stat.title}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #333333",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: activeTab === "browse" ? "20px" : "0",
            }}
          >
            {[
              { id: "browse", label: "Browse Bounties", icon: Search },
              { id: "submissions", label: "My Submissions", icon: Eye },
              { id: "leaderboard", label: "Leaderboard", icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 16px",
                  backgroundColor: activeTab === tab.id ? "#00ffff" : "#2a2a2a",
                  color: activeTab === tab.id ? "#000000" : "#e5e5e5",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Placeholder for tab content - will be added in Part 2 */}
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#666666",
              fontSize: "14px",
              backgroundColor: "#0a0a0a",
              borderRadius: "8px",
              border: "1px solid #333333",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <Target
                size={48}
                style={{ color: "#333333", marginBottom: "12px" }}
              />
            </div>
            <div
              style={{
                color: "#ffffff",
                fontSize: "16px",
                marginBottom: "8px",
              }}
            >
              Bug Bounty System - Part 1 Loaded
            </div>
            <div>Tab content will be added in Part 2</div>
            <div
              style={{ fontSize: "12px", marginTop: "12px", color: "#666666" }}
            >
              Current tab: {activeTab}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <DollarSign
              size={24}
              style={{ color: "#00ff88", marginBottom: "12px" }}
            />
            <div
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#ffffff",
                marginBottom: "4px",
              }}
            >
              {bounties.reduce((sum, b) => sum + b.reward, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", color: "#999999" }}>
              Total Available Rewards
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <Shield
              size={24}
              style={{ color: "#00ffff", marginBottom: "12px" }}
            />
            <div
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#ffffff",
                marginBottom: "4px",
              }}
            >
              {bounties.filter((b) => b.status === "Active").length}
            </div>
            <div style={{ fontSize: "12px", color: "#999999" }}>
              Active Bounties
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <Users
              size={24}
              style={{ color: "#ffaa00", marginBottom: "12px" }}
            />
            <div
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#ffffff",
                marginBottom: "4px",
              }}
            >
              {bounties.reduce((sum, b) => sum + b.submissions, 0)}
            </div>
            <div style={{ fontSize: "12px", color: "#999999" }}>
              Total Submissions
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BugBountyPart1;
export { BugBountyPart1 };

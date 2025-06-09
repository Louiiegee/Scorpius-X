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

const BugBountyPart2 = () => {
  const navigate = useNavigate();
  const [bounties, setBounties] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
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

  // Mock data
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
  ];

  const mockSubmissions = [
    {
      id: 1,
      bountyId: 1,
      bountyTitle: "Smart Contract Reentrancy Detection",
      status: "Under Review",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      reward: 5000,
      verdict: null,
    },
    {
      id: 2,
      bountyId: 3,
      bountyTitle: "MEV Bot Exploitation Research",
      status: "Approved",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      reward: 3000,
      verdict: "Accepted",
    },
  ];

  const mockLeaderboard = [
    {
      rank: 1,
      username: "SecurityNinja",
      totalEarned: 45000,
      bounties: 12,
      successRate: 92,
      avatar: "🥷",
    },
    {
      rank: 2,
      username: "ChainBreaker",
      totalEarned: 38500,
      bounties: 15,
      successRate: 87,
      avatar: "⛓️",
    },
    {
      rank: 3,
      username: "MEVHunter",
      totalEarned: 32000,
      bounties: 8,
      successRate: 95,
      avatar: "🎯",
    },
  ];

  // Initialize data
  useEffect(() => {
    setBounties(mockBounties);
    setSubmissions(mockSubmissions);
    setLeaderboard(mockLeaderboard);
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
    } catch (error) {
      addNotification("Failed to submit", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredBounties = bounties.filter((bounty) => {
    if (filters.difficulty && bounty.difficulty !== filters.difficulty)
      return false;
    if (filters.minReward && bounty.reward < parseInt(filters.minReward))
      return false;
    if (filters.status && bounty.status !== filters.status) return false;
    if (filters.category && bounty.category !== filters.category) return false;
    return true;
  });

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
        className="bounty-tabs-container cyberpunk-theme"
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
              color: "#ffffff",
              letterSpacing: "3px",
              textShadow: "0 0 15px rgba(0, 255, 255, 0.6)",
              textTransform: "uppercase",
              fontSize: "clamp(20px, 4vw, 28px)",
              fontFamily: '"Audiowide", display',
              fontWeight: "400",
              marginBottom: "8px",
            }}
          >
            Threatboard - Tab Content
          </div>
          <div style={{ color: "#999999", fontSize: "16px" }}>
            Bug Bounty Platform - Detailed Tab Implementation
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
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

        {/* Tab Content */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #333333",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          {/* Browse Bounties Tab */}
          {activeTab === "browse" && (
            <>
              {/* Filters */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <select
                  value={filters.difficulty}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                >
                  <option value="">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>

                <input
                  type="number"
                  placeholder="Min Reward ($)"
                  value={filters.minReward}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minReward: e.target.value,
                    }))
                  }
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>

                <button
                  onClick={() =>
                    setFilters({
                      difficulty: "",
                      minReward: "",
                      status: "",
                      category: "",
                    })
                  }
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #333333",
                    borderRadius: "6px",
                    color: "#e5e5e5",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <RefreshCw size={12} />
                  Clear
                </button>
              </div>

              {/* Bounty List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {filteredBounties.map((bounty) => (
                  <div
                    key={bounty.id}
                    style={{
                      padding: "20px",
                      backgroundColor: "#2a2a2a",
                      borderRadius: "12px",
                      borderLeft: `4px solid ${getDifficultyColor(bounty.difficulty)}`,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#333333";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#2a2a2a";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "8px",
                          }}
                        >
                          <h3
                            style={{
                              color: "#ffffff",
                              fontSize: "16px",
                              margin: "0",
                              fontWeight: "600",
                            }}
                          >
                            {bounty.title}
                          </h3>
                          <div
                            style={{
                              fontSize: "10px",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              backgroundColor: getDifficultyColor(
                                bounty.difficulty,
                              ),
                              color: "#000000",
                              fontWeight: "600",
                            }}
                          >
                            {bounty.difficulty}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              backgroundColor: getStatusColor(bounty.status),
                              color: "#000000",
                              fontWeight: "600",
                            }}
                          >
                            {bounty.status}
                          </div>
                        </div>

                        <p
                          style={{
                            color: "#cccccc",
                            fontSize: "14px",
                            margin: "0 0 12px 0",
                          }}
                        >
                          {bounty.description}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "20px",
                            fontSize: "12px",
                            color: "#999999",
                          }}
                        >
                          <div>
                            <Users
                              size={14}
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            {bounty.submissions} submissions
                          </div>
                          <div>
                            <Clock
                              size={14}
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            {bounty.timeLeft}
                          </div>
                          <div>
                            <Shield
                              size={14}
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            {bounty.company}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", marginLeft: "20px" }}>
                        <div
                          style={{
                            color: "#00ff88",
                            fontSize: "24px",
                            fontWeight: "600",
                            fontFamily: '"Audiowide", cursive',
                          }}
                        >
                          ${bounty.reward.toLocaleString()}
                        </div>
                        <button
                          onClick={() => submitToBounty(bounty.id)}
                          disabled={loading || bounty.status !== "Active"}
                          style={{
                            marginTop: "8px",
                            padding: "8px 16px",
                            backgroundColor:
                              bounty.status === "Active"
                                ? "#00ff88"
                                : "#666666",
                            color: "#000000",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor:
                              bounty.status === "Active"
                                ? "pointer"
                                : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {loading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Plus size={12} />
                          )}
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* My Submissions Tab */}
          {activeTab === "submissions" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <h3
                style={{
                  color: "#ffffff",
                  fontSize: "16px",
                  margin: "0 0 16px 0",
                  fontFamily: '"Audiowide", cursive',
                }}
              >
                MY SUBMISSIONS
              </h3>

              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  style={{
                    padding: "16px",
                    backgroundColor: "#2a2a2a",
                    borderRadius: "12px",
                    borderLeft: `4px solid ${getStatusColor(submission.status)}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <h4
                      style={{
                        color: "#ffffff",
                        fontSize: "14px",
                        margin: "0",
                        fontWeight: "600",
                      }}
                    >
                      {submission.bountyTitle}
                    </h4>
                    <div
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: getStatusColor(submission.status),
                        color: "#000000",
                        fontWeight: "600",
                      }}
                    >
                      {submission.status}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#999999",
                    }}
                  >
                    <span>
                      Submitted: {submission.submittedAt.toLocaleDateString()}
                    </span>
                    <span style={{ color: "#00ff88", fontWeight: "600" }}>
                      ${submission.reward.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <h3
                style={{
                  color: "#ffffff",
                  fontSize: "16px",
                  margin: "0 0 16px 0",
                  fontFamily: '"Audiowide", cursive',
                }}
              >
                LEADERBOARD
              </h3>

              {leaderboard.map((user) => (
                <div
                  key={user.rank}
                  style={{
                    padding: "16px",
                    backgroundColor: "#2a2a2a",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "20px",
                      backgroundColor: user.rank <= 3 ? "#ffaa00" : "#333333",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    {user.avatar}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "#ffffff",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        #{user.rank} {user.username}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#999999" }}>
                      {user.bounties} bounties • {user.successRate}% success
                      rate
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: "#00ff88",
                        fontSize: "16px",
                        fontWeight: "600",
                      }}
                    >
                      ${user.totalEarned.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "11px", color: "#999999" }}>
                      Total Earned
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BugBountyPart2;
export { BugBountyPart2 };

import { TrendingUp, TrendingDown, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ModernDashboard() {
  const stats = [
    {
      title: "Active credit",
      value: "11.2",
      unit: "BTC",
      change: null,
    },
    {
      title: "Payment goal",
      value: "34%",
      unit: "",
      change: null,
    },
    {
      title: "Price analytics",
      value: "$28,165",
      unit: "",
      change: "+5.24%",
      trend: "up",
    },
  ];

  const transactions = [
    {
      name: "Bitcoin",
      date: "16 Jun 2023",
      amount: "1.38 BTC",
      status: "Successful",
      avatar: "₿",
    },
    {
      name: "Ethereum",
      date: "16 Jun 2023",
      amount: "2.05 ETH",
      status: "Successful",
      avatar: "Ξ",
    },
    {
      name: "Bitcoin",
      date: "16 Jun 2023",
      amount: "3.6 BTC",
      status: "Successful",
      avatar: "₿",
    },
    {
      name: "Bitcoin",
      date: "16 Jun 2023",
      amount: "5.7 BTC",
      status: "Successful",
      avatar: "₿",
    },
    {
      name: "Ethereum",
      date: "17 Jun 2023",
      amount: "1.7 ETH",
      status: "Successful",
      avatar: "Ξ",
    },
  ];

  const chartData = [
    { name: "Jan", value: 20 },
    { name: "Feb", value: 35 },
    { name: "Mar", value: 25 },
    { name: "Apr", value: 45 },
    { name: "May", value: 30 },
    { name: "Jun", value: 55 },
    { name: "Jul", value: 40 },
    { name: "Aug", value: 65 },
    { name: "Sep", value: 50 },
    { name: "Oct", value: 75 },
    { name: "Nov", value: 60 },
    { name: "Dec", value: 80 },
  ];

  return (
    <div
      style={{
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "1.5",
        color: "#e5e7eb",
        backgroundColor: "#0f1419",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "600",
              color: "#ffffff",
              margin: "0",
            }}
          >
            Welcome back Alice
          </h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Button
              style={{
                backgroundColor: "#1a2332",
                border: "1px solid #2d3f57",
                borderRadius: "12px",
                color: "#e5e7eb",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Download
            </Button>
            <Button
              style={{
                backgroundColor: "#6366f1",
                border: "none",
                borderRadius: "12px",
                color: "#ffffff",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Stats Cards */}
        {stats.map((stat, index) => (
          <Card
            key={index}
            style={{
              backgroundColor: "#1a2332",
              border: "1px solid #2d3f57",
              borderRadius: "16px",
              padding: "24px",
              position: "relative",
            }}
          >
            <CardContent style={{ padding: "0" }}>
              <div style={{ marginBottom: "8px" }}>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#9ca3af",
                    margin: "0",
                    fontWeight: "500",
                  }}
                >
                  {stat.title}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#ffffff",
                    lineHeight: "1",
                  }}
                >
                  {stat.value}
                </span>
                {stat.unit && (
                  <span
                    style={{
                      fontSize: "16px",
                      color: "#9ca3af",
                      fontWeight: "500",
                    }}
                  >
                    {stat.unit}
                  </span>
                )}
              </div>
              {stat.change && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp size={14} style={{ color: "#10b981" }} />
                  ) : (
                    <TrendingDown size={14} style={{ color: "#ef4444" }} />
                  )}
                  <span
                    style={{
                      fontSize: "13px",
                      color: stat.trend === "up" ? "#10b981" : "#ef4444",
                      fontWeight: "500",
                    }}
                  >
                    {stat.change}
                  </span>
                </div>
              )}
              {index === 1 && (
                <div
                  style={{
                    marginTop: "16px",
                    height: "60px",
                    position: "relative",
                  }}
                >
                  {/* Simple progress visualization */}
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "#374151",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "34%",
                        height: "100%",
                        backgroundColor: "#6366f1",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Price Analytics Chart */}
        <Card
          style={{
            backgroundColor: "#1a2332",
            border: "1px solid #2d3f57",
            borderRadius: "16px",
            padding: "24px",
            gridColumn: "span 2",
            minHeight: "280px",
          }}
        >
          <CardContent style={{ padding: "0", height: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: "0",
                }}
              >
                Price analytics
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{
                    backgroundColor: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    color: "#9ca3af",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  Weekly
                </button>
                <button
                  style={{
                    backgroundColor: "#6366f1",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  Monthly
                </button>
              </div>
            </div>
            {/* Chart visualization */}
            <div
              style={{
                height: "180px",
                display: "flex",
                alignItems: "end",
                gap: "4px",
                padding: "20px 0",
              }}
            >
              {chartData.map((item, index) => (
                <div
                  key={index}
                  style={{
                    flex: "1",
                    height: `${(item.value / 80) * 100}%`,
                    backgroundColor: index === 9 ? "#fbbf24" : "#6366f1",
                    borderRadius: "4px 4px 0 0",
                    minHeight: "8px",
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card
          style={{
            backgroundColor: "#1a2332",
            border: "1px solid #2d3f57",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <CardContent style={{ padding: "0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: "0",
                }}
              >
                Payment history
              </h3>
              <MoreHorizontal size={20} style={{ color: "#9ca3af" }} />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {transactions.map((transaction, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      backgroundColor: "#374151",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#ffffff",
                    }}
                  >
                    {transaction.avatar}
                  </div>
                  <div style={{ flex: "1" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ffffff",
                        marginBottom: "2px",
                      }}
                    >
                      {transaction.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                      }}
                    >
                      {transaction.date}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#ffffff",
                        marginBottom: "2px",
                      }}
                    >
                      {transaction.amount}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#10b981",
                      }}
                    >
                      {transaction.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Stats Cards */}
        <Card
          style={{
            backgroundColor: "#1a2332",
            border: "1px solid #2d3f57",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <CardContent style={{ padding: "0" }}>
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  margin: "0 0 8px 0",
                  fontWeight: "500",
                }}
              >
                Amount of credit
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#ffffff",
                  margin: "0",
                }}
              >
                15.9{" "}
                <span style={{ fontSize: "16px", color: "#9ca3af" }}>BTC</span>
              </p>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  margin: "0 0 8px 0",
                  fontWeight: "500",
                }}
              >
                Usage plan
              </p>
              <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: "1",
                      height: "32px",
                      backgroundColor: i === 3 ? "#fbbf24" : "#374151",
                      borderRadius: "6px",
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  margin: "0 0 8px 0",
                  fontWeight: "500",
                }}
              >
                Active investors
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", marginLeft: "-8px" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#6366f1",
                        border: "2px solid #1a2332",
                        marginLeft: "-8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#ffffff",
                      }}
                    >
                      {i}
                    </div>
                  ))}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#374151",
                      border: "2px solid #1a2332",
                      marginLeft: "-8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#9ca3af",
                    }}
                  >
                    +5
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#ffffff",
                    }}
                  >
                    72%
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                    }}
                  >
                    Mar 01 - Jun 01
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

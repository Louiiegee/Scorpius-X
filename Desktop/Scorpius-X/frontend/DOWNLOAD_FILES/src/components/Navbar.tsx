import {
  ChevronDown,
  User,
  Search,
  Command,
  AlertTriangle,
  X,
} from "lucide-react";

// Add CSS animation for the scanning effect
const scanlineKeyframes = `
  @keyframes scanline {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

// Inject CSS into head
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = scanlineKeyframes;
  document.head.appendChild(style);
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header
      style={{
        backgroundColor: "#1a1a1a",
        borderBottom: "2px solid rgba(0, 255, 255, 0.4)",
        boxShadow: "0 2px 20px rgba(0, 255, 255, 0.2)",
        padding: "20px 32px",
        fontFamily: '"Roboto", system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "100%",
        }}
      >
        {/* Left section - Search */}
        <div
          style={{
            flex: "1",
            maxWidth: "500px",
            marginRight: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {!isSearchOpen ? (
            /* Collapsed Search Icon */
            <button
              onClick={() => setIsSearchOpen(true)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#2a2a2a",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                color: "#00ffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                boxShadow: "0 0 15px rgba(0, 255, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.8)";
                e.currentTarget.style.boxShadow =
                  "0 0 25px rgba(0, 255, 255, 0.5)";
                e.currentTarget.style.backgroundColor = "#1a1a1a";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                e.currentTarget.style.boxShadow =
                  "0 0 15px rgba(0, 255, 255, 0.3)";
                e.currentTarget.style.backgroundColor = "#2a2a2a";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Search size={20} />
            </button>
          ) : (
            /* Expanded Search Bar */
            <div
              style={{
                position: "relative",
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  flex: "1",
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999999",
                  }}
                />
                <input
                  placeholder="Search contracts, transactions, alerts..."
                  autoFocus
                  style={{
                    width: "100%",
                    paddingLeft: "50px",
                    paddingRight: "50px",
                    paddingTop: "14px",
                    paddingBottom: "14px",
                    backgroundColor: "#1a1a1a",
                    border: "2px solid rgba(0, 255, 255, 0.8)",
                    borderRadius: "25px",
                    color: "#e5e5e5",
                    fontSize: "15px",
                    outline: "none",
                    transition: "all 0.3s ease",
                    fontFamily:
                      '"Roboto", system-ui, -apple-system, sans-serif',
                    boxShadow:
                      "0 0 25px rgba(0, 255, 255, 0.4), inset 0 0 15px rgba(0, 255, 255, 0.1)",
                  }}
                  onBlur={(e) => {
                    // Only close if the input is empty
                    if (!e.currentTarget.value.trim()) {
                      setIsSearchOpen(false);
                    }
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#00ffff",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#000000",
                    fontWeight: "500",
                    boxShadow: "0 0 10px rgba(0, 255, 255, 0.6)",
                    fontFamily:
                      '"Roboto", system-ui, -apple-system, sans-serif',
                  }}
                >
                  <Command size={12} />
                  <span>K</span>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setIsSearchOpen(false)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#2a2a2a",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  color: "#999999",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 68, 68, 0.6)";
                  e.currentTarget.style.color = "#ff4444";
                  e.currentTarget.style.backgroundColor = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.color = "#999999";
                  e.currentTarget.style.backgroundColor = "#2a2a2a";
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Center section - Tagline */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: '"Audiowide", cursive, system-ui',
              fontSize: "24px",
              fontWeight: "700",
              color: "#ffffff",
              textShadow: `
                0 0 10px rgba(0, 255, 255, 0.8),
                0 0 20px rgba(0, 255, 255, 0.6),
                0 0 30px rgba(0, 255, 255, 0.4),
                inset 0 2px 4px rgba(0, 0, 0, 0.8),
                0 -2px 4px rgba(0, 0, 0, 0.6)
              `,
              letterSpacing: "2px",
              background: `linear-gradient(145deg,
                rgba(0, 255, 255, 0.1) 0%,
                rgba(0, 255, 255, 0.05) 25%,
                rgba(0, 0, 0, 0.1) 50%,
                rgba(0, 255, 255, 0.05) 75%,
                rgba(0, 255, 255, 0.1) 100%
              )`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(0, 255, 255, 0.2)",
              boxShadow: `
                inset 0 2px 8px rgba(0, 0, 0, 0.3),
                inset 0 -2px 8px rgba(0, 255, 255, 0.1),
                0 0 15px rgba(0, 255, 255, 0.2)
              `,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(4px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "0",
                left: "-100%",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent)",
                animation: "scanline 3s infinite linear",
              }}
            />
            SCAN. SIMULATE. STRIKE.
          </div>
        </div>

        {/* Right section - Profile dropdown */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "12px 20px",
                  backgroundColor: "transparent",
                  border: "2px solid rgba(0, 255, 255, 0.4)",
                  borderRadius: "25px",
                  color: "#e5e5e5",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontFamily: '"Roboto", system-ui, -apple-system, sans-serif',
                  boxShadow: "0 0 15px rgba(0, 255, 255, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.7)";
                  e.currentTarget.style.boxShadow =
                    "0 0 25px rgba(0, 255, 255, 0.4)";
                  e.currentTarget.style.backgroundColor = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.4)";
                  e.currentTarget.style.boxShadow =
                    "0 0 15px rgba(0, 255, 255, 0.2)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {/* Profile Photo */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#00ffff",
                    border: "2px solid rgba(0, 255, 255, 0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#000000",
                    boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
                    fontFamily: '"Audiowide", cursive, system-ui',
                  }}
                >
                  A
                </div>

                {/* Name */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#ffffff",
                      fontFamily:
                        '"Roboto", system-ui, -apple-system, sans-serif',
                    }}
                  >
                    Alice Smith
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#999999",
                      fontFamily:
                        '"Roboto", system-ui, -apple-system, sans-serif',
                    }}
                  >
                    Security Admin
                  </span>
                </div>

                <ChevronDown size={18} style={{ color: "#999999" }} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              style={{
                backgroundColor: "#1a1a1a",
                border: "2px solid rgba(0, 255, 255, 0.4)",
                borderRadius: "20px",
                boxShadow:
                  "0 0 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 255, 255, 0.3)",
                minWidth: "220px",
                padding: "12px",
              }}
            >
              <DropdownMenuItem
                style={{
                  padding: "14px 20px",
                  borderRadius: "16px",
                  color: "#e5e5e5",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontFamily: '"Roboto", system-ui, -apple-system, sans-serif',
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#2a2a2a";
                  e.currentTarget.style.color = "#00ffff";
                  e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.3)";
                  e.currentTarget.style.boxShadow =
                    "0 0 10px rgba(0, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#e5e5e5";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <User
                  style={{ width: "16px", height: "16px", marginRight: "12px" }}
                />
                Edit Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator
                style={{
                  backgroundColor: "rgba(0, 255, 255, 0.3)",
                  height: "2px",
                  margin: "8px 0",
                  boxShadow: "0 0 5px rgba(0, 255, 255, 0.2)",
                }}
              />

              <DropdownMenuItem
                style={{
                  padding: "14px 20px",
                  borderRadius: "16px",
                  color: "#ff4444",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontFamily: '"Roboto", system-ui, -apple-system, sans-serif',
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 68, 68, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(255, 68, 68, 0.3)";
                  e.currentTarget.style.boxShadow =
                    "0 0 10px rgba(255, 68, 68, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginRight: "12px" }}
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

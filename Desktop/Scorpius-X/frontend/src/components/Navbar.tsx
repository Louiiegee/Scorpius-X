import { ChevronDown, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  return (
    <>
      <style>{`
        @keyframes scanline {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>

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
          {/* Left section - Tagline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              flex: "1",
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
                  0 0 30px rgba(0, 255, 255, 0.4)
                `,
                letterSpacing: "8px",
                textAlign: "center",
                padding: "16px 60px",
                borderRadius: "16px",
                border: "2px solid rgba(0, 255, 255, 0.3)",
                boxShadow: `
                  inset 0 3px 12px rgba(0, 0, 0, 0.5),
                  inset 0 -3px 12px rgba(0, 255, 255, 0.15),
                  0 0 20px rgba(0, 255, 255, 0.3)
                `,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(6px)",
                position: "relative",
                overflow: "hidden",
                background: `
                  linear-gradient(145deg,
                    rgba(0, 0, 0, 0.7) 0%,
                    rgba(0, 0, 0, 0.9) 50%,
                    rgba(0, 0, 0, 0.7) 100%
                  )
                `,
                width: "100%",
                whiteSpace: "nowrap",
                marginLeft: "-20px",
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
                    "linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.4), transparent)",
                  animation: "scanline 5s infinite linear",
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
                    gap: "12px",
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    border: "2px solid rgba(0, 255, 255, 0.4)",
                    borderRadius: "25px",
                    color: "#e5e5e5",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontFamily:
                      '"Roboto", system-ui, -apple-system, sans-serif',
                    boxShadow: "0 0 15px rgba(0, 255, 255, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(0, 255, 255, 0.7)";
                    e.currentTarget.style.boxShadow =
                      "0 0 25px rgba(0, 255, 255, 0.4)";
                    e.currentTarget.style.backgroundColor = "#1a1a1a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(0, 255, 255, 0.4)";
                    e.currentTarget.style.boxShadow =
                      "0 0 15px rgba(0, 255, 255, 0.2)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Profile Photo */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#00ffff",
                      border: "2px solid rgba(0, 255, 255, 0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#000000",
                      boxShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
                      fontFamily: '"Audiowide", cursive, system-ui',
                    }}
                  >
                    A
                  </div>

                  {/* Name */}
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#ffffff",
                      fontFamily:
                        '"Roboto", system-ui, -apple-system, sans-serif',
                    }}
                  >
                    <p>Admin</p>
                  </span>

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
                    fontFamily:
                      '"Roboto", system-ui, -apple-system, sans-serif',
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2a2a2a";
                    e.currentTarget.style.color = "#00ffff";
                    e.currentTarget.style.borderColor =
                      "rgba(0, 255, 255, 0.3)";
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
                    style={{
                      width: "16px",
                      height: "16px",
                      marginRight: "12px",
                    }}
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
                    fontFamily:
                      '"Roboto", system-ui, -apple-system, sans-serif',
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 68, 68, 0.1)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 68, 68, 0.3)";
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
    </>
  );
};

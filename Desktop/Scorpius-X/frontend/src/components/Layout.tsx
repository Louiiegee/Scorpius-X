import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-black text-white font-main flex relative overflow-hidden scales-pattern">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Circuit Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        style={{ zIndex: 1 }}
      >
        <defs>
          <pattern
            id="circuit"
            patternUnits="userSpaceOnUse"
            width="100"
            height="100"
          >
            <path
              d="M 0 50 L 25 50 L 25 25 L 75 25 L 75 75 L 100 75"
              stroke="rgba(0, 255, 209, 0.3)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;10"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>

      <Sidebar />
      <div className="flex-1 flex flex-col relative" style={{ zIndex: 2 }}>
        <Navbar />
        <main className="flex-1 p-6 relative">{children}</main>
        <footer className="text-center py-6 text-muted border-t border-gray-800 gradient-gray-surface backdrop-blur-sm">
          <div className="text-sm">
            © 2025 Scorpius Inc. — All rights reserved.
            <span className="ml-4 text-accent">●</span>
            <span className="ml-2 text-xs">SECURE CONNECTION ESTABLISHED</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

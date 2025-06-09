import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/enhanced-toast";
import { AppShell } from "@/components/AppShell";
import { Login } from "@/pages/Login";
import { LicenseVerification } from "@/pages/LicenseVerification";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import ElectronEnhancedWidget from "@/components/ElectronEnhancedWidget";
import { WarRoomLoader } from "@/components/WarRoomLoader";

// Import all your pages
import Index from "@/pages/Index";
import SmartContractScanner from "@/pages/SmartContractScanner";
import { TrapGrid } from "@/pages/TrapGrid";
import { CodeMatcher } from "@/pages/CodeMatcher";
import MEVOperations from "@/pages/MEVOperations";
import MempoolMonitor from "@/pages/MempoolMonitor";
import TimeMachine from "@/pages/TimeMachine";
import { BugBounty } from "@/pages/BugBounty";
import { Scheduler } from "@/pages/Scheduler";
import { Training } from "@/pages/Training";
import Monitoring from "@/pages/Monitoring";
import Reports from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import { Subscription } from "@/pages/Subscription";

import SystemHealth from "@/pages/SystemHealth";
import { environment } from "@/config/environment";
import { monitoring } from "@/utils/monitoring";
import { auditLog } from "@/services/audit-log";

import "./App.css";

const queryClient = new QueryClient();

// Enhanced Protected Route Component with License Flow
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const {
    user,
    isAuthenticated,
    isLicenseVerified,
    isFirstTimeUser,
    isLoading,
    isInitializingWarRoom,
    login,
    verifyLicense,
    completeWarRoomInitialization,
  } = useAuth();

  // Show loading while checking auth and license status
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "#000000",
          fontFamily: "JetBrains Mono, Space Mono, monospace",
        }}
      >
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Cyberpunk loading animation */}
            <div className="absolute inset-0 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div
              className="absolute inset-2 border-4 border-t-transparent border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
            <div
              className="absolute inset-4 border-4 border-t-transparent border-r-transparent border-b-yellow-300 border-l-transparent rounded-full animate-spin"
              style={{ animationDuration: "2s" }}
            ></div>
          </div>
          <div className="text-red-400 font-mono text-lg mb-2">
            INITIALIZING SCORPIUS PLATFORM
          </div>
          <div className="text-cyan-400 font-mono text-sm">
            Loading security protocols...
          </div>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1s",
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: License Verification (First time users or unverified)
  if (!isLicenseVerified || isFirstTimeUser) {
    return <LicenseVerification onLicenseVerified={verifyLicense} />;
  }

  // Step 2: Authentication (Licensed but not logged in)
  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  // Step 3: War Room Initialization (After login)
  if (isInitializingWarRoom) {
    return <WarRoomLoader onComplete={completeWarRoomInitialization} />;
  }

  // Step 4: Main Application (Licensed, authenticated, and War Room ready)
  return <>{children}</>;
};

// Loading Screen Component
const LoadingScreen = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{
      background:
        "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
      fontFamily: "JetBrains Mono, Space Mono, monospace",
    }}
  >
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Multi-layered cyberpunk loading animation */}
        <div className="absolute inset-0 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div
          className="absolute inset-3 border-4 border-t-transparent border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        ></div>
        <div
          className="absolute inset-6 border-4 border-t-transparent border-r-transparent border-b-yellow-300 border-l-transparent rounded-full animate-spin"
          style={{ animationDuration: "2s" }}
        ></div>
        <div className="absolute inset-9 w-14 h-14 bg-gradient-to-r from-red-500 to-cyan-400 rounded-full animate-pulse"></div>

        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-bold text-white">S</div>
        </div>
      </div>

      <div className="text-red-400 font-mono text-2xl mb-4 animate-pulse">
        SCORPIUS PLATFORM
      </div>
      <div className="text-cyan-400 font-mono text-lg mb-2">
        Initializing Security Systems
      </div>
      <div className="text-gray-300 font-mono text-sm">
        Loading cybersecurity modules...
      </div>

      <div className="mt-8 flex justify-center">
        <div className="flex space-x-2">
          {["SCAN", "ANALYZE", "PROTECT"].map((text, i) => (
            <div
              key={text}
              className="px-3 py-1 border border-red-500/30 text-red-400 text-xs font-mono animate-pulse"
              style={{
                animationDelay: `${i * 0.5}s`,
                animationDuration: "2s",
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Main App Content
const AppContent = () => {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SubscriptionProvider>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/scanner" element={<SmartContractScanner />} />
                  <Route path="/trapgrid" element={<TrapGrid />} />
                  <Route path="/codematcher" element={<CodeMatcher />} />
                  <Route path="/mev" element={<MEVOperations />} />
                  <Route path="/mempool" element={<MempoolMonitor />} />
                  <Route path="/time-machine" element={<TimeMachine />} />
                  <Route path="/bounty" element={<BugBounty />} />
                  <Route path="/scheduler" element={<Scheduler />} />
                  <Route path="/training" element={<Training />} />
                  <Route path="/monitoring" element={<Monitoring />} />
                  <Route path="/reports" element={<Reports />} />

                  <Route path="/system-health" element={<SystemHealth />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/profile" element={<Settings />} />

                  {/* Special routes */}
                  <Route
                    path="/zero-day"
                    element={
                      <div className="p-8 text-white">
                        <div className="max-w-4xl mx-auto text-center">
                          <h1 className="text-4xl font-bold text-red-400 font-mono mb-4">
                            ZERO DAY ALERT SYSTEM
                          </h1>
                          <p className="text-cyan-400 font-mono">
                            Advanced threat detection coming soon...
                          </p>
                        </div>
                      </div>
                    }
                  />

                  {/* Redirect any unknown routes to dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </SubscriptionProvider>
          </ProtectedRoute>
        }
      />
      {/* Redirect any routes outside of app to main */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <AppContent />
              <Toaster />
              <ElectronEnhancedWidget />
            </Router>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

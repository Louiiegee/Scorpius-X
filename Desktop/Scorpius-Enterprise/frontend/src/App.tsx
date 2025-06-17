// src/App.tsx
import React, { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster }          from "@/components/ui/sonner";
import { ProtectedRoute }   from "@/components/ProtectedRoute";
import { LoginPage }        from "@/pages/Login";
import { useAuth }          from "@/hooks/useAuth";
import { useElectronIntegration } from "@/hooks/useElectronIntegration";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

import { SettingsProvider }   from "@/context/SettingsContext";
import { AIChatProvider }     from "@/context/AIChatContext";
import { TeamChatProvider }   from "@/context/TeamChatContext";
import { EnterpriseProvider } from "@/context/EnterpriseUserContext";

import "./App.css";

/* ─────────────────────────────────────  Lazy imports  ───────────────────────────────────── */
const ScorpiusDashboard = lazy(() => import("./pages/Index"));
const SettingsPage      = lazy(() => import("./pages/Settings"));
const EnterprisePage    = lazy(() => import("./pages/Enterprise"));

// Import NotificationCenter as a named export and create a page wrapper
const NotificationPage = lazy(() =>
  import("./components/notifications/NotificationCenter").then((module) => ({
    default: () => {
      const { NotificationCenter } = module;
      return (
        <div className="min-h-screen p-6">
          <div className="max-w-7xl mx-auto">
            <NotificationCenter />
          </div>
        </div>
      );
    },
  }))
);

/* ─────────────────────────────────────  UI helpers  ───────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="animate-spin h-16 w-16 border-b-2 border-blue-400 rounded-full mx-auto" />
        <p className="text-blue-400 text-lg">Loading Scorpius…</p>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("🔥 Application error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────  App  ───────────────────────────────────── */
export default function App() {
  const { isAuthenticated } = useAuth();
  const [booting, setBooting] = useState(true);
  const devBypass = true;          // flip if you still need a bypass
  const authOK   = isAuthenticated || devBypass;
  // Wire in the Electron IPC hooks
  const electron = useElectronIntegration({
    onNavigate: (module: string) => {
      console.log("Navigate to:", module);
    },
    onNewScan: () => {
      console.log("New scan requested");
    },
    onExportReport: () => {
      console.log("Export report requested");
    },
    onStartMonitoring: () => {
      console.log("Start monitoring requested");
    },
    onStopScans: () => {
      console.log("Stop scans requested");
    },
    onResetSettings: () => {
      console.log("Reset settings requested");
    },
    onOpenFile: (filePath: string) => {
      console.log("Open file requested:", filePath);
    },
    onAppBeforeQuit: () => {
      console.log("App before quit");
    },
  });

  /* one-shot boot */
  useEffect(() => {
    (async () => {
      try {
        if (import.meta.env.DEV)
          console.log("🔧 Dev mode – CSP disabled");
        setBooting(false);
      } catch (err) {
        console.error("App boot failed:", err);
        setBooting(false);
      }
    })();
  }, []);

  if (booting) return <LoadingScreen />;

  /* ───────── Routes ───────── */
  const suspense = (node: JSX.Element) => (
    <Suspense fallback={<LoadingScreen />}>{node}</Suspense>
  );
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black relative overflow-hidden">
        <FlickeringGrid
          color="rgb(59, 130, 246)"
          maxOpacity={0.3}
          flickerChance={0.1}
          width={1400}
          height={900}
          className="absolute inset-0"
        />
        <div className="relative z-10">
          <SettingsProvider>
            <AIChatProvider>
              <TeamChatProvider>
                <EnterpriseProvider>
                  <Router>
                    <Routes>
                      {/* public login */}
                      <Route
                        path="/login"
                        element={authOK ? <Navigate to="/" replace /> : <LoginPage />}
                      />

                      {/* main dashboard */}
                      <Route
                        path="/"
                        element={
                          authOK
                            ? suspense(<ScorpiusDashboard />)
                            : <Navigate to="/login" replace />
                        }
                      />

                      {/* settings */}
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            {suspense(<SettingsPage />)}
                          </ProtectedRoute>
                        }
                      />

                      {/* enterprise panel */}
                      <Route
                        path="/enterprise"
                        element={
                          <ProtectedRoute
                            requiredTier="enterprise"
                            requiredPermissions={["admin_access"]}
                          >
                            {suspense(<EnterprisePage />)}
                          </ProtectedRoute>
                        }
                      />

                      {/* notifications */}
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            {suspense(<NotificationPage />)}
                          </ProtectedRoute>
                        }
                      />

                      {/* module-specific shortcuts */}
                      <Route
                        path="/scanner"
                        element={
                          <ProtectedRoute requiredFeature="basic_scanning">
                            {suspense(<ScorpiusDashboard />)}
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/mev"
                        element={
                          <ProtectedRoute requiredTier="pro" requiredFeature="mev_analysis">
                            {suspense(<ScorpiusDashboard />)}
                          </ProtectedRoute>
                        }
                      />

                      {/* catch-all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>

                    {/* toast hub */}
                    <Toaster position="top-right" expand richColors closeButton />
                  </Router>
                </EnterpriseProvider>
              </TeamChatProvider>
            </AIChatProvider>
          </SettingsProvider>
        </div>
      </div>
    </ErrorBoundary>
  );
}

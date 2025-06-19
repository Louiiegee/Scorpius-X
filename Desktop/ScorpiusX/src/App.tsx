import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryProvider, QueryErrorBoundary } from "@/providers/QueryProvider";
import { useAuthChange } from "@/hooks/useAuthChange";
import { featureFlags } from "@/config/featureFlags";
import { logger } from "@/config/env";

// Components
import TopNavigation from "@/components/TopNavigation";

// Pages
import Dashboard from "@/pages/Dashboard";
import Scanner from "@/pages/Scanner";
import TimeMachine from "@/pages/TimeMachine";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";

// Contexts (existing)
import { AuthContext } from "@/contexts/AuthContext";
import { SubscriptionContext } from "@/contexts/SubscriptionContext";

import "./App.css";

// Auth-protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthChange();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 font-mono">Initializing Scorpius...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main app layout with navigation
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavigation />
      <main className="relative">{children}</main>
    </div>
  );
}

// App component with all providers
function AppContent() {
  const { user, isAuthenticated } = useAuthChange();

  // Set user context for feature flags
  useEffect(() => {
    if (user) {
      featureFlags.setUserContext(user);
      logger.debug("User context set for feature flags:", user.username);
    }
  }, [user]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login route - accessible without auth */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/scanner" element={<Scanner />} />
                    <Route path="/time-machine" element={<TimeMachine />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Redirect unknown routes to dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

// Root app component with error boundary and providers
export default function App() {
  return (
    <QueryErrorBoundary>
      <QueryProvider>
        <AuthContext.Provider
          value={{ user: null, login: async () => {}, logout: async () => {} }}
        >
          <SubscriptionContext.Provider
            value={{ subscription: null, updateSubscription: () => {} }}
          >
            <AppContent />
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </QueryProvider>
    </QueryErrorBoundary>
  );
}

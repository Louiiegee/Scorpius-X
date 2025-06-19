import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Components
import TopNavigation from "@/components/TopNavigation";

// Pages
import Dashboard from "@/pages/Dashboard";
import SmartContractScanner from "@/pages/SmartContractScanner";
import TimeMachine from "@/pages/TimeMachine";
import Settings from "@/pages/Settings";

// Contexts (existing)
import { AuthContext } from "@/contexts/AuthContext";
import { SubscriptionContext } from "@/contexts/SubscriptionContext";

import "./App.css";

// Simple app layout with navigation
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavigation />
      <main className="relative">{children}</main>
    </div>
  );
}

// Root app component
export default function App() {
  return (
    <AuthContext.Provider
      value={{ user: null, login: async () => {}, logout: async () => {} }}
    >
      <SubscriptionContext.Provider
        value={{ subscription: null, updateSubscription: () => {} }}
      >
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scanner" element={<SmartContractScanner />} />
              <Route path="/time-machine" element={<TimeMachine />} />
              <Route path="/settings" element={<Settings />} />

              {/* Redirect unknown routes to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </SubscriptionContext.Provider>
    </AuthContext.Provider>
  );
}

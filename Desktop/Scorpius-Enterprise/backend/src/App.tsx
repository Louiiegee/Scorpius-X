import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DashboardPage from '@/pages/DashboardPage';
import ScannerPage from '@/pages/ScannerPage';
import MempoolPage from '@/pages/MempoolPage';
import BytecodePage from '@/pages/BytecodePage';
import TimeMachinePage from '@/pages/TimeMachinePage';
// import SimulationPage from '@/pages/SimulationPage'; // Temporarily disabled
import ReportsPage from '@/pages/ReportsPage';
// import MevOpsPage from '@/pages/MevOpsPage'; // Temporarily disabled
// import MevGuardiansPage from '@/pages/MevGuardiansPage'; // Import the new page - Temporarily disabled
import HoneypotPage from '@/pages/HoneypotPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { Toaster } from "@/components/ui/sonner"


function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/mempool" element={<MempoolPage />} />
        <Route path="/bytecode" element={<BytecodePage />} />
        <Route path="/timemachine" element={<TimeMachinePage />} />
        {/* <Route path="/simulation" element={<SimulationPage />} /> */}
        <Route path="/reports" element={<ReportsPage />} />
        {/* <Route path="/mev-ops" element={<MevOpsPage />} /> */}
        {/* <Route path="/mev-guardians" element={<MevGuardiansPage />} /> */} {/* Add new route - Temporarily disabled */}
        <Route path="/honeypot" element={<HoneypotPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

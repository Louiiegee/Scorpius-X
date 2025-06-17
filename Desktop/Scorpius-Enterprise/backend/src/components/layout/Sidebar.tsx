import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ScanSearch,
  Activity,
  Code,
  History,
  TestTube2,
  FileText,
  Zap,
  ShieldAlert,
  Settings,
  Moon,
  Sun,
  Bot,
  ShieldCheck, // Added for MEV Guardians
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scanner', label: 'Scanner', icon: ScanSearch },
  { href: '/mempool', label: 'Mempool', icon: Activity },
  { href: '/bytecode', label: 'Bytecode', icon: Code },
  { href: '/timemachine', label: 'Time Machine', icon: History },
  { href: '/simulation', label: 'Simulation', icon: TestTube2 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/mev-ops', label: 'MEV Ops', icon: Zap },
  { href: '/honeypot', label: 'Honeypot', icon: ShieldAlert },
  { href: '/mev-guardians', label: 'MEV Guardians', icon: ShieldCheck }, // New item
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <NavLink to="/" className="flex items-center gap-2">
           <Bot size={28} className="text-sidebar-primary" />
          <h1 className="text-xl font-semibold text-sidebar-primary">Scorpius</h1>
        </NavLink>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground/80',
                'text-sidebar-foreground'
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground/80"
          aria-label={theme === 'dark' ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </Button>
      </div>
    </aside>
  );
}

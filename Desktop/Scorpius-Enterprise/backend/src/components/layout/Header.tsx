import { Bell, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  const name = pathname.substring(1).replace('-', ' ');
  return name.charAt(0).toUpperCase() + name.slice(1);
}


export default function Header() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6">
      <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={20} className="text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="User Profile">
          <UserCircle size={20} className="text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
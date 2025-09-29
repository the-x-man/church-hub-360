import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Settings, Users, LogOut, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  devOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    icon: Home,
    label: 'Dashboard',
  },
  {
    to: '/branches',
    icon: MapPin,
    label: 'Branches',
  },
  {
    to: '/user-management',
    icon: Users,
    label: 'Users',
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
  },
];

export function Sidebar() {
  const isDev = import.meta.env.DEV;

  const filteredNavItems = navItems.filter((item) => !item.devOnly || isDev);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-background border-r border-border z-40">
      <div className="flex flex-col justify-between h-full">
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.devOnly && (
                      <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                        DEV
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-2 border-t border-border">
          <Button
            onClick={handleSignOut}
            className="w-full text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
            variant="ghost"
          >
            <LogOut className="mr-1 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}

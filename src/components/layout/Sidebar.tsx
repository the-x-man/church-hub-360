import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Settings, Users, Package, TestTube } from 'lucide-react';
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
    to: '/users',
    icon: Users,
    label: 'Users',
  },
  {
    to: '/app-versions',
    icon: Package,
    label: 'App Versions',
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
  },
  {
    to: '/test',
    icon: TestTube,
    label: 'Test Routes',
    devOnly: true,
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
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-gray-50 border-r border-gray-200 z-40">
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
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
        <div className="p-4 border-t border-gray-200">
          <Button onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}

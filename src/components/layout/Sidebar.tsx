import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Users, 
  LogOut, 
  MapPin, 
  ChevronDown, 
  ChevronRight,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Heart,
  Target,
  Calculator,
  MessageSquare,
  CalendarDays,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  to?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  devOnly?: boolean;
  children?: NavItem[];
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
    icon: Users,
    label: 'People',
    children: [
      {
        to: '/people/configurations',
        icon: Settings,
        label: 'Configurations',
      },
      {
        to: '/people/membership',
        icon: UserCheck,
        label: 'Membership',
      },
      {
        to: '/people/attendance',
        icon: Calendar,
        label: 'Attendance',
      },
    ],
  },
  {
    icon: DollarSign,
    label: 'Finance',
    children: [
      {
        to: '/finance/income',
        icon: TrendingUp,
        label: 'Income',
      },
      {
        to: '/finance/expenses',
        icon: TrendingDown,
        label: 'Expenses',
      },
      {
        to: '/finance/contributions',
        icon: Heart,
        label: 'Contributions',
      },
      {
        to: '/finance/pledges',
        icon: Target,
        label: 'Pledges',
      },
      {
        to: '/finance/budget-planning',
        icon: Calculator,
        label: 'Budget Planning',
      },
    ],
  },
  {
    to: '/communication',
    icon: MessageSquare,
    label: 'Communication',
  },
  {
    to: '/events',
    icon: CalendarDays,
    label: 'Events and Activities',
  },
  {
    to: '/reports',
    icon: BarChart3,
    label: 'Reports & Insights',
  },
  {
    to: '/activity-logs',
    icon: Activity,
    label: 'Activity Logs',
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
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredNavItems = navItems.filter((item) => !item.devOnly || isDev);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isParentActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => child.to && location.pathname.startsWith(child.to));
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const parentActive = isParentActive(item);

    if (hasChildren) {
      return (
        <li key={item.label}>
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              parentActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.devOnly && (
                <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                  DEV
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <ul className="mt-1 ml-6 space-y-1">
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.to || item.label}>
        <NavLink
          to={item.to!}
          className={({ isActive }) =>
            cn(
              'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              level > 0 && 'text-xs',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <Icon className={cn('h-5 w-5', level > 0 && 'h-4 w-4')} />
          <span>{item.label}</span>
          {item.devOnly && (
            <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
              DEV
            </span>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-background border-r border-border z-40">
      <div className="flex flex-col justify-between h-full">
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => renderNavItem(item))}
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

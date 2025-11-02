import React, { useState, useEffect } from 'react';
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
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  FormInput,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

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
        to: '/people/tags',
        icon: Settings,
        label: 'Tags',
      },
      {
        to: '/people/groups',
        icon: Settings,
        label: 'Groups',
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
      {
        to: '/people/form-builder',
        icon: FormInput,
        label: 'Form Builder',
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
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Initialize with auto-expanded parent if child is active
    const currentPath = location.pathname;
    const parentToExpand = navItems.find((item) =>
      item.children?.some(
        (child) => child.to && currentPath.startsWith(child.to)
      )
    );
    return parentToExpand ? [parentToExpand.label] : [];
  });
  const {
    isCollapsed,
    isMobile,
    isMobileOpen,
    toggleCollapse,
    setMobileOpen,
  } = useSidebar();

  const filteredNavItems = navItems.filter((item) => !item.devOnly || isDev);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Auto-expand parent when child is selected on page refresh (only when route changes)
  useEffect(() => {
    const currentPath = location.pathname;
    const parentToExpand = filteredNavItems.find((item) =>
      item.children?.some(
        (child) => child.to && currentPath.startsWith(child.to)
      )
    );

    if (parentToExpand && !isCollapsed) {
      setExpandedItems((prev) => {
        // Only add if not already expanded
        if (!prev.includes(parentToExpand.label)) {
          return [...prev, parentToExpand.label];
        }
        return prev;
      });
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isParentActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(
      (child) => child.to && location.pathname.startsWith(child.to)
    );
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const parentActive = isParentActive(item);

    if (hasChildren) {
      // If collapsed, render as dropdown
      if (isCollapsed && level === 0) {
        return (
          <li key={item.label}>
            <TooltipProvider>
              <Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          'flex items-center justify-center w-full h-10 rounded-lg text-sm font-medium transition-colors',
                          parentActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="w-48"
                  >
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <DropdownMenuItem key={child.to || child.label} asChild>
                          <NavLink
                            to={child.to!}
                            className="flex items-center space-x-2 w-full"
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{child.label}</span>
                          </NavLink>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </li>
        );
      }

      // Normal expanded view
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
              {!isCollapsed && <span>{item.label}</span>}
              {item.devOnly && !isCollapsed && (
                <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                  DEV
                </span>
              )}
            </div>
            {!isCollapsed &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              ))}
          </button>
          {isExpanded && !isCollapsed && (
            <ul className="mt-1 ml-6 space-y-1">
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </ul>
          )}
        </li>
      );
    }

    // Single nav item
    if (isCollapsed && level === 0) {
      const isActive =
        location.pathname === item.to ||
        location.pathname.startsWith(item.to + '/');

      return (
        <li key={item.to || item.label}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(item.to!)}
                  className={cn(
                    'flex items-center justify-center w-full h-10 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

  // Mobile-specific render function that always shows labels
  const renderMobileNavItem = (item: NavItem, level = 0) => {
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
              {item.children?.map((child) =>
                renderMobileNavItem(child, level + 1)
              )}
            </ul>
          )}
        </li>
      );
    }

    // Single nav item for mobile - always show labels
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
          onClick={() => setMobileOpen(false)} // Close mobile drawer on navigation
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

  // Mobile Sheet Component
  const MobileSidebar = () => (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col justify-between h-full">
          <nav className="p-4 flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {filteredNavItems.map((item) => renderMobileNavItem(item))}
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
      </SheetContent>
    </Sheet>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 bg-background border-r border-border z-40 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col justify-between h-full">
        {/* Collapse Toggle Button */}
        <div className="p-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleCollapse}
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 rounded-lg"
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-5 w-5" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <nav className="px-2 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => renderNavItem(item))}
          </ul>
        </nav>

        <div className="p-2 border-t border-border">
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSignOut}
                    className="w-full h-10 text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    variant="ghost"
                    size="icon"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              onClick={handleSignOut}
              className="w-full text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
              variant="ghost"
            >
              <LogOut className="mr-1 h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </aside>
  );

  return <>{isMobile ? <MobileSidebar /> : <DesktopSidebar />}</>;
}

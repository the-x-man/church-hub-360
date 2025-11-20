import type { SectionKey } from '@/registry/access/sections';

export type PageEntry = {
  path: string;
  section?: SectionKey;
  child?: string;
  protected?: boolean;
  label?: string;
  nav?: boolean;
  icon?: string;
  devOnly?: boolean;
};

export type NavLinkItem = { type: 'link'; path: string; label: string; icon: string; devOnly?: boolean };
export type NavGroupItem = { type: 'group'; label: string; icon: string; children: NavLinkItem[] };
export type NavItem = NavLinkItem | NavGroupItem;

export const PAGES: PageEntry[] = [
  // core
  { path: '/dashboard', label: 'Dashboard', protected: true, nav: true, icon: 'Home' },
  { path: '/branches', label: 'Branches', section: 'branches', protected: true, nav: true, icon: 'MapPin' },

  // people
  { path: '/people', label: 'People', section: 'people', protected: true, nav: true, icon: 'Users' },
  { path: '/people/attendance', label: 'Attendance', section: 'people', child: 'attendance', protected: true, nav: true, icon: 'CheckCircle' },
  { path: '/people/membership', label: 'Membership', section: 'people', child: 'membership', protected: true, nav: true, icon: 'IdCard' },
  { path: '/people/tags', label: 'Tags', section: 'people', child: 'tags_groups', protected: true, nav: true, icon: 'Tag' },
  { path: '/people/groups', label: 'Groups', section: 'people', child: 'tags_groups', protected: true, nav: true, icon: 'Users' },
  { path: '/people/form-builder', label: 'Form Builder', section: 'people', child: 'form_builder', protected: true, nav: true, icon: 'FormInput' },
  { path: '/people/attendance/marking', label: 'Mark Attendance', section: 'people', child: 'attendance', protected: true, nav: false },
  { path: '/people/birthdays', label: 'Birthdays', section: 'people', child: 'birthdays', protected: true, nav: true, icon: 'Gift' },

  // finance
  { path: '/finance', label: 'Finance', section: 'finance', protected: true, nav: true, icon: 'DollarSign' },
  { path: '/finance/insights', label: 'Insights', section: 'finance', child: 'insights', protected: true, nav: true, icon: 'BarChart3' },
  { path: '/finance/income', label: 'Income', section: 'finance', child: 'income', protected: true, nav: true, icon: 'TrendingUp' },
  { path: '/finance/expenses', label: 'Expenses', section: 'finance', child: 'expenses', protected: true, nav: true, icon: 'TrendingDown' },
  { path: '/finance/contributions', label: 'Contributions', section: 'finance', child: 'contributions', protected: true, nav: true, icon: 'Heart' },
  { path: '/finance/pledges', label: 'Pledges', section: 'finance', child: 'pledges', protected: true, nav: true, icon: 'Target' },

  // others
  { path: '/events', label: 'Events and Activities', section: 'events', protected: true, nav: true, icon: 'CalendarDays' },
  { path: '/announcements', label: 'Announcements', section: 'announcements', protected: true, nav: true, icon: 'Megaphone' },
  { path: '/assets', label: 'Assets', section: 'assets', protected: true, nav: true, icon: 'Package' },
  { path: '/user-management', label: 'Users', section: 'user_management', protected: true, nav: true, icon: 'Users' },
  { path: '/settings', label: 'Settings', section: 'settings', protected: true, nav: true, icon: 'Settings' },
];

export const NAV_ITEMS: NavItem[] = [
  { type: 'link', path: '/dashboard', label: 'Dashboard', icon: 'Home' },
  { type: 'link', path: '/branches', label: 'Branches', icon: 'MapPin' },
  {
    type: 'group',
    label: 'People',
    icon: 'Users',
    children: [
      { type: 'link', path: '/people/tags', label: 'Tags', icon: 'Tag' },
      { type: 'link', path: '/people/groups', label: 'Groups', icon: 'Users' },
      { type: 'link', path: '/people/membership', label: 'Membership', icon: 'IdCard' },
      { type: 'link', path: '/people/attendance', label: 'Attendance', icon: 'CheckCircle' },
      { type: 'link', path: '/people/form-builder', label: 'Form Builder', icon: 'FormInput' },
      { type: 'link', path: '/people/birthdays', label: 'Birthdays', icon: 'Gift' },
    ],
  },
  {
    type: 'group',
    label: 'Finance',
    icon: 'DollarSign',
    children: [
      { type: 'link', path: '/finance/insights', label: 'Insights', icon: 'BarChart3' },
      { type: 'link', path: '/finance/income', label: 'Income', icon: 'TrendingUp' },
      { type: 'link', path: '/finance/expenses', label: 'Expenses', icon: 'TrendingDown' },
      { type: 'link', path: '/finance/contributions', label: 'Contributions', icon: 'Heart' },
      { type: 'link', path: '/finance/pledges', label: 'Pledges', icon: 'Target' },
    ],
  },
  { type: 'link', path: '/events', label: 'Events and Activities', icon: 'CalendarDays' },
  { type: 'link', path: '/announcements', label: 'Announcements', icon: 'Megaphone' },
  { type: 'link', path: '/assets', label: 'Assets', icon: 'Package' },
  { type: 'link', path: '/user-management', label: 'Users', icon: 'Users' },
  { type: 'link', path: '/settings', label: 'Settings', icon: 'Settings' },
];
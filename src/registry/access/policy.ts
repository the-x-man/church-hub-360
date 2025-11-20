import type { UserRole } from '@/lib/auth';
import type { SectionKey } from './sections';
import type { VisibilityOverrides } from '@/types/access-control';

export interface RoleDefaultSections {
  people?: { enabled?: boolean; attendance?: boolean; tags_groups?: boolean; membership?: boolean; form_builder?: boolean };
  finance?: { enabled?: boolean; insights?: boolean; income?: boolean; expenses?: boolean; contributions?: boolean; pledges?: boolean };
  branches?: boolean;
  events?: boolean;
  announcements?: boolean;
  assets?: boolean;
  user_management?: boolean;
  settings?: boolean;
}

export interface RoleCapabilitiesDefaults {
  can_create_users?: boolean;
}

export function getRoleDefaultSections(role: UserRole): RoleDefaultSections {
  if (role === 'owner') {
    return {
      people: { enabled: true, attendance: true, tags_groups: true, membership: true, form_builder: true },
      finance: { enabled: true, insights: true, income: true, expenses: true, contributions: true, pledges: true },
      branches: true,
      events: true,
      announcements: true,
      assets: true,
      user_management: true,
      settings: true,
    };
  }

  if (role === 'admin' || role === 'branch_admin') {
    return {
      people: { enabled: true },
      finance: { enabled: false },
      branches: role === 'branch_admin' ? false : true,
      events: true,
      announcements: true,
      assets: true,
      user_management: true,
      settings: true,
    };
  }

  if (role === 'finance_admin') {
    return {
      finance: { enabled: true },
      people: { enabled: false },
      branches: false,
      events: false,
      announcements: false,
      assets: false,
      user_management: false,
      settings: false,
    };
  }

  if (role === 'attendance_manager') {
    return {
      people: { enabled: true, attendance: true },
      finance: { enabled: false },
      branches: false,
      events: false,
      announcements: false,
      assets: false,
      user_management: false,
      settings: false,
    };
  }

  if (role === 'attendance_rep') {
    return {
      people: { attendance: true },
      finance: { enabled: false },
      branches: false,
      events: false,
      announcements: false,
      assets: false,
      user_management: false,
      settings: false,
    };
  }

  return {
    people: { enabled: false },
    finance: { enabled: false },
    branches: false,
    events: false,
    announcements: false,
    assets: false,
    user_management: false,
    settings: false,
  };
}

export function getDefaultCapability(role: UserRole): RoleCapabilitiesDefaults {
  if (role === 'owner') return { can_create_users: true };
  if (role === 'admin') return { can_create_users: true };
  if (role === 'branch_admin') return { can_create_users: true };
  return { can_create_users: false };
}

export function sectionDefault(role: UserRole, section: SectionKey): boolean {
  const defaults = getRoleDefaultSections(role);
  if (section === 'people') return !!defaults.people?.enabled;
  if (section === 'finance') return !!defaults.finance?.enabled;
  return !!(defaults as any)[section];
}

export type RestrictedLayoutKind = 'finance' | 'attendance_manager' | 'attendance_rep' | null;

function isFinanceOnly(overrides?: VisibilityOverrides | null): boolean {
  const s = overrides?.sections || {};
  const fin = (s.finance as any)?.enabled === true;
  const ppl = s.people as any;
  const pplParent = !!ppl?.enabled;
  const pplChildren = !!(ppl?.attendance || ppl?.membership || ppl?.tags_groups || ppl?.form_builder || ppl?.birthdays);
  const others = !!(s.branches || s.events || s.announcements || s.assets || s.user_management || s.settings);
  return fin && !pplParent && !pplChildren && !others;
}

function isAttendanceOnly(overrides?: VisibilityOverrides | null): boolean {
  const s = overrides?.sections || {};
  const ppl = s.people as any;
  const pplParent = !!ppl?.enabled;
  const att = !!ppl?.attendance;
  const otherChildren = !!(ppl?.membership || ppl?.tags_groups || ppl?.form_builder || ppl?.birthdays);
  const fin = !!(s.finance as any)?.enabled;
  const others = !!(s.branches || s.events || s.announcements || s.assets || s.user_management || s.settings);
  return !fin && !others && !pplParent && att && !otherChildren;
}

export function chooseRestrictedLayout(role: UserRole, overrides?: VisibilityOverrides | null): RestrictedLayoutKind {
  const hasOverrides = !!overrides && Object.keys(overrides || {}).length > 0;
  if (hasOverrides) {
    if (isFinanceOnly(overrides)) return 'finance';
    if (isAttendanceOnly(overrides)) return role === 'attendance_rep' ? 'attendance_rep' : 'attendance_manager';
    return null;
  }
  if (role === 'finance_admin') return 'finance';
  if (role === 'attendance_rep') return 'attendance_rep';
  if (role === 'attendance_manager') return 'attendance_manager';
  return null;
}

// Toggle disables for UserForm, by role. Keys map to checkbox ids used in the form.
export function getToggleDisablesForRole(role: UserRole): Record<string, boolean> {
  if (role === 'branch_admin') {
    return {branches: true};
  }
  if (role === 'attendance_manager') {
    return {
      branches: true,
      finance: true,
      events: true,
      announcements: true,
      assets: true,
      user_management: true,
      settings: true,
      people_enabled: false,
      people_attendance: false,
    };
  }
  if (role === 'attendance_rep') {
    return {
      branches: true,
      finance: true,
      events: true,
      announcements: true,
      assets: true,
      user_management: true,
      settings: true,
      people_enabled: true,
      people_attendance: false,
    };
  }
  if (role === 'finance_admin') {
    return {
      branches: true,
      user_management: true,
      settings: true,
      finance: true,
    };
  }
  return {};
}
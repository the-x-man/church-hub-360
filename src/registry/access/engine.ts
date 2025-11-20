import { useOrganization } from '@/contexts/OrganizationContext';
import type { SectionKey, FinanceChildKey, VisibilityOverrides } from '@/types/access-control';
import type { UserRole } from '@/lib/auth';
import { sectionDefault, getDefaultCapability } from '@/registry/access/policy';
import { PAGES } from '@/registry/pages';
import { PEOPLE_CHILDREN } from '@/registry/access/sections';

function defaultSectionAccess(role: UserRole, section: SectionKey): boolean {
  return sectionDefault(role, section);
}

function getOverrides(overrides?: VisibilityOverrides) {
  return overrides?.sections || {};
}

export function useAccess() {
  const { currentOrganization } = useOrganization();
  const role = currentOrganization?.user_role as UserRole | undefined;
  const overrides = getOverrides(currentOrganization?.user_permissions?.visibility_overrides);
  const hasOverridesActive = !!overrides && Object.keys(overrides).length > 0;

  const canAccess = (section: SectionKey): boolean => {
    if (!role) return false;

    // When any overrides exist, unspecified sections are treated as false
    if (section === 'people') {
      const p = overrides.people as any;
      if (hasOverridesActive) return !!(p?.enabled);
      if (p && typeof p.enabled !== 'undefined') return !!p.enabled;
    } else if (section === 'finance') {
      const f = overrides.finance as any;
      if (hasOverridesActive) return !!(f?.enabled);
      if (f && typeof f.enabled !== 'undefined') return !!f.enabled;
    } else {
      const v = (overrides as any)[section];
      if (hasOverridesActive) return !!v;
      if (typeof v !== 'undefined') return !!v;
    }

    const base = defaultSectionAccess(role, section);
    return !!base;
  };

  const canAccessFinanceChild = (child: FinanceChildKey): boolean => {
    if (!role) return false;
    if (!canAccess('finance')) return false;
    if (role === 'owner' || role === 'finance_admin') return true;
    const f = overrides.finance;
    if (!f) return false;
    if (f.enabled) return true;
    return !!(f as any)[child];
  };

  const defaultPeopleChildAccess = (child: 'attendance' | 'tags_groups' | 'membership' | 'form_builder' | 'birthdays'): boolean => {
    if (!role) return false;
    if (role === 'owner') return true;
    if (role === 'admin' || role === 'branch_admin') return true;
    if (role === 'finance_admin') return false;
    if (role === 'attendance_manager') return child === 'attendance';
    if (role === 'attendance_rep') return child === 'attendance';
    return false;
  };

  const canAccessPeopleChild = (child: 'attendance' | 'tags_groups' | 'membership' | 'form_builder' | 'birthdays'): boolean => {
    if (!role) return false;
    const p = overrides.people as any;
    if (canAccess('people')) return true;
    if (p && typeof p.enabled !== 'undefined') {
      if (p.enabled === true) return true;
      return !!p[child];
    }
    if (p && typeof p[child] !== 'undefined') return !!p[child];
    if (hasOverridesActive) return false;
    return defaultPeopleChildAccess(child);
  };

  const canAccessChild = (section: SectionKey, child?: string): boolean => {
    if (!child) return canAccess(section);
    if (section === 'people') {
      return canAccessPeopleChild(child as any);
    }
    if (section === 'finance') {
      return canAccessFinanceChild(child as any);
    }
    return canAccess(section);
  };

  const canAccessPath = (path: string): boolean => {
    const page = PAGES.reduce((best: typeof PAGES[number] | undefined, p) => {
      const exact = path === p.path;
      const pref = p.path !== '/' && path.startsWith(p.path + '/');
      if (exact || pref) {
        if (!best || p.path.length > best.path.length) return p;
      }
      return best;
    }, undefined);
    if (!page) return true;
    if (!page.section) return true;
    if (page.section === 'people' && !page.child) {
      const parentAllowed = canAccess('people');
      if (parentAllowed) return true;
      return PEOPLE_CHILDREN.some((c) => canAccessPeopleChild(c));
    }
    return canAccessChild(page.section, page.child);
  };

  const hasAnyOverrides = (): boolean => {
    return hasOverridesActive;
  };

  const canCreateUsers = (): boolean => {
    if (!role) return false;
    const capObj = currentOrganization?.user_permissions?.capabilities;
    if (capObj && typeof capObj.can_create_users === 'boolean') return capObj.can_create_users;
    const defaults = getDefaultCapability(role);
    return !!defaults.can_create_users;
  };

  return { canAccess, canAccessPath, canAccessChild, canAccessFinanceChild, canAccessPeopleChild, canCreateUsers, hasAnyOverrides, role };
}
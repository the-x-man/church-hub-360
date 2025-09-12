import type { CompleteTheme } from "./theme";

// Organization role types
export type OrganizationRole = 'owner' | 'admin' | 'write' | 'read';

// Logo orientation and background size enums
export type LogoOrientation = 'square' | 'portrait' | 'landscape';
export type LogoBackgroundSize = 'contain' | 'cover' | 'fill';

// JSON field types
export interface LogoSettings {
  orientation?: LogoOrientation;
  backgroundSize?: LogoBackgroundSize;
}

export interface NotificationSettings {
  roleChanges: boolean;
  securityAlerts: boolean;
  appUpdates: boolean;
  newUserAdded: boolean;
}

export interface BrandColors {
  light: {
    primary: string;
    secondary: string;
    accent: string;
  };
  dark: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Main organization interface
export interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  currency: string;
  logo_settings: LogoSettings;
  brand_colors: CompleteTheme;
  notification_settings: NotificationSettings;
  theme_name?: string;
  is_active: boolean;
}

// User organization relationship interface
export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
  organization?: Organization; // Optional populated organization data
}

// Organization with user role (for context)
export interface OrganizationWithRole extends Organization {
  user_role: OrganizationRole;
}

// Organization creation/update types
export interface CreateOrganizationData {
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: string;
  currency?: string;
  logo_settings?: LogoSettings;
  brand_colors?: CompleteTheme | null;
  notification_settings?: NotificationSettings;
  theme_name?: string;
  is_active: boolean;
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
  id: string;
}

// Organization context types
export interface OrganizationContextType {
  currentOrganization: OrganizationWithRole | null;
  userOrganizations: OrganizationWithRole[];
  selectedOrgId: string | null;
  isLoading: boolean;
  error: string | null;
  selectOrganization: (organizationId: string) => Promise<void>;
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  updateOrganization: (data: UpdateOrganizationData) => Promise<Organization>;
  refreshOrganizations: () => Promise<void>;
  inviteUser: (organizationId: string, email: string, role: OrganizationRole) => Promise<void>;
  updateUserRole: (userOrganizationId: string, role: OrganizationRole) => Promise<void>;
  removeUser: (userOrganizationId: string) => Promise<void>;
  clearOrganizationData: () => void;
}

// Default values
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  roleChanges: true,
  securityAlerts: true,
  appUpdates: true,
  newUserAdded: true,
};

export const DEFAULT_BRAND_COLORS: BrandColors = {
  light: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#06b6d4',
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#94a3b8',
    accent: '#22d3ee',
  },
};

export const DEFAULT_LOGO_SETTINGS: LogoSettings = {
  orientation: 'square',
  backgroundSize: 'contain',
};

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 4,
  admin: 3,
  write: 2,
  read: 1,
};

// Helper function to check if user has permission
export const hasPermission = (
  userRole: OrganizationRole,
  requiredRole: OrganizationRole
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<OrganizationRole, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  write: 'Editor',
  read: 'Viewer',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<OrganizationRole, string> = {
  owner: 'Full access to all organization settings and data',
  admin: 'Manage users and organization settings',
  write: 'Create and edit content',
  read: 'View-only access',
};
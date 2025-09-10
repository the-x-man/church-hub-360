// User Management Types for Supabase Database

// Base Profile type from profiles table
export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null; // ISO date string
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Auth User type from auth_users table
export interface AuthUser {
  id: string;
  profile_id: string;
  is_active: boolean | null;
  is_first_login: boolean | null;
  password_updated: boolean | null;
  last_login: string | null; // ISO timestamp
  otp_requests_count: number | null;
  last_otp_request: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Combined Auth User with Profile data
export interface AuthUserWithProfile extends AuthUser {
  profile: Profile;
}

// Input types for creating new records
export interface CreateProfileInput {
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
}

export interface CreateAuthUserInput {
  id: string; // Must match auth.users.id
  profile_id: string;
  is_first_login?: boolean;
  password_updated?: boolean;
}

// Update types for modifying existing records
export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
}

export interface UpdateAuthUserInput {
  is_first_login?: boolean;
  password_updated?: boolean;
  last_login?: string;
  otp_requests_count?: number;
  last_otp_request?: string;
}

// Utility types for queries and filters
export interface ProfileFilters {
  email?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  created_after?: string;
  created_before?: string;
}

export interface AuthUserFilters {
  is_first_login?: boolean;
  password_updated?: boolean;
  last_login_after?: string;
  last_login_before?: string;
  otp_blocked?: boolean;
  otp_requests_exceeded?: boolean;
}

// Pagination and sorting
export interface UserPagination {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'email' | 'last_login';
  sort_order?: 'asc' | 'desc';
}

// Response types for API endpoints
export interface UserListResponse {
  users: AuthUserWithProfile[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface UserResponse {
  user: AuthUserWithProfile;
}

// Utility functions for user data
export function getFullName(profile: Profile): string {
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';
  return `${firstName} ${lastName}`.trim() || profile.email;
}

export function getDisplayName(profile: Profile): string {
  return profile.first_name || profile.email.split('@')[0];
}

export function isFirstTimeUser(authUser: AuthUser): boolean {
  return authUser.is_first_login === true;
}

export function isActiveUser(authUser: AuthUser): boolean {
  return authUser.is_active === true;
}

export function hasRecentLogin(authUser: AuthUser, daysThreshold: number = 30): boolean {
  if (!authUser.last_login) return false;
  
  const lastLogin = new Date(authUser.last_login);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysThreshold);
  
  return lastLogin > threshold;
}

export function isOtpBlocked(authUser: AuthUser): boolean {
  // Check if user has exceeded request limit
  const requestCount = authUser.otp_requests_count || 0;
  if (requestCount >= 4) return true;
  
  return false;
}

export function canRequestOtp(authUser: AuthUser): boolean {
  // Check if user is blocked
  if (isOtpBlocked(authUser)) return false;
  
  // Check time-based restriction (5 minutes between requests)
  if (authUser.last_otp_request) {
    const lastRequest = new Date(authUser.last_otp_request);
    const now = new Date();
    const timeDiff = now.getTime() - lastRequest.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff < 5) return false;
  }
  
  return true;
}

export function getOtpCooldownMinutes(authUser: AuthUser): number {
  if (!authUser.last_otp_request) return 0;
  
  const lastRequest = new Date(authUser.last_otp_request);
  const now = new Date();
  const timeDiff = now.getTime() - lastRequest.getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  
  return Math.max(0, 5 - minutesDiff);
}

export function getRemainingOtpRequests(authUser: AuthUser): number {
  const requestCount = authUser.otp_requests_count || 0;
  return Math.max(0, 4 - requestCount);
}

// Constants for user management
export const USER_GENDER_OPTIONS = [
  'male',
  'female',
  'other',
  'prefer_not_to_say'
] as const;

export type UserGender = typeof USER_GENDER_OPTIONS[number];

export const USER_SORT_OPTIONS = [
  'created_at',
  'updated_at',
  'email',
  'last_login'
] as const;

export type UserSortOption = typeof USER_SORT_OPTIONS[number];

// Default values
export const DEFAULT_USER_PAGINATION: Required<UserPagination> = {
  page: 1,
  limit: 20,
  sort_by: 'created_at',
  sort_order: 'desc'
};
/**
 * TypeScript types for the app_versions table
 * Based on the SQL schema in supabase/migrations/app_versions.sql
 */

export type AppVersionStatus = 'draft' | 'published' | 'archived';
export type Platform = 'win32' | 'darwin' | 'linux';
export type Architecture = 'x64' | 'arm64' | 'ia32';

/**
 * Database row type for app_versions table
 * Represents the complete structure as stored in the database
 */
export interface AppVersion {
  id: string; // uuid
  version: string; // character varying(50)
  release_notes: string | null; // text
  download_url: string; // text
  file_size: number; // bigint
  platform: Platform; // character varying(20), default 'win32'
  status: AppVersionStatus; // character varying(20), default 'draft'
  is_critical: boolean | null; // boolean, default false
  minimum_version: string | null; // character varying(50)
  created_at: string | null; // timestamp with time zone, default now()
  updated_at: string | null; // timestamp with time zone, default now()
  published_at: string | null; // timestamp with time zone
  created_by: string | null; // uuid, foreign key to auth.users
  is_latest: boolean; // boolean, default false
  architecture: Architecture | null; // text
}

/**
 * Input type for creating a new app version
 * Excludes auto-generated fields and includes only required/optional user inputs
 */
export interface CreateAppVersionInput {
  version: string;
  release_notes?: string | null;
  download_url: string;
  file_size: number;
  platform?: Platform;
  status?: AppVersionStatus;
  is_critical?: boolean;
  minimum_version?: string | null;
  architecture?: Architecture | null;
}

/**
 * Input type for updating an existing app version
 * All fields are optional except id
 */
export interface UpdateAppVersionInput {
  id: string;
  version?: string;
  release_notes?: string | null;
  download_url?: string;
  file_size?: number;
  platform?: Platform;
  status?: AppVersionStatus;
  is_critical?: boolean;
  minimum_version?: string | null;
  architecture?: Architecture | null;
}

/**
 * Response type for app version queries
 * Includes computed fields and formatted data
 */
export interface AppVersionResponse extends AppVersion {
  // Additional computed fields can be added here
  file_size_mb?: number;
  is_newer_than_minimum?: boolean;
}

/**
 * Query parameters for filtering app versions
 */
export interface AppVersionFilters {
  platform?: Platform;
  status?: AppVersionStatus;
  is_latest?: boolean;
  is_critical?: boolean;
  architecture?: Architecture;
  version?: string;
  minimum_version?: string;
}

/**
 * Pagination parameters for app version queries
 */
export interface AppVersionPagination {
  page?: number;
  limit?: number;
  sort_by?: keyof AppVersion;
  sort_order?: 'asc' | 'desc';
}

/**
 * Complete query options combining filters and pagination
 */
export interface AppVersionQueryOptions extends AppVersionFilters, AppVersionPagination {}

/**
 * Response type for paginated app version queries
 */
export interface PaginatedAppVersionsResponse {
  data: AppVersionResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Type for app version statistics
 */
export interface AppVersionStats {
  total_versions: number;
  published_versions: number;
  draft_versions: number;
  critical_versions: number;
  platforms: Record<Platform, number>;
  latest_version_by_platform: Record<Platform, AppVersion | null>;
}

/**
 * Error response type for app version operations
 */
export interface AppVersionError {
  code: string;
  message: string;
  details?: any;
}

/**
 * API response wrapper type
 */
export type AppVersionApiResponse<T = any> = {
  success: true;
  data: T;
} | {
  success: false;
  error: AppVersionError;
};

/**
 * Utility type for partial updates
 */
export type PartialAppVersion = Partial<Omit<AppVersion, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Type guards for runtime type checking
 */
export const isValidPlatform = (platform: string): platform is Platform => {
  return ['win32', 'darwin', 'linux'].includes(platform);
};

export const isValidStatus = (status: string): status is AppVersionStatus => {
  return ['draft', 'published', 'archived'].includes(status);
};

export const isValidArchitecture = (arch: string): arch is Architecture => {
  return ['x64', 'arm64', 'ia32'].includes(arch);
};

/**
 * Utility functions for working with app versions
 */
export const AppVersionUtils = {
  /**
   * Compare two version strings (basic semantic versioning)
   */
  compareVersions: (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  },
  
  /**
   * Check if a version meets minimum requirements
   */
  meetsMinimumVersion: (version: string, minimumVersion: string | null): boolean => {
    if (!minimumVersion) return true;
    return AppVersionUtils.compareVersions(version, minimumVersion) >= 0;
  },
  
  /**
   * Format file size to human readable format
   */
  formatFileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },
  
  /**
   * Check if an app version is published and available
   */
  isAvailable: (appVersion: AppVersion): boolean => {
    return appVersion.status === 'published' && !!appVersion.published_at;
  }
};
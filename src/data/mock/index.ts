/**
 * Mock Data Index
 * Central export for all mock data modules
 */

export * from './attendance';
export * from './occasions';
export * from './settings';

// Storage keys for localStorage
export const STORAGE_KEYS = {
  ATTENDANCE_SETTINGS: 'attendance_settings',
  OCCASIONS: 'occasions',
  ATTENDANCE_SESSIONS: 'attendance_sessions',
  ATTENDANCE_RECORDS: 'attendance_records',
  PUBLIC_LINKS: 'public_attendance_links',
} as const;
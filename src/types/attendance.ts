/**
 * Attendance Types
 * Type definitions for attendance management system
 */

/**
 * Attendance Occasion
 * Represents a recurring or one-time church occasion/service
 */
export interface AttendanceOccasion {
  id: string;
  organization_id: string;
  branch_id?: string | null; // Optional, null means organization-wide
  name: string;
  description?: string | null;
  recurrence_rule?: string | null; // iCalendar format (e.g., "FREQ=WEEKLY;BYDAY=SU")
  default_duration_minutes?: number | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create Attendance Occasion Input
 * Data required to create a new attendance occasion
 */
export interface CreateAttendanceOccasionInput {
  organization_id: string;
  branch_id?: string | null;
  name: string;
  description?: string;
  recurrence_rule?: string;
  default_duration_minutes?: number;
  is_active?: boolean;
}

/**
 * Update Attendance Occasion Input
 * Data that can be updated for an attendance occasion
 */
export interface UpdateAttendanceOccasionInput {
  name?: string;
  description?: string;
  recurrence_rule?: string;
  default_duration_minutes?: number;
  is_active?: boolean;
}

/**
 * Attendance Occasion with Relations
 * Extended version with related data for display purposes
 */
export interface AttendanceOccasionWithRelations extends AttendanceOccasion {
  branch_name?: string;
  created_by_name?: string;
  upcoming_sessions_count?: number;
  total_sessions_count?: number;
  average_attendance?: number;
}

/**
 * Recurrence Rule Helper Types
 */
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type WeekDay = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

export interface RecurrenceRule {
  freq: RecurrenceFrequency;
  interval?: number;
  byday?: WeekDay[];
  bymonthday?: number[];
  bymonth?: number[];
  until?: string; // ISO date string
  count?: number;
}

/**
 * Attendance Occasion Filters
 * For filtering occasions in lists and queries
 */
export interface AttendanceOccasionFilters {
  branch_id?: string;
  is_active?: boolean;
  search?: string;
  has_recurrence?: boolean;
  created_by?: string;
}

/**
 * Attendance Occasion Sort Options
 */
export type AttendanceOccasionSortField = 
  | 'name' 
  | 'created_at' 
  | 'updated_at' 
  | 'default_duration_minutes';

export interface AttendanceOccasionSort {
  field: AttendanceOccasionSortField;
  direction: 'asc' | 'desc';
}

/**
 * Pagination for Attendance Occasions
 */
export interface AttendanceOccasionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Attendance Occasion List Response
 */
export interface AttendanceOccasionListResponse {
  data: AttendanceOccasionWithRelations[];
  pagination: AttendanceOccasionPagination;
}

/**
 * Attendance Occasion Statistics
 */
export interface AttendanceOccasionStats {
  total_occasions: number;
  active_occasions: number;
  recurring_occasions: number;
  one_time_occasions: number;
  this_week_occasions: number;
  total_expected_attendance: number;
}
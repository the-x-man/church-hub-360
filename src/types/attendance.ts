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

/**
 * Location data for proximity checking
 */
export interface AttendanceLocation {
  lat: number;
  lng: number;
  radius?: number; // in meters
}

/**
 * Marking modes configuration
 */
export interface AttendanceMarkingModes {
  email: boolean;
  phone: boolean;
  membership_id: boolean;
  manual: boolean;
  public_link: boolean;
}

/**
 * Attendance Session
 * Represents a specific instance of attendance marking derived from an occasion
 */
export interface AttendanceSession {
  id: string;
  organization_id: string;
  occasion_id: string;
  name?: string | null;
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  is_open: boolean;
  allow_public_marking: boolean;
  proximity_required: boolean;
  location?: AttendanceLocation | null;
  allowed_tags?: string[] | null;
  marking_modes: AttendanceMarkingModes;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create Attendance Session Input
 * Data required to create a new attendance session
 */
export interface CreateAttendanceSessionInput {
  organization_id: string;
  occasion_id: string;
  name?: string;
  start_time: string;
  end_time: string;
  is_open?: boolean;
  allow_public_marking?: boolean;
  proximity_required?: boolean;
  location?: AttendanceLocation;
  allowed_tags?: string[];
  marking_modes?: Partial<AttendanceMarkingModes>;
}

/**
 * Update Attendance Session Input
 * Data that can be updated for an attendance session
 */
export interface UpdateAttendanceSessionInput {
  name?: string;
  start_time?: string;
  end_time?: string;
  is_open?: boolean;
  allow_public_marking?: boolean;
  proximity_required?: boolean;
  location?: AttendanceLocation | null;
  allowed_tags?: string[] | null;
  marking_modes?: Partial<AttendanceMarkingModes>;
}

/**
 * Attendance Session with Relations
 * Extended version with related data for display purposes
 */
export interface AttendanceSessionWithRelations extends AttendanceSession {
  occasion_name?: string;
  occasion_description?: string;
  created_by_name?: string;
  attendance_count?: number;
  total_expected?: number;
  attendance_rate?: number;
  is_past?: boolean;
  is_current?: boolean;
  is_future?: boolean;
}

/**
 * Session Status Types
 */
export type AttendanceSessionStatus = 'upcoming' | 'active' | 'closed' | 'past';

/**
 * Attendance Session Filters
 * For filtering sessions in lists and queries
 */
export interface AttendanceSessionFilters {
  occasion_id?: string;
  is_open?: boolean;
  allow_public_marking?: boolean;
  proximity_required?: boolean;
  status?: AttendanceSessionStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  created_by?: string;
}

/**
 * Attendance Session Sort Options
 */
export type AttendanceSessionSortField = 
  | 'name' 
  | 'start_time' 
  | 'end_time'
  | 'created_at' 
  | 'updated_at'
  | 'attendance_count';

export interface AttendanceSessionSort {
  field: AttendanceSessionSortField;
  direction: 'asc' | 'desc';
}

/**
 * Pagination for Attendance Sessions
 */
export interface AttendanceSessionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Attendance Session List Response
 */
export interface AttendanceSessionListResponse {
  data: AttendanceSessionWithRelations[];
  pagination: AttendanceSessionPagination;
}

/**
 * Attendance Session Statistics
 */
export interface AttendanceSessionStats {
  total_sessions: number;
  active_sessions: number;
  upcoming_sessions: number;
  past_sessions: number;
  today_sessions: number;
  this_week_sessions: number;
  average_attendance_rate: number;
  total_attendance_records: number;
}
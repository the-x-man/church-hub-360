/**
 * Attendance Types
 * Defines types for attendance tracking, occasions, and settings
 */

import type { MemberSummary } from './members';

// Attendance marking modes
export type AttendanceMarkingMode = 'phone' | 'email' | 'membershipId';

// Occasion/Service types
export interface Occasion {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: OccasionType;
  is_recurring: boolean;
  recurring_pattern?: RecurringPattern;
  default_duration_minutes?: number;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OccasionType = 
  | 'general_service'
  | 'sunday_service'
  | 'midweek_service'
  | 'evening_service'
  | 'youth_meeting'
  | 'special_event'
  | 'wedding'
  | 'funeral'
  | 'conference'
  | 'retreat'
  | 'outreach'
  | 'other';

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  days_of_week?: number[]; // 0-6, Sunday = 0
  day_of_month?: number; // 1-31
  month_of_year?: number; // 1-12
  end_date?: string;
}

// Attendance record
export interface AttendanceRecord {
  id: string;
  organization_id: string;
  member_id: string;
  occasion_id: string;
  attendance_date: string; // ISO date string
  marked_at: string; // ISO datetime string
  marked_by?: string; // Member ID who marked (for self-marking)
  marking_method: AttendanceMarkingMethod;
  notes?: string;
  is_present: boolean;
  created_at: string;
  updated_at: string;
}

export type AttendanceMarkingMethod = 
  | 'manual' // Marked by admin/leader
  | 'self_phone' // Self-marked via phone
  | 'self_email' // Self-marked via email
  | 'self_membership_id' // Self-marked via membership ID
  | 'public_link'; // Marked via public attendance link

// Attendance record with member details
export interface AttendanceRecordWithMember extends AttendanceRecord {
  member: MemberSummary;
}

// Attendance session (for a specific occasion and date)
export interface AttendanceSession {
  id: string;
  organization_id: string;
  occasion_id: string;
  session_date: string; // ISO date string
  start_time?: string; // ISO datetime string
  end_time?: string; // ISO datetime string
  expected_count?: number;
  actual_count: number;
  notes?: string;
  is_active: boolean;
  public_link_active: boolean;
  public_link_token?: string;
  created_at: string;
  updated_at: string;
}

// Attendance session with occasion details
export interface AttendanceSessionWithOccasion extends AttendanceSession {
  occasion: Occasion;
  attendance_records: AttendanceRecordWithMember[];
}

// Attendance settings
export interface AttendanceSettings {
  id: string;
  organization_id: string;
  enabled_marking_modes: AttendanceMarkingMode[];
  default_occasion_id?: string;
  allow_self_marking: boolean;
  allow_public_links: boolean;
  public_link_expiry_hours: number;
  require_confirmation: boolean;
  allow_late_marking: boolean;
  late_marking_hours: number;
  auto_mark_leaders: boolean;
  send_notifications: boolean;
  notification_settings: {
    email_reminders: boolean;
    sms_reminders: boolean;
    reminder_hours_before: number;
    summary_reports: boolean;
  };
  created_at: string;
  updated_at: string;
}

// Attendance filters
export interface AttendanceFilters {
  occasion_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  member_search?: string;
  branch_id?: string;
  tag_ids?: string[];
  membership_status?: string;
  is_present?: boolean;
  marking_method?: AttendanceMarkingMethod;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}

// Attendance statistics
export interface AttendanceStatistics {
  total_sessions: number;
  total_attendees: number;
  average_attendance: number;
  attendance_rate: number; // Percentage
  most_attended_occasion: {
    occasion_id: string;
    occasion_name: string;
    count: number;
  };
  attendance_by_occasion: Record<string, {
    occasion_name: string;
    total_sessions: number;
    total_attendees: number;
    average_attendance: number;
  }>;
  attendance_by_month: Record<string, number>;
  attendance_by_day_of_week: Record<string, number>;
  top_attendees: Array<{
    member_id: string;
    member_name: string;
    attendance_count: number;
    attendance_rate: number;
  }>;
}

// Session-level statistics for individual sessions
export interface SessionStatistics {
  total_expected: number;
  total_marked: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_percentage: number;
  on_time_percentage: number;
}

// Public attendance link data
export interface PublicAttendanceLink {
  token: string;
  session_id: string;
  occasion_name: string;
  session_date: string;
  enabled_modes: AttendanceMarkingMode[];
  expires_at: string;
  is_active: boolean;
}

// Member search result for attendance marking
export interface AttendanceMemberResult extends MemberSummary {
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  attendance_status?: 'present' | 'absent' | 'not_marked';
  last_attendance?: string; // ISO date string
}

// Attendance export options
export interface AttendanceExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  session_ids: string[];
  include_member_details: boolean;
  include_statistics: boolean;
  group_by: 'session' | 'member' | 'occasion';
}

// Form data types
export interface CreateOccasionData {
  organization_id: string;
  name: string;
  description?: string;
  type: OccasionType;
  is_recurring: boolean;
  recurring_pattern?: RecurringPattern;
  default_duration_minutes?: number;
  location?: string;
  is_active?: boolean;
}

export interface UpdateOccasionData extends Partial<Omit<CreateOccasionData, 'organization_id'>> {
  id: string;
}

export interface CreateAttendanceSessionData {
  organization_id: string;
  occasion_id: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  expected_count?: number;
  notes?: string;
  public_link_active?: boolean;
}

export interface UpdateAttendanceSessionData extends Partial<Omit<CreateAttendanceSessionData, 'organization_id'>> {
  id: string;
}

export interface MarkAttendanceData {
  organization_id: string;
  session_id: string;
  member_id: string;
  is_present: boolean;
  marking_method: AttendanceMarkingMethod;
  marked_by?: string;
  notes?: string;
}

// Bulk attendance operations
export interface BulkAttendanceOperation {
  session_id: string;
  member_ids: string[];
  is_present: boolean;
  marking_method: AttendanceMarkingMethod;
  marked_by?: string;
  notes?: string;
}

// Attendance report data
export interface AttendanceReport {
  id: string;
  title: string;
  type: 'session' | 'member' | 'occasion' | 'summary';
  filters: AttendanceFilters;
  data: any;
  generated_at: string;
  generated_by: string;
}

// Member attendance history
export interface MemberAttendanceHistory {
  member_id: string;
  member: MemberSummary;
  total_sessions: number;
  attended_sessions: number;
  attendance_rate: number;
  recent_attendance: AttendanceRecord[];
  attendance_by_occasion: Record<string, {
    occasion_name: string;
    attended: number;
    total: number;
    rate: number;
  }>;
}
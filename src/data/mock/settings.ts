/**
 * Mock Attendance Settings Data
 * Default settings for attendance tracking system
 */

import type { AttendanceSettings, AttendanceMarkingMode } from '../../types/attendance';
import { defaultOccasionId } from './occasions';

export const mockAttendanceSettings: AttendanceSettings = {
  id: 'settings-1',
  organization_id: 'org-1',
  enabled_marking_modes: ['phone', 'email', 'membershipId'] as AttendanceMarkingMode[],
  default_occasion_id: defaultOccasionId,
  allow_self_marking: true,
  allow_public_links: true,
  public_link_expiry_hours: 24,
  require_confirmation: false,
  allow_late_marking: true,
  late_marking_hours: 48,
  auto_mark_leaders: false,
  send_notifications: true,
  notification_settings: {
    email_reminders: true,
    sms_reminders: false,
    reminder_hours_before: 2,
    summary_reports: true,
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Default settings for new organizations
export const defaultAttendanceSettings: Partial<AttendanceSettings> = {
  enabled_marking_modes: ['phone', 'membershipId'] as AttendanceMarkingMode[],
  allow_self_marking: true,
  allow_public_links: false,
  public_link_expiry_hours: 12,
  require_confirmation: true,
  allow_late_marking: true,
  late_marking_hours: 24,
  auto_mark_leaders: false,
  send_notifications: false,
  notification_settings: {
    email_reminders: false,
    sms_reminders: false,
    reminder_hours_before: 1,
    summary_reports: false,
  },
};

// Marking mode configurations
export const markingModeConfig = {
  phone: {
    label: 'Phone Number',
    description: 'Allow marking attendance using phone number',
    placeholder: 'Enter phone number',
    icon: 'Phone',
    validation: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Please enter a valid phone number',
    },
  },
  email: {
    label: 'Email Address',
    description: 'Allow marking attendance using email address',
    placeholder: 'Enter email address',
    icon: 'Mail',
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
  },
  membershipId: {
    label: 'Membership ID',
    description: 'Allow marking attendance using membership ID',
    placeholder: 'Enter membership ID',
    icon: 'CreditCard',
    validation: {
      pattern: /^[A-Z0-9]+$/,
      message: 'Please enter a valid membership ID',
    },
  },
} as const;

// Settings validation rules
export const settingsValidation = {
  public_link_expiry_hours: {
    min: 1,
    max: 168, // 1 week
    default: 24,
  },
  late_marking_hours: {
    min: 1,
    max: 720, // 30 days
    default: 48,
  },
  reminder_hours_before: {
    min: 0.5,
    max: 72, // 3 days
    default: 2,
  },
};

// Helper functions for settings management
export function isMarkingModeEnabled(mode: AttendanceMarkingMode, settings: AttendanceSettings): boolean {
  return settings.enabled_marking_modes.includes(mode);
}

export function getEnabledMarkingModes(settings: AttendanceSettings): AttendanceMarkingMode[] {
  return settings.enabled_marking_modes;
}

export function canSelfMark(settings: AttendanceSettings): boolean {
  return settings.allow_self_marking && settings.enabled_marking_modes.length > 0;
}

export function canUsePublicLinks(settings: AttendanceSettings): boolean {
  return settings.allow_public_links && settings.allow_self_marking;
}

export function isLateMarkingAllowed(settings: AttendanceSettings, sessionDate: string): boolean {
  if (!settings.allow_late_marking) return false;
  
  const sessionDateTime = new Date(sessionDate);
  const now = new Date();
  const hoursDiff = (now.getTime() - sessionDateTime.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff <= settings.late_marking_hours;
}

// Local storage keys for settings persistence
export const STORAGE_KEYS = {
  ATTENDANCE_SETTINGS: 'churchhub_attendance_settings',
  OCCASIONS: 'churchhub_occasions',
  ATTENDANCE_SESSIONS: 'churchhub_attendance_sessions',
  ATTENDANCE_RECORDS: 'churchhub_attendance_records',
  ATTENDANCE_MEMBERS: 'churchhub_attendance_members',
} as const;
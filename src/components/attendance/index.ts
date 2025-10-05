/**
 * Attendance Components
 * Centralized exports for all attendance-related components
 */

// Core Components
export { AttendanceSettingsPanel } from './AttendanceSettingsPanel';
export { AttendanceSearch } from './AttendanceSearch';
export { MemberResultRow } from './MemberResultRow';

// Occasion Management Components
export { OccasionSelector } from './OccasionSelector';
export { CreateOccasionModal } from './CreateOccasionModal';

// Attendance List and Reporting Components
export { AttendanceList } from './AttendanceList';
export { AttendanceSummaryCard } from './AttendanceSummaryCard';

// Re-export types for convenience
export type {
  AttendanceRecord,
  AttendanceRecordWithMember,
  AttendanceSession,
  AttendanceSessionWithOccasion,
  Occasion,
  AttendanceSettings,
  AttendanceFilters,
  AttendanceStatistics,
  PublicAttendanceLink,
  AttendanceMemberResult,
  CreateOccasionData,
  UpdateOccasionData,
  CreateAttendanceSessionData,
  UpdateAttendanceSessionData,
  MarkAttendanceData,
  BulkAttendanceOperation,
  AttendanceExportOptions,
} from '@/types/attendance';
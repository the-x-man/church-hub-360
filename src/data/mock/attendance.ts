/**
 * Mock Attendance Data
 * Sample attendance sessions and records for testing
 */

import type { 
  AttendanceSession, 
  AttendanceRecord, 
  AttendanceRecordWithMember,
  AttendanceSessionWithOccasion,
  AttendanceMarkingMethod,
  AttendanceMemberResult
} from '../../types/attendance';
import { mockOccasions } from './occasions';

// Mock attendance sessions
export const mockAttendanceSessions: AttendanceSession[] = [
  {
    id: 'session-1',
    organization_id: 'org-1',
    occasion_id: 'occasion-1', // Sunday Morning Service
    session_date: '2024-01-07', // Last Sunday
    start_time: '2024-01-07T10:00:00Z',
    end_time: '2024-01-07T12:00:00Z',
    expected_count: 150,
    actual_count: 142,
    notes: 'Great turnout despite the weather',
    is_active: false,
    public_link_active: false,
    created_at: '2024-01-07T09:00:00Z',
    updated_at: '2024-01-07T12:30:00Z',
  },
  {
    id: 'session-2',
    organization_id: 'org-1',
    occasion_id: 'occasion-3', // Wednesday Bible Study
    session_date: '2024-01-10',
    start_time: '2024-01-10T19:00:00Z',
    end_time: '2024-01-10T20:15:00Z',
    expected_count: 80,
    actual_count: 67,
    notes: 'Good discussion on Romans 8',
    is_active: false,
    public_link_active: false,
    created_at: '2024-01-10T18:00:00Z',
    updated_at: '2024-01-10T20:30:00Z',
  },
  {
    id: 'session-3',
    organization_id: 'org-1',
    occasion_id: 'occasion-4', // Youth Meeting
    session_date: '2024-01-12',
    start_time: '2024-01-12T19:00:00Z',
    end_time: '2024-01-12T21:00:00Z',
    expected_count: 45,
    actual_count: 38,
    notes: 'Pizza night was a hit!',
    is_active: false,
    public_link_active: false,
    created_at: '2024-01-12T18:00:00Z',
    updated_at: '2024-01-12T21:30:00Z',
  },
  {
    id: 'session-4',
    organization_id: 'org-1',
    occasion_id: 'occasion-1', // Sunday Morning Service
    session_date: '2024-01-14', // This Sunday
    start_time: '2024-01-14T10:00:00Z',
    expected_count: 150,
    actual_count: 0, // Current session, no final count yet
    notes: '',
    is_active: true,
    public_link_active: true,
    public_link_token: 'abc123def456',
    created_at: '2024-01-14T09:00:00Z',
    updated_at: '2024-01-14T09:00:00Z',
  },
  {
    id: 'session-5',
    organization_id: 'org-1',
    occasion_id: 'occasion-2', // Sunday Evening Service
    session_date: '2024-01-14',
    start_time: '2024-01-14T18:00:00Z',
    expected_count: 100,
    actual_count: 0,
    notes: '',
    is_active: true,
    public_link_active: false,
    created_at: '2024-01-14T17:00:00Z',
    updated_at: '2024-01-14T17:00:00Z',
  },
];

// Mock attendance records
export const mockAttendanceRecords: AttendanceRecord[] = [
  // Session 1 records (Sunday Morning Service - Jan 7)
  {
    id: 'record-1',
    organization_id: 'org-1',
    member_id: 'member-1',
    occasion_id: 'occasion-1',
    attendance_date: '2024-01-07',
    marked_at: '2024-01-07T10:15:00Z',
    marking_method: 'manual' as AttendanceMarkingMethod,
    notes: '',
    is_present: true,
    created_at: '2024-01-07T10:15:00Z',
    updated_at: '2024-01-07T10:15:00Z',
  },
  {
    id: 'record-2',
    organization_id: 'org-1',
    member_id: 'member-2',
    occasion_id: 'occasion-1',
    attendance_date: '2024-01-07',
    marked_at: '2024-01-07T10:20:00Z',
    marking_method: 'self_phone' as AttendanceMarkingMethod,
    marked_by: 'member-2',
    notes: '',
    is_present: true,
    created_at: '2024-01-07T10:20:00Z',
    updated_at: '2024-01-07T10:20:00Z',
  },
  {
    id: 'record-3',
    organization_id: 'org-1',
    member_id: 'member-3',
    occasion_id: 'occasion-1',
    attendance_date: '2024-01-07',
    marked_at: '2024-01-07T10:25:00Z',
    marking_method: 'public_link' as AttendanceMarkingMethod,
    marked_by: 'member-3',
    notes: '',
    is_present: true,
    created_at: '2024-01-07T10:25:00Z',
    updated_at: '2024-01-07T10:25:00Z',
  },
  // Session 2 records (Wednesday Bible Study - Jan 10)
  {
    id: 'record-4',
    organization_id: 'org-1',
    member_id: 'member-1',
    occasion_id: 'occasion-3',
    attendance_date: '2024-01-10',
    marked_at: '2024-01-10T19:05:00Z',
    marking_method: 'manual' as AttendanceMarkingMethod,
    notes: '',
    is_present: true,
    created_at: '2024-01-10T19:05:00Z',
    updated_at: '2024-01-10T19:05:00Z',
  },
  {
    id: 'record-5',
    organization_id: 'org-1',
    member_id: 'member-4',
    occasion_id: 'occasion-3',
    attendance_date: '2024-01-10',
    marked_at: '2024-01-10T19:10:00Z',
    marking_method: 'self_email' as AttendanceMarkingMethod,
    marked_by: 'member-4',
    notes: '',
    is_present: true,
    created_at: '2024-01-10T19:10:00Z',
    updated_at: '2024-01-10T19:10:00Z',
  },
  // Session 4 records (Current Sunday Morning Service - Jan 14)
  {
    id: 'record-6',
    organization_id: 'org-1',
    member_id: 'member-1',
    occasion_id: 'occasion-1',
    attendance_date: '2024-01-14',
    marked_at: '2024-01-14T10:05:00Z',
    marking_method: 'manual' as AttendanceMarkingMethod,
    notes: '',
    is_present: true,
    created_at: '2024-01-14T10:05:00Z',
    updated_at: '2024-01-14T10:05:00Z',
  },
  {
    id: 'record-7',
    organization_id: 'org-1',
    member_id: 'member-2',
    occasion_id: 'occasion-1',
    attendance_date: '2024-01-14',
    marked_at: '2024-01-14T10:12:00Z',
    marking_method: 'self_membership_id' as AttendanceMarkingMethod,
    marked_by: 'member-2',
    notes: '',
    is_present: true,
    created_at: '2024-01-14T10:12:00Z',
    updated_at: '2024-01-14T10:12:00Z',
  },
];

// Mock member data for attendance (simplified from existing member types)
export const mockAttendanceMembers: AttendanceMemberResult[] = [
  {
    id: 'member-1',
    organization_id: 'org-1',
    branch_id: 'branch-1',
    membership_id: 'MEM001',
    first_name: 'John',
    last_name: 'Smith',
    middle_name: 'David',
    full_name: 'John David Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0101',
    date_of_birth: '1985-03-15',
    gender: 'male',
    membership_status: 'active',
    membership_type: 'Regular',
    date_joined: '2020-01-15',
    is_active: true,
    profile_image_url: '/avatars/AV1.png',
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    age: 38,
    membership_years: 4,
    // Address fields
    address_line_1: '123 Main Street',
    address_line_2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62701',
    country: 'Ghana',
    // Branch information
    branch_name: 'Main Campus',
    branch_location: 'Downtown Springfield',
    // Tag fields
    assigned_tags: 'Leadership, Choir, Men Ministry',
    tag_count: 3,
    tags_with_categories: 'Positions: Leadership | Ministries: Choir | Ministries: Men Ministry',
    tags: [
      { id: 'tag-1', name: 'Leadership', color: '#3b82f6' },
      { id: 'tag-2', name: 'Choir', color: '#10b981' },
    ],
    attendance_status: 'present',
    last_attendance: '2024-01-14',
  },
  {
    id: 'member-2',
    organization_id: 'org-1',
    branch_id: 'branch-1',
    membership_id: 'MEM002',
    first_name: 'Sarah',
    last_name: 'Johnson',
    middle_name: 'Marie',
    full_name: 'Sarah Marie Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0102',
    date_of_birth: '1990-07-22',
    gender: 'female',
    membership_status: 'active',
    membership_type: 'Regular',
    date_joined: '2021-03-10',
    is_active: true,
    profile_image_url: '/avatars/AV2.png',
    created_at: '2021-03-10T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    age: 33,
    membership_years: 3,
    // Address fields
    address_line_1: '456 Oak Avenue',
    address_line_2: null,
    city: 'Springfield',
    state: 'IL',
    postal_code: '62702',
    country: 'USA',
    // Branch information
    branch_name: 'Main Campus',
    branch_location: 'Downtown Springfield',
    // Tag fields
    assigned_tags: 'Youth Ministry, Sunday School, Women Ministry',
    tag_count: 3,
    tags_with_categories: 'Ministries: Youth Ministry | Ministries: Sunday School | Ministries: Women Ministry',
    tags: [
      { id: 'tag-3', name: 'Youth Ministry', color: '#f59e0b' },
      { id: 'tag-4', name: 'Sunday School', color: '#8b5cf6' },
    ],
    attendance_status: 'present',
    last_attendance: '2024-01-14',
  },
  {
    id: 'member-3',
    organization_id: 'org-1',
    branch_id: 'branch-2',
    membership_id: 'MEM003',
    first_name: 'Michael',
    last_name: 'Brown',
    middle_name: null,
    full_name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone: '+1-555-0103',
    date_of_birth: '1975-11-30',
    gender: 'male',
    membership_status: 'active',
    membership_type: 'Regular',
    date_joined: '2019-08-15',
    is_active: true,
    profile_image_url: '/avatars/AV3.png',
    created_at: '2019-08-15T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    age: 48,
    membership_years: 5,
    // Address fields
    address_line_1: '789 Pine Street',
    address_line_2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62703',
    country: 'USA',
    // Branch information
    branch_name: 'North Campus',
    branch_location: 'North Springfield',
    // Tag fields
    assigned_tags: 'Elder, Board Member, Finance Committee',
    tag_count: 3,
    tags_with_categories: 'Leadership Levels: Elder | Positions: Board Member | Departments: Finance Committee',
    tags: [
      { id: 'tag-5', name: 'Elder', color: '#dc2626' },
      { id: 'tag-6', name: 'Board Member', color: '#7c3aed' },
    ],
    attendance_status: 'present',
    last_attendance: '2024-01-07',
  },
  {
    id: 'member-4',
    organization_id: 'org-1',
    branch_id: 'branch-1',
    membership_id: 'MEM004',
    first_name: 'Emily',
    last_name: 'Davis',
    middle_name: 'Rose',
    full_name: 'Emily Rose Davis',
    email: 'emily.davis@email.com',
    phone: '+1-555-0104',
    date_of_birth: '1995-02-14',
    gender: 'female',
    membership_status: 'active',
    membership_type: 'Associate',
    date_joined: '2022-09-15',
    is_active: true,
    profile_image_url: '/avatars/AV4.png',
    created_at: '2022-09-15T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    age: 28,
    membership_years: 1,
    // Address fields
    address_line_1: '321 Elm Drive',
    address_line_2: null,
    city: 'Springfield',
    state: 'IL',
    postal_code: '62704',
    country: 'USA',
    // Branch information
    branch_name: 'Main Campus',
    branch_location: 'Downtown Springfield',
    // Tag fields
    assigned_tags: 'New Member, Volunteer, Children Ministry',
    tag_count: 3,
    tags_with_categories: 'Ministries: Children Ministry | Positions: New Member | Positions: Volunteer',
    tags: [
      { id: 'tag-7', name: 'New Member', color: '#06b6d4' },
      { id: 'tag-8', name: 'Volunteer', color: '#84cc16' },
    ],
    attendance_status: 'absent',
    last_attendance: '2024-01-10',
  },
  {
    id: 'member-5',
    organization_id: 'org-1',
    branch_id: 'branch-2',
    membership_id: 'MEM005',
    first_name: 'Robert',
    last_name: 'Wilson',
    middle_name: 'James',
    full_name: 'Robert James Wilson',
    email: 'robert.wilson@email.com',
    phone: '+1-555-0105',
    date_of_birth: '1965-09-30',
    gender: 'male',
    membership_status: 'active',
    membership_type: 'Regular',
    date_joined: '2015-04-12',
    is_active: true,
    profile_image_url: '/avatars/AV5.png',
    created_at: '2015-04-12T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    age: 58,
    membership_years: 9,
    // Address fields
    address_line_1: '654 Maple Lane',
    address_line_2: null,
    city: 'Riverside',
    state: 'IL',
    postal_code: '62705',
    country: 'USA',
    // Branch information
    branch_name: 'North Branch',
    branch_location: 'Riverside Community Center',
    // Tag fields
    assigned_tags: 'Elder, Trustee, Men Ministry',
    tag_count: 3,
    tags_with_categories: 'Leadership Levels: Elder | Positions: Trustee | Ministries: Men Ministry',
    tags: [
      { id: 'tag-9', name: 'Elder', color: '#7c3aed' },
      { id: 'tag-10', name: 'Trustee', color: '#be185d' },
    ],
    attendance_status: 'not_marked',
    last_attendance: '2024-01-07',
  },
];

// Helper functions
export function getAttendanceRecordsForSession(sessionId: string): AttendanceRecord[] {
  return mockAttendanceRecords.filter(record => {
    const session = mockAttendanceSessions.find(s => s.id === sessionId);
    return session && record.occasion_id === session.occasion_id && 
           record.attendance_date === session.session_date;
  });
}

export function getAttendanceRecordsWithMembers(sessionId: string): AttendanceRecordWithMember[] {
  const records = getAttendanceRecordsForSession(sessionId);
  return records.map(record => ({
    ...record,
    member: mockAttendanceMembers.find(member => member.id === record.member_id)!,
  }));
}

export function getSessionWithOccasion(sessionId: string): AttendanceSessionWithOccasion | undefined {
  const session = mockAttendanceSessions.find(s => s.id === sessionId);
  if (!session) return undefined;

  const occasion = mockOccasions.find(o => o.id === session.occasion_id);
  if (!occasion) return undefined;

  return {
    ...session,
    occasion,
    attendance_records: getAttendanceRecordsWithMembers(sessionId),
  };
}

export function getMemberAttendanceStatus(memberId: string, sessionId: string): 'present' | 'absent' | 'not_marked' {
  const session = mockAttendanceSessions.find(s => s.id === sessionId);
  if (!session) return 'not_marked';

  const record = mockAttendanceRecords.find(r => 
    r.member_id === memberId && 
    r.occasion_id === session.occasion_id && 
    r.attendance_date === session.session_date
  );

  if (!record) return 'not_marked';
  return record.is_present ? 'present' : 'absent';
}

// Current active session for quick access
export const currentActiveSession = mockAttendanceSessions.find(s => s.is_active);

// Today's date for testing
export const today = '2024-01-14';
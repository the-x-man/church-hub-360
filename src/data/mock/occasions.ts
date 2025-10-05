/**
 * Mock Occasions Data
 * Sample occasions/services for attendance tracking
 */

import type { Occasion, OccasionType } from '../../types/attendance';

export const mockOccasions: Occasion[] = [
  {
    id: 'occasion-1',
    organization_id: 'org-1',
    name: 'Sunday Morning Service',
    description: 'Main Sunday worship service',
    type: 'sunday_service' as OccasionType,
    is_recurring: true,
    recurring_pattern: {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [0], // Sunday
    },
    default_duration_minutes: 120,
    location: 'Main Sanctuary',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-2',
    organization_id: 'org-1',
    name: 'Sunday Evening Service',
    description: 'Evening worship and fellowship',
    type: 'sunday_service' as OccasionType,
    is_recurring: true,
    recurring_pattern: {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [0], // Sunday
    },
    default_duration_minutes: 90,
    location: 'Main Sanctuary',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-3',
    organization_id: 'org-1',
    name: 'Wednesday Bible Study',
    description: 'Midweek Bible study and prayer',
    type: 'midweek_service' as OccasionType,
    is_recurring: true,
    recurring_pattern: {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [3], // Wednesday
    },
    default_duration_minutes: 75,
    location: 'Fellowship Hall',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-4',
    organization_id: 'org-1',
    name: 'Youth Meeting',
    description: 'Weekly youth gathering and activities',
    type: 'youth_meeting' as OccasionType,
    is_recurring: true,
    recurring_pattern: {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [5], // Friday
    },
    default_duration_minutes: 120,
    location: 'Youth Center',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-5',
    organization_id: 'org-1',
    name: 'Monthly Leadership Meeting',
    description: 'Leadership team meeting and planning',
    type: 'special_event' as OccasionType,
    is_recurring: true,
    recurring_pattern: {
      frequency: 'monthly',
      interval: 1,
      day_of_month: 15,
    },
    default_duration_minutes: 180,
    location: 'Conference Room',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-6',
    organization_id: 'org-1',
    name: 'Easter Sunday Service',
    description: 'Special Easter celebration service',
    type: 'special_event' as OccasionType,
    is_recurring: false,
    default_duration_minutes: 150,
    location: 'Main Sanctuary',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-7',
    organization_id: 'org-1',
    name: 'Christmas Eve Service',
    description: 'Christmas Eve candlelight service',
    type: 'special_event' as OccasionType,
    is_recurring: true,
    recurring_pattern: {
      frequency: 'yearly',
      interval: 1,
      day_of_month: 24,
      month_of_year: 12,
    },
    default_duration_minutes: 90,
    location: 'Main Sanctuary',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-8',
    organization_id: 'org-1',
    name: 'Annual Conference',
    description: 'Yearly church conference and business meeting',
    type: 'conference' as OccasionType,
    is_recurring: true,
    recurring_pattern: {
      frequency: 'yearly',
      interval: 1,
      day_of_month: 15,
      month_of_year: 6,
    },
    default_duration_minutes: 480, // 8 hours
    location: 'Main Sanctuary',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-9',
    organization_id: 'org-1',
    name: 'Summer Retreat',
    description: 'Annual summer retreat for all members',
    type: 'retreat' as OccasionType,
    is_recurring: false,
    default_duration_minutes: 2880, // 2 days
    location: 'Mountain View Retreat Center',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-10',
    organization_id: 'org-1',
    name: 'Wedding Ceremony',
    description: 'Wedding ceremony template',
    type: 'wedding' as OccasionType,
    is_recurring: false,
    default_duration_minutes: 60,
    location: 'Main Sanctuary',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occasion-11',
    organization_id: 'org-1',
    name: 'Funeral Service',
    description: 'Funeral service template',
    type: 'funeral' as OccasionType,
    is_recurring: false,
    default_duration_minutes: 90,
    location: 'Main Sanctuary',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Helper function to get occasions by type
export function getOccasionsByType(type: OccasionType): Occasion[] {
  return mockOccasions.filter(occasion => occasion.type === type);
}

// Helper function to get active occasions
export function getActiveOccasions(): Occasion[] {
  return mockOccasions.filter(occasion => occasion.is_active);
}

// Helper function to get recurring occasions
export function getRecurringOccasions(): Occasion[] {
  return mockOccasions.filter(occasion => occasion.is_recurring);
}

// Default occasion for quick marking
export const defaultOccasionId = 'occasion-1'; // Sunday Morning Service
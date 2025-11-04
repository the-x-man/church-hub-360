import type { CreateAttendanceSessionInput } from '@/types/attendance';

// Local draft type used by the Session Creation Wizard and its subcomponents
export interface DraftSession extends Omit<CreateAttendanceSessionInput, 'organization_id'> {
  id: string; // local identifier for editing/removal before save
}
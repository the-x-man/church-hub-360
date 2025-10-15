import { OccasionForm } from './OccasionForm';
import type { AttendanceOccasion } from '@/types/attendance';

interface CreateOccasionFormProps {
  onSuccess?: (occasion: AttendanceOccasion) => void;
  onCancel?: () => void;
}

export function CreateOccasionForm({ 
  onSuccess, 
  onCancel
}: CreateOccasionFormProps) {
  return (
    <OccasionForm
      mode="create"
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
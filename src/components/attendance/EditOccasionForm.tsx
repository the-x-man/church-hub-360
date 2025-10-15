import { OccasionForm } from './OccasionForm';
import type { AttendanceOccasion } from '@/types/attendance';

interface EditOccasionFormProps {
  occasion: AttendanceOccasion;
  onSuccess?: (occasion: AttendanceOccasion) => void;
  onCancel?: () => void;
}

export function EditOccasionForm({ 
  occasion,
  onSuccess, 
  onCancel
}: EditOccasionFormProps) {
  return (
    <OccasionForm
      mode="edit"
      initialData={occasion}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
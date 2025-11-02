import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SessionForm } from './SessionForm';
import { useUpdateAttendanceSession } from '@/hooks/attendance/useAttendanceSessions';
import { toast } from 'sonner';
import type { AttendanceSession } from '@/types/attendance';
import type { AttendanceSessionFormData } from '@/schemas/attendanceSessionSchema';

interface EditSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: AttendanceSession | null;
}

export function EditSessionDialog({
  isOpen,
  onOpenChange,
  session,
}: EditSessionDialogProps) {
  const updateSessionMutation = useUpdateAttendanceSession();

  const handleSubmit = async (data: AttendanceSessionFormData) => {
    if (!session) return;

    try {
      await updateSessionMutation.mutateAsync({
        id: session.id,
        updates: data,
      });
      onOpenChange(false);
      toast.success('Attendance Session updated successfully');
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session. Please try again.');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Attendance Session</DialogTitle>
          <DialogDescription>
            Update the attendance session settings, schedule, and attendance
            marking options.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <SessionForm
            mode="edit"
            initialData={session}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateSessionMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
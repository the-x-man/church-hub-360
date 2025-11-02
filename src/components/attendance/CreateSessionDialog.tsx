import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SessionForm } from './SessionForm';
import { useCreateAttendanceSession } from '@/hooks/attendance/useAttendanceSessions';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { AttendanceSessionFormData } from '@/schemas/attendanceSessionSchema';

interface CreateSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionDialog({
  isOpen,
  onOpenChange,
}: CreateSessionDialogProps) {
  const { currentOrganization } = useOrganization();
  const createSessionMutation = useCreateAttendanceSession();

  const handleSubmit = async (data: AttendanceSessionFormData) => {
    console.log('submitted...');
    try {
      if (!currentOrganization?.id) {
        toast.error('Organization not found. Please try again.');
        return;
      }

      await createSessionMutation.mutateAsync({
        ...data,
        organization_id: currentOrganization.id,
      });
      onOpenChange(false);
      toast.success('Attendance Session created successfully');
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session. Please try again.');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Attendance Session</DialogTitle>
          <DialogDescription>
            Create a new attendance session for tracking member participation.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <SessionForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createSessionMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

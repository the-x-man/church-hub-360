import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserForm } from './UserForm';
import type { UserWithRelations } from '@/types/user-management';

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  selectedBranchIds: string[];
  assignAllBranches?: boolean;
}

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRelations | null;
  onSubmit: (data: UserFormData) => void;
  branches: Branch[];
  isLoading?: boolean;
}

export function UserEditDialog({
  isOpen,
  onOpenChange,
  user,
  onSubmit,
  branches,
  isLoading = false,
}: UserEditDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        {user && (
          <UserForm
            mode="edit"
            user={user}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            branches={branches}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

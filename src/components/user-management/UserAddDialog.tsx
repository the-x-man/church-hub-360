import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { UserForm } from './UserForm';

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

interface UserAddDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => void;
  branches: Branch[];
  isLoading?: boolean;
}

export function UserAddDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  branches,
  isLoading = false,
}: UserAddDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="mt-4 md:mt-0">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the platform. They will receive login credentials
            via email.
          </DialogDescription>
        </DialogHeader>
        <UserForm
          mode="create"
          onSubmit={onSubmit}
          onCancel={handleCancel}
          branches={branches}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

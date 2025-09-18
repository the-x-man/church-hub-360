import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';
import { useUserActions } from '@/hooks/useUserActions';
import { useOrganization } from '@/contexts/OrganizationContext';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { UserRole } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id?: string;
  is_active?: boolean;
  branches?: { name: string };
  user_organizations?: Array<{
    organization_id: string;
    role: UserRole;
    is_active: boolean;
    organizations: { name: string };
  }>;
}

interface UserActionDialogsProps {
  onPasswordRegenerated: (tempPassword: string) => void;
}

export interface UserActionDialogsRef {
  openPasswordDialog: (user: User) => void;
  openDeactivateDialog: (user: User) => void;
  openDeleteDialog: (user: User) => void;
}

export function UserActionDialogs({
  onPasswordRegenerated,
}: UserActionDialogsProps) {
  const queryClient = useQueryClient();
  const userActions = useUserActions();
  const { currentOrganization } = useOrganization();

  // Expose functions to parent component
  const openPasswordDialog = (user: User) => {
    setSelectedUserForPassword(user);
    setIsPasswordDialogOpen(true);
  };

  const openDeactivateDialog = (user: User) => {
    setSelectedUserForDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUserForPermanentDelete(user);
    setIsDeletePermanentlyDialogOpen(true);
  };

  // Expose these functions via a ref or callback
  if (typeof window !== 'undefined') {
    (window as any).userActionDialogs = {
      openPasswordDialog,
      openDeactivateDialog,
      openDeleteDialog,
    };
  }

  // State for regenerate password dialog
  const [
    selectedUserForPassword,
    setSelectedUserForPassword,
  ] = useState<User | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // State for delete/deactivate user dialog
  const [
    selectedUserForDelete,
    setSelectedUserForDelete,
  ] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State for permanent delete user dialog
  const [
    selectedUserForPermanentDelete,
    setSelectedUserForPermanentDelete,
  ] = useState<User | null>(null);
  const [isDeletePermanentlyDialogOpen, setIsDeletePermanentlyDialogOpen] = useState(false);

  // Regenerate password mutation
  const regeneratePasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate password');
      }

      const result = await response.json();

      // Activity logging would be handled by edge function

      return result;
    },
    onSuccess: (data) => {
      onPasswordRegenerated(data.tempPassword);
      setIsPasswordDialogOpen(false);
      setSelectedUserForPassword(null);
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('Password regenerated successfully!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Use the deactivate user action from useUserActions
  const handleDeactivateUser = async () => {
    if (selectedUserForDelete && currentOrganization) {
      try {
        await userActions.deactivateUser.mutateAsync({
          userId: selectedUserForDelete.id,
          organizationId: currentOrganization.id,
        });
        setIsDeleteDialogOpen(false);
        setSelectedUserForDelete(null);
      } catch (error) {
        // Error handling is done by the mutation
      }
    }
  };

  const handleRegeneratePassword = () => {
    if (selectedUserForPassword) {
      regeneratePasswordMutation.mutate(selectedUserForPassword.id);
    }
  };

  // Handle permanent delete user
  const handleDeleteUserPermanently = async () => {
    if (selectedUserForPermanentDelete && currentOrganization) {
      try {
        await userActions.deleteUser.mutateAsync({
          userId: selectedUserForPermanentDelete.id,
          organizationId: currentOrganization.id,
        });
        setIsDeletePermanentlyDialogOpen(false);
        setSelectedUserForPermanentDelete(null);
      } catch (error) {
        // Error handling is done by the mutation
      }
    }
  };

  return (
    <>
      {/* Regenerate Password Dialog */}
      <AlertDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to regenerate the password for "
              {selectedUserForPassword?.full_name}"? This will invalidate their
              current password and they will need to use the new temporary
              password to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setSelectedUserForPassword(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRegeneratePassword}>
              Regenerate Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete/Deactivate User Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate user "
              {selectedUserForDelete?.full_name}"? They will no longer be able
              to access this organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedUserForDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Permanently Dialog */}
      <AlertDialog
        open={isDeletePermanentlyDialogOpen}
        onOpenChange={setIsDeletePermanentlyDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete user "
              {selectedUserForPermanentDelete?.full_name}"? This will remove them from this organization and delete all their branches. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeletePermanentlyDialogOpen(false);
                setSelectedUserForPermanentDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUserPermanently}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

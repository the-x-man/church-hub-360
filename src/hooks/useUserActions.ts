import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';

import type { UserAction } from '@/types/user-management';
import type { UserWithRelations } from '@/types/user-management';

export function useUserActions() {
  const queryClient = useQueryClient();

  // Deactivate user mutation
  const deactivateUser = useMutation({
    mutationFn: async ({ userId, organizationId }: { userId: string; organizationId: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deactivate-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, organizationId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate user from organization');
      }

      // Activity logging would be handled by edge function

      return response.json();
    },
    onMutate: () => {
      toast.loading('Deactivating user...', { id: 'deactivate-user' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('User deactivated successfully', { id: 'deactivate-user' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate user', { id: 'deactivate-user' });
    },
  });

  // Reactivate user mutation
  const reactivateUser = useMutation({
    mutationFn: async ({ userId, organizationId }: { userId: string; organizationId: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reactivate-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, organizationId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reactivate user');
      }

      // Activity logging would be handled by edge function

      return response.json();
    },
    onMutate: () => {
      toast.loading('Reactivating user...', { id: 'reactivate-user' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('User reactivated successfully', { id: 'reactivate-user' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reactivate user', { id: 'reactivate-user' });
    },
  });

  // Regenerate password mutation
  const regeneratePassword = useMutation({
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
    onMutate: () => {
      toast.loading('Regenerating password...', { id: 'regenerate-password' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('Password regenerated successfully', { id: 'regenerate-password' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to regenerate password', { id: 'regenerate-password' });
    },
  });

  // Delete user permanently mutation
  const deleteUser = useMutation({
    mutationFn: async ({ userId, organizationId }: { userId: string; organizationId: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('No access token');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-organization-user`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, organizationId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user permanently');
      }

      // Activity logging would be handled by edge function

      return response.json();
    },
    onMutate: () => {
      toast.loading('Deleting user...', { id: 'delete-user' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('User deleted successfully', { id: 'delete-user' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user', { id: 'delete-user' });
    },
  });

  const handleUserAction = async (action: UserAction, user: UserWithRelations, organizationId?: string) => {
    try {
      switch (action) {
        case 'deactivate':
          if (!organizationId) {
            throw new Error('Organization ID is required for deactivation');
          }
          await deactivateUser.mutateAsync({ userId: user.id, organizationId });
          break;
        case 'reactivate':
          if (!organizationId) {
            throw new Error('Organization ID is required for reactivation');
          }
          await reactivateUser.mutateAsync({ userId: user.id, organizationId });
          break;
        case 'regenerate-password':
          await regeneratePassword.mutateAsync(user.id);
          break;
        case 'delete':
          if (!organizationId) {
            throw new Error('Organization ID is required for deletion');
          }
          await deleteUser.mutateAsync({ userId: user.id, organizationId });
          break;
        default:
          console.warn(`Unhandled user action: ${action}`);
      }
    } catch (error) {
      console.error('User action failed:', error);
    }
  };

  return {
    handleUserAction,
    deactivateUser,
    reactivateUser,
    regeneratePassword,
    deleteUser,
  };
}
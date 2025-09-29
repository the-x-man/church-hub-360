import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';

import type { UserAction } from '@/types/user-management';
import type { UserWithRelations } from '@/types/user-management';

export function useUserActions() {
  const queryClient = useQueryClient();


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

  // Remove user permanently mutation
  const deleteUser = useMutation({
    mutationFn: async ({ userId, organizationId }: { userId: string; organizationId: string }) => {
      // Get branch IDs for this organization first
      const { data: branchIds, error: branchIdsError } = await supabase
        .from('branches')
        .select('id')
        .eq('organization_id', organizationId);

      if (branchIdsError) {
        throw new Error('Failed to fetch organization branches');
      }

      // Remove user from all branches in this organization
      const branchIdArray = branchIds?.map(branch => branch.id) || [];
      if (branchIdArray.length > 0) {
        const { error: userBranchesError } = await supabase
          .from('user_branches')
          .delete()
          .eq('user_id', userId)
          .in('branch_id', branchIdArray);

        if (userBranchesError) {
          throw new Error('Failed to remove user from branches');
        }
      }

      // Remove user from organization
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (userOrgError) {
        throw new Error('Failed to remove user from organization');
      }

      return { userId, organizationId };
    },
    onMutate: () => {
      toast.loading('Deleting user...', { id: 'delete-user' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      toast.success('User removed successfully', { id: 'delete-user' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user', { id: 'delete-user' });
    },
  });

  const handleUserAction = async (action: UserAction, user: UserWithRelations, organizationId?: string) => {
    try {
      switch (action) {
        case 'deactivate':
          // Deactivate functionality moved to useUserQueries
          console.warn('Deactivate action should be handled by useUserQueries');
          break;
        case 'reactivate':
          // Reactivate functionality moved to useUserQueries
          console.warn('Reactivate action should be handled by useUserQueries');
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
    regeneratePassword,
    deleteUser,
  };
}
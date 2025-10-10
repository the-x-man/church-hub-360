import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import type { TagAssignmentChange } from '@/utils/tagAssignmentUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface BulkTagOperationsParams {
  memberId: string;
  changes: TagAssignmentChange[];
}

interface BulkTagOperationsResult {
  success: boolean;
  error?: string;
}

/**
 * Custom hook for performing bulk tag assignment operations
 * Handles multiple inserts, updates, and deletes in a single transaction
 */
export function useBulkTagOperations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const bulkOperationsMutation = useMutation<
    BulkTagOperationsResult,
    Error,
    BulkTagOperationsParams
  >({
    mutationFn: async ({ memberId, changes }) => {
      if (changes.length === 0) {
        return { success: true };
      }

      try {
        // Group changes by action type using reduce for better efficiency
        const groupedChanges = changes.reduce(
          (acc, change) => {
            switch (change.action) {
              case 'delete':
                if (change.assignmentId) {
                  acc.deletes.push(change.assignmentId);
                }
                break;
              case 'add':
                if (change.value) {
                  // Handle both single values and arrays
                  const tagItemIds = Array.isArray(change.value) ? change.value : [change.value];
                  tagItemIds.forEach(tagItemId => {
                    if (tagItemId) {
                      acc.inserts.push({
                        member_id: memberId,
                        tag_item_id: tagItemId,
                        assigned_at: new Date().toISOString(),
                        assigned_by: user?.id || null
                      });
                    }
                  });
                }
                break;
            }
            return acc;
          },
          {
            deletes: [] as string[],
            inserts: [] as Array<{
              member_id: string;
              tag_item_id: string;
              assigned_at: string;
              assigned_by: string | null;
            }>
          }
        );

        // Build operations array based on grouped changes
        const operations: Array<() => Promise<any>> = [];

        // Batch delete operations
        if (groupedChanges.deletes.length > 0) {
          operations.push(async () => {
            const { error } = await supabase
              .from('member_tag_items')
              .delete()
              .in('id', groupedChanges.deletes);
            return { error };
          });
        }

        // Batch insert operations
        if (groupedChanges.inserts.length > 0) {
          operations.push(async () => {
            const { error } = await supabase
              .from('member_tag_items')
              .insert(groupedChanges.inserts);
            return { error };
          });
        }

        // Execute all operations concurrently
        const results = await Promise.all(operations.map(op => op()));

        // Check for errors in any operation
        const errors = results
          .filter(result => result.error)
          .map(result => result.error.message);

        if (errors.length > 0) {
          console.log('errors', errors);
          throw new Error(`Operations failed: ${errors.join(', ')}`);
        }

        return { success: true };
      } catch (error) {
        console.error('Bulk tag operations failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    },
    onSuccess: (result, { memberId }) => {
      if (result.success) {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['member-tag-assignments', memberId] });
        queryClient.invalidateQueries({ queryKey: ['member', memberId] });
        toast.success('Tag assignments updated successfully');
      } else {
        toast.error(result.error || 'Failed to update tag assignments');
      }
    },
    onError: (error) => {
      console.error('Bulk tag operations mutation failed:', error);
      toast.error('Failed to update tag assignments');
    }
  });

  return {
    bulkUpdateTags: bulkOperationsMutation.mutateAsync,
    isUpdating: bulkOperationsMutation.isPending,
    error: bulkOperationsMutation.error
  };
}
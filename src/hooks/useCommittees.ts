import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Types for committee data
export interface Committee {
  id: string;
  organization_id: string;
  branch_id: string | null;
  name: string;
  description: string | null;
  type: 'temporal' | 'permanent';
  start_date: string | null;
  end_date: string | null;
  is_closed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_updated_by: string | null;
}

export interface CommitteeFormData {
  name: string;
  description?: string;
  type: 'temporal' | 'permanent';
  branch_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface CommitteeMember {
  id: string;
  committee_id: string;
  member_id: string;
  position: string | null;
  assigned_at: string;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
  // Member details from join
  member_full_name: string;
  member_email: string | null;
  member_phone: string | null;
  membership_id: string | null;
  membership_status: string;
  profile_image_url: string | null;
  member_is_active: boolean;
}

// Query keys
export const committeeKeys = {
  all: ['committees'] as const,
  lists: () => [...committeeKeys.all, 'list'] as const,
  list: (organizationId: string, branchId?: string) => 
    [...committeeKeys.lists(), organizationId, branchId] as const,
  details: () => [...committeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...committeeKeys.details(), id] as const,
  members: () => [...committeeKeys.all, 'members'] as const,
  committeeMembers: (committeeId: string) => 
    [...committeeKeys.members(), committeeId] as const,
};

/**
 * Hook to fetch committees for an organization
 */
export function useCommittees(branchId?: string) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: committeeKeys.list(currentOrganization?.id || '', branchId),
    queryFn: async (): Promise<Committee[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('committees')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single committee by ID
 */
export function useCommittee(committeeId: string | null) {
  return useQuery({
    queryKey: committeeKeys.detail(committeeId || ''),
    queryFn: async (): Promise<Committee | null> => {
      if (!committeeId) return null;

      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .eq('id', committeeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!committeeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch committee members
 */
export function useCommitteeMembers(committeeId: string | null) {
  return useQuery({
    queryKey: committeeKeys.committeeMembers(committeeId || ''),
    queryFn: async (): Promise<CommitteeMember[]> => {
      if (!committeeId) return [];

      const { data, error } = await supabase
        .from('committee_members_view')
        .select('*')
        .eq('committee_id', committeeId)
        .order('member_full_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!committeeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new committee
 */
export function useCreateCommittee() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (formData: CommitteeFormData): Promise<Committee> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('committees')
        .insert({
          organization_id: currentOrganization.id,
          branch_id: formData.branch_id || null,
          name: formData.name,
          description: formData.description || null,
          type: formData.type,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          is_closed: false,
          is_active: true,
          created_by: currentUser?.id || null,
          last_updated_by: currentUser?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate committees list
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
      toast.success('Committee created successfully');
    },
    onError: (error) => {
      console.error('Failed to create committee:', error);
      toast.error('Failed to create committee');
    },
  });
}

/**
 * Hook to update a committee
 */
export function useUpdateCommittee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      committeeId, 
      updates 
    }: { 
      committeeId: string; 
      updates: Partial<CommitteeFormData> 
    }): Promise<Committee> => {
      const { data, error } = await supabase
        .from('committees')
        .update({
          name: updates.name,
          description: updates.description || null,
          type: updates.type,
          branch_id: updates.branch_id || null,
          start_date: updates.start_date || null,
          end_date: updates.end_date || null,
        })
        .eq('id', committeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(data.id) });
      toast.success('Committee updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update committee:', error);
      toast.error('Failed to update committee');
    },
  });
}

/**
 * Hook to delete a committee
 */
export function useDeleteCommittee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (committeeId: string): Promise<void> => {
      const { error } = await supabase
        .from('committees')
        .update({ is_active: false })
        .eq('id', committeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate committees list
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
      toast.success('Committee deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete committee:', error);
      toast.error('Failed to delete committee');
    },
  });
}

/**
 * Hook to assign multiple members to a committee in bulk
 */
export function useBulkAssignMembersToCommittee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      committeeId,
      memberAssignments,
      createdBy,
    }: {
      committeeId: string;
      memberAssignments: Array<{
        memberId: string;
        position?: string;
      }>;
      createdBy: string;
    }): Promise<void> => {
      if (memberAssignments.length === 0) return;

      const { error } = await supabase
        .from('member_assigned_committees')
        .insert(
          memberAssignments.map(assignment => ({
            committee_id: committeeId,
            member_id: assignment.memberId,
            position: assignment.position || null,
            assigned_by: createdBy,
          }))
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate committee members
      queryClient.invalidateQueries({ 
        queryKey: committeeKeys.committeeMembers(variables.committeeId) 
      });
      toast.success(`${variables.memberAssignments.length} member(s) assigned to committee successfully`);
    },
    onError: (error) => {
      console.error('Failed to assign members to committee:', error);
      toast.error('Failed to assign members to committee');
    },
  });
}

/**
 * Hook to assign a member to a committee
 */
export function useAssignMemberToCommittee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      committeeId,
      memberId,
      position,
      createdBy,
    }: {
      committeeId: string;
      memberId: string;
      position?: string;
      createdBy: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('member_assigned_committees')
        .insert({
          committee_id: committeeId,
          member_id: memberId,
          position: position || null,
          assigned_by: createdBy,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate committee members
      queryClient.invalidateQueries({ 
        queryKey: committeeKeys.committeeMembers(variables.committeeId) 
      });
      toast.success('Member assigned to committee successfully');
    },
    onError: (error) => {
      console.error('Failed to assign member to committee:', error);
      toast.error('Failed to assign member to committee');
    },
  });
}

/**
 * Hook to remove a member from a committee
 */
export function useRemoveMemberFromCommittee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      committeeId,
      memberId,
    }: {
      committeeId: string;
      memberId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('member_assigned_committees')
        .delete()
        .eq('committee_id', committeeId)
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate committee members
      queryClient.invalidateQueries({ 
        queryKey: committeeKeys.committeeMembers(variables.committeeId) 
      });
      toast.success('Member removed from committee successfully');
    },
    onError: (error) => {
      console.error('Failed to remove member from committee:', error);
      toast.error('Failed to remove member from committee');
    },
  });
}

/**
 * Hook to update a member's position in a committee
 */
export function useUpdateMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      committeeId,
      memberId,
      position,
    }: {
      committeeId: string;
      memberId: string;
      position: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('member_assigned_committees')
        .update({ position })
        .eq('committee_id', committeeId)
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate committee members
      queryClient.invalidateQueries({ 
        queryKey: committeeKeys.committeeMembers(variables.committeeId) 
      });
      toast.success('Member position updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update member position:', error);
      toast.error('Failed to update member position');
    },
  });
}

/**
 * Hook to close a committee
 */
export function useCloseCommittee() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (committeeId: string): Promise<Committee> => {
      const { data, error } = await supabase
        .from('committees')
        .update({ is_closed: true, last_updated_by: user?.id })
        .eq('id', committeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(data.id) });
      toast.success('Committee closed successfully');
    },
    onError: (error) => {
      console.error('Failed to close committee:', error);
      toast.error('Failed to close committee');
    },
  });
}
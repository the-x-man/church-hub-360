import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Types for group data
export interface Group {
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

export interface GroupFormData {
  name: string;
  description?: string;
  type: 'temporal' | 'permanent';
  branch_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
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
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (organizationId: string, branchId?: string) => 
    [...groupKeys.lists(), organizationId, branchId] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  members: () => [...groupKeys.all, 'members'] as const,
  groupMembers: (groupId: string) => 
    [...groupKeys.members(), groupId] as const,
};

/**
 * Hook to fetch groups for an organization
 */
export function useGroups(branchId?: string) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: groupKeys.list(currentOrganization?.id || '', branchId),
    queryFn: async (): Promise<Group[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('groups')
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
 * Hook to fetch a single group by ID
 */
export function useGroup(groupId: string | null) {
  return useQuery({
    queryKey: groupKeys.detail(groupId || ''),
    queryFn: async (): Promise<Group | null> => {
      if (!groupId) return null;

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch group members
 */
export function useGroupMembers(groupId: string | null) {
  return useQuery({
    queryKey: groupKeys.groupMembers(groupId || ''),
    queryFn: async (): Promise<GroupMember[]> => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('group_members_view')
        .select('*')
        .eq('group_id', groupId)
        .order('member_full_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new group
 */
export function useCreateGroup() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (formData: GroupFormData): Promise<Group> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('groups')
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
      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      toast.success('Group created successfully');
    },
    onError: (error) => {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group');
    },
  });
}

/**
 * Hook to update a group
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      groupId, 
      updates 
    }: { 
      groupId: string; 
      updates: Partial<GroupFormData> 
    }): Promise<Group> => {
      const { data, error } = await supabase
        .from('groups')
        .update({
          name: updates.name,
          description: updates.description || null,
          type: updates.type,
          branch_id: updates.branch_id || null,
          start_date: updates.start_date || null,
          end_date: updates.end_date || null,
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(data.id) });
      toast.success('Group updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update group:', error);
      toast.error('Failed to update group');
    },
  });
}

/**
 * Hook to delete a group
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string): Promise<void> => {
      const { error } = await supabase
        .from('groups')
        .update({ is_active: false })
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      toast.success('Group deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group');
    },
  });
}

/**
 * Hook to assign multiple members to a group in bulk
 */
export function useBulkAssignMembersToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      memberAssignments,
      createdBy,
    }: {
      groupId: string;
      memberAssignments: Array<{
        memberId: string;
        position?: string;
      }>;
      createdBy: string;
    }): Promise<void> => {
      if (memberAssignments.length === 0) return;

      const { error } = await supabase
        .from('member_assigned_groups')
        .insert(
          memberAssignments.map(assignment => ({
            group_id: groupId,
            member_id: assignment.memberId,
            position: assignment.position || null,
            assigned_by: createdBy,
          }))
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate group members
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.groupMembers(variables.groupId) 
      });
      toast.success(`${variables.memberAssignments.length} member(s) assigned to group successfully`);
    },
    onError: (error) => {
      console.error('Failed to assign members to group:', error);
      toast.error('Failed to assign members to group');
    },
  });
}

/**
 * Hook to assign a member to a group
 */
export function useAssignMemberToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      memberId,
      position,
      createdBy,
    }: {
      groupId: string;
      memberId: string;
      position?: string;
      createdBy: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('member_assigned_groups')
        .insert({
          group_id: groupId,
          member_id: memberId,
          position: position || null,
          assigned_by: createdBy,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate group members
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.groupMembers(variables.groupId) 
      });
      toast.success('Member assigned to group successfully');
    },
    onError: (error) => {
      console.error('Failed to assign member to group:', error);
      toast.error('Failed to assign member to group');
    },
  });
}

/**
 * Hook to remove a member from a group
 */
export function useRemoveMemberFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      memberId,
    }: {
      groupId: string;
      memberId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('member_assigned_groups')
        .delete()
        .eq('group_id', groupId)
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate group members
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.groupMembers(variables.groupId) 
      });
      toast.success('Member removed from group successfully');
    },
    onError: (error) => {
      console.error('Failed to remove member from group:', error);
      toast.error('Failed to remove member from group');
    },
  });
}

/**
 * Hook to update a member's position in a group
 */
export function useUpdateMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      memberId,
      position,
    }: {
      groupId: string;
      memberId: string;
      position: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('member_assigned_groups')
        .update({ position })
        .eq('group_id', groupId)
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate group members
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.groupMembers(variables.groupId) 
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
 * Hook to close a group
 */
export function useCloseGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId: string): Promise<Group> => {
      const { data, error } = await supabase
        .from('groups')
        .update({ is_closed: true, last_updated_by: user?.id })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(data.id) });
      toast.success('Group closed successfully');
    },
    onError: (error) => {
      console.error('Failed to close group:', error);
      toast.error('Failed to close group');
    },
  });
}
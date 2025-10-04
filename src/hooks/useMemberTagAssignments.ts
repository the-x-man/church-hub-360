import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

export interface MemberTagAssignment {
  id: string;
  member_id: string;
  tag_item_id: string;
  assigned_at: string;
  assigned_by?: string;
  tag_item: {
    id: string;
    name: string;
    description?: string;
    color: string;
    tag_id: string;
    tag: {
      id: string;
      name: string;
      component_style: string;
      is_required: boolean;
    };
  };
}

export interface CreateMemberTagAssignmentData {
  member_id: string;
  tag_item_id: string;
}

export interface MemberTagAssignmentsByTag {
  [tagId: string]: string[]; // tag_item_ids
}

export function useMemberTagAssignments(memberId?: string) {
  const queryClient = useQueryClient();

  // Fetch member tag assignments
  const {
    data: assignments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['member-tag-assignments', memberId],
    queryFn: async () => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('member_tag_items')
        .select(`
          id,
          member_id,
          tag_item_id,
          assigned_at,
          assigned_by,
          tag_item:tag_items (
            id,
            name,
            description,
            color,
            tag_id,
            tag:tags (
              id,
              name,
              component_style,
              is_required
            )
          )
        `)
        .eq('member_id', memberId);

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map((item: any) => ({
        id: item.id,
        member_id: item.member_id,
        tag_item_id: item.tag_item_id,
        assigned_at: item.assigned_at,
        assigned_by: item.assigned_by,
        tag_item: {
          id: item.tag_item.id,
          name: item.tag_item.name,
          description: item.tag_item.description,
          color: item.tag_item.color,
          tag_id: item.tag_item.tag_id,
          tag: {
            id: item.tag_item.tag.id,
            name: item.tag_item.tag.name,
            component_style: item.tag_item.tag.component_style,
            is_required: item.tag_item.tag.is_required,
          }
        }
      })) as MemberTagAssignment[];
    },
    enabled: !!memberId,
  });

  // Group assignments by tag for easier form handling
  const assignmentsByTag: MemberTagAssignmentsByTag = assignments.reduce((acc, assignment) => {
    const tagId = assignment.tag_item.tag_id;
    if (!acc[tagId]) {
      acc[tagId] = [];
    }
    acc[tagId].push(assignment.tag_item_id);
    return acc;
  }, {} as MemberTagAssignmentsByTag);

  // Create tag assignment
  const createAssignment = useMutation({
    mutationFn: async (data: CreateMemberTagAssignmentData) => {
      const { data: result, error } = await supabase
        .from('member_tag_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-tag-assignments', memberId] });
    },
  });

  // Delete tag assignment
  const deleteAssignment = useMutation({
    mutationFn: async ({ memberId, tagItemId }: { memberId: string; tagItemId: string }) => {
      const { error } = await supabase
        .from('member_tag_items')
        .delete()
        .eq('member_id', memberId)
        .eq('tag_item_id', tagItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-tag-assignments', memberId] });
    },
  });

  // Bulk create tag assignments for a member
  const bulkCreateAssignments = useMutation({
    mutationFn: async ({ 
      memberId, 
      tagItemIds 
    }: { 
      memberId: string; 
      tagItemIds: string[] 
    }) => {
      if (tagItemIds.length === 0) return [];

      const { data, error } = await supabase
        .from('member_tag_items')
        .insert(
          tagItemIds.map(tagItemId => ({
            member_id: memberId,
            tag_item_id: tagItemId,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-tag-assignments', memberId] });
    },
  });

  // Update tag assignments for a specific tag (replace all assignments for that tag)
  const updateTagAssignments = useMutation({
    mutationFn: async ({ 
      memberId, 
      tagId, 
      tagItemIds 
    }: { 
      memberId: string; 
      tagId: string; 
      tagItemIds: string[] 
    }) => {
      // First, delete existing assignments for this tag
      const { error: deleteError } = await supabase
        .from('member_tag_items')
        .delete()
        .eq('member_id', memberId)
        .in('tag_item_id', 
          await supabase
            .from('tag_items')
            .select('id')
            .eq('tag_id', tagId)
            .then(({ data }) => data?.map(item => item.id) || [])
        );

      if (deleteError) throw deleteError;

      // Then, create new assignments
      if (tagItemIds.length > 0) {
        const { error: insertError } = await supabase
          .from('member_tag_items')
          .insert(
            tagItemIds.map(tagItemId => ({
              member_id: memberId,
              tag_item_id: tagItemId,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-tag-assignments', memberId] });
    },
  });

  return {
    assignments,
    assignmentsByTag,
    isLoading,
    error,
    createAssignment: createAssignment.mutateAsync,
    bulkCreateAssignments: bulkCreateAssignments.mutateAsync,
    deleteAssignment: deleteAssignment.mutateAsync,
    updateTagAssignments: updateTagAssignments.mutateAsync,
  };
}
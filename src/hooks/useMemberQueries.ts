import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type {
  Member,
  MemberSummary,
  CreateMemberData,
  UpdateMemberData,
  MemberFilters,
  MemberStatistics,
} from '../types/members';
import type { MembershipStatus } from '../types/members';

// Query Keys
export const memberKeys = {
  all: ['members'] as const,
  organizationMembers: (organizationId: string) => 
    [...memberKeys.all, 'organization', organizationId] as const,
  branchMembers: (branchId: string) => 
    [...memberKeys.all, 'branch', branchId] as const,
  member: (id: string) => [...memberKeys.all, 'detail', id] as const,
  membersSummary: (organizationId: string) => 
    [...memberKeys.all, 'summary', organizationId] as const,
  membersStatistics: (organizationId: string) => 
    [...memberKeys.all, 'statistics', organizationId] as const,
  filteredMembers: (organizationId: string, filters: MemberFilters) => 
    [...memberKeys.organizationMembers(organizationId), 'filtered', filters] as const,
};

// Hook to fetch members with pagination and filtering
export function useMembers(
  organizationId: string | undefined,
  filters?: MemberFilters,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: memberKeys.filteredMembers(organizationId || '', filters || {}),
    queryFn: async (): Promise<{ members: Member[]; total: number }> => {
      if (!organizationId) throw new Error('Organization ID is required');

      // Check if we need to filter by tags
      const hasTagFilter = filters?.tag_items && filters.tag_items.length > 0;

      let query;
      
      if (hasTagFilter && filters.tag_items) {
        // Use a more complex query with joins when filtering by tags
        const tagFilterMode = filters.tag_filter_mode || 'any';
        
        if (tagFilterMode === 'all') {
          // For 'all' mode, we need members who have ALL specified tags
          // Try to use RPC function first, fallback to manual filtering
          try {
            const { data: memberIds, error: tagError } = await supabase
              .rpc('get_members_with_all_tags', {
                p_organization_id: organizationId,
                p_tag_item_ids: filters.tag_items
              });

            if (tagError) throw tagError;

            // Use RPC result
            if (!memberIds || memberIds.length === 0) {
              return { members: [], total: 0 };
            }
            
            query = supabase
              .from('members')
              .select('*', { count: 'exact' })
              .eq('organization_id', organizationId)
              .in('id', memberIds);
          } catch (rpcError) {
            // Fallback to manual filtering if RPC doesn't exist
            const { data: tagAssignments, error: fallbackError } = await supabase
              .from('member_tag_items')
              .select('member_id')
              .in('tag_item_id', filters.tag_items);

            if (fallbackError) throw fallbackError;

            // Group by member_id and count occurrences
            const memberTagCounts = tagAssignments?.reduce((acc, assignment) => {
              acc[assignment.member_id] = (acc[assignment.member_id] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {};

            // Filter members who have all required tags
            const validMemberIds = Object.entries(memberTagCounts)
              .filter(([_, count]) => count === filters.tag_items!.length)
              .map(([memberId]) => memberId);

            if (validMemberIds.length === 0) {
              return { members: [], total: 0 };
            }

            query = supabase
              .from('members')
              .select('*', { count: 'exact' })
              .eq('organization_id', organizationId)
              .in('id', validMemberIds);
          }
        } else {
          // For 'any' mode, use inner join to get members with any of the specified tags
          query = supabase
            .from('members')
            .select(`
              *,
              member_tag_items!inner(tag_item_id)
            `, { count: 'exact' })
            .eq('organization_id', organizationId)
            .in('member_tag_items.tag_item_id', filters.tag_items);
        }
      } else {
        // Standard query without tag filtering
        query = supabase
          .from('members')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId);
      }

      // Apply other filters
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,membership_id.ilike.%${filters.search}%`);
      }

      if (filters?.membership_status) {
        query = query.eq('membership_status', filters.membership_status);
      }

      if (filters?.membership_type) {
        query = query.eq('membership_type', filters.membership_type);
      }

      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      if (filters?.gender) {
        query = query.eq('gender', filters.gender);
      }

      if (filters?.age_range?.min !== undefined || filters?.age_range?.max !== undefined) {
        const currentDate = new Date();
        if (filters.age_range?.max !== undefined) {
          const minBirthDate = new Date(currentDate.getFullYear() - filters.age_range.max - 1, currentDate.getMonth(), currentDate.getDate());
          query = query.gte('date_of_birth', minBirthDate.toISOString().split('T')[0]);
        }
        if (filters.age_range?.min !== undefined) {
          const maxBirthDate = new Date(currentDate.getFullYear() - filters.age_range.min, currentDate.getMonth(), currentDate.getDate());
          query = query.lte('date_of_birth', maxBirthDate.toISOString().split('T')[0]);
        }
      }

      if (filters?.date_joined_range?.start) {
        query = query.gte('date_joined', filters.date_joined_range.start);
      }

      if (filters?.date_joined_range?.end) {
        query = query.lte('date_joined', filters.date_joined_range.end);
      }

      // Apply sorting
      const sortField = filters?.sort_field || 'last_name';
      const sortOrder = filters?.sort_order || 'asc';
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Clean up the data if we used joins (remove nested objects)
      const cleanedData = hasTagFilter && filters.tag_filter_mode === 'any' 
        ? data?.map(member => {
            const { member_tag_items, ...cleanMember } = member as any;
            return cleanMember;
          })
        : data;

      return { members: cleanedData || [], total: count || 0 };
    },
    enabled: !!organizationId,
  });
}

// Hook for member search in attendance context
export function useAttendanceMemberSearch(
  organizationId: string | undefined,
  searchTerm: string,
  searchMode?: 'phone' | 'email' | 'membershipId' | 'all'
) {
  return useQuery({
    queryKey: [...memberKeys.organizationMembers(organizationId || ''), 'attendance-search', searchTerm, searchMode],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');
      if (!searchTerm.trim()) return [];

      const searchLower = searchTerm.toLowerCase();
      
      let query = supabase
        .from('members')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(50);

      // Apply search based on mode
      switch (searchMode) {
        case 'phone':
          query = query.ilike('phone', `%${searchLower}%`);
          break;
        case 'email':
          query = query.ilike('email', `%${searchLower}%`);
          break;
        case 'membershipId':
          query = query.ilike('membership_id', `%${searchLower}%`);
          break;
        default:
          // Search across all fields
          query = query.or(`first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,full_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,phone.ilike.%${searchLower}%,membership_id.ilike.%${searchLower}%`);
      }

      // Limit results for performance
      query = query.limit(50);

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform MemberSummary to AttendanceMemberResult format
      return (data || []).map(member => ({
        ...member,
        // Add any additional fields needed for AttendanceMemberResult
        tags: [], // TODO: Fetch member tags if needed
        attendance_status: 'not_marked' as const,
        last_attendance: undefined,
      }));
    },
    enabled: !!organizationId && !!searchTerm.trim(),
    staleTime: 30000, // Cache for 30 seconds
  });
}

// Hook to fetch members summary (for card/table views)
export function useMembersSummary(organizationId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.membersSummary(organizationId || ''),
    queryFn: async (): Promise<MemberSummary[]> => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('members_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .order('last_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

// Hook to fetch members summary with pagination and filtering
export function useMembersSummaryPaginated(
  organizationId: string | undefined,
  filters?: MemberFilters,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: memberKeys.filteredMembers(organizationId || '', filters || {}),
    queryFn: async (): Promise<{ members: MemberSummary[]; total: number }> => {
      if (!organizationId) throw new Error('Organization ID is required');

      // Check if we need to filter by tags
      const hasTagFilter = filters?.tag_items && filters.tag_items.length > 0;

      let query;
      
      if (hasTagFilter && filters.tag_items) {
        // Use a more complex query with joins when filtering by tags
        const tagFilterMode = filters.tag_filter_mode || 'any';
        
        if (tagFilterMode === 'all') {
          // For 'all' mode, we need members who have ALL specified tags
          // Try to use RPC function first, fallback to manual filtering
          try {
            const { data: memberIds, error: tagError } = await supabase
              .rpc('get_members_with_all_tags', {
                p_organization_id: organizationId,
                p_tag_item_ids: filters.tag_items
              });

            if (tagError) throw tagError;

            // Use RPC result
            if (!memberIds || memberIds.length === 0) {
              return { members: [], total: 0 };
            }
            
            query = supabase
              .from('members_summary')
              .select('*', { count: 'exact' })
              .eq('organization_id', organizationId)
              .in('id', memberIds);
          } catch (rpcError) {
            // Fallback to manual filtering if RPC doesn't exist
            const { data: tagAssignments, error: fallbackError } = await supabase
              .from('member_tag_items')
              .select('member_id')
              .in('tag_item_id', filters.tag_items);

            if (fallbackError) throw fallbackError;

            // Group by member_id and count occurrences
            const memberTagCounts = tagAssignments?.reduce((acc, assignment) => {
              acc[assignment.member_id] = (acc[assignment.member_id] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {};

            // Filter members who have all required tags
            const validMemberIds = Object.entries(memberTagCounts)
              .filter(([_, count]) => count === filters.tag_items!.length)
              .map(([memberId]) => memberId);

            if (validMemberIds.length === 0) {
              return { members: [], total: 0 };
            }

            query = supabase
              .from('members_summary')
              .select('*', { count: 'exact' })
              .eq('organization_id', organizationId)
              .in('id', validMemberIds);
          }
        } else {
          // For 'any' mode, we can use a simpler join
          query = supabase
            .from('members_summary')
            .select(`
              *,
              member_tag_items!inner(
                tag_item_id
              )
            `, { count: 'exact' })
            .eq('organization_id', organizationId)
            .in('member_tag_items.tag_item_id', filters.tag_items);
        }
      } else {
        // Standard query without tag filtering
        query = supabase
          .from('members_summary')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId);
      }

      // Apply other filters
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,membership_id.ilike.%${filters.search}%`);
      }

      if (filters?.membership_status && filters.membership_status !== 'all') {
        query = query.eq('membership_status', filters.membership_status);
      }

      if (filters?.branch_id && filters.branch_id !== 'all') {
        query = query.eq('branch_id', filters.branch_id);
      }

      if (filters?.membership_type && filters.membership_type !== 'all') {
        query = query.eq('membership_type', filters.membership_type);
      }

      if (filters?.gender && filters.gender !== 'all') {
        query = query.eq('gender', filters.gender);
      }

      if (filters?.age_range?.min) {
        query = query.gte('age', filters.age_range.min);
      }

      if (filters?.age_range?.max) {
        query = query.lte('age', filters.age_range.max);
      }

      if (filters?.date_joined_range?.start) {
        query = query.gte('date_joined', filters.date_joined_range.start);
      }

      if (filters?.date_joined_range?.end) {
        query = query.lte('date_joined', filters.date_joined_range.end);
      }

      if (filters?.is_active !== undefined && filters.is_active !== 'all') {
        query = query.eq('is_active', filters.is_active);
      }

      // Apply sorting
      const sortField = filters?.sort_field || 'last_name';
      const sortOrder = filters?.sort_order || 'asc';
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Clean up the data if we used joins (remove nested objects)
      const cleanedData = hasTagFilter && filters.tag_filter_mode === 'any' 
        ? data?.map(member => {
            const { member_tag_items, ...cleanMember } = member as any;
            return cleanMember;
          })
        : data;

      return { members: cleanedData || [], total: count || 0 };
    },
    enabled: !!organizationId,
  });
}

// Hook to fetch a single member by ID
export function useMember(memberId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.member(memberId || ''),
    queryFn: async (): Promise<Member> => {
      if (!memberId) throw new Error('Member ID is required');

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });
}

// Hook to fetch member statistics
export function useMemberStatistics(organizationId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.membersStatistics(organizationId || ''),
    queryFn: async (): Promise<MemberStatistics> => {
      if (!organizationId) throw new Error('Organization ID is required');

      
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('membership_status, gender, date_of_birth, date_joined, branch_id')
          .eq('organization_id', organizationId);

        if (membersError) throw membersError;

        // Calculate members by status
        const membersByStatus: Record<MembershipStatus, number> = {
          active: members?.filter(m => m.membership_status === 'active').length || 0,
          inactive: members?.filter(m => m.membership_status === 'inactive').length || 0,
          pending: members?.filter(m => m.membership_status === 'pending').length || 0,
          suspended: members?.filter(m => m.membership_status === 'suspended').length || 0,
          transferred: members?.filter(m => m.membership_status === 'transferred').length || 0,
          deceased: members?.filter(m => m.membership_status === 'deceased').length || 0,
        };

        // Calculate members by gender
        const membersByGender: Record<string, number> = {
          male: members?.filter(m => m.gender === 'male').length || 0,
          female: members?.filter(m => m.gender === 'female').length || 0,
          other: members?.filter(m => m.gender === 'other').length || 0,
          prefer_not_to_say: members?.filter(m => m.gender === 'prefer_not_to_say').length || 0,
        };

        // Calculate members by branch
        const membersByBranch: Record<string, number> = {};
        members?.forEach(member => {
          if (member.branch_id) {
            membersByBranch[member.branch_id] = (membersByBranch[member.branch_id] || 0) + 1;
          }
        });

        // Calculate members by age group
        const membersByAgeGroup: Record<string, number> = {
          '0-17': 0,
          '18-30': 0,
          '31-50': 0,
          '51-70': 0,
          '71+': 0,
        };

        members?.forEach(member => {
          if (member.date_of_birth) {
            const age = new Date().getFullYear() - new Date(member.date_of_birth).getFullYear();
            if (age <= 17) membersByAgeGroup['0-17']++;
            else if (age <= 30) membersByAgeGroup['18-30']++;
            else if (age <= 50) membersByAgeGroup['31-50']++;
            else if (age <= 70) membersByAgeGroup['51-70']++;
            else membersByAgeGroup['71+']++;
          }
        });

        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();

        const stats: MemberStatistics = {
          total_members: members?.length || 0,
          active_members: membersByStatus.active,
          inactive_members: membersByStatus.inactive,
          new_members_this_month: members?.filter(m => {
            if (!m.date_joined) return false;
            const joinDate = new Date(m.date_joined);
            return joinDate.getMonth() === thisMonth && joinDate.getFullYear() === thisYear;
          }).length || 0,
          new_members_this_year: members?.filter(m => {
            if (!m.date_joined) return false;
            const joinDate = new Date(m.date_joined);
            return joinDate.getFullYear() === thisYear;
          }).length || 0,
          members_by_status: membersByStatus,
          members_by_branch: membersByBranch,
          members_by_age_group: membersByAgeGroup,
          members_by_gender: membersByGender,
        };

        return stats;
    },
    enabled: !!organizationId,
  });
}

// Hook to create a new member
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMemberData): Promise<Member> => {
      const { form_data, ...memberData } = data;

      const { data: member, error } = await supabase
        .from('members')
        .insert({
          ...memberData,
          form_data: form_data || {},
        })
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: (data) => {
      // Invalidate and refetch organization members
      queryClient.invalidateQueries({
        queryKey: memberKeys.organizationMembers(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: memberKeys.membersSummary(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: memberKeys.membersStatistics(data.organization_id),
      });
      if (data.branch_id) {
        queryClient.invalidateQueries({
          queryKey: memberKeys.branchMembers(data.branch_id),
        });
      }
    },
  });
}

// Hook to update a member
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMemberData): Promise<Member> => {
      const { id, form_data, ...memberData } = data;

      const updateData: any = { ...memberData };
      if (form_data !== undefined) {
        updateData.form_data = form_data;
      }

      const { data: member, error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: memberKeys.organizationMembers(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: memberKeys.member(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: memberKeys.membersSummary(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: memberKeys.membersStatistics(data.organization_id),
      });
      if (data.branch_id) {
        queryClient.invalidateQueries({
          queryKey: memberKeys.branchMembers(data.branch_id),
        });
      }
    },
  });
}

// Hook to delete a member
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all member queries
      queryClient.invalidateQueries({
        queryKey: memberKeys.all,
      });
    },
  });
}

// Hook to toggle member status
export function useToggleMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: MembershipStatus }): Promise<Member> => {
      const { data: member, error } = await supabase
        .from('members')
        .update({ membership_status: status })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: memberKeys.organizationMembers(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: memberKeys.member(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: memberKeys.membersSummary(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: memberKeys.membersStatistics(data.organization_id),
      });
    },
  });
}

// Hook to bulk update members
export function useBulkUpdateMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberIds, updates }: { memberIds: string[]; updates: Partial<Member> }): Promise<Member[]> => {
      const { data: members, error } = await supabase
        .from('members')
        .update(updates)
        .in('id', memberIds)
        .select();

      if (error) throw error;
      return members || [];
    },
    onSuccess: () => {
      // Invalidate all member queries
      queryClient.invalidateQueries({
        queryKey: memberKeys.all,
      });
    },
  });
}

// Hook to export members data
export function useExportMembers() {
  return useMutation({
    mutationFn: async ({ organizationId, filters, format }: { 
      organizationId: string; 
      filters?: MemberFilters; 
      format: 'csv' | 'excel' | 'pdf' 
    }): Promise<Blob> => {
      // This would typically call a backend endpoint that generates the export
      // For now, we'll create a simple CSV export
      let query = supabase
        .from('members')
        .select('*')
        .eq('organization_id', organizationId);

      // Apply same filters as in useMembers
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.membership_status) {
        query = query.eq('membership_status', filters.membership_status);
      }

      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Generate export based on format
      if (format === 'csv') {
        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Membership Status', 'Join Date'];
        const csvContent = [
          headers.join(','),
          ...(data || []).map(member => [
            member.first_name,
            member.last_name,
            member.email || '',
            member.phone || '',
            member.membership_status,
            member.date_joined || ''
          ].join(','))
        ].join('\n');

        return new Blob([csvContent], { type: 'text/csv' });
      } else {
        // For now, default to CSV for other formats
        // TODO: Implement Excel and PDF export
        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Membership Status', 'Join Date'];
        const csvContent = [
          headers.join(','),
          ...(data || []).map(member => [
            member.first_name,
            member.last_name,
            member.email || '',
            member.phone || '',
            member.membership_status,
            member.date_joined || ''
          ].join(','))
        ].join('\n');

        return new Blob([csvContent], { type: 'text/csv' });
      }
    },
  });
}
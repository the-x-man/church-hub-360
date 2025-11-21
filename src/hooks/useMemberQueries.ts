import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { DEFAULT_AGE_GROUPS, formatAgeGroupLabel } from '@/constants/defaultAgeGroups';
import type {
  Member,
  MemberSummary,
  CreateMemberData,
  UpdateMemberData,
  MemberFilters,
  MemberStatistics,
} from '../types/members';
import type { MembershipStatus } from '../types/members';
  // Import SortConfig type
import type { SortConfig } from '../components/people/members/SortBar';
import { useBranchScope, applyBranchScope } from '@/hooks/useBranchScope';

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
  filteredMembers: (organizationId: string, filters: MemberFilters, sortConfig?: SortConfig | null) => 
    [...memberKeys.organizationMembers(organizationId), 'filtered', filters, sortConfig] as const,
  paginatedMembers: (organizationId: string, filters: MemberFilters, page: number, pageSize: number, sortConfig?: SortConfig | null) => 
    [...memberKeys.organizationMembers(organizationId), 'paginated', filters, page, pageSize, sortConfig] as const,
};

// Hook to fetch members with pagination and filtering
export function useMembers(
  organizationId: string | undefined,
  filters?: MemberFilters,
  page: number = 1,
  pageSize: number = 20,
  sortConfig?: SortConfig | null,
) {
  const scope = useBranchScope(organizationId);
  return useQuery({
    queryKey: [
      ...memberKeys.filteredMembers(organizationId || '', filters || {}, sortConfig),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all'
    ],
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

      {
        const scoped = applyBranchScope(query, scope, 'branch_id');
        if (scoped.abortIfEmpty) return { members: [], total: 0 };
        query = scoped.query;
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

      // Apply sorting - use sortConfig if provided, otherwise fall back to filters or defaults
      let sortField = 'full_name'; // Default sort field
      let sortOrder: 'asc' | 'desc' = 'asc'; // Default sort order
      
      if (sortConfig) {
        sortField = sortConfig.field;
        sortOrder = sortConfig.direction;
      } else if (filters?.sort_field) {
        // Fallback to legacy filter-based sorting
        sortField = filters.sort_field;
        sortOrder = filters.sort_order || 'asc';
      }
      
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Clean up the data if we used joins (remove nested objects)
      const cleanedData = hasTagFilter && filters.tag_filter_mode === 'any' 
        ? data?.map((member: any) => {
            const { member_tag_items, ...cleanMember } = member as any;
            return cleanMember;
          })
        : data;

      return { members: cleanedData || [], total: count || 0 };
    },
    enabled: !!organizationId,
  });
}


// Hook to fetch members summary (for card/table views)
export function useMembersSummary(organizationId: string | undefined) {
  const scope = useBranchScope(organizationId);
  return useQuery({
    queryKey: [
      ...memberKeys.membersSummary(organizationId || ''),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all'
    ],
    queryFn: async (): Promise<MemberSummary[]> => {
      if (!organizationId) throw new Error('Organization ID is required');

      let query: any = supabase
        .from('members_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .order('last_name');

      {
        const scoped = applyBranchScope(query, scope, 'branch_id');
        if (scoped.abortIfEmpty) return [];
        query = scoped.query;
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

// Hook to fetch all filtered members (for export purposes)
export function useMembersSummaryFiltered(
  organizationId: string | undefined,
  filters?: MemberFilters,
  sortConfig?: SortConfig | null
) {
  const scope = useBranchScope(organizationId);
  return useQuery({
    queryKey: [
      ...memberKeys.filteredMembers(organizationId || '', filters || {}, sortConfig),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all'
    ],
    queryFn: async (): Promise<MemberSummary[]> => {
      if (!organizationId) throw new Error('Organization ID is required');

      // Start with the base query using the enhanced members_summary view
      let query = supabase
        .from('members_summary')
        .select('*')
        .eq('organization_id', organizationId);

      // Apply other filters first
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,membership_id.ilike.%${filters.search}%`);
      }

      if (filters?.membership_status && filters.membership_status !== 'all') {
        query = query.eq('membership_status', filters.membership_status);
      }

      if (filters?.branch_id && filters.branch_id !== 'all') {
        query = query.eq('branch_id', filters.branch_id);
      }

      {
        const scoped = applyBranchScope(query, scope, 'branch_id');
        if (scoped.abortIfEmpty) return [];
        query = scoped.query;
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

      // Apply tag filtering using the new tags_array column for better performance
      if (filters?.tag_items && filters.tag_items.length > 0) {
        // First, get the tag item names from the IDs
        const { data: tagItems, error: tagError } = await supabase
          .from('tag_items')
          .select('id, name')
          .in('id', filters.tag_items);

        if (tagError) throw tagError;

        const tagNames = tagItems?.map(item => item.name) || [];
        
        if (tagNames.length > 0) {
          const tagFilterMode = filters.tag_filter_mode || 'any';
          
          if (tagFilterMode === 'any') {
            // OR logic: member must have at least one of the selected tags
            // Using PostgreSQL array overlap operator (&&)
            query = query.overlaps('tags_array', tagNames);
          } else {
            // AND logic: member must have all selected tags
            // Using PostgreSQL array contains operator (@>)
            query = query.contains('tags_array', tagNames);
          }
        }
      }

      // Apply sorting - use sortConfig if provided, otherwise fall back to filters or defaults
      let sortField = 'full_name'; // Default sort field
      let sortOrder: 'asc' | 'desc' = 'asc'; // Default sort order
      
      if (sortConfig) {
        sortField = sortConfig.field;
        sortOrder = sortConfig.direction;
      } else if (filters?.sort_field) {
        // Fallback to legacy filter-based sorting
        sortField = filters.sort_field;
        sortOrder = filters.sort_order || 'asc';
      }
      
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

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
    pageSize: number = 20,
    sortConfig?: SortConfig | null
  ) {
  const scope = useBranchScope(organizationId);
  return useQuery({
    queryKey: [
      ...memberKeys.paginatedMembers(organizationId || '', filters || {}, page, pageSize, sortConfig),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all'
    ],
    queryFn: async (): Promise<{ members: MemberSummary[]; total: number }> => {
      if (!organizationId) throw new Error('Organization ID is required');

      // Start with the base query using the enhanced members_summary view
      let query = supabase
        .from('members_summary')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId);

      // Apply other filters first
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,membership_id.ilike.%${filters.search}%`);
      }

      if (filters?.membership_status && filters.membership_status !== 'all') {
        query = query.eq('membership_status', filters.membership_status);
      }

      if (filters?.branch_id && filters.branch_id !== 'all') {
        query = query.eq('branch_id', filters.branch_id);
      }

      {
        const scoped = applyBranchScope(query, scope, 'branch_id');
        if (scoped.abortIfEmpty) return { members: [], total: 0 };
        query = scoped.query;
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

      // Apply tag filtering using the new tags_array column for better performance
      if (filters?.tag_items && filters.tag_items.length > 0) {
        // First, get the tag item names from the IDs
        const { data: tagItems, error: tagError } = await supabase
          .from('tag_items')
          .select('id, name')
          .in('id', filters.tag_items);

        if (tagError) throw tagError;

        const tagNames = tagItems?.map(item => item.name) || [];
        
        if (tagNames.length > 0) {
          const tagFilterMode = filters.tag_filter_mode || 'any';
          
          if (tagFilterMode === 'any') {
            // OR logic: member must have at least one of the selected tags
            // Using PostgreSQL array overlap operator (&&)
            query = query.overlaps('tags_array', tagNames);
          } else {
            // AND logic: member must have all selected tags
            // Using PostgreSQL array contains operator (@>)
            query = query.contains('tags_array', tagNames);
          }
        }
      }

      // Apply sorting - use sortConfig if provided, otherwise fall back to filters or defaults
      let sortField = 'full_name'; // Default sort field
      let sortOrder: 'asc' | 'desc' = 'asc'; // Default sort order
      
      if (sortConfig) {
        sortField = sortConfig.field;
        sortOrder = sortConfig.direction;
      } else if (filters?.sort_field) {
        // Fallback to legacy filter-based sorting
        sortField = filters.sort_field;
        sortOrder = filters.sort_order || 'asc';
      }
      
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination AFTER all filtering (including tag filtering)
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return { 
        members: data || [], 
        total: count || 0
      };
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
export function useMemberStatistics(organizationId: string | undefined, branchId?: string) {
  const scope = useBranchScope(organizationId);
  return useQuery({
    queryKey: [
      ...memberKeys.membersStatistics(organizationId || ''),
      'branch',
      branchId || 'all',
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all',
    ],
    queryFn: async (): Promise<MemberStatistics> => {
      if (!organizationId) throw new Error('Organization ID is required');

      
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('membership_status, gender, date_of_birth, date_joined, branch_id')
          .eq('organization_id', organizationId);

      if (membersError) throw membersError;

      let scopedMembers = members || [];
      if (branchId) {
        scopedMembers = scopedMembers.filter((m: any) => m.branch_id === branchId);
      } else if (scope.isScoped) {
        scopedMembers = scope.branchIds.length > 0
          ? scopedMembers.filter((m: any) => scope.branchIds.includes(m.branch_id))
          : [];
      }

        // Fetch age group configuration (fallback to defaults if not present)
        let configAgeGroups: { name: string; min_age: number; max_age: number }[] = DEFAULT_AGE_GROUPS;
        const { data: configRow, error: cfgErr } = await supabase
          .from('people_configurations')
          .select('age_group')
          .eq('organization_id', organizationId)
          .single();
        if (!cfgErr && configRow?.age_group && Array.isArray(configRow.age_group) && configRow.age_group.length > 0) {
          configAgeGroups = configRow.age_group as { name: string; min_age: number; max_age: number }[];
        }

        // Calculate members by status
        const membersByStatus: Record<MembershipStatus, number> = {
          active: scopedMembers.filter(m => m.membership_status === 'active').length || 0,
          inactive: scopedMembers.filter(m => m.membership_status === 'inactive').length || 0,
          pending: scopedMembers.filter(m => m.membership_status === 'pending').length || 0,
          suspended: scopedMembers.filter(m => m.membership_status === 'suspended').length || 0,
          transferred: scopedMembers.filter(m => m.membership_status === 'transferred').length || 0,
          deceased: scopedMembers.filter(m => m.membership_status === 'deceased').length || 0,
        };

        // Calculate members by gender
        const membersByGender: Record<string, number> = {
          male: scopedMembers.filter(m => m.gender === 'male').length || 0,
          female: scopedMembers.filter(m => m.gender === 'female').length || 0,
          other: scopedMembers.filter(m => m.gender === 'other').length || 0,
          prefer_not_to_say: scopedMembers.filter(m => m.gender === 'prefer_not_to_say').length || 0,
        };

        // Calculate members by branch
        const membersByBranch: Record<string, number> = {};
        scopedMembers.forEach(member => {
          if (member.branch_id) {
            membersByBranch[member.branch_id] = (membersByBranch[member.branch_id] || 0) + 1;
          }
        });

        // Calculate members by configurable age groups
        const membersByAgeGroup: Record<string, number> = {};
        const labels = configAgeGroups.map(formatAgeGroupLabel);
        for (const label of labels) {
          membersByAgeGroup[label] = 0;
        }
        scopedMembers.forEach(member => {
          if (!member.date_of_birth) return;
          const age = new Date().getFullYear() - new Date(member.date_of_birth).getFullYear();
          for (let i = 0; i < configAgeGroups.length; i++) {
            const g = configAgeGroups[i];
            if (age >= g.min_age && age <= g.max_age) {
              const label = formatAgeGroupLabel(g);
              membersByAgeGroup[label] = (membersByAgeGroup[label] || 0) + 1;
              break;
            }
          }
        });

        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();

        const stats: MemberStatistics = {
          total_members: scopedMembers.length || 0,
          active_members: membersByStatus.active,
          inactive_members: membersByStatus.inactive,
          new_members_this_month: scopedMembers.filter(m => {
            if (!m.date_joined) return false;
            const joinDate = new Date(m.date_joined);
            return joinDate.getMonth() === thisMonth && joinDate.getFullYear() === thisYear;
          }).length || 0,
          new_members_this_year: scopedMembers.filter(m => {
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
      const { custom_form_data, ...memberData } = data;

      const { data: member, error } = await supabase
        .from('members')
        .insert({
          ...memberData,
          custom_form_data: custom_form_data || {},
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
      const { id, custom_form_data, ...memberData } = data;

      const updateData: any = { ...memberData };
      if (custom_form_data !== undefined) {
        updateData.custom_form_data = custom_form_data;
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
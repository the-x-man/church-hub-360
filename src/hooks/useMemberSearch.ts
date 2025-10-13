import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { MemberSummary } from '../types/members';

// Query Keys for member search
export const memberSearchKeys = {
  all: ['member-search'] as const,
  search: (organizationId: string, searchTerm: string, branchId?: string) => 
    [...memberSearchKeys.all, 'search', organizationId, searchTerm, branchId] as const,
};

// Interface for member search options
export interface MemberSearchOptions {
  organizationId: string;
  searchTerm: string;
  limit?: number;
  includeInactive?: boolean;
  searchFields?: ('name' | 'email' | 'phone' | 'membershipId')[];
  branchId?: string; // Optional branch filtering
}

// Interface for member search result
export interface MemberSearchResult extends MemberSummary {
  // Add any additional fields needed for display
  display_name: string;
  display_subtitle: string;
}

/**
 * Hook for searching members with efficient caching and debouncing support
 * Optimized for typeahead/autocomplete components
 */
export function useMemberSearch({
  organizationId,
  searchTerm,
  limit = 50,
  includeInactive = false,
  searchFields = ['name', 'email', 'phone', 'membershipId'],
  branchId
}: MemberSearchOptions) {
  return useQuery({
    queryKey: memberSearchKeys.search(organizationId, searchTerm, branchId),
    queryFn: async (): Promise<MemberSearchResult[]> => {
      if (!organizationId) throw new Error('Organization ID is required');
      if (!searchTerm.trim()) return [];

      const searchLower = searchTerm.toLowerCase().trim();
      
      let query = supabase
        .from('members_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .limit(limit);

      // Filter by active status if needed
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      // Filter by branch if specified
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      // Build search conditions based on enabled search fields
      const searchConditions: string[] = [];
      
      if (searchFields.includes('name')) {
        searchConditions.push(`first_name.ilike.%${searchLower}%`);
        searchConditions.push(`last_name.ilike.%${searchLower}%`);
        searchConditions.push(`full_name.ilike.%${searchLower}%`);
      }
      
      if (searchFields.includes('email')) {
        searchConditions.push(`email.ilike.%${searchLower}%`);
      }
      
      if (searchFields.includes('phone')) {
        searchConditions.push(`phone.ilike.%${searchLower}%`);
      }
      
      if (searchFields.includes('membershipId')) {
        searchConditions.push(`membership_id.ilike.%${searchLower}%`);
      }

      // Apply search conditions
      if (searchConditions.length > 0) {
        query = query.or(searchConditions.join(','));
      }

      // Order by relevance (exact matches first, then partial matches)
      query = query.order('last_name').order('first_name');

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include display fields
      const results: MemberSearchResult[] = (data || []).map(member => ({
        ...member,
        display_name: member.full_name || `${member.first_name} ${member.last_name}`.trim(),
        display_subtitle: [
          member.membership_id,
          member.email,
          member.phone
        ].filter(Boolean).join(' • ')
      }));

      // Sort results by relevance
      return results.sort((a, b) => {
        const aName = a.display_name.toLowerCase();
        const bName = b.display_name.toLowerCase();
        
        // Exact matches first
        const aExact = aName === searchLower;
        const bExact = bName === searchLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Starts with matches next
        const aStarts = aName.startsWith(searchLower);
        const bStarts = bName.startsWith(searchLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Then alphabetical
        return aName.localeCompare(bName);
      });
    },
    enabled: !!organizationId && !!searchTerm.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook for getting member details by ID
 * Used when we need full member details after selection
 */
export function useMemberDetails(memberIds: string[]) {
  return useQuery({
    queryKey: [...memberSearchKeys.all, 'details', memberIds.sort()],
    queryFn: async (): Promise<MemberSummary[]> => {
      if (memberIds.length === 0) return [];

      const { data, error } = await supabase
        .from('members_summary')
        .select('*')
        .in('id', memberIds);

      if (error) throw error;
      return data || [];
    },
    enabled: memberIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}
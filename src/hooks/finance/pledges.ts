import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  FinanceFilter,
  PledgeRecord,
  PledgePayment,
  PaymentMethod,
  PledgeStatus,
} from '@/types/finance';

export interface PledgesQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: FinanceFilter;
}

export interface PaginatedPledgesResponse {
  data: PledgeRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PledgePaymentsQueryParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedPledgePaymentsResponse {
  data: PledgePayment[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const pledgeKeys = {
  all: ['pledges'] as const,
  lists: () => [...pledgeKeys.all, 'list'] as const,
  list: (organizationId: string, params?: PledgesQueryParams) =>
    [...pledgeKeys.lists(), organizationId, params] as const,
  details: () => [...pledgeKeys.all, 'detail'] as const,
  detail: (id: string) => [...pledgeKeys.details(), id] as const,
  payments: () => [...pledgeKeys.all, 'payments'] as const,
  pledgePayments: (pledgeId: string, params?: PledgePaymentsQueryParams) =>
    [...pledgeKeys.payments(), pledgeId, params] as const,
};

function applyFinanceFilters(
  query: any,
  filters?: FinanceFilter
) {
  if (!filters) return query;

  // Direct status mapping for pledge records
  if (filters.status_filter && filters.status_filter.length) {
    query = query.in('status', filters.status_filter as string[]);
  }

  if (filters.amount_range) {
    if (filters.amount_range.min !== undefined) {
      query = query.gte('pledge_amount', filters.amount_range.min as number);
    }
    if (filters.amount_range.max !== undefined) {
      query = query.lte('pledge_amount', filters.amount_range.max as number);
    }
  }

  if (filters.date_filter) {
    const df = filters.date_filter;
    // Use explicit start/end when given; map to pledge start_date/end_date
    if (df.start_date) {
      const start = df.start_date.length >= 10 ? df.start_date.slice(0, 10) : df.start_date;
      query = query.gte('start_date', start);
    }
    if (df.end_date) {
      const end = df.end_date.length >= 10 ? df.end_date.slice(0, 10) : df.end_date;
      query = query.lte('end_date', end);
    }
  }

  return query;
}

export function usePledges(params?: PledgesQueryParams) {
  const { currentOrganization } = useOrganization();

  const queryParams: Required<Pick<PledgesQueryParams, 'page' | 'pageSize'>> & PledgesQueryParams = {
    page: 1,
    pageSize: 10,
    ...params,
  };

  return useQuery({
    queryKey: pledgeKeys.list(currentOrganization?.id || '', queryParams),
    queryFn: async (): Promise<PaginatedPledgesResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('pledge_records')
        .select(
          `*,
           member:members(id, first_name, middle_name, last_name),
           group:groups(id, name),
           tag_item:tag_items(id, name)`,
          { count: 'exact' }
        )
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('start_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryParams.search && queryParams.search.trim()) {
        const q = queryParams.search.trim();
        const orClauses: string[] = [
          `description.ilike.%${q}%`,
          `campaign_name.ilike.%${q}%`,
          `pledge_type.ilike.%${q}%`,
        ];
        query = query.or(orClauses.join(','));
      }

      query = applyFinanceFilters(query, queryParams.filters);

      const from = (queryParams.page! - 1) * queryParams.pageSize!;
      const to = from + queryParams.pageSize! - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / queryParams.pageSize!);

      // Map source display names for UI convenience
      const mapped = (data || []).map((r: any) => {
        const first = r.member?.first_name || '';
        const middle = r.member?.middle_name ? ` ${r.member.middle_name}` : '';
        const last = r.member?.last_name ? ` ${r.member.last_name}` : '';
        const member_name = `${first}${middle}${last}`.trim();
        const group_name = r.group?.name || '';
        const tag_item_name = r.tag_item?.name || '';
        let contributor_name = '';
        switch (r.source_type) {
          case 'member':
            contributor_name = member_name || 'Member';
            break;
          case 'group':
            contributor_name = group_name || 'Group';
            break;
          case 'tag_item':
            contributor_name = tag_item_name || 'Tag Item';
            break;
          case 'other':
            contributor_name = r.source || 'Other';
            break;
          case 'church':
            contributor_name = 'Church';
            break;
          default:
            contributor_name = member_name || r.source || group_name || tag_item_name || '';
        }
        return { ...r, member_name, group_name, tag_item_name, contributor_name } as PledgeRecord;
      });

      return {
        data: mapped,
        totalCount,
        totalPages,
        currentPage: queryParams.page!,
        pageSize: queryParams.pageSize!,
      };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePledge(id: string | null) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: pledgeKeys.detail(id || ''),
    queryFn: async (): Promise<PledgeRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!id) throw new Error('Pledge ID is required');

      const { data, error } = await supabase
        .from('pledge_records')
        .select(`*, member:members(id, first_name, middle_name, last_name), group:groups(id, name), tag_item:tag_items(id, name)`) 
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      const r: any = data;
      const first = r.member?.first_name || '';
      const middle = r.member?.middle_name ? ` ${r.member.middle_name}` : '';
      const last = r.member?.last_name ? ` ${r.member.last_name}` : '';
      const member_name = `${first}${middle}${last}`.trim();
      const group_name = r.group?.name || '';
      const tag_item_name = r.tag_item?.name || '';
      let contributor_name = '';
      switch (r.source_type) {
        case 'member':
          contributor_name = member_name || 'Member';
          break;
        case 'group':
          contributor_name = group_name || 'Group';
          break;
        case 'tag_item':
          contributor_name = tag_item_name || 'Tag Item';
          break;
        case 'other':
          contributor_name = r.source || 'Other';
          break;
        case 'church':
          contributor_name = 'Church';
          break;
        default:
          contributor_name = member_name || r.source || group_name || tag_item_name || '';
      }
      return { ...r, member_name, group_name, tag_item_name, contributor_name } as PledgeRecord;
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export interface CreatePledgeInput {
  // Source fields
  source_type: 'member' | 'group' | 'tag_item' | 'other' | 'church';
  source?: string; // when source_type === 'other'
  member_id?: string;
  group_id?: string;
  tag_item_id?: string;
  // Core fields
  pledge_amount: number;
  pledge_type: string;
  campaign_name?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  payment_frequency: string;
  description?: string;
  branch_id?: string | null;
}

export function useCreatePledge() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePledgeInput): Promise<PledgeRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const payload = {
        organization_id: currentOrganization.id,
        branch_id: input.branch_id || null,
        // Source mapping
        source_type: input.source_type,
        source: input.source || null,
        member_id: input.member_id || null,
        group_id: input.group_id || null,
        tag_item_id: input.tag_item_id || null,
        // Core pledge values
        pledge_amount: input.pledge_amount,
        amount_paid: 0,
        amount_remaining: input.pledge_amount,
        pledge_type: input.pledge_type,
        campaign_name: input.campaign_name || null,
        start_date: input.start_date,
        end_date: input.end_date,
        payment_frequency: input.payment_frequency,
        description: input.description || null,
        status: 'active' as PledgeStatus,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('pledge_records')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as PledgeRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pledgeKeys.lists() });
      toast.success('Pledge record created');
    },
    onError: (error) => {
      console.error('Error creating pledge:', error);
      toast.error('Failed to create pledge');
    },
  });
}

export interface UpdatePledgeInput {
  id: string;
  updates: Partial<CreatePledgeInput> & {
    pledge_amount?: number;
    start_date?: string;
    end_date?: string;
    status?: PledgeStatus;
  };
}

export function useUpdatePledge() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdatePledgeInput): Promise<PledgeRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pledge_records')
        .update({
          ...updates,
        })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as PledgeRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pledgeKeys.detail(data.id) });
      toast.success('Pledge record updated');
    },
    onError: (error) => {
      console.error('Error updating pledge:', error);
      toast.error('Failed to update pledge');
    },
  });
}

export function useDeletePledge() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('pledge_records')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pledgeKeys.lists() });
      toast.success('Pledge record deleted');
    },
    onError: (error) => {
      console.error('Error deleting pledge:', error);
      toast.error('Failed to delete pledge');
    },
  });
}

export function usePledgePayments(pledgeId: string | null, params?: PledgePaymentsQueryParams) {
  const { currentOrganization } = useOrganization();

  const queryParams: Required<Pick<PledgePaymentsQueryParams, 'page' | 'pageSize'>> & PledgePaymentsQueryParams = {
    page: 1,
    pageSize: 10,
    ...params,
  };

  return useQuery({
    queryKey: pledgeKeys.pledgePayments(pledgeId || '', queryParams),
    queryFn: async (): Promise<PaginatedPledgePaymentsResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!pledgeId) throw new Error('Pledge ID is required');

      let query = supabase
        .from('pledge_payments')
        .select('*', { count: 'exact' })
        .eq('pledge_id', pledgeId)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      const from = (queryParams.page! - 1) * queryParams.pageSize!;
      const to = from + queryParams.pageSize! - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / queryParams.pageSize!);

      return {
        data: data || [],
        totalCount,
        totalPages,
        currentPage: queryParams.page!,
        pageSize: queryParams.pageSize!,
      };
    },
    enabled: !!currentOrganization?.id && !!pledgeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export interface CreatePledgePaymentInput {
  pledge_id: string;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  notes?: string;
}

export function useCreatePledgePayment() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePledgePaymentInput): Promise<PledgePayment> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const payload = {
        organization_id: currentOrganization.id,
        pledge_id: input.pledge_id,
        amount: input.amount,
        payment_date: input.payment_date,
        payment_method: input.payment_method,
        notes: input.notes || null,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('pledge_payments')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as PledgePayment;
    },
    onSuccess: (data) => {
      // Refresh payments queries (prefix match to cover all params)
      queryClient.invalidateQueries({ queryKey: pledgeKeys.payments() });
      // Refresh the pledge detail and overall pledges list to reflect updated totals
      queryClient.invalidateQueries({ queryKey: pledgeKeys.detail(data.pledge_id) });
      queryClient.invalidateQueries({ queryKey: pledgeKeys.lists() });
      toast.success('Pledge payment recorded');
    },
    onError: (error) => {
      console.error('Error creating pledge payment:', error);
      toast.error('Failed to record pledge payment');
    },
  });
}

export interface UpdatePledgePaymentInput {
  id: string;
  updates: Partial<CreatePledgePaymentInput> & { amount?: number; payment_date?: string };
}

export function useUpdatePledgePayment() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdatePledgePaymentInput): Promise<PledgePayment> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pledge_payments')
        .update({
          ...updates,
        })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as PledgePayment;
    },
    onSuccess: (data) => {
      // Refresh payments queries (prefix match to cover all params)
      queryClient.invalidateQueries({ queryKey: pledgeKeys.payments() });
      // Refresh the pledge detail and overall pledges list to reflect updated totals
      queryClient.invalidateQueries({ queryKey: pledgeKeys.detail(data.pledge_id) });
      queryClient.invalidateQueries({ queryKey: pledgeKeys.lists() });
      toast.success('Pledge payment updated');
    },
    onError: (error) => {
      console.error('Error updating pledge payment:', error);
      toast.error('Failed to update pledge payment');
    },
  });
}

export function useDeletePledgePayment() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: { id: string; pledge_id: string }): Promise<{ success: boolean }> => {
      if (!user?.id) throw new Error('User not authenticated');
      const { id } = args;

      const { error } = await supabase
        .from('pledge_payments')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('organization_id', currentOrganization!.id)
        .eq('created_by', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, { pledge_id }) => {
      // Refresh payments queries (prefix match to cover all params)
      queryClient.invalidateQueries({ queryKey: pledgeKeys.payments() });
      // Refresh the pledge detail and overall pledges list to reflect updated totals
      queryClient.invalidateQueries({ queryKey: pledgeKeys.detail(pledge_id) });
      queryClient.invalidateQueries({ queryKey: pledgeKeys.lists() });
      toast.success('Pledge payment deleted');
    },
    onError: (error) => {
      console.error('Error deleting pledge payment:', error);
      toast.error('Failed to delete pledge payment');
    },
  });
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FinanceFilter, PledgeRecord, PledgePayment, PledgeType, PaymentMethod } from '@/types/finance';

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

  // Status filter can be mapped to pledge status or custom logic
  if (filters.status_filter && filters.status_filter.length) {
    // For now, treat 'completed' as pledged_amount <= amount_paid, 'active' otherwise
    // This demo implementation relies on a view; skip direct mapping here.
  }

  if (filters.amount_range) {
    if (filters.amount_range.min !== undefined) {
      query = query.gte('pledged_amount', filters.amount_range.min as number);
    }
    if (filters.amount_range.max !== undefined) {
      query = query.lte('pledged_amount', filters.amount_range.max as number);
    }
  }

  if (filters.date_filter) {
    const df = filters.date_filter;
    const today = new Date();
    if (df.type === 'preset') {
      if (df.preset === 'this_month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        query = query.gte('date', start.toISOString().split('T')[0]);
        query = query.lte('date', end.toISOString().split('T')[0]);
      } else if (df.preset === 'last_month') {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        query = query.gte('date', start.toISOString().split('T')[0]);
        query = query.lte('date', end.toISOString().split('T')[0]);
      } else if (df.preset === 'this_year') {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31);
        query = query.gte('date', start.toISOString().split('T')[0]);
        query = query.lte('date', end.toISOString().split('T')[0]);
      } else if (df.preset === 'last_year') {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        query = query.gte('date', start.toISOString().split('T')[0]);
        query = query.lte('date', end.toISOString().split('T')[0]);
      }
    } else if (df.type === 'custom') {
      if (df.start_date) query = query.gte('date', df.start_date);
      if (df.end_date) query = query.lte('date', df.end_date);
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
        .select('*', { count: 'exact' })
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryParams.search && queryParams.search.trim()) {
        const q = queryParams.search.trim();
        query = query.or(
          `description.ilike.%${q}%,pledger_name.ilike.%${q}%,target_ministry.ilike.%${q}%`
        );
      }

      query = applyFinanceFilters(query, queryParams.filters);

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
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data as PledgeRecord;
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export interface CreatePledgeInput {
  pledge_type: PledgeType;
  pledged_amount: number;
  date: string; // YYYY-MM-DD
  description?: string;
  target_ministry?: string;
  pledger_name?: string;
  member_id?: string | null;
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
        pledge_type: input.pledge_type,
        pledged_amount: input.pledged_amount,
        date: input.date,
        description: input.description || null,
        target_ministry: input.target_ministry || null,
        pledger_name: input.pledger_name || null,
        member_id: input.member_id || null,
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
  updates: Partial<CreatePledgeInput> & { pledged_amount?: number; date?: string };
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
  reference?: string;
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
        pledge_id: input.pledge_id,
        amount: input.amount,
        payment_date: input.payment_date,
        payment_method: input.payment_method,
        reference: input.reference || null,
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
      queryClient.invalidateQueries({ queryKey: pledgeKeys.pledgePayments(data.pledge_id) });
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
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as PledgePayment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pledgeKeys.pledgePayments(data.pledge_id) });
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: { id: string; pledge_id: string }): Promise<{ success: boolean }> => {
      if (!user?.id) throw new Error('User not authenticated');
      const { id } = args;

      const { error } = await supabase
        .from('pledge_payments')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, { pledge_id }) => {
      queryClient.invalidateQueries({ queryKey: pledgeKeys.pledgePayments(pledge_id) });
      toast.success('Pledge payment deleted');
    },
    onError: (error) => {
      console.error('Error deleting pledge payment:', error);
      toast.error('Failed to delete pledge payment');
    },
  });
}
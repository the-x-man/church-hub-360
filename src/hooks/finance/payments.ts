import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DateFilter, PaymentMethod, PledgePayment } from '@/types/finance';
import type { AmountComparison } from '@/utils/finance/search';

export interface PaymentsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFilter?: DateFilter;
  amountSearch?: AmountComparison | null;
  paymentMethodFilter?: PaymentMethod[];
}

export interface PaginatedPaymentsResponse {
  data: PledgePayment[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const paymentKeys = {
  all: ['pledge_payments_all'] as const,
  list: (organizationId: string, params?: PaymentsQueryParams) =>
    [...paymentKeys.all, organizationId, params] as const,
};

function applyDateFilter(query: any, df?: DateFilter) {
  if (!df) return query;
  if (df.type === 'preset') {
    // Preset mapping handled by DatePresetPicker; rely on explicit start/end when provided
    // If presets are mapped to explicit dates before passing, do nothing here.
    return query;
  }
  if (df.type === 'custom') {
    if (df.start_date) {
      const start = df.start_date.length >= 10 ? df.start_date.slice(0, 10) : df.start_date;
      query = query.gte('payment_date', start);
    }
    if (df.end_date) {
      const end = df.end_date.length >= 10 ? df.end_date.slice(0, 10) : df.end_date;
      query = query.lte('payment_date', end);
    }
  }
  return query;
}

function applyAmountSearch(query: any, amountSearch?: AmountComparison | null) {
  if (!amountSearch) return query;
  const { operator, value } = amountSearch;
  switch (operator) {
    case '>':
      return query.gt('amount', value);
    case '>=':
      return query.gte('amount', value);
    case '=':
      return query.eq('amount', value);
    case '<':
      return query.lt('amount', value);
    case '<=':
      return query.lte('amount', value);
    case '!=':
      return query.neq('amount', value);
    default:
      return query;
  }
}

export function useAllPledgePayments(params?: PaymentsQueryParams) {
  const { currentOrganization } = useOrganization();

  const queryParams: Required<Pick<PaymentsQueryParams, 'page' | 'pageSize'>> & PaymentsQueryParams = {
    page: 1,
    pageSize: 10,
    ...params,
  };

  return useQuery({
    queryKey: paymentKeys.list(currentOrganization?.id || '', queryParams),
    queryFn: async (): Promise<PaginatedPaymentsResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('pledge_payments')
        .select(
          `*,
           pledge:pledge_records(
             id,
             pledge_type,
             campaign_name,
             source_type,
             source,
             member_id,
             group_id,
             tag_item_id,
             member:members(id, first_name, middle_name, last_name),
             group:groups(id, name),
             tag_item:tag_items(id, name)
           )`,
          { count: 'exact' }
        )
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryParams.search && queryParams.search.trim()) {
        const q = queryParams.search.trim();
        const orClauses: string[] = [
          `notes.ilike.%${q}%`,
        ];
        query = query.or(orClauses.join(','));
      }

      if (queryParams.paymentMethodFilter && queryParams.paymentMethodFilter.length) {
        query = query.in('payment_method', queryParams.paymentMethodFilter as string[]);
      }

      query = applyDateFilter(query, queryParams.dateFilter);
      query = applyAmountSearch(query, queryParams.amountSearch);

      const from = (queryParams.page! - 1) * queryParams.pageSize!;
      const to = from + queryParams.pageSize! - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / queryParams.pageSize!);

      // Map pledge display helpers for UI
      const mapped = (data || []).map((r: any) => {
        const first = r.pledge?.member?.first_name || '';
        const middle = r.pledge?.member?.middle_name ? ` ${r.pledge.member.middle_name}` : '';
        const last = r.pledge?.member?.last_name ? ` ${r.pledge.member.last_name}` : '';
        const member_name = `${first}${middle}${last}`.trim();
        const group_name = r.pledge?.group?.name || '';
        const tag_item_name = r.pledge?.tag_item?.name || '';
        let contributor_name = '';
        switch (r.pledge?.source_type) {
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
            contributor_name = r.pledge?.source || 'Other';
            break;
          case 'church':
            contributor_name = 'Church';
            break;
          default:
            contributor_name = member_name || r.pledge?.source || group_name || tag_item_name || '';
        }

        const type_label = r.pledge?.pledge_type ? String(r.pledge.pledge_type).replace('_', ' ') : '';
        let pledge_label = '';
        if (r.pledge?.campaign_name) {
          pledge_label = contributor_name ? `${contributor_name} – ${r.pledge.campaign_name}` : r.pledge.campaign_name;
        } else if (type_label) {
          pledge_label = contributor_name ? `${contributor_name} – ${type_label}` : type_label;
        } else if (contributor_name) {
          pledge_label = contributor_name;
        } else {
          pledge_label = String(r.pledge_id || '').slice(0, 8) ? `${String(r.pledge_id).slice(0, 8)}…` : 'Pledge';
        }

        return { ...r, member_name, group_name, tag_item_name, contributor_name, pledge_label } as any;
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

// Simple wrapper mutations for update/delete using existing table
export interface UpdatePaymentInput {
  id: string;
  updates: Partial<Pick<PledgePayment, 'amount' | 'payment_date' | 'payment_method' | 'notes'>>;
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdatePaymentInput): Promise<PledgePayment> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pledge_payments')
        .update({ ...updates })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as PledgePayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      toast.success('Payment updated');
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('pledge_payments')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      toast.success('Payment deleted');
    },
    onError: (error) => {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    },
  });
}
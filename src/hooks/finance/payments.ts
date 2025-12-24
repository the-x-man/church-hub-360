import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DateFilter, PaymentMethod, PledgePayment, IncomeResponseRow, PaymentFilter } from '@/types/finance';
import type { AmountComparison } from '@/utils/finance/search';
import { useBranchScope, applyBranchScope } from '@/hooks/useBranchScope';
import { applyDateFilterQuery } from '@/utils/finance/dateFilter';

export interface PaymentsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFilter?: DateFilter;
  amountSearch?: AmountComparison | null;
  paymentMethodFilter?: PaymentMethod[];
  filters?: PaymentFilter;
  enabled?: boolean;
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
  incomes: (organizationId: string, params?: PaymentsQueryParams) =>
    [...paymentKeys.all, 'as_income', organizationId, params] as const,
};

function applyDateFilter(query: any, df?: DateFilter) {
  return applyDateFilterQuery(query, df, 'payment_date');
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
  const scope = useBranchScope(currentOrganization?.id);

  const queryParams: Required<Pick<PaymentsQueryParams, 'page' | 'pageSize'>> & PaymentsQueryParams = {
    page: 1,
    pageSize: 10,
    ...params,
  };

  return useQuery({
    queryKey: [
      ...paymentKeys.list(currentOrganization?.id || '', queryParams),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all',
    ],
    enabled: params?.enabled !== false && !!currentOrganization?.id,
    queryFn: async (): Promise<PaginatedPaymentsResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('pledge_payments')
        .select(
          `*,
           created_by_user:profiles(first_name, last_name),
           branch:branches(id, name),
           pledge:pledge_records(
             id,
             pledge_type,
             campaign_name,
             source_type,
             source,
             member_id,
             group_id,
             tag_item_id,
             branch_id,
             branch:branches(id, name),
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

      if (queryParams.filters?.branch_id_filter && queryParams.filters.branch_id_filter.length) {
        const ids = (queryParams.filters.branch_id_filter as string[]).join(',');
        query = query.or(`branch_id.in.(${ids}),branch_id.is.null`);
      }

      if (queryParams.paymentMethodFilter && queryParams.paymentMethodFilter.length) {
        query = query.in('payment_method', queryParams.paymentMethodFilter as string[]);
      }

      query = applyDateFilter(query, queryParams.dateFilter);
      query = applyAmountSearch(query, queryParams.amountSearch);

      {
        const scoped = applyBranchScope(query, scope, 'branch_id', true);
        if (scoped.abortIfEmpty) {
          return {
            data: [],
            totalCount: 0,
            totalPages: 1,
            currentPage: queryParams.page!,
            pageSize: queryParams.pageSize!,
          };
        }
        query = scoped.query;
      }

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

        const resolvedBranch = r.branch || (r.pledge?.branch ?? null);
        return { ...r, member_name, group_name, tag_item_name, contributor_name, pledge_label, branch: resolvedBranch } as any;
      });

      return {
        data: mapped,
        totalCount,
        totalPages,
        currentPage: queryParams.page!,
        pageSize: queryParams.pageSize!,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Simple wrapper mutations for update/delete using existing table
export interface UpdatePaymentInput {
  id: string;
  updates: Partial<Pick<PledgePayment, 'amount' | 'payment_date' | 'payment_method' | 'notes' | 'check_number'>>;
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdatePaymentInput): Promise<PledgePayment> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');
      const normalizedUpdates: Record<string, any> = { ...updates };
      if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'check_number')) {
        const raw = normalizedUpdates.check_number as string | undefined;
        const trimmed = typeof raw === 'string' ? raw.trim() : undefined;
        normalizedUpdates.check_number = trimmed ? trimmed : null;
      }

      const { data, error } = await supabase
        .from('pledge_payments')
        .update(normalizedUpdates)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
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
        .eq('organization_id', currentOrganization.id);

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

// Transform pledge payments into IncomeResponseRow to include in income reports
export interface PaginatedIncomeFromPaymentsResponse {
  data: IncomeResponseRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export function usePledgePaymentsAsIncome(params?: PaymentsQueryParams) {
  const { currentOrganization } = useOrganization();
  const scope = useBranchScope(currentOrganization?.id);

  const queryParams: Required<Pick<PaymentsQueryParams, 'page' | 'pageSize'>> & PaymentsQueryParams = {
    page: 1,
    pageSize: 10,
    ...params,
  };

  return useQuery({
    queryKey: [
      ...paymentKeys.incomes(currentOrganization?.id || '', queryParams),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all',
    ],
    enabled: params?.enabled !== false && !!currentOrganization?.id,
    queryFn: async (): Promise<PaginatedIncomeFromPaymentsResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('pledge_payments')
        .select(
          `*,
           created_by_user:profiles(first_name, last_name),
           branch:branches(id, name),
           pledge:pledge_records(
             id,
             pledge_type,
             campaign_name,
             source_type,
             source,
             member_id,
             group_id,
             tag_item_id,
             branch_id,
             branch:branches(id, name),
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

      if (queryParams.filters?.branch_id_filter && queryParams.filters.branch_id_filter.length) {
        const ids = (queryParams.filters.branch_id_filter as string[]).join(',');
        query = query.or(`branch_id.in.(${ids}),branch_id.is.null`);
      }

      if (queryParams.paymentMethodFilter && queryParams.paymentMethodFilter.length) {
        query = query.in('payment_method', queryParams.paymentMethodFilter as string[]);
      }

      query = applyDateFilter(query, queryParams.dateFilter);
      query = applyAmountSearch(query, queryParams.amountSearch);

      {
        const scoped = applyBranchScope(query, scope, 'branch_id', true);
        if (scoped.abortIfEmpty) {
          return {
            data: [],
            totalCount: 0,
            totalPages: 1,
            currentPage: queryParams.page!,
            pageSize: queryParams.pageSize!,
          };
        }
        query = scoped.query;
      }

      const from = (queryParams.page! - 1) * queryParams.pageSize!;
      const to = from + queryParams.pageSize! - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const payments = (data || []) as any[];

      const mapped: IncomeResponseRow[] = payments.map((r) => {
        // Construct contributor display similar to useAllPledgePayments
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
        const context_label = r.pledge?.campaign_name || type_label || 'Pledge';
        const occasion_label = contributor_name ? `${contributor_name} – ${context_label}` : context_label;

        // Map to IncomeResponseRow
        const income: IncomeResponseRow = {
          id: r.id,
          organization_id: r.organization_id || currentOrganization.id,
          branch_id: r.branch_id || r.pledge?.branch_id || '',
          amount: Number(r.amount || 0),
          description: r.notes ? `Pledge payment – ${context_label}. ${r.notes}` : `Pledge payment – ${context_label}`,
          notes: r.notes || undefined,
          date: r.payment_date,
          created_by: r.created_by,
          created_at: r.created_at,
          updated_at: r.updated_at || r.created_at,
          income_type: 'pledge_payment',
          category: 'Pledge Payment',
          occasion_name: occasion_label,
          pledge_id: r.pledge?.id,
          source: r.pledge?.source || undefined,
          source_type: r.pledge?.source_type || undefined,
          member_id: r.pledge?.member_id || undefined,
          member_name: member_name || undefined,
          contributor_name,
          group_id: r.pledge?.group_id || undefined,
          tag_item_id: r.pledge?.tag_item_id || undefined,
          payment_method: r.payment_method,
          receipt_number: undefined,
          branch: r.branch || r.pledge?.branch || null,
        } as IncomeResponseRow;

        return income;
      });

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / queryParams.pageSize!);

      return {
        data: mapped,
        totalCount,
        totalPages,
        currentPage: queryParams.page!,
        pageSize: queryParams.pageSize!,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

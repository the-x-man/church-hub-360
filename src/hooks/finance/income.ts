import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  FinanceFilter,
  IncomeRecord,
  ExtendedIncomeType,
  PaymentMethod,
  IncomeType,
  IncomeResponseRow,
} from '@/types/finance';
import type { AmountComparison } from '@/utils/finance/search';
import { useBranchScope, applyBranchScope } from '@/hooks/useBranchScope';

export interface IncomeQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: FinanceFilter;
  income_type?: IncomeType; // optional, single type filter
  income_types?: IncomeType[]; // optional, multi-type filter
  amount_comparison?: AmountComparison | null; // dedicated amount operator search
}

export interface PaginatedIncomeResponse {
  data: IncomeResponseRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const incomeKeys = {
  all: ['income'] as const,
  lists: () => [...incomeKeys.all, 'list'] as const,
  list: (organizationId: string, params?: IncomeQueryParams) =>
    [...incomeKeys.lists(), organizationId, params] as const,
  details: () => [...incomeKeys.all, 'detail'] as const,
  detail: (id: string) => [...incomeKeys.details(), id] as const,
};

function applyFinanceFilters(
  query: any,
  filters?: FinanceFilter
) {
  if (!filters) return query;

  // Category filter maps to category for Income page
  if (filters.category_filter && filters.category_filter.length) {
    query = query.in('category', filters.category_filter as string[]);
  }

  // Income type filter (advanced)
  if (filters.income_type_filter && filters.income_type_filter.length) {
    query = query.in('income_type', filters.income_type_filter as string[]);
  }

  if (filters.payment_method_filter && filters.payment_method_filter.length) {
    query = query.in('payment_method', filters.payment_method_filter as string[]);
  }

  if (filters.amount_range) {
    if (filters.amount_range.min !== undefined) {
      query = query.gte('amount', filters.amount_range.min as number);
    }
    if (filters.amount_range.max !== undefined) {
      query = query.lte('amount', filters.amount_range.max as number);
    }
  }

  // Relation filters: member, group, tag item, occasion, session
  if (filters.member_filter && filters.member_filter.length) {
    query = query.in('member_id', filters.member_filter as string[]);
  }

  if (filters.group_filter && filters.group_filter.length) {
    query = query.in('group_id', filters.group_filter as string[]);
  }

  if (filters.tag_item_filter && filters.tag_item_filter.length) {
    query = query.in('tag_item_id', filters.tag_item_filter as string[]);
  }

  if (filters.attendance_occasion_filter && filters.attendance_occasion_filter.length) {
    query = query.in('attendance_occasion_id', filters.attendance_occasion_filter as string[]);
  }

  if (filters.attendance_session_filter && filters.attendance_session_filter.length) {
    query = query.in('attendance_session_id', filters.attendance_session_filter as string[]);
  }

  if (filters.branch_id_filter && filters.branch_id_filter.length) {
    const ids = (filters.branch_id_filter as string[]).join(',');
    query = query.or(`branch_id.in.(${ids}),branch_id.is.null`);
  }

  // Date filter: always rely on provided start/end from UI mapping
  if (filters.date_filter) {
    const df = filters.date_filter;
    if (df.start_date) {
      const start = df.start_date.length >= 10 ? df.start_date.slice(0, 10) : df.start_date;
      query = query.gte('date', start);
    }
    if (df.end_date) {
      const end = df.end_date.length >= 10 ? df.end_date.slice(0, 10) : df.end_date;
      query = query.lte('date', end);
    }
  }

  return query;
}

export function useIncomes(params?: IncomeQueryParams) {
  const { currentOrganization } = useOrganization();
  const scope = useBranchScope(currentOrganization?.id);

  const queryParams: Required<Pick<IncomeQueryParams, 'page' | 'pageSize'>> & IncomeQueryParams = {
    page: 1,
    pageSize: 10,
    ...params,
  };

  return useQuery({
    queryKey: [
      ...incomeKeys.list(currentOrganization?.id || '', queryParams),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all',
    ],
    queryFn: async (): Promise<PaginatedIncomeResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('income')
        .select(
          `*,
           member:members(id, first_name, middle_name, last_name, profile_image_url),
           group:groups(id, name),
           tag_item:tag_items(id, name, color),
           branch:branches(id, name),
           created_by_user:profiles(first_name, last_name),
           attendance_occasions(name),
           attendance_sessions(name, attendance_occasions(name))`,
          { count: 'exact' }
        )
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryParams.income_types && queryParams.income_types.length) {
        query = query.in('income_type', queryParams.income_types);
      } else if (queryParams.income_type) {
        query = query.eq('income_type', queryParams.income_type);
      }

      // Dedicated amount comparison takes precedence over text search
      if (queryParams.amount_comparison && queryParams.amount_comparison.value !== undefined) {
        const comp = queryParams.amount_comparison;
        switch (comp.operator) {
          case '>':
            query = query.gt('amount', comp.value);
            break;
          case '>=':
            query = query.gte('amount', comp.value);
            break;
          case '<':
            query = query.lt('amount', comp.value);
            break;
          case '<=':
            query = query.lte('amount', comp.value);
            break;
          case '=':
            query = query.eq('amount', comp.value);
            break;
          case '!=':
            query = query.neq('amount', comp.value);
            break;
        }
      } else if (queryParams.search && queryParams.search.trim()) {
        const q = queryParams.search.trim();
        const orClauses: string[] = [
          `description.ilike.%${q}%`,
          `occasion_name.ilike.%${q}%`,
          `source.ilike.%${q}%`,
          `receipt_number.ilike.%${q}%`,
          `payment_method.ilike.%${q}%`,
          `income_type.ilike.%${q}%`,
          `category.ilike.%${q}%`,
        ];
        query = query.or(orClauses.join(','));
      }

      query = applyFinanceFilters(query, queryParams.filters);

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

      const mappedData: IncomeResponseRow[] = (data || []).map((r) => {
        let contributor_name: string | undefined;
        let contributor_avatar_url: string | undefined;
        let contributor_tag_color: string | undefined;
        let occasion_name: string | undefined = r.occasion_name || r.attendance_occasions?.name || r.attendance_sessions?.attendance_occasions?.name || r.attendance_sessions?.name || undefined;

        switch (r.source_type) {
          case 'member': {
            const m = r.member;
            const fullName = m
              ? [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ')
              : undefined;
            contributor_name = fullName || r.member_name || undefined;
            contributor_avatar_url = m?.profile_image_url || undefined;
            break;
          }
          case 'group': {
            contributor_name = r.group?.name || undefined;
            break;
          }
          case 'tag_item': {
            contributor_name = r.tag_item?.name || undefined;
            contributor_tag_color = r.tag_item?.color || undefined;
            break;
          }
          case 'church': {
            contributor_name = 'Church';
            break;
          }
          case 'other': {
            contributor_name = r.source || 'Other';
            break;
          }
          default: {
            contributor_name = r.member_name || r.source || undefined;
            break;
          }
        }
        return { ...r, occasion_name, contributor_name, contributor_avatar_url, contributor_tag_color } as IncomeResponseRow;
      });

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / queryParams.pageSize!);

      return {
        data: mappedData,
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

export function useIncome(id: string | null) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: incomeKeys.detail(id || ''),
    queryFn: async (): Promise<IncomeRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!id) throw new Error('Income ID is required');

      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data as IncomeRecord;
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export interface CreateIncomeInput {
  amount: number;
  category: ExtendedIncomeType;
  payment_method: PaymentMethod;
  date: string; // YYYY-MM-DD
  description?: string;
  notes?: string;
  occasion_name?: string;
  attendance_occasion_id?: string;
  attendance_session_id?: string;
  source?: string;
  source_type?: 'church' | 'member' | 'tag_item' | 'group' | 'other';
  member_id?: string;
  group_id?: string;
  tag_item_id?: string;
  receipt_number?: string;
  branch_id?: string | null;
  income_type?: IncomeType; // defaults to 'general_income'
  // Contribution-specific optional fields
  envelope_number?: string;
  tax_deductible?: boolean;
  receipt_issued?: boolean;
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateIncomeInput): Promise<IncomeRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const payload = {
        organization_id: currentOrganization.id,
        branch_id: input.branch_id || null,
        amount: input.amount,
        category: input.category,
        payment_method: input.payment_method,
        date: input.date,
        description: input.description || null,
        notes: input.notes || null,
        occasion_name: input.occasion_name || null,
        attendance_occasion_id: input.attendance_occasion_id || null,
        attendance_session_id: input.attendance_session_id || null,
        source: input.source || null,
        source_type: input.source_type || null,
        member_id: input.member_id || null,
        group_id: input.group_id || null,
        tag_item_id: input.tag_item_id || null,
        receipt_number: input.receipt_number || null,
        created_by: user.id,
        income_type: input.income_type || 'general_income',
        envelope_number: input.envelope_number || null,
        tax_deductible: input.tax_deductible ?? null,
        receipt_issued: input.receipt_issued ?? null,
      };

      const { data, error } = await supabase
        .from('income')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as IncomeRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() });
      toast.success('Income record created');
    },
    onError: (error) => {
      console.error('Error creating income:', error);
      const msg = String((error as any)?.message || '');
      const code = (error as any)?.code;
      if (code === '23505' || msg.includes('uniq_income_receipt_per_org')) {
        toast.error('Receipt number already exists for your organization. Please use a unique number or leave it blank.');
      } else {
        toast.error('Failed to create income');
      }
    },
  });
}

export interface UpdateIncomeInput {
  id: string;
  updates: Partial<CreateIncomeInput> & { amount?: number; date?: string };
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateIncomeInput): Promise<IncomeRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      // Normalize fields: ensure blank receipt_number is stored as NULL to avoid unique constraint collisions
      const normalizedUpdates: Record<string, any> = { ...updates };
      if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'receipt_number')) {
        const raw = normalizedUpdates.receipt_number as string | undefined;
        const trimmed = typeof raw === 'string' ? raw.trim() : undefined;
        normalizedUpdates.receipt_number = trimmed ? trimmed : null;
      }

      const { data, error } = await supabase
        .from('income')
        .update(normalizedUpdates)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id) // RLS requires creator
        .select()
        .single();

      if (error) throw error;
      return data as IncomeRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incomeKeys.detail(data.id) });
      toast.success('Income record updated');
    },
    onError: (error) => {
      console.error('Error updating income:', error);
      const msg = String((error as any)?.message || '');
      const code = (error as any)?.code;
      if (code === '23505' || msg.includes('uniq_income_receipt_per_org')) {
        toast.error('Receipt number already exists for your organization. Please use a unique number or leave it blank.');
      } else {
        toast.error('Failed to update income');
      }
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('income')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.lists() });
      toast.success('Income record deleted');
    },
    onError: (error) => {
      console.error('Error deleting income:', error);
      toast.error('Failed to delete income');
    },
  });
}

// Convenience hook for contributions, sourced from income table
export function useContributions(params?: Omit<IncomeQueryParams, 'income_type'>) {
  const merged: IncomeQueryParams = { ...params, income_type: 'contribution' };
  return useIncomes(merged);
}
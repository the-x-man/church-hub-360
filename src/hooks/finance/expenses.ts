import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBranchScope, applyBranchScope } from '@/hooks/useBranchScope';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FinanceFilter, ExpenseRecord, PaymentMethod } from '@/types/finance';

export interface ExpenseQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: FinanceFilter;
}

export interface PaginatedExpensesResponse {
  data: ExpenseRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (organizationId: string, params?: ExpenseQueryParams) =>
    [...expenseKeys.lists(), organizationId, params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
};

function applyFinanceFilters(
  query: any,
  filters?: FinanceFilter
) {
  if (!filters) return query;

  if (filters.category_filter && filters.category_filter.length) {
    query = query.in('category', filters.category_filter as string[]);
  }

  // Purpose filter maps to `description` field values used as standardized purposes
  if (filters.purpose_filter && filters.purpose_filter.length) {
    query = query.in('description', filters.purpose_filter as string[]);
  }

  // Approved by filter matches member/user IDs stored in `approved_by`
  if (filters.approved_by_filter && filters.approved_by_filter.length) {
    query = query.in('approved_by', filters.approved_by_filter as string[]);
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

  if (filters.branch_id_filter && filters.branch_id_filter.length) {
    const ids = (filters.branch_id_filter as string[]).join(',');
    query = query.or(`branch_id.in.(${ids}),branch_id.is.null`);
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

export function useExpenses(params?: ExpenseQueryParams) {
  const { currentOrganization } = useOrganization();
  const scope = useBranchScope(currentOrganization?.id);

  const queryParams: Required<Pick<ExpenseQueryParams, 'page' | 'pageSize'>> & ExpenseQueryParams = {
    page: 1,
    pageSize: 10,
    ...params,
  };

  return useQuery({
    queryKey: [
      ...expenseKeys.list(currentOrganization?.id || '', queryParams),
      'branchScope',
      scope.isScoped ? scope.branchIds : 'all',
    ],
    queryFn: async (): Promise<PaginatedExpensesResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('expenses')
        .select('*, branch:branches(id, name), created_by_user:profiles(first_name, last_name)')
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryParams.search && queryParams.search.trim()) {
        const q = queryParams.search.trim();
        query = query.or(
          `description.ilike.%${q}%,vendor.ilike.%${q}%,receipt_number.ilike.%${q}%`
        );
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

export function useExpense(id: string | null) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: expenseKeys.detail(id || ''),
    queryFn: async (): Promise<ExpenseRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!id) throw new Error('Expense ID is required');

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data as ExpenseRecord;
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export interface CreateExpenseInput {
  amount: number;
  purpose?: string;
  payment_method: PaymentMethod;
  date: string; // YYYY-MM-DD
  description?: string;
  vendor?: string;
  receipt_number?: string;
  notes?: string;
  branch_id?: string | null;
  approved_by?: string | null;
  approval_date?: string | null; // YYYY-MM-DD
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput): Promise<ExpenseRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const payload = {
        organization_id: currentOrganization.id,
        branch_id: input.branch_id || null,
        amount: input.amount,
        purpose: input.purpose || null,
        payment_method: input.payment_method,
        date: input.date,
        description: input.description || null,
        vendor: input.vendor || null,
        receipt_number: input.receipt_number || null,
        notes: input.notes || null,
        approved_by: input.approved_by || null,
        approval_date: input.approval_date || null,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as ExpenseRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      toast.success('Expense record created');
    },
    onError: (error) => {
      console.error('Error creating expense:', error);
      toast.error('Failed to create expense');
    },
  });
}

export interface UpdateExpenseInput {
  id: string;
  updates: Partial<CreateExpenseInput> & { amount?: number; date?: string };
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateExpenseInput): Promise<ExpenseRecord> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...updates,
        })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as ExpenseRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(data.id) });
      toast.success('Expense record updated');
    },
    onError: (error) => {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('expenses')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('created_by', user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      toast.success('Expense record deleted');
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    },
  });
}
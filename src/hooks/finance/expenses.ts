import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBranchScope, applyBranchScope } from '@/hooks/useBranchScope';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FinanceFilter, ExpenseRecord, PaymentMethod, ExpenseCategory } from '@/types/finance';
import { insertFinanceActivityLog, sanitizeMetadata } from '@/utils/finance/activityLog';
import { activityLogKeys } from '@/hooks/finance/activityLogs';

export interface ExpenseQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: FinanceFilter;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  enabled?: boolean;
}

export interface PaginatedExpensesResponse {
  data: ExpenseRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isGrouped?: boolean;
}

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (organizationId: string, params?: ExpenseQueryParams) =>
    [...expenseKeys.lists(), organizationId, params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
};

export function applyFinanceFilters(
  query: any,
  filters?: FinanceFilter
) {
  if (!filters) return query;

  if (filters.category_filter && filters.category_filter.length) {
    query = query.in('category', filters.category_filter as string[]);
  }

  // Purpose filter maps to `description` field values used as standardized purposes
  if (filters.purpose_filter && filters.purpose_filter.length) {
    const vals = (filters.purpose_filter as string[])
      .map((v) => `'${String(v).replace(/'/g, "''")}'`)
      .join(',');
    query = query.or(`description.in.(${vals}),purpose.in.(${vals})`);
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
    enabled: params?.enabled !== false && !!currentOrganization?.id,
    queryFn: async (): Promise<PaginatedExpensesResponse> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      // ---------------------------------------------------------------------------
      // STRATEGY: Group-Based Pagination
      // To ensure categories are not split across pages, we paginate by distinct Categories first.
      // 1. Fetch all distinct categories matching the filters.
      // 2. Paginate the categories.
      // 3. Fetch all expenses belonging to the paginated categories.
      // ---------------------------------------------------------------------------

      // Step 1: Fetch all categories matching filters (Metadata only)
      // Note: For very large datasets, this should be optimized with an RPC 'get_distinct_categories'
      let catQuery = supabase
        .from('expenses')
        .select('category')
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false);

      if (queryParams.search && queryParams.search.trim()) {
        const q = queryParams.search.trim();
        catQuery = catQuery.or(
          `description.ilike.%${q}%,vendor.ilike.%${q}%,receipt_number.ilike.%${q}%`
        );
      }

      catQuery = applyFinanceFilters(catQuery, queryParams.filters);

      {
        const scoped = applyBranchScope(catQuery, scope, 'branch_id', true);
        if (scoped.abortIfEmpty) {
             return { data: [], totalCount: 0, totalPages: 1, currentPage: 1, pageSize: queryParams.pageSize!, isGrouped: true };
        }
        catQuery = scoped.query;
      }

      const { data: catData, error: catError } = await catQuery;
      if (catError) throw catError;

      // Extract unique categories (Case Insensitive)
      const categoryMap = new Map<string, Set<string>>();
      (catData || []).forEach((c: any) => {
          const lower = String(c.category).toLowerCase();
          if (!categoryMap.has(lower)) {
              categoryMap.set(lower, new Set());
          }
          categoryMap.get(lower)!.add(c.category);
      });

      const uniqueCategories = Array.from(categoryMap.keys());
      
      // Determine Category Sort Direction
      // If explicit sort by category, use provided direction. Default ASC.
      const categorySortAsc = (queryParams.sortKey === 'category' && queryParams.sortDirection === 'desc') ? false : true;
      
      uniqueCategories.sort((a, b) => {
          if (a < b) return categorySortAsc ? -1 : 1;
          if (a > b) return categorySortAsc ? 1 : -1;
          return 0;
      });

      const totalCategories = uniqueCategories.length;
      const totalPages = Math.ceil(totalCategories / queryParams.pageSize!);
      const currentPage = queryParams.page! > totalPages && totalPages > 0 ? totalPages : queryParams.page!;

      // Step 2: Paginate Categories
      const fromIndex = (currentPage - 1) * queryParams.pageSize!;
      const toIndex = fromIndex + queryParams.pageSize!;
      const pagedKeys = uniqueCategories.slice(fromIndex, toIndex);

      if (pagedKeys.length === 0) {
          return {
            data: [],
            totalCount: 0,
            totalPages: 1,
            currentPage: currentPage,
            pageSize: queryParams.pageSize!,
            isGrouped: true
          };
      }

      // Resolve back to original category strings for the query
      const targetCategories = pagedKeys.flatMap(k => Array.from(categoryMap.get(k) || []));

      // Step 3: Fetch Expenses for Paged Categories
      let query = supabase
        .from('expenses')
        .select('*, branch:branches(id, name), created_by_user:profiles(first_name, last_name)')
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .in('category', targetCategories);

      // Re-apply filters (technically redundant for category filtering but needed for other filters like date/amount/search to apply to the rows)
      if (queryParams.search && queryParams.search.trim()) {
        const q = queryParams.search.trim();
        query = query.or(
          `description.ilike.%${q}%,vendor.ilike.%${q}%,receipt_number.ilike.%${q}%`
        );
      }
      query = applyFinanceFilters(query, queryParams.filters);
      
      // Re-apply branch scope
      {
         const scoped = applyBranchScope(query, scope, 'branch_id', true);
         query = scoped.query;
      }

      // SORTING LOGIC
      // Primary Sort: Category (to match our pagination grouping)
      query = query.order('category', { ascending: categorySortAsc });

      // Secondary Sort: The requested sort key (within the category)
      if (queryParams.sortKey && queryParams.sortKey !== 'category') {
         if (queryParams.sortKey === 'branch') {
             // Handle relation sort
             query = query.order('name', { foreignTable: 'branch', ascending: queryParams.sortDirection === 'asc' });
         } else {
             // Handle standard column sort
             query = query.order(queryParams.sortKey, { ascending: queryParams.sortDirection === 'asc' });
         }
      } else {
         // Default Secondary: Date DESC
         query = query.order('date', { ascending: false });
      }
      
      // Tertiary Sort: Created At (Stability)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return {
        data: data || [],
        totalCount: totalCategories, // Return Total Categories count for Pagination
        totalPages: totalPages,
        currentPage: currentPage,
        pageSize: queryParams.pageSize!,
        isGrouped: true
      };
    },
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
  category: ExpenseCategory;
  purpose?: string;
  payment_method: PaymentMethod;
  date: string; // YYYY-MM-DD
  description?: string;
  vendor?: string;
  receipt_number?: string;
  check_number?: string;
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
        category: input.category,
        purpose: input.purpose || null,
        payment_method: input.payment_method,
        date: input.date,
        description: input.description || null,
        vendor: input.vendor || null,
        receipt_number: input.receipt_number || null,
        check_number: input.check_number || null,
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityLogKeys.lists() });
      queryClient.refetchQueries({ queryKey: activityLogKeys.lists() });
      toast.success('Expense record created');
      try {
        insertFinanceActivityLog({
          organization_id: currentOrganization!.id,
          branch_id: (data as any).branch_id || null,
          entity_type: 'expense',
          entity_id: (data as any).id,
          action_type: 'create',
          amount: (data as any).amount,
          payment_method: (data as any).payment_method,
          actor_id: user!.id,
          metadata: variables ? sanitizeMetadata(variables as any) : null,
        });
      } catch {}
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
      const normalizedUpdates: Record<string, any> = { ...updates };
      if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'receipt_number')) {
        const raw = normalizedUpdates.receipt_number as string | undefined;
        const trimmed = typeof raw === 'string' ? raw.trim() : undefined;
        normalizedUpdates.receipt_number = trimmed ? trimmed : null;
      }
      if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'check_number')) {
        const raw = normalizedUpdates.check_number as string | undefined;
        const trimmed = typeof raw === 'string' ? raw.trim() : undefined;
        normalizedUpdates.check_number = trimmed ? trimmed : null;
      }

      const { data, error } = await supabase
        .from('expenses')
        .update(normalizedUpdates)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      return data as ExpenseRecord;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: activityLogKeys.lists() });
      queryClient.refetchQueries({ queryKey: activityLogKeys.lists() });
      toast.success('Expense record updated');
      try {
        insertFinanceActivityLog({
          organization_id: currentOrganization!.id,
          branch_id: (data as any).branch_id || null,
          entity_type: 'expense',
          entity_id: (data as any).id,
          action_type: 'update',
          amount: (data as any).amount,
          payment_method: (data as any).payment_method,
          actor_id: user!.id,
          metadata: variables?.updates ? sanitizeMetadata({ updates: variables.updates }) : null,
        });
      } catch {}
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
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityLogKeys.lists() });
      queryClient.refetchQueries({ queryKey: activityLogKeys.lists() });
      toast.success('Expense record deleted');
      try {
        insertFinanceActivityLog({
          organization_id: currentOrganization!.id,
          branch_id: null,
          entity_type: 'expense',
          entity_id: id as string,
          action_type: 'delete',
          actor_id: user!.id,
          metadata: { soft_delete: true },
        });
      } catch {}
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    },
  });
}

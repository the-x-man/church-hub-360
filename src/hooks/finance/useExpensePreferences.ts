import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getFinancePreferences, upsertFinancePreferences } from '@/db/expensePrefsDb';

// Derive readable defaults from ExpenseCategory, plus a few common ones
const DEFAULT_CATEGORIES: { key: string; label: string; purposes: string[] }[] = [
  { key: 'utilities', label: 'Utilities', purposes: ['Electricity','Water','Internet','Gas','Waste'] },
  { key: 'maintenance', label: 'Maintenance', purposes: ['Building Repairs','Equipment Repairs','Maintenance Contract'] },
  { key: 'supplies', label: 'Supplies', purposes: ['Office Supplies','Cleaning Supplies','Consumables'] },
  { key: 'equipment', label: 'Equipment', purposes: ['Audio Equipment','Furniture','IT Equipment'] },
  { key: 'salaries', label: 'Salaries', purposes: ['Pastoral Staff','Administrative Staff','Support Staff'] },
  { key: 'benefits', label: 'Benefits', purposes: ['Health Insurance','Retirement','Allowances'] },
  { key: 'ministry_expenses', label: 'Ministry Expenses', purposes: ['Children Ministry','Youth Ministry','Music Ministry'] },
  { key: 'outreach', label: 'Outreach', purposes: ['Community Outreach','Advertising','Evangelism Materials'] },
  { key: 'missions', label: 'Missions', purposes: ['Mission Trip Support','Missionary Support','Local Missions'] },
  { key: 'events', label: 'Events', purposes: ['Conference','Retreat','Workshop'] },
  { key: 'transportation', label: 'Transportation', purposes: ['Fuel','Vehicle Maintenance','Transport Services'] },
  { key: 'insurance', label: 'Insurance', purposes: ['Property Insurance','Vehicle Insurance','Liability Insurance'] },
  { key: 'professional_services', label: 'Professional Services', purposes: ['Accounting','Legal','Consulting'] },
  { key: 'other', label: 'Other', purposes: ['Miscellaneous'] },
];

export function useExpensePreferences() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id || '';
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['finance_preferences', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      return await getFinancePreferences(orgId);
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const parsed = useMemo(() => {
    try {
      const raw = data?.expenses_prefs || '';
      const obj = raw ? JSON.parse(raw) : null;
      if (obj && Array.isArray(obj.categories)) return obj;
    } catch {}
    return { categories: DEFAULT_CATEGORIES };
  }, [data]);

  const categoryOptions = useMemo(() => {
    return parsed.categories.map((c: any) => c.label);
  }, [parsed]);

  const categoryKeys = useMemo(() => {
    return parsed.categories.map((c: any) => c.key);
  }, [parsed]);

  const getPurposeOptions = (categoryKey?: string) => {
    if (!categoryKey) return Array.from(new Set(parsed.categories.flatMap((c: any) => c.purposes)));
    const cat = parsed.categories.find((c: any) => c.key === categoryKey);
    return cat ? cat.purposes : [];
  };

  const addPurposeMutation = useMutation({
    mutationFn: async ({ categoryKey, label }: { categoryKey: string; label: string }) => {
      if (!orgId || !user?.id) return null;
      const next = { ...parsed } as any;
      const idx = next.categories.findIndex((c: any) => c.key === categoryKey);
      if (idx >= 0) {
        const list: string[] = next.categories[idx].purposes || [];
        if (!list.includes(label)) {
          next.categories[idx].purposes = [...list, label];
        }
      }
      const payload = { expenses_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const removePurposeMutation = useMutation({
    mutationFn: async ({ categoryKey, label }: { categoryKey: string; label: string }) => {
      if (!orgId || !user?.id) return null;
      const next = { ...parsed } as any;
      const idx = next.categories.findIndex((c: any) => c.key === categoryKey);
      if (idx >= 0) {
        const list: string[] = next.categories[idx].purposes || [];
        next.categories[idx].purposes = list.filter((x) => x !== label);
      }
      const payload = { expenses_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const purposeOptions = useMemo(() => Array.from(new Set(parsed.categories.flatMap((c: any) => c.purposes))), [parsed]);

  const savePrefsMutation = useMutation({
    mutationFn: async (next: any) => {
      if (!orgId || !user?.id) return null;
      const payload = { expenses_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (label: string) => {
      if (!orgId || !user?.id || !label.trim()) return null;
      const slug = label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const exists = parsed.categories.some((c: any) => c.key === slug);
      const next = exists
        ? parsed
        : { categories: [...parsed.categories, { key: slug || 'other', label, purposes: [] }] };
      const payload = { expenses_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const removeCategoryMutation = useMutation({
    mutationFn: async (key: string) => {
      if (!orgId || !user?.id) return null;
      const next = { categories: parsed.categories.filter((c: any) => c.key !== key) };
      const payload = { expenses_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  const renameCategoryMutation = useMutation({
    mutationFn: async ({ key, label }: { key: string; label: string }) => {
      if (!orgId || !user?.id) return null;
      const next = {
        categories: parsed.categories.map((c: any) => (c.key === key ? { ...c, label } : c)),
      } as any;
      const payload = { expenses_prefs: JSON.stringify(next) };
      return await upsertFinancePreferences(orgId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_preferences', orgId] });
    },
  });

  return {
    prefs: parsed,
    categoryOptions,
    categoryKeys,
    purposeOptions,
    getPurposeOptions,
    addPurpose: (categoryKey: string, label: string) => addPurposeMutation.mutate({ categoryKey, label }),
    removePurpose: (categoryKey: string, label: string) => removePurposeMutation.mutate({ categoryKey, label }),
    savePreferences: (next: any) => savePrefsMutation.mutate(next),
    addCategory: (label: string) => addCategoryMutation.mutate(label),
    removeCategory: (key: string) => removeCategoryMutation.mutate(key),
    renameCategory: (key: string, label: string) => renameCategoryMutation.mutate({ key, label }),
  };
}
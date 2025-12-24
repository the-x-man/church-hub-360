import type { IncomeResponseRow, ExpenseRecord, PledgeRecord } from "@/types/finance";

// Generic sum-by helper; defaults to using `amount` but allows custom amount selector
export function sumByCategory<T extends { amount?: number }>(
  items: T[],
  getKey: (item: T) => string | null | undefined,
  getAmount?: (item: T) => number
) {
  const map = new Map<string, number>();
  for (const it of items) {
    const key = getKey(it);
    if (!key) continue;
    const amt = Number(getAmount ? getAmount(it) : (it as any).amount || 0);
    map.set(key, (map.get(key) || 0) + amt);
  }
  return map;
}

export function totalAmount<T extends { amount?: number }>(items: T[]) {
  return items.reduce((s, r) => s + Number((r as any).amount || 0), 0);
}

export function incomeSections(incomes: IncomeResponseRow[]) {
  const general = incomes.filter((r) => r.income_type === 'general_income');
  const other = incomes.filter((r) => r.income_type !== 'general_income');
  const generalMap = sumByCategory(general, (r) => r.category || 'Unknown');
  const otherMap = sumByCategory(other, (r) => r.category || 'Unknown');
  return {
    generalItems: Array.from(generalMap.entries()).map(([label, amount]) => ({ label, amount })),
    otherItems: Array.from(otherMap.entries()).map(([label, amount]) => ({ label, amount })),
    generalTotal: totalAmount(general),
    otherTotal: totalAmount(other),
  };
}

export function formatCategoryLabel(key: string, labelMap?: Record<string, string>) {
  if (!key) return '';
  // 1. Try exact match from preferences
  if (labelMap && labelMap[key]) {
    return labelMap[key];
  }
  // 2. Fallback: manual formatting (replace underscores, capitalize words)
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function expenseSections(
  expenses: ExpenseRecord[],
  grouping: 'category' | 'purpose' = 'category',
  categoryLabelMap?: Record<string, string>
) {
  const map = sumByCategory(expenses, (r) => {
    if (grouping === 'purpose') return r.purpose || 'Unspecified';
    const key = r.category || 'Unspecified';
    return formatCategoryLabel(key, categoryLabelMap);
  });
  const items = Array.from(map.entries()).map(([label, amount]) => ({ label, amount }));
  // Sort items alphabetically by label
  items.sort((a, b) => a.label.localeCompare(b.label));

  return {
    items,
    total: expenses.reduce((s, r) => s + (r.amount || 0), 0),
  };
}

export function pledgesSummary(pledges: PledgeRecord[]) {
  const totalPledged = pledges.reduce((s, r) => s + (r.pledge_amount || 0), 0);
  const totalPaid = pledges.reduce((s, r) => s + (r.amount_paid || 0), 0);
  const totalRemaining = pledges.reduce(
    (s, r) => s + (r.amount_remaining ?? Math.max(0, (r.pledge_amount || 0) - (r.amount_paid || 0))),
    0
  );
  // Sum totals grouped by pledge_type
  const typeSelector = (r: any) => r.pledge_type || 'Pledge';
  const pledgedMap = sumByCategory(pledges as any, typeSelector, (r: any) => r.pledge_amount || 0);
  const paidMap = sumByCategory(pledges as any, typeSelector, (r: any) => r.amount_paid || 0);
  const remainingMap = sumByCategory(
    pledges as any,
    typeSelector,
    (r: any) => (r.amount_remaining ?? Math.max(0, (r.pledge_amount || 0) - (r.amount_paid || 0)))
  );

  const allLabels = new Set<string>([...pledgedMap.keys(), ...paidMap.keys(), ...remainingMap.keys()]);
  const typeItems = Array.from(allLabels.values()).map((label) => ({
    label,
    pledged: pledgedMap.get(label) || 0,
    fulfilled: paidMap.get(label) || 0,
    remaining: remainingMap.get(label) || 0,
  }));

  return { totalPledged, totalPaid, totalRemaining, typeItems };
}

export const formatCurrency = (n: number) => `GHS${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
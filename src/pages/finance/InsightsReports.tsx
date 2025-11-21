import React from 'react';
import {
  FinanceStatsCards,
  incomeStatsConfig,
  expenseStatsConfig,
  pledgeStatsConfig,
} from '@/components/finance';
import { contributionDonationStatsConfig } from '@/components/finance/contributions/ContributionDonationStatsConfig';
import { FinanceReportGenerator } from '@/components/finance/FinanceReportGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsFilterBar, type StatsFilter } from '@/components/finance/StatsFilterBar';
import { useBranches } from '@/hooks/useBranchQueries';
import { resolveDateFilterRange } from '@/utils/finance/dateRange';
import { useIncomes } from '@/hooks/finance/income';
import { useExpenses } from '@/hooks/finance/expenses';
import { usePledges } from '@/hooks/finance/pledges';
import { useAllPledgePayments, usePledgePaymentsAsIncome } from '@/hooks/finance/payments';
import type { FinanceFilter, IncomeResponseRow, ExpenseRecord, PledgeRecord, PledgePayment } from '@/types/finance';
import { useOrganization } from '@/contexts/OrganizationContext';

export function InsightsReports() {
  const [filters, setFilters] = React.useState<FinanceFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });
  const [mode, setMode] = React.useState<'stats' | 'builder'>('stats');
  const [statsFilters, setStatsFilters] = React.useState<StatsFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
    item: 'all',
    branch_id_filter: undefined,
  });
  const [pageSize] = React.useState<number>(50);
  const { currentOrganization } = useOrganization();
  const { data: allBranches = [] } = useBranches(currentOrganization?.id);
  const statsBranchName = React.useMemo(() => {
    const bid = statsFilters.branch_id_filter?.[0];
    if (!bid) return undefined;
    const b = (allBranches as any[]).find((br) => br.id === bid);
    return b?.name as string | undefined;
  }, [statsFilters.branch_id_filter, allBranches]);

  // Effective branch/date filters per mode
  const effectiveBranchFilter = mode === 'stats' ? statsFilters.branch_id_filter : filters.branch_id_filter;
  const effectiveDateFilter = mode === 'stats' ? statsFilters.date_filter : filters.date_filter;

  // Queries — scoped by active filters and larger page size to improve summary accuracy
  const generalIncomeQ = useIncomes({
    page: 1,
    pageSize,
    filters: { ...filters, date_filter: effectiveDateFilter, branch_id_filter: effectiveBranchFilter },
    income_type: 'general_income',
  });
  const contribDonateQ = useIncomes({
    page: 1,
    pageSize,
    filters: { ...filters, date_filter: effectiveDateFilter, branch_id_filter: effectiveBranchFilter },
    income_types: ['contribution', 'donation'],
  });
  const pledgePaymentsIncomeQ = usePledgePaymentsAsIncome({
    page: 1,
    pageSize,
    dateFilter: effectiveDateFilter,
    filters: { date_filter: effectiveDateFilter, branch_id_filter: effectiveBranchFilter },
  });
  const expensesQ = useExpenses({ page: 1, pageSize, filters: { ...filters, date_filter: effectiveDateFilter, branch_id_filter: effectiveBranchFilter } });
  const pledgesQ = usePledges({
    page: 1,
    pageSize,
    filters: { date_filter: effectiveDateFilter, branch_id_filter: effectiveBranchFilter },
  });
  const paymentsQ = useAllPledgePayments({
    page: 1,
    pageSize,
    dateFilter: effectiveDateFilter,
    filters: { date_filter: effectiveDateFilter, branch_id_filter: effectiveBranchFilter },
  });

  // Derived arrays
  const generalIncome = (generalIncomeQ.data?.data ||
    []) as IncomeResponseRow[];
  const contribDonateIncome = (contribDonateQ.data?.data ||
    []) as IncomeResponseRow[];
  const pledgePaymentsIncome = (pledgePaymentsIncomeQ.data?.data || []) as IncomeResponseRow[];
  const expenses = (expensesQ.data?.data || []) as ExpenseRecord[];
  const pledges = (pledgesQ.data?.data || []) as PledgeRecord[];
  const payments = (paymentsQ.data?.data || []) as PledgePayment[];

  // Stats filtering scope (Stats-only view)
  const statsRange = React.useMemo(() => resolveDateFilterRange(statsFilters.date_filter), [statsFilters.date_filter]);
  const inRange = React.useCallback(
    (isoDate?: string | null) => {
      if (!statsRange) return true;
      if (!isoDate) return false;
      const d = new Date(isoDate);
      return d >= statsRange.start && d <= statsRange.end;
    },
    [statsRange]
  );

  const statsIncomeRecords = React.useMemo(() => generalIncome.filter((r) => inRange(r.date)), [generalIncome, inRange]);
  const statsContribDonateRecords = React.useMemo(
    () => contribDonateIncome.filter((r) => inRange(r.date)),
    [contribDonateIncome, inRange]
  );
  const statsExpensesRecords = React.useMemo(() => expenses.filter((r) => inRange(r.date)), [expenses, inRange]);
  const statsPledgesRecords = React.useMemo(
    () => pledges.filter((r) => inRange((r as any).start_date ?? (r as any).created_at ?? null)),
    [pledges, inRange]
  );

  // Stats — Income
  const incomeStats = React.useMemo(() => {
    const total = statsIncomeRecords.reduce((s, r) => s + (r.amount || 0), 0);
    const count = statsIncomeRecords.length;
    const avg = count > 0 ? total / count : 0;
    const occTotals = statsIncomeRecords.reduce((acc, r) => {
      const key = r.category || 'N/A';
      acc[key] = (acc[key] || 0) + (r.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    const top = Object.entries(occTotals).sort(([, a], [, b]) => b - a)[0];
    const topOccasion = top ? top[0] : 'N/A';
    const topAmount = top ? top[1] : 0;
    return incomeStatsConfig({
      totalIncome: total,
      recordCount: count,
      averageIncome: avg,
      topOccasion,
      topOccasionAmount: topAmount,
    });
  }, [statsIncomeRecords]);

  // Stats — Contributions & Donations
  const contribDonateStats = React.useMemo(() => {
    const totalContribution = statsContribDonateRecords
      .filter((r) => r.income_type === 'contribution')
      .reduce((s, r) => s + (r.amount || 0), 0);
    const totalDonation = statsContribDonateRecords
      .filter((r) => r.income_type === 'donation')
      .reduce((s, r) => s + (r.amount || 0), 0);
    const count = statsContribDonateRecords.length;
    const avg = count > 0 ? (totalContribution + totalDonation) / count : 0;
    const contributorTotals = statsContribDonateRecords.reduce((acc, r) => {
      const key = r.contributor_name || 'Unknown';
      acc[key] = (acc[key] || 0) + (r.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    const top = Object.entries(contributorTotals).sort(
      ([, a], [, b]) => b - a
    )[0];
    const topContributor = top ? top[0] : 'N/A';
    const topAmount = top ? top[1] : 0;
    return contributionDonationStatsConfig({
      totalContributionAmount: totalContribution,
      totalDonationAmount: totalDonation,
      recordCount: count,
      averageAmount: avg,
      topContributor,
      topContributorAmount: topAmount,
    });
  }, [statsContribDonateRecords]);

  // Stats — Expenses
  const expenseStats = React.useMemo(() => {
    const total = statsExpensesRecords.reduce((s, r) => s + (r.amount || 0), 0);
    const count = statsExpensesRecords.length;
    const avg = count > 0 ? total / count : 0;
    const catTotals = statsExpensesRecords.reduce((acc, r) => {
      const key = r.purpose || 'N/A';
      acc[key] = (acc[key] || 0) + (r.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    const top = Object.entries(catTotals).sort(([, a], [, b]) => b - a)[0];
    const topCat = top ? top[0] : 'N/A';
    const topAmount = top ? top[1] : 0;
    return expenseStatsConfig({
      totalExpenses: total,
      recordCount: count,
      averageExpense: avg,
      topCategory: topCat,
      topCategoryAmount: topAmount,
    });
  }, [statsExpensesRecords]);

  // Stats — Pledges summary
  const pledgeStats = React.useMemo(() => {
    const totalPledgeAmount = statsPledgesRecords.reduce(
      (s, r) => s + (r.pledge_amount || 0),
      0
    );
    const fulfilled = statsPledgesRecords.reduce((s, r) => s + (r.amount_paid || 0), 0);
    const pending = statsPledgesRecords.reduce(
      (s, r) =>
        s +
        (r.amount_remaining ||
          Math.max(0, (r.pledge_amount || 0) - (r.amount_paid || 0))),
      0
    );
    const count = statsPledgesRecords.length;
    const fulfillmentRate =
      totalPledgeAmount > 0 ? (fulfilled / totalPledgeAmount) * 100 : 0;
    return pledgeStatsConfig({
      totalPledges: totalPledgeAmount,
      recordCount: count,
      fulfilledAmount: fulfilled,
      pendingAmount: pending,
      fulfillmentRate,
    });
  }, [statsPledgesRecords]);

  // Report generation is handled by the embedded FinanceReportGenerator section

  const loading =
    generalIncomeQ.isLoading ||
    contribDonateQ.isLoading ||
    pledgePaymentsIncomeQ.isLoading ||
    expensesQ.isLoading ||
    pledgesQ.isLoading ||
    paymentsQ.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Insights & Reports</h2>
        <Button
          variant="outline"
          onClick={() => setMode(mode === 'stats' ? 'builder' : 'stats')}
        >
          {mode === 'stats' ? 'Generate Finance Report' : 'Back to General Stats'}
        </Button>
      </div>

      {mode === 'stats' ? (
        <>
          <StatsFilterBar value={statsFilters} onChange={setStatsFilters} />

          <Card>
            <CardHeader>
              <CardTitle>General Stats</CardTitle>
              <p className="text-sm text-muted-foreground">{statsBranchName ? `Branch: ${statsBranchName}` : 'Branch: All branches'}</p>
            </CardHeader>
            <CardContent>
              {statsFilters.item === 'all' && (
                <div className="grid grid-cols-1 gap-4">
                  <FinanceStatsCards stats={incomeStats} loading={generalIncomeQ.isLoading} />
                  <FinanceStatsCards stats={expenseStats} loading={expensesQ.isLoading} />
                  <FinanceStatsCards stats={contribDonateStats} loading={contribDonateQ.isLoading} />
                  <FinanceStatsCards stats={pledgeStats} loading={pledgesQ.isLoading} />
                </div>
              )}

              {statsFilters.item === 'income' && (
                <FinanceStatsCards stats={incomeStats} loading={generalIncomeQ.isLoading} />
              )}
              {statsFilters.item === 'expenses' && (
                <FinanceStatsCards stats={expenseStats} loading={expensesQ.isLoading} />
              )}
              {statsFilters.item === 'contrib' && (
                <FinanceStatsCards stats={contribDonateStats} loading={contribDonateQ.isLoading} />
              )}
              {statsFilters.item === 'pledges' && (
                <FinanceStatsCards stats={pledgeStats} loading={pledgesQ.isLoading} />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <FinanceReportGenerator
          filters={filters}
          onFiltersChange={setFilters}
          incomes={[...generalIncome, ...contribDonateIncome, ...pledgePaymentsIncome]}
          expenses={expenses}
          pledges={pledges}
          payments={payments}
          loading={loading}
        />
      )}
    </div>
  );
}

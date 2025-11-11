import { contributionTypes } from '@/components/finance/constants';
import { contributionDonationStatsConfig } from '@/components/finance/contributions/ContributionDonationStatsConfig';
import { ContributionsTable } from '@/components/finance/contributions/ContributionsTable';
import { IncomeViewDialog } from '@/components/finance/IncomeViewDialog';
import { FinanceFilterBar } from '@/components/finance/FinanceFilterBar';
import { FinanceStatsCards } from '@/components/finance/FinanceStatsCards';
import { IncomeFormDialog } from '@/components/finance/IncomeFormDialog';
import { ReceiptPrintDialog } from '@/components/finance/ReceiptPrintDialog';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { Pagination } from '@/components/shared/Pagination';
// import { useOrganization } from '@/contexts/OrganizationContext';
import { useDeleteIncome, useIncomes } from '@/hooks/finance/income';
import type {
  FinanceFilter,
  IncomeResponseRow,
  IncomeType,
} from '@/types/finance';
import { Heart } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { AmountComparison } from '@/utils/finance/search';

const Contributions: React.FC = () => {
  // Data: use contributions from income table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [amountSearch, setAmountSearch] = useState<AmountComparison | null>(
    null
  );
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | IncomeType>(
    'all'
  );

  const contributionsQuery = useIncomes({
    page,
    pageSize,
    search,
    amount_comparison: amountSearch || undefined,
    filters,
    income_types:
      recordTypeFilter === 'all'
        ? ['contribution', 'donation']
        : [recordTypeFilter],
  });
  const contributions: IncomeResponseRow[] =
    contributionsQuery.data?.data || [];

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [
    selectedContribution,
    setSelectedContribution,
  ] = useState<IncomeResponseRow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptRecord, setReceiptRecord] = useState<IncomeResponseRow | null>(
    null
  );

  // Mutations
  const deleteIncome = useDeleteIncome();

  const handleEditOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setSelectedContribution(null);
    }
  };

  // Handle edit
  const handleEdit = (contribution: IncomeResponseRow) => {
    setSelectedContribution(contribution);
    setIsEditDialogOpen(true);
  };

  // Handle view
  const handleView = (contribution: IncomeResponseRow) => {
    setSelectedContribution(contribution);
    setIsViewDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (contribution: IncomeResponseRow) => {
    setSelectedContribution(contribution);
    setIsDeleteDialogOpen(true);
  };

  // Filtered contributions
  const filteredContributions = useMemo(() => {
    return contributions.filter((contribution) => {
      // Category filter (contribution type)
      if (
        filters.category_filter &&
        filters.category_filter.length > 0 &&
        !filters.category_filter.includes(contribution.category)
      ) {
        return false;
      }

      // Payment method filter
      if (
        filters.payment_method_filter &&
        filters.payment_method_filter.length > 0 &&
        !filters.payment_method_filter.includes(contribution.payment_method)
      ) {
        return false;
      }

      return true;
    });
  }, [contributions, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalAmount = filteredContributions.reduce(
      (sum, contribution) => sum + contribution.amount,
      0
    );
    const totalContributionAmount = filteredContributions
      .filter((c) => c.income_type === 'contribution')
      .reduce((sum, c) => sum + c.amount, 0);
    const totalDonationAmount = filteredContributions
      .filter((c) => c.income_type === 'donation')
      .reduce((sum, c) => sum + c.amount, 0);
    const recordCount = filteredContributions.length;
    const averageAmount = recordCount > 0 ? totalAmount / recordCount : 0;

    // Find top contributor
    const contributorTotals = filteredContributions.reduce(
      (acc, contribution) => {
        const key = (contribution as any).contributor_name || 'Unknown';
        acc[key] = (acc[key] || 0) + contribution.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const topContributor = Object.entries(contributorTotals).reduce(
      (max, [name, amount]) => (amount > max.amount ? { name, amount } : max),
      { name: 'None', amount: 0 }
    );

    return {
      totalAmount,
      totalContributionAmount,
      totalDonationAmount,
      recordCount,
      averageAmount,
      topContributor: topContributor.name,
      topContributorAmount: topContributor.amount,
    };
  }, [filteredContributions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Contributions & Donations</h1>
        </div>

        <IncomeFormDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          mode="add"
          title="Add Record"
          initialData={{
            income_type: 'contribution',
            category: 'Contribution',
          }}
          allowedIncomeTypes={['contribution', 'donation']}
        />
      </div>

      {/* Stats Cards */}
      <FinanceStatsCards
        stats={contributionDonationStatsConfig({
          totalContributionAmount: stats.totalContributionAmount,
          totalDonationAmount: stats.totalDonationAmount,
          recordCount: stats.recordCount,
          averageAmount: stats.averageAmount,
          topContributor: stats.topContributor,
          topContributorAmount: stats.topContributorAmount,
        })}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
      />
      {/* Filter Bar */}
      <FinanceFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        categoryOptions={contributionTypes}
        onSearchChange={setSearch}
        amountSearch={amountSearch}
        onAmountSearchChange={setAmountSearch}
        showAddButton={true}
        onAddClick={() => setIsAddDialogOpen(true)}
        addButtonLabel="Add Record"
        recordTypeFilter={recordTypeFilter}
        onRecordTypeFilterChange={setRecordTypeFilter}
        incomeTypeFilterOptions={['contribution', 'donation']}
      />

      {/* Data Table */}
      <ContributionsTable
        data={filteredContributions}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReceipt={(record) => {
          setReceiptRecord(record);
          setIsReceiptDialogOpen(true);
        }}
        printTitle={
          recordTypeFilter === 'all'
            ? 'Contributions & Donations'
            : recordTypeFilter === 'contribution'
            ? 'Contributions'
            : 'Donations'
        }
        printDateFilter={filters.date_filter}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={contributionsQuery.data?.totalPages || 1}
        pageSize={pageSize}
        totalItems={contributionsQuery.data?.totalCount || 0}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
        itemName="records"
      />

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <IncomeFormDialog
          key={selectedContribution?.id || 'edit'}
          open={isEditDialogOpen}
          onOpenChange={handleEditOpenChange}
          mode="edit"
          title="Edit Record"
          initialData={selectedContribution || undefined}
          allowedIncomeTypes={['contribution', 'donation']}
        />
      )}

      {/* View Dialog */}
      <IncomeViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        contribution={selectedContribution as any}
        onEdit={handleEdit}
        incomeType="contribution"
      />

      {/* Receipt Dialog */}
      <ReceiptPrintDialog
        open={isReceiptDialogOpen}
        onOpenChange={(o) => {
          setIsReceiptDialogOpen(o);
          if (!o) setReceiptRecord(null);
        }}
        record={receiptRecord}
      />
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          if (selectedContribution) {
            await deleteIncome.mutateAsync(selectedContribution.id);
          }
          setIsDeleteDialogOpen(false);
          setSelectedContribution(null);
        }}
        title="Delete Record"
        description="Are you sure you want to delete this record?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isLoading={deleteIncome.isPending}
      />
    </div>
  );
};

export default Contributions;

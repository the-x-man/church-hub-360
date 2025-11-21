import type { TableAction, TableColumn } from '@/components/finance';
import {
  FinanceDataTable,
  FinanceFilterBar,
  FinanceStatsCards,
  incomeStatsConfig,
} from '@/components/finance';
import { paymentMethodOptions } from '@/components/finance/constants';
import { IncomeFormDialog } from '@/components/finance/IncomeFormDialog';
import { IncomeViewDialog } from '@/components/finance/IncomeViewDialog';
import { ReceiptPrintDialog } from '@/components/finance/ReceiptPrintDialog';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { Pagination } from '@/components/shared/Pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { extendedIncomeTypes } from '@/constants/finance/income';
import { useDeleteIncome, useIncomes } from '@/hooks/finance/income';
import type { FinanceFilter, IncomeResponseRow } from '@/types/finance';
import type { AmountComparison } from '@/utils/finance/search';
import { Edit, Eye, Receipt, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

const Income: React.FC = () => {
  // Filters, search, sorting
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [amountSearch, setAmountSearch] = useState<AmountComparison | null>(
    null
  );
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialogs & selection
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptRecord, setReceiptRecord] = useState<IncomeResponseRow | null>(
    null
  );
  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState<IncomeResponseRow | null>(null);

  // Query hooks
  const incomesQuery = useIncomes({
    page,
    pageSize,
    search,
    filters,
    income_type: 'general_income',
    amount_comparison: amountSearch || undefined,
  });
  const deleteIncome = useDeleteIncome();

  // Filter and sort data (client-side, after server filters/search)
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...(incomesQuery.data?.data || [])];

    if (filters.category_filter?.length) {
      filtered = filtered.filter((record) =>
        (filters.category_filter || []).includes(record.category)
      );
    }

    if (filters.payment_method_filter?.length) {
      filtered = filtered.filter((record) =>
        (filters.payment_method_filter || []).includes(record.payment_method)
      );
    }

    if (sortKey === 'branch') {
      filtered.sort((a, b) => {
        const an = (a.branch?.name || '').toLowerCase();
        const bn = (b.branch?.name || '').toLowerCase();
        if (an < bn) return sortDirection === 'asc' ? -1 : 1;
        if (an > bn) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      filtered.sort((a, b) => {
        let aValue = (a as any)[sortKey];
        let bValue = (b as any)[sortKey];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [incomesQuery.data?.data, filters, sortKey, sortDirection]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalIncome = filteredAndSortedData.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );
    const recordCount = filteredAndSortedData.length;
    const averageIncome = recordCount > 0 ? totalIncome / recordCount : 0;

    const occasionTotals = filteredAndSortedData.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + (r.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    const topOccasionEntry = Object.entries(occasionTotals).sort(
      ([, a], [, b]) => b - a
    )[0];
    const topOccasion = topOccasionEntry ? topOccasionEntry[0] : 'N/A';
    const topOccasionAmount = topOccasionEntry ? topOccasionEntry[1] : 0;

    return incomeStatsConfig({
      totalIncome,
      recordCount,
      averageIncome,
      topOccasion,
      topOccasionAmount,
    });
  }, [filteredAndSortedData]);

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'contributor_name',
      label: 'Source',
      sortable: true,
      render: (_value, record) => {
        const r: any = record || {};
        const name: string = r.contributor_name || 'Unknown';
        const sourceType: string = r.source_type || '';

        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        if (sourceType === 'member') {
          const avatarUrl: string | undefined =
            r.contributor_avatar_url ||
            r.member?.profile_image_url ||
            r.members?.profile_image_url;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[220px]">{name}</span>
            </div>
          );
        }

        if (sourceType === 'tag_item') {
          const color: string | undefined =
            r.contributor_tag_color || r.tag_item?.color || r.tag_items?.color;
          return (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border shrink-0"
                style={{ backgroundColor: color || 'transparent' }}
              />
              <span className="truncate max-w-[220px]">{name}</span>
            </div>
          );
        }

        return <span className="truncate max-w-[240px]">{name}</span>;
      },
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => value || '-',
    },
    {
      key: 'occasion_name',
      label: 'Occasion Name',
      render: (value) => value || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (value) =>
        (paymentMethodOptions.find((opt) => opt.value === value)?.label ||
          value) as string,
    },
    {
      key: 'branch',
      label: 'Branch',
      sortable: true,
      render: (_: any, record: IncomeResponseRow) => record.branch?.name || 'All branches',
    },
    {
      key: 'receipt_number',
      label: 'Receipt #',
      render: (value) => value || '-',
    },
  ];

  // Table actions
  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (record) => {
        setSelectedRecord(record as IncomeResponseRow);
        setIsViewDialogOpen(true);
      },
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (record) => {
        setSelectedRecord(record as IncomeResponseRow);
        setIsEditDialogOpen(true);
      },
    },
    {
      key: 'receipt',
      label: 'Generate Receipt',
      icon: <Receipt className="h-4 w-4" />,
      onClick: (record) => {
        setReceiptRecord(record as IncomeResponseRow);
        setIsReceiptDialogOpen(true);
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (record) => {
        setSelectedRecord(record as IncomeResponseRow);
        setIsDeleteDialogOpen(true);
      },
      variant: 'destructive',
    },
  ];

  // Form handlers
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Income Management</h1>
        </div>
      </div>

      {/* Statistics Cards */}
      <FinanceStatsCards stats={stats} loading={incomesQuery.isLoading} />

      {/* Filter Bar */}
      <FinanceFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        categoryOptions={extendedIncomeTypes.map((t) => ({
          value: t,
          label: t,
        }))}
        paymentMethodOptions={paymentMethodOptions}
        searchPlaceholder="Search income records..."
        onSearchChange={setSearch}
        amountSearch={amountSearch}
        onAmountSearchChange={setAmountSearch}
        showAddButton={true}
        onAddClick={() => setIsAddDialogOpen(true)}
        addButtonLabel="Add Income"
        incomeTypeFilterOptions={['general_income']}
        recordTypeFilter={'general_income'}
        filterVisibility={{
          category: true,
          payment_method: true,
          amount_range: true,
          group: true,
          tag_item: true,
          occasion: true,
          session: true,
        }}
      />

      {/* Data Table */}
      <FinanceDataTable
        data={filteredAndSortedData}
        columns={columns}
        actions={actions}
        loading={incomesQuery.isLoading || deleteIncome.isPending}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        emptyMessage="No income records found"
        printTitle="Income"
        printDateFilter={filters.date_filter}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={incomesQuery.data?.totalPages || 1}
        pageSize={pageSize}
        totalItems={incomesQuery.data?.totalCount || 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        itemName="records"
      />

      {/* Add/Edit Dialogs */}
      <IncomeFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="add"
        title="Add Income"
        onSuccess={() => setIsAddDialogOpen(false)}
        initialData={{
          income_type: 'general_income',
          category: 'Offering',
          source_type: 'church',
        }}
        allowedIncomeTypes={['general_income']}
      />

      <IncomeFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        title="Edit Income"
        onSuccess={() => setIsEditDialogOpen(false)}
        initialData={selectedRecord || undefined}
        allowedIncomeTypes={['general_income']}
      />

      {/* View Dialog */}
      <IncomeViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        contribution={selectedRecord}
        onEdit={(record) => {
          setSelectedRecord(record);
          setIsViewDialogOpen(false);
          setIsEditDialogOpen(true);
        }}
        incomeType="general_income"
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

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          if (!selectedRecord?.id) return;
          try {
            await deleteIncome.mutateAsync(selectedRecord.id);
            setIsDeleteDialogOpen(false);
            setSelectedRecord(null);
          } catch (err) {
            // useDeleteIncome already shows toast on error
          }
        }}
        title="Delete Income Record"
        description="Are you sure you want to delete this record?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isLoading={deleteIncome.isPending}
      />
    </div>
  );
};

export { Income };

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
 
import React, { useMemo, useState } from 'react';

import {
  FinanceDataTable,
  ExpenseFilterBar,
  FinanceStatsCards,
} from '@/components/finance';
import type {
  TableAction,
  TableColumn,
} from '@/components/finance/FinanceDataTable';
import { Pagination } from '@/components/shared/Pagination';
 
import { useOrganization } from '@/contexts/OrganizationContext';
import { useMemberDetails, type MemberSearchResult } from '@/hooks/useMemberSearch';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/finance/expenses';
import type {
  ExpenseFormData,
  ExpenseRecord,
  FinanceFilter,
  PaymentMethod,
} from '@/types/finance';
import { format } from 'date-fns';
import { ChartColumn, ChartLine, DollarSign, Edit, Eye, Trash2, Settings } from 'lucide-react';

import { ExpenseForm } from '@/components/finance/ExpenseForm';
import { useExpensePreferences } from '@/hooks/finance/useExpensePreferences';
import { ExpensePreferencesDrawer } from '@/components/finance/ExpensePreferencesDrawer';

const Expenses: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  

  // Pagination & server data
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(
    null
  );
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: {
      type: 'preset',
      preset: 'this_month',
    },
    payment_method_filter: [],
    purpose_filter: undefined,
    approved_by_filter: undefined,
  });

  // Text search for expenses
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { categoryKeys, categoryOptions } = useExpensePreferences();
  const categoryLabelMap = useMemo(() => {
    const m: Record<string, string> = {};
    categoryKeys.forEach((k: string, idx: number) => {
      m[k] = categoryOptions[idx];
    });
    return m;
  }, [categoryKeys, categoryOptions]);

  const { data: paginatedExpenses, isLoading } = useExpenses({
    page,
    pageSize,
    filters,
    search,
  });

  // Form state
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: 0,
    category: 'utilities',
    purpose: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    vendor: '',
    receipt_number: '',
    notes: '',
    branch_id: null,
  });

  const [approvedBy, setApprovedBy] = useState<string | null>(null);
  const [approvalDate, setApprovalDate] = useState<string>('');

  // Prefill approved by typeahead and display
  const { data: approvedByDetails = [] } = useMemberDetails(approvedBy ? [approvedBy] : []);
  const approvedTypeaheadValueSingle: MemberSearchResult[] = React.useMemo(() => {
    return approvedByDetails.map((m: any) => ({
      ...m,
      display_name: m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Member',
      display_subtitle: m.email || m.phone || '',
    }));
  }, [approvedByDetails]);

  // Member details for view dialog (Approved By display)
  const { data: approvedByViewDetails = [] } = useMemberDetails(
    selectedExpense?.approved_by ? [selectedExpense.approved_by] : []
  );
  const approvedByViewName: string | undefined = React.useMemo(() => {
    const m: any = approvedByViewDetails?.[0];
    if (!m) return undefined;
    const name = m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim();
    return name || undefined;
  }, [approvedByViewDetails]);

  // Reset form
  const resetForm = () => {
    setFormData({
      amount: 0,
      category: 'utilities',
      purpose: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      vendor: '',
      receipt_number: '',
      notes: '',
      branch_id: null,
    });
    setApprovedBy(null);
    setApprovalDate('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Map purpose to description if description is empty
    const finalDescription = formData.description && formData.description.trim()
      ? formData.description.trim()
      : (formData.purpose && formData.purpose.trim()) || undefined;

    if (selectedExpense) {
      // Update existing expense via hook
        await updateExpense.mutateAsync({
          id: selectedExpense.id,
          updates: {
            amount: formData.amount,
            category: (formData as any).category as any,
            purpose: formData.purpose,
            payment_method: formData.payment_method,
            date: formData.date,
            description: finalDescription,
            vendor: formData.vendor,
            receipt_number: formData.receipt_number,
            notes: formData.notes,
            approved_by: approvedBy ?? null,
            approval_date: approvalDate ? approvalDate : null,
            branch_id: formData.branch_id ?? null,
          },
        });
      setIsEditDialogOpen(false);
    } else {
      // Create new expense via hook
        await createExpense.mutateAsync({
          amount: formData.amount,
          category: (formData as any).category as any,
          purpose: formData.purpose,
          payment_method: formData.payment_method,
          date: formData.date,
          description: finalDescription,
          vendor: formData.vendor,
          receipt_number: formData.receipt_number,
          notes: formData.notes,
          approved_by: approvedBy ?? null,
          approval_date: approvalDate ? approvalDate : null,
          branch_id: formData.branch_id ?? null,
        });
      setIsAddDialogOpen(false);
    }

    resetForm();
    setSelectedExpense(null);
  };

  // Handle edit
  const handleEdit = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setFormData({
      amount: expense.amount,
      category: (expense as any).category || 'other',
      purpose: expense.purpose || '',
      description: expense.description || '',
      date: expense.date,
      payment_method: expense.payment_method,
      vendor: expense.vendor || '',
      receipt_number: expense.receipt_number || '',
      notes: expense.notes || '',
      branch_id: (expense as any).branch_id || null,
    });
    setApprovedBy(expense.approved_by ?? null);
    setApprovalDate(expense.approval_date || '');
    setIsEditDialogOpen(true);
  };

  // Handle view
  const handleView = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setIsViewDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (expense: ExpenseRecord) => {
    await deleteExpense.mutateAsync(expense.id);
  };

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return paginatedExpenses?.data || [];
  }, [paginatedExpenses]);

  const sortedExpenses = useMemo(() => {
    if (sortKey === 'branch') {
      const copy = [...filteredExpenses];
      copy.sort((a: any, b: any) => {
        const an = (a.branch?.name || '').toLowerCase();
        const bn = (b.branch?.name || '').toLowerCase();
        if (an < bn) return sortDirection === 'asc' ? -1 : 1;
        if (an > bn) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return copy;
    }
    return filteredExpenses;
  }, [filteredExpenses, sortKey, sortDirection]);

  // Calculate statistics
  const stats = useMemo(() => {

    const totalExpenses = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const recordCount = filteredExpenses.length;
    const averageExpense = recordCount > 0 ? totalExpenses / recordCount : 0;
    const purposeTotals = filteredExpenses.reduce((acc, expense) => {
      const key = (expense.purpose || 'N/A');
      acc[key] = (acc[key] || 0) + expense.amount ;
      return acc;
    }, {} as Record<string, number>);

    const topPurposeEntry = Object.entries(purposeTotals).sort(
      ([, a], [, b]) => b - a
    )[0];
    const topPurpose = topPurposeEntry ? topPurposeEntry[0] : 'N/A';
    const topPurposeAmount = topPurposeEntry ? topPurposeEntry[1] : 0;

    return {
      totalExpenses,
      recordCount,
      averageExpense,
      topPurpose,
      topPurposeAmount,
    };
  }, [filteredExpenses]);

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'date',
      label: 'Expense Date',
      sortable: true,
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (_: any, row: any) => {
        const key = row?.category as string | undefined;
        if (!key) return '-';
        return categoryLabelMap[key] || String(key).replace('_', ' ');
      },
    },
    {
      key: 'purpose',
      label: 'Purpose',
      sortable: true,
      render: (_: any, row: any) => row.purpose || '-',
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (_: any, row: any) => row.description || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-red-600">
          GHS{value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      sortable: true,
      render: (value: PaymentMethod) => (
        <span className="capitalize">{value.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'branch',
      label: 'Branch',
      sortable: true,
      render: (_: any, row: any) => row.branch?.name || 'All branches',
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy hh:mm:aa'),
    },
    {
      key: 'created_by_user',
      label: 'Created User',
      sortable: true,
      render: (value: any) => (
        <span>
          {value?.first_name || '-'} {value?.last_name || '-'}
        </span>
      ),
    },
  ];

  // Table actions
  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleView,
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: 'destructive',
    },
  ];

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage church expenses and expenditures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Configure Preferences" className='cursor-pointer' onClick={() => setIsPrefsOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new expense for the church.
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm
              data={formData}
              onChange={(next) => setFormData(next)}
              onApprovedByChange={setApprovedBy}
              approvalDate={approvalDate}
              onApprovalDateChange={setApprovalDate}
              approvedTypeaheadValueSingle={approvedTypeaheadValueSingle}
              organizationId={currentOrganization?.id || ''}
              onSubmit={handleSubmit}
              submitLabel="Add Expense"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <FinanceStatsCards
        stats={[
          {
            id: 'total_expenses',
            title: 'Total Expenses',
            value: `GHS${stats.totalExpenses.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <DollarSign className="h-4 w-4" />,
            color: 'destructive',
          },
          {
            id: 'expense_records',
            title: 'Expense Records',
            value: stats.recordCount.toString(),
            icon: <ChartColumn className="h-4 w-4" />,
            subtitle: 'total entries',
          },
          {
            id: 'avg_expense',
            title: 'Average Expense',
            value: `GHS${stats.averageExpense.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <ChartLine className="h-4 w-4" />,
            subtitle: 'per record',
          },
          {
            id: 'top_purpose',
            title: 'Top Item',
            value: stats.topPurpose,
            subtitle: `GHS${stats.topPurposeAmount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`,
            icon: <span>🏷️</span>,
          },
        ]}
      />

      {/* Filter Bar */}
      <ExpenseFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        paymentMethodOptions={[
          { value: 'cash', label: 'Cash' },
          { value: 'check', label: 'Check' },
          { value: 'credit_card', label: 'Credit Card' },
          { value: 'debit_card', label: 'Debit Card' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'mobile_payment', label: 'Mobile Payment' },
          { value: 'online', label: 'Online' },
          { value: 'other', label: 'Other' },
        ]}
        onSearchChange={(term) => setSearch(term)}
        showAddButton={true}
        onAddClick={() => setIsAddDialogOpen(true)}
        addButtonLabel="Add Expense"
      />

      {/* Data Table */}
      <FinanceDataTable
        data={sortedExpenses}
        columns={columns}
        actions={actions}
        loading={isLoading}
        printTitle="Expenses"
        printDateFilter={filters.date_filter}
        groupByKey="category"
        onSort={(key, dir) => {
          setSortKey(key);
          setSortDirection(dir);
        }}
        sortKey={sortKey}
        sortDirection={sortDirection}
      />

      <div className="mt-4">
        <Pagination
          currentPage={paginatedExpenses?.currentPage || page}
          totalPages={paginatedExpenses?.totalPages || 1}
          pageSize={paginatedExpenses?.pageSize || pageSize}
          totalItems={paginatedExpenses?.totalCount || 0}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(ps) => {
            setPageSize(ps);
            setPage(1);
          }}
          itemName="expenses"
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-auto" >
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense information.
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            data={formData}
            onChange={(next) => setFormData(next)}
            onApprovedByChange={setApprovedBy}
            approvalDate={approvalDate}
            onApprovalDateChange={setApprovalDate}
            approvedTypeaheadValueSingle={approvedTypeaheadValueSingle}
            organizationId={currentOrganization?.id || ''}
            onSubmit={handleSubmit}
            submitLabel="Update Expense"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </Label>
                  <p className="text-lg font-semibold text-red-600">
                    GHS
                    {selectedExpense.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                {selectedExpense.purpose && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Purpose
                    </Label>
                    <p>{selectedExpense.purpose}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <p>{selectedExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date
                  </Label>
                  <p>{format(new Date(selectedExpense.date), 'PPP')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </Label>
                  <p className="capitalize">
                    {selectedExpense.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {selectedExpense.approved_by && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Approved By
                    </Label>
                    <p>{approvedByViewName || selectedExpense.approved_by}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Approval Date
                    </Label>
                    <p>{selectedExpense.approval_date ? format(new Date(selectedExpense.approval_date), 'PPP') : '-'}</p>
                  </div>
                </div>
              )}

              {selectedExpense.created_by_user && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Record Created By
                  </Label>
                  <p>{`${selectedExpense.created_by_user.first_name} ${selectedExpense.created_by_user.last_name}`}</p>
                </div>
              )}

              {selectedExpense.vendor && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Vendor
                  </Label>
                  <p>{selectedExpense.vendor}</p>
                </div>
              )}

              {selectedExpense.receipt_number && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Receipt Number
                  </Label>
                  <p>{selectedExpense.receipt_number}</p>
                </div>
              )}

              {selectedExpense.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </Label>
                  <p>{selectedExpense.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Created:{' '}
                    {format(new Date(selectedExpense.created_at), 'PPp')}
                  </span>
                  <span>
                    Updated:{' '}
                    {format(new Date(selectedExpense.updated_at), 'PPp')}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedExpense) handleEdit(selectedExpense);
              }}
            >
              Edit Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExpensePreferencesDrawer open={isPrefsOpen} onOpenChange={setIsPrefsOpen} />
    </div>
  );
};

export default Expenses;

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
 
import React, { useMemo, useState, useEffect } from 'react';

import {
  FinanceDataTable,
  ExpenseFilterBar,
  FinanceStatsCards,
} from '@/components/finance';
import type {
  TableAction,
  TableColumn,
} from '@/components/finance/FinanceDataTable';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { Pagination } from '@/components/shared/Pagination';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRoleCheck } from '@/registry/access/RoleGuard';
import { useMemberDetails, type MemberSearchResult } from '@/hooks/useMemberSearch';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/finance/expenses';
import { useExpenseStatsData } from '@/hooks/finance/useFinanceStats';
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
import { useEditRequest } from '@/hooks/finance/useEditRequests';
import { EditRequestLockedView } from '@/components/finance/edit-request/EditRequestLockedView';

import { mapDateFilterToPicker, mapPickerToDateFilter } from '@/utils/finance/dateFilter';
import { paymentMethodOptions } from '@/components/finance/constants';
import { toast } from 'sonner';

const Expenses = () => {
  const { currentOrganization } = useOrganization();
  const { isOwner } = useRoleCheck();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  

  // Pagination & server data
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(
    null
  );
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: mapPickerToDateFilter(
      mapDateFilterToPicker({ type: 'preset', preset: 'this_month' })
    ),
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
    sortKey,
    sortDirection,
  });

  // Dedicated query for stats to fetch all matching records (up to 10k)
  const { data: statsData } = useExpenseStatsData({
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
    check_number: '',
    notes: '',
    branch_id: null,
  });

  const [approvedBy, setApprovedBy] = useState<string | null>(null);
  const [approvalDate, setApprovalDate] = useState<string>('');

  // Edit Request Hook
  const { 
    request: editRequest, 
    isLoading: isLoadingRequest, 
    canEdit, 
    refetch: refetchRequest,
    completeRequest 
  } = useEditRequest('expense', selectedExpense?.id || '');

  useEffect(() => {
    if (isEditDialogOpen && selectedExpense?.id) {
        refetchRequest();
    }
  }, [isEditDialogOpen, selectedExpense?.id, refetchRequest]);

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
      check_number: '',
      notes: '',
      branch_id: null,
    });
    setApprovedBy(null);
    setApprovalDate('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.branch_id) {
      toast.error('Please select a branch.');
      return;
    }

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
              check_number: formData.check_number,
              notes: formData.notes,
              approved_by: approvedBy ?? null,
              approval_date: approvalDate ? approvalDate : null,
              branch_id: formData.branch_id ?? null,
            },
          });
        
          if (editRequest?.id && canEdit) {
            await completeRequest.mutateAsync(editRequest.id);
          }
          
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
            check_number: formData.check_number,
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
      check_number: (expense as any).check_number || '',
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
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return paginatedExpenses?.data || [];
  }, [paginatedExpenses]);

  // Client-side sorting is redundant if server-side sorting is correct and we want to preserve server grouping.
  // However, for 'branch' sort which is a relation, we might need client-side or specific server handling.
  // Since we updated server to handle category/date grouping, we should just use the data as is, unless it's a special client-side key.
  
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
    // For other keys, we trust the server order which respects grouping
    return filteredExpenses;
  }, [filteredExpenses, sortKey, sortDirection]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!statsData) {
      return {
        totalExpenses: 0,
        recordCount: 0,
        averageExpense: 0,
        topPurpose: 'N/A',
        topPurposeAmount: 0,
      };
    }

    return {
      totalExpenses: statsData.total_expenses,
      recordCount: statsData.record_count,
      averageExpense: statsData.average_expense,
      topPurpose: statsData.top_purpose,
      topPurposeAmount: statsData.top_purpose_amount,
    };
  }, [statsData]);

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
    ...(isOwner() ? [{
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: 'destructive' as const,
    }] : []),
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
        paymentMethodOptions={paymentMethodOptions}
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
          itemName={paginatedExpenses?.isGrouped ? "categories" : "expenses"}
          rowsPerPageLabel={paginatedExpenses?.isGrouped ? "Categories per page:" : "Rows per page:"}
          pageSizeOptions={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]}
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
          {isEditDialogOpen && selectedExpense && !canEdit ? (
             <div className="py-4">
               <EditRequestLockedView 
                 request={editRequest}
                 isLoading={isLoadingRequest}
                 onCheckStatus={refetchRequest}
                 tableName="expense"
                 recordId={selectedExpense.id}
               />
             </div>
          ) : (
            <>
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
            </>
          )}
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
                  <p>{format(new Date(selectedExpense.date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Category
                  </Label>
                  <p className="capitalize">
                    {categoryLabelMap[selectedExpense.category] || String(selectedExpense.category).replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </Label>
                  <p className="capitalize">
                    {selectedExpense.payment_method.replace('_', ' ')}
                  </p>
                </div>
                {selectedExpense.vendor && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Vendor
                    </Label>
                    <p>{selectedExpense.vendor}</p>
                  </div>
                )}
              </div>

              {(selectedExpense.receipt_number || selectedExpense.check_number) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedExpense.receipt_number && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Receipt #
                      </Label>
                      <p>{selectedExpense.receipt_number}</p>
                    </div>
                  )}
                  {selectedExpense.check_number && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Cheque #
                      </Label>
                      <p>{selectedExpense.check_number}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedExpense.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedExpense.notes}
                  </p>
                </div>
              )}

              {approvedByViewName && (
                 <div>
                   <Label className="text-sm font-medium text-muted-foreground">
                     Approved By
                   </Label>
                   <p className="text-sm">
                     {approvedByViewName} {selectedExpense.approval_date ? ` on ${format(new Date(selectedExpense.approval_date), 'MMM dd, yyyy')}` : ''}
                   </p>
                 </div>
              )}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          if (selectedExpense && isOwner()) {
            await deleteExpense.mutateAsync(selectedExpense.id);
          }
          setIsDeleteDialogOpen(false);
          setSelectedExpense(null);
        }}
        title="Delete Expense"
        description="Are you sure you want to delete this expense record?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isLoading={deleteExpense.isPending}
      />
      <ExpensePreferencesDrawer open={isPrefsOpen} onOpenChange={setIsPrefsOpen} />
    </div>
  );
};

export default Expenses;

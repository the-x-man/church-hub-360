import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Edit, Trash2, DollarSign } from 'lucide-react';
import { FinanceStatsCards, pledgeStatsConfig, type TableAction } from '@/components/finance';
import { PledgeFilterBar } from '@/components/finance/pledges/PledgeFilterBar';
import type { PledgeRecord, PledgeFilter, PaymentFilter, PledgePayment } from '@/types/finance';
 
import { Pagination } from '@/components/shared/Pagination';
import { PledgesTable } from '@/components/finance/pledges/PledgesTable';
import { PledgeFormDialog } from '@/components/finance/pledges/PledgeFormDialog';
import { PledgeViewDialog } from '@/components/finance/pledges/PledgeViewDialog';
import { PledgePaymentDialog } from '@/components/finance/pledges/PledgePaymentDialog';
import { useDeletePledge, usePledges } from '@/hooks/finance/pledges';
import { PaymentsFilterBar } from '@/components/finance/payments/PaymentsFilterBar';
import { PaymentsTable } from '@/components/finance/payments/PaymentsTable';
import { PaymentEditDialog } from '@/components/finance/payments/PaymentEditDialog';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { useAllPledgePayments, useDeletePayment } from '@/hooks/finance/payments';
// Removed editable report labels; keep Pledges page static

// Removed mock data; using real hook data

export function Pledges() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState<PledgeRecord | null>(null);
  const [activeTab, setActiveTab] = useState('pledges');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState<string>('');

  // Filter state
  const [filters, setFilters] = useState<PledgeFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });
  const [amountSearch, setAmountSearch] = useState<{ operator: '>' | '>=' | '=' | '<' | '<=' | '!='; value: number } | null>(null);

  // Payments tab state
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(10);
  const [paymentsSearch, setPaymentsSearch] = useState<string>('');
  const [paymentAmountSearch, setPaymentAmountSearch] = useState<{ operator: '>' | '>=' | '=' | '<' | '<=' | '!='; value: number } | null>(null);
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });
  const [selectedPayment, setSelectedPayment] = useState<PledgePayment | null>(null);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [showDeletePaymentDialog, setShowDeletePaymentDialog] = useState(false);

  // Fetch pledges
  const pledgesQuery = usePledges({ page, pageSize, search, filters, amountSearch });
  const pledges = pledgesQuery.data?.data || [];
  const totalPages = pledgesQuery.data?.totalPages || 1;
  const totalItems = pledgesQuery.data?.totalCount || 0;
  const loading = pledgesQuery.isLoading;

  // Fetch payments (global across pledges)
  const paymentsQuery = useAllPledgePayments({
    page: paymentsPage,
    pageSize: paymentsPageSize,
    search: paymentsSearch,
    dateFilter: paymentFilters.date_filter,
    amountSearch: paymentAmountSearch || null,
    paymentMethodFilter: paymentFilters.payment_method_filter,
  });
  const payments = paymentsQuery.data?.data || [];
  const paymentsTotalPages = paymentsQuery.data?.totalPages || 1;
  const paymentsTotalItems = paymentsQuery.data?.totalCount || 0;
  const paymentsLoading = paymentsQuery.isLoading;

  // Removed legacy filter options; using shared components

  // Filtered data
  const filteredPledges = useMemo(() => {
    const base = pledges;
    const pr = filters.progress_range;
    if (pr && (pr.min !== undefined || pr.max !== undefined)) {
      const minPct = pr.min ?? 0;
      const maxPct = pr.max ?? 100;
      return base.filter((p) => {
        const pct = p.pledge_amount > 0 ? (p.amount_paid / p.pledge_amount) * 100 : 0;
        return pct >= minPct && pct <= maxPct;
      });
    }
    return base;
  }, [pledges, filters.progress_range]);

  // Client-side amount range filter for payments (min/max)
  const filteredPayments = useMemo(() => {
    const base = payments;
    const ar = paymentFilters.amount_range;
    if (ar && (ar.min !== undefined || ar.max !== undefined)) {
      const min = ar.min ?? Number.NEGATIVE_INFINITY;
      const max = ar.max ?? Number.POSITIVE_INFINITY;
      return base.filter((p) => p.amount >= min && p.amount <= max);
    }
    return base;
  }, [payments, paymentFilters.amount_range]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPledges = filteredPledges.reduce((sum, pledge) => sum + (pledge.pledge_amount || 0), 0);
    const fulfilledAmount = filteredPledges.reduce((sum, pledge) => sum + (pledge.amount_paid || 0), 0);
    const pendingAmount = filteredPledges.reduce((sum, pledge) => sum + (pledge.amount_remaining || 0), 0);
    const fulfillmentRate = totalPledges > 0 ? (fulfilledAmount / totalPledges) * 100 : 0;

    return pledgeStatsConfig({
      totalPledges,
      recordCount: filteredPledges.length,
      fulfilledAmount,
      pendingAmount,
      fulfillmentRate,
    });
  }, [filteredPledges]);

  const deletePledge = useDeletePledge();

  // Table actions for pledges
  const pledgeActions: TableAction[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (record: PledgeRecord) => {
        setSelectedPledge(record);
        setShowViewDialog(true);
      },
    },
    {
      key: 'add_payment',
      label: 'Add Payment',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: (record: PledgeRecord) => {
        setSelectedPledge(record);
        setShowPaymentDialog(true);
      },
      variant: 'default',
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (record: PledgeRecord) => {
        setSelectedPledge(record);
        setShowEditDialog(true);
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (record: PledgeRecord) => {
        await deletePledge.mutateAsync(record.id);
      },
      variant: 'destructive',
    },
  ];

  const deletePayment = useDeletePayment();

  // No report template labels on this page; editing belongs to PledgesSummary template

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pledge Management</h1>
          <p className="text-muted-foreground">
            Track pledges, manage payments, and monitor commitment progress
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Pledge
        </Button>
      </div>

      {/* Stats Cards */}
      <FinanceStatsCards stats={stats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pledges">Pledges</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="pledges" className="space-y-4">
          {/* Filter Bar */}
          <PledgeFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            searchPlaceholder="Search pledges..."
            onSearchChange={(s) => setSearch(s || '')}
            amountSearch={amountSearch}
            onAmountSearchChange={setAmountSearch}
            onAddClick={() => setShowAddDialog(true)}
            addButtonLabel="New Pledge"
          />

          {/* Data Table */}
          <PledgesTable
            data={filteredPledges}
            actions={pledgeActions}
            loading={loading}
            printTitle={'Pledges'}
            printDateFilter={filters.date_filter}
          />

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
            }}
            itemName="pledges"
          />

         
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {/* Filter Bar */}
          <PaymentsFilterBar
            filters={paymentFilters}
            onFiltersChange={setPaymentFilters}
            searchPlaceholder="Search payments..."
            onSearchChange={(s) => setPaymentsSearch(s || '')}
            amountSearch={paymentAmountSearch}
            onAmountSearchChange={setPaymentAmountSearch}
          />

          {/* Data Table */}
          <PaymentsTable
            data={filteredPayments}
            onEdit={(p) => {
              setSelectedPayment(p);
              setShowEditPaymentDialog(true);
            }}
            onDelete={(p) => {
              setSelectedPayment(p);
              setShowDeletePaymentDialog(true);
            }}
            loading={paymentsLoading}
            printTitle={'Pledge Payments'}
            printDateFilter={paymentFilters.date_filter}
          />

          {/* Pagination */}
          <Pagination
            currentPage={paymentsPage}
            totalPages={paymentsTotalPages}
            pageSize={paymentsPageSize}
            totalItems={paymentsTotalItems}
            onPageChange={setPaymentsPage}
            onPageSizeChange={(sz) => {
              setPaymentsPageSize(sz);
              setPaymentsPage(1);
            }}
            itemName="payments"
          />
        </TabsContent>
      </Tabs>

      {/* Add Pledge Dialog */}
      <PledgeFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        mode="add"
        onSuccess={() => {
          setPage(1);
        }}
      />

      {/* Add Payment Dialog */}
      {selectedPledge && (
        <PledgePaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          pledge={selectedPledge}
          onSuccess={() => {
            setPage(1);
          }}
        />
      )}

      {/* View Pledge Dialog */}
      {selectedPledge && (
        <PledgeViewDialog open={showViewDialog} onOpenChange={setShowViewDialog} pledge={selectedPledge} />
      )}

      {/* Edit Pledge Dialog */}
      {selectedPledge && (
        <PledgeFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          mode="edit"
          initialData={{
            id: selectedPledge.id,
            source_type: selectedPledge.source_type || 'member',
            source: selectedPledge.source || undefined,
            member_id: selectedPledge.member_id,
            group_id: selectedPledge.group_id,
            tag_item_id: selectedPledge.tag_item_id,
            pledge_amount: selectedPledge.pledge_amount,
            pledge_type: selectedPledge.pledge_type,
            campaign_name: selectedPledge.campaign_name || undefined,
            start_date: selectedPledge.start_date,
            end_date: selectedPledge.end_date,
            payment_frequency: selectedPledge.payment_frequency,
            description: selectedPledge.description || undefined,
            branch_id: selectedPledge.branch_id,
          }}
          onSuccess={() => {
            setPage(1);
          }}
        />
      )}

      {/* Edit Payment Dialog */}
      {selectedPayment && (
        <PaymentEditDialog
          open={showEditPaymentDialog}
          onOpenChange={setShowEditPaymentDialog}
          payment={selectedPayment}
          onSuccess={() => {
            setPaymentsPage(1);
          }}
        />
      )}

      {/* Delete Payment Confirmation */}
      {selectedPayment && (
        <DeleteConfirmationDialog
          isOpen={showDeletePaymentDialog}
          onClose={() => setShowDeletePaymentDialog(false)}
          onConfirm={async () => {
            await deletePayment.mutateAsync(selectedPayment!.id);
            setShowDeletePaymentDialog(false);
            setPaymentsPage(1);
          }}
          title="Delete Payment"
          description="This action will mark the payment as deleted. You can’t undo this."
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          isLoading={deletePayment.isPending}
        />
      )}
    </div>
  );
}
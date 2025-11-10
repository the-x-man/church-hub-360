import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Edit, Trash2, DollarSign } from 'lucide-react';
import { FinanceStatsCards, FinanceFilterBar, pledgeStatsConfig, type TableAction } from '@/components/finance';
import type { PledgeRecord, FinanceFilter } from '@/types/finance';
 
import { Pagination } from '@/components/shared/Pagination';
import { PledgesTable } from '@/components/finance/pledges/PledgesTable';
import { PledgeFormDialog } from '@/components/finance/pledges/PledgeFormDialog';
import { PledgeViewDialog } from '@/components/finance/pledges/PledgeViewDialog';
import { PledgePaymentDialog } from '@/components/finance/pledges/PledgePaymentDialog';
import { useDeletePledge, usePledges } from '@/hooks/finance/pledges';

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
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });

  // Fetch pledges
  const pledgesQuery = usePledges({ page, pageSize, search, filters });
  const pledges = pledgesQuery.data?.data || [];
  const totalPages = pledgesQuery.data?.totalPages || 1;
  const totalItems = pledgesQuery.data?.totalCount || 0;
  const loading = pledgesQuery.isLoading;

  // Removed legacy filter options; using shared components

  // Filtered data
  const filteredPledges = useMemo(() => {
    return pledges;
  }, [pledges]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPledges = filteredPledges.reduce((sum, pledge) => sum + pledge.pledge_amount, 0);
    const fulfilledAmount = filteredPledges
      .filter(pledge => pledge.status === 'fulfilled')
      .reduce((sum, pledge) => sum + pledge.pledge_amount, 0);
    const pendingAmount = totalPledges - fulfilledAmount;
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
        </TabsList>

        <TabsContent value="pledges" className="space-y-4">
          {/* Filter Bar */}
          <FinanceFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            categoryOptions={[]}
            searchPlaceholder="Search pledges..."
            onSearchChange={(s) => setSearch(s || '')}
            onAddClick={() => setShowAddDialog(true)}
            addButtonLabel="New Pledge"
          />

          {/* Data Table */}
          <PledgesTable data={filteredPledges} actions={pledgeActions} loading={loading} />

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

        {/* Global payments tab removed; payments shown in View dialog */}
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
          }}
          onSuccess={() => {
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
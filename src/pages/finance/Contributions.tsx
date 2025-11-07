import {
  contributionTypes,
  paymentMethods,
} from '@/components/finance/contributions/constants';
import { contributionDonationStatsConfig } from '@/components/finance/contributions/ContributionDonationStatsConfig';
import { ContributionFormDialog } from '@/components/finance/contributions/ContributionFormDialog';
import { ContributionsTable } from '@/components/finance/contributions/ContributionsTable';
import { ContributionViewDialog } from '@/components/finance/contributions/ContributionViewDialog';
import { FinanceFilterBar } from '@/components/finance/FinanceFilterBar';
import { FinanceReportGenerator } from '@/components/finance/FinanceReportGenerator';
import { FinanceStatsCards } from '@/components/finance/FinanceStatsCards';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { Pagination } from '@/components/shared/Pagination';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  useCreateIncome,
  useDeleteIncome,
  useIncomes,
  useUpdateIncome,
} from '@/hooks/finance/income';
import type {
  ContributionDonationFormData,
  FinanceFilter,
  ExtendedIncomeType,
  IncomeResponseRow,
  IncomeType,
} from '@/types/finance';
import { Heart } from 'lucide-react';
import React, { useMemo, useState } from 'react';

const Contributions: React.FC = () => {
  // Data: use contributions from income table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });
  const [recordTypeFilter, setRecordTypeFilter] = useState<
    'all' | 'contribution' | 'donation'
  >('all');

  const contributionsQuery = useIncomes({
    page,
    pageSize,
    search,
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

  // Mutations
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  const { currentOrganization } = useOrganization();

  const [formData, setFormData] = useState<ContributionDonationFormData>({
    source_type: 'member',
    source: '',
    member_id: undefined,
    group_id: undefined,
    tag_item_id: undefined,
    amount: 0,
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
    envelope_number: '',
    income_type: 'contribution',
    extended_income_type: 'Contribution',
    attendance_occasion_id: undefined,
    attendance_session_id: undefined,
  });

  // Member typeahead UI state (single-select)
  const [memberTypeaheadValue, setMemberTypeaheadValue] = useState<any[]>([]);
  const [occasionTypeaheadValue, setOccasionTypeaheadValue] = useState<any[]>([]);
  const [sessionTypeaheadValue, setSessionTypeaheadValue] = useState<any[]>([]);

  // Filter options moved to shared constants

  // Reset form
  const resetForm = () => {
    setFormData({
      source_type: 'member',
      source: '',
      member_id: undefined,
      group_id: undefined,
      tag_item_id: undefined,
      amount: 0,
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
      envelope_number: '',
      income_type: 'contribution',
      extended_income_type: 'Contribution',
      attendance_occasion_id: undefined,
      attendance_session_id: undefined,
    });
    setMemberTypeaheadValue([]);
    setOccasionTypeaheadValue([]);
    setSessionTypeaheadValue([]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const commonPayload = {
        amount: formData.amount,
        extended_income_type: formData.extended_income_type,
        payment_method: formData.payment_method,
        date: formData.date,
        description: formData.description,
        notes: formData.notes,
        envelope_number: formData.envelope_number,
        income_type: formData.income_type,
        attendance_occasion_id: formData.attendance_occasion_id,
        attendance_session_id: formData.attendance_session_id,
        source_type: formData.source_type,
        source:
          formData.source_type === 'other'
            ? formData.source || undefined
            : undefined,
        member_id:
          formData.source_type === 'member'
            ? formData.member_id || undefined
            : undefined,
        group_id:
          formData.source_type === 'group'
            ? formData.group_id || undefined
            : undefined,
        tag_item_id:
          formData.source_type === 'tag_item'
            ? formData.tag_item_id || undefined
            : undefined,
      } as any;

      if (selectedContribution) {
        await updateIncome.mutateAsync({
          id: selectedContribution.id,
          updates: commonPayload,
        });
        setIsEditDialogOpen(false);
        resetForm();
      } else {
        await createIncome.mutateAsync(commonPayload);
        setIsAddDialogOpen(false);
        resetForm();
      }
    } finally {
      setSelectedContribution(null);
    }
  };

  // Handle edit
  const handleEdit = (contribution: IncomeResponseRow) => {
    setSelectedContribution(contribution);
    setFormData({
      source_type: (contribution.source_type as any) || 'member',
      source: contribution.source || '',
      member_id: contribution.member_id || undefined,
      group_id: contribution.group_id || undefined,
      tag_item_id: contribution.tag_item_id || undefined,
      amount: contribution.amount,
      payment_method: contribution.payment_method,
      date: contribution.date,
      description: contribution.description || '',
      notes: contribution.notes || '',
      envelope_number: contribution.envelope_number || '',
      income_type:
        (contribution.income_type as Extract<
          IncomeType,
          'contribution' | 'donation'
        >) || 'contribution',
      extended_income_type:
        (contribution.extended_income_type as ExtendedIncomeType) ||
        'Contribution',
      attendance_occasion_id: contribution.attendance_occasion_id || undefined,
      attendance_session_id: contribution.attendance_session_id || undefined,
    });
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
        !filters.category_filter.includes(contribution.extended_income_type)
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

      // TODO: Implement date filtering

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

  // Table columns and actions moved to ContributionsTable component

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Contributions & Donations</h1>
        </div>

        {/* Report Generator */}
        <FinanceReportGenerator
          data={filteredContributions}
          title="Contribution Report"
          filters={filters}
          onGenerateReport={(config) => {
            console.log('Generating report with config:', config);
            // TODO: Implement report generation
          }}
        />
        <ContributionFormDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          mode="add"
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          isSubmitting={createIncome.isPending}
          currentOrganizationId={currentOrganization?.id || ''}
          memberTypeaheadValue={memberTypeaheadValue}
          onMemberTypeaheadChange={setMemberTypeaheadValue}
          paymentMethodOptions={paymentMethods as any}
          extendedIncomeTypeOptions={contributionTypes as any}
          occasionTypeaheadValue={occasionTypeaheadValue}
          onOccasionTypeaheadChange={setOccasionTypeaheadValue}
          sessionTypeaheadValue={sessionTypeaheadValue}
          onSessionTypeaheadChange={setSessionTypeaheadValue}
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
        paymentMethodOptions={paymentMethods}
        showAddButton={true}
        onAddClick={() => setIsAddDialogOpen(true)}
        addButtonLabel="Add Record"
        recordTypeFilter={recordTypeFilter}
        onRecordTypeFilterChange={setRecordTypeFilter}
      />

      {/* Data Table */}
      <ContributionsTable
        data={filteredContributions}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
      <ContributionFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={updateIncome.isPending}
        currentOrganizationId={currentOrganization?.id || ''}
        memberTypeaheadValue={memberTypeaheadValue}
        onMemberTypeaheadChange={setMemberTypeaheadValue}
        paymentMethodOptions={paymentMethods as any}
        extendedIncomeTypeOptions={contributionTypes as any}
        occasionTypeaheadValue={occasionTypeaheadValue}
        onOccasionTypeaheadChange={setOccasionTypeaheadValue}
        sessionTypeaheadValue={sessionTypeaheadValue}
        onSessionTypeaheadChange={setSessionTypeaheadValue}
      />

      {/* View Dialog */}
      <ContributionViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        contribution={selectedContribution as any}
        onEdit={handleEdit}
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
        description="Are you sure you want to delete this record? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isLoading={deleteIncome.isPending}
      />
    </div>
  );
};

export default Contributions;

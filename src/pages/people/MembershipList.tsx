import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Grid, Download, Upload, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  MemberCard,
  MemberTable,
  MemberForm,
  FilterBar,
  MemberPagination,
  MemberStatistics,
} from '@/components/people/members';
import {
  useMembersSummaryPaginated,
  useUpdateMember,
  useDeleteMember,
  useMemberStatistics,
} from '@/hooks/useMemberQueries';
import { useMemberPreferences } from '@/hooks/useMemberPreferences';
import { usePeopleConfiguration } from '@/hooks/usePeopleConfigurationQueries';
import { useBranches } from '@/hooks/useBranchQueries';
import { useRelationalTags } from '@/hooks/useRelationalTags';

import { useOrganization } from '@/contexts/OrganizationContext';
import type {
  MemberFilters,
  CreateMemberData,
  UpdateMemberData,
  Member,
  MemberSummary,
  MemberFormField,
  MembershipType,
} from '@/types/members';
import type { MembershipFormSchema } from '@/types/people-configurations';
import { cn } from '@/lib/utils';

// Helper function to convert MembershipFormSchema to MemberFormField[]
// Helper function to convert MembershipFormSchema to MemberFormField[]
const convertSchemaToFormFields = (
  schema: MembershipFormSchema | undefined
): MemberFormField[] => {
  if (!schema?.rows) return [];

  const fields: MemberFormField[] = [];

  schema.rows.forEach((row) => {
    row.columns.forEach((column) => {
      if (column.component) {
        const component = column.component;
        fields.push({
          id: component.id,
          type: component.type as any, // Type conversion needed
          label: component.label,
          required: component.required,
          placeholder: component.placeholder,
          options: component.options,
          validation: component.validation,
        });
      }
    });
  });

  return fields;
};

// Available membership types
const membershipTypes: MembershipType[] = [
  'Regular',
  'Associate',
  'New Convert',
  'Visitor',
];

export default function MembershipList() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();

  // Get organization ID
  const organizationId = currentOrganization?.id;

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<MemberFilters>({});
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Hooks
  const { preferences, setViewMode, setPageSize } = useMemberPreferences(
    organizationId
  );
  const {
    data: membersData,
    isLoading: isLoadingMembers,
  } = useMembersSummaryPaginated(
    organizationId,
    filters,
    currentPage,
    preferences.page_size
  );
  const { data: statistics, isLoading: isLoadingStatistics } = useMemberStatistics(organizationId);
  const { configuration: peopleConfig } = usePeopleConfiguration(
    organizationId
  );
  const { data: branches = [] } = useBranches(organizationId);
  const { tags } = useRelationalTags();

  // Convert membership form schema to form fields
  const membershipFormFields = convertSchemaToFormFields(
    peopleConfig?.membership_form_schema
  );

  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFormSubmit = async (
    data: CreateMemberData | UpdateMemberData
  ) => {
    try {
      if (editingMember) {
        await updateMemberMutation.mutateAsync({
          ...data,
          id: editingMember.id,
        } as UpdateMemberData);
        setEditingMember(null);
        toast.success('Member updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update member');
      console.error('Error updating member:', error);
    }
  };

  const handleMemberClick = (memberId: string) => {
    navigate(`/people/membership/${memberId}`);
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteMemberMutation.mutateAsync(memberId);
      toast.success('Member deleted successfully');
    } catch (error) {
      toast.error('Failed to delete member');
      console.error('Error deleting member:', error);
    }
  };

  const handleViewMember = (member: MemberSummary) => {
    navigate(`/people/membership/${member.id}`);
  };

  const handlePrintMember = (_member: MemberSummary) => {
    // TODO: Implement print functionality
    console.log('Print member functionality not implemented yet');
  };

  const handleEditMemberFromSummary = (memberSummary: MemberSummary) => {
    // Convert MemberSummary to Member for editing
    // We'll need to fetch the full member data or create a compatible object
    const memberForEdit: Member = {
      ...memberSummary,
      marital_status: null,
      address_line_1: null,
      address_line_2: null,
      city: null,
      state: null,
      postal_code: null,
      country: null,
      membership_type: memberSummary.membership_type,
      date_joined: memberSummary.date_joined,
      baptism_date: null,
      confirmation_date: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      form_data: {},
      notes: null,
      created_by: null,
      last_updated_by: null,
    };
    setEditingMember(memberForEdit);
  };

  const totalPages = Math.ceil(
    (membersData?.total || 0) / (preferences.page_size || 20)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership</h1>
          <p className="text-muted-foreground">
            Manage church membership records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/people/membership/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <MemberStatistics 
          statistics={statistics} 
          isLoading={isLoadingStatistics} 
        />
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4">
            <CardTitle>Members</CardTitle>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={
                  preferences.view_mode === 'table' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={
                  preferences.view_mode === 'card' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setViewMode('card')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            branches={branches.filter((branch) => branch.is_active)}
            membershipTypes={membershipTypes}
            tags={tags}
          />
        </CardHeader>

        <CardContent className="relative">
          {/* Loading Overlay */}
          {isLoadingMembers && (
            <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-background/30 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          )}

          {!membersData?.members.length && !isLoadingMembers ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No members found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/people/membership/add')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Member
              </Button>
            </div>
          ) : (
            <div
              className={cn('space-y-4', isLoadingMembers ? 'opacity-40' : '')}
            >
              {/* Members List */}
              {preferences.view_mode === 'table' ? (
                <MemberTable
                  members={membersData?.members || []}
                  onView={handleViewMember}
                  onEdit={handleEditMemberFromSummary}
                  onDelete={handleDeleteMember}
                  onPrint={handlePrintMember}
                  onClick={handleMemberClick}
                  isLoading={isLoadingMembers}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(membersData?.members || []).map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onView={handleViewMember}
                      onEdit={handleEditMemberFromSummary}
                      onDelete={handleDeleteMember}
                      onPrint={handlePrintMember}
                      onClick={handleMemberClick}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {membersData && (
                <MemberPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={preferences.page_size || 20}
                  totalItems={membersData.total}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog
        open={!!editingMember}
        onOpenChange={() => setEditingMember(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update the member information below.
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <MemberForm
              member={editingMember}
              membershipFormSchema={membershipFormFields}
              branches={branches.filter((branch) => branch.is_active) || []}
              onSubmit={handleFormSubmit}
              onCancel={() => setEditingMember(null)}
              isLoading={updateMemberMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

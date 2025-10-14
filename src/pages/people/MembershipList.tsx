import {
  FilterBar,
  MemberCard,
  MemberExportButtons,
  MemberPagination,
  MemberStatistics,
  MemberTable,
} from '@/components/people/members';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBranches } from '@/hooks/useBranchQueries';
import { useMemberPreferences } from '@/hooks/useMemberPreferences';
import {
  useDeleteMember,
  useMembersSummaryPaginated,
  useMemberStatistics,
} from '@/hooks/useMemberQueries';
import { useRelationalTags } from '@/hooks/useRelationalTags';
import { Grid, Plus, Table } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useOrganization } from '@/contexts/OrganizationContext';
import { cn } from '@/lib/utils';
import type {
  MemberFilters,
  MembershipType,
  MemberSummary,
} from '@/types/members';

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

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    memberId: string | null;
    memberName: string;
  }>({
    isOpen: false,
    memberId: null,
    memberName: '',
  });

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
  const {
    data: statistics,
    isLoading: isLoadingStatistics,
  } = useMemberStatistics(organizationId);
  const { data: branches = [] } = useBranches(organizationId);
  const { tags } = useRelationalTags();

  const deleteMemberMutation = useDeleteMember();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleMemberClick = (memberId: string) => {
    navigate(`/people/membership/${memberId}`);
  };

  const handleDeleteMember = async (memberId: string) => {
    // Find the member to get their name for the confirmation dialog
    const member = membersData?.members.find((m) => m.id === memberId);
    const memberName = member
      ? `${member.first_name} ${member.last_name}`
      : 'this member';

    setDeleteConfirmation({
      isOpen: true,
      memberId,
      memberName,
    });
  };

  const confirmDeleteMember = async () => {
    if (!deleteConfirmation.memberId) return;

    try {
      await deleteMemberMutation.mutateAsync(deleteConfirmation.memberId);
      toast.success('Member deleted successfully');
      setDeleteConfirmation({
        isOpen: false,
        memberId: null,
        memberName: '',
      });
    } catch (error) {
      toast.error('Failed to delete member');
      console.error('Error deleting member:', error);
    }
  };

  const cancelDeleteMember = () => {
    setDeleteConfirmation({
      isOpen: false,
      memberId: null,
      memberName: '',
    });
  };

  const handleViewMember = (member: MemberSummary) => {
    navigate(`/people/membership/${member.id}`);
  };

  const handlePrintMember = (_member: MemberSummary) => {
    // Default to printing details when using the single print handler
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
          {/* <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button> */}
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

            <div className="flex items-center gap-2">
              {/* Export Buttons */}
              <MemberExportButtons
                members={membersData?.members || []}
                className="mr-2"
              />

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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDeleteMember}
        onConfirm={confirmDeleteMember}
        title="Delete Member"
        description={`Are you sure you want to delete ${deleteConfirmation.memberName}? This action cannot be undone.`}
        confirmButtonText="Delete Member"
        isLoading={deleteMemberMutation.isPending}
      />
    </div>
  );
}

import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { CommitteeModal } from '../../components/people/CommitteeModal';
import { CommitteeDetailsPanel } from '../../components/people/configurations/CommitteeDetailsPanel';
import { CommitteesHeader } from '../../components/people/configurations/CommitteesHeader';
import { CommitteesListPanel } from '../../components/people/configurations/CommitteesListPanel';
import { DeleteConfirmationDialog } from '../../components/shared/DeleteConfirmationDialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useBranches } from '../../hooks/queries';
import { useCommittees, useCreateCommittee, useDeleteCommittee, useUpdateCommittee, type Committee, type CommitteeFormData } from '../../hooks/useCommittees';

export function Committees() {
  const { currentOrganization } = useOrganization();

  // Committees data and mutations
  const { 
    data: committees = [], 
    isLoading: committeesIsLoading, 
    error: committeesError 
  } = useCommittees();
  
  // Branches data for default selection
  const { data: branches = [] } = useBranches(currentOrganization?.id);
  
  const createCommitteeMutation = useCreateCommittee();
  const updateCommitteeMutation = useUpdateCommittee();
  const deleteCommitteeMutation = useDeleteCommittee();

  // Get first active branch for default selection
  const firstActiveBranch = branches.find(branch => branch.is_active)?.id;

  // View state - 'list' or 'details'
  const [currentView, setCurrentView] = useState<'list' | 'details'>('list');
  
  // Committees state
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(
    null
  );
  const [editingCommittee, setEditingCommittee] = useState<string | null>(null);
  const [showAddCommittee, setShowAddCommittee] = useState(false);

  const [committeeForm, setCommitteeForm] = useState<CommitteeFormData>({
    name: '',
    description: '',
    type: 'permanent',
    branch_id: firstActiveBranch,
    end_date: '',
  });

  const [deleteCommitteeDialog, setDeleteCommitteeDialog] = useState<{
    isOpen: boolean;
    committeeId: string | null;
    committeeName: string;
  }>({
    isOpen: false,
    committeeId: null,
    committeeName: '',
  });

  const resetCommitteeForm = () => {
    setCommitteeForm({
      name: '',
      description: '',
      type: 'permanent',
      branch_id: firstActiveBranch,
      end_date: '',
    });
  };

  // Handle committee operations
  const handleCreateCommittee = async () => {
    if (!committeeForm.name.trim()) return;

    try {
      await createCommitteeMutation.mutateAsync(committeeForm);
      resetCommitteeForm();
      setShowAddCommittee(false);
    } catch (error) {
      console.error('Failed to create committee:', error);
    }
  };

  const handleUpdateCommittee = async (committeeId: string) => {
    if (!committeeForm.name.trim()) return;

    try {
      await updateCommitteeMutation.mutateAsync({
        committeeId,
        updates: committeeForm,
      });
      setEditingCommittee(null);
      resetCommitteeForm();
    } catch (error) {
      console.error('Failed to update committee:', error);
    }
  };

  const handleDeleteCommittee = (committeeId: string) => {
    const committee = committees.find(c => c.id === committeeId);
    setDeleteCommitteeDialog({
      isOpen: true,
      committeeId: committeeId,
      committeeName: committee?.name || 'Unknown Committee',
    });
  };

  const confirmDeleteCommittee = async () => {
    if (!deleteCommitteeDialog.committeeId) return;

    try {
      await deleteCommitteeMutation.mutateAsync(deleteCommitteeDialog.committeeId);
      if (selectedCommittee === deleteCommitteeDialog.committeeId) {
        setSelectedCommittee(null);
      }
      setDeleteCommitteeDialog({
        isOpen: false,
        committeeId: null,
        committeeName: '',
      });
    } catch (error) {
      console.error('Failed to delete committee:', error);
    }
  };

  const startEditingCommittee = (
    committeeId: string,
    committee: Committee
  ) => {
    setCommitteeForm({
      name: committee.name,
      description: committee.description || '',
      type: committee.type,
      branch_id: committee.branch_id || firstActiveBranch,
      start_date: committee.start_date || '',
      end_date: committee.end_date || '',
    });
    setEditingCommittee(committeeId);
  };

  // Show loading if organization is not available yet
  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading organization...
        </span>
      </div>
    );
  }

  if (committeesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load committees: {committeesError.message}
        </AlertDescription>
      </Alert>
    );
  }

  const selectedCommitteeData = selectedCommittee
    ? committees.find(c => c.id === selectedCommittee) || null
    : null;

  const isUpdating = createCommitteeMutation.isPending || 
                    updateCommitteeMutation.isPending || 
                    deleteCommitteeMutation.isPending;

  // Handle committee selection and view switching
  const handleSelectCommittee = (committeeId: string) => {
    setSelectedCommittee(committeeId);
    setCurrentView('details');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCommittee(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header - always visible */}
      <CommitteesHeader
        onAddCommittee={() => setShowAddCommittee(true)}
        isLoading={committeesIsLoading}
      />

      {/* Single view layout - switches between list and details */}
      <div className="h-[calc(100vh-200px)]">
        {/* List Panel - Show when in list view */}
        {currentView === 'list' && (
          <div className="h-full">
            <CommitteesListPanel
              committees={committees}
              selectedCommittee={selectedCommittee}
              onSelectCommittee={handleSelectCommittee}
              onEditCommittee={startEditingCommittee}
              onDeleteCommittee={handleDeleteCommittee}
              isLoading={committeesIsLoading}
            />
          </div>
        )}

        {/* Details Panel - Show when in details view */}
        {currentView === 'details' && (
          <div className="h-full">
            {/* Back button */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Committees
              </Button>
            </div>
            
            <CommitteeDetailsPanel
              committee={selectedCommitteeData}
              isLoading={committeesIsLoading}
            />
          </div>
        )}
      </div>

      <CommitteeModal
        isOpen={showAddCommittee || editingCommittee !== null}
        onClose={() => {
          setShowAddCommittee(false);
          setEditingCommittee(null);
          resetCommitteeForm();
        }}
        onSubmit={
          editingCommittee
            ? () => handleUpdateCommittee(editingCommittee)
            : handleCreateCommittee
        }
        committee={committeeForm}
        onCommitteeChange={setCommitteeForm}
        isEditing={editingCommittee !== null}
        isLoading={isUpdating}
      />

      <DeleteConfirmationDialog
        isOpen={deleteCommitteeDialog.isOpen}
        onClose={() =>
          setDeleteCommitteeDialog({
            isOpen: false,
            committeeId: null,
            committeeName: '',
          })
        }
        onConfirm={confirmDeleteCommittee}
        title="Delete Committee"
        description={`Are you sure you want to delete "${deleteCommitteeDialog.committeeName}"? This action cannot be undone.`}
        isLoading={deleteCommitteeMutation.isPending}
      />
    </div>
  );
}

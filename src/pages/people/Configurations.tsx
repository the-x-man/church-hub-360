import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import { toast } from 'sonner';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLocalCommitteesSchema } from '../../hooks/useLocalCommitteesSchema';
import {
  ConfigurationsHeader,
  FixedUpdateButton,
} from '../../components/people/configurations';
import { CommitteesListPanel } from '../../components/people/configurations/CommitteesListPanel';
import { CommitteeDetailsPanel } from '../../components/people/configurations/CommitteeDetailsPanel';
import { MembershipFormBuilder } from '../../components/people/configurations/MembershipFormBuilder';

import { CommitteeModal } from '../../components/people/CommitteeModal';
import { DeleteConfirmationDialog } from '../../components/shared/DeleteConfirmationDialog';

import type {
  Committee,
  CommitteeFormData,
} from '../../types/people-configurations';

export function PeopleConfigurations() {
  const { currentOrganization } = useOrganization();

  // Committees management
  const {
    localSchema: committeesSchema,
    hasUnsavedChanges: committeesHasChanges,
    changes: committeesChanges,
    isLoading: committeesIsLoading,
    error: committeesError,
    isUpdating: committeesIsUpdating,
    addCommittee,
    updateCommittee,
    deleteCommittee,
    syncChangesToServer: syncCommitteesToServer,
    resetLocalChanges: resetCommitteesChanges,
  } = useLocalCommitteesSchema();

  // UI state
  const [activeTab, setActiveTab] = useState('tags');

  // Committees state
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(
    null
  );
  const [editingCommittee, setEditingCommittee] = useState<string | null>(null);
  const [showAddCommittee, setShowAddCommittee] = useState(false);

  const [committeeForm, setCommitteeForm] = useState<CommitteeFormData>({
    name: '',
    description: '',
    end_date: '',
    is_active: true,
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
      end_date: '',
      is_active: true,
    });
  };

  // Handle committee operations
  const handleCreateCommittee = async () => {
    if (!committeeForm.name.trim()) return;

    addCommittee(committeeForm);
    resetCommitteeForm();
    setShowAddCommittee(false);
  };

  const handleUpdateCommittee = async (committeeKey: string) => {
    if (!committeeForm.name.trim()) return;

    updateCommittee(committeeKey, committeeForm);
    setEditingCommittee(null);
    resetCommitteeForm();
  };

  const handleDeleteCommittee = (committeeKey: string) => {
    const committee = committeesSchema?.committees[committeeKey];
    setDeleteCommitteeDialog({
      isOpen: true,
      committeeId: committeeKey,
      committeeName: committee?.name || committeeKey,
    });
  };

  const confirmDeleteCommittee = async () => {
    if (!deleteCommitteeDialog.committeeId) return;

    deleteCommittee(deleteCommitteeDialog.committeeId);
    if (selectedCommittee === deleteCommitteeDialog.committeeId) {
      setSelectedCommittee(null);
    }
    setDeleteCommitteeDialog({
      isOpen: false,
      committeeId: null,
      committeeName: '',
    });
  };

  const startEditingCommittee = (
    committeeKey: string,
    committee: Committee
  ) => {
    setCommitteeForm({
      name: committee.name,
      description: committee.description,
      end_date: committee.end_date || '',
      is_active: committee.is_active,
    });
    setEditingCommittee(committeeKey);
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

  // Handle reset changes
  const handleResetChanges = () => {
    resetCommitteesChanges();
    toast.info('Changes discarded');
  };

  if (committeesIsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading configurations...
        </span>
      </div>
    );
  }

  if (committeesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load configurations: {committeesError}
        </AlertDescription>
      </Alert>
    );
  }

  // Handle sync to server
  const handleSyncToServer = async () => {
    try {
      // Sync both schemas
      await Promise.all([
        committeesHasChanges ? syncCommitteesToServer() : Promise.resolve(),
      ]);
      toast.success('Changes saved successfully');
    } catch (err) {
      console.error('Failed to sync changes:', err);
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const committees = committeesSchema?.committees || {};
  const selectedCommitteeData = selectedCommittee
    ? committees[selectedCommittee]
    : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <ConfigurationsHeader
        hasUnsavedChanges={committeesHasChanges}
        changes={{ ...committeesChanges }}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="committees">Committees</TabsTrigger>
          <TabsTrigger value="membership-form">Membership Form</TabsTrigger>
        </TabsList>

        {/* Committees Tab */}
        <TabsContent value="committees" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Committees List */}
            <div className="lg:col-span-1">
              <CommitteesListPanel
                committees={committees}
                selectedCommittee={selectedCommittee}
                editingCommittee={editingCommittee}
                onSelectCommittee={setSelectedCommittee}
                onAddCommittee={() => setShowAddCommittee(true)}
                onEditCommittee={startEditingCommittee}
                onDeleteCommittee={handleDeleteCommittee}
              />
            </div>

            {/* Committee Details */}
            <div className="lg:col-span-2">
              <CommitteeDetailsPanel
                selectedCommittee={selectedCommittee}
                selectedCommitteeData={selectedCommitteeData}
                onUpdateCommittee={(
                  committeeId: string,
                  updates: Partial<Committee>
                ) => {
                  updateCommittee(committeeId, updates);
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* Membership Form Tab */}
        <TabsContent value="membership-form" className="space-y-6">
          <MembershipFormBuilder />
        </TabsContent>
      </Tabs>

      {/* Fixed Update Button */}
      <FixedUpdateButton
        hasUnsavedChanges={committeesHasChanges}
        changes={{ ...committeesChanges }}
        isUpdating={committeesIsUpdating}
        onUpdate={handleSyncToServer}
        onReset={handleResetChanges}
      />

      {/* Committee Modal */}
      <CommitteeModal
        isOpen={showAddCommittee || editingCommittee !== null}
        onClose={() => {
          setShowAddCommittee(false);
          setEditingCommittee(null);
          resetCommitteeForm();
        }}
        onSave={
          editingCommittee
            ? () => handleUpdateCommittee(editingCommittee)
            : handleCreateCommittee
        }
        formData={committeeForm}
        setFormData={setCommitteeForm}
        isEditing={editingCommittee !== null}
        loading={committeesIsUpdating}
      />

      {/* Delete Committee Confirmation Dialog */}
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
        description={`Are you sure you want to delete the committee "${deleteCommitteeDialog.committeeName}"? This action cannot be undone and will remove all associated members.`}
        confirmButtonText="Delete Committee"
        isLoading={committeesIsUpdating}
      />
    </div>
  );
}

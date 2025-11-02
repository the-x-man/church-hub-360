import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { GroupModal } from '../../components/people/GroupModal';
import { GroupDetailsPanel } from '../../components/people/configurations/GroupDetailsPanel';
import { GroupsHeader } from '../../components/people/configurations/GroupsHeader';
import { GroupsListPanel } from '../../components/people/configurations/GroupsListPanel';
import { DeleteConfirmationDialog } from '../../components/shared/DeleteConfirmationDialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useBranches } from '../../hooks/queries';
import { useGroups, useCreateGroup, useDeleteGroup, useUpdateGroup, type Group, type GroupFormData } from '../../hooks/useGroups';

export function Groups() {
  const { currentOrganization } = useOrganization();

  // Groups data and mutations
  const { 
    data: groups = [], 
    isLoading: groupsIsLoading, 
    error: groupsError 
  } = useGroups();
  
  // Branches data for default selection
  const { data: branches = [] } = useBranches(currentOrganization?.id);
  
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();

  // Get first active branch for default selection
  const firstActiveBranch = branches.find(branch => branch.is_active)?.id;

  // View state - 'list' or 'details'
  const [currentView, setCurrentView] = useState<'list' | 'details'>('list');
  
  // Groups state
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    null
  );
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);

  const [groupForm, setGroupForm] = useState<GroupFormData>({
    name: '',
    description: '',
    type: 'permanent',
    branch_id: firstActiveBranch,
    end_date: '',
  });

  const [deleteGroupDialog, setDeleteGroupDialog] = useState<{
    isOpen: boolean;
    groupId: string | null;
    groupName: string;
  }>({
    isOpen: false,
    groupId: null,
    groupName: '',
  });

  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: '',
      type: 'permanent',
      branch_id: firstActiveBranch,
      end_date: '',
    });
  };

  // Handle group operations
  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) return;

    try {
      await createGroupMutation.mutateAsync(groupForm);
      resetGroupForm();
      setShowAddGroup(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!groupForm.name.trim()) return;

    try {
      await updateGroupMutation.mutateAsync({
        groupId,
        updates: groupForm,
      });
      setEditingGroup(null);
      resetGroupForm();
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    setDeleteGroupDialog({
      isOpen: true,
      groupId: groupId,
      groupName: group?.name || 'Unknown Group',
    });
  };

  const confirmDeleteGroup = async () => {
    if (!deleteGroupDialog.groupId) return;

    try {
      await deleteGroupMutation.mutateAsync(deleteGroupDialog.groupId);
      if (selectedGroup === deleteGroupDialog.groupId) {
        setSelectedGroup(null);
      }
      setDeleteGroupDialog({
        isOpen: false,
        groupId: null,
        groupName: '',
      });
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const startEditingGroup = (
    groupId: string,
    group: Group
  ) => {
    setGroupForm({
      name: group.name,
      description: group.description || '',
      type: group.type,
      branch_id: group.branch_id || firstActiveBranch,
      start_date: group.start_date || '',
      end_date: group.end_date || '',
    });
    setEditingGroup(groupId);
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

  if (groupsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load groups: {groupsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  const selectedGroupData = selectedGroup
    ? groups.find(g => g.id === selectedGroup) || null
    : null;

  const isUpdating = createGroupMutation.isPending || 
                    updateGroupMutation.isPending || 
                    deleteGroupMutation.isPending;

  // Handle group selection and view switching
  const handleSelectGroup = (groupId: string) => {
    setSelectedGroup(groupId);
    setCurrentView('details');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedGroup(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header - always visible */}
      <GroupsHeader
        onAddGroup={() => setShowAddGroup(true)}
        isLoading={groupsIsLoading}
      />

      {/* Single view layout - switches between list and details */}
      <div className="h-[calc(100vh-200px)]">
        {/* List Panel - Show when in list view */}
        {currentView === 'list' && (
          <div className="h-full">
            <GroupsListPanel
              groups={groups}
              selectedGroup={selectedGroup}
              onSelectGroup={handleSelectGroup}
              onEditGroup={startEditingGroup}
              onDeleteGroup={handleDeleteGroup}
              isLoading={groupsIsLoading}
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
                Back to Groups
              </Button>
            </div>
            
            <GroupDetailsPanel
              group={selectedGroupData}
              isLoading={groupsIsLoading}
            />
          </div>
        )}
      </div>

      <GroupModal
        isOpen={showAddGroup || editingGroup !== null}
        onClose={() => {
          setShowAddGroup(false);
          setEditingGroup(null);
          resetGroupForm();
        }}
        onSubmit={
          editingGroup
            ? () => handleUpdateGroup(editingGroup)
            : handleCreateGroup
        }
        group={groupForm}
        onGroupChange={setGroupForm}
        isEditing={editingGroup !== null}
        isLoading={isUpdating}
      />

      <DeleteConfirmationDialog
        isOpen={deleteGroupDialog.isOpen}
        onClose={() =>
          setDeleteGroupDialog({
            isOpen: false,
            groupId: null,
            groupName: '',
          })
        }
        onConfirm={confirmDeleteGroup}
        title="Delete Group"
        description={`Are you sure you want to delete "${deleteGroupDialog.groupName}"? This action cannot be undone.`}
        isLoading={deleteGroupMutation.isPending}
      />
    </div>
  );
}

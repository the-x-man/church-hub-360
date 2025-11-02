import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Check,
  Edit2,
  Loader2,
  Plus,
  Printer,
  Settings,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import type { Group } from '../../../hooks/useGroups';
import {
  useAssignMemberToGroup,
  useBulkAssignMembersToGroup,
  useCloseGroup,
  useGroupMembers,
  useRemoveMemberFromGroup,
  useUpdateMemberPosition,
} from '../../../hooks/useGroups';
import { useBranches } from '../../../hooks/useBranchQueries';
import type { MemberSearchResult } from '../../../hooks/useMemberSearch';
import { MemberSearchTypeahead } from '../../shared/MemberSearchTypeahead';
import { GroupMembersPrintModal } from '../../shared/GroupMembersPrintModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface GroupDetailsPanelProps {
  group: Group | null;
  isLoading?: boolean;
}

export function GroupDetailsPanel({
  group,
  isLoading = false,
}: GroupDetailsPanelProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { data: branches } = useBranches(currentOrganization?.id || '');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    []
  );
  const [memberPosition, setMemberPosition] = useState<string>('');
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [editPositionValue, setEditPositionValue] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  const { data: groupMembers, isLoading: membersLoading } = useGroupMembers(
    group?.id || ''
  );
  const assignMemberMutation = useAssignMemberToGroup();
  const bulkAssignMembersMutation = useBulkAssignMembersToGroup();
  const removeMemberMutation = useRemoveMemberFromGroup();
  const updatePositionMutation = useUpdateMemberPosition();
  const closeGroupMutation = useCloseGroup();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading group details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!group) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a group to view and manage its details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleAddMember = async () => {
    if (selectedMembers.length === 0 || !group || !user?.id) return;

    try {
      // Filter out members who are already assigned to the group
      const assignedMemberIds = new Set(
        groupMembers?.map((m) => m.member_id) || []
      );
      const membersToAssign = selectedMembers.filter(
        (member) => !assignedMemberIds.has(member.id)
      );

      if (membersToAssign.length === 0) {
        toast.error('All selected members are already assigned to this group');
        return;
      }

      // Bulk assign all new members to the group
      await bulkAssignMembersMutation.mutateAsync({
        groupId: group.id,
        memberAssignments: membersToAssign.map((member) => ({
          memberId: member.id,
          position: memberPosition || 'Member',
        })),
        createdBy: user.id,
      });

      setSelectedMembers([]);
      setMemberPosition('');
      setIsAddingMember(false);
    } catch (error) {
      console.error('Failed to assign member(s) to group:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!group) return;

    try {
      await removeMemberMutation.mutateAsync({
        groupId: group.id,
        memberId,
      });
    } catch (error) {
      console.error('Failed to remove member from group:', error);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingMember(false);
    setSelectedMembers([]);
    setMemberPosition('');
  };

  const handleEditPosition = (memberId: string, currentPosition: string) => {
    setEditingPosition(memberId);
    setEditPositionValue(currentPosition || '');
  };

  const handleSavePosition = async (memberId: string) => {
    if (!group) return;

    try {
      await updatePositionMutation.mutateAsync({
        groupId: group.id,
        memberId,
        position: editPositionValue.trim() || 'Member',
      });
      setEditingPosition(null);
      setEditPositionValue('');
    } catch (error) {
      console.error('Failed to update member position:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingPosition(null);
    setEditPositionValue('');
  };

  const handleCloseGroup = () => {
    setIsCloseConfirmOpen(true);
  };

  const handleConfirmCloseGroup = async () => {
    if (!group || !user?.id) return;

    try {
      await closeGroupMutation.mutateAsync(group.id);
      setIsCloseConfirmOpen(false);
    } catch (error) {
      console.error('Failed to close group:', error);
    }
  };

  const handlePrintMembers = () => {
    setIsPrintModalOpen(true);
  };

  const getGroupStatusBadge = () => {
    if (group.is_closed) {
      return <Badge variant="destructive">Closed</Badge>;
    }
    if (!group.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getGroupTypeBadge = () => {
    return (
      <Badge variant="outline" className="capitalize">
        {group.type}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {group.name}
              <div className="flex gap-2">
                <span key="status-badge">{getGroupStatusBadge()}</span>
                <span key="type-badge">{getGroupTypeBadge()}</span>
              </div>
            </CardTitle>
            {group.description && (
              <CardDescription>{group.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Print Members Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintMembers}
              className="flex items-center gap-2"
            >
              <Printer className="h-3 w-3" />
              Print
            </Button>
            {/* Close Group Button - Only show for temporal groups that are not closed */}
            {group.type === 'temporal' && !group.is_closed && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleCloseGroup}
                disabled={closeGroupMutation.isPending}
              >
                {closeGroupMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Closing...
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Close
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Group Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Group Members</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingMember(true)}
                disabled={isAddingMember || group.is_closed}
                className="h-8"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add Member
              </Button>
            </div>

            <div>
              {/* Add Member Form */}
              {isAddingMember && (
                <div className="space-y-3 p-4 border border-dashed rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="member-search">Select Members</Label>
                    <MemberSearchTypeahead
                      organizationId={group.organization_id}
                      value={selectedMembers}
                      onChange={setSelectedMembers}
                      placeholder="Search for members..."
                      branchId={group.branch_id || undefined}
                      multiSelect={true}
                      excludeMembers={
                        groupMembers?.map((m) => m.member_id) || []
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Select
                      value={memberPosition}
                      onValueChange={setMemberPosition}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chairperson">Chairperson</SelectItem>
                        <SelectItem value="Vice Chairperson">
                          Vice Chairperson
                        </SelectItem>
                        <SelectItem value="Secretary">Secretary</SelectItem>
                        <SelectItem value="Treasurer">Treasurer</SelectItem>
                        <SelectItem value="Member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddMember}
                      disabled={
                        selectedMembers.length === 0 ||
                        assignMemberMutation.isPending
                      }
                    >
                      {assignMemberMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Add Member
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelAdd}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Members */}
              {membersLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Loading members...
                  </p>
                </div>
              ) : !groupMembers || groupMembers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No members assigned to this group yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {groupMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg group"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {member.member_full_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {editingPosition === member.member_id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editPositionValue}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => setEditPositionValue(e.target.value)}
                                placeholder="Position"
                                className="h-6 text-xs w-24"
                                onKeyDown={(
                                  e: React.KeyboardEvent<HTMLInputElement>
                                ) => {
                                  if (e.key === 'Enter') {
                                    handleSavePosition(member.member_id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  handleSavePosition(member.member_id)
                                }
                                disabled={updatePositionMutation.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>{member.position}</span>
                              {!group.is_closed && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleEditPosition(
                                      member.member_id,
                                      member.position || ''
                                    )
                                  }
                                >
                                  <Edit2 className="h-2 w-2" />
                                </Button>
                              )}
                            </div>
                          )}
                          <span>
                            • Assigned {formatDate(member.assigned_at)}
                          </span>
                        </div>
                      </div>
                      {!group.is_closed && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.member_id)}
                          disabled={removeMemberMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Group Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            {group.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(group.start_date)}
                  </p>
                </div>
              </div>
            )}

            {group.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(group.end_date)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Total Members</Label>
                <p className="text-sm text-muted-foreground">
                  {groupMembers?.length || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(group.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Print Modal */}
      {group && (
        <GroupMembersPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          group={group}
          members={groupMembers || []}
          organizationName={currentOrganization?.name}
          branchName={
            branches?.find((branch) => branch.id === group.branch_id)?.name ||
            'Unknown Branch'
          }
        />
      )}

      {/* Close Group Confirmation Dialog */}
      <AlertDialog
        open={isCloseConfirmOpen}
        onOpenChange={setIsCloseConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this group? It will be marked as
              closed and you can no longer update it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCloseGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Close Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  MapPin,
  Link,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useAttendanceSessions,
  useDeleteAttendanceSession,
  useToggleSessionStatus,
  useCreateAttendanceSession,
  useUpdateAttendanceSession,
} from '@/hooks/attendance/useAttendanceSessions';
import { SessionForm } from './SessionForm';
import { SessionCreationWizard } from './SessionCreationWizard';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { AttendanceSessionFormData } from '@/schemas/attendanceSessionSchema';
import type {
  AttendanceSessionFilters,
  AttendanceSessionStatus,
  AttendanceSession,
  AttendanceSessionWithRelations,
} from '@/types/attendance';

export function AttendanceSessions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    AttendanceSessionStatus | 'all'
  >('all');
  const [isOpenFilter, setIsOpenFilter] = useState<boolean | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editorSession, setEditorSession] = useState<AttendanceSession | null>(
    null
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    sessionId: string | null;
    sessionName: string | null;
  }>({ isOpen: false, sessionId: null, sessionName: null });

  // Build filters object
  const filters: AttendanceSessionFilters = {
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(isOpenFilter !== 'all' && { is_open: isOpenFilter }),
  };

  const { data: sessions = [], isLoading, error } = useAttendanceSessions(
    filters
  );

  const deleteSessionMutation = useDeleteAttendanceSession();
  const toggleStatusMutation = useToggleSessionStatus();
  const createSessionMutation = useCreateAttendanceSession();
  const updateSessionMutation = useUpdateAttendanceSession();
  const { currentOrganization } = useOrganization();

  const handleDeleteSession = (session: AttendanceSessionWithRelations) => {
    setDeleteDialog({
      isOpen: true,
      sessionId: session.id,
      sessionName: session.name || session.occasion_name || 'Unnamed Session',
    });
  };

  const handleToggleStatus = (sessionId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({
      id: sessionId,
      isOpen: !currentStatus,
    });
  };

  const handleEditSession = (session: AttendanceSessionWithRelations) => {
    setEditorSession(session);
    setViewMode('editor');
  };

  const handleCreateNewSession = () => {
    setEditorSession(null);
    setViewMode('editor');
  };

  const handleEditorCancel = () => {
    setEditorSession(null);
    setViewMode('list');
  };

  const handleEditorSubmit = async (data: AttendanceSessionFormData) => {
    try {
      if (!editorSession) {
        // Create new session
        if (!currentOrganization?.id) {
          throw new Error('Organization not found');
        }
        const created = await createSessionMutation.mutateAsync({
          ...data,
          organization_id: currentOrganization.id,
        });
        setEditorSession(created);
      } else {
        // Update existing session
        const updated = await updateSessionMutation.mutateAsync({
          id: editorSession.id,
          updates: data,
        });
        setEditorSession(updated);
      }
    } catch (e) {
      // Error handling is done in mutations via toast; keep UX consistent
    }
  };

  const getStatusBadge = (session: any) => {
    if (session.is_current && session.is_open) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </Badge>
      );
    }
    if (session.is_current && !session.is_open) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Closed
        </Badge>
      );
    }
    if (session.is_future) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Upcoming
        </Badge>
      );
    }
    return <Badge variant="secondary">Past</Badge>;
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), "MMM dd, yyyy 'at' h:mm a");
  };

  const formatTime = (dateTime: string) => {
    return format(new Date(dateTime), 'h:mm a');
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Sessions
            </h3>
            <p className="text-muted-foreground">
              {error instanceof Error
                ? error.message
                : 'Failed to load attendance sessions'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {viewMode === 'editor'
              ? editorSession
                ? 'Edit Attendance Session'
                : 'Create New Attendance Session'
              : 'Attendance Sessions'}
          </h2>
        </div>
        {viewMode === 'editor' ? (
          <Button
            variant="outline"
            className="w-fit"
            onClick={handleEditorCancel}
          >
            Back to List
          </Button>
        ) : (
          <Button className="w-fit" onClick={handleCreateNewSession}>
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        )}
      </div>

      {viewMode === 'list' && (
        <>
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as AttendanceSessionStatus | 'all')
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={isOpenFilter.toString()}
                  onValueChange={(value) =>
                    setIsOpenFilter(value === 'all' ? 'all' : value === 'true')
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Open" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Open</SelectItem>
                    <SelectItem value="false">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading sessions...</p>
                </div>
              </CardContent>
            </Card>
          ) : sessions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Sessions ({sessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2 sm:space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {session.name ||
                              session.occasion_name ||
                              'Unnamed Session'}
                          </h3>
                          {getStatusBadge(session)}
                          {session.allow_public_marking && (
                            <Badge variant="outline" className="text-xs">
                              <Link className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          )}
                          {session.proximity_required && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              Location
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(session.start_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(session.start_time)} -{' '}
                            {formatTime(session.end_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {session.attendance_count || 0} attendees
                          </div>
                        </div>

                        {session.occasion_name &&
                          session.name !== session.occasion_name && (
                            <p className="text-xs text-muted-foreground">
                              From: {session.occasion_name}
                            </p>
                          )}
                      </div>

                      <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        {session.is_current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleStatus(session.id, session.is_open)
                            }
                            disabled={toggleStatusMutation.isPending}
                          >
                            {session.is_open ? (
                              <>
                                <Pause className="w-3 h-3 mr-1" />
                                Close
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Open
                              </>
                            )}
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSession(session)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSession(session)}
                          disabled={deleteSessionMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Empty State */
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No sessions found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ||
                    statusFilter !== 'all' ||
                    isOpenFilter !== 'all'
                      ? 'No sessions match your current filters. Try adjusting your search criteria.'
                      : 'Create your first attendance session to get started'}
                  </p>
                  <Button onClick={handleCreateNewSession}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {viewMode === 'editor' && (
        <Card>
          <CardContent className="pt-6">
            {editorSession ? (
              <SessionForm
                mode="edit"
                initialData={editorSession}
                onSubmit={handleEditorSubmit}
                onCancel={handleEditorCancel}
                isLoading={updateSessionMutation.isPending}
              />
            ) : (
              <SessionCreationWizard onCancel={handleEditorCancel} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, sessionId: null, sessionName: null })
        }
        onConfirm={async () => {
          if (!deleteDialog.sessionId) return;
          await deleteSessionMutation.mutateAsync(deleteDialog.sessionId);
          setDeleteDialog({
            isOpen: false,
            sessionId: null,
            sessionName: null,
          });
        }}
        title="Delete Attendance Session"
        description={`Are you sure you want to delete "${
          deleteDialog.sessionName || ''
        }"? This action cannot be undone.`}
        isLoading={deleteSessionMutation.isPending}
      />
    </div>
  );
}

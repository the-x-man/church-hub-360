import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { Pagination } from '@/components/shared/Pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  useMarkAttendance,
  useSessionAllowedMembers,
  useSessionAttendanceRecords,
  useUnmarkAttendance,
} from '@/hooks/attendance/useAttendanceMarking';
import {
  useAttendanceSession,
  useAttendanceSessions,
} from '@/hooks/attendance/useAttendanceSessions';
import type { MemberSearchResult } from '@/hooks/useMemberSearch';
import { useMemberDetails } from '@/hooks/useMemberSearch';
import type { AttendanceSessionWithRelations } from '@/types/attendance';
import {
  buildAllowedMemberIdSet,
  formatValidationMessage,
  validateSessionForMarking,
} from '@/utils/attendance/sessionValidation';
import { format, isSameDay } from 'date-fns';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function AttendanceMarking() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id || '';

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    []
  );

  const { data: session } = useAttendanceSession(selectedSessionId || '');
  const {
    data: allowedMembers = [],
    isLoading: loadingAllowed,
  } = useSessionAllowedMembers(session as AttendanceSessionWithRelations);
  const allowedSet = useMemo(() => buildAllowedMemberIdSet(allowedMembers), [
    allowedMembers,
  ]);

  const { data: records = [] } = useSessionAttendanceRecords(
    selectedSessionId || undefined
  );
  const recordMemberIds = useMemo(
    () => Array.from(new Set(records.map((r) => r.member_id))).filter(Boolean),
    [records]
  );
  const { data: recordMemberDetails = [] } = useMemberDetails(
    recordMemberIds as string[]
  );
  const recordMemberById = useMemo(() => {
    const map = new Map<string, any>();
    recordMemberDetails.forEach((m) => map.set(m.id, m));
    return map;
  }, [recordMemberDetails]);
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const ta = a.marked_at ? new Date(a.marked_at).getTime() : 0;
      const tb = b.marked_at ? new Date(b.marked_at).getTime() : 0;
      return tb - ta;
    });
  }, [records]);
  const presentIds = useMemo(() => recordMemberIds as string[], [
    recordMemberIds,
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSessionId]);
  const totalItems = sortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pageRecords = sortedRecords.slice(startIndex, endIndex);
  const presentMap = useMemo(() => {
    const m = new Map<string, boolean>();
    records.forEach((r) => m.set(r.member_id, true));
    return m;
  }, [records]);

  const markMutation = useMarkAttendance();
  const unmarkMutation = useUnmarkAttendance();

  const searchFields = useMemo(() => {
    const fields: ('name' | 'email' | 'phone' | 'membershipId')[] = ['name'];
    if (session?.marking_modes?.email) fields.push('email');
    if (session?.marking_modes?.phone) fields.push('phone');
    if (session?.marking_modes?.membership_id) fields.push('membershipId');
    return fields;
  }, [session?.marking_modes]);

  const hasRestrictions = useMemo(() => {
    return !!(
      session &&
      ((session.allowed_members && session.allowed_members.length) ||
        (session.allowed_groups && session.allowed_groups.length) ||
        (session.allowed_tags && session.allowed_tags.length))
    );
  }, [session]);

  const filteredSelectedMembers = useMemo(() => {
    let base = selectedMembers;
    if (hasRestrictions && allowedSet) {
      base = base.filter((m) => allowedSet.has(m.id));
    }
    return base.filter((m) => !presentMap.get(m.id));
  }, [selectedMembers, hasRestrictions, allowedSet, presentMap]);

  const sessionValidation = useMemo(() => {
    if (!session) return null;
    return validateSessionForMarking(session as any, {
      origin: 'internal',
      mode: 'manual',
      allowedMemberIds: allowedSet || undefined,
    });
  }, [session, allowedSet]);

  const friendlyMessage = useMemo(
    () =>
      sessionValidation ? formatValidationMessage(sessionValidation) : null,
    [sessionValidation]
  );

  const onPresent = async (memberId: string) => {
    if (!selectedSessionId) return;
    const v = session
      ? validateSessionForMarking(session as any, {
          origin: 'internal',
          mode: 'manual',
          memberId,
          allowedMemberIds: allowedSet || undefined,
        })
      : null;
    if (!v || !v.ok) return;
    await markMutation.mutateAsync({ sessionId: selectedSessionId, memberId });
    setSelectedMembers([]);
  };

  const onAbsent = async (memberId: string) => {
    if (!selectedSessionId) return;
    await unmarkMutation.mutateAsync({
      sessionId: selectedSessionId,
      memberId,
    });
    setSelectedMembers([]);
  };

  const { data: sessions = [] } = useAttendanceSessions({ is_open: true });
  const todaysSessions = useMemo(() => {
    return (sessions || []).filter((s) =>
      isSameDay(new Date(s.start_time), new Date())
    );
  }, [sessions]);

  return (
    <div className="space-y-6">
      {!selectedSessionId ? (
        <>
          <div>
            <h1 className="text-2xl font-bold">Attendance Marking</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Active Attendance Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(todaysSessions || [])
                  .filter(
                    (s) =>
                      validateSessionForMarking(s as any, {
                        origin: 'internal',
                        mode: 'manual',
                      }).ok
                  )
                  .map((s) => {
                    const modes = s.marking_modes || {
                      manual: false,
                      email: false,
                      phone: false,
                      membership_id: false,
                    };
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSessionId(s.id)}
                        className={`text-left p-3 border rounded-lg transition-colors hover:bg-muted`}
                      >
                        <div className="font-medium text-sm">
                          {s.name || 'Untitled Session'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(s.start_time).toLocaleString()} –{' '}
                          {new Date(s.end_time).toLocaleString()}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {modes.manual && (
                            <Badge variant="secondary">Manual</Badge>
                          )}
                          {modes.email && (
                            <Badge variant="secondary">Email</Badge>
                          )}
                          {modes.phone && (
                            <Badge variant="secondary">Phone</Badge>
                          )}
                          {modes.membership_id && (
                            <Badge variant="secondary">Membership ID</Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                {(todaysSessions || []).filter(
                  (s) =>
                    validateSessionForMarking(s as any, {
                      origin: 'internal',
                      mode: 'manual',
                    }).ok
                ).length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No active sessions scheduled for today.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Mark Attendance
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionId('')}
              >
                Back to Sessions
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!session && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No session selected</AlertTitle>
                <AlertDescription>
                  Select a session to start marking.
                </AlertDescription>
              </Alert>
            )}
            {session && sessionValidation && !sessionValidation.ok && (
              <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Marking Unavailable</AlertTitle>
                <AlertDescription>{friendlyMessage}</AlertDescription>
              </Alert>
            )}

            {session && (
              <div className="space-y-4">
                <MemberSearchTypeahead
                  organizationId={orgId}
                  value={selectedMembers}
                  onChange={setSelectedMembers}
                  searchFields={searchFields}
                  placeholder={`Search by ${searchFields.join(', ')}`}
                  emptyMessage={
                    hasRestrictions
                      ? loadingAllowed
                        ? 'Loading allowed members...'
                        : 'No allowed members found for this session'
                      : 'No members found'
                  }
                  excludeMembers={presentIds}
                  allowedMemberIds={
                    hasRestrictions && Array.isArray(allowedMembers)
                      ? allowedMembers.map((m: any) => m.id)
                      : []
                  }
                />

                <div className="space-y-3">
                  {hasRestrictions && !allowedSet && (
                    <div className="text-xs text-muted-foreground">
                      Loading allowlist...
                    </div>
                  )}
                  {filteredSelectedMembers.map((member) => {
                    const present = !!presentMap.get(member.id);
                    const validation = validateSessionForMarking(
                      session as any,
                      {
                        origin: 'internal',
                        mode: 'manual',
                        memberId: member.id,
                        allowedMemberIds: allowedSet || undefined,
                      }
                    );
                    const valid = validation.ok;
                    const msg = formatValidationMessage(validation);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={member.profile_image_url || undefined}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {member.display_name
                                .split(' ')
                                .map((s) => s.charAt(0))
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.display_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.display_subtitle}
                            </div>
                            {!valid && msg && (
                              <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                {msg}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              !valid || markMutation.isPending || present
                            }
                            onClick={() => onPresent(member.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                            {present ? 'Marked' : 'Present'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={unmarkMutation.isPending}
                            onClick={() => onAbsent(member.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1 text-red-600" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredSelectedMembers.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No members selected yet.
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2">Marked Members</h3>
                  <div className="space-y-2">
                    {pageRecords.map((r: any) => {
                      const m = recordMemberById.get(r.member_id);
                      const name = m
                        ? m.full_name || `${m.first_name} ${m.last_name}`
                        : r.member_id;
                      const markedAt = r.marked_at
                        ? format(new Date(r.marked_at), 'MMM d, yyyy h:mma')
                        : '—';
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={(m && m.profile_image_url) || undefined}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {name
                                  .split(' ')
                                  .map((s: string) => s.charAt(0))
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <div className="font-medium">{name}</div>
                              <div className="text-muted-foreground">
                                {markedAt}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={unmarkMutation.isPending}
                              onClick={() => onAbsent(r.member_id)}
                              title="Unmark"
                            >
                              <XCircle className="w-4 h-4 md:mr-1 text-red-600" />
                              <span className="hidden md:inline">Unmark</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {sortedRecords.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No attendance marked yet.
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={(p) =>
                        setCurrentPage(Math.min(Math.max(1, p), totalPages))
                      }
                      onPageSizeChange={(ps) => {
                        setPageSize(ps);
                        setCurrentPage(1);
                      }}
                      itemName="members"
                      pageSizeOptions={[5, 10, 20, 50]}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

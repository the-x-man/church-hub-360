import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/shared/Pagination';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AttendanceRecordSummary } from '@/hooks/attendance/useAttendanceMarking';
import { useMemberDetails } from '@/hooks/useMemberSearch';
import type { MemberSummary } from '@/types/members';
import type {
  AttendanceSessionWithRelations,
  AttendanceMarkingModes,
} from '@/types/attendance';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ValidationResult } from '@/utils/attendance/sessionValidation';

interface ManualMarkingCardProps {
  session: AttendanceSessionWithRelations;
  search: string;
  setSearch: (val: string) => void;
  searchFields: ('name' | 'email' | 'phone' | 'membershipId')[];
  setSearchFields: (
    updater: (
      prev: ('name' | 'email' | 'phone' | 'membershipId')[]
    ) => ('name' | 'email' | 'phone' | 'membershipId')[]
  ) => void;
  filteredMembers: MemberSummary[];
  presentMap: Map<string, boolean>;
  onPresent: (memberId: string) => void;
  onAbsent: (memberId: string) => void;
  markPending: boolean;
  unmarkPending: boolean;
  hasAllowedList: boolean;
  loadingAllowed: boolean;
  loadingAll: boolean;
  page: number;
  pageSize: number;
  paginatedTotal: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  markingModes?: AttendanceMarkingModes;
  records?: AttendanceRecordSummary[];
  sessionValidationResult?: ValidationResult;
}

export function ManualMarkingCard({
  session,
  search,
  setSearch,
  searchFields,
  setSearchFields,
  filteredMembers,
  presentMap,
  onPresent,
  onAbsent,
  markPending,
  unmarkPending,
  hasAllowedList,
  loadingAllowed,
  loadingAll,
  page,
  pageSize,
  paginatedTotal,
  onPageChange,
  onPageSizeChange,
  markingModes,
  records = [],
  sessionValidationResult,
}: ManualMarkingCardProps) {
  const [tab, setTab] = useState<'mark' | 'records'>(
    sessionValidationResult ? 'records' : 'mark'
  );
  const [recordSearch, setRecordSearch] = useState('');
  const [recordPage, setRecordPage] = useState(1);
  const [recordPageSize, setRecordPageSize] = useState(10);
  const manualEnabled = !!session.marking_modes?.manual;
  const modes = useMemo(
    () =>
      markingModes ||
      session.marking_modes || {
        manual: false,
        email: false,
        phone: false,
        membership_id: false,
      },
    [markingModes, session.marking_modes]
  );
  const placeholderParts = useMemo(() => {
    const parts: string[] = [];
    if (searchFields.includes('name')) parts.push('name');
    if (searchFields.includes('email') && modes.email) parts.push('email');
    if (searchFields.includes('phone') && modes.phone) parts.push('phone');
    if (searchFields.includes('membershipId') && modes.membership_id)
      parts.push('membership ID');
    return parts.length ? parts : ['name'];
  }, [searchFields, modes.email, modes.phone, modes.membership_id]);

  // Build records member details and table state
  const recordMemberIds = useMemo(
    () =>
      Array.from(new Set((records || []).map((r) => r.member_id))).filter(
        Boolean
      ),
    [records]
  );
  const { data: recordMemberDetails = [] } = useMemberDetails(recordMemberIds);
  const recordMemberById = useMemo(() => {
    const map = new Map<string, MemberSummary>();
    recordMemberDetails.forEach((m) => map.set(m.id, m));
    return map;
  }, [recordMemberDetails]);

  const sortedRecords = useMemo(() => {
    const byDateDesc = [...(records || [])].sort((a, b) => {
      const ta = a.marked_at ? new Date(a.marked_at).getTime() : 0;
      const tb = b.marked_at ? new Date(b.marked_at).getTime() : 0;
      return tb - ta;
    });
    return byDateDesc;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const term = recordSearch.trim().toLowerCase();
    if (!term) return sortedRecords;
    return sortedRecords.filter((r) => {
      const m = recordMemberById.get(r.member_id);
      const pool: string[] = [];
      if (m) {
        pool.push(
          (
            m.full_name || `${m.first_name || ''} ${m.last_name || ''}`
          ).toLowerCase()
        );
        if (m.membership_id) pool.push(m.membership_id.toLowerCase());
        if (m.email) pool.push(m.email.toLowerCase());
        if (m.phone) pool.push(m.phone.toLowerCase());
      }
      pool.push(r.member_id.toLowerCase());
      if (r.marked_by_mode) pool.push(r.marked_by_mode.toLowerCase());
      if (r.marked_at)
        pool.push(new Date(r.marked_at).toLocaleString().toLowerCase());
      return pool.some((val) => val.includes(term));
    });
  }, [sortedRecords, recordSearch, recordMemberById]);

  const reasonLabels: Record<string, string> = {
    session_closed: 'Session closed',
    outside_time_window: 'Outside scheduled time window',
    public_marking_disabled: 'Public marking disabled',
    mode_disabled: 'Manual marking disabled',
    member_not_allowed: 'Member not allowed for this session',
    member_allowlist_unknown: 'Allowlist not loaded',
    outside_allowed_radius: 'Outside allowed proximity radius',
    missing_session: 'No session provided',
  };

  const recordTotal = filteredRecords.length;
  const recordFrom = (recordPage - 1) * recordPageSize;
  const recordTo = Math.min(recordFrom + recordPageSize, recordTotal);
  const pagedRecords = filteredRecords.slice(recordFrom, recordTo);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">
          {tab === 'records' ? 'Attendance Records' : 'Mark Attendance'}
        </CardTitle>
        <div className="flex items-center gap-3">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as 'mark' | 'records')}
          >
            <TabsList>
              <TabsTrigger value="mark">Mark</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === 'mark' && !manualEnabled && (
            <Badge variant="outline" className="text-xs">
              Manual marking disabled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'mark' | 'records')}
        >
          <TabsContent value="mark">
            {/* Status alert when marking is not available */}
            {!sessionValidationResult?.ok ? (
              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Attendance Marking Unavailable</AlertTitle>
                <AlertDescription>
                  Attendance marking is currently disabled for this session.
                </AlertDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sessionValidationResult?.reasons.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">
                      {reasonLabels[r] ?? r}
                    </Badge>
                  ))}
                </div>
              </Alert>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder={`Search members by ${placeholderParts.join(
                        ', '
                      )}`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 items-center text-xs">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={searchFields.includes('name')}
                        onChange={(e) =>
                          setSearchFields((prev) =>
                            e.target.checked
                              ? [...prev, 'name']
                              : prev.filter((f) => f !== 'name')
                          )
                        }
                      />{' '}
                      Name
                    </label>
                    {modes.email && (
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={searchFields.includes('email')}
                          onChange={(e) =>
                            setSearchFields((prev) =>
                              e.target.checked
                                ? [...prev, 'email']
                                : prev.filter((f) => f !== 'email')
                            )
                          }
                        />{' '}
                        Email
                      </label>
                    )}
                    {modes.phone && (
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={searchFields.includes('phone')}
                          onChange={(e) =>
                            setSearchFields((prev) =>
                              e.target.checked
                                ? [...prev, 'phone']
                                : prev.filter((f) => f !== 'phone')
                            )
                          }
                        />{' '}
                        Phone
                      </label>
                    )}
                    {modes.membership_id && (
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={searchFields.includes('membershipId')}
                          onChange={(e) =>
                            setSearchFields((prev) =>
                              e.target.checked
                                ? [...prev, 'membershipId']
                                : prev.filter((f) => f !== 'membershipId')
                            )
                          }
                        />{' '}
                        Membership ID
                      </label>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                  {((hasAllowedList && !loadingAllowed) || !loadingAll) &&
                    filteredMembers.map((member) => {
                      const present = !!presentMap.get(member.id);
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
                                {`${member.first_name.charAt(
                                  0
                                )}${member.last_name.charAt(0)}`.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {member.full_name ||
                                  `${member.first_name} ${member.last_name}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {[
                                  member.membership_id,
                                  member.email,
                                  member.phone,
                                ]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={'outline'}
                              disabled={
                                !manualEnabled || markPending || present
                              }
                              onClick={() => onPresent(member.id)}
                              className={cn(
                                'bg-green-50/30 dark:bg-green-900/5 hover:bg-green-100/50 dark:hover:bg-green-900/15 hover:text-green-950 dark:hover:text-green-200',
                                present
                                  ? 'text-green-600 dark:text-green-400'
                                  : ''
                              )}
                            >
                              <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                              {present ? 'Marked' : 'Present'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!manualEnabled || unmarkPending}
                              onClick={() => onAbsent(member.id)}
                              className={cn(
                                'bg-red-50/30 dark:bg-red-900/5 hover:bg-red-100/50 dark:hover:bg-red-900/15 hover:text-red-950 dark:hover:text-red-200'
                              )}
                            >
                              <XCircle className="w-4 h-4 mr-1 text-red-600" />
                              Absent
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                  {filteredMembers.length === 0 && (
                    <div className="text-sm text-muted-foreground py-6 text-center">
                      No members found{search ? ' for your search' : ''}.
                    </div>
                  )}
                </div>

                {/* Pagination for fallback list only */}
                {!hasAllowedList && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={page}
                      totalPages={Math.max(
                        1,
                        Math.ceil(paginatedTotal / pageSize)
                      )}
                      pageSize={pageSize}
                      totalItems={paginatedTotal}
                      itemName="members"
                      onPageChange={onPageChange}
                      onPageSizeChange={(newSize) => {
                        onPageSizeChange(newSize);
                        onPageChange(1);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="records">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search attendance records by name, membership ID, email, or phone"
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Marked At</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRecords.map((r) => {
                    const m = recordMemberById.get(r.member_id);
                    const name = m
                      ? m.full_name || `${m.first_name} ${m.last_name}`
                      : `Member ${r.member_id}`;
                    const membership = m?.membership_id || '—';
                    const contact =
                      [m?.email, m?.phone].filter(Boolean).join(' • ') || '—';
                    const markedAt = r.marked_at
                      ? new Date(r.marked_at).toLocaleString()
                      : '—';
                    const mode = r.marked_by_mode || '—';
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={m?.profile_image_url || undefined}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                {name
                                  .split(' ')
                                  .map((s) => s.charAt(0))
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{name}</div>
                              <div className="text-xs text-muted-foreground">
                                {m?.branch_name || ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{membership}</TableCell>
                        <TableCell className="text-sm">{contact}</TableCell>
                        <TableCell className="text-sm">{markedAt}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {mode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.is_valid ? (
                            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                              Valid
                            </Badge>
                          ) : (
                            <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {pagedRecords.length === 0 && (
              <div className="text-sm py-4 text-muted-foreground min-h-[120px] flex items-center justify-center">
                No attendance records found.
              </div>
            )}

            <div className="mt-4">
              <Pagination
                currentPage={recordPage}
                totalPages={Math.max(
                  1,
                  Math.ceil(recordTotal / recordPageSize)
                )}
                pageSize={recordPageSize}
                totalItems={recordTotal}
                itemName="records"
                onPageChange={setRecordPage}
                onPageSizeChange={(newSize) => {
                  setRecordPageSize(newSize);
                  setRecordPage(1);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

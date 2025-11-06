import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceWidgetExportButtons } from '@/components/attendance/AttendanceWidgetExportButtons';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import type { MemberSummary } from '@/types/members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/utils/supabase';
import { format } from 'date-fns';

interface MembersAttendanceReportProps {
  report?: AttendanceReportData | null;
  memberIds: string[];
  filtersSummary?: {
    mode: 'occasions_sessions' | 'tags_groups' | 'members';
    date_from?: string;
    date_to?: string;
    occasion_ids?: string[];
    session_ids?: string[];
    tag_item_ids?: string[];
    group_ids?: string[];
    member_ids?: string[];
  };
}

type EligibilityMap = Record<string, Set<string>>; // session_id -> eligible member IDs (from selected cohort)

export function MembersAttendanceReport({
  report,
  memberIds,
  filtersSummary,
}: MembersAttendanceReportProps) {
  const [eligibility, setEligibility] = useState<EligibilityMap>({});
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [selectedMembersById, setSelectedMembersById] = useState<
    Map<string, MemberSummary>
  >(new Map());

  const selectedSet = useMemo(() => new Set<string>(memberIds || []), [
    memberIds,
  ]);

  const sessions = useMemo(
    () =>
      (report?.sessions || [])
        .slice()
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [report]
  );

  const recordsMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; session_id: string; member_id: string; marked_at: string }
    >();
    for (const r of report?.records || []) {
      // key: memberId|sessionId
      map.set(`${r.member_id}|${r.session_id}`, r);
    }
    return map;
  }, [report]);

  const membersById = useMemo(() => {
    const m = new Map<string, MemberSummary>();
    for (const ms of report?.members || []) {
      m.set(ms.id, ms);
    }
    // Merge in any selected members fetched explicitly (ensures cards render even without records)
    for (const [id, ms] of selectedMembersById.entries()) {
      if (!m.has(id)) m.set(id, ms);
    }
    return m;
  }, [report, selectedMembersById]);

  // Fetch details for selected members not present in report.members (e.g., zero attendance records)
  useEffect(() => {
    let cancelled = false;
    async function fetchSelectedMembers() {
      const missingIds: string[] = [];
      for (const id of memberIds) {
        if (!report?.members?.some((m) => m.id === id)) missingIds.push(id);
      }
      if (missingIds.length === 0) {
        setSelectedMembersById((prev) => prev);
        return;
      }
      const { data, error } = await supabase
        .from('members_summary')
        .select('*')
        .in('id', missingIds);
      if (error) {
        return; // fail soft
      }
      const map = new Map<string, MemberSummary>();
      for (const row of (data || []) as MemberSummary[]) {
        map.set(row.id, row);
      }
      if (!cancelled) setSelectedMembersById(map);
    }
    fetchSelectedMembers();
    return () => {
      cancelled = true;
    };
  }, [memberIds, report]);

  // Build eligibility map intersecting session restrictions with selected members
  useEffect(() => {
    let cancelled = false;
    async function computeEligibility() {
      if (!report || sessions.length === 0 || selectedSet.size === 0) {
        setEligibility({});
        return;
      }
      setEligibilityLoading(true);

      // Collect union of allowed groups and tags across sessions
      const unionGroupIds = new Set<string>();
      const unionTagItemIds = new Set<string>();
      for (const s of sessions as any[]) {
        (s.allowed_groups || []).forEach(
          (g: string) => g && unionGroupIds.add(g)
        );
        (s.allowed_tags || []).forEach(
          (t: string) => t && unionTagItemIds.add(t)
        );
      }

      // Fetch members for all allowed groups (batched)
      const groupMembersMap: Record<string, Set<string>> = {};
      if (unionGroupIds.size > 0) {
        const { data: gmData, error: gmErr } = await supabase
          .from('group_members_view')
          .select('group_id, member_id')
          .in('group_id', Array.from(unionGroupIds));
        if (gmErr) {
          // Fail soft, treat as empty
        } else {
          for (const row of gmData || []) {
            const gid = String((row as any).group_id);
            const mid = String((row as any).member_id);
            if (!groupMembersMap[gid]) groupMembersMap[gid] = new Set<string>();
            groupMembersMap[gid].add(mid);
          }
        }
      }

      // Fetch members for all allowed tag items (batched)
      const tagMembersMap: Record<string, Set<string>> = {};
      if (unionTagItemIds.size > 0) {
        const { data: tagData, error: tagErr } = await supabase
          .from('members')
          .select('id, member_tag_items!inner(tag_item_id)');
        if (!tagErr) {
          // Build reverse index: tag_item_id -> Set(member_id)
          for (const row of tagData || []) {
            const mid = String((row as any).id);
            const items: Array<{ tag_item_id: string }> = ((row as any)
              ?.member_tag_items || []) as Array<{ tag_item_id: string }>;
            for (const it of items) {
              const tid = String(it.tag_item_id);
              if (unionTagItemIds.has(tid)) {
                if (!tagMembersMap[tid]) tagMembersMap[tid] = new Set<string>();
                tagMembersMap[tid].add(mid);
              }
            }
          }
        }
      }

      const result: EligibilityMap = {};
      for (const s of sessions as any[]) {
        const allowedMembers: string[] = Array.isArray(s.allowed_members)
          ? s.allowed_members
          : [];
        const allowedGroups: string[] = Array.isArray(s.allowed_groups)
          ? s.allowed_groups
          : [];
        const allowedTags: string[] = Array.isArray(s.allowed_tags)
          ? s.allowed_tags
          : [];

        const hasRestrictions =
          allowedMembers.length + allowedGroups.length + allowedTags.length > 0;
        const set = new Set<string>();

        if (hasRestrictions) {
          // Allowed members
          for (const id of allowedMembers) {
            if (id && selectedSet.has(String(id))) set.add(String(id));
          }
          // Allowed groups
          for (const gid of allowedGroups) {
            const members = groupMembersMap[gid];
            if (members) {
              for (const mid of members) {
                if (selectedSet.has(mid)) set.add(mid);
              }
            }
          }
          // Allowed tags
          for (const tid of allowedTags) {
            const members = tagMembersMap[tid];
            if (members) {
              for (const mid of members) {
                if (selectedSet.has(mid)) set.add(mid);
              }
            }
          }
        } else {
          // Unrestricted: all selected members are eligible
          for (const mid of selectedSet) set.add(mid);
        }

        result[String((s as any).id)] = set;
      }

      if (!cancelled) {
        setEligibility(result);
        setEligibilityLoading(false);
      }
    }
    computeEligibility();
    return () => {
      cancelled = true;
    };
  }, [report, sessions, selectedSet]);

  const exportRows = useMemo(() => {
    const rows: Array<Record<string, string>> = [];
    for (const mid of memberIds) {
      const member = membersById.get(mid);
      if (!member) continue;
      for (const s of sessions) {
        const eligibleSet = eligibility[s.id] || new Set<string>();
        if (!eligibleSet.has(mid)) continue; // not expected
        const rec = recordsMap.get(`${mid}|${s.id}`);
        const status = rec ? 'Present' : 'Absent';
        rows.push({
          MemberId: mid,
          MemberName: member.full_name,
          MembershipID: member.membership_id,
          Session: (s as any).name || s.id,
          SessionStart: s.start_time,
          SessionEnd: s.end_time,
          Status: status,
          RecordedAt: rec ? rec.marked_at : '',
        });
      }
    }
    return rows;
  }, [memberIds, membersById, sessions, eligibility, recordsMap]);

  const isEmpty = exportRows.length === 0;

  const eligibleExpectedTotal = useMemo(() => {
    return sessions.reduce((sum, s) => sum + (eligibility[s.id]?.size || 0), 0);
  }, [sessions, eligibility]);

  const summary = useMemo<Array<[string, unknown]>>(() => {
    if (!report) return [];
    const s = report.summary;
    return [
      ['Selected Members', memberIds.length],
      ['Sessions', s.sessions_count],
      ['Expected Eligible Across Sessions', eligibleExpectedTotal],
      ['Total Attendance Records', s.total_attendance],
      ['Unique Members Recorded', s.unique_members],
      ['Occasions', s.occasions_count],
      ['Days Span', s.days_span],
      ['Average per Day', s.average_per_day],
    ];
  }, [report, memberIds.length, eligibleExpectedTotal]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Members Attendance</CardTitle>
        <AttendanceWidgetExportButtons
          report={report}
          filtersSummary={filtersSummary}
          defaultSections={['members']}
          disabled={!report || isEmpty || eligibilityLoading}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {summary.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border p-3 bg-neutral-50 dark:bg-neutral-900/40">
              {summary.map(([label, value], idx) => (
                <div key={idx} className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {String(label)}:
                  </span>
                  <span className="font-medium truncate">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
          {/* Attendance tables grouped by member with card on top */}
          <ScrollArea className={cn(exportRows.length > 12 ? 'h-[560px]' : '')}>
            {eligibilityLoading && (
              <div className="text-sm text-muted-foreground p-2">
                Loading eligibility…
              </div>
            )}
            {!eligibilityLoading && (
              <div className="space-y-8">
                {memberIds.map((mid) => {
                  const m = membersById.get(mid);
                  // Render block regardless; if details missing, show minimal header

                  // Build rows for this member
                  const memberRows = sessions
                    .filter((s) =>
                      (eligibility[s.id] || new Set<string>()).has(mid)
                    )
                    .map((s) => {
                      const rec = recordsMap.get(`${mid}|${s.id}`);
                      return {
                        session: (s as any).name || s.id,
                        start: s.start_time,
                        end: s.end_time,
                        status: rec ? 'Present' : 'Absent',
                        recordedAt: rec ? rec.marked_at : null,
                      };
                    });

                  return (
                    <div key={mid} className="space-y-2">
                      {/* Member detail card on top of table */}
                      <div className="flex items-center gap-3 rounded-md border p-3">
                        <Avatar>
                          <AvatarImage
                            src={m?.profile_image_url || undefined}
                            alt={m?.full_name || 'Member'}
                          />
                          <AvatarFallback>
                            {(m?.full_name || 'M')
                              .split(' ')
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {m?.full_name || mid}
                          </div>
                          {m?.membership_id && (
                            <div className="text-xs text-muted-foreground truncate">
                              ID: {m.membership_id}
                            </div>
                          )}
                          {m?.membership_status && (
                            <div className="text-xs text-muted-foreground truncate">
                              Status: {m.membership_status}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left">
                              <th className="py-2 pr-4">Session</th>
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">Time</th>
                              <th className="py-2 pr-4">Status</th>
                              <th className="py-2">Recorded at</th>
                            </tr>
                          </thead>
                          <tbody>
                            {memberRows.length === 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="py-3 text-muted-foreground"
                                >
                                  No expected sessions in range
                                </td>
                              </tr>
                            )}
                            {memberRows.map((row, idx) => (
                              <tr key={`${mid}-${idx}`} className="border-t">
                                <td className="py-2 pr-4">{row.session}</td>
                                <td className="py-2 pr-4">
                                  {format(new Date(row.start), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-2 pr-4">
                                  {format(new Date(row.start), 'hh:mm a')} -{' '}
                                  {format(new Date(row.end), 'hh:mm a')}
                                </td>
                                <td className="py-2 pr-4">
                                  {row.status === 'Present' ? (
                                    <Badge className="bg-green-600 text-white hover:bg-green-600/90 dark:bg-green-700">
                                      Present
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="border-red-600 text-red-700 dark:text-red-400 dark:border-red-700"
                                    >
                                      Absent
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-2">
                                  {row.recordedAt
                                    ? format(
                                        new Date(row.recordedAt),
                                        'MMM dd, yyyy hh:mm a'
                                      )
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

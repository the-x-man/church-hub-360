import { AttendanceWidgetExportButtons } from '@/components/attendance/AttendanceWidgetExportButtons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import { useAllGroups } from '@/hooks/useGroups';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { cn } from '@/lib/utils';
import { formatDate } from 'date-fns';
import { useMemo } from 'react';

interface TableReportProps {
  report?: AttendanceReportData | null;
  showTagsColumn?: boolean;
  showGroupsColumn?: boolean;
  selectedTagItemIds?: string[];
  selectedGroupIds?: string[];
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

export function TableReport({
  report,
  showTagsColumn = false,
  showGroupsColumn = false,
  selectedTagItemIds = [],
  selectedGroupIds = [],
  filtersSummary,
}: TableReportProps) {
  const { currentOrganization } = useOrganization();
  const { data: relationalTags = [] } = useTagsQuery(currentOrganization?.id);
  const { data: allGroups = [] } = useAllGroups();

  const rows = useMemo(() => {
    if (!report) return [];
    const sessionNameById = new Map(
      report.sessions.map((s) => [s.id, (s as any).name || 'Session'])
    );

    // Build selected names sets for intersection
    const selectedTagNames = new Set<string>();
    for (const t of relationalTags) {
      for (const item of t.tag_items || []) {
        if (selectedTagItemIds.includes(item.id)) {
          selectedTagNames.add(String(item.name));
        }
      }
    }
    const selectedGroupNames = new Set<string>();
    for (const g of allGroups) {
      if (selectedGroupIds.includes(g.id)) {
        selectedGroupNames.add(String(g.name));
      }
    }

    const memberInfoById = new Map(
      report.members.map((m) => [
        m.id,
        {
          name: (
            m.full_name ||
            `${m.first_name} ${m.last_name}` ||
            'Member'
          ).trim(),
          avatar: m.profile_image_url || null,
          tags: (Array.isArray(m.tags_array) ? m.tags_array : []).filter(
            (t) =>
              selectedTagNames.size === 0 || selectedTagNames.has(String(t))
          ),
          groups: (Array.isArray(m.member_groups)
            ? m.member_groups.map((g) => String(g).split(' - ')[0] || String(g))
            : []
          ).filter(
            (name) =>
              selectedGroupNames.size === 0 ||
              selectedGroupNames.has(String(name))
          ),
        },
      ])
    );
    return report.records.map((r) => ({
      Date: new Date(r.marked_at).toLocaleString(),
      Session: sessionNameById.get(r.session_id) || r.session_id,
      MemberId: r.member_id,
      MemberName: memberInfoById.get(r.member_id)?.name || r.member_id,
      AvatarUrl: memberInfoById.get(r.member_id)?.avatar || null,
      Tags: (memberInfoById.get(r.member_id)?.tags || []).join(', '),
      Groups: (memberInfoById.get(r.member_id)?.groups || []).join(', '),
    }));
  }, [report, relationalTags, allGroups, selectedTagItemIds, selectedGroupIds]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attendance Records</CardTitle>
        <AttendanceWidgetExportButtons
          report={report}
          filtersSummary={filtersSummary}
          defaultSections={['records']}
          defaultRecordFields={['session_name', 'marked_at', 'member_name']}
          disabled={!report || rows.length === 0}
        />
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(rows.length > 10 ? 'h-[500px]' : '')}>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Session</th>
                    <th className="py-2 pr-4">Recorded at</th>
                    <th className="py-2">Member</th>
                    {showTagsColumn && <th className="py-2 pl-4">Tags</th>}
                    {showGroupsColumn && <th className="py-2 pl-4">Groups</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          3 +
                          (showTagsColumn ? 1 : 0) +
                          (showGroupsColumn ? 1 : 0)
                        }
                        className="py-3 text-muted-foreground"
                      >
                        No records
                      </td>
                    </tr>
                  )}
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4">{row.Session as string}</td>

                      <td className="py-2 pr-4">
                        {formatDate(
                          new Date(row.Date as string),
                          'MMM dd, yyyy hh:mm a'
                        )}
                      </td>

                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage
                              src={(row.AvatarUrl as string) || undefined}
                              alt={(row.MemberName as string) || 'Member'}
                            />
                            <AvatarFallback>
                              {String(row.MemberName || row.MemberId || 'M')
                                .split(' ')
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {(row.MemberName as string) ||
                              (row.MemberId as string)}
                          </span>
                        </div>
                      </td>
                      {showTagsColumn && (
                        <td className="py-2 pl-4 text-sm overflow-x-clip">
                          {String(row.Tags || '').length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {String(row.Tags)
                                .split(', ')
                                .filter((t) => t && t.trim().length > 0)
                                .slice(0, 2)
                                .map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs px-1 py-0 text-wrap"
                                    title={tag}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              {String(row.Tags)
                                .split(', ')
                                .filter((t) => t && t.trim().length > 0)
                                .length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  +
                                  {String(row.Tags)
                                    .split(', ')
                                    .filter((t) => t && t.trim().length > 0)
                                    .length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )}
                      {showGroupsColumn && (
                        <td className="py-2 pl-4 text-sm overflow-x-clip">
                          {String(row.Groups || '').length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {String(row.Groups)
                                .split(', ')
                                .filter((g) => g && g.trim().length > 0)
                                .slice(0, 2)
                                .map((group, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs px-1 py-0 text-wrap"
                                    title={group}
                                  >
                                    {group}
                                  </Badge>
                                ))}
                              {String(row.Groups)
                                .split(', ')
                                .filter((g) => g && g.trim().length > 0)
                                .length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  +
                                  {String(row.Groups)
                                    .split(', ')
                                    .filter((g) => g && g.trim().length > 0)
                                    .length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceWidgetExportButtons } from '@/components/attendance/AttendanceWidgetExportButtons';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { useAllGroups } from '@/hooks/useGroups';

interface TagsGroupsReportProps {
  report?: AttendanceReportData | null;
  showTags?: boolean;
  showGroups?: boolean;
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

export function TagsGroupsReport({
  report,
  showTags = true,
  showGroups = true,
  selectedTagItemIds = [],
  selectedGroupIds = [],
  filtersSummary,
}: TagsGroupsReportProps) {
  const { currentOrganization } = useOrganization();
  const { data: relationalTags = [] } = useTagsQuery(currentOrganization?.id);
  const { data: allGroups = [] } = useAllGroups();

  const { tagCounts, groupCounts } = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};

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

    if (report && Array.isArray(report.members)) {
      for (const m of report.members) {
        const tags = Array.isArray(m.tags_array) ? m.tags_array : [];
        // Count only selected tags
        tags
          .filter((t) => selectedTagNames.has(String(t)))
          .forEach((t) => {
            const key = String(t);
            tagCounts[key] = (tagCounts[key] || 0) + 1;
          });

        const groups = Array.isArray(m.member_groups) ? m.member_groups : [];
        // Count only selected groups
        groups
          .map((g) => String(g).split(' - ')[0] || String(g))
          .filter((name) => selectedGroupNames.has(name))
          .forEach((name) => {
            groupCounts[name] = (groupCounts[name] || 0) + 1;
          });
      }
    }

    return { tagCounts, groupCounts };
  }, [report, showTags, showGroups]);
  // Note: we intentionally do not include relationalTags/allGroups in deps to avoid flicker; selected IDs changes trigger re-render in parent

  const selectedTagLabels = useMemo(() => {
    const labels: string[] = [];
    for (const t of relationalTags) {
      for (const item of t.tag_items || []) {
        if (selectedTagItemIds.includes(item.id))
          labels.push(String(item.name));
      }
    }
    return labels;
  }, [relationalTags, selectedTagItemIds]);

  const selectedGroupNamesList = useMemo(() => {
    const names: string[] = [];
    for (const g of allGroups) {
      if (selectedGroupIds.includes(g.id)) names.push(String(g.name));
    }
    return names;
  }, [allGroups, selectedGroupIds]);

  const summary = useMemo<Array<[string, unknown]>>(() => {
    if (!report) return [];
    const s = report.summary;
    const pairs: Array<[string, unknown]> = [
      [
        'Selected Tags',
        selectedTagLabels.length > 0 ? selectedTagLabels.join(', ') : 'None',
      ],
      [
        'Selected Groups',
        selectedGroupNamesList.length > 0
          ? selectedGroupNamesList.join(', ')
          : 'None',
      ],
      ['Total Attendance', s.total_attendance],
      ['Unique Members', s.unique_members],
      ['Sessions', s.sessions_count],
      ['Occasions', s.occasions_count],
    ];
    return pairs;
  }, [report, selectedTagLabels, selectedGroupNamesList]);

  const sortedTagEntries = useMemo(() => {
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  }, [tagCounts]);

  const sortedGroupEntries = useMemo(() => {
    return Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);
  }, [groupCounts]);

  const isEmpty =
    (!showTags || sortedTagEntries.length === 0) &&
    (!showGroups || sortedGroupEntries.length === 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tags & Groups Breakdown</CardTitle>
        <AttendanceWidgetExportButtons
          report={report}
          filtersSummary={filtersSummary}
          defaultSections={['tags_groups']}
          disabled={!report || isEmpty}
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
          {isEmpty && (
            <div className="text-muted-foreground text-sm">No data</div>
          )}
          {showTags && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Tag</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTagEntries.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-3 text-muted-foreground">
                        No tags
                      </td>
                    </tr>
                  )}
                  {sortedTagEntries.map(([label, count]) => (
                    <tr key={label} className="border-t">
                      <td className="py-2 pr-4">{label}</td>
                      <td className="py-2">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {showGroups && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Group</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroupEntries.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-3 text-muted-foreground">
                        No groups
                      </td>
                    </tr>
                  )}
                  {sortedGroupEntries.map(([label, count]) => (
                    <tr key={label} className="border-t">
                      <td className="py-2 pr-4">{label}</td>
                      <td className="py-2">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

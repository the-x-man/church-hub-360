import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceWidgetExportButtons } from '@/components/attendance/AttendanceWidgetExportButtons';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAgeGroupManagement } from '@/hooks/usePeopleConfigurationQueries';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';

interface AgeGroupReportProps {
  report?: AttendanceReportData | null;
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

export function AgeGroupReport({
  report,
  filtersSummary,
}: AgeGroupReportProps) {
  const { currentOrganization } = useOrganization();
  const { ageGroups = [] } = useAgeGroupManagement(currentOrganization?.id);

  const rows = useMemo(() => {
    if (!report) return [] as Array<{ Group: string; Count: number }>;
    if (ageGroups.length > 0) {
      const counts = ageGroups.map((g) => ({ Group: g.name, Count: 0 }));
      for (const m of report.members) {
        const age = m.age ?? null;
        if (age === null) continue;
        // find first group where age in [min,max]
        for (const g of ageGroups) {
          if (age >= g.min_age && age <= g.max_age) {
            const idx = counts.findIndex((c) => c.Group === g.name);
            if (idx >= 0) counts[idx].Count++;
            break;
          }
        }
      }
      return counts;
    }
    // Fallback to built demographic breakdown
    const entries = Object.entries(report.demographic.byAgeGroup);
    return entries.map(([k, v]) => ({ Group: k, Count: v }));
  }, [report, ageGroups]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Age Group Breakdown</CardTitle>
        <AttendanceWidgetExportButtons
          report={report}
          filtersSummary={filtersSummary}
          defaultSections={['age_groups']}
          disabled={!report || rows.length === 0}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4">Age Group</th>
                  <th className="py-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-3 text-muted-foreground">
                      No data
                    </td>
                  </tr>
                )}
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-4">{row.Group}</td>
                    <td className="py-2">{row.Count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

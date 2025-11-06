import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceWidgetExportButtons } from '@/components/attendance/AttendanceWidgetExportButtons';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';

interface GenderReportProps {
  report?: AttendanceReportData | null;
  disabled?: boolean;
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

export function GenderReport({ report, disabled, filtersSummary }: GenderReportProps) {
  const rows = useMemo(() => {
    if (!report) return [] as Array<{ Gender: string; Count: number }>;
    const entries = Object.entries(report.demographic.byGender);
    return entries.map(([k, v]) => ({ Gender: k, Count: v }));
  }, [report]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gender Breakdown</CardTitle>
        <AttendanceWidgetExportButtons
          report={report}
          filtersSummary={filtersSummary}
          defaultSections={["gender"]}
          disabled={disabled || !report || rows.length === 0}
        />
      </CardHeader>
      <CardContent>
        <div>
          {disabled ? (
            <div className="text-muted-foreground text-sm">Select 2 or more members to view gender distribution.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Gender</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-3 text-muted-foreground">No data</td>
                    </tr>
                  )}
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4">{row.Gender}</td>
                      <td className="py-2">{row.Count}</td>
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